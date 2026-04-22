import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Avatar, Tooltip } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, CloseOutlined, ToolOutlined, BulbOutlined, CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import { addProjectTaskMessage } from '../../../../services/projects';
import { type TaskEvent } from '../hooks/useProjectEvents';
import { useColors, type ColorPalette } from '../../../../theme';

interface Props {
  taskId: number;
  /** 由父组件提供（顶层 useProjectEvents 一次性订阅，避免多个 ChatPanel 各自起 WS） */
  events: TaskEvent[];
  connected: boolean;
  onClose?: () => void;
  /** onboarding 阶段不显示右侧 border（单列居中布局） */
  bordered?: boolean;
}

interface ChatBlock {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  ts?: number;
  meta?: string;
}

type Segment =
  | { kind: 'text'; content: string }
  | { kind: 'think'; content: string; streaming: boolean };

/**
 * 把 assistant 的连续文本切成 text / think 段。
 * 支持流式场景：<think> 打开但 </think> 还没收到时，标记 streaming=true。
 */
function splitThinkSegments(raw: string): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  while (i < raw.length) {
    const start = raw.indexOf('<think>', i);
    if (start === -1) {
      const rest = raw.slice(i);
      if (rest) segs.push({ kind: 'text', content: rest });
      break;
    }
    if (start > i) {
      segs.push({ kind: 'text', content: raw.slice(i, start) });
    }
    const end = raw.indexOf('</think>', start + 7);
    if (end === -1) {
      // 还在流式接收中
      const content = raw.slice(start + 7);
      segs.push({ kind: 'think', content, streaming: true });
      break;
    }
    segs.push({ kind: 'think', content: raw.slice(start + 7, end), streaming: false });
    i = end + 8;
  }
  return segs;
}

/**
 * 把原始事件流拍扁成对话块：
 *   - text_delta 合并成一条 assistant
 *   - tool_use / tool_result 显示为工具调用
 *   - user_message → user 角色
 */
function eventsToBlocks(events: TaskEvent[]): ChatBlock[] {
  const blocks: ChatBlock[] = [];
  let currentAssistant: ChatBlock | null = null;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const type = ev.type || (ev as any).event_type;
    switch (type) {
      case 'user_message': {
        currentAssistant = null;
        const userContent =
          typeof ev.data === 'string'
            ? ev.data
            : (ev.data?.content ?? ev.content ?? '');
        blocks.push({
          id: `u-${i}`,
          role: 'user',
          content: typeof userContent === 'string' ? userContent : JSON.stringify(userContent),
        });
        break;
      }
      case 'text_delta': {
        // history 格式：{type, data: "chunk text"}；WS 实时格式：{type, data: "..."}
        const chunk =
          typeof ev.data === 'string'
            ? ev.data
            : (ev.data?.content ?? ev.content ?? ev.text ?? '');
        if (!currentAssistant) {
          currentAssistant = {
            id: `a-${i}`,
            role: 'assistant',
            content: '',
          };
          blocks.push(currentAssistant);
        }
        currentAssistant.content += chunk;
        break;
      }
      case 'tool_use': {
        currentAssistant = null;
        // history 格式：{type, data: {name, input}}；WS 格式：{type, name, input, ...}
        const name = ev.data?.name || ev.name || ev.tool_name || 'tool';
        const input = ev.data?.input ?? ev.input ?? ev.data;
        blocks.push({
          id: `t-${i}`,
          role: 'tool',
          content: typeof input === 'string' ? input : JSON.stringify(input, null, 2),
          meta: String(name),
        });
        break;
      }
      case 'tool_result': {
        currentAssistant = null;
        const name = ev.data?.name || ev.name || ev.tool_name || 'tool';
        const output = ev.data?.output ?? ev.output ?? ev.data;
        blocks.push({
          id: `r-${i}`,
          role: 'tool',
          content: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
          meta: `← ${name}`,
        });
        break;
      }
      case 'turn_complete':
      case 'status_change': {
        currentAssistant = null;
        break;
      }
      default:
        break;
    }
  }

  return blocks;
}

function AssistantAvatar({ c }: { c: ColorPalette }) {
  return (
    <Avatar
      size={24}
      icon={<RobotOutlined />}
      style={{ background: c.surfaceElevated, color: c.accentCyan, border: `1px solid ${c.border}`, flexShrink: 0 }}
    />
  );
}
function UserAvatar({ c }: { c: ColorPalette }) {
  return (
    <Avatar
      size={24}
      icon={<UserOutlined />}
      style={{ background: c.surfaceElevated, color: c.text, border: `1px solid ${c.border}`, flexShrink: 0 }}
    />
  );
}

function BlockView({ b, c }: { b: ChatBlock; c: ColorPalette }) {
  if (b.role === 'tool') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '6px 16px',
          color: c.textMuted,
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
        }}
      >
        <ToolOutlined style={{ color: c.accent, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: c.textSubtle, letterSpacing: 0.5 }}>
            {b.meta}
          </div>
          <pre
            style={{
              margin: '2px 0 0 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 180,
              overflow: 'auto',
              background: c.surface,
              border: `1px solid ${c.borderSubtle}`,
              borderRadius: 4,
              padding: '6px 8px',
              color: c.textMuted,
            }}
          >
            {b.content}
          </pre>
        </div>
      </div>
    );
  }
  const isUser = b.role === 'user';
  const segments = !isUser ? splitThinkSegments(b.content) : null;
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 16px',
        background: isUser ? 'transparent' : c.surface,
        borderBottom: `1px solid ${c.borderSubtle}`,
      }}
    >
      {isUser ? <UserAvatar c={c} /> : <AssistantAvatar c={c} />}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 13,
          lineHeight: 1.6,
          color: c.text,
        }}
      >
        {isUser || !segments ? (
          b.content
        ) : (
          segments.map((seg, i) =>
            seg.kind === 'think' ? (
              <ThinkBlock key={i} content={seg.content} streaming={seg.streaming} c={c} />
            ) : (
              <span key={i}>{seg.content}</span>
            ),
          )
        )}
      </div>
    </div>
  );
}

function ThinkBlock({
  content,
  streaming,
  c,
}: {
  content: string;
  streaming: boolean;
  c: ColorPalette;
}) {
  // 流式中默认展开，结束后默认折叠
  const [open, setOpen] = useState<boolean>(streaming);

  // 流式 → 结束：自动折叠一次
  useEffect(() => {
    if (!streaming) setOpen(false);
  }, [streaming]);

  const trimmed = content.trim();
  if (!trimmed) return null;

  return (
    <div
      style={{
        margin: '6px 0',
        background: 'transparent',
        border: `1px dashed ${c.borderSubtle}`,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '4px 10px',
          background: 'transparent',
          border: 'none',
          color: c.textMuted,
          fontSize: 11.5,
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open ? (
          <CaretDownOutlined style={{ fontSize: 10 }} />
        ) : (
          <CaretRightOutlined style={{ fontSize: 10 }} />
        )}
        <BulbOutlined style={{ fontSize: 11, color: c.accent }} />
        <span>
          {streaming ? '思考中…' : '思考过程'}
        </span>
        {streaming && (
          <span
            className="v0-pulse"
            style={{ width: 6, height: 6, marginLeft: 'auto' }}
          />
        )}
      </button>
      {open && (
        <div
          style={{
            padding: '4px 12px 8px 28px',
            color: c.textMuted,
            fontSize: 12,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderTop: `1px dashed ${c.borderSubtle}`,
            fontStyle: 'italic',
          }}
        >
          {trimmed}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({ taskId, events, connected, onClose, bordered = true }: Props) {
  const darkColors = useColors();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const blocks = useMemo(() => eventsToBlocks(events), [events]);

  useEffect(() => {
    // 自动跟随底部
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [blocks.length]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await addProjectTaskMessage(taskId, content);
      setInput('');
    } catch (e) {
      // noop
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: darkColors.bg,
        borderRight: bordered ? `1px solid ${darkColors.border}` : 'none',
      }}
    >
      <div
        style={{
          height: 36,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${darkColors.borderSubtle}`,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: darkColors.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: connected ? darkColors.accentCyan : darkColors.textSubtle,
            }}
          />
          <span>Chat · Agent</span>
        </div>
        {onClose && (
          <Tooltip title="关闭聊天">
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
          </Tooltip>
        )}
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto' }}>
        {blocks.length === 0 ? (
          <div style={{ padding: 24, color: darkColors.textSubtle, fontSize: 12, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            [ WAITING FOR EVENTS ]
          </div>
        ) : (
          blocks.map((b) => <BlockView key={b.id} b={b} c={darkColors} />)
        )}
      </div>
      <div
        style={{
          padding: 10,
          borderTop: `1px solid ${darkColors.border}`,
          display: 'flex',
          gap: 6,
          background: darkColors.bg,
        }}
      >
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder="追加消息给 Agent…（Enter 发送，Shift+Enter 换行）"
          style={{
            background: darkColors.surface,
            resize: 'none',
            fontSize: 13,
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={sending}
        />
      </div>
    </div>
  );
}
