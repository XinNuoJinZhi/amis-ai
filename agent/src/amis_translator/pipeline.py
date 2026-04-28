"""翻译器主入口：根据 ui_lib + tech_stack 分发到对应的子模块。"""
from .models import TranslateRequest, TranslateResult


def translate(req: TranslateRequest) -> TranslateResult:
    """把 Amis JSON 翻译成目标栈的代码。

    - tech_stack=uniapp + ui_lib=wot → 走 translators/wot
    - 其他组合：当前阶段 A 暂不支持，返回 fully_supported=False 让 LLM 兜底
    """
    if req.tech_stack == "uniapp" and req.ui_lib == "wot":
        from .translators.wot import translate_root

        return translate_root(req.amis_json, current_pages_json=req.current_pages_json)

    return TranslateResult(
        success=True,
        fully_supported=False,
        files={},
        unsupported_types=[],
        notes=[
            f"翻译器目前只支持 tech_stack=uniapp + ui_lib=wot，"
            f"当前组合 {req.tech_stack}/{req.ui_lib} 未实现，回退 LLM"
        ],
    )
