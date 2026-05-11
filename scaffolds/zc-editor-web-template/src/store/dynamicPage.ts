import { createStore } from 'redux'
const initialState={
  dynamicPage: []
}
function reducer(state = initialState,action: any) {
  switch(action.type) {
      case "set":
          return {...state, dynamicPage:action.payload}
          break;
      default:
          return state
  }
}
const dynamicPageStore = createStore(reducer);
export default dynamicPageStore;
