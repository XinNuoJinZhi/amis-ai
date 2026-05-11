// system context.ts
import { createContext, useContext, ReactNode } from 'react';

// 定义上下文数据类型
export interface SystemContextType {
  API_HOST?: string;
  DEV_API?: string;
  ADMIN_API?: string;
  APP_API?: string;
  zcApp?: any;
  zcCompany?: any;
  zcUser?: any;
  appVariables?: any;
  $$noPer?: boolean;
  $$testMode?: boolean;
  // 功能权限
  $$permissionsData?: any;
  app?: any;
  [key: string]: any;
  // 其他需要共享的字段...
}

export interface RootContextType {
  systemContext?: SystemContextType | null;
  // 自定义资源权限
  customizeAcl?: any[] | null;
}


const defaultRootContextValue: RootContextType = {
  systemContext: null,
  customizeAcl: null
}

// 创建上下文
const RootContext = createContext<RootContextType | null>(defaultRootContextValue);

// rootContext Hook
export const useRootContext = () => {
  const context = useContext(RootContext);
  if (!context) {
    throw new Error('useRootContext 必须在 RootContext.Provider 内部使用');
  }
  return context;
};

export const RootContextProvider = RootContext.Provider;
