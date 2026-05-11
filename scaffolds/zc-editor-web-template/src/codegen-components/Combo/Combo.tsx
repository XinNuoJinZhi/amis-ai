import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { PlusOutlined, CloseOutlined, HolderOutlined } from '@ant-design/icons'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'

// 字段配置接口
export interface ComboFieldConfig {
  key: string // 字段的唯一标识
  label: string // 字段显示标题
  render?: (args: {
    value: unknown
    onChange: (value: unknown) => void
    disabled: boolean
    fieldKey: string
    item: Record<string, unknown> // 整个 Combo 行数据对象
  }) => React.ReactNode // 使用 React 组件渲染输入控件 (可选，与html二选一)
  required?: boolean
  disabled?: boolean
}

// 内部数据项接口
interface ComboItem {
  id: string
  [key: string]: unknown // 动态字段值
}

// 组件属性接口
interface ComboProps {
  value?: Record<string, unknown> | Array<Record<string, unknown>> | Array<unknown> // 支持单个对象、对象数组或简单值数组
  onChange?: (value: Record<string, unknown> | Array<Record<string, unknown>> | Array<unknown>) => void
  fields: ComboFieldConfig[] // 字段配置
  multiple?: boolean // 是否支持多选
  draggable?: boolean // 是否支持拖拽排序，默认false，前置条件multiple=true
  multiLine?: boolean // 是否每条数据的标题和输入框单独占一行，默认false
  flat?: boolean // 多选模式下，当只有一个表单项时，是否将对象数组扁平化为简单值数组，默认false
  maxItems?: number // 最大项数
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

// 组件引用接口
export interface ComboRef {
  getValue: () => Record<string, unknown> | Array<Record<string, unknown>> | Array<unknown>
  setValue: (value: Record<string, unknown> | Array<Record<string, unknown>> | Array<unknown>) => void
  addItem: () => void
  removeItem: (id: string) => void
  clear: () => void
}

// 生成唯一ID
const generateId = () => `combo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 可拖拽的组合项组件
const DraggableComboItem: React.FC<{
  item: ComboItem
  fields: ComboFieldConfig[]
  showDragHandle: boolean
  onUpdate: (id: string, field: string, value: unknown) => void
  onDelete: (id: string) => void
  disabled?: boolean
  showRemove?: boolean
  multiLine?: boolean // 新增multiLine参数
}> = ({
  item,
  fields,
  showDragHandle,
  onUpdate,
  onDelete,
  disabled,
  showRemove = true,
  multiLine = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }


  // 渲染表单控件
  const renderFormControl = (field: ComboFieldConfig) => {
    const { key, render } = field
    const value = item[key] ?? '' // 使用 ?? 而不是 ||，避免 0、false 等 falsy 值被替换

    const handleChange = (newValue: unknown) => {
      onUpdate(item.id, key, newValue)
    }

    // 优先使用 render 函数
    if (render) {
      return render({
        value,
        onChange: handleChange,
        disabled: disabled || false,
        fieldKey: `${item.id}-${key}`,
        // 传递整个 item 对象，供 ServiceInCombo 等需要访问其他字段的组件使用
        item,
      })
    }

    // 如果都没有提供，返回默认输入框
    return <input type="text" value={String(value)} onChange={(e) => handleChange(e.target.value)} />
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        multiLine
          ? 'flex items-start gap-2 mb-2'
          : 'flex items-center gap-2 p-2 rounded-md bg-white mb-2'
      }
    >
      {/* 拖拽图标 - multiLine模式下放在外面 */}
      {showDragHandle && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0 mt-2"
        >
          <HolderOutlined />
        </div>
      )}

      {/* 内容区域 */}
      <div
        className={
          multiLine
            ? 'group p-3 border border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-200 rounded-md w-full relative'
            : 'group flex items-center gap-2 flex-1'
        }
      >
        {/* multiLine模式下的删除按钮 - 右上角 */}
        {multiLine && showRemove && (
          <div className="absolute top-2 right-2 z-10">
            <Tooltip placement="bottom" title="删除">
              <CloseOutlined
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer text-[12px]"
                style={{ color: disabled ? '#d9d9d9' : '#84878c' }}
                onClick={() => {
                  if (!disabled) onDelete(item.id)
                }}
              />
            </Tooltip>
          </div>
        )}

        {/* 动态字段 */}
        {(fields || []).map((field) => (
          <div
            key={field.key}
            className={multiLine ? 'mb-3 last:mb-0' : 'flex items-center gap-1 flex-1'}
          >
            {multiLine ? (
              // multiLine模式：标题和输入框分行显示
              <>
                <div className="text-sm text-gray-600 mb-1">{field.label}</div>
                <div className="w-full">{renderFormControl(field)}</div>
              </>
            ) : (
              // 默认模式：标题和输入框同行显示
              <>
                {field.label && (
                  <span className="text-sm text-gray-600 whitespace-nowrap min-w-0">
                    {field.label}:
                  </span>
                )}
                <div className="flex-1 min-w-0">{renderFormControl(field)}</div>
              </>
            )}
          </div>
        ))}

        {/* 默认模式下的删除按钮 */}
        {!multiLine && showRemove && (
          <Tooltip placement="bottom" title="删除">
            <CloseOutlined
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer text-[12px]"
              style={{ color: disabled ? '#d9d9d9' : '#84878c' }}
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

// 数据转换函数
const valueToItems = (
  value: Record<string, unknown> | Array<Record<string, unknown>> | Array<unknown> | undefined,
  multiple: boolean,
  flat: boolean = false,
  fields: ComboFieldConfig[] = [],
  existingItems?: ComboItem[], // 新增参数：现有的items，用于保持key稳定
): ComboItem[] => {
  if (!value) {
    return []
  }

  if (multiple) {
    // 多行模式：value 是数组
    if (Array.isArray(value)) {
      // 处理flat模式：简单值数组转换为对象数组
      if (flat && fields.length === 1) {
        const fieldKey = fields[0].key
        return value
          .filter(item => item !== null && item !== undefined) // 过滤掉 null 和 undefined
          .map((item, index) => {
            // 尝试从现有items中找到对应的项，保持key稳定
            const existingItem = existingItems?.[index]
            const itemValue = typeof item === 'object' && item !== null ? item : { [fieldKey]: item }

            if (existingItem) {
              // 如果存在对应的项，保持原有的id，只更新数据
              return {
                ...existingItem,
                ...itemValue,
              }
            }
            // 如果不存在，生成新的id
            return {
              id: `item-${index}-${generateId()}`,
              ...itemValue,
            }
          })
      } else {
        // 正常对象数组处理
        return value
          .filter(item => item !== null && item !== undefined) // 过滤掉 null 和 undefined
          .map((item, index) => {
            // 尝试从现有items中找到对应的项，保持key稳定
            const existingItem = existingItems?.[index]
            const itemValue = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}

            if (existingItem) {
              // 如果存在对应的项，保持原有的id，只更新数据
              return {
                ...existingItem,
                ...itemValue,
              }
            }
            // 如果不存在，生成新的id
            return {
              id: `item-${index}-${generateId()}`,
              ...itemValue,
            }
          })
      }
    } else {
      console.warn('[valueToItems] 多行模式但 value 不是数组:', typeof value, value)
    }
  } else {
    // 单行模式：value 是对象
    if (typeof value === 'object' && !Array.isArray(value)) {
      // 尝试保持现有的id
      const existingItem = existingItems?.[0]
      return [
        {
          id: existingItem?.id || 'item-0',
          ...value,
        },
      ]
    } else {
      console.warn('[valueToItems] 单行模式但 value 不是对象:', typeof value, value)
    }
  }

  return []
}

const itemsToValue = (
  items: ComboItem[],
  multiple: boolean,
  flat: boolean = false,
  fields: ComboFieldConfig[] = [],
): Record<string, unknown> | Array<Record<string, unknown>> | Array<unknown> => {
  if (multiple) {
    // 多行模式：返回数组
    if (flat && fields.length === 1) {
      // flat模式：返回简单值数组
      const fieldKey = fields[0].key
      return items.map(item => item[fieldKey])
    } else {
      // 正常模式：返回对象数组
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return items.map(({ id, ...item }) => item)
    }
  } else {
    // 单行模式：返回对象
    if (items.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...item } = items[0]
      return item
    }
    return {}
  }
}

// 主组件
const Combo = forwardRef<ComboRef, ComboProps>(
  (
    {
      value,
      onChange,
      fields = [],  // 提供默认值，避免 undefined
      multiple = false,
      draggable = false,
      multiLine = false,
      flat = false,
      maxItems,
      disabled = false,
      className,
      style,
    },
    ref,
  ) => {
    // 如果 fields 为空，显示警告信息而不是崩溃
    if (!fields || fields.length === 0) {
      return (
        <div className={`w-full p-4 border border-dashed border-gray-300 rounded ${className || ''}`} style={style}>
          <span className="text-gray-400">Combo 组件配置错误：缺少 fields 配置</span>
        </div>
      )
    }

    const [internalItems, setInternalItems] = useState<ComboItem[]>(() =>
      valueToItems(value, multiple, flat, fields, []),
    )

    // 说明：为兼容某些环境中 React 默认导出为 null 导致 dnd-kit 的 useSensor/useSensors 报错（读取 useMemo 失败）的问题，
    // 这里移除自定义 sensors，改用 DndContext 的默认 Pointer 传感器即可满足拖拽需求。

    // 同步外部 value 到内部状态
    useEffect(() => {
      setInternalItems(prevItems => {
        const newItems = valueToItems(value, multiple, flat, fields, prevItems)
        // 只有当items真正发生变化时才更新状态
        // 使用深度比较
        const hasChanged = JSON.stringify(newItems) !== JSON.stringify(prevItems)
        return hasChanged ? newItems : prevItems
      })
    }, [value, multiple, flat, fields]) // 添加 fields 到依赖数组，使用函数式更新避免闭包问题

    // 内部状态变化时通知外部
    const notifyChange = useCallback(
      (newItems: ComboItem[]) => {
        const newValue = itemsToValue(newItems, multiple, flat, fields)
        onChange?.(newValue)
      },
      [onChange, multiple, flat, fields],
    )

    // 添加项
    const addItem = useCallback(() => {
      if (maxItems && internalItems.length >= maxItems) return

      const newItem: ComboItem = {
        id: generateId(),
        ...(fields || []).reduce(
          (acc, field) => {
            acc[field.key] = ''
            return acc
          },
          {} as Record<string, unknown>,
        ),
      }

      const newItems = [...internalItems, newItem]
      setInternalItems(newItems)
      notifyChange(newItems)
    }, [internalItems, fields, maxItems, notifyChange])

    // 移除项
    const removeItem = useCallback(
      (id: string) => {
        const newItems = internalItems.filter((item) => item.id !== id)
        setInternalItems(newItems)
        notifyChange(newItems)
      },
      [internalItems, notifyChange],
    )

    // 更新项
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

    // 拖拽结束处理
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

    // 暴露给父组件的方法
    useImperativeHandle(
      ref,
      () => ({
        getValue: () => itemsToValue(internalItems, multiple, flat, fields),
        setValue: (newValue: Record<string, unknown> | Array<Record<string, unknown>> | Array<unknown>) => {
          const newItems = valueToItems(newValue, multiple, flat, fields, internalItems)
          setInternalItems(newItems)
        },
        addItem,
        removeItem,
        clear: () => {
          setInternalItems([])
          notifyChange([])
        },
      }),
      [internalItems, multiple, addItem, removeItem, notifyChange],
    )

    // 如果是单行模式且没有数据，自动添加一项
    useEffect(() => {
      if (!multiple && internalItems.length === 0) {
        addItem()
      }
    }, [multiple, internalItems.length, addItem])

    // 是否显示拖拽图标 - 需要满足draggable=true且multiple=true且有多条数据
    const showDragHandle = draggable && multiple && internalItems.length > 1

    return (
      <div className={`w-full ${className || ''}`} style={style}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={internalItems.map((item) => item.id).filter(id => id !== null && id !== undefined)}
            strategy={verticalListSortingStrategy}
          >
            {internalItems.map((item) => (
              <DraggableComboItem
                key={item.id}
                item={item}
                fields={fields}
                showDragHandle={showDragHandle}
                onUpdate={updateItem}
                onDelete={removeItem}
                disabled={disabled}
                showRemove={multiple && internalItems.length > 1}
                multiLine={multiLine}
              />
            ))}
          </SortableContext>
        </DndContext>

        {multiple && (!maxItems || internalItems.length < maxItems) && (
          <Button
            onClick={addItem}
            disabled={disabled}
            icon={<PlusOutlined />}
            style={{ marginTop: 8 }}
            size="small"
          >
            添加项
          </Button>
        )}
      </div>
    )
  },
)

Combo.displayName = 'Combo'

export { Combo }
export default Combo
export type { ComboProps, ComboItem }
