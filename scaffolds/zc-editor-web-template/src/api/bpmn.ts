import { service } from '@/utils/request'
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"

// 修改流程模型
export function modelPost(data:any) {
  return service({url:useDevBaseUrl('/processManage/model/save'),
  method: 'post',
  data: data});
}
// 流程图 表单组件 获取所有表单
export function formGet(params?:any){
  return service({url:useDevBaseUrl('/processManage/form/all-List'),
  method:'get',
  data:params});
}
// 获取部门树状图
export function deptTreeSelect(params?:any) {
  return service({url:useDevBaseUrl('/system/dept/all_list'),
    method: 'get',
    data: params
  });
}
// 获取角色列表
export function listRole(params?:any) {
  return service({url:useAdminBaseUrl('/system/role/all_list'),
    method: 'get',
    data: params
  });
}
// 获取角色列表
export function userRoleDropsDown(params?:any) {
  return service({url:useDevBaseUrl('/app/permission/userRoleDropsDown'),
    method: 'get',
    data: params
  });
}
// 根据部门获取用户列表
export function listUser(params:any) {
  return service({url:useDevBaseUrl('/system/user/all_page'),
    method: 'get',
    data: params
  });
}
// 获取流程图信息
export function getBpmnXml(id:any) {
  return service({url:useDevBaseUrl('/processManage/model/bpmnXml/'+id),
    method: 'get',
    // params: params
  });
}
// 获取流程图信息
export function getBpmnXmlModelId(id:any) {
  return service({url:useDevBaseUrl('/processManage/model/bpmnXmlByModelId/'+id),
    method: 'get',
    // params: params
  });
}
// 获取流程图信息-部署管理
export function getDeployBpmnXml(id:any) {
  return service({url:useDevBaseUrl('/processManage/deploy/bpmnXml/'+id),
    method: 'get',
  });
}
// 获取信息开始事件 下拉数据
export function getModelEvent(params?:any) {
  return service({url:useDevBaseUrl('/processManage/model/event?formKey=' + params),
    method: 'get',
  });
}
// 获取实体级联
export function getOptionsAll(params?:any) {
  console.log(params,'params')
  if(params){
    if(params.withRelationFields && params.withSystemFields){
      return service({url:useDevBaseUrl('/entitymanage/dataSource/modelOptionsAll?withRelationFields=' + params?.withRelationFields + '&withSystemFields=' + params?.withSystemFields),
        method: 'get',
      });
    }else{
      if(params.withRelationFields){
        return service({url:useDevBaseUrl('/entitymanage/dataSource/modelOptionsAll?withRelationFields=' + params?.withRelationFields),
          method: 'get',
        });
      }
      if(params.withSystemFields){
        return service({url:useDevBaseUrl('/entitymanage/dataSource/modelOptionsAll?withSystemFields=' + params?.withSystemFields),
          method: 'get',
        });
      }
    }
  }else{
    return service({url:useDevBaseUrl('/entitymanage/dataSource/modelOptionsAll'),
      method: 'get',
    });
  }
}
// 获取api列表
export function getGroupList() {
  return service({url:useDevBaseUrl('/apiManage/api/getGroupList'),
    method: 'get',
  });
}
// 获取api列表
export function getGroupListFilterTiming() {
  return service({url:useDevBaseUrl('/apiManage/api/getGroupListFilterTiming'),
    method: 'get',
  });
}

// 获取共享api列表
export function getApiShareList() {
  return service({url:useDevBaseUrl('/app/api-share/api/apiShareList'),
    method: 'get',
  });
}
// 获取共享实体列表
export function getEntityShareList() {
  return service({url:useDevBaseUrl('/app/api-share/entity/dataSource/modelOptionsAll'),
    method: 'get',
  });
}
