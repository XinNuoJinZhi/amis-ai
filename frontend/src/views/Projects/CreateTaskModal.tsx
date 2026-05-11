import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Select, Input, Form, message, Tag, Typography, Space, Checkbox, Collapse, Radio, Spin, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  createProjectTask,
  previewLlmSelection,
  type LlmMode,
  type LlmPreviewResult,
  type PermissionConfig,
} from '../../services/projects';
import { getProviders, getProviderModels } from '../../services/llm';
import {
  listPlatforms,
  listTemplates,
  resolveSkills,
  type RegistryPlatform,
  type RegistryTemplate,
} from '../../services/registry';
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

  // ---- 2026-04 四维度选择（平台 × 技术栈 × UI 库 × 模板）----
  // 注：技术栈 / UI 库**单选**：一个项目只会用一套主栈；多选语义会让 Agent 困惑。
  //     backend 接口仍然接收数组，前端发送时用 [x] 包一层。
  const [platform, setPlatform] = useState<string>('mobile');
  const [techStack, setTechStack] = useState<string>('uniapp');
  const [uiLib, setUiLib] = useState<string>('wot');
  const [blankScaffold, setBlankScaffold] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string | null>('uniapp-wot-h5-template');
  const [platformOptions, setPlatformOptions] = useState<RegistryPlatform[]>([]);
  const [templateOptions, setTemplateOptions] = useState<RegistryTemplate[]>([]);
  const [resolvedSkills, setResolvedSkills] = useState<string[]>([]);
  const [resolveWarnings, setResolveWarnings] = useState<string[]>([]);
  const resolveTimerRef = useRef<number | null>(null);

  // ---- 模型选择 ----
  // 默认走 default 模式：沿用系统「code_generation」task_type 配置
  // （目前绑定到 SGLang Qwen3-Coder），避免 auto 模式对简单任务误选小模型。
  // 2026-04-25 实验功能：是否启用确定性翻译器（默认关；主线 LLM 调试期）
  const [enableTranslator, setEnableTranslator] = useState<boolean>(false);
  const [llmMode, setLlmMode] = useState<LlmMode>('default');
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
    listPlatforms().then(setPlatformOptions).catch(() => {});
    listTemplates().then(setTemplateOptions).catch(() => {});
  }, [open]);

  // 维度变化 → 500ms 防抖后调 resolve-skills，预览会激活哪些桶
  useEffect(() => {
    if (!open) return;
    if (resolveTimerRef.current) window.clearTimeout(resolveTimerRef.current);
    resolveTimerRef.current = window.setTimeout(() => {
      resolveSkills({
        platform,
        tech_stacks: [techStack],
        ui_libs: [uiLib],
        template_name: blankScaffold ? null : templateName,
      })
        .then((res) => {
          setResolvedSkills(res.selected);
          setResolveWarnings(res.warnings);
        })
        .catch(() => {
          setResolvedSkills([]);
          setResolveWarnings([]);
        });
    }, 300);
    return () => {
      if (resolveTimerRef.current) window.clearTimeout(resolveTimerRef.current);
    };
  }, [open, platform, techStack, uiLib, templateName, blankScaffold]);

  // 技术栈切换 → 默认同步把 UI 库换成该栈的第一个可选
  const handleTechStackChange = (s: string) => {
    setTechStack(s);
    const pObj = platformOptions.find((x) => x.id === platform);
    const sObj = pObj?.stacks.find((x) => x.id === s);
    if (sObj && sObj.ui_libs.length > 0) {
      setUiLib(sObj.ui_libs[0].id);
    }
    // 同步尝试重算一次匹配模板
    const matched = templateOptions.find(
      (t) =>
        (t.platform === platform || t.platform === 'any') &&
        t.tech_stacks.includes(s) &&
        t.name !== '__blank__',
    );
    setTemplateName(matched?.name ?? null);
    setBlankScaffold(!matched);
  };

  // 级联联动：选平台时默认把该平台的第一个 stack/ui 填进去
  const handlePlatformChange = (p: string) => {
    setPlatform(p);
    const pObj = platformOptions.find((x) => x.id === p);
    if (pObj && pObj.stacks.length > 0) {
      const firstStack = pObj.stacks[0];
      setTechStack(firstStack.id);
      if (firstStack.ui_libs.length > 0) {
        setUiLib(firstStack.ui_libs[0].id);
      }
      // 尝试自动匹配一个模板
      const matched = templateOptions.find(
        (t) =>
          (t.platform === p || t.platform === 'any') &&
          t.tech_stacks.includes(firstStack.id) &&
          t.name !== '__blank__',
      );
      setTemplateName(matched?.name ?? null);
      setBlankScaffold(!matched);
    }
  };

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
      // 2026-04 Phase 4.4：前端停止发送 legacy tech_stack/ui_library 字段。
      // backend.CreateTaskPayload 的兼容分支会从 tech_stacks[0] / ui_libs[0] 自动推导，
      // 并双写到 DB 旧列，老列数据完整性不变。
      const resp = await createProjectTask({
        amis_json: trimmed,
        // 2026-04 多维字段（单选 UI → 数组包一层发给后端）
        platform,
        tech_stacks: [techStack],
        ui_libs: [uiLib],
        template_name: blankScaffold ? '__blank__' : templateName,
        extra_prompt: extraPrompt.trim() || undefined,
        permission_config: {
          mode: permissionMode,
          allowed_tools: allowedTools.length === 6 ? undefined : allowedTools,
        },
        llm_mode: llmMode,
        llm_provider_id: llmMode === 'manual' ? manualProviderId : undefined,
        llm_model_name: llmMode === 'manual' ? manualModel : undefined,
        enable_translator: enableTranslator,
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
      destroyOnHidden
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

        <Form.Item label="目标平台">
          <Radio.Group
            value={platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={platformOptions.map((p) => ({ label: p.name, value: p.id }))}
          />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            选择生成代码的运行平台（Web 浏览器 / 移动端）。技术栈和 UI 库会据此过滤。
          </Text>
        </Form.Item>

        <Form.Item
          label="技术栈"
          help="一个任务只走一条主技术栈；Skills 桶会按这里选的栈叠加。"
        >
          <Select
            showSearch
            value={techStack}
            onChange={handleTechStackChange}
            placeholder="选技术栈"
            options={(platformOptions.find((p) => p.id === platform)?.stacks || []).map((s) => ({
              label: `${s.name} (${s.id})`,
              value: s.id,
            }))}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="UI 组件库">
          <Select
            showSearch
            value={uiLib}
            onChange={(v) => setUiLib(v as string)}
            placeholder="选 UI 组件库"
            options={(() => {
              // 根据当前 techStack 聚合可用 UI 库
              const p = platformOptions.find((x) => x.id === platform);
              const s = p?.stacks.find((x) => x.id === techStack);
              return (s?.ui_libs || []).map((u) => ({
                label: `${u.name} (${u.id})`,
                value: u.id,
              }));
            })()}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <span>底座模板</span>
              <Switch
                size="small"
                checked={blankScaffold}
                onChange={(v) => {
                  setBlankScaffold(v);
                  if (v) setTemplateName(null);
                }}
                checkedChildren="从零搭建"
                unCheckedChildren="选模板"
              />
            </Space>
          }
          help="勾「从零搭建」时，claw-code 会在空目录里自己写 package.json、构建配置和入口文件"
        >
          <Select
            value={templateName}
            onChange={(v) => setTemplateName(v)}
            placeholder="选择底座模板（未选则自动匹配）"
            disabled={blankScaffold}
            allowClear
            options={templateOptions
              .filter((t) => t.name !== '__blank__')
              .filter((t) => t.platform === 'any' || t.platform === platform)
              .map((t) => ({
                label: (
                  <Space size={[4, 4]} wrap>
                    <span>{t.name}</span>
                    {!t.has_scaffold && <Tag color="orange">缺失目录</Tag>}
                    <Tag color="blue">{t.platform}</Tag>
                    {t.ui_libs.map((u) => (
                      <Tag key={u} color={u === 'zc-amis' ? 'magenta' : 'purple'}>
                        {u}
                      </Tag>
                    ))}
                  </Space>
                ),
                value: t.name,
              }))}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="Skills 桶预览">
          <Space size={[4, 8]} wrap>
            {resolvedSkills.length > 0 ? (
              resolvedSkills.map((b) => (
                <Tag key={b} color={b.startsWith('platform.') ? 'green' : b.startsWith('stack.') ? 'blue' : b.startsWith('ui.') ? 'purple' : 'default'}>
                  {b}
                </Tag>
              ))
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>加载中…</Text>
            )}
          </Space>
          {resolveWarnings.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {resolveWarnings.map((w, i) => (
                <Text key={i} type="warning" style={{ fontSize: 12, display: 'block' }}>
                  ⚠️ {w}
                </Text>
              ))}
            </div>
          )}
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            上面是根据当前选择会自动注入 system_prompt 的 Skills 桶。Agent 实际执行时会按这些桶的 SKILL.md 工作。
          </Text>
        </Form.Item>

        <Form.Item
          label="🪄 启用确定性翻译器（实验）"
          tooltip="2026-04-25 实验功能：跳过 LLM 直接把 Amis JSON 翻译成 Vue 代码（覆盖 form/crud/page 等高频结构，0 次 LLM 调用）。降级时自动回退 LLM 流水线。当前默认关，等翻译器质量稳定后再切开"
        >
          <Space>
            <Switch
              checked={enableTranslator}
              onChange={setEnableTranslator}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {enableTranslator
                ? '✨ 已开启 — 优先走确定性翻译器（详见 docs/architecture/amis-translator-pipeline.md）'
                : '默认走 LLM 流水线（生产稳定路径）'}
            </Text>
          </Space>
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
