"""RAG Pipeline — pgvector 向量检索 + 混合查询

1.4 B.1：在原有"向量检索 + 多维标签硬过滤"之上叠加**关键字精确召回**，
两路结果用 RRF（Reciprocal Rank Fusion）融合排序。
关键字来自 code_samples.keyword_index 列（GIN 索引），入库时由
keyword_extractor.extract_amis_keywords 从 full_amis_json 提取。
"""

import hashlib
import json
import time
from typing import Dict, List, Optional, Tuple

from .db import get_pool
from .embedding import get_embedding
from .keyword_extractor import extract_amis_keywords


# ────────────────────────── 2026-04 性能缓存 ──────────────────────────
# backend create_task 在空库时已有 Rust 侧短路；这里是二道保险（多 worker / admin 直接
# 调 Python API 时也能省 embedding），TTL 短到足够动态新增样例很快生效
_APPROVED_COUNT_TS: float = 0.0
_APPROVED_COUNT_VAL: Optional[int] = None
_APPROVED_COUNT_TTL: float = 30.0  # 秒

# query_text → 向量的短期缓存（相同 amis_json 前 2KB 被反复检索时省 Ollama 调用）
_EMBED_CACHE: Dict[str, Tuple[float, List[float]]] = {}
_EMBED_TTL: float = 120.0  # 秒
_EMBED_CACHE_MAX: int = 256  # 粗暴上限，防止无限增长


async def _approved_count_cached(pool) -> int:
    """带 TTL 的 approved code_samples 计数；空库场景跳过 embedding 调用的依据"""
    global _APPROVED_COUNT_TS, _APPROVED_COUNT_VAL
    now = time.time()
    if _APPROVED_COUNT_VAL is not None and now - _APPROVED_COUNT_TS < _APPROVED_COUNT_TTL:
        return _APPROVED_COUNT_VAL
    try:
        async with pool.acquire() as conn:
            v = await conn.fetchval(
                "SELECT COUNT(1) FROM code_samples WHERE status='approved'"
            )
    except Exception as e:
        # 出错当作"非空"保守处理，放行到下游真正 embedding 调用
        print(f"[RAG] approved count 查询失败，跳过缓存: {e}")
        return 1
    _APPROVED_COUNT_VAL = int(v or 0)
    _APPROVED_COUNT_TS = now
    return _APPROVED_COUNT_VAL


async def _get_embedding_cached(text: str) -> List[float]:
    """对相同文本短期复用 embedding，减少 Ollama 调用"""
    key = hashlib.sha1(text.encode("utf-8", errors="ignore")).hexdigest()
    hit = _EMBED_CACHE.get(key)
    now = time.time()
    if hit and now - hit[0] < _EMBED_TTL:
        return hit[1]
    emb = await get_embedding(text)
    # 超过上限 → 丢掉最早的一批（简单粗暴，没上 LRU 包）
    if len(_EMBED_CACHE) >= _EMBED_CACHE_MAX:
        oldest = sorted(_EMBED_CACHE.items(), key=lambda kv: kv[1][0])[:_EMBED_CACHE_MAX // 4]
        for k, _ in oldest:
            _EMBED_CACHE.pop(k, None)
    _EMBED_CACHE[key] = (now, emb)
    return emb


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

    1.4 B.1：同时从该样例的 full_amis_json 提取关键字写回 keyword_index 列。
    提取失败不阻断 embedding 入库（keyword_index 保持 '{}'，召回退化为纯向量）。

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

        # B.1：从 DB 读 full_amis_json 提关键字（避免要求 backend 也传 amis_json，减少接口面）
        keywords: List[str] = []
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT full_amis_json FROM code_samples WHERE id = $1",
                    sample_id,
                )
            if row and row["full_amis_json"]:
                keywords = extract_amis_keywords(row["full_amis_json"])
        except Exception as ke:
            # 关键字提取失败不阻断 embedding 入库
            print(f"[RAG] keyword 提取失败 sample_id={sample_id}: {ke}")

        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE code_samples
                SET embedding = $1::vector,
                    keyword_index = $2::text[],
                    updated_at = NOW()
                WHERE id = $3
                """,
                embedding_str,
                keywords,
                sample_id,
            )
        return True
    except Exception as e:
        print(f"[RAG] code_sample 向量化失败 sample_id={sample_id}: {e}")
        return False


# ────────────────────────── 2026-04 质量闭环：verdict rank 映射 ──────────────────────────
# LLM-judge 二元评委输出三档，用数字表示"质量下限"：bad=0 / needs_review=1 / good=2。
# 评审建议：SQL 硬过滤（"需要至少 needs_review"），不走加权叠加，避免 ranking 变玄学调参。
_VERDICT_RANK: Dict[str, int] = {"bad": 0, "needs_review": 1, "good": 2}


async def search_code_samples(
    query_text: str,
    platforms: Optional[List[str]] = None,
    tech_stacks: Optional[List[str]] = None,
    ui_libs: Optional[List[str]] = None,
    legacy_tech_stack: Optional[str] = None,
    top_k: int = 3,
    only_approved: bool = True,
    # 2026-04 质量闭环（Phase 0 起可传；默认值保持与现有行为一致）
    exclude_tags: Optional[List[str]] = None,
    min_rating: Optional[float] = None,
    min_verdict: Optional[str] = None,
    weighting_enabled: bool = False,
    thumbs_mode: str = "tiebreaker",   # off / tiebreaker / boost
    hit_count_enabled: bool = False,
    # 1.2.0 多页过滤（硬过滤：multipage_filter / execution_strategy / reuse_strategy）
    multipage_filter: bool = False,
    execution_strategy: Optional[str] = None,    # 'isolated' / 'unified' / None
    reuse_strategy: Optional[str] = None,        # 'r1_skeleton' / 'r2_prompt' / 'r3_refactor' / 'r4_none' / None
    # 1.4 B.1 双路召回：用户当前任务的 amis_json，内部提关键字与 keyword_index 做精确匹配
    query_amis_json: Optional[str] = None,
) -> List[dict]:
    """检索相似的 code_sample（2026-04 起支持质量闭环可配置过滤 + 加权；1.4 加 keyword 双路召回）。

    设计要点：
      - **硬过滤**（WHERE 子句）：exclude_tags / min_rating / min_verdict / only_approved
        评审建议：quality 用硬过滤比加权可解释得多。
      - **软加权**（仅在 weighting_enabled=True 时生效）：
          tiebreaker 模式 → thumbs 只加 0.05，cos_sim 仍主导
          boost 模式     → thumbs 加 0.2（慎用，N=3 admin 时易偏见主导）
          hit_count     → ln(1+hit/10) * 0.1
      - 维度命中保持原 tag_boost 0.3 / 0.1 逻辑
      - **1.4 keyword_boost**：query_amis_json 非空 → 提关键字（type/subType/api）与
        code_samples.keyword_index 做交集，每命中一个关键字加 0.06，上限 0.3
        反向兼容：query_amis_json 为空 → kw_overlap 一直 0，等价于现有逻辑

    返回:
        [{id, ..., similarity, tag_boost, thumbs_boost, hit_boost, keyword_boost,
          keyword_hits, score}]
        按 score 降序
    """
    # 1.2.0 多页 strategy 白名单校验（防 SQL 注入）
    _VALID_EXEC = {"isolated", "unified"}
    _VALID_REUSE = {"r1_skeleton", "r2_prompt", "r3_refactor", "r4_none"}

    if execution_strategy and execution_strategy not in _VALID_EXEC:
        raise ValueError(f"invalid execution_strategy: {execution_strategy}")
    if reuse_strategy and reuse_strategy not in _VALID_REUSE:
        raise ValueError(f"invalid reuse_strategy: {reuse_strategy}")

    pool = await get_pool()

    # 2026-04 性能：空库直接返回；避免白白调 embedding 模型
    if only_approved and await _approved_count_cached(pool) == 0:
        return []

    embedding = await _get_embedding_cached(query_text)
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

    platforms = platforms or []
    tech_stacks = tech_stacks or []
    ui_libs = ui_libs or []
    exclude_tags = exclude_tags or []
    any_dim = bool(platforms or tech_stacks or ui_libs or legacy_tech_stack)

    # 1.4 B.1：从 query_amis_json 提关键字（type/subType/api），与样例 keyword_index 做交集
    # 空数组时 CARDINALITY(...) 永远 0，keyword_boost = 0，等价于现有逻辑
    query_keywords: List[str] = extract_amis_keywords(query_amis_json) if query_amis_json else []

    where_status = "AND status = 'approved'" if only_approved else ""
    # 维度过滤（若任一数组非空，则必须至少命中一个；全为空 → 不过滤，退化为纯向量检索）
    # 注意：$6（legacy_tech_stack）必须在 WHERE 子句中**无条件**出现，避免 asyncpg 类型推断失败
    where_dim = (
        "AND (\n"
        "  ($3::text[] <> '{}' AND platforms && $3::text[])\n"
        "  OR ($4::text[] <> '{}' AND tech_stacks && $4::text[])\n"
        "  OR ($5::text[] <> '{}' AND ui_libs && $5::text[])\n"
        "  OR ($6::text IS NOT NULL AND tech_stack = $6)\n"
        ")"
        if any_dim
        else "AND ($6::text IS NULL OR tech_stack = $6)"  # 当无维度过滤时，$6 仍需出现但条件短路
    )

    # 质量硬过滤（生产检索永远排除 is_negative=true 的样本——负例走独立召回接口）
    #
    # 注意：$8 / $9 必须在 SQL 里**无条件**出现，否则 asyncpg 会因
    #   "expects N arguments, M passed" 报错（SQL 占位符必须与传参个数一致）。
    # 用 `$X IS NULL OR ...` 让 admin 没启该过滤时条件自动短路成 TRUE。
    where_quality = (
        "AND is_negative = FALSE\n"
        # $7 = exclude_tags（text[]）：空数组时 tags && '{}' 恒为 false，NOT FALSE = TRUE，等于不过滤
        "  AND NOT (tags && $7::text[])\n"
        # $8 = min_rating（float / NULL）：NULL 时整个条件 TRUE
        "  AND ($8::float IS NULL OR rating IS NULL OR rating >= $8)\n"
        # $9 = min_verdict_rank（int / NULL）：NULL 时整个条件 TRUE
        "  AND ($9::int IS NULL OR quality_verdict IS NULL OR\n"
        "       CASE quality_verdict WHEN 'good' THEN 2 WHEN 'needs_review' THEN 1 ELSE 0 END >= $9)"
    )
    verdict_rank: Optional[int] = None
    if min_verdict is not None and min_verdict in _VERDICT_RANK:
        verdict_rank = _VERDICT_RANK[min_verdict]

    # 1.2.0 多页硬过滤：按 multipage / execution_strategy / reuse_strategy tags
    where_multipage = ""
    if multipage_filter or execution_strategy or reuse_strategy:
        where_clauses = []
        if multipage_filter:
            where_clauses.append("'multipage:1' = ANY(tags)")
        if execution_strategy:
            where_clauses.append(f"'execution_strategy:{execution_strategy}' = ANY(tags)")
        if reuse_strategy:
            where_clauses.append(f"'reuse_strategy:{reuse_strategy}' = ANY(tags)")
        if where_clauses:
            where_multipage = "AND (" + " AND ".join(where_clauses) + ")"

    # 软加权：thumbs_boost / hit_boost 由 weighting_enabled + 子开关共同控制
    if weighting_enabled and thumbs_mode == "boost":
        thumbs_boost_expr = (
            "CASE WHEN (thumbs_up + thumbs_down) > 0 "
            "THEN 0.2 * (thumbs_up::float / (thumbs_up + thumbs_down)) "
            "ELSE 0 END"
        )
    elif weighting_enabled and thumbs_mode == "tiebreaker":
        # 仅在 cos_sim 差不多时起作用（权重微小，拉 cos_sim 微差样本）
        thumbs_boost_expr = (
            "CASE WHEN (thumbs_up + thumbs_down) > 0 "
            "THEN 0.05 * (thumbs_up::float / (thumbs_up + thumbs_down)) "
            "ELSE 0 END"
        )
    else:
        thumbs_boost_expr = "0"

    if weighting_enabled and hit_count_enabled:
        hit_boost_expr = "0.1 * LN(1 + GREATEST(hit_count, 0)::float / 10.0)"
    else:
        hit_boost_expr = "0"

    # 参数占位：$1=embedding, $2=top_k, $3-5=三组维度数组, $6=legacy_stack,
    #          $7=exclude_tags, $8=min_rating, $9=min_verdict_rank, $10=query_keywords (1.4 B.1)
    # 不传的参数用固定值传入（SQL 自动短路），避免分支 SQL 字符串
    query = f"""
        WITH scored AS (
            SELECT id, tech_stack, source_team,
                   platforms, tech_stacks, ui_libs, tags, keyword_index,
                   amis_json_summary, code_summary,
                   full_amis_json, full_code, hit_count,
                   thumbs_up, thumbs_down, rating, quality_verdict,
                   (1 - (embedding <=> $1::vector)) AS cos_sim,
                   CASE
                     WHEN platforms && $3::text[]
                          AND tech_stacks && $4::text[]
                          AND ui_libs && $5::text[] THEN 0.3
                     WHEN platforms && $3::text[]
                          OR tech_stacks && $4::text[]
                          OR ui_libs && $5::text[] THEN 0.1
                     ELSE 0.0
                   END AS tag_boost,
                   ({thumbs_boost_expr}) AS thumbs_boost,
                   ({hit_boost_expr}) AS hit_boost,
                   -- 1.4 B.1：keyword_index 与 query 关键字交集大小
                   -- query_keywords 空时 UNNEST({{}}) 空，INTERSECT 永远空集，结果 0
                   CARDINALITY(ARRAY(
                       SELECT UNNEST(keyword_index)
                       INTERSECT
                       SELECT UNNEST($10::text[])
                   )) AS kw_overlap
            FROM code_samples
            WHERE embedding IS NOT NULL
              {where_status}
              {where_dim}
              {where_quality}
              {where_multipage}
        )
        SELECT *,
               -- 1.4 B.1：keyword 每命中 1 个加 0.06，上限 0.3（相当于全维度 tag_boost）
               LEAST(0.3, 0.06 * kw_overlap) AS keyword_boost,
               cos_sim + tag_boost + thumbs_boost + hit_boost
                 + LEAST(0.3, 0.06 * kw_overlap) AS score
        FROM scored
        ORDER BY score DESC
        LIMIT $2
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            query,
            embedding_str,                  # $1
            top_k,                          # $2
            platforms,                      # $3
            tech_stacks,                    # $4
            ui_libs,                        # $5
            legacy_tech_stack,              # $6
            exclude_tags,                   # $7
            min_rating,                     # $8 None 时 SQL 短路成 TRUE
            verdict_rank,                   # $9 同上
            query_keywords,                 # $10 1.4 B.1：空数组时 keyword_boost = 0
        )

    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "tech_stack": row["tech_stack"],
            "source_team": row["source_team"],
            "platforms": list(row["platforms"] or []),
            "tech_stacks": list(row["tech_stacks"] or []),
            "ui_libs": list(row["ui_libs"] or []),
            "tags": list(row["tags"] or []),
            "keyword_index": list(row["keyword_index"] or []),
            "amis_json_summary": row["amis_json_summary"],
            "code_summary": row["code_summary"],
            "full_amis_json": row["full_amis_json"],
            "full_code": row["full_code"],
            "hit_count": row["hit_count"],
            "thumbs_up": row["thumbs_up"],
            "thumbs_down": row["thumbs_down"],
            "rating": row["rating"],
            "quality_verdict": row["quality_verdict"],
            "similarity": row["cos_sim"] or 0.0,
            "tag_boost": row["tag_boost"] or 0.0,
            "thumbs_boost": row["thumbs_boost"] or 0.0,
            "hit_boost": row["hit_boost"] or 0.0,
            "keyword_boost": row["keyword_boost"] or 0.0,
            "keyword_hits": int(row["kw_overlap"] or 0),
            "score": row["score"] or 0.0,
        })
    return results


# ────────────────────────── 2026-04 质量闭环：负例召回（结构性反面教材） ──────────────────────────

async def search_negative_samples(
    tech_stacks: Optional[List[str]] = None,
    platforms: Optional[List[str]] = None,
    top_k: int = 1,
    only_structural: bool = True,
) -> List[dict]:
    """按维度检索 is_negative=true 的样例（反向飞轮资产）。

    评审建议：
      - 强制 only_structural=True（避 LLM negation blindness，不给完整反例代码段）
      - 不走 embedding 检索（反例不是语义匹配问题，是"同技术栈典型错误"）
      - 按 created_at DESC 取最近的 Top-K（新踩的坑优先提示）

    返回字段精简：只给 negative_kind / rejection_reason / amis_json_summary，
    不给 full_code（即使 only_structural=False 时也不给，防止 prompt 污染）。
    """
    pool = await get_pool()
    tech_stacks = tech_stacks or []
    platforms = platforms or []

    where_kind = "AND negative_kind = 'structural'" if only_structural else ""
    where_dim = ""
    if tech_stacks or platforms:
        where_dim = (
            "AND (\n"
            "  ($1::text[] <> '{}' AND tech_stacks && $1::text[])\n"
            "  OR ($2::text[] <> '{}' AND platforms && $2::text[])\n"
            ")"
        )

    query = f"""
        SELECT id, tech_stack, tech_stacks, platforms,
               negative_kind, rejection_reason,
               amis_json_summary, code_summary
        FROM code_samples
        WHERE is_negative = TRUE
          {where_kind}
          {where_dim}
        ORDER BY created_at DESC
        LIMIT $3
    """
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, tech_stacks, platforms, top_k)
    except Exception as e:
        print(f"[RAG] search_negative_samples 失败: {e}")
        return []

    return [
        {
            "id": r["id"],
            "tech_stack": r["tech_stack"],
            "tech_stacks": list(r["tech_stacks"] or []),
            "platforms": list(r["platforms"] or []),
            "negative_kind": r["negative_kind"],
            "rejection_reason": r["rejection_reason"],
            "amis_json_summary": r["amis_json_summary"],
            "code_summary": r["code_summary"],
        }
        for r in rows
    ]


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
