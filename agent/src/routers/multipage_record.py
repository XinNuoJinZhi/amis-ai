"""1.2.0 多页任务完成后回写 RAG 端点"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from ..knowledge.multipage_recorder import record_multipage_outcome
from ..services.db import get_pool

router = APIRouter()


class PagePayload(BaseModel):
    route_path: str
    amis_json: str
    full_code: str = ""


class RecordRequest(BaseModel):
    task_id: int
    execution_strategy: str
    reuse_strategy: str | None = None
    page_count: int
    reuse_rate: float
    pages: list[PagePayload]
    extra_tags: list[str] | None = None


class RecordResponse(BaseModel):
    sample_id: int


@router.post("/multipage/record", response_model=RecordResponse)
async def post_record(req: RecordRequest) -> RecordResponse:
    pool = await get_pool()
    sample_id = await record_multipage_outcome(
        pool,
        req.task_id,
        req.execution_strategy,
        req.reuse_strategy,
        req.page_count,
        [p.model_dump() for p in req.pages],
        req.reuse_rate,
        req.extra_tags,
    )
    return RecordResponse(sample_id=sample_id)
