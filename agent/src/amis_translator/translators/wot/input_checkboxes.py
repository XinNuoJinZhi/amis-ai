"""Amis checkboxes → wd-checkbox-group + wd-checkbox。"""
import json
from typing import Optional

from .input_radios import _normalize_options


def translate_checkboxes(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)
    options = _normalize_options(field.get("options"))

    if not options:
        return {
            "name": name,
            "template": "",
            "rule": None,
            "default": "[]",
            "__unsupported__": "checkboxes-without-options",
        }

    # 单引号外壳：见 input_radios.py 的注释。
    checkboxes_html = "\n".join(
        f"          <wd-checkbox :value='{json.dumps(o['value'], ensure_ascii=False)}'>{o['label']}</wd-checkbox>"
        for o in options
    )
    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-checkbox-group v-model="form.{name}">\n'
        f"{checkboxes_html}\n"
        '        </wd-checkbox-group>\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请勾选{label}" }}]'

    # 默认数组
    raw_default = field.get("value") if isinstance(field.get("value"), list) else []
    default = json.dumps(raw_default, ensure_ascii=False)

    return {"name": name, "template": template, "rule": rule, "default": default}
