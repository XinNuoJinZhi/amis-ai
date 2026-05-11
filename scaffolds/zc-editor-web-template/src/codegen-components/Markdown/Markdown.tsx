import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface MarkdownProps {
  /** Markdown 内容 */
  value?: string;
  /** 外部 Markdown 文件地址 */
  src?: string;
  /** 字段名（用于数据联动） */
  name?: string;
  /** 类名 */
  className?: string;
  /** 高级配置 */
  options?: {
    /** 是否支持 HTML 标签，默认 false */
    html?: boolean;
    /** 是否自动识别链接，默认 true */
    linkify?: boolean;
    /** 是否回车就是换行，默认 false */
    breaks?: boolean;
  };
}

export const Markdown: React.FC<MarkdownProps> = ({
  value,
  src,
  name,
  className,
  options = {},
}) => {
  const [content, setContent] = useState<string>(value || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { html = false, breaks = false } = options;

  // 当 value 变化时更新内容
  useEffect(() => {
    if (value !== undefined) {
      setContent(value);
    }
  }, [value]);

  // 从外部 URL 加载 Markdown 内容
  useEffect(() => {
    if (!src) return;

    const loadContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(src);
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          // JSON 格式响应
          const json = await response.json();
          if (json.status === 0 && json.data) {
            setContent(json.data);
          } else if (json.data) {
            setContent(json.data);
          } else {
            setError('无效的响应格式');
          }
        } else if (
          contentType.includes('text/markdown') ||
          contentType.includes('text/x-markdown') ||
          contentType.includes('text/plain')
        ) {
          // 纯文本格式
          const text = await response.text();
          setContent(text);
        } else {
          // 尝试作为纯文本处理
          const text = await response.text();
          setContent(text);
        }
      } catch (err) {
        console.error('加载 Markdown 失败:', err);
        setError(`加载失败: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [src]);

  // 处理换行
  const processedContent = useMemo(() => {
    if (breaks && content) {
      // 将单个换行符转换为两个换行符（Markdown 段落）
      return content.replace(/(?<!\n)\n(?!\n)/g, '  \n');
    }
    return content;
  }, [content, breaks]);

  if (loading) {
    return (
      <div className={className} style={{ color: '#999', padding: '8px 0' }}>
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{ color: '#ff4d4f', padding: '8px 0' }}>
        {error}
      </div>
    );
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={html ? [rehypeRaw] : []}
        components={{
          // 代码块高亮
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // 视频支持：![text](video.mp4) 语法
          img({ node, src, alt, ...props }: any) {
            if (src && /\.(mp4|webm|ogg)$/i.test(src)) {
              return (
                <video controls style={{ maxWidth: '100%' }}>
                  <source src={src} />
                  {alt}
                </video>
              );
            }
            return <img src={src} alt={alt} style={{ maxWidth: '100%' }} {...props} />;
          },
          // 链接在新窗口打开
          a({ node, href, children, ...props }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
