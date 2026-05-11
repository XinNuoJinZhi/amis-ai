use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "project_task_page")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub task_id: i32,
    pub page_idx: i32,
    pub route_path: String,
    #[sea_orm(column_type = "Text")]
    pub amis_json: String,
    pub claw_session_id: Option<String>,
    pub status: String,
    pub started_at: Option<DateTime>,
    pub finished_at: Option<DateTime>,
    #[sea_orm(column_type = "Text", nullable)]
    pub error_msg: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,

    // 1.4 B.3b：page 级 LLM 评委（与 amis schema 是否对齐）
    /// good / needs_review / bad；NULL = 未评
    #[sea_orm(column_type = "Text", nullable)]
    pub page_quality_verdict: Option<String>,
    /// 评委 reason 说明（LLM 返回，截断 500 字）
    #[sea_orm(column_type = "Text", nullable)]
    pub page_quality_reason: Option<String>,
    pub page_quality_judge_at: Option<DateTime>,
    /// 评分用的模型名（追溯用，便于切 provider 后解读）
    #[sea_orm(column_type = "Text", nullable)]
    pub page_quality_judge_model: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::project_generation_task::Entity",
        from = "Column::TaskId",
        to = "super::project_generation_task::Column::Id"
    )]
    Task,
}

impl Related<super::project_generation_task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
