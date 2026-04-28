import { useState } from 'react';
import {
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import type { ColorPalette } from '../../../../theme';
import type { ToolStatus } from './ToolCallCard';

/**
 * read_file 块 —— 借鉴 cline/cline 的 CodeAccordian + roo-code/Roo-Code PR #11245 batching：
 *   - 单条：路径一行 + 状态；展开看文件内容（多数场景用户不需要展开，所以默认收起）
 *   - 批量（连续多次 read_file 自动合并）：「读了 N 个文件」+ 展开列每条路径
 */
export interface ReadFileItem {
  path: string;
  output?: string;
  status: ToolStatus;
}

interface ReadFileBlockProps {
  items: ReadFileItem[]; // 长度 1 时单文件模式；> 1 时批量模式
  c: ColorPalette;
}

function StatusGlyph({ status, c, size = 12 }: { status: ToolStatus; c: ColorPalette; size?: number }) {
  const inner =
    status === 'running' ? (
      <LoadingOutlined spin style={{ color: c.accentCyan, fontSize: size }} />
    ) : status === 'success' ? (
      <CheckOutlined style={{ color: c.success, fontSize: size }} />
    ) : status === 'error' ? (
      <CloseOutlined style={{ color: c.destructive, fontSize: size }} />
    ) : (
      <QuestionCircleOutlined style={{ color: c.textSubtle, fontSize: size }} />
    );
  return (
    <span style={{ width: 14, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>
      {inner}
    </span>
  );
}

function aggregateStatus(items: ReadFileItem[]): ToolStatus {
  if (items.some((i) => i.status === 'running')) return 'running';
  if (items.some((i) => i.status === 'error')) return 'error';
  if (items.some((i) => i.status === 'orphan')) return 'orphan';
  return 'success';
}

export default function ReadFileBlock({ items, c }: ReadFileBlockProps) {
  const [open, setOpen] = useState(false);
  const isBatch = items.length > 1;
  const summary = isBatch
    ? `读了 ${items.length} 个文件`
    : items[0]?.path || '—';
  const overall = aggregateStatus(items);

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
        <FileTextOutlined style={{ color: c.text }} />
        <span style={{ color: c.text, fontWeight: 500 }}>read_file</span>
        {isBatch && (
          <span
            style={{
              fontSize: 10.5,
              padding: '0 5px',
              borderRadius: 8,
              background: c.surfaceElevated,
              color: c.textMuted,
              lineHeight: '16px',
            }}
          >
            ×{items.length}
          </span>
        )}
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
          title={summary}
        >
          {summary}
        </span>
        <StatusGlyph status={overall} c={c} />
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
          {isBatch ? (
            <div style={{ padding: '4px 0' }}>
              {items.map((it, i) => (
                <div
                  key={`${i}-${it.path}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 12px 3px 26px',
                    fontSize: 11.5,
                    color: c.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <StatusGlyph status={it.status} c={c} size={10} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} title={it.path}>
                    {it.path}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                padding: '6px 10px',
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
              {items[0]?.output || '(空)'}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
