# 业务模式：ZC `modelform` 数据建模驱动的表单（vs 原版 amis `form`）

> 触发：Amis JSON `type: "modelform"`（ZC 二开），**或** 用户给的 `form` 字段跟 ZC 数据模型一一对应

## 何时用 modelform 而非原版 form

| 场景 | 用哪个 |
|---|---|
| 表单字段跟 ZC 数据模型一致（已配 fields） | **modelform** —— 自动渲染 + 校验 |
| 表单含 ZC 二开 type（department-select / user-select / modelpicker） | **modelform** —— 内置 ZC 控件 |
| 表单字段全是自定义业务字段（不绑模型） | 原版 `form` |
| 多步表单（wizard） | 原版 `form` + `mode: "horizontal"` 或拆 page |

## 推荐 amis JSON 骨架

```json
{
  "type": "modelform",
  "title": "新建客户",
  "modelCode": "customer",
  "api": "app://customer/save",
  "initApi": "app://customer/${id}",
  "controls": [
    { "name": "name", "label": "客户名称", "type": "text", "required": true },
    { "name": "industry", "label": "行业", "type": "select", "source": "app://dict/industry" },
    { "name": "contactPerson", "label": "联系人", "type": "user-select" },
    { "name": "ownerDept", "label": "所属部门", "type": "department-select", "required": true },
    { "name": "level", "label": "客户等级", "type": "radios", "options": ["VIP", "普通", "潜在"] },
    { "name": "remark", "label": "备注", "type": "textarea", "maxLength": 500 }
  ]
}
```

## React 容器写法

```tsx
import { render as amisRender, toast } from 'amis';
import { service } from '@/utils/request';
import { env as amisEnv } from '@/hooks/amis';
import { useNavigate } from 'react-router-dom';

const schema = { type: 'modelform', modelCode: 'customer', /* ... */ };

export default function CustomerEdit() {
  const navigate = useNavigate();
  return amisRender(
    schema,
    {
      onAction: (e: any, action: any) => {
        if (action.actionType === 'submit-success') {
          toast.success('保存成功');
          navigate('/customers');
        }
      },
    },
    { fetcher: service, theme: amisEnv.theme },
  );
}
```

## modelform vs form 字段对照

| amis form | ZC modelform | 差异 |
|---|---|---|
| controls | controls | modelform 缺失时自动从 modelCode 读 |
| api（提交） | api | 同 |
| initApi（编辑回填） | initApi | 同 |
| rules | rules | modelform 自动从模型读校验 |
| **缺失** | modelCode | modelform 必须传 |
| controls[].type: select | controls[].type: select / department-select / user-select / modelpicker | modelform 内置 ZC 控件 |

## 同类参考页（scaffold 内 Read 即可）

- `src/pages/AppSetting/EditModalForm.tsx` — 应用配置表单
- `src/pages/EntityManage/tabs/.../FieldEdit.tsx` — 字段编辑（modelform 嵌套）
- `src/pages/UserProfile/index.tsx` — 个人资料表单

## DO/DON'T

✅ **DO**：人员/部门字段必用 `user-select` / `department-select`，**不要用原版 select + 自建数据源**
✅ **DO**：modelform 的 `api` 提交后默认 toast，覆盖时通过 `onAction` 自定义
✅ **DO**：编辑场景必传 `initApi`，让 amis 自动回填字段
❌ **DON'T**：modelform 不要混 wizard，多步流程用 amis `wizard` 或拆 page
❌ **DON'T**：用 modelform 时不要在 controls 里硬编码 `department` 字段类型为 text —— 会失去树形选择能力
