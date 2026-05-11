export function hasPermi(app) {
  app.directive('hasPermi', (el, binding) => {
    const { value } = binding
    const all_permission = '*:*:*'
    const permissions = uni.getStorageSync('permissions') && JSON.parse(uni.getStorageSync('permissions')) ? JSON.parse(uni.getStorageSync('permissions')) : []
    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value
      const hasPermissions = permissions.some((permission) => {
        return all_permission === permission || permissionFlag.includes(permission)
      })
      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error('请设置操作权限标签值')
    }
  })
}

export function hasPermiEvery(app) {
  app.directive('hasPermiEvery', (el, binding) => {
    const { value } = binding
    const all_permission = '*:*:*'
    const permissions = uni.getStorageSync('permissions') && JSON.parse(uni.getStorageSync('permissions')) ? JSON.parse(uni.getStorageSync('permissions')) : []
    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value
      const hasPermissions = permissionFlag.every((permission) => {
        return all_permission === permission || permissions.includes(permission)
      })

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error('请设置操作权限标签值')
    }
  })
}
