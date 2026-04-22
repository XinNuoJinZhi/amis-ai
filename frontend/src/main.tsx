// 必须最先 import：过滤第三方库（@ant-design/pro-chat）的已知废弃告警噪音
import './utils/silence-third-party-warnings';

// v0.dev 风格全局样式（字体、滚动条、AntD 覆写等）
import './theme/global.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
