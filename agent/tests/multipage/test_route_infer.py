"""测试 /route-infer 端点：给一段 amis JSON 推断合理路由路径。"""
import pytest
from unittest.mock import patch, AsyncMock

from src.routers.route_infer import infer_route_path


@pytest.mark.asyncio
async def test_infer_route_returns_kebab_case_path():
    with patch("src.routers.route_infer.chat_completion", new_callable=AsyncMock) as m:
        m.return_value = {
            "choices": [{"message": {"content": "/users/list"}}]
        }
        path = await infer_route_path('{"type":"crud","title":"用户列表"}')
        assert path.startswith("/")
        assert " " not in path
        assert path == "/users/list"


@pytest.mark.asyncio
async def test_infer_route_falls_back_when_llm_returns_garbage():
    with patch("src.routers.route_infer.chat_completion", new_callable=AsyncMock) as m:
        m.return_value = {"choices": [{"message": {"content": "@@invalid"}}]}
        path = await infer_route_path('{"type":"page"}', fallback_idx=3)
        assert path == "/page3"


@pytest.mark.asyncio
async def test_infer_route_strips_trailing_slash():
    with patch("src.routers.route_infer.chat_completion", new_callable=AsyncMock) as m:
        m.return_value = {"choices": [{"message": {"content": "/orders/"}}]}
        path = await infer_route_path('{"type":"crud"}')
        assert path == "/orders"
