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
./shared/scripts/smoke-test.sh    # 期望 PASS=35 FAIL=0
```

**通过条件**：
- check 全绿（致命 0，端口占用类 warn 不算）
- 4 服务 status UP（8080 / 8090 / 8091 / 8000）
- smoke-test PASS=35，0 失败

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

### 3.5 移动端 UI 抽检（uniapp + Wot UI 任务必做）⭐

人话：**生成的 .vue 页面是不是真的「移动端列表感」，而不是 LLM 内置的「Web 后台审美」直接糊上来**。
2026-04-25 之前 task #88 翻车样本：登录页只有 `wd-cell-group` 没 `border`，主按钮靠 inline `style="width:100%"`，背景白底无层次。

**抽检场景**：让 Agent 生成「登录页 + 用户列表 + 用户详情」三联页面（最高频模式）。

**预览面板**（PC 端模拟手机视口 375×667）逐项肉眼对照：

| 类别 | DO（应该看到的） | DON'T（看到就判负） |
|---|---|---|
| **登录页** | 顶部 brand 区（Logo / 主标题 / 副标题）+ 灰底 `#f7f8fa` + cell-group 带分隔线 + 主按钮"贴下方 / 满宽 / 高 88rpx 左右" | 白底满屏 / 输入框糊在一起没分隔线 / 标签左输入框右两列布局 / "记住我"独占一行大间距 / 主按钮窄而扁 |
| **登录页**（次级动作） | "忘记密码 / 注册账号"为蓝色文字链接 | 用了第二个 wd-button 大按钮 |
| **登录页**（导航） | **没有**返回箭头 | 顶部冒出 `wd-navbar` 的 ‹ |
| **列表页** | 每行带头像/标题/副标题 + 右侧箭头 + 分隔线 + 下拉刷新 + 滚到底加载更多 + 空数据有 `wd-status-tip` | 列表是个表格、有边框框线 / 没有滚动钩子 / 空状态什么都不显示 |
| **详情页** | 头部白底 hero 区 + 信息分组 cell-group title + 底部固定按钮带 safe-area | 信息全是表格、操作按钮放页面中间 |
| **共性** | 单位全是 `rpx`、按钮永远 `<wd-button block size="large">`、表单包 `<wd-form :rules>` | 出现硬编码 `px`、按钮靠 `style="width:100%"` 凑合、没有任何校验 |

**配套自动化检查**（写完代码后，可在沙箱里跑）：

```bash
# 1. 验证骨架硬约束（在沙箱容器里）
docker exec amis-ai-sandbox-task-<id> sh -c '
  cd /workspace/src/pages
  echo "==== 检查 wd-cell-group 是否带 border ===="
  grep -rE "<wd-cell-group(\s|>)" --include="*.vue" | grep -v border && echo "❌ 发现无 border 的 cell-group" || echo "✓ 全部带 border"
  echo "==== 检查主按钮是否 block size=large ===="
  grep -rE "<wd-button[^>]+type=\"primary\"" --include="*.vue" | grep -v "block" && echo "❌ 主按钮缺 block" || echo "✓"
  echo "==== 检查是否硬编码 px ===="
  grep -rE "[0-9]+px" --include="*.vue" | grep -v rpx | head -5 && echo "❌ 有硬编码 px" || echo "✓"
'
```

**未通过怎么办**：

1. **先确认预览顶栏的视口选择器是手机视口**（默认 iPhone SE 375×667）。如果是「桌面（铺满）」→ 手机端 rpx 会跟视口同宽放大，文字看上去会"巨大"，那是预览设置不是代码 bug。Reason: uni-app H5 runtime（`@dcloudio/uni-h5/dist/uni-h5.es.js:731`）写死 `documentElement.style.fontSize = width / 23.4375 + 'px'`，rpx 通过 rem 跟随视口缩放——PC 浏览器 iframe 100% 宽时这个 width 就是 800px+，1rpx 比手机 375px 视口大 2 倍以上。**这不是 bug 是设计**。
2. 打开「执行详情」面板，看 system_prompt 里是否包含「移动端页面骨架契约」段（task_loop.rs P3 注入）。如果没有 → claw-agent-server 没重启或 platform/ui_libs 字段没传对。
3. 看「触发的 Skills」段是否有 `ui-wot` + `platform-mobile` 两桶。如果只有 `_common` → ctx 维度字段没匹配上，回查任务创建时的 platform/ui_libs。
4. 启用 tracelog（系统设置 → 任务追踪日志，mode=smart 或 all_tasks），下次任务出问题去 `/tmp/amis-ai/tracelogs/task-<id>/system_prompt.md` 看 LLM 真看到什么、`llm_calls/call-001.json` 看它真回了什么。

---

## 四、Skills 知识库 UI（手动 · 5 分钟）

| 步骤 | 期望 |
|---|---|
| `/knowledge-base/skills` | 桶卡片列表（`_common` 排首 + `uniapp-wot-h5` + 末尾"新建桶"虚线卡） |
| 点 `uniapp-wot-h5` 卡 | 进单桶详情，**自动打开 SKILL.md** |
| 树里右键 `references/` | 4 项菜单（新建文件 / 新建文件夹 / 重命名 / 删除） |
| 改一行 markdown → Ctrl+S 不触发 → 点"保存" | toast"已保存。下一个新任务将看到新内容" |
| 顶部"新建桶" → 填 dir_name + description → 提交 | 自动跳新桶并打开 SKILL.md |

### 4.1 AI 起草新桶（Synthetic Honey · 需要 LLM 配置）

| 步骤 | 期望 |
|---|---|
| `/knowledge-base/skills` 右上"AI 起草新桶"按钮 | 有紫色边框的按钮 |
| 点击 → Wizard Step 1 | 表单含 mode / dir_name / display_name / description / target_stack / reference_buckets(多选) / extra_context |
| 随便填个栈（如 react-antd-web）→ ref 选 `_common, uniapp-wot-h5` → 点"开始生成" | 跳到 Step 2 流式界面，左侧 Tabs 逐个出现 SKILL.md / references/*.md，右侧 Monaco 实时刷 token |
| 流自然完成后 | 自动跳 Step 3 审核页，默认全部勾"采纳" |
| 随便点一个文件的"编辑" | Drawer 弹出 Monaco，可改可保存（乐观锁生效，改完回到审核页内容更新） |
| Step 4 选"新建桶" + overwrite → 确认 | toast"已采纳…"，自动跳 `/knowledge-base/skills/:新桶` 看到文件树 |
| 进反向飞轮跑个小任务（任何 tech_stack） | 这个新桶在 SKILL.md 里被 Agent 识别（至少 L2 索引段能看到桶名）|

### 4.2 单文件 AI 改写（Task 12）

| 步骤 | 期望 |
|---|---|
| 进任意已有桶（如 `uniapp-wot-h5`）→ 打开 SKILL.md | 顶部工具栏左侧多一个"AI 改写"按钮（非 .md 文件禁用） |
| Monaco 里选几行 → 点"AI 改写" | 右侧 Drawer 弹出，回显选区 + 方向 TextArea |
| 填"更精炼"→ 点"开始改写" | 流式出现新片段 → 完成后切到 DiffEditor 对比视图 |
| 点"接受并替换选区" | Drawer 关闭，Monaco 文件内容被替换（dirty 标记），再点"保存"落盘 |
| 如果没选文本就点"AI 改写" | toast 提示"请先选中一段再点" |

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
