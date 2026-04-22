// B.7：系统配置 Tab — 当前主要管"采纳→入库默认状态"
// D3 决策：默认 pending（更安全），admin 可在这里改成 approved（信任飞轮自动采纳）

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Radio, Space, Spin, Tag, message } from 'antd';
import {
  getSystemSetting,
  upsertSystemSetting,
  type SystemSetting,
} from '../../services/systemSettings';
import { useColors } from '../../theme';

const ADOPT_KEY = 'adopt_default_status';

type AdoptStatus = 'pending' | 'approved';

export default function SystemSettingsTab() {
  const c = useColors();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState<SystemSetting | null>(null);
  const [draft, setDraft] = useState<AdoptStatus>('pending');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const cur = await getSystemSetting(ADOPT_KEY);
      setSetting(cur);
      const v = (cur?.value ?? 'pending') as AdoptStatus;
      setDraft(v === 'approved' ? 'approved' : 'pending');
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`加载配置失败：${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await upsertSystemSetting(ADOPT_KEY, {
        value: draft,
        description:
          '采纳后入库默认状态：pending=待审，approved=直接进飞轮（D3 决策默认 pending）',
      });
      setSetting(updated);
      message.success(`已保存（默认状态：${draft}）`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? String(e);
      message.error(`保存失败：${msg}`);
    } finally {
      setSaving(false);
    }
  }, [draft]);

  if (loading) return <Spin />;

  const dirty = (setting?.value ?? 'pending') !== draft;

  return (
    <div style={{ maxWidth: 720 }}>
      <Alert
        type="info"
        showIcon
        message="影响"
        description={
          <span style={{ fontSize: 12 }}>
            用户在项目详情页点 <strong>采纳</strong> 后，生成的代码会写入 RAG 样例库。
            <br />
            该配置决定写入时的默认状态：
            <br />
            <strong>pending</strong> → 不参与下次任务的检索，需 admin 在「知识库 → RAG 样例库」审核通过
            <br />
            <strong>approved</strong> → 立即参与检索（信任飞轮，但风险是低质量样例污染上下文）
          </span>
        }
        style={{ marginBottom: 16 }}
      />

      <div
        style={{
          padding: 16,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          background: c.surface,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: c.textSubtle,
            marginBottom: 6,
          }}
        >
          {ADOPT_KEY}
        </div>
        <div style={{ fontSize: 14, color: c.text, marginBottom: 12 }}>
          采纳→入库 默认状态
        </div>
        <Radio.Group value={draft} onChange={(e) => setDraft(e.target.value)}>
          <Space direction="vertical">
            <Radio value="pending">
              <Tag color="orange" style={{ color: c.text }}>
                pending
              </Tag>
              <span style={{ color: c.textMuted, fontSize: 12 }}>（默认推荐，安全）</span>
            </Radio>
            <Radio value="approved">
              <Tag color="green">approved</Tag>
              <span style={{ color: c.textMuted, fontSize: 12 }}>
                （直接进飞轮；适合内部团队信任度高的场景）
              </span>
            </Radio>
          </Space>
        </Radio.Group>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="primary" onClick={() => void onSave()} disabled={!dirty || saving}>
            保存
          </Button>
          {setting?.updated_at && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textSubtle }}>
              上次更新 {new Date(setting.updated_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
