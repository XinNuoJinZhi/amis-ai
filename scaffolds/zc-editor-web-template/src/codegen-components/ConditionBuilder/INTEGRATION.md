# ConditionBuilder 组件集成指南

## ✅ 已完成的工作

我已经在 `apps/zc_editor/src/codegen-components/` 中创建了 `ConditionBuilder` 组件：

```
src/codegen-components/ConditionBuilder/
├── ConditionBuilder.tsx          # 主组件文件
├── ConditionBuilder.example.tsx  # 使用示例
├── index.ts                       # 导出文件
└── README.md                      # 详细文档
```

## 🎯 组件特点

这个组件是对 Amis `condition-builder` 的简单封装，具有以下特点：

1. **直接使用 Amis 原生组件** - 不需要重新实现复杂的条件构建器逻辑
2. **完全兼容 Amis 配置** - 支持 Amis condition-builder 的所有属性
3. **TypeScript 类型支持** - 完整的类型定义
4. **符合项目规范** - 与其他自定义组件保持一致的 API 设计

## 📖 如何使用

### 在表单中使用

```tsx
import { ConditionBuilder } from '@/codegen-components'

function MyFilterForm() {
  const [filterValue, setFilterValue] = useState()

  return (
    <ConditionBuilder
      fields={[
        {
          label: 'ID',
          name: 'id',
          type: 'number',
          operators: [
            { label: '等于', value: 'equal' },
            { label: '不等于', value: 'not_equal' },
            { label: '范围匹配', value: 'between' },
            { label: '大于', value: 'greater' },
            { label: '小于', value: 'less' },
          ],
          defaultOp: 'equal',
        },
        {
          label: 'a1',
          name: 'a1',
          type: 'text',
        },
        {
          label: 'a2',
          name: 'a2',
          type: 'text',
        },
      ]}
      value={filterValue}
      onChange={setFilterValue}
      searchable
    />
  )
}
```

### 在 CRUD filter 中使用

对于你的 test.json 中的 condition-builder：

```json
{
  "type": "condition-builder",
  "label": "组合查询",
  "name": "__filter",
  "fields": [
    {
      "type": "custom",
      "label": "ID",
      "name": "id",
      "value": {
        "type": "input-number",
        "required": false,
        "placeholder": "请输入",
        "big": true
      },
      "defaultOp": "equal",
      "operators": [...]
    }
  ]
}
```

可以直接在 zc_editor 中渲染，Amis 会自动使用原生的 condition-builder。

## 🔧 适用场景

这个组件主要用于以下场景：

1. **CRUD 的 filter 表单** - 用于构建复杂查询条件
2. **高级搜索功能** - 允许用户自定义搜索条件
3. **数据筛选** - 动态构建筛选规则
4. **规则引擎** - 构建业务规则条件

## ⚠️ 注意事项

1. **依赖 Amis**：这个组件依赖 `amis` 包的 `render` 函数
2. **仅在 zc_editor 中使用**：因为使用了 Amis 渲染，所以只能在 zc_editor（基于 Amis 的编辑器）中使用
3. **不在 code-gen 中转换**：如果需要生成脱离 Amis 的独立代码，则需要在 code-gen 中实现完整的解析器

## 🚀 下一步

如果你需要在生成的独立代码中也支持 condition-builder，那需要：

1. 在 `packages/code-gen/src/parser/components/` 中创建 `condition-builder` 解析器
2. 实现一个完整的条件构建器 UI 组件（工作量较大）
3. 或者使用现有的开源库（如 react-querybuilder）

目前的方案是最快速和实用的，适合在编辑器中使用。

## 📚 更多信息

详细使用说明请查看：
- [README.md](./README.md) - 完整 API 文档
- [ConditionBuilder.example.tsx](./ConditionBuilder.example.tsx) - 使用示例
- [Amis 官方文档](https://aisuda.bce.baidu.com/amis/zh-CN/components/form/condition-builder) - condition-builder 组件文档
