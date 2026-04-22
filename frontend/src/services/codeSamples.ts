// B.4：RAG 样例库 CRUD API 客户端
// 后端实现见 backend/src/handlers/code_samples.rs

import api from './api';

export type SampleStatus = 'pending' | 'approved' | 'rejected';

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
