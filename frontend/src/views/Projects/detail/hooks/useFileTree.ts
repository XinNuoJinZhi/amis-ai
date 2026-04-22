import { useCallback, useEffect, useState } from 'react';
import { getFsTree, type FsNode } from '../../../../services/ide';

export function useFileTree(taskId: number, enabled: boolean) {
  const [nodes, setNodes] = useState<FsNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getFsTree(taskId, 6);
      setNodes(resp.nodes);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || '加载文件树失败');
    } finally {
      setLoading(false);
    }
  }, [taskId, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { nodes, loading, error, refresh };
}
