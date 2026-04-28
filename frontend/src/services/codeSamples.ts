// B.4：RAG 样例库 CRUD API 客户端
// 后端实现见 backend/src/handlers/code_samples.rs
//
// 2026-04 质量闭环扩展（Phase 0+）：
//   - 列表行补 thumbs / rating / verdict / negative 字段
//   - 新增 /stats · /pending-count · /:id/audit 读操作
//   - 新增 /:id/feedback · /:id/rating · /:id/mark-negative · /:id/unmark-negative 写操作

import api from './api';

export type SampleStatus = 'pending' | 'approved' | 'rejected';
export type QualityVerdict = 'good' | 'needs_review' | 'bad';
export type NegativeKind = 'structural' | 'stylistic' | 'full';

/** 列表行（不含 full_amis_json / full_code，详情页才拉） */
export interface CodeSampleListRow {
  id: number;
  tech_stack: string;
  source_team: string;
  amis_json_summary: string | null;
  code_summary: string | null;
  status: SampleStatus;
  hit_count: number;
  source_task_id: number | null;
  created_at: string;
  updated_at: string;
  // 2026-04 多维标签（可选，backend 可能旧版本不返回）
  platforms?: string[];
  tech_stacks?: string[];
  ui_libs?: string[];
  tags?: string[];
  // 2026-04 质量闭环
  thumbs_up?: number;
  thumbs_down?: number;
  rating?: number | null;
  rating_at?: string | null;
  quality_verdict?: QualityVerdict | null;
  quality_judge_at?: string | null;
  quality_judge_model?: string | null;
  is_negative?: boolean;
  negative_kind?: NegativeKind | null;
}

export interface ListResponse {
  items: CodeSampleListRow[];
  total: number;
  page: number;
  page_size: number;
}

export interface CodeSampleDetail extends CodeSampleListRow {
  full_amis_json: string;
  full_code: string;
  rating_note?: string | null;
  rating_by?: number | null;
  quality_reason?: string | null;
  rejection_reason?: string | null;
}

export interface ListParams {
  status?: SampleStatus | '';
  tech_stack?: string;
  source_team?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export async function listCodeSamples(params: ListParams = {}): Promise<ListResponse> {
  const { data } = await api.get('/code-samples', { params });
  return data;
}

export async function getCodeSample(id: number): Promise<CodeSampleDetail> {
  const { data } = await api.get(`/code-samples/${id}`);
  return data;
}

export interface CreateSamplePayload {
  tech_stack: string;
  source_team?: string;
  amis_json_summary?: string;
  code_summary?: string;
  full_amis_json: string;
  full_code: string;
  status?: SampleStatus;
  source_task_id?: number | null;
}

export async function createCodeSample(payload: CreateSamplePayload): Promise<{
  ok: boolean;
  id: number;
  status: SampleStatus;
  notice: string;
}> {
  const { data } = await api.post('/code-samples', payload);
  return data;
}

export interface UpdateSamplePayload {
  amis_json_summary?: string;
  code_summary?: string;
  full_amis_json?: string;
  full_code?: string;
  status?: SampleStatus;
  tech_stack?: string;
  source_team?: string;
  /** true 时 backend 会重新调 Python agent 向量化 */
  revectorize?: boolean;
}

export async function updateCodeSample(
  id: number,
  payload: UpdateSamplePayload
): Promise<{ ok: boolean; sample: CodeSampleDetail }> {
  const { data } = await api.put(`/code-samples/${id}`, payload);
  return data;
}

export async function deleteCodeSample(id: number): Promise<void> {
  await api.delete(`/code-samples/${id}`);
}

export async function approveCodeSample(id: number): Promise<void> {
  await api.post(`/code-samples/${id}/approve`);
}

export async function rejectCodeSample(id: number): Promise<void> {
  await api.post(`/code-samples/${id}/reject`);
}

// ════════════════════════════════════════════════════════════════════════════
// 2026-04 质量闭环扩展（Phase 0+ / Phase 1+ / Phase 4+）
// ════════════════════════════════════════════════════════════════════════════

export interface SampleStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  negative: number;
  rated_count: number;
  avg_rating: number | null;
  judge_covered: number;
  judge_good: number;
  judge_good_pct: number | null;
  thumbs_up_total: number;
  thumbs_down_total: number;
}

export async function getSampleStats(): Promise<SampleStats> {
  const { data } = await api.get('/code-samples/stats');
  return data;
}

export async function getPendingCount(): Promise<{ pending: number }> {
  const { data } = await api.get('/code-samples/pending-count');
  return data;
}

export type AuditAction =
  | 'create'
  | 'approve'
  | 'reject'
  | 'rate'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'mark_negative'
  | 'unmark_negative'
  | 'judge'
  | 'update'
  | 'config_change';

export type OperatorKind = 'admin' | 'system' | 'llm_judge';

export interface AuditRow {
  id: number;
  sample_id: number;
  operator_id: number | null;
  operator_kind: OperatorKind;
  action: AuditAction;
  before_json: unknown | null;
  after_json: unknown | null;
  note: string | null;
  created_at: string;
}

export async function getSampleAudit(id: number): Promise<{ items: AuditRow[] }> {
  const { data } = await api.get(`/code-samples/${id}/audit`);
  return data;
}

// Phase 1：thumbs 埋点（不入 ranking 除非 admin 开 rag.weighting.enabled）
export async function submitFeedback(
  id: number,
  kind: 'up' | 'down'
): Promise<{ ok: boolean; column: string; value: number }> {
  const { data } = await api.post(`/code-samples/${id}/feedback`, { kind });
  return data;
}

// Phase 1：人工 rating 0-5（null 清除）
export async function submitRating(
  id: number,
  payload: { rating: number | null; note?: string }
): Promise<{ ok: boolean; sample: CodeSampleDetail }> {
  const { data } = await api.put(`/code-samples/${id}/rating`, payload);
  return data;
}

// Phase 4：负例标记（默认 also_reject=true 把 status 也改成 rejected）
export interface MarkNegativePayload {
  negative_kind: NegativeKind;
  rejection_reason?: string;
  also_reject?: boolean;
}

export async function markNegative(
  id: number,
  payload: MarkNegativePayload
): Promise<{ ok: boolean; sample: CodeSampleDetail }> {
  const { data } = await api.post(`/code-samples/${id}/mark-negative`, payload);
  return data;
}

export async function unmarkNegative(
  id: number
): Promise<{ ok: boolean; sample: CodeSampleDetail }> {
  const { data } = await api.post(`/code-samples/${id}/unmark-negative`);
  return data;
}

// Phase 2：LLM-judge 异步评分（返回 queued 状态，实际结果通过刷新或 audit 看）
export async function scoreSampleAsync(
  id: number
): Promise<{ ok: boolean; sample_id: number; status: string; notice: string }> {
  const { data } = await api.post(`/code-samples/${id}/score-async`);
  return data;
}

export interface BatchScorePayload {
  /** 指定 ID 列表（与 scope 二选一） */
  ids?: number[];
  /** "pending_only" / "all_unscored" */
  scope?: 'pending_only' | 'all_unscored';
  /** 本批最多处理多少条（后端默认 20） */
  limit?: number;
}

export async function batchScore(
  payload: BatchScorePayload
): Promise<{ ok: boolean; queued: number; sample_ids: number[]; notice: string }> {
  const { data } = await api.post('/code-samples/batch-score', payload);
  return data;
}

// Phase 3/4 A/B 报告：对比配置变更前后两段时间窗的飞轮 health
export interface AbBucket {
  from: string;
  to: string;
  total: number;
  succeeded: number;
  failed: number;
  in_flight: number;
  adopted: number;
  avg_fix_attempts: number;
  succeed_rate: number;
  fail_rate: number;
  /** 分母是 succeeded（避免失败任务污染信号）*/
  adopt_rate: number;
}

export interface AbDiff {
  succeed_rate: number;
  adopt_rate: number;
  fail_rate: number;
  avg_fix_attempts: number;
  total_delta: number;
  adopted_delta: number;
}

export interface AbReportResponse {
  a: AbBucket;
  b: AbBucket | null;
  diff: AbDiff | null;
  notice: string;
}

export async function getAbReport(params: {
  from_a: string;
  to_a: string;
  from_b?: string;
  to_b?: string;
}): Promise<AbReportResponse> {
  const { data } = await api.get('/code-samples/ab-report', { params });
  return data;
}
