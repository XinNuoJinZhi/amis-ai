"""Amis textarea → wd-textarea。"""
from typing import Optional


def translate_textarea(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)
    placeholder = str(field.get("placeholder") or f"请输入{label}")
    rows = int(field.get("minRows") or field.get("rows") or 4)
    maxlength = field.get("maxLength")

    attrs = [
        f'v-model="form.{name}"',
        f'placeholder="{placeholder}"',
        f':rows="{rows}"',
    ]
    if maxlength:
        attrs.append(f':maxlength="{maxlength}"')
        attrs.append("show-word-limit")

    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-textarea {" ".join(attrs)} />\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请输入{label}" }}]'

    return {"name": name, "template": template, "rule": rule, "default": '""'}
