"""测试 ingest_skills.py 把 schema JSON 转成 references/<comp>.md。"""
from pathlib import Path

from knowledge.amis_importer.ingest_skills import ingest_schema_to_skills

FIXTURE = Path(__file__).parent / "fixtures" / "sample-amis-schema.json"


def test_ingest_schema_writes_one_md_per_component(tmp_path):
    refs_dir = tmp_path / "references"
    n = ingest_schema_to_skills(FIXTURE, refs_dir)
    assert n == 1
    form_md = refs_dir / "form.md"
    assert form_md.exists()
    content = form_md.read_text(encoding="utf-8")
    assert "component: form" in content
    assert "amis_version: 6.10.0" in content
    assert "| `type` |" in content
    assert "| `title` |" in content
    assert "控件类型固定为 form" in content


def test_ingest_schema_idempotent_overwrite(tmp_path):
    refs_dir = tmp_path / "references"
    ingest_schema_to_skills(FIXTURE, refs_dir)
    first = (refs_dir / "form.md").read_text()
    ingest_schema_to_skills(FIXTURE, refs_dir)
    second = (refs_dir / "form.md").read_text()
    assert first == second
