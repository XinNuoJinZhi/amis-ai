"""Amis JSON 关键字提取器 — B.1 双路 RAG 召回的精确侧。

设计要点：
    - 递归遍历 amis JSON，收集所有 `type` / `subType` 字段值（小写规范化）
    - 同时提取 `api.url` / `api.method` 等协议特征：`app://api/user.list` → `app:api/user.list`
    - 输出 text[] 数组，写入 code_samples.keyword_index 列（GIN 索引）
    - 召回时用 `keyword_index && query_keywords` 做精确召回（与向量检索并跑后 RRF 融合）

为什么不放向量里跑？
    - 组件 type 命中是"全黑或全白"信号，cos_sim 会被句法相似但组件错配的样本淹没
    - 例如：把 `user-select`（ZC 二开）和 `select`（原版 amis）混淆 —— cos_sim 0.92 但实际不是同一个东西
"""

from __future__ import annotations

import json
import re
from typing import Any, Iterable, List, Set


# 不收录的通用 type 值（噪声太多，去掉提升精确度）
_NOISE_TYPES: Set[str] = {
    "page",
    "service",
    "wrapper",
    "container",
    "grid",
    "flex",
    "tpl",
    "html",
    "static",
    "plain",
    "hbox",
    "vbox",
    "panel",
}

# 不收录的通用 subType 值
_NOISE_SUBTYPES: Set[str] = {
    "default",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "danger",
}

_API_URL_KEYS = ("url", "endpoint")
_PROTOCOL_RE = re.compile(r"^([a-z]+):/?/?", re.IGNORECASE)


def _normalize_token(s: str) -> str:
    """统一小写 + 去前后空白；保留 a-z0-9-_:."""
    s = s.strip().lower()
    # 把多余空白合并成单个 -
    s = re.sub(r"\s+", "-", s)
    # 仅保留可读字符
    s = re.sub(r"[^a-z0-9\-_:./@]", "", s)
    return s


def _extract_api_token(api: Any) -> Iterable[str]:
    """从 api 配置提取协议 + 路径关键字。

    支持两种形态：
        - 字符串："app://api/user.list" → ["api:app", "api-path:api/user.list"]
        - 对象：{"url": "...", "method": "GET"} → 同上 + ["api-method:get"]
    """
    if not api:
        return
    if isinstance(api, str):
        url = api
        method: str | None = None
    elif isinstance(api, dict):
        url = next(
            (api.get(k) for k in _API_URL_KEYS if isinstance(api.get(k), str)),
            None,
        )
        method_val = api.get("method")
        method = method_val.lower() if isinstance(method_val, str) else None
    else:
        return

    if url and isinstance(url, str):
        m = _PROTOCOL_RE.match(url)
        if m:
            yield f"api:{m.group(1).lower()}"
            # 去掉协议头后的路径
            path = url[m.end():].strip("/")
        else:
            path = url.strip("/")
        if path:
            # 路径只取前 2 段，避免 ID 等高基数尾巴污染
            segs = [seg for seg in path.split("/")[:2] if seg]
            if segs:
                yield f"api-path:{'/'.join(segs)}"

    if method:
        yield f"api-method:{method}"


def _walk(node: Any, bag: Set[str]) -> None:
    """递归遍历 amis JSON 树，把命中字段塞进 bag。"""
    if isinstance(node, dict):
        # type / subType
        t = node.get("type")
        if isinstance(t, str):
            tok = _normalize_token(t)
            if tok and tok not in _NOISE_TYPES:
                bag.add(f"type:{tok}")
        st = node.get("subType")
        if isinstance(st, str):
            stok = _normalize_token(st)
            if stok and stok not in _NOISE_SUBTYPES:
                bag.add(f"subtype:{stok}")
        # api 配置（amis 的 crud / form / service 都用 api 字段）
        for api_key in ("api", "initApi", "schemaApi", "quickSaveApi", "deleteApi"):
            if api_key in node:
                for tok in _extract_api_token(node[api_key]):
                    bag.add(tok)
        # 递归
        for v in node.values():
            _walk(v, bag)
    elif isinstance(node, list):
        for item in node:
            _walk(item, bag)


def extract_amis_keywords(amis_json: str | dict | list | None, *, limit: int = 64) -> List[str]:
    """从 amis JSON 提取关键字列表，供 keyword_index 入库 / 召回。

    Args:
        amis_json: amis JSON 字符串 / 已 parse 的 dict / list；None 或解析失败返回 []
        limit: 上限（防超长 schema 产出爆炸 keyword 集）；默认 64 足够覆盖 95% 多页项目

    Returns:
        去重后的小写 token 列表，例：
            ["type:crud", "type:form", "type:user-select",
             "api:app", "api-path:api/user", "api-method:get"]
    """
    if amis_json is None:
        return []

    if isinstance(amis_json, str):
        try:
            parsed = json.loads(amis_json)
        except (json.JSONDecodeError, ValueError):
            return []
    else:
        parsed = amis_json

    bag: Set[str] = set()
    _walk(parsed, bag)

    # 截断 + 排序保证幂等
    tokens = sorted(bag)
    return tokens[:limit]
