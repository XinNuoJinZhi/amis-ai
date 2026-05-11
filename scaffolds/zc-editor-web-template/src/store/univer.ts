import { createStore } from 'redux'

interface UniverState {
  univerData: any[];
}

const initialState: UniverState = {
  univerData:[]
}
function reducer(state = initialState,action: any): UniverState {
  switch(action.type) {
    case "set":
      return {...state, univerData:action.payload}
      break;
    default:
      return state
  }
}
const univerStore = createStore(reducer);

export const setStoreUniverData = (univerData: any[]) => {
  univerStore.dispatch({
    type: "set",
    payload: univerData
  })
}

export const getUniverStoreData = () => univerStore.getState().univerData;

export default univerStore;  