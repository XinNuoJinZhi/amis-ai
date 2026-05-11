import React, { useRef } from 'react'
import { ConditionBuilder, ConditionBuilderRef, ConditionField } from './ConditionBuilder'

/**
 * ConditionBuilder 组件使用示例
 */
export const ConditionBuilderExample: React.FC = () => {
  const conditionBuilderRef = useRef<ConditionBuilderRef>(null)

  // 字段配置示例
  const fields: ConditionField[] = [
    {
      label: 'ID',
      name: 'id',
      type: 'number',
      operators: [
        { label: '等于', value: 'equal' },
        { label: '不等于', value: 'not_equal' },
        { label: '范围匹配', value: 'between' },
        { label: '大于', value: 'greater' },
        { label: '大于或等于', value: 'greater_or_equal' },
        { label: '小于', value: 'less' },
        { label: '小于或等于', value: 'less_or_equal' },
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
    {
      label: 'bId',
      name: 'bId',
      type: 'number',
    },
  ]

  const handleChange = (value: any) => {
    console.log('ConditionBuilder value changed:', value)
  }

  const handleGetValue = () => {
    const value = conditionBuilderRef.current?.getValue()
    console.log('Current value:', value)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>ConditionBuilder 组件示例</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={handleGetValue}>获取当前值</button>
      </div>

      <ConditionBuilder
        ref={conditionBuilderRef}
        fields={fields}
        onChange={handleChange}
        searchable
        draggable
        builderMode="full"
      />

      <h3 style={{ marginTop: 40 }}>简易模式示例</h3>
      <ConditionBuilder
        fields={fields}
        onChange={handleChange}
        builderMode="simple"
        showANDOR
      />

      <h3 style={{ marginTop: 40 }}>非内嵌模式示例</h3>
      <ConditionBuilder
        fields={fields}
        onChange={handleChange}
        embed={false}
        title="条件组合设置"
        builderMode="simple"
        pickerIcon={{
          type: 'icon',
          icon: 'edit',
          className: 'w-4 h-4',
        }}
      />
    </div>
  )
}
