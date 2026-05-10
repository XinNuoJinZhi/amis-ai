//! 1.2.0：多页任务的 DB pages 列表 + reuse_rate 查询端点
//!
//! 注意：GET /api/projects/tasks/:id/pages 已被 project_events::list_task_pages 占用
//! （读文件系统 pages.json），此处使用 /db-pages 读 project_task_page 表。

use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json,
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder};
use serde_json::json;

use crate::AppState;
use crate::entity::{project_task_event, project_task_page};

/// GET /api/projects/tasks/:id/db-pages
/// 列出某 task 在 project_task_page 表中的所有页面记录（按 page_idx 升序排列）
pub async fn list_db_pages(
    State(state): State<AppState>,
    Path(task_id): Path<i32>,
) -> impl IntoResponse {
    let result = project_task_page::Entity::find()
        .filter(project_task_page::Column::TaskId.eq(task_id))
        .order_by_asc(project_task_page::Column::PageIdx)
        .all(&state.db)
        .await;
    match result {
        Ok(pages) => Json(pages).into_response(),
        Err(e) => (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("DB error: {e}")})),
        )
            .into_response(),
    }
}

/// GET /api/projects/tasks/:id/reuse-rate
/// 读最新的 reuse_metric 事件（任务完成后由调度器写入）
/// 没有该事件时返回 reuse_rate=0.0
pub async fn get_reuse_rate(
    State(state): State<AppState>,
    Path(task_id): Path<i32>,
) -> impl IntoResponse {
    let evt = project_task_event::Entity::find()
        .filter(project_task_event::Column::TaskId.eq(task_id))
        .filter(project_task_event::Column::EventType.eq("reuse_metric"))
        .order_by_desc(project_task_event::Column::CreatedAt)
        .one(&state.db)
        .await
        .ok()
        .flatten();

    // payload 字段是 String 类型（非 serde_json::Value），先 from_str 反序列化
    let rate = evt
        .and_then(|e| serde_json::from_str::<serde_json::Value>(&e.payload).ok())
        .and_then(|v| v.get("value").and_then(|x| x.as_f64()))
        .unwrap_or(0.0);

    Json(json!({"reuse_rate": rate})).into_response()
}
