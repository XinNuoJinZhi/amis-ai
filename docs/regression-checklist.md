# amis-ai 回归检查清单（D.4）

每次发版 / 大改动 / 新人接手 / 服务迁移机器，按本清单跑一遍。
**所有"可脚本化"项已在 [smoke-test.sh](../shared/scripts/smoke-test.sh) 自动覆盖**——本文档重点记录人工要看的部分。

---

## 一、依赖与启动（30 秒）

```bash
# 1. 体检
./shared/scripts/start-services.sh check

# 2. 启动
./shared/scripts/start-services.sh start

# 3. 自动 smoke
./shared/scripts/smoke-test.sh    # 期望 PASS=26 FAIL=0
```

**通过条件**：
- check 全绿（致命 0，端口占用类 warn 不算）
- 4 服务 status UP（8080 / 8090 / 8091 / 8000）
- smoke-test PASS=26，0 失败

**常见踩坑**：
- ✗ Python agent 没起 → smoke 第 1 项 :8000 失败 → check 一下 uv / agent venv
- ✗ Embedding 维度不对 → smoke 第 6 项失败 → 看模型配置 + ALTER TABLE 重建列
- ✗ pgvector 未启用 → backend 启动会自己 CREATE EXTENSION，但权限不够会失败 → 手动以 superuser `CREATE EXTENSION vector`

---

## 二、正向飞轮（手动 · 5 分钟）

人话：**让用户用聊天页生成 Amis JSON 的功能没坏**。

| 步骤 | 期望 |
|---|---|
| 浏览器打开 `/chat` | 页面能加载，左侧历史 + 中间 ProChat |
| 输入"做一个用户列表，含搜索和分页" | 模型流式吐 Amis JSON |
| 看右侧预览面板 | 能渲染出表格 |
| 点采纳 | toast"已采纳"，跳到 `/templates` 能看见这条 |

---

## 三、反向飞轮（手动 · 15 分钟）⭐ 最关键

人话：**Amis JSON → 项目代码 → 沙箱跑起来 → 采纳沉淀 → 下次复用**。

### 3.1 启动一个真任务

| 步骤 | 期望 |
|---|---|
| `/chat` 生成一个简单 JSON（如登录页） | OK |
| 点消息下"🚀 生成项目代码" | 跳到 `/projects/:id`，进入 onboarding |
| Onboarding 步骤滚动 | 创建任务 ✓ → 拷贝脚手架 ✓ → 启动 Agent ✓ → 进入 workspace |

### 3.2 Workspace 阶段

| 步骤 | 期望 |
|---|---|
| 切到 ChatPanel | 能看到 Agent 的工具调用流（bash / read_file / write_file / **Skill** ✨） |
| 切到 FileTree + Editor | src/ 下逐渐出现新文件 |
| 切到 PreviewPanel | dev 启动后 iframe 加载（status bar 显示 `dev READY`）|
| 切到 ConsolePanel | 浏览器控制台 log 透传过来 |

### 3.3 RAG 注入验证（这是 B 阶段新增！）

| 步骤 | 期望 |
|---|---|
| 看 backend log 启动这个任务那段 | 应有 `RAG Top-N hit (tech_stack=...): ids=[...]` 一行（如果库里有 approved 样例） |
| 没有？ | 先在 `/knowledge-base/code-samples` 手动入库几条 approved 样例（B.6 种子） |

### 3.4 采纳

| 步骤 | 期望 |
|---|---|
| dev 状态 SUCCEEDED 后，TopBar 看到"采纳"按钮 | OK |
| 点采纳 → 弹窗填可选摘要 → 提交 | toast 显示 sample_id 和 file_count |
| 去 `/knowledge-base/code-samples` 看 | 新行出现，状态按系统配置（pending 或 approved） |
| 详情页看 | 左 Amis JSON / 右收集的代码 / 摘要可编辑 / 通过-拒绝-删除按钮齐全 |

---

## 四、Skills 知识库 UI（手动 · 5 分钟）

| 步骤 | 期望 |
|---|---|
| `/knowledge-base/skills` | 桶卡片列表（`_common` 排首 + `uniapp-wot-h5` + 末尾"新建桶"虚线卡） |
| 点 `uniapp-wot-h5` 卡 | 进单桶详情，**自动打开 SKILL.md** |
| 树里右键 `references/` | 4 项菜单（新建文件 / 新建文件夹 / 重命名 / 删除） |
| 改一行 markdown → Ctrl+S 不触发 → 点"保存" | toast"已保存。下一个新任务将看到新内容" |
| 顶部"新建桶" → 填 dir_name + description → 提交 | 自动跳新桶并打开 SKILL.md |

---

## 五、RBAC（手动 · 1 分钟）

| 步骤 | 期望 |
|---|---|
| 用 normaluser 登录 | 侧栏**不显示**"知识库"菜单 |
| URL 直接敲 `/knowledge-base/skills` | Result 页"无权访问"（403） |
| 直接 curl `/api/skills` 不带 token | 401 "缺少 Authorization 头" |

---

## 六、ZC Amis 插件机制（手动 · 5 分钟）

| 步骤 | 期望 |
|---|---|
| 造一个假插件包 `mkdir -p /tmp/test-pack/test_pack/{references,assets}` + 写 SKILL.md（带 frontmatter） | OK |
| `SKILLS_PLUGIN_PATHS=/tmp/test-pack ./shared/scripts/start-services.sh restart` | claw-agent log 出现 "插件桶已挂载: .../skills/test_pack -> /tmp/test-pack/test_pack" |
| `ls amis-ai/skills/` | 多了 `test_pack` symlink |
| `/knowledge-base/skills` 卡片列表 | 多一张 `test_pack` 卡 |
| 进任意任务 → ChatPanel 让 Agent `Skill({skill: "test_pack"})` | 能返回 SKILL.md 全文 |
| `rm -rf /tmp/test-pack && rm /home/karl/Working/TianXing/amis-ai/skills/test_pack` | 清理 |

---

## 七、Embedding 兼容性（手动 · 30 秒）

| 步骤 | 期望 |
|---|---|
| `/settings → 模型配置` | 顶部 Alert："Embedding 兼容性未探测" + 探测按钮 |
| 点探测 | 1–60 秒后变绿 Alert，三个 Tag（pgvector列 / env / 模型实测）维度一致 |
| 把 embedding model 改成不存在的（如 `wrong-model`） → 重新探测 | 红 Alert + "❌ 无法探测..." |

---

## 八、关键日志快照

每次发版前归档一份：

```bash
mkdir -p /tmp/release-snapshot-$(date +%Y%m%d)
cp /tmp/amis-ai-logs/*.log /tmp/release-snapshot-$(date +%Y%m%d)/
./shared/scripts/start-services.sh status > /tmp/release-snapshot-$(date +%Y%m%d)/status.txt
./shared/scripts/smoke-test.sh > /tmp/release-snapshot-$(date +%Y%m%d)/smoke.txt 2>&1
```

---

## 九、回滚信号

如果某条目失败，**立即回滚**而非热修，至少先看：

| 信号 | 可能原因 |
|---|---|
| smoke RAG 入库失败 | Python agent 不可达 / embedding 模型异常 |
| smoke embedding 兼容性失败 | 切了模型但忘了 ALTER TABLE 重建列（pg dim != model dim） |
| 任务创建失败 | LLM 配置错 / sandbox docker 镜像不存在 |
| dev 启动一直 starting 不 ready | 沙箱网络异常 / pnpm install 失败（看 sandbox-service log） |
| Agent 不调 Skill 工具 | 模型 tool calling 弱（换 Claude Haiku / GPT-4o-mini / DeepSeek-V3） |

---

## 十、本清单未覆盖的（人工经验外的"未知未知"）

- 长跑稳定性（24h+ 持续任务）
- 并发任务（>3 个同时跑的资源占用）
- 大 Amis JSON（>10K 行）的 Agent 表现
- 用户 prompt 注入攻击的容错

这些建议**线上灰度跑一段时间收数据**，不在快速回归范围。
