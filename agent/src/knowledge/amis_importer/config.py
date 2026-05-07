"""ImporterConfig：路径常量 + 1.1.0 版本 pin。"""
from __future__ import annotations
import os
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
KNOWLEDGE_ROOT = REPO_ROOT / "agent" / "src" / "knowledge"
DUMP_DIR = KNOWLEDGE_ROOT / "amis_dump"
SKILLS_BUCKET = REPO_ROOT / "skills" / "amis-core-schema"
SKILLS_REFS = SKILLS_BUCKET / "references"
TYPES_EXTRACTOR_DIR = KNOWLEDGE_ROOT / "amis_types_extractor"

# 1.1.0 基线：baidu/amis 6.x 最新稳定 release
DEFAULT_AMIS_VERSION = "6.10.0"


@dataclass
class ImporterConfig:
    """amis 导入器配置。"""
    amis_version: str = DEFAULT_AMIS_VERSION
    amis_repo_url: str = "https://github.com/baidu/amis.git"
    tmp_clone_dir: Path = field(default_factory=lambda: Path("/tmp/amis-clone"))
    db_url: str = field(
        default_factory=lambda: os.environ.get(
            "DATABASE_URL",
            "postgresql://amis_ai:amis_ai@localhost:5432/amis_ai",
        )
    )
    dry_run: bool = False
