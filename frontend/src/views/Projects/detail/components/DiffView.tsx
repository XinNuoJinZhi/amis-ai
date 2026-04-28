import type { ColorPalette } from '../../../../theme';
import CodeView from './CodeView';

/**
 * 简化版行级 diff —— 借鉴 cline/cline DiffEditRow 但精简实现：
 *   1. 找共同前缀行数 P
 *   2. 找共同后缀行数 S
 *   3. 中间部分：old 行全标 `-`，new 行全标 `+`
 *   4. 上下文：前缀最后 ctxLines 行 + 后缀前 ctxLines 行（标 ` `）
 *
 * 不做行内 LCS / 字符级 diff，对 LLM "改一小段" 的常见场景已经够看清楚改了什么。
 */
export type DiffLine = { kind: '+' | '-' | ' '; text: string };

export function computeDiff(oldText: string, newText: string, ctxLines = 2): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix++;
  }

  const result: DiffLine[] = [];

  const ctxBeforeStart = Math.max(0, prefix - ctxLines);
  for (let i = ctxBeforeStart; i < prefix; i++) {
    result.push({ kind: ' ', text: oldLines[i] });
  }

  for (let i = prefix; i < oldLines.length - suffix; i++) {
    result.push({ kind: '-', text: oldLines[i] });
  }

  for (let i = prefix; i < newLines.length - suffix; i++) {
    result.push({ kind: '+', text: newLines[i] });
  }

  const suffixStart = newLines.length - suffix;
  const ctxAfterEnd = Math.min(newLines.length, suffixStart + ctxLines);
  for (let i = suffixStart; i < ctxAfterEnd; i++) {
    result.push({ kind: ' ', text: newLines[i] });
  }

  return result;
}

export function diffStats(lines: DiffLine[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const l of lines) {
    if (l.kind === '+') additions++;
    else if (l.kind === '-') deletions++;
  }
  return { additions, deletions };
}

interface DiffViewProps {
  oldText: string;
  newText: string;
  c: ColorPalette;
  ctxLines?: number;
  maxHeight?: number;
  /** 文件路径（用于按后缀推断语法高亮语言） */
  path?: string;
}

/**
 * Diff 视图 —— 行级渲染，每行三列：[indicator] [pad] [text]
 *   - 增加行：背景浅绿 + 左侧绿条 + `+` 前缀
 *   - 删除行：背景浅红 + 左侧红条 + `-` 前缀
 *   - 上下文行：前缀空格 + 灰字
 *
 * 使用 background-color rgba 叠加（不强假设主题），暗/亮两种主题都能看清。
 */
export default function DiffView({ oldText, newText, c, ctxLines = 2, maxHeight = 240, path }: DiffViewProps) {
  const lines = computeDiff(oldText ?? '', newText ?? '', ctxLines);
  const { additions, deletions } = diffStats(lines);

  return (
    <div style={{ borderTop: `1px solid ${c.borderSubtle}` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '4px 12px',
          fontSize: 11,
          color: c.textSubtle,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>diff</span>
        {additions > 0 && <span style={{ color: c.success }}>+{additions}</span>}
        {deletions > 0 && <span style={{ color: c.destructive }}>-{deletions}</span>}
        {path && <span style={{ marginLeft: 'auto', color: c.textSubtle }}>{path}</span>}
      </div>
      <div
        style={{
          maxHeight,
          overflow: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          lineHeight: '17px',
          background: 'transparent',
        }}
      >
        {lines.map((l, i) => (
          <DiffLineRow key={i} line={l} c={c} path={path} />
        ))}
      </div>
    </div>
  );
}

function DiffLineRow({ line, c, path }: { line: DiffLine; c: ColorPalette; path?: string }) {
  const isAdd = line.kind === '+';
  const isDel = line.kind === '-';
  const bg = isAdd
    ? 'rgba(16, 185, 129, 0.10)' // success @ 10%
    : isDel
      ? 'rgba(239, 68, 68, 0.10)' // destructive @ 10%
      : 'transparent';
  const border = isAdd
    ? `2px solid ${c.success}`
    : isDel
      ? `2px solid ${c.destructive}`
      : `2px solid transparent`;
  const prefix = isAdd ? '+' : isDel ? '-' : ' ';
  const prefixColor = isAdd ? c.success : isDel ? c.destructive : c.textSubtle;
  const textColor = isAdd || isDel ? c.text : c.textMuted;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        background: bg,
        borderLeft: border,
      }}
    >
      <span
        style={{
          width: 18,
          textAlign: 'center',
          color: prefixColor,
          flexShrink: 0,
          userSelect: 'none',
          fontWeight: isAdd || isDel ? 600 : 400,
        }}
      >
        {prefix}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          color: textColor,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          padding: '0 8px 0 0',
        }}
      >
        {line.text ? <CodeView code={line.text} path={path} /> : ' '}
      </span>
    </div>
  );
}
