import { hasPermi, hasPermiEvery } from './permission/hasPermi.js'

/**
 * 导出指令：v-xxx
 * @methods hasRole 用户权限，用法: v-hasRole
 * @methods hasPermi 按钮权限，用法: v-hasPermi
 */
export const setupAuth = (app) => {
  app.use(hasPermi);
  app.use(hasPermiEvery);
}