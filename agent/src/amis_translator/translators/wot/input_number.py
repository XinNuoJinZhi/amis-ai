"""Amis input-number → wd-input-number。"""
from typing import Optional


def translate_input_number(field: dict) -> dict:
    name = str(field.get("name", "field"))
    label = str(field.get("label") or name)
    min_v = field.get("min")
    max_v = field.get("max")
    step = field.get("step")
    precision = field.get("precision")

    attrs = [f'v-model="form.{name}"']
    if min_v is not None:
        attrs.append(f':min="{min_v}"')
    if max_v is not None:
        attrs.append(f':max="{max_v}"')
    if step is not None:
        attrs.append(f':step="{step}"')
    if precision is not None:
        attrs.append(f':precision="{precision}"')

    template = (
        '<view class="form-field">\n'
        f'        <text class="form-label">{label}</text>\n'
        f'        <wd-input-number {" ".join(attrs)} />\n'
        '      </view>'
    )

    rule: Optional[str] = None
    if field.get("required"):
        rule = f'{name}: [{{ required: true, message: "请输入{label}" }}]'

    default = "0"
    if isinstance(field.get("value"), (int, float)):
        default = str(field["value"])

    return {"name": name, "template": template, "rule": rule, "default": default}
