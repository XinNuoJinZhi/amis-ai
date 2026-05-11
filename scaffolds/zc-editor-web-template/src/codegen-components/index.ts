import { createLazyComponent } from './lazyLoad'

export { UserSelect } from './UserSelect/UserSelect'
export type {
  UserSelectProps,
  UserSelectOptions,
  UserOption,
  DepartmentOption,
  TreeOption,
} from './UserSelect/UserSelect'

export { DepartmentSelect } from './DepartmentSelect/DepartmentSelect'
export type { DepartmentSelectProps } from './DepartmentSelect/DepartmentSelect'

// 富文本编辑器 - 懒加载（tinymce ~500KB）
export const RichTextEditor = createLazyComponent(
  () => import('./RichTextEditor/RichTextEditor').then(m => ({ default: m.RichTextEditor as any }))
)
export type { RichTextEditorProps, RichTextEditorRef } from './RichTextEditor/RichTextEditor'

// 代码编辑器 - 懒加载（monaco-editor ~1.5MB）
export const CodeEditor = createLazyComponent(
  () => import('./CodeEditor/CodeEditor').then(m => ({ default: m.CodeEditor as any }))
)
export type { CodeEditorProps, CodeEditorRef } from './CodeEditor/CodeEditor'

// Diff 编辑器 - 懒加载（monaco-editor ~1.5MB）
export const DiffEditor = createLazyComponent(
  () => import('./DiffEditor/DiffEditor').then(m => ({ default: m.DiffEditor as any }))
)
export type { DiffEditorProps, DiffEditorRef } from './DiffEditor/DiffEditor'

export { InputKV } from './InputKV/InputKV'
export type { InputKVProps, InputKVRef, InputKVItem } from './InputKV/InputKV'

export { InputKVS } from './InputKVS/InputKVS'
export type { InputKVSProps, InputKVSRef, KVSItem, ControlItem } from './InputKVS/InputKVS'

// 组合输入组件
export { Combo } from './Combo/Combo'
export type { ComboProps, ComboItem, ComboRef } from './Combo/Combo'

// 子表单组件
export { InputSubForm } from './InputSubForm'
export type { InputSubFormProps, InputSubFormItem, InputSubFormRef, InputSubFormFieldConfig } from './InputSubForm'

// 可编辑表格组件
export { InputTable } from './InputTable'
export type { InputTableColumnConfig, InputTableRef } from './InputTable'

// 城市选择组件
export { default as InputCity } from './InputCity/InputCity'
export type { CityValue, CityFullValue } from './InputCity/InputCity'

// 重复频率选择组件
export { InputRepeat } from './InputRepeat'

// UUID 字段组件
export { UUID } from './UUID'

// 地理位置选择组件
export { LocationPicker } from './LocationPicker'

// 动态表单组件
export { DynamicForm } from './DynamicForm'
export type { LocationData } from './LocationPicker'

// 隐藏字段组件
export { Hidden } from './Hidden'

// 签名组件
export { InputSignature } from './InputSignature'

// 快速编辑组件
export { QuickEdit } from './QuickEdit'

// EChart - 懒加载（echarts ~800KB）
export const EChart = createLazyComponent(
  () => import('./EChart/EChart').then(m => ({ default: m.EChart as any }))
)
export type {
  EChartProps,
  EChartRef,
  EChartsOption,
  EChartsEventParams,
  EChartsInstance,
} from './EChart/EChart'

// EChart 报表子组件 - 懒加载（依赖 echarts）
export const TargetNumber = createLazyComponent(
  () => import('./EChart/report/TargetNumber').then(m => ({ default: m.TargetNumber as any }))
)
export type { TargetNumberProps, TargetNumberRef } from './EChart/report/TargetNumber'

export const Map = createLazyComponent(
  () => import('./EChart/report/Map').then(m => ({ default: m.Map as any }))
)
export type { MapProps, MapRef } from './EChart/report/Map'

export const Sankey = createLazyComponent(
  () => import('./EChart/report/Sankey').then(m => ({ default: m.Sankey as any }))
)
export type { SankeyProps, SankeyRef } from './EChart/report/Sankey'

export const Calendar = createLazyComponent(
  () => import('./EChart/report/Calendar').then(m => ({ default: m.Calendar as any }))
)
export type { CalendarProps, CalendarRef } from './EChart/report/Calendar'

export const ScatterMap = createLazyComponent(
  () => import('./EChart/report/ScatterMap').then(m => ({ default: m.ScatterMap as any }))
)
export type { ScatterMapProps, ScatterMapRef } from './EChart/report/ScatterMap'

// JSON 查看器组件
export { JsonView } from './JsonView/JsonView'
export type { JsonViewProps } from './JsonView/JsonView'

// PDF 查看器 - 懒加载（react-pdf ~500KB）
export const PdfViewer = createLazyComponent(
  () => import('./PdfViewer/PdfViewer').then(m => ({ default: m.PdfViewer as any }))
)
export type { PdfViewerProps } from './PdfViewer/PdfViewer'

// Office 查看器 - 懒加载（docx-preview ~200KB）
export const OfficeViewer = createLazyComponent(
  () => import('./OfficeViewer/OfficeViewer').then(m => ({ default: m.OfficeViewer as any }))
)
export type { OfficeViewerProps } from './OfficeViewer/OfficeViewer'

// Picker 列表选择器组件
export { Picker } from './Picker/Picker'
export type { PickerProps } from './Picker/Picker'

// ConditionBuilder 条件构建器组件
export { ConditionBuilder } from './ConditionBuilder'
export type {
  ConditionBuilderProps,
  ConditionBuilderRef,
  ConditionValue,
  ConditionGroup,
  ConditionItem,
  ConditionField,
} from './ConditionBuilder'

// AutoFilter 自动筛选组件
export { AutoFilter } from './AutoFilter'
export type { AutoFilterProps } from './AutoFilter'

// Panel 面板组件
export { default as Panel } from './Panel'

// ChainedSelect 链式下拉框组件
export { ChainedSelect } from './ChainedSelect'
export type { ChainedSelectProps } from './ChainedSelect'

// TableTransfer 表格穿梭器组件
export { TableTransfer } from './TableTransfer'
export type { TableTransferProps, TableTransferColumn, TableTransferItem } from './TableTransfer'

// MatrixCheckboxes 矩阵开关组件
export { MatrixCheckboxes } from './MatrixCheckboxes'
export type { MatrixCheckboxesProps, MatrixColumn, MatrixRow, MatrixValue } from './MatrixCheckboxes'

// AnchorNav 锚点导航组件
export { default as AnchorNav } from './AnchorNav/AnchorNav'
export type { AnchorNavProps, AnchorNavLink } from './AnchorNav/AnchorNav'

// Custom 自定义组件
export { Custom } from './Custom'
export type { CustomProps } from './Custom'

// Tasks 异步任务组件
export { Tasks } from './Tasks'
export type { TasksProps, TaskItem } from './Tasks'

// Each 循环渲染器
export { Each } from './Each'
export type { EachProps } from './Each'

// Timeline 时间轴组件
export { default as Timeline } from './Timeline/Timeline'
export type { TimelineProps, TimelineItemType } from './Timeline/Timeline'

// Markdown 渲染组件
export { Markdown } from './Markdown'
export type { MarkdownProps } from './Markdown'

// Log 实时日志组件
export { Log } from './Log'
export type { LogProps, LogSource } from './Log'
