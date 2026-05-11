import React, { useRef, useEffect, useCallback } from 'react'

export interface CustomProps {
  /** 初始化节点 HTML */
  html?: string
  /** 节点初始化之后调用的函数 */
  onMount?: string | ((dom: HTMLElement, data: any, onChange: (value: any, name?: string) => void, props: CustomProps) => void)
  /** 数据有更新时调用的函数 */
  onUpdate?: string | ((dom: HTMLElement, data: any, prevData: any, props: CustomProps) => void)
  /** 节点销毁时调用的函数 */
  onUnmount?: string | ((props: CustomProps) => void)
  /** 是否使用 span 标签（默认 div） */
  inline?: boolean
  /** 节点 class */
  className?: string
  /** 节点名称 */
  name?: string
  /** 当前数据 */
  data?: any
  /** 值变更回调 */
  onChange?: (value: any, name?: string) => void
}

/**
 * Custom 自定义组件
 * 用于实现自定义组件，支持 HTML + onMount/onUpdate/onUnmount 脚本
 */
const Custom: React.FC<CustomProps> = (props) => {
  const {
    html = '',
    onMount,
    onUpdate,
    onUnmount,
    inline = false,
    className,
    name,
    data,
    onChange,
  } = props

  const domRef = useRef<HTMLDivElement | HTMLSpanElement>(null)
  const prevDataRef = useRef<any>(null)
  const mountedRef = useRef(false)

  // 创建 onChange 回调
  const handleChange = useCallback((value: any, fieldName?: string) => {
    if (onChange) {
      onChange(value, fieldName || name)
    }
  }, [onChange, name])

  // 执行函数字符串或函数
  const executeFunction = useCallback((
    fn: string | ((...args: any[]) => void) | undefined,
    ...args: any[]
  ) => {
    if (!fn) return

    try {
      if (typeof fn === 'function') {
        fn(...args)
      } else if (typeof fn === 'string' && fn.trim()) {
        // 将字符串转换为函数并执行
        // eslint-disable-next-line no-new-func
        const func = new Function('dom', 'data', 'onChange', 'props', fn)
        func(...args)
      }
    } catch (error) {
      console.error('Custom component script execution error:', error)
    }
  }, [])

  // onMount 效果
  useEffect(() => {
    if (domRef.current && !mountedRef.current) {
      mountedRef.current = true
      executeFunction(onMount, domRef.current, data, handleChange, props)
    }

    // onUnmount 清理
    return () => {
      if (mountedRef.current) {
        executeFunction(onUnmount, props)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // onUpdate 效果
  useEffect(() => {
    if (mountedRef.current && domRef.current && prevDataRef.current !== undefined) {
      executeFunction(onUpdate, domRef.current, data, prevDataRef.current, props)
    }
    prevDataRef.current = data
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const Container = inline ? 'span' : 'div'

  return (
    <Container
      ref={domRef as any}
      className={className}
      dangerouslySetInnerHTML={html ? { __html: html } : undefined}
    />
  )
}

export { Custom }
export default Custom
