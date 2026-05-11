import React, { useState } from 'react';
import { Card, Button, Space, Row, Col } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import './style.less';

export interface AutoFilterProps {
  /** 标题 */
  title?: string;
  /** 子元素（表单字段） */
  children: React.ReactNode;
  /** 操作按钮区域 */
  actions?: React.ReactNode;
  /** 默认是否展开 */
  defaultCollapsed?: boolean;
  /** 默认显示的字段数量（未展开时） */
  defaultVisibleCount?: number;
  /** 每行显示的字段数量 */
  columnsPerRow?: number;
}

/**
 * AutoFilter 自动筛选组件
 * 模拟 Amis autoGenerateFilter 的 UI 交互效果
 */
export const AutoFilter: React.FC<AutoFilterProps> = ({
  title = '查询条件',
  children,
  actions,
  defaultCollapsed = true,
  defaultVisibleCount = 3,
  columnsPerRow = 3,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // 将 children 转换为数组
  const childArray = React.Children.toArray(children);
  const totalCount = childArray.length;

  // 根据折叠状态决定显示哪些字段
  const visibleChildren = collapsed
    ? childArray.slice(0, defaultVisibleCount)
    : childArray;

  // 是否需要显示展开/收起按钮
  const showToggle = totalCount > defaultVisibleCount;

  return (
    <Card
      title={title}
      className={'auto-filter-card'}
      extra={
        showToggle && (
          <Button
            type="link"
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
          >
            {collapsed ? `展开 (${totalCount - defaultVisibleCount} 项)` : '收起'}
          </Button>
        )
      }
    >
      <Row gutter={[16, 0]}>
        {visibleChildren.map((child, index) => (
          <Col
            key={index}
            span={24 / columnsPerRow}
            style={{
              marginBottom: index < visibleChildren.length - columnsPerRow ? 16 : 0
            }}
          >
            {child}
          </Col>
        ))}
      </Row>

      {actions && (
        <div className={'auto-filter-actions'}>
          {actions}
        </div>
      )}
    </Card>
  );
};

export default AutoFilter;
