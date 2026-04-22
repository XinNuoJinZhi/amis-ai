import { create } from 'zustand';

// ─────────────────────── 类型

export interface OpenFile {
  path: string;
  content: string;
  original: string;
  baseMtime: number;
  lang: string;
  dirty: boolean;
}

export interface ConsoleEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: any[];
  ts: number;
  stack?: string;
}

export type BottomTab = 'terminal' | 'console' | 'logs';

export interface LayoutSizes {
  fileTree: number;   // percent
  editor: number;
  preview: number;
  bottom: number;     // percent of full viewport height
}

export const DEFAULT_LAYOUT: LayoutSizes = {
  fileTree: 18,
  editor: 44,
  preview: 38,
  bottom: 30,
};

// ─────────────────────── Store

interface IdeStore {
  // layout
  layout: LayoutSizes;
  setLayout: (l: Partial<LayoutSizes>) => void;
  resetLayout: () => void;

  // panels
  bottomTab: BottomTab;
  setBottomTab: (t: BottomTab) => void;
  bottomOpen: boolean;
  setBottomOpen: (v: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;

  // open files
  openFiles: OpenFile[];
  activeFile: string | null;
  openFile: (f: OpenFile) => void;
  closeFile: (path: string) => void;
  setActive: (path: string | null) => void;
  updateContent: (path: string, content: string) => void;
  markSaved: (path: string, mtime: number) => void;

  // console
  consoleLogs: ConsoleEntry[];
  appendConsole: (entry: Omit<ConsoleEntry, 'id'>) => void;
  clearConsole: () => void;

  // terminal buffer（用于塞入对话）
  terminalBuffer: string[];
  appendTerminal: (chunk: string) => void;
  clearTerminal: () => void;

  // reset（离开任务时）
  reset: () => void;
}

const MAX_CONSOLE = 500;
const MAX_TERMINAL_LINES = 500;

export const useIdeStore = create<IdeStore>((set) => ({
  layout: DEFAULT_LAYOUT,
  setLayout: (l) => set((s) => ({ layout: { ...s.layout, ...l } })),
  resetLayout: () => set({ layout: DEFAULT_LAYOUT }),

  bottomTab: 'terminal',
  setBottomTab: (t) => set({ bottomTab: t }),
  bottomOpen: true,
  setBottomOpen: (v) => set({ bottomOpen: v }),
  chatOpen: true,
  setChatOpen: (v) => set({ chatOpen: v }),

  openFiles: [],
  activeFile: null,
  openFile: (f) => set((s) => {
    const exists = s.openFiles.find((o) => o.path === f.path);
    if (exists) {
      return { activeFile: f.path };
    }
    return {
      openFiles: [...s.openFiles, f],
      activeFile: f.path,
    };
  }),
  closeFile: (path) => set((s) => {
    const next = s.openFiles.filter((o) => o.path !== path);
    const active = s.activeFile === path
      ? (next[next.length - 1]?.path ?? null)
      : s.activeFile;
    return { openFiles: next, activeFile: active };
  }),
  setActive: (path) => set({ activeFile: path }),
  updateContent: (path, content) => set((s) => ({
    openFiles: s.openFiles.map((o) =>
      o.path === path
        ? { ...o, content, dirty: content !== o.original }
        : o,
    ),
  })),
  markSaved: (path, mtime) => set((s) => ({
    openFiles: s.openFiles.map((o) =>
      o.path === path
        ? { ...o, original: o.content, baseMtime: mtime, dirty: false }
        : o,
    ),
  })),

  consoleLogs: [],
  appendConsole: (entry) => set((s) => {
    const next = [
      ...s.consoleLogs,
      { ...entry, id: `${entry.ts}-${Math.random().toString(36).slice(2, 8)}` },
    ];
    if (next.length > MAX_CONSOLE) next.splice(0, next.length - MAX_CONSOLE);
    return { consoleLogs: next };
  }),
  clearConsole: () => set({ consoleLogs: [] }),

  terminalBuffer: [],
  appendTerminal: (chunk) => set((s) => {
    const lines = [...s.terminalBuffer];
    for (const line of chunk.split(/\r?\n/)) {
      lines.push(line);
    }
    if (lines.length > MAX_TERMINAL_LINES) lines.splice(0, lines.length - MAX_TERMINAL_LINES);
    return { terminalBuffer: lines };
  }),
  clearTerminal: () => set({ terminalBuffer: [] }),

  reset: () => set({
    openFiles: [],
    activeFile: null,
    consoleLogs: [],
    terminalBuffer: [],
  }),
}));
