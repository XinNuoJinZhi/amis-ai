import { createStore } from 'redux'
const initialState={
  themeData: {}
}
function reducer(state = initialState,action) {
  switch(action.type) {
      case "set":
          return {...state, themeData:action.payload}
          break;
      default:
          return state
  }
}
const themeStore = createStore(reducer);
export default themeStore;  