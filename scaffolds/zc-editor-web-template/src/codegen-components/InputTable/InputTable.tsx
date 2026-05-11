import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useMemo, useRef } from 'react'
import { Table, Button, Space } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnType } from 'antd/es/table'

// 字段配置接口
export interface InputTableColumnConfig {
  key: string // 字段的唯一标识
  title: string // 列标题
  dataIndex?: string | string[] // 数据索引
  width?: number
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, data: Record<string, unknown>, index: number) => React.ReactNode
}

// 内部数据项接口
interface InputTableItem {
  id: string
  [key: string]: unknown
}

// 组件属性接口
interface InputTableProps {
  value?: Array<Record<string, unknown>>
  onChange?: (value: Array<Record<string, unknown>>) => void
  columns: InputTableColumnConfig[]
  addBtnLabel?: string
  addBtnIcon?: React.ReactNode
  removable?: boolean // 是否显示删除按钮
  addable?: boolean // 是否显示新增按钮，默认为 true
  disabled?: boolean
  bordered?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
  style?: React.CSSProperties
}

// 组件引用接口
export interface InputTableRef {
  getValue: () => Array<Record<string, unknown>>
  setValue: (value: Array<Record<string, unknown>>) => void
  addItem: () => void
  removeItem: (id: string) => void
  clear: () => void
}

// 生成唯一ID
const generateId = () => `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 将外部数据转换为内部数据结构
const externalToInternal = (value?: Array<Record<string, unknown>>): InputTableItem[] => {
  if (!value || !Array.isArray(value)) return []

  return value.map((item) => ({
    id: item.id as string || generateId(),
    ...item,
  }))
}

// 将内部数据转换为外部数据结构
const internalToExternal = (items: InputTableItem[]): Array<Record<string, unknown>> => {
  return items.map((item) => {
    const { id, ...rest } = item
    return rest
  })
}

const InputTable = forwardRef<InputTableRef, InputTableProps>((props, ref) => {
  const {
    value,
    onChange,
    columns = [],
    addBtnLabel = '新增',
    addBtnIcon,
    removable = true,
    addable = true,
    disabled = false,
    bordered = true,
    size = 'middle',
    className,
    style,
  } = props

  const [items, setItems] = useState<InputTableItem[]>(() => externalToInternal(value))

  // 使用 ref 保存最新的 onChange,避免因为 onChange 变化导致回调重新创建
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // 使用 ref 跟踪是否是内部更新
  const isInternalUpdateRef = useRef(false)

  // 记录当前获得焦点的输入框,用于在渲染后恢复焦点
  const focusedInputRef = useRef<{ rowId: string; columnKey: string } | null>(null)

  // 同步外部value变化
  useEffect(() => {
    // 如果是内部更新触发的,跳过同步
    if (isInternalUpdateRef.current) {
      return
    }

    setItems(externalToInternal(value))
  }, [value])

  // 在 items 变化后尝试恢复输入焦点
  useEffect(() => {
    if (!focusedInputRef.current) return

    const { rowId, columnKey } = focusedInputRef.current
    // 通过 data-input-table-cell 标记定位输入元素
    const selector = `[data-input-table-cell="${rowId}-${columnKey}"]`
    const el = document.querySelector(selector) as HTMLElement | null
    if (el) {
      // 延迟到下一帧确保元素已完成渲染
      requestAnimationFrame(() => {
        // 查找 Input 或其他输入元素
        const input = el.querySelector('input, textarea, select') as HTMLInputElement | null
        if (input) {
          input.focus()
        }
      })
    }
  }, [items])

  // 更新外部值
  const updateValue = useCallback((newItems: InputTableItem[]) => {
    isInternalUpdateRef.current = true
    if (onChangeRef.current) {
      onChangeRef.current(internalToExternal(newItems))
    }
    // 使用 setTimeout 来重置标志,确保在下一个事件循环中重置
    setTimeout(() => {
      isInternalUpdateRef.current = false
    }, 0)
  }, [])

  // 添加新行
  const handleAdd = useCallback(() => {
    if (disabled) return

    const newItem: InputTableItem = {
      id: generateId(),
    }

    const newItems = [...items, newItem]
    setItems(newItems)
    updateValue(newItems)
  }, [items, disabled, updateValue])

  // 删除行
  const handleDelete = useCallback(
    (id: string) => {
      if (disabled) return

      const newItems = items.filter((item) => item.id !== id)
      setItems(newItems)
      updateValue(newItems)
    },
    [items, disabled, updateValue],
  )

  // 更新行数据
  const handleUpdate = useCallback(
    (id: string, field: string, fieldValue: unknown) => {
      if (disabled) return

      const newItems = items.map((item) =>
        item.id === id ? { ...item, [field]: fieldValue } : item,
      )
      setItems(newItems)
      updateValue(newItems)
    },
    [items, disabled, updateValue],
  )

  // 清空所有数据
  const handleClear = useCallback(() => {
    setItems([])
    updateValue([])
  }, [updateValue])

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    getValue: () => internalToExternal(items),
    setValue: (newValue: Array<Record<string, unknown>>) => {
      const newItems = externalToInternal(newValue)
      setItems(newItems)
    },
    addItem: handleAdd,
    removeItem: handleDelete,
    clear: handleClear,
  }))

  // 使用 ref 保存最新的 columns,避免因为 columns 变化导致回调重新创建
  const columnsRef = useRef(columns)
  useEffect(() => {
    columnsRef.current = columns
  }, [columns])

  // 构建 Ant Design Table 的 columns
  // 关键优化:只创建一次,所有动态内容通过 ref 访问
  const tableColumns: ColumnType<InputTableItem>[] = useMemo(() => {
    const cols: ColumnType<InputTableItem>[] = columnsRef.current.map((col, colIndex) => ({
      key: col.key,
      title: col.title,
      dataIndex: col.dataIndex || col.key,
      width: col.width,
      align: col.align,
      render: (cellValue: unknown, record: InputTableItem, index: number) => {
        // 所有内容都通过 ref 访问最新值
        const currentCol = columnsRef.current[colIndex]
        if (currentCol?.render) {
          // 使用自定义 render 函数
          // 创建一个 onChange 回调来更新该单元格的值
          const handleCellChange = (newValue: unknown) => {
            // 使用函数式 setState 来访问最新的 items 状态
            setItems((currentItems) => {
              const newItems = currentItems.map((item) =>
                item.id === record.id ? { ...item, [currentCol.key]: newValue } : item,
              )
              updateValue(newItems)
              return newItems
            })
          }

          const { id, ...data } = record

          // 包装渲染内容,添加焦点追踪和标记
          return (
            <div
              data-input-table-cell={`${record.id}-${currentCol.key}`}
              onFocus={() => {
                focusedInputRef.current = { rowId: record.id, columnKey: currentCol.key }
              }}
            >
              {currentCol.render(cellValue, data, index, handleCellChange)}
            </div>
          )
        }
        // 默认直接显示值
        return cellValue as React.ReactNode
      },
    }))

    // 如果允许删除，添加操作列
    if (removable && !disabled) {
      cols.push({
        key: 'action',
        title: '操作',
        width: 80,
        align: 'center',
        render: (_: unknown, record: InputTableItem) => (
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              // 使用函数式 setState 来访问最新的 items 状态
              setItems((currentItems) => {
                const newItems = currentItems.filter((item) => item.id !== record.id)
                updateValue(newItems)
                return newItems
              })
            }}
          >
            删除
          </Button>
        ),
      })
    }

    return cols
    // 空依赖数组:tableColumns 永远只创建一次!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={className} style={style}>
      <Table
        dataSource={items}
        columns={tableColumns}
        rowKey="id"
        pagination={false}
        bordered={bordered}
        size={size}
      />
      {addable && !disabled && (
        <Button
          type="dashed"
          onClick={handleAdd}
          icon={addBtnIcon || <PlusOutlined />}
          style={{ width: '100%', marginTop: 16 }}
        >
          {addBtnLabel}
        </Button>
      )}
    </div>
  )
})

InputTable.displayName = 'InputTable'

export default InputTable
