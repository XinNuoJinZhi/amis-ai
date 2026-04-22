import { useEffect, useRef, useState } from 'react';
import { buildEventsWsUrl, getEventsHistory } from '../../../../services/projects';

export interface TaskEvent {
  type: string;
  data?: any;
  [k: string]: any;
}

/**
 * 订阅任务 WebSocket 事件流 + 拉一次历史回放。
 * 返回累积的事件数组（供 ChatPanel 渲染）。
 */
export function useProjectEvents(taskId: number) {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    // 先拉历史。后端 list_events_history 直接把每条事件的 payload JSON 返回
    // （已经是 {type, data, ...} 扁平结构），前端原样用即可；只是某些早期 backend 写入的
    // 事件（如 scaffold_copied）payload 里没带 type，用 event_type 兜底。
    getEventsHistory(taskId)
      .then((history) => {
        if (cancelled) return;
        const normalized = (history || []).map((h: any): TaskEvent => {
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
        });
        setEvents(normalized);
      })
      .catch(() => {});

    // 再连 WS
    const ws = new WebSocket(buildEventsWsUrl(taskId));
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        setEvents((prev) => [...prev, payload]);
      } catch {}
    };

    return () => {
      cancelled = true;
      ws.close();
    };
  }, [taskId]);

  return { events, connected };
}
