import { useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { CloseOutlined, SaveOutlined, FileOutlined } from '@ant-design/icons';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useIdeStore } from '../../../../stores/ide';
import { writeFile, readFile } from '../../../../services/ide';
import { useColors, useThemeMode } from '../../../../theme';

interface Props {
  taskId: number;
}

export default function EditorPanel({ taskId }: Props) {
  const darkColors = useColors();
  const mode = useThemeMode((s) => s.mode);
  const monacoTheme = mode === 'light' ? 'amis-light' : 'amis-dark';
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFile = useIdeStore((s) => s.activeFile);
  const setActive = useIdeStore((s) => s.setActive);
  const closeFile = useIdeStore((s) => s.closeFile);
  const updateContent = useIdeStore((s) => s.updateContent);
  const markSaved = useIdeStore((s) => s.markSaved);

  const active = openFiles.find((f) => f.path === activeFile);

  // 全局 Ctrl/Cmd + S 保存当前 Tab
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!active) return;
        try {
          const resp = await writeFile(taskId, active.path, active.content, active.baseMtime);
          markSaved(active.path, resp.mtime);
          message.success(`${active.path} 已保存`);
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 409) {
            message.warning('保存冲突：文件已被 Agent 或其他方修改。正在拉取最新版本…');
            try {
              const fresh = await readFile(taskId, active.path);
              if (!fresh.truncated) {
                // 重新覆盖到 editor（用户需要手动 merge）
                updateContent(active.path, fresh.content);
                markSaved(active.path, fresh.mtime);
              }
            } catch {}
          } else {
            message.error(`保存失败：${e?.response?.data?.error || e.message}`);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, taskId, markSaved, updateContent]);

  const handleEditorMount: OnMount = (_editor, monaco) => {
    // 两套主题 —— 跟随外层主题切换
    monaco.editor.defineTheme('amis-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0A0A0A',
        'editor.foreground': '#FAFAFA',
        'editorLineNumber.foreground': '#71717A',
        'editorLineNumber.activeForeground': '#FAFAFA',
        'editor.lineHighlightBackground': '#1A1A1A',
        'editorCursor.foreground': '#06B6D4',
        'editor.selectionBackground': '#2e4156',
        'editor.inactiveSelectionBackground': '#1f2a37',
        'editorWidget.background': '#111111',
        'editorWidget.border': '#262626',
      },
    });
    monaco.editor.defineTheme('amis-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#FAFAFA',
        'editor.foreground': '#09090B',
        'editorLineNumber.foreground': '#A1A1AA',
        'editorLineNumber.activeForeground': '#09090B',
        'editor.lineHighlightBackground': '#F4F4F5',
        'editorCursor.foreground': '#0891B2',
        'editor.selectionBackground': '#cfe8f7',
        'editor.inactiveSelectionBackground': '#e4eef5',
        'editorWidget.background': '#FFFFFF',
        'editorWidget.border': '#E4E4E7',
      },
    });
    monaco.editor.setTheme(monacoTheme);
  };

  // 切换主题时热更新 Monaco
  useEffect(() => {
    const w = window as any;
    if (w.monaco?.editor) {
      w.monaco.editor.setTheme(monacoTheme);
    }
  }, [monacoTheme]);

  if (openFiles.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: darkColors.bg,
          color: darkColors.textSubtle,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: 0.5,
          gap: 12,
        }}
      >
        <FileOutlined style={{ fontSize: 28, color: darkColors.textSubtle }} />
        <div>[ 从左侧文件树打开文件进行编辑 ]</div>
        <div style={{ fontSize: 11, color: darkColors.textSubtle }}>
          ⌘S / Ctrl+S 保存 · 保存会同步到沙箱，Vite 自动热更新
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: darkColors.bg,
        minWidth: 0,
      }}
    >
      {/* Tab 栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: 32,
          borderBottom: `1px solid ${darkColors.border}`,
          background: darkColors.bg,
          overflow: 'auto',
        }}
      >
        {openFiles.map((f) => {
          const isActive = f.path === activeFile;
          return (
            <div
              key={f.path}
              onClick={() => setActive(f.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px',
                borderRight: `1px solid ${darkColors.borderSubtle}`,
                background: isActive ? darkColors.bg : darkColors.surface,
                color: isActive ? darkColors.text : darkColors.textMuted,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderBottom: isActive ? `1px solid ${darkColors.accentCyan}` : `1px solid transparent`,
              }}
            >
              <span>{f.path.split('/').pop()}</span>
              {f.dirty && (
                <span
                  title="未保存"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: darkColors.accentCyan,
                  }}
                />
              )}
              <CloseOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(f.path);
                }}
                style={{ fontSize: 10, color: darkColors.textSubtle, marginLeft: 4 }}
              />
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        {active && active.dirty && (
          <Tooltip title="保存（⌘S）">
            <Button
              type="text"
              size="small"
              icon={<SaveOutlined />}
              onClick={async () => {
                if (!active) return;
                try {
                  const resp = await writeFile(taskId, active.path, active.content, active.baseMtime);
                  markSaved(active.path, resp.mtime);
                  message.success(`${active.path} 已保存`);
                } catch (e: any) {
                  message.error(`保存失败：${e?.response?.data?.error || e.message}`);
                }
              }}
              style={{ color: darkColors.accentCyan, height: '100%' }}
            />
          </Tooltip>
        )}
      </div>

      {/* Monaco */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {active && (
          <Editor
            height="100%"
            theme={monacoTheme}
            language={active.lang === 'vue' ? 'html' : active.lang}
            value={active.content}
            onChange={(v) => updateContent(active.path, v ?? '')}
            onMount={handleEditorMount}
            options={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              lineHeight: 20,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              renderLineHighlight: 'line',
              tabSize: 2,
              wordWrap: 'off',
              padding: { top: 12, bottom: 12 },
              scrollbar: { useShadows: false },
            }}
          />
        )}
      </div>
    </div>
  );
}
