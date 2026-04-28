import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Popconfirm, Tag, App, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined } from '@ant-design/icons';
import { getProviders, createProvider, updateProvider, deleteProvider, testProvider, getProviderModels } from '../../services/llm';

interface ProviderItem {
  id: number;
  name: string;
  base_url: string;
  api_key_hint: string;
  is_active: boolean;
  created_at: string;
  protocol: string;
  capability_tier: string;
  preferred_model: string | null;
}

const TIER_OPTIONS = [
  { value: 'fast', label: 'fast（简单页面、省钱省时）' },
  { value: 'balanced', label: 'balanced（默认，大多数业务）' },
  { value: 'strong', label: 'strong（复杂向导/多表单）' },
  { value: 'frontier', label: 'frontier（最贵最强，兜底高难任务）' },
];

const TIER_TAG_COLORS: Record<string, string> = {
  fast: 'green',
  balanced: 'blue',
  strong: 'orange',
  frontier: 'red',
};

export default function LlmProviders() {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  const loadModelsForProvider = useCallback(async (providerId: number) => {
    try {
      const models = await getProviderModels(providerId);
      setModelOptions(models);
    } catch {
      setModelOptions([]);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProviders();
      setProviders(data);
    } catch {
      message.error('获取供应商列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleCreate = () => {
    setEditingId(null);
    setModelOptions([]);
    form.resetFields();
    form.setFieldsValue({ is_active: true, protocol: 'openai', capability_tier: 'balanced' });
    setModalOpen(true);
  };

  const handleEdit = (record: ProviderItem) => {
    setEditingId(record.id);
    setModelOptions([]);
    form.setFieldsValue({
      name: record.name,
      base_url: record.base_url,
      api_key: '',
      is_active: record.is_active,
      protocol: record.protocol || 'openai',
      capability_tier: record.capability_tier || 'balanced',
      preferred_model: record.preferred_model || undefined,
    });
    loadModelsForProvider(record.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const preferred = values.preferred_model?.trim?.() || values.preferred_model || null;
      if (editingId) {
        const payload: any = {
          name: values.name,
          base_url: values.base_url,
          is_active: values.is_active,
          protocol: values.protocol,
          capability_tier: values.capability_tier,
          preferred_model: preferred || '',
        };
        if (values.api_key) payload.api_key = values.api_key;
        await updateProvider(editingId, payload);
        message.success('更新成功');
      } else {
        await createProvider({ ...values, preferred_model: preferred });
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchProviders();
    } catch (err: any) {
      if (err.response?.data?.error) {
        message.error(err.response.data.error);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProvider(id);
      message.success('已删除');
      fetchProviders();
    } catch (err: any) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const result = await testProvider(id);
      if (result.status === 'ok') {
        notification.success({ message: '测试通过', description: result.message });
      } else {
        notification.error({ message: '测试失败', description: result.message });
      }
    } catch (err: any) {
      notification.error({
        message: '测试失败',
        description: err.response?.data?.message || '连接测试失败，请检查供应商配置',
      });
    } finally {
      setTestingId(null);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: 'API 地址', dataIndex: 'base_url', ellipsis: true },
    { title: 'API Key', dataIndex: 'api_key_hint', width: 120 },
    {
      title: '协议',
      dataIndex: 'protocol',
      width: 110,
      render: (v: string) => (
        <Tag color={v === 'anthropic' ? 'purple' : 'blue'}>
          {v === 'anthropic' ? 'Anthropic' : 'OpenAI 兼容'}
        </Tag>
      ),
    },
    {
      title: '能力档位',
      dataIndex: 'capability_tier',
      width: 110,
      render: (v: string) => <Tag color={TIER_TAG_COLORS[v] || 'default'}>{v || 'balanced'}</Tag>,
    },
    {
      title: '默认模型',
      dataIndex: 'preferred_model',
      ellipsis: true,
      render: (v: string | null) => v || <span style={{ color: '#bbb' }}>未设置</span>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: ProviderItem) => (
        <Space size="small">
          <Button
            size="small"
            icon={<ApiOutlined />}
            loading={testingId === record.id}
            onClick={() => handleTest(record.id)}
          >
            测试
          </Button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>LLM 供应商管理</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增供应商</Button>
      </div>

      <Table
        dataSource={providers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      <Modal
        title={editingId ? '编辑供应商' : '新增供应商'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：OpenAI、DeepSeek" />
          </Form.Item>
          <Form.Item name="base_url" label="API 地址" rules={[{ required: true, message: '请输入 API 地址' }]}>
            <Input placeholder="如：https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item
            name="api_key"
            label="API Key"
            rules={editingId ? [] : [{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder={editingId ? '留空则不修改' : '请输入 API Key'} />
          </Form.Item>
          <Form.Item
            name="protocol"
            label="协议类型"
            tooltip="决定请求发给端点 /v1/chat/completions（OpenAI）还是 /v1/messages（Anthropic）"
            rules={[{ required: true, message: '请选择协议类型' }]}
          >
            <Select
              options={[
                { value: 'openai', label: 'OpenAI 兼容（/v1/chat/completions）' },
                { value: 'anthropic', label: 'Anthropic Messages（/v1/messages）' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="capability_tier"
            label="能力档位"
            tooltip="影响「新建任务 → auto」模式的模型分配：简单任务挑 fast，复杂任务挑 strong/frontier"
            rules={[{ required: true, message: '请选择能力档位' }]}
          >
            <Select options={TIER_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="preferred_model"
            label="默认模型"
            tooltip="auto 模式下选中该供应商时使用的模型名；留空则 auto 会报错提示此供应商未配置默认模型"
          >
            {modelOptions.length > 0 ? (
              <Select
                showSearch
                allowClear
                placeholder="从 /v1/models 列表选或手动输入"
                options={modelOptions.map((m) => ({ value: m, label: m }))}
              />
            ) : (
              <Input allowClear placeholder="如 gpt-4o、deepseek-chat、claude-sonnet-4-5" />
            )}
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
