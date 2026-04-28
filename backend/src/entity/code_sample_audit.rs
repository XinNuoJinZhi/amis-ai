//! RAG 样例审计 timeline：每次 approve / reject / rate / thumbs / judge / mark-negative 都写一行。
//!
//! 设计要点：
//!   - operator_kind 区分人机：admin（人工）/ system（backend 自动触发）/ llm_judge（LLM 评委回调）
//!   - action 枚举：create / approve / reject / rate / thumbs_up / thumbs_down
//!                  / mark_negative / unmark_negative / judge / update / config_change
//!   - before / after：JSONB（SeaORM 用 Json 类型），仅存"和本次动作相关"的字段差异，不是整行快照
//!   - ON DELETE CASCADE：样例被删则 audit 随删（审计表不是归档，归档走独立 ETL）

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "code_sample_audit")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub sample_id: i32,
    pub operator_id: Option<i32>,
    /// admin / system / llm_judge
    pub operator_kind: String,
    /// create / approve / reject / rate / thumbs_up / thumbs_down
    /// / mark_negative / unmark_negative / judge / update / config_change
    pub action: String,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub before_json: Option<Json>,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub after_json: Option<Json>,
    #[sea_orm(column_type = "Text", nullable)]
    pub note: Option<String>,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
