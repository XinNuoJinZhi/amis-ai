"""路由路径推断：给一段 amis JSON 推断 UniApp 合理路由路径。"""
from __future__ import annotations
import re

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.llm_client import chat_completion

router = APIRouter()

_VALID_PATH_RE = re.compile(r"^/[a-z0-9]+(?:[-/][a-z0-9]+)*$")


class InferRouteRequest(BaseModel):
    amis_json: str
    fallback_idx: int = 0


class InferRouteResponse(BaseModel):
    route_path: str


_SYSTEM_PROMPT = """你是 UniApp 路由设计助手。给一段 amis JSON，推断一个合理的 UniApp 路由路径。

规则：
- 路径以 / 开头
- 全小写 kebab-case
- 反映页面用途（crud→/<resource>/list、form→/<resource>/edit、dashboard→/dashboard 等）
- 不要尾 slash
- 直接输出路径文本，不要解释，不要 markdown 包裹

示例：
- {"type":"crud","title":"用户列表"} → /users/list
- {"type":"form","api":"/api/order/create"} → /orders/create
- {"type":"page","title":"仪表盘"} → /dashboard
"""


def _clean_path(raw: str, fallback_idx: int) -> str:
    """清洗 LLM 输出。失败回退 /pageN。"""
    s = raw.strip().splitlines()[0].strip().rstrip("/")
    if not s.startswith("/"):
        s = "/" + s
    if not _VALID_PATH_RE.match(s):
        return f"/page{fallback_idx}"
    return s


async def infer_route_path(amis_json: str, fallback_idx: int = 0) -> str:
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": amis_json[:2000]},
    ]
    try:
        result = await chat_completion("generation", messages, stream=False)
        raw = result["choices"][0]["message"]["content"]
        return _clean_path(raw, fallback_idx)
    except Exception as e:
        print(f"[route-infer] LLM 调用失败：{e}")
        return f"/page{fallback_idx}"


@router.post("/route-infer", response_model=InferRouteResponse)
async def post_infer_route(req: InferRouteRequest) -> InferRouteResponse:
    path = await infer_route_path(req.amis_json, req.fallback_idx)
    return InferRouteResponse(route_path=path)
