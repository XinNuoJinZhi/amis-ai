import { service } from '@/utils/request'
import { useAdminBaseUrl, useDevBaseUrl } from "@/utils/util"
export function getTableData(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getTableInfo?tableKey='+params),
  method:'get',
  });
}
export function getTableDatas(dsKey?:any,tableKey?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getModelJson?dsKey='+dsKey + '&tableKey='+tableKey),
  method:'get',
  });
}
// 后端缓存获取数据
export function getTablesFields(dsKey?:any,tableKey?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getTablesFields/'+dsKey+'/'+tableKey),
  method:'get',
  });
}
export function getZidian(params?:any){
  return service({url:useDevBaseUrl('/app/dict-type/list-all'),
  method:'get',
  data:params});
}
export function getExternalList(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getTableRelationForeignKey'),
  method:'get',
  data:params
});
}
// 获取人员列表
export function getAllSimple(params?:any){
  return service({url:useDevBaseUrl('/system/user/list-all-simple'),
  method:'get',
  data:params
});
}
// 获取雪花
export function getZippedSnowflakeId(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getZippedSnowflakeId'),
  method:'get',
  data:params
});
}
// 获取目标表字段
export function getColumnSelect(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getColumnSelect?tableKey=' + params),
  method:'get',
});
}
// 修改数据源名称Key
export function getDataSourceName(name:any,data:any){
  name = encodeURIComponent(name);
  return service({url:useDevBaseUrl('/entitymanage/dataSource/updateDataSource/'+name),
  method:'post',
  data:data
});
}
// 获取功能权限列表
export function getPermissionList(params?:any){
  return service({url:useDevBaseUrl('/app/permission/permissionList?menuScenario=' + params),
  method:'get',
});
}
// 获取目标表字段
export function getShowColumnSelects(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getShowColumnSelect?tableKey=' + params),
  method:'get',
});
}
// 获取目标表字段
export function getInputColumnSelect(param?:any,params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getInputColumnSelect?tableKey=' + param + '&targetTableKey=' + params),
  method:'get',
});
}
//获取实体模型图数据
export function getEntityDiagramData(param?:any){
  return service({url: useDevBaseUrl('/entitymanage/table/getModelEx?dsQueryKey=' + param), method: 'get'})
}
//获取实体模型图数据
export function getTableList(param?:any){
  return service({url: useDevBaseUrl('/entitymanage/table/getTableList?dsKey=' + param), method: 'get'})
}
//保存实体模型图位置
export function saveEntityDiagramPosition(param?:any){
  return service({url: useDevBaseUrl('/entitymanage/table/setModelXY'), method: 'post', data: param})
}

// 获取验证图片以及token
export function getCodeApi(data?:any){
  return service({url:useDevBaseUrl('/system/captcha/get'),
  method:'post',
  data:data
});
}
// 滑动或者点选验证
export function reqCheckApi(params?:any){
  return service({url:useDevBaseUrl('/system/captcha/check'),
  method:'post',
  data:params
});
}
// 登录获取数据
export function getIdByName(param?:any){
  return service({url: useDevBaseUrl('/system/tenant/get-id-by-name?name=' + param), method: 'get'})
}
// 登录
export function authLogin(params?:any){
  return service({url:useDevBaseUrl('/system/auth/login'),
  method:'post',
  data:params
});
}

export function saveExcel(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/saveExcelModel'),
    method:'post',
    data:params
  });
}

export function saveDataBase(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/saveDatabaseModel'),
    method:'post',
    data:params
  });
}

// 获取货币列表
export function getMoneyList(param?:any,params?:any){
  return service({url:useAdminBaseUrl('/system/dict-data/list?dictType=currency&status=0'),
    method:'get',
  })
}
//清空流水号日志
export function clearBefore(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/serialno/truncate'),
    method:'delete',
    data:params
  });
}

// 字段文本-获取关系表数据
export function getColumnSelectFields(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/table/getColumnSelect?tableKey=' + params+"&relationHasChildren=true"),
  method:'get',
});
}

// 字段文本-获取关系表数据
export function getDataSourceList(params?:any){
  return service({url:useDevBaseUrl('/entitymanage/dataSource/getList'),
    method:'get',
  });
}