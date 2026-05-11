import React, { useState, useEffect, useRef } from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { history } from '@umijs/max';
import {env as amisEnv} from '@/hooks/amis';
const ResourceDetail: React.FC = (props) => {
  const [loading, setLoading] = useState(false);
  const [resourceTypeLoading, setResourceTypeLoading] = useState(false);
  const [resultData, setResultData]:any = useState([]);
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
    }
  }
  // 监听：当切资源列表时，右侧详情先删除在加载
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
  const ItemCfg = (data:any) => {
    //配置 自定义权限-应用端只能看，不能新建修改删除，API权限，不管哪个端，都只能看
    let copyData = data?.memberAcl?.value;
    let name = data.value;
    resultData.push({
      [name]: copyData || []
    })
    const resultObj = {};
    resultData.forEach(item => {
        const key = Object.keys(item)[0];
        resultObj[key] = item[key]; // 存储key对应的权限数组
    });
    sessionStorage.setItem('memberResResult', JSON.stringify(resultObj))
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
            "checkAll": !data?.memberAcl?.disableSelectAll,
            "inline": false,
            "joinValues": false,
            "extractValue": true,
            "options": data?.memberAcl?.options,
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
                    {ItemCfg(item)}
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
          !props?.hide && props?.query && detailData.length == 0 ? <div className='table-placeholder'>您还没有创建当前资源<br/><a onClick={()=>changeToCreate()}>{"马上创建>"}</a></div>  : null
        }
      </>
    )
  }
  let detailData = props.detailData && props.detailData.length > 0 ? [...props.detailData] : [];
  return (
    loading && resourceTypeLoading && (<>
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
                {ItemCfg(item)}
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
        !props?.hide && props?.query && detailData.length == 0 ? <div className='table-placeholder'>您还没有创建当前资源<br/><a onClick={()=>changeToCreate()}>{"马上创建>"}</a></div>  : null
      }
    </>)
  )
}

export default ResourceDetail;

