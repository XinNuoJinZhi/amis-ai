use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::entity::{
    code_sample, project_generation_task, project_task_event, project_task_message, user,
};
use crate::services::{
    claw_agent_client::ClawAgentClient,
    llm_selector::{self, LlmDecision},
    sandbox_client::SandboxClient,
};
use crate::utils::jwt;
use crate::AppState;

/// 1.2.0 多页：单页输入（amis JSON + 可选路由路径）
#[derive(Deserialize, Debug)]
pub struct PageInput {
    pub amis_json: String,
    pub route_path: Option<String>,
}

fn default_execution_strategy() -> String {
    "unified".to_string()
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskPayload {
    pub amis_json: String,
    /// **DEPRECATED（2026-04 Phase 4.4）**：旧单值技术栈字符串。
    /// 新客户端请发 `tech_stacks: [...]` 数组字段；本字段留作**外部无前端调用方**的兼容入口。
    /// 当新字段存在时，本字段被 backend 忽略；两字段都缺则保留"uniapp-wot-h5"默认兜底。
    /// DB 旧单值列 `project_generation_task.tech_stack` 仍然写入（Phase 4 观察期 ≥20 天后才真正 DROP）。
    pub tech_stack: Option<String>,
    /// **DEPRECATED（2026-04 Phase 4.4）**：旧单值 UI 库字符串。见 `tech_stack` 同段说明。
    pub ui_library: Option<String>,
    pub extra_prompt: Option<String>,
    pub source_history_id: Option<i32>,
    pub permission_config: Option<serde_json::Value>,
    /// "manual" | "auto" | "default"；缺省为 default（读旧 model_configs）
    pub llm_mode: Option<String>,
    /// manual 模式下必填
    pub llm_provider_id: Option<i32>,
    /// manual 模式下必填
    pub llm_model_name: Option<String>,
    // ── 2026-04 多维字段（可选，缺省走 legacy 单字符串路径）
    /// 目标平台：web / mobile / 自定义
    #[serde(default)]
    pub platform: Option<String>,
    /// 技术栈标签数组（多选）
    #[serde(default)]
    pub tech_stacks: Option<Vec<String>>,
    /// UI 组件库标签数组（多选）
    #[serde(default)]
    pub ui_libs: Option<Vec<String>>,
    /// 选中的底座模板名（registry.yaml 里的 name 字段）；None 或 "__blank__" = 从零搭建
    #[serde(default)]
    pub template_name: Option<String>,
    /// 用户在 UI 上显式勾选要激活的 skill 桶（留空则按维度推导）
    #[serde(default)]
    pub explicit_buckets: Option<Vec<String>>,
    /// 2026-04-25 是否启用确定性翻译器（实验功能）。
    /// - None / false：默认走原 LLM 路径（生产稳定路径）
    /// - true：先试翻译器，fully_supported 就跳过 LLM；降级则回退 LLM
    #[serde(default)]
    pub enable_translator: Option<bool>,
    // ── 1.2.0 多页字段 ──────────────────────────────────────────────────────
    /// N 段 amis JSON。None 走旧的单页路径（兼容旧调用方）
    #[serde(default)]
    pub pages: Option<Vec<PageInput>>,
    /// 执行策略：unified / isolated；缺省 unified
    #[serde(default = "default_execution_strategy")]
    pub execution_strategy: String,
    /// 复用策略（仅 isolated 时有意义）
    #[serde(default)]
    pub reuse_strategy: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LlmPreviewPayload {
    pub amis_json: String,
}

#[derive(Debug, Serialize)]
pub struct TaskBrief {
    pub id: i32,
    pub status: String,
    pub tech_stack: String,
    pub ui_library: String,
    pub preview_port: Option<i32>,
    pub sandbox_id: Option<String>,
    pub workdir_path: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

async fn resolve_user(
    state: &AppState,
    auth_user: &jwt::AuthUser,
) -> Result<user::Model, (StatusCode, Json<serde_json::Value>)> {
    user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {}", e)})),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "用户不存在"})),
            )
        })
}

pub async fn create_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Json(payload): Json<CreateTaskPayload>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    // 2026-04 多维字段规范化（新旧字段双向兜底）
    //   - 新客户端传 tech_stacks/ui_libs/platform/template_name
    //   - 旧客户端只传 tech_stack/ui_library
    // 最终 DB 双写：新数组列 + 旧单值列并存，Phase 4 才弃用旧列
    let tech_stacks_arr: Vec<String> = payload
        .tech_stacks
        .clone()
        .unwrap_or_else(|| {
            payload
                .tech_stack
                .clone()
                .map(|s| vec![s])
                .unwrap_or_else(|| vec!["uniapp-wot-h5".to_string()])
        });
    let ui_libs_arr: Vec<String> = payload
        .ui_libs
        .clone()
        .unwrap_or_else(|| {
            payload
                .ui_library
                .clone()
                .map(|s| vec![s])
                .unwrap_or_else(|| vec!["wot-ui".to_string()])
        });
    let tech_stack = payload
        .tech_stack
        .clone()
        .unwrap_or_else(|| tech_stacks_arr.first().cloned().unwrap_or_else(|| "uniapp-wot-h5".to_string()));
    let ui_library = payload
        .ui_library
        .clone()
        .unwrap_or_else(|| ui_libs_arr.first().cloned().unwrap_or_else(|| "wot-ui".to_string()));
    let platform_str = payload
        .platform
        .clone()
        .unwrap_or_else(|| {
            // 旧客户端兜底：按 tech_stack 前缀猜
            if tech_stack.starts_with("uniapp") || tech_stack.starts_with("rn-") {
                "mobile".to_string()
            } else {
                "web".to_string()
            }
        });
    // template_name 解析规则：
    //   - 显式传 "__blank__" 或 null → 从零搭建
    //   - 传具体 name → 从 registry 查；查不到退回 {tech_stack}-template legacy 路径
    //   - 未传 → 走 {tech_stack}-template legacy 路径（保持老行为）
    let template_name: Option<String> = match payload.template_name.clone() {
        Some(n) if n == "__blank__" => Some("__blank__".to_string()),
        Some(n) => Some(n),
        None => Some(format!("{}-template", tech_stack)),
    };
    // explicit_buckets：用户显式指定优先；否则用 template.default_skill_buckets 兜底
    // （1.3 引入：让 platform-zc-web / zc-amis-schema 这类 knowledge 桶能被 ZC 模板自动激活，
    //   维度 selector 命不中 kind=knowledge 的桶，必须靠 template default 注入）
    let explicit_buckets_arr: Vec<String> = {
        let user_specified = payload.explicit_buckets.clone().unwrap_or_default();
        if !user_specified.is_empty() {
            user_specified
        } else {
            template_name
                .as_deref()
                .and_then(|n| state.template_registry.get(n))
                .map(|t| t.default_skill_buckets.clone())
                .unwrap_or_default()
        }
    };

    // -0.75. 1.4 W4 修：多页任务 runner 传 amis_json="{}"，真实结构在 pages[].amis_json。
    //   合并所有 page 的 amis_json 成 {"type":"page","body":[...page1,page2...]} 供:
    //     - 分类器（A.1 category）
    //     - 复杂度评分（A.2 score → tier）
    //     - 成本预估（A.3 estimate）
    //   单页 / 无 pages：直接用 payload.amis_json
    let amis_for_analysis: String = match payload.pages.as_ref() {
        Some(pages) if !pages.is_empty() => {
            let body: Vec<serde_json::Value> = pages
                .iter()
                .map(|p| {
                    serde_json::from_str::<serde_json::Value>(&p.amis_json)
                        .unwrap_or_else(|_| serde_json::json!({}))
                })
                .collect();
            serde_json::json!({"type": "page", "body": body}).to_string()
        }
        _ => payload.amis_json.clone(),
    };

    // -0.5. 1.4 A.1 / 1.5 W1.1：调 Python 分类器拿 category + confidence（fire-and-wait，但调 chat 快）
    //   失败/超时不阻断 → 走 None，select_for_task 退化为纯 score 决策
    //   1.5 W1.1：3s → 5s timeout，避免偶发慢 LLM 让 task 258/259/238 退化为空 category
    //   （agent 端 classify_task_category_endpoint 内部已加 1 次重试，双保险）
    let (task_category, task_category_confidence): (Option<String>, Option<f32>) = {
        let agent_url =
            std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
        let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
        let resp = state
            .http_client
            .post(format!("{}/internal/classify-task-category", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "amis_json": amis_for_analysis,
                "extra_prompt": payload.extra_prompt,
            }))
            .timeout(std::time::Duration::from_secs(5))
            .send()
            .await;
        match resp {
            Ok(r) if r.status().is_success() => {
                match r.json::<serde_json::Value>().await {
                    Ok(v) if v.get("ok").and_then(|x| x.as_bool()) == Some(true) => {
                        let cat = v.get("category").and_then(|x| x.as_str()).map(String::from);
                        let conf = v.get("confidence").and_then(|x| x.as_f64()).map(|f| f as f32);
                        (cat, conf)
                    }
                    _ => (None, None),
                }
            }
            _ => (None, None),
        }
    };

    // -0.25. 1.4 A.3 / 1.5 W2：成本预算检查
    //   - 1.5 W2 estimate 校准：优先用 category 历史中位数（≥10 样本），fallback 粗估 × 校准系数 200
    //   - 调 check_and_consume_quota 预扣
    //   - reject 模式超额 → 直接返回 429
    //   - downgrade 模式超额 → 设 force_tier="fast"，select_for_task 强制锁档
    let estimated_cost = crate::services::quota::estimate_task_cost_calibrated(
        &state,
        &amis_for_analysis,
        payload.extra_prompt.as_deref(),
        None, // complexity_score 由 LLM 决策时算，这里 None 让函数取均值 20
        task_category.as_deref(),
    )
    .await;
    let quota_decision = match crate::services::quota::check_and_consume_quota(
        &state,
        user.id,
        estimated_cost,
    )
    .await
    {
        Ok(d) => d,
        Err(e) => {
            tracing::warn!("quota check 失败（放行）: {}", e);
            // 配额服务异常时不阻断主流程（fail-open，避免误伤）
            crate::services::quota::QuotaDecision {
                over_budget: false,
                reject: false,
                used_today: 0,
                daily_budget: 0,
                reason: format!("quota service error (fail-open): {}", e),
            }
        }
    };
    if quota_decision.reject {
        return (
            StatusCode::from_u16(429).unwrap_or(StatusCode::TOO_MANY_REQUESTS),
            Json(json!({
                "error": "今日 token 预算已用完",
                "used_today": quota_decision.used_today,
                "daily_budget": quota_decision.daily_budget,
                "reason": quota_decision.reason,
            })),
        )
            .into_response();
    }
    let force_tier: Option<&str> = if quota_decision.over_budget {
        Some("fast") // downgrade：强制 fast 档
    } else {
        None
    };

    // 0. 先决策本次任务用哪个 LLM（manual / auto / default）
    //    1.4 A.2：把 category + confidence 传入，auto 模式按 category 偏置覆盖 tier 决策
    //    1.4 A.3：传 force_tier，over_budget 时强制 fast 降级
    //    1.5 W3：A/B 分桶决策（feature flag 关时统一 None）
    let ab_variant = compute_ab_variant(&state, user.id).await;
    let decision = match llm_selector::select_for_task(
        &state,
        user.id,
        &amis_for_analysis,
        payload.llm_mode.as_deref(),
        payload.llm_provider_id,
        payload.llm_model_name.as_deref(),
        task_category.as_deref(),
        task_category_confidence,
        force_tier,
        ab_variant.as_deref(),
    )
    .await
    {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("LLM 选择失败: {}", e)})),
            )
                .into_response();
        }
    };

    // 1. 在 DB 创建任务记录（pending）
    //    2026-04 性能优化：多维字段（platform / template_name / platforms / tech_stacks / ui_libs /
    //    selected_skill_buckets）原本因 entity 缺失要走 INSERT + 原生 SQL UPDATE 二次写，现在 entity 补全，
    //    一次 ActiveModel Insert 搞定，少一次 DB round-trip。
    let now = chrono::Utc::now().naive_utc();
    let template_name_for_db: Option<String> = match template_name.as_deref() {
        Some("__blank__") => None,
        other => other.map(|s| s.to_string()),
    };
    let task_record = project_generation_task::ActiveModel {
        user_id: Set(user.id),
        source_history_id: Set(payload.source_history_id),
        amis_json: Set(payload.amis_json.clone()),
        tech_stack: Set(tech_stack.clone()),
        ui_library: Set(ui_library.clone()),
        extra_prompt: Set(payload.extra_prompt.clone()),
        status: Set("pending".to_owned()),
        fix_attempts: Set(0),
        created_at: Set(now),
        updated_at: Set(now),
        llm_mode: Set(decision.mode.clone()),
        llm_provider_id: Set(Some(decision.provider_id)),
        llm_model_name: Set(Some(decision.config.model.clone())),
        // 多维字段一次写
        platform: Set(platform_str.clone()),
        template_name: Set(template_name_for_db),
        platforms: Set(vec![platform_str.clone()]),
        tech_stacks: Set(tech_stacks_arr.clone()),
        ui_libs: Set(ui_libs_arr.clone()),
        selected_skill_buckets: Set(explicit_buckets_arr.clone()),
        // 1.2.0 多页字段
        execution_strategy: Set(payload.execution_strategy.clone()),
        reuse_strategy: Set(payload.reuse_strategy.clone()),
        page_count: Set(payload.pages.as_ref().map(|p| p.len() as i32).unwrap_or(1)),
        // 1.4 A.1：分类器结果 + complexity_score 持久化（便于路由分析 / B.4 评测分桶）
        complexity_score: Set(decision.complexity_score),
        category: Set(task_category.clone()),
        category_confidence: Set(task_category_confidence),
        // 1.4 A.3 / 1.5 W1.2：成本预算字段
        estimated_cost_tokens: Set(Some(estimated_cost)),
        actual_cost_tokens: Set(None),      // 1.5 W1.2 语义改：当前 attempt 成本
        accumulated_cost_tokens: Set(None), // 1.5 W1.2 新：全部 attempt 累计
        // 1.5 W3 B：A/B 分桶（feature flag 关时 None；开启时按 user_id 稳定分桶）
        ab_variant: Set(ab_variant.clone()),
        ..Default::default()
    };

    let saved = match task_record.insert(&state.db).await {
        Ok(t) => t,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("创建任务失败: {}", e)})),
            )
                .into_response()
        }
    };

    let task_id = saved.id;
    let task_id_str = format!("task-{}", task_id);

    // 1.2.0：如果传了 pages，写入 project_task_page 子表
    if let Some(pages_input) = &payload.pages {
        use crate::entity::project_task_page;
        let now_pages = chrono::Utc::now().naive_utc();
        for (idx, p) in pages_input.iter().enumerate() {
            let route = match &p.route_path {
                Some(r) if !r.trim().is_empty() => r.trim().to_string(),
                _ => crate::services::route_inferer_client::infer_route_path(
                    &p.amis_json,
                    idx as i32,
                )
                .await,
            };
            let page_active = project_task_page::ActiveModel {
                task_id: Set(task_id),
                page_idx: Set(idx as i32),
                route_path: Set(route),
                amis_json: Set(p.amis_json.clone()),
                status: Set("pending".to_string()),
                created_at: Set(now_pages),
                updated_at: Set(now_pages),
                ..Default::default()
            };
            let _ = page_active.insert(&state.db).await;
        }
    }

    // 2026-04-25 任务追踪日志：初始化归档目录（mode=disabled 时是 no-op）
    let _ = crate::services::tracelog::init_task_tracelog(&state, task_id).await;

    // 2026-04 性能优化：sandbox 创建 与 RAG 检索并发跑（两者互不依赖）。
    //   - RAG 在这里 spawn 后立刻开始做空库检查/embedding 调用
    //   - 本线程接着 await sandbox 创建；sandbox 返回 workdir 后再做 scaffold 复制
    //   - 最终在拼 claw_req 前 `rag_fut.await` 收结果
    //   典型收益：sandbox 1–5s 与 RAG 0.5–3s 重叠，尾延迟压缩 0.5–3s。
    // 1.5 W4 fix：多页任务 payload.amis_json 是空 `{}`，真 amis 在 payload.pages[]；
    //   改用 amis_for_analysis（多页合并后的整体 JSON），让 B.1 keyword 提取在多页路径下也能工作
    let rag_fut = tokio::spawn(fetch_rag_extra_sections(
        state.clone(),
        task_id,
        platform_str.clone(),
        tech_stacks_arr.clone(),
        ui_libs_arr.clone(),
        tech_stack.clone(),
        amis_for_analysis.clone(),
    ));

    // 2. 拉起 sandbox（2026-04：dev_command；1.3：+ image，按模板路由 ZC Web 等专属镜像）
    let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
    let tpl_for_sandbox = template_name
        .as_deref()
        .and_then(|n| state.template_registry.get(n));
    let dev_command_for_sandbox: Option<String> =
        tpl_for_sandbox.and_then(|t| t.dev_command.clone());
    let image_for_sandbox: Option<String> = tpl_for_sandbox.and_then(|t| t.image.clone());
    let sandbox_info = match sandbox
        .create_with(&task_id_str, dev_command_for_sandbox, image_for_sandbox)
        .await
    {
        Ok(s) => s,
        Err(e) => {
            rag_fut.abort(); // sandbox 失败，RAG 没人用，避免孤儿 embedding 调用
            mark_task_failed(&state, task_id, &format!("sandbox 创建失败: {}", e)).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("sandbox 创建失败: {}", e)})),
            )
                .into_response();
        }
    };

    // 2.5 按 template_name 处理底座复制：
    //     - __blank__ / None → 跳过，让 Agent 从零搭建（触发 scaffold_skipped_blank 事件）
    //     - 其他 → 从 registry 查 dir，找不到 dir 时退回 {tech_stack}-template 兼容路径
    let tpl_spec = template_name
        .as_deref()
        .and_then(|n| state.template_registry.get(n));
    let should_copy = !matches!(template_name.as_deref(), Some("__blank__") | None);
    let scaffold_dir_name: Option<String> = if should_copy {
        tpl_spec
            .and_then(|t| t.dir.clone())
            .or_else(|| template_name.clone()) // fallback：把 template_name 当目录名用
    } else {
        None
    };

    // 2026-04 性能优化：scaffold 事件 INSERT 后台化（纯审计，前端轮询/SSE 能容忍 100ms 延后）
    if let Some(dir_name) = scaffold_dir_name.as_deref() {
        let copy_result = copy_scaffold_to_workdir(dir_name, &sandbox_info.workdir).await;
        let db_bg = state.db.clone();
        let tech_stack_bg = tech_stack.clone();
        let template_name_bg = template_name.clone();
        let dir_name_bg = dir_name.to_string();
        match copy_result {
            Ok(_) => {
                tokio::spawn(async move {
                    let _ = project_task_event::ActiveModel {
                        task_id: Set(task_id),
                        event_type: Set("scaffold_copied".to_owned()),
                        payload: Set(
                            json!({
                                "type": "scaffold_copied",
                                "data": {
                                    "tech_stack": tech_stack_bg,
                                    "template_name": template_name_bg,
                                    "scaffold_dir": dir_name_bg
                                }
                            })
                            .to_string(),
                        ),
                        created_at: Set(chrono::Utc::now().naive_utc()),
                        ..Default::default()
                    }
                    .insert(&db_bg)
                    .await;
                });
            }
            Err(e) => {
                tracing::warn!("copy 种子项目失败（Agent 将从空目录开始）: {}", e);
                let err_text = format!("{}", e);
                tokio::spawn(async move {
                    let _ = project_task_event::ActiveModel {
                        task_id: Set(task_id),
                        event_type: Set("scaffold_copy_failed".to_owned()),
                        payload: Set(
                            json!({
                                "type": "scaffold_copy_failed",
                                "data": {
                                    "tech_stack": tech_stack_bg,
                                    "template_name": template_name_bg,
                                    "error": err_text
                                }
                            })
                            .to_string(),
                        ),
                        created_at: Set(chrono::Utc::now().naive_utc()),
                        ..Default::default()
                    }
                    .insert(&db_bg)
                    .await;
                });
            }
        }
    } else {
        // 从零搭建：工作目录保持空，只记事件
        let db_bg = state.db.clone();
        let tech_stack_bg = tech_stack.clone();
        tokio::spawn(async move {
            let _ = project_task_event::ActiveModel {
                task_id: Set(task_id),
                event_type: Set("scaffold_skipped_blank".to_owned()),
                payload: Set(
                    json!({
                        "type": "scaffold_skipped_blank",
                        "data": {
                            "tech_stack": tech_stack_bg,
                            "reason": "template_name == __blank__ → 从零搭建"
                        }
                    })
                    .to_string(),
                ),
                created_at: Set(chrono::Utc::now().naive_utc()),
                ..Default::default()
            }
            .insert(&db_bg)
            .await;
        });
    }

    // B.5：RAG 检索已在本函数开头 spawn，这里收结果
    // 失败/没数据/超时 → 返回空 vec，不阻断任务创建
    let extra_system_sections = match rag_fut.await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!("RAG spawn 任务 join 失败: {} （按空样例继续）", e);
            Vec::new()
        }
    };

    // 2.7【2026-04-25 amis-translator 优先（实验功能）】
    // 用户在 UI 显式勾选「启用翻译器」时才走这条路径；默认 false → 主线 LLM 流水线不变。
    // 详见 docs/architecture/amis-translator-pipeline.md。
    if payload.enable_translator.unwrap_or(false) {
        if let Some(resp) = try_translate_amis(
            &state,
            task_id,
            &sandbox,
            &sandbox_info,
            &payload.amis_json,
            &tech_stack,
            &platform_str,
            &ui_libs_arr,
        )
        .await
        {
            return resp;
        }
    }

    // 1.2.0 多页：跳过单 claw-agent 主 session，spawn multipage_scheduler::dispatch
    // 跑独立 N 个 page session（sandbox 已就绪，workdir 已 ready，scaffold 已复制）
    if payload.pages.is_some() {
        let active = project_generation_task::ActiveModel {
            id: Set(task_id),
            sandbox_id: Set(Some(sandbox_info.id.clone())),
            preview_port: Set(Some(sandbox_info.preview_port as i32)),
            workdir_path: Set(Some(sandbox_info.workdir.clone())),
            status: Set("running".to_owned()),
            updated_at: Set(chrono::Utc::now().naive_utc()),
            ..Default::default()
        };
        if let Err(e) = active.update(&state.db).await {
            tracing::error!("更新多页任务状态失败: {}", e);
        }

        let state_clone = state.clone();
        let task_id_dispatch = task_id;
        tokio::spawn(async move {
            if let Err(e) = crate::services::multipage_scheduler::dispatch(
                &state_clone, task_id_dispatch,
            ).await {
                tracing::error!("multipage dispatch task={} 失败: {}", task_id_dispatch, e);
            }
        });

        return Json(json!({
            "task_id": task_id,
            "status": "running",
            "page_count": payload.pages.as_ref().map(|p| p.len()).unwrap_or(0),
            "sandbox_id": sandbox_info.id,
            "workdir_path": sandbox_info.workdir,
            "preview_port": sandbox_info.preview_port,
        }))
        .into_response();
    }

    // 3. 调 claw-agent-server 创建会话
    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    let initial_message = build_initial_prompt(&payload.amis_json, payload.extra_prompt.as_deref());

    let llm_config = decision.config.clone();
    let claw_req = crate::services::claw_agent_client::CreateTaskRequest {
        workdir: sandbox_info.workdir.clone(),
        sandbox_id: sandbox_info.id.clone(),
        initial_message,
        model: Some(llm_config.model.clone()),
        tech_stack: Some(tech_stack.clone()),
        // 2026-04 多维透传
        platform: Some(platform_str.clone()),
        tech_stacks: Some(tech_stacks_arr.clone()),
        ui_libs: Some(ui_libs_arr.clone()),
        template_name: match template_name.as_deref() {
            Some("__blank__") => None,
            other => other.map(|s| s.to_string()),
        },
        explicit_buckets: if explicit_buckets_arr.is_empty() {
            None
        } else {
            Some(explicit_buckets_arr.clone())
        },
        llm_config: Some(llm_config),
        permission_config: payload.permission_config.clone(),
        extra_system_sections: if extra_system_sections.is_empty() {
            None
        } else {
            Some(extra_system_sections)
        },
        // 单页 IDE 路径走 interactive 模式（前端 WS 会持续追加 follow-up message）
        single_shot: None,
    };

    let claw_resp = match claw.create_task(claw_req).await {
        Ok(r) => r,
        Err(e) => {
            // 尝试清理 sandbox
            let _ = sandbox.delete(&sandbox_info.id).await;
            mark_task_failed(&state, task_id, &format!("claw-agent 启动失败: {}", e)).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("claw-agent 启动失败: {}", e)})),
            )
                .into_response();
        }
    };

    // 4. 更新 DB 记录：挂载 sandbox/claw session 信息
    let active = project_generation_task::ActiveModel {
        id: Set(task_id),
        sandbox_id: Set(Some(sandbox_info.id.clone())),
        preview_port: Set(Some(sandbox_info.preview_port as i32)),
        workdir_path: Set(Some(sandbox_info.workdir.clone())),
        claw_session_id: Set(Some(claw_resp.id.clone())),
        status: Set("running".to_owned()),
        updated_at: Set(chrono::Utc::now().naive_utc()),
        ..Default::default()
    };

    if let Err(e) = active.update(&state.db).await {
        tracing::error!("更新任务状态失败: {}", e);
    }

    // 4.5 后台监控 sandbox dev_status：
    //    - ready → task.status = succeeded
    //    - failed 且 fix_attempts < 5 → 把错误日志喂给 Agent 让它修复后重新 dev_start
    //    - fix_attempts >= 5 → task.status = failed
    spawn_dev_status_watcher(
        state.clone(),
        task_id,
        sandbox_info.id.clone(),
        claw_resp.id.clone(),
    );

    // 5. 写入初始消息 —— 2026-04 性能：扔后台，不阻塞响应
    //    前端刚 POST 201 就订阅 /events 也能最终看到这条消息（~几 ms 延后）
    {
        let db_bg = state.db.clone();
        let amis_json_bg = payload.amis_json;
        tokio::spawn(async move {
            let _ = project_task_message::ActiveModel {
                task_id: Set(task_id),
                role: Set("user".to_owned()),
                content: Set(amis_json_bg),
                created_at: Set(chrono::Utc::now().naive_utc()),
                ..Default::default()
            }
            .insert(&db_bg)
            .await;
        });
    }

    // 5.5 审计事件：记录本次任务的 LLM 决策；同样扔后台
    {
        let db_bg = state.db.clone();
        let decision_bg = decision;
        tokio::spawn(async move {
            let _ = project_task_event::ActiveModel {
                task_id: Set(task_id),
                event_type: Set("llm_selected".to_owned()),
                payload: Set(json!({
                    "mode": decision_bg.mode,
                    "provider_id": decision_bg.provider_id,
                    "provider_name": decision_bg.provider_name,
                    "model": decision_bg.config.model,
                    "protocol": decision_bg.config.protocol,
                    "capability_tier": decision_bg.capability_tier,
                    "complexity_score": decision_bg.complexity_score,
                    "reason": decision_bg.reason,
                }).to_string()),
                created_at: Set(chrono::Utc::now().naive_utc()),
                ..Default::default()
            }
            .insert(&db_bg)
            .await;
        });
    }

    (
        StatusCode::CREATED,
        Json(json!({
            "id": task_id,
            "status": "running",
            "sandbox_id": sandbox_info.id,
            "preview_port": sandbox_info.preview_port,
            "claw_session_id": claw_resp.id,
        })),
    )
        .into_response()
}

pub async fn list_tasks(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let tasks = project_generation_task::Entity::find()
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .order_by_desc(project_generation_task::Column::CreatedAt)
        .all(&state.db)
        .await
        .unwrap_or_default();

    let briefs: Vec<TaskBrief> = tasks
        .into_iter()
        .map(|t| TaskBrief {
            id: t.id,
            status: t.status,
            tech_stack: t.tech_stack,
            ui_library: t.ui_library,
            preview_port: t.preview_port,
            sandbox_id: t.sandbox_id,
            workdir_path: t.workdir_path,
            created_at: t.created_at,
        })
        .collect();

    Json(briefs).into_response()
}

pub async fn get_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .unwrap_or_default();

    match task {
        Some(t) => Json(t).into_response(),
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "任务不存在"})),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct AddMessagePayload {
    pub content: String,
}

pub async fn add_message(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(payload): Json<AddMessagePayload>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let task = match project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
    {
        Ok(Some(t)) => t,
        _ => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "任务不存在"})),
            )
                .into_response()
        }
    };

    let claw_session = match task.claw_session_id {
        Some(ref s) => s.clone(),
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "任务未初始化 claw-agent 会话"})),
            )
                .into_response()
        }
    };

    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    if let Err(e) = claw.add_message(&claw_session, payload.content.clone()).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("追加消息失败: {}", e)})),
        )
            .into_response();
    }

    let _ = project_task_message::ActiveModel {
        task_id: Set(id),
        role: Set("user".to_owned()),
        content: Set(payload.content),
        created_at: Set(chrono::Utc::now().naive_utc()),
        ..Default::default()
    }
    .insert(&state.db)
    .await;

    Json(json!({"status": "queued"})).into_response()
}

pub async fn stop_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let task = match project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
    {
        Ok(Some(t)) => t,
        _ => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "任务不存在"})),
            )
                .into_response()
        }
    };

    // 通知 claw-agent 停止
    if let Some(ref session) = task.claw_session_id {
        let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
        let _ = claw.stop_task(session).await;
    }

    // 销毁 sandbox
    if let Some(ref sandbox_id) = task.sandbox_id {
        let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
        let _ = sandbox.delete(sandbox_id).await;
    }

    let mut active: project_generation_task::ActiveModel = task.into();
    let stopped_id = active.id.clone().unwrap();
    active.status = Set("stopped".to_owned());
    active.updated_at = Set(chrono::Utc::now().naive_utc());
    let _ = active.update(&state.db).await;

    crate::services::tracelog::finalize_task_tracelog(&state, stopped_id, "stopped").await;

    Json(json!({"status": "stopped"})).into_response()
}

/// dev_status 监控 + 自修复闭环（含 Ready 之后的运行时错误捕获）：
/// - 看到 starting / ready：更新 task 状态，**但继续轮询**（Ready 之后要持续监听运行时错误）
/// - 看到 failed（启动阶段错误，sandbox 还没进入 ready） 且 fix_attempts < 5 → 喂日志给 Agent，Agent 修复后再次 dev_start
/// - 看到 runtime_error（sandbox 已 Ready 后新出现的 import-analysis / HMR 错误） 且 fix_attempts < 5 → 喂日志给 Agent 修复
/// - fix_attempts >= 5 → task.status = failed，退出
/// - 每 3 秒轮询一次，最多跑 30 分钟（600 次轮询，为覆盖 Ready 后的错误延长）
fn spawn_dev_status_watcher(state: AppState, task_id: i32, sandbox_id: String, claw_session_id: String) {
    tokio::spawn(async move {
        let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
        let claw = crate::services::claw_agent_client::ClawAgentClient::new(
            state.http_client.clone(),
            state.claw_agent_url.clone(),
        );

        // 去重：
        //   - last_handled_failure：启动阶段的 failed 去重（配合 seen_starting 允许下一次 dev_start 触发的新 failure 被处理）
        //   - last_handled_runtime_error：Ready 之后的运行时错误去重（同一 reason 文本不再重复喂）
        let mut last_handled_failure: Option<String> = None;
        let mut seen_starting: bool = false;
        let mut last_handled_runtime_error: Option<String> = None;
        // workdir_unchanged 防御只触发一次（避免 dev 一直 ready 时反复改 status / 反复发事件）
        let mut marked_workdir_unchanged_failed: bool = false;

        const MAX_FIX_ATTEMPTS: i32 = 5;
        const MAX_POLLS: usize = 600; // 30 分钟

        for _ in 0..MAX_POLLS {
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;

            let Ok(resp) = sandbox.dev_status(&sandbox_id).await else {
                continue;
            };
            let dev_status = &resp["dev_status"];

            // dev_status 形态：
            //   - "not_started" / "starting"（字符串）
            //   - {"ready": {"url": "..."}}
            //   - {"failed": {"reason": "..."}}
            //   - {"runtime_error": {"reason": "...", "logs": [...]}}
            if dev_status == "starting" {
                seen_starting = true;
                // Agent 重新调了 dev_start，允许新一轮 runtime_error 被处理
                last_handled_runtime_error = None;
                continue;
            }

            if dev_status.get("ready").is_some() {
                // 每次 ready 都从 DB 拉最新状态判断，不再依赖内存里的 marked_succeeded_once。
                // 这样可以处理"用户手动喂日志救场后 dev 重新 ready"的复活场景。
                let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
                    .one(&state.db)
                    .await
                else {
                    continue;
                };
                if task.status == "stopped" {
                    return;
                }
                if task.status == "succeeded" {
                    // 已经是 succeeded，dev 持续 ready，啥也不做（继续监听 runtime_error）
                    continue;
                }

                // task #100 防御（仅触发一次）：dev ready ≠ "LLM 真的写过业务代码"。
                // 若 workdir 一字未改（典型 task #100：write_file 全部越界没落地、
                // 但 dev server 起来跑的还是脚手架原版），降级为 failed，避免误标成功。
                if !marked_workdir_unchanged_failed {
                    let workdir_has_changes = task
                        .workdir_path
                        .as_deref()
                        .map(|wd| workdir_changed_since_task_start(wd, task.created_at))
                        .unwrap_or(true);

                    if !workdir_has_changes {
                        let fix_attempts_local = task.fix_attempts;
                        tracing::warn!(
                            "task {} dev ready but workdir unchanged since task start → \
                             marking failed (likely path-rejected writes)",
                            task_id
                        );
                        let mut active: project_generation_task::ActiveModel = task.into();
                        active.status = Set("failed".to_string());
                        active.updated_at = Set(chrono::Utc::now().naive_utc());
                        let _ = active.update(&state.db).await;

                        let _ = project_task_event::ActiveModel {
                            task_id: Set(task_id),
                            event_type: Set("workdir_unchanged_rejected".to_owned()),
                            payload: Set(serde_json::json!({
                                "type": "workdir_unchanged_rejected",
                                "data": {
                                    "reason": "Vite dev server 已 ready，但工作目录里没有任何文件\
                                              在本任务期间被新建/修改。可能 LLM 的所有 write_file 都\
                                              被路径校验拦截了，或写到了 workdir 之外。",
                                    "fix_attempts": fix_attempts_local
                                }
                            }).to_string()),
                            created_at: Set(chrono::Utc::now().naive_utc()),
                            ..Default::default()
                        }
                        .insert(&state.db)
                        .await;

                        crate::services::tracelog::finalize_task_tracelog(
                            &state, task_id, "failed",
                        )
                        .await;
                        marked_workdir_unchanged_failed = true;
                        // 不 return：watcher 继续监听，等用户手动救场后下次 ready 时复活
                        continue;
                    }
                }

                // 走到这里：task.status 是 running / failed / waiting_user 等非终结/非 succeeded 态，
                // 且 dev 真的 ready 了 → 切 succeeded（包括从 failed 复活的情况）。
                let prev_status = task.status.clone();
                let mut active: project_generation_task::ActiveModel = task.into();
                active.status = Set("succeeded".to_string());
                active.updated_at = Set(chrono::Utc::now().naive_utc());
                let _ = active.update(&state.db).await;

                // 落 status_change 事件，让前端 history REST 能看到状态切换
                let _ = project_task_event::ActiveModel {
                    task_id: Set(task_id),
                    event_type: Set("status_change".to_owned()),
                    payload: Set(serde_json::json!({
                        "type": "status_change",
                        "data": "succeeded",
                        "from": prev_status,
                    }).to_string()),
                    created_at: Set(chrono::Utc::now().naive_utc()),
                    ..Default::default()
                }
                .insert(&state.db)
                .await;

                if prev_status == "failed" {
                    tracing::info!(
                        "task {} dev re-ready after manual rescue → succeeded (revived from failed)",
                        task_id
                    );
                } else {
                    tracing::info!(
                        "task {} dev ready → succeeded (continuing to watch runtime errors)",
                        task_id
                    );
                }
                continue;
            }

            if let Some(rt_obj) = dev_status.get("runtime_error") {
                let reason = rt_obj
                    .get("reason")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown")
                    .to_string();

                // 同一 reason 文本已处理 → skip
                if last_handled_runtime_error.as_ref() == Some(&reason) {
                    continue;
                }

                let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
                    .one(&state.db)
                    .await
                else {
                    continue;
                };
                if task.status == "stopped" {
                    return;
                }
                if task.status == "failed" {
                    // 已经放弃过自动修（fix_attempts 满），等用户/admin 手动救场。
                    // 救场成功后 dev 重新 ready 会让 ready 分支把 status 从 failed 复活到 succeeded。
                    last_handled_runtime_error = Some(reason);
                    continue;
                }

                let attempts = task.fix_attempts;
                if attempts >= MAX_FIX_ATTEMPTS {
                    let mut active: project_generation_task::ActiveModel = task.into();
                    active.status = Set("failed".to_string());
                    active.updated_at = Set(chrono::Utc::now().naive_utc());
                    let _ = active.update(&state.db).await;
                    tracing::warn!(
                        "task {} runtime-error reached max fix attempts ({}), giving up auto-fix \
                         (watcher continues; user/admin can rescue manually → revives on next ready)",
                        task_id,
                        MAX_FIX_ATTEMPTS
                    );
                    crate::services::tracelog::finalize_task_tracelog(&state, task_id, "failed").await;
                    last_handled_runtime_error = Some(reason);
                    continue; // 不 return：watcher 继续监听，留给用户手动救场
                }

                // 从 rt_obj.logs 拿最近日志
                let rt_logs: Vec<String> = rt_obj
                    .get("logs")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();
                let log_tail = rt_logs.join("\n");

                let fix_message = format!(
                    "⚠️ Vite dev server 已启动成功，但浏览器访问时触发了**运行时错误**（第 {}/{} 次重试）。\n\n\
                     **错误信息**：{}\n\n\
                     **最近日志**：\n```\n{}\n```\n\n\
                     常见原因：\n\
                     - `import \"wot-design-uni/index.css\"` 等第三方库 CSS 路径不存在（Wot UI 样式自动注入，不要手动 import）\n\
                     - 页面里引用了不存在的 .vue 文件\n\
                     - `pages.json` 注册的 path 与实际 .vue 文件路径不匹配\n\
                     - API 请求路径或方法写错\n\n\
                     请用 read_file/edit_file/write_file 工具分析并修复，**无需再调用 dev_start**（Vite HMR 会自动热更新）。",
                    attempts + 1,
                    MAX_FIX_ATTEMPTS,
                    reason,
                    if log_tail.is_empty() { "(无日志)".into() } else { log_tail }
                );

                match claw.add_message(&claw_session_id, fix_message.clone()).await {
                    Ok(_) => {
                        tracing::info!(
                            "task {} runtime-error fix attempt {}/{} dispatched",
                            task_id,
                            attempts + 1,
                            MAX_FIX_ATTEMPTS
                        );
                    }
                    Err(e) => {
                        tracing::warn!(
                            "task {} failed to dispatch runtime-error fix: {}",
                            task_id,
                            e
                        );
                        continue;
                    }
                }

                // task.status 从 succeeded 降级回 running（表示"还在修"），fix_attempts++
                // ready 分支会在 dev 重新 ready 时再把 status 切回 succeeded（基于 DB 读取，无需内存标志）
                // 1.5 W1.2：新 attempt 开始 → reset actual_cost_tokens（accumulated 保留）
                let mut active: project_generation_task::ActiveModel = task.into();
                active.status = Set("running".to_string());
                active.fix_attempts = Set(attempts + 1);
                active.actual_cost_tokens = Set(Some(0));
                active.updated_at = Set(chrono::Utc::now().naive_utc());
                let _ = active.update(&state.db).await;

                let _ = project_task_message::ActiveModel {
                    task_id: Set(task_id),
                    role: Set("system".to_owned()),
                    content: Set(fix_message),
                    created_at: Set(chrono::Utc::now().naive_utc()),
                    ..Default::default()
                }
                .insert(&state.db)
                .await;

                last_handled_runtime_error = Some(reason);
                continue;
            }

            if let Some(fail_obj) = dev_status.get("failed") {
                let reason = fail_obj
                    .get("reason")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown")
                    .to_string();

                // 如果这个 failure 已经处理过且期间没看到新的 starting，跳过（sandbox 的 dev_status 会保持 Failed 直到下次 dev_start）
                if last_handled_failure.as_ref() == Some(&reason) && !seen_starting {
                    continue;
                }

                // 查 task 当前状态
                let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
                    .one(&state.db)
                    .await
                else {
                    continue;
                };
                if task.status == "stopped" {
                    return;
                }
                if task.status == "failed" {
                    // 已经放弃过自动修，等手动救场（同 runtime_error 分支语义）
                    last_handled_failure = Some(reason);
                    continue;
                }

                let attempts = task.fix_attempts;
                if attempts >= MAX_FIX_ATTEMPTS {
                    // 到达上限：标记为 failed，但 watcher 不退出，留给用户手动救场
                    let mut active: project_generation_task::ActiveModel = task.into();
                    active.status = Set("failed".to_string());
                    active.updated_at = Set(chrono::Utc::now().naive_utc());
                    let _ = active.update(&state.db).await;
                    tracing::warn!(
                        "task {} reached max fix attempts ({}), giving up auto-fix \
                         (watcher continues; user/admin can rescue manually → revives on next ready)",
                        task_id,
                        MAX_FIX_ATTEMPTS
                    );
                    crate::services::tracelog::finalize_task_tracelog(&state, task_id, "failed").await;
                    last_handled_failure = Some(reason);
                    continue;
                }

                // 构造修复提示消息：带上失败原因 + 最近日志
                let recent_logs: Vec<String> = resp
                    .get("recent_logs")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();
                let log_tail = recent_logs
                    .iter()
                    .rev()
                    .take(40)
                    .rev()
                    .cloned()
                    .collect::<Vec<_>>()
                    .join("\n");

                let fix_message = format!(
                    "⚠️ Vite dev server 启动失败（第 {}/{} 次重试）。\n\n\
                     **失败原因**：{}\n\n\
                     **最近日志**（tail 40 行）：\n```\n{}\n```\n\n\
                     请分析上述错误（常见原因：缺依赖、语法错误、路径写错、pages.json 配置错），\
                     用 read_file/edit_file/write_file 工具修复代码，然后**再次调用 dev_start 工具**重启 Vite。",
                    attempts + 1,
                    MAX_FIX_ATTEMPTS,
                    reason,
                    if log_tail.is_empty() { "(无日志)".into() } else { log_tail }
                );

                // 推给 Agent
                match claw.add_message(&claw_session_id, fix_message.clone()).await {
                    Ok(_) => {
                        tracing::info!(
                            "task {} fix attempt {}/{} dispatched to agent",
                            task_id,
                            attempts + 1,
                            MAX_FIX_ATTEMPTS
                        );
                    }
                    Err(e) => {
                        tracing::warn!("task {} failed to dispatch fix message: {}", task_id, e);
                        continue;
                    }
                }

                // 更新 fix_attempts；1.5 W1.2 reset actual_cost_tokens（新 attempt 重新计数）
                let mut active: project_generation_task::ActiveModel = task.into();
                active.fix_attempts = Set(attempts + 1);
                active.actual_cost_tokens = Set(Some(0));
                active.updated_at = Set(chrono::Utc::now().naive_utc());
                let _ = active.update(&state.db).await;

                // 写入 task_message 作为 system 消息（方便前端看到修复轨迹）
                let _ = project_task_message::ActiveModel {
                    task_id: Set(task_id),
                    role: Set("system".to_owned()),
                    content: Set(fix_message),
                    created_at: Set(chrono::Utc::now().naive_utc()),
                    ..Default::default()
                }
                .insert(&state.db)
                .await;

                // 记录处理状态，重置 seen_starting（等下次 Agent 调 dev_start 产生 starting 后才会处理下一个 failure）
                last_handled_failure = Some(reason);
                seen_starting = false;
            }
        }

        tracing::info!("task {} dev_status watcher timeout (30 min)", task_id);

        // watcher 自然结束（30 分钟到 / 任务一直 Ready 没出错）→ 用当前 DB 状态 finalize tracelog
        let final_status = project_generation_task::Entity::find_by_id(task_id)
            .one(&state.db)
            .await
            .ok()
            .flatten()
            .map(|t| t.status)
            .unwrap_or_else(|| "succeeded".to_string());
        crate::services::tracelog::finalize_task_tracelog(&state, task_id, &final_status).await;
    });
}

/// task #100 防御：判断 task workdir 在本任务期间是否真的发生过变更。
///
/// 判定法：扫描 workdir 子树（跳 node_modules / .git / dist 等大目录），
/// 任意文件的 mtime > task.created_at + 5s buffer 即视为"有改动"。
///
/// 为什么这条判定可靠：
/// - 脚手架是 `rsync -a` / `cp -r` 复制的，源文件 mtime 被保留（远早于任务创建时间）；
/// - LLM 通过 write_file / edit_file 写入的文件 mtime 必然 > 任务创建时间；
/// - "workdir 内 mtime 全部 ≤ task.created_at + buffer" 等价于 "LLM 一行业务代码都没改"。
///
/// 异常路径（IO 失败、时间戳负值、workdir 不存在）一律保守返回 true（放行），
/// 避免误把合法任务降级。
fn workdir_changed_since_task_start(
    workdir: &str,
    task_created_at: chrono::NaiveDateTime,
) -> bool {
    use std::time::{Duration, SystemTime, UNIX_EPOCH};
    // 1.2.0 起：task.created_at 统一按 `chrono::Utc::now().naive_utc()` 写入（无时区 naive UTC），
    // 直接 `and_utc().timestamp()` 还原成 UNIX 秒即可。
    //
    // 历史背景：1.1 及更早版本里这里是 Local naive，用 `Local.from_local_datetime` 折算回 UTC
    // 才能与文件 mtime 对齐；现在写入侧切到 Utc，逻辑随之简化。1.1 旧 task 行（DB 里是 Local
    // naive）走到这里会被早 8 小时解读，但旧任务都已结束、不再走 dev_status_watcher 防御分支，
    // 影响仅限于"用户重启 backend 后还在 running 的旧 task"——可接受。
    let secs = task_created_at.and_utc().timestamp();
    if secs < 0 {
        return true;
    }
    let since: SystemTime = UNIX_EPOCH + Duration::from_secs(secs as u64) + Duration::from_secs(5);

    let mut saw_recent = false;
    for entry in walkdir::WalkDir::new(workdir)
        .max_depth(8)
        .into_iter()
        .filter_entry(|e| {
            !matches!(
                e.file_name().to_str(),
                Some("node_modules") | Some(".git") | Some("dist") | Some(".uniapp")
            )
        })
        .filter_map(|e| e.ok())
        .take(20_000)
    {
        if !entry.file_type().is_file() {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        let Ok(mtime) = meta.modified() else { continue };
        if mtime > since {
            saw_recent = true;
            break;
        }
    }

    // 扫不到任何 entry（workdir 不存在 / 权限问题）→ 保守放行
    if !saw_recent
        && walkdir::WalkDir::new(workdir)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
            .next()
            .is_none()
    {
        return true;
    }

    saw_recent
}

/// 把指定模板目录的脚手架种子项目复制到 workdir（让 Agent 启动时有素材可改）。
///
/// `dir_name` 是 `scaffolds/` 下的子目录名（来自 `template_registry.dir` 或旧路径 `{tech_stack}-template`）。
///
/// 2026-04 性能优化：
///   - 优先用 rsync --exclude=node_modules/.git/...，对 212MB 的 uniapp-wot-h5-template 只拷 ~2MB；
///   - 缺 rsync 或失败时兜底到原 `cp -r && rm -rf`（旧逻辑不变，保证可用性）。
async fn copy_scaffold_to_workdir(dir_name: &str, workdir: &str) -> anyhow::Result<()> {
    let scaffold_root = std::env::var("SCAFFOLD_ROOT")
        .unwrap_or_else(|_| "/home/karl/Working/TianXing/amis-ai/scaffolds".to_string());
    let source = format!("{}/{}", scaffold_root, dir_name);

    if !std::path::Path::new(&source).exists() {
        return Err(anyhow::anyhow!("scaffold not found: {}", source));
    }

    // 1) rsync 优先路径（源尾部必须带 `/`，等价于 `cp -r {src}/.`）
    //    --exclude 把常见的大目录和构建产物全部挡在外面，避免先拷后删的浪费
    let rsync_cmd = format!(
        "rsync -a \
         --exclude=node_modules --exclude=.git --exclude=.turbo \
         --exclude=dist --exclude=.next --exclude=coverage --exclude=.cache \
         {}/ {}/",
        source, workdir
    );
    let rsync_out = tokio::process::Command::new("sh")
        .arg("-c")
        .arg(&rsync_cmd)
        .output()
        .await;
    if let Ok(o) = &rsync_out {
        if o.status.success() {
            tracing::info!("scaffold rsync -> {}", workdir);
            return Ok(());
        }
    }
    tracing::warn!(
        "rsync 不可用或失败（{:?}），回退到 cp -r && rm -rf node_modules 兜底路径",
        rsync_out
            .as_ref()
            .map(|o| String::from_utf8_lossy(&o.stderr).into_owned())
            .unwrap_or_else(|e| format!("{e}"))
    );

    // 2) 兜底：cp -r 先全量拷贝再删 node_modules/.git（慢但稳）
    let output = tokio::process::Command::new("sh")
        .arg("-c")
        .arg(format!(
            "cp -r {}/. {}/ && rm -rf {}/node_modules {}/.git 2>/dev/null; true",
            source, workdir, workdir, workdir
        ))
        .output()
        .await?;

    if !output.status.success() {
        return Err(anyhow::anyhow!(
            "cp failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    tracing::info!("scaffold copied (cp fallback) to {}", workdir);
    Ok(())
}

/// POST /api/projects/tasks/llm-preview —— 前端 auto 模式下预览将选中的 provider/model
pub async fn llm_preview(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Json(payload): Json<LlmPreviewPayload>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    // 1.4 A.2：preview_auto 也支持 category override，但 preview 阶段还未跑分类器，
    // 这里传 None — 前端预览看到的是基线 score 决策；正式 create_task 时会带 category。
    match llm_selector::preview_auto(&state, user.id, &payload.amis_json, None, None).await {
        Ok(d) => preview_to_json(&d).into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("预览失败: {}", e)})),
        )
            .into_response(),
    }
}

fn preview_to_json(d: &LlmDecision) -> Json<serde_json::Value> {
    Json(json!({
        "provider_id": d.provider_id,
        "provider_name": d.provider_name,
        "model": d.config.model,
        "capability_tier": d.capability_tier,
        "complexity_score": d.complexity_score,
        "reason": d.reason,
    }))
}

/// 2026-04-25：尝试用 amis-translator 跳过 LLM。
///
/// 详见 docs/architecture/amis-translator-pipeline.md。
///
/// 返回：
/// - `Some(response)` —— 翻译器 fully_supported，已写文件 + dev_start，调用方应**直接**返回此响应
/// - `None` —— 翻译器降级 / 失败 / 跳过，调用方应继续走原 claw-agent 流水线（fall through）
///
/// 副作用：
/// - 成功时落 `translation_succeeded` 事件 + 更新 task 表（status=running, claw_session_id 留空）
/// - 不支持时落 `translation_unsupported` 事件
/// - 失败时仅打 warn 日志（不污染事件流）
#[allow(clippy::too_many_arguments)]
async fn try_translate_amis(
    state: &AppState,
    task_id: i32,
    sandbox: &SandboxClient,
    sandbox_info: &crate::services::sandbox_client::SandboxInfo,
    amis_json_str: &str,
    tech_stack: &str,
    platform_str: &str,
    ui_libs_arr: &[String],
) -> Option<axum::response::Response> {
    if amis_json_str.trim().is_empty() {
        return None;
    }
    let parsed_amis: serde_json::Value = match serde_json::from_str(amis_json_str) {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(
                "Task {}：amis_json 解析失败，跳过翻译器：{}",
                task_id,
                e
            );
            return None;
        }
    };

    let agent_url = std::env::var("AGENT_URL")
        .unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();

    let ui_lib = ui_libs_arr.first().cloned().unwrap_or_else(|| "wot".to_string());

    // 读沙箱当前 src/pages.json（脚手架已拷贝）—— 失败容忍
    let current_pages_json = sandbox
        .fs_read(&sandbox_info.id, "src/pages.json")
        .await
        .ok()
        .and_then(|v| {
            v.get("content")
                .and_then(|c| c.as_str())
                .map(String::from)
        })
        .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok());

    let req = crate::services::amis_translator_client::TranslateRequest {
        amis_json: parsed_amis,
        ui_lib: &ui_lib,
        tech_stack,
        platform: platform_str,
        current_pages_json,
    };

    let response = match crate::services::amis_translator_client::translate(
        &state.http_client,
        &agent_url,
        &internal_key,
        &req,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            tracing::warn!(
                "Task {}：调 amis-translator 失败（回退 LLM）: {}",
                task_id,
                e
            );
            return None;
        }
    };

    if !response.fully_supported {
        tracing::info!(
            "Task {}：amis-translator 部分支持/不支持，回退 LLM。unsupported={:?}",
            task_id,
            response.unsupported_types
        );
        let db_bg = state.db.clone();
        let unsupported = response.unsupported_types.clone();
        let notes = response.notes.clone();
        tokio::spawn(async move {
            let _ = project_task_event::ActiveModel {
                task_id: Set(task_id),
                event_type: Set("translation_unsupported".to_owned()),
                payload: Set(json!({
                    "type": "translation_unsupported",
                    "data": {"unsupported_types": unsupported, "notes": notes}
                })
                .to_string()),
                created_at: Set(chrono::Utc::now().naive_utc()),
                ..Default::default()
            }
            .insert(&db_bg)
            .await;
        });
        return None;
    }

    // fully_supported：写所有文件 + dev_start
    tracing::info!(
        "Task {}：amis-translator fully_supported，跳过 LLM。{} 个文件",
        task_id,
        response.files.len()
    );
    for (path, content) in &response.files {
        let body = serde_json::json!({
            "path": path,
            "content": content,
            "base_mtime": 0
        });
        if let Err(e) = sandbox.fs_write(&sandbox_info.id, &body).await {
            tracing::warn!(
                "Task {}：amis-translator 写沙箱失败 path={}：{}（回退 LLM）",
                task_id,
                path,
                e
            );
            return None;
        }
    }

    if let Err(e) = sandbox.dev_start(&sandbox_info.id).await {
        tracing::warn!(
            "Task {}：amis-translator dev_start 失败：{}（前端可手动重试）",
            task_id,
            e
        );
    }

    // 落事件 translation_succeeded（异步）
    let files_list: Vec<String> = response.files.keys().cloned().collect();
    {
        let db_bg = state.db.clone();
        let files_bg = files_list.clone();
        let notes = response.notes.clone();
        tokio::spawn(async move {
            let _ = project_task_event::ActiveModel {
                task_id: Set(task_id),
                event_type: Set("translation_succeeded".to_owned()),
                payload: Set(json!({
                    "type": "translation_succeeded",
                    "data": {"files": files_bg, "notes": notes}
                })
                .to_string()),
                created_at: Set(chrono::Utc::now().naive_utc()),
                ..Default::default()
            }
            .insert(&db_bg)
            .await;
        });
    }

    // 更新 task 表（status=running，落沙箱信息；claw_session_id 留 None 表示无 LLM 会话）
    let active = project_generation_task::ActiveModel {
        id: Set(task_id),
        sandbox_id: Set(Some(sandbox_info.id.clone())),
        preview_port: Set(Some(sandbox_info.preview_port as i32)),
        workdir_path: Set(Some(sandbox_info.workdir.clone())),
        status: Set("running".to_owned()),
        updated_at: Set(chrono::Utc::now().naive_utc()),
        ..Default::default()
    };
    if let Err(e) = active.update(&state.db).await {
        tracing::error!(
            "Task {}：amis-translator 路径更新 task 失败：{}",
            task_id,
            e
        );
    }

    Some(
        (
            StatusCode::CREATED,
            Json(json!({
                "id": task_id,
                "status": "running",
                "sandbox_id": sandbox_info.id,
                "preview_port": sandbox_info.preview_port,
                "claw_session_id": serde_json::Value::Null,
                "translator": {
                    "fully_supported": true,
                    "files": files_list
                }
            })),
        )
            .into_response(),
    )
}

/// 1.5 W3 B：A/B 分桶决策。
///
/// 读 `llm.routing.ab_test_enabled`（默认 false，开关关闭时全部返回 None）。
/// 开启时按 user_id 稳定分桶（同用户始终一桶），50/50 切 a/b：
///   - bucket < 50 → "a"（沿用主 routing 配置 `_json`）
///   - bucket ≥ 50 → "b"（用 `_json_b` 覆盖表，admin 可配置成与 A 不同）
///
/// 分桶字段写入 `project_generation_task.ab_variant`，admin `/api/admin/ab-compare`
/// 端点按此聚合 cost-per-success 对比。
async fn compute_ab_variant(state: &AppState, user_id: i32) -> Option<String> {
    let enabled =
        crate::handlers::system_settings::read_value_or(state, "llm.routing.ab_test_enabled", "false")
            .await;
    if enabled.trim().to_lowercase() != "true" {
        return None;
    }
    let bucket = (user_id as u32).wrapping_mul(31) % 100;
    Some(if bucket < 50 { "a".into() } else { "b".into() })
}

async fn mark_task_failed(state: &AppState, task_id: i32, reason: &str) {
    tracing::error!("任务 {} 失败: {}", task_id, reason);

    crate::services::tracelog::finalize_task_tracelog(state, task_id, "failed").await;

    if let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
    {
        let mut active: project_generation_task::ActiveModel = task.into();
        active.status = Set("failed".to_owned());
        active.updated_at = Set(chrono::Utc::now().naive_utc());
        let _ = active.update(&state.db).await;
    }

    let _ = project_task_event::ActiveModel {
        task_id: Set(task_id),
        event_type: Set("status_change".to_owned()),
        payload: Set(json!({"status": "failed", "reason": reason}).to_string()),
        created_at: Set(chrono::Utc::now().naive_utc()),
        ..Default::default()
    }
    .insert(&state.db)
    .await;
}

fn build_initial_prompt(amis_json: &str, extra: Option<&str>) -> String {
    let base = format!(
        "请根据以下 Amis JSON 生成**可运行的项目代码**。具体工作流程、组件映射、路由注册等规则，\
        请严格按 system_prompt 中注入的 Skills 桶（platform.* / stack.* / ui.*）的 SKILL.md 执行。\n\n\
        ## 开局检查\n\
        1. `bash: ls -la /workspace` 看工作目录（是否已有模板、package.json 是否存在）\n\
        2. 若已有模板文件 → 按「有模板」流程增量开发，**倾向于**在 src/pages/ / src/components/ / src/api/ 等业务目录扩展\n\
        3. 若为空目录 → 按 `scaffold-from-scratch` skill 指引从零搭建（创建 package.json + 构建配置 + 入口 + 首页）\n\n\
        ## 依赖变更\n\
        - 新增依赖用 `bash: pnpm add <pkg>`，而不是手写 package.json（pnpm 会处理版本兼容）\n\
        - 移除依赖用 `bash: pnpm remove <pkg>`\n\
        - 修改构建配置（vite.config / tsconfig / next.config）前**先 read_file 看当前内容**，再 edit_file 增量改\n\n\
        ## 路径规则（极其重要 · task #100 实锤）\n\
        - `bash` 工具在**容器内**执行，用容器路径 `/workspace/...`，例如 `bash: ls /workspace/src`\n\
        - `write_file` / `edit_file` / `read_file` / `glob_search` / `grep_search` 在**宿主机**执行，一律用**相对路径**，例如 `src/pages/foo/index.vue`\n\
        - ✅ 允许的路径形式（对文件工具）：\n\
            * 相对路径（**首选**）：`src/pages/foo/index.vue` / `pages.json` / `vite.config.ts`\n\
            * `/workspace/...` 前缀：会被自动映射到工作目录\n\
        - ❌ **严禁**给文件工具传任何宿主机绝对路径：\n\
            * `/tmp/workspace/...`（早期容器约定，已废弃，但 LLM 常凭旧记忆复用 → 写入会被**硬拒绝**）\n\
            * `/tmp/...` `/home/...` `/etc/...` `/var/...` 等\n\
        - 路径越界时 `write_file` / `edit_file` 会**直接报错**，错误信息会告诉你正确写法 —— 收到错误立刻改成相对路径重试，**不要无视错误继续 dev_start**。\n\
        - ⚠️ task #100 复盘：曾经有 LLM 用 `/tmp/workspace/...` 写了 55 个文件，工具没拦住，文件落在宿主机 /tmp 里、dev server 跑的还是脚手架原版。本版本起这条路被堵死。\n\n\
        ## 错误恢复（必读）\n\
        当 write_file / edit_file / dev_start 返回错误时，**禁止忽略错误硬往下走**。常见错误与对应动作：\n\
        \n\
        **A. ❌ 路径越界（write/edit 报 `路径越界` 字样）**\n\
            → 把 `path` 改成**相对路径**（如 `src/pages/foo/index.vue`）或 `/workspace/...` 前缀，\
              用**同样的 content** 立刻重新调一次 `write_file` / `edit_file`。\n\
            → 不要尝试用 bash 写文件来「绕开」，bash 在容器里跑、文件不会进工作目录。\n\
        \n\
        **B. ❌ dev_start 前置检查失败（`工作目录里没有任何在本任务期间被新建/修改的文件`）**\n\
            → 说明前面的 write_file 全被拦截了 / 你压根没调过 write_file。\n\
            → 回看历史 tool_result，找到所有 `is_error: true` 的 write_file/edit_file，按 (A) 修路径重发；\
              确认 workdir 真的有产物后再 `dev_start`。\n\
        \n\
        **C. ❌ 拒绝整覆盖底座关键文件（write_file 拒了 `src/main.ts` 等）**\n\
            → 改用 `edit_file` 做精确局部替换，**保留**模板已有的拦截器/类型/接口。\n\
        \n\
        ## 启动验证\n\
        - 代码就绪后调 `dev_start` 工具启动 dev server（命令由后端从 package.json scripts 推断）\n\
        - 启动失败时读 `/tmp/vite.log` 或等价日志 → 定位 → 修复 → 再 `dev_start`（最多 5 次自修复）\n\n\
        Amis JSON:\n```json\n{}\n```",
        amis_json
    );

    if let Some(extra) = extra {
        format!("{}\n\n补充要求:\n{}", base, extra)
    } else {
        base
    }
}

// ─────────────────────── B.5：RAG 检索辅助 ───────────────────────

/// 调 Python agent 的 `/internal/search-code-samples`，把同栈 Top-K 已审核样例
/// 拼成一个 markdown section（追加到 system_prompt）。
///
/// 失败/超时/没数据 → 返回空 vec，不阻断任务创建。
/// 当前 top_k=3、only_approved=true、increment_hits=true（生产检索 → 累加 hit_count）。
///
/// 2026-04 性能优化：
///   - 签名改为 owned 参数 + 传 `AppState`（派生 Clone，廉价），让 `tokio::spawn(...)` 可满足 `'static`，
///     从而与 sandbox 创建并发跑；
///   - 开头加廉价 DB 预检：`SELECT 1 FROM code_samples WHERE status='approved' LIMIT 1`。空库
///     直接返回空 vec，跳过 Python embedding 调用（冷 Ollama 可省 5–15s）；
///   - HTTP 超时从 15s 收紧到 3s——已有 fallback（失败返回空 vec 不阻断），最坏只是 RAG 缺失。
async fn fetch_rag_extra_sections(
    state: crate::AppState,
    task_id: i32,
    platform: String,
    tech_stacks: Vec<String>,
    ui_libs: Vec<String>,
    legacy_tech_stack: String,
    amis_json: String,
) -> Vec<String> {
    // 空库快速跳过：避免对空 code_samples 表白白走 embedding + HTTP round-trip
    use sea_orm::{ConnectionTrait, Statement};
    let has_any = state
        .db
        .query_one(Statement::from_string(
            state.db.get_database_backend(),
            "SELECT 1 FROM code_samples WHERE status='approved' LIMIT 1".to_string(),
        ))
        .await
        .ok()
        .flatten()
        .is_some();
    if !has_any {
        tracing::info!("RAG skip: code_samples 无 approved 样例，不调 embedding");
        return Vec::new();
    }

    let agent_url =
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();

    // amis_json 太长会拖慢向量化；摘要用前 2KB 就够语义检索了
    let query_text: String = amis_json.chars().take(2000).collect();
    // 1.4 B.1 双路召回：提关键字需要完整 JSON 结构（type/subType/api 散布各处），
    // 取前 32KB（足够覆盖多页项目；超过部分截断不影响主结构提取）
    let query_amis_json: String = amis_json.chars().take(32768).collect();

    // 读 rag.* 配置（硬过滤 + 软加权 knob）。读失败走 default，不阻断主流程。
    use crate::handlers::system_settings::read_value_or;
    let exclude_tags_raw = read_value_or(&state, "rag.quality_filter.exclude_tags", "").await;
    let exclude_tags: Vec<String> = exclude_tags_raw
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    let min_rating_raw = read_value_or(&state, "rag.quality_filter.min_rating", "").await;
    let min_rating: Option<f32> = min_rating_raw.trim().parse().ok();
    let min_verdict_raw = read_value_or(&state, "rag.quality_filter.min_verdict", "").await;
    let min_verdict: Option<String> = if min_verdict_raw.trim().is_empty() {
        None
    } else {
        Some(min_verdict_raw.trim().to_string())
    };
    let weighting_enabled = read_value_or(&state, "rag.weighting.enabled", "false")
        .await
        .trim()
        .eq_ignore_ascii_case("true");
    let thumbs_mode = read_value_or(&state, "rag.weighting.thumbs_mode", "tiebreaker").await;
    let hit_count_enabled = read_value_or(&state, "rag.weighting.hit_count_enabled", "false")
        .await
        .trim()
        .eq_ignore_ascii_case("true");
    // 1.5 W4：D 项 A/B 评测开关 — false 时强制纯向量召回（用于跑 A 组对照）
    let dual_route_enabled = read_value_or(&state, "rag.dual_route.enabled", "true")
        .await
        .trim()
        .eq_ignore_ascii_case("true");
    let query_amis_json_payload: Option<&str> = if dual_route_enabled {
        Some(query_amis_json.as_str())
    } else {
        None
    };

    let resp = match state
        .http_client
        .post(format!("{}/internal/search-code-samples", agent_url))
        .header("X-Internal-Key", &internal_key)
        .json(&json!({
            "platforms": vec![&platform],
            "tech_stacks": &tech_stacks,
            "ui_libs": &ui_libs,
            "tech_stack": &legacy_tech_stack,
            "query_text": query_text,
            "query_amis_json": query_amis_json_payload,  // 1.4 B.1 / 1.5 W4：dual_route_enabled=false 时为 null → 纯向量
            "top_k": 3,
            "only_approved": true,
            "increment_hits": true,
            "exclude_tags": &exclude_tags,
            "min_rating": min_rating,
            "min_verdict": min_verdict,
            "weighting_enabled": weighting_enabled,
            "thumbs_mode": thumbs_mode,
            "hit_count_enabled": hit_count_enabled,
        }))
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
    {
        Ok(r) if r.status().is_success() => r,
        Ok(r) => {
            tracing::warn!("RAG search 返回非 2xx: {}", r.status());
            return Vec::new();
        }
        Err(e) => {
            tracing::warn!("RAG search 调用失败: {} （将不注入样例）", e);
            return Vec::new();
        }
    };

    let body: serde_json::Value = match resp.json().await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!("RAG search 响应解析失败: {}", e);
            return Vec::new();
        }
    };

    let results = match body.get("results").and_then(|v| v.as_array()) {
        Some(a) if !a.is_empty() => a,
        _ => {
            tracing::info!(
                "RAG search 命中 0 条 (legacy_stack={} tech_stacks={:?} ui_libs={:?}); system_prompt 不注入样例段",
                legacy_tech_stack, tech_stacks, ui_libs
            );
            return Vec::new();
        }
    };

    let mut buf = String::new();
    buf.push_str("# RAG 参考样例（Top-3，仅供借鉴，不强制）\n\n");
    buf.push_str(
        "下面是当前技术栈下与本任务最相似的几条**已采纳**样例。\
         可以参考它们的写法（组件用法、路由组织、API 适配），\
         但不要照搬——需求不一样时优先按用户的 Amis JSON 来生成。\n\n",
    );
    for (i, r) in results.iter().enumerate() {
        let id = r.get("id").and_then(|v| v.as_i64()).unwrap_or(-1);
        let team = r.get("source_team").and_then(|v| v.as_str()).unwrap_or("?");
        let amis_summary = r
            .get("amis_json_summary")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let code_summary = r
            .get("code_summary")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let similarity = r
            .get("similarity")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let full_amis = r
            .get("full_amis_json")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let full_code = r.get("full_code").and_then(|v| v.as_str()).unwrap_or("");

        buf.push_str(&format!(
            "## 样例 {}（#{}, source: {}, similarity={:.3}）\n\n",
            i + 1,
            id,
            team,
            similarity
        ));
        if !amis_summary.is_empty() {
            buf.push_str(&format!("**Amis 摘要**：{}\n\n", amis_summary));
        }
        if !code_summary.is_empty() {
            buf.push_str(&format!("**代码摘要**：{}\n\n", code_summary));
        }
        // 完整内容用 fenced 代码块；摘要不全时也提供原 JSON / 代码作为参考
        buf.push_str("**完整 Amis JSON**：\n\n```json\n");
        buf.push_str(full_amis);
        buf.push_str("\n```\n\n");
        buf.push_str("**生成代码**：\n\n");
        buf.push_str(full_code);
        buf.push_str("\n\n");
    }

    let ids: Vec<i64> = results
        .iter()
        .filter_map(|r| r.get("id").and_then(|v| v.as_i64()))
        .collect();
    tracing::info!(
        "RAG Top-{} hit (legacy_stack={} tech_stacks={:?} ui_libs={:?}): ids={:?}",
        results.len(),
        legacy_tech_stack,
        tech_stacks,
        ui_libs,
        ids
    );

    // Phase 4 负例注入（默认 OFF，admin 启用 rag.negative.enabled=true 才生效）
    let negative_enabled = read_value_or(&state, "rag.negative.enabled", "false")
        .await
        .trim()
        .eq_ignore_ascii_case("true");
    if negative_enabled {
        let neg_top_k: i64 = read_value_or(&state, "rag.negative.top_k", "1")
            .await
            .trim()
            .parse()
            .unwrap_or(1);
        // 总是 only_structural=true（评审建议硬编码，避 LLM negation blindness）
        match state
            .http_client
            .post(format!("{}/internal/search-negative-samples", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "tech_stacks": &tech_stacks,
                "platforms": vec![&platform],
                "top_k": neg_top_k,
                "only_structural": true,
            }))
            .timeout(std::time::Duration::from_secs(3))
            .send()
            .await
        {
            Ok(r) if r.status().is_success() => {
                if let Ok(body) = r.json::<serde_json::Value>().await {
                    if let Some(neg_arr) = body.get("results").and_then(|v| v.as_array()) {
                        if !neg_arr.is_empty() {
                            buf.push_str("\n\n# ⚠️ 避免以下结构性反例\n\n");
                            buf.push_str(
                                "下面是历史上被管理员标记为**结构性反面教材**的几条摘要。\
                                 生成代码时请主动避开这些错误结构；不要复现它们的组织方式。\n\n",
                            );
                            for (i, n) in neg_arr.iter().enumerate() {
                                let kind = n
                                    .get("negative_kind")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("structural");
                                let reason = n
                                    .get("rejection_reason")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("（未填写）");
                                let summary = n
                                    .get("amis_json_summary")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("");
                                buf.push_str(&format!(
                                    "## 反例 {} · 类型: {}\n\n**原因**：{}\n\n",
                                    i + 1,
                                    kind,
                                    reason
                                ));
                                if !summary.is_empty() {
                                    buf.push_str(&format!("**场景摘要**：{}\n\n", summary));
                                }
                            }
                        }
                    }
                }
            }
            Ok(r) => tracing::warn!("negative search 返回非 2xx: {}", r.status()),
            Err(e) => tracing::warn!("negative search 调用失败: {}", e),
        }
    }

    // 事件：RAG 样例注入（含每条的 id / similarity / team，供"执行详情"面板审计）
    // 1.5 W4：透出 keyword_hits + score（B.1 双路加分量），便于 D 项评测分析
    let event_payload = json!({
        "type": "rag_samples_injected",
        "data": {
            "query_preview": query_text.chars().take(200).collect::<String>(),
            "query_length": query_text.chars().count(),
            "top_k": 3,
            "total_hits": results.len(),
            "results": results.iter().map(|r| json!({
                "id": r.get("id").and_then(|v| v.as_i64()),
                "source_team": r.get("source_team").and_then(|v| v.as_str()),
                "similarity": r.get("similarity").and_then(|v| v.as_f64()),
                "keyword_hits": r.get("keyword_hits").and_then(|v| v.as_i64()),
                "score": r.get("score").and_then(|v| v.as_f64()),
                "amis_json_summary": r.get("amis_json_summary")
                    .and_then(|v| v.as_str())
                    .map(|s| s.chars().take(150).collect::<String>()),
            })).collect::<Vec<_>>(),
        }
    });
    let db_bg = state.db.clone();
    tokio::spawn(async move {
        let _ = project_task_event::ActiveModel {
            task_id: Set(task_id),
            event_type: Set("rag_samples_injected".to_owned()),
            payload: Set(event_payload.to_string()),
            created_at: Set(chrono::Utc::now().naive_utc()),
            ..Default::default()
        }
        .insert(&db_bg)
        .await;
    });

    // 2026-04-25 tracelog：把 Top-K 召回样本的 full_amis_json + full_code 整体快照打入 tracelog。
    // 不写 DB（避免 project_task_event payload 巨大），直接调 tracelog::route_event 让它走文件归档。
    // 注意：事件 type=rag_samples_snapshot 在 tracelog::route_event 里被识别后落到 task-{id}/rag_snapshot/samples.json。
    // 配 mode=disabled 时是 no-op。
    let snapshot_payload = json!({
        "type": "rag_samples_snapshot",
        "data": {
            "query_preview": query_text.chars().take(200).collect::<String>(),
            "samples": results.iter().map(|r| json!({
                "id": r.get("id").and_then(|v| v.as_i64()),
                "source_team": r.get("source_team").and_then(|v| v.as_str()),
                "tech_stack": r.get("tech_stack").and_then(|v| v.as_str()),
                "tech_stacks": r.get("tech_stacks"),
                "ui_libs": r.get("ui_libs"),
                "platforms": r.get("platforms"),
                "tags": r.get("tags"),
                "rating": r.get("rating"),
                "quality_verdict": r.get("quality_verdict"),
                "similarity": r.get("similarity").and_then(|v| v.as_f64()),
                "tag_boost": r.get("tag_boost").and_then(|v| v.as_f64()),
                "thumbs_boost": r.get("thumbs_boost").and_then(|v| v.as_f64()),
                "hit_boost": r.get("hit_boost").and_then(|v| v.as_f64()),
                "score": r.get("score").and_then(|v| v.as_f64()),
                "amis_json_summary": r.get("amis_json_summary"),
                "code_summary": r.get("code_summary"),
                "full_amis_json": r.get("full_amis_json"),
                "full_code": r.get("full_code"),
            })).collect::<Vec<_>>(),
            "prompt_section_chars": buf.chars().count(),
        }
    });
    crate::services::tracelog::route_event(&state, task_id, &snapshot_payload.to_string()).await;

    vec![buf]
}

// ─────────────────────── B.7：采纳→入库 ───────────────────────

#[derive(Debug, Deserialize)]
pub struct AdoptBody {
    /// 用户对本任务的"它做了什么"摘要（参与 RAG 向量化）。可空——backend 会用 amis_json 前缀兜底。
    pub amis_json_summary: Option<String>,
    /// 用户对生成代码做了什么的人话摘要（可选）
    pub code_summary: Option<String>,
    /// 完整代码（多文件拼成 markdown fenced）。可空——backend 自动从 sandbox 收集。
    pub full_code: Option<String>,
    /// 来源团队（默认 amis-ai）
    pub source_team: Option<String>,
}

/// 限制收集的文件总大小（避免 prompt 爆炸）：256 KB
const ADOPT_MAX_TOTAL_BYTES: usize = 256 * 1024;
/// 单文件读取上限（超过 → 截断 + 标注）
const ADOPT_MAX_FILE_BYTES: usize = 64 * 1024;
/// 收集的目录前缀（白名单）
const ADOPT_SCAN_DIRS: &[&str] = &["src/pages", "src/api", "src/components", "src/utils"];
/// 单独收集的文件
const ADOPT_SCAN_FILES: &[&str] = &["src/pages.json"];

/// `POST /api/projects/tasks/:id/adopt` —— 把任务的代码沉淀回 code_sample 表。
///
/// 流程：
/// 1. JWT 校验 + 任务归属
/// 2. 读 system_settings.adopt_default_status（默认 pending；admin 可在系统配置改成 approved）
/// 3. 收集代码：优先用 body.full_code；没传则自动从 sandbox 读 src/ 下文件
/// 4. INSERT code_samples 一行（含 amis_json + 收集的代码）
/// 5. 异步调 Python /internal/index-code-sample 向量化
/// 6. 标记任务 adopted_at
pub async fn adopt_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(task_id): Path<i32>,
    Json(body): Json<AdoptBody>,
) -> impl IntoResponse {
    // 1. 任务归属校验
    let current = match user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
    {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "用户不存在"})),
            )
                .into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };
    let task = match project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
    {
        Ok(Some(t)) => t,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "任务不存在"}))).into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };
    if task.user_id != current.id {
        return (StatusCode::FORBIDDEN, Json(json!({"error": "无权采纳他人任务"}))).into_response();
    }

    // 2. 读默认状态（D3 决策：默认 pending；管理员可在系统配置改 approved）
    let default_status =
        crate::handlers::system_settings::read_value_or(&state, "adopt_default_status", "pending")
            .await;
    let status = if matches!(
        default_status.as_str(),
        "pending" | "approved" | "rejected"
    ) {
        default_status
    } else {
        "pending".to_string()
    };

    // 3. 收集代码
    let (full_code, file_count, sandbox_warn) =
        if let Some(code) = body.full_code.as_ref().filter(|s| !s.trim().is_empty()) {
            (code.clone(), 0, None)
        } else if let Some(sandbox_id) = task.sandbox_id.as_ref() {
            match collect_code_from_sandbox(&state, sandbox_id).await {
                Ok((code, n)) => (code, n, None),
                Err(e) => (
                    String::new(),
                    0,
                    Some(format!(
                        "自动收集代码失败（{}）。请手动在 body.full_code 提供代码。",
                        e
                    )),
                ),
            }
        } else {
            (
                String::new(),
                0,
                Some("任务无 sandbox_id 且未提供 full_code，无法采纳".to_string()),
            )
        };

    if full_code.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": sandbox_warn.unwrap_or_else(|| "无可入库代码".to_string()),
            })),
        )
            .into_response();
    }

    // 4. INSERT code_sample
    let now = chrono::Utc::now().naive_utc();
    let amis_summary = body.amis_json_summary.clone().or_else(|| {
        // 兜底：用 amis_json 前 200 字
        Some(task.amis_json.chars().take(200).collect())
    });
    let active = code_sample::ActiveModel {
        tech_stack: Set(task.tech_stack.clone()),
        source_team: Set(body.source_team.clone().unwrap_or_else(|| "amis-ai".to_string())),
        amis_json_summary: Set(amis_summary),
        code_summary: Set(body.code_summary.clone()),
        full_amis_json: Set(task.amis_json.clone()),
        full_code: Set(full_code.clone()),
        status: Set(status.clone()),
        hit_count: Set(0),
        source_task_id: Set(Some(task_id)),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    let inserted = match active.insert(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("入库失败: {e}")})),
            )
                .into_response()
        }
    };

    // 4.5 2026-04 多维标签回填：从 task 的新列（platforms / tech_stacks / ui_libs + template_name）
    //     复制到 code_samples 对应列；entity 没字段所以走原生 SQL。
    use sea_orm::{ConnectionTrait, Statement};
    let task_tags_sql = "SELECT platforms, tech_stacks, ui_libs, template_name \
                         FROM project_generation_task WHERE id = $1";
    if let Ok(Some(row)) = state
        .db
        .query_one(Statement::from_sql_and_values(
            state.db.get_database_backend(),
            task_tags_sql,
            [task_id.into()],
        ))
        .await
    {
        let task_platforms: Vec<String> = row.try_get("", "platforms").unwrap_or_default();
        let task_tech_stacks: Vec<String> = row.try_get("", "tech_stacks").unwrap_or_default();
        let task_ui_libs: Vec<String> = row.try_get("", "ui_libs").unwrap_or_default();
        let task_template: Option<String> = row.try_get("", "template_name").ok();
        let mut tags: Vec<String> = Vec::new();
        if let Some(t) = &task_template {
            tags.push(format!("template:{}", t));
        }
        tags.push(format!("source:task-{}", task_id));
        let _ = state
            .db
            .execute(Statement::from_sql_and_values(
                state.db.get_database_backend(),
                "UPDATE code_samples SET platforms = $1, tech_stacks = $2, ui_libs = $3, tags = $4 \
                 WHERE id = $5",
                [
                    task_platforms.into(),
                    task_tech_stacks.into(),
                    task_ui_libs.into(),
                    tags.into(),
                    inserted.id.into(),
                ],
            ))
            .await;
    }

    // 5. 异步向量化
    let summary_for_vec = inserted
        .amis_json_summary
        .clone()
        .unwrap_or_else(|| inserted.full_amis_json.chars().take(1000).collect());
    spawn_vectorize_for_adopt(&state, inserted.id, summary_for_vec);

    // 6. 标记 adopted_at
    let mut t_active: project_generation_task::ActiveModel = task.into();
    t_active.adopted_at = Set(Some(now));
    let _ = t_active.update(&state.db).await;

    Json(json!({
        "ok": true,
        "sample_id": inserted.id,
        "status": status,
        "file_count": file_count,
        "sandbox_warn": sandbox_warn,
        "notice": format!(
            "已入库（status={status}）。{}",
            if status == "approved" {
                "立即参与下次任务的检索召回"
            } else {
                "等管理员在「知识库 → RAG 样例库」审核通过才进入飞轮"
            }
        ),
    }))
    .into_response()
}

/// 从 sandbox 收集 src/ 下的关键代码文件，拼成 markdown fenced 长文本。
async fn collect_code_from_sandbox(
    state: &AppState,
    sandbox_id: &str,
) -> anyhow::Result<(String, usize)> {
    let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
    let mut buf = String::new();
    let mut count = 0usize;
    let mut total_bytes = 0usize;

    // 1) 单独的关键文件（pages.json 等）
    for path in ADOPT_SCAN_FILES {
        if total_bytes >= ADOPT_MAX_TOTAL_BYTES {
            break;
        }
        if let Ok(json) = sandbox.fs_read(sandbox_id, path).await {
            if let Some(content) = json.get("content").and_then(|v| v.as_str()) {
                let snippet: String = content.chars().take(ADOPT_MAX_FILE_BYTES).collect();
                let lang = lang_for_file(path);
                buf.push_str(&format!("## {path}\n\n```{lang}\n{snippet}\n```\n\n"));
                total_bytes += snippet.len();
                count += 1;
            }
        }
    }

    // 2) 目录递归（depth 4 已经够覆盖 src/pages/{name}/index.vue）
    // 注意：sandbox /fs/tree 返回 {root, depth, nodes: [...]}，walker 要从 nodes 数组进，
    // 不能把整个外层对象当节点喂——历史 bug：直接传外层对象导致 walker 立刻退出，
    // 全部业务代码（src/pages/**.vue / src/api/**.ts）都收不到，full_code 只剩 pages.json 空壳。
    let tree_root = sandbox.fs_tree(sandbox_id, Some(4)).await?;
    let mut files: Vec<String> = Vec::new();
    let nodes = tree_root
        .get("nodes")
        .cloned()
        .unwrap_or(serde_json::Value::Null);
    walk_tree_collect_files(&nodes, "", &mut files);
    // 仅保留白名单目录里的文件，且排除第一阶段已扫过的固定文件（避免 src/pages.json 重复入选）
    files.retain(|p| {
        !ADOPT_SCAN_FILES.contains(&p.as_str())
            && ADOPT_SCAN_DIRS
                .iter()
                .any(|prefix| p.starts_with(prefix))
            && (p.ends_with(".vue")
                || p.ends_with(".ts")
                || p.ends_with(".js")
                || p.ends_with(".css")
                || p.ends_with(".scss")
                || p.ends_with(".json"))
    });
    // 排序权重：业务页面 .vue > components.vue > utils > 其它 > api（评委只看前几千字，
    // 把"反向飞轮的产物 vue"放最前，否则 4000 字硬截断会切掉关键页面）。
    files.sort_by_key(|p| (collect_priority(p), p.clone()));
    for path in files {
        if total_bytes >= ADOPT_MAX_TOTAL_BYTES {
            buf.push_str("\n\n_(后续文件超过 256KB 总量上限被截断)_\n");
            break;
        }
        if let Ok(json) = sandbox.fs_read(sandbox_id, &path).await {
            if let Some(content) = json.get("content").and_then(|v| v.as_str()) {
                let snippet: String = content.chars().take(ADOPT_MAX_FILE_BYTES).collect();
                let lang = lang_for_file(&path);
                buf.push_str(&format!("## {path}\n\n```{lang}\n{snippet}\n```\n\n"));
                total_bytes += snippet.len();
                count += 1;
            }
        }
    }
    Ok((buf, count))
}

/// collect_code_from_sandbox 文件排序权重：小的优先。
/// 评委 prompt 只看前 N 字截断，必须保证业务 .vue 在 api/utils 基础设施前面。
fn collect_priority(path: &str) -> u8 {
    if path.starts_with("src/pages/") && path.ends_with(".vue") {
        0
    } else if path.starts_with("src/components/") && path.ends_with(".vue") {
        1
    } else if path.starts_with("src/pages/") || path.starts_with("src/components/") {
        2
    } else if path.starts_with("src/utils/") {
        3
    } else {
        4 // src/api/** 等基础设施
    }
}

fn lang_for_file(path: &str) -> &'static str {
    if path.ends_with(".vue") {
        "vue"
    } else if path.ends_with(".ts") {
        "ts"
    } else if path.ends_with(".js") {
        "js"
    } else if path.ends_with(".css") {
        "css"
    } else if path.ends_with(".scss") {
        "scss"
    } else if path.ends_with(".json") {
        "json"
    } else {
        ""
    }
}

/// 递归遍历 fs_tree 输出，收集所有 type=file 节点的 path（相对 sandbox workdir）
fn walk_tree_collect_files(
    node: &serde_json::Value,
    base: &str,
    out: &mut Vec<String>,
) {
    if let Some(arr) = node.as_array() {
        for n in arr {
            walk_tree_collect_files(n, base, out);
        }
        return;
    }
    let name = node.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let ty = node.get("type").and_then(|v| v.as_str()).unwrap_or("");
    let path = if base.is_empty() {
        name.to_string()
    } else {
        format!("{}/{}", base, name)
    };
    if ty == "file" {
        out.push(path);
    } else if ty == "dir" {
        if let Some(children) = node.get("children") {
            walk_tree_collect_files(children, &path, out);
        }
    }
}

fn spawn_vectorize_for_adopt(state: &AppState, sample_id: i32, summary_text: String) {
    let agent_url =
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
    let http_client = state.http_client.clone();
    tokio::spawn(async move {
        let _ = http_client
            .post(format!("{}/internal/index-code-sample", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "sample_id": sample_id,
                "summary_text": summary_text,
            }))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await;
    });
}

// ───────────────────────── 删除任务（硬删除）

#[derive(Debug, Deserialize)]
pub struct BatchDeletePayload {
    pub ids: Vec<i32>,
}

#[derive(Debug, Serialize)]
pub struct BatchDeleteFailure {
    pub id: i32,
    pub error: String,
}

#[derive(Debug, Serialize)]
pub struct BatchDeleteResult {
    pub deleted: Vec<i32>,
    pub failed: Vec<BatchDeleteFailure>,
}

/// 单条删除：彻底清理任务及相关资源（沙箱、workdir、messages、events）。
pub async fn delete_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    match delete_one_task(&state, user.id, id).await {
        Ok(()) => Json(json!({"deleted": id})).into_response(),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": e})),
        )
            .into_response(),
    }
}

/// 批量删除：循环复用单条逻辑，单条失败不阻塞其他。
pub async fn batch_delete_tasks(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Json(payload): Json<BatchDeletePayload>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let mut deleted: Vec<i32> = Vec::new();
    let mut failed: Vec<BatchDeleteFailure> = Vec::new();

    for id in payload.ids {
        match delete_one_task(&state, user.id, id).await {
            Ok(()) => deleted.push(id),
            Err(e) => failed.push(BatchDeleteFailure { id, error: e }),
        }
    }

    Json(BatchDeleteResult { deleted, failed }).into_response()
}

/// 删除任务的"快路径"：仅做归属校验 + DB 三件事（messages/events/task），
/// 外部资源（claw session 终止、沙箱容器销毁、宿主机 workdir 删除）丢给后台 tokio task 静默执行。
///
/// 选择背景：批量删除沙箱/workdir 时单条 5-10s，76 条堆 5+ 分钟会让前端 30s 超时；
/// 而 DB 三件事是毫秒级的，对前端体验影响最大。后台清理失败仅 tracing::warn，
/// 沙箱本身有 idle retention 兜底，workdir 偶尔残留靠定期清理脚本（非本次范围）。
async fn delete_one_task(state: &AppState, user_id: i32, id: i32) -> Result<(), String> {
    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user_id))
        .one(&state.db)
        .await
        .map_err(|e| format!("DB error: {}", e))?
        .ok_or_else(|| "任务不存在".to_string())?;

    let claw_session_id = task.claw_session_id.clone();
    let sandbox_id = task.sandbox_id.clone();
    let workdir_path = task.workdir_path.clone();

    // ── 同步阶段（DB 三件事，必须返回前完成）
    let _ = project_task_message::Entity::delete_many()
        .filter(project_task_message::Column::TaskId.eq(id))
        .exec(&state.db)
        .await;
    let _ = project_task_event::Entity::delete_many()
        .filter(project_task_event::Column::TaskId.eq(id))
        .exec(&state.db)
        .await;
    project_generation_task::Entity::delete_by_id(id)
        .exec(&state.db)
        .await
        .map_err(|e| format!("DB delete failed: {}", e))?;

    // ── 异步阶段（claw / sandbox / workdir，丢后台不阻塞响应）
    let bg_state = state.clone();
    tokio::spawn(async move {
        if let Some(session) = claw_session_id {
            let claw = ClawAgentClient::new(
                bg_state.http_client.clone(),
                bg_state.claw_agent_url.clone(),
            );
            if let Err(e) = claw.stop_task(&session).await {
                tracing::warn!("[bg] delete_task #{}: claw stop_task 失败: {}", id, e);
            }
        }
        if let Some(sb) = sandbox_id {
            let sandbox = SandboxClient::new(
                bg_state.http_client.clone(),
                bg_state.sandbox_url.clone(),
            );
            if let Err(e) = sandbox.delete(&sb).await {
                tracing::warn!("[bg] delete_task #{}: 销毁沙箱失败: {}", id, e);
            }
        }
        if let Some(wd) = workdir_path {
            if !wd.is_empty() {
                let path = std::path::Path::new(&wd);
                if path.is_absolute() && path.exists() {
                    if let Err(e) = tokio::fs::remove_dir_all(path).await {
                        tracing::warn!(
                            "[bg] delete_task #{}: 删 workdir {} 失败: {}",
                            id,
                            wd,
                            e
                        );
                    }
                }
            }
        }
        tracing::info!("[bg] delete_task #{}: 后台外部资源清理完成", id);
    });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};

    /// task #100 防御回归：workdir 内只有早于任务创建时间的旧文件 → 不算变更
    #[test]
    fn workdir_unchanged_when_only_stale_files_present() {
        let temp = tempfile::tempdir().expect("temp");
        // 写一个文件
        let f = temp.path().join("src/pages/index/index.vue");
        std::fs::create_dir_all(f.parent().unwrap()).unwrap();
        std::fs::write(&f, "scaffold").unwrap();

        // 把 task_created_at 设到未来（现在所有文件 mtime 都早于 task_created_at + 5s）
        let future_task = (Utc::now() + Duration::minutes(5)).naive_utc();
        let changed = workdir_changed_since_task_start(
            temp.path().to_str().unwrap(),
            future_task,
        );
        assert!(!changed, "stale-only workdir should be reported as unchanged");
    }

    /// 反面：任务开始之后写入文件 → 视为有变更
    #[test]
    fn workdir_changed_when_new_file_written_after_task_start() {
        let temp = tempfile::tempdir().expect("temp");
        // task 1 分钟前创建
        let past_task = (Utc::now() - Duration::minutes(1)).naive_utc();
        // 现在写文件
        let f = temp.path().join("src/pages/foo/index.vue");
        std::fs::create_dir_all(f.parent().unwrap()).unwrap();
        std::fs::write(&f, "fresh").unwrap();

        let changed = workdir_changed_since_task_start(
            temp.path().to_str().unwrap(),
            past_task,
        );
        assert!(changed, "newly-written file should mark workdir as changed");
    }

    /// 不存在的 workdir → 保守放行（避免把合法 ready 误降级）
    #[test]
    fn workdir_changed_returns_true_for_missing_dir() {
        let past_task = (Utc::now() - Duration::minutes(1)).naive_utc();
        assert!(workdir_changed_since_task_start(
            "/nonexistent/path/should/not/exist/zzz",
            past_task
        ));
    }
}
