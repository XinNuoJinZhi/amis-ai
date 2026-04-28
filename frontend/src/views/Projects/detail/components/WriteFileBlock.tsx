import { useState } from 'react';
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import type { ColorPalette } from '../../../../theme';
import type { ToolStatus } from './ToolCallCard';
import DiffView, { computeDiff, diffStats } from './DiffView';
import CodePreview from './CodePreview';

/**
 * write_file / edit_file 块 —— 借鉴 cline/cline 的 DiffEditRow（精简版，未上行级 diff）：
 *   - 单条：path + 字符数 + 状态；展开看 input 详情
 *   - 批量：「写入/编辑了 N 个文件」+ 列每条 path / 字符数
 *
 * 注：第一版不渲染 +N/-M 行级 diff（需要后端协议带 old_str/new_str），先解决"满屏 JSON"。
 */
export interface WriteFileItem {
  tool: 'write_file' | 'edit_file';
  path: string;
  charCount?: number;
  status: ToolStatus;
  // 单条展开时用：write_file 显 content；edit_file 显 old_text/new_text 行级 diff
  content?: string;
  oldText?: string;
  newText?: string;
}

interface WriteFileBlockProps {
  items: WriteFileItem[]; // 长度 1 单条；> 1 批量
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

function aggregateStatus(items: WriteFileItem[]): ToolStatus {
  if (items.some((i) => i.status === 'running')) return 'running';
  if (items.some((i) => i.status === 'error')) return 'error';
  if (items.some((i) => i.status === 'orphan')) return 'orphan';
  return 'success';
}

function humanLen(n: number | undefined): string {
  if (!n || n <= 0) return '';
  if (n < 1024) return `${n} chars`;
  return `${(n / 1024).toFixed(1)}k chars`;
}

export default function WriteFileBlock({ items, c }: WriteFileBlockProps) {
  const [open, setOpen] = useState(false);
  const isBatch = items.length > 1;
  const overall = aggregateStatus(items);
  // 同一批次可能 write_file 和 edit_file 混合，但 ChatPanel 那边按 toolName 分组所以同批仅一种
  const verb = items[0]?.tool === 'edit_file' ? '编辑' : '写入';
  const toolLabel = items[0]?.tool ?? 'write_file';
  const single = items[0];
  // 单条 edit_file 摘要补 +N/-M 统计（视觉对齐 cline DiffEditRow）
  const editStats =
    !isBatch && single?.tool === 'edit_file' && single.oldText != null && single.newText != null
      ? diffStats(computeDiff(single.oldText, single.newText))
      : null;
  const summary = isBatch
    ? `${verb}了 ${items.length} 个文件`
    : single
      ? `${single.path}${single.charCount ? ` · ${humanLen(single.charCount)}` : ''}`
      : '—';

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
        <EditOutlined style={{ color: c.text }} />
        <span style={{ color: c.text, fontWeight: 500 }}>{toolLabel}</span>
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
        {editStats && (editStats.additions > 0 || editStats.deletions > 0) && (
          <span style={{ display: 'inline-flex', gap: 4, fontSize: 11, fontFamily: 'inherit' }}>
            {editStats.additions > 0 && <span style={{ color: c.success }}>+{editStats.additions}</span>}
            {editStats.deletions > 0 && <span style={{ color: c.destructive }}>-{editStats.deletions}</span>}
          </span>
        )}
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
        <div style={{ borderTop: `1px solid ${c.borderSubtle}`, padding: '4px 0' }}>
          {isBatch ? (
            items.map((it, i) => (
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
                }}
              >
                <StatusGlyph status={it.status} c={c} size={10} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={it.path}
                >
                  {it.path}
                </span>
                {it.charCount ? (
                  <span style={{ color: c.textSubtle, fontSize: 11 }}>
                    {humanLen(it.charCount)}
                  </span>
                ) : null}
              </div>
            ))
          ) : single?.tool === 'edit_file' && single.oldText != null && single.newText != null ? (
            // edit_file：行级 diff 视图（共同前缀/后缀 + 中间换成 +/-）+ per-line 语法高亮
            <DiffView oldText={single.oldText} newText={single.newText} c={c} path={single.path} />
          ) : single?.tool === 'write_file' && single.content ? (
            // write_file：行号 gutter + 语法高亮（按文件后缀推断语言；整文件覆盖没有"原文"对照所以不做 diff）
            <CodePreview content={single.content} c={c} path={single.path} />
          ) : (
            <div style={{ padding: '6px 12px', fontSize: 11.5, color: c.textSubtle, lineHeight: '18px' }}>
              （没有可预览的内容；点击「文件」面板查看实际文件）
            </div>
          )}
        </div>
      )}
    </div>
  );
}
