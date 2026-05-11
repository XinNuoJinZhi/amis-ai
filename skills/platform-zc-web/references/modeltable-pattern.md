# 业务模式：ZC `modeltable` 数据建模驱动的 CRUD（vs 原版 amis `crud`）

> 触发：Amis JSON `type: "modeltable"`（ZC 二开），**或** 用户给的 `crud` 显然要绑定 ZC 数据模型

## 何时用 modeltable 而非原版 crud

| 场景 | 用哪个 |
|---|---|
| 已存在 ZC 数据模型（在「实体管理」配过 fields） | **modeltable** —— 自动从模型读 columns / filter / itemActions |
| 列定义需要 LLM 手写每个 column | 原版 `crud` —— 灵活但 verbose |
| 多模型联表查询 | **modeltable** —— ZC 网关支持 join schema |
| API 返回非标准结构（自定义分页字段） | 原版 `crud` —— 自由映射 |

## 推荐 amis JSON 骨架

```json
{
  "type": "modeltable",
  "title": "订单管理",
  "modelCode": "order",
  "api": "app://order/list",
  "columns": [
    { "name": "orderNo", "label": "订单号" },
    { "name": "customer", "label": "客户" },
    { "name": "amount", "label": "金额", "type": "tpl", "tpl": "¥${amount}" },
    { "name": "status", "label": "状态", "type": "mapping", "map": { "1": "待付款", "2": "已付款", "3": "已发货" } }
  ],
  "filter": {
    "controls": [
      { "name": "keyword", "type": "text", "label": "关键词" },
      { "name": "status", "type": "select", "label": "状态", "options": [/* ... */] }
    ]
  },
  "itemActions": [
    { "label": "详情", "actionType": "dialog", "dialog": { "size": "lg", "body": { "type": "modelform", "modelCode": "order", "initApi": "app://order/${id}" } } },
    { "label": "审批", "actionType": "ajax", "api": "app://order/approve/${id}", "confirmText": "确认审批？" }
  ]
}
```

## React 容器写法

```tsx
import { render as amisRender } from 'amis';
import { service } from '@/utils/request';
import { env as amisEnv } from '@/hooks/amis';

const schema = { type: 'modeltable', modelCode: 'order', /* ... */ };

export default function OrderListPage() {
  return amisRender(schema, {}, { fetcher: service, theme: amisEnv.theme });
}
```

## modeltable vs crud 字段对照

| amis crud | ZC modeltable | 差异 |
|---|---|---|
| columns | columns | modeltable 缺失时自动从 modelCode 读 |
| filter | filter | 同 |
| api | api + modelCode | modeltable 必须传 modelCode |
| itemActions | itemActions | 同 |
| headerToolbar | headerToolbar | 同 |
| **缺失** | bulkActions | modeltable 支持批量操作 |
| **缺失** | exportButton | modeltable 自带导出按钮 |

## 同类参考页（scaffold 内 Read 即可）

- `src/pages/EntityManage/tabs/...` — 实体数据 modeltable 演示
- `src/pages/FormManage/index.tsx` — 表单模板列表（混 modeltable + 操作）

## DO/DON'T

✅ **DO**：用户任务含「数据建模」「自动列」「实体表」关键词 → 优先 modeltable
✅ **DO**：modeltable 的 itemActions 里嵌 modelform，schema 复用模型字段
✅ **DO**：bulkActions 支持批量审批 / 批量删除 / 批量导出（原版 crud 没有）
❌ **DON'T**：modeltable 不能用纯静态 columns，要么传 modelCode 让 ZC 后端生成，要么手写但失去自动化
❌ **DON'T**：modeltable 的 api 必须返回 ZC 标准分页结构 `{items, total}`，不像 crud 那么宽容
