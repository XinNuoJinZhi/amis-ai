"""amis_translator 模块。

把 Amis JSON schema 确定性地翻译成对应技术栈的 .vue / 配置代码，
跳过 LLM。详见 docs/architecture/amis-translator-pipeline.md。
"""
from .models import TranslateRequest, TranslateResult
from .pipeline import translate

__all__ = ["TranslateRequest", "TranslateResult", "translate"]
