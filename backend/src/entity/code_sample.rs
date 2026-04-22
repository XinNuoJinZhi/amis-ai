//! 反向飞轮的核心数据：把"采纳过的代码生成结果"沉淀回 RAG 样例库。
//!
//! 来源（source_team）支持跨团队混合（D4 决策）：
//!   - "amis-ai"：本平台自身飞轮采纳的样例
//!   - "zc-amis" / 其他：外部团队（如 ZC Amis）的样例
//!
//! 状态流：
//!   - `pending`：刚入库，等人审核
//!   - `approved`：参与 RAG 检索
//!   - `rejected`：永久排除（保留历史，不删）
//!
//! 注意：`embedding vector(1536)` 列由 SeaORM 不支持，main.rs 用 execute_unprepared 单独建。
//! 与 amis_templates 同一套思路。

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "code_samples")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    /// 技术栈，例：uniapp-wot-h5、react-element、vue3-element
    pub tech_stack: String,
    /// 知识来源团队，例：amis-ai、zc-amis
    pub source_team: String,
    /// 该样例对应的 Amis JSON 的人类可读摘要（用于检索时展示和 embedding 输入）
    #[sea_orm(column_type = "Text", nullable)]
    pub amis_json_summary: Option<String>,
    /// 生成代码的人类可读摘要
    #[sea_orm(column_type = "Text", nullable)]
    pub code_summary: Option<String>,
    /// 完整的 Amis JSON（不进 prompt，仅用于详情展示和复用）
    #[sea_orm(column_type = "Text")]
    pub full_amis_json: String,
    /// 完整的生成代码（多文件用 markdown fenced 拼成单串）
    #[sea_orm(column_type = "Text")]
    pub full_code: String,
    /// pending / approved / rejected
    pub status: String,
    /// 被检索命中的次数（B.5 检索时 +1，可用于权重/降权）
    pub hit_count: i32,
    /// 来源任务（可选；冷启动手动入库时为 null）
    pub source_task_id: Option<i32>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
