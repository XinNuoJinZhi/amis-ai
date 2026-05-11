import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

interface MapProps {
  data?: Array<{ name: string; value: number }>
  height?: number
  title?: string
  width?: string | number
  className?: string
  style?: React.CSSProperties
}

interface MapRef {
  getEChartsInstance: () => echarts.ECharts | null
}

// 默认数据
const defaultData = [
  { name: '北京', value: 177 },
  { name: '天津', value: 42 },
  { name: '河北', value: 102 },
  { name: '山西', value: 81 },
  { name: '内蒙古', value: 47 },
  { name: '辽宁', value: 67 },
  { name: '吉林', value: 82 },
  { name: '黑龙江', value: 123 },
  { name: '上海', value: 24 },
  { name: '江苏', value: 92 },
  { name: '浙江', value: 114 },
  { name: '安徽', value: 109 },
  { name: '福建', value: 116 },
  { name: '江西', value: 91 },
  { name: '山东', value: 119 },
  { name: '河南', value: 137 },
  { name: '湖北', value: 116 },
  { name: '湖南', value: 114 },
  { name: '重庆', value: 91 },
  { name: '四川', value: 125 },
  { name: '贵州', value: 62 },
  { name: '云南', value: 83 },
  { name: '西藏', value: 9 },
  { name: '陕西', value: 80 },
  { name: '甘肃', value: 56 },
  { name: '青海', value: 10 },
  { name: '宁夏', value: 18 },
  { name: '新疆', value: 67 },
  { name: '广东', value: 123 },
  { name: '广西', value: 59 },
  { name: '海南', value: 14 },
]

const Map: React.FC<MapProps> = ({
  data = defaultData,
  height = 600,
  title = '中国地图',
  width = '100%',
  className,
  style,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    const chart = echarts.init(chartRef.current)
    chartInstance.current = chart

    // 加载中国地图数据
    const loadMapData = async () => {
      try {
        const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
        const geoJson = await response.json()

        // 注册地图
        echarts.registerMap('china', geoJson)

        // 处理数据格式，确保只包含name和value字段
        const processedData = data.map((item) => ({
          name: item.name,
          value: item.value,
        }))

        // 计算数值范围
        const values = processedData.map((item) => item.value)
        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)

        console.log('Map组件数据:', processedData)
        console.log('数值范围:', { minValue, maxValue })

        // 配置项 - 基于专业地图组件的配置
        const option = {
          // 基础配置
          color: [
            '#5470c6',
            '#91cc75',
            '#fac858',
            '#ee6666',
            '#73c0de',
            '#3ba272',
            '#fc8452',
            '#9a60b4',
            '#ea7ccc',
          ],

          // 动画配置
          animation: true,
          animationDuration: 1000,
          animationDurationUpdate: 300,
          animationThreshold: 2000,

          // 标题配置
          title: {
            text: title,
            left: 'center',
            textStyle: {
              color: '#151b26',
              fontSize: 18,
              fontWeight: 'bold',
            },
          },

          // 提示框配置
          tooltip: {
            trigger: 'item',
            backgroundColor: '#f7f8fa',
            borderColor: '#b8babf',
            formatter: function (params: {
              name: string
              value?: number
              data?: { name: string; value: number }
            }) {
              const value = params.value || params.data?.value
              if (value !== undefined && value !== null) {
                return `${params.name}<br/>数值: ${value}`
              }
              const foundData = processedData.find((item) => item.name === params.name)
              if (foundData) {
                return `${params.name}<br/>数值: ${foundData.value}`
              }
              return `${params.name}<br/>暂无数据`
            },
            textStyle: {
              color: '#151b26',
            },
          },

          // 视觉映射配置
          visualMap: {
            show: true,
            min: 1,
            max: 800,
            itemWidth: 10,
            itemHeight: 60,
            hoverLink: true,
            orient: 'horizontal',
            inverse: false,
            calculable: false,
            realtime: true,
            text: ['高', '低'],
            inRange: {
              color: ['#eaefff', '#4979fe'],
            },
            z: 4,
            seriesIndex: 'all',
            left: 0,
            right: null,
            top: null,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: '#ccc',
            contentColor: '#5793f3',
            inactiveColor: '#aaa',
            borderWidth: 0,
            padding: 5,
            textGap: 10,
            precision: 0,
            textStyle: {
              color: '#333',
            },
            align: 'auto',
            handleIcon:
              'path://M-11.39,9.77h0a3.5,3.5,0,0,1-3.5,3.5h-22a3.5,3.5,0,0,1-3.5-3.5h0a3.5,3.5,0,0,1,3.5-3.5h22A3.5,3.5,0,0,1-11.39,9.77Z',
            handleSize: '120%',
            handleStyle: {
              borderColor: '#fff',
              borderWidth: 1,
            },
            indicatorIcon: 'circle',
            indicatorSize: '50%',
            indicatorStyle: {
              borderColor: '#fff',
              borderWidth: 2,
              shadowBlur: 2,
              shadowOffsetX: 1,
              shadowOffsetY: 1,
              shadowColor: 'rgba(0,0,0,0.2)',
            },
            target: {
              inRange: {
                color: ['#eaefff', '#4979fe'],
              },
              outOfRange: {
                color: ['rgba(0,0,0,0)'],
                opacity: [0, 0],
              },
            },
            controller: {
              inRange: {
                color: ['#eaefff', '#4979fe'],
                symbol: ['roundRect'],
                symbolSize: [10, 10],
              },
              outOfRange: {
                color: ['#aaa'],
                symbol: ['roundRect'],
                symbolSize: [10, 10],
              },
            },
            range: [1, 800],
          },

          // 系列配置
          series: [
            {
              type: 'map',
              mapType: 'china',
              roam: false,
              zoom: 1,
              containLabel: true,
              data: processedData,

              // 标签配置
              label: {
                show: false,
                fontSize: 12,
                color: '#151b26',
                fontWeight: 'normal',
                fontFamily: 'sans-serif',
                fontStyle: 'normal',
                width: 120,
                overflow: 'truncate',
              },

              // 样式配置
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
                borderType: 'solid',
                areaColor: '#eee',
              },

              // 高亮状态配置
              emphasis: {
                label: {
                  show: true,
                  color: '#151b26',
                  fontWeight: 'bold',
                  fontSize: 12,
                  fontFamily: 'sans-serif',
                  fontStyle: 'normal',
                  width: 120,
                  overflow: 'truncate',
                },
                itemStyle: {
                  areaColor: '#4979fe',
                  borderColor: '#ffffff',
                  borderWidth: 2,
                  shadowBlur: 5,
                  shadowColor: 'rgba(0, 0, 0, 0.3)',
                },
              },

              // 选中状态配置
              select: {
                label: {
                  show: true,
                  color: 'rgb(100,0,0)',
                },
                itemStyle: {
                  color: 'rgba(255,215,0,0.8)',
                },
              },

              map: 'china',
              z: 2,
              coordinateSystem: 'geo',
              left: 'center',
              top: 'center',
              aspectScale: null,
              showLegendSymbol: true,
              boundingCoords: null,
              center: null,
              scaleLimit: null,
              selectedMode: true,
              nameProperty: 'name',
            },
          ],

          // 其他配置
          legend: [],
          markArea: [],
          markLine: [],
          markPoint: [],
          brush: [],
          dataZoom: [],
        }

        chart.setOption(option)
      } catch (error) {
        console.error('加载地图数据失败:', error)
      }
    }

    loadMapData()

    // 监听窗口大小变化
    const handleResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [data, title])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{
        width,
        height: `${height}px`,
        ...style,
      }}
    />
  )
}

export { Map }
export type { MapProps, MapRef }
export default Map
