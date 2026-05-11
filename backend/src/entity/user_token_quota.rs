//! 1.4 A.3：用户 LLM token 配额表。
//!
//! 设计：
//!   - 每用户独立配额，daily_budget 默认从 system_settings.llm.quota.default_daily_budget 拉
//!   - used_today 在 create_task 时累加 estimated_cost_tokens（同步消耗，避免短时并发超额）
//!   - reset_at 距今 ≥24h → 惰性重置（无需 cron，下次访问时 used_today 归零）
//!   - 主流程：services::quota::check_and_consume_quota(state, user_id, estimated)

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "user_token_quota")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub user_id: i32,
    /// 日 token 预算
    pub daily_budget: i32,
    /// 当日已消耗 token（含尚未跑完任务的预估值）
    pub used_today: i32,
    /// 上次重置时间，距今 >= 24h 触发归零
    pub reset_at: DateTime,
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
