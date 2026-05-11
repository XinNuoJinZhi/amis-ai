import React from 'react'
import { Timeline as AntTimeline } from 'antd'
import type { TimelineProps as AntTimelineProps } from 'antd'
import './Timeline.css'

export interface TimelineItemType {
  children?: React.ReactNode
  label?: React.ReactNode
  color?: string
  dot?: React.ReactNode
  style?: React.CSSProperties
}

export interface TimelineProps extends Omit<AntTimelineProps, 'items'> {
  items?: TimelineItemType[]
  direction?: 'horizontal' | 'vertical'
  mode?: 'left' | 'right' | 'alternate'
  reverse?: boolean
  style?: React.CSSProperties
  className?: string
}

/**
 * Timeline 时间轴组件
 * 支持水平和垂直两种方向
 */
const Timeline: React.FC<TimelineProps> = ({
  items = [],
  direction = 'vertical',
  mode,
  reverse,
  style,
  className,
  ...restProps
}) => {
  // 如果是垂直方向，直接使用 Ant Design 的 Timeline
  if (direction === 'vertical') {
    return (
      <AntTimeline
        items={items}
        mode={mode}
        reverse={reverse}
        style={style}
        className={className}
        {...restProps}
      />
    )
  }

  // 水平方向，使用自定义实现
  const timelineItems = reverse ? [...items].reverse() : items

  return (
    <div
      className={`timeline-horizontal-wrapper ${className || ''}`}
      style={style}
    >
      <div className="timeline-horizontal-container">
        {timelineItems.map((item, index) => (
          <React.Fragment key={index}>
            <div className="timeline-horizontal-item" style={item.style}>
              {/* 圆点/图标 */}
              <div className="timeline-horizontal-dot-wrapper">
                {item.dot ? (
                  <div className="timeline-horizontal-dot-custom">
                    {item.dot}
                  </div>
                ) : (
                  <div
                    className="timeline-horizontal-dot"
                    style={{ backgroundColor: item.color || '#1890ff' }}
                  />
                )}
              </div>

              {/* 内容区域 */}
              <div className="timeline-horizontal-content">
                {/* 时间标签 */}
                {item.label && (
                  <div className="timeline-horizontal-label">
                    {item.label}
                  </div>
                )}

                {/* 标题/内容 */}
                {item.children && (
                  <div className="timeline-horizontal-title">
                    {item.children}
                  </div>
                )}
              </div>
            </div>

            {/* 连接线（最后一项不显示） */}
            {index < timelineItems.length - 1 && (
              <div className="timeline-horizontal-line" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default Timeline
