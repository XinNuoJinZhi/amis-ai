---
name: ui-antd
description: Ant Design v5（React）组件库映射规则和最佳实践
kind: ui
ui_libs: [antd]
requires: [_common]
priority: 30
---

# Skill: ui-antd

把 Amis 组件翻译成 **Ant Design v5 for React** 组件的映射表和使用约束。
前提：当前任务 `tech_stack = react`。

## 依赖引入

```json
{
  "dependencies": {
    "antd": "^5.20.0",
    "@ant-design/icons": "^5.4.0"
  }
}
```

在 `src/main.tsx` 顶层包 `<ConfigProvider>`（可选，用于主题定制）：

```tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

<ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
  <App />
</ConfigProvider>
```

**不要**再手动 import `antd/dist/*.css`；v5 已迁移到 CSS-in-JS。

## Amis → antd 组件对照

| Amis              | antd                     |
|-------------------|--------------------------|
| `input-text`      | `<Input />`              |
| `input-number`    | `<InputNumber />`        |
| `textarea`        | `<Input.TextArea />`     |
| `select`          | `<Select />`             |
| `radio(s)`        | `<Radio.Group />`        |
| `checkbox(es)`    | `<Checkbox.Group />`     |
| `switch`          | `<Switch />`             |
| `date` / `datetime` | `<DatePicker />`       |
| `button`          | `<Button />`             |
| `form`            | `<Form />` + `Form.Item` |
| `crud` / `table`  | `<Table />` + `<Pagination />` |
| `dialog` / `drawer` | `<Modal />` / `<Drawer />` |
| `page`            | `<Layout />` + 业务容器 |
| `tabs`            | `<Tabs />`               |
| `tag`             | `<Tag />`                |
| `tooltip`         | `<Tooltip />`            |

## 表单最佳实践

```tsx
const [form] = Form.useForm();
<Form form={form} onFinish={onSubmit} layout="vertical">
  <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Button type="primary" htmlType="submit">提交</Button>
</Form>
```

- 表单校验走 `rules` + `Form.Item.rules`，不要自己写 onChange + 布尔状态
- 复杂联动用 `Form.useWatch` 监听某个字段

## Table 最佳实践

- 列配置用 `columns` 数组，`dataIndex` + `render` 实现自定义单元格
- 分页：`<Table pagination={{ current, pageSize, total, onChange }} />` 受控
- 远程数据：放 `useEffect` 或 TanStack Query 里，刷新时 set `dataSource`

## 强约束

- 必须用 antd v5（v4 已停维护）
- 禁止同时引入其他 UI 库（arco/element/...）
- icons 统一用 `@ant-design/icons`，不用 font-awesome 等
- 主题定制走 `ConfigProvider.theme`，**不要**魔改 less 变量
