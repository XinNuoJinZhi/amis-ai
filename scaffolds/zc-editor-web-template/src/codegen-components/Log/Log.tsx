import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Space, Input, Tooltip } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  ClearOutlined,
  OrderedListOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import AnsiToHtml from 'ansi-to-html';

export interface LogSource {
  url: string;
  method?: 'get' | 'post';
  data?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface LogProps {
  /** 日志数据源，可以是 URL 字符串或配置对象 */
  source?: string | LogSource;
  /** 展示区域高度，默认 500 */
  height?: number;
  /** 是否自动滚动到底部，默认 true */
  autoScroll?: boolean;
  /** 是否禁用 ANSI 颜色支持，默认 false */
  disableColor?: boolean;
  /** 加载中的占位文字 */
  placeholder?: string;
  /** 返回内容的字符编码，默认 utf-8 */
  encoding?: string;
  /** fetch 的 credentials 设置，默认 'include' */
  credentials?: RequestCredentials;
  /** 设置每行高度，启用虚拟渲染 */
  rowHeight?: number;
  /** 最大显示行数 */
  maxLength?: number;
  /** 可选日志操作 */
  operation?: Array<'stop' | 'restart' | 'clear' | 'showLineNumber' | 'filter'>;
  /** 外层 CSS 类名 */
  className?: string;
}

export const Log: React.FC<LogProps> = ({
  source,
  height = 500,
  autoScroll = true,
  disableColor = false,
  placeholder = '加载中...',
  encoding = 'utf-8',
  credentials = 'include',
  rowHeight,
  maxLength,
  operation = [],
  className,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [showLineNumber, setShowLineNumber] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ANSI 颜色转换器
  const ansiConverter = useMemo(() => {
    return new AnsiToHtml({
      fg: '#d4d4d4',
      bg: '#1e1e1e',
      newline: false,
      escapeXML: true,
      stream: true,
    });
  }, []);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (autoScroll && containerRef.current && !rowHeight) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [autoScroll, rowHeight]);

  // 获取日志源 URL 和配置
  const getSourceConfig = useCallback((): { url: string; options: RequestInit } | null => {
    if (!source) return null;

    if (typeof source === 'string') {
      return {
        url: source,
        options: {
          method: 'GET',
          credentials,
        },
      };
    }

    const { url, method = 'get', data, headers } = source;
    const options: RequestInit = {
      method: method.toUpperCase(),
      credentials,
      headers: headers,
    };

    if (data && method.toLowerCase() === 'post') {
      options.body = JSON.stringify(data);
      options.headers = {
        'Content-Type': 'application/json',
        ...headers,
      };
    }

    return { url, options };
  }, [source, credentials]);

  // 加载日志
  const loadLogs = useCallback(async () => {
    const config = getSourceConfig();
    if (!config) return;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(config.url, {
        ...config.options,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder(encoding);

      while (isRunning) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(line => line.length > 0);

        if (lines.length > 0) {
          setLogs(prev => {
            const newLogs = [...prev, ...lines];
            // 如果设置了 maxLength，限制日志行数
            if (maxLength && newLogs.length > maxLength) {
              return newLogs.slice(-maxLength);
            }
            return newLogs;
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 请求被取消，不显示错误
        return;
      }
      console.error('加载日志失败:', err);
      setError(`加载失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [getSourceConfig, encoding, maxLength, isRunning]);

  // 启动日志加载
  useEffect(() => {
    if (source && isRunning) {
      loadLogs();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [source, isRunning]);

  // 自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  // 停止/重启日志
  const handleToggle = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    } else {
      setIsRunning(true);
    }
  }, [isRunning]);

  // 清空日志
  const handleClear = useCallback(() => {
    setLogs([]);
  }, []);

  // 切换行号显示
  const handleToggleLineNumber = useCallback(() => {
    setShowLineNumber(prev => !prev);
  }, []);

  // 过滤日志
  const filteredLogs = useMemo(() => {
    if (!filterText) return logs;
    return logs.filter(line =>
      line.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [logs, filterText]);

  // 渲染日志行
  const renderLogLine = useCallback(
    (line: string, index: number) => {
      const html = disableColor ? line : ansiConverter.toHtml(line);
      const lineNumber = showLineNumber ? (
        <span
          style={{
            color: '#858585',
            minWidth: '40px',
            display: 'inline-block',
            textAlign: 'right',
            marginRight: '8px',
            userSelect: 'none',
          }}
        >
          {index + 1}
        </span>
      ) : null;

      return (
        <div
          key={index}
          style={{
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
            fontSize: '13px',
            lineHeight: rowHeight ? `${rowHeight}px` : '1.5',
            whiteSpace: rowHeight ? 'nowrap' : 'pre-wrap',
            wordBreak: rowHeight ? 'normal' : 'break-all',
          }}
        >
          {lineNumber}
          <span dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      );
    },
    [disableColor, ansiConverter, showLineNumber, rowHeight]
  );

  // 渲染操作按钮
  const renderOperations = () => {
    if (!operation || operation.length === 0) return null;

    return (
      <div
        style={{
          padding: '4px 8px',
          borderBottom: '1px solid #303030',
          backgroundColor: '#252526',
        }}
      >
        <Space size="small">
          {operation.includes('stop') && (
            <Tooltip title={isRunning ? '暂停' : '继续'}>
              <Button
                type="text"
                size="small"
                icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={handleToggle}
                style={{ color: '#d4d4d4' }}
              />
            </Tooltip>
          )}
          {operation.includes('restart') && (
            <Tooltip title="重新开始">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  handleClear();
                  setIsRunning(true);
                }}
                style={{ color: '#d4d4d4' }}
              />
            </Tooltip>
          )}
          {operation.includes('clear') && (
            <Tooltip title="清空">
              <Button
                type="text"
                size="small"
                icon={<ClearOutlined />}
                onClick={handleClear}
                style={{ color: '#d4d4d4' }}
              />
            </Tooltip>
          )}
          {operation.includes('showLineNumber') && (
            <Tooltip title={showLineNumber ? '隐藏行号' : '显示行号'}>
              <Button
                type="text"
                size="small"
                icon={<OrderedListOutlined />}
                onClick={handleToggleLineNumber}
                style={{ color: showLineNumber ? '#1890ff' : '#d4d4d4' }}
              />
            </Tooltip>
          )}
          {operation.includes('filter') && (
            <Input
              placeholder="过滤日志..."
              prefix={<SearchOutlined style={{ color: '#858585' }} />}
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              size="small"
              style={{
                width: 200,
                backgroundColor: '#3c3c3c',
                borderColor: '#3c3c3c',
                color: '#d4d4d4',
              }}
            />
          )}
        </Space>
      </div>
    );
  };

  return (
    <div
      className={className}
      style={{
        height,
        backgroundColor: '#1e1e1e',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {renderOperations()}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 12px',
          color: '#d4d4d4',
        }}
      >
        {loading && logs.length === 0 && (
          <div style={{ color: '#858585' }}>{placeholder}</div>
        )}
        {error && <div style={{ color: '#f14c4c' }}>{error}</div>}
        {filteredLogs.map((line, index) => renderLogLine(line, index))}
      </div>
    </div>
  );
};

export default Log;
