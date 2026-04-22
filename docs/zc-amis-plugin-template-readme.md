# ZC Amis Skills 插件包 · 起步模板

> 这份文档是给 **ZC Amis 团队** 看的——告诉你怎么从空仓库出发，建好你们的二开知识包并挂到 amis-ai 反向飞轮上。
>
> 完整规范见 [skills-plugin-spec.md](./skills-plugin-spec.md)。

---

## 一、5 分钟快速起步

### Step 1：建一个空 git 仓库

```bash
mkdir zc-amis-skills && cd zc-amis-skills
git init
```

### Step 2：建一个 skill 桶骨架

```bash
mkdir -p zc_amis/{references,assets}
touch zc_amis/references/.gitkeep zc_amis/assets/.gitkeep
```

### Step 3：写 SKILL.md（最关键的文件）

`zc_amis/SKILL.md`：

```markdown
---
name: zc_amis
description: ZC Amis 二开知识包：基于百度 Amis 的业务扩展组件、私有 API 约定、字段映射规则
---

# Skill: zc_amis

ZC 团队基于百度 Amis 二开的业务知识手册。**和 amis-ai 自带的 _common（理解 Amis）配合使用**。

## 强约束（违反会判失败）

1. ZC 私有组件必须用 `zc-*` 前缀（如 `zc-amount`、`zc-org-picker`）
2. 调用我们的私有 API 必须经过 `src/api/zcRequest.ts`（含统一错误码处理）
3. 不允许直接 import `@fesjs/fes` 的内部模块（用我们封装的 `@zc/foundation`）

## 工作流程

### 1. 拿到 Amis JSON
- 先按 `_common/references/amis-core-concepts.md` 理解 Amis 渲染语义
- **如果出现 zc-* 类型组件**，立即 `Read references/components.md` 查它的 props/api

### 2. 翻译时
- 普通 Amis 组件 → 跟着当前 stack（如 uniapp-wot-h5）的映射
- ZC 私有组件 → 用我们 references/components.md 里的实现
- API 调用 → references/api-conventions.md

### 3. 自检
- 没有用错的组件名（`grep -E "<zc-[a-z-]+" src/`）
- API 走了 zcRequest 而非裸 axios
- 错误码按 references/error-codes.md 处理

## 可用的 references

- `references/components.md`：ZC 私有组件清单和 prop 定义
- `references/api-conventions.md`：私有 API 风格、错误码、鉴权
- `references/business-fields.md`：业务字段命名约定（org_id、tenant_id 等）

需要详情时用 `Read` 工具按相对路径读。
```

### Step 4：挂到 amis-ai 上

让运维在生产机上：

```bash
# 1. clone 你的仓库
git clone <你们的仓库 URL> /opt/zc-amis-skills

# 2. 在 amis-ai 启动时注入 env（建议改 systemd 或 .env，不要靠手动）
SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills /home/karl/Working/TianXing/amis-ai/shared/scripts/start-services.sh restart
```

### Step 5：验证挂载成功

让 amis-ai admin 登录后台：
- 打开 `/knowledge-base/skills`
- 应该看到一张新的 `zc_amis` 卡片，色调跟其他桶不一样
- 点进去能看到 SKILL.md 内容 + references 树

---

## 二、推荐的下一步

### 2.1 充实 references

创建并填充：
- `references/components.md`：每个 ZC 私有组件一节，含
  - 组件名
  - 一句话说明
  - props 表（含必填/默认值）
  - 最小可用代码示例（fenced code block）
  - 常见误区/坑

- `references/api-conventions.md`：
  - 统一请求工具 import 路径
  - 标准 response 结构（`{code, msg, data}`）
  - 错误码分段（1xxx 客户端、2xxx 业务、5xxx 服务端）
  - 鉴权 / refresh token 流程
  - 文件上传约定

- `references/business-fields.md`：
  - 字段命名（`org_id` / `orgId` 二选一）
  - 时间格式（ISO 8601 还是 Unix ts）
  - 枚举值约定

- `references/dont-do.md`（可选但有用）：
  - 已知反模式集合
  - 历史踩坑记录（让新人少走弯路）

### 2.2 充实 assets（可选）

`assets/` 用来放**真的能拿出来抄的代码片段**，例如：
```
assets/
├── _login_page.vue                  ← 一份典型的 ZC 登录页
├── _crud_with_filter.vue            ← 列表+筛选+分页的标准模板
├── _form_with_zc_widgets.vue        ← 用全套 zc-* 组件的表单
└── _api_module_template.ts          ← src/api/ 文件的标准结构
```

> Agent 用 `Read` 工具按需读 assets，**不会自动注入到 system_prompt**。

### 2.3 多桶拆分（仓库变大后）

一个仓库可以放多个桶：

```
zc-amis-skills/
├── zc_amis/                        ← 通用知识
├── zc_admin/                       ← 后台管理类项目专用
├── zc_h5/                          ← H5 端专用
└── zc_lowcode/                     ← 低代码编辑器扩展
```

每个桶各自有 `SKILL.md`，amis-ai 启动时会自动全部挂上。

---

## 三、维护节奏建议

| 频率 | 做什么 |
|---|---|
| **新组件上线** | 立即在 `references/components.md` 加一节 |
| **改了 API 标准** | 同步 `api-conventions.md` |
| **发现 LLM 在某场景生成错代码** | 在 `references/dont-do.md` 加一条反例 |
| **季度** | 复盘 Skill.md 的工作流程是否还合理 |
| **变更后** | git tag 一个新版本，通知运维更新 |

---

## 四、常见问题

### Q: 改了 SKILL.md 要重启服务才生效吗？
**A**：要。amis-ai 启动时一次性扫描 + 拼 system_prompt。但**只对下一个新任务生效**——已经在跑的任务不会重新读 skill。

### Q: 如果我们的桶名想叫 `zc-amis`（带横线）行吗？
**A**：行。dir_name 允许字母数字 `_` `-`。但 SKILL.md frontmatter 的 `name` 字段建议保持一致以免混淆。

### Q: 能不能让我们的桶**永久**注入 system_prompt 而不是当索引？
**A**：当前 amis-ai 设计：`_common` 永久注入 + 当前 stack 永久注入 + 其他桶仅索引。如果你们想让 ZC 知识也永久注入，方案：
- 路线 A：把 ZC 任务的 `tech_stack` 字段设成 `zc_amis`（这样它变成"当前 stack"被全文注入）
- 路线 B：跟 amis-ai 团队商量加一个"永久注入名单"配置项

### Q: 我们的 references 里有内部 URL / IP 怎么办？
**A**：要么脱敏（用占位符），要么把这部分挪到 assets 里（assets 不会被自动注入，只在 Agent 主动 `Read` 时进上下文）。注意 LLM 可能会在生成代码里复读，所以**生产敏感信息绝不放进 skill**。

### Q: 多团队的桶冲突怎么办？
**A**：amis-ai 自带桶优先；多个插件包之间 → 启动顺序决定（先挂的先到，后挂的同名会被警告跳过）。强烈建议**桶名带团队前缀**避免冲突。

---

## 五、参考

- 完整规范：[skills-plugin-spec.md](./skills-plugin-spec.md)
- amis-ai 自带 `_common` 桶：[skills/_common/SKILL.md](../skills/_common/SKILL.md) —— 当作模板抄结构
- amis-ai 自带 `uniapp-wot-h5` 桶：[skills/uniapp-wot-h5/](../skills/uniapp-wot-h5/) —— 当作"完整 stack 桶"的范例
