import { useEffect, useState } from 'react';
import { Badge, Card, Progress, Tag } from 'antd';
import api from '../../../../services/api';

interface PageRow {
  id: number;
  page_idx: number;
  route_path: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  error_msg?: string | null;
}

const STATUS_COLOR: Record<PageRow['status'], 'default' | 'processing' | 'success' | 'error'> = {
  pending: 'default',
  running: 'processing',
  done: 'success',
  failed: 'error',
};

export default function PagesPanel({ taskId }: { taskId: number }) {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [reuseRate, setReuseRate] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r1 = await api.get<PageRow[]>(`/projects/tasks/${taskId}/db-pages`);
        if (!cancelled) setPages(r1.data);
      } catch {
        /* ignore */
      }
      try {
        const r2 = await api.get<{ reuse_rate: number }>(
          `/projects/tasks/${taskId}/reuse-rate`
        );
        if (!cancelled) setReuseRate(r2.data.reuse_rate);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [taskId]);

  const doneCount = pages.filter((p) => p.status === 'done').length;
  const totalCount = pages.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Card title="多页面任务" size="small" style={{ marginBottom: 12 }}>
      <Progress percent={progress} format={() => `${doneCount}/${totalCount}`} />
      {reuseRate !== null && (
        <div style={{ marginTop: 8 }}>
          复用率：
          <Tag color={reuseRate >= 0.6 ? 'green' : reuseRate >= 0.3 ? 'orange' : 'red'}>
            {(reuseRate * 100).toFixed(1)}%
          </Tag>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {pages.map((p) => (
          <div
            key={p.id}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}
          >
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              <Badge status={STATUS_COLOR[p.status]} /> #{p.page_idx} {p.route_path}
            </span>
            {p.error_msg && <Tag color="red">{p.error_msg.slice(0, 30)}</Tag>}
          </div>
        ))}
      </div>
    </Card>
  );
}
