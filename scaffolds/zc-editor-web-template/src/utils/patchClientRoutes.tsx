import React, { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { collectPaths, isEditorialEnd } from '@/utils/index'
import { portalKey } from '@/utils/env'
import {
  getAppMenuApi,
  getAppSysMenuApi,
  getEditMenuApi, getPortalLoginInfo,
  getPreviewDataApi,
} from '@/services/ant-design-pro/api'
import editMenuStore from '@/store/editMenu'
import appMenuStore from '@/store/appMenu'
import dynamicPageStore from '@/store/dynamicPage'
import {getPortalLoginRouterData, setPortalLoginRouterStore} from "@/store/portalLoginRouter"
import { useCache } from '@/hooks/web/useCache'
import { WithSystemContext } from '@/components/WithSystemContext'
import { toast } from 'amis'
import { cloneDeep, isPlainObject, cloneDeepWith } from 'lodash-es'
import { AutoBreadcrumbContainer } from '@/components/AutoBreadcrumbContainer'
import { BusinessPageRegistry } from '@/pages/Business/_registry'

// Vite 静态分析的非 Business 页面 loader 映射
// import.meta.glob 在构建时预先枚举所有匹配的文件，生成确定的代码分割
const NON_BUSINESS_PAGE_LOADERS = import.meta.glob([
  '/src/pages/**/*.{tsx,ts}',
  '!/src/pages/Business/**', // 排除 Business（已由 _registry.ts 接管，避免重复纳入构建图）
]) as Record<string, () => Promise<any>>
const PORTAL_LOGIN_LOADERS = import.meta.glob('/src/pages/user/login/*/index.{tsx,ts}') as Record<
  string,
  () => Promise<any>
>

const resolveNonBusinessLoader = (relPath: string): (() => Promise<any>) | undefined => {
  // relPath 例如 "UserProfile/index" 或 "BacklogCenter/todo/index"
  // 尝试 .tsx 和 .ts 两种扩展名
  return (
    NON_BUSINESS_PAGE_LOADERS[`/src/pages/${relPath}.tsx`] ||
    NON_BUSINESS_PAGE_LOADERS[`/src/pages/${relPath}.ts`] ||
    NON_BUSINESS_PAGE_LOADERS[`/src/pages/${relPath}/index.tsx`] ||
    NON_BUSINESS_PAGE_LOADERS[`/src/pages/${relPath}/index.ts`]
  )
}

const resolvePortalLoginLoader = (componentName: string): (() => Promise<any>) | undefined => {
  return (
    PORTAL_LOGIN_LOADERS[`/src/pages/user/login/${componentName}/index.tsx`] ||
    PORTAL_LOGIN_LOADERS[`/src/pages/user/login/${componentName}/index.ts`]
  )
}

interface MenuItem {
  id: string
  parentId: number | string
  label: string
  url: string
  type: number
  redirect: string | null
  rewrite: string | null
  schema: any
  icon: string
  link: string | null
  visible: boolean
  children: MenuItem[] | null
}

const { wsCache } = useCache('sessionStorage')

let remoteMenu: any = null

let homeRouteOption: any = {}

let portalLoginRoute: {
  componentName: string,
  routePath: string
} = {
  componentName: 'login',
  routePath: '/app/design/user/login'
}

let validateAndFixRouterPathArr: {
  originalPath: string
  repairedPath: string
}[] = []

let illegalRouter: any = []

export const RouterWhiteList = [
  '/app/process/handleTask',
  '/app/process/submitData',
  '/app/restart'
];

export function getRemoteMenu() {
  return remoteMenu
}

export function setRemoteMenu(data: any) {
  remoteMenu = data
}

export function setHomeRouteOption(data: any) {
  homeRouteOption = data
}

export function setPortalLoginRoute(route: {
  componentName: string,
  routePath: string
}) {
  portalLoginRoute = route
}

const patchRoutes = (routes: any) => {
  if (
    portalKey &&
    portalLoginRoute
  ) {
    const portalLoader = resolvePortalLoginLoader(portalLoginRoute.componentName)
    if (portalLoader) {
      routes.push({
        id: 'portalLoginRoute',
        path: portalLoginRoute?.routePath,
        element: React.createElement(lazy(portalLoader)),
      })
    } else {
      console.warn(`门户登录组件不存在：${portalLoginRoute.componentName}`)
    }
  }
  if (remoteMenu === null || homeRouteOption === null) {
    return
  }
  const remoteRouter = disposeRouterPath(remoteMenu)
  // 将非法路由平级添加到总集合中
  remoteRouter.push(...illegalRouter.flat(1))
  // 应用端单独处理 path：/app/ 重定向首页逻辑
  const rootRedirectRoute = !isEditorialEnd()
    ? {
        id: 'home',
        parentId: 'ant-design-pro-layout',
        path: '/app/',
        element: React.createElement(Navigate, { to: homeRouteOption.path || '/app/home' }),
      }
    : null
  const layoutIndex = routes.findIndex((item: any) => item.id === 'ant-design-pro-layout')
  routes[layoutIndex].children.push(
    ...(rootRedirectRoute ? [...remoteRouter, rootRedirectRoute] : [...remoteRouter]),
  )
  useDynamicPageRedirectPath(validateAndFixRouterPathArr)
  const redirectPath = useRedirectPath(validateAndFixRouterPathArr)
  // console.log(redirectPath,'redirectPath')
  routes.push(...redirectPath)
  // 没有任何菜单权限的时候，router为空
  if (remoteRouter && remoteRouter.length === 0) {
    const wildcardIndex = routes.findIndex((item: any) => item.path === '*')
    const layoutIndex = routes.findIndex((item: any) => item.id === 'ant-design-pro-layout')
    routes[layoutIndex].children.push({
      ...routes[wildcardIndex],
      element: React.createElement('div', {}, ''),
      layout: true,
    })
    routes.splice(wildcardIndex, 1)
  }
}

const RedirectWithParams = React.memo(({ targetPath }: { targetPath: string }) => {
  // 这里的 useLocation 必须在组件内部调用（函数组件内）
  const location = window.location

  // 拼接参数（确保最终路径是字符串，而非函数）
  const finalPath = `${targetPath}${location.search}`

  // 关键：返回 Navigate 组件实例（JSX），而非函数
  return <Navigate to={finalPath} replace={true} />
})

// COMPAT: 处理生成前的单路径逻辑，生成前为单路径，不符合react router的路由规则，生成后是继承路径，用于解决生成出来的单路径页面跳转逻辑
const useRedirectPath = (pathArr: any[]) => {
  return pathArr.map((item: any) => {
    const path = item.originalPath.startsWith('/') ? item.originalPath.slice(1) : item.originalPath
    return {
      path: `${isEditorialEnd() ? '/app/design/' : '/app/'}${path}`,
      element: React.createElement(RedirectWithParams, {
        targetPath: item.repairedPath,
      }),
    }
  })
}

/**
 * 设置非法动态页面path修复后的路径
 * @param validateAndFixRouterPathArr
 */
const useDynamicPageRedirectPath = (validateAndFixRouterPathArr: any[]) => {
  if (isEditorialEnd()) return
  const dynamicPagePaths = dynamicPageStore.getState().dynamicPage
  const dynamicRedirectPaths = validateAndFixRouterPathArr
    .map((item: any) => {
      if (
        dynamicPagePaths.some(
          (dynamicPage: string) =>
            dynamicPage === `${isEditorialEnd() ? '/app/design' : '/app'}${item.originalPath}`,
        )
      ) {
        return item.repairedPath
      } else {
        return null
      }
    })
    .filter(Boolean)
  dynamicPageStore.dispatch({
    type: 'set',
    payload: [...dynamicRedirectPaths, ...dynamicPagePaths],
  })
}

/**
 * 处理路由信息
 */
const disposeRouterPath = (children: any, parentPath?: string) => {
  const visibleChildren = children

  for (let i = 0; i < visibleChildren.length; i++) {
    const current = visibleChildren[i]
    // router path
    let processedPath = ''
    // 父级id
    let parentId = ''
    // 门户 portalMenuType
    if (current.portalMenuType) {
      /**
       * 1. 菜单
       * 2. 目录
       * 3. 分组
       */

      // KeyMap
      const getKeyMap = (key: string) => {
        const keyMap: any = {
          // 系统页面
          system: {
            pathKey: 'url',
            componentKey: 'schema',
            topNodeIdValue: 0,
          },
          // 业务页面
          page: {
            pathKey: 'path',
            componentKey: 'component',
            topNodeIdValue: homeRouteOption.id,
          },
          '*': {
            pathKey: 'path',
            componentKey: 'component',
            topNodeIdValue: 0,
          },
        }
        return keyMap[key] || keyMap['*']
      }

      // 获取顶级节点id值
      const topNodeIdValue = getKeyMap(current.sourceType).topNodeIdValue
      // 将顶级节点id值处理成ant design pro的
      // 门户这里需要注意的是 全部默认门户菜单的顶级节点依旧为首页id，自定义门户的顶级节点id为0
      parentId =
        current.parentId == 0 || current.parentId == topNodeIdValue
          ? 'ant-design-pro-layout'
          : current.parentId
      const pathKey = getKeyMap(current.sourceType).pathKey
      const componentKey = getKeyMap(current.sourceType).componentKey
      // 有一种情况，门户为自定义目录时，sourceType会为null，并且此目录的path、url都会为null，不存在route path，
      // 这一数据结构不遵守 React Router 的设计规范
      const NANPath = current.queryKey ? `/${current.queryKey}` : `/${current.id || 'unknown'}`
      processedPath = validateAndFixRouterPath(
        // 第一层的router path 需要手动拼接/app
        current.sourceType !== 'system' && parentId === 'ant-design-pro-layout'
          ? `/app${current[pathKey] || NANPath}`
          : current[pathKey] || NANPath,
        parentPath,
      )

      // 处理目录类型（2目录 或 无类型默认视为目录）
      if (Number(current.portalMenuType) === 2 || !current.portalMenuType) {
        visibleChildren[i] = handleDirectory(current, processedPath, parentId)
      }

      // 处理分组类型（3分组）
      if (Number(current.portalMenuType) === 3) {
        visibleChildren[i] = handleGroupItem(current, processedPath, parentId)
      }

      // 处理菜单类型（1菜单）
      if (Number(current.portalMenuType) === 1) {
        visibleChildren[i] = handleMenu(current, processedPath, parentId, componentKey)
      }
    }
    // 如果有path，是应用端菜单数据格式，单独处理
    else if (current.path) {
      /**
       * 1. 普通页面
       * 2. 外部链接
       * 3. 文件夹
       */
      parentId =
        current.parentId === homeRouteOption.id ? 'ant-design-pro-layout' : current.parentId
      processedPath = validateAndFixRouterPath(
        // 第一层的router path 需要手动拼接/app
        parentId === 'ant-design-pro-layout' ? `/app${current.path}` : current.path,
        parentPath,
      )

      // 处理目录类型（3目录 或 无类型默认视为目录）
      if (Number(current.pageType) === 3 || !current.pageType) {
        visibleChildren[i] = handleDirectory(current, processedPath, parentId)
      }

      // 处理菜单类型（1菜单）
      if (Number(current.pageType) === 1) {
        visibleChildren[i] = handleMenu(current, processedPath, parentId, 'component')
      }
    }
    // 编辑端处理
    else {
      /**
       * 1. 目录
       * 2. 菜单
       */
      parentId = current.parentId == 0 ? 'ant-design-pro-layout' : current.parentId
      processedPath = validateAndFixRouterPath(current.url, parentPath)

      // 处理目录类型（1目录 或 无类型默认视为目录）
      if (current.type === 1 || !current.type) {
        visibleChildren[i] = handleDirectory(current, processedPath, parentId)
      }

      // 处理菜单类型（2菜单）
      if (current.type === 2) {
        visibleChildren[i] = handleMenu(current, processedPath, parentId, 'schema')
      }
    }
  }

  // 3. 返回处理后的可见子项数组（确保过滤后的数据被正确返回）
  return visibleChildren
}

/**
 * 提取目录类型处理函数
 */
const handleDirectory = (current: any, processedPath: string, parentId: string) => {
  const processedChildren = disposeRouterPath(current.children || [], processedPath)
  return {
    id: current.id,
    parentId,
    hideInMenu: current?.visible === false,
    name: current.label,
    path: processedPath,
    icon: getIconElement(current.icon),
    children: processedChildren,
    scene: current?.scene,
    routes: processedChildren, // 保持routes与children一致
  }
}

/**
 * 提取分组类型处理函数
 */
const handleGroupItem = (current: any, processedPath: string, parentId: string) => {
  const processedChildren = disposeRouterPath(current.children || [], processedPath)
  return {
    id: current.id,
    parentId,
    hideInMenu: current?.visible === false,
    name: current.label,
    path: processedPath,
    icon: getIconElement(current.icon),
    children: processedChildren,
    type: 'group',
    scene: current?.scene,
    routes: processedChildren, // 保持routes与children一致
  }
}

/**
 * 处理菜单类型处理函数
 */
const handleMenu = (
  current: any,
  processedPath: string,
  parentId: string,
  componentKey: string,
) => {
  let element

  // 外部链接（确保 link 是有效字符串）
  if (typeof current.link === 'string' && current.link)
    return handleLink(current, current.link, parentId)

  // 处理非法结构数据
  // 父子级都为菜单类型时，应该为嵌套渲染，如果不用Outlet，子路径匹配到的只会是父级组件
  // 但是这里要的是独立渲染页面，需要拿出来进行平级挂载
  if (current.children) {
    illegalRouter.push(disposeRouterPath(current.children || [], processedPath))
  }

  if (current[componentKey]) {
    try {
      // 优先从 Business 页面注册表查找；其他页面走 Vite 的 import.meta.glob 静态映射
      const loader =
        BusinessPageRegistry[current[componentKey]] ||
        resolveNonBusinessLoader(current[componentKey])
      if (loader) {
        element = React.createElement(
          WithSystemContext,
          { key: processedPath },
          <AutoBreadcrumbContainer>
            {React.createElement(lazy(loader))}
          </AutoBreadcrumbContainer>,
        )
      } else {
        console.warn(`${current[componentKey]} 组件不存在`)
      }
    } catch (e) {
      console.warn(`${current[componentKey]} 组件不存在`)
    }
  }

  return {
    id: current.id,
    path: processedPath,
    hideInMenu: current?.visible === false,
    parentId,
    name: current.label,
    icon: getIconElement(current.icon),
    end: true,
    element: element,
    isHomePage: current.homePage == '1',
    scene: current?.scene,
  }
}

/**
 * 处理外部链接类型处理函数
 */
const handleLink = (current: any, link: string, parentId: string) => {
  return {
    id: current.id,
    // 确保 link 是有效字符串，避免 href={false} 警告
    path: typeof link === 'string' && link ? link : undefined,
    hideInMenu: current?.visible === false,
    parentId,
    name: current.label,
    icon: getIconElement(current.icon),
  }
}

/**
 * 处理首页配置
 */
export const disposeHomeOption = (pages: any) => {
  let _option: any = []

  let homeOption: any = {}

  const getAppPageOption = (childrens: any) => {
    childrens.forEach((item: any) => {
      if (item.homePage == '1') {
        _option = item.children ? item.children : []

        homeOption = {
          children: null,
          homePage: 1,
          icon: item.icon,
          id: item.id,
          label: item.label,
          link: item.link,
          pageType: item.pageType,
          parentId: item.parentId,
          redirect: item.redirect,
          schemaApi: item.schemaApi,
          url: item.url,
          component: item.component,
          path: item.path,
          pageCode: item.pageCode,
          visible: false,
        }

        if (item.component && item.path) {
          homeOption.path = '/app' + item.path
        }
      }

      if (item.children && item.homePage != '1') {
        getAppPageOption(item.children)
      }
    })
  }

  pages && getAppPageOption(pages)

  // console.log(_option, '_option')

  // console.log(homeOption, 'homeOption')

  return [..._option, ...[homeOption]]
}

const deepAssignWithClone = (data: any, assignFn: (data: any) => any) => {
  return cloneDeepWith(data, (value, key, parent) => {
    // 1. 只处理纯对象（排除数组、null、类实例等）
    if (isPlainObject(value)) {
      const assignData = assignFn(value)
      return { ...value, ...assignData }
    }
    // 4. 数组/基本类型直接保留（cloneDeep 会自动递归数组内元素）
    return undefined
  })
}

/**
 * 获取路由
 */
export const getRouter = async () => {
  // 编辑端
  if (isEditorialEnd()) {
    const res = await getEditMenuApi()
    const menuData: any = deepAssignWithClone(res?.data?.data?.pages[1]?.children ?? [], () => {
      return {
        scene: 'system',
      }
    })
    const homeOption = res?.data?.data?.pages[0]
    setHomeRouteOption(homeOption)
    editMenuStore.dispatch({ type: 'set', payload: cloneDeep(menuData) })
    setRemoteMenu(menuData)
  }
  // 应用端
  else {
    // 门户
    if (portalKey) {
      const portalRouterRes = await getPreviewDataApi(portalKey)
      if (!portalRouterRes || !portalRouterRes.data) {
        console.error('Failed to fetch portal router data')
        return
      }
      if (portalRouterRes.data.code != 0) {
        return toast.error(portalRouterRes.data.msg, {
          position: 'top-right',
        })
      }
      //不涉及门户的分组-创建门户后直接预览
      if (portalRouterRes.data?.data?.navigation.length === 0) {
        const homePage = portalRouterRes.data.data.homePage
        // 首页
        const homeOption = homePage && homePage.length !== 0 ? disposeHomeOption([homePage]) : []
        // 其他页面
        const otherPage = portalRouterRes.data.data.appNavigation.pages
        // 收集动态页面path
        const paths = collectPaths([...cloneDeep(otherPage), ...cloneDeep(homeOption)])
        wsCache.set('dynamicPage', paths)
        dynamicPageStore.dispatch({ type: 'set', payload: paths })
        // appNavigation
        const appMenu = cloneDeep(portalRouterRes?.data?.data?.appNavigation.pages)
        appMenuStore.dispatch({ type: 'set', payload: appMenu })
        const menuData = deepAssignWithClone([...homeOption, ...otherPage], (item: any) => {
          return {
            scene: item?.sourceType === 'system' ? 'system' : 'app',
          }
        })
        setRemoteMenu([...menuData])
        setHomeRouteOption(homeOption[0])
      }
      //涉及门户的分组
      else {
        const homePage = portalRouterRes?.data?.data?.homePage
        // 首页
        const homeOption = homePage && homePage.length !== 0 ? disposeHomeOption([homePage]) : []
        // 其他页面
        const otherPage = portalRouterRes?.data?.data?.navigation
        // 收集动态页面path
        const paths = collectPaths([...cloneDeep(otherPage), ...cloneDeep(homeOption)])
        wsCache.set('dynamicPage', paths)
        dynamicPageStore.dispatch({ type: 'set', payload: paths })
        // appNavigation
        const appMenu = cloneDeep(portalRouterRes?.data?.data?.navigation)
        appMenuStore.dispatch({ type: 'set', payload: appMenu })
        const menuData = deepAssignWithClone([...homeOption, ...otherPage], (item: any) => {
          return {
            scene: item?.sourceType === 'system' ? 'system' : 'app',
          }
        })
        setRemoteMenu([...menuData])
        setHomeRouteOption(homeOption[0])
      }
    }
    // 非门户
    else {
      const res = await getAppMenuApi()
      const systemRes = await getAppSysMenuApi()
      // 应用端系统菜单
      const systemMenuData: any = deepAssignWithClone(
        systemRes?.data?.data?.pages?.[0]?.children || [],
        () => {
          return {
            scene: 'system',
          }
        },
      )
      appMenuStore.dispatch({ type: 'set', payload: systemMenuData })
      // 业务菜单
      const menuData: any = deepAssignWithClone(
        disposeHomeOption(res?.data?.data?.pages) || [],
        () => {
          return {
            scene: 'app',
          }
        },
      )
      let paths = collectPaths(res?.data?.data?.pages)
      dynamicPageStore.dispatch({ type: 'set', payload: paths })
      wsCache.set('dynamicPage', paths)
      // 首页数据
      const homeOption = menuData.find((item: any) => item.homePage == 1)
      setHomeRouteOption(homeOption)
      setRemoteMenu([...menuData, ...systemMenuData])
    }
  }
}

/**
 * 加载门户登录
 */
export const loadPortalLoginRoute = async() => {
  if (!portalKey) return
  try {
    const res = await getPortalLoginInfo({
      data: {
        portalKey: portalKey
      },
      headers: {
        'tenant-id': 1
      }
    })
    const {componentName, componentRoute} = res.data.data;

    if(componentName && componentRoute) {
      const routePath = componentRoute.startsWith('/') ? componentRoute : `/app/design/${componentRoute}`;
      setPortalLoginRouterStore({
        componentName: componentName,
        routePath
      })

      setPortalLoginRoute({
        componentName: componentName,
        routePath
      })
    }

  } catch (error) {}
}

/**
 * 校验并修复路由路径
 * @param path 原始路径
 * @param parentPath 父级路径
 * @returns 修复后的路径
 */
const validateAndFixRouterPath = (path: string, parentPath?: string): string => {
  let processedPath = path || ''

  // 路径校验与处理：如果存在父路径，检查子路径是否合法
  if (parentPath) {
    // 处理绝对路径：如果子路径是绝对路径但不以父路径开头，则拼接父路径
    if (processedPath.startsWith('/') && !processedPath.startsWith(parentPath)) {
      // 移除子路径开头的斜杠，避免拼接后出现双斜杠
      const relativePart = processedPath.startsWith('/') ? processedPath.slice(1) : processedPath
      processedPath = `${parentPath}/${relativePart}`
      validateAndFixRouterPathArr.push({
        originalPath: path,
        repairedPath: processedPath,
      })
    }
    // 处理相对路径：如果子路径不是绝对路径，直接拼接父路径
    else if (!processedPath.startsWith('/')) {
      processedPath = `${parentPath}/${processedPath}`
      validateAndFixRouterPathArr.push({
        originalPath: path,
        repairedPath: processedPath,
      })
    }
    // 注意：如果子路径是绝对路径且已包含父路径，则不做处理
  }

  return processedPath
}

const disposeFontawesomeIconName = (icon: any) => {
  // 核心：先校验icon是否为字符串，且非空
  if (typeof icon !== 'string' || icon.trim() === '') {
    return ''
  }
  let iconArr = icon.split(':')
  return iconArr[0] + ' ' + 'fa-' + iconArr[1]
}

export const getIconElement = (icon: any) => {
  // 兜底：非字符串/空字符串直接返回空（或null）
  if (typeof icon !== 'string' || icon.trim() === '') {
    return null // 推荐返回null，React渲染null更规范（原返回空字符串也可）
  }
  return <i className={disposeFontawesomeIconName(icon)}></i>
}

export default patchRoutes
