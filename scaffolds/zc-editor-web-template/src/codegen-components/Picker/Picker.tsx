import React, { useState, useMemo, cloneElement, isValidElement } from 'react'
import { Modal, Drawer, Tag, Space, Button } from 'antd'
import { PlusOutlined, CloseCircleOutlined } from '@ant-design/icons'

// Picker 组件属性接口
export interface PickerProps {
  // 数据源
  source?: any[]

  // 选择器配置
  multiple?: boolean
  valueField?: string
  labelField?: string
  joinValues?: boolean

  // 模态框配置
  modalTitle?: string
  modalMode?: 'dialog' | 'drawer'

  // 内嵌模式
  embed?: boolean

  // pickerSchema - 弹框内的内容（通常是 CRUD/Table）
  pickerSchema?: React.ReactNode

  // 表单集成
  value?: any
  onChange?: (value: any) => void

  // 尺寸
  size?: 'small' | 'middle' | 'large'

  // 其他属性
  placeholder?: string
  disabled?: boolean
  clearable?: boolean

  // 回调函数
  onModalOpen?: () => void // 弹窗打开时的回调

  // 样式
  className?: string
  style?: React.CSSProperties
}

/**
 * 深度克隆 React 元素，并注入 props
 * 用于给 pickerSchema 中的 Table/Crud 组件注入 rowSelection
 */
const deepCloneElementWithProps = (element: any, injectedProps: any): any => {
  if (!isValidElement(element)) {
    return element
  }

  const props = { ...(element.props || {}) }

  // 注入 props（不覆盖已有的）
  Object.keys(injectedProps).forEach((key) => {
    if (props[key] === undefined) {
      props[key] = injectedProps[key]
    }
  })

  // 递归处理 children
  if (props.children) {
    if (Array.isArray(props.children)) {
      props.children = props.children.map((child: any) =>
        deepCloneElementWithProps(child, injectedProps)
      )
    } else {
      props.children = deepCloneElementWithProps(props.children, injectedProps)
    }
  }

  return cloneElement(element, props)
}

/**
 * Picker 组件 - 列表选择器
 *
 * 在功能上和 Select 类似，但它能显示更复杂的信息
 * 可以配置 pickerSchema，实现弹框 CRUD 选择模式
 */
export const Picker: React.FC<PickerProps> = (props) => {
  const {
    source = [],
    multiple = false,
    valueField = 'id',
    labelField = 'name',
    joinValues = true,
    modalTitle = '请选择',
    modalMode = 'dialog',
    embed = false,
    pickerSchema,
    value,
    onChange,
    size = 'middle',
    placeholder = '请选择',
    disabled = false,
    clearable = true,
    onModalOpen,
    className,
    style,
  } = props

  // 弹框显示状态
  const [visible, setVisible] = useState(false)

  // 临时选中的值（弹框中的选择，确认后才应用）
  const [tempSelectedKeys, setTempSelectedKeys] = useState<React.Key[]>([])

  // 在 embed 模式下，存储完整的选中行数据
  const [tempSelectedRows, setTempSelectedRows] = useState<any[]>([])

  // 组件挂载时调用 onModalOpen（用于重置 Picker 内 CRUD 的分页状态）
  React.useEffect(() => {
    onModalOpen?.()
  }, [])

  // 解析当前值
  const selectedItems = useMemo(() => {
    if (!value) return []

    let valueList: any[] = []

    if (joinValues) {
      // 值是拼接的字符串，如 "1,2,3"
      if (typeof value === 'string') {
        valueList = value.split(',').filter(Boolean)
      } else if (Array.isArray(value)) {
        valueList = value
      } else {
        valueList = [value]
      }

      // 从 source 中找到对应的项
      return valueList
        .map((val) => source.find((item) => String(item[valueField]) === String(val)))
        .filter(Boolean)
    } else {
      // 值是对象或对象数组
      if (Array.isArray(value)) {
        return value
      } else if (value && typeof value === 'object') {
        return [value]
      }
      return []
    }
  }, [value, source, valueField, joinValues])

  // 在 embed 模式下，基于 selectedItems 或 tempSelectedRows 计算实时显示的已选项
  const embedSelectedItems = useMemo(() => {
    if (!embed) return []

    // 优先使用 selectedItems（来自外部 value，确保能正确回显）
    // 只有在用户正在操作（tempSelectedRows 有数据且与 selectedItems 不同）时才使用 tempSelectedRows
    if (selectedItems && selectedItems.length > 0) {
      // 如果 tempSelectedRows 为空，说明还没有用户操作，直接使用 selectedItems
      if (tempSelectedRows.length === 0) {
        return selectedItems
      }
      // 如果 tempSelectedRows 有数据，比较两者的 keys 是否相同
      const selectedKeys = selectedItems.map(item => item[valueField]).sort().join(',')
      const tempKeys = tempSelectedRows.map(item => item[valueField]).sort().join(',')
      // 如果 keys 相同，说明没有新的用户操作，使用 selectedItems（数据更完整）
      if (selectedKeys === tempKeys) {
        return selectedItems
      }
      // 如果 keys 不同，说明用户正在操作，使用 tempSelectedRows
      return tempSelectedRows
    }

    // 如果 selectedItems 为空，但 tempSelectedRows 有数据（用户操作中）
    if (tempSelectedRows.length > 0) {
      return tempSelectedRows
    }

    // 都为空时，尝试从 source 中查找
    return source.filter((item) => tempSelectedKeys.includes(item[valueField]))
  }, [embed, source, tempSelectedKeys, tempSelectedRows, valueField, selectedItems])

  // 在 embed 模式下，当 value 改变时同步更新选中状态
  React.useEffect(() => {
    if (embed && selectedItems) {
      const keys = selectedItems.map((item) => item[valueField])
      setTempSelectedKeys(keys)
      setTempSelectedRows(selectedItems)
    }
  }, [embed, selectedItems, valueField])

  // 打开选择器
  const handleOpen = () => {
    if (disabled) return

    // 调用重置分页回调（如果存在）
    onModalOpen?.()

    // 初始化临时选中值
    const keys = selectedItems.map((item) => item[valueField])
    setTempSelectedKeys(keys)
    setVisible(true)
  }

  // 确认选择
  const handleConfirm = () => {
    // 根据 tempSelectedKeys 获取完整的项
    const selected = source.filter((item) => tempSelectedKeys.includes(item[valueField]))

    let newValue: any

    if (joinValues) {
      // 拼接值
      if (multiple) {
        newValue = selected.map((item) => item[valueField]).join(',')
      } else {
        newValue = selected.length > 0 ? String(selected[0][valueField]) : ''
      }
    } else {
      // 对象值
      if (multiple) {
        newValue = selected
      } else {
        newValue = selected.length > 0 ? selected[0] : null
      }
    }

    onChange?.(newValue)
    setVisible(false)
  }

  // 取消选择
  const handleCancel = () => {
    setVisible(false)
  }

  // 清除选择
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(multiple ? (joinValues ? '' : []) : (joinValues ? '' : null))
  }

  // 移除单个项
  const handleRemoveItem = (item: any, e: React.MouseEvent) => {
    e.stopPropagation()

    // 在 embed 模式下使用 embedSelectedItems，否则使用 selectedItems
    const currentItems = embed ? embedSelectedItems : selectedItems
    const remainingItems = currentItems.filter((i) => i[valueField] !== item[valueField])

    // 如果是 embed 模式，立即更新 tempSelectedKeys 和 tempSelectedRows
    if (embed) {
      setTempSelectedKeys(remainingItems.map((i) => i[valueField]))
      setTempSelectedRows(remainingItems)
    }

    let newValue: any
    if (joinValues) {
      newValue = remainingItems.map((i) => i[valueField]).join(',')
    } else {
      newValue = remainingItems
    }

    onChange?.(newValue)
  }

  // 渲染已选择的项
  const renderSelectedItems = () => {
    // 在 embed 模式下使用 embedSelectedItems，否则使用 selectedItems
    const itemsToRender = embed ? embedSelectedItems : selectedItems

    if (itemsToRender.length === 0) {
      return <span className="text-gray-400">{placeholder}</span>
    }

    return (
      <Space size={4} wrap>
        {itemsToRender.map((item) => (
          <Tag
            key={item[valueField]}
            closable={!disabled && clearable}
            onClose={(e) => handleRemoveItem(item, e)}
          >
            {item[labelField]}
          </Tag>
        ))}
      </Space>
    )
  }

  // 渲染选择器触发器
  const renderTrigger = () => {
    return (
      <div
        className={`
          border border-gray-300 rounded px-3 py-1 cursor-pointer
          hover:border-blue-500 transition-colors
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${className || ''}
        `}
        style={style}
        onClick={handleOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">{renderSelectedItems()}</div>
          <div className="flex items-center gap-2 ml-2">
            {clearable && selectedItems.length > 0 && !disabled && (
              <CloseCircleOutlined
                className="text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            <PlusOutlined className="text-gray-400" />
          </div>
        </div>
      </div>
    )
  }

  // 渲染内嵌模式
  const renderEmbed = () => {
    // 为 pickerSchema 注入行选择配置
    const rowSelection = {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys: tempSelectedKeys,
      // onChange 接收 selectedRowKeys 和 selectedRows 两个参数
      onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
        setTempSelectedKeys(selectedRowKeys)
        setTempSelectedRows(selectedRows || [])

        // 内嵌模式下，直接更新值（不需要确认）
        // 优先使用 selectedRows，如果没有则从 source 中查找
        const selected = selectedRows && selectedRows.length > 0
          ? selectedRows
          : source.filter((item) => selectedRowKeys.includes(item[valueField]))

        let newValue: any
        if (joinValues) {
          if (multiple) {
            newValue = selected.map((item) => item[valueField]).join(',')
          } else {
            newValue = selected.length > 0 ? String(selected[0][valueField]) : ''
          }
        } else {
          if (multiple) {
            newValue = selected
          } else {
            newValue = selected.length > 0 ? selected[0] : null
          }
        }

        onChange?.(newValue)
      },
    }

    // 克隆 pickerSchema 并注入 rowSelection
    const enhancedPickerSchema = pickerSchema
      ? deepCloneElementWithProps(pickerSchema, { rowSelection })
      : null

    return (
      <div className={className} style={style}>
        {/* 已选择的项 */}
        {embedSelectedItems.length > 0 && (
          <div className="mb-3">
            <Space size={4} wrap>
              {embedSelectedItems.map((item) => (
                <Tag
                  key={item[valueField]}
                  closable={!disabled && clearable}
                  onClose={(e) => handleRemoveItem(item, e)}
                >
                  {item[labelField]}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 内嵌的 pickerSchema */}
        <div className="border border-gray-300 rounded p-3">
          {enhancedPickerSchema || (
            <div className="text-gray-400 text-center py-8">暂无选择器配置</div>
          )}
        </div>
      </div>
    )
  }

  // 如果是内嵌模式，直接显示
  if (embed) {
    return renderEmbed()
  }

  // 为弹框模式的 pickerSchema 注入行选择配置
  const rowSelectionForModal = {
    type: multiple ? 'checkbox' : 'radio',
    selectedRowKeys: tempSelectedKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setTempSelectedKeys(selectedRowKeys)
    },
  }

  // 克隆 pickerSchema 并注入 rowSelection
  const enhancedPickerSchemaForModal = pickerSchema
    ? deepCloneElementWithProps(pickerSchema, { rowSelection: rowSelectionForModal })
    : null

  // 渲染弹框内容
  const modalContent = (
    <div>
      {enhancedPickerSchemaForModal || (
        <div className="text-gray-400 text-center py-8">暂无选择器配置</div>
      )}
    </div>
  )

  // 渲染弹框
  const renderModal = () => {
    if (modalMode === 'drawer') {
      return (
        <Drawer
          title={modalTitle}
          open={visible}
          onClose={handleCancel}
          width={720}
          footer={
            <div className="text-right">
              <Space>
                <Button onClick={handleCancel}>取消</Button>
                <Button type="primary" onClick={handleConfirm}>
                  确定
                </Button>
              </Space>
            </div>
          }
        >
          {modalContent}
        </Drawer>
      )
    }

    return (
      <Modal
        title={modalTitle}
        open={visible}
        onCancel={handleCancel}
        onOk={handleConfirm}
        width={800}
        destroyOnHidden
      >
        {modalContent}
      </Modal>
    )
  }

  return (
    <>
      {renderTrigger()}
      {renderModal()}
    </>
  )
}

export default Picker
