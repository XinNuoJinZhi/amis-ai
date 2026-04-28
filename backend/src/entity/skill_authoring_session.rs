//! Skill 桶 AI 起草会话（Section 2026-04-22 "Synthetic Honey"）
//!
//! 一次"向导"流程对应一条记录：
//!   draft → streaming → ready → adopted | abandoned | failed
//!
//! 草稿正文不落这里——放在 `${SKILLS_ROOT}/.drafts/<session_id>/` 文件系统里，
//! 本表只存元数据 + 用户意图（JSON-as-Text），避免把大段 markdown 塞进 TEXT 列。

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "skill_authoring_session")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    /// UUID v4 —— URL 和草稿目录名都用这个；i32 内部主键只在 DB 里用。
    #[sea_orm(unique, indexed)]
    pub session_id: String,
    pub user_id: i32,
    /// draft | streaming | ready | adopted | abandoned | failed
    pub status: String,
    /// draft_bucket | clone_bucket
    pub mode: String,
    /// 用户意图的 JSON 序列化：{dir_name, display_name, description, target_stack,
    /// reference_bucket_ids[], extra_context}。不单独开列是因为这些字段只在 handler
    /// 层被消费，DB 侧无需按单个字段查询。
    #[sea_orm(column_type = "Text")]
    pub intent: String,
    /// 生成时实际使用的模型名（meta 事件回填）。
    #[sea_orm(column_type = "Text", nullable)]
    pub llm_model: Option<String>,
    /// 失败时的错误信息。
    #[sea_orm(column_type = "Text", nullable)]
    pub error_message: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    /// TTL 过期时间（后台定时任务据此清理 DB 行 + 草稿目录）。
    pub expires_at: DateTime,
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
