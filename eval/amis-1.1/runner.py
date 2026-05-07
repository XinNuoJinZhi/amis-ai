"""Amis 1.1 评测 runner：按 prompts.json 跑 chat 接口，按 expected_components 评分。"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from typing import Any

import httpx

CHAT_ENDPOINT = "http://localhost:8080/api/chat/translate"


def _collect_types(node: Any) -> set[str]:
    out: set[str] = set()
    if isinstance(node, dict):
        if "type" in node and isinstance(node["type"], str):
            out.add(node["type"])
        for v in node.values():
            out |= _collect_types(v)
    elif isinstance(node, list):
        for v in node:
            out |= _collect_types(v)
    return out


def score_result(case: dict[str, Any], amis_json_text: str) -> dict[str, Any]:
    try:
        obj = json.loads(amis_json_text)
    except json.JSONDecodeError:
        return {"id": case["id"], "pass": False, "reason": "invalid_json"}
    found = _collect_types(obj)
    expected = set(case["expected_components"])
    missing = expected - found
    if missing:
        return {
            "id": case["id"],
            "pass": False,
            "reason": "missing_components",
            "missing": sorted(missing),
        }
    return {"id": case["id"], "pass": True}


def compare_results(a: list[dict], b: list[dict]) -> dict:
    a_pass = sum(1 for r in a if r["pass"])
    b_pass = sum(1 for r in b if r["pass"])
    a_rate = a_pass / len(a) if a else 0.0
    b_rate = b_pass / len(b) if b else 0.0
    return {
        "a_adopt_rate": round(a_rate, 4),
        "b_adopt_rate": round(b_rate, 4),
        "delta_pp": round((b_rate - a_rate) * 100, 2),
        "a_pass": a_pass,
        "b_pass": b_pass,
        "n": len(a),
    }


def run_eval(prompts_path: Path, output_path: Path, endpoint: str = CHAT_ENDPOINT) -> None:
    prompts = json.loads(prompts_path.read_text(encoding="utf-8"))
    results = []
    with httpx.Client(timeout=120.0) as client:
        for case in prompts:
            print(f"[eval] {case['id']}: {case['prompt'][:40]}...")
            resp = client.post(endpoint, json={"prompt": case["prompt"]})
            resp.raise_for_status()
            amis_json_text = resp.json().get("amis_json", "")
            results.append({**score_result(case, amis_json_text), "amis_json": amis_json_text})
    output_path.write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in results),
        encoding="utf-8",
    )
    n_pass = sum(1 for r in results if r["pass"])
    print(f"[eval] 完成：{n_pass}/{len(results)} pass，写入 {output_path}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--prompts", default=str(Path(__file__).parent / "prompts.json"))
    p.add_argument("--output", help="跑分模式：写入此 jsonl 文件")
    p.add_argument("--compare", nargs=2, metavar=("A", "B"), help="对比两个 jsonl")
    p.add_argument("--endpoint", default=CHAT_ENDPOINT)
    args = p.parse_args()

    if args.compare:
        a = [json.loads(line) for line in Path(args.compare[0]).read_text().splitlines() if line]
        b = [json.loads(line) for line in Path(args.compare[1]).read_text().splitlines() if line]
        report = compare_results(a, b)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    if args.output:
        run_eval(Path(args.prompts), Path(args.output), endpoint=args.endpoint)
        return 0
    p.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
