import { createStore } from 'redux'

interface MenuState {
  menuData: any[];
}

const initialState: MenuState = {
  menuData: []
}
function menuReducer(state = initialState, action: any): MenuState {
  switch(action.type) {
    case "set":
      return {...state, menuData:action.payload}
    default:
      return state
  }
}

const menuStore = createStore(menuReducer);

export const setMenuStore = (menuData: any[]) => {
  menuStore.dispatch({
    type: "set",
    payload: menuData
  })
}

export const getMenuStore = () => menuStore.getState();

export const getMenuData = () => menuStore.getState().menuData;

export const watchMenuStore = (callback: (newState: MenuState) => void) => menuStore.subscribe(() => {
  const newState = menuStore.getState();
  console.log(newState,'newState');
  callback(newState)
});

export default menuStore;