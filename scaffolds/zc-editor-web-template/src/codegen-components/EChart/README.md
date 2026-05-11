# EChart 组件

基于 ECharts 的 React 组件，支持动态配置和事件处理。

## 安装依赖

```bash
npm install echarts
# 或
yarn add echarts
```

## 基本使用

```tsx
import React from 'react'
import { EChart } from './components/EChart'

// 使用默认配置
function App() {
  return (
    <div>
      <EChart height={400} />
    </div>
  )
}
```

## 自定义配置

```tsx
import React from 'react'
import { EChart, EChartsOption } from './components/EChart'

const customOption: EChartsOption = {
  title: {
    text: '销售数据'
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
    }
  ]
}

function App() {
  return (
    <div>
      <EChart option={customOption} height={400} />
    </div>
  )
}
```

## 事件处理

```tsx
import React from 'react'
import { EChart, EChartsEventParams } from './components/EChart'

function App() {
  const handleClick = (params: EChartsEventParams) => {
    console.log('点击事件:', params)
  }

  const handleChartReady = (chart: EChartsInstance) => {
    console.log('图表初始化完成')
  }

  return (
    <div>
      <EChart 
        height={400}
        onClick={handleClick}
        onChartReady={handleChartReady}
      />
    </div>
  )
}
```

## 使用 Ref 操作图表

```tsx
import React, { useRef } from 'react'
import { EChart, EChartRef } from './components/EChart'

function App() {
  const chartRef = useRef<EChartRef>(null)

  const handleResize = () => {
    chartRef.current?.resize()
  }

  const handleClear = () => {
    chartRef.current?.clear()
  }

  return (
    <div>
      <button onClick={handleResize}>调整大小</button>
      <button onClick={handleClear}>清空图表</button>
      <EChart ref={chartRef} height={400} />
    </div>
  )
}
```

## Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| option | EChartsOption | 默认折线图配置 | ECharts 配置对象 |
| width | string \| number | '100%' | 图表宽度 |
| height | string \| number | '400px' | 图表高度 |
| className | string | - | CSS 类名 |
| style | React.CSSProperties | - | 内联样式 |
| theme | string | - | ECharts 主题 |
| loading | boolean | false | 是否显示加载状态 |
| loadingOption | object | - | 加载配置 |
| onChartReady | (chart: EChartsInstance) => void | - | 图表初始化完成回调 |
| onClick | (params: EChartsEventParams) => void | - | 点击事件回调 |
| onDoubleClick | (params: EChartsEventParams) => void | - | 双击事件回调 |
| onMouseOver | (params: EChartsEventParams) => void | - | 鼠标悬停事件回调 |
| onMouseOut | (params: EChartsEventParams) => void | - | 鼠标离开事件回调 |

## Ref 方法

| 方法 | 说明 |
|------|------|
| getChart() | 获取 ECharts 实例 |
| resize() | 调整图表大小 |
| setOption(option, notMerge?) | 设置图表配置 |
| clear() | 清空图表 |
| dispose() | 销毁图表实例 |

## 默认配置

组件提供了一个默认的折线图配置：

```javascript
{
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line'
    }
  ]
}
```

## 注意事项

1. **依赖安装**：使用前需要安装 `echarts` 依赖包
2. **全局引入**：目前组件通过 `window.echarts` 访问 ECharts，需要确保 ECharts 已全局加载
3. **响应式**：组件会自动监听窗口大小变化并调整图表大小
4. **内存管理**：组件会在卸载时自动销毁图表实例，避免内存泄漏
5. **类型安全**：提供了完整的 TypeScript 类型定义

## 示例文件

查看 `EChart.example.tsx` 文件获取更多使用示例。