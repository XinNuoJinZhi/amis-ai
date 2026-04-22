"""内部 API — 供 Rust 服务调用，不对外暴露"""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..config import INTERNAL_API_KEY
from ..services.llm_client import clear_config_cache
from ..services.embedding import get_embedding
from ..services.rag import (
    index_template,
    index_code_sample,
    search_code_samples,
    increment_code_sample_hits,
)

router = APIRouter()


def _check_internal_auth(x_internal_key: str) -> None:
    """统一鉴权：所有 /internal/* 接口仅 X-Internal-Key 匹配的服务可调"""
    if x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="forbidden")


class IndexRequest(BaseModel):
    template_id: int
    title: str
    description: str
    amis_json: str


@router.post("/internal/index")
async def index_adopted_template(
    request: IndexRequest,
    x_internal_key: str = Header(default=""),
):
    """将采纳的模板向量化并写入 embedding"""
    if x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="forbidden")

    success = await index_template(
        template_id=request.template_id,
        title=request.title,
        description=request.description,
        amis_json=request.amis_json,
    )

    if success:
        return {"status": "ok", "message": f"模板 {request.template_id} 已向量化入库"}
    else:
        return {"status": "error", "message": "向量化失败"}


@router.post("/internal/cache/clear")
async def clear_llm_cache(
    x_internal_key: str = Header(default=""),
):
    """清除 LLM 配置缓存（后台模型配置变更时调用）"""
    _check_internal_auth(x_internal_key)

    count = clear_config_cache()
    return {"status": "ok", "cleared": count}


# ────────────────────────── B.2: 反向飞轮 RAG 样例库接口 ──────────────────────────

class IndexCodeSampleRequest(BaseModel):
    """backend 已经 INSERT 一条 code_samples 行（status=pending），
    把 sample_id 和已经准备好的 summary_text 传过来做向量化。"""
    sample_id: int
    summary_text: str


@router.post("/internal/index-code-sample")
async def index_code_sample_endpoint(
    request: IndexCodeSampleRequest,
    x_internal_key: str = Header(default=""),
):
    """把 code_samples.summary 向量化并写回 embedding 列。"""
    _check_internal_auth(x_internal_key)
    success = await index_code_sample(
        sample_id=request.sample_id,
        summary_text=request.summary_text,
    )
    if success:
        return {"status": "ok", "message": f"code_sample {request.sample_id} 已向量化"}
    return {"status": "error", "message": "向量化失败（详见 agent 日志）"}


class SearchCodeSamplesRequest(BaseModel):
    """B.5 任务创建时调：按 tech_stack + query_text 检索 Top-K approved 样例。
    only_approved=False 仅审核界面预览用，生产飞轮永远 True。"""
    tech_stack: str
    query_text: str
    top_k: int = 3
    only_approved: bool = True
    # 是否累加 hit_count（仅生产检索时 True；预览/审核时 False）
    increment_hits: bool = True


@router.post("/internal/probe-embedding-dim")
async def probe_embedding_dim(
    x_internal_key: str = Header(default=""),
):
    """探测当前 embedding 模型实际输出的向量维度。
    backend 可用它和 pgvector 列维度对比，提示用户是否兼容。"""
    _check_internal_auth(x_internal_key)
    try:
        vec = await get_embedding("ping")
        return {"ok": True, "dim": len(vec), "sample_text": "ping"}
    except Exception as e:
        return {"ok": False, "dim": None, "error": str(e)}


@router.post("/internal/search-code-samples")
async def search_code_samples_endpoint(
    request: SearchCodeSamplesRequest,
    x_internal_key: str = Header(default=""),
):
    """检索 Top-K 同栈相似样例。"""
    _check_internal_auth(x_internal_key)
    results = await search_code_samples(
        tech_stack=request.tech_stack,
        query_text=request.query_text,
        top_k=request.top_k,
        only_approved=request.only_approved,
    )
    if request.increment_hits and results:
        await increment_code_sample_hits([r["id"] for r in results])
    return {"results": results, "count": len(results)}
