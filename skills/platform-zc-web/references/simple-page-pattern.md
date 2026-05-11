# 业务模式：单 amis schema 直接渲染（最常见 80% 场景）

> 触发：Amis JSON 是一份**自包含**的 page / form / crud schema，无需 React 包装层

## 推荐实现骨架

```tsx
// src/pages/Goods/index.tsx
import React from 'react';
import { render as amisRender } from 'amis';
import { service } from '@/utils/request';
import { env as amisEnv } from '@/hooks/amis';
import permStore from '@/store/permission';

const schema = {
  type: 'page',
  title: '商品管理',
  body: {
    type: 'crud',
    api: 'app://goods/list',
    columns: [
      { name: 'id', label: 'ID' },
      { name: 'name', label: '商品名' },
      { name: 'price', label: '价格', type: 'tpl', tpl: '¥${price}' },
    ],
  },
};

export default function GoodsPage() {
  return (
    <div className="goods-page">
      {amisRender(
        schema,
        {
          data: {
            $$permissionsData: permStore.getState().permData,
          },
        },
        {
          fetcher: service,
          theme: amisEnv.theme,
        },
      )}
    </div>
  );
}
```

## 关键决策

| 步骤 | 写法 |
|---|---|
| schema 来源 | 直接内联 `const schema = {...}` 或从 `.json` 文件 import |
| 数据上下文 | 第二参 `{ data: { $$permissionsData, ... } }` 注入全局态 |
| API 调用 | 第三参 `{ fetcher: service }` —— `service` 已配 ZC `app://` 重写 + axios |
| 主题 | `theme: amisEnv.theme`（亮 / 暗 / ZC 蓝） |
| 类名 / 容器 | 外层 `<div className="...">` 加业务样式，amis 内部样式不动 |

## 同类参考页（scaffold 内 Read 即可）

- `src/pages/NotifyMessage/index.tsx` — 简单消息 crud 页
- `src/pages/TriggerManagement/index.tsx` — 触发器配置（form + crud 切换）
- `src/pages/FlowCenter/index.tsx` — 流程中心列表

## DO/DON'T

✅ **DO**：用 `amisRender(schema, data, env)` 三参签名，env 必须传 `service` + `theme`
✅ **DO**：schema 写成纯 JSON-able 对象，方便 LLM 输出 + 后续配置化
✅ **DO**：权限数据通过 `data.$$permissionsData` 注入，amis 可在 schema 里 `${$$permissionsData.xxx}` 引用
❌ **DON'T**：不要把 amis schema 拆成 React 组件再拼 —— amis 本身就是声明式 DSL，重新拆是反模式
❌ **DON'T**：不要绕过 `service` 直接用 `fetch / axios`——绕过会丢失 ZC 网关 + token 注入
