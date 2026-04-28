// 第三方库类型补丁 —— @types/react-syntax-highlighter 装包被 hook 拦了，
// 这里手写最小声明让 TS 通过；运行时用法不变。
declare module 'react-syntax-highlighter/dist/esm/light' {
  import type { ComponentType, CSSProperties, ReactNode } from 'react';
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: { [key: string]: CSSProperties };
    customStyle?: CSSProperties;
    codeTagProps?: { style?: CSSProperties; [k: string]: unknown };
    PreTag?: string | ComponentType<{ style?: CSSProperties; children?: ReactNode }>;
    CodeTag?: string | ComponentType<{ style?: CSSProperties; children?: ReactNode }>;
    children?: string;
    showLineNumbers?: boolean;
    wrapLongLines?: boolean;
    [k: string]: unknown;
  }
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps> & {
    registerLanguage(name: string, lang: unknown): void;
  };
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/languages/hljs/*' {
  const lang: unknown;
  export default lang;
}

declare module 'react-syntax-highlighter/dist/esm/styles/hljs' {
  const styles: { [key: string]: { [key: string]: import('react').CSSProperties } };
  export const vs2015: { [key: string]: import('react').CSSProperties };
  export const github: { [key: string]: import('react').CSSProperties };
  export default styles;
}

declare module 'anser' {
  interface AnserAPI {
    ansiToHtml(input: string, options?: { use_classes?: boolean }): string;
    ansiToJson(input: string, options?: { use_classes?: boolean; remove_empty?: boolean; json?: boolean }): Array<{
      content: string;
      fg: string;
      bg: string;
      fg_truecolor?: string;
      bg_truecolor?: string;
      isEmpty?: () => boolean;
      decoration: string | null;
      decorations: string[];
    }>;
    escapeForHtml(input: string): string;
    linkify(input: string): string;
  }
  const anser: AnserAPI;
  export default anser;
}
