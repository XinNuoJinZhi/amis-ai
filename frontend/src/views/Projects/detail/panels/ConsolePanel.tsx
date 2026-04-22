import { useState } from 'react';
import { Button, Space, Tooltip, message, Segmented } from 'antd';
import { ClearOutlined, SendOutlined } from '@ant-design/icons';
import { useIdeStore } from '../../../../stores/ide';
import { addProjectTaskMessage } from '../../../../services/projects';
import { useColors } from '../../../../theme';

interface Props {
  taskId: number;
}

function stringifyArgs(args: any[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      try {
        return JSON.stringify(a, null, 0);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

export default function ConsolePanel({ taskId }: Props) {
  const darkColors = useColors();
  const LEVEL_COLORS: Record<string, string> = {
    log: darkColors.text,
    info: darkColors.accentCyan,
    warn: darkColors.warning,
    error: darkColors.destructive,
    debug: darkColors.textMuted,
  };
  const logs = useIdeStore((s) => s.consoleLogs);
  const clearConsole = useIdeStore((s) => s.clearConsole);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');

  const visible = logs.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'error') return l.level === 'error';
    if (filter === 'warn') return l.level === 'warn' || l.level === 'error';
    return true;
  });

  const injectToChat = async (onlyErrors: boolean) => {
    const candidates = onlyErrors ? logs.filter((l) => l.level === 'error' || l.level === 'warn') : logs;
    if (candidates.length === 0) {
      message.warning('没有可塞入对话的日志');
      return;
    }
    const slice = candidates.slice(-30); // 最多 30 条，防 prompt 爆炸
    const body = slice
      .map((l) => {
        const prefix = `[${l.level}]`;
        const content = stringifyArgs(l.args);
        return `${prefix} ${content}${l.stack ? `\n    ${l.stack.split('\n').join('\n    ')}` : ''}`;
      })
      .join('\n');
    const md = [
      '<!-- amis-ai:inject-source=browser-console -->',
      '用户从浏览器控制台塞入以下日志，请协助分析并修复：',
      '',
      '```log-console',
      body,
      '```',
    ].join('\n');
    try {
      await addProjectTaskMessage(taskId, md);
      message.success(`已塞入 ${slice.length} 条日志到对话`);
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
          gap: 8,
        }}
      >
        <Space size={8}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: darkColors.textMuted,
              letterSpacing: 0.5,
            }}
          >
            {logs.length} events
          </span>
          <Segmented
            size="small"
            value={filter}
            onChange={(v) => setFilter(v as any)}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Warn+', value: 'warn' },
              { label: 'Error', value: 'error' },
            ]}
          />
        </Space>
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
          <Tooltip title="清空">
            <Button
              size="small"
              type="text"
              icon={<ClearOutlined />}
              onClick={clearConsole}
            />
          </Tooltip>
        </Space>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '6px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        {visible.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: darkColors.textSubtle }}>
            [ NO CONSOLE OUTPUT ]
          </div>
        ) : (
          visible.map((l) => (
            <div
              key={l.id}
              style={{
                padding: '2px 12px',
                borderLeft: `2px solid ${LEVEL_COLORS[l.level] || darkColors.text}`,
                background: l.level === 'error' ? 'rgba(239,68,68,0.06)' : 'transparent',
              }}
            >
              <span style={{ color: LEVEL_COLORS[l.level] || darkColors.text, marginRight: 8 }}>
                [{l.level}]
              </span>
              <span style={{ color: darkColors.text }}>{stringifyArgs(l.args)}</span>
              {l.stack && (
                <div style={{ color: darkColors.textSubtle, whiteSpace: 'pre-wrap', fontSize: 11 }}>
                  {l.stack}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
