"""测试 ImporterConfig 的路径常量和版本 pin。"""
from knowledge.amis_importer.config import (
    ImporterConfig,
    REPO_ROOT,
    KNOWLEDGE_ROOT,
)


def test_repo_root_points_to_amis_ai():
    assert (REPO_ROOT / "frontend").is_dir()
    assert (REPO_ROOT / "agent").is_dir()


def test_knowledge_root_under_repo():
    assert KNOWLEDGE_ROOT == REPO_ROOT / "agent" / "src" / "knowledge"


def test_importer_config_defaults():
    cfg = ImporterConfig()
    assert cfg.amis_version.startswith("v6.")
    assert cfg.tmp_clone_dir.name == "amis-clone"
    assert cfg.db_url.startswith("postgresql://")
