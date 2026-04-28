"""Amis page → Vue SFC + pages.json patch。"""
import json
import re
from typing import Any, Optional

from ...models import TranslateResult
from .crud import translate_crud_body
from .form import UNSUPPORTED_PREFIX, translate_form_body


# 中文标题 → 英文路径别名（按使用频率排序）
TITLE_ALIASES: list[tuple[str, str]] = [
    ("找回密码", "forgot-password"),
    ("用户登录", "login"),
    ("用户注册", "register"),
    ("登录", "login"),
    ("注册", "register"),
    ("首页", "index"),
    ("用户列表", "user-list"),
    ("用户详情", "user-detail"),
    ("我的", "profile"),
    ("个人中心", "profile"),
    ("设置", "settings"),
]


def _normalize_path_segment(s: str) -> str:
    """把任意字符串规范成 kebab-case 安全的路径段。

    - ASCII 大写转小写
    - 空格 / 下划线 / 反斜杠 → 短横线
    - 移除 path 不安全字符
    - 仅保留 a-z 0-9 -
    """
    s = s.strip().lower()
    s = re.sub(r"[\s_\\]+", "-", s)
    s = re.sub(r"[^a-z0-9\-/]+", "", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def derive_page_name(amis_page: dict) -> str:
    """从 page schema 推导路径名。

    优先级：
    1. amis_page.path（明确指定的路径）
    2. amis_page.name（页面标识）
    3. 按 title 中文关键字别名表
    4. fallback：title 的英文化（移除中文）→ 否则 hash
    """
    explicit = amis_page.get("path") or amis_page.get("name")
    if isinstance(explicit, str):
        norm = _normalize_path_segment(explicit.lstrip("/"))
        if norm:
            return norm

    title = str(amis_page.get("title") or "").strip()
    if title:
        for keyword, alias in TITLE_ALIASES:
            if keyword in title:
                return alias

    # 没命中：尝试 ASCII 化 title
    ascii_only = _normalize_path_segment(title) if title else ""
    if ascii_only:
        return ascii_only

    # 兜底：hash
    return f"page-{abs(hash(title)) % 10000}"


def translate_page(amis_page: dict, current_pages_json: Optional[dict]) -> TranslateResult:
    """翻译 type=page 的根 schema。

    - 创建 src/pages/{name}/{name}.vue
    - patch src/pages.json（追加 pages 数组项 + 确保 globalStyle 有 rpxCalc 字段）
    """
    body = amis_page.get("body")
    if body is None:
        return TranslateResult(
            success=True, fully_supported=False,
            notes=["page.body 为空"],
        )

    page_name = derive_page_name(amis_page)
    page_title = str(amis_page.get("title") or "页面")

    # 阶段 A：page.body 仅支持单个 form 翻译
    body_obj: Optional[dict] = None
    if isinstance(body, dict):
        body_obj = body
    elif isinstance(body, list) and len(body) == 1 and isinstance(body[0], dict):
        body_obj = body[0]

    if body_obj is None:
        return TranslateResult(
            success=True, fully_supported=False,
            unsupported_types=["page.body-multi-or-non-object"],
            notes=["page.body 阶段 A 仅支持单个 form 子节点"],
        )

    body_type = str(body_obj.get("type", ""))
    if body_type == "form":
        sfc = translate_form_body(body_obj, page_title)
    elif body_type == "crud":
        sfc = translate_crud_body(body_obj, page_title)
    else:
        return TranslateResult(
            success=True, fully_supported=False,
            unsupported_types=[body_type or "<missing-type>"],
            notes=[f"page.body type={body_type!r} 暂不支持，回退 LLM 兜底"],
        )

    if sfc.startswith(UNSUPPORTED_PREFIX):
        unsup = sfc[len(UNSUPPORTED_PREFIX):]
        return TranslateResult(
            success=True, fully_supported=False,
            unsupported_types=[unsup],
            notes=[f"{body_type} 内含不支持的元素 {unsup!r}，回退 LLM 兜底"],
        )

    file_path = f"src/pages/{page_name}/{page_name}.vue"
    page_route = f"pages/{page_name}/{page_name}"

    files: dict[str, str] = {file_path: sfc}

    # 计算新 pages.json（crud 类型自动启用下拉刷新）
    new_pages_json = _patch_pages_json(
        current=current_pages_json,
        page_route=page_route,
        page_title=page_title,
        enable_pull_down_refresh=(body_type == "crud"),
    )
    files["src/pages.json"] = json.dumps(new_pages_json, ensure_ascii=False, indent=2) + "\n"

    return TranslateResult(
        success=True,
        fully_supported=True,
        files=files,
        notes=[
            f"已生成页面 {page_route}（标题: {page_title}）",
            f"已 patch src/pages.json：追加路由 + 确保 globalStyle.rpxCalc*",
        ],
    )


def _patch_pages_json(
    current: Optional[dict],
    page_route: str,
    page_title: str,
    enable_pull_down_refresh: bool = False,
) -> dict:
    """基于现有 pages.json 增量 patch：追加 page 路由 + 确保 globalStyle 关键字段。

    - 不动 easycom（脚手架已配好）
    - pages 数组里若已有该 path 则不重复
    - globalStyle 缺 rpxCalc* 字段时补上（防 PC 预览字号失真）
    - enable_pull_down_refresh：crud 类型必开（onPullDownRefresh 钩子才会触发）
    """
    base: dict[str, Any] = {}
    if isinstance(current, dict):
        base = json.loads(json.dumps(current))  # deep copy

    # easycom：脚手架默认已配；缺失才补
    if "easycom" not in base:
        base["easycom"] = {
            "autoscan": True,
            "custom": {"^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"},
        }

    # pages 数组
    pages = base.get("pages", [])
    if not isinstance(pages, list):
        pages = []
    if not any(isinstance(p, dict) and p.get("path") == page_route for p in pages):
        page_style: dict[str, Any] = {
            "navigationBarTitleText": page_title,
            "navigationBarBackgroundColor": "#ffffff",
            "navigationBarTextStyle": "black",
        }
        if enable_pull_down_refresh:
            page_style["enablePullDownRefresh"] = True
        pages.append({"path": page_route, "style": page_style})
    base["pages"] = pages

    # globalStyle：确保 rpxCalc* 字段在（防 PC 预览字号失真，详见
    # scaffolds/uniapp-wot-h5-template/src/pages.json）
    gs = base.get("globalStyle")
    if not isinstance(gs, dict):
        gs = {}
    gs.setdefault("navigationBarTextStyle", "black")
    gs.setdefault("navigationBarTitleText", "amis-ai")
    gs.setdefault("navigationBarBackgroundColor", "#ffffff")
    gs.setdefault("backgroundColor", "#f5f5f5")
    gs.setdefault("rpxCalcMaxDeviceWidth", 480)
    gs.setdefault("rpxCalcBaseDeviceWidth", 375)
    base["globalStyle"] = gs

    return base
