"""Amis input-text → wd-input 包装在 form-field 里（标签在上、输入在下）。"""
from typing import Optional


def translate_input_text(field: dict) -> dict:
    """翻译一个 input-text 字段。返回 {name, template, rule, default}。

    - name: 字段名（reactive form 的 key）
    - template: 单字段的 <view class="form-field">…</view> 片段
    - rule: 该字段对应的 rules 数组项（"name: [...]"），无校验时返回 None
    - default: form reactive 初始值
    """
    name: str = str(field.get("name", "field"))
    label: str = str(field.get("label") or name)
    placeholder: str = str(field.get("placeholder") or f"请输入{label}")

    # template
    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-input v-model="form.{name}" placeholder="{placeholder}" clearable />\n'
        '      </view>'
    )

    # rule（按 Amis 的 required + validations 字段翻译；阶段 A 仅支持 required）
    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请输入{label}" }}]'

    return {
        "name": name,
        "template": template,
        "rule": rule,
        "default": '""',
    }
