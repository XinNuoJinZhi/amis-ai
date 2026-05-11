# InputKVS 组件

一个支持动态字段配置的键值对输入组件，支持拖拽排序、多种字段类型、数据验证等功能。

## 基本用法

```tsx
import { InputKVS } from '@/components/InputKVS'

function BasicExample() {
  const [value, setValue] = useState({})

  return (
    <InputKVS
      value={value}
      onChange={setValue}
      keyPlaceholder="请输入字段名"
    />
  )
}
```

## 动态字段配置

### 基础字段类型

```tsx
import { InputKVS, ControlItem } from '@/components/InputKVS'

function FieldTypesExample() {
  const [value, setValue] = useState({})

  const valueItems: ControlItem[] = [
    {
      type: 'input',
      name: 'description',
      label: '描述',
      placeholder: '请输入描述信息',
      required: true
    },
    {
      type: 'number',
      name: 'count',
      label: '数量',
      placeholder: '请输入数量',
      min: 0,
      max: 100,
      defaultValue: 1
    },
    {
      type: 'switch',
      name: 'enabled',
      label: '启用状态',
      defaultValue: true
    },
    {
      type: 'date',
      name: 'deadline',
      label: '截止日期',
      placeholder: '请选择日期'
    },
    {
      type: 'select',
      name: 'priority',
      label: '优先级',
      placeholder: '请选择优先级',
      options: [
        { label: '高', value: 'high' },
        { label: '中', value: 'medium' },
        { label: '低', value: 'low' }
      ]
    }
  ]

  return (
    <InputKVS
      value={value}
      onChange={setValue}
      valueItems={valueItems}
      keyPlaceholder="请输入字段名"
    />
  )
}
```

### 表单配置示例

```tsx
import { InputKVS, ControlItem } from '@/components/InputKVS'

function FormConfigExample() {
  const [formConfig, setFormConfig] = useState({})

  const fieldConfig: ControlItem[] = [
    {
      type: 'select',
      name: 'type',
      label: '字段类型',
      options: [
        { label: '文本输入', value: 'input' },
        { label: '数字输入', value: 'number' },
        { label: '开关', value: 'switch' },
        { label: '日期选择', value: 'date' },
        { label: '下拉选择', value: 'select' }
      ],
      defaultValue: 'input'
    },
    {
      type: 'input',
      name: 'label',
      label: '字段标签',
      placeholder: '请输入字段标签',
      required: true
    },
    {
      type: 'input',
      name: 'placeholder',
      label: '占位符',
      placeholder: '请输入占位符文本'
    },
    {
      type: 'switch',
      name: 'required',
      label: '必填',
      defaultValue: false
    },
    {
      type: 'switch',
      name: 'disabled',
      label: '禁用',
      defaultValue: false
    }
  ]

  return (
    <div>
      <h3>表单字段配置</h3>
      <InputKVS
        value={formConfig}
        onChange={setFormConfig}
        valueItems={fieldConfig}
        keyPlaceholder="字段名称"
        draggable={true}
        maxItems={20}
      />
      
      <div style={{ marginTop: '20px' }}>
        <h4>配置结果：</h4>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(formConfig, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

## 数据验证

```tsx
import { useRef } from 'react'
import { InputKVS, InputKVSRef } from '@/components/InputKVS'
import { Button, message } from 'antd'

function ValidationExample() {
  const [value, setValue] = useState({})
  const inputKVSRef = useRef<InputKVSRef>(null)

  const handleValidate = () => {
    if (inputKVSRef.current) {
      const result = inputKVSRef.current.validate()
      if (result.valid) {
        message.success('验证通过')
      } else {
        message.error(`验证失败: ${result.errors.join(', ')}`)
      }
    }
  }

  const handleClear = () => {
    if (inputKVSRef.current) {
      inputKVSRef.current.clear()
    }
  }

  return (
    <div>
      <InputKVS
        ref={inputKVSRef}
        value={value}
        onChange={setValue}
        valueItems={[
          {
            type: 'input',
            name: 'value',
            label: '值',
            required: true
          }
        ]}
      />
      
      <div style={{ marginTop: '10px', gap: '8px', display: 'flex' }}>
        <Button onClick={handleValidate}>验证数据</Button>
        <Button onClick={handleClear}>清空数据</Button>
      </div>
    </div>
  )
}
```

## 完整示例

```tsx
import React, { useState, useRef } from 'react'
import { InputKVS, InputKVSRef, ControlItem } from '@/components/InputKVS'
import { Card, Button, Switch, Space, message } from 'antd'

function CompleteExample() {
  const [value, setValue] = useState({})
  const [draggable, setDraggable] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const inputKVSRef = useRef<InputKVSRef>(null)

  const valueItems: ControlItem[] = [
    {
      type: 'select',
      name: 'type',
      label: '数据类型',
      options: [
        { label: '字符串', value: 'string' },
        { label: '数字', value: 'number' },
        { label: '布尔值', value: 'boolean' },
        { label: '日期', value: 'date' }
      ],
      defaultValue: 'string'
    },
    {
      type: 'input',
      name: 'defaultValue',
      label: '默认值',
      placeholder: '请输入默认值'
    },
    {
      type: 'switch',
      name: 'required',
      label: '必填',
      defaultValue: false
    },
    {
      type: 'number',
      name: 'maxLength',
      label: '最大长度',
      min: 1,
      max: 1000,
      placeholder: '请输入最大长度'
    }
  ]

  const handleAddItem = () => {
    if (inputKVSRef.current) {
      inputKVSRef.current.addItem(`field_${Date.now()}`)
    }
  }

  const handleValidate = () => {
    if (inputKVSRef.current) {
      const result = inputKVSRef.current.validate()
      if (result.valid) {
        message.success('数据验证通过')
      } else {
        message.error(`验证失败: ${result.errors.join(', ')}`)
      }
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card title="InputKVS 组件演示" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Space>
              <label>拖拽排序：</label>
              <Switch checked={draggable} onChange={setDraggable} />
              
              <label>禁用状态：</label>
              <Switch checked={disabled} onChange={setDisabled} />
            </Space>
          </div>

          <div style={{ border: '1px solid #d9d9d9', padding: '16px', borderRadius: '6px' }}>
            <InputKVS
              ref={inputKVSRef}
              value={value}
              onChange={setValue}
              valueItems={valueItems}
              draggable={draggable}
              disabled={disabled}
              keyPlaceholder="请输入字段名"
              placeholder="暂无字段配置"
              maxItems={10}
            />
          </div>

          <Space>
            <Button onClick={handleAddItem}>添加字段</Button>
            <Button onClick={handleValidate}>验证数据</Button>
            <Button onClick={() => inputKVSRef.current?.clear()}>清空数据</Button>
          </Space>

          <div>
            <strong>当前配置：</strong>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
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

### InputKVSProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | `Record<string, unknown>` | `{}` | 键值对数据 |
| onChange | `(value: Record<string, unknown>) => void` | - | 值变化回调 |
| valueItems | `ControlItem[]` | `[]` | 动态字段配置 |
| valueIsArray | `boolean` | `false` | 子级是否为数组格式 |
| keyPlaceholder | `string` | `'请输入字段名'` | 键的占位符 |
| disabled | `boolean` | `false` | 是否禁用 |
| maxItems | `number` | `50` | 最大项数 |
| className | `string` | - | CSS类名 |
| style | `React.CSSProperties` | - | 内联样式 |
| placeholder | `string` | `'暂无数据'` | 空状态占位符 |
| draggable | `boolean` | `true` | 是否支持拖拽排序 |

### ControlItem

动态字段配置项：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| type | `'input' \| 'number' \| 'switch' \| 'date' \| 'select' \| 'slider'` | 字段类型 |
| name | `string` | 字段名称 |
| label | `string` | 字段标签 |
| placeholder | `string` | 占位符 |
| options | `{ label: string; value: string \| number \| boolean }[]` | 选项（select类型） |
| min | `number` | 最小值（number类型） |
| max | `number` | 最大值（number类型） |
| defaultValue | `KVSValueType` | 默认值 |
| required | `boolean` | 是否必填 |
| disabled | `boolean` | 是否禁用 |

### InputKVSRef

通过 ref 可以访问的方法：

| 方法 | 类型 | 说明 |
| --- | --- | --- |
| getValue | `() => Record<string, unknown>` | 获取当前值 |
| setValue | `(value: Record<string, unknown>) => void` | 设置值 |
| addItem | `(key?: string) => void` | 添加项 |
| removeItem | `(key: string) => void` | 删除项 |
| clear | `() => void` | 清空所有项 |
| validate | `() => { valid: boolean; errors: string[] }` | 验证数据 |

### KVSValueType

支持的值类型：

```tsx
type KVSValueType = string | number | boolean | Dayjs | null | object | unknown[]
```

## 字段类型说明

### input - 文本输入
- 支持普通文本输入
- 可配置占位符和禁用状态

### number - 数字输入
- 支持数字输入和验证
- 可配置最小值、最大值
- 支持小数和整数

### switch - 开关
- 布尔值切换
- 可配置默认状态

### date - 日期选择
- 基于 Ant Design DatePicker
- 返回格式化的日期字符串

### select - 下拉选择
- 支持单选
- 可配置选项列表
- 支持搜索和清空

## 特性

- ✅ 支持多种字段类型（文本、数字、开关、日期、下拉选择）
- ✅ 支持拖拽排序（可配置）
- ✅ 动态字段配置
- ✅ 数据验证（空键检查、重复键检查）
- ✅ 完整的 ref API
- ✅ TypeScript 支持
- ✅ 响应式设计
- ✅ 可配置最大项数限制
- ✅ 支持禁用状态
- ✅ 优雅的交互动画

## 样式定制

组件使用 Tailwind CSS 类名，可以通过 `className` 和 `style` 属性进行样式定制：

```tsx
<InputKVS
  className="custom-kvs"
  style={{ border: '1px solid #ccc', borderRadius: '8px' }}
  // ... 其他属性
/>
```

## 注意事项

1. **键的唯一性**：组件会自动检查重复的键名并在验证时报错
2. **数据格式**：内部使用复杂的数据结构，但对外暴露简单的键值对格式
3. **拖拽功能**：只有在多条数据时才显示拖拽图标
4. **性能优化**：使用 useCallback 和 useMemo 优化渲染性能
5. **数据同步**：内部状态与外部 value 保持同步，但以内部状态为准