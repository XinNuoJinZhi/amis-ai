import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"

//调试

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
export function getDebug(data:any) {
  if(data.type == 'GET'){
    console.log(data.requestParams)
    let url = ''
    if(data.requestParams){
      url = data.queryKey + '?' + tansParams(JSON.parse(data.requestParams));
      url = url.slice(0, -1);
    }else{
      url = data.queryKey
    }
    return service({url:useDevBaseUrl('/api/execute/debug/'+url),
      method: 'get'
    });
  }else if(data.type == 'POST'){
    return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
      method: 'post',
      data:data.requestParams
    });
  }
  else if(data.type == 'PUT'){
    return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
      method: 'put',
      data:data.requestParams
    });
  }
  else if(data.type == 'PATCH'){
    return service({url:useDevBaseUrl('/api/execute/debug/'+data.queryKey),
      method: 'patch',
      data:data.requestParams
    });
  }
  else if(data.type == 'DELETE'){
    console.log(data.requestParams)
    let url = ''
    if(data.requestParams){
      console.log(tansParams(JSON.parse(data.requestParams)),'1111111')
      url = data.queryKey + '?' + tansParams(JSON.parse(data.requestParams));
      console.log(url,'url')
      url = url.slice(0, -1);
    }else{
      url = data.queryKey
    }
    return service({url:useDevBaseUrl('/api/execute/debug/'+url),
      method: 'delete'
    });
  }
}

export const getApiDetail = (queryKey:any) => {
  return service({ url:  useDevBaseUrl('/apiManage/api/get?queryKey='+queryKey), method:'get' })
}
