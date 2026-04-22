import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tag,
  Space,
  Button,
  Input,
  Descriptions,
  Splitter,
  Empty,
  message,
  Typography,
  Collapse,
  Modal,
  Checkbox,
  Alert,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  StopOutlined,
  ReloadOutlined,
  RobotOutlined,
  ToolOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { ChatItem } from '@ant-design/pro-chat';
import {
  getProjectTask,
  addProjectTaskMessage,
  stopProjectTask,
  buildEventsWsUrl,
  getEventsHistory,
  sendPermissionDecision,
  getDevStatus,
  listTaskPages,
  reportRuntimeError,
  type ProjectTaskDetail,
  type TaskPage,
} from '../../services/projects';

/**
 * 共享的 markdown 渲染配置：覆盖 shiki 代码块（shiki 的 WASM 经常加载失败），
 * 用轻量 <pre> 替代，和 Chat 页保持一致。
 */
const markdownProps = {
  components: {
    pre: ({ children }: any) => (
      <pre
        style={{
          background: '#f6f8fa',
          padding: 10,
          borderRadius: 6,
          overflow: 'auto',
          maxHeight: 360,
          fontSize: 12,
          lineHeight: 1.55,
          margin: '6px 0',
        }}
      >
        {children}
      </pre>
    ),
  },
};

interface PermissionReq {
  request_id: string;
  tool: string;
  input: string;
  current_mode: string;
  required_mode: string;
  reason: string | null;
}

const { TextArea } = Input;
const { Text } = Typography;

// ==== 消息数据模型 ====
type Message =
  | { id: string; type: 'system'; content: string; ts: string }
  | { id: string; type: 'assistant'; thinking: string; content: string; ts: string; inThinking: boolean }
  | { id: string; type: 'tool'; name: string; input: string; output?: string; isError?: boolean; ts: string }
  | { id: string; type: 'user'; content: string; ts: string };

const STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  waiting_user: 'warning',
  succeeded: 'success',
  failed: 'error',
  stopped: 'default',
};

let idCounter = 0;
const nextId = () => `msg-${++idCounter}`;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const taskId = Number(id);

  const [task, setTask] = useState<ProjectTaskDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingPerm, setPendingPerm] = useState<PermissionReq | null>(null);
  const [rememberDecision, setRememberDecision] = useState(false);
  const [decidingPerm, setDecidingPerm] = useState(false);
  const [devLogs, setDevLogs] = useState<string[]>([]);
  const [devStatusKind, setDevStatusKind] = useState<'unknown' | 'starting' | 'ready' | 'failed'>('unknown');
  const [devFailReason, setDevFailReason] = useState<string | null>(null);
  const [taskPages, setTaskPages] = useState<TaskPage[]>([]);
  const [selectedPagePath, setSelectedPagePath] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  /** 是否跟随对话自动滚动到底部：用户手动往上滚会置 false，滚回底部或点"一键到底"重置为 true */
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchTask = async () => {
    try {
      const data = await getProjectTask(taskId);
      setTask(data);
    } catch (e: any) {
      message.error(`加载失败: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  // 监听 iframe 里种子项目 main.ts postMessage 上来的浏览器运行时错误
  // （Vite import-analysis、window.onerror、unhandledrejection、vite:error）
  // Vite 这类错误只通过 HMR WebSocket 推 overlay 不写 stdout，服务端 tail 抓不到，
  // 必须从浏览器里抓再转发给 backend。
  useEffect(() => {
    if (!taskId) return;
    const lastSent: { key: string; ts: number } = { key: '', ts: 0 };
    const handler = (e: MessageEvent) => {
      const data: any = e.data;
      if (!data || data.type !== 'amis-ai/runtime-error') return;
      const { source, message: msg, stack, href } = data;
      if (typeof msg !== 'string' || !msg.trim()) return;
      // 节流：同一条错误 3 秒内只上报一次（浏览器可能重复触发）
      const key = `${source}::${msg}`;
      const now = Date.now();
      if (key === lastSent.key && now - lastSent.ts < 3000) return;
      lastSent.key = key;
      lastSent.ts = now;
      reportRuntimeError(taskId, { source, message: msg, stack, href })
        .then(() => fetchTask()) // 刷新任务状态（running）和 fix_attempts
        .catch((err) => {
          // 上报失败不打扰用户（常见：409 任务已终止 / 429 超上限），只 console 记录
          console.warn('[amis-ai] runtime-error 上报失败', err);
        });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // 轮询 sandbox dev_status，实时展示 Vite 启动日志
  useEffect(() => {
    if (!taskId) return;
    if (devStatusKind === 'ready' || devStatusKind === 'failed') return; // 终态停止轮询

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const resp = await getDevStatus(taskId);
        if (cancelled) return;
        setDevLogs(resp.recent_logs || []);
        const ds = resp.dev_status;
        if (typeof ds === 'string') {
          if (ds === 'starting') setDevStatusKind('starting');
        } else if (ds && typeof ds === 'object') {
          if (ds.ready) {
            setDevStatusKind('ready');
            fetchTask(); // 顺便刷新 task.status
          } else if (ds.failed) {
            setDevStatusKind('failed');
            setDevFailReason(ds.failed.reason || 'unknown');
          }
        }
      } catch {
        // 没跑到 sandbox 或者还没 dev_start，忽略
      }
    };
    tick();
    const timer = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [taskId, devStatusKind]);

  // dev ready 后加载一次 pages 列表（失败不崩溃）
  useEffect(() => {
    if (devStatusKind !== 'ready' || !taskId) return;
    (async () => {
      try {
        const pages = await listTaskPages(taskId);
        setTaskPages(pages);
        if (pages.length > 0 && !selectedPagePath) {
          setSelectedPagePath(pages[0].path);
        }
      } catch {
        // pages.json 读不到不阻塞
      }
    })();
  }, [devStatusKind, taskId]);

  // 初次加载：拉取历史事件回放，然后建立 WebSocket 收增量
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    (async () => {
      // 1. 历史事件回放（浏览器刷新后恢复场景）
      try {
        const history = await getEventsHistory(taskId);
        if (cancelled) return;
        if (history.length > 0) {
          setMessages([
            {
              id: nextId(),
              type: 'system',
              content: `📜 已加载 ${history.length} 条历史事件`,
              ts: new Date().toISOString(),
            },
          ]);
          history.forEach((payload: any) => handleEvent(payload));
        }
      } catch (e) {
        // 没有历史是正常的（新任务）
      }

      if (cancelled) return;

      // 2. 建立 WebSocket 订阅增量
      const wsUrl = buildEventsWsUrl(taskId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), type: 'system', content: '已连接事件流', ts: new Date().toISOString() },
        ]);
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          handleEvent(payload);
        } catch {
          // 忽略非 JSON 消息
        }
      };

      ws.onerror = () => {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), type: 'system', content: '⚠️ WebSocket 错误', ts: new Date().toISOString() },
        ]);
      };

      ws.onclose = () => {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), type: 'system', content: '事件流已关闭', ts: new Date().toISOString() },
        ]);
      };
    })();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [taskId]);

  /**
   * 核心：把原子事件聚合成对话式消息
   * - text_delta 追加到最近一条 assistant 消息；识别 <think> 标签切换到 thinking 字段
   * - tool_use 关闭当前 assistant 消息并新增 tool 消息
   * - tool_result 找到最近的同名 tool 消息填 output
   * - status_change / turn_complete 新增 system 消息
   */
  const handleEvent = (payload: any) => {
    const type = payload.type;
    const data = payload.data;

    setMessages((prev) => {
      const next = [...prev];

      if (type === 'text_delta' && typeof data === 'string') {
        // 找/创建最近一条 assistant 消息
        let last = next.length > 0 ? next[next.length - 1] : null;
        if (!last || last.type !== 'assistant') {
          last = {
            id: nextId(),
            type: 'assistant',
            thinking: '',
            content: '',
            inThinking: false,
            ts: new Date().toISOString(),
          };
          next.push(last);
        }
        // 追加 delta，处理 <think>...</think> 边界
        const updated = { ...(last as Extract<Message, { type: 'assistant' }>) };
        let remain = data;
        while (remain.length > 0) {
          if (!updated.inThinking) {
            const thinkStart = remain.indexOf('<think>');
            if (thinkStart === -1) {
              updated.content += remain;
              break;
            }
            updated.content += remain.slice(0, thinkStart);
            remain = remain.slice(thinkStart + '<think>'.length);
            updated.inThinking = true;
          } else {
            const thinkEnd = remain.indexOf('</think>');
            if (thinkEnd === -1) {
              updated.thinking += remain;
              break;
            }
            updated.thinking += remain.slice(0, thinkEnd);
            remain = remain.slice(thinkEnd + '</think>'.length);
            updated.inThinking = false;
          }
        }
        next[next.length - 1] = updated;
      } else if (type === 'tool_use') {
        next.push({
          id: nextId(),
          type: 'tool',
          name: data.name,
          input: data.input,
          ts: new Date().toISOString(),
        });
      } else if (type === 'tool_result') {
        // 找最近同名且 output 为空的 tool 消息
        for (let i = next.length - 1; i >= 0; i--) {
          const m = next[i];
          if (m.type === 'tool' && m.name === data.name && m.output === undefined) {
            next[i] = { ...m, output: data.output, isError: data.is_error };
            break;
          }
        }
      } else if (type === 'status_change') {
        next.push({
          id: nextId(),
          type: 'system',
          content: `📊 状态变更: ${data}`,
          ts: new Date().toISOString(),
        });
        fetchTask();
      } else if (type === 'turn_complete') {
        next.push({
          id: nextId(),
          type: 'system',
          content: '✅ 一轮对话完成',
          ts: new Date().toISOString(),
        });
      } else if (type === 'llm_request_start') {
        next.push({
          id: nextId(),
          type: 'system',
          content: `🧠 LLM 推理中（${data.model}，${data.messages} 条消息，${data.tools} 个工具）...`,
          ts: new Date().toISOString(),
        });
      } else if (type === 'llm_request_end') {
        const sec = (data.elapsed_ms / 1000).toFixed(1);
        next.push({
          id: nextId(),
          type: 'system',
          content: data.success
            ? `⚡ LLM 响应完成（耗时 ${sec}s）`
            : `⚠️ LLM 响应失败（耗时 ${sec}s）`,
          ts: new Date().toISOString(),
        });
      } else if (type === 'error_message' && typeof data === 'string') {
        next.push({
          id: nextId(),
          type: 'system',
          content: data,
          ts: new Date().toISOString(),
        });
      } else if (type === 'permission_request') {
        // 弹权限审批 Modal（把 data 复制到 React state 交给 Modal 渲染）
        setPendingPerm({
          request_id: data.request_id,
          tool: data.tool,
          input: data.input,
          current_mode: data.current_mode,
          required_mode: data.required_mode,
          reason: data.reason,
        });
        next.push({
          id: nextId(),
          type: 'system',
          content: `⚠️ 需要审批：工具 ${data.tool}`,
          ts: new Date().toISOString(),
        });
      }

      return next;
    });
  };

  useEffect(() => {
    if (autoScroll) {
      // 用 behavior: 'auto'（即时滚动）而非 'smooth'：smooth 动画期间的 scroll 事件
      // 会让 handleScroll 误判"用户在手动往上滚"（动画中间 scrollTop 距底还大于阈值），
      // 从而把 autoScroll 锁成 false → 自动跟随就坏了
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages.length, autoScroll]);

  /** 滚动容器事件：根据距底距离判断是否"脱离自动跟随" */
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(nearBottom);
  };

  /** 点击一键到底：滚到底 + 恢复跟随 */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    setAutoScroll(true);
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    const content = inputText;
    // 乐观更新
    setMessages((prev) => [
      ...prev,
      { id: nextId(), type: 'user', content, ts: new Date().toISOString() },
    ]);
    setInputText('');
    try {
      await addProjectTaskMessage(taskId, content);
    } catch (e: any) {
      message.error(`发送失败: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handlePermissionDecision = async (allow: boolean) => {
    if (!pendingPerm || decidingPerm) return;
    setDecidingPerm(true);
    try {
      await sendPermissionDecision(
        taskId,
        pendingPerm.request_id,
        allow,
        rememberDecision,
      );
      setPendingPerm(null);
      setRememberDecision(false);
    } catch (e: any) {
      message.error(`发送决策失败: ${e.message}`);
    } finally {
      setDecidingPerm(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopProjectTask(taskId);
      message.success('已发送停止指令');
      fetchTask();
    } catch (e: any) {
      message.error(`停止失败: ${e.message}`);
    }
  };

  if (!task) return <Card loading />;

  // 允许在任何非终止且非 stopped 状态下追加消息 —— 尤其是 succeeded/failed 之后，
  // 用户可能看到了运行时错误或想微调样式，需要继续让 Agent 修改
  const canSend = task.status !== 'stopped';
  const previewUrl = task.preview_port ? `http://localhost:${task.preview_port}/` : null;

  return (
    <div style={{ height: 'calc(100vh - 100px)' }}>
      {/* 权限审批 Modal */}
      <Modal
        open={!!pendingPerm}
        title={
          <Space>
            <span style={{ color: '#faad14' }}>⚠️ 权限审批请求</span>
          </Space>
        }
        width={600}
        maskClosable={false}
        closable={false}
        footer={[
          <Checkbox
            key="remember"
            checked={rememberDecision}
            onChange={(e) => setRememberDecision(e.target.checked)}
            style={{ marginRight: 'auto', float: 'left' }}
          >
            本任务后续同工具自动通过
          </Checkbox>,
          <Button
            key="deny"
            onClick={() => handlePermissionDecision(false)}
            disabled={decidingPerm}
          >
            拒绝本次
          </Button>,
          <Button
            key="allow"
            type="primary"
            onClick={() => handlePermissionDecision(true)}
            loading={decidingPerm}
            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
          >
            允许本次
          </Button>,
        ]}
      >
        {pendingPerm && (
          <>
            <Alert
              type="warning"
              message={`Agent 想调用工具 「${pendingPerm.tool}」`}
              description={
                <>
                  当前模式: <Tag>{pendingPerm.current_mode}</Tag>
                  需要模式: <Tag color="orange">{pendingPerm.required_mode}</Tag>
                  {pendingPerm.reason && (
                    <div style={{ marginTop: 4 }}>原因: {pendingPerm.reason}</div>
                  )}
                </>
              }
              style={{ marginBottom: 12 }}
            />
            <Typography.Text strong>工具输入</Typography.Text>
            <pre
              style={{
                background: '#fafafa',
                padding: 10,
                fontSize: 12,
                maxHeight: 250,
                overflow: 'auto',
                border: '1px solid #eee',
                marginTop: 4,
              }}
            >
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(pendingPerm.input), null, 2);
                } catch {
                  return pendingPerm.input;
                }
              })()}
            </pre>
          </>
        )}
      </Modal>

      <Card
        size="small"
        style={{ marginBottom: 12 }}
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} />
            <span>任务 #{task.id}</span>
            <Tag color={STATUS_COLOR[task.status] || 'default'}>{task.status}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTask}>刷新</Button>
            {canSend && <Button danger icon={<StopOutlined />} onClick={handleStop}>停止</Button>}
          </Space>
        }
      >
        <Descriptions size="small" column={4}>
          <Descriptions.Item label="技术栈">{task.tech_stack}</Descriptions.Item>
          <Descriptions.Item label="UI 库">{task.ui_library}</Descriptions.Item>
          <Descriptions.Item label="预览端口">
            {task.preview_port ? `:${task.preview_port}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="修复次数">{task.fix_attempts} / 5</Descriptions.Item>
        </Descriptions>
      </Card>

      <Splitter style={{ height: 'calc(100% - 80px)' }}>
        <Splitter.Panel defaultSize="45%" min="30%">
          <Card
            size="small"
            title={<Space><RobotOutlined /> 会话</Space>}
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{ height: '100%', overflowY: 'auto', padding: 12, background: '#f5f5f5' }}
              >
                {messages.length === 0 ? (
                  <Empty description="等待 Agent 响应..." />
                ) : (
                  messages.map((m) => <MessageBubble key={m.id} message={m} />)
                )}
                <div ref={messagesEndRef} />
              </div>
              {!autoScroll && (
                <Button
                  shape="round"
                  size="small"
                  type="primary"
                  onClick={scrollToBottom}
                  style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 2,
                  }}
                >
                  ↓ 回到最新
                </Button>
              )}
            </div>
            <div style={{ padding: 8, borderTop: '1px solid #eee', background: '#fff' }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  rows={2}
                  placeholder="追加消息（例：把按钮颜色改成蓝色）"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={!canSend}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sending}
                  disabled={!canSend || !inputText.trim()}
                  onClick={handleSend}
                  style={{ height: 'auto' }}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </Card>
        </Splitter.Panel>

        <Splitter.Panel>
          <Card
            size="small"
            title="沙箱预览"
            styles={{ body: { padding: 0, height: 'calc(100% - 40px)' } }}
            style={{ height: '100%' }}
          >
            {devStatusKind === 'ready' && previewUrl ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    padding: '6px 10px',
                    background: '#fafafa',
                    borderBottom: '1px solid #eee',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>📄 页面：</Text>
                  {taskPages.length > 0 ? (
                    <Select
                      size="small"
                      value={selectedPagePath}
                      onChange={setSelectedPagePath}
                      style={{ minWidth: 240 }}
                      options={taskPages.map((p) => ({
                        value: p.path,
                        label: `${p.title} (${p.path})`,
                      }))}
                    />
                  ) : (
                    <Text type="secondary">加载中...</Text>
                  )}
                  <span style={{ flex: 1 }} />
                  <a
                    href={
                      selectedPagePath
                        ? `${previewUrl}${selectedPagePath}`
                        : previewUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11 }}
                  >
                    🔗 新窗口打开
                  </a>
                </div>
                <iframe
                  key={selectedPagePath}
                  src={
                    selectedPagePath
                      ? `${previewUrl}${selectedPagePath}`
                      : previewUrl
                  }
                  style={{ flex: 1, width: '100%', border: 'none' }}
                  title="Preview"
                />
              </div>
            ) : (
              <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
                {devStatusKind === 'failed' ? (
                  <Alert
                    type="error"
                    message="Vite dev server 启动失败"
                    description={devFailReason || '未知错误'}
                    showIcon
                  />
                ) : (
                  <Alert
                    type="info"
                    message={
                      <Space>
                        <span>⏳ Vite dev server 启动中</span>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({devStatusKind === 'starting' ? '正在安装依赖/编译' : '等待 Agent 调用 dev_start'})
                        </Text>
                      </Space>
                    }
                    description={
                      previewUrl ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          就绪后会在 <code>{previewUrl}</code> 自动加载
                        </Text>
                      ) : null
                    }
                    showIcon
                  />
                )}
                {devLogs.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text strong style={{ fontSize: 12 }}>🪵 实时启动日志（最近 {devLogs.length} 行）</Text>
                    <pre
                      style={{
                        marginTop: 6,
                        padding: 10,
                        fontSize: 11,
                        background: '#1e1e1e',
                        color: '#d4d4d4',
                        borderRadius: 4,
                        maxHeight: 400,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {devLogs.join('\n')}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}

// ==== 消息气泡组件 ====

function MessageBubble({ message: m }: { message: Message }) {
  const time = new Date(m.ts).toLocaleTimeString();

  if (m.type === 'system') {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {time} · {m.content}
        </Text>
      </div>
    );
  }

  if (m.type === 'user') {
    return (
      <div style={{ marginBottom: 10 }}>
        <ChatItem
          placement="right"
          avatar={{ avatar: '🧑', title: '你', backgroundColor: '#fa8c16' }}
          message={m.content}
          time={new Date(m.ts).getTime()}
          markdownProps={markdownProps}
        />
      </div>
    );
  }

  if (m.type === 'assistant') {
    const hasThinking = m.thinking.trim().length > 0;
    // 关键：用 trim 判断，避免 <think></think> 解析后残留的 "\n\n" 空内容渲染空白气泡
    const hasContent = m.content.trim().length > 0;
    return (
      <div style={{ marginBottom: 10 }}>
        {hasThinking && (
          <div style={{ maxWidth: '95%', marginBottom: 4 }}>
            <Collapse
              size="small"
              defaultActiveKey={['thinking']}
              style={{ background: '#fafafa' }}
              items={[
                {
                  key: 'thinking',
                  label: (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <BulbOutlined /> 思考过程
                      {m.inThinking && <span style={{ color: '#faad14' }}> · 思考中...</span>}
                    </Text>
                  ),
                  children: (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#666',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'inherit',
                      }}
                    >
                      {m.thinking}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
        {hasContent && (
          <ChatItem
            placement="left"
            avatar={{ avatar: '🤖', title: '助手', backgroundColor: '#1677ff' }}
            message={m.content}
            time={new Date(m.ts).getTime()}
            markdownProps={markdownProps}
          />
        )}
        {!hasThinking && !hasContent && m.inThinking && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <RobotOutlined /> 思考中...
          </Text>
        )}
      </div>
    );
  }

  if (m.type === 'tool') {
    const color = m.isError ? '#ff4d4f' : '#52c41a';
    return (
      <div style={{ marginBottom: 10 }}>
        <Text type="secondary" style={{ fontSize: 10 }}>
          <ToolOutlined style={{ color }} /> 工具调用 · {time}
        </Text>
        <div
          style={{
            background: '#fff',
            padding: 10,
            borderRadius: 6,
            border: `1px solid ${color}`,
            marginTop: 2,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <Tag color={m.isError ? 'error' : 'success'}>{m.name}</Tag>
          </div>
          <Collapse
            size="small"
            ghost
            items={[
              {
                key: 'input',
                label: <Text style={{ fontSize: 12 }}>📥 输入</Text>,
                children: (
                  <pre style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {tryPretty(m.input)}
                  </pre>
                ),
              },
              ...(m.output !== undefined
                ? [
                    {
                      key: 'output',
                      label: (
                        <Text style={{ fontSize: 12 }}>
                          📤 返回 {m.isError && <Tag color="error">error</Tag>}
                        </Text>
                      ),
                      children: (
                        <pre style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                          {m.output}
                        </pre>
                      ),
                    },
                  ]
                : [{ key: 'pending', label: <Text type="secondary" style={{ fontSize: 12 }}>⏳ 等待执行结果...</Text>, children: null }]),
            ]}
          />
        </div>
      </div>
    );
  }

  return null;
}

function tryPretty(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}
