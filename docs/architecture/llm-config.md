# LLM 配置与协议路由

沿用 amis-ai 现有的 LLM 管理机制（`backend/src/handlers/llm_admin.rs`）：在「系统设置 → LLM 供应商」UI 里配置 provider + model，**不硬编码**。

## task_type 清单

| task_type | 用途 | 默认 fallback |
|---|---|---|
| `generation` | 兜底（正向飞轮 NL → Amis JSON） | — |
| `code_generation` | 反向飞轮代码生成 | → `generation` |
| `skill_authoring` | AI 起草 skill 桶（整桶 + 改写） | → `code_generation` → `generation` |
| `quality_judge` | RAG 质量评委（二元 good/needs_review/bad） | → `generation`（**不走 code_generation 避免同族偏见**） |
| `embedding` | 向量化（pgvector 入库 + 检索） | — |

选择器实现：[../../backend/src/services/llm_selector.rs](../../backend/src/services/llm_selector.rs)

## protocol 字段（必须显式选）

每个供应商创建时**必须选择协议类型**（`llm_providers.protocol` 字段）：

| protocol | 适用 | 说明 |
|---|---|---|
| `openai` | Ollama / DashScope / DeepSeek / 通义千问 / OpenAI 官方 | OpenAI Chat Completions 兼容协议 |
| `anthropic` | api.anthropic.com / 支持 Claude 端点的中转服务 | Anthropic Messages API |

`claw-agent-server` 只看 `protocol` 字段路由，**不再根据模型名前缀猜测**。

## Anthropic 路径特殊处理

[../../claw-code/rust/crates/claw-agent-server/src/](../../claw-code/rust/crates/claw-agent-server/src/) 的 Anthropic 路径会自动：

- **规范化 base_url**：去除结尾 `/v1`，避免中转服务带 `/v1` 时拼成 `/v1/v1/messages`
- **工具 schema 用原生 `tools` 参数传递**：不传的话 Claude 会模仿 Claude Code 训练数据输出 `<function_calls><invoke>` 文本而非结构化 `tool_use`

## 已知限制

- **本地开源模型（如 Ollama `qwen3.5:27b`）tool calling 能力弱**，Agent 容易只输出文字不调工具
- **推荐配置**：支持 function calling 的模型
  - Claude Haiku / Sonnet
  - GPT-4o-mini / GPT-4o
  - DeepSeek-V3 API
  - Qwen-Max
- **quality_judge 与 code_generation 绑同一 provider** 会有 5–15% systematic bias（同族偏见），UI 已强提示但没有强制校验

## 配置流程（admin 操作）

1. 「系统设置 → LLM 供应商」→「新建」→ 选 protocol（openai / anthropic）
2. 填 api_key / base_url / 可选 model_allowlist
3. 「任务类型绑定」把 provider × model 绑到某个 task_type

## 参考实现

LLM 配置管理参考 timecraft-novel 项目：
- 后端 LLM 管理：`backend/src/handlers/llm_admin.rs`
- LLM 工具模块：`backend/src/utils/llm.rs`
- JWT 认证：`backend/src/utils/jwt.rs`

路径：`~/Working/creation/timecraft-novel`
