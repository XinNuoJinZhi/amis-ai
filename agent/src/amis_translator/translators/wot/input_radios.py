"""Amis radios → wd-radio-group + wd-radio。"""
import json
from typing import Optional


def _normalize_options(opts) -> list[dict]:
    """Amis 的 options 兼容多种形态：
    - [{label, value}, ...]
    - [{text, value}, ...]
    - ["foo", "bar"] → 自动 label=value=foo
    """
    out: list[dict] = []
    if not isinstance(opts, list):
        return out
    for item in opts:
        if isinstance(item, str):
            out.append({"label": item, "value": item})
        elif isinstance(item, dict):
            label = item.get("label") or item.get("text") or item.get("value") or ""
            value = item.get("value") if "value" in item else label
            out.append({"label": str(label), "value": value})
    return out


def translate_radios(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)
    options = _normalize_options(field.get("options"))

    if not options:
        # 没 options 用空 group 也无意义；交给 LLM 兜底
        return {
            "name": name,
            "template": "",
            "rule": None,
            "default": '""',
            "__unsupported__": "radios-without-options",
        }

    # HTML attribute 用单引号外壳，里面放 JSON 双引号——Vue 把它当 JS 字面量解析。
    # 例：value="M" → :value='"M"' → Vue 解析为字符串 "M"。
    radios_html = "\n".join(
        f"          <wd-radio :value='{json.dumps(o['value'], ensure_ascii=False)}'>{o['label']}</wd-radio>"
        for o in options
    )
    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-radio-group v-model="form.{name}">\n'
        f"{radios_html}\n"
        '        </wd-radio-group>\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请选择{label}" }}]'

    # 默认值：取 field.value 或第一个 option 的 value
    raw_default = field.get("value") if "value" in field else options[0]["value"]
    default = json.dumps(raw_default, ensure_ascii=False)

    return {"name": name, "template": template, "rule": rule, "default": default}
