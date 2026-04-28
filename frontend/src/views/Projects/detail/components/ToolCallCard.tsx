import { useState, type ReactNode } from 'react';
import {
  CheckOutlined,
  CloseOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  ToolOutlined,
  FileTextOutlined,
  EditOutlined,
  FormOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { ColorPalette } from '../../../../theme';

// 工具调用状态：running 还在执行 / success 成功 / error 失败 / orphan 找不到对应 tool_use
export type ToolStatus = 'running' | 'success' | 'error' | 'orphan';

export interface ToolCallCardProps {
  name: string;
  input: unknown;
  output?: string;
  status: ToolStatus;
  c: ColorPalette;
}

interface ToolMeta {
  icon: ReactNode;
  summary: (input: any) => string;
}

const TOOL_REGISTRY: Record<string, ToolMeta> = {
  read_file: {
    icon: <FileTextOutlined />,
    summary: (i) => stringifyPath(i?.path) || '—',
  },
  write_file: {
    icon: <EditOutlined />,
    summary: (i) => {
      const p = stringifyPath(i?.path);
      const len = typeof i?.content === 'string' ? i.content.length : 0;
      return p ? `${p}${len ? ` · ${humanLen(len)}` : ''}` : '—';
    },
  },
  edit_file: {
    icon: <FormOutlined />,
    summary: (i) => stringifyPath(i?.path) || '—',
  },
  glob_search: {
    icon: <FolderOpenOutlined />,
    summary: (i) => i?.pattern || stringifyPath(i?.path) || '—',
  },
  grep_search: {
    icon: <SearchOutlined />,
    summary: (i) => {
      const pat = i?.pattern || i?.query;
      const where = i?.path || i?.dir;
      if (pat && where) return `${pat}  in  ${where}`;
      return pat || where || '—';
    },
  },
  bash: {
    icon: <CodeOutlined />,
    summary: (i) => {
      const cmd = i?.command ?? i?.cmd;
      if (typeof cmd !== 'string') return '—';
      return cmd.length > 100 ? `$ ${cmd.slice(0, 100)}…` : `$ ${cmd}`;
    },
  },
  dev_start: {
    icon: <ThunderboltOutlined />,
    summary: () => '启动 dev server',
  },
  Skill: {
    icon: <BulbOutlined />,
    summary: (i) => i?.skill_name || i?.name || stringifyPath(i?.path) || '—',
  },
};

const FALLBACK_META: ToolMeta = {
  icon: <ToolOutlined />,
  summary: (i) => {
    if (i == null) return '—';
    if (typeof i === 'string') return i.length > 80 ? `${i.slice(0, 80)}…` : i;
    try {
      const s = JSON.stringify(i);
      return s.length > 80 ? `${s.slice(0, 80)}…` : s;
    } catch {
      return '—';
    }
  },
};

function stringifyPath(p: unknown): string {
  return typeof p === 'string' ? p : '';
}

function humanLen(n: number): string {
  if (n < 1024) return `${n} chars`;
  return `${(n / 1024).toFixed(1)}k chars`;
}

function StatusGlyph({ status, c }: { status: ToolStatus; c: ColorPalette }) {
  // 固定宽度 + 居中对齐，避免不同 antd icon 字形宽度差导致右侧参差
  const wrap = (node: ReactNode): ReactNode => (
    <span style={{ width: 14, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>
      {node}
    </span>
  );
  if (status === 'running') {
    return wrap(<LoadingOutlined spin style={{ color: c.accentCyan, fontSize: 12 }} />);
  }
  if (status === 'success') {
    return wrap(<CheckOutlined style={{ color: c.success, fontSize: 12 }} />);
  }
  if (status === 'error') {
    return wrap(<CloseOutlined style={{ color: c.destructive, fontSize: 12 }} />);
  }
  return wrap(<QuestionCircleOutlined style={{ color: c.textSubtle, fontSize: 12 }} />);
}

export default function ToolCallCard({
  name,
  input,
  output,
  status,
  c,
}: ToolCallCardProps) {
  const meta = TOOL_REGISTRY[name] ?? FALLBACK_META;
  const summary = meta.summary(input);
  // 默认收起；错误时默认展开（多半要看错误信息）
  const [open, setOpen] = useState<boolean>(status === 'error');

  return (
    <div
      style={{
        margin: '3px 16px',
        background: c.surface,
        border: `1px solid ${c.borderSubtle}`,
        borderRadius: 6,
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          color: c.textMuted,
          fontSize: 12,
          fontFamily: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
          minHeight: 28,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ color: c.text, display: 'inline-flex', alignItems: 'center' }}>
          {meta.icon}
        </span>
        <span style={{ color: c.text, fontWeight: 500 }}>{name}</span>
        <span style={{ color: c.textSubtle }}>·</span>
        <span
          style={{
            color: c.textMuted,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {summary}
        </span>
        <StatusGlyph status={status} c={c} />
        <span style={{ width: 12, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>
          {open ? (
            <CaretDownOutlined style={{ fontSize: 10, color: c.textSubtle }} />
          ) : (
            <CaretRightOutlined style={{ fontSize: 10, color: c.textSubtle }} />
          )}
        </span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${c.borderSubtle}` }}>
          {hasInputContent(input) && (
            <DetailSection label="input" content={formatInput(input)} c={c} />
          )}
          {output != null && output !== '' && (
            <DetailSection
              label={status === 'error' ? 'error' : 'output'}
              content={output}
              c={c}
              error={status === 'error'}
            />
          )}
          {!hasInputContent(input) && (output == null || output === '') && (
            <div style={{ padding: '8px 10px', fontSize: 11, color: c.textSubtle }}>
              （此工具调用没有更多详情）
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function hasInputContent(input: unknown): boolean {
  if (input == null) return false;
  if (typeof input === 'string') return input.trim().length > 0;
  if (Array.isArray(input)) return input.length > 0;
  if (typeof input === 'object') return Object.keys(input as object).length > 0;
  return true;
}

function formatInput(input: unknown): string {
  if (input == null) return '(空)';
  if (typeof input === 'string') return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

function DetailSection({
  label,
  content,
  c,
  error = false,
}: {
  label: string;
  content: string;
  c: ColorPalette;
  error?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          padding: '4px 10px 2px',
          fontSize: 10.5,
          color: error ? c.destructive : c.textSubtle,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <pre
        style={{
          margin: 0,
          padding: '4px 10px 8px',
          fontSize: 11.5,
          lineHeight: '17px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight: 240,
          overflow: 'auto',
          color: c.text,
          background: 'transparent',
        }}
      >
        {content || '(空)'}
      </pre>
    </div>
  );
}
