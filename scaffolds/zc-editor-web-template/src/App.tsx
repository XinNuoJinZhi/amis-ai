import React, { Suspense } from 'react';
import { Spin } from 'antd';
import AppRouter from './router';

const App: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <Spin size="large" tip="加载中..." />
        </div>
      }
    >
      <AppRouter />
    </Suspense>
  );
};

export default App;
