import React from 'react';

export interface TargetNumberProps {
  /** 数值 */
  value?: number;
  /** 标题/描述 */
  title?: string;
  /** 数值颜色 */
  valueColor?: string;
  /** 标题颜色 */
  titleColor?: string;
  /** 自定义样式 */
  className?: string;
  style?: React.CSSProperties;
}

export interface TargetNumberRef {
  getValue: () => number;
}

export const TargetNumber = React.forwardRef<TargetNumberRef, TargetNumberProps>(
  ({
    value = 0,
    title = '指标',
    valueColor = '#4A90E2',
    titleColor = '#999999',
    className,
    style
  }, ref) => {
    // 格式化数字显示
    const formatNumber = (num: number) => {
      return num.toLocaleString();
    };

    React.useImperativeHandle(ref, () => ({
      getValue: () => value
    }));

    return (
      <div 
        className={`target-number ${className || ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 16px',
          backgroundColor: 'transparent',
          textAlign: 'center',
          minHeight: '80px',
          ...style
        }}
      >
        {/* 数值 */}
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: valueColor,
          lineHeight: 1,
          marginBottom: '6px'
        }}>
          {formatNumber(value)}
        </div>
        
        {/* 标题 */}
        <div style={{
          fontSize: '12px',
          color: titleColor,
          lineHeight: 1.2,
          fontWeight: 400
        }}>
          {title}
        </div>
      </div>
    );
  }
);

TargetNumber.displayName = 'TargetNumber';

export default TargetNumber;