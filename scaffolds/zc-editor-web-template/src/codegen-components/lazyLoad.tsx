import React, { Suspense, forwardRef } from 'react';
import { Spin } from 'antd';

/**
 * 创建带 Suspense 边界的懒加载组件（支持 ref 转发）
 * 用于重量级组件按需加载，减少首屏 JS 体积
 */
export function createLazyComponent<P extends object, R = unknown>(
  factory: () => Promise<{ default: React.ComponentType<any> }>
) {
  const LazyInner = React.lazy(factory);

  const LazyComponent = forwardRef<R, P>((props, ref) => (
    <Suspense fallback={<Spin style={{ display: 'flex', justifyContent: 'center', padding: 24 }} />}>
      <LazyInner {...props} ref={ref} />
    </Suspense>
  ));

  return LazyComponent;
}
