import axios, { AxiosError } from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  getTenantId,
  setTenantId,
  removeToken,
  setToken,
  getAppTenantCode
} from '@/utils/auth'
import { isEditorialEnd, isAppEnd, getAppId, getEnv, getPortalKey, objectToQueryString } from '@/utils/index'
import { toast } from 'amis'
import { protocolHandle } from "./protocol"
import download from './download'
import appTenantCodeStore from '@/store/appTenantCode';
import { useCache } from '@/hooks/web/useCache'
import mime from 'mime';
import { baseURL, adminApiUrl } from '@/utils/env'
import { Button, Modal, Space, message } from 'antd';
import {loginOut} from '@/utils/auth';
import {RouterWhiteList} from '@/utils/patchClientRoutes';

interface ServiceOptions {
  url: string; // 接口地址
  method: 'get' | 'post' | 'put' | 'delete' | string; // 请求方法
  data?: any; // 请求数据
  responseType?: string;
  config?: any; // 其他配置
  headers?: Record<string, string>; // 请求头
  defaultQueryerData?: string; // 默认查询参数
  postData?: any; // body请求数据
  useFetch?: boolean; // 是否使用fetch请求
  enableAutoDownload?: boolean;
}
// 是否显示重新登录
export const isRelogin = { show: false }
const { confirm } = Modal;

const { wsCache } = useCache()

const handleAuthorized = () => {
  if (!isRelogin.show) {
    // 如果已经到重新登录页面则不进行弹窗提示
    if (window.location.href.includes('/app/design/user/login?redirect=')) {
      return
    }
    isRelogin.show = true
    confirm({
      title: '提示',
      content: '登录已过期，请重新登录?',
      onOk() {
        isRelogin.show = false
        return loginOut()
      }
    });
  }
}

const service = ({
  url, // 接口地址
  method, // 请求方法 get、post、put、delete
  data, // 请求数据
  responseType,
  config, // 其他配置
  headers, // 请求头
  defaultQueryerData,
  postData,
  useFetch,
  enableAutoDownload
}: ServiceOptions) => {
  //协议转换，提一个方法，放到protocol.ts 文件中
  const obj = protocolHandle(url, method)
  let _url = ''
  let _appid = ''
  let _tenantId = ''
  if (typeof obj == 'object') {
    _url = obj.url
    _appid = obj.appid
    _tenantId = obj.tenantId
  } else {
    _url = obj
  }
  url = _url
  if (defaultQueryerData && data?.__filter) {
    method = 'post'
    // 仅当 __filter 有值时（ConditionBuilder 被使用），才合并 defaultQueryerData 并切换为 POST
    const parsedData = JSON.parse(defaultQueryerData)
    data = {
      ...data,
      ...parsedData
    }
  }
  if(postData) {
    method = 'post'
    data = postData
  }
  let tenantEnable = 'true'; // 租户开关
  config = config || {};
  config.withCredentials = false
  const extraUrl = ['/publish/import_update_app', '/app/publish/create/false', '/app/publish/create/true', 'app/publish/export_the_app']
  const isExtraUrl = extraUrl.some(path => url.includes(path));
  config.timeout = config.timeout || (isExtraUrl ? 1200000 : 60000); // 请求超时时间
  responseType && (config.responseType = responseType);

  if (enableAutoDownload == null) {
    config.enableAutoDownload = true
  }

  if (config.cancelExecutor) {
    config.cancelToken = new (axios as any).CancelToken(
      config.cancelExecutor
    );
  }

  const headersConfig:any = {}
  if(getEnv() && url.startsWith(baseURL)) {
    headersConfig['Env'] = url.indexOf("app/page/getQueryKeyByCode") > -1 ? 1 : getEnv()
  }
  if (getAppId() && url.startsWith(baseURL)) {
    headersConfig['App-Id'] = getAppId()
  }
  if (_appid && url.startsWith(baseURL)) {
    headersConfig['Target-App-Id'] = _appid
  }
  if (_tenantId && url.startsWith(baseURL)) {
    // @ts-ignore
    headersConfig['Target-Tenant-Id'] = (_tenantId == -1 ? getTenantId() : _tenantId)
  }
  if (getPortalKey() && url.startsWith(baseURL)) {
    headersConfig['portal-key'] = getPortalKey()
  }
  if (getAccessToken() && url.startsWith(baseURL)) {
    headersConfig.Authorization = 'Bearer ' + getAccessToken()
  }
  if (appTenantCodeStore.getState().appTenantCode && url.startsWith(baseURL)) {
    headersConfig['App-Tenant-Code'] = appTenantCodeStore.getState().appTenantCode
  }
  // 设置租户
  if (tenantEnable && tenantEnable === 'true') {
    const tenantId = getTenantId()
    if (tenantId && url.startsWith(baseURL)) {
      headersConfig['tenant-id'] = tenantId
    }
  }
  headers = {...headers, ...headersConfig}
  config.headers = headers || {};
  if (method !== 'post' && method !== 'put' && method !== 'patch') {
    if (data) {
      config.params = data;
    }
    if(useFetch) {
      return fetchService({
        ...config,
        url,
        method
      })
    }
    return (axios as any)[method](url, config);
  } else if (data && data instanceof FormData) {
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'multipart/form-data';
  } else if (
    data &&
    typeof data !== 'string' &&
    !(data instanceof Blob) &&
    !(data instanceof ArrayBuffer)
  ) {
    data = JSON.stringify(data);
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
  } else {
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
  }

  if(useFetch) {
    return fetchService({
      ...config,
      data,
      url,
      method
    })
  }

  return (axios as any)[method](url, data, config);
}

axios.interceptors.response.use(
  async (response: any) => {
    const { data, config } = response;
    if (response.data.code === 401 || response.data.status === 401) {
      if (!getRefreshToken()) {
         if (!RouterWhiteList.includes(location.pathname)) {
           return handleAuthorized()
         }
      } else {
        try {
          const refreshTokenRes = await refreshToken()
          if (refreshTokenRes && refreshTokenRes.data && refreshTokenRes.data.code == 0) {
            setToken(refreshTokenRes.data.data)
            config.headers!.Authorization = 'Bearer ' + getAccessToken()
            return service(config)
          } else {
            if (!RouterWhiteList.includes(location.pathname)) {
              return handleAuthorized()
            }
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
          return handleAuthorized()
        }
      }
    } else if (response.data.code != null
      && response.data.code != 0
      && response.data.code != 200) {
      // 显示错误提示（同时使用 toast 和 message 确保显示）
      const errorMsg = response.data.msg || response.data.message || '请求失败'
      toast.error(errorMsg, '错误')
      message.error(errorMsg)
      response.data.code = 500
      response.data.status = 500
      return response
    }
    if (config.url.indexOf('admin-api/infra/config/get-value-by-key') > -1) {
      return { ...response, data: data.data != null ? JSON.parse(data.data) : null }
    }
    if (
      response.request.responseType === 'blob' ||
      response.request.responseType === 'arraybuffer'
    ) {
      // 如果没有开启自动下载，则返回响应内容
      if (response.config.enableAutoDownload === false) {
        return response
      }
      if (response.data.type !== 'application/json') {
        if (response.headers['content-disposition']) {
          const contentDisposition = decodeURI(response.headers['content-disposition'])
          const fileName = contentDisposition.split('=').pop() as string
          if (fileName.includes('css')) {
            return download.css(response.data, fileName)
          } else if (fileName.includes('json')) {
            download.json(response.data, fileName)
          } else if (fileName.includes('xlsx') || fileName.includes('xls')) {
            if(response.config.isUploadExcel){
              return response
            }else{
              return download.excel(response.data, fileName)
            }
          } else if (fileName.includes('zip')) {
            return download.zip(response.data, fileName)
          } else {
            download.blob(response.data, fileName)
          }
        } else {
          const mimeType = response.headers.get('Content-Type') || 'application/octet-stream';
          const fileExtension = mime.getExtension(mimeType);
          const defaultFileName = `download.${fileExtension}`;

          if (fileExtension) {
            return download.blob(response.data, defaultFileName)
          } else {
            return response;
          }
        }
      } else {
        const data = await new Response(response.data).json()
        response.data = data
        response.data.code = 500
        response.data.status = 500
        return response
      }
    }
    return response;
  },
  (error: AxiosError) => {
    //'接口调用错误: Cancel' 当是这个信息时不显示
    if(typeof error === 'object' && error !== null) {
      if(!error.name.includes('CanceledError')){
        toast.error('接口调用错误: ' + error)
      }
    } else {
      toast.error('接口调用错误: ' + error)
    }
  }
)

const fetchService = (config: any) => {
  const fetchConfig: any = {
    url: config.url,
    method: config.method,
    headers: config.headers,
  }
  // 处理GET请求的查询参数
  if (config.data && config.method === 'get') {
    const queryString = objectToQueryString(config.data);
    if (queryString) {
      fetchConfig.url += (fetchConfig.url.includes('?') ? '&' : '?') + queryString;
    }
  }

  if (config.params && config.method === 'get') {
    const queryString = objectToQueryString(config.params);
    if (queryString) {
      fetchConfig.url += (fetchConfig.url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // 处理非GET请求的body数据
  if (config.data && config.method !== 'get') {
    if (config.data instanceof FormData) {
      fetchConfig.body = config.data;
    } else if (typeof config.data === 'string') {
      fetchConfig.body = config.data;
    } else {
      fetchConfig.body = JSON.stringify(config.data);
    }
  }

  return fetch(fetchConfig.url, {
    ...fetchConfig
  })
}

const refreshToken = async () => {
  axios.defaults.headers.common['tenant-id'] = getTenantId()
  return await axios.post(baseURL + adminApiUrl + '/system/auth/refresh-token?refreshToken=' + getRefreshToken())
}

export const request = (options: ServiceOptions) => {
  return service({
    ...options,
    config: {
      baseURL: baseURL,
      ...options.config
    }
  }).then((response: any) => {
    // 如果返回数据有两层data，则展开
    if (response && response.data && response.data.data !== undefined) {
      return { ...response.data };
    }
    return response;
  });
};

export {
  service,
  refreshToken,
}
