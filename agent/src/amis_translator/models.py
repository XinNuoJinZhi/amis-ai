"""翻译器数据模型。"""
from typing import Any, Optional

from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    """翻译请求。

    amis_json 顶层一般是 type=page；但如果直接传一个 form/crud 等子组件也容错。
    """

    amis_json: Any = Field(..., description="Amis JSON schema（顶层 dict）")
    ui_lib: str = Field("wot", description="目标 UI 库：wot / element-plus / ...")
    tech_stack: str = Field("uniapp", description="目标技术栈：uniapp / react / vue3")
    platform: str = Field("mobile", description="目标平台：mobile / web")
    current_pages_json: Optional[dict] = Field(
        None,
        description="沙箱当前 src/pages.json 内容；翻译 page 时会基于它做 patch（追加 pages 数组项）",
    )


class TranslateResult(BaseModel):
    """翻译结果。

    - success: 调用本身成功（不代表翻译完整）
    - fully_supported: 翻译器**完整 cover** 了 amis_json，backend 可直接用结果跳过 LLM
    - files: 路径 → 内容；路径相对于沙箱工作目录（如 src/pages/login/login.vue）
    - unsupported_types: 翻译过程中遇到的不支持的 Amis type 列表（用于上报）
    - notes: 翻译器的提示/警告（人类可读）
    """

    success: bool
    fully_supported: bool
    files: dict[str, str] = Field(default_factory=dict)
    unsupported_types: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
