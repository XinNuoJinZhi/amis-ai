import { useEffect, useState } from 'react';
import { Button, Space, message, Empty, Spin } from 'antd';
import { ReloadOutlined, EyeOutlined, StopOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  listProjectTasks,
  stopProjectTask,
  type ProjectTaskBrief,
} from '../../services/projects';
import CreateTaskModal from './CreateTaskModal';
import { useColors } from '../../theme';

const STATUS_TEXT: Record<string, string> = {
  pending: '待启动',
  running: '运行中',
  waiting_user: '需介入',
  succeeded: '成功',
  failed: '失败',
  stopped: '已停止',
};

function statusColor(status: string, c: ReturnType<typeof useColors>): string {
  switch (status) {
    case 'pending': return c.statusPending;
    case 'running': return c.accentCyan;
    case 'waiting_user': return c.warning;
    case 'succeeded': return c.success;
    case 'failed': return c.destructive;
    case 'stopped': return c.statusStopped;
    default: return c.textMuted;
  }
}

function StatusBadge({ status }: { status: string }) {
  const darkColors = useColors();
  const color = statusColor(status, darkColors);
  const text = STATUS_TEXT[status] || status;
  const isRunning = status === 'running';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color,
        fontWeight: 500,
      }}
    >
      {isRunning ? (
        <span className="v0-pulse" style={{ width: 7, height: 7 }} />
      ) : (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      )}
      {text}
    </span>
  );
}

function TaskRow({
  task,
  onView,
  onStop,
}: {
  task: ProjectTaskBrief;
  onView: () => void;
  onStop: () => void;
}) {
  const darkColors = useColors();
  const barColor = statusColor(task.status, darkColors);
  return (
    <div
      className="v0-fade-in"
      onClick={onView}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '80px 120px 1fr 110px 180px 180px',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px 14px 24px',
        background: darkColors.surface,
        border: `1px solid ${darkColors.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = darkColors.textMuted;
        e.currentTarget.style.background = darkColors.surfaceElevated;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = darkColors.border;
        e.currentTarget.style.background = darkColors.surface;
      }}
    >
      {/* 左侧状态竖条 */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 8,
          bottom: 8,
          width: 2,
          background: barColor,
          borderRadius: 1,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: darkColors.textMuted,
        }}
      >
        #{task.id}
      </span>
      <StatusBadge status={task.status} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: darkColors.text,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.tech_stack}
        </span>
        <span
          style={{
            fontSize: 11,
            color: darkColors.textSubtle,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {task.ui_library}
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: task.preview_port ? darkColors.accentCyan : darkColors.textSubtle,
        }}
      >
        {task.preview_port ? `:${task.preview_port}` : '—'}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: darkColors.textMuted,
        }}
      >
        {new Date(task.created_at).toLocaleString('zh-CN', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
      <Space size={4} onClick={(e) => e.stopPropagation()}>
        <Button size="small" icon={<EyeOutlined />} onClick={onView}>
          打开
        </Button>
        {(task.status === 'running' || task.status === 'waiting_user') && (
          <Button size="small" danger icon={<StopOutlined />} onClick={onStop}>
            停止
          </Button>
        )}
      </Space>
    </div>
  );
}

export default function ProjectsList() {
  const darkColors = useColors();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ProjectTaskBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listProjectTasks();
      setTasks(data);
    } catch (e: any) {
      message.error(`加载失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStop = async (id: number) => {
    try {
      await stopProjectTask(id);
      message.success('已发送停止指令');
      refresh();
    } catch (e: any) {
      message.error(`停止失败: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 页面头 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: darkColors.text,
              letterSpacing: -0.2,
            }}
          >
            项目工作台
          </h1>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: darkColors.textMuted,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {tasks.length} tasks · Amis JSON → 可运行项目
          </div>
        </div>
        <Space size={8}>
          <Button icon={<ReloadOutlined />} onClick={refresh} size="small">
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            size="small"
          >
            新建任务
          </Button>
        </Space>
      </div>

      {/* 列表头 */}
      {tasks.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 120px 1fr 110px 180px 180px',
            gap: 16,
            padding: '6px 20px 6px 24px',
            fontSize: 12,
            color: darkColors.textMuted,
            fontWeight: 500,
          }}
        >
          <span>任务</span>
          <span>状态</span>
          <span>技术栈</span>
          <span>端口</span>
          <span>创建时间</span>
          <span>操作</span>
        </div>
      )}

      {/* 任务列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && tasks.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              padding: '80px 0',
              textAlign: 'center',
              border: `1px dashed ${darkColors.border}`,
              borderRadius: 8,
            }}
          >
            <Empty
              description={
                <div>
                  <div style={{ color: darkColors.text, marginBottom: 4 }}>暂无项目生成任务</div>
                  <div style={{ fontSize: 12, color: darkColors.textMuted }}>
                    在「智能生成」页创建 Amis JSON，点击「生成项目代码」即可发起任务
                  </div>
                </div>
              }
            />
          </div>
        ) : (
          tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onView={() => navigate(`/projects/${t.id}`)}
              onStop={() => handleStop(t.id)}
            />
          ))
        )}
      </div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
