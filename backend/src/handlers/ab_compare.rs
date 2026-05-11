//! 1.5 W3 B：A/B 路由对比 endpoint
//!
//! 路由：
//!   - GET /api/admin/ab-compare?days=7
//!
//! 聚合 `project_generation_task` 表，按 `ab_variant` 分桶返回：
//!   - count / succeeded_count / 成功率
//!   - 平均 actual_cost_tokens（最后 attempt 成本，1.5 W1.2 新语义）
//!   - 平均 accumulated_cost_tokens（全 attempt 累计，1.5 W1.2 新增）
//!   - 平均耗时（updated_at - created_at 秒数）
//!   - cost_per_success（accumulated / 成功率 / 1000，越低越好）
//!
//! 仅 admin 可调。`days` 缺省为 7，最大 90。

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{ConnectionTrait, Statement};
use serde::Deserialize;
use serde_json::json;

use crate::entity::user;
use crate::utils::jwt;
use crate::AppState;

#[derive(Deserialize)]
pub struct CompareQuery {
    pub days: Option<i64>,
}

async fn require_admin(
    state: &AppState,
    auth_user: &jwt::AuthUser,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
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
            Json(json!({"error": "A/B 对比仅限管理员"})),
        ));
    }
    Ok(())
}

pub async fn compare(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Query(q): Query<CompareQuery>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let days = q.days.unwrap_or(7).clamp(1, 90);

    let sql = format!(
        "SELECT
           ab_variant,
           COUNT(*)::INT                                                  AS total,
           SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END)::INT     AS succeeded,
           AVG(NULLIF(actual_cost_tokens, 0))::FLOAT                      AS avg_actual_cost,
           AVG(NULLIF(accumulated_cost_tokens, 0))::FLOAT                 AS avg_accumulated_cost,
           AVG(NULLIF(estimated_cost_tokens, 0))::FLOAT                   AS avg_estimated_cost,
           AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::FLOAT      AS avg_duration_sec,
           AVG(NULLIF(fix_attempts, 0))::FLOAT                            AS avg_fix_attempts
         FROM project_generation_task
         WHERE ab_variant IS NOT NULL
           AND created_at >= NOW() - INTERVAL '{} days'
         GROUP BY ab_variant
         ORDER BY ab_variant",
        days
    );

    let rows = match state
        .db
        .query_all(Statement::from_string(state.db.get_database_backend(), sql))
        .await
    {
        Ok(rs) => rs,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {}", e)})),
            )
                .into_response();
        }
    };

    let mut buckets = Vec::with_capacity(rows.len());
    for row in rows {
        let variant: Option<String> = row.try_get("", "ab_variant").ok();
        let total: i32 = row.try_get("", "total").unwrap_or(0);
        let succeeded: i32 = row.try_get("", "succeeded").unwrap_or(0);
        let avg_actual_cost: Option<f64> = row.try_get("", "avg_actual_cost").ok();
        let avg_accumulated_cost: Option<f64> =
            row.try_get("", "avg_accumulated_cost").ok();
        let avg_estimated_cost: Option<f64> = row.try_get("", "avg_estimated_cost").ok();
        let avg_duration_sec: Option<f64> = row.try_get("", "avg_duration_sec").ok();
        let avg_fix_attempts: Option<f64> = row.try_get("", "avg_fix_attempts").ok();

        let success_rate = if total > 0 {
            succeeded as f64 / total as f64
        } else {
            0.0
        };

        // cost_per_success = avg_accumulated_cost / max(success_rate, 0.01) / 1000（k token / 单成功）
        let cost_per_success = avg_accumulated_cost.map(|cost| {
            cost / success_rate.max(0.01) / 1000.0
        });

        buckets.push(json!({
            "variant": variant,
            "total": total,
            "succeeded": succeeded,
            "success_rate": success_rate,
            "avg_actual_cost": avg_actual_cost,
            "avg_accumulated_cost": avg_accumulated_cost,
            "avg_estimated_cost": avg_estimated_cost,
            "avg_duration_sec": avg_duration_sec,
            "avg_fix_attempts": avg_fix_attempts,
            "cost_per_success_k": cost_per_success,
        }));
    }

    Json(json!({
        "window_days": days,
        "buckets": buckets,
    }))
    .into_response()
}
