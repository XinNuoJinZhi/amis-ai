"""Amis checkbox（单数，boolean 单选）→ wd-checkbox。

Amis 同时存在两个相关 type：
- `checkbox`（单数）：单个布尔开关，效果上等同于 switch（"勾选/未勾选"）
- `checkboxes`（复数）：多选数组，对应 wd-checkbox-group + 多个 wd-checkbox

本翻译器处理单数 checkbox。Amis schema 形态示例：
    {"type": "checkbox", "name": "agree", "option": "我同意《用户协议》"}

输出 wd-checkbox 单个的"行式"布局（标签在左、控件在右），跟 switch 同骨架。
"""
from typing import Optional


def translate_checkbox(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)
    # Amis checkbox 的"勾选项文本"放在 option / trueText / 没有时退到 label
    option_text = str(field.get("option") or field.get("trueText") or label)

    template = (
        '<view class="form-field-row">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-checkbox v-model="form.{name}">{option_text}</wd-checkbox>\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        # 单选 checkbox 的 required 校验：必须为 true
        rule = (
            f'{name}: [{{ '
            f'validator: (_: any, v: any) => v === true, '
            f'message: "请勾选{label}" '
            f'}}]'
        )

    default_val = field.get("value")
    default = "true" if default_val is True else "false"

    return {"name": name, "template": template, "rule": rule, "default": default}
