import React, { useState, useMemo } from 'react'
import { Row, Col, Button, Dropdown, Space, Checkbox } from 'antd'
import { DownOutlined, UpOutlined, SettingOutlined } from '@ant-design/icons'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'

// FilterForm 组件属性接口
export interface FilterFormProps {
  // 过滤条件单行列数
  columnsNum?: number
  // 是否显示设置查询字段按钮
  showBtnToolbar?: boolean
  // 是否初始收起
  defaultCollapsed?: boolean
  // 可搜索字段配置
  searchableFields?: any[]
  // 表单提交回调
  onFinish?: (values: any) => void
  // 表单重置回调
  onReset?: () => void
  // 表单实例
  form?: any
  children?: React.ReactNode
}

/**
 * FilterForm 组件 - 高级筛选表单
 *
 * 支持 CRUD 的 autoGenerateFilter 高级配置：
 * - columnsNum: 控制每行显示几个字段
 * - showBtnToolbar: 显示"设置查询字段"按钮，允许用户选择显示哪些字段
 * - defaultCollapsed: 初始状态是否收起
 */
export const FilterForm: React.FC<FilterFormProps> = (props) => {
  const {
    columnsNum = 3,
    showBtnToolbar = true,
    defaultCollapsed = true,
    searchableFields = [],
    onFinish,
    onReset,
    form,
    children,
  } = props

  // 收起/展开状态
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  // 所有字段的可见性状态（默认全部可见）
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    searchableFields.forEach((field) => {
      // 使用 name 作为唯一标识
      const fieldKey = field.name || field.label || field.type
      initial[fieldKey] = true
    })
    return initial
  })

  // 计算当前可见的字段
  const displayFields = useMemo(() => {
    return searchableFields.filter((field) => {
      const fieldKey = field.name || field.label || field.type
      return visibleFields[fieldKey]
    })
  }, [searchableFields, visibleFields])

  // 计算折叠模式下显示的字段（前 columnsNum 个）
  const collapsedFields = useMemo(() => {
    return collapsed ? displayFields.slice(0, columnsNum) : displayFields
  }, [collapsed, displayFields, columnsNum])

  // 切换字段可见性
  const handleFieldVisibilityChange = (fieldKey: string, checked: boolean) => {
    setVisibleFields((prev) => ({
      ...prev,
      [fieldKey]: checked,
    }))
  }

  // 切换全选/全不选
  const handleToggleAll = (checked: boolean) => {
    const newVisibleFields: Record<string, boolean> = {}
    searchableFields.forEach((field) => {
      const fieldKey = field.name || field.label || field.type
      newVisibleFields[fieldKey] = checked
    })
    setVisibleFields(newVisibleFields)
  }

  // 判断是否全选
  const isAllSelected = useMemo(() => {
    return searchableFields.every((field) => {
      const fieldKey = field.name || field.label || field.type
      return visibleFields[fieldKey]
    })
  }, [searchableFields, visibleFields])

  // 判断是否有部分选中
  const isIndeterminate = useMemo(() => {
    const selectedCount = searchableFields.filter((field) => {
      const fieldKey = field.name || field.label || field.type
      return visibleFields[fieldKey]
    }).length
    return selectedCount > 0 && selectedCount < searchableFields.length
  }, [searchableFields, visibleFields])

  // 表单提交
  const handleFinish = () => {
    if (form) {
      const values = form.getFieldsValue()
      onFinish?.(values)
    }
  }

  // 表单重置
  const handleReset = () => {
    if (form) {
      form.resetFields()
    }
    onReset?.()
  }

  // 构建字段选择菜单
  const fieldSelectionMenu = (
    <div style={{ padding: '8px', maxHeight: '400px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
        <Checkbox
          indeterminate={isIndeterminate}
          checked={isAllSelected}
          onChange={(e) => handleToggleAll(e.target.checked)}
        >
          全选
        </Checkbox>
      </div>
      <Space direction="vertical" style={{ width: '100%' }}>
        {searchableFields.map((field) => {
          const fieldKey = field.name || field.label || field.type
          const fieldLabel = field.label || field.name || fieldKey
          return (
            <Checkbox
              key={fieldKey}
              checked={visibleFields[fieldKey]}
              onChange={(e: CheckboxChangeEvent) =>
                handleFieldVisibilityChange(fieldKey, e.target.checked)
              }
            >
              {fieldLabel}
            </Checkbox>
          )
        })}
      </Space>
    </div>
  )

  // 计算网格布局的 span
  const colSpan = 24 / columnsNum

  // 构建字段和控件的映射关系
  const fieldControlMap = useMemo(() => {
    const map: Record<string, React.ReactNode> = {}
    if (children && Array.isArray(children)) {
      searchableFields.forEach((field, index) => {
        const fieldKey = field.name || field.label || field.type
        map[fieldKey] = children[index]
      })
    }
    return map
  }, [children, searchableFields])

  return (
    <div className="filter-form-container" style={{ marginBottom: '16px' }}>
      <Row gutter={[16, 16]}>
        {collapsedFields.map((field) => {
          const fieldKey = field.name || field.label || field.type
          const control = fieldControlMap[fieldKey]

          return (
            <Col span={colSpan} key={fieldKey}>
              <div style={{ marginBottom: 0 }}>
                {control}
              </div>
            </Col>
          )
        })}

        {/* 操作按钮列 */}
        <Col span={colSpan} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Space>
            <Button type="primary" onClick={handleFinish}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>

            {/* 展开/收起按钮（仅当字段数大于 columnsNum 时显示） */}
            {displayFields.length > columnsNum && (
              <Button
                type="link"
                onClick={() => setCollapsed(!collapsed)}
                icon={collapsed ? <DownOutlined /> : <UpOutlined />}
              >
                {collapsed ? '展开' : '收起'}
              </Button>
            )}

            {/* 设置查询字段按钮 */}
            {showBtnToolbar && (
              <Dropdown
                overlay={fieldSelectionMenu}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button icon={<SettingOutlined />}>
                  设置查询字段 <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  )
}

export default FilterForm
