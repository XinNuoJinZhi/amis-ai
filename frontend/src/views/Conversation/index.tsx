// 通用 AI 对话页（左侧菜单「AI 对话」）
// 与「Amis 生成」（/amis）不同：这里不接 amis 系统提示词，纯文本对话。
// 模型由「系统设置 → 模型配置 → 通用对话」槽位决定（task_type=chat）。
//
// 布局：左侧会话栏（多会话、新建/重命名/删除）+ 右侧消息流（SSE 逐字打字机效果）。
// 会话与消息全部入 PostgreSQL（conversation_session / conversation_message），
// 不再用 localStorage —— 刷新或换设备都能拿回历史。

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  chatStream,
  createSession,
  deleteSession,
  getSession,
  listSessions,
  renameSession,
  type ChatStreamMeta,
  type ConversationMessage,
  type ConversationSession,
} from '../../services/conversation';
import { useColors } from '../../theme';

interface DisplayMessage {
  /** 来自 DB 的 id；流式时正在生成的 assistant 用临时负数 id 占位 */
  id: number | string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string | null;
  provider?: string | null;
  /** 流式中（assistant 还没收到 final 时） */
  pending?: boolean;
}

const HELLO: DisplayMessage = {
  id: 'hello',
  role: 'assistant',
  content: '你好！我是「AI 对话」助手，使用「系统设置 → 模型配置 → 通用对话」槽位配置的模型。问我什么都行～',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function dbMessageToDisplay(m: ConversationMessage): DisplayMessage {
  return {
    id: m.id,
    role: (m.role as DisplayMessage['role']) || 'assistant',
    content: m.content,
    model: m.model,
    provider: m.provider,
  };
}

export default function Conversation() {
  const c = useColors();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([HELLO]);
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  // 用 ref 跟踪正在流式的 assistant 临时 id，避免闭包陈旧
  const streamingAssistantRef = useRef<string | null>(null);
  // 当前流式请求的 AbortController，handleStop 时 abort
  const abortRef = useRef<AbortController | null>(null);

  // 首次挂载：拉会话列表，自动选中最新一条；空列表则建一条
  useEffect(() => {
    void (async () => {
      setLoadingSessions(true);
      try {
        const list = await listSessions();
        if (list.length === 0) {
          const created = await createSession();
          setSessions([created]);
          setActiveId(created.session_id);
        } else {
          setSessions(list);
          setActiveId(list[0].session_id);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '加载会话失败';
        message.error(msg);
      } finally {
        setLoadingSessions(false);
      }
    })();
  }, []);

  // 切换会话：拉详情
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void (async () => {
      setLoadingDetail(true);
      try {
        const detail = await getSession(activeId);
        if (cancelled) return;
        const list: DisplayMessage[] =
          detail.messages.length === 0
            ? [HELLO]
            : detail.messages.map(dbMessageToDisplay);
        setMessages(list);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : '加载消息失败';
        message.error(msg);
        setMessages([HELLO]);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // 自动滚到底（消息数量或最后一条 content 长度变化都触发）
  const lastLen = messages.length > 0 ? messages[messages.length - 1].content.length : 0;
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, lastLen, activeId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.session_id === activeId) ?? null,
    [sessions, activeId],
  );

  const lastMeta = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && (m.model || m.provider)) {
        return { model: m.model || '', provider: m.provider || '' };
      }
    }
    return null;
  }, [messages]);

  const refreshSessions = async () => {
    try {
      const list = await listSessions();
      setSessions(list);
    } catch {
      /* 忽略 */
    }
  };

  const handleNewSession = async () => {
    if (sending) return;
    try {
      const created = await createSession();
      setSessions((prev) => [created, ...prev]);
      setActiveId(created.session_id);
      setInput('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '新建会话失败';
      message.error(msg);
    }
  };

  const handleDeleteSession = async (sid: string) => {
    try {
      await deleteSession(sid);
      setSessions((prev) => {
        const next = prev.filter((s) => s.session_id !== sid);
        if (sid === activeId) {
          if (next.length > 0) {
            setActiveId(next[0].session_id);
          } else {
            // 全删完 → 自动建一条
            void (async () => {
              const created = await createSession();
              setSessions([created]);
              setActiveId(created.session_id);
            })();
          }
        }
        return next;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '删除失败';
      message.error(msg);
    }
  };

  const startRename = (s: ConversationSession) => {
    setRenamingId(s.session_id);
    setRenameValue(s.title);
  };

  const submitRename = async () => {
    if (!renamingId) return;
    const t = renameValue.trim();
    if (!t) {
      message.error('标题不能为空');
      return;
    }
    try {
      const updated = await renameSession(renamingId, t);
      setSessions((prev) =>
        prev.map((s) => (s.session_id === updated.session_id ? updated : s)),
      );
      setRenamingId(null);
      setRenameValue('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '重命名失败';
      message.error(msg);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !activeId) return;
    setSending(true);
    setInput('');

    // 占位：先把"hello 欢迎语"清掉（如果当前只有它），再 push 用户消息和 assistant pending
    const tempUserId = `tmp-u-${Date.now()}`;
    const tempAssistantId = `tmp-a-${Date.now()}`;
    streamingAssistantRef.current = tempAssistantId;

    setMessages((prev) => {
      const cleaned = prev.filter((m) => m.id !== 'hello');
      return [
        ...cleaned,
        { id: tempUserId, role: 'user', content: text },
        { id: tempAssistantId, role: 'assistant', content: '', pending: true },
      ];
    });

    let assistantAccum = '';
    let gotError = false;
    const controller = new AbortController();
    abortRef.current = controller;

    await chatStream(activeId, text, {
      onMeta: (meta: ChatStreamMeta) => {
        // 用真实 user_message id 替换临时 id，挂上 model/provider 到 assistant 占位
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === tempUserId) {
              return {
                ...m,
                id: meta.user_message.id,
                content: meta.user_message.content,
              };
            }
            if (m.id === tempAssistantId) {
              return { ...m, model: meta.model, provider: meta.provider };
            }
            return m;
          }),
        );
        // 如果后端回填了新标题（首条用户消息）→ 同步左侧列表
        if (meta.title && activeId) {
          setSessions((prev) =>
            prev.map((s) =>
              s.session_id === activeId
                ? { ...s, title: meta.title as string, updated_at: new Date().toISOString() }
                : s,
            ),
          );
        }
      },
      onChunk: (delta: string) => {
        assistantAccum += delta;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId ? { ...m, content: assistantAccum } : m,
          ),
        );
      },
      onFinal: (assistantMsg: ConversationMessage) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId
              ? {
                  id: assistantMsg.id,
                  role: 'assistant',
                  content: assistantMsg.content,
                  model: assistantMsg.model,
                  provider: assistantMsg.provider,
                  pending: false,
                }
              : m,
          ),
        );
      },
      onError: (err: string) => {
        gotError = true;
        message.error(`AI 对话失败: ${err}`);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId
              ? {
                  ...m,
                  content: m.content || `⚠️ 调用失败：${err}`,
                  pending: false,
                }
              : m,
          ),
        );
      },
    }, controller.signal);

    streamingAssistantRef.current = null;
    abortRef.current = null;

    // 用户主动停止时：assistant 还停在 pending=true 没收到 final → 兜底关掉
    // （stop 时后端会把已累积内容落库，但 final 事件已经发不到这里了）
    if (controller.signal.aborted) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantId
            ? {
                ...m,
                content: m.content
                  ? `${m.content}\n\n⏹ 已停止`
                  : '⏹ 已停止（未收到任何内容）',
                pending: false,
              }
            : m,
        ),
      );
    }

    setSending(false);
    // 把当前会话置顶（updated_at 改变了）；出错也刷新（updated_at 已 bump 过）
    if (!gotError) {
      void refreshSessions();
    }
  };

  const handleStop = () => {
    if (!sending) return;
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 48px)',
        background: c.bg,
      }}
    >
      {/* 左侧：会话列表 */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: `1px solid ${c.borderSubtle}`,
          display: 'flex',
          flexDirection: 'column',
          background: c.surface,
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderBottom: `1px solid ${c.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: c.textMuted,
              letterSpacing: 0.3,
            }}
          >
            会话 · {sessions.length}
          </span>
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => void handleNewSession()}
            disabled={sending}
          >
            新会话
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingSessions ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <Spin size="small" />
            </div>
          ) : sessions.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无会话"
              style={{ marginTop: 40 }}
            />
          ) : (
            <List
              dataSource={sessions}
              renderItem={(s) => {
                const isActive = s.session_id === activeId;
                return (
                  <div
                    key={s.session_id}
                    onClick={() => !sending && setActiveId(s.session_id)}
                    style={{
                      padding: '10px 12px',
                      cursor: sending && !isActive ? 'not-allowed' : 'pointer',
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      background: isActive ? c.surfaceElevated : 'transparent',
                      borderLeft: `3px solid ${isActive ? c.accentCyan : 'transparent'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      opacity: sending && !isActive ? 0.5 : 1,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: c.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {s.title || '新会话'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: c.textMuted,
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <ClockCircleOutlined style={{ fontSize: 10 }} />
                        {formatTime(s.updated_at)}
                      </div>
                    </div>
                    <Space size={2} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="重命名">
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => startRename(s)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="删除此会话？"
                        description="所有消息将一并删除，无法恢复。"
                        okText="删除"
                        okButtonProps={{ danger: true }}
                        cancelText="取消"
                        onConfirm={() => void handleDeleteSession(s.session_id)}
                      >
                        <Tooltip title="删除">
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  </div>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* 右侧：消息流 + 输入区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 顶栏 */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: `1px solid ${c.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span className="v0-pulse" />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: c.textMuted,
                letterSpacing: 0.3,
                whiteSpace: 'nowrap',
              }}
            >
              AI 对话 · task_type=chat
            </span>
            {activeSession && (
              <span
                style={{
                  fontSize: 13,
                  color: c.text,
                  marginLeft: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={activeSession.title}
              >
                {activeSession.title}
              </span>
            )}
            {lastMeta?.provider && (
              <Tag color="blue" style={{ fontSize: 11, marginLeft: 4 }}>
                {lastMeta.provider} / {lastMeta.model}
              </Tag>
            )}
          </div>
        </div>

        {/* 消息区 */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 0',
          }}
        >
          {loadingDetail ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : (
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>
              {messages.map((m) => (
                <MessageBubble key={String(m.id)} message={m} c={c} />
              ))}
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div
          style={{
            borderTop: `1px solid ${c.border}`,
            padding: '12px 20px',
            background: c.surface,
          }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input.TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入消息，回车发送，Shift+回车换行"
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={sending || !activeId}
                style={{
                  resize: 'none',
                  background: c.bg,
                  color: c.text,
                  borderColor: c.border,
                }}
              />
              {sending ? (
                <Tooltip title="停止生成（已生成部分会保留）">
                  <Button
                    type="primary"
                    danger
                    icon={<StopOutlined />}
                    onClick={handleStop}
                  >
                    停止
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || !activeId}
                >
                  发送
                </Button>
              )}
            </Space.Compact>
          </div>
        </div>
      </div>

      {/* 重命名弹窗 */}
      <Modal
        open={renamingId !== null}
        title="重命名会话"
        okText="保存"
        cancelText="取消"
        onOk={() => void submitRename()}
        onCancel={() => {
          setRenamingId(null);
          setRenameValue('');
        }}
        destroyOnClose
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          maxLength={80}
          showCount
          placeholder="会话标题"
          onPressEnter={() => void submitRename()}
          autoFocus
        />
      </Modal>
    </div>
  );
}

function MessageBubble({
  message,
  c,
}: {
  message: DisplayMessage;
  c: ReturnType<typeof useColors>;
}) {
  const isUser = message.role === 'user';
  const showTypingDot = message.role === 'assistant' && message.pending && !message.content;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      <Avatar
        size={28}
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          background: c.surfaceElevated,
          color: isUser ? c.text : c.accentCyan,
          border: `1px solid ${c.border}`,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          maxWidth: '78%',
          background: isUser ? c.surfaceElevated : c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          lineHeight: 1.7,
          color: c.text,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          minWidth: showTypingDot ? 64 : 'auto',
        }}
      >
        {showTypingDot ? (
          <span style={{ color: c.textMuted, fontSize: 12 }}>
            <span className="v0-pulse" style={{ marginRight: 8 }} />
            正在思考...
          </span>
        ) : (
          message.content || ' '
        )}
        {message.pending && message.content && (
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 14,
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              background: c.accentCyan,
              animation: 'v0-pulse 1s steps(2) infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
