import { useEffect, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getDevStatus } from '../../../../services/projects';
import { useColors } from '../../../../theme';

interface Props {
  taskId: number;
}

export default function LogsPanel({ taskId }: Props) {
  const darkColors = useColors();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const resp = await getDevStatus(taskId);
      setLogs(resp.recent_logs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [taskId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: darkColors.bg }}>
      <div
        style={{
          height: 32,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${darkColors.borderSubtle}`,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: darkColors.textMuted,
            letterSpacing: 0.5,
          }}
        >
          dev server · tail -n 200
        </span>
        <Space size={4}>
          <Tooltip title="刷新">
            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={refresh} loading={loading} />
          </Tooltip>
        </Space>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.55,
          color: darkColors.textMuted,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: darkColors.textSubtle, textAlign: 'center', paddingTop: 40 }}>
            [ NO DEV SERVER LOGS ]
          </div>
        ) : (
          logs.map((line, i) => (
            <div key={i}>
              <span style={{ color: darkColors.textSubtle, marginRight: 8 }}>
                {String(i + 1).padStart(3, ' ')}
              </span>
              <span
                style={{
                  color:
                    /error|fail|cannot|Error/i.test(line)
                      ? darkColors.destructive
                      : /warn/i.test(line)
                        ? darkColors.warning
                        : darkColors.text,
                }}
              >
                {line}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
