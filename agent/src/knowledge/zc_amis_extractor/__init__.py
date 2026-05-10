"""ZC Amis 二开组件抽取器：把 ZC fork 源码 (.tsx) 转成 skills/zc-amis-schema/references/*.md。

工作分工：
- plugin_parser.py：抽 amis-editor/plugin/*.tsx 的 plugin class 字段
  （rendererName / name / description / tags / scaffold / events 等）
- interface_parser.py：抽 amis/src/renderers/*.tsx 的 export interface XxxSchema 类型定义
  （复用 1.1 的 amis_types_extractor.ts 思路，Python 版用 regex 抽 JSDoc + 字段类型）
- patch_summarizer.py（待写）：对 ZC 改造的原版组件，diff vs baidu/amis 6.8.0 生成 patch 说明
- importer.py（待写）：跑全量 121 个 .tsx → references/*.md 落盘

详见 docs/zc-amis-diff-report.md。
"""
from .plugin_parser import ZcPluginParser, to_markdown

__all__ = ["ZcPluginParser", "to_markdown"]
