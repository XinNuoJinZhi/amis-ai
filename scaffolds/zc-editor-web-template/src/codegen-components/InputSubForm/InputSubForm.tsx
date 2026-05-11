import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Button, Tooltip, Modal } from 'antd'
import { PlusOutlined, CloseOutlined, HolderOutlined, EditOutlined } from '@ant-design/icons'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'

// 字段配置接口
export interface InputSubFormFieldConfig {
  key: string
  label: string
  render?: (args: {
    value: unknown
    onChange: (value: unknown) => void
    disabled: boolean
    fieldKey: string
    item: Record<string, unknown>
  }) => React.ReactNode
  required?: boolean
  disabled?: boolean
}

// 内部数据项接口
interface InputSubFormItem {
  id: string
  [key: string]: unknown
}

// 组件属性接口
interface InputSubFormProps {
  value?: Array<Record<string, unknown>>
  onChange?: (value: Array<Record<string, unknown>>) => void
  fields: InputSubFormFieldConfig[]
  title?: string
  multiple?: boolean
  draggable?: boolean
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

// 组件引用接口
export interface InputSubFormRef {
  getValue: () => Array<Record<string, unknown>>
  setValue: (value: Array<Record<string, unknown>>) => void
  addItem: () => void
  removeItem: (id: string) => void
  clear: () => void
}

// 生成唯一ID
const generateId = () => `subform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 可拖拽的子表单项组件
const DraggableSubFormItem: React.FC<{
  item: InputSubFormItem
  fields: InputSubFormFieldConfig[]
  title?: string
  showDragHandle: boolean
  onUpdate: (id: string, field: string, value: unknown) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  disabled?: boolean
  showRemove?: boolean
}> = ({
  item,
  fields,
  title,
  showDragHandle,
  onUpdate,
  onDelete,
  onEdit,
  disabled,
  showRemove = true,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border border-gray-300 rounded-md bg-white mb-2 group hover:border-blue-500 transition-colors"
    >
      {showDragHandle && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <HolderOutlined />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">{title || '子表单项'}</div>
        <div className="text-xs text-gray-500 mt-1">
          {fields.map(field => {
            const value = item[field.key]
            const displayValue = value ? String(value).substring(0, 30) : '-'
            return (
              <span key={field.key} className="mr-3">
                {field.label}: {displayValue}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip title="编辑">
          <EditOutlined
            className="cursor-pointer text-blue-500 hover:text-blue-700"
            onClick={() => onEdit(item.id)}
          />
        </Tooltip>
        {showRemove && (
          <Tooltip title="删除">
            <CloseOutlined
              className="cursor-pointer text-gray-400 hover:text-red-500"
              onClick={() => {
                if (!disabled) onDelete(item.id)
              }}
            />
          </Tooltip>
        )}
      </div>
    </div>
  )
}

// 子表单编辑弹窗
const SubFormModal: React.FC<{
  visible: boolean
  item: InputSubFormItem | null
  fields: InputSubFormFieldConfig[]
  title?: string
  onOk: (values: Record<string, unknown>) => void
  onCancel: () => void
  disabled?: boolean
}> = ({ visible, item, fields, title, onOk, onCancel, disabled }) => {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (item) {
      const { id, ...values } = item
      setFormValues(values)
    } else {
      setFormValues({})
    }
  }, [item])

  const handleFieldChange = (key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const handleOk = () => {
    onOk(formValues)
  }

  return (
    <Modal
      title={title || '编辑子表单'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={600}
      destroyOnClose
    >
      <div className="space-y-4 py-4">
        {fields.map(field => (
          <div key={field.key}>
            <div className="text-sm font-medium text-gray-700 mb-2">{field.label}</div>
            <div>
              {field.render ? (
                field.render({
                  value: formValues[field.key] ?? '',
                  onChange: (value) => handleFieldChange(field.key, value),
                  disabled: disabled || false,
                  fieldKey: `modal-${field.key}`,
                  item: formValues,
                })
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={String(formValues[field.key] ?? '')}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  disabled={disabled}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// 数据转换函数
const valueToItems = (
  value: Array<Record<string, unknown>> | undefined,
  fields: InputSubFormFieldConfig[] = [],
  existingItems?: InputSubFormItem[],
): InputSubFormItem[] => {
  if (!value || !Array.isArray(value)) {
    return []
  }

  return value
    .filter(item => item !== null && item !== undefined)
    .map((item, index) => {
      const existingItem = existingItems?.[index]
      const itemValue = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}

      if (existingItem) {
        return {
          ...existingItem,
          ...itemValue,
        }
      }

      return {
        id: `item-${index}-${generateId()}`,
        ...itemValue,
      }
    })
}

const itemsToValue = (items: InputSubFormItem[]): Array<Record<string, unknown>> => {
  return items.map(({ id, ...item }) => item)
}

// 主组件
const InputSubForm = forwardRef<InputSubFormRef, InputSubFormProps>(
  (
    {
      value,
      onChange,
      fields = [],
      title,
      multiple = true,
      draggable = false,
      disabled = false,
      className,
      style,
    },
    ref,
  ) => {
    if (!fields || fields.length === 0) {
      return (
        <div className={`w-full p-4 border border-dashed border-gray-300 rounded ${className || ''}`} style={style}>
          <span className="text-gray-400">InputSubForm 组件配置错误：缺少 fields 配置</span>
        </div>
      )
    }

    const [internalItems, setInternalItems] = useState<InputSubFormItem[]>(() =>
      valueToItems(value, fields, []),
    )
    const [modalVisible, setModalVisible] = useState(false)
    const [editingItem, setEditingItem] = useState<InputSubFormItem | null>(null)

    useEffect(() => {
      setInternalItems(prevItems => {
        const newItems = valueToItems(value, fields, prevItems)
        const hasChanged = JSON.stringify(newItems) !== JSON.stringify(prevItems)
        return hasChanged ? newItems : prevItems
      })
    }, [value, fields])

    const notifyChange = useCallback(
      (newItems: InputSubFormItem[]) => {
        const newValue = itemsToValue(newItems)
        onChange?.(newValue)
      },
      [onChange],
    )

    const addItem = useCallback(() => {
      const newItem: InputSubFormItem = {
        id: generateId(),
        ...fields.reduce(
          (acc, field) => {
            acc[field.key] = ''
            return acc
          },
          {} as Record<string, unknown>,
        ),
      }
      setEditingItem(newItem)
      setModalVisible(true)
    }, [fields])

    const removeItem = useCallback(
      (id: string) => {
        const newItems = internalItems.filter((item) => item.id !== id)
        setInternalItems(newItems)
        notifyChange(newItems)
      },
      [internalItems, notifyChange],
    )

    const updateItem = useCallback(
      (id: string, field: string, fieldValue: unknown) => {
        const newItems = internalItems.map((item) =>
          item.id === id ? { ...item, [field]: fieldValue } : item,
        )
        setInternalItems(newItems)
        notifyChange(newItems)
      },
      [internalItems, notifyChange],
    )

    const handleEdit = useCallback((id: string) => {
      const item = internalItems.find(item => item.id === id)
      if (item) {
        setEditingItem(item)
        setModalVisible(true)
      }
    }, [internalItems])

    const handleModalOk = useCallback((values: Record<string, unknown>) => {
      if (editingItem) {
        if (internalItems.find(item => item.id === editingItem.id)) {
          // 更新现有项
          const newItems = internalItems.map(item =>
            item.id === editingItem.id ? { ...item, ...values } : item
          )
          setInternalItems(newItems)
          notifyChange(newItems)
        } else {
          // 添加新项
          const newItem = { ...editingItem, ...values }
          const newItems = [...internalItems, newItem]
          setInternalItems(newItems)
          notifyChange(newItems)
        }
      }
      setModalVisible(false)
      setEditingItem(null)
    }, [editingItem, internalItems, notifyChange])

    const handleModalCancel = useCallback(() => {
      setModalVisible(false)
      setEditingItem(null)
    }, [])

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
          const oldIndex = internalItems.findIndex((item) => item.id === active.id)
          const newIndex = internalItems.findIndex((item) => item.id === over.id)

          const newItems = arrayMove(internalItems, oldIndex, newIndex)
          setInternalItems(newItems)
          notifyChange(newItems)
        }
      },
      [internalItems, notifyChange],
    )

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => itemsToValue(internalItems),
        setValue: (newValue: Array<Record<string, unknown>>) => {
          const newItems = valueToItems(newValue, fields, internalItems)
          setInternalItems(newItems)
        },
        addItem,
        removeItem,
        clear: () => {
          setInternalItems([])
          notifyChange([])
        },
      }),
      [internalItems, addItem, removeItem, notifyChange, fields],
    )

    const showDragHandle = draggable && multiple && internalItems.length > 1

    return (
      <div className={`w-full ${className || ''}`} style={style}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={internalItems.map((item) => item.id).filter(id => id !== null && id !== undefined)}
            strategy={verticalListSortingStrategy}
          >
            {internalItems.map((item) => (
              <DraggableSubFormItem
                key={item.id}
                item={item}
                fields={fields}
                title={title}
                showDragHandle={showDragHandle}
                onUpdate={updateItem}
                onDelete={removeItem}
                onEdit={handleEdit}
                disabled={disabled}
                showRemove={multiple}
              />
            ))}
          </SortableContext>
        </DndContext>

        {multiple && (
          <Button
            onClick={addItem}
            disabled={disabled}
            icon={<PlusOutlined />}
            style={{ marginTop: 8 }}
            size="small"
          >
            添加
          </Button>
        )}

        <SubFormModal
          visible={modalVisible}
          item={editingItem}
          fields={fields}
          title={title}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          disabled={disabled}
        />
      </div>
    )
  },
)

InputSubForm.displayName = 'InputSubForm'

export { InputSubForm }
export default InputSubForm
export type { InputSubFormProps, InputSubFormItem }
