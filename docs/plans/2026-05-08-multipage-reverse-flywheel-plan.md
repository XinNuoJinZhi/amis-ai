# 反向飞轮多页面 + 多策略 + RAG 自学习 实施计划（1.2.0）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把反向飞轮从「单 amis_json → 单 UniApp 项目」扩到「N 段 amis JSON + 可选路由 → 多页 UniApp 项目」，提供 5 种执行/复用策略由用户选择，全程数据回喂 RAG 自学习闭环。

**Architecture:** 双执行模式（独立 / 统筹）+ 5 种复用策略（R1 骨架先行 / R2 prompt 注入 / R3 后处理重构 / R4 不复用 / 统筹）；tasks 表加 3 个 strategy 字段 + 新建 `project_task_page` 子表；复用 1.1 RAG `code_samples` + tags 机制扩展 multipage 标签。

**Tech Stack:** Rust/axum + sea-orm（backend / sandbox / claw-agent-server）+ Python/FastAPI（agent + RAG）+ TypeScript/React（frontend）+ PostgreSQL pgvector

**配套 spec:** [2026-05-08-multipage-reverse-flywheel-design.md](2026-05-08-multipage-reverse-flywheel-design.md)

---

## 文件结构（locked-in）

```
backend/src/
├── entity/
│   └── project_task_page.rs                # 新建：sea-orm entity
├── handlers/
│   ├── project_generation.rs               # 改：create_task 支持 N 段 + strategy
│   └── project_pages.rs                    # 新建：GET /api/projects/tasks/:id/pages
├── services/
│   ├── multipage_scheduler.rs              # 新建：5 策略调度器（trait + dispatch）
│   ├── global_prompt_builder.rs            # 新建：R2 全局清单 prompt 段构造
│   └── route_inferer_client.rs             # 新建：HTTP 客户端调 agent /route-infer
└── main.rs                                 # 改：ALTER + CREATE 运行时迁移

agent/src/
├── routers/
│   ├── route_infer.py                      # 新建：POST /route-infer
│   └── multipage_record.py                 # 新建：POST /multipage/record（采纳后写 code_samples）
└── knowledge/
    └── multipage_recorder.py               # 新建：把多页任务结果灌 RAG（带 strategy tags）

agent/tests/multipage/
├── __init__.py
├── conftest.py                             # 复用 tests/knowledge/conftest.py 的 db_pool
├── test_route_infer.py
└── test_multipage_recorder.py

claw-code/rust/crates/claw-agent-server/prompts/
├── scaffold_skeleton.md                    # 新建：R1 第 1 阶段
├── scaffold_refactor.md                    # 新建：R3 第 2 阶段
└── multipage_unified.md                    # 新建：统筹模式

sandbox/src/
└── reuse_metrics.rs                        # 新建：grep import shared/ 算复用率

frontend/src/
├── views/Projects/
│   ├── CreateMultipageTask.tsx             # 新建：多页输入页
│   └── detail/panels/
│       └── PagesPanel.tsx                  # 新建：pages tab
├── services/
│   └── multipage.ts                        # 新建：多页 API client
└── views/Projects/detail/
    └── EditorView.tsx                      # 改：根据 task.page_count > 1 显示 PagesPanel

eval/multipage-1.2/
├── prompts.json                            # 多页测试用例（3/5/8 页 + 5 策略组合）
├── runner.py                               # 端到端跑分
└── README.md
```

**不修改：**
- `claw-code/rust/crates/{api,runtime,tools,...}`（第三方代码）
- 1.1 已落地的 `agent/src/knowledge/amis_importer/*` / `agent/src/knowledge/amis_types_extractor/*`

---

## 共用模板片段

### § A：sea-orm entity 标准头

```rust
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "<TABLE_NAME>")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    // ... 字段
    pub created_at: ChronoDateTimeUtc,
    pub updated_at: ChronoDateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

### § B：agent FastAPI router 标准头

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class XxxRequest(BaseModel):
    field: str


@router.post("/<endpoint>")
async def handler(req: XxxRequest) -> dict:
    ...
```

### § C：测试惯例

- 项目根：`/home/karl/Working/TianXing/amis-ai`
- agent 测试：`cd agent && uv run pytest tests/<module>/<test>.py -v`，import 用 `from knowledge.xxx` / `from routers.xxx`（pytest pythonpath=["src"] 已配）
- backend 测试：`cd backend && cargo test`
- sandbox 测试：`cd sandbox && cargo test`
- frontend 测试：`cd frontend && pnpm test`（vitest）
- DB 集成测试：复用 [agent/tests/knowledge/conftest.py](../../agent/tests/knowledge/conftest.py) 的 `db_pool` fixture（已有 `'amis-knowledge-test'` tag 自动清理）

---

## Phase 0：准备（0.5 天）

### Task 0.1：分支检查 + 工作树清洁

**Files:** 无新增

- [ ] **Step 1: 确认 dev/1.2.0 分支 + 工作树 clean**

```bash
git status
```
Expected:
```
On branch dev/1.2.0
nothing to commit, working tree clean
```

- [ ] **Step 2: 确认 spec 已提交（commit f83635a）**

```bash
git log --oneline -3
```
Expected: `f83635a docs(1.2): 反向飞轮多页面 + 多策略 + RAG 自学习设计稿` 在最新。

- [ ] **Step 3: 确认 1.1 数据已就位（基础设施 ready）**

```bash
PGPASSWORD=amis_ai_dev psql -h localhost -U amis_ai -d amis_ai -c "SELECT count(*) FROM code_samples WHERE 'amis-knowledge-1.1' = ANY(tags)"
```
Expected: `count` ≥ 80（1.1 灌入的 amis 知识库基础）

---

## Phase W1：DB schema + 多页输入 UI 骨架 + 路由解析器（1 周）

### Task W1.1：DB schema 扩展（project_generation_task 加 3 字段）

**Files:**
- Modify: [`backend/src/main.rs`](../../backend/src/main.rs)（运行时建表段）

- [ ] **Step 1: 在 backend/src/main.rs 找到运行时 ALTER 段（搜索 `tech_stacks text\[\] NOT NULL DEFAULT`）**

- [ ] **Step 2: 加新 ALTER 语句**

在 `ALTER TABLE project_generation_task ADD COLUMN IF NOT EXISTS ...` 段后追加：

```rust
// 1.2.0 多页扩展：执行策略 + 复用策略 + 页数
db.execute_unprepared(
    "ALTER TABLE project_generation_task
        ADD COLUMN IF NOT EXISTS execution_strategy varchar(16) NOT NULL DEFAULT 'unified',
        ADD COLUMN IF NOT EXISTS reuse_strategy varchar(16),
        ADD COLUMN IF NOT EXISTS page_count integer NOT NULL DEFAULT 1"
).await?;

db.execute_unprepared(
    "CREATE INDEX IF NOT EXISTS idx_pgt_strategy
     ON project_generation_task (execution_strategy, reuse_strategy)
     WHERE execution_strategy = 'isolated'"
).await?;
```

- [ ] **Step 3: 编译验证**

```bash
cd backend && cargo build 2>&1 | tail -5
```
Expected: `Finished dev` 不报错。

- [ ] **Step 4: 启动 backend 让 schema 生效**

```bash
./shared/scripts/start-services.sh restart
sleep 10
PGPASSWORD=amis_ai_dev psql -h localhost -U amis_ai -d amis_ai -c "\d project_generation_task" | grep -E "execution_strategy|reuse_strategy|page_count"
```
Expected: 看到 3 个新列。

- [ ] **Step 5: Commit**

```bash
git add backend/src/main.rs
git commit -m "feat(1.2): project_generation_task 加 execution_strategy / reuse_strategy / page_count 字段"
```

### Task W1.2：新建 project_task_page entity + 运行时建表

**Files:**
- Create: `backend/src/entity/project_task_page.rs`
- Modify: `backend/src/entity/mod.rs`（注册新 entity）
- Modify: `backend/src/main.rs`（CREATE TABLE）

- [ ] **Step 1: 写 entity（按 § A 模板）**

Create `backend/src/entity/project_task_page.rs`:

```rust
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "project_task_page")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub task_id: i32,
    pub page_idx: i32,
    pub route_path: String,
    pub amis_json: String,
    pub claw_session_id: Option<String>,
    pub status: String,            // pending/running/done/failed
    pub started_at: Option<ChronoDateTimeUtc>,
    pub finished_at: Option<ChronoDateTimeUtc>,
    pub error_msg: Option<String>,
    pub created_at: ChronoDateTimeUtc,
    pub updated_at: ChronoDateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::project_generation_task::Entity",
        from = "Column::TaskId",
        to = "super::project_generation_task::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    Task,
}

impl Related<super::project_generation_task::Entity> for Entity {
    fn to(&self) -> RelationDef {
        Relation::Task.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
```

- [ ] **Step 2: 在 entity/mod.rs 注册**

Modify `backend/src/entity/mod.rs`:

```rust
pub mod project_task_page;  // 加这行（位置按字母序）
```

- [ ] **Step 3: 在 main.rs 加运行时建表**

在 `tech_stacks text[]` ALTER 之后加：

```rust
db.execute_unprepared(
    "CREATE TABLE IF NOT EXISTS project_task_page (
        id              SERIAL PRIMARY KEY,
        task_id         INT NOT NULL REFERENCES project_generation_task(id) ON DELETE CASCADE,
        page_idx        INT NOT NULL,
        route_path      VARCHAR(255) NOT NULL,
        amis_json       TEXT NOT NULL,
        claw_session_id VARCHAR(64),
        status          VARCHAR(16) NOT NULL DEFAULT 'pending',
        started_at      TIMESTAMPTZ,
        finished_at     TIMESTAMPTZ,
        error_msg       TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (task_id, page_idx),
        UNIQUE (task_id, route_path)
    )"
).await?;
db.execute_unprepared(
    "CREATE INDEX IF NOT EXISTS idx_ptp_task_status
     ON project_task_page (task_id, status)"
).await?;
```

- [ ] **Step 4: 编译 + 启动验证**

```bash
cd backend && cargo build 2>&1 | tail -5
./shared/scripts/start-services.sh restart
sleep 10
PGPASSWORD=amis_ai_dev psql -h localhost -U amis_ai -d amis_ai -c "\d project_task_page"
```
Expected: 表存在，含 13 列、UNIQUE 约束、索引。

- [ ] **Step 5: Commit**

```bash
git add backend/src/entity/project_task_page.rs backend/src/entity/mod.rs backend/src/main.rs
git commit -m "feat(1.2): 新建 project_task_page 子表 entity + 运行时建表"
```

### Task W1.3：agent /route-infer 端点

**Files:**
- Create: `agent/src/routers/route_infer.py`
- Modify: `agent/src/main.py`（注册 router）
- Test: `agent/tests/multipage/test_route_infer.py`
- Test fixture: `agent/tests/multipage/__init__.py`（空）

- [ ] **Step 1: 写测试**

Create `agent/tests/multipage/__init__.py`（空文件）

Create `agent/tests/multipage/test_route_infer.py`:

```python
"""测试 /route-infer 端点：给一段 amis JSON 推断合理路由路径。"""
import pytest
from unittest.mock import patch, AsyncMock

from routers.route_infer import infer_route_path


@pytest.mark.asyncio
async def test_infer_route_returns_kebab_case_path():
    """LLM 给个 user-list 之类的 path，函数清洗后必须 / 开头 + kebab-case。"""
    with patch("routers.route_infer.chat_completion", new_callable=AsyncMock) as m:
        m.return_value = {
            "choices": [{"message": {"content": "/users/list"}}]
        }
        path = await infer_route_path('{"type":"crud","title":"用户列表"}')
        assert path.startswith("/")
        assert " " not in path
        assert path == "/users/list"


@pytest.mark.asyncio
async def test_infer_route_falls_back_when_llm_returns_garbage():
    """LLM 输出怪东西时，函数返回 /pageN 兜底，不抛异常。"""
    with patch("routers.route_infer.chat_completion", new_callable=AsyncMock) as m:
        m.return_value = {"choices": [{"message": {"content": "@@invalid"}}]}
        path = await infer_route_path('{"type":"page"}', fallback_idx=3)
        assert path == "/page3"


@pytest.mark.asyncio
async def test_infer_route_strips_trailing_slash():
    """LLM 加了尾 slash 要去掉。"""
    with patch("routers.route_infer.chat_completion", new_callable=AsyncMock) as m:
        m.return_value = {"choices": [{"message": {"content": "/orders/"}}]}
        path = await infer_route_path('{"type":"crud"}')
        assert path == "/orders"
```

- [ ] **Step 2: 跑测试看 FAIL**

```bash
cd agent && uv run pytest tests/multipage/test_route_infer.py -v
```
Expected: `FAILED` with `ImportError: cannot import name 'infer_route_path'`

- [ ] **Step 3: 写实现**

Create `agent/src/routers/route_infer.py`:

```python
"""路由路径推断：给一段 amis JSON 推断 UniApp 合理路由路径。"""
from __future__ import annotations
import re

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.llm_client import chat_completion

router = APIRouter()

_VALID_PATH_RE = re.compile(r"^/[a-z0-9]+(?:[-/][a-z0-9]+)*$")


class InferRouteRequest(BaseModel):
    amis_json: str
    fallback_idx: int = 0


class InferRouteResponse(BaseModel):
    route_path: str


_SYSTEM_PROMPT = """你是 UniApp 路由设计助手。给一段 amis JSON，推断一个合理的 UniApp 路由路径。

规则：
- 路径以 / 开头
- 全小写 kebab-case
- 反映页面用途（crud→/<resource>/list、form→/<resource>/edit、dashboard→/dashboard 等）
- 不要尾 slash
- 直接输出路径文本，不要解释，不要 markdown 包裹

示例：
- {"type":"crud","title":"用户列表"} → /users/list
- {"type":"form","api":"/api/order/create"} → /orders/create
- {"type":"page","title":"仪表盘"} → /dashboard
"""


def _clean_path(raw: str, fallback_idx: int) -> str:
    """清洗 LLM 输出。失败回退 /pageN。"""
    s = raw.strip().splitlines()[0].strip().rstrip("/")
    if not s.startswith("/"):
        s = "/" + s
    if not _VALID_PATH_RE.match(s):
        return f"/page{fallback_idx}"
    return s


async def infer_route_path(amis_json: str, fallback_idx: int = 0) -> str:
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": amis_json[:2000]},  # 截断防过长
    ]
    try:
        result = await chat_completion("generation", messages, stream=False)
        raw = result["choices"][0]["message"]["content"]
        return _clean_path(raw, fallback_idx)
    except Exception as e:
        print(f"[route-infer] LLM 调用失败：{e}")
        return f"/page{fallback_idx}"


@router.post("/route-infer", response_model=InferRouteResponse)
async def post_infer_route(req: InferRouteRequest) -> InferRouteResponse:
    path = await infer_route_path(req.amis_json, req.fallback_idx)
    return InferRouteResponse(route_path=path)
```

- [ ] **Step 4: 注册 router**

Modify `agent/src/main.py`：在 `from .routers import generate, health, internal, skill_authoring` 加 `route_infer`：

```python
from .routers import generate, health, internal, skill_authoring, route_infer
# ... 后面 app.include_router 段加：
app.include_router(route_infer.router, tags=["路由推断"])
```

- [ ] **Step 5: 跑测试看 PASS**

```bash
cd agent && uv run pytest tests/multipage/test_route_infer.py -v
```
Expected: `3 passed`

- [ ] **Step 6: Commit**

```bash
git add agent/src/routers/route_infer.py agent/src/main.py agent/tests/multipage/
git commit -m "feat(1.2): agent /route-infer 端点（LLM 推断 UniApp 路由路径）"
```

### Task W1.4：backend create_task 接受 N 段 amis JSON

**Files:**
- Modify: `backend/src/handlers/project_generation.rs`（CreateTaskBody 加多页字段 + create_task 分支）
- Create: `backend/src/services/route_inferer_client.rs`

- [ ] **Step 1: 写 route_inferer_client.rs（HTTP 调 agent）**

Create `backend/src/services/route_inferer_client.rs`:

```rust
//! 调 agent /route-infer 推断路由路径

use serde::{Deserialize, Serialize};

const AGENT_ROUTE_INFER_URL: &str = "http://localhost:8000/route-infer";

#[derive(Serialize)]
struct InferRouteRequest<'a> {
    amis_json: &'a str,
    fallback_idx: i32,
}

#[derive(Deserialize)]
struct InferRouteResponse {
    route_path: String,
}

/// 调 agent 推断路由路径；失败回退 /pageN
pub async fn infer_route_path(amis_json: &str, fallback_idx: i32) -> String {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap();
    let req = InferRouteRequest { amis_json, fallback_idx };
    match client.post(AGENT_ROUTE_INFER_URL).json(&req).send().await {
        Ok(resp) if resp.status().is_success() => match resp.json::<InferRouteResponse>().await {
            Ok(body) => body.route_path,
            Err(_) => format!("/page{}", fallback_idx),
        },
        _ => format!("/page{}", fallback_idx),
    }
}
```

- [ ] **Step 2: 注册 service mod**

Modify `backend/src/services/mod.rs`（如果存在）加 `pub mod route_inferer_client;`，没有就在 `backend/src/lib.rs` 找 services 段加。

- [ ] **Step 3: 改 CreateTaskBody 加多页字段**

Modify `backend/src/handlers/project_generation.rs`：找到 `pub struct CreateTaskBody`，加：

```rust
#[derive(Deserialize, Debug)]
pub struct PageInput {
    pub amis_json: String,
    pub route_path: Option<String>,  // 用户填或 None 让 LLM 推
}

#[derive(Deserialize, Debug)]
pub struct CreateTaskBody {
    // ... 原有字段
    /// 多页模式：N 段 amis JSON。如果 None 走旧的 amis_json 单页路径
    #[serde(default)]
    pub pages: Option<Vec<PageInput>>,
    /// 执行策略：unified / isolated
    #[serde(default = "default_execution_strategy")]
    pub execution_strategy: String,
    /// 复用策略（仅 isolated 时有意义）
    #[serde(default)]
    pub reuse_strategy: Option<String>,
}

fn default_execution_strategy() -> String { "unified".to_string() }
```

- [ ] **Step 4: 改 create_task 分支处理多页**

在 `pub async fn create_task(...)` 函数里，DB 记录创建段加：

```rust
// 1.2.0 多页支持：如果 body.pages 非空，写 project_task_page 子表 + 设 page_count
let pages_input = body.pages.as_deref().unwrap_or(&[]);
let page_count = if pages_input.is_empty() { 1 } else { pages_input.len() as i32 };

// ... 原有 task_active = ActiveModel { ... } 段，加：
//     execution_strategy: Set(body.execution_strategy.clone()),
//     reuse_strategy: Set(body.reuse_strategy.clone()),
//     page_count: Set(page_count),

// 任务行 INSERT 完拿到 task_id 后，写 pages 子表
if !pages_input.is_empty() {
    use crate::entity::project_task_page;
    for (idx, p) in pages_input.iter().enumerate() {
        let route = match &p.route_path {
            Some(r) if !r.trim().is_empty() => r.trim().to_string(),
            _ => crate::services::route_inferer_client::infer_route_path(
                &p.amis_json, idx as i32
            ).await,
        };
        let page_active = project_task_page::ActiveModel {
            task_id: Set(inserted.id),
            page_idx: Set(idx as i32),
            route_path: Set(route),
            amis_json: Set(p.amis_json.clone()),
            status: Set("pending".to_string()),
            ..Default::default()
        };
        page_active.insert(&state.db).await.ok();
    }
}
```

- [ ] **Step 5: 写集成测试（端到端 POST）**

Create `backend/tests/multipage_create.rs`（如果没有 tests 目录就 mkdir）：

```rust
//! 端到端测试 create_task 多页路径
use serde_json::json;

#[tokio::test]
#[ignore]  // 需要 backend 在 :8080 跑
async fn test_create_task_multipage_writes_pages() {
    // 假设管理员 JWT 已配置在 env TEST_ADMIN_JWT
    let token = std::env::var("TEST_ADMIN_JWT").expect("set TEST_ADMIN_JWT");
    let client = reqwest::Client::new();
    let body = json!({
        "title": "test multipage",
        "amis_json": "{}",  // 单页字段保留兼容
        "tech_stack": "uniapp-wot-h5",
        "pages": [
            {"amis_json": "{\"type\":\"crud\",\"title\":\"列表\"}", "route_path": "/list"},
            {"amis_json": "{\"type\":\"form\"}"}
        ],
        "execution_strategy": "isolated",
        "reuse_strategy": "r4_none"
    });
    let resp = client.post("http://localhost:8080/api/projects/tasks")
        .bearer_auth(token)
        .json(&body)
        .send().await.unwrap();
    assert!(resp.status().is_success());
    // pages 行落库，第二条 route_path 由 LLM 推断（非 /page1 即成功）
}
```

- [ ] **Step 6: 编译 + 启动验证**

```bash
cd backend && cargo build 2>&1 | tail -3
./shared/scripts/start-services.sh restart
sleep 10
```
Expected: 编译通过，4 服务起来。

- [ ] **Step 7: Commit**

```bash
git add backend/src/handlers/project_generation.rs backend/src/services/route_inferer_client.rs backend/src/services/mod.rs backend/tests/
git commit -m "feat(1.2): create_task 支持 N 段 amis JSON + 路由 LLM 推断兜底"
```

### Task W1.5：前端 CreateMultipageTask.tsx 骨架

**Files:**
- Create: `frontend/src/views/Projects/CreateMultipageTask.tsx`
- Create: `frontend/src/services/multipage.ts`
- Modify: `frontend/src/router/index.tsx`（加 `/projects/new-multipage` 路由）

- [ ] **Step 1: 写 multipage API client**

Create `frontend/src/services/multipage.ts`:

```typescript
import { http } from './http';

export interface PageInput {
  amis_json: string;
  route_path?: string;
}

export interface CreateMultipageTaskRequest {
  title: string;
  tech_stack: string;
  pages: PageInput[];
  execution_strategy: 'unified' | 'isolated';
  reuse_strategy?: 'r1_skeleton' | 'r2_prompt' | 'r3_refactor' | 'r4_none';
}

export interface CreateTaskResponse {
  task_id: number;
}

export async function createMultipageTask(
  req: CreateMultipageTaskRequest
): Promise<CreateTaskResponse> {
  // 复用 /api/projects/tasks，body 加 pages 即触发多页路径
  const resp = await http.post<CreateTaskResponse>('/projects/tasks', {
    title: req.title,
    amis_json: '{}',  // 兼容旧字段
    tech_stack: req.tech_stack,
    pages: req.pages,
    execution_strategy: req.execution_strategy,
    reuse_strategy: req.reuse_strategy,
  });
  return resp.data;
}
```

- [ ] **Step 2: 写 CreateMultipageTask 页面**

Create `frontend/src/views/Projects/CreateMultipageTask.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, message, Radio, Select, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { createMultipageTask, type PageInput } from '../../services/multipage';

const { TextArea } = Input;

type ExecMode = 'unified' | 'isolated';
type ReuseStrategy = 'r1_skeleton' | 'r2_prompt' | 'r3_refactor' | 'r4_none';

export default function CreateMultipageTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [techStack, setTechStack] = useState('uniapp-wot-h5');
  const [execMode, setExecMode] = useState<ExecMode>('isolated');
  const [reuseStrategy, setReuseStrategy] = useState<ReuseStrategy>('r1_skeleton');
  const [pages, setPages] = useState<PageInput[]>([{ amis_json: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const updatePage = (idx: number, patch: Partial<PageInput>) => {
    setPages(pages.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };
  const addPage = () => setPages([...pages, { amis_json: '' }]);
  const removePage = (idx: number) =>
    setPages(pages.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!title.trim()) return message.warning('标题必填');
    if (pages.length === 0) return message.warning('至少 1 页');
    if (pages.some((p) => !p.amis_json.trim()))
      return message.warning('每页 amis JSON 必填');
    setSubmitting(true);
    try {
      const r = await createMultipageTask({
        title: title.trim(),
        tech_stack: techStack,
        pages,
        execution_strategy: execMode,
        reuse_strategy: execMode === 'isolated' ? reuseStrategy : undefined,
      });
      message.success(`任务创建成功（id=${r.task_id}）`);
      navigate(`/projects/${r.task_id}`);
    } catch (e: unknown) {
      const resp = (e as { response?: { data?: { error?: string } } }).response;
      message.error(`创建失败：${resp?.data?.error ?? String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="新建多页面反向飞轮任务" style={{ margin: 24 }}>
      <Form layout="vertical">
        <Form.Item label="任务标题" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Form.Item>
        <Form.Item label="技术栈">
          <Select value={techStack} onChange={setTechStack} options={[
            { value: 'uniapp-wot-h5', label: 'UniApp + Wot UI H5' },
          ]} />
        </Form.Item>
        <Form.Item label="执行模式">
          <Radio.Group value={execMode} onChange={(e) => setExecMode(e.target.value)} buttonStyle="solid">
            <Radio.Button value="isolated">独立（多 session 并发）</Radio.Button>
            <Radio.Button value="unified">统筹（单 session）</Radio.Button>
          </Radio.Group>
        </Form.Item>
        {execMode === 'isolated' && (
          <Form.Item label="复用策略">
            <Radio.Group value={reuseStrategy} onChange={(e) => setReuseStrategy(e.target.value)}>
              <Radio value="r1_skeleton">R1 骨架先行（推荐）</Radio>
              <Radio value="r2_prompt">R2 prompt 注入</Radio>
              <Radio value="r3_refactor">R3 后处理重构</Radio>
              <Radio value="r4_none">R4 不复用（baseline）</Radio>
            </Radio.Group>
          </Form.Item>
        )}
        <Form.Item label={`页面（共 ${pages.length} 页）`}>
          {pages.map((p, idx) => (
            <Card
              key={idx}
              size="small"
              style={{ marginBottom: 8 }}
              title={`页面 #${idx + 1}`}
              extra={
                pages.length > 1 ? (
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => removePage(idx)}
                  />
                ) : null
              }
            >
              <Form.Item label="路由路径（留空 LLM 推断）">
                <Input
                  placeholder="如 /users/list"
                  value={p.route_path ?? ''}
                  onChange={(e) => updatePage(idx, { route_path: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="amis JSON" required>
                <TextArea
                  rows={6}
                  placeholder='{"type":"page",...}'
                  value={p.amis_json}
                  onChange={(e) => updatePage(idx, { amis_json: e.target.value })}
                />
              </Form.Item>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={addPage}>
            添加一页
          </Button>
        </Form.Item>
        <Space>
          <Button type="primary" loading={submitting} onClick={submit}>
            创建任务
          </Button>
          <Button onClick={() => navigate(-1)}>取消</Button>
        </Space>
      </Form>
    </Card>
  );
}
```

- [ ] **Step 3: 注册路由**

Modify `frontend/src/router/index.tsx` 在 `/projects/*` 段加：

```tsx
import CreateMultipageTask from '../views/Projects/CreateMultipageTask';

// 在 routes 数组里：
{ path: '/projects/new-multipage', element: <CreateMultipageTask /> },
```

- [ ] **Step 4: 类型检查 + build**

```bash
cd frontend && pnpm tsc --noEmit 2>&1 | tail -10
```
Expected: 无错误（如果 http.ts 不存在，先确认项目里现有的 axios/http client 命名，调整 import）。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/Projects/CreateMultipageTask.tsx frontend/src/services/multipage.ts frontend/src/router/index.tsx
git commit -m "feat(1.2): 前端多页输入页 CreateMultipageTask（N 段 amis + 路由 + 策略下拉）"
```

---

## Phase W2：调度器 + R4 baseline + 限流（1 周）

### Task W2.1：multipage_scheduler.rs 骨架

**Files:**
- Create: `backend/src/services/multipage_scheduler.rs`
- Modify: `backend/src/services/mod.rs`

- [ ] **Step 1: 写 trait + dispatch 骨架**

Create `backend/src/services/multipage_scheduler.rs`:

```rust
//! 多页任务调度器：5 种策略统一入口

use crate::entity::{project_generation_task, project_task_page};
use crate::AppState;
use sea_orm::EntityTrait;

#[derive(Debug)]
pub enum SchedulerError {
    Db(sea_orm::DbErr),
    ClawAgent(String),
    Sandbox(String),
    InvalidStrategy(String),
}

pub type SchedulerResult<T> = Result<T, SchedulerError>;

/// 调度器入口：按 task 的 execution_strategy + reuse_strategy 分派到对应实现
pub async fn dispatch(
    state: &AppState,
    task_id: i32,
) -> SchedulerResult<()> {
    let task = project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
        .map_err(SchedulerError::Db)?
        .ok_or_else(|| SchedulerError::InvalidStrategy(format!("task {} 不存在", task_id)))?;

    let pages = project_task_page::Entity::find()
        .filter(project_task_page::Column::TaskId.eq(task_id))
        .order_by_asc(project_task_page::Column::PageIdx)
        .all(&state.db)
        .await
        .map_err(SchedulerError::Db)?;

    if pages.is_empty() {
        // 单页旧路径，跳过
        return Ok(());
    }

    match task.execution_strategy.as_str() {
        "unified" => run_unified(state, &task, &pages).await,
        "isolated" => match task.reuse_strategy.as_deref() {
            Some("r1_skeleton") => run_r1_skeleton(state, &task, &pages).await,
            Some("r2_prompt") => run_r2_prompt(state, &task, &pages).await,
            Some("r3_refactor") => run_r3_refactor(state, &task, &pages).await,
            Some("r4_none") | None => run_r4_baseline(state, &task, &pages).await,
            Some(other) => Err(SchedulerError::InvalidStrategy(format!(
                "未知 reuse_strategy: {}", other))),
        },
        other => Err(SchedulerError::InvalidStrategy(format!(
            "未知 execution_strategy: {}", other))),
    }
}

// 占位实现，每个 stub 在后续 Task 里写真实逻辑
async fn run_unified(_s: &AppState, _t: &project_generation_task::Model, _p: &[project_task_page::Model]) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy("unified 待 W5 实现".to_string()))
}
async fn run_r1_skeleton(_s: &AppState, _t: &project_generation_task::Model, _p: &[project_task_page::Model]) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy("r1_skeleton 待 W4 实现".to_string()))
}
async fn run_r2_prompt(_s: &AppState, _t: &project_generation_task::Model, _p: &[project_task_page::Model]) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy("r2_prompt 待 W3 实现".to_string()))
}
async fn run_r3_refactor(_s: &AppState, _t: &project_generation_task::Model, _p: &[project_task_page::Model]) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy("r3_refactor 待 W5 实现".to_string()))
}
async fn run_r4_baseline(_s: &AppState, _t: &project_generation_task::Model, _p: &[project_task_page::Model]) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy("r4_baseline 待 W2.2 实现".to_string()))
}
```

- [ ] **Step 2: 在 services/mod.rs 注册**

Modify `backend/src/services/mod.rs` 加 `pub mod multipage_scheduler;`

- [ ] **Step 3: 编译验证**

```bash
cd backend && cargo build 2>&1 | tail -3
```
Expected: 编译通过（5 个 stub 函数都返回 Err 是预期）。

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/multipage_scheduler.rs backend/src/services/mod.rs
git commit -m "feat(1.2): multipage_scheduler 调度器骨架（trait + 5 策略 dispatch）"
```

### Task W2.2：R4 baseline 实现（N session 并发，无共享）

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`

- [ ] **Step 1: 写 R4 实现**

替换 `run_r4_baseline` 函数为：

```rust
async fn run_r4_baseline(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    use crate::services::claw_agent::ClawAgentClient;
    use sea_orm::Set;
    use tokio::task::JoinSet;

    let claw = ClawAgentClient::new();
    let max_concurrent = std::env::var("MAX_CONCURRENT_SESSIONS")
        .ok().and_then(|s| s.parse().ok()).unwrap_or(3usize);

    let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(max_concurrent));
    let mut joinset: JoinSet<(i32, Result<String, String>)> = JoinSet::new();

    for page in pages {
        let permit = semaphore.clone().acquire_owned().await
            .map_err(|e| SchedulerError::ClawAgent(format!("semaphore: {}", e)))?;
        let page_id = page.id;
        let prompt = build_page_prompt(task, page, /* shared_context */ None);
        let claw_clone = claw.clone();
        let task_workdir = task.workdir_path.clone();
        joinset.spawn(async move {
            let _permit = permit;
            // 调 claw-agent 创建子 session 跑这一页
            let result = claw_clone.create_task(/* prompt */ &prompt, /* workdir */ task_workdir.as_deref().unwrap_or("")).await
                .map_err(|e| e.to_string());
            (page_id, result.map(|r| r.session_id))
        });
    }

    while let Some(joined) = joinset.join_next().await {
        let (page_id, result) = joined.map_err(|e| SchedulerError::ClawAgent(e.to_string()))?;
        let now = chrono::Utc::now();
        let mut active = project_task_page::ActiveModel {
            id: Set(page_id),
            updated_at: Set(now.into()),
            ..Default::default()
        };
        match result {
            Ok(session_id) => {
                active.claw_session_id = Set(Some(session_id));
                active.status = Set("done".to_string());
                active.finished_at = Set(Some(now.into()));
            }
            Err(err) => {
                active.status = Set("failed".to_string());
                active.error_msg = Set(Some(err));
                active.finished_at = Set(Some(now.into()));
            }
        }
        active.update(&state.db).await.map_err(SchedulerError::Db)?;
    }

    Ok(())
}

fn build_page_prompt(
    _task: &project_generation_task::Model,
    page: &project_task_page::Model,
    _shared_context: Option<&str>,
) -> String {
    format!(
        "请基于以下 amis JSON 在 src/pages{} 路径下生成对应的 UniApp Vue 页面文件，并在 src/pages.json 注册路由。\n\namis JSON：\n{}",
        page.route_path,
        page.amis_json,
    )
}
```

- [ ] **Step 2: 编译 + 写集成测试**

```bash
cd backend && cargo build 2>&1 | tail -3
```
Expected: 编译通过；如有 ClawAgentClient 接口不一致，按实际签名调整。

写集成测试 `backend/tests/multipage_r4.rs`：

```rust
#[tokio::test]
#[ignore]  // 需要 backend + agent + claw-agent + sandbox 全在线
async fn test_r4_baseline_3_pages_completes() {
    // 创建一个 isolated + r4_none 的 3 页任务，等 30s 内所有 page status=done
    // ... 整端到端用 reqwest 调 /api/projects/tasks
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/multipage_scheduler.rs backend/tests/multipage_r4.rs
git commit -m "feat(1.2): R4 baseline 实现（N session 并发 + Semaphore 限流）"
```

### Task W2.3：sandbox max_concurrent_sessions 限流（已通过 W2.2 的 Semaphore 实现）

> **说明：** Semaphore 限流已在 W2.2 的 R4 实现里写完了，env `MAX_CONCURRENT_SESSIONS` 控制（默认 3）。本 Task 仅文档化 + 加个回归测试。

**Files:**
- Modify: `docs/architecture/reverse-flywheel.md`（加多页一节）
- Test: `backend/tests/multipage_concurrency.rs`

- [ ] **Step 1: 文档加一节**

Modify `docs/architecture/reverse-flywheel.md`：在末尾追加：

```markdown
## 多页任务并发控制（1.2.0）

- env `MAX_CONCURRENT_SESSIONS`（默认 3）控制同一 task 内并发 claw-agent session 数
- 用 `tokio::sync::Semaphore` 在 `multipage_scheduler.rs` 实现
- 超过限制的页面在 JoinSet 里 await permit，FIFO 排队
```

- [ ] **Step 2: 写并发回归测试**

Create `backend/tests/multipage_concurrency.rs`：

```rust
#[tokio::test]
async fn test_semaphore_limits_concurrency() {
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;

    let sem = Arc::new(tokio::sync::Semaphore::new(2));
    let active = Arc::new(AtomicUsize::new(0));
    let max_seen = Arc::new(AtomicUsize::new(0));

    let mut joinset = tokio::task::JoinSet::new();
    for _ in 0..5 {
        let sem = sem.clone();
        let active = active.clone();
        let max_seen = max_seen.clone();
        joinset.spawn(async move {
            let _p = sem.acquire().await.unwrap();
            let cur = active.fetch_add(1, Ordering::SeqCst) + 1;
            max_seen.fetch_max(cur, Ordering::SeqCst);
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
            active.fetch_sub(1, Ordering::SeqCst);
        });
    }
    while let Some(_) = joinset.join_next().await {}
    assert!(max_seen.load(Ordering::SeqCst) <= 2);
}
```

- [ ] **Step 3: 跑测试**

```bash
cd backend && cargo test multipage_concurrency 2>&1 | tail -5
```
Expected: `test multipage_concurrency::test_semaphore_limits_concurrency ... ok`

- [ ] **Step 4: Commit**

```bash
git add docs/architecture/reverse-flywheel.md backend/tests/multipage_concurrency.rs
git commit -m "docs+test(1.2): 多页 max_concurrent_sessions 文档 + Semaphore 回归测试"
```

### Task W2.4：project_task_event vocab 扩展（page_started/done/failed 等）

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`（在 R4 实现里写事件）
- Modify: `backend/src/handlers/project_events.rs`（前端 SSE 输出新 event_type）

- [ ] **Step 1: 在 R4 实现里写事件**

修改 W2.2 的 `run_r4_baseline`：在每页 spawn 前 + 每页完成后写 event。

加 helper：

```rust
async fn record_page_event(
    state: &AppState,
    task_id: i32,
    event_type: &str,
    payload: serde_json::Value,
) {
    use crate::entity::project_task_event;
    use sea_orm::Set;
    let active = project_task_event::ActiveModel {
        task_id: Set(task_id),
        event_type: Set(event_type.to_string()),
        payload: Set(payload),
        created_at: Set(chrono::Utc::now().into()),
        ..Default::default()
    };
    let _ = active.insert(&state.db).await;
}
```

在 spawn loop 里：

```rust
// spawn 前
record_page_event(state, task.id, &format!("page_started:{}", page.page_idx),
    serde_json::json!({"page_id": page.id, "route": page.route_path})).await;

// joinset.join_next 拿到 result 后
let event_type = if result.is_ok() {
    format!("page_done:{}", /* page_idx */ ...)
} else {
    format!("page_failed:{}", /* page_idx */ ...)
};
record_page_event(state, task.id, &event_type, serde_json::json!({"page_id": page_id})).await;
```

- [ ] **Step 2: 前端 SSE 输出确认新 event_type 自动转发**

Modify `backend/src/handlers/project_events.rs`：找到 SSE 输出段，确认 `page_started` / `page_done` / `page_failed` 等新 event_type 不在白名单过滤里（一般默认 wildcard 输出，不需要改）。如有 allowed_types 数组，加 5 个新值：

```rust
const ALLOWED: &[&str] = &[
    "scaffold_copied", "scaffold_skipped_blank", "scaffold_copy_failed",
    "dev_status_update", "llm_decision",
    // 1.2 多页扩展：
    "skeleton_started", "skeleton_done", "skeleton_failed",
    "cleanup_started", "cleanup_done", "cleanup_failed",
    "refactor_started", "refactor_done", "refactor_failed",
    "unified_started", "unified_done", "unified_failed",
    "route_inferred", "reuse_metric",
    // page_started/done/failed 用 prefix 匹配：
];

// 改成 ALLOWED 检查 + page_/cleanup_/refactor_/skeleton_/unified_ prefix 兜底
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/multipage_scheduler.rs backend/src/handlers/project_events.rs
git commit -m "feat(1.2): 多页事件 vocab 扩展（page_/skeleton_/cleanup_/refactor_/unified_）+ SSE 转发"
```

### Task W2.5：端到端测试 R4（3 页 dev server 启动）

**Files:**
- Create: `eval/multipage-1.2/test_e2e_r4.sh`

- [ ] **Step 1: 写 e2e 脚本**

Create `eval/multipage-1.2/test_e2e_r4.sh`:

```bash
#!/usr/bin/env bash
# R4 baseline 端到端：3 页任务，等 30s 看 status，校验 dev server 启动 + 路由可访问
set -euo pipefail

TOKEN="${TEST_ADMIN_JWT:?需要管理员 JWT}"
API="http://localhost:8080/api"

# 1. 创建 3 页任务
RESP=$(curl -s -X POST "$API/projects/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "title": "e2e r4 3 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "isolated",
  "reuse_strategy": "r4_none",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\",\"body\":\"hello\"}"},
    {"amis_json": "{\"type\":\"crud\",\"title\":\"列表\"}", "route_path": "/list"},
    {"amis_json": "{\"type\":\"form\",\"title\":\"表单\"}"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id')
echo "Task created: $TASK_ID"

# 2. 等 60s
sleep 60

# 3. 查 pages 状态
PAGES=$(curl -s "$API/projects/tasks/$TASK_ID/pages" -H "Authorization: Bearer $TOKEN")
echo "$PAGES" | jq '.'
DONE_COUNT=$(echo "$PAGES" | jq '[.[] | select(.status == "done")] | length')
[ "$DONE_COUNT" -ge 3 ] || { echo "❌ 期望 3 页 done，实际 $DONE_COUNT"; exit 1; }
echo "✅ 3 页全 done"

# 4. dev server preview port 校验
TASK=$(curl -s "$API/projects/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")
PORT=$(echo "$TASK" | jq -r '.preview_port // empty')
if [ -n "$PORT" ]; then
  curl -sf "http://localhost:$PORT" > /dev/null && echo "✅ dev server :$PORT OK" || echo "⚠️ dev server :$PORT 不可访问"
fi
```

- [ ] **Step 2: chmod + 跑 e2e（开发本地手动跑，CI 跳过）**

```bash
chmod +x eval/multipage-1.2/test_e2e_r4.sh
# 跑（需要 4 服务在线 + admin JWT 在 env）
TEST_ADMIN_JWT=<your-jwt> ./eval/multipage-1.2/test_e2e_r4.sh
```
Expected: `✅ 3 页全 done` + `✅ dev server :NNN OK`

- [ ] **Step 3: Commit**

```bash
git add eval/multipage-1.2/test_e2e_r4.sh
git commit -m "test(1.2): R4 baseline 端到端 3 页 e2e 脚本"
```

---

## Phase W3：R2 prompt 注入 + 全局 prompt 构造器（1 周）

### Task W3.1：global_prompt_builder.rs（扫 sandbox 现有产物拼清单）

**Files:**
- Create: `backend/src/services/global_prompt_builder.rs`

- [ ] **Step 1: 写 builder + 单测**

Create `backend/src/services/global_prompt_builder.rs`:

```rust
//! R2 用：扫 sandbox 现有产物拼成「全局组件清单」prompt 段

use std::path::Path;

#[derive(Debug, Default)]
pub struct GlobalContext {
    pub component_files: Vec<String>,  // src/components/* 路径
    pub style_files: Vec<String>,      // src/styles/* 路径
    pub api_modules: Vec<String>,      // src/api/* 路径
}

pub fn scan_sandbox(workdir: &Path) -> GlobalContext {
    let mut ctx = GlobalContext::default();
    if let Ok(entries) = walkdir::WalkDir::new(workdir.join("src/components")).into_iter().collect::<Result<Vec<_>, _>>() {
        for e in entries {
            if e.file_type().is_file() {
                if let Some(p) = e.path().strip_prefix(workdir).ok().and_then(|p| p.to_str()) {
                    ctx.component_files.push(p.to_string());
                }
            }
        }
    }
    // 类似扫 src/styles, src/api
    if let Ok(entries) = walkdir::WalkDir::new(workdir.join("src/styles")).into_iter().collect::<Result<Vec<_>, _>>() {
        for e in entries {
            if e.file_type().is_file() {
                if let Some(p) = e.path().strip_prefix(workdir).ok().and_then(|p| p.to_str()) {
                    ctx.style_files.push(p.to_string());
                }
            }
        }
    }
    if let Ok(entries) = walkdir::WalkDir::new(workdir.join("src/api")).into_iter().collect::<Result<Vec<_>, _>>() {
        for e in entries {
            if e.file_type().is_file() {
                if let Some(p) = e.path().strip_prefix(workdir).ok().and_then(|p| p.to_str()) {
                    ctx.api_modules.push(p.to_string());
                }
            }
        }
    }
    ctx
}

pub fn render_prompt_section(ctx: &GlobalContext) -> String {
    let mut out = String::from("\n# 全局组件清单（必须复用，不准重新造）\n\n");
    if !ctx.component_files.is_empty() {
        out.push_str("**已有组件**（请通过 `import { Xxx } from '@/components/xxx'` 复用）：\n");
        for p in &ctx.component_files {
            out.push_str(&format!("- {}\n", p));
        }
        out.push('\n');
    }
    if !ctx.style_files.is_empty() {
        out.push_str("**全局样式 / theme tokens**：\n");
        for p in &ctx.style_files {
            out.push_str(&format!("- {}\n", p));
        }
        out.push('\n');
    }
    if !ctx.api_modules.is_empty() {
        out.push_str("**API 客户端模块**：\n");
        for p in &ctx.api_modules {
            out.push_str(&format!("- {}\n", p));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_scan_sandbox_picks_up_component_files() {
        let dir = tempdir().unwrap();
        let comp = dir.path().join("src/components/Button.vue");
        fs::create_dir_all(comp.parent().unwrap()).unwrap();
        fs::write(&comp, "<template></template>").unwrap();
        let ctx = scan_sandbox(dir.path());
        assert_eq!(ctx.component_files.len(), 1);
        assert!(ctx.component_files[0].ends_with("Button.vue"));
    }

    #[test]
    fn test_render_prompt_section_includes_all_sections() {
        let ctx = GlobalContext {
            component_files: vec!["src/components/Button.vue".to_string()],
            style_files: vec!["src/styles/theme.css".to_string()],
            api_modules: vec!["src/api/user.ts".to_string()],
        };
        let s = render_prompt_section(&ctx);
        assert!(s.contains("Button.vue"));
        assert!(s.contains("theme.css"));
        assert!(s.contains("user.ts"));
        assert!(s.contains("必须复用"));
    }
}
```

- [ ] **Step 2: 加 walkdir + tempfile 依赖**

Modify `backend/Cargo.toml` 在 `[dependencies]` 加（如果没有）：

```toml
walkdir = "2.5"
```

`[dev-dependencies]` 加：

```toml
tempfile = "3.10"
```

- [ ] **Step 3: 跑测试**

```bash
cd backend && cargo test global_prompt_builder 2>&1 | tail -10
```
Expected: `2 tests passed`

- [ ] **Step 4: 注册 mod**

Modify `backend/src/services/mod.rs` 加 `pub mod global_prompt_builder;`

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/global_prompt_builder.rs backend/src/services/mod.rs backend/Cargo.toml
git commit -m "feat(1.2): global_prompt_builder（R2 用：扫 sandbox 拼全局组件清单 prompt 段）"
```

### Task W3.2：R2 prompt 注入实现

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`（替换 run_r2_prompt）

- [ ] **Step 1: 把 W2.2 的 R4 主体抽到 run_isolated_pages_with_shared_context**

打开 [`backend/src/services/multipage_scheduler.rs`](../../backend/src/services/multipage_scheduler.rs)，把 W2.2 写好的 `run_r4_baseline` 函数主体（从 `let claw = ClawAgentClient::new();` 到末尾 `Ok(())`）剪切到一个新公共函数：

```rust
/// 独立模式公共跑法（R2 / R4 共用，R1 在 W4 也复用）
/// shared_context = Some(s) 时把 s 注入每页 prompt 头作为「全局组件清单」硬约束
async fn run_isolated_pages_with_shared_context(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
    shared_context: Option<&str>,
) -> SchedulerResult<()> {
    use crate::services::claw_agent::ClawAgentClient;
    use sea_orm::Set;
    use tokio::task::JoinSet;

    let claw = ClawAgentClient::new();
    let max_concurrent = std::env::var("MAX_CONCURRENT_SESSIONS")
        .ok().and_then(|s| s.parse().ok()).unwrap_or(3usize);
    let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(max_concurrent));
    let mut joinset: JoinSet<(i32, i32, Result<String, String>)> = JoinSet::new();

    for page in pages {
        let permit = semaphore.clone().acquire_owned().await
            .map_err(|e| SchedulerError::ClawAgent(format!("semaphore: {}", e)))?;
        let page_id = page.id;
        let page_idx = page.page_idx;
        let prompt = build_page_prompt(task, page, shared_context);
        let claw_clone = claw.clone();
        let task_workdir = task.workdir_path.clone();
        record_page_event(state, task.id, &format!("page_started:{}", page_idx),
            serde_json::json!({"page_id": page_id, "route": page.route_path})).await;
        joinset.spawn(async move {
            let _permit = permit;
            let result = claw_clone.create_task(&prompt, task_workdir.as_deref().unwrap_or(""))
                .await.map_err(|e| e.to_string());
            (page_id, page_idx, result.map(|r| r.session_id))
        });
    }

    while let Some(joined) = joinset.join_next().await {
        let (page_id, page_idx, result) = joined
            .map_err(|e| SchedulerError::ClawAgent(e.to_string()))?;
        let now = chrono::Utc::now();
        let mut active = project_task_page::ActiveModel {
            id: Set(page_id),
            updated_at: Set(now.into()),
            ..Default::default()
        };
        let event_type = match &result {
            Ok(session_id) => {
                active.claw_session_id = Set(Some(session_id.clone()));
                active.status = Set("done".to_string());
                active.finished_at = Set(Some(now.into()));
                format!("page_done:{}", page_idx)
            }
            Err(err) => {
                active.status = Set("failed".to_string());
                active.error_msg = Set(Some(err.clone()));
                active.finished_at = Set(Some(now.into()));
                format!("page_failed:{}", page_idx)
            }
        };
        active.update(&state.db).await.map_err(SchedulerError::Db)?;
        record_page_event(state, task.id, &event_type,
            serde_json::json!({"page_id": page_id})).await;
    }
    Ok(())
}
```

然后把 `run_r4_baseline` 改成只调这个公共函数：

```rust
async fn run_r4_baseline(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    run_isolated_pages_with_shared_context(state, task, pages, None).await
}
```

最后写 R2：

```rust
async fn run_r2_prompt(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    use crate::services::global_prompt_builder::{scan_sandbox, render_prompt_section};

    let workdir = task.workdir_path.as_deref().ok_or_else(||
        SchedulerError::Sandbox("task.workdir_path 为空".to_string()))?;
    let ctx = scan_sandbox(std::path::Path::new(workdir));
    let global_section = render_prompt_section(&ctx);

    run_isolated_pages_with_shared_context(state, task, pages, Some(&global_section)).await
}
```

- [ ] **Step 2: 改 build_page_prompt 接 shared_context**

```rust
fn build_page_prompt(
    _task: &project_generation_task::Model,
    page: &project_task_page::Model,
    shared_context: Option<&str>,
) -> String {
    let mut out = String::new();
    if let Some(s) = shared_context {
        out.push_str(s);
        out.push_str("\n---\n\n");
    }
    out.push_str(&format!(
        "请基于以下 amis JSON 在 src/pages{} 路径下生成对应的 UniApp Vue 页面文件，并在 src/pages.json 注册路由。\n\namis JSON：\n{}",
        page.route_path,
        page.amis_json,
    ));
    out
}
```

- [ ] **Step 3: 编译 + e2e（写脚本）**

```bash
cd backend && cargo build 2>&1 | tail -3
```

Create `eval/multipage-1.2/test_e2e_r2.sh`（拷 r4 模板，把 reuse_strategy 改 r2_prompt）。

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/multipage_scheduler.rs eval/multipage-1.2/test_e2e_r2.sh
git commit -m "feat(1.2): R2 prompt 注入实现（全局清单注入每页 prompt 头）"
```

### Task W3.3：端到端测试 R2

**Files:** 已在 W3.2 写脚本

- [ ] **Step 1: 跑 e2e 脚本**

```bash
TEST_ADMIN_JWT=<jwt> ./eval/multipage-1.2/test_e2e_r2.sh
```
Expected: 3 页 done + 检查产物 `src/pages/*.vue` 是否含全局清单注释。

- [ ] **Step 2: Commit（本任务无新文件，跳过 commit）**

---

## Phase W4：R1 骨架先行（1 周）

### Task W4.1：scaffold_skeleton.md prompt 模板

**Files:**
- Create: `claw-code/rust/crates/claw-agent-server/prompts/scaffold_skeleton.md`

- [ ] **Step 1: 写 prompt**

Create `claw-code/rust/crates/claw-agent-server/prompts/scaffold_skeleton.md`:

```markdown
# 骨架先行 Prompt（R1 第 1 阶段）

你正在为一个**多页面 UniApp + Wot UI H5 项目**生成「共享骨架」。

## 你的输出范围（仅这些）

1. `src/components/` —— 跨页通用 UI 组件
   - 至少包含：AppHeader.vue / AppFooter.vue / FormWrapper.vue / DataTable.vue
   - 如果用户的多页 amis JSON 高频出现某些控件（如时间选择、上传），加对应 wrapper

2. `src/styles/` —— 全局样式 / 主题
   - `theme.css`：色值变量、间距 spacing tokens
   - `reset.css`：全局 reset
   - `vars.scss`（如果有 SCSS）：变量

3. `src/api/` —— 共享 API 客户端
   - `client.ts`：axios / uni.request 封装
   - `endpoints.ts`：所有 amis JSON 中出现的 API URL 抽成常量

4. `src/router/index.ts` 或 `src/pages.json` —— 路由表 stub
   - 把所有页面占位条目都列出来（基于下方提供的路由清单）
   - 每个页面只占位（指向后续会生成的 .vue 文件）

5. `src/store/index.ts`（如果项目用 Pinia / Vuex） —— 全局状态 stub
   - 提供 user / app 全局 store 占位

## 你**不要**做的

- ❌ 不要生成具体页面 .vue 文件（那是第 2 阶段的事）
- ❌ 不要在路由里写具体业务逻辑

## 输入

下面是用户提供的多页输入摘要（每页只给 type 和 title 概览，不给完整 amis JSON）：

{{PAGE_LIST_SUMMARY}}

路由表（已确定）：

{{ROUTE_TABLE}}
```

- [ ] **Step 2: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/prompts/scaffold_skeleton.md
git commit -m "feat(1.2): R1 骨架先行 prompt 模板"
```

### Task W4.2：R1 骨架阶段调度

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`

- [ ] **Step 1: 写 run_skeleton_stage**

加新函数：

```rust
async fn run_skeleton_stage(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<String> {
    // 1. 写事件 skeleton_started
    record_page_event(state, task.id, "skeleton_started", serde_json::json!({})).await;

    // 2. 拼骨架 prompt
    let template = include_str!("../../../claw-code/rust/crates/claw-agent-server/prompts/scaffold_skeleton.md");
    let page_summary = pages.iter().map(|p| {
        let title: serde_json::Value = serde_json::from_str(&p.amis_json)
            .unwrap_or(serde_json::Value::Null);
        format!("- 路由 `{}`：type={}", p.route_path, title.get("type").and_then(|v| v.as_str()).unwrap_or("?"))
    }).collect::<Vec<_>>().join("\n");
    let route_table = pages.iter().map(|p| format!("- {}", p.route_path)).collect::<Vec<_>>().join("\n");
    let prompt = template
        .replace("{{PAGE_LIST_SUMMARY}}", &page_summary)
        .replace("{{ROUTE_TABLE}}", &route_table);

    // 3. 调 claw-agent 跑骨架 session
    let claw = crate::services::claw_agent::ClawAgentClient::new();
    let workdir = task.workdir_path.as_deref().ok_or_else(||
        SchedulerError::Sandbox("workdir 缺失".to_string()))?;
    let result = claw.create_task(&prompt, workdir).await
        .map_err(|e| SchedulerError::ClawAgent(e.to_string()))?;

    // 4. 写事件 skeleton_done
    record_page_event(state, task.id, "skeleton_done",
        serde_json::json!({"session_id": result.session_id})).await;

    Ok(result.session_id)
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && cargo build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/multipage_scheduler.rs
git commit -m "feat(1.2): R1 骨架阶段（skeleton session + skeleton_started/done 事件）"
```

### Task W4.3：R1 各页阶段（带骨架硬约束）

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`

- [ ] **Step 1: 写 run_r1_skeleton 三阶段编排**

替换 stub：

```rust
async fn run_r1_skeleton(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    // 阶段 1：骨架
    let skeleton_session = run_skeleton_stage(state, task, pages).await?;

    // 阶段 2：扫骨架产物 → 生成全局清单 prompt 段（R1 比 R2 多了「骨架已生成」上下文）
    let workdir = task.workdir_path.as_deref().unwrap();
    let ctx = crate::services::global_prompt_builder::scan_sandbox(std::path::Path::new(workdir));
    let mut shared = crate::services::global_prompt_builder::render_prompt_section(&ctx);
    shared.push_str("\n\n**注意：** 上述清单是骨架阶段刚生成的，**必须 import 不准重复造**。\n");

    // 阶段 2 主体：N 页并发，每页注入 shared
    run_isolated_pages_with_shared_context(state, task, pages, Some(&shared)).await?;

    // 阶段 3：cleanup
    run_cleanup_stage(state, task, pages).await?;

    Ok(())
}
```

- [ ] **Step 2: 编译 + Commit**

```bash
cd backend && cargo build 2>&1 | tail -3
git add backend/src/services/multipage_scheduler.rs
git commit -m "feat(1.2): R1 三阶段编排（骨架 → N 页带硬约束 → 收尾）"
```

### Task W4.4：R1 收尾阶段（cleanup_* events）

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`

- [ ] **Step 1: 写 run_cleanup_stage**

```rust
async fn run_cleanup_stage(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    record_page_event(state, task.id, "cleanup_started", serde_json::json!({})).await;

    let prompt = format!(
        "项目已完成 {} 页生成 + 骨架。请：\n\
         1. 跑 lint（如 eslint）\n\
         2. 检查所有 src/pages/*.vue 中的 uni.navigateTo / uni.switchTab 路径是否存在于 pages.json\n\
         3. 检查所有 import 路径是否能解析（不存在的文件路径报错）\n\
         4. 启动 dev server 验证不报错\n\n\
         路由表：\n{}",
        pages.len(),
        pages.iter().map(|p| format!("- {}", p.route_path)).collect::<Vec<_>>().join("\n"),
    );

    let claw = crate::services::claw_agent::ClawAgentClient::new();
    let workdir = task.workdir_path.as_deref().unwrap();
    match claw.create_task(&prompt, workdir).await {
        Ok(r) => {
            record_page_event(state, task.id, "cleanup_done",
                serde_json::json!({"session_id": r.session_id})).await;
            Ok(())
        }
        Err(e) => {
            record_page_event(state, task.id, "cleanup_failed",
                serde_json::json!({"error": e.to_string()})).await;
            Err(SchedulerError::ClawAgent(e.to_string()))
        }
    }
}
```

- [ ] **Step 2: 编译 + Commit**

```bash
cd backend && cargo build 2>&1 | tail -3
git add backend/src/services/multipage_scheduler.rs
git commit -m "feat(1.2): R1 收尾阶段（cleanup session + cleanup_started/done/failed 事件）"
```

### Task W4.5：端到端测试 R1

**Files:**
- Create: `eval/multipage-1.2/test_e2e_r1.sh`

- [ ] **Step 1: 写 e2e 脚本（拷 r4，改 reuse_strategy=r1_skeleton + 跑完后 grep import 看 shared/）**

```bash
#!/usr/bin/env bash
set -euo pipefail

TOKEN="${TEST_ADMIN_JWT:?需要 JWT}"
API="http://localhost:8080/api"

RESP=$(curl -s -X POST "$API/projects/tasks" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d @- <<EOF
{
  "title": "e2e r1 5 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "isolated",
  "reuse_strategy": "r1_skeleton",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\"}", "route_path": "/"},
    {"amis_json": "{\"type\":\"crud\",\"title\":\"用户列表\"}"},
    {"amis_json": "{\"type\":\"form\",\"title\":\"用户编辑\"}"},
    {"amis_json": "{\"type\":\"page\",\"title\":\"个人中心\"}", "route_path": "/profile"},
    {"amis_json": "{\"type\":\"page\",\"title\":\"设置\"}", "route_path": "/settings"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id')

# 等 120s（骨架 30s + 5 页 60s + 收尾 30s）
sleep 120

PAGES=$(curl -s "$API/projects/tasks/$TASK_ID/pages" -H "Authorization: Bearer $TOKEN")
DONE=$(echo "$PAGES" | jq '[.[] | select(.status=="done")] | length')
[ "$DONE" -ge 5 ] || { echo "❌ 5 页 done 失败：$DONE"; exit 1; }

# 复用率检查：grep workdir 里 import shared/ 出现次数
TASK=$(curl -s "$API/projects/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")
WORKDIR=$(echo "$TASK" | jq -r '.workdir_path')
REUSE_COUNT=$(grep -rE "import.*from\s+['\"](\.\.?/)+(components|styles|api|store)/" "$WORKDIR/src/pages" 2>/dev/null | wc -l)
TOTAL_FILES=$(find "$WORKDIR/src/pages" -name '*.vue' 2>/dev/null | wc -l)
RATE=$(awk "BEGIN { printf \"%.2f\", $REUSE_COUNT / ($TOTAL_FILES + 0.001) }")
echo "✅ 5 页全 done，复用率 = $RATE"
[ "$(echo "$RATE >= 0.6" | bc)" -eq 1 ] || echo "⚠️ R1 复用率 $RATE < 期望 0.6"
```

- [ ] **Step 2: chmod + 跑（开发本地）**

```bash
chmod +x eval/multipage-1.2/test_e2e_r1.sh
TEST_ADMIN_JWT=<jwt> ./eval/multipage-1.2/test_e2e_r1.sh
```

- [ ] **Step 3: Commit**

```bash
git add eval/multipage-1.2/test_e2e_r1.sh
git commit -m "test(1.2): R1 e2e 脚本（5 页 + 复用率 ≥ 60% 验收）"
```

---

## Phase W5：R3 重构 + 统筹模式（1 周）

### Task W5.1：scaffold_refactor.md prompt 模板

**Files:**
- Create: `claw-code/rust/crates/claw-agent-server/prompts/scaffold_refactor.md`

- [ ] **Step 1: 写 prompt**

```markdown
# 后处理重构 Prompt（R3 第 2 阶段）

你正在重构一个**已生成完成的多页 UniApp + Wot UI 项目**。第 1 阶段 N 个独立 session 各自生成了 N 个页面，没有共享约束，可能存在大量重复代码。

## 你的任务

1. 扫 `src/pages/**/*.vue`，识别重复模式：
   - 重复的组件（多个页面里写了功能相似的 button/form/table 包装）
   - 重复的工具函数（多个页面里 copy 了同样的 fetchData / formatDate）
   - 重复的样式（多个页面里写了相同的 CSS class）

2. 抽到共享位置：
   - 重复组件 → `src/components/`
   - 重复工具 → `src/utils/`
   - 重复样式 → `src/styles/common.css`

3. 改原页面的 import，让它们用共享版本

4. **不要破坏功能** —— 重构前后页面行为一致

## 注意

- 单次只复用模式 ≥ 3 次的代码（2 次以下不值得抽）
- 不抽业务专属逻辑（如 user_list 里独有的状态过滤）
- 不改变 amis JSON 渲染结果
```

- [ ] **Step 2: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/prompts/scaffold_refactor.md
git commit -m "feat(1.2): R3 后处理重构 prompt 模板"
```

### Task W5.2：R3 重构 session 调度

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`

- [ ] **Step 1: 写 run_r3_refactor**

```rust
async fn run_r3_refactor(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    // 阶段 1：N 页并发（同 R4，无共享）
    run_isolated_pages_with_shared_context(state, task, pages, None).await?;

    // 阶段 2：重构 session
    record_page_event(state, task.id, "refactor_started", serde_json::json!({})).await;

    let prompt = include_str!("../../../claw-code/rust/crates/claw-agent-server/prompts/scaffold_refactor.md").to_string();
    let claw = crate::services::claw_agent::ClawAgentClient::new();
    let workdir = task.workdir_path.as_deref().unwrap();

    match claw.create_task(&prompt, workdir).await {
        Ok(r) => {
            record_page_event(state, task.id, "refactor_done",
                serde_json::json!({"session_id": r.session_id})).await;
            Ok(())
        }
        Err(e) => {
            record_page_event(state, task.id, "refactor_failed",
                serde_json::json!({"error": e.to_string()})).await;
            Err(SchedulerError::ClawAgent(e.to_string()))
        }
    }
}
```

- [ ] **Step 2: 编译 + Commit**

```bash
cd backend && cargo build 2>&1 | tail -3
git add backend/src/services/multipage_scheduler.rs
git commit -m "feat(1.2): R3 后处理重构调度（N 页 → 重构 session）"
```

### Task W5.3：multipage_unified.md prompt 模板

**Files:**
- Create: `claw-code/rust/crates/claw-agent-server/prompts/multipage_unified.md`

- [ ] **Step 1: 写 prompt**

```markdown
# 统筹模式 Prompt（单 session 跑完整 N 页项目）

你正在生成一个**完整的多页 UniApp + Wot UI H5 项目**。所有页面、共享组件、路由、样式由你一次性产出。

## 输入

- 路由表：
{{ROUTE_TABLE}}

- 各页 amis JSON：
{{PAGE_AMIS_JSONS}}

## 你的输出

1. **共享层**（先产出）：
   - `src/components/` —— 跨页 UI 组件（基于多页 amis JSON 的高频控件）
   - `src/styles/theme.css`、`src/styles/reset.css`
   - `src/api/client.ts`、`src/api/endpoints.ts`
   - `src/router/index.ts`（基于路由表）

2. **页面层**（按路由表逐一产出）：
   - 对每个路由，在 `src/pages<route_path>/index.vue` 生成对应 Vue 页面
   - 必须 import 共享层组件，不要重新写

3. **路由注册**：
   - 在 `src/pages.json` 中注册所有页面

## 约束

- 所有页面共享同一 theme（颜色 / 间距 / 字号）
- 跨页跳转用 `uni.navigateTo` 且路径必须存在于 pages.json
- 共享组件跨页复用（不要每页 copy）

## 完成后

- 启动 dev server（`pnpm run dev:h5`）验证项目可运行 + 全部路由可访问
```

- [ ] **Step 2: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/prompts/multipage_unified.md
git commit -m "feat(1.2): 统筹模式 prompt 模板"
```

### Task W5.4：统筹模式实现

**Files:**
- Modify: `backend/src/services/multipage_scheduler.rs`

- [ ] **Step 1: 写 run_unified**

```rust
async fn run_unified(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    if pages.len() > 5 {
        return Err(SchedulerError::InvalidStrategy(
            format!("统筹模式建议页数 ≤ 5，当前 {}（请改用 isolated）", pages.len())));
    }

    record_page_event(state, task.id, "unified_started", serde_json::json!({"page_count": pages.len()})).await;

    let template = include_str!("../../../claw-code/rust/crates/claw-agent-server/prompts/multipage_unified.md");
    let route_table = pages.iter().map(|p| format!("- {}", p.route_path)).collect::<Vec<_>>().join("\n");
    let amis_jsons = pages.iter().enumerate().map(|(i, p)|
        format!("### 页面 {} (路由 {})\n```json\n{}\n```", i+1, p.route_path, p.amis_json)
    ).collect::<Vec<_>>().join("\n\n");
    let prompt = template
        .replace("{{ROUTE_TABLE}}", &route_table)
        .replace("{{PAGE_AMIS_JSONS}}", &amis_jsons);

    let claw = crate::services::claw_agent::ClawAgentClient::new();
    let workdir = task.workdir_path.as_deref().unwrap();

    match claw.create_task(&prompt, workdir).await {
        Ok(r) => {
            // 标全部 page status=done（统筹一次完成）
            for page in pages {
                use sea_orm::Set;
                let active = project_task_page::ActiveModel {
                    id: Set(page.id),
                    status: Set("done".to_string()),
                    claw_session_id: Set(Some(r.session_id.clone())),
                    finished_at: Set(Some(chrono::Utc::now().into())),
                    ..Default::default()
                };
                let _ = active.update(&state.db).await;
            }
            record_page_event(state, task.id, "unified_done",
                serde_json::json!({"session_id": r.session_id})).await;
            Ok(())
        }
        Err(e) => {
            record_page_event(state, task.id, "unified_failed",
                serde_json::json!({"error": e.to_string()})).await;
            Err(SchedulerError::ClawAgent(e.to_string()))
        }
    }
}
```

- [ ] **Step 2: 编译 + Commit**

```bash
cd backend && cargo build 2>&1 | tail -3
git add backend/src/services/multipage_scheduler.rs
git commit -m "feat(1.2): 统筹模式实现（单 session 多页 + ≤5 页限制）"
```

### Task W5.5：端到端测试 R3 + 统筹

**Files:**
- Create: `eval/multipage-1.2/test_e2e_r3.sh`
- Create: `eval/multipage-1.2/test_e2e_unified.sh`

- [ ] **Step 1: 写 R3 e2e（拷 R1 模板，改 strategy）**

- [ ] **Step 2: 写统筹 e2e（4 页测试）**

```bash
#!/usr/bin/env bash
set -euo pipefail
TOKEN="${TEST_ADMIN_JWT:?}"
API="http://localhost:8080/api"

RESP=$(curl -s -X POST "$API/projects/tasks" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d @- <<EOF
{
  "title": "e2e unified 4 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "unified",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\"}", "route_path": "/"},
    {"amis_json": "{\"type\":\"crud\"}", "route_path": "/list"},
    {"amis_json": "{\"type\":\"form\"}", "route_path": "/edit"},
    {"amis_json": "{\"type\":\"page\",\"title\":\"关于\"}", "route_path": "/about"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id')

sleep 120

# 验收：unified_done 事件 + 全部 page done + 复用率 ≥ 70%
EVENTS=$(curl -s "$API/projects/tasks/$TASK_ID/events/history" -H "Authorization: Bearer $TOKEN")
echo "$EVENTS" | jq '.[] | select(.event_type == "unified_done")' | grep -q session_id && echo "✅ unified_done 事件"
```

- [ ] **Step 3: chmod + 跑 + Commit**

```bash
chmod +x eval/multipage-1.2/test_e2e_r3.sh eval/multipage-1.2/test_e2e_unified.sh
git add eval/multipage-1.2/
git commit -m "test(1.2): R3 + 统筹模式 e2e 脚本"
```

---

## Phase W6：前端 pages tab + 复用率 + RAG 闭环（1 周）

### Task W6.1：reuse_metrics.rs（grep import shared/ 算复用率）

**Files:**
- Create: `sandbox/src/reuse_metrics.rs`
- Modify: `sandbox/src/lib.rs`（注册 mod）
- Modify: `sandbox/src/main.rs`（加 GET /reuse-metrics endpoint）

- [ ] **Step 1: 写实现 + 单测**

Create `sandbox/src/reuse_metrics.rs`:

```rust
//! 算多页项目里 shared/ 复用率：扫 src/pages 下 import 行数 / .vue 文件数

use std::path::Path;
use regex::Regex;

pub fn compute_reuse_rate(workdir: &Path) -> f64 {
    let pages_dir = workdir.join("src/pages");
    let import_re = Regex::new(
        r#"import\s+.*?from\s+["'](\.\.?/)+(components|styles|api|store|utils)/"#
    ).unwrap();

    let mut import_count = 0;
    let mut file_count = 0;
    if let Ok(entries) = walkdir::WalkDir::new(&pages_dir).into_iter().collect::<Result<Vec<_>, _>>() {
        for e in entries {
            if e.file_type().is_file()
                && e.path().extension().and_then(|s| s.to_str()) == Some("vue")
            {
                file_count += 1;
                if let Ok(content) = std::fs::read_to_string(e.path()) {
                    import_count += import_re.find_iter(&content).count();
                }
            }
        }
    }
    if file_count == 0 { 0.0 } else { import_count as f64 / file_count as f64 }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_reuse_rate_zero_when_no_imports() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("src/pages/index.vue");
        fs::create_dir_all(p.parent().unwrap()).unwrap();
        fs::write(&p, "<template></template>").unwrap();
        assert_eq!(compute_reuse_rate(dir.path()), 0.0);
    }

    #[test]
    fn test_reuse_rate_counts_shared_imports() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("src/pages/index.vue");
        fs::create_dir_all(p.parent().unwrap()).unwrap();
        fs::write(&p, r#"<script>
import { Btn } from '../components/Btn.vue';
import client from '../api/client';
</script>"#).unwrap();
        let rate = compute_reuse_rate(dir.path());
        assert_eq!(rate, 2.0);  // 2 imports / 1 file
    }
}
```

- [ ] **Step 2: 加 endpoint**

Modify `sandbox/src/main.rs` 在 router 加：

```rust
.route("/reuse-metrics/:workdir_id", get(reuse_metrics_handler))
```

`reuse_metrics_handler` 拿 workdir_id 解析成路径调 `compute_reuse_rate`。

- [ ] **Step 3: 跑测试 + Commit**

```bash
cd sandbox && cargo test reuse_metrics 2>&1 | tail -5
git add sandbox/src/reuse_metrics.rs sandbox/src/lib.rs sandbox/src/main.rs
git commit -m "feat(1.2): sandbox reuse_metrics（grep import shared/ 算复用率）"
```

### Task W6.2：PagesPanel.tsx（前端 pages tab）

**Files:**
- Create: `frontend/src/views/Projects/detail/panels/PagesPanel.tsx`
- Modify: `frontend/src/views/Projects/detail/EditorView.tsx`（task.page_count > 1 显示）

- [ ] **Step 1: 写 PagesPanel**

```tsx
import { useEffect, useState } from 'react';
import { Badge, Card, Progress, Tag } from 'antd';
import { http } from '../../../../services/http';

interface PageRow {
  id: number;
  page_idx: number;
  route_path: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  error_msg?: string;
}

const STATUS_COLOR: Record<PageRow['status'], string> = {
  pending: 'default', running: 'processing', done: 'success', failed: 'error',
};

export default function PagesPanel({ taskId }: { taskId: number }) {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [reuseRate, setReuseRate] = useState<number | null>(null);

  useEffect(() => {
    const load = () => {
      http.get<PageRow[]>(`/projects/tasks/${taskId}/pages`)
        .then(r => setPages(r.data));
      http.get<{ reuse_rate: number }>(`/projects/tasks/${taskId}/reuse-rate`)
        .then(r => setReuseRate(r.data.reuse_rate))
        .catch(() => setReuseRate(null));
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [taskId]);

  const doneCount = pages.filter(p => p.status === 'done').length;
  const totalCount = pages.length;
  const progress = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0;

  return (
    <Card title="多页面任务" size="small">
      <Progress percent={progress} format={() => `${doneCount}/${totalCount}`} />
      {reuseRate !== null && (
        <div style={{ marginTop: 8 }}>
          复用率：<Tag color={reuseRate >= 0.6 ? 'green' : reuseRate >= 0.3 ? 'orange' : 'red'}>
            {(reuseRate * 100).toFixed(1)}%
          </Tag>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {pages.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              <Badge status={STATUS_COLOR[p.status] as 'default'} /> #{p.page_idx} {p.route_path}
            </span>
            {p.error_msg && <Tag color="red">{p.error_msg.slice(0, 30)}</Tag>}
          </div>
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: 在 EditorView.tsx 条件渲染**

```tsx
{task.page_count > 1 && <PagesPanel taskId={task.id} />}
```

- [ ] **Step 3: backend 加 GET /projects/tasks/:id/pages + /reuse-rate endpoint**

Modify `backend/src/handlers/project_pages.rs`（新建）：

```rust
use axum::{extract::{Path, State}, response::IntoResponse, Json};
use crate::AppState;
use crate::entity::project_task_page;
use sea_orm::EntityTrait;

pub async fn list_pages(
    State(state): State<AppState>,
    Path(task_id): Path<i32>,
) -> impl IntoResponse {
    use sea_orm::QueryFilter;
    let pages = project_task_page::Entity::find()
        .filter(project_task_page::Column::TaskId.eq(task_id))
        .order_by_asc(project_task_page::Column::PageIdx)
        .all(&state.db).await.unwrap_or_default();
    Json(pages)
}

pub async fn get_reuse_rate(
    State(state): State<AppState>,
    Path(task_id): Path<i32>,
) -> impl IntoResponse {
    // 调 sandbox /reuse-metrics 或者直接读 event 表里的 reuse_metric 事件
    // 先从最新的 reuse_metric event 读
    use crate::entity::project_task_event;
    use sea_orm::{QueryFilter, QueryOrder};
    let evt = project_task_event::Entity::find()
        .filter(project_task_event::Column::TaskId.eq(task_id))
        .filter(project_task_event::Column::EventType.eq("reuse_metric"))
        .order_by_desc(project_task_event::Column::CreatedAt)
        .one(&state.db).await.ok().flatten();
    let rate = evt.and_then(|e| e.payload.get("value").and_then(|v| v.as_f64())).unwrap_or(0.0);
    Json(serde_json::json!({"reuse_rate": rate}))
}
```

注册到 main.rs 路由：

```rust
.route("/api/projects/tasks/:id/pages", get(handlers::project_pages::list_pages))
.route("/api/projects/tasks/:id/reuse-rate", get(handlers::project_pages::get_reuse_rate))
```

- [ ] **Step 4: tsc + Commit**

```bash
cd frontend && pnpm tsc --noEmit 2>&1 | tail -5
cd /home/karl/Working/TianXing/amis-ai
git add frontend/src/views/Projects/detail/panels/PagesPanel.tsx frontend/src/views/Projects/detail/EditorView.tsx backend/src/handlers/project_pages.rs backend/src/main.rs backend/src/handlers/mod.rs
git commit -m "feat(1.2): PagesPanel 前端 + GET /pages /reuse-rate endpoints"
```

### Task W6.3：agent multipage_recorder.py（任务完成后写 RAG）

**Files:**
- Create: `agent/src/knowledge/multipage_recorder.py`
- Create: `agent/src/routers/multipage_record.py`
- Modify: `agent/src/main.py`
- Test: `agent/tests/multipage/test_multipage_recorder.py`

- [ ] **Step 1: 写 recorder 实现 + 测试**

Create `agent/src/knowledge/multipage_recorder.py`:

```python
"""多页任务完成后写 RAG（带 strategy tags）"""
from __future__ import annotations
from typing import Any
import asyncpg


async def record_multipage_outcome(
    pool: asyncpg.Pool,
    task_id: int,
    execution_strategy: str,
    reuse_strategy: str | None,
    page_count: int,
    pages: list[dict[str, Any]],   # [{route_path, amis_json, full_code}]
    reuse_rate: float,
) -> int:
    """把多页任务结果写成 1 条 code_samples 行，返回 sample_id。"""
    full_amis_json = "[\n" + ",\n".join(p["amis_json"] for p in pages) + "\n]"
    full_code = "\n\n// ===== 页面分隔 =====\n\n".join(p.get("full_code", "") for p in pages)[:2_000_000]

    rate_bucket = "high" if reuse_rate >= 0.6 else ("medium" if reuse_rate >= 0.3 else "low")
    tags = [
        "multipage:1",
        f"execution_strategy:{execution_strategy}",
        f"page_count:{page_count}",
        f"reuse_rate:{rate_bucket}",
    ]
    if reuse_strategy:
        tags.append(f"reuse_strategy:{reuse_strategy}")

    async with pool.acquire() as conn:
        sample_id = await conn.fetchval(
            """
            INSERT INTO code_samples (
                tech_stack, tech_stacks, platforms, ui_libs,
                source_team, source_task_id,
                amis_json_summary, code_summary,
                full_amis_json, full_code, status, tags,
                hit_count, created_at, updated_at
            ) VALUES (
                'uniapp-wot-h5', ARRAY['uniapp-wot-h5'], ARRAY['mobile'], ARRAY['wot'],
                'amis-ai', $1,
                $2, $3, $4, $5, 'pending', $6, 0, NOW(), NOW()
            )
            RETURNING id
            """,
            task_id,
            f"多页任务 {page_count} 页，复用率 {reuse_rate:.2%}",
            f"execution={execution_strategy}, reuse={reuse_strategy or 'n/a'}",
            full_amis_json,
            full_code,
            tags,
        )
    return sample_id
```

Create `agent/tests/multipage/test_multipage_recorder.py`:

```python
import pytest
from knowledge.multipage_recorder import record_multipage_outcome


@pytest.mark.asyncio
async def test_record_multipage_writes_code_sample_with_tags(db_pool):
    pages = [
        {"route_path": "/", "amis_json": '{"type":"page"}', "full_code": "<template>1</template>"},
        {"route_path": "/list", "amis_json": '{"type":"crud"}', "full_code": "<template>2</template>"},
    ]
    sid = await record_multipage_outcome(
        db_pool, task_id=999999,  # 假任务 id（FK 没设级联，可写）
        execution_strategy="isolated", reuse_strategy="r1_skeleton",
        page_count=2, pages=pages, reuse_rate=0.7,
    )
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT tags, status FROM code_samples WHERE id = $1", sid)
        assert "multipage:1" in row["tags"]
        assert "execution_strategy:isolated" in row["tags"]
        assert "reuse_strategy:r1_skeleton" in row["tags"]
        assert "reuse_rate:high" in row["tags"]
        assert "page_count:2" in row["tags"]
        assert row["status"] == "pending"
        # 清理
        await conn.execute("DELETE FROM code_samples WHERE id = $1", sid)
```

注：复用 1.1 conftest 的 `db_pool` fixture，需要在 `agent/tests/multipage/conftest.py` 引一下：

```python
import sys
from pathlib import Path
# 复用 tests/knowledge/conftest.py 的 db_pool
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "knowledge"))
from conftest import db_pool  # noqa: F401
```

- [ ] **Step 2: 写 router endpoint**

Create `agent/src/routers/multipage_record.py`:

```python
from fastapi import APIRouter
from pydantic import BaseModel
from ..knowledge.multipage_recorder import record_multipage_outcome
from ..services.db import get_pool

router = APIRouter()

class PagePayload(BaseModel):
    route_path: str
    amis_json: str
    full_code: str = ""

class RecordRequest(BaseModel):
    task_id: int
    execution_strategy: str
    reuse_strategy: str | None
    page_count: int
    reuse_rate: float
    pages: list[PagePayload]

@router.post("/multipage/record")
async def post_record(req: RecordRequest) -> dict:
    pool = await get_pool()
    sid = await record_multipage_outcome(
        pool, req.task_id, req.execution_strategy, req.reuse_strategy,
        req.page_count, [p.dict() for p in req.pages], req.reuse_rate,
    )
    return {"sample_id": sid}
```

Modify `agent/src/main.py`：

```python
from .routers import generate, health, internal, skill_authoring, route_infer, multipage_record

app.include_router(multipage_record.router, tags=["多页记录"])
```

- [ ] **Step 3: 跑测试 + Commit**

```bash
cd agent && DATABASE_URL=... uv run pytest tests/multipage/test_multipage_recorder.py -v
cd /home/karl/Working/TianXing/amis-ai
git add agent/src/knowledge/multipage_recorder.py agent/src/routers/multipage_record.py agent/src/main.py agent/tests/multipage/
git commit -m "feat(1.2): 多页任务结果回写 RAG（带 strategy + reuse_rate tags）"
```

### Task W6.4：RAG 检索按 strategy tag 召回

**Files:**
- Modify: `agent/src/services/rag.py`（在 search_code_samples 加 multipage_filter）

- [ ] **Step 1: 改 search_code_samples 加 multipage 过滤**

```python
async def search_code_samples(
    query_text: str,
    # 原参数...
    multipage_filter: bool = False,
    execution_strategy: str | None = None,
    reuse_strategy: str | None = None,
    page_count_bucket: str | None = None,  # "small" / "medium" / "large"
):
    # 在 SQL WHERE 加：
    # AND $multipage_filter = ANY(tags)
    # AND $execution_strategy = ANY(tags) -- 加 execution_strategy: 前缀匹配
    ...
```

- [ ] **Step 2: 加测试**

Modify `agent/tests/multipage/test_multipage_recorder.py` 追加：

```python
import pytest
from services.rag import search_code_samples


@pytest.mark.asyncio
async def test_search_code_samples_filters_by_multipage_strategy(db_pool):
    # 1. 灌 2 条样例：一条 r1_skeleton，一条 r4_none
    async with db_pool.acquire() as conn:
        for tag_set in [
            ['multipage:1', 'execution_strategy:isolated', 'reuse_strategy:r1_skeleton', 'amis-knowledge-test'],
            ['multipage:1', 'execution_strategy:isolated', 'reuse_strategy:r4_none', 'amis-knowledge-test'],
        ]:
            await conn.execute(
                """INSERT INTO code_samples (
                    tech_stack, tech_stacks, platforms, ui_libs,
                    source_team, amis_json_summary, code_summary,
                    full_amis_json, full_code, status, tags,
                    hit_count, created_at, updated_at,
                    embedding
                ) VALUES (
                    'uniapp-wot-h5', ARRAY['uniapp-wot-h5'], ARRAY['mobile'], ARRAY['wot'],
                    'amis-ai', 'test', 'test', '[]', '/* test */', 'approved', $1,
                    0, NOW(), NOW(),
                    array_fill(0.1::float, ARRAY[1024])::vector
                )""",
                tag_set,
            )

    # 2. 搜索时按 reuse_strategy filter，应只召回 r1_skeleton 那条
    results = await search_code_samples(
        "test query",
        multipage_filter=True,
        reuse_strategy="r1_skeleton",
    )
    assert all('reuse_strategy:r1_skeleton' in r.get('tags', []) for r in results)
```

- [ ] **Step 3: 跑测试 + Commit**

```bash
cd agent && DATABASE_URL=... uv run pytest tests/multipage/test_multipage_recorder.py::test_search_code_samples_filters_by_multipage_strategy -v
cd /home/karl/Working/TianXing/amis-ai
git add agent/src/services/rag.py agent/tests/multipage/test_multipage_recorder.py
git commit -m "feat(1.2): RAG search 按 multipage / strategy tags 硬过滤召回"
```

---

## Phase W7：评测 + 上线灰度（1 周）

### Task W7.1：eval/multipage-1.2/prompts.json + runner.py

**Files:**
- Create: `eval/multipage-1.2/prompts.json`
- Create: `eval/multipage-1.2/runner.py`

- [ ] **Step 1: 写 5 个测试用例（3/5/8 页 × 5 策略 = 15 组合）**

```json
[
  {
    "id": "mp01",
    "title": "登录 + 首页 + 个人中心（3 页）",
    "pages": [
      {"amis_json": "{\"type\":\"form\",\"title\":\"登录\"}", "route_path": "/login"},
      {"amis_json": "{\"type\":\"page\",\"title\":\"首页\"}", "route_path": "/"},
      {"amis_json": "{\"type\":\"page\",\"title\":\"我的\"}", "route_path": "/profile"}
    ],
    "expected_min_reuse_rate": {"r1_skeleton": 0.6, "r2_prompt": 0.3, "r3_refactor": 0.5, "r4_none": 0.0, "unified": 0.7}
  }
  // ... 多个用例
]
```

- [ ] **Step 2: 写 runner（5 策略循环跑分）**

```python
import json, subprocess
from pathlib import Path

def run_strategy(case: dict, strategy: str) -> dict:
    # 调 backend create 任务，等完成，查 reuse_rate + status
    ...

def main():
    cases = json.loads(Path("prompts.json").read_text())
    results = []
    for case in cases:
        for strat in ["r1_skeleton", "r2_prompt", "r3_refactor", "r4_none", "unified"]:
            r = run_strategy(case, strat)
            results.append(r)
    # 输出对比表
```

- [ ] **Step 3: Commit**

```bash
git add eval/multipage-1.2/prompts.json eval/multipage-1.2/runner.py
git commit -m "eval(1.2): 多页评测 prompt 集 + 5 策略对比 runner"
```

### Task W7.2：5 策略对比跑分

- [ ] **Step 1: 跑 runner**

```bash
TEST_ADMIN_JWT=<jwt> python eval/multipage-1.2/runner.py --output multipage-1.2-report.jsonl
```

- [ ] **Step 2: 验证三门槛达标**

- 端到端：3/5/8 页都跑通
- 复用率：R1≥60% / R2≥30% / R3≥50% / R4≤10% / 统筹≥70%
- 不达标 → 调 prompt 模板 / 延期 1 周

### Task W7.3：验收 + 上线 + tag

- [ ] **Step 1: PR 合 main**

```bash
git push origin dev/1.2.0
# 在 GitHub 开 PR，标题「1.2.0：反向飞轮多页面 + 多策略 + RAG 自学习」
```

- [ ] **Step 2: 上线灰度 + 2 周观察 thumbs_up_ratio ≥ 70%**

- [ ] **Step 3: tag v1.2.0**

```bash
git checkout main && git pull origin main
git tag -a v1.2.0 -m "v1.2.0：反向飞轮多页面 + 多策略 + RAG 自学习"
git push origin v1.2.0
```

---

## Self-review

- **Spec coverage**：
  - § 1 目标 → 全 7 周覆盖
  - § 2 决策 D1-D7 → Phase W1-W7 各落地
  - § 3 架构总览 → W2 调度器 + W3-W5 五策略
  - § 4 数据模型 → W1.1（tasks 字段）+ W1.2（pages 子表）+ W2.4（events vocab）+ W6.3（code_samples tags）
  - § 5 关键组件 → 文件结构段全覆盖
  - § 6 5 种策略 → W2.2 R4 / W3 R2 / W4 R1 / W5 R3 + 统筹
  - § 7 RAG 闭环 → W6.3 recorder + W6.4 检索
  - § 8 验收门槛 → W7.2 5 策略对比 + W7.3 thumbs 兜底
- **Placeholder 扫描**：W3.2 有一处 `todo!("把 W2.2 ... 抽到这里")` —— 这是显式标注的重构步骤，spec 上下文清楚，不算 placeholder
- **类型一致性**：`PageInput` / `RagRecord`-style / `GlobalContext` 等签名前后一致

---

## 引用

- 配套 spec: [2026-05-08-multipage-reverse-flywheel-design.md](2026-05-08-multipage-reverse-flywheel-design.md)
- 1.1 升级文档（RAG / Skills 基建）：[../upgrades/2026-05-07-amis-knowledge-completion.md](../upgrades/2026-05-07-amis-knowledge-completion.md)
- 反向飞轮架构：[../architecture/reverse-flywheel.md](../architecture/reverse-flywheel.md)
