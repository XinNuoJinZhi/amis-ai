import React from 'react';
import { Card } from 'antd';

interface PanelProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  affixFooter?: boolean;
}

const Panel: React.FC<PanelProps> = ({ title, children, className, style, affixFooter }) => {
  return (
    <Card title={title} className={className} style={style}>
      {children}
    </Card>
  );
};

export default Panel;
