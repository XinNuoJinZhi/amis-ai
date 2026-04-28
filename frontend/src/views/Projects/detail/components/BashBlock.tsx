import { useMemo, useState, type CSSProperties } from 'react';
import {
  CodeOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import anser from 'anser';
import type { ColorPalette } from '../../../../theme';
import type { ToolStatus } from './ToolCallCard';

/**
 * bash 工具块 —— 借鉴 cline/cline 的 CommandOutputRow：
 *   - 头部一行：$ command（截断），状态图标在右侧
 *   - output 默认前 5 行，超出按钮展开到更大区域 + 滚动
 *   - sandbox 的 bash output 是 JSON `{exit_code, stdout, stderr}`，解析后优先显 stdout；
 *     非 0 退出码时把 stderr 拼上去；解析失败则原文兜底
 */
interface BashBlockProps {
  command: string;
  output?: string;
  status: ToolStatus;
  c: ColorPalette;
}

const PREVIEW_LINES = 5;

function StatusGlyph({ status, c }: { status: ToolStatus; c: ColorPalette }) {
  // 固定宽度 14px，避免不同 icon 字形宽度差导致右侧参差
  const inner =
    status === 'running' ? (
      <LoadingOutlined spin style={{ color: c.accentCyan, fontSize: 12 }} />
    ) : status === 'success' ? (
      <CheckOutlined style={{ color: c.success, fontSize: 12 }} />
    ) : status === 'error' ? (
      <CloseOutlined style={{ color: c.destructive, fontSize: 12 }} />
    ) : (
      <QuestionCircleOutlined style={{ color: c.textSubtle, fontSize: 12 }} />
    );
  return (
    <span style={{ width: 14, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>
      {inner}
    </span>
  );
}

// 把 ANSI 转义码（颜色 / 加粗 / 下划线）解析成带样式的 ReactNode 数组。
// anser 返回 chunks: { content, fg, bg, decoration }。fg/bg 默认是 'rgb(R,G,B)' 字符串。
function renderAnsi(text: string) {
  if (!text) return null;
  const chunks = anser.ansiToJson(text, { remove_empty: true, json: true });
  return chunks.map((ch, i) => {
    const style: CSSProperties = {};
    if (ch.fg) style.color = ch.fg.startsWith('rgb') ? ch.fg : `rgb(${ch.fg})`;
    if (ch.bg) style.background = ch.bg.startsWith('rgb') ? ch.bg : `rgb(${ch.bg})`;
    if (ch.decoration === 'bold') style.fontWeight = 600;
    if (ch.decoration === 'italic') style.fontStyle = 'italic';
    if (ch.decoration === 'underline') style.textDecoration = 'underline';
    return (
      <span key={i} style={style}>
        {ch.content}
      </span>
    );
  });
}

function parseBashOutput(raw: string | undefined): { text: string; exitCode: number | null } {
  if (!raw) return { text: '', exitCode: null };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      const stdout = typeof v.stdout === 'string' ? v.stdout : '';
      const stderr = typeof v.stderr === 'string' ? v.stderr : '';
      const exit = typeof v.exit_code === 'number' ? v.exit_code : null;
      const merged = exit !== null && exit !== 0 && stderr ? `${stdout}${stdout ? '\n' : ''}[stderr]\n${stderr}` : stdout || stderr;
      return { text: merged, exitCode: exit };
    }
  } catch {
    /* 非 JSON：原文 */
  }
  return { text: raw, exitCode: null };
}

export default function BashBlock({ command, output, status, c }: BashBlockProps) {
  const { text, exitCode } = useMemo(() => parseBashOutput(output), [output]);
  const lines = useMemo(() => text.split('\n'), [text]);
  const overflow = lines.length > PREVIEW_LINES;
  const [outputExpanded, setOutputExpanded] = useState(false);
  // 头部 caret 控制 body 折叠（默认展开，主要是为了让头部右侧多一个 caret 占位以对齐其他 Block）
  const [bodyOpen, setBodyOpen] = useState(true);
  const visibleText = overflow && !outputExpanded ? lines.slice(-PREVIEW_LINES).join('\n') : text;
  const hasBody = Boolean(text);

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
        onClick={() => hasBody && setBodyOpen((o) => !o)}
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
          cursor: hasBody ? 'pointer' : 'default',
          textAlign: 'left',
          minHeight: 28,
          boxSizing: 'border-box',
        }}
      >
        <CodeOutlined style={{ color: c.text }} />
        <span style={{ color: c.text, fontWeight: 500 }}>bash</span>
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
          title={command}
        >
          ${' '}
          {command}
        </span>
        {exitCode != null && exitCode !== 0 && (
          <span style={{ color: c.destructive, fontSize: 11 }}>exit {exitCode}</span>
        )}
        <StatusGlyph status={status} c={c} />
        <span style={{ width: 12, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>
          {hasBody ? (
            bodyOpen ? (
              <CaretDownOutlined style={{ fontSize: 10, color: c.textSubtle }} />
            ) : (
              <CaretRightOutlined style={{ fontSize: 10, color: c.textSubtle }} />
            )
          ) : null}
        </span>
      </button>
      {hasBody && bodyOpen && (
        <div style={{ borderTop: `1px solid ${c.borderSubtle}` }}>
          <pre
            style={{
              margin: 0,
              padding: '6px 10px',
              fontSize: 11.5,
              lineHeight: '17px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: outputExpanded ? 240 : undefined,
              overflow: outputExpanded ? 'auto' : undefined,
              color: c.text,
              background: 'transparent',
            }}
          >
            {visibleText ? renderAnsi(visibleText) : '(空输出)'}
          </pre>
          {overflow && (
            <button
              type="button"
              onClick={() => setOutputExpanded((v) => !v)}
              style={{
                width: '100%',
                padding: '4px 10px',
                background: 'transparent',
                border: 'none',
                borderTop: `1px dashed ${c.borderSubtle}`,
                color: c.textSubtle,
                fontFamily: 'inherit',
                fontSize: 11,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {outputExpanded ? <CaretDownOutlined style={{ fontSize: 9 }} /> : <CaretRightOutlined style={{ fontSize: 9 }} />}
              <span>
                {outputExpanded
                  ? `收起（共 ${lines.length} 行）`
                  : `展开剩余 ${lines.length - PREVIEW_LINES} 行（共 ${lines.length} 行）`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
