import { createStore } from 'redux'

interface PermState {
  permData: any[];
}

const initialState: PermState = {
  permData:[]
}
function reducer(state = initialState,action: any): PermState {
  switch(action.type) {
      case "set":
          return {...state, permData:action.payload}
          break;
      default:
          return state
  }
}
const permStore = createStore(reducer);

export const setStorePermData = (permData: any[]) => {
  permStore.dispatch({
    type: "set",
    payload: permData
  })
}

export const getPermStoreData = () => permStore.getState().permData;

export const watchPermStore = (callback: (newState: PermState) => void) => permStore.subscribe(() => {
  const newState = permStore.getState();
  callback(newState)
});

/**
 * 判断是否有指定权限
 * @param permCode 权限符字符串
 * @returns {boolean} 是否拥有权限
 */
export const hasPermission = (permCode: string): boolean => {
  const permData = getPermStoreData();
  return permData.includes(permCode);
};

export default permStore;  