# ConditionBuilder 条件构建器组件

这是一个基于 Amis `condition-builder` 的 React 封装组件，用于在表单中构建复杂的查询条件。

## 功能特性

- 支持多种字段类型（文本、数字、日期、选择器等）
- 支持嵌套条件组（AND/OR 逻辑）
- 支持拖拽排序
- 支持简易模式和完整模式
- 支持内嵌和弹窗两种展示方式
- 完全兼容 Amis condition-builder 的所有配置

## 基本用法

```tsx
import { ConditionBuilder, ConditionField } from '@/codegen-components'

const fields: ConditionField[] = [
  {
    label: 'ID',
    name: 'id',
    type: 'number',
    defaultOp: 'equal',
  },
  {
    label: '名称',
    name: 'name',
    type: 'text',
  },
]

function MyForm() {
  const [conditions, setConditions] = useState()

  return (
    <ConditionBuilder
      fields={fields}
      value={conditions}
      onChange={setConditions}
    />
  )
}
```

## Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| value | `ConditionValue` | - | 条件值 |
| onChange | `(value: ConditionValue) => void` | - | 值变化回调 |
| fields | `ConditionField[]` | `[]` | 字段配置 |
| source | `string` | - | 远程拉取字段配置的 API |
| embed | `boolean` | `true` | 是否内嵌展示 |
| title | `string` | - | 弹窗模式下的标题 |
| builderMode | `'simple' \| 'full'` | `'full'` | 构建器模式 |
| showANDOR | `boolean` | - | 简易模式下是否显示 AND/OR 切换 |
| showNot | `boolean` | - | 是否显示"非"按钮 |
| draggable | `boolean` | `true` | 是否可拖拽 |
| searchable | `boolean` | - | 字段是否可搜索 |
| selectMode | `'list' \| 'tree' \| 'chained'` | `'list'` | 字段选择模式 |
| formula | `object` | - | 公式编辑器配置 |
| showIf | `boolean` | - | 是否开启条件启用设置 |
| disabled | `boolean` | - | 是否禁用 |

## ConditionField 字段配置

### 文本类型
```tsx
{
  label: '姓名',
  name: 'name',
  type: 'text',
  placeholder: '请输入姓名',
  operators: ['equal', 'not_equal', 'like', 'not_like'],
  defaultOp: 'equal',
}
```

### 数字类型
```tsx
{
  label: '年龄',
  name: 'age',
  type: 'number',
  minimum: 0,
  maximum: 150,
  step: 1,
  operators: ['equal', 'not_equal', 'greater', 'less', 'between'],
  defaultOp: 'equal',
}
```

### 日期类型
```tsx
{
  label: '创建日期',
  name: 'createDate',
  type: 'date',
  format: 'YYYY-MM-DD',
  inputFormat: 'YYYY-MM-DD',
}
```

### 选择器类型
```tsx
{
  label: '状态',
  name: 'status',
  type: 'select',
  options: [
    { label: '启用', value: 'active' },
    { label: '禁用', value: 'inactive' },
  ],
  searchable: true,
}
```

### 自定义类型
```tsx
{
  label: '自定义',
  type: 'custom',
  name: 'custom',
  value: {
    type: 'input-color'  // 任意 Amis 输入组件
  },
  defaultOp: 'equal',
  operators: ['equal', 'not_equal'],
}
```

## 使用模式

### 完整模式（默认）
支持嵌套条件组，适合复杂查询条件：

```tsx
<ConditionBuilder
  fields={fields}
  builderMode="full"
  draggable
/>
```

### 简易模式
只支持单层条件，适合简单查询：

```tsx
<ConditionBuilder
  fields={fields}
  builderMode="simple"
  showANDOR  // 显示 AND/OR 切换
/>
```

### 弹窗模式
表单区域较窄时使用：

```tsx
<ConditionBuilder
  fields={fields}
  embed={false}
  title="条件组合设置"
  pickerIcon={{
    type: 'icon',
    icon: 'edit',
    className: 'w-4 h-4'
  }}
/>
```

## 返回值格式

```typescript
type ConditionValue = {
  id?: string
  conjunction: 'and' | 'or'  // 条件组合方式
  children: Array<{
    id?: string
    left: {
      type: 'field'
      field: string  // 字段名
    }
    op: string  // 操作符
    right: any  // 右侧值
  }>
}
```

示例：
```json
{
  "conjunction": "and",
  "children": [
    {
      "left": { "type": "field", "field": "id" },
      "op": "equal",
      "right": 100
    },
    {
      "left": { "type": "field", "field": "name" },
      "op": "like",
      "right": "张三"
    }
  ]
}
```

## Ref 方法

```tsx
const ref = useRef<ConditionBuilderRef>(null)

// 获取当前值
const value = ref.current?.getValue()

// 设置值
ref.current?.setValue(newValue)
```

## 在 CRUD filter 中使用

这个组件主要用于 CRUD 组件的 filter 表单中的 `condition-builder` 字段：

```tsx
<Form>
  <ConditionBuilder
    name="__filter"
    fields={[
      { label: 'ID', name: 'id', type: 'number' },
      { label: '名称', name: 'name', type: 'text' },
    ]}
  />
</Form>
```

## 注意事项

1. 这个组件依赖 `amis` 包，确保已正确安装
2. 字段配置要根据实际业务需求定义
3. 复杂的嵌套查询建议使用完整模式
4. 在窄屏或移动端建议使用非内嵌模式
