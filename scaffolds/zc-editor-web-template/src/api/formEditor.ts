import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"
//form-编辑器-保存接口
export function savePageManage(params:any){
  return service({url:useDevBaseUrl('/processManage/form/update'), method:'put', data:params});
}
export function saveAppPageManage(params:any){
  return service({url:useDevBaseUrl('/application/processManage/form/update'), method:'put', data:params});
}
//获取form 编辑器-详情
export function getPageManageContent(params:any){
  return service({url:useDevBaseUrl('/processManage/form/get'), method:'get', data:params});
}

export function getAppPageManageContent(params:any){
  return service({url:useDevBaseUrl('/application/processManage/form/get'), method:'get', data:params});
}
//获取form编辑器的历史记录数据
export function getHistoryData(params:any){
  return service({url:useDevBaseUrl('/processManage/form/getFormDataHistory'), method:'get', data:params});
}

export function getAppHistoryData(params:any){
  return service({url:useDevBaseUrl('/application/processManage/form/getFormDataHistory'), method:'get', data:params});
}
//启用此版本 - form编辑器
export function getEnableVersion(params:any){
  return service({url:useDevBaseUrl('/processManage/form/switchHistoryData'), method:'get', data:params});
}

export function getAppEnableVersion(params:any){
  return service({url:useDevBaseUrl('/application/processManage/form/switchHistoryData'), method:'get', data:params});
}
//form 编辑器-获取实体返回的数据
export function getEntityData(dsKey:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getModel?dsKey='+dsKey), method:'get'});
}
export function getEntityDataJson(dsKey:any){
  return service({url:useDevBaseUrl('/entitymanage/dataSource/getModelJson?dsKey='+dsKey), method:'get'});
}
// 生成建表语句
export function getCreateDdl(dsKey:any){
  return service({url:useDevBaseUrl('/entitymanage/dataSource/getCreateDdl?dsKey='+dsKey), method:'get'});
}
export function getTableDatas(dsKey?:any,tableKey?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getCreateDdl?dsKey='+dsKey + '&tableKey='+tableKey),
    method:'get',
  });
}
export function getYaml(dsKey?:any){
  return service({url:useDevBaseUrl('/entitymanage/dataSource/getYaml?dsKey='+dsKey),
    method:'get',
  });
}
// 生成修改表语句
export function getUpdateDdl(dsKey:any){
  return service({url:useDevBaseUrl('/entitymanage/dataSource/getUpdateDdl?dsKey='+dsKey), method:'get'});
}
export function getTableDatass(dsKey?:any,tableKey?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getUpdateDdl?dsKey='+dsKey + '&tableKey='+tableKey),
    method:'get',
  });
}
