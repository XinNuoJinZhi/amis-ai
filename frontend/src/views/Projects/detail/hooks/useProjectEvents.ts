import { useCallback, useEffect, useRef, useState } from 'react';
import { buildEventsWsUrl, getEventsHistory } from '../../../../services/projects';

export interface TaskEvent {
  type: string;
  data?: any;
  [k: string]: any;
}

function normalizeHistoryItem(h: any): TaskEvent {
  // 正常 claw-agent 事件：已含 type/data 字段
  if (h && typeof h === 'object' && typeof h.type === 'string') {
    return h as TaskEvent;
  }
  // 兜底：带 event_type/payload 的老 shape
  if (h && typeof h === 'object' && typeof h.event_type === 'string') {
    let inner: any = h.payload;
    if (typeof inner === 'string') {
      try {
        inner = JSON.parse(inner);
      } catch {
        inner = { raw: inner };
      }
    }
    return { type: h.event_type, data: inner, ...(inner || {}) };
  }
  return { type: 'unknown', data: h } as TaskEvent;
}

/**
 * 订阅任务 WebSocket 事件流 + 拉一次历史回放。
 * 返回累积的事件数组（供 ChatPanel / ExecutionDetailsPanel 渲染）。
 *
 * `refreshHistory` 可以被调用方触发——用于 llm_selected 这种"backend 异步 insert"事件
 * 的补齐：打开面板时如果没看到，点一下刷新可以重新拉 REST 历史（WS 不会补发）。
 */
export function useProjectEvents(taskId: number) {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const wsBufferRef = useRef<TaskEvent[]>([]);

  const fetchHistoryInto = useCallback(
    async (mode: 'replace' | 'merge') => {
      try {
        const history = await getEventsHistory(taskId);
        const normalized = (history || []).map(normalizeHistoryItem);
        setEvents((prev) => {
          if (mode === 'replace') {
            // 首次或用户主动刷新：历史 + 本地已缓存的 WS 事件合并，去重（按稳定键）
            const seen = new Set<string>();
            const merged: TaskEvent[] = [];
            for (const ev of [...normalized, ...wsBufferRef.current]) {
              const key = `${ev.type}:${JSON.stringify(ev.data ?? '')}`;
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(ev);
              }
            }
            return merged;
          }
          // merge：保留 prev（已有 WS 流事件），补齐缺失的历史事件
          const existingKeys = new Set(
            prev.map((e) => `${e.type}:${JSON.stringify(e.data ?? '')}`),
          );
          const additions = normalized.filter(
            (e) =>
              !existingKeys.has(`${e.type}:${JSON.stringify(e.data ?? '')}`),
          );
          return [...additions, ...prev];
        });
      } catch {
        /* ignore */
      }
    },
    [taskId],
  );

  useEffect(() => {
    let cancelled = false;
    wsBufferRef.current = [];

    // 先拉一次历史
    fetchHistoryInto('replace').catch(() => {});

    // 再连 WS
    const ws = new WebSocket(buildEventsWsUrl(taskId));
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      if (cancelled) return;
      try {
        const payload = JSON.parse(ev.data);
        wsBufferRef.current.push(payload);
        setEvents((prev) => [...prev, payload]);
      } catch {}
    };

    return () => {
      cancelled = true;
      ws.close();
    };
  }, [taskId, fetchHistoryInto]);

  const refreshHistory = useCallback(() => {
    // 用户主动刷新：补齐 backend 异步 insert 但 WS 没补发的事件（典型：llm_selected）
    return fetchHistoryInto('merge');
  }, [fetchHistoryInto]);

  return { events, connected, refreshHistory };
}
