import { createStore } from 'redux'
const initialState={
  editMenuData: []
}
function reducer(state = initialState,action: any) {
  switch(action.type) {
      case "set":
          return {...state, editMenuData:action.payload}
          break;
      default:
          return state
  }
}
const editMenuStore = createStore(reducer);
export default editMenuStore;
