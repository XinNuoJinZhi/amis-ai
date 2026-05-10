#!/usr/bin/env python3
"""1.2.0 多页 5 策略评测 runner

用同一组 prompt 让 5 种策略各跑一遍，导出复用率 / 页通过率 / LLM 调用次数 / LLM 总耗时 / 总耗时矩阵。

前置：
  - 4 服务在线（./shared/scripts/start-services.sh restart）
  - admin JWT 在 env：export TEST_ADMIN_JWT=<token>
  - 默认连 localhost:8080 backend + localhost:5432 pgvector
  - 需要 Python 3.9+ + 标准库（无第三方依赖）

用法：
  TEST_ADMIN_JWT=<jwt> python3 eval/multipage-1.2/runner.py
  TEST_ADMIN_JWT=<jwt> python3 eval/multipage-1.2/runner.py --prompts p1_basic_3pages,p3_ecommerce_5pages
  TEST_ADMIN_JWT=<jwt> python3 eval/multipage-1.2/runner.py --strategies r4,r1
  TEST_ADMIN_JWT=<jwt> python3 eval/multipage-1.2/runner.py --max-wait-sec 1200

输出：
  - eval/multipage-1.2/results-<timestamp>.csv  逐任务原始指标
  - eval/multipage-1.2/results-<timestamp>.md   策略汇总矩阵 + 每 prompt 明细
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import statistics
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
EVAL_DIR = ROOT / "eval" / "multipage-1.2"
PROMPTS_FILE = EVAL_DIR / "prompts.json"

DEFAULT_API = os.environ.get("API_BASE", "http://localhost:8080/api")
DEFAULT_DB_HOST = os.environ.get("PGHOST", "localhost")
DEFAULT_DB_USER = os.environ.get("PGUSER", "amis_ai")
DEFAULT_DB_NAME = os.environ.get("PGDATABASE", "amis_ai")
DEFAULT_DB_PASSWORD = os.environ.get("PGPASSWORD", "amis_ai_dev")
DEFAULT_TECH_STACK = "uniapp-wot-h5"
POLL_INTERVAL_SEC = 15
DEFAULT_MAX_WAIT_SEC = 30 * 60  # 跟 watcher 兜底超时一致

# 5 个策略：(strategy_id, execution_strategy, reuse_strategy)
STRATEGIES: list[tuple[str, str, str | None]] = [
    ("r4_baseline", "isolated", "r4_none"),
    ("r2_prompt", "isolated", "r2_prompt"),
    ("r1_skeleton", "isolated", "r1_skeleton"),
    ("r3_refactor", "isolated", "r3_refactor"),
    ("unified", "unified", None),
]


def log(msg: str) -> None:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def psql(sql: str) -> str:
    """跑一段 SQL 拿 stdout（-tA 模式：tuple-only + unaligned，方便解析）"""
    cmd = [
        "psql",
        "-h", DEFAULT_DB_HOST,
        "-U", DEFAULT_DB_USER,
        "-d", DEFAULT_DB_NAME,
        "-tA",
        "-c", sql,
    ]
    env = {**os.environ, "PGPASSWORD": DEFAULT_DB_PASSWORD}
    out = subprocess.run(cmd, capture_output=True, text=True, env=env, check=False)
    if out.returncode != 0:
        raise RuntimeError(f"psql 失败：{out.stderr.strip()}")
    return out.stdout.strip()


def http_post(url: str, token: str, body: dict[str, Any]) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def create_task(token: str, prompt: dict[str, Any], execution_strategy: str, reuse_strategy: str | None) -> int:
    """调 backend 创建多页任务，返回 task_id"""
    body = {
        "title": f"eval {prompt['id']} / {execution_strategy}/{reuse_strategy or 'none'}",
        "amis_json": "{}",
        "tech_stack": DEFAULT_TECH_STACK,
        "execution_strategy": execution_strategy,
        "pages": prompt["pages"],
    }
    if reuse_strategy:
        body["reuse_strategy"] = reuse_strategy
    resp = http_post(f"{DEFAULT_API}/projects/tasks", token, body)
    tid = resp.get("task_id") or resp.get("id")
    if tid is None:
        raise RuntimeError(f"创建任务失败：{resp}")
    return int(tid)


def wait_terminal(task_id: int, max_wait_sec: int) -> str:
    """轮询任务终态，返回最终 status"""
    start = time.time()
    while True:
        elapsed = time.time() - start
        if elapsed > max_wait_sec:
            return "timeout"
        status = psql(f"SELECT status FROM project_generation_task WHERE id = {task_id}").strip()
        if status not in ("running", "pending", ""):
            return status
        time.sleep(POLL_INTERVAL_SEC)


def collect_metrics(task_id: int) -> dict[str, Any]:
    """从 DB 拿任务的所有指标 — 1 个 task 一次 SQL 全部取齐"""
    # 1) task 主表
    main = psql(f"""
        SELECT status,
               EXTRACT(EPOCH FROM (updated_at - created_at))::int
        FROM project_generation_task WHERE id = {task_id}
    """).split("|")
    task_status = main[0] if main else "unknown"
    total_dur_sec = int(main[1]) if len(main) > 1 and main[1] else 0

    # 2) page 通过率
    pages = psql(f"""
        SELECT
          COUNT(*) FILTER (WHERE status='done'),
          COUNT(*)
        FROM project_task_page WHERE task_id = {task_id}
    """).split("|")
    pages_done = int(pages[0]) if pages and pages[0] else 0
    pages_total = int(pages[1]) if len(pages) > 1 and pages[1] else 0
    pass_rate = round(pages_done / pages_total, 3) if pages_total else 0.0

    # 3) reuse_metric 事件
    reuse_row = psql(f"""
        SELECT payload::jsonb->>'reuse_rate',
               payload::jsonb->>'import_count',
               payload::jsonb->>'file_count'
        FROM project_task_event
        WHERE task_id = {task_id} AND event_type = 'reuse_metric'
        LIMIT 1
    """).split("|")
    reuse_rate = float(reuse_row[0]) if reuse_row and reuse_row[0] else 0.0
    import_count = int(reuse_row[1]) if len(reuse_row) > 1 and reuse_row[1] else 0
    file_count = int(reuse_row[2]) if len(reuse_row) > 2 and reuse_row[2] else 0

    # 4) LLM 调用次数 + 总耗时（代理 token 消耗）
    llm = psql(f"""
        SELECT COUNT(*),
               COALESCE(SUM((payload::jsonb->'data'->>'elapsed_ms')::int), 0)
        FROM project_task_event
        WHERE task_id = {task_id} AND event_type = 'llm_request_end'
    """).split("|")
    llm_calls = int(llm[0]) if llm and llm[0] else 0
    llm_total_ms = int(llm[1]) if len(llm) > 1 and llm[1] else 0

    # 5) rag_recorded 是否触发（闭环检查）
    rag_ok = psql(f"""
        SELECT COUNT(*) > 0 FROM project_task_event
        WHERE task_id = {task_id} AND event_type = 'rag_recorded'
    """).strip() == "t"

    return {
        "task_id": task_id,
        "task_status": task_status,
        "pages_done": pages_done,
        "pages_total": pages_total,
        "pass_rate": pass_rate,
        "reuse_rate": reuse_rate,
        "import_count": import_count,
        "file_count": file_count,
        "llm_calls": llm_calls,
        "llm_total_ms": llm_total_ms,
        "total_dur_sec": total_dur_sec,
        "rag_ok": rag_ok,
    }


def run_one(token: str, prompt: dict[str, Any], strategy: tuple[str, str, str | None], max_wait_sec: int) -> dict[str, Any]:
    sid, exec_s, reuse_s = strategy
    log(f"  ▶ 启动 {sid}（exec={exec_s}, reuse={reuse_s or '-'}）")
    started_at = time.time()
    task_id = create_task(token, prompt, exec_s, reuse_s)
    log(f"     task_id={task_id}，等终态…")
    final = wait_terminal(task_id, max_wait_sec)
    elapsed = round(time.time() - started_at, 1)
    metrics = collect_metrics(task_id)
    log(
        f"     ← {sid} 完成 status={final} "
        f"pass={metrics['pages_done']}/{metrics['pages_total']} "
        f"reuse={metrics['reuse_rate']:.2f} "
        f"llm={metrics['llm_calls']}calls/{metrics['llm_total_ms']/1000:.0f}s "
        f"runner_wall={elapsed}s"
    )
    return {
        "prompt_id": prompt["id"],
        "prompt_title": prompt["title"],
        "page_count": len(prompt["pages"]),
        "strategy": sid,
        "execution_strategy": exec_s,
        "reuse_strategy": reuse_s or "",
        "runner_wall_sec": elapsed,
        **metrics,
    }


def write_csv(rows: list[dict[str, Any]], path: Path) -> None:
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def aggregate(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """按 strategy 聚合：均值复用率 / 平均通过率 / 平均 LLM 调用 / 平均 LLM 耗时 / 平均总耗时"""
    by_strategy: dict[str, list[dict[str, Any]]] = {}
    for r in rows:
        by_strategy.setdefault(r["strategy"], []).append(r)

    summary: dict[str, dict[str, Any]] = {}
    for sid, rs in by_strategy.items():
        successful = [r for r in rs if r["task_status"] == "succeeded"]
        n = len(rs)
        nok = len(successful)
        summary[sid] = {
            "n_runs": n,
            "n_succeeded": nok,
            "task_succeed_rate": round(nok / n, 3) if n else 0.0,
            "avg_pass_rate": round(statistics.mean(r["pass_rate"] for r in rs), 3) if rs else 0.0,
            "avg_reuse_rate": round(statistics.mean(r["reuse_rate"] for r in successful), 3) if successful else 0.0,
            "avg_llm_calls": round(statistics.mean(r["llm_calls"] for r in successful), 1) if successful else 0.0,
            "avg_llm_total_sec": round(statistics.mean(r["llm_total_ms"] / 1000 for r in successful), 1) if successful else 0.0,
            "avg_total_dur_sec": round(statistics.mean(r["total_dur_sec"] for r in successful), 1) if successful else 0.0,
        }
    return summary


def write_markdown(rows: list[dict[str, Any]], summary: dict[str, dict[str, Any]], path: Path, started_at: str) -> None:
    lines = [
        f"# 1.2.0 多页 5 策略评测报告（{started_at}）",
        "",
        "## 策略汇总（按 strategy 聚合）",
        "",
        "| 策略 | 任务成功率 | 平均页通过率 | 平均复用率 | 平均 LLM 调用 | 平均 LLM 耗时 | 平均总耗时 |",
        "|---|---|---|---|---|---|---|",
    ]
    for sid in [s[0] for s in STRATEGIES]:
        s = summary.get(sid)
        if not s:
            continue
        lines.append(
            f"| **{sid}** | {s['n_succeeded']}/{s['n_runs']}（{s['task_succeed_rate']*100:.0f}%）| "
            f"{s['avg_pass_rate']*100:.0f}% | {s['avg_reuse_rate']:.2f} | "
            f"{s['avg_llm_calls']:.1f} 次 | {s['avg_llm_total_sec']:.1f}s | "
            f"{s['avg_total_dur_sec']:.1f}s |"
        )
    lines += [
        "",
        "**指标说明**：",
        "- 任务成功率：task 主表 status=succeeded 占比",
        "- 页通过率：所有 page 中 status=done 的比例（即使 task succeeded 也可能有个别 page 失败）",
        "- 复用率：reuse_metric 事件里 import_count / file_count（只统计成功任务）",
        "- LLM 调用次数 / 总耗时：events 表 llm_request_end 累加（代理 token 消耗）",
        "- 总耗时：task created_at → updated_at（含 watcher 等真完成）",
        "",
        "## 每 prompt × 策略 明细",
        "",
    ]
    for prompt_id in sorted({r["prompt_id"] for r in rows}):
        rs = [r for r in rows if r["prompt_id"] == prompt_id]
        if not rs:
            continue
        lines += [
            f"### {prompt_id} — {rs[0]['prompt_title']}（{rs[0]['page_count']} 页）",
            "",
            "| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |",
            "|---|---|---|---|---|---|---|---|",
        ]
        for r in sorted(rs, key=lambda x: [s[0] for s in STRATEGIES].index(x["strategy"])):
            lines.append(
                f"| {r['strategy']} | {r['task_status']} | "
                f"{r['pages_done']}/{r['pages_total']} | {r['reuse_rate']:.2f} | "
                f"{r['llm_calls']} | {r['llm_total_ms']/1000:.0f}s | "
                f"{r['total_dur_sec']}s | {'✓' if r['rag_ok'] else '×'} |"
            )
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompts", help="逗号分隔的 prompt id 子集（默认全部）")
    parser.add_argument("--strategies", help="逗号分隔的策略子集，如 r4_baseline,r1_skeleton（默认 5 个全跑）")
    parser.add_argument("--max-wait-sec", type=int, default=DEFAULT_MAX_WAIT_SEC, help=f"单任务最多等多久（默认 {DEFAULT_MAX_WAIT_SEC}s）")
    args = parser.parse_args()

    token = os.environ.get("TEST_ADMIN_JWT")
    if not token:
        log("❌ 需要 TEST_ADMIN_JWT 环境变量")
        return 1

    raw = json.loads(PROMPTS_FILE.read_text(encoding="utf-8"))
    all_prompts = raw["prompts"]
    if args.prompts:
        wanted = set(args.prompts.split(","))
        all_prompts = [p for p in all_prompts if p["id"] in wanted]
    if not all_prompts:
        log("❌ 没有匹配的 prompt")
        return 1

    strategies = STRATEGIES
    if args.strategies:
        wanted = set(args.strategies.split(","))
        strategies = [s for s in STRATEGIES if s[0] in wanted]
    if not strategies:
        log("❌ 没有匹配的 strategy")
        return 1

    started_at = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    csv_path = EVAL_DIR / f"results-{started_at}.csv"
    md_path = EVAL_DIR / f"results-{started_at}.md"

    total = len(all_prompts) * len(strategies)
    log(f"评测开始：{len(all_prompts)} prompts × {len(strategies)} strategies = {total} tasks")
    log(f"  prompts: {[p['id'] for p in all_prompts]}")
    log(f"  strategies: {[s[0] for s in strategies]}")
    log(f"  max_wait_sec/task: {args.max_wait_sec}")
    log(f"  CSV → {csv_path.relative_to(ROOT)}")
    log(f"  MD  → {md_path.relative_to(ROOT)}")
    log("")

    rows: list[dict[str, Any]] = []
    started_wall = time.time()
    for i, prompt in enumerate(all_prompts, 1):
        log(f"=== [{i}/{len(all_prompts)}] prompt={prompt['id']}（{len(prompt['pages'])} 页）===")
        for strategy in strategies:
            try:
                row = run_one(token, prompt, strategy, args.max_wait_sec)
            except Exception as e:
                log(f"     ✗ {strategy[0]} 跑挂：{e}")
                row = {
                    "prompt_id": prompt["id"], "prompt_title": prompt["title"],
                    "page_count": len(prompt["pages"]), "strategy": strategy[0],
                    "execution_strategy": strategy[1], "reuse_strategy": strategy[2] or "",
                    "runner_wall_sec": 0, "task_id": -1, "task_status": "runner_error",
                    "pages_done": 0, "pages_total": len(prompt["pages"]), "pass_rate": 0.0,
                    "reuse_rate": 0.0, "import_count": 0, "file_count": 0,
                    "llm_calls": 0, "llm_total_ms": 0, "total_dur_sec": 0, "rag_ok": False,
                }
            rows.append(row)
            # 增量写入：跑挂了也保得住已跑数据
            write_csv(rows, csv_path)

    summary = aggregate(rows)
    write_markdown(rows, summary, md_path, started_at)
    total_wall = time.time() - started_wall
    log("")
    log(f"评测完成 总耗时={total_wall/60:.1f}min")
    log(f"  CSV: {csv_path.relative_to(ROOT)}")
    log(f"  MD : {md_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
