import { service } from '@/utils/request'

import { useDevBaseUrl } from "@/utils/util"

//应用发布-版本对比
export const getDiffData = (params:any) => {
  return service({ url: useDevBaseUrl('/app/publish/simpleListInfo'),method:'post',data: params })
}
export function getImportApp(sourceEnv:any, sourceVersion:any, timeout:any) {
  return service({
    url: useDevBaseUrl('/app/publish/export_the_app?sourceEnv='+sourceEnv+'&sourceVersion='+sourceVersion+'&timeout='+timeout),
    method: 'get',
    responseType: 'blob',
  })
}