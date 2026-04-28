---
name: ui-element-plus
description: Element Plus（Vue 3）组件库映射规则
kind: ui
ui_libs: [element-plus]
requires: [_common]
priority: 30
---

# Skill: ui-element-plus

把 Amis 组件翻译成 **Element Plus** 组件的映射表和使用约束。
前提：当前任务 `tech_stack = vue3`。

## 依赖引入

```json
{
  "dependencies": {
    "element-plus": "^2.8.0",
    "@element-plus/icons-vue": "^2.3.0"
  }
}
```

在 `src/main.ts`：

```ts
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

app.use(ElementPlus, { locale: zhCn });
```

也可用按需导入（`unplugin-vue-components` + `unplugin-auto-import`），减少包体积。

## Amis → Element Plus 组件对照

| Amis              | Element Plus                 |
|-------------------|------------------------------|
| `input-text`      | `<el-input />`               |
| `textarea`        | `<el-input type="textarea" />` |
| `input-number`    | `<el-input-number />`        |
| `select`          | `<el-select />` + `<el-option />` |
| `radios`          | `<el-radio-group />`         |
| `checkboxes`      | `<el-checkbox-group />`      |
| `switch`          | `<el-switch />`              |
| `date` / `datetime` | `<el-date-picker />`       |
| `button`          | `<el-button />`              |
| `form`            | `<el-form>` + `<el-form-item>` |
| `crud` / `table`  | `<el-table>` + `<el-pagination>` |
| `dialog` / `drawer` | `<el-dialog>` / `<el-drawer>` |
| `tabs`            | `<el-tabs>` + `<el-tab-pane>` |
| `tag`             | `<el-tag />`                 |
| `tooltip`         | `<el-tooltip />`             |

## 表单最佳实践

```vue
<el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="form.username" />
  </el-form-item>
  <el-button type="primary" @click="submit">提交</el-button>
</el-form>
```

- 校验：`rules` 对象 + `formRef.value.validate()`
- 必填字段 `prop` 必须和 `rules` 的 key 对齐

## 强约束

- 必须 Element **Plus**（element-ui 是 Vue 2 版本，不通用）
- icons 用 `@element-plus/icons-vue`
- 主题用 CSS 变量覆盖（`:root { --el-color-primary: #xxx }`），不手写 SCSS 变量
- 禁止和其他 UI 库混用
