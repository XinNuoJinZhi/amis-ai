"""文档轨入库：parse_docs.ComponentDoc → code_samples 行（asyncpg 直连）。

幂等约束：tags 中同时含 amis-component:<name> 和 amis-version:<x> 的行视为同一条，
重跑走 UPDATE 不 INSERT。
"""
from __future__ import annotations
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

import asyncpg


@dataclass
class RagRecord:
    component: str
    amis_version: str
    title: str
    prose: str
    amis_json: str           # 完整 amis JSON 示例（full_amis_json 列）
    status: str = "auto_imported"  # auto_imported / approved / pending
    extra_tags: list[str] = field(default_factory=list)

    @property
    def tags(self) -> list[str]:
        return [
            f"amis-component:{self.component}",
            f"amis-version:{self.amis_version}",
            "amis-knowledge-1.1",
            *self.extra_tags,
        ]


_INSERT_SQL = """
INSERT INTO code_samples (
    tech_stack, tech_stacks, platforms, ui_libs,
    source_team, amis_json_summary, code_summary,
    full_amis_json, full_code, status, tags,
    hit_count, created_at, updated_at
) VALUES (
    'amis-core', ARRAY['amis-core'], ARRAY['web'], ARRAY[]::text[],
    'baidu-amis', $1, $2, $3, $4, $5, $6, 0, NOW(), NOW()
)
RETURNING id
"""

_UPDATE_SQL = """
UPDATE code_samples
SET amis_json_summary = $2,
    code_summary = $3,
    full_amis_json = $4,
    full_code = $5,
    status = $6,
    tags = $7,
    updated_at = NOW()
WHERE id = $1
"""

_LOOKUP_SQL = """
SELECT id FROM code_samples
WHERE $1 = ANY(tags) AND $2 = ANY(tags)
LIMIT 1
"""


async def ingest_rag_records(
    pool: asyncpg.Pool,
    records: Iterable[RagRecord],
    vectorize: bool = False,
) -> int:
    """灌入 records；返回新插入行数（已存在的走 UPDATE 不计数）。

    vectorize=True 时调 agent 端 index_code_sample 触发向量化（需要 embedding 端点在线）。
    """
    inserted = 0
    affected_ids: list[tuple[int, str]] = []  # (sample_id, summary_text) for vectorization

    async with pool.acquire() as conn:
        async with conn.transaction():
            for rec in records:
                tag_comp = f"amis-component:{rec.component}"
                tag_ver = f"amis-version:{rec.amis_version}"
                code_summary_text = (
                    f"baidu/amis {rec.component} {rec.amis_version} 自动导入；"
                    f"prose 长度 {len(rec.prose)}"
                )
                full_code = (
                    f"// auto-imported from baidu/amis docs\n"
                    f"// component: {rec.component}\n"
                    f"// amis_version: {rec.amis_version}\n"
                )
                existing = await conn.fetchval(_LOOKUP_SQL, tag_comp, tag_ver)
                if existing is not None:
                    await conn.execute(
                        _UPDATE_SQL,
                        existing, rec.title, code_summary_text,
                        rec.amis_json, full_code, rec.status, rec.tags,
                    )
                    affected_ids.append((existing, f"{rec.title}\n{rec.prose}"))
                else:
                    new_id = await conn.fetchval(
                        _INSERT_SQL,
                        rec.title, code_summary_text,
                        rec.amis_json, full_code, rec.status, rec.tags,
                    )
                    inserted += 1
                    affected_ids.append((new_id, f"{rec.title}\n{rec.prose}"))

    if vectorize:
        from services.rag import index_code_sample  # 局部导入避免在非 vectorize 路径里拉服务依赖
        for sid, summary in affected_ids:
            await index_code_sample(sid, summary)

    return inserted


def docs_json_to_records(
    docs_json_path: Path,
    amis_version: str,
    status: str = "auto_imported",
) -> list[RagRecord]:
    """parse_docs 输出的 docs.json → RagRecord 列表（每个示例 JSON 一条）。"""
    raw = json.loads(Path(docs_json_path).read_text(encoding="utf-8"))
    out: list[RagRecord] = []
    for doc in raw:
        for idx, example in enumerate(doc["examples"]):
            out.append(RagRecord(
                component=doc["component"],
                amis_version=amis_version,
                title=f"{doc['title']} 示例 #{idx + 1}",
                prose=doc["prose"],
                amis_json=example,
                status=status,
            ))
    return out
