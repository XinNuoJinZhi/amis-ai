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
  /**
   * @deprecated 2026-04 Phase 4.4 起前端不再发送。backend 会从 `tech_stacks[0]` 自动推导。
   * 仅留作类型兼容，供**非前端直连调用方**（如脚本、Postman）继续可用。
   */
  tech_stack?: string;
  /** @deprecated 同 `tech_stack`，新客户端请用 `ui_libs` 数组。 */
  ui_library?: string;
  extra_prompt?: string;
  source_history_id?: number;
  permission_config?: PermissionConfig;
  llm_mode?: LlmMode;
  llm_provider_id?: number;
  llm_model_name?: string;
  // 2026-04 多维字段
  platform?: string | null;
  tech_stacks?: string[];
  ui_libs?: string[];
  /** null 或 `__blank__` = 从零搭建 */
  template_name?: string | null;
  explicit_buckets?: string[];
  /**
   * 2026-04-25 实验功能：启用确定性翻译器（amis-translator）。
   * - 默认 / false：走 LLM 流水线（生产稳定路径）
   * - true：先试翻译器一比一翻译 Amis JSON 跳过 LLM，降级则回退 LLM
   */
  enable_translator?: boolean;
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

/** 单条硬删除：连带清沙箱、workdir、messages、events。不可恢复。 */
export async function deleteProjectTask(id: number): Promise<void> {
  await api.delete(`/projects/tasks/${id}`);
}

export interface BatchDeleteResult {
  deleted: number[];
  failed: { id: number; error: string }[];
}

/** 批量硬删除：失败的任务通过 `failed` 数组返回，不阻断其余 ID。 */
export async function batchDeleteProjectTasks(ids: number[]): Promise<BatchDeleteResult> {
  const { data } = await api.post('/projects/tasks/batch-delete', { ids });
  return data;
}

/** 阶段 4：让 LLM 对本次任务做事后复盘。admin-only。 */
export interface AnalyzeIssue {
  aspect: string;
  problem: string;
  suggestion: string;
}
export interface AnalyzeTaskResult {
  overall_quality: string;
  issues: AnalyzeIssue[];
  suggested_skill_edits: string[];
  suggested_rag_samples_to_add: string | null;
  raw: string;
  analyzer_provider: string;
  analyzer_model: string;
}
export async function analyzeProjectTask(id: number): Promise<AnalyzeTaskResult> {
  const { data } = await api.post(`/projects/tasks/${id}/analyze`);
  return data;
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

// ──────────────── 2026-04-25 任务追踪日志归档 ────────────────

export interface TaskTracelogInfo {
  mode: string; // disabled / smart / all_tasks
  task_id: number;
  exists: boolean;
  is_archive: boolean; // tar.gz 已打包
  path: string;
  size_bytes: number;
  files_count: number;
}

export async function getTaskTracelogInfo(taskId: number): Promise<TaskTracelogInfo> {
  const { data } = await api.get(`/projects/tasks/${taskId}/tracelog`);
  return data;
}

/** Phase E：列出归档里所有可读文件（白名单过滤后），供 Drawer 左侧文件树 */
export async function listTaskTracelogFiles(taskId: number): Promise<{ files: string[] }> {
  const { data } = await api.get(`/projects/tasks/${taskId}/tracelog/ls`);
  return data;
}

/** Phase E：读单文件内容（路径白名单 + 1MB 截断） */
export async function readTaskTracelogFile(
  taskId: number,
  path: string,
): Promise<{ path: string; content: string; size: number }> {
  const { data } = await api.get(`/projects/tasks/${taskId}/tracelog/file`, {
    params: { path },
  });
  return data;
}

/** 触发浏览器下载 task-{id}.tar.gz（用 fetch+blob 才能塞 Authorization header） */
export function downloadTaskTracelog(taskId: number) {
  const token = localStorage.getItem('token') || '';
  const url = `${api.defaults.baseURL ?? ''}/projects/tasks/${taskId}/tracelog/download`;
  void fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.blob();
    })
    .then((blob) => {
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `task-${taskId}.tar.gz`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    })
    .catch((e: unknown) => {
      // eslint-disable-next-line no-alert
      alert(`下载失败：${(e as Error).message ?? e}`);
    });
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
