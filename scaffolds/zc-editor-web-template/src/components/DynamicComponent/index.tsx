import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo, useRef  } from 'react';
import { Spin, Result } from 'antd';
import {store} from '@/store/editor';
import initApiStore from '@/store/initApi';
import permStore from '@/store/permission';
import {testMode} from '@/utils/env'

export const DynamicComponent = (props: any) => {
  const { schemaContent } = props.data;
  // 添加错误边界和缓存机制
  const [error, setError] = useState(null);

  const componentPath = useMemo(() => {
    return schemaContent?.component;
  }, [schemaContent]);

  // 使用useCallback缓存导入函数
  const loadComponent = useCallback(() => {
    console.log(componentPath,'componentPath');
    if (!componentPath) {
      return Promise.reject(new Error('组件路径为空'));
    }
    try {
      return import(`../../pages/${componentPath}`);
    } catch (err: any) {
      setError(err);
      return Promise.reject(err);
    }
  }, [componentPath]);

  const LazyComponent = useMemo(() => lazy(() => loadComponent()), [loadComponent]);

  if (error) {
    return <ErrorResult title={"组件加载错误"} subTitle={`请检查组件路径是否正确，路径：@/pages/${componentPath}`} />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Spin />}>
        <LazyComponent context={dealContextFormat(schemaContent?.context)} permData={schemaContent?.customizeAcl} />
      </Suspense>
    </ErrorBoundary>
  );
};

export class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    return this.state.hasError ? <ErrorResult title={"组件加载错误"} subTitle={`请检查组件路径是否正确`} /> : this.props.children;
  }
}

const ErrorResult = ({title, subTitle}: any) => {
  return (
    <Result
      status="error"
      title={title}
      subTitle={subTitle}
    >
    </Result>
  )
}

const dealContextFormat = (context: any) => {
  const envVar = context?.envVar;
  const obj: any = {};
  for (let i = 0; i < envVar?.length; i++) {
    obj[envVar[i].key] = envVar[i].value;
  }
  let noPer = false
  return {
    zcApp: context?.zcApp,
    zcCompany: context?.zcCompany,
    zcUser: context?.zcUser,
    appVariables:store.EditorStore.getAppVariables({
      zcApp: context?.zcApp,
      zcCompany: context?.zcCompany,
      zcUser: context?.zcUser,
    }),
    app: initApiStore.getState().initApi,
    ...obj,
    $$noPer: noPer,
    $$permissionsData: permStore.getState().permData,
    $$testMode: testMode
  }
}
