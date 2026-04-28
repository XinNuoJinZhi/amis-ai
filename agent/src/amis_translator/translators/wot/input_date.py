"""Amis date / datetime → wd-datetime-picker。"""
import json
from typing import Optional


# Amis type → wd-datetime-picker 的 type 字段
TYPE_MAP = {
    "date": "date",
    "datetime": "datetime",
    "time": "time",
    "year": "year-month",  # 退化
    "input-date": "date",
    "input-datetime": "datetime",
    "input-time": "time",
}


def translate_date(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)
    placeholder = str(field.get("placeholder") or f"请选择{label}")
    amis_type = str(field.get("type", "date"))
    picker_type = TYPE_MAP.get(amis_type, "date")

    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-datetime-picker\n'
        f'          v-model="form.{name}"\n'
        f'          type="{picker_type}"\n'
        f'          placeholder="{placeholder}"\n'
        '        />\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请选择{label}" }}]'

    raw_default = field.get("value") if "value" in field else ""
    default = json.dumps(raw_default, ensure_ascii=False)

    return {"name": name, "template": template, "rule": rule, "default": default}
