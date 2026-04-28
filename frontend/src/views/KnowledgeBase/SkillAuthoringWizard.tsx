// Skill 桶 AI 起草向导（Synthetic Honey）
//
// 路径：/knowledge-base/skills/new-ai
// 设计：4 步 AntD Steps 受控
//   Step 0  填意图：dir_name / display_name / description / target_stack / ref_buckets / extra_context
//   Step 1  流式生成：左侧文件 Tabs + 右侧 Monaco 只读预览，实时刷 token
//   Step 2  审核：Collapse 列出每个文件，采纳/编辑/拒绝
//   Step 3  入库：new_bucket / merge_existing + conflict_policy → adopt → 跳桶详情
//
// RBAC：后端已保底；前端只要 token 合法 + admin 才能进这个页面。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Drawer,
  Form,
  Input,
  message,
  Radio,
  Result,
  Select,
  Space,
  Spin,
  Steps,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  RobotOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  adoptAuthoringSession,
  createAuthoringSession,
  deleteAuthoringSession,
  readAuthoringDraft,
  streamAuthoringGenerate,
  writeAuthoringDraft,
  type AdoptRequest,
  type AuthoringIntent,
  type AuthoringMode,
  type ConflictPolicy,
  type SseEvent,
} from '../../services/skillAuthoring';
import { listSkillBuckets, type SkillBucketSummary } from '../../services/skills';
import { useColors, useThemeMode } from '../../theme';

type FileStatus = 'pending' | 'streaming' | 'done' | 'rejected';

const { TextArea } = Input;

export default function SkillAuthoringWizard() {
  const navigate = useNavigate();
  const c = useColors();
  const themeMode = useThemeMode((s) => s.mode);
  const monacoTheme = themeMode === 'dark' ? 'vs-dark' : 'vs';

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Step 0：意图
  const [bucketList, setBucketList] = useState<SkillBucketSummary[]>([]);
  const [form, setForm] = useState<AuthoringIntent>({
    mode: 'draft_bucket',
    dir_name: '',
    display_name: '',
    description: '',
    target_stack: '',
    reference_bucket_ids: ['_common'],
    extra_context: '',
  });

  // Step 1/2：SSE + 草稿
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plannedFiles, setPlannedFiles] = useState<string[]>([]);
  const [fileStatus, setFileStatus] = useState<Record<string, FileStatus>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = useState<string | null>(null);
  const [llmModel, setLlmModel] = useState<string | null>(null);
  const [rejectedPaths, setRejectedPaths] = useState<{ path: string; reason: string }[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  // Step 2：审核
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 编辑 Drawer
  const [editorOpen, setEditorOpen] = useState(false);
  const [editPath, setEditPath] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMtime, setEditMtime] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Step 3：入库
  const [adoptMode, setAdoptMode] = useState<'new_bucket' | 'merge_existing'>('new_bucket');
  const [targetBucket, setTargetBucket] = useState('');
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('overwrite');
  const [submittingAdopt, setSubmittingAdopt] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // 加载桶列表（供 ref bucket 下拉 + merge_existing 下拉）
  useEffect(() => {
    listSkillBuckets()
      .then((r) => setBucketList(r.buckets))
      .catch((e: unknown) => {
        const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
        if (resp?.status !== 403) message.error(`加载桶列表失败：${resp?.data?.error ?? String(e)}`);
      });
  }, []);

  // 进入 Step 3 时，target_bucket 默认填 intent.dir_name
  useEffect(() => {
    if (step === 3 && !targetBucket) {
      setTargetBucket(form.dir_name);
    }
  }, [step, targetBucket, form.dir_name]);

  // 离开页面或重开时 abort 上一个 SSE
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ─── Step 0 → Step 1：创建 session + 发起流
  const handleStart = useCallback(async () => {
    const dn = form.dir_name.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(dn))
      return message.warning('dir_name 只允许字母数字 _ - ，必须字母或下划线开头');
    if (!form.display_name.trim()) return message.warning('display_name 必填');
    if (!form.description.trim()) return message.warning('description 必填');
    if (!form.target_stack.trim()) return message.warning('target_stack 必填');
    if (form.mode === 'clone_bucket' && form.reference_bucket_ids.length !== 1)
      return message.warning('克隆模式必须恰好选择 1 个参考桶作为模板');

    try {
      const resp = await createAuthoringSession(form);
      setSessionId(resp.session_id);
      setStep(1);
      setDrafts({});
      setFileStatus({});
      setPlannedFiles([]);
      setRejectedPaths([]);
      setStreamError(null);
      setLlmModel(null);
      setCurrentTab(null);
      setSelected(new Set());
      setStreaming(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        await streamAuthoringGenerate(
          resp.session_id,
          (ev) => handleSseEvent(ev),
          { signal: ctrl.signal }
        );
        // 流自然结束（无 error）→ 默认进审核
        setStreaming(false);
        // 若有文件全部拒绝，停在错误状态不前进；否则推到 Step 2
      } catch (e) {
        setStreaming(false);
        const msg = (e as Error).message || String(e);
        if (!ctrl.signal.aborted) {
          setStreamError(msg);
          message.error(`生成失败：${msg}`);
        }
      }
    } catch (e: unknown) {
      const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
      message.error(`创建会话失败：${resp?.data?.error ?? String(e)}`);
    }
  }, [form]);

  // SSE 事件分发
  const handleSseEvent = useCallback((ev: SseEvent) => {
    const d = ev.data as Record<string, unknown>;
    switch (ev.event) {
      case 'meta': {
        const m = typeof d.model === 'string' ? d.model : null;
        setLlmModel(m);
        const planned = Array.isArray(d.planned_files) ? (d.planned_files as string[]) : [];
        if (planned.length > 0) {
          setPlannedFiles(planned);
          setFileStatus(Object.fromEntries(planned.map((p) => [p, 'pending' as FileStatus])));
        }
        break;
      }
      case 'file-start': {
        const path = String(d.path ?? '');
        if (!path) break;
        setCurrentTab(path);
        setDrafts((prev) => ({ ...prev, [path]: '' }));
        setFileStatus((prev) => ({ ...prev, [path]: 'streaming' }));
        setPlannedFiles((prev) => (prev.includes(path) ? prev : [...prev, path]));
        break;
      }
      case 'data': {
        const path = String(d.path ?? '');
        const delta = String(d.delta ?? '');
        if (!path || !delta) break;
        setDrafts((prev) => ({ ...prev, [path]: (prev[path] ?? '') + delta }));
        break;
      }
      case 'file-end': {
        const path = String(d.path ?? '');
        if (!path) break;
        setFileStatus((prev) => ({ ...prev, [path]: 'done' }));
        break;
      }
      case 'file-rejected': {
        const path = String(d.path ?? '');
        const reason = String(d.reason ?? '未知原因');
        setRejectedPaths((prev) => [...prev, { path, reason }]);
        break;
      }
      case 'done': {
        // 选中所有 done 状态的文件作为默认采纳集
        setFileStatus((prev) => {
          const next = { ...prev };
          setSelected((_prev) => {
            const s = new Set<string>();
            for (const [path, st] of Object.entries(next)) {
              if (st === 'done') s.add(path);
            }
            return s;
          });
          return next;
        });
        // 自动推到 Step 2
        setTimeout(() => setStep(2), 250);
        break;
      }
      case 'backend-summary': {
        // backend 兜底，通常不展示
        const err = typeof d.error === 'string' ? d.error : null;
        if (err) setStreamError(err);
        break;
      }
      case 'error': {
        const err = String(d.error ?? '未知错误');
        setStreamError(err);
        break;
      }
      default:
        break;
    }
  }, []);

  // ─── Step 2：审核操作
  const toggleSelect = (path: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(path);
      else next.delete(path);
      return next;
    });
  };

  const openEditor = useCallback(
    async (path: string) => {
      if (!sessionId) return;
      setEditPath(path);
      setEditorOpen(true);
      // 从后端重读最新正文 + mtime（优先取 DB 视角，避免纯前端 state 漂移）
      try {
        const r = await readAuthoringDraft(sessionId, path);
        setEditContent(r.content);
        setEditMtime(r.mtime_unix);
      } catch {
        setEditContent(drafts[path] ?? '');
        setEditMtime(null);
      }
    },
    [sessionId, drafts]
  );

  const saveEdit = useCallback(async () => {
    if (!sessionId || !editPath) return;
    setSavingEdit(true);
    try {
      const r = await writeAuthoringDraft(sessionId, {
        path: editPath,
        content: editContent,
        base_mtime_unix: editMtime,
      });
      setDrafts((prev) => ({ ...prev, [editPath]: editContent }));
      setEditMtime(r.mtime_unix ?? null);
      message.success('已保存草稿');
      setEditorOpen(false);
    } catch (e: unknown) {
      const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
      if (resp?.status === 409) {
        message.error('草稿已被其他会话修改（乐观锁冲突），请关闭重新打开');
      } else {
        message.error(`保存失败：${resp?.data?.error ?? String(e)}`);
      }
    } finally {
      setSavingEdit(false);
    }
  }, [sessionId, editPath, editContent, editMtime]);

  // ─── Step 3：入库
  const handleAdopt = useCallback(async () => {
    if (!sessionId) return;
    const tb = targetBucket.trim();
    if (!tb) return message.warning('target_bucket 不能为空');
    if (selected.size === 0) return message.warning('请至少勾选一个要采纳的草稿文件');

    const req: AdoptRequest = {
      mode: adoptMode,
      target_bucket: tb,
      selected_paths: Array.from(selected),
      conflict_policy: conflictPolicy,
    };
    setSubmittingAdopt(true);
    try {
      const r = await adoptAuthoringSession(sessionId, req);
      message.success(
        `已采纳到桶 ${r.bucket}（写入 ${r.written.length} / 跳过 ${r.skipped.length} / 重命名 ${r.renamed.length}）`
      );
      navigate(`/knowledge-base/skills/${encodeURIComponent(r.bucket)}`);
    } catch (e: unknown) {
      const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
      message.error(`入库失败：${resp?.data?.error ?? String(e)}`);
    } finally {
      setSubmittingAdopt(false);
    }
  }, [sessionId, targetBucket, selected, adoptMode, conflictPolicy, navigate]);

  // 离开向导（清理 session）
  const abandon = useCallback(async () => {
    abortRef.current?.abort();
    if (sessionId) {
      try {
        await deleteAuthoringSession(sessionId);
      } catch {
        /* ignore */
      }
    }
    navigate('/knowledge-base/skills');
  }, [sessionId, navigate]);

  const bucketOptions = useMemo(
    () =>
      bucketList.map((b) => ({
        label: `${b.dir_name}  ·  ${b.display_name}`,
        value: b.dir_name,
      })),
    [bucketList]
  );

  const filesToReview = useMemo(
    () => plannedFiles.filter((p) => fileStatus[p] === 'done' || (drafts[p] ?? '').length > 0),
    [plannedFiles, fileStatus, drafts]
  );

  const currentDraft = currentTab ? drafts[currentTab] ?? '' : '';

  // ──────────────────── 渲染

  return (
    <div style={{ minHeight: 'calc(100vh - 48px)', padding: '28px 32px 48px', background: c.bg }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={abandon}>
          返回
        </Button>
        <RobotOutlined style={{ color: c.accent, fontSize: 20 }} />
        <h2 style={{ margin: 0, color: c.text, fontSize: 20, fontWeight: 600 }}>AI 起草新桶</h2>
        {llmModel && (
          <Tag color="purple" style={{ fontFamily: 'var(--font-mono)' }}>
            {llmModel}
          </Tag>
        )}
      </div>

      <Steps
        current={step}
        style={{ marginBottom: 24 }}
        items={[
          { title: '意图' },
          { title: '流式生成' },
          { title: '审核' },
          { title: '入库' },
        ]}
      />

      {step === 0 && (
        <StepIntent
          form={form}
          setForm={setForm}
          bucketOptions={bucketOptions}
          onNext={handleStart}
        />
      )}

      {step === 1 && (
        <StepStream
          plannedFiles={plannedFiles}
          fileStatus={fileStatus}
          drafts={drafts}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          currentDraft={currentDraft}
          streaming={streaming}
          streamError={streamError}
          rejectedPaths={rejectedPaths}
          monacoTheme={monacoTheme}
          onManualNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepReview
          files={filesToReview}
          drafts={drafts}
          selected={selected}
          onToggle={toggleSelect}
          onSelectAll={(on) =>
            setSelected(on ? new Set(filesToReview) : new Set())
          }
          onEdit={openEditor}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          c={c}
        />
      )}

      {step === 3 && (
        <StepAdopt
          adoptMode={adoptMode}
          setAdoptMode={setAdoptMode}
          targetBucket={targetBucket}
          setTargetBucket={setTargetBucket}
          conflictPolicy={conflictPolicy}
          setConflictPolicy={setConflictPolicy}
          bucketOptions={bucketOptions}
          selectedCount={selected.size}
          submitting={submittingAdopt}
          onBack={() => setStep(2)}
          onAdopt={handleAdopt}
        />
      )}

      {/* 编辑 Drawer（Step 2 用） */}
      <Drawer
        title={`编辑草稿 ${editPath ?? ''}`}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={720}
        extra={
          <Space>
            <Button icon={<SaveOutlined />} type="primary" loading={savingEdit} onClick={saveEdit}>
              保存
            </Button>
            <Button onClick={() => setEditorOpen(false)}>取消</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Editor
          height="calc(100vh - 108px)"
          language="markdown"
          theme={monacoTheme}
          value={editContent}
          onChange={(v) => setEditContent(v ?? '')}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
          }}
        />
      </Drawer>
    </div>
  );
}

// ═══════════════════════════════════════ Step 0：意图 ═══════════════════════════════════════

function StepIntent({
  form,
  setForm,
  bucketOptions,
  onNext,
}: {
  form: AuthoringIntent;
  setForm: (next: AuthoringIntent) => void;
  bucketOptions: { label: string; value: string }[];
  onNext: () => void;
}) {
  const patch = (p: Partial<AuthoringIntent>) => setForm({ ...form, ...p });
  return (
    <Card title="告诉 AI 你想做什么" bordered={false}>
      <Form layout="vertical" onFinish={onNext}>
        <Form.Item label="模式">
          <Radio.Group
            value={form.mode}
            onChange={(e) => patch({ mode: e.target.value as AuthoringMode })}
          >
            <Radio.Button value="draft_bucket">从零起草</Radio.Button>
            <Radio.Button value="clone_bucket">仿写已有桶</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="dir_name（目录名，将作为桶名）" required>
          <Input
            value={form.dir_name}
            placeholder="如 react-antd-web"
            onChange={(e) => patch({ dir_name: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="display_name（写入 SKILL.md frontmatter 的 name）" required>
          <Input
            value={form.display_name}
            placeholder="如 React + AntD Web"
            onChange={(e) => patch({ display_name: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="description（frontmatter 的 description）" required>
          <TextArea
            rows={2}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Form.Item>
        <Form.Item
          label="target_stack（技术栈 / 维度身份）"
          required
          help={
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div>推荐命名（2026-04 维度解耦）：</div>
              <div>
                • 平台桶 <code>platform-web</code> / <code>platform-mobile</code>
              </div>
              <div>
                • 技术栈桶 <code>stack-react</code> / <code>stack-vue3</code> /{' '}
                <code>stack-uniapp</code>
              </div>
              <div>
                • UI 库桶 <code>ui-antd</code> / <code>ui-element-plus</code> /{' '}
                <code>ui-wot</code>
              </div>
              <div>
                • 老聚合桶（legacy，不建议新增）：<code>uniapp-wot-h5</code>
              </div>
              <div style={{ marginTop: 4, color: '#888' }}>
                生成时请让 LLM 在 SKILL.md frontmatter 中填入 <code>kind</code>、<code>platforms</code>、
                <code>tech_stacks</code>、<code>ui_libs</code> 等数组字段。
              </div>
            </div>
          }
        >
          <Input
            value={form.target_stack}
            placeholder="如 stack-react / ui-antd / platform-web"
            onChange={(e) => patch({ target_stack: e.target.value })}
          />
        </Form.Item>
        <Form.Item
          label={
            form.mode === 'clone_bucket'
              ? 'reference_buckets（仿写模板，必须恰好 1 个）'
              : 'reference_buckets（参考桶，最多 3 个；_common 默认恒量）'
          }
        >
          <Select
            mode={form.mode === 'clone_bucket' ? undefined : 'multiple'}
            value={form.mode === 'clone_bucket' ? form.reference_bucket_ids[0] : form.reference_bucket_ids}
            options={bucketOptions}
            onChange={(v) => {
              const arr = Array.isArray(v) ? v : v ? [v] : [];
              patch({ reference_bucket_ids: arr as string[] });
            }}
            placeholder="选几个参考桶（至少选一个）"
          />
        </Form.Item>
        <Form.Item label="extra_context（追加的意图说明，≤ 8000 字）">
          <TextArea
            rows={6}
            value={form.extra_context ?? ''}
            onChange={(e) => patch({ extra_context: e.target.value })}
            placeholder="例如：组件库用 AntD 5.x；后端默认 RESTful + JWT；优先 TS；要覆盖 input/button/table/modal..."
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<RobotOutlined />} size="large">
            开始生成
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

// ═══════════════════════════════════════ Step 1：流式生成 ═══════════════════════════════════════

function StepStream({
  plannedFiles,
  fileStatus,
  drafts,
  currentTab,
  setCurrentTab,
  currentDraft,
  streaming,
  streamError,
  rejectedPaths,
  monacoTheme,
  onManualNext,
}: {
  plannedFiles: string[];
  fileStatus: Record<string, FileStatus>;
  drafts: Record<string, string>;
  currentTab: string | null;
  setCurrentTab: (p: string) => void;
  currentDraft: string;
  streaming: boolean;
  streamError: string | null;
  rejectedPaths: { path: string; reason: string }[];
  monacoTheme: string;
  onManualNext: () => void;
}) {
  const items = plannedFiles.map((p) => ({
    key: p,
    label: (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <StatusBadge status={fileStatus[p]} /> {p}
      </span>
    ),
    children: null,
  }));

  return (
    <div>
      {streamError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message="生成过程出错"
          description={streamError}
        />
      )}
      {rejectedPaths.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="以下路径被安全拦截"
          description={rejectedPaths.map((r) => `${r.path} — ${r.reason}`).join('；')}
        />
      )}
      <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 280px)' }}>
        <div style={{ width: 280, overflowY: 'auto' }}>
          <Tabs
            tabPosition="left"
            activeKey={currentTab ?? undefined}
            items={items}
            onChange={(k) => setCurrentTab(k)}
            style={{ height: '100%' }}
          />
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid var(--color-border)' }}>
          {currentTab ? (
            <Editor
              height="100%"
              language="markdown"
              theme={monacoTheme}
              value={currentDraft}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <Spin tip={streaming ? '正在启动生成…' : '等待模型开始吐出内容…'} />
              <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
                第一个 token 到达前，这里会暂时空白
              </div>
            </div>
          )}
        </div>
      </div>
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" disabled={streaming || Object.keys(drafts).length === 0} onClick={onManualNext}>
          {streaming ? '生成中…' : '进入审核'}
        </Button>
      </Space>
    </div>
  );
}

function StatusBadge({ status }: { status?: FileStatus }) {
  if (status === 'done') return <Badge status="success" />;
  if (status === 'streaming') return <Badge status="processing" />;
  if (status === 'rejected') return <Badge status="error" />;
  return <Badge status="default" />;
}

// ═══════════════════════════════════════ Step 2：审核 ═══════════════════════════════════════

function StepReview({
  files,
  drafts,
  selected,
  onToggle,
  onSelectAll,
  onEdit,
  onBack,
  onNext,
  c,
}: {
  files: string[];
  drafts: Record<string, string>;
  selected: Set<string>;
  onToggle: (path: string, on: boolean) => void;
  onSelectAll: (on: boolean) => void;
  onEdit: (path: string) => void;
  onBack: () => void;
  onNext: () => void;
  c: { textMuted: string };
}) {
  if (files.length === 0) {
    return <Result status="warning" title="没有可审核的文件" subTitle="LLM 没有按协议吐出任何完整的 <<<AMISAI_FILE>>> 片段；建议换一个支持长指令遵循的模型重试。" />;
  }
  return (
    <Card
      title={`审核 ${files.length} 份草稿（已勾选 ${selected.size}）`}
      bordered={false}
      extra={
        <Space>
          <Button size="small" onClick={() => onSelectAll(true)}>
            全部采纳
          </Button>
          <Button size="small" onClick={() => onSelectAll(false)}>
            全部拒绝
          </Button>
        </Space>
      }
    >
      <Collapse
        accordion
        items={files.map((path) => ({
          key: path,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{path}</span>
              <span style={{ fontSize: 12, color: c.textMuted }}>
                {(drafts[path] ?? '').split('\n').length} 行 · {(drafts[path] ?? '').length} 字符
              </span>
            </div>
          ),
          children: (
            <div>
              <Space style={{ marginBottom: 8 }}>
                <Button
                  size="small"
                  type={selected.has(path) ? 'primary' : 'default'}
                  icon={<CheckOutlined />}
                  onClick={() => onToggle(path, !selected.has(path))}
                >
                  {selected.has(path) ? '已采纳' : '采纳'}
                </Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(path)}>
                  编辑
                </Button>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => onToggle(path, false)}
                  disabled={!selected.has(path)}
                >
                  拒绝
                </Button>
              </Space>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  background: 'var(--color-surface)',
                  padding: 12,
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 360,
                  overflow: 'auto',
                }}
              >
                {drafts[path] ?? ''}
              </pre>
            </div>
          ),
        }))}
      />
      <Space style={{ marginTop: 16 }}>
        <Button onClick={onBack}>上一步</Button>
        <Tooltip title={selected.size === 0 ? '至少采纳一个文件才能继续' : ''}>
          <Button type="primary" onClick={onNext} disabled={selected.size === 0}>
            下一步：入库
          </Button>
        </Tooltip>
      </Space>
    </Card>
  );
}

// ═══════════════════════════════════════ Step 3：入库 ═══════════════════════════════════════

function StepAdopt({
  adoptMode,
  setAdoptMode,
  targetBucket,
  setTargetBucket,
  conflictPolicy,
  setConflictPolicy,
  bucketOptions,
  selectedCount,
  submitting,
  onBack,
  onAdopt,
}: {
  adoptMode: 'new_bucket' | 'merge_existing';
  setAdoptMode: (v: 'new_bucket' | 'merge_existing') => void;
  targetBucket: string;
  setTargetBucket: (v: string) => void;
  conflictPolicy: ConflictPolicy;
  setConflictPolicy: (v: ConflictPolicy) => void;
  bucketOptions: { label: string; value: string }[];
  selectedCount: number;
  submitting: boolean;
  onBack: () => void;
  onAdopt: () => void;
}) {
  return (
    <Card title="入库确认" bordered={false}>
      <Form layout="vertical">
        <Form.Item label="落到哪里">
          <Radio.Group value={adoptMode} onChange={(e) => setAdoptMode(e.target.value)}>
            <Radio value="new_bucket">新建一个桶</Radio>
            <Radio value="merge_existing">合并到已有桶</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="target_bucket">
          {adoptMode === 'new_bucket' ? (
            <Input
              value={targetBucket}
              onChange={(e) => setTargetBucket(e.target.value)}
              placeholder="新桶目录名"
            />
          ) : (
            <Select
              value={targetBucket || undefined}
              onChange={(v) => setTargetBucket(v)}
              options={bucketOptions}
              placeholder="选一个已有桶"
            />
          )}
        </Form.Item>
        <Form.Item label="冲突策略（同名文件处理）">
          <Radio.Group value={conflictPolicy} onChange={(e) => setConflictPolicy(e.target.value)}>
            <Radio value="overwrite">覆盖</Radio>
            <Radio value="skip">跳过</Radio>
            <Radio value="rename">重命名（追加 .1/.2）</Radio>
          </Radio.Group>
        </Form.Item>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`将采纳 ${selectedCount} 个文件到桶「${targetBucket || '（未填）'}」`}
        />
        <Space>
          <Button onClick={onBack}>上一步</Button>
          <Button type="primary" loading={submitting} onClick={onAdopt}>
            确认入库
          </Button>
        </Space>
      </Form>
    </Card>
  );
}
