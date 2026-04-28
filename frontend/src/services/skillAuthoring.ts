// Synthetic Honey：Skill 桶 AI 起草前端 API 客户端
// 后端路由见 backend/src/handlers/skill_authoring.rs
//
// 走传统 JSON 的部分经 axios（统一 JWT / 401 处理）；
// 流式生成接口用原生 fetch + ReadableStream（SSE），
// 因为 axios 对 SSE 支持差，直接 fetch 最简单（鉴权手动带）。

import api from './api';

// ───────────────────────── 类型

export type AuthoringMode = 'draft_bucket' | 'clone_bucket';
export type AuthoringStatus =
  | 'draft'
  | 'streaming'
  | 'ready'
  | 'adopted'
  | 'abandoned'
  | 'failed';

export interface AuthoringIntent {
  mode: AuthoringMode;
  dir_name: string;
  display_name: string;
  description: string;
  target_stack: string;
  reference_bucket_ids: string[];
  extra_context?: string | null;
}

export interface DraftFile {
  path: string;
  size: number;
  mtime_unix: number;
  lines: number;
}

export interface SessionSnapshot {
  session_id: string;
  status: AuthoringStatus;
  mode: AuthoringMode;
  intent: AuthoringIntent;
  llm_model: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  drafts: DraftFile[];
}

export interface CreateSessionResponse {
  session_id: string;
  status: AuthoringStatus;
  expires_at: string;
  draft_dir: string;
}

export interface DraftReadResponse {
  session_id: string;
  path: string;
  content: string;
  size: number;
  mtime_unix: number | null;
  truncated: boolean;
}

export interface DraftWriteResponse {
  ok: boolean;
  session_id: string;
  path: string;
  size: number;
  mtime_unix: number | null;
}

export type ConflictPolicy = 'overwrite' | 'skip' | 'rename';

export interface AdoptRequest {
  mode: 'new_bucket' | 'merge_existing';
  target_bucket: string;
  selected_paths: string[];
  conflict_policy: ConflictPolicy;
}

export interface AdoptResponse {
  ok: boolean;
  bucket: string;
  written: string[];
  skipped: string[];
  renamed: { from: string; to: string }[];
}

// SSE 事件（供前端向导流式消费）
export type SseEventType =
  | 'meta'
  | 'file-start'
  | 'data'
  | 'file-end'
  | 'file-rejected'
  | 'done'
  | 'backend-summary'
  | 'error';

export interface SseEvent {
  event: SseEventType;
  data: Record<string, unknown>;
}

// ───────────────────────── 普通 CRUD

export async function createAuthoringSession(intent: AuthoringIntent): Promise<CreateSessionResponse> {
  const { data } = await api.post('/skills/authoring/sessions', intent);
  return data;
}

export async function getAuthoringSession(sessionId: string): Promise<SessionSnapshot> {
  const { data } = await api.get(`/skills/authoring/sessions/${encodeURIComponent(sessionId)}`);
  return data;
}

export async function deleteAuthoringSession(sessionId: string): Promise<void> {
  await api.delete(`/skills/authoring/sessions/${encodeURIComponent(sessionId)}`);
}

export async function readAuthoringDraft(
  sessionId: string,
  path: string
): Promise<DraftReadResponse> {
  const { data } = await api.get(
    `/skills/authoring/sessions/${encodeURIComponent(sessionId)}/draft`,
    { params: { path } }
  );
  return data;
}

export async function writeAuthoringDraft(
  sessionId: string,
  payload: { path: string; content: string; base_mtime_unix?: number | null }
): Promise<DraftWriteResponse> {
  const { data } = await api.put(
    `/skills/authoring/sessions/${encodeURIComponent(sessionId)}/draft`,
    payload
  );
  return data;
}

export async function adoptAuthoringSession(
  sessionId: string,
  req: AdoptRequest
): Promise<AdoptResponse> {
  const { data } = await api.post(
    `/skills/authoring/sessions/${encodeURIComponent(sessionId)}/adopt`,
    req
  );
  return data;
}

// ───────────────────────── SSE：单文件片段改写

export interface RewriteRequest {
  path: string;
  selection_start_line: number;
  selection_end_line: number;
  direction: string;
  full_file_for_context?: boolean;
}

/**
 * 调 `/api/skills/:bucket/rewrite`，流式把 meta/data/done/error 事件推给回调。
 * done 事件的 `data.new_selection` 是清洗过的新片段正文；调用方拿去替换本地选区。
 */
export async function streamRewriteFragment(
  bucket: string,
  req: RewriteRequest,
  onEvent: (ev: SseEvent) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const token = localStorage.getItem('token') || '';
  const resp = await fetch(
    `/api/skills/${encodeURIComponent(bucket)}/rewrite`,
    {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
      signal: options?.signal,
    }
  );
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`改写失败 HTTP ${resp.status}: ${text.slice(0, 300)}`);
  }
  if (!resp.body) {
    throw new Error('改写失败：响应体为空');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let currentEvent = '';
  let currentData = '';

  const flush = () => {
    if (currentData) {
      const evName = (currentEvent || 'message') as SseEventType;
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(currentData);
      } catch {
        parsed = { raw: currentData };
      }
      onEvent({ event: evName, data: parsed });
    }
    currentEvent = '';
    currentData = '';
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx = buffer.indexOf('\n');
    while (idx >= 0) {
      const raw = buffer.slice(0, idx);
      const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
      buffer = buffer.slice(idx + 1);
      if (line === '') {
        flush();
      } else if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        currentData = currentData
          ? currentData + '\n' + line.slice(5).replace(/^\s/, '')
          : line.slice(5).replace(/^\s/, '');
      }
      idx = buffer.indexOf('\n');
    }
  }
  flush();
}

// ───────────────────────── SSE：整桶流式生成

/**
 * 触发整桶流式生成，把每个 SSE 事件喂给 `onEvent` 回调。
 *
 * 约定：
 * - 所有事件对应 `SseEventType` 里的一种；
 * - `data` 是已 JSON.parse 好的对象（data 原文 JSON 串由后端统一发）；
 * - 发生网络错误或 HTTP 非 2xx 时抛异常（调用方 try/catch）。
 */
export async function streamAuthoringGenerate(
  sessionId: string,
  onEvent: (ev: SseEvent) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const token = localStorage.getItem('token') || '';
  const resp = await fetch(
    `/api/skills/authoring/sessions/${encodeURIComponent(sessionId)}/generate`,
    {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: options?.signal,
    }
  );

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`生成失败 HTTP ${resp.status}: ${text.slice(0, 300)}`);
  }
  if (!resp.body) {
    throw new Error('生成失败：响应体为空');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let currentEvent = '';
  let currentData = '';

  const flush = () => {
    if (currentData) {
      const evName = (currentEvent || 'message') as SseEventType;
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(currentData);
      } catch {
        parsed = { raw: currentData };
      }
      onEvent({ event: evName, data: parsed });
    }
    currentEvent = '';
    currentData = '';
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx = buffer.indexOf('\n');
    while (idx >= 0) {
      const raw = buffer.slice(0, idx);
      const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
      buffer = buffer.slice(idx + 1);
      if (line === '') {
        flush();
      } else if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        currentData = currentData
          ? currentData + '\n' + line.slice(5).replace(/^\s/, '')
          : line.slice(5).replace(/^\s/, '');
      }
      idx = buffer.indexOf('\n');
    }
  }
  // 流结束收尾（最后一个事件可能没有空行结尾）
  flush();
}
