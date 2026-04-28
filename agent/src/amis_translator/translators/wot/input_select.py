"""Amis select → wd-picker（移动端弹窗式选择器）。"""
import json
from typing import Optional

from .input_radios import _normalize_options


def translate_select(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)
    placeholder = str(field.get("placeholder") or f"请选择{label}")
    options = _normalize_options(field.get("options"))

    if not options:
        return {
            "name": name,
            "template": "",
            "rule": None,
            "default": '""',
            "__unsupported__": "select-without-options",
        }

    # wd-picker 需要 columns 数组（label/value），可在 setup 中预先 reactive 提供。
    # 但为了 SFC 自包含，这里直接 inline 静态 columns（多数业务场景 options 是固定的）。
    columns_literal = json.dumps(options, ensure_ascii=False)

    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-picker\n'
        f'          v-model="form.{name}"\n'
        f'          :columns="{name}_options"\n'
        f'          placeholder="{placeholder}"\n'
        '        />\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请选择{label}" }}]'

    # 把 columns 数据挂到 form 同名后缀；form_init 处由 form.py 收集
    # 这里把 options 写到 default 字段位置不合适——返回单独的 setup_extra
    raw_default = field.get("value") if "value" in field else ""
    default = json.dumps(raw_default, ensure_ascii=False)

    return {
        "name": name,
        "template": template,
        "rule": rule,
        "default": default,
        "setup_extra": f"const {name}_options = ref({columns_literal})",
    }
