import { createStore } from 'redux'

interface PortalLoginRouterState {
  routeData: {
    componentName: string,
    routePath: string
  };
}

const initialState: PortalLoginRouterState= {
  routeData: {
    componentName: 'login',
    routePath: '/app/design/user/login'
  }
}
function PortalLoginRouterReducer(state = initialState, action: any): PortalLoginRouterState {
  switch(action.type) {
    case "set":
      return {...state, routeData: action.payload}
    default:
      return state
  }
}

const PortalLoginRouterStore = createStore(PortalLoginRouterReducer);

export const setPortalLoginRouterStore = (routeData: any) => {
  PortalLoginRouterStore.dispatch({
    type: "set",
    payload: routeData
  })
}

export const getPortalLoginRouterState = () => PortalLoginRouterStore.getState();

export const getPortalLoginRouterData = () => PortalLoginRouterStore.getState().routeData;

export default PortalLoginRouterStore;
