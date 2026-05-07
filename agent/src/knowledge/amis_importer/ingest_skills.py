"""类型轨入库：amis-schema.json → skills/amis-core-schema/references/<comp>.md"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any


def _row(name: str, type_: str, required: bool, description: str) -> str:
    desc = (description or "").replace("|", "\\|").replace("\n", "<br>")
    type_safe = type_.replace("|", "\\|")
    return f"| `{name}` | `{type_safe}` | {'是' if required else '否'} | {desc} |"


def render_component_md(component: str, schema: dict[str, Any], amis_version: str) -> str:
    props = schema.get("props", [])
    rows = "\n".join(
        _row(p["name"], p["type"], p["required"], p["description"]) for p in props
    )
    return f"""---
component: {component}
amis_version: {amis_version}
---

# {component}

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
{rows}
"""


def ingest_schema_to_skills(schema_json: Path, output_refs_dir: Path) -> int:
    dump = json.loads(schema_json.read_text(encoding="utf-8"))
    amis_version = dump.get("amis_version", "")
    components = dump.get("components", {})
    output_refs_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for comp_name, comp_schema in components.items():
        md = render_component_md(comp_name, comp_schema, amis_version)
        (output_refs_dir / f"{comp_name}.md").write_text(md, encoding="utf-8")
        n += 1
    return n
