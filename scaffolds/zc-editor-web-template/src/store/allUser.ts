import { createStore } from 'redux'
const initialState={
  userData: []
}
function reducer(state = initialState, action: any) {
  switch(action.type) {
      case "set":
          return {...state, userData:action.payload}
          break;
      default:
          return state
  }
}
const allUserStore = createStore(reducer);
export default allUserStore;
