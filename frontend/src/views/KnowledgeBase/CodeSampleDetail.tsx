// B.4 RAG 样例详情页（/knowledge-base/code-samples/:id）
//
// 设计：
//   - 顶栏：返回 / 标题 / 状态 / 通过/拒绝/删除按钮
//   - 中部：可编辑摘要字段 + revectorize 选项
//   - 主区：左 Amis JSON / 右生成代码（Monaco，可编辑）
//   - 底部：保存按钮
//
// 不做：版本/diff（D5 决策）

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Popconfirm,
  Result,
  Space,
  Spin,
  Tag,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  approveCodeSample,
  deleteCodeSample,
  getCodeSample,
  rejectCodeSample,
  updateCodeSample,
  type CodeSampleDetail as CodeSampleDetailModel,
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

  const dirty = useMemo(() => {
    if (!sample || !draft) return false;
    return (
      (sample.amis_json_summary ?? '') !== draft.amis_json_summary ||
      (sample.code_summary ?? '') !== draft.code_summary ||
      sample.full_amis_json !== draft.full_amis_json ||
      sample.full_code !== draft.full_code
    );
  }, [sample, draft]);

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

  const isFirstRender = useRef(true);
  // 切到编辑器时重置 dirty 检测：跳过 Monaco 首次 onChange（设置初值时）
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: c.text }}>样例 #{sample.id}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: c.textSubtle }}>
            {sample.tech_stack} · {sample.source_team}
          </span>
          {statusTag(sample.status, c)}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c.textSubtle }}>
            命中 {sample.hit_count}
          </span>
        </div>
        <Space>
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
