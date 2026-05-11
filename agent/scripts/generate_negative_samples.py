"""1.4 B.2：从已采纳的 ZC 业务样例「负例放大」。

设计：
    - 输入：source_team='zc-amis' AND status='approved' AND is_negative=FALSE 的样例
    - 对每条按 5 种 minimal-mutation 模式各生成 1 条负例（共 5 × N 条）
    - 每个负例只改 1 个关键点（保 amis_json 语法 valid，语义偏离）
    - 入库 code_samples：is_negative=TRUE / negative_kind='structural' / rejection_reason 写错因
      → 被 search_negative_samples 召回（reverse RAG），不污染正向召回
    - 同步调 index_code_sample 把 embedding + keyword_index 灌好

幂等：
    - 同一 source_task_id + negative_kind 组合只生成一次
    - 重跑时跳过已存在的负例

用法：
    cd agent
    INTERNAL_API_KEY=xxx uv run python scripts/generate_negative_samples.py
    uv run python scripts/generate_negative_samples.py --dry-run     # 不写库
    uv run python scripts/generate_negative_samples.py --source-team amis-ai  # 也跑 amis-core 样例
    uv run python scripts/generate_negative_samples.py --modes zc_component,multiple_flipped  # 子集
"""

from __future__ import annotations

import argparse
import asyncio
import copy
import json
import sys
from pathlib import Path
from typing import Any, Callable, List, Optional, Tuple

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT))

from src.services.db import get_pool, close_pool  # noqa: E402
from src.services.keyword_extractor import extract_amis_keywords  # noqa: E402
from src.services.embedding import get_embedding  # noqa: E402


# ────────────────────────── Mutation 模式 ──────────────────────────


def _walk_mutate(node: Any, fn: Callable[[Any], Optional[str]]) -> Optional[str]:
    """递归遍历并应用第一个能触发的 mutation；返回 mutation 描述（dict 被 in-place 修改）。

    fn(dict_node) -> Optional[reason_str]:
        命中且修改了就返回 reason；不命中返回 None。
    第一个返回非 None 的 dict 就停（保证 minimal mutation：一条负例只改 1 处）。
    """
    if isinstance(node, dict):
        reason = fn(node)
        if reason:
            return reason
        for k, v in list(node.items()):
            sub = _walk_mutate(v, fn)
            if sub:
                return sub
    elif isinstance(node, list):
        for item in node:
            sub = _walk_mutate(item, fn)
            if sub:
                return sub
    return None


def _mut_api_protocol_downgrade(node: dict) -> Optional[str]:
    """app://api/user.list → /api/user.list（丢失 ZC 中台协议）"""
    for key in ("api", "initApi", "schemaApi"):
        api = node.get(key)
        if isinstance(api, str) and api.startswith("app://"):
            node[key] = api.replace("app://", "/", 1)
            return f"把 {key} 协议从 app:// 降级为普通 /，会绕过 ZC 中台鉴权/网关"
        if isinstance(api, dict):
            url = api.get("url")
            if isinstance(url, str) and url.startswith("app://"):
                api["url"] = url.replace("app://", "/", 1)
                return f"把 {key}.url 协议从 app:// 降级为普通 /，会绕过 ZC 中台鉴权/网关"
    return None


_ZC_DOWNGRADE_MAP = {
    "user-select": "select",
    "department-select": "select",
    "modeltable": "crud",
    "model-table": "crud",
    "zc-tree": "tree",
}


def _mut_zc_component_replaced(node: dict) -> Optional[str]:
    """ZC 二开组件 → 原版 amis 组件（丢失业务字段联动）"""
    t = node.get("type")
    if isinstance(t, str) and t.lower() in _ZC_DOWNGRADE_MAP:
        original = t
        node["type"] = _ZC_DOWNGRADE_MAP[t.lower()]
        return f"把 ZC 二开组件 {original} 替换为原版 amis {node['type']}，会丢失部门树/用户头像/模型联动等"
    return None


def _mut_missing_required_prop(node: dict) -> Optional[str]:
    """删除 form/crud 的 api（变成纯前端，无法保存）"""
    t = node.get("type")
    if isinstance(t, str) and t in {"form", "crud"} and "api" in node:
        del node["api"]
        return f"删除 {t} 的 api 字段，组件无法提交/拉取数据"
    return None


_TYPE_SWAP_MAP = {
    "input-text": "select",
    "input-number": "input-text",
    "select": "radios",
    "switch": "checkbox",
    "input-date": "input-text",
    "textarea": "input-text",
}


def _mut_field_type_mismatch(node: dict) -> Optional[str]:
    """字段 type 错配（input-text ↔ select ↔ radios）"""
    t = node.get("type")
    if isinstance(t, str) and t in _TYPE_SWAP_MAP:
        original = t
        node["type"] = _TYPE_SWAP_MAP[t]
        return f"把字段类型从 {original} 错配为 {node['type']}，UI 控件不匹配数据形态"
    return None


def _mut_multiple_flipped(node: dict) -> Optional[str]:
    """multiple: true/false 反转（select 单/多选语义颠倒）"""
    t = node.get("type")
    if (
        isinstance(t, str)
        and t in {"select", "user-select", "department-select", "tree-select"}
        and "multiple" in node
    ):
        original = bool(node["multiple"])
        node["multiple"] = not original
        return (
            f"把 {t} 的 multiple 从 {original} 反转为 {not original}，"
            f"绑定字段类型从 {'array' if original else 'scalar'} 变成 {'scalar' if original else 'array'}"
        )
    return None


MUTATION_MODES: dict[str, Callable[[dict], Optional[str]]] = {
    "api_protocol_downgrade": _mut_api_protocol_downgrade,
    "zc_component_replaced": _mut_zc_component_replaced,
    "missing_required_prop": _mut_missing_required_prop,
    "field_type_mismatch": _mut_field_type_mismatch,
    "multiple_flipped": _mut_multiple_flipped,
}


# ────────────────────────── 主流程 ──────────────────────────


async def _fetch_sources(pool, source_teams: List[str]) -> list:
    async with pool.acquire() as conn:
        return await conn.fetch(
            """
            SELECT id, tech_stack, source_team, platforms, tech_stacks, ui_libs,
                   amis_json_summary, code_summary, full_amis_json, full_code
            FROM code_samples
            WHERE source_team = ANY($1::text[])
              AND status = 'approved'
              AND is_negative = FALSE
              AND full_amis_json IS NOT NULL
              AND full_amis_json <> ''
            ORDER BY id
            """,
            source_teams,
        )


async def _existing_negatives(pool, source_ids: List[int]) -> set[tuple[int, str]]:
    """已生成的 (source_task_id, negative_kind_detail) 用于幂等去重。

    我们把模式名写进 rejection_reason 前缀，便于 grep 判重。
    """
    if not source_ids:
        return set()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT source_task_id, rejection_reason
            FROM code_samples
            WHERE is_negative = TRUE
              AND source_task_id = ANY($1::int[])
              AND rejection_reason LIKE '[%]%'
            """,
            source_ids,
        )
    out: set[tuple[int, str]] = set()
    for r in rows:
        reason = r["rejection_reason"] or ""
        if reason.startswith("["):
            mode = reason.split("]", 1)[0][1:]
            out.add((int(r["source_task_id"] or 0), mode))
    return out


async def _insert_negative(
    pool,
    source: dict,
    mode: str,
    negative_json: str,
    rejection_reason: str,
    embedding_str: str,
    keywords: List[str],
) -> int:
    """INSERT 一条负例到 code_samples，返回 id。"""
    async with pool.acquire() as conn:
        # 摘要前缀打 [negative:mode] 便于人审；full_code 沿用原样（评审建议负例不存改后的 code）
        neg_summary = f"[negative:{mode}] {source['amis_json_summary'] or ''}"[:1000]
        row = await conn.fetchrow(
            """
            INSERT INTO code_samples (
                tech_stack, source_team,
                platforms, tech_stacks, ui_libs, tags, keyword_index,
                amis_json_summary, code_summary,
                full_amis_json, full_code,
                status, hit_count, is_negative, negative_kind, rejection_reason,
                embedding, source_task_id,
                created_at, updated_at
            ) VALUES (
                $1, $2,
                $3::text[], $4::text[], $5::text[], $6::text[], $7::text[],
                $8, $9,
                $10, $11,
                'approved', 0, TRUE, 'structural', $12,
                $13::vector, $14,
                NOW(), NOW()
            )
            RETURNING id
            """,
            source["tech_stack"],
            source["source_team"],
            list(source["platforms"] or []),
            list(source["tech_stacks"] or []),
            list(source["ui_libs"] or []),
            ["negative", f"negative_kind:{mode}"],
            keywords,
            neg_summary,
            source["code_summary"],
            negative_json,
            source["full_code"],
            f"[{mode}] {rejection_reason}",
            embedding_str,
            source["id"],
        )
    return int(row["id"])


async def run(
    source_teams: List[str],
    modes: List[str],
    dry_run: bool,
    limit: Optional[int],
) -> None:
    pool = await get_pool()
    sources = await _fetch_sources(pool, source_teams)
    if limit:
        sources = sources[:limit]
    print(f"[neg-gen] 源样例数: {len(sources)} (source_teams={source_teams})")
    if not sources:
        return

    src_ids = [int(s["id"]) for s in sources]
    existing = await _existing_negatives(pool, src_ids)
    print(f"[neg-gen] 已存在的 (source_task_id, mode) 组合: {len(existing)} 条")

    summary: dict[str, int] = {m: 0 for m in modes}
    skipped: dict[str, int] = {m: 0 for m in modes}
    inserted_total = 0

    for src in sources:
        try:
            base_json = json.loads(src["full_amis_json"])
        except Exception as e:
            print(f"  ! id={src['id']} JSON parse 失败: {e}")
            continue

        for mode in modes:
            if (int(src["id"]), mode) in existing:
                skipped[mode] += 1
                continue

            mut_fn = MUTATION_MODES[mode]
            mutated = copy.deepcopy(base_json)
            reason = _walk_mutate(mutated, mut_fn)
            if not reason:
                # 该样本没有命中点（如无 ZC 组件 / 无 api / 无 multiple）
                continue

            neg_json_str = json.dumps(mutated, ensure_ascii=False)
            keywords = extract_amis_keywords(mutated)

            if dry_run:
                print(f"  · id={src['id']} mode={mode} → {reason[:80]}")
                summary[mode] += 1
                continue

            # embedding 用变异后的摘要 + 原 code_summary
            embed_text = f"[negative] {src['amis_json_summary'] or ''}\n{src['code_summary'] or ''}"
            try:
                emb = await get_embedding(embed_text)
                emb_str = "[" + ",".join(str(x) for x in emb) + "]"
            except Exception as e:
                print(f"  ! id={src['id']} mode={mode} embedding 失败: {e}")
                continue

            try:
                new_id = await _insert_negative(
                    pool, src, mode, neg_json_str, reason, emb_str, keywords
                )
                summary[mode] += 1
                inserted_total += 1
                if inserted_total % 25 == 0:
                    print(f"  ✓ 已入库 {inserted_total} 条负例（最新 id={new_id}）")
            except Exception as e:
                print(f"  ! id={src['id']} mode={mode} INSERT 失败: {e}")

    print()
    print("[neg-gen] 完成汇总：")
    for m in modes:
        print(f"  - {m}: 生成 {summary[m]:>3} 条 / 跳过 {skipped[m]:>3} 条（已存在）")
    print(f"[neg-gen] 总入库: {inserted_total}")
    if dry_run:
        print("[neg-gen] dry-run 模式，未实际写库")


async def main() -> None:
    parser = argparse.ArgumentParser(description="负例样本生成器（B.2）")
    parser.add_argument("--dry-run", action="store_true", help="不写库")
    parser.add_argument(
        "--source-team",
        default="zc-amis",
        help="源样例 source_team（逗号分隔，默认 zc-amis）",
    )
    parser.add_argument(
        "--modes",
        default=",".join(MUTATION_MODES.keys()),
        help=f"启用的 mutation 模式（逗号分隔，默认全部：{','.join(MUTATION_MODES.keys())}）",
    )
    parser.add_argument("--limit", type=int, default=None, help="源样例数量上限（调试用）")
    args = parser.parse_args()

    source_teams = [t.strip() for t in args.source_team.split(",") if t.strip()]
    modes = [m.strip() for m in args.modes.split(",") if m.strip()]
    unknown = [m for m in modes if m not in MUTATION_MODES]
    if unknown:
        print(f"未知 mutation 模式: {unknown}")
        print(f"可选: {list(MUTATION_MODES.keys())}")
        sys.exit(1)

    try:
        await run(source_teams, modes, args.dry_run, args.limit)
    finally:
        await close_pool()


if __name__ == "__main__":
    asyncio.run(main())
