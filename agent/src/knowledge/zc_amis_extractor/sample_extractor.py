"""ZC amis 业务样例抽取器（B.6 阶段）。

两路并行抽 code_samples：

1. **ZC examples/components/ 业务样例**
   - 扫所有 .jsx 文件，抽 `export default { ... }` 整个对象（ZC examples 是纯 schema 字面值，
     不是 React 组件，import/state 等 React 模板代码极少）
   - 高质量 + 复杂业务（CRUD / Form 各种 mode / Dialog / EventAction 等）

2. **zc-amis-schema/references/*.md 的 scaffold**
   - 从 plugin_parser 已经写好的 references 抽 `## 默认 scaffold` 块里的 JSON
   - 覆盖每个 ZC 二开组件的 minimal 用法（保 LLM 知道 type/scaffold 起手）

两路合起来目标 80-120 条 `code_samples` 行（带 `zc-amis-1.3` 标签 + `source_team='zc-amis'`）。

复用 plugin_parser 的 `_safe_parse_object` 处理 TS→JSON 容错（单引号→双引号、key 加引号、
去注释、去尾逗号）。
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .plugin_parser import ZcPluginParser


# ---------- 路径 1：examples/components/ 业务样例 ----------

EXPORT_DEFAULT_PATTERN = re.compile(r"\bexport\s+default\s+", re.MULTILINE)


def extract_from_example_jsx(file_path: Path) -> dict[str, Any] | None:
    """从 examples/components/*.jsx 抽 `export default { ... }` 整个 amis schema。

    返回 dict 含 amis_json (解析后的 dict 或 _raw_unparsed)、title、category、source_relpath。
    """
    text = file_path.read_text(encoding="utf-8", errors="ignore")
    m = EXPORT_DEFAULT_PATTERN.search(text)
    if not m:
        return None
    # 从 export default 后找平衡花括号
    start = m.end()
    while start < len(text) and text[start] in " \t\n\r":
        start += 1
    if start >= len(text) or text[start] != "{":
        return None
    # 沿用 plugin_parser 的平衡花括号扫描
    depth = 0
    in_string: str | None = None
    escape = False
    end_idx = -1
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_string:
                in_string = None
        else:
            if ch in ("'", '"', "`"):
                in_string = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end_idx = i
                    break
    if end_idx < 0:
        return None
    raw = text[start : end_idx + 1]
    parsed = ZcPluginParser._safe_parse_object(raw)
    if isinstance(parsed, dict) and "_raw_unparsed" in parsed:
        # 解析失败，跳过（样例质量优先）
        return None
    # title 字段（如果有）+ 简易 category 推断
    title = parsed.get("title") if isinstance(parsed, dict) else None
    body = parsed.get("body") if isinstance(parsed, dict) else None
    category = _infer_category(parsed, file_path.name)
    return {
        "amis_json": parsed,
        "title": title or file_path.stem,
        "category": category,
        "source_relpath": str(file_path),
    }


CATEGORY_BY_FILENAME = [
    ("CRUD", "crud"),
    ("Form", "form"),
    ("Dialog", "dialog"),
    ("Drawer", "drawer"),
    ("Page", "page"),
    ("Chart", "chart"),
    ("Wizard", "wizard"),
    ("Tabs", "tabs"),
    ("Linkage", "linkage"),
    ("EventAction", "event-action"),
]


def _infer_category(parsed: Any, filename: str) -> str:
    """根据顶层 type / 文件名推断分类。"""
    if isinstance(parsed, dict):
        # 看顶层 body 的 type
        body = parsed.get("body")
        if isinstance(body, dict):
            t = body.get("type")
            if t in {"crud", "form", "wizard", "dialog", "drawer", "chart", "tabs"}:
                return t
    for kw, cat in CATEGORY_BY_FILENAME:
        if kw.lower() in filename.lower():
            return cat
    return "other"


def scan_examples_dir(examples_root: Path, max_files: int = 100) -> list[dict[str, Any]]:
    """扫 examples/components/**/*.jsx，抽 export default schema。

    跳过明显不是 amis schema 的工具文件（Doc.tsx / loader.ts / index.html 等）。
    跳过超大文件（> 50KB，多半是 demo 数据集而非 amis schema）。
    """
    samples: list[dict[str, Any]] = []
    skip_names = {
        "Doc.tsx", "DocNavCN.ts", "Index.jsx", "Components.tsx", "App.tsx",
        "Editor.jsx", "Play.jsx", "MdRenderer.jsx", "SchemaRender.jsx",
        "LazyData.tsx", "DocSearch.jsx", "Example.jsx", "Horizontal.jsx",
    }
    for jsx in examples_root.rglob("*.jsx"):
        if jsx.name in skip_names:
            continue
        if jsx.stat().st_size > 50_000:
            continue
        result = extract_from_example_jsx(jsx)
        if result:
            samples.append(result)
            if len(samples) >= max_files:
                break
    return samples


# ---------- 路径 2：references/*.md 的 scaffold ----------

SCAFFOLD_BLOCK_PATTERN = re.compile(
    r"## 默认 scaffold[^\n]*\n+```json\n(.*?)\n```",
    re.DOTALL,
)


def extract_from_reference_md(md_path: Path) -> dict[str, Any] | None:
    """从 zc-amis-schema/references/<component>.md 抽 scaffold + component metadata。"""
    text = md_path.read_text(encoding="utf-8")
    # frontmatter
    fm_m = re.match(r"---\n(.*?)\n---\n", text, re.DOTALL)
    if not fm_m:
        return None
    fm = {}
    for line in fm_m.group(1).split("\n"):
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip()
    component = fm.get("component")
    if not component:
        return None
    # scaffold JSON
    scaffold_m = SCAFFOLD_BLOCK_PATTERN.search(text)
    if not scaffold_m:
        return None
    raw = scaffold_m.group(1).strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # 用 plugin_parser 的容错解析
        parsed = ZcPluginParser._safe_parse_object(raw)
        if isinstance(parsed, dict) and "_raw_unparsed" in parsed:
            return None
    # 用 page 包一层，让样例像完整页面
    wrapped = {"type": "page", "title": f"{component} 起手", "body": parsed}
    return {
        "amis_json": wrapped,
        "title": f"{component} minimal scaffold",
        "category": fm.get("zc_suite", "other"),
        "source_relpath": str(md_path),
        "component": component,
    }


def scan_references_dir(refs_root: Path) -> list[dict[str, Any]]:
    """扫 zc-amis-schema/references/*.md 抽每个 component 的 scaffold。"""
    samples: list[dict[str, Any]] = []
    for md in sorted(refs_root.glob("*.md")):
        result = extract_from_reference_md(md)
        if result:
            samples.append(result)
    return samples


# ---------- 转 code_samples 行 ----------

def to_code_sample_row(
    sample: dict[str, Any],
    *,
    source_team: str = "zc-amis",
    tech_stack: str = "zc-editor-web",
    extra_tags: list[str] | None = None,
) -> dict[str, Any]:
    """把 sample 转换成 code_samples 表的一行。

    code_samples 字段：tech_stack / source_team / amis_json_summary / code_summary /
    full_amis_json / full_code / status / tags / platforms / tech_stacks / ui_libs / hit_count
    """
    amis_json = sample["amis_json"]
    if isinstance(amis_json, dict):
        full_amis = json.dumps(amis_json, ensure_ascii=False)
    else:
        full_amis = str(amis_json)
    title = sample.get("title", "")
    category = sample.get("category", "other")
    component = sample.get("component", "")
    desc_parts = [title]
    if category and category != "other":
        desc_parts.append(f"[{category}]")
    if component:
        desc_parts.append(f"组件: {component}")
    summary = " · ".join(desc_parts)
    tags = ["zc-amis-1.3", category] + (extra_tags or [])
    if component:
        tags.append(f"zc-component:{component}")
    # 去重保留顺序
    tags = list(dict.fromkeys(t for t in tags if t))
    return {
        "tech_stack": tech_stack,
        "source_team": source_team,
        "amis_json_summary": summary[:500],
        "code_summary": f"ZC Amis 1.3 样例 — {summary}"[:500],
        "full_amis_json": full_amis,
        "full_code": "",  # ZC 出码场景：full_code 待 D 阶段反向飞轮跑出来后回填
        "status": "approved",  # 跟 1.1 灌的样例同级别
        "hit_count": 0,
        "tags": tags,
        "platforms": ["zc-web"],
        "tech_stacks": ["zc-editor", "react"],
        "ui_libs": ["amis-zc"],
    }
