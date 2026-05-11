import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react'
import { Input, Button, message } from 'antd'
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

// 键值对项的数据类型
interface InputKVItem {
  id: string
  key: string
  value: string
}

// 组件属性接口
interface InputKVProps {
  value?: Record<string, string> // 键值对数据
  onChange?: (value: Record<string, string>) => void // 值变化回调
  defaultValue?: string // 新增项的默认值
  draggable?: boolean // 是否可拖拽，默认为 true
  keyPlaceholder?: string // 键的占位符
  valuePlaceholder?: string // 值的占位符
  valueComponent?: React.ComponentType<{
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }> // 自定义 value 组件
  className?: string // CSS类名
  style?: React.CSSProperties // 内联样式
}

// 组件引用接口
export interface InputKVRef {
  getValue: () => Record<string, string> // 获取当前值
  setValue: (value: Record<string, string>) => void // 设置值
  addItem: () => void // 添加项
  clear: () => void // 清空所有项
}

// 生成唯一ID
const generateId = () => `kv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 可拖拽的键值对项组件
const DraggableKVItem: React.FC<{
  item: InputKVItem
  showDragHandle: boolean
  keyPlaceholder: string
  valuePlaceholder: string
  valueComponent?: React.ComponentType<{
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }>
  onKeyChange: (id: string, key: string) => void
  onValueChange: (id: string, value: string) => void
  onDelete: (id: string) => void
  hasKeyError: boolean
}> = ({
  item,
  showDragHandle,
  keyPlaceholder,
  valuePlaceholder,
  valueComponent: ValueComponent,
  onKeyChange,
  onValueChange,
  onDelete,
  hasKeyError,
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
      className="flex items-center gap-2  p-2 rounded-md bg-white"
    >
      {/* 拖拽图标 - 只有多于一项且可拖拽时显示 */}
      {showDragHandle && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <HolderOutlined />
        </div>
      )}

      {/* Key 输入框 */}
      <Input
        placeholder={keyPlaceholder}
        value={item.key}
        onChange={(e) => onKeyChange(item.id, e.target.value)}
        className={`flex-1 ${hasKeyError ? 'border-red-500' : ''}`}
        status={hasKeyError ? 'error' : undefined}
      />

      {/* Value 输入框 */}
      {ValueComponent ? (
        <ValueComponent
          value={item.value}
          onChange={(value) => onValueChange(item.id, value)}
          placeholder={valuePlaceholder}
        />
      ) : (
        <Input
          placeholder={valuePlaceholder}
          value={item.value}
          onChange={(e) => onValueChange(item.id, e.target.value)}
          className="flex-1"
        />
      )}

      {/* 删除按钮 */}
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={() => onDelete(item.id)}
        className="text-gray-400 hover:text-red-500 flex-shrink-0"
        size="small"
      />
    </div>
  )
}

const InputKV = forwardRef<InputKVRef, InputKVProps>(
  (
    {
      value = {},
      onChange,
      defaultValue = '',
      draggable = true,
      keyPlaceholder = 'Key',
      valuePlaceholder = 'Value',
      valueComponent,
      className = '',
      style,
    },
    ref,
  ) => {
    // 将对象转换为键值对数组
    const objectToItems = useCallback((obj: Record<string, string>): InputKVItem[] => {
      return Object.entries(obj).map(([key, val]) => ({
        id: generateId(),
        key,
        value: val,
      }))
    }, [])

    // 将键值对数组转换为对象（只包含有效的键值对）
    const itemsToObject = useCallback((items: InputKVItem[]): Record<string, string> => {
      const result: Record<string, string> = {}
      // 按照数组顺序处理，确保顺序保持
      items.forEach((item) => {
        if (item.key.trim()) {
          // 使用 Object.defineProperty 确保属性按顺序添加
          Object.defineProperty(result, item.key, {
            value: item.value,
            writable: true,
            enumerable: true,
            configurable: true
          })
        }
      })
      return result
    }, [])

    // 状态管理 - 使用内部状态作为唯一数据源
    const [items, setItems] = useState<InputKVItem[]>(() => objectToItems(value))

    // 跟踪外部 value 的变化，但不直接同步
    const prevValueRef = useRef(value)
    const isUpdatingRef = useRef(false)

    useEffect(() => {
      if (isUpdatingRef.current) {
        isUpdatingRef.current = false
        prevValueRef.current = value
        return
      }

      if (JSON.stringify(prevValueRef.current) !== JSON.stringify(value)) {
        setItems(objectToItems(value))
        prevValueRef.current = value
      }
    }, [value])

    // 检查 key 是否重复
    const checkDuplicateKeys = useCallback((items: InputKVItem[]) => {
      const keys = items.map((item) => item.key.trim()).filter((key) => key)
      const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index)
      return new Set(duplicateKeys)
    }, [])

    // 更新外部值 - 只在有效数据变化时触发
    const updateValue = useCallback(
      (newItems: InputKVItem[]) => {
        const duplicateKeys = checkDuplicateKeys(newItems)
        if (duplicateKeys.size > 0) {
          message.error(`键名重复: ${Array.from(duplicateKeys).join(', ')}`)
          return
        }

        // 标记正在内部更新
        isUpdatingRef.current = true
        const newValue = itemsToObject(newItems)
        onChange?.(newValue)
      },
      [onChange, itemsToObject, checkDuplicateKeys],
    )

    // 添加新项
    // 新增项 - 不立即触发 onChange，允许用户输入
    const addItem = useCallback(() => {
      const newItem: InputKVItem = {
        id: generateId(),
        key: '',
        value: defaultValue,
      }

      const newItems = [...items, newItem]
      setItems(newItems)
      // 不立即调用 updateValue，让用户先输入 key
    }, [items, defaultValue])

    // 删除项
    const removeItem = useCallback(
      (id: string) => {
        const newItems = items.filter((item) => item.id !== id)
        setItems(newItems)
        updateValue(newItems)
      },
      [items, updateValue],
    )

    // 更新项的 key
    const updateItemKey = useCallback(
      (id: string, key: string) => {
        const newItems = items.map((item) => (item.id === id ? { ...item, key } : item))
        setItems(newItems)
        updateValue(newItems)
      },
      [items, updateValue],
    )

    // 更新项的 value
    const updateItemValue = useCallback(
      (id: string, value: string) => {
        const newItems = items.map((item) => (item.id === id ? { ...item, value } : item))
        setItems(newItems)
        updateValue(newItems)
      },
      [items, updateValue],
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

    // 获取重复的 keys
    const duplicateKeys = checkDuplicateKeys(items)

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getValue: () => itemsToObject(items),
      setValue: (newValue: Record<string, string>) => {
        const newItems = objectToItems(newValue)
        setItems(newItems)
      },
      addItem,
      clear: () => {
        setItems([])
        onChange?.({})
      },
    }))

    // 是否显示拖拽图标
    const showDragHandle = draggable && items.length > 1

    return (
      <div
        className={`w-full h-full ${className}`}
        style={{ width: '100%', height: '100%', ...style }}
      >
        {/* 键值对列表 */}
        {items.length > 0 && (
          <div className="mb-4 w-full">
            {draggable ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  {items.map((item) => (
                    <DraggableKVItem
                      key={item.id}
                      item={item}
                      showDragHandle={showDragHandle}
                      keyPlaceholder={keyPlaceholder}
                      valuePlaceholder={valuePlaceholder}
                      valueComponent={valueComponent}
                      onKeyChange={updateItemKey}
                      onValueChange={updateItemValue}
                      onDelete={removeItem}
                      hasKeyError={duplicateKeys.has(item.key.trim()) && item.key.trim() !== ''}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              items.map((item) => (
                <DraggableKVItem
                  key={item.id}
                  item={item}
                  showDragHandle={false}
                  keyPlaceholder={keyPlaceholder}
                  valuePlaceholder={valuePlaceholder}
                  valueComponent={valueComponent}
                  onKeyChange={updateItemKey}
                  onValueChange={updateItemValue}
                  onDelete={removeItem}
                  hasKeyError={duplicateKeys.has(item.key.trim()) && item.key.trim() !== ''}
                />
              ))
            )}
          </div>
        )}

        {/* 新增按钮 */}
        <Button onClick={addItem} icon={<PlusOutlined />}>
          新增
        </Button>
      </div>
    )
  },
)

InputKV.displayName = 'InputKV'

export { InputKV }
export type { InputKVProps, InputKVItem }
