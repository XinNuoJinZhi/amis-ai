"""ZC Amis editor plugin (amis-editor/src/plugin/*.tsx) 的 regex parser。

ZC plugin class 标准结构：

    export class XxxPlugin extends BasePlugin {
      rendererName = 'xxx';           // type 字段值
      name = '中文名';
      description = '描述';
      tags = ['表单项'];
      scaffold = { type: 'xxx', ... }; // 默认起手 schema
      events: RendererPluginEvent[] = [
        { eventName: 'change', eventLabel: '值变化', ... }
      ];
      panelTitle = '面板标题';
      icon = 'fa fa-xxx';
      docLink = '/amis/zh-CN/components/xxx';
    }

regex parser 抽顶层标量字段 + 简单平衡括号抽 scaffold object + regex 抽事件列表。
不依赖 TypeScript AST 工具。
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


class ZcPluginParser:
    """从 ZC plugin .tsx 文件抽 plugin class 元数据。"""

    def parse_file(self, file_path: Path) -> dict[str, Any] | None:
        """读取并解析一个 plugin .tsx 文件，返回元数据 dict 或 None（非 plugin 文件）。"""
        text = file_path.read_text(encoding="utf-8")
        renderer_name = self._grep_str(text, "rendererName")
        if not renderer_name:
            return None  # 没有 rendererName 字段，跳过

        return {
            "rendererName": renderer_name,
            "name": self._grep_str(text, "name"),
            "description": self._grep_str(text, "description"),
            "tags": self._grep_arr(text, "tags"),
            "icon": self._grep_str(text, "icon"),
            "docLink": self._grep_str(text, "docLink"),
            "panelTitle": self._grep_str(text, "panelTitle"),
            "isBaseComponent": self._grep_bool(text, "isBaseComponent"),
            "scaffold": self._extract_scaffold(text),
            "events": self._extract_events(text),
            "source_file": str(file_path),
        }

    @staticmethod
    def _grep_str(text: str, field: str) -> str | None:
        """从源码里抽形如 `field = 'value'` 或 `field: 'value'` 的字符串字面值。"""
        # 行首允许缩进 + field + (: 或 =) + 引号包裹的字符串
        # 用 [^\\]['\"] 防止字符串里的转义引号
        pattern = rf"^\s*{re.escape(field)}\s*[:=]\s*['\"]((?:[^'\"\\]|\\.)*?)['\"]"
        m = re.search(pattern, text, re.MULTILINE)
        return m.group(1) if m else None

    @staticmethod
    def _grep_bool(text: str, field: str) -> bool | None:
        pattern = rf"^\s*{re.escape(field)}\s*[:=]\s*(true|false)"
        m = re.search(pattern, text, re.MULTILINE)
        return m.group(1) == "true" if m else None

    @staticmethod
    def _grep_arr(text: str, field: str) -> list[str]:
        """从源码里抽形如 `field = ['a', 'b']` 的字符串数组。"""
        pattern = rf"^\s*{re.escape(field)}\s*[:=]\s*\[([^\]]*)\]"
        m = re.search(pattern, text, re.MULTILINE)
        if not m:
            return []
        return [
            x.strip().strip("'\"")
            for x in m.group(1).split(",")
            if x.strip()
        ]

    @staticmethod
    def _extract_scaffold(text: str) -> Any:
        """抽 `scaffold = { ... }` 的对象（用平衡花括号扫描）。"""
        m = re.search(r"^\s*scaffold(?:\s*:\s*[A-Za-z<>\[\]\s,]+)?\s*=\s*", text, re.MULTILINE)
        if not m:
            return None
        start = m.end()
        # 跳过空白找开括号
        while start < len(text) and text[start] in " \t\n\r":
            start += 1
        if start >= len(text) or text[start] != "{":
            return None
        # 平衡括号扫描
        depth = 0
        in_string: str | None = None  # 当前在哪种引号内（用于跳过引号内的 {/}）
        escape = False
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
                        raw = text[start : i + 1]
                        return ZcPluginParser._safe_parse_object(raw)
        return None

    @staticmethod
    def _safe_parse_object(raw: str) -> Any:
        """尽力把 TS 对象字面值解析成 dict；失败则返回 _raw_unparsed 标记。"""
        cleaned = raw
        # 去单行注释（// 到行尾）
        cleaned = re.sub(r"//[^\n]*", "", cleaned)
        # 去多行注释 /* ... */
        cleaned = re.sub(r"/\*[\s\S]*?\*/", "", cleaned)
        # 单引号字符串改双引号（粗糙但够用）
        cleaned = re.sub(r"'([^'\\]*(?:\\.[^'\\]*)*)'", r'"\1"', cleaned)
        # 尾逗号
        cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
        # 给无引号的对象 key 加双引号（TS 写法 { type: 'xx' } → { "type": "xx" }）
        cleaned = re.sub(r"([{,]\s*)([A-Za-z_$][\w$]*)\s*:", r'\1"\2":', cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"_raw_unparsed": raw.strip()}

    @staticmethod
    def _extract_events(text: str) -> list[dict[str, str]]:
        """抽 events: RendererPluginEvent[] 数组里每个事件的 eventName + eventLabel。"""
        m = re.search(r"events\s*:\s*RendererPluginEvent\[\]\s*=\s*\[", text)
        if not m:
            return []
        # 从 events 开始一段截取（避免误抓后面别的 eventName，但简单实现先粗放）
        section = text[m.end() :]
        names = re.findall(r"eventName\s*:\s*['\"]([^'\"]+)['\"]", section)
        labels = re.findall(r"eventLabel\s*:\s*['\"]([^'\"]+)['\"]", section)
        return [
            {"name": n, "label": l}
            for n, l in zip(names, labels)
        ]


# ---------- 业务套件分类 ----------

ZC_SUITE_KEYWORDS: dict[str, list[str]] = {
    "oa": ["department", "user-select", "userselect", "flowcreate", "workflow"],
    "model": ["modelform", "modeltable", "docentity", "entity", "dynamic-form", "dynamicform"],
    "reportforms": ["report-forms", "reportforms", "chart", "bar", "line", "pie", "gauge", "funnel", "wordcloud", "map", "sankey"],
    "apicenter": ["apicenter", "apicontrol", "apiadaptor"],
    "action-panel": ["actionspanel", "event-control"],
    "ai": ["ai-", "aiavatar", "airender"],
}


def classify_zc_suite(renderer_name: str, file_path: str | Path | None = None) -> str:
    """根据 rendererName / 文件路径推断 ZC 业务套件分类。"""
    rn = (renderer_name or "").lower()
    fp = str(file_path or "").lower()
    haystack = f"{rn} {fp}"
    for suite, kws in ZC_SUITE_KEYWORDS.items():
        if any(kw in haystack for kw in kws):
            return suite
    return "other"


# ---------- markdown 输出 ----------

def to_markdown(parsed: dict[str, Any], category: str = "new") -> str:
    """把 parse_file 输出的 dict 转成 references/*.md 内容。"""
    rn = parsed["rendererName"]
    name = parsed.get("name") or rn
    description = parsed.get("description") or ""
    tags = parsed.get("tags") or []
    scaffold = parsed.get("scaffold")
    events = parsed.get("events") or []
    panel = parsed.get("panelTitle")
    icon = parsed.get("icon")
    doc_link = parsed.get("docLink")
    is_base = parsed.get("isBaseComponent")
    suite = classify_zc_suite(rn, parsed.get("source_file"))

    lines: list[str] = [
        "---",
        f"component: {rn}",
        "source: zc-amis-6.8.0-my242v2",
        f"category: {category}",
        f"zc_suite: {suite}",
        "---",
        "",
        f"# {name}（type: `{rn}`）",
        "",
    ]
    if description:
        lines.extend([f"> {description}", ""])

    meta: list[str] = []
    if tags:
        meta.append(f"**标签**：{', '.join(tags)}")
    if panel:
        meta.append(f"**编辑器面板**：{panel}")
    if icon:
        meta.append(f"**图标**：`{icon}`")
    if doc_link:
        meta.append(f"**文档**：`{doc_link}`")
    if is_base is True:
        meta.append("**基础组件**（编辑器内可直接拖拽）")
    if meta:
        lines.append("\n".join(meta))
        lines.append("")

    if scaffold:
        lines.append("## 默认 scaffold（建议起手用法）")
        lines.append("")
        lines.append("```json")
        if isinstance(scaffold, dict) and "_raw_unparsed" in scaffold:
            lines.append(scaffold["_raw_unparsed"])
        else:
            lines.append(json.dumps(scaffold, ensure_ascii=False, indent=2))
        lines.append("```")
        lines.append("")

    if events:
        lines.append("## 事件")
        lines.append("")
        lines.append("| eventName | eventLabel |")
        lines.append("|---|---|")
        for e in events:
            lines.append(f"| `{e['name']}` | {e['label']} |")
        lines.append("")

    if category == "patched":
        lines.append("## 跟原版 amis 差异")
        lines.append("")
        lines.append("（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"
