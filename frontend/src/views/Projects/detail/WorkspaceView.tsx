import { useState } from 'react';
import { Segmented } from 'antd';
import { EyeOutlined, FolderOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useColors } from '../../../theme';
import ChatPanel from './panels/ChatPanel';
import PreviewPanel from './panels/PreviewPanel';
import TerminalPanel from './panels/TerminalPanel';
import ConsolePanel from './panels/ConsolePanel';
import LogsPanel from './panels/LogsPanel';
import FilesPanel from './components/FilesPanel';
import type { TaskEvent } from './hooks/useProjectEvents';

type RightTab = 'preview' | 'files' | 'terminal' | 'logs';

interface Props {
  taskId: number;
  previewPort: number | null;
  devReady: boolean;
  events: TaskEvent[];
  connected: boolean;
}

/**
 * Workspace：v0 风双栏。
 *   左 42% = 对话
 *   右 58% = Segmented 切「预览 / 文件 / 终端 / 日志」
 *
 * 日志 Tab 内部再上下分：浏览器控制台（上） + Dev 日志（下）
 */
export default function WorkspaceView({ taskId, previewPort, devReady, events, connected }: Props) {
  const c = useColors();
  const [tab, setTab] = useState<RightTab>('preview');

  return (
    <div
      className="v0-fade-in"
      style={{
        flex: 1,
        display: 'flex',
        minHeight: 0,
        background: c.bg,
      }}
    >
      {/* 左栏：对话 */}
      <div style={{ width: '42%', minWidth: 360, display: 'flex', minHeight: 0 }}>
        <ChatPanel taskId={taskId} events={events} connected={connected} />
      </div>

      {/* 右栏：Segmented + 单面板 */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: c.bg,
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${c.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 44,
          }}
        >
          <Segmented
            size="small"
            value={tab}
            onChange={(v) => setTab(v as RightTab)}
            options={[
              {
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <EyeOutlined />
                    预览
                  </span>
                ),
                value: 'preview',
              },
              {
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FolderOutlined />
                    文件
                  </span>
                ),
                value: 'files',
              },
              {
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CodeOutlined />
                    终端
                  </span>
                ),
                value: 'terminal',
              },
              {
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FileTextOutlined />
                    日志
                  </span>
                ),
                value: 'logs',
              },
            ]}
          />
        </div>

        {/* Tab 内容 —— 用 display:none 隐藏非活动，保持状态（xterm / iframe 不重建） */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TabSlot active={tab === 'preview'}>
            <PreviewPanel taskId={taskId} previewPort={previewPort} devReady={devReady} />
          </TabSlot>
          <TabSlot active={tab === 'files'}>
            <FilesPanel taskId={taskId} />
          </TabSlot>
          <TabSlot active={tab === 'terminal'}>
            <TerminalPanel taskId={taskId} active={tab === 'terminal'} />
          </TabSlot>
          <TabSlot active={tab === 'logs'}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ flex: 1, minHeight: 0, borderBottom: `1px solid ${c.borderSubtle}` }}>
                <ConsolePanel taskId={taskId} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <LogsPanel taskId={taskId} />
              </div>
            </div>
          </TabSlot>
        </div>
      </div>
    </div>
  );
}

function TabSlot({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: active ? 'flex' : 'none',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}
