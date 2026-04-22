import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Select, Input, Form, message, Tag, Typography, Space, Checkbox, Collapse, Radio, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  createProjectTask,
  previewLlmSelection,
  type LlmMode,
  type LlmPreviewResult,
  type PermissionConfig,
} from '../../services/projects';
import { getProviders, getProviderModels } from '../../services/llm';
import { PRESETS } from './presets';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ProviderOption {
  id: number;
  name: string;
  capability_tier: string;
  preferred_model: string | null;
}

const TIER_LABELS: Record<string, string> = {
  fast: 'fast',
  balanced: 'balanced',
  strong: 'strong',
  frontier: 'frontier',
};

export default function CreateTaskModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [presetKey, setPresetKey] = useState('login');
  const [amisJson, setAmisJson] = useState(
    PRESETS.find((p) => p.key === 'login')?.amis_json || '',
  );
  const [extraPrompt, setExtraPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [permissionMode, setPermissionMode] =
    useState<PermissionConfig['mode']>('danger_full_access');
  const [allowedTools, setAllowedTools] = useState<string[]>([
    'bash', 'read_file', 'write_file', 'edit_file', 'glob_search', 'grep_search',
  ]);

  // ---- 模型选择 ----
  const [llmMode, setLlmMode] = useState<LlmMode>('auto');
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [manualProviderId, setManualProviderId] = useState<number | undefined>(undefined);
  const [manualModel, setManualModel] = useState<string | undefined>(undefined);
  const [manualModelOptions, setManualModelOptions] = useState<string[]>([]);
  const [preview, setPreview] = useState<LlmPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 防抖 ref
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    getProviders()
      .then((list) =>
        setProviders(
          list.map((p) => ({
            id: p.id,
            name: p.name,
            capability_tier: p.capability_tier || 'balanced',
            preferred_model: p.preferred_model,
          })),
        ),
      )
      .catch(() => {/* ignore */});
  }, [open]);

  // auto 模式下 debounce 500ms 调 preview
  useEffect(() => {
    if (!open) return;
    if (llmMode !== 'auto') {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    const trimmed = amisJson.trim();
    if (!trimmed) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = window.setTimeout(async () => {
      try {
        JSON.parse(trimmed); // 非法 JSON 就不打接口
      } catch {
        setPreview(null);
        setPreviewError('Amis JSON 格式错误，暂无法预览');
        return;
      }
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const result = await previewLlmSelection(trimmed);
        setPreview(result);
      } catch (e: any) {
        setPreview(null);
        setPreviewError(e.response?.data?.error || e.message || '预览失败');
      } finally {
        setPreviewLoading(false);
      }
    }, 500);
    return () => {
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
      }
    };
  }, [open, llmMode, amisJson]);

  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    const preset = PRESETS.find((p) => p.key === key);
    if (preset) setAmisJson(preset.amis_json);
  };

  const handleProviderChange = async (providerId: number) => {
    setManualProviderId(providerId);
    // 默认带上该供应商的 preferred_model
    const preferred = providers.find((p) => p.id === providerId)?.preferred_model;
    setManualModel(preferred || undefined);
    setManualModelOptions([]);
    try {
      const models = await getProviderModels(providerId);
      setManualModelOptions(models);
    } catch {
      // ignore，允许手动输入
    }
  };

  const handleSubmit = async () => {
    const trimmed = amisJson.trim();
    if (!trimmed) {
      message.warning('请输入 Amis JSON');
      return;
    }
    try {
      JSON.parse(trimmed);
    } catch (e) {
      message.error('Amis JSON 格式错误，请检查');
      return;
    }

    if (llmMode === 'manual' && (!manualProviderId || !manualModel)) {
      message.warning('手动模式下请选择供应商和模型');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await createProjectTask({
        amis_json: trimmed,
        tech_stack: 'uniapp-wot-h5',
        ui_library: 'wot-ui',
        extra_prompt: extraPrompt.trim() || undefined,
        permission_config: {
          mode: permissionMode,
          allowed_tools: allowedTools.length === 6 ? undefined : allowedTools,
        },
        llm_mode: llmMode,
        llm_provider_id: llmMode === 'manual' ? manualProviderId : undefined,
        llm_model_name: llmMode === 'manual' ? manualModel : undefined,
      });
      message.success(`任务 #${resp.id} 已创建`);
      onClose();
      navigate(`/projects/${resp.id}`);
    } catch (e: any) {
      message.error(`创建失败: ${e.response?.data?.error || e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentPreset = PRESETS.find((p) => p.key === presetKey);

  const previewBlock = useMemo(() => {
    if (previewLoading) {
      return (
        <div style={{ marginTop: 6 }}>
          <Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>正在预览 auto 选择…</Text>
        </div>
      );
    }
    if (previewError) {
      return (
        <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
          ⚠️ {previewError}
        </Text>
      );
    }
    if (preview) {
      return (
        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.8 }}>
          <Space size="small" wrap>
            <Tag color="geekblue">{preview.provider_name}</Tag>
            <Tag color="cyan">{preview.model}</Tag>
            {preview.capability_tier && (
              <Tag color="orange">{TIER_LABELS[preview.capability_tier] || preview.capability_tier}</Tag>
            )}
            {preview.complexity_score != null && (
              <Tag>复杂度 {preview.complexity_score.toFixed(1)}</Tag>
            )}
          </Space>
          <Text type="secondary" style={{ display: 'block' }}>
            {preview.reason}
          </Text>
        </div>
      );
    }
    return null;
  }, [preview, previewError, previewLoading]);

  return (
    <Modal
      title="新建项目生成任务"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="创建并跳转"
      confirmLoading={submitting}
      width={720}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="选择预设模板">
          <Select
            value={presetKey}
            onChange={handlePresetChange}
            options={PRESETS.map((p) => ({
              label: p.label,
              value: p.key,
            }))}
          />
          {currentPreset && currentPreset.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 {currentPreset.description}
            </Text>
          )}
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <span>Amis JSON</span>
              <Tag color="blue">可编辑</Tag>
            </Space>
          }
        >
          <TextArea
            value={amisJson}
            onChange={(e) => setAmisJson(e.target.value)}
            rows={14}
            placeholder='{"type": "page", ...}'
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Form.Item>

        <Form.Item label="额外提示（可选）" help="例如：主题色用蓝色、需要支持深色模式等">
          <TextArea
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            rows={2}
            placeholder="给 Agent 的补充指令..."
          />
        </Form.Item>

        <Form.Item label="技术栈">
          <Tag color="geekblue">uniapp-wot-h5</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>（MVP 只支持这一种）</Text>
        </Form.Item>

        <Form.Item
          label="模型选择"
          tooltip="auto = 根据 Amis JSON 复杂度和历史成功率自动挑；manual = 指定 provider+model；default = 沿用系统设置里的 code_generation 活跃配置"
        >
          <Radio.Group
            value={llmMode}
            onChange={(e) => setLlmMode(e.target.value)}
            options={[
              { label: '自动（推荐）', value: 'auto' },
              { label: '手动指定', value: 'manual' },
              { label: '使用系统默认', value: 'default' },
            ]}
          />
          {llmMode === 'auto' && previewBlock}
          {llmMode === 'manual' && (
            <Space style={{ width: '100%', marginTop: 8 }} direction="vertical">
              <Select
                style={{ width: '100%' }}
                placeholder="选择供应商"
                value={manualProviderId}
                onChange={handleProviderChange}
                options={providers.map((p) => ({
                  value: p.id,
                  label: `${p.name}（${p.capability_tier}）`,
                }))}
              />
              {manualModelOptions.length > 0 ? (
                <Select
                  style={{ width: '100%' }}
                  showSearch
                  placeholder="选择模型"
                  value={manualModel}
                  onChange={(v) => setManualModel(v)}
                  options={manualModelOptions.map((m) => ({ value: m, label: m }))}
                  disabled={!manualProviderId}
                />
              ) : (
                <Input
                  placeholder={manualProviderId ? '输入模型名（如 gpt-4o / deepseek-chat）' : '先选供应商'}
                  value={manualModel}
                  onChange={(e) => setManualModel(e.target.value)}
                  disabled={!manualProviderId}
                />
              )}
            </Space>
          )}
          {llmMode === 'default' && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              使用「系统设置 → 模型配置」里 task_type = code_generation 的活跃配置（未设置则 fallback 到 generation）。
            </Text>
          )}
        </Form.Item>

        <Collapse
          ghost
          items={[
            {
              key: 'perm',
              label: '⚙️ 权限设置（默认全开，高级玩家可调）',
              children: (
                <>
                  <Form.Item label="权限模式">
                    <Select
                      value={permissionMode}
                      onChange={setPermissionMode}
                      options={[
                        {
                          label: 'DangerFullAccess（放行一切）',
                          value: 'danger_full_access',
                        },
                        {
                          label: 'WorkspaceWrite（工作区内写入，bash 弹窗升级）',
                          value: 'workspace_write',
                        },
                        {
                          label: 'ReadOnly（只读，写入会被拒）',
                          value: 'read_only',
                        },
                        {
                          label: 'Prompt（每个工具都弹窗）',
                          value: 'prompt',
                        },
                      ]}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      默认 DangerFullAccess：与 claw-code CLI 一致，体验优先。其他模式会触发审批弹窗。
                    </Text>
                  </Form.Item>

                  <Form.Item label="允许的工具">
                    <Checkbox.Group
                      value={allowedTools}
                      onChange={(vals) => setAllowedTools(vals as string[])}
                      options={[
                        { label: 'bash (shell 命令)', value: 'bash' },
                        { label: 'read_file (读文件)', value: 'read_file' },
                        { label: 'write_file (写文件)', value: 'write_file' },
                        { label: 'edit_file (编辑文件)', value: 'edit_file' },
                        { label: 'glob_search (找文件)', value: 'glob_search' },
                        { label: 'grep_search (搜内容)', value: 'grep_search' },
                      ]}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      默认全选。取消勾选的工具 Agent 完全无法使用。
                    </Text>
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
}
