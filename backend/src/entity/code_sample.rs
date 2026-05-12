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
    /// 1.6 W1 · A：page-bad 自动入库时溯源到原 page（与 source_task_id 配套；手动入库为 null）
    pub source_page_id: Option<i32>,
    pub created_at: DateTime,
    pub updated_at: DateTime,

    // ─────── 2026-04 RAG 质量闭环扩展（Phase 0 基建，列默认值保证旧数据兼容）───────

    /// Phase 1 埋点：admin 竖起大拇指计数（默认 0）
    #[sea_orm(default_value = 0)]
    pub thumbs_up: i32,
    /// Phase 1 埋点：admin 竖起大拇指反向计数（默认 0）
    #[sea_orm(default_value = 0)]
    pub thumbs_down: i32,

    /// Phase 1 主观评分：0-5 浮点，null 表示未评
    #[sea_orm(column_type = "Float", nullable)]
    pub rating: Option<f32>,
    /// 最后一次评分的备注（admin 审核意见，可选）
    #[sea_orm(column_type = "Text", nullable)]
    pub rating_note: Option<String>,
    /// 最后一次评分的 user id（冗余，便于详情页快速展示，真正历史走 audit 表）
    pub rating_by: Option<i32>,
    pub rating_at: Option<DateTime>,

    /// Phase 2 LLM-judge 二元评委结果：good / needs_review / bad
    #[sea_orm(column_type = "Text", nullable)]
    pub quality_verdict: Option<String>,
    /// 评委 reason 说明（由 LLM 返回，截断后存入）
    #[sea_orm(column_type = "Text", nullable)]
    pub quality_reason: Option<String>,
    pub quality_judge_at: Option<DateTime>,
    /// 记录评分所用的模型名（用于追溯，避免切 provider 后数据解读歧义）
    #[sea_orm(column_type = "Text", nullable)]
    pub quality_judge_model: Option<String>,

    /// Phase 4 负例：true 表示此样例是"反面教材"，会被 RAG 反向召回
    #[sea_orm(default_value = false)]
    pub is_negative: bool,
    /// 反面教材分类：structural / stylistic / full
    #[sea_orm(column_type = "Text", nullable)]
    pub negative_kind: Option<String>,
    /// 负例 / 拒绝理由（供审核复盘 + 负例注入时给 LLM 解释为什么这是反例）
    #[sea_orm(column_type = "Text", nullable)]
    pub rejection_reason: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
