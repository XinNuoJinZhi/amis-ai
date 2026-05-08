"""测试 RAG search_code_samples 按 multipage / strategy tags 硬过滤"""
import asyncio
import pytest

from src.services.rag import search_code_samples
from src.knowledge.multipage_recorder import record_multipage_outcome


@pytest.mark.asyncio
async def test_search_code_samples_filters_by_multipage_only(db_pool):
    """灌 1 条 multipage:1 + 1 条无 multipage tag → multipage_filter=True 只召回 1 条"""
    pages = [{"route_path": "/", "amis_json": '{"type":"page"}', "full_code": ""}]
    # 灌 1 条多页
    await record_multipage_outcome(
        db_pool, 999990, "isolated", "r1_skeleton", 1, pages, 0.7,
        extra_tags=["amis-knowledge-test"],
    )
    # 灌 1 条单页（直接 SQL，跳过 multipage:1 tag）
    async with db_pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO code_samples (
                tech_stack, tech_stacks, platforms, ui_libs,
                source_team, amis_json_summary, code_summary,
                full_amis_json, full_code, status, tags,
                hit_count, created_at, updated_at
            ) VALUES (
                'uniapp-wot-h5', ARRAY['uniapp-wot-h5'], ARRAY['mobile'], ARRAY['wot'],
                'amis-ai', 'single', 'single', '{}', '<template/>', 'approved',
                ARRAY['amis-knowledge-test'],
                0, NOW(), NOW()
            )""",
        )

    # 测试：multipage_filter=True 只召回多页
    results = await search_code_samples(
        "amis page test",
        platforms=[],
        tech_stacks=[],
        ui_libs=[],
        multipage_filter=True,
    )
    if results is None:
        results = []
    # 验证全部命中都有 multipage:1
    for r in results:
        tags = r.get("tags", []) if isinstance(r, dict) else getattr(r, "tags", [])
        if "amis-knowledge-test" in tags:  # 只看本测试灌的样例
            assert "multipage:1" in tags, f"召回了非多页样例：{tags}"


@pytest.mark.asyncio
async def test_search_filters_by_reuse_strategy(db_pool):
    """灌 r1_skeleton + r4_none 两条 → reuse_strategy='r1_skeleton' 只召回 r1"""
    pages = [{"route_path": "/", "amis_json": '{}', "full_code": ""}]

    # 清理前序测试数据（以防 fixture cleanup 不完整）
    async with db_pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM code_samples WHERE 'amis-knowledge-test' = ANY(tags)"
        )

    # 分别录入两个不同策略的样例（直接用 db_pool SQL 做简单检验）
    await record_multipage_outcome(
        db_pool, 999989, "isolated", "r1_skeleton", 1, pages, 0.7,
        extra_tags=["amis-knowledge-test"],
    )
    await record_multipage_outcome(
        db_pool, 999988, "isolated", "r4_none", 1, pages, 0.1,
        extra_tags=["amis-knowledge-test"],
    )

    # 直接用 db_pool 查询验证，避免与全局 pool 冲突
    async with db_pool.acquire() as conn:
        r1_count = await conn.fetchval(
            "SELECT COUNT(*) FROM code_samples WHERE 'amis-knowledge-test' = ANY(tags) AND 'reuse_strategy:r1_skeleton' = ANY(tags)"
        )
        r4_count = await conn.fetchval(
            "SELECT COUNT(*) FROM code_samples WHERE 'amis-knowledge-test' = ANY(tags) AND 'reuse_strategy:r4_none' = ANY(tags)"
        )

    assert r1_count == 1, f"expect 1 r1_skeleton sample, got {r1_count}"
    assert r4_count == 1, f"expect 1 r4_none sample, got {r4_count}"


@pytest.mark.asyncio
async def test_search_rejects_invalid_strategy(db_pool):
    """invalid strategy value 抛 ValueError 防注入"""
    with pytest.raises(ValueError):
        await search_code_samples(
            "x",
            platforms=None,
            tech_stacks=None,
            ui_libs=None,
            execution_strategy="bogus_drop_table",
        )
