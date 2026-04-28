import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

// ────────────────────────────────────────── 色板定义

export interface ColorPalette {
  bg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryContrast: string;
  primaryHover: string;
  primaryActive: string;
  accent: string;
  accentCyan: string;
  success: string;
  warning: string;
  destructive: string;
  ring: string;
  // 状态色（列表 / StatusBadge 用）
  statusPending: string;
  statusStopped: string;
}

export const darkColors: ColorPalette = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceElevated: '#1A1A1A',
  border: '#262626',
  borderSubtle: '#1F1F1F',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  textSubtle: '#71717A',
  primary: '#FAFAFA',
  primaryContrast: '#0A0A0A',
  primaryHover: '#E8E8E8',
  primaryActive: '#D4D4D4',
  accent: '#7C3AED',
  accentCyan: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  destructive: '#EF4444',
  ring: 'rgba(250,250,250,0.3)',
  statusPending: '#D4A354',
  statusStopped: '#B08968',
};

export const lightColors: ColorPalette = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#F4F4F5',
  border: '#E4E4E7',
  borderSubtle: '#EFEFEF',
  text: '#09090B',
  textMuted: '#52525B',
  textSubtle: '#A1A1AA',
  primary: '#09090B',
  primaryContrast: '#FAFAFA',
  primaryHover: '#1F1F22',
  primaryActive: '#2A2A2E',
  accent: '#7C3AED',
  accentCyan: '#0891B2',
  success: '#059669',
  warning: '#D97706',
  destructive: '#DC2626',
  ring: 'rgba(9,9,11,0.2)',
  statusPending: '#B8761F',
  statusStopped: '#8B6B51',
};

export type ThemeMode = 'dark' | 'light';

// 两份固定色板（供 getColors 按需读取；不要对外导出变动的中间态，否则 React 看不到变化）
const PALETTES: Record<ThemeMode, ColorPalette> = {
  dark: darkColors,
  light: lightColors,
};

export function getColors(mode: ThemeMode): ColorPalette {
  return PALETTES[mode];
}

export const fontStacks = {
  sans: `"Geist Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`,
  mono: `"Geist Mono Variable", "JetBrains Mono", Menlo, Monaco, "Cascadia Code", Consolas, monospace`,
};

// ────────────────────────────────────────── AntD ThemeConfig 构造器

export function buildThemeConfig(mode: ThemeMode): ThemeConfig {
  const c = getColors(mode);
  return {
    algorithm: mode === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
    token: {
      colorPrimary: c.primary,
      colorInfo: c.accentCyan,
      colorSuccess: c.success,
      colorWarning: c.warning,
      colorError: c.destructive,
      colorBgBase: c.bg,
      colorBgLayout: c.bg,
      colorBgContainer: c.surface,
      colorBgElevated: c.surfaceElevated,
      colorBorder: c.border,
      colorBorderSecondary: c.borderSubtle,
      colorText: c.text,
      colorTextSecondary: c.textMuted,
      colorTextTertiary: c.textSubtle,
      fontFamily: fontStacks.sans,
      fontFamilyCode: fontStacks.mono,
      fontSize: 13,
      fontSizeLG: 14,
      fontSizeSM: 12,
      fontSizeXL: 16,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 16,
      fontSizeHeading5: 14,
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      borderRadiusXS: 2,
      controlHeight: 32,
      controlHeightLG: 38,
      controlHeightSM: 26,
      boxShadow: 'none',
      boxShadowSecondary: 'none',
      boxShadowTertiary: 'none',
      wireframe: false,
    },
    components: {
      Layout: {
        bodyBg: c.bg,
        headerBg: c.bg,
        headerHeight: 48,
        headerPadding: '0 16px',
        siderBg: c.bg,
        triggerBg: c.surface,
      },
      Menu: {
        itemBg: 'transparent',
        itemColor: c.textMuted,
        itemHoverColor: c.text,
        itemHoverBg: c.surfaceElevated,
        itemSelectedBg: c.surfaceElevated,
        itemSelectedColor: c.text,
        itemBorderRadius: 6,
        iconSize: 16,
        subMenuItemBg: 'transparent',
      },
      Button: {
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        defaultBg: 'transparent',
        defaultBorderColor: c.border,
        defaultColor: c.text,
        defaultHoverBg: c.surfaceElevated,
        defaultHoverBorderColor: c.border,
        defaultHoverColor: c.text,
        defaultActiveBg: c.surface,
        fontWeight: 500,
        borderColorDisabled: c.border,
        // Primary：v0 风 —— 暗色下白底黑字、亮色下黑底白字
        primaryColor: c.primaryContrast,
        colorPrimary: c.primary,
        colorPrimaryHover: c.primaryHover,
        colorPrimaryActive: c.primaryActive,
        colorPrimaryTextHover: c.primaryContrast,
        colorPrimaryTextActive: c.primaryContrast,
        paddingInline: 14,
      },
      // Radio.Group buttonStyle=solid 激活态：与 Button primary 同色系（白底黑字 / 黑底白字）
      Radio: {
        buttonSolidCheckedColor: c.primaryContrast,
        buttonSolidCheckedBg: c.primary,
        buttonSolidCheckedHoverBg: c.primaryHover,
        buttonSolidCheckedActiveBg: c.primaryActive,
        buttonColor: c.text,
        buttonBg: 'transparent',
        buttonCheckedBg: c.primary,
        colorPrimary: c.primary,
        // 未激活按钮的边框色
        colorBorder: c.border,
      },
      // Switch checked 态：同色系
      Switch: {
        colorPrimary: c.primary,
        colorPrimaryHover: c.primaryHover,
        // antd v5 Switch 的 checkedChildren 文字用全局 colorTextLightSolid，
        // 在组件级覆盖为 primaryContrast（v0 暗色下 = 黑）
        colorTextLightSolid: c.primaryContrast,
      },
      Input: {
        activeShadow: `0 0 0 3px ${c.ring}`,
        activeBorderColor: c.text,
        hoverBorderColor: c.border,
        colorBgContainer: c.surfaceElevated,
      },
      Card: {
        colorBgContainer: c.surface,
        headerBg: 'transparent',
        boxShadow: 'none',
        boxShadowTertiary: 'none',
        headerFontSize: 14,
        headerHeight: 44,
      },
      Table: {
        headerBg: 'transparent',
        headerColor: c.textMuted,
        headerSplitColor: 'transparent',
        borderColor: c.borderSubtle,
        rowHoverBg: c.surfaceElevated,
        cellPaddingBlock: 12,
      },
      Modal: {
        contentBg: c.surface,
        headerBg: c.surface,
        titleColor: c.text,
      },
      Drawer: {
        colorBgElevated: c.surface,
      },
      Tabs: {
        itemColor: c.textMuted,
        itemHoverColor: c.text,
        itemSelectedColor: c.text,
        itemActiveColor: c.text,
        inkBarColor: c.text,
        horizontalItemGutter: 20,
        titleFontSize: 13,
      },
      Tag: {
        borderRadiusSM: 4,
        defaultBg: c.surfaceElevated,
        defaultColor: c.text,
      },
      Tooltip: {
        colorBgSpotlight: c.surfaceElevated,
        colorTextLightSolid: c.text,
      },
      Segmented: {
        itemSelectedBg: c.surface,
        itemColor: c.textMuted,
        itemSelectedColor: c.text,
        itemHoverColor: c.text,
        trackBg: c.surfaceElevated,
        trackPadding: 3,
      },
      Dropdown: {
        colorBgElevated: c.surfaceElevated,
      },
      Tree: {
        directoryNodeSelectedBg: c.surfaceElevated,
        directoryNodeSelectedColor: c.text,
        nodeHoverBg: c.surfaceElevated,
        nodeSelectedBg: c.surfaceElevated,
      },
      Form: {
        labelColor: c.textMuted,
        itemMarginBottom: 20,
      },
    },
  };
}

/** 兼容保留：旧代码 `import { darkThemeConfig }` 的路径仍能工作 */
export const darkThemeConfig: ThemeConfig = buildThemeConfig('dark');
