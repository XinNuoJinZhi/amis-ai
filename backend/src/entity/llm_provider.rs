use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "llm_providers")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub base_url: String,
    #[serde(skip_serializing)]
    pub api_key: String,
    pub is_active: bool,
    pub created_at: DateTime,
    pub protocol: String,
    /// auto 模式的能力档位：fast / balanced / strong / frontier
    pub capability_tier: String,
    /// auto 模式下该供应商被选中时优先使用的模型名；缺失则回退到供应商 /v1/models 列表首个
    #[sea_orm(column_type = "Text", nullable)]
    pub preferred_model: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::model_config::Entity")]
    ModelConfig,
}

impl Related<super::model_config::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ModelConfig.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
