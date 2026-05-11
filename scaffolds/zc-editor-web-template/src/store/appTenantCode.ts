import { createStore } from 'redux'
const initialState={
  appTenantCode: ''
}
function reducer(state = initialState,action: any) {
  switch(action.type) {
      case "set":
          return {...state, appTenantCode:action.payload}
          break;
      default:
          return state
  }
}
const appTenantCodeStore = createStore(reducer);
export default appTenantCodeStore;
