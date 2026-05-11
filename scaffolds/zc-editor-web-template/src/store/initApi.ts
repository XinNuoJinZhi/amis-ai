import { createStore } from 'redux'
const initialState={
  initApi: {}
}
function reducer(state = initialState,action) {
  switch(action.type) {
      case "set":
          return {...state, initApi:action.payload}
          break;
      default:
          return state
  }
}
const initApiStore = createStore(reducer);
export default initApiStore;  