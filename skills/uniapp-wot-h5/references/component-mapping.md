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
| `toast` | `uni.showToast({ title, icon })`（首选，无需 import） |

> ⚠️ **toast 陷阱（见过的事故）**：`wot-design-uni` **没有** `toast` 这个裸导出。
> ❌ `import { toast } from 'wot-design-uni'` —— 浏览器会报 `does not provide an export named 'toast'` 并白屏。
> ✅ 推荐直接用 `uni.showToast({ title, icon })`，不需要任何 import。
> ✅ 想要 Wot UI 原生样式：在模板里放 `<wd-toast />` + `import { useToast } from 'wot-design-uni'`（注意是 `useToast`，不是 `toast`）。
> 同理：`useNotify` / `useMessage` 也是组合式 API，都不要写成裸函数 import。

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

## 📋 Wot UI 1.6.0 **真实存在**的组件清单（权威）

使用任何**不在下面列表**里的 `<wd-xxx>` 标签，编译后浏览器会立刻报
`[plugin:vite:import-analysis] Failed to resolve import "wot-design-uni/components/wd-xxx/wd-xxx.vue"`。

**反馈/提示**：wd-toast / wd-notify / wd-message-box / wd-status-tip / wd-loading / wd-loadmore / wd-notice-bar / wd-overlay

**按钮/动作**：wd-button / wd-fab / wd-sort-button / wd-action-sheet

**表单**：wd-form / wd-form-item / wd-input / wd-input-number / wd-textarea / wd-checkbox / wd-checkbox-group / wd-radio / wd-radio-group / wd-switch / wd-rate / wd-slider / wd-search / wd-password-input / wd-signature / wd-slide-verify / wd-upload / wd-number-keyboard / wd-keyboard

**选择器**：wd-picker / wd-picker-view / wd-col-picker / wd-select-picker / wd-datetime-picker / wd-datetime-picker-view / wd-calendar / wd-calendar-view / wd-segmented

**数据展示**：wd-cell / wd-cell-group / wd-card / wd-table / wd-table-col / wd-tag / wd-text / wd-img / wd-img-cropper / wd-video-preview / wd-badge / wd-avatar / wd-avatar-group / wd-circle / wd-count-down / wd-count-to / wd-progress / wd-skeleton / wd-watermark

**布局/导航**：wd-row / wd-col / wd-grid / wd-grid-item / wd-divider / wd-gap / wd-navbar / wd-navbar-capsule / wd-tabbar / wd-tabbar-item / wd-tab / wd-tabs / wd-sidebar / wd-sidebar-item / wd-sticky / wd-sticky-box / wd-index-bar / wd-index-anchor / wd-collapse / wd-collapse-item / wd-drop-menu / wd-drop-menu-item / wd-pagination / wd-steps / wd-step / wd-tour

**弹层/浮层**：wd-popup / wd-popover / wd-curtain / wd-floating-panel / wd-backtop / wd-root-portal / wd-swipe-action / wd-swiper / wd-swiper-nav / wd-transition / wd-resize / wd-tooltip

**基础**：wd-icon / wd-config-provider

---

### ❌ 绝对不要用的组件（它们在 Wot UI 里**不存在**，是其他 UI 库的名字）

| ❌ 错误组件 | 真相 / 替代方案 |
|-----------|---------------|
| `<wd-empty>` | Wot UI 没有。空状态用 `<view>` + `<wd-img>` 占位图 + 提示文字；或用 `<wd-status-tip>` |
| `<wd-result>` | Wot UI 没有。用 `<wd-status-tip>` 或 `<view>` + `<wd-img>` + `<wd-button>` 手拼 |
| `<wd-list>` | Wot UI 没有。长列表用 `<view v-for>` + `<wd-cell-group>` + `<wd-cell>` |
| `<wd-dialog>` / `<wd-modal>` | Wot UI 没有。弹窗用 `<wd-message-box>`（命令式 `useMessage()`）或 `<wd-popup position="center">`（声明式） |
| `<wd-select>` | Wot UI 没有通用 select。用 `<wd-picker>`（单选）、`<wd-col-picker>`（级联）、`<wd-select-picker>`（多选） |
| `<wd-menu>` / `<wd-menu-item>` | 下拉菜单用 `<wd-drop-menu>` + `<wd-drop-menu-item>` |
| `<wd-radio-button>` | 用 `<wd-radio-group shape="button">` + `<wd-radio>` |
| `<wd-pull-refresh>` / `<wd-refresh>` | Wot UI 没有。uni-app 原生用 `onPullDownRefresh()` 生命周期 |

> **工具层已经加了硬校验**：`write_file` / `edit_file` 写入 `.vue` 时会扫描 `<wd-xxx>` 标签，对每个组件检查 `node_modules/wot-design-uni/components/wd-xxx/wd-xxx.vue` 是否真实存在。不存在就直接拒绝写入，给你明确报错。这比 Vite 编译后浏览器报错再修复省一大轮。

---

## 🔧 Wot UI 样式自动注入（极其重要）

Wot UI 的组件样式由 Vite 的 `@dcloudio/vite-plugin-uni` 通过 **easycom 规则自动注入**——只要你在模板里使用 `<wd-xxx>`，对应 CSS 就会自动打包进来。

- ✅ **正确**：直接在 `.vue` 文件中 `<wd-button>点击</wd-button>`，无需任何 import
- ❌ **错误**：`import "wot-design-uni/index.css"` —— 这个路径**不存在**，Vite 启动后浏览器会立刻报 `[plugin:vite:import-analysis] Failed to resolve import`
- ❌ **错误**：`import "wot-design-uni/style.css"` —— 同上，Wot UI 并不暴露这种全局样式入口

如果你在旧代码里看到了 `import "wot-design-uni/xxx.css"`，那是 bug——请删除它。
