"""测试 amis_importer CLI 的 --help 输出含三个 subcommand。"""
import subprocess
import sys
from pathlib import Path


def test_cli_help_shows_subcommands():
    agent_dir = Path(__file__).resolve().parents[2]  # agent/
    out = subprocess.run(
        [sys.executable, "-m", "knowledge.amis_importer", "--help"],
        capture_output=True, text=True,
        cwd=agent_dir,
        env={"PYTHONPATH": str(agent_dir / "src"), "PATH": "/usr/bin:/bin"},
    )
    text = out.stdout + out.stderr
    assert "types" in text
    assert "docs" in text
    assert "all" in text
    assert "dry-run" in text
