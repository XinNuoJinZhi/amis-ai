# Amis 组件 → Wot UI 组件对照表

以下是 Amis 高频组件到 Wot UI 组件（`wd-*` 前缀）的一一映射。遵循：**除非明确对照不上，否则都用 Wot UI 的组件**。

## 基础输入类

| Amis type | Wot UI | 关键属性翻译 |
|-----------|--------|-------------|
| `input-text` | `<wd-input>` | `label`→`label`，`placeholder`→`placeholder`，`value`→`v-model` |
| `input-number` | `<wd-input-number>` | `min/max/step` 直通 |
| `input-password` | `<wd-input show-password>` | 同上 + show-password |
| `textarea` | `<wd-textarea>` | `maxRows`→`autosize: { maxRows: N }` |
| `select` | `<wd-select>` | `options: [{label,value}]` 格式不变 |
| `radios` | `<wd-radio-group>` + `<wd-radio>` | 遍历 options |
| `checkboxes` | `<wd-checkbox-group>` + `<wd-checkbox>` | 同上 |
| `switch` | `<wd-switch>` | `value`→`v-model` |
| `date`/`datetime` | `<wd-datetime-picker>` | `format`→`format-value`，`type="date"/"datetime"` |
| `input-file` | `<wd-upload>` | `receiver`→`action`，multiple 直通 |

## 数据展示类

| Amis type | Wot UI | 说明 |
|-----------|--------|------|
| `table` | `<wd-table>` | `columns` → `<wd-table-col>` 列表 |
| `list` | `<wd-cell-group>` + `<wd-cell>` | 每项一个 cell |
| `cards` | `<wd-cell-group>` + 自定义模板 | Wot 无直接 cards，用 cell + slot |
| `tag` | `<wd-tag>` | `label`→`type` 或默认文本 |
| `image` | `<wd-img>` | `src` 直通 |
| `avatar` | `<wd-img shape="circle">` | Wot 无专属 avatar 组件 |
| `property` | `<wd-cell-group>` | 定义列表用 cell 替代 |

## 容器/布局类

| Amis type | Wot UI / Vue |
|-----------|-------------|
| `container` | `<view class="...">` |
| `grid` | `<view class="flex">` + 子元素 `flex: N` |
| `hbox` | `<view class="flex flex-row">` |
| `vbox` | `<view class="flex flex-col">` |
| `panel` | `<wd-cell-group>` 或 `<view class="card">` |
| `tabs` | `<wd-tabs>` + `<wd-tab :name="...">` |
| `collapse` | `<wd-collapse>` + `<wd-collapse-item>` |

## 反馈类

| Amis type | Wot UI |
|-----------|--------|
| `dialog` | `<wd-popup position="center">` 或 `<wd-dialog>` |
| `drawer` | `<wd-popup position="right">` |
| `alert` | `<wd-message>` 静态展示 / `uni.showToast` |
| `toast` | `uni.showToast({ title, icon })` |

## 动作类

| Amis type | Wot UI |
|-----------|--------|
| `button` | `<wd-button>`，`level="primary"` / `type="success"` 等 |
| `button-toolbar` | `<view class="flex gap-2">` + 多个 `<wd-button>` |
| `dropdown-button` | `<wd-dropdown-menu>` + `<wd-dropdown-item>` |

## Wot UI 没有的组件（需要自己实现或降级）

- `markdown` → 用 `<view v-html="renderMarkdown(text)">`（引入 marked 库）
- `chart` → UniApp H5 端用 ECharts 或 uchart
- `map` → UniApp 原生 `<map>` 组件
- `tree`（树形选择）→ Wot UI 没有成熟方案，建议自己用 collapse 嵌套实现

## 关键语法差异

### v-model 用法
Wot UI 全用 `v-model` 双向绑定，不要用 Amis 的 `value="xxx"` + event 模式：
```vue
<!-- ❌ 错 -->
<wd-input :value="name" @input="name = $event" />

<!-- ✅ 对 -->
<wd-input v-model="name" />
```

### 表单校验
Wot UI 的表单校验在 `<wd-form>` 级别：
```vue
<wd-form ref="formRef" :model="formData" :rules="rules">
  <wd-input prop="name" v-model="formData.name" />
</wd-form>
```
校验：`formRef.value.validate()` 返回 Promise。

### 事件命名
Wot UI 事件 kebab-case：`@click`、`@change`、`@confirm`、`@cancel`。
