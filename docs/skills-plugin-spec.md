# Skills 插件包规范（C.2）

amis-ai 的反向飞轮基于一个三层知识体系：
- **A 层 · Skills**：规则手册（这里）
- **B 层 · RAG 样例**：pgvector 向量检索的代码样例库
- **C 层 · 脚手架**：可直接跑的项目骨架

本文档规定**外部团队**（如 ZC Amis 二开团队）如何编写自己的 Skills 插件包，挂到我们的反向飞轮里使用。

---

## TL;DR

1. 准备一个 git 仓库，目录结构按本规范
2. 部署到生产机（`git clone` 到任意路径）
3. 在 `start-services.sh` 启动时设 `SKILLS_PLUGIN_PATHS=/your/repo/path`（多个用 `,` 分隔）
4. 重启服务，你的 skills 桶会自动 symlink 到 `$CLAW_CONFIG_HOME/skills/<bucket>`，立即对所有任务生效

---

## 一、插件包目录结构

```
your-skills-pack/                        ← SKILLS_PLUGIN_PATHS 指向这里
├── README.md                            ← 给运维看的部署说明
├── zc_amis/                             ← 一个 skill 桶（一个仓库可包含多个）
│   ├── SKILL.md                         ← 必须，索引文件
│   ├── references/                      ← 可选，详细文档
│   │   ├── components.md
│   │   ├── api-conventions.md
│   │   └── ...
│   └── assets/                          ← 可选，参考代码片段
│       └── ...
└── zc_amis_extra/                       ← 同一仓库下的另一个桶（可选）
    └── SKILL.md
```

**核心规则**：
- 仓库根目录 = 一个或多个**桶**的容器
- 每个桶 = 一个**子目录**，必须含 `SKILL.md`
- 不含 `SKILL.md` 的子目录会被静默跳过（如 `.git/`、`docs/`、`tests/` 等）
- 桶名（目录名）就是 Agent 调用 `Skill({skill: "<name>"})` 时用的名字
- 桶名与 amis-ai 自带桶（`_common`、`uniapp-wot-h5`）冲突时，**自带桶优先**，插件桶被忽略 + 警告日志

---

## 二、SKILL.md 格式

```markdown
---
name: zc_amis
description: ZC Amis 二开知识包：在 Amis 之上扩展的业务组件、字段约定、私有 API 适配
---

# Skill: zc_amis（外部插件包）

## 工作流程
（Agent 加载这个 skill 时该按什么步骤工作？）

## 强约束
（违反会被判失败的硬规则，比如"必须用 zc-* 前缀组件"）

## 可用的 references
- `references/components.md`：ZC 二开组件清单
- `references/api-conventions.md`：私有 API 风格约定
- ...
```

### Frontmatter 字段（YAML）

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | ✅ | Agent 调用时用的标识符（建议同目录名） |
| `description` | ✅ | 一行简介，会在"其他 stack 索引"里展示给 Agent |

### 正文（Markdown）

- 简短、抓重点（这是 Agent 加载 skill 时拿到的全文，**别写小说**）
- 引用 references 用相对路径：`Read({path: "references/components.md"})`
- **不要重复 `_common` 桶里已有的内容**（产品哲学、错误处理范式等）

### 大小限制

- `SKILL.md`：单文件 **256 KB** 上限（超过的内容拆到 references/）
- `references/*.md`：每文件按需加载，无总量限制（受 LLM 上下文窗口约束，建议单文件 < 50 KB）

---

## 三、部署 / 挂载

### 单台机器（推荐用法）

```bash
# 1. 把插件包 git clone 到任意路径
git clone https://internal.git/zc-amis-skills /opt/zc-amis-skills

# 2. 设环境变量启动 amis-ai
SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills /home/karl/Working/TianXing/amis-ai/shared/scripts/start-services.sh restart
```

### 多个插件包

```bash
SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills,/opt/another-team-skills,/opt/internal-pack
```

### 启动时会发生什么

`claw-agent-server` 启动时（`init_skills_env` → `mount_plugin_packs`）：

1. 读 `SKILLS_PLUGIN_PATHS`（逗号分隔）
2. 对每个路径里**含 `SKILL.md` 的子目录**（即每个桶），symlink 到 `$CLAW_CONFIG_HOME/skills/<桶名>`
3. 已存在同名 symlink → 删旧建新（启动时以 env 为 source of truth）
4. 已存在同名**普通目录** → 跳过 + 警告（不破坏自带桶）
5. 日志会输出每个挂载结果，看 `/tmp/amis-ai-logs/claw-agent-server.log`

### 验证挂载成功

```bash
# 1. 看 ls 是不是有 symlink
ls -la /home/karl/Working/TianXing/amis-ai/skills/

# 2. 看 backend list 接口（admin 登录）
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/skills | jq '.buckets[].dir_name'

# 3. 看前端：浏览器打开 /knowledge-base/skills，新桶卡片应该出现
```

---

## 四、与 amis-ai 自带桶的关系

| 桶 | 谁维护 | 注入策略 |
|---|---|---|
| `_common` | amis-ai 团队 | 永久全文塞 system_prompt（产品哲学，所有任务必读） |
| `uniapp-wot-h5` 等 stack 桶 | amis-ai 团队 | 当任务 `tech_stack` 匹配时全文塞 |
| **你的插件桶** | 外部团队（你） | name + description 列在"可用的其他 Skills"索引里；Agent 按需用 `Skill` 工具加载全文 |

**这意味着：你的桶不会自动被注入到每个任务的上下文里**——除非任务 `tech_stack` 字段恰好匹配你的桶名（例如设 `tech_stack=zc_amis`）。**Agent 是看到索引后主动决定要不要拉**。

如果你希望某个 ZC 业务任务**强制**走你的知识：
- 在创建任务时设置 `tech_stack` 为你的桶名
- 或者在用户的 prompt 里明确说"按 ZC Amis 二开规则生成"，Agent 会主动调 `Skill({skill: "zc_amis"})`

---

## 五、命名 / 安全 / 维护建议

### 桶名（dir_name）

- 只允许 `[A-Za-z_][A-Za-z0-9_-]*`，建议用 snake_case
- 避免与 amis-ai 自带桶冲突（`_common`、`uniapp-wot-h5` 等）
- 用团队/产品作前缀避免和其他插件冲突，如 `zc_amis`、`zc_admin`、`acme_crm`

### references 组织

- 按主题拆文件：`components.md`、`api-conventions.md`、`error-handling.md`
- 单个 reference 最好 < 50 KB（LLM 单次 Read 友好）
- 文件名用小写 + 短横线：`my-rule.md` ✓ ｜ `My_Rule.md` ✗

### 安全

- 后端 `Skill` 工具有**路径白名单**：只允许读 `$CLAW_CONFIG_HOME/skills/**` 或 `SKILLS_PLUGIN_PATHS` 子树。Agent 无法借 `Skill` 工具读宿主机其它文件
- 单文件 read 上限 256 KB，超过返回截断
- 你的 SKILL.md 内容会进 LLM 上下文 → **不要在 markdown 里写真实的密钥、内部 IP、生产 URL 等敏感信息**

### 版本管理

- 用 git tag 给插件包打版本（`v1.0.0`、`v1.1.0`）
- 部署时 `git clone --branch v1.0.0` 锁版本
- amis-ai 服务重启即重新挂载，无需手动 reload

---

## 六、调试

### 验证 SKILL.md frontmatter 正确

```bash
head -10 your-skills-pack/zc_amis/SKILL.md
# 第一行必须是 ---，name 和 description 都填
```

### 验证 Agent 能找到

进入 `/knowledge-base/skills`，应该看到新桶卡片。点进去看到 SKILL.md 内容、references 文件树。

### Agent 用了没

跑一个任务后，前端项目详情页 ChatPanel 里能看到 Agent 的工具调用 `Skill({skill: "zc_amis"})`。

### 没挂上？

看 claw-agent-server log：
```bash
grep -E "插件|跳过" /tmp/amis-ai-logs/claw-agent-server.log
```

常见原因：
- 路径不存在 → 日志会写 "插件路径不存在或非目录"
- 目录里没有含 `SKILL.md` 的子目录 → 日志会写 "跳过 X: 不含 SKILL.md"
- 同名桶被自带桶占用 → 日志会写 "插件桶 X 已被同名非符号链接占用..."

---

## 七、参考

- 模板仓库（按本规范填好）：见 [zc-amis-plugin-template-readme.md](./zc-amis-plugin-template-readme.md)
- amis-ai 自带 skill 包参考：[skills/_common/](../skills/_common/)、[skills/uniapp-wot-h5/](../skills/uniapp-wot-h5/)
- 插件挂载实现：[claw-code/rust/crates/claw-agent-server/src/main.rs](../claw-code/rust/crates/claw-agent-server/src/main.rs) 的 `mount_plugin_packs` 函数
