import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectTaskDetail } from '../../../../services/projects';
import type { TaskEvent } from './useProjectEvents';

export type StepKey = 'sandbox' | 'scaffold' | 'skills' | 'agent';
export type StepStatus = 'pending' | 'running' | 'done' | 'failed';

export interface StepState {
  key: StepKey;
  label: string;
  status: StepStatus;
  hint?: string;
}

export type ViewPhase = 'onboarding' | 'workspace' | 'editor';

/**
 * 从 task 当前字段 + 累积事件派生出四步状态与当前视图 phase。
 *
 * 重要细节：
 *  - 一旦进入 workspace，即使后续 task/events 变化也不回 onboarding，避免 UI 抖动
 *  - 用户手动切 editor / workspace 后以用户选择为准（持久化到 localStorage）
 */
export function useTaskPhase(
  task: ProjectTaskDetail | null,
  events: TaskEvent[],
): {
  steps: StepState[];
  phase: ViewPhase;
  setViewMode: (m: 'workspace' | 'editor') => void;
  anyStepFailed: boolean;
} {
  // 用户手动挑选的视图模式（workspace | editor）—— undefined 表示跟随系统判定
  const [viewMode, setViewModeState] = useState<'workspace' | 'editor' | undefined>(() => {
    const v = localStorage.getItem('amis-ai:ide-view-mode');
    return v === 'workspace' || v === 'editor' ? v : undefined;
  });

  const setViewMode = (m: 'workspace' | 'editor') => {
    localStorage.setItem('amis-ai:ide-view-mode', m);
    setViewModeState(m);
  };

  // 一旦进入过 workspace 就锁定，避免事件清空时回退到 onboarding
  const workspaceUnlockedRef = useRef(false);

  const steps = useMemo<StepState[]>(() => {
    const hasScaffoldOk = events.some((e) => e.type === 'scaffold_copied');
    const hasScaffoldFail = events.some((e) => e.type === 'scaffold_copy_failed');
    const scaffoldFailEvent = events.find((e) => e.type === 'scaffold_copy_failed');
    const hasAgentActivity = events.some((e) => e.type === 'text_delta' || e.type === 'tool_use');

    // 步骤 1：沙箱
    const sandboxStatus: StepStatus = task?.sandbox_id ? 'done' : 'pending';

    // 步骤 2：底座复制
    //   优先看事件；若没事件但 claw_session_id 已出现，说明后续流程已跑，复制肯定成了（fallback）
    let scaffoldStatus: StepStatus;
    let scaffoldHint: string | undefined;
    if (hasScaffoldOk || task?.claw_session_id) {
      scaffoldStatus = 'done';
    } else if (hasScaffoldFail) {
      scaffoldStatus = 'failed';
      try {
        const payload = scaffoldFailEvent?.data;
        const obj = typeof payload === 'string' ? JSON.parse(payload) : payload;
        scaffoldHint = obj?.error;
      } catch {
        scaffoldHint = undefined;
      }
    } else if (task?.sandbox_id) {
      scaffoldStatus = 'running';
    } else {
      scaffoldStatus = 'pending';
    }

    // 步骤 3：Skills（= claw 会话）
    const skillsStatus: StepStatus = task?.claw_session_id
      ? 'done'
      : task?.sandbox_id
        ? 'running'
        : 'pending';

    // 步骤 4：AI 对话启动
    const agentStatus: StepStatus = hasAgentActivity
      ? 'done'
      : task?.claw_session_id
        ? 'running'
        : 'pending';

    return [
      { key: 'sandbox', label: '创建沙箱', status: sandboxStatus },
      { key: 'scaffold', label: '复制底座模板', status: scaffoldStatus, hint: scaffoldHint },
      { key: 'skills', label: '装载技术栈 Skills', status: skillsStatus },
      { key: 'agent', label: '启动 AI 对话', status: agentStatus },
    ];
  }, [task, events]);

  const anyStepFailed = steps.some((s) => s.status === 'failed');

  const allDone = steps.every((s) => s.status === 'done');

  // 派生 phase
  const phase: ViewPhase = useMemo(() => {
    // 用户主动选编辑器模式 → 强制 editor
    if (viewMode === 'editor') return 'editor';
    // 用户主动选工作区模式 → 强制 workspace（要求至少沙箱已就绪）
    if (viewMode === 'workspace' && task?.sandbox_id) return 'workspace';

    if (workspaceUnlockedRef.current) return 'workspace';
    if (allDone) return 'workspace';
    return 'onboarding';
  }, [allDone, viewMode, task?.sandbox_id]);

  // 锁定 workspace（单向，不回退）
  useEffect(() => {
    if (phase === 'workspace' || phase === 'editor') {
      workspaceUnlockedRef.current = true;
    }
  }, [phase]);

  return { steps, phase, setViewMode, anyStepFailed };
}
