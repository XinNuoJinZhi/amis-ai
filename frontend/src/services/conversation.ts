// 通用 AI 对话（左侧菜单「AI 对话」）的服务层。
// 与「Amis 生成」（services/projects.ts）走完全不同的后端，task_type=chat。
import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ConversationSession {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: number;
  role: ChatRole;
  content: string;
  model?: string | null;
  provider?: string | null;
  created_at: string;
}

export interface SessionDetail extends ConversationSession {
  messages: ConversationMessage[];
}

export interface ChatStreamMeta {
  user_message: ConversationMessage;
  model: string;
  provider: string;
  /** 仅会话首条用户消息触发自动改名时返回，其它情况为 null */
  title: string | null;
}

export interface ChatStreamHandlers {
  onMeta?: (meta: ChatStreamMeta) => void;
  onChunk?: (text: string) => void;
  /** 流正常结束、assistant 消息已落库时回调 */
  onFinal?: (assistantMessage: ConversationMessage) => void;
  onError?: (err: string) => void;
}

// ─── Sessions CRUD ───────────────────────────────────────────────────────

export async function listSessions(): Promise<ConversationSession[]> {
  const { data } = await api.get('/conversation/sessions');
  return data?.sessions ?? [];
}

export async function createSession(): Promise<ConversationSession> {
  const { data } = await api.post('/conversation/sessions');
  return data;
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  const { data } = await api.get(`/conversation/sessions/${sessionId}`);
  return data;
}

export async function renameSession(
  sessionId: string,
  title: string,
): Promise<ConversationSession> {
  const { data } = await api.patch(`/conversation/sessions/${sessionId}`, { title });
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/conversation/sessions/${sessionId}`);
}

// ─── Streaming chat ──────────────────────────────────────────────────────

/**
 * 调用流式 chat：`POST /api/conversation/sessions/:id/chat/stream`。
 *
 * 后端 SSE 事件：
 *   - `meta`  : `{ user_message, model, provider, title }`
 *   - `chunk` : `{ text }`
 *   - `final` : `{ assistant_message }`
 *   - `error` : `{ error }`
 *
 * 返回的 Promise 在流自然结束（拿到 final / error 或服务端关连接）后 resolve。
 * 调用方可通过 AbortSignal 主动取消。
 */
export async function chatStream(
  sessionId: string,
  content: string,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('token') || '';
  const resp = await fetch(`/api/conversation/sessions/${sessionId}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!resp.ok) {
    let errText = `HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      if (j?.error) errText = j.error;
    } catch {
      /* body 不是 JSON */
    }
    handlers.onError?.(errText);
    if (resp.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return;
  }
  if (!resp.body) {
    handlers.onError?.('响应体为空');
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const dispatch = (block: string) => {
    let event = 'message';
    let data = '';
    for (const raw of block.split('\n')) {
      const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const part = line.slice(5).replace(/^ /, '');
        data = data ? `${data}\n${part}` : part;
      }
    }
    if (!data && event === 'message') return;
    try {
      const parsed = data ? JSON.parse(data) : {};
      if (event === 'meta') {
        handlers.onMeta?.(parsed as ChatStreamMeta);
      } else if (event === 'chunk') {
        if (typeof parsed.text === 'string') handlers.onChunk?.(parsed.text);
      } else if (event === 'final') {
        if (parsed.assistant_message) handlers.onFinal?.(parsed.assistant_message);
      } else if (event === 'error') {
        handlers.onError?.(parsed.error || data);
      }
    } catch {
      if (event === 'error') handlers.onError?.(data);
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      // SSE 容许 \r\n / \n 作行结束；先 normalize 成 \n
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let idx = buffer.indexOf('\n\n');
      while (idx >= 0) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        dispatch(block);
        idx = buffer.indexOf('\n\n');
      }
    }
    if (buffer.trim()) dispatch(buffer);
  } catch (e: unknown) {
    if ((e as { name?: string })?.name === 'AbortError') {
      // 主动取消，不当作错误
      return;
    }
    const msg = e instanceof Error ? e.message : String(e);
    handlers.onError?.(`读流失败: ${msg}`);
  }
}
