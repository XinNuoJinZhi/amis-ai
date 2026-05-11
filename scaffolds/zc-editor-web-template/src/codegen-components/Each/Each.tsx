import React from 'react'

export interface EachProps {
  /** 获取数据域中变量名 */
  name?: string
  /** 数据源表达式 */
  source?: string
  /** 用于循环的值 */
  value?: any[]
  /** 当 value 为空时的占位文本 */
  placeholder?: string
  /** 循环当前数组成员的变量名（默认 item） */
  itemKeyName?: string
  /** 循环当前索引的变量名（默认 index） */
  indexKeyName?: string
  /** 外层类名 */
  className?: string
  /** 外层样式 */
  style?: React.CSSProperties
  /** 渲染每个项目的函数 */
  children?: (item: any, index: number) => React.ReactNode
  /** 或者使用 render prop */
  render?: (item: any, index: number) => React.ReactNode
}

/**
 * Each 循环渲染器
 * 用于循环渲染数组数据
 */
const Each: React.FC<EachProps> = (props) => {
  const {
    value = [],
    placeholder,
    className,
    style,
    children,
    render,
  } = props

  // 获取数据数组
  const dataArray = Array.isArray(value) ? value : []

  // 如果数组为空，显示占位符
  if (dataArray.length === 0) {
    if (placeholder) {
      return <span className={className} style={style}>{placeholder}</span>
    }
    return null
  }

  // 使用 children 或 render 函数渲染每个项目
  const renderItem = children || render

  return (
    <div className={className} style={style}>
      {dataArray.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem ? renderItem(item, index) : (
            // 默认渲染：如果是对象显示 JSON，否则显示值
            <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export { Each }
export default Each
