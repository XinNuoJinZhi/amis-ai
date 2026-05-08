import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Drawer, Input, message as antdMessage, Modal, Space, Spin, Segmented, Tabs, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  MessageOutlined,
  FolderOutlined,
  CodeOutlined,
  BugOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useColors, type ColorPalette } from '../../../theme';
import { useIdeStore } from '../../../stores/ide';
import {
  adoptProjectTask,
  getProjectTask,
  getDevStatus,
  stopProjectTask,
  type ProjectTaskDetail,
} from '../../../services/projects';
import { useIframeConsole } from './hooks/useIframeConsole';
import { useProjectEvents } from './hooks/useProjectEvents';
import { useTaskPhase, type ViewPhase } from './hooks/useTaskPhase';
import OnboardingView from './OnboardingView';
import WorkspaceView from './WorkspaceView';
import ChatPanel from './panels/ChatPanel';
import FileTreePanel from './panels/FileTreePanel';
import EditorPanel from './panels/EditorPanel';
import PreviewPanel, { type PreviewAdoptInfo } from './panels/PreviewPanel';
import TerminalPanel from './panels/TerminalPanel';
import ConsolePanel from './panels/ConsolePanel';
import LogsPanel from './panels/LogsPanel';
import { ExecutionDetailsPanel } from './panels/ExecutionDetailsPanel';
import PagesPanel from './panels/PagesPanel';

const STATUS_TEXT: Record<string, string> = {
  pending: '待启动',
  running: '运行中',
  waiting_user: '需介入',
  succeeded: '成功',
  failed: '失败',
  stopped: '已停止',
};

function devStatusLabel(s: any, c: ColorPalette): { text: string; color: string; pulse: boolean } {
  if (!s) return { text: 'UNKNOWN', color: c.textSubtle, pulse: false };
  if (typeof s === 'string') {
    switch (s) {
      case 'not_started':
        return { text: 'NOT STARTED', color: c.textSubtle, pulse: false };
      case 'starting':
        return { text: 'STARTING', color: c.warning, pulse: true };
      default:
        return { text: s.toUpperCase(), color: c.text, pulse: false };
    }
  }
  if (typeof s === 'object') {
    if ('ready' in s) return { text: 'READY', color: c.success, pulse: false };
    if ('failed' in s) return { text: 'FAILED', color: c.destructive, pulse: false };
    if ('runtime_error' in s) return { text: 'RUNTIME ERROR', color: c.destructive, pulse: true };
  }
  return { text: 'UNKNOWN', color: c.textSubtle, pulse: false };
}

function isDevReady(s: any): boolean {
  if (!s) return false;
  if (typeof s === 'object' && 'ready' in s) return true;
  if (typeof s === 'object' && 'runtime_error' in s) return true;
  return false;
}

function StatusBar({ task, dev, c }: { task: ProjectTaskDetail; dev: any; c: ColorPalette }) {
  const ds = devStatusLabel(dev, c);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 12px',
        height: 22,
        background: c.bg,
        borderTop: `1px solid ${c.border}`,
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        color: c.textMuted,
        letterSpacing: 0.4,
      }}
    >
      <span>
        task <span style={{ color: c.text }}>#{task.id}</span>
      </span>
      <span>
        status <span style={{ color: c.text }}>{STATUS_TEXT[task.status] || task.status}</span>
      </span>
      <span>
        dev{' '}
        <span style={{ color: ds.color }}>
          {ds.pulse && (
            <span
              className="v0-pulse"
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                marginRight: 4,
                verticalAlign: 'middle',
              }}
            />
          )}
          {ds.text}
        </span>
      </span>
      {task.preview_port && (
        <span>
          port <span style={{ color: c.accentCyan }}>:{task.preview_port}</span>
        </span>
      )}
      <span>
        fix <span style={{ color: c.text }}>{task.fix_attempts}/5</span>
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ color: c.textSubtle }}>
        {task.tech_stack} · {task.ui_library}
      </span>
    </div>
  );
}

/**
 * 三栏 IDE 视图（原先的 B1 保留下来，Workspace 模式点「进入编辑器」时切到此）
 */
function EditorView({
  taskId,
  previewPort,
  devReady,
  c,
  events,
  connected,
  onRefresh,
  adopt,
  taskStatus,
  pageCount,
}: {
  taskId: number;
  previewPort: number | null;
  devReady: boolean;
  c: ColorPalette;
  events: import('./hooks/useProjectEvents').TaskEvent[];
  connected: boolean;
  onRefresh?: () => Promise<void> | void;
  adopt?: PreviewAdoptInfo;
  taskStatus?: string | null;
  /** 多页任务的页面数量；>1 时显示 PagesPanel */
  pageCount?: number;
}) {
  const [activity, setActivity] = useState<'chat' | 'files'>('files');
  const bottomTab = useIdeStore((s) => s.bottomTab);
  const setBottomTab = useIdeStore((s) => s.setBottomTab);

  const bottomItems = [
    {
      key: 'terminal',
      label: (
        <span>
          <CodeOutlined /> 终端
        </span>
      ),
      children: <TerminalPanel taskId={taskId} active={bottomTab === 'terminal'} />,
    },
    {
      key: 'console',
      label: (
        <span>
          <BugOutlined /> 浏览器控制台
        </span>
      ),
      children: <ConsolePanel taskId={taskId} />,
    },
    {
      key: 'logs',
      label: (
        <span>
          <FileTextOutlined /> Dev 日志
        </span>
      ),
      children: <LogsPanel taskId={taskId} />,
    },
    {
      key: 'execution',
      label: (
        <span>
          <ExperimentOutlined /> 执行详情
        </span>
      ),
      children: <ExecutionDetailsPanel taskId={taskId} events={events} onRefresh={onRefresh} />,
    },
  ];

  return (
    <div className="v0-fade-in" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        style={{
          width: 48,
          background: c.bg,
          borderRight: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          gap: 2,
        }}
      >
        {(
          [
            { key: 'files', icon: <FolderOutlined />, label: '文件' },
            { key: 'chat', icon: <MessageOutlined />, label: '对话' },
          ] as const
        ).map((it) => {
          const isActive = activity === it.key;
          return (
            <Tooltip title={it.label} placement="right" key={it.key}>
              <button
                onClick={() => setActivity(it.key)}
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  color: isActive ? c.text : c.textMuted,
                  cursor: 'pointer',
                  fontSize: 16,
                  position: 'relative',
                  transition: 'all 120ms ease',
                }}
              >
                {it.icon}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 2,
                      background: c.text,
                      borderRadius: 1,
                    }}
                  />
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>

      <div style={{ width: activity === 'chat' ? 380 : 260, flexShrink: 0, background: c.bg, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* 多页面任务进度：page_count > 1 时显示 */}
        {pageCount != null && pageCount > 1 && (
          <PagesPanel taskId={taskId} />
        )}
        {activity === 'files' ? (
          <FileTreePanel taskId={taskId} enabled />
        ) : (
          <ChatPanel taskId={taskId} events={events} connected={connected} taskStatus={taskStatus} />
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          borderRight: `1px solid ${c.border}`,
        }}
      >
        <EditorPanel taskId={taskId} />
        <div
          style={{
            height: '35%',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            background: c.bg,
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <Tabs
            activeKey={bottomTab}
            onChange={(k) => setBottomTab(k as any)}
            size="small"
            items={bottomItems}
            tabBarStyle={{
              padding: '0 10px',
              margin: 0,
              background: c.bg,
              borderBottom: `1px solid ${c.borderSubtle}`,
              minHeight: 32,
            }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            tabBarGutter={4}
            destroyInactiveTabPane={false}
          />
        </div>
      </div>

      <div style={{ width: '36%', minWidth: 360, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <PreviewPanel taskId={taskId} previewPort={previewPort} devReady={devReady} adopt={adopt} />
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const c = useColors();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const taskId = Number(id);
  const [task, setTask] = useState<ProjectTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [devStatus, setDevStatus] = useState<any>(null);
  const reset = useIdeStore((s) => s.reset);
  const pollRef = useRef<number | null>(null);

  // useProjectEvents 已经在 mount 时拉过 history（见 hook 实现），这里直接用
  // 【顶层唯一调用点】—— ChatPanel 通过 props 接收，避免多个实例各自起 WS
  const { events, connected, refreshHistory } = useProjectEvents(taskId);

  const { steps, phase, setViewMode, anyStepFailed } = useTaskPhase(task, events);

  // 装载任务
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProjectTask(taskId)
      .then((t) => {
        if (cancelled) return;
        setTask(t);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      reset();
    };
  }, [taskId, reset]);

  // 任务活跃期（pending / running / waiting_user）每 3 秒轮询 task，覆盖：
  //   1. onboarding 阶段 sandbox_id / claw_session_id 填上
  //   2. workspace 阶段 dev ready → succeeded / runtime_error → failed 这类
  //      由 backend dev_status_watcher 内部产生的状态切换（这些 status_change 事件
  //      只 insert DB 不 broadcast 到 WS，前端 events 流拿不到）
  // 状态切到终结态（succeeded / failed / stopped）后 effect re-run 直接 return，停止轮询。
  useEffect(() => {
    if (!task) return;
    const isActive =
      task.status === 'pending' ||
      task.status === 'running' ||
      task.status === 'waiting_user';
    if (!isActive) return;
    const tick = async () => {
      try {
        const t = await getProjectTask(taskId);
        setTask(t);
      } catch {}
    };
    const handle = window.setInterval(tick, 3000);
    return () => window.clearInterval(handle);
  }, [taskId, task?.status]);

  // 全阶段：events 流里 status_change 一变化就刷一次 task。
  // 解决任务从 running → succeeded/failed/stopped 时顶层 task.status 不更新的问题
  // （workspace / editor 阶段没有定时轮询，TopBar / StopTaskButton / 采纳按钮的可见性都依赖 task.status）。
  const lastStatusFromEventRef = useRef<string | null>(null);
  useEffect(() => {
    let latest: string | null = null;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i] as any;
      const t = e.type || e.event_type;
      if (t === 'status_change') {
        latest = typeof e.data === 'string' ? e.data : null;
        break;
      }
    }
    if (latest && latest !== lastStatusFromEventRef.current) {
      lastStatusFromEventRef.current = latest;
      void (async () => {
        try {
          const t = await getProjectTask(taskId);
          setTask(t);
        } catch { /* ignore */ }
      })();
    }
  }, [events, taskId]);

  // dev-status 轮询（任何阶段都要）
  useEffect(() => {
    const tick = async () => {
      try {
        const resp = await getDevStatus(taskId);
        setDevStatus(resp.dev_status);
      } catch {}
    };
    tick();
    pollRef.current = window.setInterval(tick, 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [taskId]);

  useIframeConsole(taskId);

  const devReady = useMemo(() => isDevReady(devStatus), [devStatus]);

  // 采纳中枢：TopBar 按钮 + Preview banner 共享同一 modal / 提交逻辑
  const adoptCtrl = useAdoptController(task, async () => {
    try { setTask(await getProjectTask(taskId)); } catch { /* ignore */ }
  });
  const adoptInfo: PreviewAdoptInfo = {
    canAdopt: adoptCtrl.canAdopt,
    adopted: adoptCtrl.adopted,
    onRequestAdopt: adoptCtrl.trigger,
  };

  if (loading && !task) {
    return (
      <div
        style={{
          height: 'calc(100vh - 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: c.bg,
        }}
      >
        <Spin />
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: 40, color: c.textMuted }}>
        任务不存在或已删除。
        <Button type="link" onClick={() => navigate('/projects')}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px)',
        background: c.bg,
        overflow: 'hidden',
      }}
    >
      {/* TopBar */}
      <div
        style={{
          height: 40,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: c.bg,
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/projects')}
        >
          返回
        </Button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: c.textMuted,
          }}
        >
          <span style={{ color: c.textSubtle }}>project</span>
          <span style={{ color: c.textSubtle }}>/</span>
          <span style={{ color: c.text }}>#{task.id}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* 执行详情：三个 phase 都可以打开（Drawer 形式），让 admin 随时审计 LLM 决策 / Skills / RAG / SystemPrompt */}
        <ExecutionDetailsDrawerButton taskId={taskId} events={events} onRefresh={refreshHistory} />

        {/* 停止任务：仅在未终结状态显示，允许管理员主动打断失控任务 */}
        <StopTaskButton task={task} onStopped={async () => {
          try { setTask(await getProjectTask(taskId)); } catch { /* ignore */ }
        }} />

        {/* B.7：采纳按钮（hook 共享，Preview banner 也会 trigger 它） */}
        <AdoptTopBarTrigger ctrl={adoptCtrl} c={c} />

        {/* 模式切换：Onboarding 阶段不显示；Workspace/Editor 阶段提供 Segmented 切换 */}
        {phase !== 'onboarding' && (
          <ModeSwitch phase={phase} onChange={setViewMode} c={c} />
        )}
      </div>

      {/* 主体 */}
      {phase === 'onboarding' && (
        <OnboardingView
          taskId={taskId}
          steps={steps}
          anyStepFailed={anyStepFailed}
          events={events}
          connected={connected}
          taskStatus={task.status}
        />
      )}
      {phase === 'workspace' && (
        <WorkspaceView
          taskId={taskId}
          previewPort={task.preview_port}
          devReady={devReady}
          events={events}
          connected={connected}
          adopt={adoptInfo}
          taskStatus={task.status}
        />
      )}
      {phase === 'editor' && (
        <EditorView
          taskId={taskId}
          previewPort={task.preview_port}
          devReady={devReady}
          c={c}
          events={events}
          connected={connected}
          onRefresh={refreshHistory}
          adopt={adoptInfo}
          taskStatus={task.status}
          pageCount={task.page_count}
        />
      )}

      <StatusBar task={task} dev={devStatus} c={c} />

      {/* 共享采纳 Modal：TopBar 按钮 + Preview banner 都会 trigger 它 */}
      <AdoptModal
        open={adoptCtrl.open}
        onCancel={() => adoptCtrl.setOpen(false)}
        onOk={() => void adoptCtrl.submit()}
        amisSummary={adoptCtrl.amisSummary}
        setAmisSummary={adoptCtrl.setAmisSummary}
        codeSummary={adoptCtrl.codeSummary}
        setCodeSummary={adoptCtrl.setCodeSummary}
        submitting={adoptCtrl.submitting}
        c={c}
      />
    </div>
  );
}

function ModeSwitch({
  phase,
  onChange,
  c,
}: {
  phase: ViewPhase;
  onChange: (m: 'workspace' | 'editor') => void;
  c: ColorPalette;
}) {
  const value = phase === 'editor' ? 'editor' : 'workspace';
  return (
    <Space size={6}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: c.textSubtle,
          letterSpacing: 0.5,
        }}
      >
        MODE
      </span>
      <Segmented
        size="small"
        value={value}
        onChange={(v) => onChange(v as 'workspace' | 'editor')}
        options={[
          {
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <AppstoreOutlined />
                工作区
              </span>
            ),
            value: 'workspace',
          },
          {
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CodeOutlined />
                编辑器
              </span>
            ),
            value: 'editor',
          },
        ]}
      />
    </Space>
  );
}

/// B.7：采纳按钮（任务成功后可点；点击弹窗填可选摘要 → 调 adoptProjectTask）
/**
 * 执行详情 Drawer 按钮：TopBar 全局入口，三个 phase（onboarding/workspace/editor）都可点开。
 * Drawer 里直接渲染 ExecutionDetailsPanel，事件数据由父层 useProjectEvents 传入。
 * 与底部 Bottom Tab 的「执行详情」互不冲突——只是多一个入口，方便 workspace 模式用户。
 */
function ExecutionDetailsDrawerButton({
  taskId,
  events,
  onRefresh,
}: {
  taskId: number;
  events: import('./hooks/useProjectEvents').TaskEvent[];
  onRefresh?: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title="查看本次任务的 LLM / Skills / RAG / System Prompt 详情">
        <Button
          type="text"
          size="small"
          icon={<ExperimentOutlined />}
          onClick={() => setOpen(true)}
        >
          执行详情
        </Button>
      </Tooltip>
      <Drawer
        title="🔍 执行详情"
        placement="right"
        width={640}
        open={open}
        onClose={() => setOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <ExecutionDetailsPanel taskId={taskId} events={events} onRefresh={onRefresh} />
      </Drawer>
    </>
  );
}

/**
 * 停止任务按钮：仅在"未终结状态"显示（pending/running/waiting_user），
 * 允许管理员立即打断失控任务。点击后调 POST /api/projects/tasks/:id/stop，
 * backend 会转发给 claw-agent-server.stop_task → 发 stop 信号给 runtime。
 */
function StopTaskButton({
  task,
  onStopped,
}: {
  task: ProjectTaskDetail | null;
  onStopped: () => void | Promise<void>;
}) {
  const [stopping, setStopping] = useState(false);
  if (!task) return null;
  // 终结态（succeeded/failed/stopped）不显示停止按钮
  if (
    task.status === 'succeeded' ||
    task.status === 'failed' ||
    task.status === 'stopped'
  ) {
    return null;
  }
  const handle = async () => {
    if (stopping) return;
    setStopping(true);
    try {
      await stopProjectTask(task.id);
      antdMessage.success('已发送停止信号');
      await onStopped();
    } catch (e: unknown) {
      const errMsg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      antdMessage.error(`停止失败：${errMsg}`);
    } finally {
      setStopping(false);
    }
  };
  return (
    <Tooltip title="停止当前任务（会打断 Agent、停 dev server）">
      <Button
        danger
        size="small"
        icon={<StopOutlined />}
        loading={stopping}
        onClick={handle}
      >
        停止任务
      </Button>
    </Tooltip>
  );
}

/**
 * 采纳状态中枢：TopBar 按钮 + Preview banner 共用同一套状态 / modal，
 * 避免重复实现提交逻辑。状态与 modal 由父组件渲染，触发器（trigger）向下分发。
 */
function useAdoptController(
  task: ProjectTaskDetail | null,
  reloadTask: () => Promise<void> | void,
) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amisSummary, setAmisSummary] = useState('');
  const [codeSummary, setCodeSummary] = useState('');

  const adopted = !!task?.adopted_at;
  const canAdopt =
    !!task && !adopted && (task.status === 'succeeded' || task.status === 'waiting_user');

  const trigger = () => setOpen(true);

  const submit = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      const resp = await adoptProjectTask(task.id, {
        amis_json_summary: amisSummary.trim() || undefined,
        code_summary: codeSummary.trim() || undefined,
      });
      antdMessage.success(`${resp.notice}（sample #${resp.sample_id}, 收集 ${resp.file_count} 文件）`);
      setOpen(false);
      setAmisSummary('');
      setCodeSummary('');
      await reloadTask();
    } catch (e: unknown) {
      const errMsg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      antdMessage.error(`采纳失败：${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    open,
    setOpen,
    submit,
    submitting,
    amisSummary,
    setAmisSummary,
    codeSummary,
    setCodeSummary,
    canAdopt,
    adopted,
    trigger,
  };
}

type AdoptCtrl = ReturnType<typeof useAdoptController>;

function AdoptTopBarTrigger({ ctrl, c }: { ctrl: AdoptCtrl; c: ColorPalette }) {
  if (ctrl.adopted) {
    return (
      <span
        style={{
          fontSize: 12,
          color: c.textSubtle,
          fontFamily: 'var(--font-mono)',
          padding: '0 8px',
        }}
      >
        ✓ 已采纳
      </span>
    );
  }
  if (!ctrl.canAdopt) return null;
  return (
    <Button type="primary" size="small" onClick={ctrl.trigger}>
      采纳
    </Button>
  );
}

function AdoptModal(props: {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  amisSummary: string;
  setAmisSummary: (v: string) => void;
  codeSummary: string;
  setCodeSummary: (v: string) => void;
  submitting: boolean;
  c: ColorPalette;
}) {
  return (
    <Modal
      title="采纳任务 → 沉淀到 RAG 样例库"
      open={props.open}
      onOk={props.onOk}
      onCancel={props.onCancel}
      okText="采纳"
      cancelText="取消"
      confirmLoading={props.submitting}
      width={580}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Alert
          type="info"
          showIcon
          style={{ fontSize: 12 }}
          message="将自动从沙箱收集 src/pages/、src/api/、src/components/、src/utils/、pages.json 下的代码（最多 256KB）。是否进入飞轮检索由系统配置 adopt_default_status 决定。"
        />
        <div>
          <div style={{ fontSize: 12, color: props.c.textMuted, marginBottom: 4 }}>
            amis_json_summary（可选；不填则用 amis_json 前 200 字兜底）
          </div>
          <Input.TextArea
            rows={2}
            value={props.amisSummary}
            onChange={(e: { target: { value: string } }) => props.setAmisSummary(e.target.value)}
            placeholder="例如：用户登录页（手机号验证码 + 第三方登录）"
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: props.c.textMuted, marginBottom: 4 }}>
            code_summary（可选；代码做了什么）
          </div>
          <Input.TextArea
            rows={2}
            value={props.codeSummary}
            onChange={(e: { target: { value: string } }) => props.setCodeSummary(e.target.value)}
            placeholder="例如：使用 wd-input + wd-button + axios POST /auth/login"
          />
        </div>
      </Space>
    </Modal>
  );
}
