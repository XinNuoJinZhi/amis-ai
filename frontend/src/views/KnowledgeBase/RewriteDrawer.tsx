// Skill 桶单文件 AI 改写 Drawer（Synthetic Honey · Task 12）
//
// 父组件（SkillBucketDetail）传入：
//   - bucket / path
//   - 选中范围的起止行号（1-based，含）+ 选区正文
//   - 全文（可选：勾选"带全文作语境"时后端会把它塞进 prompt）
//   - onAccept(newText): 用户点"接受"时回调，父组件负责把选区替换成 newText 并保存
//
// 三个阶段：
//   A 初始：用户填改写方向 → 点"开始改写"
//   B 流式：实时看 token 累积；可"取消"中断
//   C 对比：DiffEditor 展示原选区 vs 改写结果 → "接受" / "重来"

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Drawer, Input, Space, Tag, message } from 'antd';
import { CloseOutlined, RobotOutlined } from '@ant-design/icons';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { streamRewriteFragment, type SseEvent } from '../../services/skillAuthoring';
import { useThemeMode } from '../../theme';

const { TextArea } = Input;

type Phase = 'idle' | 'streaming' | 'ready' | 'error';

export interface RewriteDrawerProps {
  open: boolean;
  onClose: () => void;
  bucket: string;
  path: string;
  selection: string;
  fullFile: string;
  selectionStartLine: number;
  selectionEndLine: number;
  onAccept: (newText: string) => void | Promise<void>;
}

export default function RewriteDrawer(props: RewriteDrawerProps) {
  const themeMode = useThemeMode((s) => s.mode);
  const monacoTheme = themeMode === 'dark' ? 'vs-dark' : 'vs';

  const [phase, setPhase] = useState<Phase>('idle');
  const [direction, setDirection] = useState('');
  const [withFullFile, setWithFullFile] = useState(true);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [finalText, setFinalText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Drawer 关闭时重置状态
  useEffect(() => {
    if (!props.open) {
      abortRef.current?.abort();
      setPhase('idle');
      setDirection('');
      setStreamBuffer('');
      setFinalText('');
      setErrorMsg(null);
      setModel(null);
    }
  }, [props.open]);

  const onEvent = useCallback((ev: SseEvent) => {
    const d = ev.data as Record<string, unknown>;
    switch (ev.event) {
      case 'meta':
        if (typeof d.model === 'string') setModel(d.model);
        break;
      case 'data': {
        const delta = String(d.delta ?? '');
        if (delta) setStreamBuffer((prev) => prev + delta);
        break;
      }
      case 'done': {
        const ns = typeof d.new_selection === 'string' ? d.new_selection : '';
        setFinalText(ns);
        setPhase('ready');
        break;
      }
      case 'error': {
        setErrorMsg(String(d.error ?? '未知错误'));
        setPhase('error');
        break;
      }
      default:
        break;
    }
  }, []);

  const start = useCallback(async () => {
    if (!direction.trim()) {
      message.warning('请填写改写方向');
      return;
    }
    setPhase('streaming');
    setStreamBuffer('');
    setFinalText('');
    setErrorMsg(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await streamRewriteFragment(
        props.bucket,
        {
          path: props.path,
          selection_start_line: props.selectionStartLine,
          selection_end_line: props.selectionEndLine,
          direction: direction.trim(),
          full_file_for_context: withFullFile,
        },
        onEvent,
        { signal: ctrl.signal }
      );
      // 流自然结束——如果没收到 done 就判失败
      setPhase((prev) => (prev === 'streaming' ? 'error' : prev));
    } catch (e) {
      if (!ctrl.signal.aborted) {
        setErrorMsg((e as Error).message || String(e));
        setPhase('error');
      } else {
        setPhase('idle');
      }
    }
  }, [direction, props, onEvent, withFullFile]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
  }, []);

  const accept = useCallback(async () => {
    if (!finalText) return;
    await props.onAccept(finalText);
    props.onClose();
  }, [finalText, props]);

  const redo = useCallback(() => {
    setPhase('idle');
    setStreamBuffer('');
    setFinalText('');
    setErrorMsg(null);
  }, []);

  return (
    <Drawer
      title={
        <span>
          <RobotOutlined style={{ marginRight: 6 }} />
          AI 改写片段
          {model && (
            <Tag color="purple" style={{ marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
              {model}
            </Tag>
          )}
        </span>
      }
      open={props.open}
      onClose={props.onClose}
      width={880}
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#888' }}>
        {props.bucket} / {props.path}  ·  行 {props.selectionStartLine}–{props.selectionEndLine}
      </div>

      {phase === 'idle' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, marginBottom: 4, color: '#888' }}>选中范围：</div>
            <div style={{ height: 180, border: '1px solid var(--color-border)' }}>
              <Editor
                height="180px"
                language="markdown"
                theme={monacoTheme}
                value={props.selection}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, marginBottom: 4, color: '#888' }}>改写方向：</div>
            <TextArea
              rows={4}
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              placeholder={'例如：更精炼；加上“常见错误清单”段落；按 component-mapping.md 的风格重写…'}
            />
          </div>
          <Checkbox
            checked={withFullFile}
            onChange={(e) => setWithFullFile(e.target.checked)}
            style={{ marginBottom: 16 }}
          >
            带上全文作为语境（文件 &lt; 60KB 才生效）
          </Checkbox>
          <div>
            <Button type="primary" icon={<RobotOutlined />} onClick={start}>
              开始改写
            </Button>
          </div>
        </>
      )}

      {phase === 'streaming' && (
        <>
          <Alert type="info" showIcon message="AI 正在改写…" style={{ marginBottom: 12 }} />
          <div style={{ height: 'calc(100vh - 280px)', border: '1px solid var(--color-border)' }}>
            <Editor
              height="100%"
              language="markdown"
              theme={monacoTheme}
              value={streamBuffer}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                wordWrap: 'on',
              }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Button icon={<CloseOutlined />} onClick={cancel}>
              取消
            </Button>
          </div>
        </>
      )}

      {phase === 'ready' && (
        <>
          <Alert
            type="success"
            showIcon
            message="改写完成，请对比并决定是否接受"
            style={{ marginBottom: 12 }}
          />
          <div style={{ height: 'calc(100vh - 280px)', border: '1px solid var(--color-border)' }}>
            <DiffEditor
              height="100%"
              language="markdown"
              theme={monacoTheme}
              original={props.selection}
              modified={finalText}
              options={{
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                wordWrap: 'on',
              }}
            />
          </div>
          <Space style={{ marginTop: 12 }}>
            <Button type="primary" onClick={accept}>
              接受并替换选区
            </Button>
            <Button onClick={redo}>重来</Button>
            <Button onClick={props.onClose}>关闭</Button>
          </Space>
        </>
      )}

      {phase === 'error' && (
        <>
          <Alert type="error" showIcon message="改写失败" description={errorMsg ?? '未知错误'} />
          <Space style={{ marginTop: 12 }}>
            <Button type="primary" onClick={redo}>
              重来
            </Button>
            <Button onClick={props.onClose}>关闭</Button>
          </Space>
        </>
      )}
    </Drawer>
  );
}
