/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/app/design/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/app/design/user/login',
        component: './user/login/login',
      },
    ],
  },
  {
    path: '/app/design/user/profile',
    hideInMenu: true,
    name: '个人中心',
    icon: '',
    component: './UserProfile/index',
  },
  {
    path: '/app/user/profile',
    hideInMenu: true,
    name: '个人中心',
    icon: '',
    component: './UserProfile/index',
  },
  {
    path: '/app/user/notify-message',
    hideInMenu: true,
    name: '我的站内信',
    icon: '',
    component: './NotifyMessage/index',
  },
  {
    path: '/app/design/user/notify-message',
    hideInMenu: true,
    name: '我的站内信',
    icon: '',
    component: './NotifyMessage/index',
  },
  {
    path: '/app/design/formManage/form/edit',
    layout: false,
    name: '表单编辑',
    icon: '',
    component: '@/components/AMISFormEditor',
  },
  {
    path: '/app/formManage/form/edit',
    layout: false,
    name: '表单编辑',
    icon: '',
    component: '@/components/AMISFormEditor',
  },
  {
    path: '/app/design/processManage/model/edit',
    layout: false,
    name: '流程设计',
    icon: '',
    component: '@/components/ProcessDesigner',
  },
  {
    path: '/app/design/sheetEditor',
    layout: false,
    name: '高级打印',
    icon: '',
    component: '@/components/UniverModule',
  },
  {
    path: '/page/pageEdit',
    layout: false,
    name: '管理端流程展示',
    icon: '',
    component: '@/components/PageEdit',
  },
  {
    path: '/page/formInfo',
    layout: false,
    name: '表单信息',
    icon: '',
    component: '@/components/FormInfo',
  },
  {
    path: '/page/pageRestart',
    layout: false,
    name: '流程管理重新发起流程',
    icon: '',
    component: '@/components/PageRestart',
  },
  {
    path: '/app/restart',
    layout: false,
    name: '移动端重新发起',
    icon: '',
    component: '@/components/AppRestart',
  },
  {
    path: '/app/process/handleTask',
    layout: false,
    name: '移动端流程详情',
    icon: '',
    component: '@/components/AppFlowSubmitData',
  },
  {
    path: '/app/process/submitData',
    layout: false,
    name: '移动端提交数据',
    icon: '',
    component: '@/components/PageView',
  },
  {
    path: '/app/design/pageManage/chart',
    layout: false,
    name: '大屏',
    icon: '',
    component: '@/components/PageChart',
  },
  {
    path: '/',
    redirect: '/app/design/',
  },
  {
    path: '/app/design/',
    redirect: '/app/design/pageManage',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
