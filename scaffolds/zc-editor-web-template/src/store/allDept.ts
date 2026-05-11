import { createStore } from 'redux'
const initialState={
  deptData: []
}
function reducer(state = initialState, action: any) {
  switch(action.type) {
      case "set":
          return {...state, deptData:action.payload}
          break;
      default:
          return state
  }
}
const allDeptStore = createStore(reducer);
export default allDeptStore;
