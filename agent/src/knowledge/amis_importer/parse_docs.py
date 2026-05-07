"""文档轨：切 baidu/amis docs/zh-CN/components/*.md → 组件 + 示例 JSON + prose。"""
from __future__ import annotations
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

from .config import ImporterConfig

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_CODE_BLOCK_RE = re.compile(
    r"```(?:json|schema)(?::[^\n]*)?\s*\n(.*?)```",
    re.DOTALL,
)


@dataclass
class ComponentDoc:
    component: str       # 文件 stem，如 "form" / "select"
    title: str           # frontmatter 的 title，缺省回退到 component
    description: str     # frontmatter 的 description
    examples: list[str]  # 所有 ```schema/json 代码块原文
    prose: str           # 去掉 frontmatter 和代码块后的说明文字（裁到 5000 字）


def _grep_fm(fm: str, key: str) -> str | None:
    for line in fm.splitlines():
        if line.lstrip().startswith(f"{key}:"):
            return line.split(":", 1)[1].strip()
    return None


def parse_component_doc(md_path: Path) -> ComponentDoc:
    raw = md_path.read_text(encoding="utf-8")
    fm_match = _FRONTMATTER_RE.match(raw)
    if fm_match:
        fm = fm_match.group(1)
        body = raw[fm_match.end():]
    else:
        fm, body = "", raw

    # form/index.md 这类用父目录名作 component（amis docs 把组件容器入口放 <name>/index.md）
    component = md_path.parent.name if md_path.stem == "index" else md_path.stem
    title = _grep_fm(fm, "title") or component
    description = _grep_fm(fm, "description") or ""
    examples = [m.group(1).strip() for m in _CODE_BLOCK_RE.finditer(body)]
    prose = _CODE_BLOCK_RE.sub("", body).strip()
    if len(prose) > 5000:
        prose = prose[:5000] + "\n\n…（已截断）"

    return ComponentDoc(
        component=component,
        title=title,
        description=description,
        examples=examples,
        prose=prose,
    )


def iter_amis_component_docs(amis_repo: Path) -> Iterable[ComponentDoc]:
    docs_dir = amis_repo / "docs" / "zh-CN" / "components"
    for md in sorted(docs_dir.rglob("*.md")):
        try:
            yield parse_component_doc(md)
        except Exception as e:
            print(f"[parse_docs] 跳过 {md}: {e}")


def dump_docs_json(cfg: ImporterConfig, amis_repo: Path, output: Path) -> int:
    docs = list(iter_amis_component_docs(amis_repo))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps([asdict(d) for d in docs], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return len(docs)
