import api from './api';

export interface ProjectTaskBrief {
  id: number;
  status: 'pending' | 'running' | 'waiting_user' | 'succeeded' | 'failed' | 'stopped';
  tech_stack: string;
  ui_library: string;
  preview_port: number | null;
  sandbox_id: string | null;
  workdir_path: string | null;
  created_at: string;
}

export interface ProjectTaskDetail extends ProjectTaskBrief {
  user_id: number;
  source_history_id: number | null;
  amis_json: string;
  extra_prompt: string | null;
  claw_session_id: string | null;
  fix_attempts: number;
  adopted_at: string | null;
  updated_at: string;
}

export interface PermissionConfig {
  mode: 'read_only' | 'workspace_write' | 'danger_full_access' | 'prompt';
  allowed_tools?: string[];
}

export type LlmMode = 'auto' | 'manual' | 'default';

export interface CreateProjectTaskPayload {
  amis_json: string;
  tech_stack?: string;
  ui_library?: string;
  extra_prompt?: string;
  source_history_id?: number;
  permission_config?: PermissionConfig;
  llm_mode?: LlmMode;
  llm_provider_id?: number;
  llm_model_name?: string;
}

export interface LlmPreviewResult {
  provider_id: number;
  provider_name: string;
  model: string;
  capability_tier: string | null;
  complexity_score: number | null;
  reason: string;
}

export interface CreateProjectTaskResponse {
  id: number;
  status: string;
  sandbox_id: string;
  preview_port: number;
  claw_session_id: string;
}

export async function listProjectTasks(): Promise<ProjectTaskBrief[]> {
  const { data } = await api.get('/projects/tasks');
  return data;
}

export async function getProjectTask(id: number): Promise<ProjectTaskDetail> {
  const { data } = await api.get(`/projects/tasks/${id}`);
  return data;
}

export async function createProjectTask(
  payload: CreateProjectTaskPayload
): Promise<CreateProjectTaskResponse> {
  const { data } = await api.post('/projects/tasks', payload);
  return data;
}

export async function previewLlmSelection(amisJson: string): Promise<LlmPreviewResult> {
  const { data } = await api.post('/projects/tasks/llm-preview', { amis_json: amisJson });
  return data;
}

export async function addProjectTaskMessage(
  id: number,
  content: string
): Promise<void> {
  await api.post(`/projects/tasks/${id}/message`, { content });
}

/** B.7：把任务的代码沉淀回 RAG 样例库（采纳回流） */
export async function adoptProjectTask(
  id: number,
  payload: {
    amis_json_summary?: string;
    code_summary?: string;
    full_code?: string;
    source_team?: string;
  } = {}
): Promise<{
  ok: boolean;
  sample_id: number;
  status: 'pending' | 'approved' | 'rejected';
  file_count: number;
  sandbox_warn: string | null;
  notice: string;
}> {
  const { data } = await api.post(`/projects/tasks/${id}/adopt`, payload);
  return data;
}

export async function stopProjectTask(id: number): Promise<void> {
  await api.post(`/projects/tasks/${id}/stop`);
}

export async function getEventsHistory(id: number): Promise<any[]> {
  const { data } = await api.get(`/projects/tasks/${id}/events/history`);
  return data;
}

export interface DevStatusResponse {
  dev_status: any; // "not_started" | "starting" | {"ready": {"url": "..."}} | {"failed": {"reason": "..."}}
  recent_logs: string[];
  preview_port: number;
}

export async function getDevStatus(id: number): Promise<DevStatusResponse> {
  const { data } = await api.get(`/projects/tasks/${id}/dev-status`);
  return data;
}

export interface TaskPage {
  path: string;
  title: string;
}

export async function listTaskPages(id: number): Promise<TaskPage[]> {
  const { data } = await api.get(`/projects/tasks/${id}/pages`);
  return data.pages || [];
}

export async function sendPermissionDecision(
  id: number,
  request_id: string,
  allow: boolean,
  remember: boolean,
  reason?: string,
): Promise<void> {
  await api.post(`/projects/tasks/${id}/permission-decision`, {
    request_id,
    allow,
    remember,
    reason,
  });
}

export interface RuntimeErrorReport {
  source: string;
  message: string;
  stack?: string;
  href?: string;
}

/**
 * 上报 iframe 里浏览器端捕获的运行时错误（Vite import-analysis / HMR /
 * window.onerror / unhandledrejection），由 backend 转给 Agent 自修复。
 */
export async function reportRuntimeError(
  id: number,
  payload: RuntimeErrorReport,
): Promise<{ fix_attempts: number; max_attempts: number }> {
  const { data } = await api.post(`/projects/tasks/${id}/runtime-error`, payload);
  return data;
}

/**
 * 构造 WebSocket URL（用于订阅任务事件流）
 * 会自动处理 http → ws 协议转换和 JWT token 传递
 */
export function buildEventsWsUrl(taskId: number): string {
  const token = localStorage.getItem('token') || '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const base = `${protocol}//${window.location.host}/api/projects/tasks/${taskId}/events`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}
