"""测试 runner.py 的纯函数 score_result / compare_results / _collect_types。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from runner import score_result, compare_results, _collect_types


def test_collect_types_walks_nested_structures():
    obj = {
        "type": "page",
        "body": [
            {"type": "form", "body": [{"type": "input-text"}, {"type": "button"}]},
            {"type": "dialog"},
        ],
    }
    assert _collect_types(obj) == {"page", "form", "input-text", "button", "dialog"}


def test_score_result_pass_when_components_match():
    case = {"id": "p01", "expected_components": ["form", "button"]}
    output = '{"type":"page","body":[{"type":"form","body":[{"type":"button"}]}]}'
    assert score_result(case, output)["pass"] is True


def test_score_result_fail_when_invalid_json():
    case = {"id": "p01", "expected_components": ["form"]}
    output = "not a json"
    s = score_result(case, output)
    assert s["pass"] is False
    assert s["reason"] == "invalid_json"


def test_score_result_fail_when_missing_components():
    case = {"id": "p01", "expected_components": ["form", "table"]}
    output = '{"type":"form"}'
    s = score_result(case, output)
    assert s["pass"] is False
    assert s["reason"] == "missing_components"
    assert s["missing"] == ["table"]


def test_compare_reports_adopt_rate_diff():
    a = [{"id": "p01", "pass": True}, {"id": "p02", "pass": False}]
    b = [{"id": "p01", "pass": True}, {"id": "p02", "pass": True}]
    diff = compare_results(a, b)
    assert diff["a_adopt_rate"] == 0.5
    assert diff["b_adopt_rate"] == 1.0
    assert diff["delta_pp"] == 50.0
