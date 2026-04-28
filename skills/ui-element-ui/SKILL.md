---
name: ui-element-ui
description: Element UI（Vue 2）组件库映射规则，遗留项目适用
kind: ui
ui_libs: [element-ui]
requires: [_common]
priority: 30
---

# Skill: ui-element-ui

把 Amis 组件翻译成 **Element UI**（Vue 2 时代）组件的映射表。
前提：当前任务 `tech_stack = vue2`。

## 依赖引入

```json
{
  "dependencies": {
    "element-ui": "^2.15.14"
  }
}
```

在 `src/main.js`：

```js
import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);
```

## Amis → Element UI 组件对照

与 Element Plus 基本一致，组件名变化：

| Amis              | Element UI                   |
|-------------------|------------------------------|
| `input-text`      | `<el-input />`               |
| `select`          | `<el-select>` + `<el-option>` |
| `form`            | `<el-form>` + `<el-form-item>` |
| `crud` / `table`  | `<el-table>` + `<el-pagination>` |
| `dialog`          | `<el-dialog>`                |

差异点：
- icon 用 `<i class="el-icon-xxx" />`（没有独立 icons 包）
- Vue 2 Options API，表单通过 `this.$refs.form.validate()` 校验

## 强约束

- 仅在 Vue 2 项目下用，Vue 3 请换 `ui-element-plus`
- 禁止混用 Element Plus 的 API/组件名
