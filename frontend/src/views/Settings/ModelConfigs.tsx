// 2026-04-25 重写：从「列表 + 增删」改为「按功能分槽位」。
//
// 设计：
//   - 6 张固定卡片，对应 6 个 task_type（业务侧已知的所有用途）
//   - 每张卡片只承载一组 active 配置（DB 上加了 partial unique index 兜底）
//   - 卡片内：选供应商 → 选/输入模型 → 调温度 → max_tokens → 保存
//   - 不再有"新增"按钮；要永久清理走 DB 即可
//
// Embedding 兼容性条保留——它对 RAG 入库 / 检索 是否能工作至关重要。

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Select,
  Slider,
  Space,
  Spin,
  Switch,
  Tag,
  message,
} from 'antd';
import { ExperimentOutlined, SaveOutlined } from '@ant-design/icons';
import {
  createModelConfig,
  getModelConfigs,
  getProviders,
  getProviderModels,
  updateModelConfig,
} from '../../services/llm';
import { getEmbeddingInfo, type EmbeddingInfo } from '../../services/systemSettings';
import { useColors } from '../../theme';

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
  preferred_model?: string | null;
}

interface SlotMeta {
  key: string;
  title: string;
  desc: string;
  badgeColor: string;
}

const TASK_SLOTS: SlotMeta[] = [
  {
    key: 'generation',
    title: '通用生成',
    desc: 'Amis JSON 生成主力模型（自然语言 → JSON）',
    badgeColor: 'blue',
  },
  {
    key: 'code_generation',
    title: '代码生成',
    desc: '反向飞轮：Amis JSON → UniApp/H5 项目代码',
    badgeColor: 'orange',
  },
  {
    key: 'skill_authoring',
    title: 'Skill 起草',
    desc: 'AI 帮你起草「知识库 → Skills」桶',
    badgeColor: 'gold',
  },
  {
    key: 'quality_judge',
    title: 'RAG 质量评委',
    desc: '为 RAG 检索结果打分；建议选与「通用生成」不同 provider 的模型，避同族偏见',
    badgeColor: 'purple',
  },
  {
    key: 'embedding',
    title: '向量化',
    desc: 'pgvector 入库 / 检索的 embedding 模型；维度需与 pgvector 列对齐',
    badgeColor: 'magenta',
  },
  {
    key: 'chat',
    title: '通用对话',
    desc: '左侧菜单「AI 对话」页使用',
    badgeColor: 'cyan',
  },
];

interface SlotDraft {
  provider_id: number | null;
  model_name: string;
  temperature: number;
  max_tokens: number | null;
  is_active: boolean;
}

const DEFAULT_DRAFT: SlotDraft = {
  provider_id: null,
  model_name: '',
  temperature: 0.7,
  max_tokens: null,
  is_active: true,
};

export default function ModelConfigs() {
  const c = useColors();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(false);
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgs, provs] = await Promise.all([getModelConfigs(), getProviders()]);
      setConfigs(cfgs);
      setProviders(
        provs.map((p: any) => ({
          id: p.id,
          name: p.name,
          preferred_model: p.preferred_model,
        }))
      );
    } catch (e: any) {
      message.error(e.response?.data?.error || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 按 task_type 找 active 配置（DB 唯一索引兜底，每个 type 最多 1 条 active）
  const activeMap = useMemo(() => {
    const m = new Map<string, ConfigItem>();
    for (const cfg of configs) {
      if (cfg.is_active) m.set(cfg.task_type, cfg);
    }
    return m;
  }, [configs]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: c.text }}>模型配置</h3>
          <div style={{ marginTop: 4, fontSize: 12, color: c.textMuted, fontFamily: 'var(--font-mono)' }}>
            按功能分槽位 · 每个槽位最多 1 条激活
          </div>
        </div>
      </div>

      <EmbeddingCompatibilityBar info={embedInfo} probing={embedProbing} onProbe={probeEmbedding} />

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <Empty description="还没有配置任何 LLM 供应商，请先去「供应商管理」添加一个" />
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: 16,
          }}
        >
          {TASK_SLOTS.map((slot) => (
            <SlotCard
              key={slot.key}
              slot={slot}
              providers={providers}
              current={activeMap.get(slot.key)}
              onSaved={refresh}
              c={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────── 单个 task_type 槽位卡片
function SlotCard({
  slot,
  providers,
  current,
  onSaved,
  c,
}: {
  slot: SlotMeta;
  providers: ProviderOption[];
  current: ConfigItem | undefined;
  onSaved: () => void;
  c: ReturnType<typeof useColors>;
}) {
  const [draft, setDraft] = useState<SlotDraft>(DEFAULT_DRAFT);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 初始化 draft：当前已有 active → 用 active；否则用默认
  useEffect(() => {
    if (current) {
      setDraft({
        provider_id: current.provider_id,
        model_name: current.model_name,
        temperature: current.temperature,
        max_tokens: current.max_tokens,
        is_active: current.is_active,
      });
    } else {
      setDraft(DEFAULT_DRAFT);
    }
  }, [current?.id, current?.provider_id, current?.model_name, current?.temperature, current?.max_tokens, current?.is_active]);

  // 选供应商时，如果模型为空，预填供应商默认模型
  const handleProviderChange = useCallback(
    async (providerId: number) => {
      const prov = providers.find((p) => p.id === providerId);
      setDraft((prev) => ({
        ...prev,
        provider_id: providerId,
        // 仅在模型为空时预填，避免覆盖用户已输入的内容
        model_name: prev.model_name || prov?.preferred_model || '',
      }));
      setModelOptions([]);
      try {
        const models = await getProviderModels(providerId);
        setModelOptions(models);
      } catch {
        // 拉模型列表失败时让用户手动输
      }
    },
    [providers]
  );

  const handleSave = async () => {
    if (!draft.provider_id) {
      message.warning('请选择供应商');
      return;
    }
    if (!draft.model_name.trim()) {
      message.warning('请填写模型名称');
      return;
    }
    setSaving(true);
    const payload = {
      task_type: slot.key,
      provider_id: draft.provider_id,
      model_name: draft.model_name.trim(),
      temperature: draft.temperature,
      max_tokens: draft.max_tokens,
      is_active: draft.is_active,
    };
    try {
      if (current) {
        await updateModelConfig(current.id, payload);
      } else {
        await createModelConfig(payload);
      }
      message.success(`「${slot.title}」已保存`);
      onSaved();
    } catch (e: any) {
      message.error(e.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !current ||
    draft.provider_id !== current.provider_id ||
    draft.model_name !== current.model_name ||
    Math.abs(draft.temperature - current.temperature) > 1e-6 ||
    (draft.max_tokens ?? null) !== (current.max_tokens ?? null) ||
    draft.is_active !== current.is_active;

  return (
    <Card
      size="small"
      bordered
      style={{ background: c.surface }}
      title={
        <Space size={8}>
          <Tag color={slot.badgeColor} style={{ margin: 0 }}>
            {slot.key}
          </Tag>
          <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{slot.title}</span>
        </Space>
      }
      extra={
        current ? (
          draft.is_active ? (
            <Tag color="green" style={{ margin: 0 }}>已激活</Tag>
          ) : (
            <Tag color="default" style={{ margin: 0 }}>已停用</Tag>
          )
        ) : (
          <Tag color="orange" style={{ margin: 0 }}>未配置</Tag>
        )
      }
    >
      <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12, minHeight: 32 }}>
        {slot.desc}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="供应商" c={c}>
          <Select
            value={draft.provider_id ?? undefined}
            placeholder="选择供应商"
            style={{ width: '100%' }}
            onChange={(v) => void handleProviderChange(Number(v))}
            options={providers.map((p) => ({ value: p.id, label: p.name }))}
          />
        </Field>

        <Field label="模型" c={c}>
          {modelOptions.length > 0 ? (
            <Select
              showSearch
              allowClear
              value={draft.model_name || undefined}
              placeholder="选择或输入模型名称"
              style={{ width: '100%' }}
              onChange={(v) => setDraft((prev) => ({ ...prev, model_name: v ?? '' }))}
              options={modelOptions.map((m) => ({ value: m, label: m }))}
            />
          ) : (
            <Input
              value={draft.model_name}
              placeholder="如 deepseek-chat / gpt-4o / claude-sonnet-4-5"
              onChange={(e) => setDraft((prev) => ({ ...prev, model_name: e.target.value }))}
            />
          )}
        </Field>

        <Field label={`温度 (${draft.temperature.toFixed(1)})`} c={c}>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={draft.temperature}
            marks={{ 0: '精确', 1: '平衡', 2: '创意' }}
            onChange={(v) => setDraft((prev) => ({ ...prev, temperature: Number(v) }))}
          />
        </Field>

        <Field label="Max Tokens" c={c}>
          <InputNumber
            min={1}
            max={128000}
            step={1024}
            value={draft.max_tokens ?? undefined}
            placeholder="留空 = 不限制"
            style={{ width: '100%' }}
            onChange={(v) => setDraft((prev) => ({ ...prev, max_tokens: v == null ? null : Number(v) }))}
          />
        </Field>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 6,
            borderTop: `1px dashed ${c.borderSubtle}`,
            marginTop: 4,
          }}
        >
          <Space size={8}>
            <span style={{ fontSize: 12, color: c.textMuted }}>启用</span>
            <Switch
              checked={draft.is_active}
              onChange={(v) => setDraft((prev) => ({ ...prev, is_active: v }))}
            />
          </Space>
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!dirty}
            onClick={() => void handleSave()}
          >
            保存
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Field({
  label,
  c,
  children,
}: {
  label: string;
  c: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

// ───────────── Embedding 维度兼容性条（保留旧实现）
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
