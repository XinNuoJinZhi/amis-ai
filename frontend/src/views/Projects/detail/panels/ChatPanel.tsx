import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Avatar, Tooltip, message as antdMessage } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, CloseOutlined, BulbOutlined, CaretRightOutlined, CaretDownOutlined, StopOutlined } from '@ant-design/icons';
import { addProjectTaskMessage, stopProjectTask } from '../../../../services/projects';
import { type TaskEvent } from '../hooks/useProjectEvents';
import { useColors, type ColorPalette } from '../../../../theme';
import ToolCallCard, { type ToolStatus } from '../components/ToolCallCard';
import BashBlock from '../components/BashBlock';
import ReadFileBlock from '../components/ReadFileBlock';
import WriteFileBlock from '../components/WriteFileBlock';
import AssistantMessage from '../components/AssistantMessage';

interface Props {
  taskId: number;
  /** 由父组件提供（顶层 useProjectEvents 一次性订阅，避免多个 ChatPanel 各自起 WS） */
  events: TaskEvent[];
  connected: boolean;
  onClose?: () => void;
  /** onboarding 阶段不显示右侧 border（单列居中布局） */
  bordered?: boolean;
  /**
   * 当前任务状态（task.status）。
   * 用作 events 流尚未回放出 status_change 时的 fallback——任务刚启动 / 刷新页面立刻进来时
   * events 可能还是空数组，但 REST 已经知道 task 是 running 了，按钮要立刻显示「停止」。
   */
  taskStatus?: string | null;
}

interface ChatBlock {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  ts?: number;
  meta?: string;
  // 仅 role === 'tool' 时使用：经栈式配对后的工具卡片数据
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: string;
  toolStatus?: ToolStatus;
  // 批量模式（连续同名工具被合并）：toolBatch 是合并的多条原始 tool 块
  toolBatch?: ChatBlock[];
}

// 借鉴 roo-code/Roo-Code PR #11245：连续同名 tool 合并成一张卡片，
// 减少"5 次 read_file 各占一条"的视觉杂乱。仅对路径/diff 类工具合并；
// bash / 搜索类不合并（每条独立查询/独立风险）。
const BATCHABLE_TOOLS = new Set(['read_file', 'write_file', 'edit_file']);

function batchToolBlocks(blocks: ChatBlock[]): ChatBlock[] {
  const result: ChatBlock[] = [];
  let buffer: ChatBlock[] = [];
  let bufferName: string | null = null;

  const flush = () => {
    if (buffer.length === 0) return;
    if (buffer.length === 1) {
      result.push(buffer[0]);
    } else {
      const first = buffer[0];
      result.push({
        id: `batch-${first.id}`,
        role: 'tool',
        content: '',
        toolName: bufferName ?? first.toolName,
        toolBatch: buffer,
      });
    }
    buffer = [];
    bufferName = null;
  };

  for (const b of blocks) {
    if (b.role === 'tool' && b.toolName && BATCHABLE_TOOLS.has(b.toolName)) {
      if (bufferName === null || bufferName === b.toolName) {
        bufferName = b.toolName;
        buffer.push(b);
      } else {
        flush();
        bufferName = b.toolName;
        buffer.push(b);
      }
    } else {
      flush();
      result.push(b);
    }
  }
  flush();
  return result;
}

// 从 tool input 里挑常用字段（防御性：input 可能是 string / 已 parse 对象 / undefined）
function pickField(input: unknown, key: string): unknown {
  if (input && typeof input === 'object' && key in (input as object)) {
    return (input as Record<string, unknown>)[key];
  }
  return undefined;
}
function pickPath(input: unknown): string {
  const v = pickField(input, 'path');
  return typeof v === 'string' ? v : '';
}
function pickCmd(input: unknown): string {
  const v = pickField(input, 'command') ?? pickField(input, 'cmd');
  return typeof v === 'string' ? v : '';
}
function pickCharCount(input: unknown): number | undefined {
  const v = pickField(input, 'content');
  return typeof v === 'string' ? v.length : undefined;
}
function pickStr(input: unknown, key: string): string | undefined {
  const v = pickField(input, key);
  return typeof v === 'string' ? v : undefined;
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
 *   - tool_use / tool_result 按工具名「栈式就近配对」合并到同一张工具卡片块
 *     （后端 ToolResult 事件不带 tool_use_id，只能按时间顺序倒着找最近一个未关闭的同名 tool_use）
 *   - 配不上的 tool_result 退化为 status='orphan' 单独一块
 *   - user_message → user 角色
 */
function eventsToBlocks(events: TaskEvent[]): ChatBlock[] {
  const blocks: ChatBlock[] = [];
  let currentAssistant: ChatBlock | null = null;
  // 每个工具名维护一个未配对的 tool_use 索引栈（最近一次 push 的最先被 pop 配对）
  const openTools: Map<string, number[]> = new Map();

  const fmtOutput = (raw: unknown): string =>
    typeof raw === 'string' ? raw : raw == null ? '' : JSON.stringify(raw, null, 2);

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
        const name = String(ev.data?.name || ev.name || ev.tool_name || 'tool');
        // 后端 TaskEvent::ToolUse.input 是 String（JSON 字符串），需要 parse 成对象，
        // 否则 ToolCallCard 的 summary 拿不到 .path / .command 等字段（会显示 "—"）。
        // parse 失败（极少见）就保留原字符串，摘要会走兜底。
        const rawInput = ev.data?.input ?? ev.input;
        let input: unknown = rawInput;
        if (typeof rawInput === 'string') {
          try {
            input = JSON.parse(rawInput);
          } catch {
            input = rawInput;
          }
        }
        const idx = blocks.length;
        blocks.push({
          id: `t-${i}`,
          role: 'tool',
          content: '',
          toolName: name,
          toolInput: input,
          toolStatus: 'running',
        });
        const stack = openTools.get(name);
        if (stack) stack.push(idx);
        else openTools.set(name, [idx]);
        break;
      }
      case 'tool_result': {
        currentAssistant = null;
        const name = String(ev.data?.name || ev.name || ev.tool_name || 'tool');
        const output = fmtOutput(ev.data?.output ?? ev.output);
        const isError = Boolean(ev.data?.is_error ?? ev.is_error ?? false);
        const stack = openTools.get(name);
        if (stack && stack.length > 0) {
          const idx = stack.pop()!;
          const target = blocks[idx];
          target.toolOutput = output;
          target.toolStatus = isError ? 'error' : 'success';
        } else {
          // 找不到配对 tool_use（极少见：协议错位 / 历史截断）—— 当 orphan 单独显
          blocks.push({
            id: `r-${i}`,
            role: 'tool',
            content: '',
            toolName: name,
            toolInput: undefined,
            toolOutput: output,
            toolStatus: 'orphan',
          });
        }
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
    const name = b.toolName ?? 'tool';

    // 批量模式：连续同名 read_file / write_file / edit_file 被合并成一张卡片
    if (b.toolBatch && b.toolBatch.length > 1) {
      if (name === 'read_file') {
        return (
          <ReadFileBlock
            items={b.toolBatch.map((x) => ({
              path: pickPath(x.toolInput),
              output: x.toolOutput,
              status: x.toolStatus ?? 'running',
            }))}
            c={c}
          />
        );
      }
      if (name === 'write_file' || name === 'edit_file') {
        return (
          <WriteFileBlock
            items={b.toolBatch.map((x) => ({
              tool: name,
              path: pickPath(x.toolInput),
              charCount: pickCharCount(x.toolInput),
              status: x.toolStatus ?? 'running',
              content: pickStr(x.toolInput, 'content'),
              oldText: pickStr(x.toolInput, 'old_text'),
              newText: pickStr(x.toolInput, 'new_text'),
            }))}
            c={c}
          />
        );
      }
    }

    // 单条专属组件分发
    if (name === 'bash') {
      return (
        <BashBlock
          command={pickCmd(b.toolInput)}
          output={b.toolOutput}
          status={b.toolStatus ?? 'running'}
          c={c}
        />
      );
    }
    if (name === 'read_file') {
      return (
        <ReadFileBlock
          items={[
            {
              path: pickPath(b.toolInput),
              output: b.toolOutput,
              status: b.toolStatus ?? 'running',
            },
          ]}
          c={c}
        />
      );
    }
    if (name === 'write_file' || name === 'edit_file') {
      return (
        <WriteFileBlock
          items={[
            {
              tool: name,
              path: pickPath(b.toolInput),
              charCount: pickCharCount(b.toolInput),
              status: b.toolStatus ?? 'running',
              content: pickStr(b.toolInput, 'content'),
              oldText: pickStr(b.toolInput, 'old_text'),
              newText: pickStr(b.toolInput, 'new_text'),
            },
          ]}
          c={c}
        />
      );
    }

    // 兜底：grep_search / glob_search / Skill / dev_start 等走通用卡片
    return (
      <ToolCallCard
        name={name}
        input={b.toolInput}
        output={b.toolOutput}
        status={b.toolStatus ?? 'running'}
        c={c}
      />
    );
  }
  const isUser = b.role === 'user';
  const segments = !isUser ? splitThinkSegments(b.content) : null;
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        // 跟工具卡片宽度对齐：margin 16px 让左右边缘一致；padding 11px ≈ 工具卡片的 (10px padding + 1px border)
        margin: '6px 16px',
        padding: '10px 11px',
        background: isUser ? 'transparent' : c.surface,
        border: `1px solid ${c.borderSubtle}`,
        borderRadius: 6,
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
              <AssistantMessage key={i} content={seg.content} c={c} />
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

interface PendingUserMessage {
  id: string;
  content: string;
}

export default function ChatPanel({ taskId, events, connected, onClose, bordered = true, taskStatus = null }: Props) {
  const darkColors = useColors();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<PendingUserMessage[]>([]);
  // 乐观 busy：用户刚发完消息但事件流还没回 status_change/turn_complete 时，
  // 仍把按钮显示成停止。看到 turn_complete 或非 active 状态后自动关闭。
  const [optimisticBusy, setOptimisticBusy] = useState(false);
  const optimisticTimerRef = useRef<number | null>(null);
  // 用户发消息时的 events.length 基准——useEffect 只扫这之后**新增**的事件，
  // 否则历史里已有的 turn_complete / status_change 会让 optimisticBusy 刚开就关。
  const busyStartIdxRef = useRef<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 合并规则：events 里已经出现的 user_message 内容，按顺序"抵消"掉 pending 里的同内容项。
  // 这样不管后端有没有部署新版（会 broadcast user_message）都不会重复显示。
  const blocks = useMemo(() => {
    const serverBlocks = batchToolBlocks(eventsToBlocks(events));

    // 按发送顺序收集 server 已回推的 user 消息内容
    const serverUserContents: string[] = [];
    for (const b of serverBlocks) {
      if (b.role === 'user') serverUserContents.push(b.content);
    }

    // 依序消费 pending：每条 pending 找到 serverUserContents 里最早未消费的同内容位置就抵消
    const consumed = new Set<number>();
    const survived: PendingUserMessage[] = [];
    for (const p of pending) {
      const idx = serverUserContents.findIndex(
        (s, i) => !consumed.has(i) && s === p.content,
      );
      if (idx === -1) survived.push(p);
      else consumed.add(idx);
    }

    return [
      ...serverBlocks,
      ...survived.map<ChatBlock>((p) => ({
        id: `u-local-${p.id}`,
        role: 'user',
        content: p.content,
      })),
    ];
  }, [events, pending]);

  // 当 events 里的 user_message 追上 pending 时，清理已被抵消的 pending
  // （避免 pending 数组无限增长）
  useEffect(() => {
    if (pending.length === 0) return;
    const serverUserContents: string[] = [];
    for (const ev of events) {
      const t = (ev as any).type || (ev as any).event_type;
      if (t === 'user_message') {
        const c =
          typeof ev.data === 'string'
            ? ev.data
            : ((ev.data as any)?.content ?? (ev as any).content ?? '');
        serverUserContents.push(typeof c === 'string' ? c : JSON.stringify(c));
      }
    }
    const consumed = new Set<number>();
    const survived = pending.filter((p) => {
      const idx = serverUserContents.findIndex(
        (s, i) => !consumed.has(i) && s === p.content,
      );
      if (idx === -1) return true;
      consumed.add(idx);
      return false;
    });
    if (survived.length !== pending.length) setPending(survived);
  }, [events, pending]);

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
    // 立刻乐观追加并清空输入框（UX：用户一回车就能看到自己说的话）
    const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setPending((prev) => [...prev, { id: localId, content }]);
    setInput('');
    try {
      await addProjectTaskMessage(taskId, content);
      // 乐观置 busy：发完到 agent 实际开始响应有 gap，按钮先变停止；
      // 真实事件（turn_complete / status_change 终结）回来后会被 useEffect 关掉。
      // 记下"基准点"——useEffect 只扫这之后**新增**的事件，否则历史里已有的
      // turn_complete 会让按钮刚开就关。
      busyStartIdxRef.current = events.length;
      setOptimisticBusy(true);
      if (optimisticTimerRef.current !== null) {
        window.clearTimeout(optimisticTimerRef.current);
      }
      // 安全兜底 60s：超时未见结束事件就强制关掉，避免按钮永远停在"停止"
      optimisticTimerRef.current = window.setTimeout(() => {
        setOptimisticBusy(false);
        optimisticTimerRef.current = null;
      }, 60000);
    } catch (e) {
      // 发送失败：回滚乐观条目 + 把内容放回输入框，避免用户以为已发送
      setPending((prev) => prev.filter((p) => p.id !== localId));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  /**
   * 当前任务状态：优先从 events 流里找最新的 status_change 事件推断（更实时），
   * events 流里还没出现过 status_change 时 fallback 到父级传下来的 task.status
   * （任务刚启动 / 刷新页面立刻进来的场景）。
   * status_change 事件 payload 形如 {"type":"status_change","data":"running"}。
   */
  const currentStatus = useMemo<string | null>(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i] as any;
      const t = e.type || e.event_type;
      if (t === 'status_change') {
        return typeof e.data === 'string' ? e.data : null;
      }
    }
    return taskStatus ?? null;
  }, [events, taskStatus]);

  /**
   * 任务是否在活跃状态：pending/running/waiting_user 三个未终结态都算 active。
   * 在 active 期间整个发送按钮变成停止按钮，不再随 LLM 请求/工具调用间隙来回跳。
   */
  const isRunning =
    currentStatus === 'pending' ||
    currentStatus === 'running' ||
    currentStatus === 'waiting_user';

  // optimisticBusy 收尾：仅扫"用户发消息之后新增的"事件，看到 turn_complete 或
  // status 切到非 active 时关掉。
  // 不能扫整个 events——历史里早就有 turn_complete（前几轮 LLM 完成时推过），
  // 一发消息就被立刻关闭，按钮闪都不闪（task #103 实锤）。
  useEffect(() => {
    if (!optimisticBusy) return;
    const startIdx = busyStartIdxRef.current;
    if (startIdx < 0 || events.length <= startIdx) return; // 还没新事件
    for (let i = events.length - 1; i >= startIdx; i--) {
      const e = events[i] as any;
      const t = e.type || e.event_type;
      if (t === 'turn_complete') {
        setOptimisticBusy(false);
        if (optimisticTimerRef.current !== null) {
          window.clearTimeout(optimisticTimerRef.current);
          optimisticTimerRef.current = null;
        }
        return;
      }
      if (t === 'status_change') {
        const st = typeof e.data === 'string' ? e.data : null;
        if (st && st !== 'pending' && st !== 'running' && st !== 'waiting_user') {
          setOptimisticBusy(false);
          if (optimisticTimerRef.current !== null) {
            window.clearTimeout(optimisticTimerRef.current);
            optimisticTimerRef.current = null;
          }
        }
        return;
      }
    }
  }, [events, optimisticBusy]);

  // 卸载时清掉超时定时器
  useEffect(() => {
    return () => {
      if (optimisticTimerRef.current !== null) {
        window.clearTimeout(optimisticTimerRef.current);
      }
    };
  }, []);

  const showStop = isRunning || optimisticBusy;

  const [stopping, setStopping] = useState(false);
  const handleStop = async () => {
    if (stopping) return;
    setStopping(true);
    try {
      await stopProjectTask(taskId);
      antdMessage.success('已发送停止信号');
      // 主动停止后立刻关掉乐观态（不用等事件流回来）
      setOptimisticBusy(false);
      if (optimisticTimerRef.current !== null) {
        window.clearTimeout(optimisticTimerRef.current);
        optimisticTimerRef.current = null;
      }
    } catch (e: any) {
      antdMessage.error(`停止失败：${e?.message ?? e}`);
    } finally {
      setStopping(false);
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
        {/* 2026-04-25：翻译器路径任务没 LLM 对话流，显示专属说明而不是 [ WAITING FOR EVENTS ] */}
        {events.some((e) => e.type === 'translator_idle') ? (
          <div
            style={{
              padding: '32px 24px',
              color: darkColors.textMuted,
              fontSize: 13,
              lineHeight: '22px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 16 }}>🪄</div>
            <div style={{ textAlign: 'center', color: darkColors.text, fontWeight: 500, marginBottom: 12 }}>
              本任务由确定性翻译器生成
            </div>
            <div style={{ color: darkColors.textSubtle, marginBottom: 12 }}>
              Amis JSON 已被一比一翻译成 Vue 代码，<b>未调用 LLM</b>。所以这里没有对话流——
              这是设计意图，不是 bug。
            </div>
            <div style={{ color: darkColors.textSubtle, marginBottom: 8 }}>
              要看实际生成了什么：
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: darkColors.textSubtle }}>
              <li>「执行详情」面板顶部的「🪄 翻译器」段——列出所有生成的文件</li>
              <li>「文件」面板——直接浏览沙箱目录</li>
              <li>「预览」面板——渲染好的页面（默认 iPhone SE 视口）</li>
            </ul>
          </div>
        ) : blocks.length === 0 ? (
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
        {showStop ? (
          <Tooltip title="停止当前任务">
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
              loading={stopping}
            />
          </Tooltip>
        ) : (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
          />
        )}
      </div>
    </div>
  );
}
