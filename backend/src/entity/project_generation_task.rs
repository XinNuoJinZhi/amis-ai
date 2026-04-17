use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "project_generation_task")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub user_id: i32,
    pub source_history_id: Option<i32>,
    #[sea_orm(column_type = "Text")]
    pub amis_json: String,
    pub tech_stack: String,
    pub ui_library: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub extra_prompt: Option<String>,
    pub status: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub repo_path: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub workdir_path: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub sandbox_id: Option<String>,
    pub preview_port: Option<i32>,
    #[sea_orm(column_type = "Text", nullable)]
    pub claw_session_id: Option<String>,
    pub fix_attempts: i32,
    pub adopted_at: Option<DateTime>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
