# ZC Amis 6.8.0-my242v2 vs baidu/amis 6.8.0 — 二开点完整报告

> **阶段 A 产出**（1.3.0 知识灌库前置摸底）
> **日期**：2026-05-10
> **方法**：`git clone --depth=1 -b 6.8.0 baidu/amis` + 对 ZC fork 跑 `diff -rq` 文件级差异
> **资料源**：`~/Working/TianXing/amis-codegen/.claude/skills/zc_amis/assets/packages/`

---

## 1. 总规模

按决策点 1 (B 方案)，**重点摸 amis-editor + amis 主包**，其他包仅列总览。

| 包 | baidu 文件 | ZC 文件 | 新增 | 修改 | Only-in 条目 | 真实新增文件（展开目录后） |
|---|---|---|---|---|---|---|
| amis-formula | 10 | 10 | +0 | 4 | 0 | 0 |
| amis-core | 135 | 138 | +3 | 46 | 3 | 3 |
| amis-ui | 182 | 186 | +4 | 23 | 13 | 4（其余多是格式化差异） |
| amis-editor-core | 75 | 102 | +27 | 25 | 9 | 27 |
| **amis** | **174** | **284** | **+110** | **41** | **17** | **110**（renderers/ 38 modified + 17 新文件/目录） |
| **amis-editor** | **252** | **434** | **+182** | **58** | **26** | **182**（ReportForms 125 + actionsPanelPlugins 34 + 23 独立文件） |

**结论**：ZC 是**重度 fork**，主要在 amis-editor + amis 主包加业务，二开扩散到 5 个核心包但 amis-ui/amis-core 偏格式化噪音。

---

## 2. ZC 二开方向画像（按业务套件分类）

从 `Only in` 文件命名抽取的业务套件：

| 套件 | 新增组件 / 子系统 | 业务定位 |
|---|---|---|
| **OA 套件** | `DepartmentSelect`（部门选择）/ `UserSelect`（用户选择）/ `flowCreate`（工作流） | OA 系统标配 |
| **数据建模套件** | `ModelForm` / `ModelTable` / `DocEntity` / `DynamicForm` / `ModelDSBuilder` / `EntityControl` / `EntityFieldSetting` / `EntityPicker` / `FieldFiltersSetting` / `FilterCriteria` | 数据实体可视化建模 + 字段筛选 |
| **报表系统** | `ReportForms/` 子系统（**125 文件**，独立子模块）+ `renderers/AI/` / 各类图表（Bar/Line/Pie/Gauge/Funnel/Map/WordCloud） | 完整 BI 报表能力 |
| **API 中台** | `APICenterControl` / `APIAdaptorControl`（modified）/ ZC apicenter 协议（`source: {url: "app://..."}` ） | 接入 ZC API 中台 |
| **事件动作面板** | `actionsPanelPlugins/`（**34 文件**：componentActionsPanel / modalActionsPanel / pageActionsPanel / processOperationPanel / serverActionsPanel 等 7 类） | 编辑器事件动作面板按类型分模块化 |
| **AI 助手集成** | `amis-ui/components/ai/` 目录 + 多个 `ai-*.svg` icon + amis 主包 `renderers/AI/` | 编辑器内嵌 AI 助手对话 |
| **数值/数字增强** | `ENumber.tsx`（增强数值 renderer） | 数字格式化扩展 |

---

## 3. 详细清单（按 1.3 知识灌库优先级）

### 3.1 P0 — ZC 全新业务组件（新增 plugin + renderer，需要独立 schema 灌库）

**amis-editor/plugin/**（9 个）：
- `DepartmentSelect.tsx` → `type: 'department-select'`
- `UserSelect.tsx` → `type: 'user-select'`
- `DocEntity.tsx`（文档实体）
- `DynamicForm.tsx` → `type: 'dynamic-form'`
- `ModelForm.tsx` → `rendererName: 'modelform'`
- `ModelTable.tsx`
- `flowCreate.tsx`（工作流）
- `ReportForms/` 目录（**整体当 1 个套件**）—— 内含 AccumulatedWaterfallChart / NumericalIndicators / ChartCalendar / ChartMap / ChartSanKey / ChartScatterMap / ChartWaterfall / ChartWordCloud / Funnel / Map / ReportForms.tsx 主入口 等 125 文件

**amis-editor/renderer/**（11 个，编辑器辅助控件 / 配置面板）：
- `APICenterControl.tsx`
- `AddOptions.tsx`
- `DataOptionControl.tsx`
- `DynamicFormCodeControl.tsx`
- `EntityControl.tsx` / `EntityFieldSetting.tsx` / `EntityPicker.tsx`
- `FieldFiltersSetting.tsx` / `FilterCriteria.tsx`
- `FormulaControl-hour.tsx`
- `userSelect.tsx`

**amis 主包 renderers/**（16 个，运行时新组件）：
- `AI/` 目录（AI 助手 renderer）
- `DepartmentSelect.tsx` / `UserSelect.tsx`
- `DocEntity.tsx` / `DynamicForm.tsx`
- `ModelForm.tsx` / `ModelTable.tsx`
- `ENumber.tsx`
- 图表系列：`Bar.tsx` / `Line.tsx` / `Pie.tsx` / `Gauge.tsx` / `Funnel.tsx` / `Map.tsx` / `WordCloud.tsx`
- `ReportFormsConfig.tsx`
- `report/` 子目录

**amis-editor/builder/** + **renderer/event-control/**：
- `ModelDSBuilder.ts`（数据源 builder 加模型）
- `actionsPanelPlugins/`（34 文件，事件面板扩展套件）
- `actionsPanelManager.ts` / `constants.ts` / `eventControlConfigHelper.ts`

### 3.2 P0 — ZC 改造的原版组件（修改 plugin / renderer，需要 patch 灌库）

**amis-editor/plugin/ 修改的原版插件（28 个）**：
```
Breadcrumb / Button / CRUD / CRUD2/BaseCRUD / Carousel / Chart / Image / Link / Mapping
OfficeViewer / Others/TableCell / Page / Service / Steps / Wizard / index
Form/{ChainedSelect, Combo, Form, InputFile, InputImage, InputTable, InputText, InputTree,
       Item, NestedSelect, Select, TabsTransfer}
```

抽样验证：`CRUD2/BaseCRUD.tsx` 的 ZC 改动**集成 dsManager.buildCollectionFromBuilders** 调 ZC apicenter 协议 → 真业务，灌库时要写「ZC CRUD 用 apicenter 数据源」规则。

**amis-editor/renderer/ 修改的原版控件（19 个）**：
```
APIAdaptorControl / APIControl / FormulaControl / MapSourceControl / NavSourceControl
OptionControl / StatusControl / TimelineItemControl / TreeOptionControl / ValidateApiControl
event-control/{DialogActionPanel, action-config-dialog, action-config-panel,
               comp-action-select, helper, index}
style-control/Background
textarea-formula/{FormulaPicker, TextareaFormulaControl}
```

**amis 主包 renderers/ 修改的原版渲染器（38 个）**：
```
Action / App / CRUD / Chart / Dialog / Drawer / DropDownButton / Mapping
Number / OfficeViewer / Page / Plain / Property / QuickEdit / Service / SparkLine / Tag / Wizard
Form/{Checkboxes, Combo, ConditionBuilder, IconSelect, IconSelectStore, InputDate,
      InputImage, InputSubForm, InputTable, InputTag, JSONSchemaEditor, NestedSelect,
      Picker, Select, StaticHoc, Switch, TreeSelect}
Table/{Cell, index} / Table2/index
```

加 3 个核心文件：`Schema.ts` / `index.tsx` / `types.ts`（schema 类型注册，抽样看是 import 顺序差异，可能格式化噪音）

### 3.3 P1 — 中度修改包（amis-editor-core）

27 个新文件 + 25 处修改。编辑器框架级的 ZC 扩展（如 BasePlugin 接口扩展、scaffold 流程改造）。

### 3.4 P2 — 轻量修改包（amis-core / amis-ui / amis-formula）

- amis-core：46 modified + 3 新文件 — 主要是行为 patch（如 fetcher / store / utils）
- amis-ui：23 modified + 4 新文件 + ai/ 目录 + 13 个 ai-* icon — 抽样看主体是**格式化噪音**（imports `{X}` ↔ `{ X }`），真业务集中在 ai/ 目录
- amis-formula：4 modified — 公式引擎微调，可忽略

---

## 4. 阶段 B 灌库策略（基于本报告）

### 4.1 `skills/zc-amis-schema/` 桶（类型轨）—— 预估 **40-50 个 references**

按 P0 全新组件 + P0 改造组件高频项灌入：

| 类别 | 数量 | 优先 |
|---|---|---|
| ZC 全新 plugin → schema | 9（OA + 数据建模 + 工作流 + ReportForms） | 必灌 |
| ZC 全新 renderer 控件（编辑器配置面板用） | 11 | 必灌 |
| amis 主包 ZC 新渲染器（运行时组件） | 16 | 必灌 |
| ZC 改造的原版组件 patch 提示 | 28 plugin + 19 renderer + 38 主包 renderer 中**高频部分**（CRUD/Form/Table/Page/Action 等 15-20 个） | 选灌 |

### 4.2 `code_samples` 表 `zc-amis-1.3` 标签 —— 预估 **80-120 条**

- 从 `assets/examples/` ZC 自带 demo 抽样
- 从 `zc_editor/src/codegen-components/` 实际业务调用样例抽样（特别是 CRUD / Form / ModelForm）
- 强需求样本：apicenter 协议 source / DepartmentSelect 用法 / ReportForms 配置 / EntityPicker

### 4.3 `skills/platform-zc-web/` 新桶（业务规则）

写一段 SKILL.md：ZC vs 原版 amis 何时选哪个 + ZC 特有协议（`app://` 数据源、组件命名约定如 `department-select` / `modelform` 用全小写连字符）

---

## 5. 已识别风险与权衡

| 风险 | 说明 | 应对 |
|---|---|---|
| ReportForms 125 文件不能逐个灌 | 是独立 BI 子系统 | 灌库时整体当 1 个套件描述（`type: 'report-forms'` 入口 + 子图表类型列表），不展开 |
| actionsPanelPlugins 34 文件是编辑器行为 | 跟 LLM 出码（运行时 JSON 生成）关联弱 | 不灌 LLM 知识，但 sandbox 镜像要保留这些文件让编辑器跑起来 |
| amis-ui 23 处修改多为格式化噪音 | imports `{X}` ↔ `{ X }` 之类 | 写脚本过滤纯空格 diff，只保留真业务 |
| office-viewer 112MB | 决策点 1 明确不摸 | 跳过；sandbox 镜像可选 opt-in |
| ZC apicenter `app://` 协议 | 内网专用，sandbox 跑不通 | 灌库时把 `app://` 替换为 mock URL（如 `/api/`）让 LLM 生成的代码能本地跑；生产环境用户自行接 |

---

## 6. 接下来（阶段 B 启动条件）

阶段 A 已完成 ✓。阶段 B 入场前需要：

1. **用户 review 本报告**，确认 §4 灌库范围（特别是 ZC 改造的 28+19+38 个原版组件要不要全灌，还是只挑高频）
2. 阶段 B 实际工作：
   - 自动抽 P0 全新组件 schema（从 plugin/renderer 文件 parse `scaffold` / `panelBody` / props 字段）
   - 手写 SKILL.md 桶 metadata
   - 跑 RAG 灌库脚本（沿用 1.1 `agent/src/knowledge/loader.py` 风格）

预计阶段 B 工时：**3-5 天**（如选全灌则到上限，挑高频灌则下限）。
