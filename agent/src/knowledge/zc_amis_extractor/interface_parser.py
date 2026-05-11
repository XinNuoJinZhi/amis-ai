"""ZC Amis 主包 renderers (amis/src/renderers/*.tsx) 的 schema interface parser。

主包 renderer 文件标准结构：

    export interface SelectControlSchema extends FormOptionsSchema {
      type: 'department-select';

      /**
       * 是否隐藏顶级
       */
      hideRoot?: boolean;

      /**
       * 顶级选项的名称
       */
      topLabel?: string;
      ...
    }

跟 plugin_parser 不同的是：
- 抽 `export interface XxxSchema` 而不是 `class XxxPlugin extends BasePlugin`
- 用 `type: 'xxx'` 字面值作为 component name（不是 iface name）
- props 解析 JSDoc + 字段名 + 可选标记 + 类型

regex parser，不依赖 ts-morph（参考 1.1 amis_types_extractor.ts 思路用 Python 重写）。
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any


class ZcInterfaceParser:
    """抽 .tsx 文件里所有 `export interface XxxSchema { type: 'yyy'; ... }`。"""

    INTERFACE_PATTERN = re.compile(
        r"export\s+interface\s+(\w+)\s*(?:extends\s+([^{]+?))?\s*\{",
        re.MULTILINE,
    )

    def parse_file(self, file_path: Path) -> list[dict[str, Any]]:
        text = file_path.read_text(encoding="utf-8")
        results: list[dict[str, Any]] = []
        for m in self.INTERFACE_PATTERN.finditer(text):
            iface_name = m.group(1)
            extends = (m.group(2) or "").strip()
            # 找紧跟着的 `{` 位置
            brace_start = m.end() - 1
            while brace_start < len(text) and text[brace_start] != "{":
                brace_start += 1
            if brace_start >= len(text):
                continue
            body = self._extract_braced_body(text, brace_start)
            if body is None:
                continue
            type_field = re.search(
                r"^\s*type\s*\??\s*:\s*['\"]([^'\"]+)['\"]",
                body,
                re.MULTILINE,
            )
            if not type_field:
                continue  # 不是 schema interface，跳过
            component = type_field.group(1)
            props = self._extract_props(body)
            results.append(
                {
                    "iface_name": iface_name,
                    "component": component,
                    "extends": extends,
                    "props": props,
                    "source_file": str(file_path),
                }
            )
        return results

    @staticmethod
    def _extract_braced_body(text: str, brace_start: int) -> str | None:
        """从 `{` 位置开始抽平衡花括号内的 body（不含外层 {}）。"""
        if text[brace_start] != "{":
            return None
        depth = 0
        in_string: str | None = None
        escape = False
        for i in range(brace_start, len(text)):
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
                        return text[brace_start + 1 : i]
        return None

    PROP_PATTERN = re.compile(
        r"(?:/\*\*\s*(.*?)\s*\*/\s*)?"  # 可选 JSDoc
        r"^\s*(\w+)\s*(\?)?\s*:\s*"  # 字段名 + 可选 ? + :
        r"([^;]+?)\s*;",  # 类型直到 ;
        re.MULTILINE | re.DOTALL,
    )

    @classmethod
    def _extract_props(cls, body: str) -> list[dict[str, Any]]:
        """从 interface body 抽 props 列表（含 JSDoc 描述、字段名、可选、类型）。"""
        props: list[dict[str, Any]] = []
        for m in cls.PROP_PATTERN.finditer(body):
            jsdoc_raw = m.group(1) or ""
            name = m.group(2)
            optional = m.group(3) == "?"
            type_str = m.group(4).strip()
            # 跳过常见 noise：嵌套对象的字段，type 字段（外层已抽）
            if name == "type" and re.match(r"['\"]", type_str):
                continue
            # 清理 JSDoc：去掉每行前导 * 和空白
            jsdoc_lines = []
            for ln in jsdoc_raw.split("\n"):
                cleaned = re.sub(r"^\s*\*\s?", "", ln).rstrip()
                if cleaned:
                    jsdoc_lines.append(cleaned)
            description = " ".join(jsdoc_lines).strip()
            # 类型字符串简单清理（折叠多空白 / 去掉嵌套换行）
            type_str = re.sub(r"\s+", " ", type_str)
            props.append(
                {
                    "name": name,
                    "optional": optional,
                    "type": type_str,
                    "description": description,
                }
            )
        return props


def parsed_to_markdown(parsed: dict[str, Any], category: str = "new") -> str:
    """把 parse_file 单条结果转 markdown reference。"""
    from .plugin_parser import classify_zc_suite

    component = parsed["component"]
    iface = parsed["iface_name"]
    extends = parsed.get("extends") or ""
    props = parsed.get("props") or []
    suite = classify_zc_suite(component, parsed.get("source_file"))

    lines = [
        "---",
        f"component: {component}",
        "source: zc-amis-6.8.0-my242v2",
        f"category: {category}",
        f"zc_suite: {suite}",
        "---",
        "",
        f"# {component}",
        "",
        f"> 运行时 schema 接口：`{iface}`" + (f"（extends `{extends}`）" if extends else ""),
        "",
        "## 属性",
        "",
        "| 属性 | 类型 | 必选 | 说明 |",
        "|---|---|---|---|",
        f"| `type` | `\"{component}\"` | 是 | 指定类型 |",
    ]
    for p in props:
        required = "否" if p["optional"] else "是"
        type_display = p["type"].replace("|", "\\|").replace("`", "")
        if len(type_display) > 60:
            type_display = type_display[:57] + "..."
        desc = p["description"].replace("|", "\\|")
        if len(desc) > 80:
            desc = desc[:77] + "..."
        lines.append(f"| `{p['name']}` | `{type_display}` | {required} | {desc} |")
    lines.append("")

    if category == "patched":
        lines.append("## 跟原版 amis 差异")
        lines.append("")
        lines.append("（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"
