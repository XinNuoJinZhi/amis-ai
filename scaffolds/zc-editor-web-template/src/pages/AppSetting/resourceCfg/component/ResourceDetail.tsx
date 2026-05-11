import React, { useState, useEffect, useRef } from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { getResourceDetail } from "@/api/acl"
import { history } from '@umijs/max';
import { isEditorialEnd } from '@/utils/index'
import { useDevBaseUrl } from "@/utils/util"
import {env as amisEnv} from '@/hooks/amis';
const ResourceDetail: React.FC = (props) => {
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [resourceTypeLoading, setResourceTypeLoading] = useState(false);
  const changeToCreate = ()=>{
    const params = new URLSearchParams(window.location.search);
    let env = params.get('env')
    let appid =  params.get('appid');
    if(props.resourceType == 'APICenter'){ //API
      history.push('/app/design/apiManage?appid=' + appid + '&env=' + env)
    } else if(props.resourceType == 'APICenterGroup'){//API分组
      history.push('/app/design/apiManage?appid=' + appid + '&env=' + env)
    } else if(props.resourceType == 'DataModel'){ //数据模型
      history.push('/app/design/entityManage?appid=' + appid + '&env=' + env)
    } else if(props.resourceType == 'DataSource'){ //数据源
      history.push('/app/design/entityManage?appid=' + appid + '&env=' + env)
    } else if(props.resourceType == 'FORM'){ //表单
      history.push('/app/design/formManage?appid=' + appid + '&env=' + env)
    } else if(props.resourceType == 'VIS'){ //可视化大屏
      history.push('/app/design/visualization?appid=' + appid + '&env=' + env)
    }
  }
  //监听：当切换角色时，右侧详情先删除在加载
  useEffect(()=>{
    setRoleLoading(false)
    setTimeout(()=>{
      setRoleLoading(true)
    },900)
  },[props.roleId]);
   //监听：当切资源列表时，右侧详情先删除在加载
  useEffect(()=>{
    setResourceTypeLoading(false)
    setTimeout(()=>{
      setResourceTypeLoading(true)
    },900)
  },[props.resourceType]);
  useEffect(()=>{
    setLoading(false)
    setTimeout(()=>{
      setLoading(true)
    },1000)
  },[props.detailData]);
  const ItemCfg = (data:any, roleId:any) => {
    //配置 自定义权限-应用端只能看，不能新建修改删除，API权限，不管哪个端，都只能看
    let copyData = data.acl.value;
    let name = roleId +'-' + data.value;
    const schema = {
      "type": "page",
      "data": {
        "result": copyData,
        "name": name,
      },
      "body": {
        "type": "wrapper",
        "body": [
          {
            "name": "${name}",
            "type": "checkboxes",
            "label": "",
            // "checkAll": !data.acl.disableSelectAll,
            "creatable": props?.new && data.acl.creatable,
            "createBtnLabel": props?.new && data.acl.creatable ? '新增权限' : '',
            "inline": false,
            "joinValues": false,
            "extractValue": true,
            "editable": props?.edit && isEditorialEnd() && data.acl.creatable ? true : false,
            "removable": props?.del && isEditorialEnd() && data.acl.creatable ? true : false,
            // "checkAllText": "全选",
            // "disabled": data.acl?.disabled ? data.acl?.disabled : false,
            "addDialog": {
              "title": "页面「"+data?.label+"」中，新增自定义权限",
            },
            "addControls": [
              {
                "type": "text",
                "name": "value",
                "label": "标识",
                "required": true,
                "maxLength": 10,
                "showCounter": true,
                "desc": "权限标识，例如「print」，不可修改，不要使用 read、create、edit、delete、admin 或者 share 内置标识，设置将没有效果",
                "validations": {
                  "matchRegexp": "^\\w+$"
                },
                "validationErrors": {
                    "matchRegexp": "权限标识只能包含字母、数字、下划线"
                }
              },
              {
                "type": "text",
                "name": "label",
                "label": "标签",
                "required": true,
                "maxLength": 10,
                "showCounter": true,
                "desc": "权限标签名。例如「可打印」"
              }
            ],
            "editControls": [
              {
                "type": "text",
                "name": "value",
                "label": "标识",
                "required": true,
                "maxLength": 10,
                "showCounter": true,
                "disabled": true,
                "desc": "权限标识，例如「print」，不可修改，不要使用 read、create、edit、delete、admin 或者 share 内置标识，设置将没有效果"
              },
              {
                "type": "text",
                "name": "label",
                "label": "标签",
                "desc": "权限标签名。例如「可打印」"
              }
            ],
            "addApi": props?.new && data.acl.creatable ? {
              "method": "post",
              "url": useDevBaseUrl("/app/permission/addPageCustomPermission"),
              requestAdaptor: function (api:any) {
                let label = api.data.label;
                let value = api.data.value;
                let pageQueryKey = api.data.__super.__super.__super.name.split('-')[1];
                return {
                    ...api,
                    data: {
                        "pageQueryKey": pageQueryKey,
                        "label": label,
                        "value": value,
                    }
                };
              },
              adaptor: async function (payload:any) {
                //资源详情-新增自定义权限后刷新接口，重新加载。编辑和删除不重新请求接口--因为新增不重新请求接口显示不对
                if(payload.code ==0 ){
                    //新增后不重新请求接口，为了所有用户需求置灰
                    // let res = await getResourceDetail(props.resourceType, props.roleId);
                    // props.setResourceListDetailData(res.data.data);
                  props.resourceDetail(props.resourceType, props.roleId, props.roleCode)
                }
                return {
                  ...payload,
                  status: payload.code
                };
              }
            } : '',
            "deleteApi": props?.del && isEditorialEnd() && data.acl.creatable ? {
              "method": "delete",
              "url": useDevBaseUrl("/app/permission/deletePageCustomPermission"),
              requestAdaptor: function (api:any, context:any) {
                let value = api.context.value;
                let name = api.context.__super.name;
                let pageQueryKey = name.split('-')[1];
                let cacheName = context.__super.name;
                var charToRemove = context.value;
                // let arr = context.__super.result.filter(item=>item !=charToRemove)
                let index = context.__super.result.indexOf(charToRemove)
                context.__super.result.splice(index,  1)
                sessionStorage.setItem(cacheName, context.__super.result.join(','))
                return {
                    ...api,
                    data: {
                        "pageQueryKey": pageQueryKey,
                        "value": value,
                    }
                };
              },
              adaptor: async function (payload:any) {
                //资源详情-删除自定义权限后刷新接口，重新加载
                if(payload.code ==0 ){
                  props.resourceDetail(props.resourceType, props.roleId, props.roleCode)
                }
                return {
                  ...payload,
                  status: payload.code
                };
              }
            } : '',
            "editApi": props?.edit && isEditorialEnd() && data.acl.creatable ? {
              "method": "put",
              "url": useDevBaseUrl("/app/permission/updatePageCustomPermission"),
              requestAdaptor: function (api:any) {
                let label = api.data.label;
                let value = api.data.value;
                let pageQueryKey = api.data.__super.__super.__super.name.split('-')[1];
                return {
                    ...api,
                    data: {
                        "pageQueryKey": pageQueryKey,
                        "label": label,
                        "value": value,
                    }
                };
              },
              adaptor: async function (payload:any) {
                //资源详情-更新自定义权限后刷新接口，重新加载
                if(payload.code ==0 ){
                  props.resourceDetail(props.resourceType, props.roleId, props.roleCode)
                }
                return {
                  ...payload,
                  status: payload.code
                };
              }
            } : '',
            "options": data.acl.options,
            "value": "${result|join}",
            "onEvent": {
              "change": {
                "actions": [
                  {
                    "actionType": "custom",
                    "script": async function (_, doAction, event) {
                      props.childChange()
                      //组件去勾选有时不好使，导致数据重复，暂时解决：先去重
                      let arr  = [...new Set(event.data.value)].join(',');
                      sessionStorage.setItem(Object.keys(event.data)[3], arr)
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
    return (
      <div >
        {amisRender(schema,{}, {
          fetcher: service,
          theme: amisEnv.theme
        })}
      </div>
    )
  }
  function showResourceDetail(detailData:any){
    return (
      <>
        {
          detailData.length > 0 && detailData.map((item) => {
            return <React.Fragment key={item.value}>
              <div className={`acl-item ${item?.children?.length > 0 ? "has-child" : ""}`} >
                <div className="acl-item-label">
                  <span>{item.label}</span>
                  <div className='divider'></div>
                </div>
                {
                  loading && (<div className="acl-item-config">
                    {ItemCfg(item, props.roleId)}
                  </div>)
                }
                {
                  item.children && item.children.length ? showResourceDetail(item.children) : null
                }
              </div>
            </React.Fragment>
          })
        }
        {
          props?.query && props?.resourceType !='Page' && detailData.length == 0 ? <div className='table-placeholder'>您还没有创建当前资源<br/><a onClick={()=>changeToCreate()}>{"马上创建>"}</a></div>  : null
        }
      </>
    )
  }
  let detailData = props.detailData && props.detailData.length > 0 ? [...props.detailData] : [];
  return (
    loading && roleLoading && resourceTypeLoading && (<>
      {
        detailData.length > 0 && detailData.map((item) => {
          return <React.Fragment key={item.value}>
            <div className={`acl-item ${item?.children?.length > 0 ? "has-child" : ""}`} >
              <div className="acl-item-label">
                <span>{item.label}</span>
                <div className='divider'></div>
              </div>
              {
                loading && (<div className="acl-item-config">
                {ItemCfg(item, props.roleId)}
              </div>)
              }
              {
                item.children && item.children.length ? showResourceDetail(item.children) : null
              }
            </div>
          </React.Fragment>
        })
      }
      {
        props?.query && props?.resourceType !='Page' && detailData.length == 0 ? <div className='table-placeholder'>您还没有创建当前资源<br/><a onClick={()=>changeToCreate()}>{"马上创建>"}</a></div>  : null
      }
    </>)
  )
}

export default ResourceDetail;

