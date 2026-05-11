# AutoFilter 自动筛选组件

模拟 Amis `autoGenerateFilter` 的 UI 交互效果，提供展开/收起功能。

## 功能特性

- ✅ 展开/收起功能（默认折叠）
- ✅ 配置默认显示的字段数量
- ✅ 响应式布局（支持配置每行列数）
- ✅ 与现有 filter 功能完全兼容

## 使用方式

### 基础用法

```tsx
import { AutoFilter } from '@/codegen-components';
import { Form, Input, Button, Space } from 'antd';

function MyComponent() {
  const [form] = Form.useForm();

  const handleSearch = () => {
    const values = form.getFieldsValue();
    // 处理搜索逻辑
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <AutoFilter
      title="查询条件"
      defaultCollapsed={true}
      defaultVisibleCount={3}
      columnsPerRow={3}
      actions={
        <Space>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
      }
    >
      <Form.Item name="name" label="姓名">
        <Input placeholder="请输入" />
      </Form.Item>
      <Form.Item name="age" label="年龄">
        <Input placeholder="请输入" />
      </Form.Item>
      <Form.Item name="email" label="邮箱">
        <Input placeholder="请输入" />
      </Form.Item>
      <Form.Item name="phone" label="电话">
        <Input placeholder="请输入" />
      </Form.Item>
      <Form.Item name="address" label="地址">
        <Input placeholder="请输入" />
      </Form.Item>
    </AutoFilter>
  );
}
```

### 替换自动生成的 filter

当 `autoGenerateFilter: true` 时，code-gen 会生成如下代码：

```tsx
// 原始生成的代码
<Card title="查询条件">
  <Form layout="inline" form={formRef}>
    <Form.Item name="name" label="姓名">
      <Input placeholder="请输入" />
    </Form.Item>
    <Form.Item name="age" label="年龄">
      <Input placeholder="请输入" />
    </Form.Item>
    // ... 更多字段
  </Form>
  <div className="dsl-card-footer">
    <Space>
      <Button>重置</Button>
      <Button type="primary" onClick={handleSearch}>查询</Button>
    </Space>
  </div>
</Card>
```

替换为：

```tsx
// 使用 AutoFilter 组件
<AutoFilter
  title="查询条件"
  defaultCollapsed={true}
  defaultVisibleCount={3}
  columnsPerRow={3}
  actions={
    <Space>
      <Button>重置</Button>
      <Button type="primary" onClick={handleSearch}>查询</Button>
    </Space>
  }
>
  <Form.Item name="name" label="姓名">
    <Input placeholder="请输入" />
  </Form.Item>
  <Form.Item name="age" label="年龄">
    <Input placeholder="请输入" />
  </Form.Item>
  // ... 更多字段
</AutoFilter>
```

注意：
1. 移除外层的 `<Card>` 和 `<div className="dsl-card-footer">`
2. 将 `Form.Item` 作为 `AutoFilter` 的 children
3. 将操作按钮作为 `actions` prop 传入

## API

### AutoFilterProps

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 卡片标题 | `string` | `'查询条件'` |
| children | 子元素（表单字段） | `React.ReactNode` | - |
| actions | 操作按钮区域 | `React.ReactNode` | - |
| defaultCollapsed | 默认是否折叠 | `boolean` | `true` |
| defaultVisibleCount | 默认显示的字段数量（未展开时） | `number` | `3` |
| columnsPerRow | 每行显示的字段数量 | `number` | `3` |

## 与 Amis 的差异

| 特性 | Amis | AutoFilter |
| --- | --- | --- |
| 展开/收起 | ✅ | ✅ |
| 默认折叠 | ✅ | ✅ (可配置) |
| 默认显示字段数 | 固定 | ✅ (可配置) |
| 每行列数 | 自适应 | ✅ (可配置) |
| 响应式 | ✅ | ✅ |

## 注意事项

1. **不影响现有 filter 功能**：AutoFilter 只是 UI 层的封装，不影响数据逻辑
2. **Form 布局**：子元素应该是 `Form.Item`，无需设置 Form 的 `layout="inline"`
3. **操作按钮**：通过 `actions` prop 传入，会自动添加分隔线

## 示例截图

### 折叠状态
```
┌─ 查询条件 ────────────────────────── 展开 (2 项) ┐
│ [姓名] [年龄] [邮箱]                                │
│ ─────────────────────────────────────────────────│
│                              [重置] [查询]         │
└──────────────────────────────────────────────────┘
```

### 展开状态
```
┌─ 查询条件 ────────────────────────── 收起 ┐
│ [姓名] [年龄] [邮箱]                      │
│ [电话] [地址]                              │
│ ──────────────────────────────────────── │
│                         [重置] [查询]     │
└───────────────────────────────────────────┘
```
