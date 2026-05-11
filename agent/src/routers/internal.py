"""内部 API — 供 Rust 服务调用，不对外暴露"""

import json as _json

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..amis_translator import TranslateRequest, translate
from ..amis_translator.feedback import TranslatorFeedback, archive as archive_feedback
from ..config import INTERNAL_API_KEY
from ..services.llm_client import chat_completion, clear_config_cache
from ..services.embedding import get_embedding
from ..services.rag import (
    index_template,
    index_code_sample,
    search_code_samples,
    search_negative_samples,
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
    """B.5 任务创建时调：检索 Top-K approved 样例。

    2026-04 起支持多维标签（platforms / tech_stacks / ui_libs），老 `tech_stack` 字段
    保留作兼容回退（当多维字段全空时走精确匹配）。

    only_approved=False 仅审核界面预览用，生产飞轮永远 True。
    """
    query_text: str
    # 2026-04 多维标签字段（数组，空数组 = 该维度不参与过滤）
    platforms: list[str] = []
    tech_stacks: list[str] = []
    ui_libs: list[str] = []
    # 兼容期：老客户端只传单字段的 tech_stack（对应 code_samples.tech_stack 单字符串列）
    tech_stack: str | None = None
    top_k: int = 3
    only_approved: bool = True
    # 是否累加 hit_count（仅生产检索时 True；预览/审核时 False）
    increment_hits: bool = True
    # 2026-04 质量闭环（Phase 0+）：可选过滤 + 加权开关
    exclude_tags: list[str] = []
    min_rating: float | None = None
    min_verdict: str | None = None          # "good" | "needs_review"
    weighting_enabled: bool = False
    thumbs_mode: str = "tiebreaker"          # off / tiebreaker / boost
    hit_count_enabled: bool = False
    # 1.4 B.1 双路召回：可选传当前任务的 amis_json 全文，Python 内部提关键字
    # 与样例 keyword_index 做精确召回（type/subType/api 命中加分）；为空时退化纯向量
    query_amis_json: str | None = None


class SearchNegativeSamplesRequest(BaseModel):
    """Phase 4 反向飞轮：按技术栈检索 is_negative=true 的反面教材。

    强制 only_structural=True（评审建议，避 LLM negation blindness）。
    top_k 默认 1，最多 3（防止负例淹没正面 RAG 样例）。
    """
    tech_stacks: list[str] = []
    platforms: list[str] = []
    top_k: int = 1
    only_structural: bool = True


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
    """检索 Top-K 相似样例（2026-04 起支持多维标签加权 + 质量闭环硬过滤）。"""
    _check_internal_auth(x_internal_key)
    results = await search_code_samples(
        query_text=request.query_text,
        platforms=request.platforms,
        tech_stacks=request.tech_stacks,
        ui_libs=request.ui_libs,
        legacy_tech_stack=request.tech_stack,
        top_k=request.top_k,
        only_approved=request.only_approved,
        exclude_tags=request.exclude_tags,
        min_rating=request.min_rating,
        min_verdict=request.min_verdict,
        weighting_enabled=request.weighting_enabled,
        thumbs_mode=request.thumbs_mode,
        hit_count_enabled=request.hit_count_enabled,
        query_amis_json=request.query_amis_json,
    )
    if request.increment_hits and results:
        await increment_code_sample_hits([r["id"] for r in results])
    return {"results": results, "count": len(results)}


@router.post("/internal/search-negative-samples")
async def search_negative_samples_endpoint(
    request: SearchNegativeSamplesRequest,
    x_internal_key: str = Header(default=""),
):
    """Phase 4 反向飞轮：按维度检索反面教材（is_negative=TRUE）。

    强制 only_structural=True（评审建议）。返回精简字段，不给 full_code，
    防止 LLM 看了完整反例代码学会反例（negation blindness）。
    """
    _check_internal_auth(x_internal_key)
    results = await search_negative_samples(
        tech_stacks=request.tech_stacks,
        platforms=request.platforms,
        top_k=min(request.top_k, 3),  # 硬上限 3 条，防负例淹没
        only_structural=True,          # 强制：评审建议不可关
    )
    return {"results": results, "count": len(results)}


# ────────────────────── 2026-04 质量闭环 Phase 2：LLM 评委 ──────────────────────

class JudgeCodeSampleRequest(BaseModel):
    """backend 触发的 LLM 评委入口。

    backend 负责：
      - 门禁（mode=disabled 跳过 / 日预算 / 并发闸）
      - 组 prompt 上下文（传摘要 + 代码截断）
      - 写回 code_samples.quality_* 四列 + audit

    Python 负责：
      - 按 task_type 选模型（agent/src/services/llm_client.get_llm_config）
      - 构 prompt + 调 chat_completion
      - 规整 LLM 输出到 {verdict, reason} 严格结构
    """
    sample_id: int
    task_type: str = "quality_judge"
    amis_json_summary: str | None = None
    code_summary: str | None = None
    full_code: str = ""


# 评委系统 prompt（中文 + 限定输出）。
# 评审建议：
#   - 二元 verdict（good / needs_review / bad），不做 5 分制（LLM 分辨 3/4/5 方差大）
#   - 只输出 JSON，便于 backend 解析
_JUDGE_SYSTEM_PROMPT = """你是 amis 低代码产品的代码质量评委。

你的任务：判定一段采纳的代码样例是否适合作为 RAG few-shot 示范。

评判角度（按重要性递减）：
  1. 是否符合当前技术栈的最佳实践（组件/API 使用正确、不引入反模式）
  2. 代码结构是否清晰（命名、职责拆分、可读性）
  3. 是否有明显 bug / 运行时错误风险
  4. 是否过度复杂（给示范用的样例应该"朴素、一眼看懂"）

输出严格 JSON（不加任何解释、不加 markdown fence）：
{
  "verdict": "good" | "needs_review" | "bad",
  "reason": "一句话解释（<=200字）"
}

verdict 含义：
  - good = 规范示范，可直接作 RAG few-shot
  - needs_review = 方向对但有瑕疵，admin 应复核后决定
  - bad = 有明显反模式/错误，不应作为示范（通常配合标记为负例）
"""


@router.post("/internal/judge-code-sample")
async def judge_code_sample_endpoint(
    request: JudgeCodeSampleRequest,
    x_internal_key: str = Header(default=""),
):
    """LLM 评委：对一条 code_sample 输出 {verdict, reason}。

    不写 DB（回填 code_samples.quality_* 的职责在 backend 侧 quality_judge.rs）。
    """
    _check_internal_auth(x_internal_key)

    # 截断 8000 字：兜底防 prompt 爆炸（backend 那边已先截 8000）。
    # 跟 backend 保持一致——如果 backend 提的更多但这里截得更小，业务 .vue 还是会被切掉。
    user_msg = (
        f"Amis 用途摘要：{request.amis_json_summary or '（空）'}\n"
        f"代码做了什么：{request.code_summary or '（空）'}\n\n"
        f"代码正文（截断 8000 字）：\n{request.full_code[:8000]}"
    )
    messages = [
        {"role": "system", "content": _JUDGE_SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ]
    try:
        result = await chat_completion(request.task_type, messages, stream=False)
    except Exception as e:
        return {"ok": False, "error": f"LLM 调用失败：{e}"}

    content = (
        result.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    model_used = result.get("model") or result.get("model_used") or request.task_type

    # 兼容 LLM 习惯：有时会包 ```json ... ``` 或前后加解释，剥一下再 parse
    raw = content
    if raw.startswith("```"):
        # 吞掉首行围栏 + 末行围栏
        lines = raw.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        raw = "\n".join(lines).strip()

    try:
        parsed = _json.loads(raw)
    except Exception:
        # 最后一搏：找出第一个 `{...}` 段
        start = raw.find("{")
        end = raw.rfind("}")
        if 0 <= start < end:
            try:
                parsed = _json.loads(raw[start : end + 1])
            except Exception as e:
                return {"ok": False, "error": f"LLM 输出 JSON 解析失败：{e}", "raw": content[:400]}
        else:
            return {"ok": False, "error": "LLM 输出没有 JSON 结构", "raw": content[:400]}

    verdict = str(parsed.get("verdict", "")).lower().strip()
    if verdict not in ("good", "needs_review", "bad"):
        return {"ok": False, "error": f"verdict 非法：{verdict}", "raw": content[:400]}
    reason = str(parsed.get("reason", "")).strip()[:500]

    return {
        "ok": True,
        "sample_id": request.sample_id,
        "verdict": verdict,
        "reason": reason,
        "model_used": model_used,
    }


# ─────────────────────── 1.4 B.3b：page 级 amis schema 评委 ───────────────────────


class JudgePageSchemaRequest(BaseModel):
    """对单个 page 的 amis JSON 设计做评估（与代码无关）。

    backend 在多页生成完成后或 admin 手动触发。"""
    page_id: int
    task_type: str = "quality_judge"
    route_path: str
    amis_json: str  # 该 page 的完整 amis JSON
    tech_stack: str | None = None
    ui_lib: str | None = None


_PAGE_SCHEMA_JUDGE_PROMPT = """你是 amis 低代码产品的页面设计评委。

你的任务：判定一个 page 的 Amis JSON 设计是否合理（**只评 schema 本身，不评代码**）。

评判角度（按重要性递减）：
  1. **API 协议是否对齐**：CRUD/Form/Service 的 api 字段是否符合规范（如 ZC 必须 app:// 协议）
  2. **组件搭配是否合理**：必填字段是否设了 required；CRUD 是否含列定义；form 字段是否给了 name
  3. **嵌套结构是否清晰**：page → body → form/crud 这种典型结构是否合规；不该出现极深嵌套
  4. **平台特化是否正确**：移动端组件不应出现在 web；ZC 二开组件（user-select / modeltable）配套 prop 是否齐
  5. **可生成性**：典型字段是否完整到能直接生成业务代码（不缺关键 name / label / type）

输出严格 JSON（不加任何解释、不加 markdown fence）：
{
  "verdict": "good" | "needs_review" | "bad",
  "reason": "一句话解释（<=200字）"
}

verdict 含义：
  - good = 设计规范、API 协议齐、组件搭配合理，可直接生成业务代码
  - needs_review = 整体方向对但有瑕疵（如缺校验 / api 协议含糊），admin 复核
  - bad = 设计有明显问题（API 协议错 / 组件嵌套乱 / 关键字段缺），不应进入生产
"""


@router.post("/internal/judge-page-schema")
async def judge_page_schema_endpoint(
    request: JudgePageSchemaRequest,
    x_internal_key: str = Header(default=""),
):
    """1.4 B.3b · 评 page 的 amis JSON 设计合理性（不评代码）。

    不写 DB（回填 project_task_page.page_quality_* 的职责在 backend 的 quality_judge.rs）。
    """
    _check_internal_auth(x_internal_key)

    # amis_json 全文截 8000 字（多页项目单 page 通常 2-5KB，余量充足）
    user_msg = (
        f"Page 路由：{request.route_path}\n"
        f"技术栈：{request.tech_stack or '未指定'} / {request.ui_lib or '未指定'}\n\n"
        f"Amis JSON（截断 8000 字）：\n{request.amis_json[:8000]}"
    )
    messages = [
        {"role": "system", "content": _PAGE_SCHEMA_JUDGE_PROMPT},
        {"role": "user", "content": user_msg},
    ]
    try:
        result = await chat_completion(request.task_type, messages, stream=False)
    except Exception as e:
        return {"ok": False, "error": f"LLM 调用失败：{e}"}

    content = (
        result.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    model_used = result.get("model") or result.get("model_used") or request.task_type

    # 复用 judge-code-sample 的 JSON 容错 parse（fence 剥离 + 兜底找 {}）
    raw = content
    if raw.startswith("```"):
        lines = raw.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        raw = "\n".join(lines).strip()

    try:
        parsed = _json.loads(raw)
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if 0 <= start < end:
            try:
                parsed = _json.loads(raw[start : end + 1])
            except Exception as e:
                return {"ok": False, "error": f"LLM 输出 JSON 解析失败：{e}", "raw": content[:400]}
        else:
            return {"ok": False, "error": "LLM 输出没有 JSON 结构", "raw": content[:400]}

    verdict = str(parsed.get("verdict", "")).lower().strip()
    if verdict not in ("good", "needs_review", "bad"):
        return {"ok": False, "error": f"verdict 非法：{verdict}", "raw": content[:400]}
    reason = str(parsed.get("reason", "")).strip()[:500]

    return {
        "ok": True,
        "page_id": request.page_id,
        "verdict": verdict,
        "reason": reason,
        "model_used": model_used,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2026-04-25 amis-translator 接口（确定性翻译器，详见 docs/architecture/amis-translator-pipeline.md）
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/internal/translate-amis")
async def translate_amis_endpoint(
    request: TranslateRequest,
    x_internal_key: str = Header(default=""),
):
    """把 Amis JSON 确定性翻译成业务代码（跳过 LLM）。

    Backend create_task 流水线会在 scaffold 拷完后先调本接口；
    若 fully_supported=True 则直接 fs_write 到沙箱 + dev_start，不再启 LLM。
    若 fully_supported=False 则 backend 走原 claw-agent 流水线兜底。
    """
    _check_internal_auth(x_internal_key)
    result = translate(request)
    # pydantic v2: model_dump 出 JSON-friendly dict
    return result.model_dump()


@router.post("/internal/translator-feedback")
async def translator_feedback_endpoint(
    feedback: TranslatorFeedback,
    x_internal_key: str = Header(default=""),
):
    """采纳后翻译器反馈 hook —— 阶段 C 骨架。

    详见 docs/architecture/amis-translator-pipeline.md「飞轮闭环」章节。
    当前阶段仅归档（不做规则推导）；未来 batch job 据此自动学新翻译规则。
    """
    _check_internal_auth(x_internal_key)
    try:
        path = archive_feedback(feedback)
        return {"ok": True, "archived": str(path)}
    except Exception as e:
        return {"ok": False, "error": f"归档失败: {e}"}
