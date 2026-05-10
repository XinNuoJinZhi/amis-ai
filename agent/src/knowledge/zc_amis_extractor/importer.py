"""阶段 B.3 batch importer — 跑 ZC fork 所有 plugin/renderer 文件出 references/*.md。

按 diff report (docs/zc-amis-diff-report.md) 分类：
- P0 全新 amis-editor/plugin: 9 个（含 flowCreate 覆盖 button + ReportForms 套件单独处理）
- P0 改造 amis-editor/plugin: 28 个（modified vs baidu/amis@6.8.0）
- P0 全新 amis 主包 renderers/: 16 个（用 interface_parser，待写）
- P0 改造 amis 主包 renderers/: 38 个

本脚本只跑 amis-editor/plugin/ 部分（用 plugin_parser）。
主包 renderer 用 interface_parser（不同模式，待写）。

用法：
    python3 -m knowledge.zc_amis_extractor.importer
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from .plugin_parser import ZcPluginParser, to_markdown

ZC_PACKAGES = Path(
    "/home/karl/Working/TianXing/amis-codegen/.claude/skills/zc_amis/assets/packages"
)
BAIDU_PACKAGES = Path("/tmp/amis-baidu-v6.8.0/packages")
# 基于 __file__ 锚定主仓根 (agent/src/knowledge/zc_amis_extractor/importer.py → ../../../../)
# 防御 cwd 漂移：之前 `cd agent && python3 -m ...` 让 OUT_DIR 漂到 agent/skills/。
REPO_ROOT = Path(__file__).resolve().parents[4]
OUT_DIR = REPO_ROOT / "skills" / "zc-amis-schema" / "references"

# P0 全新 plugin（diff report §3.1）
NEW_PLUGINS: list[str] = [
    "DepartmentSelect.tsx",
    "UserSelect.tsx",
    "DocEntity.tsx",
    "DynamicForm.tsx",
    "ModelForm.tsx",
    "ModelTable.tsx",
    # flowCreate.tsx → rendererName='button'，应作为 patched 处理（见 patched 列表）
    # ReportForms/ → 整体套件，手写 report-forms.md
]

# P0 改造 plugin（diff report §3.2）
PATCHED_PLUGINS: list[str] = [
    "Breadcrumb.tsx",
    "Button.tsx",
    "CRUD.tsx",
    "CRUD2/BaseCRUD.tsx",
    "Carousel.tsx",
    "Chart.tsx",
    "Form/ChainedSelect.tsx",
    "Form/Combo.tsx",
    "Form/Form.tsx",
    "Form/InputFile.tsx",
    "Form/InputImage.tsx",
    "Form/InputTable.tsx",
    "Form/InputText.tsx",
    "Form/InputTree.tsx",
    "Form/Item.tsx",
    "Form/NestedSelect.tsx",
    "Form/Select.tsx",
    "Form/TabsTransfer.tsx",
    "Image.tsx",
    "Link.tsx",
    "Mapping.tsx",
    "OfficeViewer.tsx",
    "Others/TableCell.tsx",
    "Page.tsx",
    "Service.tsx",
    "Steps.tsx",
    "Wizard.tsx",
    "flowCreate.tsx",  # 覆盖原版 button
]


def _run_plugin_files(parser: ZcPluginParser, files: Iterable[str], category: str) -> dict:
    """跑一批 plugin 文件，输出 references/*.md，返回统计。"""
    stats: dict[str, list[str]] = {"ok": [], "skip": [], "miss": []}
    for rel in files:
        src = ZC_PACKAGES / "amis-editor" / "src" / "plugin" / rel
        if not src.exists():
            stats["miss"].append(rel)
            continue
        parsed = parser.parse_file(src)
        if not parsed or not parsed.get("rendererName"):
            stats["skip"].append(rel)
            continue
        md = to_markdown(parsed, category=category)
        out = OUT_DIR / f"{parsed['rendererName']}.md"
        out.write_text(md, encoding="utf-8")
        stats["ok"].append(f"{parsed['rendererName']}  ←  {rel}")
    return stats


REPORT_FORMS_REFERENCE = """\
---
component: report-forms
source: zc-amis-6.8.0-my242v2
category: new
zc_suite: reportforms
---

# ZC 报表套件（type: `report-forms`）

> ZC fork 的独立 BI 报表子系统，覆盖图表、数值指标、地图、词云等可视化能力。
> 源码：`packages/amis-editor/src/plugin/ReportForms/` 共 125 个文件（独立子模块）。

**标签**：报表 / BI / 可视化

## 入口用法

ZC report-forms 套件按图表类型分发，建议在 schema 里指定 `chartType` 或直接用具体类型：

```json
{
  "type": "report-forms",
  "chartType": "bar",
  "source": {
    "url": "app://report/sales-overview"
  }
}
```

## 支持的图表类型（chartType / 独立 type）

| 类型 | 用途 |
|---|---|
| `bar` | 柱状图 |
| `line` | 折线图 |
| `pie` / `pie2` | 饼图 |
| `gauge` | 仪表盘 |
| `funnel` | 漏斗图 |
| `radar` | 雷达图 |
| `map` | 地图（含 ChartMap 子套件） |
| `wordcloud` | 词云 |
| `sankey` | 桑基图（ChartSanKey 子套件） |
| `scatter-map` | 散点地图（ChartScatterMap 子套件） |
| `waterfall` / `accumulated-waterfall` | 瀑布图 / 累积瀑布图 |
| `calendar` | 日历图（ChartCalendar 子套件） |
| `enumber` | 数值指标（ENumber，单一大数字展示） |

## 数据源

- `app://` 协议接 ZC apicenter（生产）
- mock 数据 / 静态 JSON（开发期 sandbox）

## 跟原版 amis chart 差异

- 原版 `amis` 只有通用 `chart` type（包 echarts）
- ZC 拆出独立 `report-forms` 套件 + 每种图表独立 plugin（更细颗粒度配置）
- ZC 报表配置面板有专属 ReportFormsConfig 渲染器（编辑器侧）

## 已知限制

- sandbox 环境的 `app://` 协议不通，需要 mock 数据 fallback
- 部分图表依赖 ZC 私有图表库，优先用通用 bar/line/pie 等基础图表
"""


def write_report_forms_reference() -> None:
    """手写 ReportForms 整体套件描述，不展开 125 个文件。"""
    out = OUT_DIR / "report-forms.md"
    out.write_text(REPORT_FORMS_REFERENCE, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    parser = ZcPluginParser()

    print("=== 阶段 B.3 batch importer (amis-editor/plugin/) ===")
    print()

    print("[1/3] 跑 P0 全新 plugin (NEW_PLUGINS)...")
    new_stats = _run_plugin_files(parser, NEW_PLUGINS, category="new")
    print(f"  ok={len(new_stats['ok'])} skip={len(new_stats['skip'])} miss={len(new_stats['miss'])}")
    for line in new_stats["ok"]:
        print(f"    ✓ {line}")
    for rel in new_stats["skip"]:
        print(f"    ⚠ skip (no rendererName): {rel}")
    for rel in new_stats["miss"]:
        print(f"    ✗ missing file: {rel}")
    print()

    print("[2/3] 跑 P0 改造 plugin (PATCHED_PLUGINS)...")
    patched_stats = _run_plugin_files(parser, PATCHED_PLUGINS, category="patched")
    print(f"  ok={len(patched_stats['ok'])} skip={len(patched_stats['skip'])} miss={len(patched_stats['miss'])}")
    for line in patched_stats["ok"]:
        print(f"    ✓ {line}")
    for rel in patched_stats["skip"]:
        print(f"    ⚠ skip (no rendererName): {rel}")
    print()

    print("[3/3] 手写 ReportForms 套件描述...")
    write_report_forms_reference()
    print("  ✓ report-forms.md")
    print()

    total = len(new_stats["ok"]) + len(patched_stats["ok"]) + 1
    print(f"=== 完成：{total} 个 references 落到 {OUT_DIR}/ ===")
    print(f"目录文件数: {len(list(OUT_DIR.glob('*.md')))}")


if __name__ == "__main__":
    main()
