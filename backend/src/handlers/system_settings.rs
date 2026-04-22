//! B.7 系统配置 admin API
//!
//! 路由：
//!   - GET /api/system-settings              全部 key/value
//!   - GET /api/system-settings/:key         单条
//!   - PUT /api/system-settings/:key         body: {value, description?}（upsert）

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter, Set,
};
use serde::Deserialize;
use serde_json::json;

use crate::entity::{system_setting, user};
use crate::utils::jwt;
use crate::AppState;

async fn require_admin(
    state: &AppState,
    auth_user: &jwt::AuthUser,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let u = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {}", e)})),
            )
        })?
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(json!({"error": "用户不存在"}))))?;
    if !u.is_admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "系统配置仅限管理员"})),
        ));
    }
    Ok(())
}

pub async fn list_settings(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    match system_setting::Entity::find().all(&state.db).await {
        Ok(rows) => Json(rows).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("DB error: {e}")})),
        )
            .into_response(),
    }
}

pub async fn get_setting(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(key): Path<String>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    match system_setting::Entity::find()
        .filter(system_setting::Column::Key.eq(&key))
        .one(&state.db)
        .await
    {
        Ok(Some(m)) => Json(m).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": format!("配置 {} 不存在", key)})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("DB error: {e}")})),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct PutBody {
    pub value: String,
    pub description: Option<String>,
}

pub async fn upsert_setting(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(key): Path<String>,
    Json(body): Json<PutBody>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let now = chrono::Local::now().naive_local();
    let existing = system_setting::Entity::find()
        .filter(system_setting::Column::Key.eq(&key))
        .one(&state.db)
        .await;
    match existing {
        Ok(Some(m)) => {
            let mut active = m.into_active_model();
            active.value = Set(body.value);
            if body.description.is_some() {
                active.description = Set(body.description);
            }
            active.updated_at = Set(now);
            match active.update(&state.db).await {
                Ok(updated) => Json(updated).into_response(),
                Err(e) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("update failed: {e}")})),
                )
                    .into_response(),
            }
        }
        Ok(None) => {
            let active = system_setting::ActiveModel {
                key: Set(key.clone()),
                value: Set(body.value),
                description: Set(body.description),
                updated_at: Set(now),
                ..Default::default()
            };
            match active.insert(&state.db).await {
                Ok(inserted) => Json(inserted).into_response(),
                Err(e) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("insert failed: {e}")})),
                )
                    .into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("DB error: {e}")})),
        )
            .into_response(),
    }
}

/// 探测当前 embedding 配置的兼容性：
/// - 调 Python agent 的 `/internal/probe-embedding-dim` 拿模型实际输出维度
/// - 查 pg 列声明的维度（pgvector 把 dim 存在 pg_attribute.atttypmod）
/// - 读 EMBEDDING_DIM env
/// - 返回三者 + mismatch 标志，让 UI 提示用户
pub async fn embedding_info(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }

    // 1. 查 pg 列维度（取 code_samples.embedding 为代表；amis_templates 同维度）
    use sea_orm::{ConnectionTrait, Statement};
    let pg_dim = {
        let stmt = Statement::from_string(
            state.db.get_database_backend(),
            "SELECT atttypmod
             FROM pg_attribute
             WHERE attrelid = 'code_samples'::regclass
               AND attname = 'embedding'
               AND NOT attisdropped"
                .to_string(),
        );
        match state.db.query_one(stmt).await {
            Ok(Some(row)) => row.try_get::<i32>("", "atttypmod").ok(),
            _ => None,
        }
    };

    // 2. env 期望维度
    let env_dim: Option<u32> = std::env::var("EMBEDDING_DIM")
        .ok()
        .and_then(|s| s.parse().ok());

    // 3. 调 Python 探测真实输出维度
    let agent_url =
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
    let (actual_dim, probe_ok, probe_err) = match state
        .http_client
        .post(format!("{}/internal/probe-embedding-dim", agent_url))
        .header("X-Internal-Key", &internal_key)
        // 60s：本地 Ollama 冷启动加载大模型可能 30+s，第一次探测要给足时间
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
    {
        Ok(resp) => match resp.json::<serde_json::Value>().await {
            Ok(v) => {
                let ok = v.get("ok").and_then(|x| x.as_bool()).unwrap_or(false);
                let dim = v.get("dim").and_then(|x| x.as_i64()).map(|x| x as i32);
                let err = v.get("error").and_then(|x| x.as_str()).map(String::from);
                (dim, ok, err)
            }
            Err(e) => (None, false, Some(format!("Python 响应解析失败: {e}"))),
        },
        Err(e) => (None, false, Some(format!("Python agent 不可达: {e}"))),
    };

    // 4. 兼容性判定
    let pg_matches_actual = match (pg_dim, actual_dim) {
        (Some(p), Some(a)) => p == a,
        _ => false,
    };
    let env_matches_pg = match (env_dim, pg_dim) {
        (Some(e), Some(p)) => e as i32 == p,
        _ => false,
    };

    Json(json!({
        "pg_column_dim": pg_dim,
        "env_dim": env_dim,
        "actual_model_dim": actual_dim,
        "probe_ok": probe_ok,
        "probe_error": probe_err,
        "compatible": probe_ok && pg_matches_actual,
        "warnings": {
            "pg_actual_mismatch": probe_ok && !pg_matches_actual,
            "env_pg_mismatch": !env_matches_pg && env_dim.is_some() && pg_dim.is_some(),
        },
        "hint": if probe_ok && pg_matches_actual {
            "✅ 模型实际维度与 pgvector 列匹配，向量化可正常工作".to_string()
        } else if !probe_ok {
            format!("❌ 无法探测模型维度：{}", probe_err.clone().unwrap_or_default())
        } else {
            format!(
                "⚠️ 模型输出 {} 维，但 pgvector 列是 {} 维，不匹配。需要 ALTER TABLE 重建列（会丢已有 embedding，但 full_amis_json/full_code 保留）",
                actual_dim.unwrap_or(0),
                pg_dim.unwrap_or(0),
            )
        }
    }))
    .into_response()
}

/// 内部辅助：读取某个 key，找不到返回 default。供其它 handler 调用。
pub async fn read_value_or<S: Into<String>>(
    state: &AppState,
    key: &str,
    default: S,
) -> String {
    match system_setting::Entity::find()
        .filter(system_setting::Column::Key.eq(key))
        .one(&state.db)
        .await
    {
        Ok(Some(m)) => m.value,
        _ => default.into(),
    }
}
