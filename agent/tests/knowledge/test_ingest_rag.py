"""测试 ingest_rag.py：INSERT / 幂等 UPDATE / 向量化触发。"""
import pytest

from knowledge.amis_importer.ingest_rag import RagRecord, ingest_rag_records


@pytest.mark.asyncio
async def test_ingest_rag_inserts_new_record(db_pool):
    records = [RagRecord(
        component="form",
        amis_version="6.10.0",
        title="Form 表单 示例 #1",
        prose="测试 prose",
        amis_json='{"type":"form"}',
        status="auto_imported",
        extra_tags=["amis-knowledge-test"],
    )]
    n = await ingest_rag_records(db_pool, records)
    assert n == 1
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT tech_stack, source_team, status, tags FROM code_samples "
            "WHERE 'amis-component:form' = ANY(tags) AND 'amis-knowledge-test' = ANY(tags)"
        )
        assert row["tech_stack"] == "amis-core"
        assert row["source_team"] == "baidu-amis"
        assert row["status"] == "auto_imported"


@pytest.mark.asyncio
async def test_ingest_rag_idempotent_by_tags(db_pool):
    records = [RagRecord(
        component="select",
        amis_version="6.10.0",
        title="Select 选择",
        prose="x",
        amis_json='{"type":"select"}',
        status="auto_imported",
        extra_tags=["amis-knowledge-test"],
    )]
    n1 = await ingest_rag_records(db_pool, records)
    n2 = await ingest_rag_records(db_pool, records)
    assert n1 == 1
    assert n2 == 0  # 第二次跑应该 UPDATE 不 INSERT
    async with db_pool.acquire() as conn:
        cnt = await conn.fetchval(
            "SELECT count(*) FROM code_samples "
            "WHERE 'amis-component:select' = ANY(tags) AND 'amis-knowledge-test' = ANY(tags)"
        )
        assert cnt == 1
