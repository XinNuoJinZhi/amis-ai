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
    /// LLM 选择模式：manual / auto / default
    pub llm_mode: String,
    /// 本次任务最终使用的 provider id（manual 手动选 / auto 决策后写入）
    pub llm_provider_id: Option<i32>,
    /// 本次任务最终使用的模型名
    #[sea_orm(column_type = "Text", nullable)]
    pub llm_model_name: Option<String>,
    // 2026-04 技术栈解耦：多维选桶字段（原先 entity 缺失导致 create_task 必须 INSERT + 原生 SQL UPDATE 二次写）
    //   DB 列由 main.rs 启动时 migration 创建；此处补齐 entity 以合并写入。
    /// 目标平台（web / mobile / mini）。DB 列 VARCHAR(32) NOT NULL DEFAULT 'mobile'
    pub platform: String,
    /// 选中的底座模板名（registry.yaml 里的 name）。NULL = 从零搭建
    #[sea_orm(column_type = "Text", nullable)]
    pub template_name: Option<String>,
    /// 用户显式勾选的 skill 桶；DB text[] NOT NULL DEFAULT '{}'
    pub selected_skill_buckets: Vec<String>,
    /// 多维平台数组
    pub platforms: Vec<String>,
    /// 多维技术栈数组
    pub tech_stacks: Vec<String>,
    /// 多维 UI 库数组
    pub ui_libs: Vec<String>,
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
