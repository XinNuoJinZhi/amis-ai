"""1.4 B.1：回填 code_samples.keyword_index 列。

对所有 keyword_index 为空（'{}'）且 full_amis_json 非空的样本，
从 amis_json 提取关键字写回。幂等可重跑。

用法：
    cd agent
    INTERNAL_API_KEY=xxx uv run python scripts/backfill_keyword_index.py
    # 或 dry-run（只打印计数不写库）：
    uv run python scripts/backfill_keyword_index.py --dry-run

预计执行时间：
    73 条 ZC 业务样例 + 148 条 amis-core 样例 = ~220 条
    每条 < 100ms，整体 < 30s
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# 把 agent/src 加进 sys.path（直接 run 时）
_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT))

from src.services.db import get_pool, close_pool  # noqa: E402
from src.services.keyword_extractor import extract_amis_keywords  # noqa: E402


async def backfill(dry_run: bool = False, batch_size: int = 50) -> None:
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, full_amis_json
            FROM code_samples
            WHERE keyword_index = '{}'
              AND full_amis_json IS NOT NULL
              AND full_amis_json <> ''
            ORDER BY id
            """
        )

    total = len(rows)
    print(f"[backfill] 待处理 code_samples 数量: {total}")
    if total == 0:
        print("[backfill] 没有需要回填的样例，退出")
        return

    updated = 0
    skipped_empty = 0
    skipped_error = 0

    for row in rows:
        sample_id = row["id"]
        amis_json = row["full_amis_json"]
        try:
            keywords = extract_amis_keywords(amis_json)
        except Exception as e:
            print(f"  ! id={sample_id} 提取失败: {e}")
            skipped_error += 1
            continue

        if not keywords:
            skipped_empty += 1
            print(f"  - id={sample_id} 提取结果为空，跳过")
            continue

        if dry_run:
            print(f"  · id={sample_id} 提取到 {len(keywords)} 个关键字: {keywords[:6]}{'...' if len(keywords) > 6 else ''}")
            updated += 1
            continue

        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE code_samples SET keyword_index = $1::text[] WHERE id = $2",
                keywords,
                sample_id,
            )
        updated += 1
        if updated % batch_size == 0:
            print(f"  ✓ 已回填 {updated}/{total}...")

    print()
    print(f"[backfill] 完成：updated={updated} skipped_empty={skipped_empty} skipped_error={skipped_error}")
    if dry_run:
        print("[backfill] dry-run 模式，未实际写库")


async def main() -> None:
    parser = argparse.ArgumentParser(description="回填 code_samples.keyword_index")
    parser.add_argument("--dry-run", action="store_true", help="只打印不写库")
    parser.add_argument("--batch-size", type=int, default=50, help="每多少条打印一次进度")
    args = parser.parse_args()

    try:
        await backfill(dry_run=args.dry_run, batch_size=args.batch_size)
    finally:
        await close_pool()


if __name__ == "__main__":
    asyncio.run(main())
