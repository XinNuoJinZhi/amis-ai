import DataSchemaEngine from '@/components/DataSchemaEngine';
import { history } from '@umijs/max';
import React from 'react';
import { isAppEnd } from '@/utils/index'
import { useDevBaseUrl } from "@/utils/util"
import permStore from '@/store/permission';
import {AMISComponent} from "@/hooks/amis";
let selectApi = isAppEnd() ? useDevBaseUrl("/application/entitymanage/dataSource/getListEx") : useDevBaseUrl("/entitymanage/dataSource/getListEx")
let initApi = isAppEnd() ? useDevBaseUrl("/application/entitymanage/table/getModel?dsKey=${select}") : useDevBaseUrl("/entitymanage/table/getModel?dsKey=${select}")
const schema = {
  "type": "page",
  "className": "dataManage",
  "asideResizor": true,
  "initApi": {
    "method": "get",
    "url": initApi,
    "sendOn": "${select}",
    adaptor: function (payload: any,response:any, api:any, context:any) {
      if(api.query.dsKey == '') return;
      const params = new URLSearchParams(window.location.search);
      //queryKey 第一次跳转进来从地址栏取(编辑端地址栏有queryKey，应用端地址栏没有queryKey，从接口里取第一条数据) 切换时从接口返回值里取
      let  queryKey = params.get('queryKey') ;
      payload.data = payload?.data?.filter(item=>item.type != 2)
      const permissionData = permStore.getState().permData
      const linksData = payload?.data ? payload?.data : []
      const linksDataAll = JSON.parse(JSON.stringify(payload?.data ? payload?.data : []))
      for(var i=0;i<linksData.length;i++) {
        const permKey = 'app:' + linksData[i].dsKey + ':' +  linksData[i].key + ':query'
        if(!permissionData.includes(permKey)) {
          linksData.splice(i,1)
        }
      }
      let val = payload?.data?.some((i)=>i.id==queryKey);
      if(!val){
        queryKey = payload?.data && payload?.data[0] ? payload?.data[0]?.id : ''
      }
      // for(var i=0;i<payload.data.length;i++){
      //   if(payload.data[i].id == queryKey){
      //     payload.data[i].active = true
      //   } else {
      //     payload.data[i].active = false
      //   }
      // }
      //当只有数据源，没有表时，dsKey 从api.query.dsKey 里取值（因为接口返回空）
      const dsKey = payload?.data && payload?.data[0] ? payload?.data[0]?.dsKey : api.query.dsKey;
      if(payload?.data?.value) {
        payload.data.value="?queryKey="+queryKey+"&dsKey="+dsKey;
      }
      payload?.data?.forEach((item:any)=>{item.value = item.id, item.label = item.name, item.to='?queryKey='+item.id+"&dsKey="+dsKey})
      linksDataAll?.forEach((item:any)=>{item.value = item.id, item.label = item.name, item.to='?queryKey='+item.id+"&dsKey="+dsKey})
      const appid = params.get('appid');
      const env = params.get('env');
      let url = '';
      if(window.location.pathname == "/app/design/dataManage"){
        url = '/app/design/dataManage?queryKey='+queryKey+'&dsKey='+dsKey+'&appid='+appid+'&env='+env ;
      } else {
        url = '/app/dataManage?&queryKey='+queryKey+'&dsKey='+dsKey+'&appid='+appid+'&env='+env;
      }
      const portalKey = params.get('portalKey');
      url = url + (portalKey ? '&portalKey=' + portalKey : '');
      history.push(url)
      // window.history.pushState({url},"",url)
      return {
        ...payload,
        status: payload.code,
        data: { links: linksData, linksAll: linksDataAll, selectedVal: dsKey}
      };
    }
  },
  "aside": [
    {
      "type": "wrapper",
      "body": [
        {
          "type": "select",
          "name": "select",
          "valueField": "code",
          "labelField": "name",
          "value": "${selectedVal}",
          "source": {
            "method": "get",
            "url": selectApi,
            adaptor: function (payload: any) {
              //编辑端
              if(window.location.pathname == "/app/design/dataManage"){
                const params = new URLSearchParams(window.location.search);
                const dsKey = params.get('dsKey');
                const selectVal = payload?.data?.links?.filter(item => item.code == dsKey);
                return {
                  ...payload,
                  status: payload.code,
                  data: { ...payload.data, options: payload.data?.links,value:selectVal && selectVal[0] && selectVal[0]?.code }
                };
              } else{
                const params = new URLSearchParams(window.location.search);
                const dsKey = params.get('dsKey');
                let env = params.get('env');
                if(env != 1){
                  if(payload?.data?.links) {
                    payload.data.links = payload?.data?.links?.filter(item=> item.ver != null)
                  }
                }
                const selectVal = payload?.data?.links?.filter(item => item.code == dsKey);
                let dataVal = dsKey ? selectVal && selectVal[0] && selectVal[0]?.code : payload.data?.links && payload.data?.links[0] && payload.data?.links[0]?.code;
                return {
                  ...payload,
                  status: payload.code,
                  data: { ...payload.data, options: payload.data?.links, value:dataVal }
                };
              }
            },
          },
        },
      ]
    },
    {
      "type": "nav",
      "name": "nav",
      "stacked": true,
      "className": "b-t overflow-auto",
      "source": "${links}"
    }
  ],
  body:[{
    id: "schemaEngine",
    "asFormItem": true,
    "visibleOn": "${links}",
    children: ({ value, onChange, data }) => {
      return <DataSchemaEngine model={data.linksAll} style={{ height: '400px' }} />
    }
}],
}

export default () => <AMISComponent schema={schema} />;
