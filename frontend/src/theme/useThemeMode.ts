import { create } from 'zustand';
import type { ThemeMode } from './tokens';

const STORAGE_KEY = 'amis-ai:theme-mode';

function initialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // 首次进来跟系统偏好：没设置 → 暗色
  try {
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  } catch {
    // ignore
  }
  return 'dark';
}

interface ThemeModeStore {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

export const useThemeMode = create<ThemeModeStore>((set, get) => ({
  mode: initialMode(),
  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
  },
  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    set({ mode: next });
  },
}));
