"""Amis input-password → wd-input[type=password] 包装在 form-field 里。"""
from typing import Optional


def translate_input_password(field: dict) -> dict:
    """翻译一个 input-password 字段。返回 {name, template, rule, default}。"""
    name: str = str(field.get("name", "password"))
    label: str = str(field.get("label") or "密码")
    placeholder: str = str(field.get("placeholder") or "请输入密码")

    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-input v-model="form.{name}" type="password" placeholder="{placeholder}" show-password />\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请输入{label}" }}]'

    return {
        "name": name,
        "template": template,
        "rule": rule,
        "default": '""',
    }
