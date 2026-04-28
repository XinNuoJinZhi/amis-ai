import { useColors } from '../../../theme';
import StepProgress from './components/StepProgress';
import ChatPanel from './panels/ChatPanel';
import type { StepState } from './hooks/useTaskPhase';
import type { TaskEvent } from './hooks/useProjectEvents';

interface Props {
  taskId: number;
  steps: StepState[];
  anyStepFailed: boolean;
  events: TaskEvent[];
  connected: boolean;
  taskStatus?: string | null;
}

/**
 * Onboarding：居中单列，顶部四步进度条，下方对话面板。
 * 所有步骤打勾后由父组件切换到 WorkspaceView。
 */
export default function OnboardingView({ taskId, steps, anyStepFailed, events, connected, taskStatus }: Props) {
  const c = useColors();

  return (
    <div
      className="v0-fade-in"
      style={{
        flex: 1,
        overflow: 'auto',
        background: c.bg,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* 标题区 */}
        <div style={{ textAlign: 'center', padding: '16px 0 0' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: c.textSubtle,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            INITIALIZING WORKSPACE
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: c.text,
              letterSpacing: -0.2,
            }}
          >
            {anyStepFailed ? '启动过程中出了点状况' : '正在为你准备沙箱工作区'}
          </div>
          <div
            style={{
              fontSize: 12,
              color: c.textMuted,
              marginTop: 4,
            }}
          >
            {anyStepFailed
              ? '请查看下方步骤提示 · 或到终端里手动修复'
              : '就绪后会自动进入工作区，同时 AI 会开始响应你的需求'}
          </div>
        </div>

        {/* 进度条 */}
        <div
          style={{
            padding: '16px 8px',
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
          }}
        >
          <StepProgress steps={steps} />
        </div>

        {/* 对话面板 —— 填满剩余空间 */}
        <div
          style={{
            flex: 1,
            minHeight: 420,
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatPanel taskId={taskId} events={events} connected={connected} bordered={false} taskStatus={taskStatus} />
        </div>

        {/* 底部留白 */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
