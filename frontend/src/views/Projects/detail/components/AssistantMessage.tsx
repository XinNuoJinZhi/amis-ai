import { useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ColorPalette } from '../../../../theme';
import CodeView from './CodeView';

/**
 * Assistant 文本渲染 —— 把 LLM 输出当 markdown 渲染：
 *   - 标题 / 列表 / 加粗 / 行内代码 / 表格 / 任务列表（GFM）
 *   - 代码块走 CodeView 语法高亮（按 ```lang 标记或推断）
 *   - 保留原项目的 `<think>` 折叠行为：上层 ChatPanel.splitThinkSegments 切完段后，
 *     再把 text 段交给本组件按 markdown 渲染
 */
interface AssistantMessageProps {
  content: string;
  c: ColorPalette;
}

export default function AssistantMessage({ content, c }: AssistantMessageProps) {
  const components = useMemo(
    () => ({
      // ```lang ... ``` 代码块：交给 CodeView，hljs 语法高亮
      code({
        inline,
        className,
        children,
        ...rest
      }: {
        inline?: boolean;
        className?: string;
        children?: ReactNode;
      }) {
        const text = String(children ?? '').replace(/\n$/, '');
        const m = /^language-([\w-]+)$/.exec(className ?? '');
        const lang = m?.[1];
        if (inline || (!lang && !text.includes('\n'))) {
          // 行内 `code`：仅做 monospace + 微背景，不走 SyntaxHighlighter
          return (
            <code
              {...rest}
              style={{
                fontFamily: 'var(--font-mono)',
                background: c.surfaceElevated,
                padding: '1px 5px',
                borderRadius: 3,
                fontSize: '0.9em',
                color: c.text,
              }}
            >
              {text}
            </code>
          );
        }
        return (
          <div
            style={{
              margin: '6px 0',
              border: `1px solid ${c.borderSubtle}`,
              borderRadius: 4,
              background: c.surface,
              overflow: 'auto',
              padding: '4px 0',
            }}
          >
            <CodeView code={text} language={lang} fontSize={11.5} lineHeight="17px" />
          </div>
        );
      },
      // 段落：去掉默认 margin，跟其他元素一致
      p({ children }: { children?: ReactNode }) {
        return <p style={{ margin: '4px 0', lineHeight: 1.6 }}>{children}</p>;
      },
      // 列表压缩
      ul({ children }: { children?: ReactNode }) {
        return <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>;
      },
      ol({ children }: { children?: ReactNode }) {
        return <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>;
      },
      li({ children }: { children?: ReactNode }) {
        return <li style={{ marginBottom: 2, lineHeight: 1.55 }}>{children}</li>;
      },
      // 标题：变小一点，跟对话块和谐
      h1({ children }: { children?: ReactNode }) {
        return <div style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px', color: c.text }}>{children}</div>;
      },
      h2({ children }: { children?: ReactNode }) {
        return <div style={{ fontSize: 14, fontWeight: 600, margin: '6px 0 3px', color: c.text }}>{children}</div>;
      },
      h3({ children }: { children?: ReactNode }) {
        return <div style={{ fontSize: 13.5, fontWeight: 600, margin: '6px 0 3px', color: c.text }}>{children}</div>;
      },
      // 链接：accentCyan + 下划线
      a({ href, children }: { href?: string; children?: ReactNode }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ color: c.accentCyan, textDecoration: 'underline' }}
          >
            {children}
          </a>
        );
      },
      // 引用块
      blockquote({ children }: { children?: ReactNode }) {
        return (
          <blockquote
            style={{
              margin: '4px 0',
              padding: '2px 10px',
              borderLeft: `2px solid ${c.borderSubtle}`,
              color: c.textMuted,
            }}
          >
            {children}
          </blockquote>
        );
      },
      // GFM 表格
      table({ children }: { children?: ReactNode }) {
        return (
          <div style={{ overflowX: 'auto', margin: '4px 0' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>{children}</table>
          </div>
        );
      },
      th({ children }: { children?: ReactNode }) {
        return (
          <th
            style={{
              padding: '4px 8px',
              borderBottom: `1px solid ${c.border}`,
              textAlign: 'left',
              color: c.textMuted,
              fontWeight: 500,
            }}
          >
            {children}
          </th>
        );
      },
      td({ children }: { children?: ReactNode }) {
        return (
          <td style={{ padding: '4px 8px', borderBottom: `1px solid ${c.borderSubtle}`, color: c.text }}>
            {children}
          </td>
        );
      },
    }),
    [c],
  );

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, color: c.text }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components as Record<string, (props: any) => ReactNode>}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
