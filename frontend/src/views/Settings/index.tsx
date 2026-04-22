import { Tabs } from 'antd';
import LlmProviders from './LlmProviders';
import ModelConfigs from './ModelConfigs';
import SystemSettingsTab from './SystemSettings';
import { useColors } from '../../theme';

export default function Settings() {
  const darkColors = useColors();
  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            color: darkColors.text,
            letterSpacing: -0.2,
          }}
        >
          系统设置
        </h1>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: darkColors.textMuted,
            fontFamily: 'var(--font-mono)',
          }}
        >
          LLM providers · model configs
        </div>
      </div>
      <Tabs
        defaultActiveKey="providers"
        items={[
          { key: 'providers', label: '供应商管理', children: <LlmProviders /> },
          { key: 'configs', label: '模型配置', children: <ModelConfigs /> },
          { key: 'system', label: '系统配置', children: <SystemSettingsTab /> },
        ]}
      />
    </div>
  );
}
