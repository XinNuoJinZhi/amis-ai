"""Amis switch → wd-switch。"""
from typing import Optional


def translate_switch(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)

    # switch 适合"标签在左、控件在右"的小行布局；保持 form-field 一致结构（标签在上）也可以
    template = (
        '<view class="form-field-row">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-switch v-model="form.{name}" />\n'
        '      </view>'
    )

    rule: Optional[str] = None  # switch 一般不需要 required 校验

    default_val = field.get("value")
    default = "true" if default_val is True else "false"

    return {"name": name, "template": template, "rule": rule, "default": default}
