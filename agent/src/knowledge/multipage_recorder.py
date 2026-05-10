"""1.2.0 多页任务完成后写 RAG（带 strategy / multipage / reuse_rate tags）"""
from __future__ import annotations
from typing import Any

import asyncpg


async def record_multipage_outcome(
    pool: asyncpg.Pool,
    task_id: int,
    execution_strategy: str,           # 'isolated' / 'unified'
    reuse_strategy: str | None,        # 'r1_skeleton' / 'r2_prompt' / 'r3_refactor' / 'r4_none' / None
    page_count: int,
    pages: list[dict[str, Any]],       # [{route_path, amis_json, full_code}]
    reuse_rate: float,
    extra_tags: list[str] | None = None,
) -> int:
    """把多页任务结果写成 1 条 code_samples 行，返回 sample_id（status=pending，等人审）。"""
    full_amis_json = "[\n" + ",\n".join(p.get("amis_json", "{}") for p in pages) + "\n]"
    full_code_segments = [p.get("full_code", "") for p in pages]
    full_code = "\n\n// ===== 页面分隔 =====\n\n".join(full_code_segments)
    if len(full_code) > 2_000_000:
        full_code = full_code[:2_000_000] + "\n\n// ...（已截断）"

    rate_bucket = "high" if reuse_rate >= 0.6 else ("medium" if reuse_rate >= 0.3 else "low")
    tags = [
        "multipage:1",
        f"execution_strategy:{execution_strategy}",
        f"page_count:{page_count}",
        f"reuse_rate:{rate_bucket}",
    ]
    if reuse_strategy:
        tags.append(f"reuse_strategy:{reuse_strategy}")
    if extra_tags:
        tags.extend(extra_tags)

    async with pool.acquire() as conn:
        sample_id = await conn.fetchval(
            """
            INSERT INTO code_samples (
                tech_stack, tech_stacks, platforms, ui_libs,
                source_team, source_task_id,
                amis_json_summary, code_summary,
                full_amis_json, full_code, status, tags,
                hit_count, created_at, updated_at
            ) VALUES (
                'uniapp-wot-h5', ARRAY['uniapp-wot-h5'], ARRAY['mobile'], ARRAY['wot'],
                'amis-ai', $1,
                $2, $3, $4, $5, 'pending', $6, 0, NOW(), NOW()
            )
            RETURNING id
            """,
            task_id,
            f"多页任务 {page_count} 页，策略 {execution_strategy}/{reuse_strategy or 'n/a'}，复用率 {reuse_rate:.2%}",
            f"execution={execution_strategy}, reuse={reuse_strategy or 'n/a'}, page_count={page_count}",
            full_amis_json,
            full_code,
            tags,
        )
    return sample_id
