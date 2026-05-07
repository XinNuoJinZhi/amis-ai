"""baidu/amis 仓库 clone：unset WSL 代理 + 版本 pin。"""
from __future__ import annotations
import os
import subprocess
from pathlib import Path
from typing import Mapping

from .config import ImporterConfig


_PROXY_KEYS = {"http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"}


def _strip_proxy_env(env: Mapping[str, str]) -> dict[str, str]:
    return {k: v for k, v in env.items() if k not in _PROXY_KEYS}


def clone_amis(cfg: ImporterConfig) -> Path:
    """克隆 baidu/amis 到 cfg.tmp_clone_dir，已存在则跳过；重试 3 次仍失败抛 RuntimeError。"""
    if (cfg.tmp_clone_dir / ".git").exists():
        return cfg.tmp_clone_dir
    cfg.tmp_clone_dir.parent.mkdir(parents=True, exist_ok=True)
    env = _strip_proxy_env(os.environ)
    last_err: Exception | None = None
    for attempt in range(3):
        try:
            subprocess.run(
                [
                    "git", "clone", "--depth=1",
                    "--branch", cfg.amis_version,
                    cfg.amis_repo_url, str(cfg.tmp_clone_dir),
                ],
                check=True, env=env,
            )
            return cfg.tmp_clone_dir
        except subprocess.CalledProcessError as e:
            last_err = e
            print(f"[clone] 第 {attempt + 1} 次失败：{e}")
    raise RuntimeError(f"clone baidu/amis 重试 3 次仍失败：{last_err}")
