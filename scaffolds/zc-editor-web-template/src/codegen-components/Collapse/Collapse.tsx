import React from 'react';
import { Collapse as AntCollapse } from 'antd';
import type { CollapseProps } from 'antd';

const Collapse: React.FC<CollapseProps> & {
  Panel: typeof AntCollapse.Panel;
} = (props) => {
  return <AntCollapse {...props} />;
};

Collapse.Panel = AntCollapse.Panel;

export default Collapse;
