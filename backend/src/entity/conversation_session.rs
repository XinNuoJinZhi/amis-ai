//! 通用 AI 对话会话（左侧菜单「AI 对话」）
//!
//! 一个用户有多条会话，每条会话承载多条消息（user / assistant / system）。
//! `session_id` 为 UUID v4，对外路由参数；`id` 为内部 i32 主键，messages 表通过它做 FK。
//!
//! 删除会话时配合 handler 显式级联删除 conversation_message（不依赖 DB FK，
//! 因为 sea-orm 的 create_table_from_entity 不会建外键约束）。

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "conversation_session")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    /// 对外暴露的 UUID v4，路由用 `/sessions/:session_id`
    #[sea_orm(unique, indexed)]
    pub session_id: String,
    pub user_id: i32,
    /// 会话标题，默认「新会话」，首条用户消息发出后自动用前 30 字回填。
    #[sea_orm(column_type = "Text")]
    pub title: String,
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
