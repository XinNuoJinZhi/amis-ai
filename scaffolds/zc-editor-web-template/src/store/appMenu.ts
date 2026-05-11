import { createStore } from 'redux'
const initialState={
  appMenuData: []
}
function reducer(state = initialState,action: any) {
  switch(action.type) {
      case "set":
          return {...state, appMenuData:action.payload}
          break;
      default:
          return state
  }
}
const appMenuStore = createStore(reducer);
export default appMenuStore;
