"""RAG Pipeline — pgvector 向量检索 + 混合查询"""

import json
from typing import List

from .db import get_pool
from .embedding import get_embedding


async def retrieve_context(
    user_prompt: str,
    top_k: int = 5,
    category: str | None = None,
) -> List[dict]:
    """检索与用户需求最相关的 amis 模板/文档

    Args:
        user_prompt: 用户的自然语言需求
        top_k: 返回最相关的 K 条结果
        category: 可选的分类过滤

    Returns:
        包含 title, content, category, similarity 的字典列表
    """
    pool = await get_pool()

    # 1. 向量化用户输入
    embedding = await get_embedding(user_prompt)
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

    # 2. pgvector 向量检索（余弦相似度 + 可选分类过滤）
    if category:
        query = """
            SELECT id, title, description, amis_json, category, quality_score,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM amis_templates
            WHERE embedding IS NOT NULL
              AND category = $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
        """
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, embedding_str, category, top_k)
    else:
        query = """
            SELECT id, title, description, amis_json, category, quality_score,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM amis_templates
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2
        """
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, embedding_str, top_k)

    # 3. 组装结果，按 similarity * quality_score 加权排序
    contexts = []
    for row in rows:
        quality = row["quality_score"] or 0.0
        similarity = row["similarity"] or 0.0
        contexts.append({
            "id": row["id"],
            "title": row["title"],
            "content": row["amis_json"],
            "description": row["description"],
            "category": row["category"],
            "similarity": similarity,
            "score": similarity * (1 + quality * 0.1),
        })

    contexts.sort(key=lambda x: x["score"], reverse=True)
    return contexts[:top_k]


async def index_template(
    template_id: int,
    title: str,
    description: str,
    amis_json: str,
) -> bool:
    """将采纳的模板向量化并写入 embedding 字段

    Args:
        template_id: amis_templates 表的 ID
        title: 模板标题
        description: 模板描述（用户原始需求）
        amis_json: amis JSON 配置

    Returns:
        是否成功
    """
    pool = await get_pool()

    # 构建向量化文本：标题 + 描述（用户需求更重要）
    text_to_embed = f"{title}\n{description}" if description else title

    try:
        embedding = await get_embedding(text_to_embed)
        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE amis_templates
                SET embedding = $1::vector
                WHERE id = $2
                """,
                embedding_str,
                template_id,
            )
        return True
    except Exception as e:
        print(f"[RAG] 向量化入库失败 template_id={template_id}: {e}")
        return False


# ────────────────────────── B.2: 反向飞轮 RAG 样例库 ──────────────────────────

async def index_code_sample(
    sample_id: int,
    summary_text: str,
) -> bool:
    """把 code_samples 表里某条记录的 summary 向量化并写回 embedding 列。

    Args:
        sample_id: code_samples.id（backend 已经 INSERT 完成行，传 ID 过来）
        summary_text: 用于向量化的文本（通常是 amis_json_summary + code_summary 拼接）

    返回:
        True 成功 / False 失败（异常会吞掉打印日志）
    """
    pool = await get_pool()
    try:
        embedding = await get_embedding(summary_text)
        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE code_samples
                SET embedding = $1::vector,
                    updated_at = NOW()
                WHERE id = $2
                """,
                embedding_str,
                sample_id,
            )
        return True
    except Exception as e:
        print(f"[RAG] code_sample 向量化失败 sample_id={sample_id}: {e}")
        return False


async def search_code_samples(
    tech_stack: str,
    query_text: str,
    top_k: int = 3,
    only_approved: bool = True,
) -> List[dict]:
    """检索同 tech_stack 下、最相似的 code_sample 记录。

    检索语义：余弦距离最近的 Top-K。
    **跨 source_team 混合**（D4 决策）：amis-ai 自身样例 + ZC Amis 等外部团队样例都参与召回。

    Args:
        tech_stack: 必填，按此精确过滤（不同栈的样例混进来会污染 prompt）
        query_text: 用于向量化的查询文本（通常是 Amis JSON 摘要）
        top_k: 返回前 K 条（默认 3，与 system_prompt 注入预算对齐）
        only_approved: 只检索 approved 的样例（默认 True，pending/rejected 不参与生产飞轮）

    返回:
        [{id, tech_stack, source_team, amis_json_summary, code_summary,
          full_amis_json, full_code, hit_count, similarity}, ...]，按 similarity 降序
    """
    pool = await get_pool()
    embedding = await get_embedding(query_text)
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

    where_status = "AND status = 'approved'" if only_approved else ""
    query = f"""
        SELECT id, tech_stack, source_team,
               amis_json_summary, code_summary,
               full_amis_json, full_code, hit_count,
               1 - (embedding <=> $1::vector) AS similarity
        FROM code_samples
        WHERE embedding IS NOT NULL
          AND tech_stack = $2
          {where_status}
        ORDER BY embedding <=> $1::vector
        LIMIT $3
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, embedding_str, tech_stack, top_k)

    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "tech_stack": row["tech_stack"],
            "source_team": row["source_team"],
            "amis_json_summary": row["amis_json_summary"],
            "code_summary": row["code_summary"],
            "full_amis_json": row["full_amis_json"],
            "full_code": row["full_code"],
            "hit_count": row["hit_count"],
            "similarity": row["similarity"] or 0.0,
        })
    return results


async def increment_code_sample_hits(sample_ids: List[int]) -> None:
    """对一批 code_sample.id 累加 hit_count（B.5 检索后调用，用于飞轮统计）。

    没有事务/锁——hit_count 只是观测指标，并发下少加几次也无妨。
    """
    if not sample_ids:
        return
    pool = await get_pool()
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE code_samples SET hit_count = hit_count + 1 WHERE id = ANY($1::int[])",
                sample_ids,
            )
    except Exception as e:
        print(f"[RAG] hit_count 累加失败 ids={sample_ids}: {e}")
