"""Amis form → wd-form + form-field 列表 + 主按钮 完整 SFC 翻译。

形态：现代移动端表单（标签在上、输入在下、单列堆叠）。
设计哲学：参见 _common/SKILL.md「翻译器宪法」—— Amis 没声明的功能不要凭空加。
"""
from typing import Any

from .input_checkbox import translate_checkbox
from .input_checkboxes import translate_checkboxes
from .input_date import translate_date
from .input_number import translate_input_number
from .input_password import translate_input_password
from .input_radios import translate_radios
from .input_select import translate_select
from .input_switch import translate_switch
from .input_text import translate_input_text
from .input_textarea import translate_textarea

# Amis field type → 字段翻译器
INPUT_HANDLERS = {
    "input-text": translate_input_text,
    "input-password": translate_input_password,
    "input-number": translate_input_number,
    "textarea": translate_textarea,
    "switch": translate_switch,
    "radios": translate_radios,
    "checkbox": translate_checkbox,
    "checkboxes": translate_checkboxes,
    "select": translate_select,
    "picker": translate_select,
    # 日期/时间多别名
    "date": translate_date,
    "datetime": translate_date,
    "time": translate_date,
    "input-date": translate_date,
    "input-datetime": translate_date,
    "input-time": translate_date,
}


# 表示翻译失败但又要把信息传给上层的"哨兵"前缀
UNSUPPORTED_PREFIX = "__UNSUPPORTED__:"


def parse_amis_api(api: Any) -> tuple[str, str]:
    """解析 Amis 的 api 字段。

    支持的形态：
    - "POST:/api/login"  → ("/api/login", "POST")
    - "/api/login"       → ("/api/login", "POST")  默认 POST
    - {"method": "POST", "url": "/api/login"} → 同上
    - 缺失或无效 → ("", "POST")
    """
    if isinstance(api, str):
        s = api.strip()
        if not s:
            return "", "POST"
        if ":" in s and not s.startswith(("http://", "https://")):
            method, _, path = s.partition(":")
            return path.strip(), method.strip().upper() or "POST"
        return s, "POST"

    if isinstance(api, dict):
        url = str(api.get("url", "") or "").strip()
        method = str(api.get("method", "POST") or "POST").strip().upper()
        return url, method

    return "", "POST"


def translate_form_body(form_schema: dict, page_title: str) -> str:
    """翻译一个 type=form 的 schema 成完整 Vue SFC 字符串。

    返回值：要么是 SFC 内容，要么是以 UNSUPPORTED_PREFIX 开头的错误标记
    （上层据此回退 LLM）。
    """
    fields = form_schema.get("body", [])
    if not isinstance(fields, list):
        return f"{UNSUPPORTED_PREFIX}form.body-not-array"

    template_parts: list[str] = []
    rules_parts: list[str] = []
    form_inits: list[str] = []  # 'username: ""'
    setup_extras: list[str] = []  # select 等用到的额外 reactive

    for field in fields:
        if not isinstance(field, dict):
            continue
        ftype = field.get("type", "")
        handler = INPUT_HANDLERS.get(ftype)
        if not handler:
            return f"{UNSUPPORTED_PREFIX}{ftype}"

        chunk = handler(field)
        # handler 内部可能因 options 缺失等原因哨兵告退
        if chunk.get("__unsupported__"):
            return f"{UNSUPPORTED_PREFIX}{chunk['__unsupported__']}"

        template_parts.append(chunk["template"])
        if chunk.get("rule"):
            rules_parts.append(chunk["rule"])
        form_inits.append(f'{chunk["name"]}: {chunk["default"]}')
        if chunk.get("setup_extra"):
            setup_extras.append(chunk["setup_extra"])

    submit_text = str(form_schema.get("submitText") or "提交")
    api_path, api_method = parse_amis_api(form_schema.get("api"))

    template_inputs_block = "\n".join("      " + p for p in template_parts)
    rules_block = ",\n  ".join(rules_parts)
    form_init_block = ", ".join(form_inits)
    setup_extra_block = "\n".join(setup_extras)
    if setup_extra_block:
        setup_extra_block = "\n" + setup_extra_block

    redirect = str(form_schema.get("redirect") or "").strip()
    redirect_block = (
        f"\n      // Amis schema 声明了 redirect，提交成功后跳转\n"
        f'      uni.reLaunch({{ url: \'{redirect}\' }})'
        if redirect
        else ""
    )

    return _SFC_TEMPLATE.format(
        page_title=page_title,
        template_inputs=template_inputs_block,
        submit_text=submit_text,
        rules=rules_block,
        form_init=form_init_block,
        setup_extra=setup_extra_block,
        api_path=api_path,
        api_method=api_method,
        redirect_block=redirect_block,
    )


_SFC_TEMPLATE = '''<template>
  <view class="page">
    <wd-form ref="formRef" :model="form" :rules="rules">
{template_inputs}
      <view class="actions">
        <wd-button type="primary" size="large" block :loading="loading" @click="submit">
          {submit_text}
        </wd-button>
      </view>
    </wd-form>
  </view>
</template>

<script setup lang="ts">
/// <reference types="@dcloudio/types" />
import {{ ref, reactive }} from 'vue'

const formRef = ref()
const loading = ref(false)
const form = reactive({{ {form_init} }})
const rules = {{
  {rules}
}}{setup_extra}

const submit = async () => {{
  try {{ await formRef.value.validate() }} catch {{ return }}
  loading.value = true
  try {{
    const res: any = await new Promise((resolve, reject) => {{
      uni.request({{
        url: '{api_path}',
        method: '{api_method}',
        data: form,
        success: (r) => resolve(r),
        fail: (e) => reject(e),
      }})
    }})
    if (res?.statusCode >= 200 && res?.statusCode < 300) {{
      uni.showToast({{ title: '提交成功', icon: 'success' }}){redirect_block}
    }} else {{
      uni.showToast({{ title: res?.data?.msg || '提交失败', icon: 'none' }})
    }}
  }} catch (e: any) {{
    uni.showToast({{ title: e?.errMsg || e?.message || '提交失败', icon: 'none' }})
  }} finally {{
    loading.value = false
  }}
}}
</script>

<style lang="scss" scoped>
.page {{
  min-height: 100vh;
  background: #ffffff;
  padding: 48rpx 32rpx;
  box-sizing: border-box;
}}
/* 标签在上、输入在下：现代移动端表单标准形态 */
.form-field {{
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
}}
/* 标签在左、控件在右的"行式"布局：用于 switch 等小开关，避免标签换行浪费空间 */
.form-field-row {{
  margin-bottom: 32rpx;
  padding: 16rpx 4rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}}
.form-field-row .form-label {{
  margin-bottom: 0;
}}
.form-label {{
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 16rpx;
  padding: 0 4rpx;
}}
.actions {{
  margin-top: 48rpx;
}}
</style>
'''
