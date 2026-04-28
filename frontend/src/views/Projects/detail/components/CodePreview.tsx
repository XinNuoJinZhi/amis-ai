import type { ColorPalette } from '../../../../theme';
import CodeView from './CodeView';

/**
 * 代码预览 —— write_file 整文件覆盖场景的展开视图。
 *   - 头部摘要：`new file · N lines · X chars`
 *   - 内容：CodeView 带 hljs 语法高亮 + 行号 gutter（按 path 后缀推断语言）
 */
interface CodePreviewProps {
  content: string;
  c: ColorPalette;
  /** 文件路径（用于按后缀推断高亮语言；vue/json/ts 都能识别） */
  path?: string;
  maxHeight?: number;
  /** 头部摘要前缀文案，默认 "new file" */
  headerPrefix?: string;
}

function humanLen(n: number): string {
  if (n < 1024) return `${n} chars`;
  return `${(n / 1024).toFixed(1)}k chars`;
}

export default function CodePreview({
  content,
  c,
  path,
  maxHeight = 320,
  headerPrefix = 'new file',
}: CodePreviewProps) {
  const lineCount = content.split('\n').length;

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
        <span style={{ color: c.success }}>{headerPrefix}</span>
        <span>·</span>
        <span>{lineCount} lines</span>
        <span>·</span>
        <span>{humanLen(content.length)}</span>
      </div>
      <div
        style={{
          maxHeight,
          overflow: 'auto',
          background: 'transparent',
        }}
      >
        <CodeView code={content} path={path} showLineNumbers />
      </div>
    </div>
  );
}
