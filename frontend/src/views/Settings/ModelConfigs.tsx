import { useState, useEffect, useCallback } from 'react';
import { Alert, Table, Button, Modal, Form, Select, InputNumber, Switch, Space, Spin, message, Popconfirm, Tag, Slider, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExperimentOutlined } from '@ant-design/icons';
import { getModelConfigs, createModelConfig, updateModelConfig, deleteModelConfig, getProviders, getProviderModels } from '../../services/llm';
import { getEmbeddingInfo, type EmbeddingInfo } from '../../services/systemSettings';

const TASK_TYPE_MAP: Record<string, { label: string; color: string }> = {
  generation: { label: '生成', color: 'blue' },
  embedding: { label: '向量化', color: 'purple' },
  chat: { label: '对话', color: 'cyan' },
  code_generation: { label: '代码生成', color: 'orange' },
};

interface ConfigItem {
  id: number;
  task_type: string;
  provider_id: number;
  provider_name: string;
  model_name: string;
  temperature: number;
  max_tokens: number | null;
  is_active: boolean;
}

interface ProviderOption {
  id: number;
  name: string;
}

export default function ModelConfigs() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [embedInfo, setEmbedInfo] = useState<EmbeddingInfo | null>(null);
  const [embedProbing, setEmbedProbing] = useState(false);

  const probeEmbedding = useCallback(async () => {
    setEmbedProbing(true);
    try {
      const info = await getEmbeddingInfo();
      setEmbedInfo(info);
    } catch (e: any) {
      message.error(e.response?.data?.error || '探测失败');
    } finally {
      setEmbedProbing(false);
    }
  }, []);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getModelConfigs();
      setConfigs(data);
    } catch {
      message.error('获取模型配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const data = await getProviders();
      setProviders(data.map((p: any) => ({ id: p.id, name: p.name })));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchProviders();
  }, [fetchConfigs, fetchProviders]);

  const handleProviderChange = async (providerId: number) => {
    setModelOptions([]);
    try {
      const models = await getProviderModels(providerId);
      setModelOptions(models);
    } catch {
      message.warning('获取模型列表失败，可手动输入模型名称');
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setModelOptions([]);
    form.resetFields();
    form.setFieldsValue({ temperature: 0.7, is_active: true });
    setModalOpen(true);
  };

  const handleEdit = (record: ConfigItem) => {
    setEditingId(record.id);
    setModelOptions([]);
    form.setFieldsValue({
      task_type: record.task_type,
      provider_id: record.provider_id,
      model_name: record.model_name,
      temperature: record.temperature,
      max_tokens: record.max_tokens,
      is_active: record.is_active,
    });
    handleProviderChange(record.provider_id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateModelConfig(editingId, values);
        message.success('更新成功');
      } else {
        await createModelConfig(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchConfigs();
    } catch (err: any) {
      if (err.response?.data?.error) {
        message.error(err.response.data.error);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteModelConfig(id);
      message.success('已删除');
      fetchConfigs();
    } catch (err: any) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      width: 100,
      render: (v: string) => {
        const info = TASK_TYPE_MAP[v] || { label: v, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '供应商', dataIndex: 'provider_name', width: 120 },
    { title: '模型', dataIndex: 'model_name' },
    { title: '创造力', dataIndex: 'temperature', width: 80 },
    { title: 'Max Tokens', dataIndex: 'max_tokens', width: 110, render: (v: number | null) => v ?? '-' },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '激活' : '停用'}</Tag>,
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: ConfigItem) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="代码生成任务现在按任务级选择模型"
        description="在「项目工作台 → 新建任务」里可以为每个任务单独选 auto / 手动 provider+model。这里的模型配置仅作为 Amis 生成 / 聊天 / 向量化 的默认值，以及 code_generation 兜底（新建任务选「使用系统默认」时生效）。"
      />

      {/* Embedding 维度兼容性条 */}
      <EmbeddingCompatibilityBar
        info={embedInfo}
        probing={embedProbing}
        onProbe={probeEmbedding}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>模型配置管理</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增配置</Button>
      </div>

      <Table
        dataSource={configs}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      <Modal
        title={editingId ? '编辑模型配置' : '新增模型配置'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="task_type" label="任务类型" rules={[{ required: true, message: '请选择任务类型' }]}>
            <Select placeholder="选择任务类型" disabled={editingId != null}>
              <Select.Option value="generation">生成 (generation)</Select.Option>
              <Select.Option value="embedding">向量化 (embedding)</Select.Option>
              <Select.Option value="chat">对话 (chat)</Select.Option>
              {/* 编辑模式下保留 code_generation 展示能力，新建不再暴露该选项 */}
              {editingId != null && (
                <Select.Option value="code_generation">代码生成 (code_generation，兜底用)</Select.Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item name="provider_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
            <Select placeholder="选择供应商" onChange={handleProviderChange}>
              {providers.map((p) => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="model_name" label="模型" rules={[{ required: true, message: '请选择或输入模型' }]}>
            {modelOptions.length > 0 ? (
              <Select
                showSearch
                placeholder="选择模型（也可手动输入）"
                options={modelOptions.map((m) => ({ value: m, label: m }))}
              />
            ) : (
              <Input placeholder="输入模型名称，如 deepseek-chat" />
            )}
          </Form.Item>
          <Form.Item name="temperature" label="创造力 (Temperature)">
            <Slider min={0} max={2} step={0.1} marks={{ 0: '精确', 1: '平衡', 2: '创意' }} />
          </Form.Item>
          <Form.Item name="max_tokens" label="最大 Tokens">
            <InputNumber min={1} max={128000} step={1024} placeholder="可选，留空不限制" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="激活" valuePropName="checked" extra="激活时将自动停用同类型的其他配置">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ───────────────────────── Embedding 维度兼容性条
function EmbeddingCompatibilityBar({
  info,
  probing,
  onProbe,
}: {
  info: EmbeddingInfo | null;
  probing: boolean;
  onProbe: () => void;
}) {
  if (!info && !probing) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          <Space>
            <span>Embedding 兼容性未探测</span>
            <Button size="small" icon={<ExperimentOutlined />} onClick={onProbe} loading={probing}>
              探测当前 embedding 模型与 pgvector 列是否匹配
            </Button>
          </Space>
        }
        description={
          <span style={{ fontSize: 12 }}>
            点击后会调用 Python agent 对当前配置的 embedding 模型做一次真实调用，对比模型实际输出维度
            与 pgvector 列声明维度。<strong>不匹配时 RAG 入库/检索都会失败</strong>。
          </span>
        }
      />
    );
  }
  if (probing) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={<><Spin size="small" /> &nbsp;正在探测 embedding 维度...</>}
      />
    );
  }
  // info 一定不为 null
  const i = info!;
  const type: 'success' | 'warning' | 'error' = i.compatible
    ? 'success'
    : i.probe_ok
    ? 'warning'
    : 'error';
  return (
    <Alert
      type={type}
      showIcon
      style={{ marginBottom: 16 }}
      message={
        <Space wrap>
          <span><strong>Embedding 兼容性</strong></span>
          <Tag color={i.pg_column_dim ? 'blue' : 'default'}>
            pgvector 列：{i.pg_column_dim ?? 'unknown'} 维
          </Tag>
          <Tag color={i.env_dim ? 'cyan' : 'default'}>
            EMBEDDING_DIM env：{i.env_dim ?? 'unset'}
          </Tag>
          <Tag color={i.actual_model_dim ? (i.compatible ? 'green' : 'red') : 'default'}>
            模型实测：{i.actual_model_dim ?? '失败'} 维
          </Tag>
          <Button size="small" icon={<ExperimentOutlined />} onClick={onProbe}>
            重新探测
          </Button>
        </Space>
      }
      description={<span style={{ fontSize: 12 }}>{i.hint}</span>}
    />
  );
}
