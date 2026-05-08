"""测试 multipage_recorder：写 code_samples 表 + 带 strategy tags"""
import pytest

from src.knowledge.multipage_recorder import record_multipage_outcome


@pytest.mark.asyncio
async def test_record_multipage_writes_code_sample_with_strategy_tags(db_pool):
    pages = [
        {"route_path": "/", "amis_json": '{"type":"page"}', "full_code": "<template>1</template>"},
        {"route_path": "/list", "amis_json": '{"type":"crud"}', "full_code": "<template>2</template>"},
    ]
    sid = await record_multipage_outcome(
        db_pool,
        task_id=999999,
        execution_strategy="isolated",
        reuse_strategy="r1_skeleton",
        page_count=2,
        pages=pages,
        reuse_rate=0.7,
        extra_tags=["amis-knowledge-test"],
    )
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT tags, status, source_team FROM code_samples WHERE id = $1", sid)
        assert "multipage:1" in row["tags"]
        assert "execution_strategy:isolated" in row["tags"]
        assert "reuse_strategy:r1_skeleton" in row["tags"]
        assert "reuse_rate:high" in row["tags"]
        assert "page_count:2" in row["tags"]
        assert "amis-knowledge-test" in row["tags"]
        assert row["status"] == "pending"
        assert row["source_team"] == "amis-ai"


@pytest.mark.asyncio
async def test_record_multipage_buckets_reuse_rate(db_pool):
    pages = [{"route_path": "/", "amis_json": '{"type":"page"}', "full_code": ""}]
    # high
    sid_h = await record_multipage_outcome(
        db_pool, 999998, "unified", None, 1, pages, 0.8,
        extra_tags=["amis-knowledge-test"],
    )
    # medium
    sid_m = await record_multipage_outcome(
        db_pool, 999997, "unified", None, 1, pages, 0.45,
        extra_tags=["amis-knowledge-test"],
    )
    # low
    sid_l = await record_multipage_outcome(
        db_pool, 999996, "unified", None, 1, pages, 0.1,
        extra_tags=["amis-knowledge-test"],
    )
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, tags FROM code_samples WHERE id IN ($1, $2, $3)",
            sid_h, sid_m, sid_l,
        )
        by_id = {r["id"]: r["tags"] for r in rows}
        assert "reuse_rate:high" in by_id[sid_h]
        assert "reuse_rate:medium" in by_id[sid_m]
        assert "reuse_rate:low" in by_id[sid_l]


@pytest.mark.asyncio
async def test_record_multipage_unified_no_reuse_strategy(db_pool):
    """统筹模式 reuse_strategy=None，tags 里不应有 reuse_strategy:* 字段"""
    pages = [{"route_path": "/", "amis_json": '{}', "full_code": ""}]
    sid = await record_multipage_outcome(
        db_pool, 999995, "unified", None, 1, pages, 0.9,
        extra_tags=["amis-knowledge-test"],
    )
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT tags FROM code_samples WHERE id = $1", sid)
        has_reuse_tag = any(t.startswith("reuse_strategy:") for t in row["tags"])
        assert not has_reuse_tag, "统筹模式不应有 reuse_strategy 标签"
