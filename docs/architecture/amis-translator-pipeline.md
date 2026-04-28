# Amis Translator Pipeline（确定性翻译器架构）

> 2026-04-25 起草，从「LLM 自由发挥 + Skills 软约束」转为「确定性翻译器 + LLM 边缘修补」。

## 为什么要做

### 旧路线（不可扩展）

```
Amis JSON → LLM（吃 Skills 提示）→ .vue 代码
```

问题：
1. **LLM 每次结果不稳定** —— 同一份 schema 多次跑可能不同 UI 形态
2. **Skills 不可扩展** —— Amis 200+ 组件类型每个都补「骨架 + DO/DON'T」根本写不完
3. **System prompt 越塞越大** —— LLM 注意力机制反而漏更多
4. **无法保证 1:1 翻译** —— LLM 会自由发挥（凭空加品牌区/记住我/忘记密码）

### 新路线（可扩展）

```
Amis JSON
  ↓
确定性翻译器（per Amis-type × per UI-lib 纯函数）
  ↓
.vue / pages.json 等业务文件 → 直接 write_file 到沙箱 → dev_start
  ↓
（仅当沙箱报错或翻译器不支持时）LLM 介入修补
```

## 三阶段实施

### 阶段 A（MVP）：跑通端到端

支持范围：`page / form / input-text / input-password / button`（覆盖登录/注册/找回密码三类高频）。

**验证标准**：起一个登录页任务，**LLM 0 次调用**就跑出干净的「标签在上、输入在下、单列堆叠」登录页。

### 阶段 B：扩展覆盖率

新增：
- 输入类：`textarea / input-number / select / radios / checkboxes / switch / date / file`
- 容器类：`crud（含分页/下拉刷新/上拉加载/空状态）`
- 反馈类：`dialog / popup`

目标：覆盖 90% 业务场景。

### 阶段 C：飞轮闭环

- **Unsupported types 明确报错**：翻译器遇到不支持的 type 时给清晰错误（不是悄悄漏），前端能引导用户改
- **采纳后反喂 hook**：留 hook 接口让用户采纳的代码反喂给翻译器规则库（具体闭环逻辑等数据沉淀后再做）
- **Skills 瘦身**：从 30k+ 字的「约束膏药」瘦成 5k 字的「决策手册」，指向翻译器代码作为权威映射来源

## 模块布局

### Agent 端（Python）

```
agent/src/amis_translator/
├── __init__.py
├── pipeline.py                    # 主入口：translate(req) → TranslationResult
├── models.py                      # TranslateRequest / TranslateResult dataclass
└── translators/
    ├── __init__.py
    └── wot/                       # 第一组 UI 适配（uniapp + wot-design-uni）
        ├── __init__.py            # translate_root: 顶层 type 分发
        ├── page.py                # type=page → SFC + pages.json patch
        ├── form.py                # type=form → wd-form + form-field 列表 + 主按钮
        ├── input_text.py          # type=input-text → form-field + wd-input
        ├── input_password.py      # type=input-password → form-field + wd-input[type=password]
        └── button.py              # type=button → wd-button
        # 阶段 B 增加：textarea/select/radios/checkboxes/switch/date/...
```

**未来扩展**：每加一个 UI 库就在 `translators/` 下加一个新子目录（如 `element_plus/`、`vant/`），互不影响。

### Agent endpoint

```
POST /internal/translate-amis
```

请求：
```json
{
  "amis_json": { "type": "page", "title": "用户登录", "body": {...} },
  "ui_lib": "wot",
  "tech_stack": "uniapp",
  "platform": "mobile",
  "current_pages_json": { "easycom": {...}, "pages": [...], "globalStyle": {...} }
}
```

响应：
```json
{
  "success": true,
  "fully_supported": true,
  "files": {
    "src/pages/login/login.vue": "<template>...",
    "src/pages.json": "{...}"
  },
  "unsupported_types": [],
  "notes": ["已生成页面 pages/login/login"]
}
```

`fully_supported=false` 时 backend 走 LLM 兜底。

### Backend 集成

[backend/src/handlers/project_generation.rs](../../backend/src/handlers/project_generation.rs) `create_task` 流水线改为：

```
1. 创建 task DB 记录                          ← 不变
2. sandbox 创建 + RAG 检索（并发）            ← 不变
3. scaffold 拷贝到 workdir                    ← 不变
4. 【新增】调 agent /internal/translate-amis
   ├ fully_supported=true:
   │   - 把 files 用 sandbox.fs_write 写入工作目录
   │   - 调 sandbox /sandboxes/:id/dev-start
   │   - task 状态 = "running"，跳过 claw-agent
   │   - 直接返回成功
   └ fully_supported=false:
       - 走原 claw-agent 流水线（既有逻辑）
```

### 错误回路（阶段 C）

- 翻译器遇到不支持的 type → `unsupported_types` 列出（如 `["wizard", "chart"]`）
- backend 落 `translation_unsupported` 事件，前端「执行详情」面板看到
- LLM 兜底时 system_prompt 注入这条："翻译器无法处理 wizard，请你按 Skills 翻译"

## Skills 的新定位

**旧 Skills**：「这个组件应该这么写、那个属性必须这么用」（约束膏药）。

**新 Skills**：
- Amis 渲染语义概览（不变）
- **翻译器覆盖矩阵**：哪些 type 已支持 / 降级 / 不支持
- **LLM 介入边界**：只在 `unsupported_types` 非空时介入
- **指向翻译器源码**：LLM 出错时去 `agent/src/amis_translator/translators/wot/` 查权威映射

## 性能 / 资源对比

| 维度 | LLM 路线 | 翻译器路线 |
|---|---|---|
| 一次任务耗时 | 30s–120s（多轮 LLM 调用） | <1s（纯函数） |
| LLM token 消耗 | 数千–数万 | 0（除非翻译器降级） |
| 结果一致性 | 差（每次可能不同） | 完美（同 schema 同输出） |
| 新场景扩展 | 改 SKILL.md → 等 LLM "学会" | 写一个新 translator 函数 |
| 调试 | 看 prompt + LLM 输出推断 | 直接读翻译器代码 |

## 与 RAG / Skills / claw-agent 的关系

- **RAG（code samples）**：仍然有用——给 LLM 兜底场景做 few-shot；翻译器场景不需要
- **Skills**：瘦身后仍在 system_prompt，但只服务于 LLM 兜底场景
- **claw-agent**：仍然存在，仅在翻译器降级时启动；负责沙箱报错的自修复闭环

## 不动的部分

- 沙箱（sandbox-service）—— 容器/FS/dev-server 全套保留
- 反向飞轮事件流（project_task_event）—— 翻译器走的事件 type 加几个新值（`translation_started` / `translation_succeeded` / `translation_unsupported`），其他不变
- 采纳沉淀（code_samples）—— 仍然走原流程
- 前端「执行详情」面板 —— 翻译器走的任务在 LLM 决策段显示「直接翻译，未调 LLM」
