// B.4 RAG 样例详情页（/knowledge-base/code-samples/:id）
//
// 2026-04 质量闭环扩展：
//   - Phase 0：右侧 Drawer audit Timeline（谁 / 何时 / 做了什么）
//   - Phase 1：Rate 0-5 + note editor
//   - Phase 2：verdict 展示 + 重新评分按钮（此阶段 API 尚未接入，按钮预留 disabled）
//   - Phase 4：Negative 面板（kind + reason + 标记/取消）
//
// Monaco 编辑器保留：左 Amis JSON / 右代码。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Drawer,
  Input,
  Popconfirm,
  Rate,
  Result,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Tooltip,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  RocketOutlined,
  SaveOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  approveCodeSample,
  deleteCodeSample,
  getCodeSample,
  getSampleAudit,
  markNegative,
  rejectCodeSample,
  scoreSampleAsync,
  submitRating,
  unmarkNegative,
  updateCodeSample,
  type AuditRow,
  type CodeSampleDetail as CodeSampleDetailModel,
  type NegativeKind,
  type QualityVerdict,
  type SampleStatus,
} from '../../services/codeSamples';
import { useColors, useThemeMode } from '../../theme';

function statusTag(status: SampleStatus, c: ReturnType<typeof useColors>) {
  if (status === 'approved') return <Tag color="green">已通过</Tag>;
  if (status === 'rejected') return <Tag color="red">已拒绝</Tag>;
  return (
    <Tag color="orange" style={{ color: c.text }}>
      待审
    </Tag>
  );
}

function verdictDisplay(verdict: QualityVerdict | null | undefined) {
  if (!verdict) return <span style={{ fontSize: 12, opacity: 0.5 }}>未评</span>;
  if (verdict === 'good') return <Tag color="green">good</Tag>;
  if (verdict === 'needs_review') return <Tag color="orange">needs_review</Tag>;
  return <Tag color="red">bad</Tag>;
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    create: '创建',
    approve: '审核通过',
    reject: '审核拒绝',
    rate: '打分',
    thumbs_up: '👍',
    thumbs_down: '👎',
    mark_negative: '标为反例',
    unmark_negative: '取消反例',
    judge: 'AI 评委',
    update: '编辑',
    config_change: '配置变更',
  };
  return map[action] ?? action;
}

function actionColor(action: string): string {
  if (action === 'approve') return 'green';
  if (action === 'reject' || action === 'mark_negative') return 'red';
  if (action === 'judge') return 'blue';
  if (action === 'rate') return 'gold';
  return 'gray';
}

export default function CodeSampleDetail() {
  const c = useColors();
  const mode = useThemeMode((s) => s.mode);
  const monacoTheme = mode === 'light' ? 'vs' : 'vs-dark';
  const navigate = useNavigate();
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sample, setSample] = useState<CodeSampleDetailModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 编辑态本地副本
  const [draft, setDraft] = useState<{
    amis_json_summary: string;
    code_summary: string;
    full_amis_json: string;
    full_code: string;
  } | null>(null);
  const [revectorize, setRevectorize] = useState(false);

  // Phase 1：rating 草稿
  const [ratingDraft, setRatingDraft] = useState<number | null>(null);
  const [ratingNote, setRatingNote] = useState<string>('');
  const [ratingSaving, setRatingSaving] = useState(false);

  // Phase 4：negative 草稿
  const [negKind, setNegKind] = useState<NegativeKind | undefined>(undefined);
  const [negReason, setNegReason] = useState<string>('');
  const [negSaving, setNegSaving] = useState(false);

  // Phase 0：audit drawer
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditItems, setAuditItems] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const dirty = useMemo(() => {
    if (!sample || !draft) return false;
    return (
      (sample.amis_json_summary ?? '') !== draft.amis_json_summary ||
      (sample.code_summary ?? '') !== draft.code_summary ||
      sample.full_amis_json !== draft.full_amis_json ||
      sample.full_code !== draft.full_code
    );
  }, [sample, draft]);

  const ratingDirty = useMemo(() => {
    if (!sample) return false;
    return (
      ratingDraft !== (sample.rating ?? null) ||
      (ratingNote ?? '') !== (sample.rating_note ?? '')
    );
  }, [sample, ratingDraft, ratingNote]);

  const refresh = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCodeSample(id);
      setSample(data);
      setDraft({
        amis_json_summary: data.amis_json_summary ?? '',
        code_summary: data.code_summary ?? '',
        full_amis_json: data.full_amis_json,
        full_code: data.full_code,
      });
      setRevectorize(false);
      setRatingDraft(data.rating ?? null);
      setRatingNote(data.rating_note ?? '');
      setNegKind(data.negative_kind ?? undefined);
      setNegReason(data.rejection_reason ?? '');
    } catch (e: unknown) {
      const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
      setError(resp?.data?.error ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadAudit = useCallback(async () => {
    if (!sample) return;
    setAuditLoading(true);
    try {
      const resp = await getSampleAudit(sample.id);
      setAuditItems(resp.items);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`加载审计日志失败：${msg}`);
    } finally {
      setAuditLoading(false);
    }
  }, [sample]);

  const openAudit = useCallback(() => {
    setAuditOpen(true);
    void loadAudit();
  }, [loadAudit]);

  const onSave = useCallback(async () => {
    if (!sample || !draft) return;
    setSaving(true);
    try {
      const resp = await updateCodeSample(sample.id, {
        amis_json_summary: draft.amis_json_summary,
        code_summary: draft.code_summary,
        full_amis_json: draft.full_amis_json,
        full_code: draft.full_code,
        revectorize,
      });
      message.success(revectorize ? '已保存并触发重向量化' : '已保存');
      setSample(resp.sample);
      setDraft({
        amis_json_summary: resp.sample.amis_json_summary ?? '',
        code_summary: resp.sample.code_summary ?? '',
        full_amis_json: resp.sample.full_amis_json,
        full_code: resp.sample.full_code,
      });
      setRevectorize(false);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`保存失败：${msg}`);
    } finally {
      setSaving(false);
    }
  }, [draft, revectorize, sample]);

  const onSaveRating = useCallback(async () => {
    if (!sample) return;
    setRatingSaving(true);
    try {
      const resp = await submitRating(sample.id, {
        rating: ratingDraft,
        note: ratingNote.trim() || undefined,
      });
      message.success('评分已保存');
      setSample(resp.sample);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`保存评分失败：${msg}`);
    } finally {
      setRatingSaving(false);
    }
  }, [sample, ratingDraft, ratingNote]);

  const onApprove = useCallback(async () => {
    if (!sample) return;
    try {
      await approveCodeSample(sample.id);
      message.success('已通过');
      void refresh();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`通过失败：${msg}`);
    }
  }, [refresh, sample]);

  const onReject = useCallback(async () => {
    if (!sample) return;
    try {
      await rejectCodeSample(sample.id);
      message.success('已拒绝');
      void refresh();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`拒绝失败：${msg}`);
    }
  }, [refresh, sample]);

  const onDelete = useCallback(async () => {
    if (!sample) return;
    try {
      await deleteCodeSample(sample.id);
      message.success('已删除');
      navigate('/knowledge-base/code-samples');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`删除失败：${msg}`);
    }
  }, [navigate, sample]);

  const onMarkNegative = useCallback(async () => {
    if (!sample) return;
    if (!negKind) {
      message.warning('请选择反例类型');
      return;
    }
    setNegSaving(true);
    try {
      const resp = await markNegative(sample.id, {
        negative_kind: negKind,
        rejection_reason: negReason.trim() || undefined,
        also_reject: true,
      });
      message.success('已标记为反例（状态 → rejected）');
      setSample(resp.sample);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`标记失败：${msg}`);
    } finally {
      setNegSaving(false);
    }
  }, [negKind, negReason, sample]);

  const onUnmarkNegative = useCallback(async () => {
    if (!sample) return;
    setNegSaving(true);
    try {
      const resp = await unmarkNegative(sample.id);
      message.success('已取消反例标记');
      setSample(resp.sample);
      setNegKind(undefined);
      setNegReason('');
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`取消失败：${msg}`);
    } finally {
      setNegSaving(false);
    }
  }, [sample]);

  const isFirstRender = useRef(true);
  const skipFirstChange = useRef<{ amis: boolean; code: boolean }>({ amis: true, code: true });
  useEffect(() => {
    skipFirstChange.current = { amis: true, code: true };
    isFirstRender.current = false;
  }, [sample?.id]);

  if (Number.isNaN(id)) {
    return <Result status="404" title="无效的样例 ID" />;
  }
  if (error) {
    return (
      <Result
        status="404"
        title="样例不存在"
        subTitle={error}
        extra={
          <Button type="primary" onClick={() => navigate('/knowledge-base/code-samples')}>
            返回列表
          </Button>
        }
      />
    );
  }
  if (loading || !sample || !draft) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 48px)' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div
      style={{
        height: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px 16px',
        background: c.bg,
        boxSizing: 'border-box',
      }}
    >
      {/* 顶栏：返回 + 元信息 + 操作 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/knowledge-base/code-samples')}
        >
          返回列表
        </Button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: c.text }}>样例 #{sample.id}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: c.textSubtle }}>
            {sample.tech_stack} · {sample.source_team}
          </span>
          {statusTag(sample.status, c)}
          {sample.is_negative && (
            <Tag icon={<WarningOutlined />} color="red">
              反例{sample.negative_kind ? `·${sample.negative_kind}` : ''}
            </Tag>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c.textSubtle }}>
            命中 {sample.hit_count} · 👍{sample.thumbs_up ?? 0} / 👎{sample.thumbs_down ?? 0}
          </span>
        </div>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={openAudit}>
            审计日志
          </Button>
          {sample.status !== 'approved' && (
            <Button icon={<CheckOutlined />} onClick={() => void onApprove()}>
              通过
            </Button>
          )}
          {sample.status !== 'rejected' && (
            <Button icon={<CloseOutlined />} danger onClick={() => void onReject()}>
              拒绝
            </Button>
          )}
          <Popconfirm title="确认删除？" okType="danger" onConfirm={() => void onDelete()}>
            <Button danger>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 评分 + LLM 评委 + 负例面板（Phase 1 / 2 / 4） */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* 人工评分 */}
        <div
          style={{
            padding: 12,
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            background: c.surface,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: c.textMuted, letterSpacing: 0.3 }}>
              人工评分（0-5，可选）
            </span>
            <Tooltip title="rating 优先级高于 AI 评委；RAG 检索按 min_rating 硬过滤">
              <span style={{ fontSize: 11, color: c.textSubtle }}>?</span>
            </Tooltip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Rate
              allowHalf
              allowClear
              value={ratingDraft ?? 0}
              onChange={(v) => setRatingDraft(v || null)}
              style={{ fontSize: 18 }}
            />
            <span style={{ fontSize: 12, color: c.textSubtle, fontFamily: 'var(--font-mono)' }}>
              {ratingDraft != null ? ratingDraft.toFixed(1) : '未评'}
            </span>
            {ratingDraft != null && (
              <Button size="small" type="text" onClick={() => setRatingDraft(null)}>
                清除
              </Button>
            )}
          </div>
          <Input.TextArea
            rows={2}
            value={ratingNote}
            onChange={(e) => setRatingNote(e.target.value)}
            placeholder="审核意见（可选）"
            style={{ marginTop: 8 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              disabled={!ratingDirty || ratingSaving}
              onClick={() => void onSaveRating()}
            >
              保存评分
            </Button>
            {sample.rating_at && (
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textSubtle }}>
                上次更新 {new Date(sample.rating_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* AI 评委结果（Phase 2 未启时显示灰态） */}
        <div
          style={{
            padding: 12,
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            background: c.surface,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <ExperimentOutlined style={{ color: c.textMuted }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: c.textMuted, letterSpacing: 0.3 }}>
              AI 评委（二元）
            </span>
            {verdictDisplay(sample.quality_verdict)}
          </div>
          {sample.quality_reason ? (
            <div
              style={{
                fontSize: 12,
                color: c.textMuted,
                lineHeight: 1.5,
                maxHeight: 72,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {sample.quality_reason}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: c.textSubtle, fontStyle: 'italic' }}>
              尚未评估。Phase 2 启用 LLM-judge 后可手动触发或在采纳时自动触发。
            </div>
          )}
          {sample.quality_judge_at && (
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textSubtle, marginTop: 8 }}>
              评于 {new Date(sample.quality_judge_at).toLocaleString()}
              {sample.quality_judge_model ? ` · ${sample.quality_judge_model}` : ''}
            </div>
          )}
          <Tooltip title="调 LLM 评委二元打分（受 rag.judge.mode / budget_per_day 控制）">
            <Button
              size="small"
              icon={<RocketOutlined />}
              style={{ marginTop: 8 }}
              onClick={async () => {
                if (!sample) return;
                try {
                  const resp = await scoreSampleAsync(sample.id);
                  message.success(resp.notice ?? '已排队 AI 评分');
                  // 3s 后刷新看新 verdict
                  window.setTimeout(() => { void refresh(); }, 3000);
                } catch (e: unknown) {
                  const msg =
                    (e as { response?: { data?: { error?: string } } }).response?.data?.error ??
                    String(e);
                  message.error(`触发失败：${msg}`);
                }
              }}
            >
              {sample.quality_verdict ? '重新评分' : '触发 AI 评分'}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 负例面板（Collapse 折叠；Phase 4） */}
      <Collapse
        size="small"
        style={{ marginBottom: 12 }}
        items={[
          {
            key: 'negative',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: sample.is_negative ? c.destructive : c.textMuted }} />
                负例（反面教材）标记
                {sample.is_negative && <Tag color="red">已标记</Tag>}
                <span style={{ fontSize: 11, color: c.textSubtle }}>
                  Phase 4 · 默认仅结构性反例生效
                </span>
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Alert
                  type="warning"
                  showIcon
                  style={{ fontSize: 12 }}
                  message="评审建议：只用『结构性』反例（仅给摘要 + 原因，不给代码段），避 LLM 看到完整反例学会反例。"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: c.textMuted, width: 88 }}>反例类型</span>
                  <Select
                    size="small"
                    value={negKind}
                    onChange={(v) => setNegKind(v)}
                    style={{ width: 220 }}
                    allowClear
                    options={[
                      {
                        label: 'structural（结构性，推荐）',
                        value: 'structural',
                      },
                      { label: 'stylistic（风格问题）', value: 'stylistic' },
                      { label: 'full（完整代码级反例，慎用）', value: 'full' },
                    ]}
                  />
                </div>
                <Input.TextArea
                  rows={2}
                  placeholder="为什么这是反面教材？（会进 system_prompt 告诉 LLM 如何避免）"
                  value={negReason}
                  onChange={(e) => setNegReason(e.target.value)}
                />
                <Space>
                  <Button
                    danger
                    size="small"
                    icon={<WarningOutlined />}
                    loading={negSaving}
                    onClick={() => void onMarkNegative()}
                  >
                    {sample.is_negative ? '更新反例' : '标为反例（自动拒绝）'}
                  </Button>
                  {sample.is_negative && (
                    <Button size="small" onClick={() => void onUnmarkNegative()} loading={negSaving}>
                      取消反例标记
                    </Button>
                  )}
                </Space>
              </div>
            ),
          },
        ]}
      />

      {/* 摘要编辑 + revectorize */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textMuted, marginBottom: 4 }}>
            amis_json_summary（用户需求摘要，参与向量化）
          </div>
          <Input.TextArea
            rows={2}
            value={draft.amis_json_summary}
            onChange={(e) => setDraft({ ...draft, amis_json_summary: e.target.value })}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textMuted, marginBottom: 4 }}>
            code_summary（代码做了什么）
          </div>
          <Input.TextArea
            rows={2}
            value={draft.code_summary}
            onChange={(e) => setDraft({ ...draft, code_summary: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <Checkbox checked={revectorize} onChange={(e) => setRevectorize(e.target.checked)}>
          保存时重新向量化（摘要变了再勾）
        </Checkbox>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          disabled={!dirty || saving}
          onClick={() => void onSave()}
        >
          保存
        </Button>
        {!dirty && (
          <span style={{ fontSize: 12, color: c.textSubtle }}>
            （未做修改）
          </span>
        )}
      </div>

      {sample.status === 'pending' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="待审：此样例不会参与下次任务的检索召回，请审核后点'通过'"
        />
      )}

      {/* 主区：左 Amis / 右 Code */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        <EditorPane
          c={c}
          monacoTheme={monacoTheme}
          title="full_amis_json"
          language="json"
          value={draft.full_amis_json}
          onChange={(v) => setDraft({ ...draft, full_amis_json: v })}
        />
        <EditorPane
          c={c}
          monacoTheme={monacoTheme}
          title="full_code"
          language="markdown"
          value={draft.full_code}
          onChange={(v) => setDraft({ ...draft, full_code: v })}
        />
      </div>

      {/* 审计 Drawer */}
      <Drawer
        title={`样例 #${sample.id} · 审计 Timeline`}
        placement="right"
        width={560}
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
      >
        {auditLoading ? (
          <Spin />
        ) : auditItems.length === 0 ? (
          <Alert type="info" message="暂无审计记录" showIcon />
        ) : (
          <Timeline
            items={auditItems.map((a) => ({
              color: actionColor(a.action),
              children: (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {actionLabel(a.action)}
                    <span style={{ fontSize: 11, color: c.textSubtle, marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
                      [{a.operator_kind}]
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textSubtle, marginTop: 2 }}>
                    {new Date(a.created_at).toLocaleString()}
                    {a.operator_id != null && ` · user#${a.operator_id}`}
                  </div>
                  {a.note && (
                    <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                      {a.note}
                    </div>
                  )}
                  {(a.before_json != null || a.after_json != null) && (
                    <pre
                      style={{
                        fontSize: 10,
                        background: c.surfaceElevated,
                        padding: 8,
                        borderRadius: 4,
                        marginTop: 6,
                        overflow: 'auto',
                        maxHeight: 140,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {a.before_json != null && `before: ${JSON.stringify(a.before_json, null, 2)}\n`}
                      {a.after_json != null && `after:  ${JSON.stringify(a.after_json, null, 2)}`}
                    </pre>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Drawer>
    </div>
  );
}

function EditorPane({
  c,
  monacoTheme,
  title,
  language,
  value,
  onChange,
}: {
  c: ReturnType<typeof useColors>;
  monacoTheme: string;
  title: string;
  language: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        background: c.surface,
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '6px 10px',
          borderBottom: `1px solid ${c.border}`,
          background: c.surfaceElevated,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: c.textMuted,
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          theme={monacoTheme}
          language={language}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          options={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
