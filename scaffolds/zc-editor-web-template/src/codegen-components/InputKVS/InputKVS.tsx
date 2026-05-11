import React, {
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from 'react'
import { Button, Input, Tooltip } from 'antd'
import { PlusOutlined, CloseOutlined, HolderOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Dayjs } from 'dayjs'

// 值类型定义
type KVSValueType = string | number | boolean | Dayjs | null | object | unknown[]

// 控件配置项
interface ControlItem {
  name: string
  label: string
  defaultValue?: KVSValueType
  required?: boolean
  disabled?: boolean
  // 使用 UI 组件渲染输入控件
  // 使用示例：
  // render: ({ value, onChange, disabled }) => (
  //   <Switch checked={!!value} onChange={onChange} disabled={disabled} />
  // )
  render: (args: {
    value: KVSValueType
    onChange: (value: KVSValueType) => void
    disabled: boolean
    fieldKey: string
  }) => React.ReactNode
}

// 键值对项的数据类型
interface KVSItem {
  id: string
  key: string
  values: Record<string, KVSValueType>
}

// 组件属性接口
interface InputKVSProps {
  value?: Record<string, unknown>
  onChange?: (value: Record<string, unknown>) => void
  valueItems?: ControlItem[] // 动态字段配置
  valueIsArray?: boolean // 子级是否为数组格式，默认为对象
  keyPlaceholder?: string
  // 键名（字段名）配置：目前支持自定义标签文案
  keyItem?: {
    label?: string
  }
  disabled?: boolean
  maxItems?: number
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  draggable?: boolean // 是否支持拖拽排序
}

// 组件引用接口
export interface InputKVSRef {
  getValue: () => Record<string, unknown>
  setValue: (value: Record<string, unknown>) => void
  addItem: (key?: string) => void
  removeItem: (key: string) => void
  clear: () => void
  validate: () => { valid: boolean; errors: string[] }
}

// 生成唯一ID
const generateId = () => `kvs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const InputKVS = forwardRef<InputKVSRef, InputKVSProps>(
  (
    {
      value = {},
      onChange,
      valueItems = [],
      valueIsArray = false,
      keyPlaceholder = '请输入字段名',
      keyItem,
      disabled = false,
      maxItems = 50,
      className,
      style,
      placeholder = '暂无数据',
      draggable = true,
    },
    ref,
  ) => {
    // 字段名标签文案，默认“字段名”
    const keyLabel = keyItem?.label ?? '字段名'
    const [items, setItems] = useState<KVSItem[]>([])
    const isInternalUpdate = useRef(false)
    // 记录最近一次获得焦点的输入，用于在渲染后恢复焦点（防止因重建导致失焦）
    const focusedRef = useRef<{ id: string; fieldName?: string; type: 'key' | 'value' } | null>(
      null,
    )

    // 将外部值转换为内部数据结构
    const valueToItems = useCallback(
      (val: Record<string, unknown>, existingItems?: KVSItem[]): KVSItem[] => {
        return Object.entries(val).map(([key, itemValue]) => {
          // 尝试从现有items中找到对应的项，保持id稳定
          const existingItem = existingItems?.find((item) => item.key === key)

          const values =
            typeof itemValue === 'object' && itemValue !== null
              ? (itemValue as Record<string, KVSValueType>)
              : { value: itemValue as KVSValueType }

          if (existingItem) {
            // 如果存在对应的项，保持原有的id，只更新数据
            return {
              ...existingItem,
              key,
              values,
            }
          }

          // 如果不存在，生成新的id
          return {
            id: generateId(),
            key,
            values,
          }
        })
      },
      [],
    )

    // 将内部数据结构转换为外部值
    const itemsToValue = useCallback(
      (itemList: KVSItem[]): Record<string, unknown> => {
        const result: Record<string, unknown> = {}
        const keyCount: Record<string, number> = {}

        itemList.forEach((item) => {
          if (item.key.trim()) {
            const trimmedKey = item.key.trim()

            // 处理重复键名：为重复的键名添加数字后缀
            let finalKey = trimmedKey
            if (Object.prototype.hasOwnProperty.call(result, finalKey)) {
              keyCount[trimmedKey] = (keyCount[trimmedKey] || 1) + 1
              finalKey = `${trimmedKey}_${keyCount[trimmedKey]}`
            } else {
              keyCount[trimmedKey] = 1
            }

            if (valueIsArray) {
              // 数组格式：将 values 对象转换为数组
              result[finalKey] = Object.values(item.values)
            } else {
              // 对象格式：直接使用 values 对象
              result[finalKey] = item.values
            }
          }
        })

        return result
      },
      [valueIsArray],
    )

    // 更新外部值
    const updateValue = useCallback(
      (newItems: KVSItem[]) => {
        isInternalUpdate.current = true
        const newValue = itemsToValue(newItems)
        onChange?.(newValue)
        // 使用 setTimeout 来重置标志，确保在下一个事件循环中重置
        setTimeout(() => {
          isInternalUpdate.current = false
        }, 0)
      },
      [onChange, itemsToValue],
    )

    // 在 items 发生变化后尝试恢复输入焦点
    useEffect(() => {
      if (!focusedRef.current) return

      const { id, type, fieldName } = focusedRef.current
      // 通过 data-kvs-focus 标记定位输入元素
      const selector =
        type === 'key'
          ? `[data-kvs-focus="key-${id}"]`
          : `[data-kvs-focus="value-${id}-${fieldName}"]`
      const el = document.querySelector(selector) as HTMLElement | null
      if (el) {
        // 延迟到下一帧确保元素已完成渲染
        requestAnimationFrame(() => {
          el.focus()
        })
      }
    }, [items, keyLabel])

    // 同步外部值变化
    useEffect(() => {
      // 如果是内部更新触发的，跳过同步
      if (isInternalUpdate.current) {
        return
      }

      const newItems = valueToItems(value || {}, items)

      // 深度比较数据内容（忽略id字段）- 修复 TS 索引类型错误，并且显式比较 key 与 values
      const itemsDataEqual = (items1: KVSItem[], items2: KVSItem[]) => {
        if (items1.length !== items2.length) return false
        for (let i = 0; i < items1.length; i++) {
          const a = items1[i]
          const b = items2[i]
          if (!b) return false
          if (a.key !== b.key) return false
          if (JSON.stringify(a.values) !== JSON.stringify(b.values)) return false
        }
        return true
      }

      // 只有当数据内容真正发生变化时才更新状态
      if (!itemsDataEqual(newItems, items)) {
        setItems(newItems)
      }
    }, [value]) // 移除items和valueToItems依赖，避免循环更新

    // 处理字段名变更 - 使用函数式更新避免依赖items
    const handleKeyChange = useCallback(
      (id: string, newKey: string) => {
        setItems((prevItems) => {
          const newItems = prevItems.map((i) => (i.id === id ? { ...i, key: newKey } : i))
          updateValue(newItems)
          return newItems
        })
      },
      [updateValue],
    )
    const addItem = useCallback(
      (key = '') => {
        const defaultValues: Record<string, KVSValueType> = {}

        // 添加动态字段的默认值
        valueItems.forEach((item) => {
          defaultValues[item.name] = item.defaultValue ?? ''
        })

        const newItem: KVSItem = {
          id: generateId(),
          key: key || '',
          values: defaultValues,
        }
        const newItems = [...items, newItem]
        setItems(newItems)
        updateValue(newItems)
      },
      [items, updateValue, valueItems],
    )

    // 删除项
    const removeItem = useCallback(
      (id: string) => {
        const newItems = items.filter((item) => item.id !== id)
        setItems(newItems)
        updateValue(newItems)
      },
      [items, updateValue],
    )

    // 更新项的值 - 使用函数式更新避免依赖items
    const updateItemValue = useCallback(
      (id: string, fieldName: string, newValue: KVSValueType) => {
        setItems((prevItems) => {
          const newItems = prevItems.map((item) =>
            item.id === id ? { ...item, values: { ...item.values, [fieldName]: newValue } } : item,
          )
          updateValue(newItems)
          return newItems
        })
      },
      [updateValue],
    )

    // 配置传感器
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    )

    // 拖拽结束处理
    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over?.id)

          const newItems = arrayMove(items, oldIndex, newIndex)
          setItems(newItems)
          updateValue(newItems)
        }
      },
      [items, updateValue],
    )

    // 验证数据
    const validate = useCallback(() => {
      const errors: string[] = []
      const keyCount = new Map<string, number>()

      items.forEach((item, index) => {
        // 检查空键
        if (!item.key.trim()) {
          errors.push(`第${index + 1}项的键不能为空`)
        }

        // 统计重复键
        if (item.key.trim()) {
          const trimmedKey = item.key.trim()
          keyCount.set(trimmedKey, (keyCount.get(trimmedKey) || 0) + 1)
        }
      })

      // 检查重复键并添加错误信息
      keyCount.forEach((count, key) => {
        if (count > 1) {
          errors.push(`键 "${key}" 重复 ${count} 次，请修改为不同的${keyLabel}`)
        }
      })

      return {
        valid: errors.length === 0,
        errors,
      }
    }, [items])

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getValue: () => itemsToValue(items),
      setValue: (newValue) => {
        const newItems = valueToItems(newValue)
        setItems(newItems)
        updateValue(newItems)
      },
      addItem,
      removeItem,
      clear: () => {
        setItems([])
        updateValue([])
      },
      validate,
    }))

    // 渲染字段编辑器 - 移除useCallback，避免依赖问题
    const renderFieldEditor = (item: KVSItem, fieldName: string, config?: ControlItem) => {
      const value = item.values[fieldName]

      if (!config) {
        // 默认的输入框
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => updateItemValue(item.id, fieldName, e.target.value)}
            placeholder="请输入值"
            disabled={disabled}
            size="small"
          />
        )
      }

      // 使用自定义 UI 渲染函数
      const stableKey = `${item.id}-${fieldName}-${config.name}`
      return config.render({
        value,
        onChange: (newValue) => updateItemValue(item.id, fieldName, newValue as KVSValueType),
        disabled,
        fieldKey: stableKey,
      })
    }



    // 计算重复键的映射
    const duplicateKeys = useMemo(() => {
      const keyCount = new Map<string, number>()
      items.forEach((item) => {
        if (item.key.trim()) {
          const trimmedKey = item.key.trim()
          keyCount.set(trimmedKey, (keyCount.get(trimmedKey) || 0) + 1)
        }
      })

      const duplicates = new Set<string>()
      keyCount.forEach((count, key) => {
        if (count > 1) {
          duplicates.add(key)
        }
      })

      return duplicates
    }, [items])

    // SortableItem组件 - 完全重构，移除所有不必要的依赖
    const SortableItem = React.memo<{
      item: KVSItem
      isDuplicateKey: boolean
      onKeyChange: (id: string, newKey: string) => void
      onRemove: (id: string) => void
    }>(({ item, isDuplicateKey, onKeyChange, onRemove }) => {
      const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
      })

      const dragStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
        opacity: isDragging ? 0.5 : 1,
      }

      // 渲染表单控件 - 直接调用renderFieldEditor，避免重新渲染
      const renderFormControl = (fieldName: string, config: ControlItem) => {
        return renderFieldEditor(item, fieldName, config)
      }

      return (
        <div
          ref={setNodeRef}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '12px',
            width: '100%',
            ...dragStyle,
          }}
          {...attributes}
        >
          {/* 拖拽图标 - 只在有多条数据时显示 */}
          {items.length > 1 && draggable && (
            <div
              className="flex-shrink-0 w-[20px] h-[20px] flex items-center justify-center mt-[6px] cursor-pointer"
              {...listeners}
            >
              <Tooltip placement="bottom" title="拖拽排序">
                <HolderOutlined style={{ fontSize: '14px', color: '#999' }} />
              </Tooltip>
            </div>
          )}

          <div
            className="group p-[12px] border border-dashed border-[#e5e5e5] hover:border-[#2468F2] transition-colors duration-200 rounded-[4px] w-full"
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div className="flex flex-row-reverse mb-[8px]">
              <Tooltip placement="bottom" title="删除">
                <CloseOutlined
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[12px]"
                  style={{ color: '#84878c' }}
                  onClick={() => onRemove(item.id)}
                />
              </Tooltip>
            </div>

            {/* 字段名输入框 */}
            <div className="mb-[12px]">
              <div className="text-[12px] text-[#666] mb-[4px] flex items-center gap-1">
                {keyLabel}
                {isDuplicateKey && (
                  <Tooltip title={`${keyLabel}重复，请修改为不同的${keyLabel}`}>
                    <span className="text-[#ff4d4f] text-[10px]">⚠️</span>
                  </Tooltip>
                )}
              </div>
              <Input
                value={item.key}
                onChange={(e) => onKeyChange(item.id, e.target.value)}
                placeholder={keyPlaceholder}
                disabled={disabled}
                size="small"
                status={isDuplicateKey ? 'error' : undefined}
                style={{
                  borderColor: isDuplicateKey ? '#ff4d4f' : undefined,
                }}
                onFocus={() => {
                  focusedRef.current = { id: item.id, type: 'key' }
                }}
                data-kvs-focus={`key-${item.id}`}
              />
              {isDuplicateKey && (
                <div className="text-[10px] text-[#ff4d4f] mt-[2px]">{`${keyLabel}重复，请修改为不同的${keyLabel}`}</div>
              )}
            </div>

            {/* 动态字段 */}
            {valueItems.map((config, index) => (
              <div key={config.name} className={index === valueItems.length - 1 ? '' : 'mb-[12px]'}>
                <div className="text-[12px] text-[#666] mb-[4px]">{config.label}</div>
                {renderFormControl(config.name, config)}
              </div>
            ))}
          </div>
        </div>
      )
    })

    return (
      <div className={`w-full ${className || ''}`} style={style}>
        {/* 空状态提示 */}
        {items.length === 0 && <div style={{ color: '#b8babf' }}>{placeholder}</div>}

        {/* 键值对列表 */}
        {draggable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-[10px] w-full">
                {items.map((item) => {
                  const isDuplicateKey = duplicateKeys.has(item.key.trim())
                  return (
                    <SortableItem
                      key={item.id}
                      item={item}
                      isDuplicateKey={isDuplicateKey}
                      onKeyChange={handleKeyChange}
                      onRemove={removeItem}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col gap-[12px] w-full">
            {items.map((item) => {
              const isDuplicateKey = duplicateKeys.has(item.key.trim())
              return (
                <SortableItem
                  key={item.id}
                  item={item}
                  isDuplicateKey={isDuplicateKey}
                  onKeyChange={handleKeyChange}
                  onRemove={removeItem}
                />
              )
            })}
          </div>
        )}

        {/* 添加按钮 */}
        <Button
          icon={<PlusOutlined />}
          onClick={() => addItem()}
          disabled={disabled || items.length >= maxItems}
          size="small"
          style={{
            marginTop: '8px',
            color: '#666',
            height: 'auto',
            padding: '4px 8px',
          }}
        >
          新增字段
        </Button>
      </div>
    )
  },
)

InputKVS.displayName = 'InputKVS'

export { InputKVS }
export type { InputKVSProps, KVSItem, ControlItem }
