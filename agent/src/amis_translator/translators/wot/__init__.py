"""Wot UI（uniapp + wot-design-uni）翻译器。

入口：translate_root —— 接顶层 Amis schema，按 type 分发到具体翻译器。
"""
from typing import Any, Optional

from ...models import TranslateResult
from .page import translate_page


def translate_root(amis_json: Any, current_pages_json: Optional[dict] = None) -> TranslateResult:
    """根入口：根据 Amis 顶层 type 分发。

    - type=page → 完整页面翻译，输出 .vue + 修改后的 pages.json
    - type=form 直接传入 → 包一个隐式 page wrapper（容错老调用方）
    - 其他 type 顶层暂不支持（阶段 B 再扩）
    """
    if not isinstance(amis_json, dict):
        return TranslateResult(
            success=True,
            fully_supported=False,
            notes=["amis_json 顶层必须是 object（含 type 字段）"],
        )

    t = amis_json.get("type", "")

    if t == "page":
        return translate_page(amis_json, current_pages_json)

    if t == "form":
        # 隐式 page 包装：方便容忍调用方直接扔 form schema
        wrapper = {
            "type": "page",
            "title": amis_json.get("title", "表单"),
            "body": amis_json,
        }
        return translate_page(wrapper, current_pages_json)

    return TranslateResult(
        success=True,
        fully_supported=False,
        unsupported_types=[t or "<missing-type>"],
        notes=[f"顶层 type={t!r} 暂不支持，回退 LLM 兜底"],
    )
