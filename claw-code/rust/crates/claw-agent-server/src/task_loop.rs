use crate::api_bridge::ProviderRuntimeClient;
use crate::permission_prompter::{PermissionDecisionPayload, WebSocketPermissionPrompter};
use crate::sandbox_client::SandboxClient;
use crate::state::{SkillBucketInfoLite, TaskEvent, TaskStatus};
use crate::tool_executor::SandboxToolExecutor;
use api::ProviderClient;
use runtime::{ConversationRuntime, PermissionMode, PermissionPolicy, Session};
use std::path::PathBuf;
use std::sync::mpsc as std_mpsc;
use tokio::sync::{broadcast, mpsc};

pub struct LlmConfig {
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: String,
    /// 协议类型：openai（OpenAI Chat Completions 兼容）/ anthropic（Anthropic Messages API）。
    /// 由用户在供应商管理 UI 显式指定，不再靠模型名前缀猜测。
    pub protocol: String,
}

/// 任务级权限配置
pub struct PermissionConfig {
    pub mode: PermissionMode,
    /// 工具白名单；None = 全开
    pub allowed_tools: Option<Vec<String>>,
}

impl Default for PermissionConfig {
    fn default() -> Self {
        Self {
            mode: PermissionMode::DangerFullAccess,
            allowed_tools: None,
        }
    }
}

/// 解析字符串到 PermissionMode（前端传过来的）
pub fn parse_permission_mode(s: &str) -> Option<PermissionMode> {
    match s {
        "read_only" | "read-only" => Some(PermissionMode::ReadOnly),
        "workspace_write" | "workspace-write" => Some(PermissionMode::WorkspaceWrite),
        "danger_full_access" | "danger-full-access" => Some(PermissionMode::DangerFullAccess),
        "prompt" => Some(PermissionMode::Prompt),
        "allow" => Some(PermissionMode::Allow),
        _ => None,
    }
}

pub struct TaskLoopConfig {
    pub task_id: String,
    pub initial_message: String,
    pub workdir: String,
    pub sandbox_id: String,
    pub model: String,
    pub sandbox_url: String,
    /// 兼容期：老前端只传 `tech_stack: "uniapp-wot-h5"` 时走 legacy L1 精确匹配。
    pub tech_stack: String,
    /// 2026-04 多维选桶字段（为空时 fallback 到 tech_stack legacy 路径）
    pub platform: Option<String>,
    pub tech_stacks: Vec<String>,
    pub ui_libs: Vec<String>,
    pub template_name: Option<String>,
    pub explicit_buckets: Vec<String>,
    pub llm_config: Option<LlmConfig>,
    pub permission_config: PermissionConfig,
    pub decision_rx: std_mpsc::Receiver<PermissionDecisionPayload>,
    pub event_tx: broadcast::Sender<TaskEvent>,
    pub msg_rx: mpsc::Receiver<String>,
    /// B.5：额外注入到 system_prompt 的段（最常见用途：backend 拼好的 RAG Top-K 样例）。
    /// 这些段会在 Skills 索引之后追加。空 vec 表示不注入。
    pub extra_system_sections: Vec<String>,
    /// 启动期一次性事件缓存。skills_loaded / system_prompt_built 这种在 WS 订阅建立前就发出的事件，
    /// 直接 push 到这里避免被 broadcast 丢弃。WS handler 订阅时先 replay 这些。
    pub initial_events: std::sync::Arc<std::sync::Mutex<Vec<TaskEvent>>>,
}

/// 决定走哪条后端路径
pub enum BackendKind {
    /// Anthropic 协议，走 claw-code 的 api crate
    Anthropic,
    /// OpenAI 兼容协议（Ollama / DeepSeek / 通义千问 / DashScope / OpenAI），走我们自己的解析器
    OpenAiCompat {
        base_url: String,
        api_key: Option<String>,
        temperature: Option<f32>,
        max_tokens: Option<u32>,
    },
}

/// 根据 llm_config 的 protocol 字段决定走哪条后端路径。
/// 不再使用模型名前缀判断，协议完全由用户在供应商配置里显式指定。
/// 返回 (backend_kind, effective_model_name)。
fn decide_backend(default_model: &str, config: Option<&LlmConfig>) -> (BackendKind, String) {
    // 没有 llm_config → 走 Anthropic 默认路径（依赖 ANTHROPIC_API_KEY 环境变量）
    let Some(cfg) = config else {
        return (BackendKind::Anthropic, default_model.to_string());
    };

    match cfg.protocol.as_str() {
        "anthropic" => {
            if let Some(key) = &cfg.api_key {
                std::env::set_var("ANTHROPIC_API_KEY", key);
            }
            if let Some(url) = &cfg.base_url {
                // claw-code 的 AnthropicClient 会自己拼 `/v1/messages`，
                // 所以这里去掉用户可能误带的 `/v1` 后缀，避免出现 `/v1/v1/messages`
                let normalized = url.trim_end_matches('/').trim_end_matches("/v1");
                std::env::set_var("ANTHROPIC_BASE_URL", normalized);
                tracing::info!(
                    "Backend: Anthropic, model={}, base_url={} (normalized from {})",
                    cfg.model,
                    normalized,
                    url
                );
            } else {
                tracing::info!("Backend: Anthropic, model={} (no base_url override)", cfg.model);
            }
            (BackendKind::Anthropic, cfg.model.clone())
        }
        // 默认走 OpenAI 兼容路径（包括 openai、未知值、空值）
        _ => {
            let base_url = cfg
                .base_url
                .clone()
                .unwrap_or_else(|| "https://api.openai.com/v1".to_string());

            tracing::info!(
                "Backend: OpenAI-compat (protocol={}), model={}, base_url={}",
                cfg.protocol,
                cfg.model,
                base_url
            );

            (
                BackendKind::OpenAiCompat {
                    base_url,
                    api_key: cfg.api_key.clone(),
                    temperature: None, // 后续可从 cfg 传入
                    max_tokens: None,
                },
                cfg.model.clone(),
            )
        }
    }
}

pub fn spawn_task_loop(config: TaskLoopConfig) {
    tokio::spawn(async move {
        if let Err(e) = run_task_loop(config).await {
            tracing::error!("Task loop failed: {}", e);
        }
    });
}

async fn run_task_loop(config: TaskLoopConfig) -> anyhow::Result<()> {
    let TaskLoopConfig {
        task_id,
        initial_message,
        workdir,
        sandbox_id,
        model,
        sandbox_url,
        tech_stack,
        platform,
        tech_stacks,
        ui_libs,
        template_name,
        explicit_buckets,
        llm_config,
        permission_config,
        decision_rx,
        event_tx,
        msg_rx,
        extra_system_sections,
        initial_events,
    } = config;

    // 根据 llm_config 决定走哪条后端路径：
    // - 有 llm_config 且 model 不是 claude-* → OpenAI 兼容（我们自己的解析器，支持 reasoning）
    // - 其他 → Anthropic（claw-code api crate）
    let (backend_kind, effective_model) = decide_backend(&model, llm_config.as_ref());

    let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Running));

    // 把整个 ConversationRuntime 循环跑在一个 blocking thread 上
    // 用 msg_rx.blocking_recv() 同步接收追加消息
    let event_tx_outer = event_tx.clone();
    let handle = tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let workdir_path = PathBuf::from(&workdir);
        let sandbox = SandboxClient::new(sandbox_url);

        let session = Session::new().with_workspace_root(workdir_path.clone());

        let api_client = match backend_kind {
            BackendKind::OpenAiCompat {
                base_url,
                api_key,
                temperature,
                max_tokens,
            } => ProviderRuntimeClient::new_openai_compat(
                base_url,
                api_key,
                effective_model.clone(),
                temperature,
                max_tokens,
                event_tx.clone(),
            ),
            BackendKind::Anthropic => {
                let provider = ProviderClient::from_model(&effective_model)
                    .map_err(|e| anyhow::anyhow!("Failed to init provider: {}", e))?;
                ProviderRuntimeClient::new_anthropic(provider, effective_model.clone(), event_tx.clone())
            }
        };

        let tool_executor = SandboxToolExecutor::new(sandbox, sandbox_id, workdir_path, event_tx.clone());

        // 用前端传来的权限配置构造 PermissionPolicy
        // 如果指定了工具白名单，通过 with_tool_requirement 对每个工具设定最低权限要求
        let mut policy = PermissionPolicy::new(permission_config.mode);
        if let Some(allowed) = &permission_config.allowed_tools {
            // 工具 → 最低权限的内置映射（与 claw-code mvp_tool_specs 一致）
            let tool_reqs: &[(&str, PermissionMode)] = &[
                ("bash", PermissionMode::DangerFullAccess),
                ("read_file", PermissionMode::ReadOnly),
                ("write_file", PermissionMode::WorkspaceWrite),
                ("edit_file", PermissionMode::WorkspaceWrite),
                ("glob_search", PermissionMode::ReadOnly),
                ("grep_search", PermissionMode::ReadOnly),
            ];
            for (name, required) in tool_reqs {
                if allowed.iter().any(|t| t == name) {
                    policy = policy.with_tool_requirement(*name, *required);
                }
            }
        }

        // 根据模式决定是否创建 WebSocketPermissionPrompter
        // DangerFullAccess 和 Allow 模式下不会触发审批，不需要 prompter
        let mut prompter: Option<WebSocketPermissionPrompter> =
            if matches!(permission_config.mode, PermissionMode::DangerFullAccess | PermissionMode::Allow) {
                None
            } else {
                Some(WebSocketPermissionPrompter::new(event_tx.clone(), decision_rx))
            };

        // 组装"当前任务维度摘要"方便 Agent 参考（不覆盖 Skills 内容）
        let dims_line = {
            let mut parts = Vec::new();
            if let Some(p) = &platform {
                parts.push(format!("平台={}", p));
            }
            if !tech_stacks.is_empty() {
                parts.push(format!("技术栈={}", tech_stacks.join("/")));
            }
            if !ui_libs.is_empty() {
                parts.push(format!("UI 库={}", ui_libs.join("/")));
            }
            if let Some(t) = &template_name {
                parts.push(format!("模板={}", t));
            } else {
                parts.push("模板=(无，从零搭建)".to_string());
            }
            if parts.is_empty() {
                format!("技术栈: {}", tech_stack)
            } else {
                format!("技术栈: {} ({})", tech_stack, parts.join(", "))
            }
        };

        // 基础 prompt：身份、工作目录、工具使用原则（强调"只输出工具调用"的纪律）。
        // 注意：dev 命令与"是否改底座"等细节在 Skills 桶 SKILL.md 里描述，这里只说工具纪律。
        let mut system_prompt = vec![format!(
            "你是 amis-ai 的反向代码生成智能体。工作目录: {}\n\
             {}\n\n\
             ## 🔥 最重要：你必须通过工具调用完成任务，禁止只输出计划文字\n\n\
             你**必须**使用以下工具来完成每一步工作：\n\
             - `bash` 执行 shell 命令（如 `ls -la`、`pnpm install`、`pnpm add xxx`、`pnpm run dev` 等）\n\
             - `read_file` 读取文件内容\n\
             - `write_file` 写入完整文件\n\
             - `edit_file` 按字符串替换修改文件\n\
             - `glob_search` 按通配符查找文件\n\
             - `grep_search` 按正则搜索内容\n\
             - `dev_start` 启动 dev server（命令从任务或 package.json scripts 推断）\n\n\
             ❌ 禁止：只回复 \"我计划这样做...\" 却不调用任何工具\n\
             ❌ 禁止：编造文件内容，不通过 read_file 确认就开始修改\n\
             ✅ 要求：**每条响应至少包含一个工具调用**，除非任务已完整交付\n\n\
             ## 工作流程（严格顺序）\n\
             1. **第一步必须**调 `bash: ls -la` 看工作目录（是否已有底座模板）\n\
             2. 如已有模板：调 `read_file` 读 package.json / 构建配置 / 入口文件理解结构\n\
             3. 如为空目录（从零搭建）：按 Skills 指引先创建 package.json + 构建配置 + 入口\n\
             4. 根据下方 Skills 文档里的规则，用 write_file / edit_file 创建业务代码\n\
             5. 需要新依赖时调 `bash: pnpm add xxx`（或 pnpm remove），而不是直接改 package.json\n\
             6. 调 `bash: pnpm install`（首次或依赖锁变更后）\n\
             7. 调 `dev_start` 启动 dev server 验证\n\
             8. 启动失败时读日志 → 定位 → 修复 → 重启（最多 5 次自修复）\n\n\
             ## 失败策略\n\
             - 工具报错时，直接看 error 字段然后调整参数重试，不要光说\"我再试试\"\n\
             - 文件找不到时先用 `glob_search` 定位，不要假设路径",
            workdir, dims_line
        )];

        // 2026-04：按维度选桶构建 Skills 段（progressive disclosure + 维度叠加）。
        let skills_root = crate::skills::default_skills_root();
        let plugin_roots = crate::skills::default_plugin_roots();
        let ctx = crate::skills::TaskSkillContext {
            platform: platform.as_deref(),
            tech_stacks: &tech_stacks,
            ui_libs: &ui_libs,
            template_name: template_name.as_deref(),
            explicit_buckets: &explicit_buckets,
            legacy_stack: if platform.is_none()
                && tech_stacks.is_empty()
                && ui_libs.is_empty()
                && explicit_buckets.is_empty()
            {
                // 纯老客户端只传 tech_stack：走 legacy 精确匹配
                Some(tech_stack.as_str())
            } else {
                // 新客户端已传多维字段：legacy 字段仅作目录名的次要候选
                Some(tech_stack.as_str())
            },
        };
        let (skill_sections, selected_skill_meta) =
            crate::skills::build_skills_system_prompt_v2_with_meta(
                &skills_root,
                &plugin_roots,
                &ctx,
            );
        let skill_count = skill_sections.len();
        system_prompt.extend(skill_sections);

        // 2026-04-25：移动端 + Wot UI 任务的「页面骨架契约」。
        // P3 修复——qwen3-coder-30b 这类本地模型不会主动读 references，
        // 直接在 system_prompt 末尾追加一段强契约，把 ui-wot/SKILL.md 的骨架要点再 hammer 一次。
        // 仅当 platform=mobile && ui_libs 含 "wot" 时启用。
        let is_mobile_wot = platform.as_deref() == Some("mobile")
            && ui_libs.iter().any(|s| s.eq_ignore_ascii_case("wot"));
        if is_mobile_wot {
            system_prompt.push(
                "## ⚠️ 翻译器宪法 + 移动端页面骨架契约（违反即被分析器判负，必须照做）\n\n\
                 ### 🔥 你的身份：翻译器，不是设计师\n\n\
                 **amis-ai 反向飞轮的本质是「Amis JSON → 可执行前端代码」的纯翻译**。你拿到的 Amis JSON 是声明式 UI 配置，里面写了什么字段、什么 type、什么 api、什么 validations，你就**逐字段忠实地翻译**到 Vue 代码——**不要凭空发挥**。\n\n\
                 - ❌ Amis schema 里没声明的字段/功能/UI 元素，**绝对不要凭空加**（包括但不限于：品牌 logo、欢迎标题、副标题、记住我、忘记密码、立即注册、第三方登录、装饰图标、渐变背景、动画过渡）\n\
                 - ❌ 不要「优化」页面流程（schema 写一步登录就一步登录，不要擅自加二次确认 / 短信验证）\n\
                 - ❌ 不要换 UI 组件（schema 写 input-text 就用 `<wd-input>`，不要因为「觉得别的更好」就换 `<wd-picker>`）\n\
                 - ✅ Amis schema 里**有的**字段必须翻译：`name` → reactive 字段名（一字不改）、`label` → 「标签在上」的 `<text class=\"form-label\">`、`required:true` → rules 校验、`api` → 对应 fetch 调用、`redirectOn` → 跳转\n\n\
                 ### 📋 Amis → Wot 字段映射快查（form 类型）\n\n\
                 | Amis schema 字段 | 必须翻译到代码 |\n\
                 |---|---|\n\
                 | `fields[i].type:\"input-text\"` | `<wd-input>` |\n\
                 | `fields[i].type:\"input-password\"` | `<wd-input type=\"password\" show-password>` |\n\
                 | `fields[i].name` | `form` reactive 的 key（**严格一致**） |\n\
                 | `fields[i].label` | `<text class=\"form-label\">{label}</text>` 在 input 上方 |\n\
                 | `fields[i].placeholder` | `<wd-input placeholder>` |\n\
                 | `fields[i].required` / `validations` | `rules` 对应规则 |\n\
                 | `api` / `submitApi` | submit 函数的 fetch URL/method（**严格一致**） |\n\n\
                 ### 🔥 表单排版铁律：标签在上、输入在下、单列堆叠\n\n\
                 **绝对禁止**用 `<wd-cell title=\"X\"><wd-input/></wd-cell>` 做表单字段——wd-cell 是**列表行**组件（左 title 右 slot 是 iOS 系统设置那种范式），**不是现代移动端表单的范式**。\n\n\
                 **正确写法**（每个 Amis 字段都套这个 form-field）：\n\n\
                 ```vue\n\
                 <view class=\"form-field\">\n\
                   <text class=\"form-label\">{{ field.label }}</text>\n\
                   <wd-input v-model=\"form[field.name]\" :placeholder=\"field.placeholder\" />\n\
                 </view>\n\
                 ```\n\n\
                 ```scss\n\
                 .form-field { margin-bottom: 32rpx; display: flex; flex-direction: column; }\n\
                 .form-label { font-size: 28rpx; color: #333; margin-bottom: 16rpx; padding: 0 4rpx; }\n\
                 ```\n\n\
                 ### 📐 通用骨架自检表\n\n\
                 - [ ] 表单字段用 `<view class=\"form-field\">` 包装（标签在上、输入在下），**禁止** `<wd-cell>`\n\
                 - [ ] 主操作按钮 `<wd-button type=\"primary\" size=\"large\" block>`，**禁止** inline `style=\"width:100%\"`\n\
                 - [ ] 含输入字段必须包 `<wd-form ref=\"formRef\" :model=\"form\" :rules=\"rules\">`\n\
                 - [ ] 登录/首页**禁止** `wd-navbar` 返回箭头\n\
                 - [ ] 单位一律 `rpx`（750 等分），禁止硬编码 `px`\n\
                 - [ ] **Amis schema 里没声明的字段/功能一律不生成**（这是第 0 条铁律）\n\n\
                 ### 类型识别提示\n\n\
                 - 含 `type:\"form\"` + fields[] → 表单页（登录/注册/编辑等）。**严格按上面的 form-field 模板**翻译每个 field\n\
                 - 含 `type:\"crud\"` 或 `type:\"page\"` + 列表数据源 → 列表页。骨架带 `onPullDownRefresh` + `onReachBottom` + `wd-status-tip`\n\
                 - 含 `type:\"page\"` + 多个只读字段分组 → 详情页。**这种场景才适合用 `wd-cell-group title border` + `wd-cell title value`**（数据展示，不是输入）\n"
                    .to_string(),
            );
        }

        // B.5：追加 backend 在任务创建时拼好的额外段（典型来源：RAG Top-K 样例）。
        let extra_count = extra_system_sections.len();
        system_prompt.extend(extra_system_sections);

        tracing::info!(
            "Task {} loaded {} skill sections + {} extra sections for tech_stack={} (skills_root={}, plugins={})",
            task_id,
            skill_count,
            extra_count,
            tech_stack,
            skills_root.display(),
            plugin_roots.len()
        );

        // 事件：Skills 加载完成（一次性，供"执行详情"面板审计）
        // 由于 WS 订阅可能尚未建立（race condition），tokio::broadcast 会丢消息。
        // 这里写入 initial_events 缓存 —— WS handler 订阅时会先 replay 缓存里的事件，
        // 再 send 一次 broadcast（两者互不冲突：WS replay 时会跳过已订阅后的 broadcast，
        // broadcast 也只对当前订阅者生效；首次订阅者通过 cache 拿到，二次订阅者通过 cache 拿到——不重不漏）。
        {
            let selected_buckets: Vec<SkillBucketInfoLite> = selected_skill_meta
                .iter()
                .map(|m| SkillBucketInfoLite {
                    name: m.display_name.clone(),
                    dir_name: m.dir_name.clone(),
                    priority: m.priority,
                    kind: m.kind.clone(),
                    description: m.description.clone(),
                })
                .collect();
            let ev = TaskEvent::SkillsLoaded {
                selected_buckets,
                skills_root: skills_root.display().to_string(),
                extra_sections_count: extra_count,
                total_sections: skill_count,
            };
            if let Ok(mut cache) = initial_events.lock() {
                cache.push(ev.clone());
            }
            let _ = event_tx.send(ev);

            // 2026-04-25 tracelog：紧跟 SkillsLoaded 一并发出每个桶的 SKILL.md + references/*.md 全文快照
            // 仅在 backend tracelog 启用时落盘到 task-{id}/skills_snapshot/，前端可忽略此事件。
            // 不在 progressive disclosure 后续 Skill 工具按需加载里收 —— 那些走 tool_use/tool_result 已自然落 events.jsonl。
            {
                use crate::state::{SkillBucketContent, SkillFileContent};
                const MAX_SNAPSHOT_FILE_BYTES: u64 = 256 * 1024; // 单文件 256KB 上限
                const MAX_SNAPSHOT_FILES_PER_BUCKET: usize = 20;
                let mut contents = Vec::new();
                for meta in &selected_skill_meta {
                    let bucket_dir = skills_root.join(&meta.dir_name);
                    if !bucket_dir.exists() {
                        continue;
                    }
                    let mut files = Vec::new();
                    // SKILL.md（总是收）
                    let skill_md = bucket_dir.join("SKILL.md");
                    if let Ok(content) = std::fs::read_to_string(&skill_md) {
                        files.push(SkillFileContent {
                            path: "SKILL.md".to_string(),
                            content,
                        });
                    }
                    // references/*.md（一级，跳过子目录；超 256KB 的文件标占位防爆）
                    let refs_dir = bucket_dir.join("references");
                    if refs_dir.is_dir() {
                        if let Ok(rd) = std::fs::read_dir(&refs_dir) {
                            for entry in rd.flatten() {
                                if files.len() >= MAX_SNAPSHOT_FILES_PER_BUCKET {
                                    break;
                                }
                                let name = match entry.file_name().into_string() {
                                    Ok(n) => n,
                                    Err(_) => continue,
                                };
                                if !name.ends_with(".md") {
                                    continue;
                                }
                                let entry_path = entry.path();
                                let size = entry
                                    .metadata()
                                    .map(|m| m.len())
                                    .unwrap_or(0);
                                let content = if size > MAX_SNAPSHOT_FILE_BYTES {
                                    format!(
                                        "[tracelog: 文件 {} 超过 256KB（{}），未落档；事后可去 skills/{}/references/{} 手动看]",
                                        name, size, meta.dir_name, name
                                    )
                                } else {
                                    std::fs::read_to_string(&entry_path).unwrap_or_default()
                                };
                                files.push(SkillFileContent {
                                    path: format!("references/{}", name),
                                    content,
                                });
                            }
                        }
                    }
                    contents.push(SkillBucketContent {
                        bucket: meta.dir_name.clone(),
                        files,
                    });
                }
                let ev = TaskEvent::SkillsContentSnapshot { contents };
                if let Ok(mut cache) = initial_events.lock() {
                    cache.push(ev.clone());
                }
                let _ = event_tx.send(ev);
            }
        }

        // 事件：完整 system_prompt 构建完成（一次性，含 full 文本供 admin 审计）。
        // 预览取前 500 字符，SHA256 便于前端比对版本。
        let prompt_full = system_prompt.join("\n\n");
        {
            use sha2::{Digest, Sha256};
            let mut hasher = Sha256::new();
            hasher.update(prompt_full.as_bytes());
            let prompt_sha256 = format!("{:x}", hasher.finalize());
            let prompt_preview: String = prompt_full.chars().take(500).collect();
            let ev = TaskEvent::SystemPromptBuilt {
                prompt_length: prompt_full.chars().count(),
                prompt_sha256,
                prompt_preview,
                prompt_full: prompt_full.clone(),
            };
            if let Ok(mut cache) = initial_events.lock() {
                cache.push(ev.clone());
            }
            let _ = event_tx.send(ev);
        }

        let mut runtime = ConversationRuntime::new(
            session,
            api_client,
            tool_executor,
            policy,
            system_prompt,
        );

        // 第一轮：初始消息
        // 先 broadcast 一条 user_message，让前端 WS 流 + events 历史表都能看到首条用户输入
        let _ = event_tx.send(TaskEvent::UserMessage(initial_message.clone()));
        tracing::info!("Task {} starting initial turn", task_id);
        let summary = runtime
            .run_turn(
                initial_message,
                prompter
                    .as_mut()
                    .map(|p| p as &mut dyn runtime::PermissionPrompter),
            )
            .map_err(|e| {
                let _ = event_tx.send(TaskEvent::ErrorMessage(format!(
                    "❌ 初始对话失败: {}",
                    e
                )));
                anyhow::anyhow!("initial run_turn failed: {}", e)
            })?;
        tracing::info!(
            "Task {} initial turn done: {} iterations",
            task_id,
            summary.iterations
        );
        let _ = event_tx.send(TaskEvent::TurnComplete);

        // 后续轮：阻塞接收追加消息，直到 channel 关闭
        let mut msg_rx = msg_rx;
        while let Some(msg) = msg_rx.blocking_recv() {
            tracing::info!("Task {} received follow-up message", task_id);
            match runtime.run_turn(
                msg,
                prompter
                    .as_mut()
                    .map(|p| p as &mut dyn runtime::PermissionPrompter),
            ) {
                Ok(summary) => {
                    tracing::info!(
                        "Task {} follow-up turn done: {} iterations",
                        task_id,
                        summary.iterations
                    );
                    let _ = event_tx.send(TaskEvent::TurnComplete);
                }
                Err(e) => {
                    tracing::error!("Task {} follow-up turn failed: {}", task_id, e);
                    let _ = event_tx.send(TaskEvent::ErrorMessage(format!(
                        "❌ 追加对话失败: {}",
                        e
                    )));
                    let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Failed));
                    return Err(anyhow::anyhow!("follow-up turn failed: {}", e));
                }
            }
        }

        Ok(())
    });

    match handle.await {
        Ok(Ok(())) => {
            let _ = event_tx_outer.send(TaskEvent::StatusChange(TaskStatus::Succeeded));
            Ok(())
        }
        Ok(Err(e)) => {
            tracing::error!("Task execution error: {}", e);
            let _ = event_tx_outer.send(TaskEvent::StatusChange(TaskStatus::Failed));
            Err(e)
        }
        Err(e) => {
            tracing::error!("Task spawn join error: {}", e);
            let _ = event_tx_outer.send(TaskEvent::StatusChange(TaskStatus::Failed));
            Err(anyhow::anyhow!("spawn_blocking join error: {}", e))
        }
    }
}
