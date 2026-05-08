"""测试 parse_docs.py 的 markdown 切分。"""
from pathlib import Path

from knowledge.amis_importer.parse_docs import parse_component_doc

FIXTURE = Path(__file__).parent / "fixtures" / "sample-form-doc.md"


def test_parse_component_doc_extracts_title_and_examples():
    result = parse_component_doc(FIXTURE)
    assert result.component == "sample-form-doc"
    assert result.title == "Form 表单"
    assert len(result.examples) == 2
    assert "input-text" in result.examples[0]
    assert "/api/save" in result.examples[1]


def test_parse_component_doc_prose_strips_frontmatter_and_codeblocks():
    result = parse_component_doc(FIXTURE)
    assert "type: form" not in result.prose
    assert "input-text" not in result.prose
    assert "最简单的表单" in result.prose
