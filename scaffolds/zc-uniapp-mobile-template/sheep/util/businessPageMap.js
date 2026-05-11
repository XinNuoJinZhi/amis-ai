//对外暴露：根据页面名称获取对应组件
const componentModules = import.meta.glob('../../pages/Business/**/*.vue', { eager: true })

const componentMap = {};
// 遍历原始glob结果，重构路径映射
Object.keys(componentModules).forEach((absPath) => {
  // 核心：截取路径后缀（Business/xxx/xxx.vue），和接口返回的componentPath对齐
  const relativeKey = absPath.replace(/^.*\/pages\//, ''); 
  componentMap[relativeKey] = componentModules[absPath].default;
});

export const getComponentByPageName = (componentPath) => {
  if (!componentPath) return null;
  try {
    // 直接用接口返回的componentPath匹配，无需拼接相对路径！
    const targetComponent = componentMap[componentPath+'.vue'];
    console.log('匹配到的组件：', targetComponent);
    return targetComponent || null;
  } catch (error) {
    console.warn(`【组件获取失败】路径不存在：${componentPath}`, error);
    return null;
  }
};