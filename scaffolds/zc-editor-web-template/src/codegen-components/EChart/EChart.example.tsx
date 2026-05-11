import React, { useRef } from 'react'
import { EChart } from './EChart'
import type { EChartRef, EChartsOption, EChartsEventParams, EChartsInstance } from './EChart'

// 使用示例组件
const EChartExample: React.FC = () => {
  const chartRef = useRef<EChartRef>(null)

  // 自定义配置示例
  const customOption: EChartsOption = {
    title: {
      text: '销售数据统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['销售额', '利润'],
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '销售额',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110]
      },
      {
        name: '利润',
        type: 'line',
        data: [20, 30, 25, 15, 12, 18]
      }
    ]
  }

  // 饼图配置示例
  const pieOption: EChartsOption = {
    title: {
      text: '产品占比',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '产品占比',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '产品A' },
          { value: 735, name: '产品B' },
          { value: 580, name: '产品C' },
          { value: 484, name: '产品D' },
          { value: 300, name: '产品E' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  // 事件处理函数
  const handleChartClick = (params: EChartsEventParams) => {
    console.log('图表点击事件:', params)
  }

  const handleChartReady = (chart: EChartsInstance) => {
    console.log('图表初始化完成:', chart)
  }

  // 操作按钮
  const handleResize = () => {
    chartRef.current?.resize()
  }

  const handleClear = () => {
    chartRef.current?.clear()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">EChart 组件使用示例</h1>
      
      {/* 默认配置示例 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">1. 默认配置（折线图）</h2>
        <EChart height={300} />
      </div>

      {/* 自定义配置示例 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">2. 自定义配置（柱状图+折线图）</h2>
        <EChart 
          option={customOption} 
          height={400}
          onClick={handleChartClick}
          onChartReady={handleChartReady}
        />
      </div>

      {/* 饼图示例 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">3. 饼图示例</h2>
        <EChart 
          option={pieOption} 
          height={400}
          onClick={handleChartClick}
        />
      </div>

      {/* 带操作按钮的示例 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">4. 带操作功能的图表</h2>
        <div className="space-x-2 mb-2">
          <button 
            onClick={handleResize}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重新调整大小
          </button>
          <button 
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            清空图表
          </button>
        </div>
        <EChart 
          ref={chartRef}
          option={customOption} 
          height={400}
          loading={false}
        />
      </div>

      {/* 使用说明 */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">使用说明：</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>需要先安装 echarts 依赖：<code className="bg-gray-200 px-1 rounded">npm install echarts</code></li>
          <li>组件支持动态传入 option 配置</li>
          <li>提供了默认的折线图配置</li>
          <li>支持事件回调：onClick、onDoubleClick、onMouseOver、onMouseOut</li>
          <li>通过 ref 可以调用图表实例方法：resize、clear、setOption 等</li>
          <li>支持加载状态显示</li>
        </ul>
      </div>
    </div>
  )
}

export default EChartExample