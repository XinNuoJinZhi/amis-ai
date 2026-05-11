import React, { useMemo, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { EChart, type EChartRef, type EChartsOption } from '../../EChart'

export interface ScatterMapProps {
  data?: Array<{ name: string; value: [number, number, number] }>
  dataUrl?: string
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
  theme?: string
  loading?: boolean
}

export interface ScatterMapRef extends EChartRef {
  updateData: (data: Array<{ name: string; value: [number, number, number] }>) => void
}

export const ScatterMap = forwardRef<ScatterMapRef, ScatterMapProps>(
  (
    { data, dataUrl, width = '100%', height = 400, className, style, theme, loading = false },
    ref,
  ) => {
    const chartRef = useRef<EChartRef>(null)

    // 生成默认数据
    const generateDefaultData = (): Array<{ name: string; value: [number, number, number] }> => {
      const cities = [
        { name: '北京', coord: [116.46, 39.92] },
        { name: '上海', coord: [121.48, 31.22] },
        { name: '深圳', coord: [114.07, 22.62] },
        { name: '广州', coord: [113.23, 23.16] },
        { name: '杭州', coord: [120.19, 30.26] },
        { name: '南京', coord: [118.78, 32.04] },
        { name: '成都', coord: [104.06, 30.67] },
        { name: '西安', coord: [108.95, 34.27] },
        { name: '武汉', coord: [114.31, 30.52] },
        { name: '重庆', coord: [106.54, 29.59] },
      ]

      return cities.map((city) => ({
        name: city.name,
        value: [city.coord[0], city.coord[1], Math.floor(Math.random() * 1000) + 100],
      }))
    }

    const [scatterData, setScatterData] = useState<
      Array<{ name: string; value: [number, number, number] }>
    >(data || generateDefaultData())
    const [isLoading, setIsLoading] = useState(false)

    // 从线上获取数据
    useEffect(() => {
      if (dataUrl && !data) {
        setIsLoading(true)
        fetch(dataUrl)
          .then((response) => response.json())
          .then((result) => {
            setScatterData(result)
            setIsLoading(false)
          })
          .catch((error) => {
            console.error('获取散点地图数据失败:', error)
            setScatterData(generateDefaultData())
            setIsLoading(false)
          })
      }
    }, [dataUrl, data])

    // 当 data prop 变化时更新本地状态
    useEffect(() => {
      if (data) {
        setScatterData(data)
      }
    }, [data])

    // 使用 useMemo 优化配置项计算
    const option: EChartsOption = useMemo(() => {
      return {
        title: {
          text: '气泡地图',
          left: 'center',
          textStyle: {
            color: '#2c3e50',
            fontSize: 18,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          trigger: 'item',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            const data = params.data
            return `${data.name}<br/>经度: ${data.value[0]}<br/>纬度: ${data.value[1]}<br/>数值: ${data.value[2]}`
          },
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderColor: '#333',
          textStyle: {
            color: '#fff',
          },
        },
        visualMap: {
          min: 0,
          max: Math.max(...scatterData.map((item) => item.value[2])),
          calculable: true,
          orient: 'vertical',
          left: 'left',
          top: 'center',
          inRange: {
            color: ['#c6e48b', '#7bc96f', '#239a3b', '#196127'],
            symbolSize: [10, 70],
          },
          textStyle: {
            color: '#2c3e50',
            fontSize: 12,
          },
        },
        geo: {
          map: 'china',
          roam: true,
          itemStyle: {
            areaColor: '#e7e8ea',
            borderColor: '#404a59',
          },
          emphasis: {
            label: {
              show: true,
            },
            itemStyle: {
              areaColor: '#2a333d',
            },
          },
        },
        series: [
          {
            name: '气泡数据',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: scatterData.map((item) => [
              item.value[0],
              item.value[1],
              item.value[2],
              item.name,
            ]),
            symbolSize: (val: number[]) => {
              return Math.max(val[2] / 20, 8)
            },
            label: {
              show: true,
              formatter: '{@[3]}',
              position: 'inside',
              color: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
            },
            itemStyle: {
              opacity: 0.8,
              shadowBlur: 15,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              shadowOffsetY: 3,
              borderWidth: 2,
              borderColor: '#fff',
            },
            emphasis: {
              scale: true,
              itemStyle: {
                opacity: 1,
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      }
    }, [scatterData])

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      ...chartRef.current!,
      updateData: (newData: Array<{ name: string; value: [number, number, number] }>) => {
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
        loading={loading || isLoading}
      />
    )
  },
)

ScatterMap.displayName = 'ScatterMap'

export default ScatterMap
