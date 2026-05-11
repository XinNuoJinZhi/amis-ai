import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'

// ECharts 相关类型定义
type EChartsInstance = ECharts

interface EChartsEventParams {
  type: string
  name?: string
  value?: unknown
  data?: unknown
  dataIndex?: number
  seriesIndex?: number
  [key: string]: unknown
}

// 组件 Props 接口
interface EChartProps {
  option?: EChartsOption
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
  theme?: string
  loading?: boolean
  loadingOption?: object
  onChartReady?: (chart: EChartsInstance) => void
  onClick?: (params: EChartsEventParams) => void
  onDoubleClick?: (params: EChartsEventParams) => void
  onMouseOver?: (params: EChartsEventParams) => void
  onMouseOut?: (params: EChartsEventParams) => void
}

// 组件 Ref 接口
export interface EChartRef {
  getChart: () => EChartsInstance | null
  resize: () => void
  setOption: (option: EChartsOption, notMerge?: boolean) => void
  clear: () => void
  dispose: () => void
}

// 默认配置
const defaultOption: EChartsOption = {
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
    },
  ],
}

const EChart = forwardRef<EChartRef, EChartProps>(
  (
    {
      option = defaultOption,
      width = '100%',
      height = '400px',
      className,
      style,
      theme,
      loading = false,
      loadingOption,
      onChartReady,
      onClick,
      onDoubleClick,
      onMouseOver,
      onMouseOut,
    },
    ref,
  ) => {
    const chartRef = useRef<HTMLDivElement>(null)
    const chartInstance = useRef<EChartsInstance | null>(null)

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      getChart: () => chartInstance.current,
      resize: () => {
        if (chartInstance.current) {
          chartInstance.current.resize()
        }
      },
      setOption: (newOption: EChartsOption, notMerge = false) => {
        if (chartInstance.current) {
          chartInstance.current.setOption(newOption, notMerge)
        }
      },
      clear: () => {
        if (chartInstance.current) {
          chartInstance.current.clear()
        }
      },
      dispose: () => {
        if (chartInstance.current) {
          chartInstance.current.dispose()
          chartInstance.current = null
        }
      },
    }))

    // 初始化图表
    useEffect(() => {
      if (!chartRef.current) return

      // 初始化 ECharts 实例
      const chart = echarts.init(chartRef.current, theme) as EChartsInstance
      chartInstance.current = chart

      // 设置配置项 - 使用 setTimeout 避免在主进程中调用
      setTimeout(() => {
        if (chart && option) {
          chart.setOption(option)
        }
      }, 0)

      // 绑定事件
      if (onClick) {
        chart.on('click', onClick)
      }
      if (onDoubleClick) {
        chart.on('dblclick', onDoubleClick)
      }
      if (onMouseOver) {
        chart.on('mouseover', onMouseOver)
      }
      if (onMouseOut) {
        chart.on('mouseout', onMouseOut)
      }

      // 图表准备完成回调
      if (onChartReady) {
        onChartReady(chart)
      }

      // 监听窗口大小变化
      const handleResize = () => {
        chart.resize()
      }
      window.addEventListener('resize', handleResize)

      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
      }
    }, [theme, onChartReady, onClick, onDoubleClick, onMouseOver, onMouseOut])

    // 更新配置项
    useEffect(() => {
      if (chartInstance.current && option) {
        // 使用 setTimeout 避免在主进程中调用 setOption
        setTimeout(() => {
          if (chartInstance.current) {
            chartInstance.current.setOption(option, true)
          }
        }, 0)
      }
    }, [option])

    // 处理加载状态
    useEffect(() => {
      if (chartInstance.current) {
        if (loading) {
          chartInstance.current.showLoading(loadingOption)
        } else {
          chartInstance.current.hideLoading()
        }
      }
    }, [loading, loadingOption])

    return (
      <div
        ref={chartRef}
        className={className}
        style={{
          width,
          height,
          ...style,
        }}
      />
    )
  },
)

EChart.displayName = 'EChart'

export { EChart }
export type { EChartProps, EChartsOption, EChartsEventParams, EChartsInstance }
