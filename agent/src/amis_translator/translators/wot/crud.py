"""Amis crud → 移动端列表页（wd-cell-group + 下拉刷新 + 上拉加载 + 空状态）。

Amis crud 一般有：
- api：拉数据的接口（GET）
- columns：列定义 [{name, label, type?}]
- bulkActions / itemActions：批量/单项操作（阶段 B 暂不翻译，仅生成可点击 cell）

输出形态符合现代移动端列表 UX：
- 每条数据用 wd-cell（is-link 自动右箭头）
- columns[0] → cell title
- columns[1] → cell label（副标题）
- 空状态：wd-status-tip
- 下拉刷新：onPullDownRefresh + uni.stopPullDownRefresh
- 上拉加载：onReachBottom + wd-loadmore
"""
from typing import Any

from .form import UNSUPPORTED_PREFIX, parse_amis_api


def translate_crud_body(crud_schema: dict, page_title: str) -> str:
    """翻译 type=crud 的 schema 成完整 Vue SFC 字符串。

    返回值：要么是 SFC 内容，要么是以 UNSUPPORTED_PREFIX 开头的错误标记。
    """
    api = crud_schema.get("api")
    if not api:
        return f"{UNSUPPORTED_PREFIX}crud-no-api"

    api_path, api_method = parse_amis_api(api)
    if api_method == "POST":
        # crud 拉数据按 Amis 默认是 GET（POST 也合法但少见）；保留原 method 即可
        pass

    columns: Any = crud_schema.get("columns", [])
    if not isinstance(columns, list) or not columns:
        return f"{UNSUPPORTED_PREFIX}crud-no-columns"

    # 取第 1 列做 title，第 2 列做 label（如果有）。剩下的列暂不渲染（移动端单行容量有限）。
    title_col = next(
        (c for c in columns if isinstance(c, dict) and c.get("name")),
        None,
    )
    if not title_col:
        return f"{UNSUPPORTED_PREFIX}crud-columns-missing-name"
    title_field = str(title_col["name"])

    label_col = next(
        (c for c in columns if isinstance(c, dict) and c.get("name") and c.get("name") != title_field),
        None,
    )
    label_field = str(label_col["name"]) if label_col else None

    # row key：优先 id，否则 index
    has_id_col = any(
        isinstance(c, dict) and c.get("name") == "id" for c in columns
    )
    item_key = "item.id" if has_id_col else "index"
    v_for = (
        '(item, index) in list' if not has_id_col else 'item in list'
    )

    # cell 属性：title / label / is-link
    cell_attrs = [f':title="item.{title_field}"']
    if label_field:
        cell_attrs.append(f':label="item.{label_field}"')
    cell_attrs.append("is-link")

    cell_html = (
        f'      <wd-cell\n'
        f'        v-for="{v_for}"\n'
        f'        :key="{item_key}"\n'
        f'        ' + "\n        ".join(cell_attrs) + "\n"
        f'      />'
    )

    return _CRUD_SFC.format(
        page_title=page_title,
        api_path=api_path,
        cell_html=cell_html,
    )


_CRUD_SFC = '''<template>
  <view class="page">
    <wd-cell-group v-if="list.length > 0" border>
{cell_html}
    </wd-cell-group>

    <wd-status-tip v-else-if="!loading" image="content" tip="还没有数据" />

    <wd-loadmore v-if="list.length > 0" :state="loadMoreState" />
  </view>
</template>

<script setup lang="ts">
/// <reference types="@dcloudio/types" />
import {{ ref, onMounted }} from 'vue'
import {{ onPullDownRefresh, onReachBottom }} from '@dcloudio/uni-app'

const list = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const loadMoreState = ref<'loading' | 'finished' | 'error'>('loading')

const fetchPage = async (reset = false) => {{
  if (loading.value) return
  loading.value = true
  try {{
    const res: any = await new Promise((resolve, reject) => {{
      uni.request({{
        url: '{api_path}',
        method: 'GET',
        data: {{ page: page.value, perPage: pageSize.value }},
        success: (r) => resolve(r),
        fail: (e) => reject(e),
      }})
    }})
    // Amis 标准响应：{{ status, msg, data: {{ items, total }} }}；同时兼容直接返回 items 数组
    const payload = res?.data?.data ?? res?.data
    const items: any[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : []
    if (reset) list.value = items
    else list.value.push(...items)
    loadMoreState.value = items.length < pageSize.value ? 'finished' : 'loading'
  }} catch (e: any) {{
    loadMoreState.value = 'error'
    uni.showToast({{ title: e?.errMsg || e?.message || '加载失败', icon: 'none' }})
  }} finally {{
    loading.value = false
    uni.stopPullDownRefresh()
  }}
}}

const refresh = () => {{
  page.value = 1
  fetchPage(true)
}}

const loadMore = () => {{
  if (loadMoreState.value !== 'loading') return
  page.value += 1
  fetchPage(false)
}}

onMounted(refresh)
onPullDownRefresh(refresh)
onReachBottom(loadMore)
</script>

<style lang="scss" scoped>
.page {{
  min-height: 100vh;
  background: #f7f8fa;
}}
</style>
'''
