import { useEffect, useRef, useState } from 'react';
import { Button, Space, Tooltip, message } from 'antd';
import { ClearOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { buildTerminalWsUrl } from '../../../../services/ide';
import { addProjectTaskMessage } from '../../../../services/projects';
import { useIdeStore } from '../../../../stores/ide';
import { useColors } from '../../../../theme';

interface Props {
  taskId: number;
  active: boolean;
}

export default function TerminalPanel({ taskId, active }: Props) {
  const darkColors = useColors();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const appendTerminal = useIdeStore((s) => s.appendTerminal);
  const clearTerminalBuffer = useIdeStore((s) => s.clearTerminal);
  const [ready, setReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: 'Geist Mono Variable, JetBrains Mono, Menlo, monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      theme: {
        background: darkColors.bg,
        foreground: darkColors.text,
        cursor: darkColors.accentCyan,
        cursorAccent: darkColors.bg,
        selectionBackground: '#2e4156',
        black: '#0A0A0A',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#06B6D4',
        magenta: '#7C3AED',
        cyan: '#06B6D4',
        white: '#FAFAFA',
        brightBlack: '#262626',
        brightRed: '#F87171',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#22D3EE',
        brightMagenta: '#A78BFA',
        brightCyan: '#22D3EE',
        brightWhite: '#FFFFFF',
      },
      scrollback: 2000,
      allowTransparency: false,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    // 建立 WS
    const cols = Math.max(20, term.cols);
    const rows = Math.max(8, term.rows);
    const ws = new WebSocket(buildTerminalWsUrl(taskId, cols, rows));
    wsRef.current = ws;

    ws.onopen = () => {
      setReady(true);
    };

    ws.onmessage = (ev) => {
      try {
        const frame = JSON.parse(ev.data);
        if (frame.t === 'out' && typeof frame.d === 'string') {
          term.write(frame.d);
          appendTerminal(frame.d);
        } else if (frame.t === 'ready') {
          term.write(`\x1b[36m[amis-ai] terminal ready · /workspace\x1b[0m\r\n`);
        } else if (frame.t === 'exit') {
          term.write(`\r\n\x1b[33m[amis-ai] session exited (code=${frame.code})\x1b[0m\r\n`);
          setReady(false);
        } else if (frame.t === 'error') {
          term.write(`\r\n\x1b[31m[amis-ai] ${frame.message}\x1b[0m\r\n`);
        }
      } catch {}
    };

    ws.onerror = () => {
      term.write(`\r\n\x1b[31m[amis-ai] WebSocket error\x1b[0m\r\n`);
      setReady(false);
    };

    ws.onclose = () => {
      setReady(false);
    };

    const sendInput = (d: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ t: 'in', d }));
      }
    };
    term.onData(sendInput);

    const sendResize = () => {
      if (!fitRef.current || !termRef.current) return;
      fitRef.current.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          t: 'resize',
          cols: termRef.current.cols,
          rows: termRef.current.rows,
        }));
      }
    };

    const ro = new ResizeObserver(() => sendResize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      ws.close();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      wsRef.current = null;
    };
  }, [taskId, reloadKey]);

  // Tab 切换到终端时，自适应尺寸
  useEffect(() => {
    if (active && fitRef.current) {
      setTimeout(() => {
        fitRef.current?.fit();
        const ws = wsRef.current;
        const term = termRef.current;
        if (ws && term && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ t: 'resize', cols: term.cols, rows: term.rows }));
        }
      }, 50);
    }
  }, [active]);

  const injectToChat = async () => {
    const lines = useIdeStore.getState().terminalBuffer;
    if (!lines.length) {
      message.warning('终端暂无输出');
      return;
    }
    const slice = lines.slice(-80);
    const md = [
      '<!-- amis-ai:inject-source=terminal -->',
      '用户从终端塞入以下输出，请协助分析：',
      '',
      '```log-terminal',
      slice.join('\n'),
      '```',
    ].join('\n');
    try {
      await addProjectTaskMessage(taskId, md);
      message.success(`已塞入 ${slice.length} 行终端输出到对话`);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: ready ? darkColors.success : darkColors.textSubtle,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: darkColors.textMuted,
              letterSpacing: 0.5,
            }}
          >
            bash · /workspace
          </span>
        </div>
        <Space size={4}>
          <Tooltip title="把终端输出塞入对话">
            <Button size="small" icon={<SendOutlined />} onClick={injectToChat}>
              塞入对话
            </Button>
          </Tooltip>
          <Tooltip title="清空本地缓冲（不影响沙箱会话）">
            <Button
              size="small"
              type="text"
              icon={<ClearOutlined />}
              onClick={() => {
                termRef.current?.clear();
                clearTerminalBuffer();
              }}
            />
          </Tooltip>
          <Tooltip title="重连">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => setReloadKey((k) => k + 1)}
            />
          </Tooltip>
        </Space>
      </div>
      <div style={{ flex: 1, padding: 4, overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
