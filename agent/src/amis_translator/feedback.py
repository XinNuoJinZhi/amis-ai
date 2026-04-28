"""翻译器反馈 hook —— 阶段 C 骨架。

定位：用户「采纳」一个走了翻译器路径的任务时，把
- 翻译器最初输出的 files
- 用户在沙箱里手动修改 / 调整后的最终 files
- 原始 amis_json
打包记录下来，作为**未来**自动学习新翻译规则的输入。

当前阶段：**仅做归档**（写到磁盘 + DB），不做实际的规则推导。
未来工作（不在本 sprint）：
- 离线 batch job 比对 original vs final，提取规则差异
- 把高频差异沉淀回 translators/wot/*.py（可能需要人工 review）
- 形成"翻译器自演化"的真正闭环

API 契约：见 docs/architecture/amis-translator-pipeline.md「飞轮闭环」章节。
"""
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


FEEDBACK_DIR = Path(os.environ.get("TRANSLATOR_FEEDBACK_DIR", "/tmp/amis-translator-feedback"))


class TranslatorFeedback(BaseModel):
    """采纳后反馈给翻译器的全套信息。"""

    task_id: int = Field(..., description="amis-ai 任务 ID")
    amis_json: Any = Field(..., description="原始 Amis JSON schema")
    ui_lib: str = Field(..., description="目标 UI 库")
    tech_stack: str = Field(..., description="目标技术栈")
    platform: str = Field(..., description="目标平台")
    original_files: dict[str, str] = Field(
        default_factory=dict,
        description="翻译器最初输出的 files（path → content）",
    )
    final_files: dict[str, str] = Field(
        default_factory=dict,
        description="用户采纳时沙箱里的 final files；比 original_files 多/少/改的部分就是规则差异",
    )
    notes: Optional[str] = Field(None, description="采纳人的备注（可选）")


def archive(feedback: TranslatorFeedback) -> Path:
    """归档反馈到磁盘。返回文件路径。

    文件名格式：`task-{task_id}-{epoch_ms}.json`
    存储位置：env `TRANSLATOR_FEEDBACK_DIR` 或默认 /tmp/amis-translator-feedback
    """
    FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    ts_ms = int(time.time() * 1000)
    path = FEEDBACK_DIR / f"task-{feedback.task_id}-{ts_ms}.json"
    path.write_text(
        json.dumps(feedback.model_dump(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    logger.info(
        "translator-feedback archived: task=%s files=%d → %s",
        feedback.task_id,
        len(feedback.final_files),
        path,
    )
    return path
