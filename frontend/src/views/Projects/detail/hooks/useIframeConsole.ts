import { useEffect } from 'react';
import { useIdeStore } from '../../../../stores/ide';
import { reportRuntimeError } from '../../../../services/projects';

/**
 * 监听 iframe 发来的 postMessage：
 *   - `amis-ai/runtime-error`  → 上报给 backend 触发 Agent 修复（已有机制）
 *   - `amis-ai/console`        → 追加到 IDE 控制台面板（本次新增）
 */
export function useIframeConsole(taskId: number) {
  const appendConsole = useIdeStore((s) => s.appendConsole);

  useEffect(() => {
    let lastReport = 0;
    const handler = (e: MessageEvent) => {
      const data: any = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'amis-ai/console') {
        appendConsole({
          level: data.level ?? 'log',
          args: Array.isArray(data.args) ? data.args : [String(data.args)],
          ts: typeof data.ts === 'number' ? data.ts : Date.now(),
          stack: typeof data.stack === 'string' ? data.stack : undefined,
        });
        return;
      }

      if (data.type === 'amis-ai/runtime-error') {
        // 3 秒节流，避免错误风暴把后端打炸
        const now = Date.now();
        if (now - lastReport < 3000) return;
        lastReport = now;
        reportRuntimeError(taskId, {
          source: data.source || 'unknown',
          message: data.message || '',
          stack: data.stack,
          href: data.href,
        }).catch(() => {});
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [taskId, appendConsole]);
}
