import { getColors, type ColorPalette } from './tokens';
import { useThemeMode } from './useThemeMode';

/**
 * React hook：返回当前主题的色板。
 * 用于那些需要随主题动态切换颜色的组件（inline style 的场景）。
 */
export function useColors(): ColorPalette {
  const mode = useThemeMode((s) => s.mode);
  return getColors(mode);
}
