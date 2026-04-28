//! 通用 AI 对话单条消息
//!
//! 通过 `session_pk` 关联 `conversation_session.id`。role 限定 `user | assistant | system`。
//! `model` / `provider` 仅 assistant 消息会回填，便于前端在气泡上挂 Tag。

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "conversation_message")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    /// FK → conversation_session.id（i32 主键，不是 UUID）
    pub session_pk: i32,
    /// user | assistant | system
    pub role: String,
    #[sea_orm(column_type = "Text")]
    pub content: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub model: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub provider: Option<String>,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::conversation_session::Entity",
        from = "Column::SessionPk",
        to = "super::conversation_session::Column::Id"
    )]
    Session,
}

impl Related<super::conversation_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Session.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
