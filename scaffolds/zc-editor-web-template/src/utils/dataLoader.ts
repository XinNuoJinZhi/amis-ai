import {
  getCustomizePermissionsByPageCode,
  getAllUserApi,
  getAllDeptApi,
  getPermissionsOwnedByLoginUser,
  getThemeApi,
  getVariableApi,
  getAppTenantByLoginUser
} from "@/services/ant-design-pro/api";
import {getConfigListApi} from '@/api/config';
import {useCache} from '@/hooks/web/useCache'
import {toast} from 'amis';
import {isEqual} from 'lodash-es'
import permStore from "@/store/permission";
import initApiStore from "@/store/initApi";
import contextStore, {setContextData, getContextData} from "@/store/context";
import {store} from "@/store";
import {setInfraConfigStore} from '@/store/infraConfig';
import {isEditorialEnd} from "@/utils/index";
import {baseURL, devApiUrl, adminApiUrl, appApiUrl, envId, portalKey, testMode} from "@/utils/env";
import allUserStore from "@/store/allUser";
import allDeptStore from "@/store/allDept";

import {protocolHandle} from "@/utils/protocol";
import {service} from "@/utils/request";
import {useDevBaseUrl} from "@/utils/util";
import themeStore from "@/store/theme";
import {setAppTenantCode} from "@/utils/auth";
import appTenantCodeStore from "@/store/appTenantCode";

const {wsCache} = useCache('sessionStorage')

export const $$noPer = false

/**
 * 获取加载功能权限
 */
export const fetchPermissions = async () => {
  const permissionRes = await getPermissionsOwnedByLoginUser()
  if (permissionRes?.data && permissionRes.data.code != 0) {
    toast.error(permissionRes.data.msg || '获取权限失败', {
      position: "top-right"
    })
  }
  let data = permissionRes?.data?.data?.permissions ? permissionRes?.data?.data?.permissions : []
  permStore.dispatch({type: "set", payload: data});
  const {url: initApi, timeout, method} =  permissionRes?.data?.data?.initApi || {};
  if(initApi && method){
    const url = protocolHandle(initApi, method)
    let initData = await service({
      url: url as string,
      method: method?.toLowerCase(),
      config: {
        timeout: timeout ? timeout * 1000 : 60000,
      },
    })
    initApiStore.dispatch({type: "set", payload: initData?.data?.data});
  }
}

/**
 * 加载全局上下文数据
 */
export const fetchContext = async () => {
  // 应用端
  if (!isEditorialEnd()) {
    // 业务页面
    if (wsCache.get('dynamicPage') && wsCache.get('dynamicPage').includes(window.location.pathname)) {
      const pageCode = window.location.pathname.split('/').pop();
      if (!pageCode) return
      let res = await getCustomizePermissionsByPageCode(pageCode)

      // 当前页面code请求报错，暂定于报错为页面不存在，则将当前页面从dynamicPage数据中过滤掉，报错，return
      // 无感操作：编辑端页面管理删除页面，应用端停留在删除的页面刷新时，会报错，通过此逻辑进行剔除报错给用户提示
      if (res?.data && res.data.code != 0) {
        const delPageCode = '/app/' + pageCode
        let arr = wsCache.get('dynamicPage') || [];
        arr = arr.filter((item: any) => item !== delPageCode);
        wsCache.set('dynamicPage', arr)
        toast.error(res.data.msg || '页面加载失败', {
          position: "top-right"
        })
        return
      }
      let permData = res?.data?.data?.customizeAcl;
      let envVar = res?.data?.data?.context?.envVar;
      let zcAppVal = res?.data?.data?.context?.zcApp;
      let zcCompanyVal = res?.data?.data?.context?.zcCompany;
      let zcUserVal = res?.data?.data?.context?.zcUser;
      let obj: any = {};
      for (let i = 0; i < envVar?.length; i++) {
        obj[envVar[i].key] = envVar[i].value;
      }
      const url = new URL(window.location.href); // 创建一个URL对象
      const params = new URLSearchParams(url.search); // 获取查询字符串并解析为URLSearchParams对象

      zcAppVal['portalId'] = params.get('portalKey') != undefined ? params.get('portalKey') : ''

      const newContextVal = {
        zcApp: zcAppVal,
        zcCompany: zcCompanyVal,
        zcUser: zcUserVal,
        appVariables: store.EditorStore.appVariables,
        app: initApiStore.getState().initApi,
        $$noPer: true,
        $$permissionsData: permStore.getState().permData,
        $$testMode: testMode,
        ...obj,
      }

      if (!isEqual(contextStore.getState(), newContextVal)) {
        console.log('业务页面上下文加载')
        setContextData(newContextVal)
      }

      // 应用端跳编辑端按钮显隐
      if (Number(envId) === 1 && document.getElementsByClassName('app-page-edit-toolbar')[0]) {
        (document.getElementsByClassName('app-page-edit-toolbar') as any)[0].style.display = 'block'
      }

      return {
        systemContext: newContextVal,
        customizeAcl: permData
      };
    }
    // 系统页面
    else {
      console.log('系统页面上下文加载')
      const contextData = {
        API_HOST: baseURL,
        DEV_API: devApiUrl,
        ADMIN_API: adminApiUrl,
        APP_API: appApiUrl,
        $$noPer: $$noPer,
        $$permissionsData: permStore.getState().permData,
        $$testMode: testMode,
        app: initApiStore.getState().initApi
      }
      setContextData(contextData)

      if (document.getElementsByClassName('app-page-edit-toolbar')[0]) {
        (document.getElementsByClassName('app-page-edit-toolbar') as any)[0].style.display = 'none'
      }

      return {
        systemContext: contextData,
        customizeAcl: []
      };
    }
  }
  // 编辑端
  else {
    const contextData = {
      API_HOST: baseURL,
      DEV_API: devApiUrl,
      ADMIN_API: adminApiUrl,
      APP_API: appApiUrl,
      $$noPer: $$noPer,
      $$permissionsData: permStore.getState().permData,
      $$testMode: testMode,
      app: initApiStore.getState().initApi
    }
    setContextData(contextData)
    return {
      systemContext: contextData,
      customizeAcl: []
    };
  }
}

/**
 * 加载获取所有用户的数据
 */
export const fetchAllUser = async() => {
  const res = await getAllUserApi()

  const processedUsers = res?.data?.data?.map((user: any) => {
    const { remark, sex, postIds, status, registerStatus, loginIp, loginDate, createTime, supervisor, dept, ...rest } = user;
    return rest;
  }) || [];

  allUserStore.dispatch({ type: "set", payload: processedUsers });
}

/**
 * 加载获取所有部门的数据
 */
export const fetchAllDept = async() => {
  const res = await getAllDeptApi()

  const processedDepts = res?.data?.data?.map((user: any) => {
    const { sort, phone, email, status, createTime, children, ...rest } = user;
    return rest;
  }) || [];

  allDeptStore.dispatch({ type: "set", payload: processedDepts });
}

/**
 * 加载获取主题配置
 */
export const fetchThemeConfig = async() => {
  const res = await getThemeApi()
  const css = res?.data?.data ? res?.data?.data : ''
  const themeConfigData: any = {}
  css.split(';').forEach((i: string) => {
    let item = i.split(': ')
    themeConfigData[item[0]] = item[1]
  })
  themeStore.dispatch({type: "set", payload: themeConfigData});
}

/**
 * 加载获取内存变量
 */
export const fetchMemoryVariable = async() => {
  const res = await getVariableApi()
  const data = res?.data?.data || [];
  const app: Record<string, any> = {};

  data.forEach((item: any) => {
    try {
      app[item.name] = item.type !== 'string'
        ? JSON.parse(item.defaultValue)
        : item.defaultValue;
    } catch (error) {
      console.warn(`Failed to parse memory variable ${item.name}:`, error);
      app[item.name] = item.defaultValue;
    }
  });
  store.EditorStore.setAppVariables(app)
}

export const fetchInfraConfig = async() => {
  try {
    const res = await getConfigListApi()
    setInfraConfigStore(res.data.data)
  } catch (error) {}
}

export const fetchAppTenantCode = async() => {
  try {
     const res = await getAppTenantByLoginUser()
     if (res.data.code === 0) {
       setAppTenantCode(res.data.data.code);
       appTenantCodeStore.dispatch({type: "set", payload: res.data.data.code});
     }
  } catch (error) {}
}

export const dealContextFormat = (context: any) => {
  const envVar = context?.envVar;
  const obj: any = {};
  for (let i = 0; i < envVar?.length; i++) {
    obj[envVar[i].key] = envVar[i].value;
  }
  return {
    zcApp: context?.zcApp,
    zcCompany: context?.zcCompany,
    zcUser: context?.zcUser,
    appVariables:store.EditorStore.getAppVariables({
      zcApp: context?.zcApp,
      zcCompany: context?.zcCompany,
      zcUser: context?.zcUser,
    }),
    app: initApiStore.getState().initApi,
    ...obj,
    $$noPer: $$noPer,
    $$permissionsData: permStore.getState().permData,
    $$testMode: testMode
  }
}
