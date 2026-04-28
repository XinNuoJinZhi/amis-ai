import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  batchDeleteProjectTasks,
  deleteProjectTask,
  listProjectTasks,
  stopProjectTask,
  type ProjectTaskBrief,
} from '../../services/projects';
import CreateTaskModal from './CreateTaskModal';
import { useColors } from '../../theme';

const { RangePicker } = DatePicker;

const STATUS_TEXT: Record<string, string> = {
  pending: '待启动',
  running: '运行中',
  waiting_user: '需介入',
  succeeded: '成功',
  failed: '失败',
  stopped: '已停止',
};

const STATUS_OPTIONS = Object.entries(STATUS_TEXT).map(([value, label]) => ({
  value,
  label,
}));

function statusColor(status: string, c: ReturnType<typeof useColors>): string {
  switch (status) {
    case 'pending':
      return c.statusPending;
    case 'running':
      return c.accentCyan;
    case 'waiting_user':
      return c.warning;
    case 'succeeded':
      return c.success;
    case 'failed':
      return c.destructive;
    case 'stopped':
      return c.statusStopped;
    default:
      return c.textMuted;
  }
}

function StatusBadge({ status }: { status: string }) {
  const c = useColors();
  const color = statusColor(status, c);
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

interface FilterState {
  statuses: string[];
  techStacks: string[];
  /** RangePicker 的原始 dayjs 对象（不显式 import dayjs，用结构化类型避免类型耦合） */
  rangePickerValue: any;
  /** 已转换好的 epoch 区间 [from, to]，已扩到当天 00:00 / 23:59 */
  rangeMs: [number, number] | null;
  keyword: string;
}

const EMPTY_FILTER: FilterState = {
  statuses: [],
  techStacks: [],
  rangePickerValue: null,
  rangeMs: null,
  keyword: '',
};

export default function ProjectsList() {
  const c = useColors();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ProjectTaskBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listProjectTasks();
      setTasks(data);
      // 刷新后清掉已不存在的选中项
      setSelected((prev) => {
        const ids = new Set(data.map((t) => t.id));
        return new Set([...prev].filter((id) => ids.has(id)));
      });
    } catch (e: any) {
      message.error(`加载失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  // 技术栈选项：从已有任务里去重出现过的 tech_stack 值
  const techStackOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) if (t.tech_stack) set.add(t.tech_stack);
    return [...set].sort().map((v) => ({ value: v, label: v }));
  }, [tasks]);

  // 前端过滤（数据规模小，不必走后端）
  const filteredTasks = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filters.statuses.length && !filters.statuses.includes(t.status)) return false;
      if (filters.techStacks.length && !filters.techStacks.includes(t.tech_stack)) return false;
      if (filters.rangeMs) {
        const ts = new Date(t.created_at).getTime();
        if (ts < filters.rangeMs[0] || ts > filters.rangeMs[1]) return false;
      }
      if (kw) {
        const haystack = `${t.id} ${t.tech_stack ?? ''} ${t.ui_library ?? ''}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const filteredIds = useMemo(() => filteredTasks.map((t) => t.id), [filteredTasks]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const partialSelected =
    !allFilteredSelected && filteredIds.some((id) => selected.has(id));

  const toggleSelectAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const id of filteredIds) next.add(id);
      } else {
        for (const id of filteredIds) next.delete(id);
      }
      return next;
    });
  };

  const toggleSelectOne = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleStop = async (id: number) => {
    try {
      await stopProjectTask(id);
      message.success('已发送停止指令');
      void refresh();
    } catch (e: any) {
      message.error(`停止失败: ${e.message}`);
    }
  };

  const handleDeleteOne = async (id: number) => {
    try {
      await deleteProjectTask(id);
      message.success(`任务 #${id} 已删除`);
      void refresh();
    } catch (e: any) {
      message.error(`删除失败: ${e.response?.data?.error || e.message}`);
    }
  };

  const handleBatchDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setBatchDeleting(true);
    try {
      const result = await batchDeleteProjectTasks(ids);
      if (result.failed.length === 0) {
        message.success(`已批量删除 ${result.deleted.length} 个任务`);
      } else {
        message.warning(
          `批量删除完成：成功 ${result.deleted.length}、失败 ${result.failed.length}（详见控制台）`
        );
        // eslint-disable-next-line no-console
        console.warn('批量删除失败明细', result.failed);
      }
      setSelected(new Set());
      void refresh();
    } catch (e: any) {
      message.error(`批量删除失败: ${e.response?.data?.error || e.message}`);
    } finally {
      setBatchDeleting(false);
    }
  };

  const filtersDirty =
    filters.statuses.length > 0 ||
    filters.techStacks.length > 0 ||
    !!filters.rangeMs ||
    filters.keyword.trim() !== '';

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 页面头 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: c.text,
              letterSpacing: -0.2,
            }}
          >
            项目工作台
          </h1>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: c.textMuted,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {filteredTasks.length} / {tasks.length} tasks · Amis JSON → 可运行项目
          </div>
        </div>
        <Space size={8}>
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()} size="small">
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

      {/* 筛选条 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Select
          mode="multiple"
          allowClear
          placeholder="状态"
          value={filters.statuses}
          onChange={(v) => setFilters((p) => ({ ...p, statuses: v as string[] }))}
          options={STATUS_OPTIONS}
          maxTagCount="responsive"
          style={{ minWidth: 200 }}
          size="small"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="技术栈"
          value={filters.techStacks}
          onChange={(v) => setFilters((p) => ({ ...p, techStacks: v as string[] }))}
          options={techStackOptions}
          maxTagCount="responsive"
          style={{ minWidth: 220 }}
          size="small"
          disabled={techStackOptions.length === 0}
        />
        <RangePicker
          allowClear
          size="small"
          value={filters.rangePickerValue}
          onChange={(v: any) => {
            if (!v || !v[0] || !v[1]) {
              setFilters((p) => ({ ...p, rangePickerValue: null, rangeMs: null }));
              return;
            }
            // RangePicker 的 v 是 [dayjs, dayjs]，扩展到当天 00:00 / 23:59:59.999
            const from = (v[0].startOf?.('day')?.valueOf?.() ?? v[0].valueOf?.() ?? 0) as number;
            const to = (v[1].endOf?.('day')?.valueOf?.() ?? v[1].valueOf?.() ?? 0) as number;
            setFilters((p) => ({ ...p, rangePickerValue: v, rangeMs: [from, to] }));
          }}
        />
        <Input
          allowClear
          size="small"
          prefix={<SearchOutlined />}
          placeholder="关键字（任务 ID / 技术栈 / UI 库）"
          value={filters.keyword}
          onChange={(e) => setFilters((p) => ({ ...p, keyword: e.target.value }))}
          style={{ minWidth: 240, flex: 1, maxWidth: 360 }}
        />
        {filtersDirty && (
          <Button size="small" type="link" onClick={() => setFilters(EMPTY_FILTER)}>
            清空筛选
          </Button>
        )}
      </div>

      {/* 选中操作条 */}
      {tasks.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 20px 6px 24px',
            marginBottom: 6,
          }}
        >
          <Space size={12}>
            <Checkbox
              checked={allFilteredSelected}
              indeterminate={partialSelected}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              disabled={filteredIds.length === 0}
            >
              <span style={{ fontSize: 12, color: c.textMuted }}>
                全选当前页（{filteredIds.length}）
              </span>
            </Checkbox>
            {selected.size > 0 && (
              <span style={{ fontSize: 12, color: c.textMuted }}>
                已选 <Tag color="blue" style={{ margin: 0 }}>{selected.size}</Tag>
              </span>
            )}
          </Space>
          <Popconfirm
            title="确认批量删除？"
            description={
              <div style={{ maxWidth: 320 }}>
                <div style={{ marginBottom: 6 }}>
                  即将<strong style={{ color: c.destructive }}>不可逆</strong>删除以下任务（含沙箱、workdir、消息和事件）：
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: c.text,
                    maxHeight: 120,
                    overflow: 'auto',
                  }}
                >
                  {[...selected]
                    .sort((a, b) => a - b)
                    .map((id) => `#${id}`)
                    .join(', ')}
                </div>
              </div>
            }
            okText="确认删除"
            okButtonProps={{ danger: true, loading: batchDeleting }}
            cancelText="取消"
            disabled={selected.size === 0}
            onConfirm={() => void handleBatchDelete()}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              disabled={selected.size === 0}
              loading={batchDeleting}
            >
              批量删除（{selected.size}）
            </Button>
          </Popconfirm>
        </div>
      )}

      {/* 列表头 */}
      {filteredTasks.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 80px 120px 1fr 110px 180px 220px',
            gap: 16,
            padding: '6px 20px 6px 24px',
            fontSize: 12,
            color: c.textMuted,
            fontWeight: 500,
          }}
        >
          <span></span>
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
              border: `1px dashed ${c.border}`,
              borderRadius: 8,
            }}
          >
            <Empty
              description={
                <div>
                  <div style={{ color: c.text, marginBottom: 4 }}>暂无项目生成任务</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>
                    在「Amis 生成」页创建 Amis JSON，点击「生成项目代码」即可发起任务
                  </div>
                </div>
              }
            />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              border: `1px dashed ${c.border}`,
              borderRadius: 8,
            }}
          >
            <Empty description="当前筛选下没有任务" />
          </div>
        ) : (
          filteredTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              checked={selected.has(t.id)}
              onCheck={(v) => toggleSelectOne(t.id, v)}
              onView={() => navigate(`/projects/${t.id}`)}
              onStop={() => void handleStop(t.id)}
              onDelete={() => void handleDeleteOne(t.id)}
            />
          ))
        )}
      </div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          void refresh();
        }}
      />
    </div>
  );
}

function TaskRow({
  task,
  checked,
  onCheck,
  onView,
  onStop,
  onDelete,
}: {
  task: ProjectTaskBrief;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onView: () => void;
  onStop: () => void;
  onDelete: () => void;
}) {
  const c = useColors();
  const barColor = statusColor(task.status, c);
  return (
    <div
      className="v0-fade-in"
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '36px 80px 120px 1fr 110px 180px 220px',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px 14px 24px',
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        transition: 'all 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.textMuted;
        e.currentTarget.style.background = c.surfaceElevated;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = c.border;
        e.currentTarget.style.background = c.surface;
      }}
    >
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
      <Checkbox
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
      />
      <span
        onClick={onView}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: c.textMuted,
          cursor: 'pointer',
        }}
      >
        #{task.id}
      </span>
      <span onClick={onView} style={{ cursor: 'pointer' }}>
        <StatusBadge status={task.status} />
      </span>
      <div
        onClick={onView}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: c.text,
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
            color: c.textSubtle,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {task.ui_library}
        </span>
      </div>
      <span
        onClick={onView}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: task.preview_port ? c.accentCyan : c.textSubtle,
          cursor: 'pointer',
        }}
      >
        {task.preview_port ? `:${task.preview_port}` : '—'}
      </span>
      <span
        onClick={onView}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: c.textMuted,
          cursor: 'pointer',
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
        <Popconfirm
          title="确认删除任务？"
          description={
            <span style={{ fontSize: 12 }}>
              将<strong>不可逆</strong>删除任务 <code>#{task.id}</code>，含沙箱、workdir、消息和事件。
            </span>
          }
          okText="删除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          onConfirm={onDelete}
        >
          <Button size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      </Space>
    </div>
  );
}
