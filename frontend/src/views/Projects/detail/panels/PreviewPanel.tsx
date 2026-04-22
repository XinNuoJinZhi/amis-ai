import { useEffect, useState } from 'react';
import { Button, Select, Tooltip, Space } from 'antd';
import { ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import { listTaskPages, getDevStatus, type TaskPage } from '../../../../services/projects';
import { useColors } from '../../../../theme';

interface Props {
  taskId: number;
  previewPort: number | null;
  devReady: boolean;
}

export default function PreviewPanel({ taskId, previewPort, devReady }: Props) {
  const darkColors = useColors();
  const [pages, setPages] = useState<TaskPage[]>([]);
  const [page, setPage] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!devReady) return;
    listTaskPages(taskId).then((p) => {
      setPages(p);
      if (p.length > 0 && !page) setPage(p[0].path);
    }).catch(() => {});
  }, [taskId, devReady]);

  // Fallback：dev 状态切换时刷新 previewPort
  useEffect(() => {
    if (devReady && previewPort == null) {
      getDevStatus(taskId).catch(() => {});
    }
  }, [taskId, devReady, previewPort]);

  // 脚手架 manifest.json 里 h5.router.mode = "history"，所以 URL 直接用路径（无 /#/）
  // listTaskPages 返回的 path 形如 "pages/index/index"（无前导 /），需要补上
  const src = (() => {
    if (!previewPort || !devReady) return null;
    const base = `http://localhost:${previewPort}`;
    if (!page) return `${base}/`;
    const normalized = page.startsWith('/') ? page : `/${page}`;
    return `${base}${normalized}`;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: darkColors.bg, minWidth: 0 }}>
      <div
        style={{
          height: 36,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${darkColors.borderSubtle}`,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span className={devReady ? 'v0-pulse' : ''} style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: devReady ? darkColors.accentCyan : darkColors.textSubtle,
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: darkColors.textMuted,
            letterSpacing: 0.4,
          }}>
            PREVIEW{previewPort ? ` · :${previewPort}` : ''}
          </span>
          {pages.length > 0 && (
            <Select
              size="small"
              value={page || undefined}
              onChange={setPage}
              options={pages.map((p) => ({
                label: p.title || p.path,
                value: p.path,
              }))}
              style={{ minWidth: 160, maxWidth: 260 }}
              placeholder="选择页面"
            />
          )}
        </div>
        <Space size={4}>
          <Tooltip title="刷新">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => setReloadKey((k) => k + 1)}
              style={{ color: darkColors.textMuted }}
            />
          </Tooltip>
          {src && (
            <Tooltip title="新窗口打开">
              <Button
                size="small"
                type="text"
                icon={<ExportOutlined />}
                onClick={() => window.open(src, '_blank')}
                style={{ color: darkColors.textMuted }}
              />
            </Tooltip>
          )}
        </Space>
      </div>
      <div style={{ flex: 1, background: '#FFFFFF', overflow: 'hidden', position: 'relative' }}>
        {src ? (
          // key 绑定到 reloadKey + page：换页时强制重建 iframe，
          // 绕开"仅 hash 变化不触发 iframe 重新导航"的浏览器怪行为
          <iframe
            key={`${reloadKey}-${page || 'root'}`}
            src={src}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#FFFFFF',
            }}
            title="preview"
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: darkColors.bg,
              color: darkColors.textSubtle,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            [ WAITING FOR DEV SERVER ]
          </div>
        )}
      </div>
    </div>
  );
}
