// B.7：系统配置 Tab — 分组化（2026-04 Phase 0 起）
//
// 分组：
//   1. 飞轮基础：adopt_default_status（D3 决策）
//   2. RAG 飞轮（2026-04 质量闭环）：rag.* 前缀全量 knob
//      - rag.quality_filter.* 硬过滤（Phase 0 即用 exclude_tags）
//      - rag.weighting.*        软加权（Phase 1 后按数据激活）
//      - rag.judge.*            LLM 评委（Phase 2 激活；建议绑不同 provider）
//      - rag.negative.*         反向飞轮（Phase 4 激活；默认 OFF 且强制 only_structural）
//      - rag.pending_badge.*    菜单 Badge 轮询周期
//      - rag.stats.*            统计卡片缓存 TTL

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import { BarChartOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import {
  listSystemSettings,
  upsertSystemSetting,
  type SystemSetting,
} from '../../services/systemSettings';
import {
  getAbReport,
  type AbBucket,
  type AbReportResponse,
} from '../../services/codeSamples';
import { useColors } from '../../theme';

/** 默认值：A 段 = 最近 14 天。返回 `YYYY-MM-DDTHH:mm` 格式（HTML5 datetime-local 用） */
function defaultRangeA(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };
  return { from: fmt(from), to: fmt(now) };
}

/** 把 datetime-local 的 "2026-04-25T10:30" 补成后端要的 ISO "2026-04-25T10:30:00" */
function toBackendIso(v: string): string {
  if (!v) return '';
  return v.length === 16 ? `${v}:00` : v;
}

/** 给原生 <input type="datetime-local"> 套一套 AntD 风格 */
function dateInputStyle(c: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    flex: 1,
    height: 32,
    padding: '0 11px',
    fontSize: 14,
    color: c.text,
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    fontFamily: 'var(--font-mono)',
  };
}

const ADOPT_KEY = 'adopt_default_status';

// RAG 飞轮的全量 knob 列表（类型信息用来驱动渲染控件）
type KnobKind = 'bool' | 'int' | 'float' | 'text' | 'select' | 'csv';
interface KnobDef {
  key: string;
  label: string;
  hint: string;
  kind: KnobKind;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  phase: 0 | 1 | 2 | 4;
  dangerous?: boolean;
}

// 任务追踪日志（tracelog.* 前缀）—— Phase A 起新增
const TRACELOG_KNOBS: KnobDef[] = [
  {
    key: 'tracelog.mode',
    label: 'tracelog.mode（追踪日志模式）',
    hint: 'disabled / smart（仅失败任务详记）/ all_tasks（全记）。默认 disabled，开 all_tasks 后磁盘按 50KB-500KB/任务 估算。',
    kind: 'select',
    options: [
      { label: 'disabled（默认，关闭）', value: 'disabled' },
      { label: 'smart（仅失败任务详记，成功只留 manifest）', value: 'smart' },
      { label: 'all_tasks（全记，最完整最占空间）', value: 'all_tasks' },
    ],
    phase: 0,
    dangerous: true,
  },
  {
    key: 'tracelog.dir',
    label: 'tracelog.dir（归档根目录）',
    hint: '默认 /tmp/amis-ai/tracelogs（WSL 友好）；prod 建议改 /var/amis-ai/tracelogs 持久化。改后只对新任务生效。',
    kind: 'text',
    phase: 0,
  },
  {
    key: 'tracelog.retention_days',
    label: 'tracelog.retention_days（保留天数）',
    hint: '后台每 6 小时扫一次，超期目录 / tar.gz 自动删。≤0 = 永久保留。',
    kind: 'int',
    min: 0,
    max: 365,
    step: 1,
    phase: 0,
  },
  {
    key: 'tracelog.compress',
    label: 'tracelog.compress（任务终结后 tar.gz）',
    hint: '关掉 = 留目录形式（cat 方便但占空间）；开 = tar.gz 归档（省 70%+，下载快）',
    kind: 'bool',
    phase: 0,
  },
];

const RAG_KNOBS: KnobDef[] = [
  // Phase 0：硬过滤 + Badge 轮询
  {
    key: 'rag.quality_filter.exclude_tags',
    label: 'exclude_tags（tags 黑名单）',
    hint: '逗号分隔；命中任何一个标签的样例都不参与 RAG 检索。MVP 即可启用 antipattern。',
    kind: 'csv',
    phase: 0,
  },
  {
    key: 'rag.pending_badge.poll_interval_sec',
    label: '菜单 Badge 轮询周期（秒）',
    hint: 'admin 菜单「RAG 样例库」角标的刷新周期',
    kind: 'int',
    min: 10,
    max: 3600,
    step: 5,
    phase: 0,
  },
  {
    key: 'rag.stats.cache_ttl_sec',
    label: '统计卡片缓存 TTL（秒）',
    hint: '顶部统计卡片接口的浏览器端缓存（当前未实现服务端缓存）',
    kind: 'int',
    min: 0,
    max: 300,
    step: 5,
    phase: 0,
  },

  // Phase 1：thumbs / rating 埋点（signal 埋点）
  {
    key: 'rag.weighting.enabled',
    label: 'weighting_enabled（主总闸）',
    hint: '开启后 thumbs / hit_count 才会参与 ranking。建议先 OFF 2 周收数据再开。',
    kind: 'bool',
    phase: 1,
    dangerous: true,
  },
  {
    key: 'rag.weighting.thumbs_mode',
    label: 'thumbs_mode（反馈权重模式）',
    hint: 'tiebreaker（推荐：cos_sim 差 <0.05 时 0.05 权重）/ off / boost（0.2 权重，慎用）',
    kind: 'select',
    options: [
      { label: 'off（不参与 ranking）', value: 'off' },
      { label: 'tiebreaker（推荐）', value: 'tiebreaker' },
      { label: 'boost（0.2 权重）', value: 'boost' },
    ],
    phase: 1,
  },
  {
    key: 'rag.weighting.hit_count_enabled',
    label: 'hit_count_enabled（热度权重）',
    hint: 'ln(1+hit/10) 权重 0.1。样本数 <100 时几乎无意义，建议等飞轮数据成熟再启。',
    kind: 'bool',
    phase: 1,
  },
  {
    key: 'rag.quality_filter.min_rating',
    label: 'min_rating（人工评分硬过滤下限）',
    hint: '填入 >=N 才召回；留空=不过滤。0-5 浮点。建议 Phase 1 数据足够后再启 3。',
    kind: 'float',
    min: 0,
    max: 5,
    step: 0.5,
    phase: 1,
  },

  // Phase 2：LLM-judge
  {
    key: 'rag.judge.mode',
    label: 'judge.mode（LLM 评委模式）',
    hint: 'disabled / manual（admin 点按钮）/ auto_on_adopt（采纳时自动评）',
    kind: 'select',
    options: [
      { label: 'disabled（关闭）', value: 'disabled' },
      { label: 'manual（手动触发）', value: 'manual' },
      { label: 'auto_on_adopt（采纳自动触发）', value: 'auto_on_adopt' },
    ],
    phase: 2,
  },
  {
    key: 'rag.judge.task_type',
    label: 'judge.task_type',
    hint: '请在「系统设置 → LLM 供应商」给这个 task_type 绑定与 generation 不同 provider 的模型',
    kind: 'text',
    phase: 2,
  },
  {
    key: 'rag.judge.budget_per_day',
    label: 'judge 每日预算（次数）',
    hint: '批量评分调用上限，防止一次全库评爆预算',
    kind: 'int',
    min: 0,
    max: 10000,
    step: 10,
    phase: 2,
  },
  {
    key: 'rag.judge.batch_concurrency',
    label: 'judge 并发数',
    hint: '批量评分的并发上限',
    kind: 'int',
    min: 1,
    max: 20,
    step: 1,
    phase: 2,
  },
  {
    key: 'rag.quality_filter.min_verdict',
    label: 'min_verdict（LLM 评委硬过滤）',
    hint: '留空=不过滤；good / needs_review 以上才召回',
    kind: 'select',
    options: [
      { label: '不过滤（推荐 Phase 2 前）', value: '' },
      { label: 'needs_review 以上', value: 'needs_review' },
      { label: '仅 good', value: 'good' },
    ],
    phase: 2,
  },

  // Phase 4：负例
  {
    key: 'rag.negative.enabled',
    label: 'negative.enabled（负例注入）',
    hint: '默认 OFF。开启后 RAG 会额外召回反面教材注入 system_prompt。必须 A/B 验证正向收益。',
    kind: 'bool',
    phase: 4,
    dangerous: true,
  },
  {
    key: 'rag.negative.top_k',
    label: 'negative.top_k',
    hint: '每次注入几条反例（宁少勿多，防淹没正面样例）',
    kind: 'int',
    min: 0,
    max: 3,
    step: 1,
    phase: 4,
  },
  {
    key: 'rag.negative.only_structural',
    label: 'negative.only_structural（强制结构性反例）',
    hint: '强烈建议保持 true。关掉会把完整反例代码段喂 LLM，有 30%+ negation blindness 风险。',
    kind: 'bool',
    phase: 4,
    dangerous: true,
  },
];

function SettingGroup({
  title,
  description,
  c,
  children,
}: {
  title: string;
  description?: string;
  c: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: c.text,
          marginBottom: 4,
          letterSpacing: 0.2,
        }}
      >
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12 }}>{description}</div>
      )}
      {children}
    </div>
  );
}

function phaseTag(phase: 0 | 1 | 2 | 4) {
  const color =
    phase === 0 ? 'green' : phase === 1 ? 'blue' : phase === 2 ? 'purple' : 'orange';
  return (
    <Tag color={color} style={{ fontSize: 10, margin: 0 }}>
      P{phase}
    </Tag>
  );
}

/**
 * 一条 rag.* knob 的可编辑行（labe l+ hint + 控件 + 保存按钮 + 上次更新时间）。
 * 控件类型由 KnobDef.kind 决定。值用字符串存 system_settings，所以这里负责双向转换。
 */
function KnobRow({
  def,
  setting,
  onSaved,
  c,
}: {
  def: KnobDef;
  setting: SystemSetting | undefined;
  onSaved: (updated: SystemSetting) => void;
  c: ReturnType<typeof useColors>;
}) {
  const currentValue = setting?.value ?? '';
  const [draft, setDraft] = useState<string>(currentValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(setting?.value ?? '');
  }, [setting?.value]);

  const dirty = draft !== currentValue;

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await upsertSystemSetting(def.key, {
        value: draft,
        description: def.hint,
      });
      onSaved(updated);
      message.success(`已保存 ${def.key}`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`保存失败：${msg}`);
    } finally {
      setSaving(false);
    }
  }, [def, draft, onSaved]);

  const renderControl = () => {
    switch (def.kind) {
      case 'bool':
        return (
          <Switch
            checked={draft.toLowerCase() === 'true'}
            onChange={(v) => setDraft(v ? 'true' : 'false')}
          />
        );
      case 'int':
        return (
          <InputNumber
            min={def.min}
            max={def.max}
            step={def.step ?? 1}
            value={draft === '' ? null : Number(draft)}
            onChange={(v) => setDraft(v == null ? '' : String(v))}
            style={{ width: 160 }}
          />
        );
      case 'float':
        return (
          <InputNumber
            min={def.min}
            max={def.max}
            step={def.step ?? 0.1}
            value={draft === '' ? null : Number(draft)}
            onChange={(v) => setDraft(v == null ? '' : String(v))}
            style={{ width: 160 }}
            placeholder="留空=不过滤"
          />
        );
      case 'select':
        return (
          <Select
            value={draft}
            onChange={(v) => setDraft(v)}
            options={def.options}
            style={{ width: 280 }}
          />
        );
      case 'text':
        return (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ width: 280 }}
          />
        );
      case 'csv':
        return (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="逗号分隔，如 antipattern,experimental"
            style={{ width: 360 }}
          />
        );
    }
  };

  return (
    <div
      style={{
        padding: 12,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        background: c.surface,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {phaseTag(def.phase)}
        <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{def.label}</span>
        {def.dangerous && (
          <Tooltip title="启用前请阅读 Plan agent 评审意见">
            <ExclamationCircleOutlined style={{ color: c.warning, fontSize: 12 }} />
          </Tooltip>
        )}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: c.textSubtle,
          }}
        >
          {def.key}
        </span>
      </div>
      <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>{def.hint}</div>
      <Space align="center" wrap>
        {renderControl()}
        <Button
          size="small"
          type="primary"
          disabled={!dirty || saving}
          loading={saving}
          onClick={() => void save()}
        >
          保存
        </Button>
        {setting?.updated_at && (
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: c.textSubtle,
            }}
          >
            上次更新 {new Date(setting.updated_at).toLocaleString()}
          </span>
        )}
      </Space>
    </div>
  );
}

/**
 * A/B 报告 Modal —— 用于 Phase 3/4 配置变更前后的飞轮 health 对比。
 *
 * 设计取舍：
 *   - 不自动判定"开关该不该保留"——只摆数据，admin 自己定夺（评审建议）
 *   - 默认时间窗：A=最近 14 天，B 不选则只显示单段
 *   - adopt_rate 分母走 succeeded（与后端一致，避免失败任务污染）
 */
function AbReportModal({
  open,
  onClose,
  c,
}: {
  open: boolean;
  onClose: () => void;
  c: ReturnType<typeof useColors>;
}) {
  const initial = defaultRangeA();
  const [fromA, setFromA] = useState(initial.from);
  const [toA, setToA] = useState(initial.to);
  const [fromB, setFromB] = useState('');
  const [toB, setToB] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AbReportResponse | null>(null);

  const submit = useCallback(async () => {
    if (!fromA || !toA) {
      message.warning('请至少选择 A 段时间区间');
      return;
    }
    setLoading(true);
    try {
      const params: {
        from_a: string;
        to_a: string;
        from_b?: string;
        to_b?: string;
      } = {
        from_a: toBackendIso(fromA),
        to_a: toBackendIso(toA),
      };
      if (fromB && toB) {
        params.from_b = toBackendIso(fromB);
        params.to_b = toBackendIso(toB);
      }
      const r = await getAbReport(params);
      setReport(r);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`查询失败：${msg}`);
    } finally {
      setLoading(false);
    }
  }, [fromA, toA, fromB, toB]);

  /** 把指标按行展开为 Table 数据（A / B / Δ 三列） */
  const buildTableRows = (a: AbBucket, b: AbBucket | null) => {
    const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
    const fmtNum = (v: number) => v.toLocaleString();
    const fmtFix = (v: number) => v.toFixed(2);
    const diffPct = (av: number, bv: number) => {
      const d = bv - av;
      const sign = d > 0 ? '+' : '';
      return `${sign}${(d * 100).toFixed(1)} pp`;
    };
    const diffNum = (av: number, bv: number) => {
      const d = bv - av;
      return d > 0 ? `+${d}` : `${d}`;
    };
    const rows: Array<{
      key: string;
      metric: string;
      a: string;
      b?: string;
      delta?: string;
      tone?: 'good' | 'bad' | 'neutral';
    }> = [];
    rows.push({
      key: 'total',
      metric: '总任务数',
      a: fmtNum(a.total),
      b: b ? fmtNum(b.total) : undefined,
      delta: b ? diffNum(a.total, b.total) : undefined,
      tone: 'neutral',
    });
    rows.push({
      key: 'succeeded',
      metric: '成功数',
      a: fmtNum(a.succeeded),
      b: b ? fmtNum(b.succeeded) : undefined,
      delta: b ? diffNum(a.succeeded, b.succeeded) : undefined,
      tone: 'neutral',
    });
    rows.push({
      key: 'succeed_rate',
      metric: '成功率',
      a: fmtPct(a.succeed_rate),
      b: b ? fmtPct(b.succeed_rate) : undefined,
      delta: b ? diffPct(a.succeed_rate, b.succeed_rate) : undefined,
      tone: b
        ? b.succeed_rate > a.succeed_rate
          ? 'good'
          : b.succeed_rate < a.succeed_rate
          ? 'bad'
          : 'neutral'
        : 'neutral',
    });
    rows.push({
      key: 'adopt_rate',
      metric: '采纳率（succeeded 作分母）',
      a: fmtPct(a.adopt_rate),
      b: b ? fmtPct(b.adopt_rate) : undefined,
      delta: b ? diffPct(a.adopt_rate, b.adopt_rate) : undefined,
      tone: b
        ? b.adopt_rate > a.adopt_rate
          ? 'good'
          : b.adopt_rate < a.adopt_rate
          ? 'bad'
          : 'neutral'
        : 'neutral',
    });
    rows.push({
      key: 'fail_rate',
      metric: '失败率',
      a: fmtPct(a.fail_rate),
      b: b ? fmtPct(b.fail_rate) : undefined,
      delta: b ? diffPct(a.fail_rate, b.fail_rate) : undefined,
      tone: b
        ? b.fail_rate < a.fail_rate
          ? 'good'
          : b.fail_rate > a.fail_rate
          ? 'bad'
          : 'neutral'
        : 'neutral',
    });
    rows.push({
      key: 'avg_fix_attempts',
      metric: '平均修复次数',
      a: fmtFix(a.avg_fix_attempts),
      b: b ? fmtFix(b.avg_fix_attempts) : undefined,
      delta: b
        ? `${b.avg_fix_attempts > a.avg_fix_attempts ? '+' : ''}${(
            b.avg_fix_attempts - a.avg_fix_attempts
          ).toFixed(2)}`
        : undefined,
      tone: b
        ? b.avg_fix_attempts < a.avg_fix_attempts
          ? 'good'
          : b.avg_fix_attempts > a.avg_fix_attempts
          ? 'bad'
          : 'neutral'
        : 'neutral',
    });
    return rows;
  };

  return (
    <Modal
      title="📊 RAG 飞轮 A/B 对比"
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
    >
      <Alert
        type="info"
        showIcon
        message="使用方法"
        description={
          <span style={{ fontSize: 12 }}>
            A 段 = 配置变更前；B 段 = 变更后。建议各 ≥ 14 天，确保任务量足够（参考 30 天基线）。
            <br />
            采纳率以"成功的任务"为分母（避免失败任务污染信号）；diff = B − A，正数 = B 段更高。
            <br />
            <strong>本工具只摆数据，不自动判定"开关是否值得保留"</strong>——admin 自己结合定性观察。
          </span>
        }
        style={{ marginBottom: 12 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <div>
          <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
            A 段（配置变更前 / 基线）
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <input
              type="datetime-local"
              value={fromA}
              onChange={(e) => setFromA(e.target.value)}
              style={dateInputStyle(c)}
            />
            <input
              type="datetime-local"
              value={toA}
              onChange={(e) => setToA(e.target.value)}
              style={dateInputStyle(c)}
            />
          </Space.Compact>
        </div>
        <div>
          <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
            B 段（配置变更后 / 对照；不填则只看单段）
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <input
              type="datetime-local"
              value={fromB}
              onChange={(e) => setFromB(e.target.value)}
              style={dateInputStyle(c)}
            />
            <input
              type="datetime-local"
              value={toB}
              onChange={(e) => setToB(e.target.value)}
              style={dateInputStyle(c)}
            />
          </Space.Compact>
        </div>
        <Button type="primary" loading={loading} onClick={() => void submit()}>
          对比
        </Button>

        {report && (
          <div style={{ marginTop: 8 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={buildTableRows(report.a, report.b)}
              columns={[
                { title: '指标', dataIndex: 'metric', width: 220 },
                { title: 'A', dataIndex: 'a', width: 120, align: 'right' as const },
                {
                  title: 'B',
                  dataIndex: 'b',
                  width: 120,
                  align: 'right' as const,
                  render: (v: string | undefined) =>
                    v ?? <span style={{ color: c.textSubtle }}>—</span>,
                },
                {
                  title: 'Δ',
                  dataIndex: 'delta',
                  width: 100,
                  align: 'right' as const,
                  render: (v: string | undefined, row) => {
                    if (!v) return <span style={{ color: c.textSubtle }}>—</span>;
                    const tone = row.tone;
                    const color =
                      tone === 'good' ? c.success : tone === 'bad' ? c.destructive : c.textMuted;
                    return <span style={{ color, fontFamily: 'var(--font-mono)' }}>{v}</span>;
                  },
                },
              ]}
            />
            <div style={{ marginTop: 8, fontSize: 11, color: c.textSubtle, fontFamily: 'var(--font-mono)' }}>
              A: {report.a.from} ~ {report.a.to}
              {report.b && (
                <>
                  <br />
                  B: {report.b.from} ~ {report.b.to}
                </>
              )}
            </div>
            {report.a.total < 10 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8, fontSize: 12 }}
                message={`A 段任务数仅 ${report.a.total}，样本量不足；任何率值都可能是噪音，建议拉长时间窗或先攒更多任务再 A/B`}
              />
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
}

export default function SystemSettingsTab() {
  const c = useColors();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allSettings, setAllSettings] = useState<SystemSetting[]>([]);

  // D3 adopt_default_status 单独 hold（它不在 rag.* 前缀下，属"飞轮基础"组）
  const adoptSetting = allSettings.find((s) => s.key === ADOPT_KEY);
  const [adoptDraft, setAdoptDraft] = useState<'pending' | 'approved'>('pending');

  const [abModalOpen, setAbModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listSystemSettings();
      setAllSettings(list);
      const a = list.find((s) => s.key === ADOPT_KEY);
      const v = (a?.value ?? 'pending') as 'pending' | 'approved';
      setAdoptDraft(v === 'approved' ? 'approved' : 'pending');
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`加载配置失败：${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSaveAdopt = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await upsertSystemSetting(ADOPT_KEY, {
        value: adoptDraft,
        description:
          '采纳后入库默认状态：pending=待审，approved=直接进飞轮（D3 决策默认 pending）',
      });
      setAllSettings((prev) => {
        const filtered = prev.filter((s) => s.key !== ADOPT_KEY);
        return [...filtered, updated];
      });
      message.success(`已保存（默认状态：${adoptDraft}）`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`保存失败：${msg}`);
    } finally {
      setSaving(false);
    }
  }, [adoptDraft]);

  const onKnobSaved = useCallback((updated: SystemSetting) => {
    setAllSettings((prev) => {
      const filtered = prev.filter((s) => s.key !== updated.key);
      return [...filtered, updated];
    });
  }, []);

  if (loading) return <Spin />;

  const adoptDirty = (adoptSetting?.value ?? 'pending') !== adoptDraft;

  // 按 phase 分组 knob（也可以继续扁平，但分档更容易 admin 理解当前"飞轮位相"）
  const knobsByPhase: Record<string, KnobDef[]> = {
    '0': RAG_KNOBS.filter((k) => k.phase === 0),
    '1': RAG_KNOBS.filter((k) => k.phase === 1),
    '2': RAG_KNOBS.filter((k) => k.phase === 2),
    '4': RAG_KNOBS.filter((k) => k.phase === 4),
  };
  const settingMap = new Map(allSettings.map((s) => [s.key, s]));

  return (
    <div style={{ maxWidth: 960 }}>
      <Alert
        type="warning"
        showIcon
        message="首次开启权重 / 负例 / LLM 评委前，请先阅读 Plan agent 评审要点"
        description={
          <ul style={{ fontSize: 12, margin: '4px 0 0 16px', padding: 0 }}>
            <li>埋点先于加权（Phase 1 数据 2 周后再开 weighting）</li>
            <li>quality 走硬过滤而非叠加（avoid ranking 玄学调参）</li>
            <li>LLM 评委必须换 provider（避同族偏见）</li>
            <li>负例仅结构性（避 LLM negation blindness），必须 A/B 验证</li>
          </ul>
        }
        style={{ marginBottom: 20 }}
      />

      {/* 组 1：飞轮基础 */}
      <SettingGroup
        title="飞轮基础"
        description="采纳 → 入库的默认状态（D3 决策）"
        c={c}
      >
        <Card size="small" bordered>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: c.textSubtle,
              marginBottom: 6,
            }}
          >
            {ADOPT_KEY}
          </div>
          <Radio.Group value={adoptDraft} onChange={(e) => setAdoptDraft(e.target.value)}>
            <Space direction="vertical">
              <Radio value="pending">
                <Tag color="orange" style={{ color: c.text }}>
                  pending
                </Tag>
                <span style={{ color: c.textMuted, fontSize: 12 }}>（默认推荐，安全）</span>
              </Radio>
              <Radio value="approved">
                <Tag color="green">approved</Tag>
                <span style={{ color: c.textMuted, fontSize: 12 }}>
                  （直接进飞轮；适合内部团队信任度高的场景）
                </span>
              </Radio>
            </Space>
          </Radio.Group>
          <div style={{ marginTop: 12 }}>
            <Button
              type="primary"
              size="small"
              onClick={() => void onSaveAdopt()}
              disabled={!adoptDirty || saving}
              loading={saving}
            >
              保存
            </Button>
            {adoptSetting?.updated_at && (
              <span
                style={{
                  marginLeft: 12,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: c.textSubtle,
                }}
              >
                上次更新 {new Date(adoptSetting.updated_at).toLocaleString()}
              </span>
            )}
          </div>
        </Card>
      </SettingGroup>

      {/* 组 2：RAG 飞轮（全量 rag.* knob） */}
      <SettingGroup
        title="RAG 飞轮（质量闭环）"
        description="2026-04 质量闭环配置。按 Phase 标签分档：P0 基础即可启用 / P1 埋点阶段 / P2 LLM 评委 / P4 负例"
        c={c}
      >
        <div style={{ marginBottom: 12 }}>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setAbModalOpen(true)}
          >
            A/B 对比报告
          </Button>
          <span style={{ marginLeft: 10, fontSize: 12, color: c.textSubtle }}>
            Phase 3/4 启用前后用，对比配置变更前后任务成功率 / 采纳率 / 修复次数
          </span>
        </div>
        {(['0', '1', '2', '4'] as const).map((p) => (
          <div key={p} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: c.textMuted,
                marginBottom: 6,
                letterSpacing: 0.3,
              }}
            >
              Phase {p}
            </div>
            {knobsByPhase[p].map((def) => (
              <KnobRow
                key={def.key}
                def={def}
                setting={settingMap.get(def.key)}
                onSaved={onKnobSaved}
                c={c}
              />
            ))}
          </div>
        ))}
      </SettingGroup>

      <AbReportModal open={abModalOpen} onClose={() => setAbModalOpen(false)} c={c} />

      {/* 组 3：任务追踪日志（tracelog.*） */}
      <SettingGroup
        title="任务追踪日志（tracelog）"
        description="把每次任务的执行细节归档到 FS（含 LLM 入参 / raw response / Skills 全文 / RAG 样本快照），供事后给 Claude / LLM 分析。默认 disabled，按需开启。"
        c={c}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12, fontSize: 12 }}
          message="开启后磁盘开销估算"
          description={
            <span style={{ fontSize: 12 }}>
              <code>all_tasks</code> 模式 ≈ 50KB-500KB / 任务（取决于 LLM 调用轮数 + Skills/RAG 数据量）；
              开 <code>compress=true</code> 后 tar.gz 归档省 70%+。
              <br />
              路径 <code>${'{tracelog.dir}'}/task-{'<id>'}/</code> 含 events.jsonl / system_prompt.md / llm_calls/ / skills_snapshot/ / rag_snapshot/ 等。
              <br />
              <strong>归档目的</strong>：admin 把 <code>analysis_input.md</code> 喂给 Claude 让它分析"为什么上次任务失败"。
            </span>
          }
        />
        {TRACELOG_KNOBS.map((def) => (
          <KnobRow
            key={def.key}
            def={def}
            setting={settingMap.get(def.key)}
            onSaved={onKnobSaved}
            c={c}
          />
        ))}
      </SettingGroup>
    </div>
  );
}
