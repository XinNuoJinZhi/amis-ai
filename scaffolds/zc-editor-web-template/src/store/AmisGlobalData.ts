import { createStore } from 'redux'

// 全局数据
interface GlobalDataState {
  amisUser?: {
    name: string;
    avatar: string;
  };
  search?: string;
  [key: string]: any;
}

const initialState: GlobalDataState = {
  search: window.location.search
}
function reducer(state = initialState,action: any): GlobalDataState {
  switch(action.type) {
    case "set":
      return { ...state, ...action.payload };
    default:
      return state
  }
}

/**
 * amis全局数据Store
 */
const amisGlobalDataStore = createStore(reducer);

/**
 * 设置amis全局数据
 */
export const setAMISGlobalData = (globalData: GlobalDataState) => {
  amisGlobalDataStore.dispatch({
    type: "set",
    payload: globalData
  })
}

/**
 * 获取amis全局数据
 */
export const getAMISGlobalData = () => {
  return amisGlobalDataStore.getState()
}

export default amisGlobalDataStore;
