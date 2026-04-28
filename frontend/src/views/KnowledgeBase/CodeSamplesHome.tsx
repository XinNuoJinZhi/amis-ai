// B.4 RAG 样例库列表页（/knowledge-base/code-samples）
//
// 2026-04 质量闭环扩展（Phase 0+）：
//   - 顶部统计卡片：pending / approved / rejected / negative / rated_count / avg_rating / judge coverage
//   - 列表加 Rating / Verdict / Thumbs / Negative 四列
//   - 行操作新增「👍/👎」、批量操作
//   - 后面 Phase 2/4 会再追加「AI 打分」按钮 + 批量评分弹窗（复用当前 UI 骨架）

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Input,
  Modal,
  Popconfirm,
  Rate,
  Row,
  Col,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckOutlined,
  CloseOutlined,
  ExperimentOutlined,
  LikeOutlined,
  DislikeOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  approveCodeSample,
  batchScore,
  createCodeSample,
  deleteCodeSample,
  getSampleStats,
  listCodeSamples,
  rejectCodeSample,
  scoreSampleAsync,
  submitFeedback,
  type BatchScorePayload,
  type CodeSampleListRow,
  type ListParams,
  type QualityVerdict,
  type SampleStats,
  type SampleStatus,
} from '../../services/codeSamples';
import { useColors } from '../../theme';

type StatusFilter = '' | SampleStatus;

function statusTag(status: SampleStatus, c: ReturnType<typeof useColors>) {
  if (status === 'approved')
    return <Tag color="green" style={{ margin: 0 }}>已通过</Tag>;
  if (status === 'rejected')
    return <Tag color="red" style={{ margin: 0 }}>已拒绝</Tag>;
  return (
    <Tag color="orange" style={{ margin: 0, color: c.text }}>
      待审
    </Tag>
  );
}

function verdictTag(verdict: QualityVerdict | null | undefined) {
  if (!verdict) return <span style={{ fontSize: 11, opacity: 0.4 }}>—</span>;
  if (verdict === 'good') return <Tag color="green" style={{ margin: 0, fontSize: 11 }}>good</Tag>;
  if (verdict === 'needs_review')
    return <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>needs_review</Tag>;
  return <Tag color="red" style={{ margin: 0, fontSize: 11 }}>bad</Tag>;
}

function StatsCard({
  title,
  value,
  hint,
  tone,
  c,
}: {
  title: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'warn' | 'success' | 'danger';
  c: ReturnType<typeof useColors>;
}) {
  const toneColor =
    tone === 'warn'
      ? c.warning
      : tone === 'success'
      ? c.success
      : tone === 'danger'
      ? c.destructive
      : c.text;
  return (
    <div
      style={{
        padding: '12px 14px',
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        background: c.surface,
        minHeight: 76,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: c.textMuted,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: toneColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: c.textSubtle, marginTop: 4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export default function CodeSamplesHome() {
  const c = useColors();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [techStack, setTechStack] = useState<string>('');
  const [sourceTeam, setSourceTeam] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [items, setItems] = useState<CodeSampleListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<SampleStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Phase 2：批量评分弹窗
  const [batchScoreOpen, setBatchScoreOpen] = useState(false);
  const [batchScoreScope, setBatchScoreScope] = useState<'selected' | 'pending_only' | 'all_unscored'>(
    'selected'
  );
  const [batchScoreLimit, setBatchScoreLimit] = useState<number>(20);
  const [batchScoreSubmitting, setBatchScoreSubmitting] = useState(false);

  const [insertOpen, setInsertOpen] = useState(false);
  const [insertForm, setInsertForm] = useState({
    tech_stack: '',
    source_team: 'amis-ai',
    amis_json_summary: '',
    code_summary: '',
    full_amis_json: '',
    full_code: '',
    status: 'approved' as SampleStatus,
  });
  const [insertSubmitting, setInsertSubmitting] = useState(false);

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getSampleStats();
      setStats(s);
    } catch {
      /* 静默：stats 失败不致命，顶部卡片保持空 */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListParams = {
        status: statusFilter || undefined,
        tech_stack: techStack || undefined,
        source_team: sourceTeam || undefined,
        keyword: keyword || undefined,
        page,
        page_size: pageSize,
      };
      const resp = await listCodeSamples(params);
      setItems(resp.items);
      setTotal(resp.total);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`加载样例失败：${msg}`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, techStack, sourceTeam, keyword, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const onApprove = useCallback(
    async (id: number) => {
      try {
        await approveCodeSample(id);
        message.success('已通过，进入飞轮检索');
        void refresh();
        void refreshStats();
        // 让左侧菜单 pending 角标立即重拉一次，不必等下一个 60s 轮询
        window.dispatchEvent(new Event('rag:pending-changed'));
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
        message.error(`通过失败：${msg}`);
      }
    },
    [refresh, refreshStats]
  );

  const onReject = useCallback(
    async (id: number) => {
      try {
        await rejectCodeSample(id);
        message.success('已拒绝');
        void refresh();
        void refreshStats();
        window.dispatchEvent(new Event('rag:pending-changed'));
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
        message.error(`拒绝失败：${msg}`);
      }
    },
    [refresh, refreshStats]
  );

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteCodeSample(id);
        message.success('已删除');
        void refresh();
        void refreshStats();
        window.dispatchEvent(new Event('rag:pending-changed'));
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
        message.error(`删除失败：${msg}`);
      }
    },
    [refresh, refreshStats]
  );

  const onFeedback = useCallback(
    async (id: number, kind: 'up' | 'down') => {
      try {
        await submitFeedback(id, kind);
        // 小刷新：不需要全量 refresh，只更新当前行的 thumbs_up/down
        setItems((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  thumbs_up: kind === 'up' ? (r.thumbs_up ?? 0) + 1 : r.thumbs_up,
                  thumbs_down: kind === 'down' ? (r.thumbs_down ?? 0) + 1 : r.thumbs_down,
                }
              : r
          )
        );
        void refreshStats();
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
        message.error(`反馈失败：${msg}`);
      }
    },
    [refreshStats]
  );

  const onBatchApprove = useCallback(async () => {
    if (!selectedIds.length) return;
    const results = await Promise.allSettled(selectedIds.map((id) => approveCodeSample(id)));
    const fail = results.filter((r) => r.status === 'rejected').length;
    const ok = results.length - fail;
    message.info(`批量通过：成功 ${ok} 条${fail ? `，失败 ${fail} 条` : ''}`);
    setSelectedIds([]);
    void refresh();
    void refreshStats();
    window.dispatchEvent(new Event('rag:pending-changed'));
  }, [refresh, refreshStats, selectedIds]);

  const onBatchReject = useCallback(async () => {
    if (!selectedIds.length) return;
    const results = await Promise.allSettled(selectedIds.map((id) => rejectCodeSample(id)));
    const fail = results.filter((r) => r.status === 'rejected').length;
    const ok = results.length - fail;
    message.info(`批量拒绝：成功 ${ok} 条${fail ? `，失败 ${fail} 条` : ''}`);
    setSelectedIds([]);
    void refresh();
    void refreshStats();
    window.dispatchEvent(new Event('rag:pending-changed'));
  }, [refresh, refreshStats, selectedIds]);

  const onScoreSample = useCallback(async (id: number) => {
    try {
      const resp = await scoreSampleAsync(id);
      message.success(resp.notice ?? '已排队 AI 评分');
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`触发 AI 评分失败：${msg}`);
    }
  }, []);

  const submitBatchScore = useCallback(async () => {
    setBatchScoreSubmitting(true);
    try {
      const payload: BatchScorePayload = {
        limit: batchScoreLimit,
      };
      if (batchScoreScope === 'selected') {
        if (!selectedIds.length) {
          message.warning('未选中任何行');
          setBatchScoreSubmitting(false);
          return;
        }
        payload.ids = selectedIds;
      } else {
        payload.scope = batchScoreScope;
      }
      const resp = await batchScore(payload);
      message.success(`已排队 ${resp.queued} 条（超预算会自动 skip，查看审计日志）`);
      setBatchScoreOpen(false);
      setSelectedIds([]);
      // 稍等 3s 再刷，给 LLM 第一批回填留点时间
      window.setTimeout(() => {
        void refresh();
        void refreshStats();
      }, 3000);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`批量评分失败：${msg}`);
    } finally {
      setBatchScoreSubmitting(false);
    }
  }, [batchScoreLimit, batchScoreScope, refresh, refreshStats, selectedIds]);

  const submitInsert = useCallback(async () => {
    if (!insertForm.tech_stack.trim()) return message.warning('tech_stack 必填');
    if (!insertForm.full_amis_json.trim()) return message.warning('full_amis_json 必填');
    if (!insertForm.full_code.trim()) return message.warning('full_code 必填');
    setInsertSubmitting(true);
    try {
      await createCodeSample({
        tech_stack: insertForm.tech_stack.trim(),
        source_team: insertForm.source_team.trim() || 'amis-ai',
        amis_json_summary: insertForm.amis_json_summary.trim() || undefined,
        code_summary: insertForm.code_summary.trim() || undefined,
        full_amis_json: insertForm.full_amis_json,
        full_code: insertForm.full_code,
        status: insertForm.status,
      });
      message.success(`已入库（status=${insertForm.status}）`);
      setInsertOpen(false);
      setInsertForm({
        tech_stack: '',
        source_team: 'amis-ai',
        amis_json_summary: '',
        code_summary: '',
        full_amis_json: '',
        full_code: '',
        status: 'approved',
      });
      void refresh();
      void refreshStats();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`入库失败：${msg}`);
    } finally {
      setInsertSubmitting(false);
    }
  }, [insertForm, refresh, refreshStats]);

  const columns: ColumnsType<CodeSampleListRow> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 56,
        render: (v: number) => (
          <span style={{ fontFamily: 'var(--font-mono)', color: c.textMuted, fontSize: 12 }}>
            #{v}
          </span>
        ),
      },
      {
        title: '技术栈 / 来源',
        width: 200,
        render: (_: unknown, r) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: c.text }}>
              {r.tech_stack}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c.textSubtle }}>
              {r.source_team}
            </span>
            {(r.platforms?.length || r.tech_stacks?.length || r.ui_libs?.length) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                {(r.platforms || []).map((p) => (
                  <Tag key={`p-${p}`} color="green" style={{ margin: 0, fontSize: 10 }}>
                    {p}
                  </Tag>
                ))}
                {(r.tech_stacks || []).map((s) => (
                  <Tag key={`s-${s}`} color="blue" style={{ margin: 0, fontSize: 10 }}>
                    {s}
                  </Tag>
                ))}
                {(r.ui_libs || []).map((u) => (
                  <Tag key={`u-${u}`} color="purple" style={{ margin: 0, fontSize: 10 }}>
                    {u}
                  </Tag>
                ))}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: '摘要',
        render: (_: unknown, r) => (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                color: c.text,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}
            >
              {r.amis_json_summary || (
                <span style={{ color: c.textSubtle, fontStyle: 'italic' }}>(无 amis 摘要)</span>
              )}
            </div>
            {r.code_summary && (
              <div
                style={{
                  fontSize: 12,
                  color: c.textMuted,
                  lineHeight: 1.4,
                  marginTop: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}
              >
                code: {r.code_summary}
              </div>
            )}
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 76,
        render: (s: SampleStatus, r) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {statusTag(s, c)}
            {r.is_negative && (
              <Tag
                icon={<WarningOutlined />}
                color="red"
                style={{ margin: 0, fontSize: 10 }}
              >
                反例{r.negative_kind ? `·${r.negative_kind}` : ''}
              </Tag>
            )}
          </div>
        ),
      },
      {
        // 一列两行：上行 = 人工 0-5 星评分；下行 = AI 评委 verdict。
        // 历史 bug：只有 — 没有标签，admin 看不出"哪行是哪个"，详见 #36/#38 排查记录。
        title: '评分',
        width: 132,
        render: (_: unknown, r) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  color: c.textSubtle,
                  fontFamily: 'var(--font-mono)',
                  width: 20,
                }}
              >
                人工
              </span>
              {r.rating != null ? (
                <Rate disabled allowHalf value={r.rating} style={{ fontSize: 12 }} />
              ) : (
                <span style={{ fontSize: 11, color: c.textSubtle, fontFamily: 'var(--font-mono)' }}>
                  —
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  color: c.textSubtle,
                  fontFamily: 'var(--font-mono)',
                  width: 20,
                }}
              >
                AI
              </span>
              {verdictTag(r.quality_verdict)}
            </div>
          </div>
        ),
      },
      {
        title: '👍 / 👎',
        width: 86,
        render: (_: unknown, r) => (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="👍 有用">
              <Button
                size="small"
                type="text"
                icon={<LikeOutlined />}
                onClick={() => void onFeedback(r.id, 'up')}
                style={{ color: r.thumbs_up ? c.success : c.textMuted }}
              >
                <span style={{ fontSize: 11 }}>{r.thumbs_up ?? 0}</span>
              </Button>
            </Tooltip>
            <Tooltip title="👎 没用">
              <Button
                size="small"
                type="text"
                icon={<DislikeOutlined />}
                onClick={() => void onFeedback(r.id, 'down')}
                style={{ color: r.thumbs_down ? c.destructive : c.textMuted }}
              >
                <span style={{ fontSize: 11 }}>{r.thumbs_down ?? 0}</span>
              </Button>
            </Tooltip>
          </Space>
        ),
      },
      {
        title: '命中',
        dataIndex: 'hit_count',
        width: 56,
        render: (v: number) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
        ),
      },
      {
        title: '操作',
        width: 220,
        render: (_: unknown, r) => (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              type="link"
              onClick={() => navigate(`/knowledge-base/code-samples/${r.id}`)}
            >
              详情
            </Button>
            {r.status !== 'approved' && (
              <Button
                size="small"
                type="link"
                icon={<CheckOutlined />}
                onClick={() => void onApprove(r.id)}
              >
                通过
              </Button>
            )}
            {r.status !== 'rejected' && (
              <Button
                size="small"
                type="link"
                icon={<CloseOutlined />}
                danger
                onClick={() => void onReject(r.id)}
              >
                拒绝
              </Button>
            )}
            <Tooltip title="触发 AI 评委打分（受 rag.judge.mode / budget_per_day 控制）">
              <Button
                size="small"
                type="link"
                icon={<ExperimentOutlined />}
                onClick={() => void onScoreSample(r.id)}
              >
                AI 打分
              </Button>
            </Tooltip>
            <Popconfirm
              title="确认删除？"
              description="删除后无法恢复，建议用'拒绝'代替"
              okType="danger"
              onConfirm={() => void onDelete(r.id)}
            >
              <Button size="small" type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [c, navigate, onApprove, onDelete, onFeedback, onReject, onScoreSample]
  );

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 48px)',
        padding: '32px 32px 48px',
        background: c.bg,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: c.text,
            margin: 0,
            letterSpacing: -0.2,
          }}
        >
          RAG 样例库
        </h2>
        <div style={{ fontSize: 13, color: c.textMuted, marginTop: 6 }}>
          反向飞轮采纳的样例 + pgvector 检索。
          <strong style={{ color: c.text }}> 只有通过审核的样例</strong>会参与下次任务的 Top-K 检索。
          质量权重 / 负例注入 knob 在「系统设置 → RAG 飞轮」调。
        </div>
      </div>

      {/* 顶部统计卡片（Phase 0） */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <StatsCard
            title="待审"
            value={stats?.pending ?? (statsLoading ? '…' : 0)}
            hint="先审后召回"
            tone="warn"
            c={c}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatsCard
            title="已通过"
            value={stats?.approved ?? (statsLoading ? '…' : 0)}
            hint="参与 RAG 检索"
            tone="success"
            c={c}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatsCard
            title="已拒绝"
            value={stats?.rejected ?? (statsLoading ? '…' : 0)}
            hint={`含负例 ${stats?.negative ?? 0}`}
            tone="danger"
            c={c}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatsCard
            title="平均评分"
            value={
              stats?.avg_rating != null
                ? stats.avg_rating.toFixed(2)
                : statsLoading
                ? '…'
                : '—'
            }
            hint={`已评 ${stats?.rated_count ?? 0} 条`}
            c={c}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          {(() => {
            // 任务 4：小样本下不显示具体百分比，避免误导决策。
            // 阈值 10 是经验值——二项分布 N=10 时 95% 置信区间还有 ±30%，但已经能看出趋势。
            // 真正的 Wilson interval 太重，admin 只需"够样本了吗"这个信号。
            const MIN_SAMPLE_FOR_PCT = 10;
            const haveEnough =
              stats != null && stats.judge_covered >= MIN_SAMPLE_FOR_PCT && stats.judge_good_pct != null;
            const value = !stats
              ? statsLoading
                ? '…'
                : '—'
              : haveEnough
              ? `${(stats.judge_good_pct! * 100).toFixed(0)}%`
              : stats.judge_covered > 0
              ? `${stats.judge_good}/${stats.judge_covered}`
              : '—';
            const hint = !stats
              ? ''
              : stats.judge_covered === 0
              ? 'Phase 2 未启'
              : haveEnough
              ? `${stats.judge_good}/${stats.judge_covered} good`
              : `样本不足（n=${stats.judge_covered}，<${MIN_SAMPLE_FOR_PCT}）`;
            return (
              <Tooltip
                title={
                  stats && stats.judge_covered > 0 && !haveEnough
                    ? `已评 ${stats.judge_covered} 条，N<${MIN_SAMPLE_FOR_PCT} 时不展示百分比避免误判（小样本噪音大，如 2/3=67% 与 4/6=67% 含义完全不同）。`
                    : ''
                }
              >
                <div>
                  <StatsCard title="AI 评委覆盖" value={value} hint={hint} c={c} />
                </div>
              </Tooltip>
            );
          })()}
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatsCard
            title="总赞 / 踩"
            value={`${stats?.thumbs_up_total ?? 0} / ${stats?.thumbs_down_total ?? 0}`}
            hint="仅埋点，不入 ranking"
            c={c}
          />
        </Col>
      </Row>

      {/* 状态切换 */}
      <div style={{ marginBottom: 16 }}>
        <Segmented
          size="small"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as StatusFilter);
            setPage(1);
          }}
          options={[
            { label: '全部', value: '' },
            { label: '待审', value: 'pending' },
            { label: '已通过', value: 'approved' },
            { label: '已拒绝', value: 'rejected' },
          ]}
        />
      </div>

      {/* 过滤行 */}
      <Space wrap style={{ marginBottom: 16, width: '100%' }}>
        <Input
          placeholder="tech_stack（如 uniapp-wot-h5）"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          onPressEnter={() => {
            setPage(1);
            void refresh();
          }}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          placeholder="source_team"
          value={sourceTeam || undefined}
          onChange={(v) => {
            setSourceTeam(v ?? '');
            setPage(1);
          }}
          allowClear
          style={{ width: 160 }}
          options={[
            { label: 'amis-ai', value: 'amis-ai' },
            { label: 'zc-amis', value: 'zc-amis' },
          ]}
        />
        <Input.Search
          placeholder="搜索摘要关键字"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={() => {
            setPage(1);
            void refresh();
          }}
          style={{ width: 240 }}
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={() => { void refresh(); void refreshStats(); }}>
          刷新
        </Button>
        <Button
          icon={<ExperimentOutlined />}
          onClick={() => {
            setBatchScoreScope(selectedIds.length ? 'selected' : 'pending_only');
            setBatchScoreOpen(true);
          }}
        >
          批量 AI 评分
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setInsertOpen(true)}>
          手动入库
        </Button>
      </Space>

      {/* 批量操作工具栏（选中时才显示） */}
      {selectedIds.length > 0 && (
        <div
          style={{
            padding: '8px 14px',
            marginBottom: 12,
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            background: c.surfaceElevated,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: c.text }}>
            已选 <strong>{selectedIds.length}</strong> 条
          </span>
          <Popconfirm
            title={`批量通过 ${selectedIds.length} 条？`}
            onConfirm={() => void onBatchApprove()}
          >
            <Button size="small" icon={<CheckOutlined />}>
              批量通过
            </Button>
          </Popconfirm>
          <Popconfirm
            title={`批量拒绝 ${selectedIds.length} 条？`}
            onConfirm={() => void onBatchReject()}
          >
            <Button size="small" danger icon={<CloseOutlined />}>
              批量拒绝
            </Button>
          </Popconfirm>
          <Button size="small" type="text" onClick={() => setSelectedIds([])}>
            取消选择
          </Button>
        </div>
      )}

      {total === 0 && !loading && statusFilter === 'pending' && (
        <Alert
          type="info"
          showIcon
          message="还没有待审样例"
          description="飞轮启动需要先有 5–8 条种子样例。点'手动入库'添加一条，或者先跑一个反向生成任务再点'采纳'让它进库。"
          style={{ marginBottom: 16, background: c.surfaceElevated, border: `1px solid ${c.border}` }}
        />
      )}

      <Table<CodeSampleListRow>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys.map((k) => Number(k))),
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/knowledge-base/code-samples/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      {/* 手动入库弹窗（冷启动种子用） */}
      <Modal
        title="手动入库样例（冷启动种子 / 经验沉淀）"
        open={insertOpen}
        onOk={() => void submitInsert()}
        onCancel={() => setInsertOpen(false)}
        okText="入库"
        cancelText="取消"
        width={720}
        confirmLoading={insertSubmitting}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>tech_stack *</div>
              <Input
                value={insertForm.tech_stack}
                onChange={(e) => setInsertForm({ ...insertForm, tech_stack: e.target.value })}
                placeholder="例如 uniapp-wot-h5"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>source_team</div>
              <Input
                value={insertForm.source_team}
                onChange={(e) => setInsertForm({ ...insertForm, source_team: e.target.value })}
                placeholder="amis-ai"
              />
            </div>
            <div style={{ width: 120 }}>
              <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>初始状态</div>
              <Select
                value={insertForm.status}
                onChange={(v) => setInsertForm({ ...insertForm, status: v })}
                style={{ width: '100%' }}
                options={[
                  { label: 'pending', value: 'pending' },
                  { label: 'approved', value: 'approved' },
                  { label: 'rejected', value: 'rejected' },
                ]}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
              amis_json_summary（用户需求/Amis 用途的人话描述，参与向量化）
            </div>
            <Input.TextArea
              rows={2}
              value={insertForm.amis_json_summary}
              onChange={(e) => setInsertForm({ ...insertForm, amis_json_summary: e.target.value })}
              placeholder="例如：用户登录页，含手机号验证码登录 + 第三方登录入口"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>code_summary（代码做了什么）</div>
            <Input.TextArea
              rows={2}
              value={insertForm.code_summary}
              onChange={(e) => setInsertForm({ ...insertForm, code_summary: e.target.value })}
              placeholder="例如：使用 wd-input + wd-button 实现，axios 请求 /auth/login"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>full_amis_json *</div>
            <Input.TextArea
              rows={4}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              value={insertForm.full_amis_json}
              onChange={(e) => setInsertForm({ ...insertForm, full_amis_json: e.target.value })}
              placeholder='{"type":"page","body":[...]}'
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>full_code *</div>
            <Input.TextArea
              rows={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              value={insertForm.full_code}
              onChange={(e) => setInsertForm({ ...insertForm, full_code: e.target.value })}
              placeholder="多文件用 ```vue\n...\n``` 分块拼接"
            />
          </div>
          <Alert
            type="info"
            showIcon
            style={{ fontSize: 12 }}
            message="入库后异步向量化（agent 日志可查）。状态为 approved 才会被检索召回。"
          />
        </Space>
      </Modal>

      {/* Phase 2：批量 AI 评分 Modal */}
      <Modal
        title="批量 AI 评分（LLM 评委）"
        open={batchScoreOpen}
        onOk={() => void submitBatchScore()}
        onCancel={() => setBatchScoreOpen(false)}
        okText="开始评分"
        cancelText="取消"
        confirmLoading={batchScoreSubmitting}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="warning"
            showIcon
            style={{ fontSize: 12 }}
            message="配置门禁"
            description={
              <span style={{ fontSize: 12 }}>
                <code>rag.judge.mode</code> = disabled 时所有调用会直接 skip 并写 audit。<br />
                <code>rag.judge.budget_per_day</code> 控制今日最多评多少条；超配额的样本自动 skip。<br />
                建议在「系统设置 → RAG 飞轮」先检查这两个值。
              </span>
            }
          />
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>评分范围</div>
            <Select
              value={batchScoreScope}
              onChange={(v) => setBatchScoreScope(v)}
              style={{ width: '100%' }}
              options={[
                {
                  label: `选中的 ${selectedIds.length} 条`,
                  value: 'selected',
                  disabled: !selectedIds.length,
                },
                { label: '所有 pending 样例', value: 'pending_only' },
                { label: '所有尚未评分的样例', value: 'all_unscored' },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
              本次最多处理（兜底上限，预算闸仍生效）
            </div>
            <Select
              value={batchScoreLimit}
              onChange={(v) => setBatchScoreLimit(v)}
              style={{ width: '100%' }}
              options={[10, 20, 50, 100].map((n) => ({
                label: `${n} 条`,
                value: n,
              }))}
            />
          </div>
          <Alert
            type="info"
            showIcon
            style={{ fontSize: 12 }}
            message="评分结果异步回填。关闭弹窗 3 秒后列表自动刷新；详细审计见样例详情页的「审计日志」按钮。"
          />
        </Space>
      </Modal>
    </div>
  );
}
