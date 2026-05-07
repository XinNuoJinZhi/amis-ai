"""CLI: python -m knowledge.amis_importer [types|docs|all] [--dry-run] [--component <name>]

调用方式（在 agent/ 目录下，已配 pythonpath=["src"]）：

    cd agent
    PYTHONPATH=src uv run python -m knowledge.amis_importer types
    PYTHONPATH=src uv run python -m knowledge.amis_importer docs --status auto_imported
    PYTHONPATH=src uv run python -m knowledge.amis_importer all --dry-run
"""
from __future__ import annotations
import argparse
import asyncio
import subprocess
import sys

from .config import (
    ImporterConfig, DUMP_DIR, SKILLS_REFS, TYPES_EXTRACTOR_DIR,
)
from .clone import clone_amis
from .parse_docs import dump_docs_json
from .ingest_skills import ingest_schema_to_skills
from .ingest_rag import docs_json_to_records, ingest_rag_records


def cmd_types(cfg: ImporterConfig) -> int:
    repo = clone_amis(cfg)
    schema_json = DUMP_DIR / "amis-schema.json"
    DUMP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[types] 调 Node extractor 解析 {repo}")
    subprocess.run(
        ["pnpm", "tsx", "extractor.ts", str(repo), str(schema_json), cfg.amis_version],
        cwd=TYPES_EXTRACTOR_DIR, check=True,
    )
    print(f"[types] 写 references → {SKILLS_REFS}")
    if cfg.dry_run:
        print("[types] dry-run，跳过写文件")
        return 0
    n = ingest_schema_to_skills(schema_json, SKILLS_REFS)
    print(f"[types] 完成 ✓ 共 {n} 个组件 references")
    return 0


async def _run_docs(cfg: ImporterConfig, status: str) -> int:
    import asyncpg
    repo = clone_amis(cfg)
    docs_json = DUMP_DIR / "docs.json"
    n_docs = dump_docs_json(cfg, repo, docs_json)
    print(f"[docs] 切出 {n_docs} 个组件文档 → {docs_json}")
    if cfg.dry_run:
        print("[docs] dry-run，跳过 DB 写")
        return 0
    records = docs_json_to_records(docs_json, cfg.amis_version, status=status)
    pool = await asyncpg.create_pool(cfg.db_url, min_size=1, max_size=4)
    try:
        n = await ingest_rag_records(pool, records, vectorize=True)
    finally:
        await pool.close()
    print(f"[docs] 完成 ✓ 新增 {n} 条 code_samples")
    return 0


def cmd_docs(cfg: ImporterConfig, status: str) -> int:
    return asyncio.run(_run_docs(cfg, status))


def main() -> int:
    p = argparse.ArgumentParser(prog="amis_importer", description="amis 知识双轨补全 CLI")
    p.add_argument("phase", choices=["types", "docs", "all"], help="跑哪一轨：types / docs / all（两个都跑）")
    p.add_argument("--dry-run", action="store_true", help="只跑解析不写文件/不写 DB")
    p.add_argument("--component", help="只处理指定组件（默认全量）")
    p.add_argument("--status", default="auto_imported",
                   choices=["auto_imported", "approved", "pending"],
                   help="docs 轨入库时的 status（默认 auto_imported）")
    p.add_argument("--amis-version", default=None, help="覆盖默认 amis 版本")
    args = p.parse_args()

    cfg = ImporterConfig(dry_run=args.dry_run)
    if args.amis_version:
        cfg.amis_version = args.amis_version

    if args.phase in ("types", "all"):
        rc = cmd_types(cfg)
        if rc != 0:
            return rc
    if args.phase in ("docs", "all"):
        rc = cmd_docs(cfg, status=args.status)
        if rc != 0:
            return rc
    return 0


if __name__ == "__main__":
    sys.exit(main())
