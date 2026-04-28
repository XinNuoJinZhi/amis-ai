"""Amis button → wd-button 翻译。

主要在 form.py 里被复用（form 的 submitButton 也走这）；
顶层 type=button 暂不支持（阶段 A 不见单独 button schema）。
"""


def translate_button(schema: dict) -> str:
    """根据 Amis button schema 返回 wd-button 标签字符串。

    支持的字段：
    - label / 默认 "按钮"
    - level / theme：primary / default / success / warning / danger
    - block：是否满宽（默认 True，移动端主操作约定）
    - size：默认 large（移动端约定）
    """
    label = str(schema.get("label") or schema.get("text") or "按钮")
    btype = schema.get("level") or schema.get("theme") or "primary"
    block = schema.get("block", True)
    size = schema.get("size", "large")

    attrs = [f'type="{btype}"']
    if size:
        attrs.append(f'size="{size}"')
    if block:
        attrs.append("block")

    return f'<wd-button {" ".join(attrs)}>{label}</wd-button>'
