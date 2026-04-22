import { useRef, useState, useCallback } from 'react';
import { Button, Segmented, message, Typography, Space, Tag, Avatar } from 'antd';
import { CopyOutlined, CheckOutlined, RocketOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { ProChat, ChatMessage } from '@ant-design/pro-chat';
import { useNavigate } from 'react-router-dom';
import AmisRenderer from '../../components/AmisRenderer';
import { createHistory, adoptHistory } from '../../services/generation';
import { createProjectTask } from '../../services/projects';
import { useColors } from '../../theme';

const { Text } = Typography;

/**
 * 把后端自定义 SSE 转换为纯文本流（ProChat 直接读原始字节，不解析 SSE 格式）。
 * 同时从流中提取 amis_json、model_used 等元信息。
 */
function transformSSEStream(
  originalBody: ReadableStream<Uint8Array>,
  resultRef: React.MutableRefObject<{
    amisJson: string;
    modelUsed: string;
  } | null>,
): ReadableStream<Uint8Array> {
  const reader = originalBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let sseBuffer = '';

  return new ReadableStream({
    async pull(controller) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (sseBuffer.trim()) {
            processSSELines(sseBuffer.split('\n'), controller, encoder, resultRef);
          }
          controller.close();
          return;
        }

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        const hasOutput = processSSELines(lines, controller, encoder, resultRef);
        if (hasOutput) return;
      }
    },
  });
}

function processSSELines(
  lines: string[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  resultRef: React.MutableRefObject<{ amisJson: string; modelUsed: string } | null>,
): boolean {
  let hasOutput = false;
  for (const line of lines) {
    if (line.startsWith('event:') || !line.startsWith('data: ')) continue;
    const dataStr = line.slice(6);
    try {
      const data = JSON.parse(dataStr);
      if (data.content) {
        controller.enqueue(encoder.encode(data.content));
        hasOutput = true;
      }
      if (data.amis_json !== undefined) {
        resultRef.current = {
          amisJson: data.amis_json,
          modelUsed: data.model_used || '',
        };
      }
      if (data.model && !data.content) {
        resultRef.current = {
          ...(resultRef.current || { amisJson: '', modelUsed: '' }),
          modelUsed: data.model,
        };
      }
    } catch {
      // 忽略无法解析的行
    }
  }
  return hasOutput;
}

function formatJson(v: string | null): string {
  if (!v) return '';
  try {
    return JSON.stringify(typeof v === 'string' ? JSON.parse(v) : v, null, 2);
  } catch {
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  }
}

export default function Chat() {
  const darkColors = useColors();
  const [currentJson, setCurrentJson] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'json'>('preview');
  const pendingResultRef = useRef<{ amisJson: string; modelUsed: string } | null>(null);
  const extraDataRef = useRef<Map<string, { historyId?: number; adopted?: boolean; prompt?: string }>>(new Map());
  const lastPromptRef = useRef('');
  const navigate = useNavigate();

  const handleGenerateProject = useCallback(async () => {
    const amisJson = currentJson;
    if (!amisJson) {
      message.warning('当前没有可用的 Amis JSON');
      return;
    }
    const latestHistoryId = Array.from(extraDataRef.current.values())
      .reverse()
      .find((e) => e?.historyId)?.historyId;
    try {
      const resp = await createProjectTask({
        amis_json: typeof amisJson === 'string' ? amisJson : JSON.stringify(amisJson),
        tech_stack: 'uniapp-wot-h5',
        ui_library: 'wot-ui',
        source_history_id: latestHistoryId,
        llm_mode: 'auto',
      });
      message.success(`任务 #${resp.id} 已创建`);
      navigate(`/projects/${resp.id}`);
    } catch (e: any) {
      message.error(`创建项目任务失败: ${e.response?.data?.error || e.message}`);
    }
  }, [currentJson, navigate]);

  const handleCopyJson = () => {
    if (currentJson) {
      navigator.clipboard.writeText(formatJson(currentJson));
      message.success('已复制到剪贴板');
    }
  };

  const handleAdopt = useCallback(async (messageId: string) => {
    const extra = extraDataRef.current.get(messageId);
    if (!extra?.historyId) return;
    const amisJson = currentJson;
    if (!amisJson) return;
    try {
      await adoptHistory(extra.historyId, { final_json: amisJson });
      extraDataRef.current.set(messageId, { ...extra, adopted: true });
      message.success('已采纳，加入知识库！下次生成会更智能');
    } catch {
      message.error('采纳失败');
    }
  }, [currentJson]);

  const parsedSchema = (() => {
    if (!currentJson) return null;
    try {
      return typeof currentJson === 'string' ? JSON.parse(currentJson) : currentJson;
    } catch {
      return null;
    }
  })();

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 48px)',
        gap: 0,
        background: darkColors.bg,
      }}
    >
      {/* 左栏：ProChat 对话面板 —— v0 风去气泡 */}
      <div
        style={{
          width: '42%',
          minWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${darkColors.border}`,
          background: darkColors.bg,
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${darkColors.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="v0-pulse" />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: darkColors.textMuted,
              letterSpacing: 0.3,
            }}
          >
            描述需求 · AI 生成 Amis JSON
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ProChat
            helloMessage="你好，描述你想要的页面，我来帮你生成 amis 配置。"
            placeholder="例如：做一个用户列表页，包含搜索、分页、编辑弹窗……"
            chatItemRenderConfig={{
              avatarRender: (props: any) => {
                const isUser = props?.placement === 'right' || props?.role === 'user';
                return (
                  <Avatar
                    size={24}
                    icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      background: darkColors.surfaceElevated,
                      color: isUser ? darkColors.text : darkColors.accentCyan,
                      border: `1px solid ${darkColors.border}`,
                      fontSize: 12,
                    }}
                  />
                );
              },
            }}
            inputAreaProps={{
              style: {
                background: darkColors.surface,
                borderTop: `1px solid ${darkColors.border}`,
                padding: '12px 16px',
              },
            }}
            markdownProps={{
              components: {
                pre: ({ children }: any) => (
                  <pre
                    style={{
                      background: darkColors.bg,
                      border: `1px solid ${darkColors.border}`,
                      padding: 12,
                      borderRadius: 6,
                      overflow: 'auto',
                      maxHeight: 400,
                      fontSize: 12,
                      lineHeight: 1.6,
                      fontFamily: 'var(--font-mono)',
                      color: darkColors.text,
                    }}
                  >
                    {children}
                  </pre>
                ),
                code: ({ inline, children }: any) =>
                  inline ? (
                    <code
                      style={{
                        background: darkColors.surfaceElevated,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: darkColors.accentCyan,
                      }}
                    >
                      {children}
                    </code>
                  ) : (
                    <code>{children}</code>
                  ),
              },
            }}
            request={async (messages: ChatMessage[]) => {
              const history = messages.slice(0, -1).map((m) => ({
                role: m.role as string,
                content: typeof m.content === 'string' ? m.content : '',
              }));
              const lastMsg = messages[messages.length - 1];
              const prompt = typeof lastMsg.content === 'string' ? lastMsg.content : '';
              lastPromptRef.current = prompt;
              pendingResultRef.current = null;

              const resp = await fetch('/agent/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, stream: true, history }),
              });

              if (!resp.ok || !resp.body) {
                throw new Error(`生成失败: HTTP ${resp.status}`);
              }

              const transformedStream = transformSSEStream(resp.body, pendingResultRef);
              return new Response(transformedStream);
            }}
            onChatEnd={async (id: string) => {
              const result = pendingResultRef.current;
              if (!result?.amisJson) return;

              setCurrentJson(result.amisJson);

              try {
                const saved = await createHistory({
                  user_prompt: lastPromptRef.current,
                  generated_json: result.amisJson,
                  model_used: result.modelUsed || undefined,
                });
                extraDataRef.current.set(id, {
                  historyId: saved.id,
                  adopted: false,
                  prompt: lastPromptRef.current,
                });
              } catch {
                // 保存失败不影响体验
              }
            }}
            messageItemExtraRender={(msg: ChatMessage, type: string) => {
              if (type !== 'assistant') return null;
              const extra = extraDataRef.current.get(msg.id);
              if (!extra) return null;

              return (
                <div style={{ marginTop: 6 }}>
                  <Space wrap size={6}>
                    <Tag
                      style={{
                        background: 'transparent',
                        border: `1px solid ${darkColors.success}`,
                        color: darkColors.success,
                        fontSize: 11,
                      }}
                    >
                      ● 生成完成
                    </Tag>
                    {extra.adopted ? (
                      <Tag
                        icon={<CheckOutlined />}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${darkColors.accentCyan}`,
                          color: darkColors.accentCyan,
                          fontSize: 11,
                        }}
                      >
                        已采纳
                      </Tag>
                    ) : extra.historyId ? (
                      <Button
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleAdopt(msg.id)}
                      >
                        采纳入库
                      </Button>
                    ) : null}
                  </Space>
                </div>
              );
            }}
            style={{ height: '100%', background: darkColors.bg }}
          />
        </div>
      </div>

      {/* 右栏：预览 / JSON */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: darkColors.bg }}>
        <div
          style={{
            padding: '8px 16px',
            borderBottom: `1px solid ${darkColors.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            minHeight: 48,
          }}
        >
          <Segmented
            size="small"
            value={activeView}
            onChange={(v) => setActiveView(v as 'preview' | 'json')}
            options={[
              { label: '预览', value: 'preview' },
              { label: 'JSON', value: 'json' },
            ]}
          />
          {currentJson && (
            <Space size={8}>
              <Button
                size="small"
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleGenerateProject}
              >
                生成项目代码
              </Button>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyJson}>
                复制 JSON
              </Button>
            </Space>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: activeView === 'preview' ? '#FFFFFF' : darkColors.bg,
          }}
        >
          {!currentJson ? (
            <div
              style={{
                textAlign: 'center',
                padding: '120px 0',
                color: darkColors.textSubtle,
                background: darkColors.bg,
                height: '100%',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  marginBottom: 12,
                  color: darkColors.textSubtle,
                  letterSpacing: 0.5,
                }}
              >
                [ IDLE ]
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                生成的 amis 页面将在这里预览
              </Text>
            </div>
          ) : activeView === 'preview' ? (
            parsedSchema ? (
              <AmisRenderer schema={parsedSchema} style={{ padding: 16 }} />
            ) : (
              <div style={{ color: darkColors.destructive, padding: 16 }}>JSON 解析失败，请检查生成结果</div>
            )
          ) : (
            <pre
              style={{
                margin: 0,
                padding: 16,
                fontSize: 12.5,
                lineHeight: 1.7,
                fontFamily: 'var(--font-mono)',
                color: darkColors.text,
                background: darkColors.bg,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                minHeight: '100%',
              }}
            >
              {formatJson(currentJson)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
