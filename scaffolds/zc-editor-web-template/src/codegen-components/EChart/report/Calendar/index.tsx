import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react'
import { EChart, type EChartRef, type EChartsOption } from '../../EChart'

export interface CalendarProps {
  data?: Array<[string, number]>
  year?: number
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
  theme?: string
  loading?: boolean
}

export interface CalendarRef extends EChartRef {
  updateData: (data: Array<[string, number]>) => void
}

export const Calendar = forwardRef<CalendarRef, CalendarProps>(
  (
    {
      data,
      year = new Date().getFullYear(),
      width = '100%',
      height = 400,
      className,
      style,
      theme,
      loading = false,
    },
    ref,
  ) => {
    const chartRef = useRef<EChartRef>(null)

    // 生成默认数据
    const generateDefaultData = (targetYear: number): Array<[string, number]> => {
      const data: Array<[string, number]> = []
      const startDate = new Date(targetYear, 0, 1)
      const endDate = new Date(targetYear, 11, 31)

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        const value = Math.floor(Math.random() * 100)
        data.push([dateStr, value])
      }

      return data
    }

    const calendarData = data || generateDefaultData(year)

    // 使用 useMemo 优化配置项计算
    const option: EChartsOption = useMemo(() => {
      return {
        title: {
          text: `${year}年日历图`,
          left: 'center',
          textStyle: {
            color: '#333',
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: 'item',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            const date = params.data[0]
            const value = params.data[1]
            return `${date}<br/>数值: ${value}`
          },
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderColor: '#333',
          textStyle: {
            color: '#fff',
          },
        },
        visualMap: {
          min: 0,
          max: Math.max(...calendarData.map((item) => item[1])),
          type: 'continuous',
          orient: 'horizontal',
          left: 'center',
          top: 65,
          inRange: {
            color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'],
          },
        },
        calendar: {
          top: 120,
          left: 30,
          right: 30,
          cellSize: ['auto', 13],
          range: year,
          itemStyle: {
            borderWidth: 0.5,
          },
          yearLabel: { show: false },
        },
        series: [
          {
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: calendarData,
          },
        ],
      }
    }, [calendarData, year])

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      ...chartRef.current!,
      updateData: (newData: Array<[string, number]>) => {
        if (chartRef.current) {
          chartRef.current.setOption({
            series: [
              {
                data: newData,
              },
            ],
          })
        }
      },
    }))

    return (
      <EChart
        ref={chartRef}
        option={option}
        width={width}
        height={height}
        className={className}
        style={style}
        theme={theme}
        loading={loading}
      />
    )
  },
)

Calendar.displayName = 'Calendar'

export default Calendar
