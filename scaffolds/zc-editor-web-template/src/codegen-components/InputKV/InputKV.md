# InputKV 组件

一个支持键值对输入的 React 组件，支持拖拽排序、重复键检查、自定义 value 组件等功能。

## 基本用法

```tsx
import { InputKV } from '@/components/InputKV'

function BasicExample() {
  const [value, setValue] = useState({})

  return (
    <InputKV
      value={value}
      onChange={setValue}
      keyPlaceholder="请输入键"
      valuePlaceholder="请输入值"
    />
  )
}
```

## 自定义 Value 组件

### 使用 TextArea 作为 Value 输入

```tsx
import { Input } from 'antd'
import { InputKV } from '@/components/InputKV'

const { TextArea } = Input

// 自定义 TextArea 组件
const CustomTextArea = ({ value, onChange, placeholder }) => (
  <TextArea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={3}
    autoSize={{ minRows: 2, maxRows: 6 }}
  />
)

function TextAreaExample() {
  const [value, setValue] = useState({})

  return (
    <InputKV
      value={value}
      onChange={setValue}
      valueComponent={CustomTextArea}
      keyPlaceholder="配置项"
      valuePlaceholder="请输入配置内容"
    />
  )
}
```

### 使用 Select 作为 Value 输入

```tsx
import { Select } from 'antd'
import { InputKV } from '@/components/InputKV'

// 自定义 Select 组件
const CustomSelect = ({ value, onChange, placeholder }) => (
  <Select
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{ width: '100%' }}
    options={[
      { label: '选项1', value: 'option1' },
      { label: '选项2', value: 'option2' },
      { label: '选项3', value: 'option3' },
    ]}
  />
)

function SelectExample() {
  const [value, setValue] = useState({})

  return (
    <InputKV
      value={value}
      onChange={setValue}
      valueComponent={CustomSelect}
      keyPlaceholder="属性名"
      valuePlaceholder="请选择值"
    />
  )
}
```

### 使用 InputNumber 作为 Value 输入

```tsx
import { InputNumber } from 'antd'
import { InputKV } from '@/components/InputKV'

// 自定义 InputNumber 组件
const CustomInputNumber = ({ value, onChange, placeholder }) => (
  <InputNumber
    value={value ? Number(value) : undefined}
    onChange={(val) => onChange(val?.toString() || '')}
    placeholder={placeholder}
    style={{ width: '100%' }}
    min={0}
    max={100}
  />
)

function NumberExample() {
  const [value, setValue] = useState({})

  return (
    <InputKV
      value={value}
      onChange={setValue}
      valueComponent={CustomInputNumber}
      keyPlaceholder="参数名"
      valuePlaceholder="请输入数值"
    />
  )
}
```

### 使用 DatePicker 作为 Value 输入

```tsx
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { InputKV } from '@/components/InputKV'

// 自定义 DatePicker 组件
const CustomDatePicker = ({ value, onChange, placeholder }) => (
  <DatePicker
    value={value ? dayjs(value) : null}
    onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
    placeholder={placeholder}
    style={{ width: '100%' }}
  />
)

function DateExample() {
  const [value, setValue] = useState({})

  return (
    <InputKV
      value={value}
      onChange={setValue}
      valueComponent={CustomDatePicker}
      keyPlaceholder="日期字段"
      valuePlaceholder="请选择日期"
    />
  )
}
```

## 完整示例

```tsx
import React, { useState } from 'react'
import { Input, Select, InputNumber, DatePicker, Switch, Card, Space } from 'antd'
import { InputKV } from '@/components/InputKV'
import dayjs from 'dayjs'

const { TextArea } = Input

// 不同类型的 Value 组件
const valueComponents = {
  text: ({ value, onChange, placeholder }) => (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  textarea: ({ value, onChange, placeholder }) => (
    <TextArea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      autoSize={{ minRows: 2, maxRows: 4 }}
    />
  ),
  select: ({ value, onChange, placeholder }) => (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: '100%' }}
      options={[
        { label: 'Production', value: 'prod' },
        { label: 'Development', value: 'dev' },
        { label: 'Testing', value: 'test' },
      ]}
    />
  ),
  number: ({ value, onChange, placeholder }) => (
    <InputNumber
      value={value ? Number(value) : undefined}
      onChange={(val) => onChange(val?.toString() || '')}
      placeholder={placeholder}
      style={{ width: '100%' }}
    />
  ),
  date: ({ value, onChange, placeholder }) => (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
      placeholder={placeholder}
      style={{ width: '100%' }}
    />
  ),
}

function CompleteExample() {
  const [componentType, setComponentType] = useState('text')
  const [value, setValue] = useState({})
  const [draggable, setDraggable] = useState(true)

  return (
    <div style={{ padding: '20px' }}>
      <Card title="InputKV 组件演示" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>Value 组件类型：</label>
            <Select
              value={componentType}
              onChange={setComponentType}
              style={{ width: 200, marginLeft: 8 }}
              options={[
                { label: '文本输入框', value: 'text' },
                { label: '多行文本框', value: 'textarea' },
                { label: '下拉选择', value: 'select' },
                { label: '数字输入', value: 'number' },
                { label: '日期选择', value: 'date' },
              ]}
            />
          </div>
          
          <div>
            <label>是否可拖拽：</label>
            <Switch
              checked={draggable}
              onChange={setDraggable}
              style={{ marginLeft: 8 }}
            />
          </div>

          <div style={{ border: '1px solid #d9d9d9', padding: '16px', borderRadius: '6px' }}>
            <InputKV
              value={value}
              onChange={setValue}
              valueComponent={valueComponents[componentType]}
              draggable={draggable}
              keyPlaceholder="请输入键"
              valuePlaceholder="请输入值"
            />
          </div>

          <div>
            <strong>当前值：</strong>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default CompleteExample
```

## API

### InputKVProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | `Record<string, string>` | `{}` | 键值对数据 |
| onChange | `(value: Record<string, string>) => void` | - | 值变化回调 |
| defaultValue | `string` | `''` | 新增项的默认值 |
| draggable | `boolean` | `true` | 是否可拖拽 |
| keyPlaceholder | `string` | `'Key'` | 键的占位符 |
| valuePlaceholder | `string` | `'Value'` | 值的占位符 |
| valueComponent | `React.ComponentType<ValueComponentProps>` | - | 自定义 value 组件 |
| className | `string` | `''` | CSS类名 |
| style | `React.CSSProperties` | - | 内联样式 |

### ValueComponentProps

自定义 value 组件需要实现的接口：

```tsx
interface ValueComponentProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}
```

### InputKVRef

通过 ref 可以访问的方法：

| 方法 | 类型 | 说明 |
| --- | --- | --- |
| getValue | `() => Record<string, string>` | 获取当前值 |
| setValue | `(value: Record<string, string>) => void` | 设置值 |
| addItem | `() => void` | 添加项 |
| clear | `() => void` | 清空所有项 |

## 特性

- ✅ 支持键值对的增删改
- ✅ 支持拖拽排序（可配置）
- ✅ 重复键检查和提示
- ✅ 自定义 value 组件
- ✅ 响应式设计，占满父级容器
- ✅ TypeScript 支持
- ✅ 完整的 ref API