import { createStore } from 'redux'

// 全局上下文
interface ContextState {
  API_HOST?: string;
  DEV_API?: string;
  ADMIN_API?: string;
  APP_API?: string;
  zcApp?: any;
  zcCompany?: any;
  zcUser?: any;
  appVariables?: any;
  $$noPer?: boolean;
  // 功能权限
  $$permissionsData?: any;
  app?: any;
  [key: string]: any;
}

const initialState: ContextState = {}
function reducer(state = initialState, action: any): ContextState {
  switch(action.type) {
    case "set":
      if (action.replace) {
        // 全部替换
        return { ...action.payload };
      } else {
        // 浅合并（当前行为）
        return { ...state, ...action.payload };
      }
    default:
      return state;
  }
}

/**
 * 全局上下文 Store
 */
const contextStore = createStore(reducer);

/**
 * 设置全局上下文
 */
export const setContextData = (contextData: ContextState, replace: boolean = true) => {
  contextStore.dispatch({
    type: "set",
    payload: contextData,
    replace: replace
  });
};

/**
 * 获取全局上下文
 */
export const getContextData = () => {
  return contextStore.getState()
}

export default contextStore;
