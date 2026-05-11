# Combo 组合输入组件

一个功能强大的动态表单组合组件，支持单选/多选、拖拽排序、多行布局和数据扁平化等特性。

## 🚀 特性

- ✅ **单选/多选模式**: 支持单个对象或对象数组
- ✅ **拖拽排序**: 支持通过拖拽调整项目顺序
- ✅ **多行布局**: 支持标题和输入框分行显示
- ✅ **数据扁平化**: 单字段多选时可扁平化为简单值数组
- ✅ **动态字段**: 支持自定义渲染（render）输入控件
- ✅ **最大项数限制**: 可设置最大项数
- ✅ **完全可控**: 支持受控和非受控模式
- ✅ **TypeScript**: 完整的类型定义

## 📦 安装

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities antd
```

## 🎯 基本用法

### 单选模式

```tsx
import { Combo } from './components/Combo'

const fields = [
  {
    key: 'name',
    label: '姓名',
    render: ({ value, onChange, disabled }) => (
      <input
        type="text"
        placeholder="请输入姓名"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    ),
  },
  {
    key: 'age',
    label: '年龄',
    render: ({ value, onChange, disabled }) => (
      <input
        type="number"
        placeholder="请输入年龄"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        disabled={disabled}
      />
    ),
  },
]

function App() {
  const [value, setValue] = useState({ name: '', age: 0 })

  return (
    <Combo
      fields={fields}
      value={value}
      onChange={setValue}
    />
  )
}
```

### 多选模式

```tsx
const [values, setValues] = useState([
  { name: '张三', age: 25 },
  { name: '李四', age: 30 }
])

return (
  <Combo
    fields={fields}
    multiple={true}
    value={values}
    onChange={setValues}
  />
)
```

## 📋 API 参考

### ComboProps

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `Record<string, unknown>` \| `Array<Record<string, unknown>>` \| `Array<unknown>` | - | 组件值 |
| `onChange` | `(value: ...) => void` | - | 值变化回调 |
| `fields` | `ComboFieldConfig[]` | - | 字段配置数组 |
| `multiple` | `boolean` | `false` | 是否支持多选 |
| `draggable` | `boolean` | `false` | 是否支持拖拽排序（需要 `multiple=true`） |
| `multiLine` | `boolean` | `false` | 是否每条数据的标题和输入框分行显示 |
| `flat` | `boolean` | `false` | 多选且单字段时，是否扁平化为简单值数组 |
| `maxItems` | `number` | - | 最大项数限制 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `className` | `string` | - | 自定义样式类名 |
| `style` | `React.CSSProperties` | - | 自定义样式 |

### ComboFieldConfig

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `key` | `string` | - | 字段的唯一标识 |
| `label` | `string` | - | 字段显示标题 |
| `render` | `(args) => React.ReactNode` | - | 使用 React 组件渲染输入控件 |
| `required` | `boolean` | `false` | 是否必填 |
| `disabled` | `boolean` | `false` | 是否禁用 |

### ComboRef

通过 `ref` 可以访问以下方法：

| 方法 | 类型 | 说明 |
|------|------|------|
| `getValue` | `() => ...` | 获取当前值 |
| `setValue` | `(value: ...) => void` | 设置值 |
| `addItem` | `() => void` | 添加新项（仅多选模式） |
| `removeItem` | `(id: string) => void` | 删除指定项 |
| `clear` | `() => void` | 清空所有项 |

## 🎨 高级功能

### 拖拽排序

启用拖拽功能需要同时设置 `multiple={true}` 和 `draggable={true}`：

```tsx
<Combo
  fields={fields}
  multiple={true}
  draggable={true}
  value={values}
  onChange={setValues}
/>
```

### 多行布局

使用 `multiLine` 参数可以让标题和输入框分行显示，适合复杂表单：

```tsx
<Combo
  fields={fields}
  multiple={true}
  multiLine={true}
  value={values}
  onChange={setValues}
/>
```

### 数据扁平化

当多选模式下只有一个字段时，可以使用 `flat` 参数将数据扁平化：

```tsx
const singleField = [
  {
    key: 'text',
    label: '文本',
    render: ({ value, onChange, disabled }) => (
      <input type="text" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
]

// 不使用 flat: value = [{ text: '值1' }, { text: '值2' }]
// 使用 flat: value = ['值1', '值2']
<Combo
  fields={singleField}
  multiple={true}
  flat={true}
  value={['值1', '值2']}
  onChange={setValues}
/>
```

### 自定义渲染控件（render）

通过 `render` 可自定义任何输入控件：

```tsx
const customFields = [
  {
    key: 'name',
    label: '姓名',
    render: ({ value, onChange, disabled }) => (
      <input className="custom-input" type="text" placeholder="请输入姓名" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
  {
    key: 'gender',
    label: '性别',
    render: ({ value, onChange, disabled }) => (
      <select value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">请选择</option>
        <option value="male">男</option>
        <option value="female">女</option>
      </select>
    ),
  },
  {
    key: 'description',
    label: '描述',
    render: ({ value, onChange, disabled }) => (
      <textarea rows={3} placeholder="请输入描述" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
]
```

## 🎯 使用场景

### 1. 联系人管理

```tsx
const contactFields = [
  {
    key: 'name',
    label: '姓名',
    render: ({ value, onChange, disabled }) => (
      <input type="text" placeholder="姓名" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
  {
    key: 'phone',
    label: '电话',
    render: ({ value, onChange, disabled }) => (
      <input type="tel" placeholder="电话号码" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
  {
    key: 'email',
    label: '邮箱',
    render: ({ value, onChange, disabled }) => (
      <input type="email" placeholder="邮箱地址" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
]

<Combo
  fields={contactFields}
  multiple={true}
  draggable={true}
  multiLine={true}
  maxItems={10}
/>
```

### 2. 标签管理（扁平化）

```tsx
const tagField = [
  {
    key: 'tag',
    label: '标签',
    render: ({ value, onChange, disabled }) => (
      <input type="text" placeholder="输入标签" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
]

<Combo
  fields={tagField}
  multiple={true}
  flat={true}
  value={['React', 'TypeScript', 'Vite']}
/>
```

### 3. 配置项管理

```tsx
const configFields = [
  {
    key: 'key',
    label: '配置键',
    render: ({ value, onChange, disabled }) => (
      <input type="text" placeholder="配置键" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
  {
    key: 'value',
    label: '配置值',
    render: ({ value, onChange, disabled }) => (
      <input type="text" placeholder="配置值" value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    ),
  },
  {
    key: 'type',
    label: '类型',
    render: ({ value, onChange, disabled }) => (
      <select value={String(value || '')} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="string">字符串</option>
        <option value="number">数字</option>
        <option value="boolean">布尔值</option>
      </select>
    ),
  },
]

<Combo
  fields={configFields}
  multiple={true}
  draggable={true}
/>
```

## 🎨 样式定制

组件支持通过 `className` 和 `style` 进行样式定制：

```tsx
<Combo
  fields={fields}
  className="custom-combo"
  style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}
/>
```

### CSS 类名

- `.combo-container`: 组件根容器
- `.combo-item`: 每个组合项
- `.combo-item-multiline`: 多行模式下的组合项
- `.combo-drag-handle`: 拖拽手柄
- `.combo-remove-btn`: 删除按钮
- `.combo-add-btn`: 添加按钮

## 🔧 开发指南

### 类型定义

```typescript
import type { ComboProps, ComboRef, ComboFieldConfig } from './Combo'
```

### 受控组件

```tsx
const [value, setValue] = useState(initialValue)

<Combo
  value={value}
  onChange={setValue}
  // ... 其他属性
/>
```

### 非受控组件

```tsx
const comboRef = useRef<ComboRef>(null)

const handleGetValue = () => {
  const currentValue = comboRef.current?.getValue()
  console.log(currentValue)
}

<Combo
  ref={comboRef}
  defaultValue={initialValue}
  // ... 其他属性
/>
```

## 🐛 常见问题

### Q: 拖拽功能不生效？
A: 确保同时设置了 `multiple={true}` 和 `draggable={true}`，且数据项数量大于1。

### Q: flat 模式什么时候生效？
A: 需要同时满足：`multiple={true}`、`flat={true}` 且 `fields.length === 1`。

### Q: 如何自定义输入控件的样式？
A: 在 `html` 字符串中添加 `class` 或 `style` 属性，或通过全局CSS覆盖。

### Q: 支持哪些HTML控件？
A: 支持所有标准HTML输入控件：`input`、`select`、`textarea` 等。

## 📄 许可证

MIT License