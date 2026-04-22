import { getColors, fontStacks, type ThemeMode } from './tokens';

export function injectCssVars(mode: ThemeMode = 'dark'): void {
  const root = document.documentElement;
  const c = getColors(mode);
  const map: Record<string, string> = {
    '--bg': c.bg,
    '--surface': c.surface,
    '--surface-elevated': c.surfaceElevated,
    '--border': c.border,
    '--border-subtle': c.borderSubtle,
    '--text': c.text,
    '--text-muted': c.textMuted,
    '--text-subtle': c.textSubtle,
    '--primary': c.primary,
    '--primary-contrast': c.primaryContrast,
    '--accent': c.accent,
    '--accent-cyan': c.accentCyan,
    '--success': c.success,
    '--warning': c.warning,
    '--destructive': c.destructive,
    '--ring': c.ring,
    '--status-pending': c.statusPending,
    '--status-stopped': c.statusStopped,
    '--font-sans': fontStacks.sans,
    '--font-mono': fontStacks.mono,
  };
  for (const [k, v] of Object.entries(map)) {
    root.style.setProperty(k, v);
  }
  root.setAttribute('data-theme', mode);
  root.style.colorScheme = mode;
}
