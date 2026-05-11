import React, { forwardRef, useImperativeHandle, useCallback, useEffect, useState } from 'react'
import { render as amisRender } from 'amis'
// 导入 Amis CSS 样式，确保 condition-builder 组件正确渲染
import 'amis/lib/themes/antd.css'
import 'amis/lib/helper.css'
import 'amis/sdk/iconfont.css'

// Amis 主题配置
const AMIS_THEME = 'antd'

// 条件组合值类型
export interface ConditionGroup {
  id?: string
  conjunction: 'and' | 'or'
  children: Array<ConditionGroup | ConditionItem>
  if?: any // 启用条件
}

export interface ConditionItem {
  id?: string
  left: {
    type: 'field'
    field: string
  }
  op: string
  right: any
  if?: any // 启用条件
}

export type ConditionValue = ConditionGroup

// 字段配置接口
export interface ConditionField {
  label: string
  name: string
  type: 'text' | 'number' | 'date' | 'datetime' | 'time' | 'select' | 'boolean' | 'custom'
  placeholder?: string
  operators?: Array<string | { label: string; value: string; values?: any[] }>
  defaultOp?: string
  options?: Array<{ label: string; value: any }>
  source?: string
  searchable?: boolean
  autoComplete?: string
  children?: ConditionField[]
  value?: any // 自定义类型的渲染组件
  defaultValue?: any
  // 其他字段类型特定属性
  minimum?: number
  maximum?: number
  step?: number
  format?: string
  inputFormat?: string
  timeFormat?: string
  maxTagCount?: number
}

// 组件属性接口
export interface ConditionBuilderProps {
  value?: ConditionValue
  onChange?: (value: ConditionValue) => void
  fields?: ConditionField[]
  source?: string
  embed?: boolean
  title?: string
  builderMode?: 'simple' | 'full'
  showANDOR?: boolean
  showNot?: boolean
  draggable?: boolean
  searchable?: boolean
  selectMode?: 'list' | 'tree' | 'chained'
  addBtnVisibleOn?: string
  addGroupBtnVisibleOn?: string
  formula?: any
  showIf?: boolean
  formulaForIf?: any
  inputSettings?: any
  className?: string
  pickerIcon?: any
  disabled?: boolean
}

// 组件引用接口
export interface ConditionBuilderRef {
  getValue: () => ConditionValue | undefined
  setValue: (value: ConditionValue) => void
}

export const ConditionBuilder = forwardRef<ConditionBuilderRef, ConditionBuilderProps>(
  (props, ref) => {
    const {
      value,
      onChange,
      fields = [],
      source,
      embed = true,
      title,
      builderMode = 'full',
      showANDOR,
      showNot,
      draggable = true,
      searchable,
      selectMode = 'list',
      addBtnVisibleOn,
      addGroupBtnVisibleOn,
      formula,
      showIf,
      formulaForIf,
      inputSettings,
      className,
      pickerIcon,
      disabled,
    } = props

    const [internalValue, setInternalValue] = useState<ConditionValue | undefined>(value)

    useEffect(() => {
      setInternalValue(value)
    }, [value])

    const handleChange = useCallback(
      (newValue: ConditionValue) => {
        setInternalValue(newValue)
        onChange?.(newValue)
      },
      [onChange]
    )

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      getValue: () => internalValue,
      setValue: (newValue: ConditionValue) => {
        setInternalValue(newValue)
        onChange?.(newValue)
      },
    }))

    // 直接构建 condition-builder schema，不使用 form 包裹
    const schema = {
      type: 'condition-builder',
      value: internalValue,
      fields,
      source,
      embed,
      title,
      builderMode,
      showANDOR,
      showNot,
      draggable,
      searchable,
      selectMode,
      addBtnVisibleOn,
      addGroupBtnVisibleOn,
      formula,
      showIf,
      formulaForIf,
      inputSettings,
      pickerIcon,
      disabled,
      onChange: (value: ConditionValue) => {
        handleChange(value)
      },
    }

    return (
      <div className={className}>
        {amisRender(
          schema,
          {
            value: internalValue,
          },
          {
            theme: AMIS_THEME,
          }
        )}
      </div>
    )
  }
)

ConditionBuilder.displayName = 'ConditionBuilder'
