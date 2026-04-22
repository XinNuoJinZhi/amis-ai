// B.4 RAG 样例库列表页（/knowledge-base/code-samples）
//
// 设计：
//   - Table 形态（不是卡片）：样例条目多、要按 status / tech_stack 过滤、要批量审核
//   - 顶部：状态切换 Segmented + tech_stack/keyword 过滤 + 手动入库按钮 + 刷新
//   - 行操作：详情 / 通过 / 拒绝 / 删除
//   - 行点击 → /knowledge-base/code-samples/:id（详情页）

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  approveCodeSample,
  createCodeSample,
  deleteCodeSample,
  listCodeSamples,
  rejectCodeSample,
  type CodeSampleListRow,
  type ListParams,
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

  const onApprove = useCallback(
    async (id: number) => {
      try {
        await approveCodeSample(id);
        message.success('已通过，进入飞轮检索');
        void refresh();
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
        message.error(`通过失败：${msg}`);
      }
    },
    [refresh]
  );

  const onReject = useCallback(
    async (id: number) => {
      try {
        await rejectCodeSample(id);
        message.success('已拒绝');
        void refresh();
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
        message.error(`拒绝失败：${msg}`);
      }
    },
    [refresh]
  );

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteCodeSample(id);
        message.success('已删除');
        void refresh();
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
        message.error(`删除失败：${msg}`);
      }
    },
    [refresh]
  );

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
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`入库失败：${msg}`);
    } finally {
      setInsertSubmitting(false);
    }
  }, [insertForm, refresh]);

  const columns: ColumnsType<CodeSampleListRow> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 60,
        render: (v: number) => (
          <span style={{ fontFamily: 'var(--font-mono)', color: c.textMuted, fontSize: 12 }}>
            #{v}
          </span>
        ),
      },
      {
        title: '技术栈 / 来源',
        width: 180,
        render: (_: unknown, r) => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: c.text }}>
              {r.tech_stack}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c.textSubtle }}>
              {r.source_team}
            </span>
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
        width: 80,
        render: (s: SampleStatus) => statusTag(s, c),
      },
      {
        title: '命中',
        dataIndex: 'hit_count',
        width: 60,
        render: (v: number) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
        ),
      },
      {
        title: '操作',
        width: 240,
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
    [c, navigate, onApprove, onDelete, onReject]
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
        </div>
      </div>

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
        <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setInsertOpen(true)}>
          手动入库
        </Button>
      </Space>

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
    </div>
  );
}
