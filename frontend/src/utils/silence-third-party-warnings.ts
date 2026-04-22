/**
 * 精准过滤第三方库在控制台打出的已知废弃告警。
 *
 * 背景：@ant-design/pro-chat@1.15.3 内部仍使用了 antd v5 已标记废弃的 API
 * （Tooltip.overlayClassName / Select/AutoComplete.onDropdownVisibleChange 等）。
 * 它的 latest 版本就是 1.15.3，beta 2.x 还不稳定，暂时没法升级解决。
 *
 * 我们的原则：只屏蔽**精确匹配**的已知第三方噪音，不干扰自己代码和其他新警告。
 * 一旦 pro-chat 升级到不再使用这些 API，把对应条目从列表里删掉即可。
 */

const ANTD_DEPRECATION_PATTERNS = [
  // 来自 @ant-design/pro-chat 内部的已知废弃 API 告警
  '[antd: Tooltip] `overlayClassName` is deprecated',
  '[antd: AutoComplete] `onDropdownVisibleChange` is deprecated',
  '[antd: Select] `onDropdownVisibleChange` is deprecated',
];

// pro-chat 内部的无意义 log
const NOISY_LOG_PATTERNS = ['renderItems undefined'];

const originalWarn = console.warn.bind(console);
const originalLog = console.log.bind(console);

console.warn = (...args: unknown[]) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string') {
    if (ANTD_DEPRECATION_PATTERNS.some((p) => firstArg.includes(p))) {
      return; // 静默已知噪音
    }
  }
  originalWarn(...args);
};

console.log = (...args: unknown[]) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string') {
    if (NOISY_LOG_PATTERNS.some((p) => firstArg.includes(p))) {
      return;
    }
  }
  originalLog(...args);
};

export {};
