"""按语义等价（amis 同义组件）重新计分两份 jsonl，输出对比。

调用：python rescore.py baseline-1.0.jsonl 1.1.jsonl
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

# amis 同义/超集映射：expected 组件 → 出现这些 type 也算"覆盖"
# 来源：baidu/amis docs。"button" 包含 submit/reset 等 actionType；"action" 是顶层动作族；
# "dialog" 与 drawer 同族；"table" 在 crud 里通过 mode='table' 渲染。
EQUIV: dict[str, set[str]] = {
    "button": {"button", "action", "submit", "reset", "dropdown-button"},
    "action": {"action", "button", "submit", "reset", "dropdown-button"},
    "dialog": {"dialog", "drawer", "confirm"},
    "drawer": {"drawer", "dialog"},
    "table": {"table", "crud", "table-view", "table2"},
    "crud": {"crud", "crud2"},
    "input-date-range": {"input-date-range", "input-datetime-range", "date-range"},
    "input-image": {"input-image", "input-file", "image-control"},
    "input-rich-text": {"input-rich-text", "editor", "input-rich-text-editor"},
    "tree-select": {"tree-select", "tree", "input-tree"},
    "qr-code": {"qr-code", "qrcode"},
    "switch": {"switch", "checkbox"},
    "checkboxes": {"checkboxes", "checkbox-group", "checkbox"},
    "select": {"select", "nested-select", "chained-select", "tree-select", "tag-select"},
    "input-text": {"input-text", "input-password", "input-email", "input-url", "textarea"},
    "input-number": {"input-number"},
    "form": {"form"},
    "page": {"page"},
    "tabs": {"tabs"},
    "wizard": {"wizard"},
    "dropdown-button": {"dropdown-button", "action"},
    "cards": {"cards", "card"},
    "list": {"list"},
    "timeline": {"timeline"},
    "textarea": {"textarea", "input-text"},
    "picker": {"picker", "select"},
    "radios": {"radios", "radio-group"},
}


def _collect_types(node):
    out = set()
    if isinstance(node, dict):
        if isinstance(node.get("type"), str):
            out.add(node["type"])
        # actionType 也算（amis 里 button 子类型常用 actionType 而非 type=submit）
        if isinstance(node.get("actionType"), str):
            out.add(node["actionType"])
        for v in node.values():
            out |= _collect_types(v)
    elif isinstance(node, list):
        for v in node:
            out |= _collect_types(v)
    return out


def lenient_pass(expected: list[str], amis_json_text: str) -> tuple[bool, list[str]]:
    try:
        obj = json.loads(amis_json_text)
    except json.JSONDecodeError:
        return False, expected
    found = _collect_types(obj)
    missing = []
    for e in expected:
        synonyms = EQUIV.get(e, {e})
        if not (synonyms & found):
            missing.append(e)
    return len(missing) == 0, missing


def rescore(jsonl_path: Path, prompts_path: Path) -> tuple[int, list[dict]]:
    prompts = {p["id"]: p for p in json.loads(prompts_path.read_text())}
    out = []
    for line in jsonl_path.read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        case = prompts[r["id"]]
        ok, missing = lenient_pass(case["expected_components"], r.get("amis_json", ""))
        out.append({"id": r["id"], "pass": ok, "missing": missing})
    n_pass = sum(1 for x in out if x["pass"])
    return n_pass, out


def main():
    base_path, latest_path = sys.argv[1], sys.argv[2]
    prompts = Path(__file__).parent / "prompts.json"
    a_pass, a_results = rescore(Path(base_path), prompts)
    b_pass, b_results = rescore(Path(latest_path), prompts)
    n = len(a_results)
    delta_pp = round((b_pass / n - a_pass / n) * 100, 2)
    print(json.dumps({
        "scoring": "lenient (synonym-aware)",
        "a_adopt_rate": round(a_pass / n, 4),
        "b_adopt_rate": round(b_pass / n, 4),
        "delta_pp": delta_pp,
        "a_pass": a_pass,
        "b_pass": b_pass,
        "n": n,
    }, ensure_ascii=False, indent=2))
    print("\n--- diff ---")
    print("id | a | b | a_missing | b_missing")
    for ra, rb in zip(a_results, b_results):
        if ra["pass"] != rb["pass"] or ra["missing"] != rb["missing"]:
            print(f"{ra['id']} | {'P' if ra['pass'] else 'F'} | {'P' if rb['pass'] else 'F'} | {ra['missing']} | {rb['missing']}")


if __name__ == "__main__":
    main()
