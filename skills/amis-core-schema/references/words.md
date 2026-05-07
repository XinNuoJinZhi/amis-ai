---
component: words
amis_version: v6.0.0
---

# words

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"words"` | 是 |  |
| `limit` | `number` | 否 | 展示限制, 为0时也无限制 |
| `expendButtonText` | `string` | 否 | 展示文字 |
| `expendButton` | `SchemaObject` | 否 | 展示文字 |
| `collapseButtonText` | `string` | 否 | 收起文字 |
| `collapseButton` | `SchemaObject` | 否 | 展示文字 |
| `words` | `Words` | 是 | tags数据 |
| `inTag` | `boolean \| TagSchema` | 否 | useTag 当数据是数组时，是否使用tag的方式展示 |
| `delimiter` | `string` | 否 | 分割符 |
