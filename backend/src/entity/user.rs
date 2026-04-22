use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub username: String,
    pub email: String,
    #[serde(skip)]
    pub password: String,
    pub avatar: Option<String>,
    pub is_active: bool,
    /// A.6 RBAC：管理员标志。
    /// `is_admin = true` 才能访问 Skills 管理 / RAG 审核等敏感接口。
    /// 默认为 false（普通用户），seed_users 把内置 "admin" 账号置为 true。
    /// 增量 migration 在 main.rs 做（ADD COLUMN IF NOT EXISTS ...）。
    #[serde(default)]
    pub is_admin: bool,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
