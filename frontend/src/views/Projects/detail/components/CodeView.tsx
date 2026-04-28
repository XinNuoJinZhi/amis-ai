import { useMemo } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import scss from 'react-syntax-highlighter/dist/esm/languages/hljs/scss';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import rust from 'react-syntax-highlighter/dist/esm/languages/hljs/rust';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown';
import { vs2015, github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useThemeMode } from '../../../../theme';

// 一次性注册所有支持的语言。tree-shaking 由 vite 处理 —— 实际未导入的模块不会进 bundle。
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('tsx', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', javascript);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('html', xml);
SyntaxHighlighter.registerLanguage('vue', xml); // hljs 没专门的 vue，用 xml/markup 兜底
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('scss', scss);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('rs', rust);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  vue: 'vue',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  svg: 'xml',
  json: 'json',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'css',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  py: 'python',
  rs: 'rust',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
};

export function inferLanguage(pathOrName: string | undefined): string {
  if (!pathOrName) return 'plaintext';
  const m = /\.([a-zA-Z0-9]+)$/.exec(pathOrName);
  const ext = m?.[1]?.toLowerCase();
  if (!ext) return 'plaintext';
  return EXT_TO_LANG[ext] ?? 'plaintext';
}

interface CodeViewProps {
  code: string;
  language?: string;
  /** 文件路径（用于在没指定 language 时按后缀推断） */
  path?: string;
  fontSize?: number;
  lineHeight?: string;
  /** 透明背景（让外层卡片背景透出） */
  transparent?: boolean;
  showLineNumbers?: boolean;
}

/**
 * 高亮代码块 —— 基于 react-syntax-highlighter (highlight.js)。
 *   - 暗主题 vs2015；亮主题 github
 *   - 按文件后缀自动推断语言（vue 走 xml hljs grammar 兜底）
 *   - PreTag = 'div' 让外层布局自由
 */
export default function CodeView({
  code,
  language,
  path,
  fontSize = 11.5,
  lineHeight = '17px',
  transparent = true,
  showLineNumbers = false,
}: CodeViewProps) {
  const mode = useThemeMode((s) => s.mode);
  const lang = language ?? inferLanguage(path);
  const style = mode === 'light' ? github : vs2015;

  const customStyle = useMemo(
    () => ({
      margin: 0,
      padding: 0,
      background: transparent ? 'transparent' : undefined,
      fontSize,
      lineHeight,
      fontFamily: 'var(--font-mono)',
    }),
    [fontSize, lineHeight, transparent],
  );

  return (
    <SyntaxHighlighter
      language={lang}
      style={style}
      customStyle={customStyle}
      PreTag="div"
      CodeTag="span"
      codeTagProps={{ style: { fontFamily: 'inherit', background: 'transparent' } }}
      showLineNumbers={showLineNumbers}
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  );
}
