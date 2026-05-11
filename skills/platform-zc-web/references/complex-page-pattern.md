# 业务模式：amis + React 包装层混搭（aside / header / 跨 schema 联动）

> 触发：Amis JSON 一个 schema 装不下（含多 tab / 左侧树 / 顶部业务工具栏 / 跨 page 状态联动）

## 推荐实现骨架

```tsx
// src/pages/EntityManage/index.tsx
import React, { useRef, useState } from 'react';
import { render as amisRender } from 'amis';
import { service } from '@/utils/request';
import { env as amisEnv } from '@/hooks/amis';
import permStore from '@/store/permission';
import EntitySidebar from './Sidebar';
import EntityTabs from './Tabs';

export default function EntityManage() {
  const [activeEntity, setActiveEntity] = useState<string | null>(null);

  // 主区 schema 随 activeEntity 切换
  const mainSchema = activeEntity
    ? {
        type: 'crud',
        api: `app://entity/${activeEntity}/records`,
        columns: [/* 按实体动态拿 */],
      }
    : { type: 'tpl', tpl: '请从左侧选择实体' };

  return (
    <div className="entity-manage" style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧：React 组件 */}
      <EntitySidebar onSelect={setActiveEntity} />

      {/* 主区：amis 渲染 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {amisRender(
          mainSchema,
          {
            data: {
              $$permissionsData: permStore.getState().permData,
              activeEntity, // amis 内可用 ${activeEntity}
            },
          },
          { fetcher: service, theme: amisEnv.theme },
        )}
      </div>
    </div>
  );
}
```

## 关键决策

| 何时拆 React 包装层 | 何时纯 amis |
|---|---|
| 需要 React 路由 hook（useNavigate / useParams） | ❌ 直接 amisRender 即可 |
| 业务侧栏 / 主区联动（如左树驱动右表） | ✅ React state 管联动，amis 渲染每个 panel |
| 多个 amis schema 互相 ref（如表单提交后刷新另一个列表） | ✅ React state + amis `data.refreshTarget` 注入 |
| 跨 schema 共享业务 store（Redux / Zustand） | ✅ 在 React 层订阅 store，通过 `data` 传给 amis |
| 自定义 React 组件（Monaco / ECharts 容器） | ✅ amis 通过 `type: "custom"` registry 注册或包在 React 外层 |

## 同类参考页（scaffold 内 Read 即可）

- `src/pages/EntityManage/index.tsx` — 左侧实体树 + 右侧 amis CRUD 切换
- `src/pages/FlowManage/index.tsx` — 上方流程画布（bpmn-js）+ 下方 amis form
- `src/pages/AppSetting/index.tsx` — 多 tab + amis 嵌入

## DO/DON'T

✅ **DO**：包装层只管「布局 + state + 路由」，业务渲染交给 amis
✅ **DO**：amis schema 通过 `data` 字段拿到 React state（用 `${stateVar}` 引用）
✅ **DO**：跨 schema 通信用 `bus`（mitt）或 React state，不要让 amis 全局污染
❌ **DON'T**：不要在 React 里手动 patch amis 内部 DOM
❌ **DON'T**：不要把简单 page 也拆成 React + amis 混搭 — 简单场景用 `simple-page-pattern` 即可
