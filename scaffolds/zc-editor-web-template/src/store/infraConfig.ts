import { createStore } from 'redux'

interface InfraConfigState {
  configData: any[];
}

const initialState: InfraConfigState= {
  configData: []
}
function InfraConfigReducer(state = initialState, action: any): InfraConfigState {
  switch(action.type) {
    case "set":
      return {...state, configData: action.payload}
    default:
      return state
  }
}

const InfraConfigStore = createStore(InfraConfigReducer);

export const setInfraConfigStore = (configData: any[]) => {
  InfraConfigStore.dispatch({
    type: "set",
    payload: configData
  })
}

export const getInfraConfigState = () => InfraConfigStore.getState();

export const getInfraConfigData = () => InfraConfigStore.getState().configData;

/**
 * 安全地从 infraConfig 中通过 key 获取并解析 JSON 格式的 value
 * @param key 要查找的配置项 key
 * @returns 解析后的对象或 null（找不到或解析失败时）
 */
export const getParsedInfraConfigValueByKey = (key: string): any | null => {
  try {
    const configData = getInfraConfigData() || [];
    const item = configData.find((item: any) => item.key === key);

    if (!item || !item.value) {
      console.warn(`未找到 key 为 "${key}" 的配置项`);
      return null;
    }

    return JSON.parse(item.value);
  } catch (error) {
    console.error(`解析配置项 key="${key}" 的 value 时出错:`, error);
    return null;
  }
};

export const watchInfraConfigStore = (callback: (newState: InfraConfigState) => void) => InfraConfigStore.subscribe(() => {
  const newState = InfraConfigStore.getState();
  callback(newState)
});

export default InfraConfigStore;
