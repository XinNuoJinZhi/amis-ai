//! key/value 系统配置（B.7）
//!
//! 当前用途：
//!   - `adopt_default_status`：采纳→入库默认状态（pending / approved / rejected）。D3 决策默认 pending。
//!
//! 后续可扩展：模型默认参数、Token 上限、Feature flag 等。所有 admin 可改。

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "system_settings")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique, indexed)]
    pub key: String,
    #[sea_orm(column_type = "Text")]
    pub value: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub description: Option<String>,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
