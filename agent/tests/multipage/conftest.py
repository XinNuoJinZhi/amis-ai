"""复用 tests/knowledge/conftest.py 的 db_pool fixture（清 amis-knowledge-test 标记的行）"""
import sys
from pathlib import Path

# 让 conftest 能 import 兄弟目录里的 fixture
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "knowledge"))
from conftest import db_pool  # noqa: F401, E402
