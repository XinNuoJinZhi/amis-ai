"""灌 ZC code_samples 到 PG（B.6 阶段实施脚本）。

策略：
1. 用 sample_extractor 抽样 examples 和 references 两路
2. 转 code_samples 行字典
3. 生成 PostgreSQL dollar-quoted SQL 文件（避免 amis_json 特殊字符 escape 问题）
4. psql -f 一次跑完

为啥用 SQL 文件而不是 asyncpg：系统 python 没装 asyncpg，agent venv 才有；
绕开依赖就用 psql 子进程，简单可靠（dollar-quoted string `$tag$...$tag$` 支持任意特殊字符）。

去重策略：用 amis_json_summary + 'zc-amis-1.3' tag 组合查重，已存在的跳过（不 UPSERT，
保留人工 review/rating 状态）。
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from .sample_extractor import (
    scan_examples_dir,
    scan_references_dir,
    to_code_sample_row,
)


REPO_ROOT = Path(__file__).resolve().parents[4]
ZC_EXAMPLES = Path(
    "/home/karl/Working/TianXing/amis-codegen/.claude/skills/zc_amis/assets/examples/components"
)
REFS_DIR = REPO_ROOT / "skills" / "zc-amis-schema" / "references"
SQL_OUT = Path("/tmp/zc-samples-insert.sql")


def _dollar_quote(s: str, tag: str = "zc_str") -> str:
    """PostgreSQL dollar-quoted string，支持任意特殊字符。
    用 $zc_str$...$zc_str$ 包裹；若内容里恰好有 $zc_str$，换更长的 tag。
    """
    base_tag = tag
    n = 0
    while f"${base_tag}$" in s:
        n += 1
        base_tag = f"{tag}{n}"
    return f"${base_tag}$" + s + f"${base_tag}$"


def _to_pg_array(items: list[str]) -> str:
    """转 Python list → PG text[] 字面值 `ARRAY['a','b']::text[]`。"""
    if not items:
        return "ARRAY[]::text[]"
    escaped = ", ".join(_dollar_quote(x, tag="zc_arr") for x in items)
    return f"ARRAY[{escaped}]::text[]"


def make_insert_sql(row: dict, dedup: bool = True) -> str:
    """单条 row → INSERT SQL（dollar-quoted）。

    dedup=True 时用 NOT EXISTS 子查询跳过已存在样例（按 amis_json_summary + 'zc-amis-1.3' 查重）。
    """
    insert = f"""INSERT INTO code_samples (
    tech_stack, tech_stacks, platforms, ui_libs,
    source_team, amis_json_summary, code_summary,
    full_amis_json, full_code, status, tags,
    hit_count, created_at, updated_at
)
SELECT
    {_dollar_quote(row['tech_stack'])},
    {_to_pg_array(row['tech_stacks'])},
    {_to_pg_array(row['platforms'])},
    {_to_pg_array(row['ui_libs'])},
    {_dollar_quote(row['source_team'])},
    {_dollar_quote(row['amis_json_summary'])},
    {_dollar_quote(row['code_summary'])},
    {_dollar_quote(row['full_amis_json'])},
    {_dollar_quote(row['full_code'])},
    {_dollar_quote(row['status'])},
    {_to_pg_array(row['tags'])},
    {row['hit_count']}, NOW(), NOW()
"""
    if dedup:
        # 用 amis_json_summary（含 title）+ zc-amis-1.3 标签做幂等键
        insert += f"""WHERE NOT EXISTS (
    SELECT 1 FROM code_samples
    WHERE amis_json_summary = {_dollar_quote(row['amis_json_summary'])}
      AND 'zc-amis-1.3' = ANY(tags)
);"""
    else:
        insert += ";"
    return insert


def generate_sql(samples: list[dict], output: Path = SQL_OUT) -> int:
    """生成 SQL 文件，返回生成的 INSERT 条数。"""
    lines = [
        "-- ZC Amis 1.3 code_samples 灌库（B.6 阶段产出）",
        "-- dollar-quoted strings 处理 amis_json 特殊字符",
        "-- 去重策略：amis_json_summary + zc-amis-1.3 tag 组合查重",
        "BEGIN;",
    ]
    n = 0
    for s in samples:
        row = to_code_sample_row(s)
        lines.append(make_insert_sql(row))
        n += 1
    lines.append("COMMIT;")
    lines.append(
        "SELECT COUNT(*) AS zc_amis_1_3_samples FROM code_samples WHERE 'zc-amis-1.3' = ANY(tags);"
    )
    output.write_text("\n".join(lines), encoding="utf-8")
    return n


def main(dry_run: bool = False) -> int:
    print("=== 抽样阶段 ===")
    examples = scan_examples_dir(ZC_EXAMPLES, max_files=200)
    print(f"  路径 1 examples/components/*.jsx: {len(examples)} 条")
    refs = scan_references_dir(REFS_DIR)
    print(f"  路径 2 references/*.md scaffold: {len(refs)} 条")
    all_samples = examples + refs
    print(f"  合计：{len(all_samples)} 条")

    print()
    print(f"=== 生成 SQL 文件 → {SQL_OUT} ===")
    n = generate_sql(all_samples, SQL_OUT)
    print(f"  写入 {n} 条 INSERT 语句 + 1 条 SELECT 验证")

    if dry_run:
        print()
        print("=== DRY RUN（不执行 psql）===")
        print(f"  请用 psql 执行：psql -h localhost -U amis_ai -d amis_ai -f {SQL_OUT}")
        return 0

    print()
    print("=== 执行 psql ===")
    result = subprocess.run(
        [
            "psql",
            "-h",
            "localhost",
            "-U",
            "amis_ai",
            "-d",
            "amis_ai",
            "-v",
            "ON_ERROR_STOP=1",
            "-f",
            str(SQL_OUT),
        ],
        env={"PGPASSWORD": "amis_ai_dev", "PATH": "/usr/bin:/usr/local/bin"},
        capture_output=True,
        text=True,
    )
    print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
    if result.returncode != 0:
        print("STDERR:", result.stderr[-2000:])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(dry_run="--dry-run" in sys.argv))
