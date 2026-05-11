import App from './App';
import { createSSRApp } from 'vue';
import { setupPinia } from './sheep/store';
import { setupAuth } from './sheep/directives/index.js'// 权限
export function createApp() {
  const app = createSSRApp(App);
  setupPinia(app);
  setupAuth(app);
  return {
    app,
  };
}
