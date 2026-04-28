/**
 * 精准过滤第三方库在控制台打出的已知废弃告警。
 *
 * 背景：@ant-design/pro-chat@1.15.3 内部仍使用了 antd v5 已标记废弃的 API
 * （Tooltip.overlayClassName / Select/AutoComplete.onDropdownVisibleChange / Modal.destroyOnClose 等）。
 * 它的 latest 版本就是 1.15.3，beta 2.x 还不稳定，暂时没法升级解决。
 *
 * ⚠️ 关键细节：antd 的废弃告警走的是 `console.error`（rc-util 的 warningOnce 实现），
 * 并不是 `console.warn`，所以必须同时拦截两者。
 *
 * 我们的原则：只屏蔽**精确匹配**的已知第三方噪音，不干扰自己代码和其他新警告。
 * 一旦 pro-chat 升级到不再使用这些 API，把对应条目从列表里删掉即可。
 */

const ANTD_DEPRECATION_PATTERNS = [
  // 来自 @ant-design/pro-chat 内部的已知废弃 API 告警
  '[antd: Tooltip] `overlayClassName` is deprecated',
  '[antd: AutoComplete] `onDropdownVisibleChange` is deprecated',
  '[antd: Select] `onDropdownVisibleChange` is deprecated',
  '[antd: Modal] `destroyOnClose` is deprecated',
];

// pro-chat 内部的无意义 log（注意：'renderItems' 和 undefined 是两个独立参数）
const NOISY_LOG_TOKENS = ['renderItems'];

const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);
const originalLog = console.log.bind(console);

const matchesAntdDeprecation = (msg: string): boolean =>
  ANTD_DEPRECATION_PATTERNS.some((p) => msg.includes(p));

console.warn = (...args: unknown[]) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string' && matchesAntdDeprecation(firstArg)) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args: unknown[]) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string' && matchesAntdDeprecation(firstArg)) {
    return;
  }
  originalError(...args);
};

console.log = (...args: unknown[]) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string' && NOISY_LOG_TOKENS.some((t) => firstArg === t || firstArg.startsWith(`${t} `))) {
    return;
  }
  originalLog(...args);
};

export {};
