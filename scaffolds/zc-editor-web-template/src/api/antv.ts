import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"
import qs from 'qs';

// 获取详情
export function getAntv(data:any) {
  return service({url:useDevBaseUrl('/apiManage/api/get?queryKey=' + data),
  method: 'get',
  // data: data
});
}

// 修改
export function updateAntv(data:any) {
  return service({url:useDevBaseUrl('/apiManage/api/update'),
  method: 'put',
  data: data});
}

// 获取实体管理列表数据
export function getDataSource() {
  return service({url:useDevBaseUrl('/entitymanage/dataSource/getListEx'),
  method: 'get',
  });
}

export function getDataTableList() {
  return service({url:useDevBaseUrl('/entitymanage/table/getTableList'),
  method: 'get',
  });
}
// 获取实体管理列表数据 详情
export function getTableList(data:any) {
  return service({url:useDevBaseUrl('/entitymanage/table/getTableList?dsKey=' + data),
  method: 'get'
  });
}
// 调试
export function getDebug(data:any) {
  console.log(data,'datadatadatadata')
  if(data.type == 'GET'){
    console.log(data.requestParams)
    let url = ''
    let urls = ''
    if(data.requestParams){
      console.log(tansParams(JSON.parse(data.requestParams)),'1111111')
      url = JSON.parse(data.requestParams)
      // url = data.queryKey + '?' + tansParams(JSON.parse(data.requestParams));
      // url = url.slice(0, -1);
    }else{
      url = data.queryKey
    }
    urls = data.queryKey + '?' + qs.stringify(url)
    return service({url:useDevBaseUrl('/api/execute/debug/'+urls),
    // return service({url:useDevBaseUrl('/api/execute/debug/'+url),
      method: 'get'
    });
  }else if(data.type == 'POST'){
    if(data.requestParams==''){
      return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
      method: 'post',
    });
    }else{
      return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
      method: 'post',
      data:data.requestParams
    });
    }
  }
  else if(data.type == 'PUT'){
    if(data.requestParams==''){
      return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
        method: 'put',
      });
    }else{
      return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
        method: 'put',
        data:data.requestParams
      });
    }
  }
  else if(data.type == 'PATCH'){
    if(data.requestParams==''){
      return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
        method: 'patch',
      });
    }else{
      return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
        method: 'patch',
        data:data.requestParams
      });
    }
  }
  else if(data.type == 'DELETE'){
    console.log(data.requestParams)
    let url = ''
    let urls = ''
    if(data.requestParams){
      console.log(tansParams(JSON.parse(data.requestParams)),'1111111')
      // url = data.queryKey + '?' + tansParams(JSON.parse(data.requestParams));
      url = JSON.parse(data.requestParams)
      // console.log(url,'url')
      // url = url.slice(0, -1);
    }else{
      url = data.queryKey
    }
    urls = data.queryKey + '?' + qs.stringify(url)
    return service({url:useDevBaseUrl('/api/execute/debug/'+urls),
      method: 'delete'
    });
  }
}

// 获取流程级联
export function getLaunchProcessButtonData() {
  return service({url:useDevBaseUrl('/processManage/process/invokeProcessButtonData'),
  method: 'get'
  });
}
// 获取历史
export function getApiDataHistory(data:any) {
  return service({url:useDevBaseUrl('/apiManage/api/getApiDataHistory?queryKey=' + data),
  method: 'get'
  });
}
// 获取历史
export function switchHistoryData(data:any) {
  return service({url:useDevBaseUrl('/apiManage/api/switchHistoryData?startUsingApiId=' + data),
  method: 'get'
  });
}

// 获取api管理左侧列表
export function apiList() {
  return service({url:useDevBaseUrl('/apiManage/api-group/list'),
  method: 'get'
  });
}

// 获取api管理右侧列表
export function apiPage(params?:any) {
  return service({url:useDevBaseUrl('/apiManage/api/getList'),
  method: 'get',
  });
}

export function tansParams(params) {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    var part = encodeURIComponent(propName) + "=";
    if (value !== null && typeof (value) !== "undefined") {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && typeof (value[key]) !== 'undefined') {
            let params = propName + '[' + key + ']';
            var subPart = encodeURIComponent(params) + "=";
            result += subPart + encodeURIComponent(value[key]) + "&";
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&";
      }
    }
  }
  return result
}

// http中的调试
export function getNeiDebug(data:any) {
  console.log(data,'datadatadatadata')
      return service({url:useDevBaseUrl('/apiCenter/debug/'),
      method: 'post',
      data:data
    });
}
// http中的获取文件存储方式
export function getListAllSimple() {
      return service({url:useDevBaseUrl("/app/file-config/list-all-simple"),
      method: 'get'
    });
}
// 直接获取api输出数据
export function getApiData(data:any) {
  return service({url:useDevBaseUrl('/api/execute/' + data),
    method: 'get'
  })
}
