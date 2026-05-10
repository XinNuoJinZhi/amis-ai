import { useEffect, useState } from 'react';
import { Button, Space, Tooltip, message } from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { addProjectTaskMessage, getDevStatus } from '../../../../services/projects';
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

  /**
   * 把 dev server 日志塞到 agent 对话里。
   * 复用 ConsolePanel 同款机制（addProjectTaskMessage + inject-source 标记）。
   * onlyErrors=true 时只塞 error/fail/cannot 行；false 时塞最近 100 行。
   */
  const injectToChat = async (onlyErrors: boolean) => {
    const candidates = onlyErrors
      ? logs.filter((l) => /error|fail|cannot|Error/i.test(l))
      : logs;
    if (candidates.length === 0) {
      message.warning(onlyErrors ? '当前没有错误行' : '当前没有日志');
      return;
    }
    const slice = candidates.slice(-100); // 最多 100 行，防 prompt 爆炸
    const body = slice.join('\n');
    const md = [
      '<!-- amis-ai:inject-source=dev-server-logs -->',
      onlyErrors
        ? '用户从 dev server 日志栏塞入以下错误行，请协助分析并修复：'
        : '用户从 dev server 日志栏塞入完整日志，请协助分析并修复：',
      '',
      '```log-dev-server',
      body,
      '```',
    ].join('\n');
    try {
      await addProjectTaskMessage(taskId, md);
      message.success(`已塞入 ${slice.length} 行日志到对话`);
    } catch (e: any) {
      message.error(`塞入失败：${e?.response?.data?.error || e.message}`);
    }
  };

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
          <Tooltip title="把错误/警告塞入对话">
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => injectToChat(true)}
              disabled={logs.length === 0}
            >
              塞错误
            </Button>
          </Tooltip>
          <Tooltip title="把全部日志塞入对话">
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => injectToChat(false)}
              disabled={logs.length === 0}
            >
              塞全部
            </Button>
          </Tooltip>
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
