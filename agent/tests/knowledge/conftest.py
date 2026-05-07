"""共享 pytest fixture：db_pool 连本地 amis_ai 库，每个测试前后清 amis-knowledge-test 标记的行。"""
import os

import asyncpg
import pytest_asyncio


@pytest_asyncio.fixture
async def db_pool():
    url = os.environ.get(
        "DATABASE_URL",
        "postgresql://amis_ai:amis_ai_dev@localhost:5432/amis_ai",
    )
    pool = await asyncpg.create_pool(url, min_size=1, max_size=2)
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM code_samples WHERE 'amis-knowledge-test' = ANY(tags)"
        )
    yield pool
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM code_samples WHERE 'amis-knowledge-test' = ANY(tags)"
        )
    await pool.close()
