"""测试 clone.py 的代理过滤与 git clone 调用。"""
from unittest.mock import patch, MagicMock

from knowledge.amis_importer.clone import clone_amis, _strip_proxy_env
from knowledge.amis_importer.config import ImporterConfig


def test_strip_proxy_env_removes_http_keys():
    src = {"PATH": "/usr/bin", "http_proxy": "x", "HTTPS_PROXY": "y", "FOO": "bar"}
    out = _strip_proxy_env(src)
    assert "http_proxy" not in out
    assert "HTTPS_PROXY" not in out
    assert out["PATH"] == "/usr/bin"
    assert out["FOO"] == "bar"


@patch("knowledge.amis_importer.clone.subprocess.run")
def test_clone_amis_skips_when_dir_exists(mock_run, tmp_path):
    cfg = ImporterConfig(tmp_clone_dir=tmp_path)
    (tmp_path / ".git").mkdir(parents=True)
    result = clone_amis(cfg)
    assert result == tmp_path
    mock_run.assert_not_called()


@patch("knowledge.amis_importer.clone.subprocess.run")
def test_clone_amis_invokes_git_clone_when_missing(mock_run, tmp_path):
    target = tmp_path / "amis"
    cfg = ImporterConfig(tmp_clone_dir=target, amis_version="v6.10.0")
    mock_run.return_value = MagicMock(returncode=0)
    clone_amis(cfg)
    args = mock_run.call_args
    assert args.args[0][0] == "git"
    assert args.args[0][1] == "clone"
    assert "v6.10.0" in args.args[0]
