"""1.4 W1 C.4：Skill 桶冲突矩阵测试。

跑 5 项一致性检查（详见 docstring）：
  C1. 同 platform 的 stack-* 桶必须相互 conflicts
  C2. 所有 ui-* 桶必须相互 conflicts
  C3. priority 梯度合规（_common 100 > stack 50 > ui 30 > platform 20）
  C4. requires / conflicts 链路无循环 + 引用的桶在文件系统存在
  C5. conflicts 关系对称（A 写了 conflicts: [B] 则 B 必须写 conflicts: [A]）

用法：
  cd agent
  uv run python scripts/check_skill_bucket_conflicts.py
  # 退出码：0=全过，1=有失败

设计：read-only，不动桶文件；测试出错就直接挂红，让 CI/人工修。
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

import yaml

_ROOT = Path(__file__).resolve().parents[2]
_SKILLS_DIR = _ROOT / "skills"

# priority 梯度上界 / 下界（按 kind）
PRIORITY_RANGE: Dict[str, Tuple[int, int]] = {
    # _common 桶 (100) 是必读必守核心；scaffold-from-scratch 等工具类也是 kind=common
    # 但走按需启用语义，priority 低一些（≥40 仍然高于 ui-30 / platform-20）
    "common":    (40, 100),
    "stack":     (50, 60),
    "ui":        (30, 40),
    "platform":  (20, 30),
    "legacy":    (0, 20),
    "knowledge": (0, 100),  # knowledge 桶可叠加，范围宽松
}


def _load_frontmatter(skill_md: Path) -> Dict[str, Any]:
    """读 SKILL.md 首部 YAML frontmatter。"""
    text = skill_md.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    raw = text[3:end].strip()
    try:
        return yaml.safe_load(raw) or {}
    except yaml.YAMLError as e:
        print(f"  ! {skill_md.parent.name}: YAML parse 失败: {e}")
        return {}


def _load_all_buckets() -> Dict[str, Dict[str, Any]]:
    """返回 {bucket_name: frontmatter}"""
    buckets: Dict[str, Dict[str, Any]] = {}
    for child in sorted(_SKILLS_DIR.iterdir()):
        if not child.is_dir():
            continue
        skill_md = child / "SKILL.md"
        if not skill_md.exists():
            continue
        fm = _load_frontmatter(skill_md)
        name = fm.get("name") or child.name
        buckets[name] = fm
    return buckets


# ────────────────────────── 检查项 ──────────────────────────


def check_c1_stack_platform_conflicts(buckets: Dict[str, Dict[str, Any]]) -> List[str]:
    """C1：同 platform 的 stack-* 桶必须相互 conflicts。"""
    errors: List[str] = []
    stacks = {n: f for n, f in buckets.items() if f.get("kind") == "stack"}

    # 按 platform 分组
    by_platform: Dict[str, List[str]] = {}
    for name, fm in stacks.items():
        for p in fm.get("platforms") or []:
            by_platform.setdefault(p, []).append(name)

    for platform, names in by_platform.items():
        if len(names) < 2:
            continue
        for a in names:
            conflicts = set(stacks[a].get("conflicts") or [])
            missing = [b for b in names if b != a and b not in conflicts]
            if missing:
                errors.append(
                    f"  [C1] platform={platform} 下 {a} 缺少 conflicts: {missing} "
                    f"(应包含同 platform 其他 stack-*)"
                )
    return errors


def check_c2_ui_conflicts(buckets: Dict[str, Dict[str, Any]]) -> List[str]:
    """C2：所有 ui-* 桶必须相互 conflicts（不分 platform）。"""
    errors: List[str] = []
    uis = [n for n, f in buckets.items() if f.get("kind") == "ui"]
    for a in uis:
        conflicts = set(buckets[a].get("conflicts") or [])
        missing = [b for b in uis if b != a and b not in conflicts]
        if missing:
            errors.append(f"  [C2] {a} 缺少 conflicts: {missing} (所有 ui-* 应互斥)")
    return errors


def check_c3_priority_range(buckets: Dict[str, Dict[str, Any]]) -> List[str]:
    """C3：priority 梯度合规（按 kind 限制范围）。"""
    errors: List[str] = []
    for name, fm in buckets.items():
        kind = fm.get("kind")
        prio = fm.get("priority")
        if not kind or prio is None:
            continue
        rng = PRIORITY_RANGE.get(kind)
        if rng is None:
            continue
        lo, hi = rng
        if not (lo <= prio <= hi):
            errors.append(f"  [C3] {name} priority={prio} 超出 kind={kind} 范围 [{lo}, {hi}]")
    return errors


def check_c4_requires_dag(buckets: Dict[str, Dict[str, Any]]) -> List[str]:
    """C4：requires 链路无循环 + 引用的桶存在。"""
    errors: List[str] = []

    # 引用存在性
    for name, fm in buckets.items():
        for req in fm.get("requires") or []:
            if req not in buckets:
                errors.append(f"  [C4] {name} requires: 桶 '{req}' 不存在")
        for con in fm.get("conflicts") or []:
            if con not in buckets:
                errors.append(f"  [C4] {name} conflicts: 桶 '{con}' 不存在")

    # 循环检测（DFS）
    GRAY, BLACK = 1, 2
    color: Dict[str, int] = {}
    cycles: List[Tuple[str, ...]] = []

    def visit(node: str, path: List[str]) -> None:
        if color.get(node) == GRAY:
            # 找到回到 path 内某节点的圈
            idx = path.index(node) if node in path else 0
            cycles.append(tuple(path[idx:] + [node]))
            return
        if color.get(node) == BLACK:
            return
        color[node] = GRAY
        path.append(node)
        for req in buckets.get(node, {}).get("requires") or []:
            if req in buckets:
                visit(req, path)
        path.pop()
        color[node] = BLACK

    for n in buckets:
        if color.get(n) != BLACK:
            visit(n, [])

    for c in cycles:
        errors.append(f"  [C4] requires 循环: {' → '.join(c)}")

    return errors


def check_c5_conflicts_symmetric(buckets: Dict[str, Dict[str, Any]]) -> List[str]:
    """C5：conflicts 关系对称（A 写了 [B] 则 B 必须写 [A]）。"""
    errors: List[str] = []
    for name, fm in buckets.items():
        for con in fm.get("conflicts") or []:
            other = buckets.get(con)
            if other is None:
                continue  # C4 已报存在性
            other_conflicts = set(other.get("conflicts") or [])
            if name not in other_conflicts:
                errors.append(f"  [C5] 不对称: {name} 标了 conflicts:[{con}] 但 {con} 没标 [{name}]")
    return errors


# ────────────────────────── 主流程 ──────────────────────────


def _print_matrix(buckets: Dict[str, Dict[str, Any]], kind: str) -> None:
    """打印同 kind 桶的冲突矩阵（√ = 互斥, · = 不互斥, --- = 自己）"""
    names = sorted([n for n, f in buckets.items() if f.get("kind") == kind])
    if not names:
        return
    print(f"\n【冲突矩阵 · kind={kind}】")
    header = " " * 22 + "".join(f"{n[:20]:>22}" for n in names)
    print(header)
    for a in names:
        conflicts = set(buckets[a].get("conflicts") or [])
        row = f"{a[:20]:>22}"
        for b in names:
            mark = "---" if a == b else ("✓" if b in conflicts else "·")
            row += f"{mark:>22}"
        print(row)


def main() -> int:
    print(f"加载 skills/ 目录：{_SKILLS_DIR}")
    buckets = _load_all_buckets()
    print(f"共加载 {len(buckets)} 个 SKILL.md\n")

    all_errors: List[str] = []
    for label, fn in (
        ("C1 同 platform stack 互斥", check_c1_stack_platform_conflicts),
        ("C2 所有 ui 互斥",            check_c2_ui_conflicts),
        ("C3 priority 梯度",           check_c3_priority_range),
        ("C4 requires DAG + 引用存在", check_c4_requires_dag),
        ("C5 conflicts 对称",          check_c5_conflicts_symmetric),
    ):
        errors = fn(buckets)
        status = "✗ FAIL" if errors else "✓ PASS"
        print(f"[{status}] {label}（{len(errors)} 条问题）")
        for e in errors:
            print(e)
        all_errors.extend(errors)

    _print_matrix(buckets, "stack")
    _print_matrix(buckets, "ui")

    print()
    if all_errors:
        print(f"❌ 共 {len(all_errors)} 条不一致")
        return 1
    print("✅ 所有桶冲突矩阵检查通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
