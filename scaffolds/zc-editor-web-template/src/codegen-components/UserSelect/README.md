# UserSelect 用户选择组件

一个基于 Ant Design 的复杂用户选择组件，支持树形部门结构和用户列表的双栏选择模式。

## 功能特性

- ✅ 支持在 Ant Design Form 中正常使用
- ✅ 左侧树形选择器显示部门结构
- ✅ 右侧列表显示对应部门的用户
- ✅ 支持搜索功能，可直接搜索用户
- ✅ 支持清除选择
- ✅ 响应式设计，适配不同屏幕尺寸
- ✅ TypeScript 支持

## 基本用法

```tsx
import { UserSelect } from '../components';
import type { UserSelectOptions } from '../components';

const options: UserSelectOptions[] = [
  {
    children: [
      {
        ref: "-1",
        label: "全部部门",
        children: [
          { label: "张三", value: "zhangsan" },
          { label: "李四", value: "lisi" }
        ]
      }
    ],
    leftOptions: [
      {
        id: -1,
        label: "全部部门",
        value: "-1",
        parentId: 0,
        children: null
      }
    ]
  }
];

function MyComponent() {
  const [selectedUser, setSelectedUser] = useState<string>();

  return (
    <UserSelect
      value={selectedUser}
      onChange={setSelectedUser}
      options={options}
      placeholder="请选择用户"
    />
  );
}
```

## 在 Form 中使用

```tsx
import { Form, Button } from 'antd';
import { UserSelect } from '../components';

function FormExample() {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('选中的用户:', values.user);
  };

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item
        label="选择用户"
        name="user"
        rules={[{ required: true, message: '请选择用户!' }]}
      >
        <UserSelect
          options={options}
          placeholder="请选择用户"
        />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
      </Form.Item>
    </Form>
  );
}
```

## API

### UserSelect Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 当前选中的值 | `string` | - |
| onChange | 选择变化时的回调 | `(value: string) => void` | - |
| options | 选项数据 | `UserSelectOptions[]` | - |
| placeholder | 占位符文本 | `string` | `'请选择用户'` |
| disabled | 是否禁用 | `boolean` | `false` |
| allowClear | 是否允许清除 | `boolean` | `true` |
| style | 自定义样式 | `React.CSSProperties` | - |
| className | 自定义类名 | `string` | - |

### 数据结构

#### UserSelectOptions

```typescript
interface UserSelectOptions {
  children: DepartmentOption[];
  leftOptions: TreeOption[];
}
```

#### DepartmentOption

```typescript
interface DepartmentOption {
  ref: string;           // 部门引用ID
  label: string;         // 部门名称
  children: UserOption[]; // 部门下的用户列表
}
```

#### UserOption

```typescript
interface UserOption {
  label: string; // 用户显示名称
  value: string; // 用户值
}
```

#### TreeOption

```typescript
interface TreeOption {
  id: string | number;           // 节点ID
  label: string;                 // 节点显示名称
  value: string;                 // 节点值
  parentId: string | number;     // 父节点ID
  children?: TreeOption[] | null; // 子节点
}
```

## 使用说明

1. **树形选择**: 点击左侧树形结构中的部门节点，右侧会显示该部门下的用户列表
2. **用户选择**: 点击右侧用户列表中的用户进行选择
3. **搜索功能**: 在搜索框中输入用户名，会显示匹配的用户列表
4. **清除选择**: 点击清除按钮可以清空当前选择

## 注意事项

- 组件依赖 Ant Design，请确保项目中已安装 `antd`
- 数据结构中的 `ref` 字段用于关联左侧树节点和右侧用户列表
- 搜索功能会在所有用户中进行模糊匹配
- 组件支持受控和非受控两种使用方式