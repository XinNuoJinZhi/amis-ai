import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { EChart, type EChartRef, type EChartsOption } from '../../EChart';

export interface SankeyProps {
  data?: {
    nodes: Array<{ name: string; value?: number }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  theme?: string;
  loading?: boolean;
}

export interface SankeyRef extends EChartRef {
  updateData: (data: {
    nodes: Array<{ name: string; value?: number }>;
    links: Array<{ source: string; target: string; value: number }>;
  }) => void;
}

export const Sankey = forwardRef<SankeyRef, SankeyProps>((
  {
    data,
    width = '100%',
    height = 400,
    className,
    style,
    theme,
    loading = false,
  },
  ref
) => {
  const chartRef = useRef<EChartRef>(null);

  // 默认数据
  const defaultData = {
    nodes: [
      { name: '农业' },
      { name: '工业' },
      { name: '服务业' },
      { name: '消费' },
      { name: '投资' },
      { name: '出口' },
    ],
    links: [
      { source: '农业', target: '消费', value: 10 },
      { source: '工业', target: '消费', value: 15 },
      { source: '工业', target: '投资', value: 12 },
      { source: '工业', target: '出口', value: 8 },
      { source: '服务业', target: '消费', value: 25 },
      { source: '服务业', target: '投资', value: 18 },
    ],
  };

  const sankeyData = data || defaultData;

  // 使用 useMemo 优化配置项计算
  const option: EChartsOption = useMemo(() => {
    return {
      title: {
        text: '桑基图',
        left: 'center',
        textStyle: {
          color: '#333',
          fontSize: 16,
        },
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#333',
        textStyle: {
          color: '#fff',
        },
      },
      series: [
        {
          type: 'sankey',
          data: sankeyData.nodes,
          links: sankeyData.links,
          emphasis: {
            focus: 'adjacency',
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
          },
          label: {
            position: 'right',
            formatter: '{b}',
          },
          levels: [
            {
              depth: 0,
              itemStyle: {
                color: '#fbb4ae',
              },
            },
            {
              depth: 1,
              itemStyle: {
                color: '#b3cde3',
              },
            },
            {
              depth: 2,
              itemStyle: {
                color: '#ccebc5',
              },
            },
          ],
        },
      ],
    };
  }, [sankeyData]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    ...chartRef.current!,
    updateData: (newData: {
      nodes: Array<{ name: string; value?: number }>;
      links: Array<{ source: string; target: string; value: number }>;
    }) => {
      if (chartRef.current) {
        chartRef.current.setOption({
          series: [{
            data: newData.nodes,
            links: newData.links,
          }],
        });
      }
    },
  }));

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
  );
});

Sankey.displayName = 'Sankey';

export default Sankey;