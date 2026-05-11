import {useDevBaseUrl, findPathByValue, findPathById, getLabelsByValue} from "@/utils/util"
import { toast } from 'amis'
import { saveApiShare } from "@/api/interfaceManage"
import { getTemplate } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
const schema = {
  "type": "page",
  "body": {
    "type": "tabs",
    "swipeable": true,
    "unmountOnExit": true,
    "tabs": [
      {
        "title": "初始化",
        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'apiManage:init-api:query')}",
        "tab": [
          {
            "type": "form",
            "id": "initApi_page",
            "initApi": {
              "method": "get",
              "url": useDevBaseUrl("/apiManage/api/getAppInitApi"),
              adaptor: function (payload:any) {
                return {
                  ...payload,
                  status: payload.code,
                  data: { ...payload.data, initApi: payload.data?.queryKey }
                };
              }
            },
            "api": {
              "method": "post",
              "url": useDevBaseUrl("/apiManage/api/saveInitApi"),
              requestAdaptor: function (api:any) {
                let queryKey = api.data.initApi;
                let timeout = api.data.timeout;
                return {
                  ...api,
                  data: {
                    "queryKey": queryKey,
                    "timeout": timeout
                  }
                };
              },
              adaptor: function (payload:any) {
                return {
                  ...payload,
                  status: payload?.code
                };
              }
            },
            "actions": [
              {
                "type": "submit",
                "label": "提交",
                "level": "primary",
                "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'apiManage:init-api:create')}",
              }
            ],
            "title": "",
            "mode": "horizontal",
            "horizontal": {
              "right": 5,
              "offset": 2
            },
            "body": [
              {
                "type": "nested-select",
                "name": "initApi",
                "label": "初始化接口",
                "clearable": true,
                "onlyLeaf": true,
                "labelWidth": 100,
                "source": {
                  "method": "get",
                  "url": useDevBaseUrl("/apiManage/api/getAllApiSetting"),
                  adaptor: function (payload: any) {
                    let dataOptions = payload.data.filter(item=>item.children && item.children.length>0);
                    return {
                      ...payload,
                      status: payload.code,
                      data: { ...payload.data, options: dataOptions }
                    };
                  },
                },
                "desc":"初始化接口会在应用初次打开时调用，返回的数据可用于应用内所有页面中。返回的数据通过 `app` 前缀获取如：`\\${app.a}`"
              },
              {
                "type": "input-number",
                "name": "timeout",
                "label": "接口超时（秒）",
                "value": 10,
                "labelWidth": 100,
                "visibleOn": "${initApi}"
              }
            ],
            onEvent: {
              submitSucc: {
                actions: [
                  {
                    actionType: "reload",
                    componentId: "initApi_page"
                  }
                ]
              }
            }
          }
        ]
      },
      {
        "title": "OpenAPI",
        "tab": [
          {
            "type": "page",
            "body": [
              {
                "type": "crud",
                "syncLocation": false,
                "autoFillHeight": true,
                "id": "share_crud",
                "api": {
                  "method": "get",
                  "url": useDevBaseUrl("/app/api-share/page"),
                  "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                  },
                  adaptor: function (payload:any) {
                    return {
                      ...payload,
                      status: payload.code,
                      data: { ...payload.data, items: payload.data?.list }
                    };
                  }
                },
                "headerToolbar": [
                  {
                    "type": "columns-toggler",
                    "align": "right",
                    "draggable": true
                  },
                  {
                    "type": "reload",
                    "align": "right",
                  },
                  {
                    "type": "button",
                    "icon": "fa fa-plus",
                    "align": "left",
                    "label": "新建共享",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'apiManage:api-share:saveOrUpdate')}",
                    "level": "primary",
                    "actionType": "dialog",
                    "dialog": {
                      "title": "新建共享",
                      "id": "share_dialog",
                      "size": "md",
                      "body": {
                        "type": "form",
                        "id": "mobile_register",
                        "onEvent": {
                          "inited": {
                            "actions": [
                              {
                                "actionType": "custom",
                                "script": async function (context:any, doAction: any, e: any) {
                                  sessionStorage.removeItem('api_collection_list')
                                  sessionStorage.removeItem('share_list')
                                  sessionStorage.removeItem('apiListData')
                                  sessionStorage.removeItem('currentSysTenantAppData')
                                  sessionStorage.removeItem('entityListData')
                                  sessionStorage.removeItem('otherSysTenantAppData')
                                  sessionStorage.removeItem('external_share_list')
                                  sessionStorage.removeItem('share_app_list')
                                  sessionStorage.removeItem('share_tenant_list')

                                  doAction({
                                    "actionType": "setValue",
                                    "componentId": "api_list",
                                    "args": {
                                      "value": {
                                        "items": [],
                                      }
                                    }
                                  })
                                  doAction({
                                    "actionType": "setValue",
                                    "componentId": "share_list",
                                    "args": {
                                      "value": {
                                        "items": [],
                                      }
                                    }
                                  })
                                  doAction({
                                    "actionType": "setValue",
                                    "componentId": "external_share_list",
                                    "args": {
                                      "value": {
                                        "items": [],
                                      }
                                    }
                                  })
                                }
                              }
                            ]
                          }
                        },
                        "body": [
                          {
                            "type": "input-text",
                            "name": "shareName",
                            "label": "名称",
                            "required": "true",
                            "placeholder": "请填写共享名称",
                            "showCounter": true,
                            "maxLength": 50,
                          },
                          {
                            "type": "textarea",
                            "name": "remark",
                            "label": "备注",
                            "placeholder": "请输入备注信息",
                            "showCounter": true,
                            "maxLength": 255,
                          },
                          {
                            "type": "combo",
                            "name": "apiCollection",
                            "label": "API集合",
                            "required": "true",
                            "items": [
                              {
                                "name": "text",
                                "label": "新增",
                                "type": "button",
                                "level": "link",
                                "actionType": "dialog",
                                "dialog": {
                                  "title": "新增API集合",
                                  "body": {
                                    "type": "form",
                                    "body": [
                                      {
                                        "type": "radios",
                                        "name": "relationType",
                                        "label": "接口类型",
                                        "required": "true",
                                        "value":  1,
                                        "options": [
                                          {
                                            "label": "实体",
                                            "value": 1
                                          },
                                          {
                                            "label": "API中心",
                                            "value": 2
                                          }
                                        ]
                                      },
                                      {
                                        "type": "nested-select",
                                        "id": "selectedEntity",
                                        "name": "relationSource",
                                        "label": "实体",
                                        "required": "true",
                                        "onlyLeaf": true,
                                        "visibleOn": "${relationType == 1}",
                                        "valueField": "id",
                                        "source": {
                                          "method": "get",
                                          "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                                          adaptor: function (payload: any) {
                                            let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                                            sessionStorage.setItem('entityListData',JSON.stringify(data))
                                            const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                            const delEntityCode:any = []
                                            for(var i=0;i<listData.length;i++){
                                              if(listData[i].relationType == 1){ //实体类型的时候
                                                delEntityCode.push(listData[i].relationSource)
                                              }
                                            }
                                            const filteredData = data.map(item => ({
                                              ...item,
                                              children: item.children.filter(child => !delEntityCode.includes(child.id))
                                            }));
                                            const filteredDataVal = filteredData.filter(item => item.children && item.children.length > 0)
                                            return {
                                              ...payload,
                                              status: payload.code,
                                              data: { ...payload.data, options: filteredDataVal }
                                            };
                                          },
                                        }
                                      },
                                      {
                                        "name": "operateType",
                                        "type": "checkboxes",
                                        "label": "操作类型",
                                        "required": true,
                                        "visibleOn": "${relationType == 1}",
                                        "value": '4',
                                        "options": [
                                          {
                                            "label": "查",
                                            "value": 4,
                                            "disabled": true,
                                          },
                                          {
                                            "label": "增",
                                            "value": 1,
                                            "hidden": true
                                          },
                                          {
                                            "label": "改",
                                            "value": 3,
                                            "hidden": true
                                          },
                                          {
                                            "label": "删",
                                            "value": 2,
                                            "hidden": true
                                          }
                                        ]
                                      },
                                      {
                                        "type": "nested-select",
                                        "name": "api",
                                        "label": "API中心",
                                        "required": true,
                                        "clearable": true,
                                        "onlyLeaf": true,
                                        "labelWidth": 100,
                                        "visibleOn": "${relationType == 2}",
                                        "source": {
                                          "method": "get",
                                          "url": useDevBaseUrl("/apiManage/api/getAllApiSetting"),
                                          adaptor: function (payload: any) {
                                            let dataOptions = payload.data.filter(item=>item.children && item.children.length>0);
                                            sessionStorage.setItem('apiListData',JSON.stringify(dataOptions))
                                            const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                            const delApiCode:any = []
                                            for(var i=0;i<listData.length;i++){
                                              if(listData[i].relationType == 2){ //API中心的时候
                                                delApiCode.push(listData[i].relationSource)
                                              }
                                            }
                                            const filteredData = dataOptions.map(item => ({
                                              ...item,
                                              children: item.children.filter(child => !delApiCode.includes(child.value))
                                            }));
                                            const filteredDataVal = filteredData.filter(item => item.children && item.children.length > 0)
                                            return {
                                              ...payload,
                                              status: payload.code,
                                              data: { ...payload.data, options: filteredDataVal }
                                            };
                                          },
                                        },
                                      },
                                    ]
                                  },
                                  "onEvent": {
                                    "confirm": {
                                      "actions": [
                                        {
                                          "actionType": "custom",
                                          "script": async function (context:any, doAction: any, e: any) {
                                            const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                            if(e.data.relationType == 1 && e.data.relationSource && e.data.operateType) {
                                              const a = e.data.operateType.split(',')
                                              let operationsShow = []
                                              if(a.includes('1')){
                                                operationsShow.push('增')
                                              }
                                              if(a.includes('3')){
                                                operationsShow.push('改')
                                              }
                                              if(a.includes('4')){
                                                operationsShow.push('查')
                                              }
                                              if(a.includes('2')){
                                                operationsShow.push('删')
                                              }
                                              const entityListData = JSON.parse(sessionStorage.getItem('entityListData')!)
                                              const entityName = findPathById(entityListData, e.data.relationSource)
                                              listData.push({
                                                modelEventTarget: entityName,
                                                relationSource: e.data.relationSource,
                                                operateType: e.data.operateType,
                                                operationsShow: operationsShow.join('/'),
                                                relationType: e.data.relationType,
                                              })
                                            } else if(e.data.relationType==2 && e.data.api){
                                              const apiListData = JSON.parse(sessionStorage.getItem('apiListData')!)
                                              const apiName = findPathByValue(apiListData, e.data.api)
                                              listData.push({
                                                modelEventTarget: apiName,
                                                relationSource: e.data.api,
                                                operateType: null,
                                                operationsShow: null,
                                                relationType: e.data.relationType,
                                              })
                                            }
                                            sessionStorage.setItem('api_collection_list', JSON.stringify(listData))
                                            doAction({
                                              "actionType": "setValue",
                                              "componentId": "api_list",
                                              "args": {
                                                "value": {
                                                  "items": listData,
                                                }
                                              }
                                            })
                                          }
                                        }
                                      ]
                                    }
                                  },
                                }
                              },
                            ]
                          },
                          {
                            "type": "table",
                            "id": "api_list",
                            "columns": [
                              {
                                "label": "接口类型",
                                "name": "relationType",
                                "type": 'mapping',
                                "map": {
                                  '1': "<span>实体</span>",
                                  '2': "<span>API中心</span>",
                                },
                              },
                              {
                                "name": "modelEventTarget",
                                "label": "名称"
                              },
                              // {
                              //   "name": "relationSource",
                              //   "label": "编码"
                              // },
                              {
                                "name": "operationsShow",
                                "label": "操作类型"
                              },
                              {
                                "type": "operation",
                                "label": "操作",
                                "buttons": [
                                  {
                                    "label": "删除",
                                    "type": "button",
                                    "level": "link",
                                    "actionType": "dialog",
                                    "dialog": {
                                      "title": '删除',
                                      "body": {
                                        "type": 'mapping',
                                        "value": '1',
                                        "map": {
                                          '1': '您确认要删除${modelEventTarget}?'
                                        }
                                      },
                                      "onEvent": {
                                        "confirm": {
                                          "actions": [
                                            {
                                              "actionType": "custom",
                                              "script": async function (context:any, doAction: any, e: any) {
                                                const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!)
                                                const delIndex = e.data.__super.__super.index
                                                listData.splice(delIndex, 1)
                                                sessionStorage.setItem('api_collection_list', JSON.stringify(listData))
                                                doAction({
                                                  "actionType": "setValue",
                                                  "componentId": "api_list",
                                                  "args": {
                                                    "value": {
                                                        "items": listData,
                                                    }
                                                  }
                                                })
                                              }
                                            }
                                          ]
                                        }
                                      },
                                    },
                                  },
                                  {
                                    "label": "编辑",
                                    "type": "button",
                                    "level": "link",
                                    "disabledOn": "${relationType==2}",
                                    "actionType": "dialog",
                                    "dialog": {
                                      "title": "编辑API集合",
                                      "body": {
                                        "type": "form",
                                        "body": [
                                          {
                                            "type": "radios",
                                            "name": "relationType",
                                            "label": "接口类型",
                                            "required": "true",
                                            "disabled": true,
                                            "value":  1,
                                            "options": [
                                              {
                                                "label": "实体",
                                                "value": 1
                                              },
                                              {
                                                "label": "API中心",
                                                "value": 2
                                              }
                                            ]
                                          },
                                          {
                                            "type": "nested-select",
                                            "id": "selectedEntity",
                                            "name": "relationSource",
                                            "label": "实体",
                                            "required": "true",
                                            "onlyLeaf": true,
                                            "visibleOn": "${relationType == 1}",
                                            "valueField": "id",
                                            "source": {
                                              "method": "get",
                                              "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                                              adaptor: function (payload: any, response: any, api: any, context: any) {
                                                let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                                                sessionStorage.setItem('entityListData',JSON.stringify(data))
                                                let listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                                listData = listData.filter(i=> i.relationSource != context.__super.relationSource)
                                                const delEntityCode:any = []
                                                for(var i=0;i<listData.length;i++){
                                                  if(listData[i].relationType == 1){ //实体类型的时候
                                                    delEntityCode.push(listData[i].relationSource)
                                                  }
                                                }
                                                const filteredData = data.map(item => ({
                                                  ...item,
                                                  children: item.children.filter(child => !delEntityCode.includes(child.id))
                                                }));
                                                const filteredDataVal = filteredData.filter(item => item.children && item.children.length > 0)
                                                return {
                                                  ...payload,
                                                  status: payload.code,
                                                  data: { ...payload.data, options: filteredDataVal }
                                                };
                                              },
                                            }
                                          },
                                          {
                                            "name": "operateType",
                                            "type": "checkboxes",
                                            "label": "操作类型",
                                            "required": true,
                                            "visibleOn": "${relationType == 1}",
                                            "value": '4',
                                            "options": [
                                              {
                                                "label": "查",
                                                "value": 4,
                                                "disabled": true
                                              },
                                              {
                                                "label": "增",
                                                "value": 1,
                                                "hidden": true
                                              },
                                              {
                                                "label": "改",
                                                "value": 3,
                                                "hidden": true
                                              },
                                              {
                                                "label": "删",
                                                "value": 2,
                                                "hidden": true
                                              }
                                            ]
                                          },
                                          {
                                            "type": "nested-select",
                                            "name": "api",
                                            "label": "API中心",
                                            "required": true,
                                            "clearable": true,
                                            "onlyLeaf": true,
                                            "labelWidth": 100,
                                            "visibleOn": "${relationType == 2}",
                                            "source": {
                                              "method": "get",
                                              "url": useDevBaseUrl("/apiManage/api/getAllApiSetting"),
                                              adaptor: function (payload: any) {
                                                let dataOptions = payload.data.filter(item=>item.children && item.children.length>0);
                                                return {
                                                  ...payload,
                                                  status: payload.code,
                                                  data: { ...payload.data, options: dataOptions }
                                                };
                                              },
                                            },
                                          },
                                        ]
                                      },
                                      "onEvent": {
                                        "confirm": {
                                          "actions": [
                                            {
                                              "actionType": "custom",
                                              "script": async function (context:any, doAction: any, e: any) {
                                                const entityListData = JSON.parse(sessionStorage.getItem('entityListData')!)
                                                const entityName = findPathById(entityListData, e.data.relationSource)
                                                const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                                const editIndex = e.data.__super.__super.index
                                                if(listData[editIndex].relationSource != e.data.relationSource){
                                                  listData[editIndex].operateType = e.data.operateType
                                                  const a = e.data.operateType.split(',')
                                                  let operationsShow = []
                                                  if(a.includes('1')){
                                                    operationsShow.push('增')
                                                  }
                                                  if(a.includes('3')){
                                                    operationsShow.push('改')
                                                  }
                                                  if(a.includes('4')){
                                                    operationsShow.push('查')
                                                  }
                                                  if(a.includes('2')){
                                                    operationsShow.push('删')
                                                  }
                                                  listData[editIndex].operationsShow = operationsShow.join('/')
                                                  listData[editIndex].relationSource = e.data.relationSource
                                                  listData[editIndex].modelEventTarget = entityName
                                                }
                                                sessionStorage.setItem('api_collection_list', JSON.stringify(listData))
                                                doAction({
                                                  "actionType": "setValue",
                                                  "componentId": "api_list",
                                                  "args": {
                                                    "value": {
                                                      "items": listData,
                                                    }
                                                  }
                                                })
                                              }
                                            }
                                          ]
                                        }
                                      },
                                    },
                                  }
                                ]
                              },
                            ],
                          },
                          {
                            "type": "tabs",
                            "swipeable": true,
                            "tabs": [
                              // {
                              //   "title": "内部共享",
                              //   "visible": !getTemplate(),
                              //   "tab": [{
                              //     "type": "combo",
                              //     "name": "share",
                              //     "label": "共享给",
                              //     "required": "true",
                              //     "items": [
                              //       {
                              //         "type": "list-select",
                              //         "label": "",
                              //         "name": "shareTypeAll",
                              //         "id": "shareAll",
                              //         "multiple": true,
                              //         "joinValues": false,
                              //         "extractValue": true,
                              //         "options": [
                              //           {
                              //             "label": "租户内全部应用",
                              //             "value": 3,
                              //             "disabledOn": "this.shareTypeAll.includes(4)"
                              //           },
                              //           {
                              //             "label": "平台内全部应用",
                              //             "value": 4
                              //           }
                              //         ],
                              //         "onEvent": {
                              //           "change": {
                              //             "actions": [
                              //               {
                              //                 "actionType": "custom",
                              //                 "script": function (context: any, doAction: any, event: any) {
                              //                   const selectedValues = event.data.value || [];
                              //                   const isOption2Selected = selectedValues.includes(4);
                              //                   if (isOption2Selected && !selectedValues.includes(3)) {
                              //                     selectedValues.push(3);
                              //                     doAction({
                              //                       actionType: 'setValue',
                              //                       componentId: 'shareAll',
                              //                       args: {
                              //                         value: selectedValues
                              //                       }
                              //                     });
                              //                   }
                              //                   if (selectedValues.length == 1) { // 选的是租户内全部应用
                              //                     const filterAppList = JSON.parse(sessionStorage.getItem('share_app_list')!)
                              //                     sessionStorage.setItem('share_list', JSON.stringify(filterAppList))
                              //                     doAction({
                              //                       "actionType": "setValue",
                              //                       "componentId": "share_list",
                              //                       "args": {
                              //                         "value": {
                              //                           "items": filterAppList,
                              //                         }
                              //                       }
                              //                     })
                              //                   } else if(selectedValues.length == 2){ //选的是平台内全部应用
                              //                     sessionStorage.setItem('share_list', JSON.stringify([]))
                              //                     doAction({
                              //                       "actionType": "setValue",
                              //                       "componentId": "share_list",
                              //                       "args": {
                              //                         "value": {
                              //                           "items": [],
                              //                         }
                              //                       }
                              //                     })
                              //                   } else if(selectedValues.length == 0) { //去勾选后什么都没选
                              //                     const tenantList = sessionStorage.getItem('share_tenant_list') != null ? JSON.parse(sessionStorage.getItem('share_tenant_list')!) : []
                              //                     const appList = sessionStorage.getItem('share_app_list') != null ? JSON.parse(sessionStorage.getItem('share_app_list')!) : []
                              //                     const data = tenantList.concat(appList)
                              //                     sessionStorage.setItem('share_list', JSON.stringify(data))
                              //                     doAction({
                              //                       "actionType": "setValue",
                              //                       "componentId": "share_list",
                              //                       "args": {
                              //                         "value": {
                              //                           "items": data,
                              //                         }
                              //                       }
                              //                     })
                              //                   }
                              //                 }
                              //               },
                              //             ]
                              //           }
                              //         }
                              //       },
                              //       {
                              //         "name": "text",
                              //         "label": "新增",
                              //         "type": "button",
                              //         "level": "link",
                              //         "disabledOn": "this.shareTypeAll.includes(4)",
                              //         "actionType": "dialog",
                              //         "dialog": {
                              //           "title": "新增共享",
                              //           "body": {
                              //             "type": "form",
                              //             "id": "shareForm",
                              //             "body": [
                              //               {
                              //                 "type": "radios",
                              //                 "name": "shareType",
                              //                 "label": "类型",
                              //                 "required": "true",
                              //                 "value":  "${shareTypeAll == 3 ? 2 : 1}",
                              //                 "options": [
                              //                   {
                              //                     "label": "租户内共享",
                              //                     "value": 1,
                              //                     "disabledOn": "shareTypeAll.includes(3)"
                              //                   },
                              //                   {
                              //                     "label": "平台内共享",
                              //                     "value": 2,
                              //                     "disabledOn": "this.shareTypeAll.includes(4)"
                              //                   }
                              //                 ],
                              //                 "onEvent": {
                              //                   "change": {
                              //                     "actions": [
                              //                       {
                              //                         "actionType": "custom",
                              //                         "script": async function (context:any, doAction: any, e: any) {
                              //                           doAction({
                              //                             "actionType": "setValue",
                              //                             "componentId": "appCode",
                              //                             "args": {
                              //                               "value": []
                              //                             }
                              //                           })
                              //                         }
                              //                       }
                              //                     ]
                              //                   }
                              //                 }
                              //               },
                              //               {
                              //                 "label": "应用",
                              //                 "type": "select",
                              //                 "name": "appCode",
                              //                 "id": "appCode",
                              //                 "selectMode": "chained",
                              //                 "searchable": true,
                              //                 "filterOption": "return options.filter(({value, label, weapon}) => value?.includes(inputValue) || label?.includes(inputValue) || weapon?.includes(inputValue));",
                              //                 "sortable": true,
                              //                 "multiple": true,
                              //                 "required": true,
                              //                 "visibleOn": "${shareType==1}",
                              //                 "source": {
                              //                   "method": "get",
                              //                   "url": useDevBaseUrl("/app/api-share/getCurrentSysTenantAppData"),
                              //                   adaptor: function (payload: any) {
                              //                     sessionStorage.setItem('currentSysTenantAppData',JSON.stringify(payload.data))
                              //                     const listData = JSON.parse(sessionStorage.getItem('share_list')!) ? JSON.parse(sessionStorage.getItem('share_list')!) : []
                              //                     const delTenantShare:any = []
                              //                     for(var i=0;i<listData.length;i++){
                              //                       if(listData[i].shareType == 1){
                              //                         delTenantShare.push(listData[i].appId)
                              //                       }
                              //                     }
                              //                     const filteredData = payload.data.filter(item => !delTenantShare.includes(item.value));
                              //                     return {
                              //                       ...payload,
                              //                       status: payload.code,
                              //                       data: { ...payload.data, options: filteredData }
                              //                     };
                              //                   },
                              //                 },
                              //               },
                              //               {
                              //                 "label": "应用",
                              //                 "type": "select",
                              //                 "name": "appCode",
                              //                 "id": "appCode",
                              //                 "multiple": true,
                              //                 "searchable": true,
                              //                 "selectMode": "group",
                              //                 "required": true,
                              //                 "visibleOn": "${shareType==2}",
                              //                 "source": {
                              //                   "method": "get",
                              //                   "url": useDevBaseUrl("/app/api-share/getOtherSysTenantAppData"),
                              //                   adaptor: function (payload: any) {
                              //                     sessionStorage.setItem('otherSysTenantAppData',JSON.stringify(payload.data))
                              //                     const listData = JSON.parse(sessionStorage.getItem('share_list')!) ? JSON.parse(sessionStorage.getItem('share_list')!) : []
                              //                     const delPlatShare:any = []
                              //                     for(var i=0;i<listData.length;i++){
                              //                       if(listData[i].shareType == 2){
                              //                         delPlatShare.push(listData[i].appId)
                              //                       }
                              //                     }
                              //                     const filteredData = payload.data.map(item => ({
                              //                       ...item,
                              //                       children: item.children.filter(child => !delPlatShare.includes(child.value))
                              //                     }));
                              //                     const filteredDataVal = filteredData.filter(i=> i?.children?.length > 0)
                              //                     return {
                              //                       ...payload,
                              //                       status: payload.code,
                              //                       data: { ...payload.data, options: filteredDataVal }
                              //                     };
                              //                   },
                              //                 },
                              //               }
                              //             ]
                              //           },
                              //           "onEvent": {
                              //             "confirm": {
                              //               "actions": [
                              //                 {
                              //                   "actionType": "validate",
                              //                   "componentId": "shareForm",
                              //                   "outputVar": 'validateResult'
                              //                 },
                              //                 {
                              //                   "actionType": "custom",
                              //                   "script": async function (context:any, doAction: any, e: any) {
                              //                     const listData = JSON.parse(sessionStorage.getItem('share_list')!) ? JSON.parse(sessionStorage.getItem('share_list')!) : []
                              //                     const tenantList = JSON.parse(sessionStorage.getItem('share_tenant_list')!) ? JSON.parse(sessionStorage.getItem('share_tenant_list')!) : []
                              //                     const appList = JSON.parse(sessionStorage.getItem('share_app_list')!) ? JSON.parse(sessionStorage.getItem('share_app_list')!) : []
                              //                     if(e.data.shareType == 1 && e.data?.appCode?.length > 0) {
                              //                       const data = JSON.parse(sessionStorage.getItem('currentSysTenantAppData')!)
                              //                       const dataSelected = e.data.appCode.split(',')
                              //                       for(var m=0;m<dataSelected.length;m++){
                              //                         const exists = listData.some(item => item.appCode === dataSelected[m]);
                              //                         if(!exists){
                              //                           listData.push({
                              //                             appId: dataSelected[m],
                              //                             appName: data.filter(item => item.value === dataSelected[m]).map(item => item.label)[0],
                              //                             tenantName: '[本租户]',
                              //                             shareType: e.data.shareType,
                              //                           })
                              //                           tenantList.push({
                              //                             appId: dataSelected[m],
                              //                             appName: data.filter(item => item.value === dataSelected[m]).map(item => item.label)[0],
                              //                             tenantName: '[本租户]',
                              //                             shareType: e.data.shareType,
                              //                           })
                              //                         }
                              //                       }
                              //                     } else if(e.data.shareType== 2 && e.data?.appCode?.length > 0){
                              //                       const data2 = JSON.parse(sessionStorage.getItem('otherSysTenantAppData')!)
                              //                       const dataSelected = e.data.appCode.split(',')
                              //                       for(var m=0;m<dataSelected.length;m++){
                              //                         const exists = listData.some(item => item.appCode === dataSelected[m]);
                              //                         if(!exists){
                              //                           listData.push({
                              //                             appId: dataSelected[m],
                              //                             appName:  getLabelsByValue(data2, dataSelected[m])?.childLabel,
                              //                             tenantName: getLabelsByValue(data2, dataSelected[m])?.categoryLabel,
                              //                             shareType: e.data.shareType,
                              //                           })
                              //                           appList.push({
                              //                             appId: dataSelected[m],
                              //                             appName:  getLabelsByValue(data2, dataSelected[m])?.childLabel,
                              //                             tenantName: getLabelsByValue(data2, dataSelected[m])?.categoryLabel,
                              //                             shareType: e.data.shareType,
                              //                           })
                              //                         }
                              //                       }
                              //                     }
                              //                     sessionStorage.setItem('share_list', JSON.stringify(listData))
                              //                     sessionStorage.setItem('share_app_list',JSON.stringify(appList) )
                              //                     sessionStorage.setItem('share_tenant_list', JSON.stringify(tenantList))
                              //                     doAction({
                              //                       "actionType": "setValue",
                              //                       "componentId": "share_list",
                              //                       "args": {
                              //                         "value": {
                              //                           "items": listData,
                              //                         }
                              //                       }
                              //                     })
                              //                   }
                              //                 }
                              //               ]
                              //             }
                              //           },
                              //         }
                              //       },
                              //     ]
                              //   },
                              //   {
                              //     "type": "table",
                              //     "id": "share_list",
                              //     "columns": [
                              //       {
                              //         "label": "类型",
                              //         "name": "shareType",
                              //         "type": 'mapping',
                              //         "map": {
                              //           '1': "<span>租户内共享</span>",
                              //           '2': "<span>平台内共享</span>",
                              //           '3': "<span>外部 OPENAPI</span>",
                              //         },
                              //       },
                              //       {
                              //         "name": "tenantName",
                              //         "label": "租户名称"
                              //       },
                              //       {
                              //         "name": "appName",
                              //         "label": "应用名称"
                              //       },
                              //       // {
                              //       //   "name": "appCode",
                              //       //   "label": "应用编码"
                              //       // },
                              //       {
                              //         "type": "operation",
                              //         "label": "操作",
                              //         "buttons": [
                              //           {
                              //             "label": "删除",
                              //             "type": "button",
                              //             "level": "link",
                              //             "actionType": "dialog",
                              //             "dialog": {
                              //               "title": '删除',
                              //               "body": {
                              //                 "type": 'mapping',
                              //                 "value": '1',
                              //                 "map": {
                              //                   '1': '您确认要删除${appName}?'
                              //                 }
                              //               },
                              //               "onEvent": {
                              //                 "confirm": {
                              //                   "actions": [
                              //                     {
                              //                       "actionType": "custom",
                              //                       "script": async function (context:any, doAction: any, e: any) {
                              //                         const listData = JSON.parse(sessionStorage.getItem('share_list')!)
                              //                         const delIndex = e.data.__super.__super.index
                              //                         listData.splice(delIndex, 1)
                              //                         sessionStorage.setItem('share_list', JSON.stringify(listData))
                              //                         const shareType = e.data.__super.shareType
                              //                         if(shareType == 1) {
                              //                           let tenantList = JSON.parse(sessionStorage.getItem('share_tenant_list')!)
                              //                           tenantList = tenantList.filter(i=> i.appId != e.data.__super.appId)
                              //                           sessionStorage.setItem('share_tenant_list', JSON.stringify(tenantList))
                              //                         } else if (shareType == 2) {
                              //                           let appList = JSON.parse(sessionStorage.getItem('share_app_list')!)
                              //                           appList = appList.filter(i=> i.appId != e.data.__super.appId)
                              //                           sessionStorage.setItem('share_app_list', JSON.stringify(appList))
                              //                         }
                              //                         doAction({
                              //                           "actionType": "setValue",
                              //                           "componentId": "share_list",
                              //                           "args": {
                              //                             "value": {
                              //                                 "items": listData,
                              //                             }
                              //                           }
                              //                         })
                              //                       }
                              //                     }
                              //                   ]
                              //                 }
                              //               },
                              //             },
                              //           }
                              //         ]
                              //       },
                              //     ],
                              //   }]
                              // },
                              {
                                "title": "外部共享",
                                "tab": [{
                                  "type": "combo",
                                  "name": "externalShare",
                                  "label": "共享给",
                                  "required": "true",
                                  "items": [
                                    {
                                      "name": "text",
                                      "label": "新增",
                                      "type": "button",
                                      "level": "link",
                                      "actionType": "dialog",
                                      "dialog": {
                                        "title": "新增外部共享",
                                        "body": {
                                          "type": "form",
                                          "initApi": {
                                            "method": "get",
                                            "url": useDevBaseUrl("/app/api-share/generateAccessKey"),
                                            adaptor: function (payload: any) {
                                              return {
                                                  ...payload,
                                                  status: payload.code,
                                                  data: { ...payload.data}
                                              };
                                            }
                                          },
                                          "body": [
                                            {
                                              "type": "alert",
                                              "level": "warning",
                                              "className": "mb-1",
                                              "body": [{
                                                "type": "input-text",
                                                "name": "accessKeyId",
                                                "label": "AccessKey ID",
                                                "static": true,
                                                "labelWidth": 130,
                                              },
                                              {
                                                "type": "input-text",
                                                "name": "accessKeySecret",
                                                "label": "AccessKey Secret",
                                                "static": true,
                                                "labelWidth": 130,
                                              }],
                                            },
                                            // {
                                            //   "type": "button",
                                            //   "label": "下载 CSV 文件",
                                            //   "level": "link",
                                            //   "icon": "fa fa-arrow-down",
                                            // },
                                            {
                                              "name": "saveSecret",
                                              "value": false,
                                              "type": "checkbox",
                                              "className": "appPublish_confirm_label",
                                              "label": "",
                                              "option": "我已保存好 AccessKey Secret",
                                            }
                                          ]
                                        },
                                        "actions": [
                                          {
                                            "type": "button",
                                            "actionType": "close",
                                            "label": "取消",
                                          },
                                          {
                                            "label": "确认",
                                            "primary": true,
                                            "type": "button",
                                            "disabledOn": "!this.saveSecret",
                                            "actionType": "close",
                                            "onEvent": {
                                              "click": {
                                                "actions": [
                                                  {
                                                    "actionType": "custom",
                                                    "script": async function (context: any,doAction: any,event: any) {
                                                      const listData = JSON.parse(sessionStorage.getItem('external_share_list')!) ? JSON.parse(sessionStorage.getItem('external_share_list')!) : []
                                                      listData.push({
                                                        accessKeyId: event.data.accessKeyId,
                                                        accessKeySecret: event.data.accessKeySecret,
                                                        status: 0
                                                      })
                                                      sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                                      doAction({
                                                        "actionType": "setValue",
                                                        "componentId": "external_share_list",
                                                        "args": {
                                                          "value": {
                                                            "items": listData,
                                                          }
                                                        }
                                                      })
                                                    }
                                                  }
                                                ]
                                              }
                                            }
                                          }
                                        ]
                                      }
                                    },
                                  ]
                                },
                                {
                                  "type": "table",
                                  "id": "external_share_list",
                                  "columns": [
                                    {
                                      "label": "AccessKey ID",
                                      "name": "accessKeyId",
                                    },
                                    {
                                      "name": "accessKeySecret",
                                      "label": "AccessKey Secret"
                                    },
                                    {
                                      "type": "operation",
                                      "label": "操作",
                                      "buttons": [
                                        {
                                          "label": "删除",
                                          "type": "button",
                                          "level": "link",
                                          "actionType": "dialog",
                                          "dialog": {
                                            "title": '删除',
                                            "body": {
                                              "type": 'mapping',
                                              "value": '1',
                                              "map": {
                                                '1': '您确认要删除${id}?'
                                              }
                                            },
                                            "onEvent": {
                                              "confirm": {
                                                "actions": [
                                                  {
                                                    "actionType": "custom",
                                                    "script": async function (context:any, doAction: any, e: any) {
                                                      const listData = JSON.parse(sessionStorage.getItem('external_share_list')!)
                                                      const delIndex = e.data.__super.__super.index
                                                      listData.splice(delIndex, 1)
                                                      sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                                      doAction({
                                                        "actionType": "setValue",
                                                        "componentId": "external_share_list",
                                                        "args": {
                                                          "value": {
                                                              "items": listData,
                                                          }
                                                        }
                                                      })
                                                    }
                                                  }
                                                ]
                                              }
                                            },
                                          },
                                        }
                                      ]
                                    },
                                  ],
                                }]
                              }
                            ],
                            "onEvent": {
                              "change": {
                                "actions": [
                                  {
                                    "actionType": "custom",
                                    "script": async function(_, doAction, event){
                                      if(event.data.value == 2){
                                        const listData = JSON.parse(sessionStorage.getItem('external_share_list')!) ? JSON.parse(sessionStorage.getItem('external_share_list')!) : []
                                        sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                        doAction({
                                          "actionType": "setValue",
                                          "componentId": "external_share_list",
                                          "args": {
                                            "value": {
                                              "items": listData,
                                            }
                                          }
                                        })
                                      }
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ],
                      },
                      "actions": [
                        {
                          "type": "button",
                          "actionType": "close",
                          "label": "取消",
                        },
                        {
                          "label": "确认",
                          "primary": true,
                          "type": "button",
                          "onEvent": {
                            "click": {
                              "actions": [
                                {
                                  "actionType": "validate",
                                  "componentId": "mobile_register",
                                  "outputVar": 'validateResult'
                                },
                                {
                                  "actionType": "custom",
                                  "script": async function (context: any,doAction: any,event: any) {
                                    if(event.data.validateResult.error) return;
                                    let shareName = event.data.__super.shareName;
                                    let remark = event.data.__super.remark;
                                    let shareTypeAll = event.data.__super.share?.shareTypeAll
                                    let apiList = JSON.parse(sessionStorage.getItem('api_collection_list')!)
                                    let shareList = JSON.parse(sessionStorage.getItem('share_list')!)
                                    let externalShareList = JSON.parse(sessionStorage.getItem('external_share_list')!)
                                    if((apiList == null || (apiList && apiList.length == 0))){
                                      return toast.error('请配置API集合', {
                                        position: "top-center"
                                      })
                                    } else if(((shareTypeAll == undefined || shareTypeAll?.length == 0) && (shareList == null || shareList?.length == 0)) && (externalShareList == null || externalShareList?.length == 0)){
                                      return toast.error('请配置外部共享', {
                                        position: "top-center"
                                      })
                                    } else {
                                      const params = {
                                        shareName: shareName,
                                        remark: remark,
                                        "shareApiData": apiList,
                                        "relationAppData": shareList,
                                        "shareType": shareTypeAll ? shareTypeAll : null,
                                        "openApiConfig": externalShareList
                                      }
                                      const res = await saveApiShare(params)
                                      if(res.data.code == 0){
                                        doAction({
                                          actionType: "closeDialog",
                                          componentId: "share_dialog",
                                        })
                                        doAction({
                                          actionType: 'reload',
                                          componentId: 'share_crud'
                                        });
                                      } else {
                                        toast.error(res.data.msg, {
                                          position: "top-center"
                                        })
                                      }
                                    }
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                ],
                "footerToolbar": [
                  "statistics",
                  "switch-per-page",
                  "pagination"
                ],
                "alwaysShowPagination": true,
                "columns": [
                  {
                    "name": "shareName",
                    "label": "名称"
                  },
                  {
                    "name": "shareApiData",
                    "type": "list",
                    "label": "API集合",
                    "placeholder": "-",
                    "listItem": {
                      "title": "${groupName=='DEFAULT' ? '默认分组' :  groupName}${name ? '/' : '-'}${name}"
                    }
                  },
                  // {
                  //   "name": "relationAppData",
                  //   "label": "共享给应用",
                  //   "type": "list",
                  //   "placeholder": "-",
                  //   "listItem": {
                  //     "title": "${shareType==3 ? '租户内全部应用' : shareType==4 ? '平台内全部应用' : shareType==1 ? '[本租户]' : ${tenantName}}${${tenantName} ? '/' : ''}${appName}"
                  //   }
                  // },
                  {
                    "name": "creator",
                    "label": "创建人"
                  },
                  {
                    "name": "updater",
                    "label": "最近修改人"
                  },
                  {
                    "name": "updateTime",
                    "label": "修改时间"
                  },
                  {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                      {
                        "label": "编辑",
                        "type": "button",
                        "level": "link",
                        "actionType": "dialog",
                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'apiManage:api-share:saveOrUpdate')}",
                        "dialog": {
                          "title": "编辑共享",
                          "id": "share_dialog",
                          "size": "md",
                          "body": {
                            "type": "form",
                            "id": "mobile_register",
                            "onEvent": {
                              "inited": {
                                "actions": [
                                  {
                                    "actionType": "custom",
                                    "script": async function (context:any, doAction: any, e: any) {
                                      const listVal = context.props.data.__super
                                      const apiCollectionList = listVal.shareApiData
                                      const shareTypeAll = listVal.shareType
                                      let apiCollectionListVal = []
                                      doAction({
                                        "actionType": "setValue",
                                        "componentId": "shareAll",
                                        "args": {
                                          "value": shareTypeAll
                                        }
                                      })
                                      for(var i=0;i<apiCollectionList.length;i++){
                                        let operationsShow = []
                                        if(apiCollectionList[i].operateType?.includes('1')){
                                          operationsShow.push('增')
                                        }
                                        if(apiCollectionList[i].operateType?.includes('3')){
                                          operationsShow.push('改')
                                        }
                                        if(apiCollectionList[i].operateType?.includes('4')){
                                          operationsShow.push('查')
                                        }
                                        if(apiCollectionList[i].operateType?.includes('2')){
                                          operationsShow.push('删')
                                        }
                                        apiCollectionListVal.push({
                                          modelEventTarget: (apiCollectionList[i].groupName=='DEFAULT' ? '默认分组' : (apiCollectionList[i].groupName ? apiCollectionList[i].groupName : '')) + (apiCollectionList[i].name ? '/' : '-') + (apiCollectionList[i].name ? apiCollectionList[i].name : ''),
                                          relationSource: apiCollectionList[i].name ? apiCollectionList[i].relationSource : '',
                                          operateType: apiCollectionList[i]?.operateType,
                                          operationsShow: operationsShow.join('/'),
                                          relationType: apiCollectionList[i].relationType,
                                        })
                                      }
                                      doAction({
                                        "actionType": "setValue",
                                        "componentId": "api_list",
                                        "args": {
                                          "value": {
                                            "items": apiCollectionListVal,
                                          }
                                        }
                                      })
                                      sessionStorage.setItem('api_collection_list', JSON.stringify(apiCollectionListVal))
                                      // const shareToList = listVal.relationAppData.filter(i=> i.shareType == 1 || i.shareType == 2)
                                      // const shareToListVal = []
                                      // for(var i=0;i<shareToList?.length;i++){
                                      //   shareToListVal.push({
                                      //     appId: shareToList[i].appId,
                                      //     appName: shareToList[i].appName,
                                      //     tenantName: shareToList[i].shareType == 2 ? shareToList[i].tenantName : '[本租户]',
                                      //     shareType: shareToList[i].shareType,
                                      //   })
                                      // }
                                      // doAction({
                                      //   "actionType": "setValue",
                                      //   "componentId": "share_list",
                                      //   "args": {
                                      //     "value": {
                                      //       "items": shareToListVal,
                                      //     }
                                      //   }
                                      // })
                                      // sessionStorage.setItem('share_list', JSON.stringify(shareToListVal))
                                      // const appList = shareToListVal.filter(i=>i.shareType== 2)
                                      // const tenantList = shareToListVal.filter(i=>i.shareType== 1)
                                      // sessionStorage.setItem('share_app_list',JSON.stringify(appList) )
                                      // sessionStorage.setItem('share_tenant_list', JSON.stringify(tenantList))
                                      // console.log(1438, context.props.data.__super)
                                      const externalShareToList = listVal.openApiConfig
                                      doAction({
                                        "actionType": "setValue",
                                        "componentId": "external_share_list",
                                        "args": {
                                          "value": {
                                            "items": externalShareToList,
                                          }
                                        }
                                      })
                                      sessionStorage.setItem('external_share_list', JSON.stringify(externalShareToList))
                                    }
                                  }
                                ]
                              }
                            },
                            "body": [
                              {
                                "type": "input-text",
                                "name": "shareName",
                                "label": "名称",
                                "required": "true",
                                "placeholder": "请填写共享名称",
                                "showCounter": true,
                                "maxLength": 50,
                              },
                              {
                                "type": "textarea",
                                "name": "remark",
                                "label": "备注",
                                "placeholder": "请输入备注信息",
                                "showCounter": true,
                                "maxLength": 255,
                              },
                              {
                                "type": "combo",
                                "name": "apiCollection",
                                "label": "API集合",
                                "required": "true",
                                "items": [
                                  {
                                    "name": "text",
                                    "label": "新增",
                                    "type": "button",
                                    "level": "link",
                                    "actionType": "dialog",
                                    "dialog": {
                                      "title": "新增API集合",
                                      "body": {
                                        "type": "form",
                                        "body": [
                                          {
                                            "type": "radios",
                                            "name": "relationType",
                                            "label": "接口类型",
                                            "required": "true",
                                            "value":  1,
                                            "options": [
                                              {
                                                "label": "实体",
                                                "value": 1
                                              },
                                              {
                                                "label": "API中心",
                                                "value": 2
                                              }
                                            ]
                                          },
                                          {
                                            "type": "nested-select",
                                            "id": "selectedEntity",
                                            "name": "relationSource",
                                            "label": "实体",
                                            "required": "true",
                                            "onlyLeaf": true,
                                            "visibleOn": "${relationType == 1}",
                                            "valueField": "id",
                                            "source": {
                                              "method": "get",
                                              "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                                              adaptor: function (payload: any) {
                                                let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                                                sessionStorage.setItem('entityListData',JSON.stringify(data))
                                                const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                                const delEntityCode:any = []
                                                for(var i=0;i<listData.length;i++){
                                                  if(listData[i].relationType == 1){ //实体类型的时候
                                                    delEntityCode.push(listData[i].relationSource)
                                                  }
                                                }
                                                const filteredData = data.map(item => ({
                                                  ...item,
                                                  children: item.children.filter(child => !delEntityCode.includes(child.id))
                                                }));
                                                const filteredDataVal = filteredData.filter(item => item.children && item.children.length > 0)
                                                return {
                                                  ...payload,
                                                  status: payload.code,
                                                  data: { ...payload.data, options: filteredDataVal }
                                                };
                                              },
                                            }
                                          },
                                          {
                                            "name": "operateType",
                                            "type": "checkboxes",
                                            "label": "操作类型",
                                            "required": true,
                                            "value": "4",
                                            "visibleOn": "${relationType == 1}",
                                            "options": [
                                              {
                                                "label": "查",
                                                "value": 4,
                                                "disabled": true
                                              },
                                              {
                                                "label": "增",
                                                "value": 1,
                                                "hidden": true
                                              },
                                              {
                                                "label": "改",
                                                "value": 3,
                                                "hidden": true
                                              },
                                              {
                                                "label": "删",
                                                "value": 2,
                                                "hidden": true
                                              }
                                            ]
                                          },
                                          {
                                            "type": "nested-select",
                                            "name": "api",
                                            "label": "API中心",
                                            "required": true,
                                            "clearable": true,
                                            "onlyLeaf": true,
                                            "labelWidth": 100,
                                            "visibleOn": "${relationType == 2}",
                                            "source": {
                                              "method": "get",
                                              "url": useDevBaseUrl("/apiManage/api/getAllApiSetting"),
                                              adaptor: function (payload: any) {
                                                let dataOptions = payload.data.filter(item=>item.children && item.children.length>0);
                                                sessionStorage.setItem('apiListData',JSON.stringify(dataOptions))
                                                const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                                const delApiCode:any = []
                                                for(var i=0;i<listData.length;i++){
                                                  if(listData[i].relationType == 2){ //API中心的时候
                                                    delApiCode.push(listData[i].relationSource)
                                                  }
                                                }
                                                const filteredData = dataOptions.map(item => ({
                                                  ...item,
                                                  children: item.children.filter(child => !delApiCode.includes(child.value))
                                                }));
                                                const filteredDataVal = filteredData.filter(item => item.children && item.children.length > 0)
                                                return {
                                                  ...payload,
                                                  status: payload.code,
                                                  data: { ...payload.data, options: filteredDataVal }
                                                };
                                              },
                                            },
                                          },
                                        ]
                                      },
                                      "onEvent": {
                                        "confirm": {
                                          "actions": [
                                            {
                                              "actionType": "custom",
                                              "script": async function (context:any, doAction: any, e: any) {
                                                const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                                if(e.data.relationType == 1 && e.data.relationSource && e.data.operateType) {
                                                  const a = e.data.operateType.split(',')
                                                  let operationsShow = []
                                                  if(a.includes('1')){
                                                    operationsShow.push('增')
                                                  }
                                                  if(a.includes('3')){
                                                    operationsShow.push('改')
                                                  }
                                                  if(a.includes('4')){
                                                    operationsShow.push('查')
                                                  }
                                                  if(a.includes('2')){
                                                    operationsShow.push('删')
                                                  }
                                                  const entityListData = JSON.parse(sessionStorage.getItem('entityListData')!)
                                                  const entityName = findPathById(entityListData, e.data.relationSource)
                                                  listData.push({
                                                    modelEventTarget: entityName,
                                                    relationSource: e.data.relationSource,
                                                    operateType: e.data.operateType,
                                                    operationsShow: operationsShow.join('/'),
                                                    relationType: e.data.relationType,
                                                  })
                                                } else if(e.data.relationType==2 && e.data.api){
                                                  const apiListData = JSON.parse(sessionStorage.getItem('apiListData')!)
                                                  const apiName = findPathByValue(apiListData, e.data.api)
                                                  listData.push({
                                                    modelEventTarget: apiName,
                                                    relationSource: e.data.api,
                                                    operateType: null,
                                                    operationsShow: null,
                                                    relationType: e.data.relationType,
                                                  })
                                                }
                                                sessionStorage.setItem('api_collection_list', JSON.stringify(listData))
                                                doAction({
                                                  "actionType": "setValue",
                                                  "componentId": "api_list",
                                                  "args": {
                                                    "value": {
                                                      "items": listData,
                                                    }
                                                  }
                                                })
                                              }
                                            }
                                          ]
                                        }
                                      },
                                    }
                                  },
                                ]
                              },
                              {
                                "type": "table",
                                "id": "api_list",
                                "columns": [
                                  {
                                    "label": "接口类型",
                                    "name": "relationType",
                                    "type": 'mapping',
                                    "map": {
                                      '1': "<span>实体</span>",
                                      '2': "<span>API中心</span>",
                                    },
                                  },
                                  {
                                    "name": "modelEventTarget",
                                    "label": "名称"
                                  },
                                  // {
                                  //   "name": "relationSource",
                                  //   "label": "编码"
                                  // },
                                  {
                                    "name": "operationsShow",
                                    "label": "操作类型"
                                  },
                                  {
                                    "type": "operation",
                                    "label": "操作",
                                    "buttons": [
                                      {
                                        "label": "删除",
                                        "type": "button",
                                        "level": "link",
                                        "actionType": "dialog",
                                        "dialog": {
                                          "title": '删除',
                                          "body": {
                                            "type": 'mapping',
                                            "value": '1',
                                            "map": {
                                              '1': '您确认要删除${modelEventTarget}?'
                                            }
                                          },
                                          "onEvent": {
                                            "confirm": {
                                              "actions": [
                                                {
                                                  "actionType": "custom",
                                                  "script": async function (context:any, doAction: any, e: any) {
                                                    const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!)
                                                    const delIndex = e.data.__super.__super.index
                                                    listData.splice(delIndex, 1)
                                                    sessionStorage.setItem('api_collection_list', JSON.stringify(listData))
                                                    doAction({
                                                      "actionType": "setValue",
                                                      "componentId": "api_list",
                                                      "args": {
                                                        "value": {
                                                            "items": listData,
                                                        }
                                                      }
                                                    })
                                                  }
                                                }
                                              ]
                                            }
                                          },
                                        },
                                      },
                                      {
                                        "label": "编辑",
                                        "type": "button",
                                        "level": "link",
                                        "disabledOn": "${relationType==2}",
                                        "actionType": "dialog",
                                        "dialog": {
                                          "title": "编辑API集合",
                                          "body": {
                                            "type": "form",
                                            "body": [
                                              {
                                                "type": "radios",
                                                "name": "relationType",
                                                "label": "接口类型",
                                                "required": "true",
                                                "disabled": true,
                                                "value":  1,
                                                "options": [
                                                  {
                                                    "label": "实体",
                                                    "value": 1
                                                  },
                                                  {
                                                    "label": "API中心",
                                                    "value": 2
                                                  }
                                                ]
                                              },
                                              {
                                                "type": "nested-select",
                                                "id": "selectedEntity",
                                                "name": "relationSource",
                                                "label": "实体",
                                                "required": "true",
                                                "onlyLeaf": true,
                                                "visibleOn": "${relationType == 1}",
                                                "valueField": "id",
                                                "source": {
                                                  "method": "get",
                                                  "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                                                  adaptor: function (payload: any, response: any, api: any, context: any) {
                                                    let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                                                    sessionStorage.setItem('entityListData',JSON.stringify(data))
                                                    let listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                                    listData = listData.filter(i=> i.relationSource != context.__super.relationSource)
                                                    const delEntityCode:any = []
                                                    for(var i=0;i<listData.length;i++){
                                                      if(listData[i].relationType == 1){ //实体类型的时候
                                                        delEntityCode.push(listData[i].relationSource)
                                                      }
                                                    }
                                                    const filteredData = data.map(item => ({
                                                      ...item,
                                                      children: item.children.filter(child => !delEntityCode.includes(child.id))
                                                    }));
                                                    const filteredDataVal = filteredData.filter(item => item.children && item.children.length > 0)
                                                    return {
                                                      ...payload,
                                                      status: payload.code,
                                                      data: { ...payload.data, options: filteredDataVal }
                                                    };
                                                  }
                                                }
                                              },
                                              {
                                                "name": "operateType",
                                                "type": "checkboxes",
                                                "label": "操作类型",
                                                "required": true,
                                                "visibleOn": "${relationType == 1}",
                                                "options": [
                                                  {
                                                    "label": "查",
                                                    "value": 4,
                                                    "disabled": true
                                                  },
                                                  {
                                                    "label": "增",
                                                    "value": 1,
                                                    "hidden": true
                                                  },
                                                  {
                                                    "label": "改",
                                                    "value": 3,
                                                    "hidden": true
                                                  },
                                                  {
                                                    "label": "删",
                                                    "value": 2,
                                                    "hidden": true
                                                  }
                                                ]
                                              },
                                              {
                                                "type": "nested-select",
                                                "name": "api",
                                                "label": "API中心",
                                                "required": true,
                                                "clearable": true,
                                                "onlyLeaf": true,
                                                "labelWidth": 100,
                                                "visibleOn": "${relationType == 2}",
                                                "source": {
                                                  "method": "get",
                                                  "url": useDevBaseUrl("/apiManage/api/getAllApiSetting"),
                                                  adaptor: function (payload: any) {
                                                    let dataOptions = payload.data.filter(item=>item.children && item.children.length>0);
                                                    return {
                                                      ...payload,
                                                      status: payload.code,
                                                      data: { ...payload.data, options: dataOptions }
                                                    };
                                                  },
                                                },
                                              },
                                            ]
                                          },
                                          "onEvent": {
                                            "confirm": {
                                              "actions": [
                                                {
                                                  "actionType": "custom",
                                                  "script": async function (context:any, doAction: any, e: any) {
                                                    const entityListData = JSON.parse(sessionStorage.getItem('entityListData')!)
                                                    const entityName = findPathById(entityListData, e.data.relationSource)
                                                    const listData = JSON.parse(sessionStorage.getItem('api_collection_list')!) ? JSON.parse(sessionStorage.getItem('api_collection_list')!) : []
                                                    const editIndex = e.data.__super.__super.index
                                                    if(listData[editIndex].relationSource != e.data.relationSource){
                                                      listData[editIndex].operateType = e.data.operateType
                                                      const a = e.data.operateType.split(',')
                                                      let operationsShow = []
                                                      if(a.includes('1')){
                                                        operationsShow.push('增')
                                                      }
                                                      if(a.includes('3')){
                                                        operationsShow.push('改')
                                                      }
                                                      if(a.includes('4')){
                                                        operationsShow.push('查')
                                                      }
                                                      if(a.includes('2')){
                                                        operationsShow.push('删')
                                                      }
                                                      listData[editIndex].operationsShow = operationsShow.join('/')
                                                      listData[editIndex].relationSource = e.data.relationSource
                                                      listData[editIndex].modelEventTarget = entityName
                                                    }
                                                    sessionStorage.setItem('api_collection_list', JSON.stringify(listData))
                                                    doAction({
                                                      "actionType": "setValue",
                                                      "componentId": "api_list",
                                                      "args": {
                                                        "value": {
                                                          "items": listData,
                                                        }
                                                      }
                                                    })
                                                  }
                                                }
                                              ]
                                            }
                                          },
                                        },
                                      }
                                    ]
                                  },
                                ],
                              },
                              {
                                "type": "tabs",
                                "swipeable": true,
                                "tabs": [
                                  // {
                                  //   "title": "内部共享",
                                  //   "visible": !getTemplate(),
                                  //   "tab": [{
                                  //     "type": "combo",
                                  //     "name": "share",
                                  //     "label": "共享给",
                                  //     "required": "true",
                                  //     "items": [
                                  //       {
                                  //         "type": "list-select",
                                  //         "label": "",
                                  //         "name": "shareType",
                                  //         "id": "shareAll",
                                  //         "multiple": true,
                                  //         "joinValues": false,
                                  //         "extractValue": true,
                                  //         "options": [
                                  //           {
                                  //             "label": "租户内全部应用",
                                  //             "value": 3,
                                  //             "disabledOn": "shareType.includes(4)"
                                  //           },
                                  //           {
                                  //             "label": "平台内全部应用",
                                  //             "value": 4
                                  //           }
                                  //         ],
                                  //         "onEvent": {
                                  //           "change": {
                                  //             "actions": [
                                  //               {
                                  //                 "actionType": "custom",
                                  //                 "script": function (context: any, doAction: any, event: any) {
                                  //                   const selectedValues = event.data.value || [];
                                  //                   const isOption2Selected = selectedValues.includes(4);
                                  //                   if (isOption2Selected && !selectedValues.includes(3)) {
                                  //                     selectedValues.push(3);
                                  //                     doAction({
                                  //                       actionType: 'setValue',
                                  //                       componentId: 'shareAll',
                                  //                       args: {
                                  //                         value: selectedValues
                                  //                       }
                                  //                     });
                                  //                   }

                                  //                   if (selectedValues.length == 1) { // 选的是租户内全部应用
                                  //                     const filterAppList = JSON.parse(sessionStorage.getItem('share_app_list')!)
                                  //                     sessionStorage.setItem('share_list', JSON.stringify(filterAppList))
                                  //                     doAction({
                                  //                       "actionType": "setValue",
                                  //                       "componentId": "share_list",
                                  //                       "args": {
                                  //                         "value": {
                                  //                           "items": filterAppList,
                                  //                         }
                                  //                       }
                                  //                     })
                                  //                   } else if(selectedValues.length == 2){ //选的是平台内全部应用
                                  //                     sessionStorage.setItem('share_list', JSON.stringify([]))
                                  //                     doAction({
                                  //                       "actionType": "setValue",
                                  //                       "componentId": "share_list",
                                  //                       "args": {
                                  //                         "value": {
                                  //                           "items": [],
                                  //                         }
                                  //                       }
                                  //                     })
                                  //                   } else if(selectedValues.length == 0) { //去勾选后什么都没选
                                  //                     const tenantList = JSON.parse(sessionStorage.getItem('share_tenant_list')!)
                                  //                     const appList = JSON.parse(sessionStorage.getItem('share_app_list')!)
                                  //                     const data = tenantList.concat(appList)
                                  //                     sessionStorage.setItem('share_list', JSON.stringify(data))
                                  //                     doAction({
                                  //                       "actionType": "setValue",
                                  //                       "componentId": "share_list",
                                  //                       "args": {
                                  //                         "value": {
                                  //                           "items": data,
                                  //                         }
                                  //                       }
                                  //                     })
                                  //                   }
                                  //                 }
                                  //               },
                                  //             ]
                                  //           }
                                  //         }
                                  //       },
                                  //       {
                                  //         "name": "text",
                                  //         "label": "新增",
                                  //         "type": "button",
                                  //         "level": "link",
                                  //         "actionType": "dialog",
                                  //         "disabledOn": "shareType.includes(4)",
                                  //         "dialog": {
                                  //           "title": "新增共享",
                                  //           "body": {
                                  //             "type": "form",
                                  //             "id": "shareForm",
                                  //             "body": [
                                  //               {
                                  //                 "type": "radios",
                                  //                 "name": "editShareType",
                                  //                 "label": "类型",
                                  //                 "required": "true",
                                  //                 "value":  "${shareType == 3 ? 2 : 1}",
                                  //                 "options": [
                                  //                   {
                                  //                     "label": "租户内共享",
                                  //                     "value": 1,
                                  //                     "disabledOn": "shareType.includes(3)",
                                  //                   },
                                  //                   {
                                  //                     "label": "平台内共享",
                                  //                     "value": 2,
                                  //                     "disabledOn": "shareType.includes(4)",
                                  //                   }
                                  //                 ],
                                  //                 "onEvent": {
                                  //                   "change": {
                                  //                     "actions": [
                                  //                       {
                                  //                         "actionType": "custom",
                                  //                         "script": async function (context:any, doAction: any, e: any) {
                                  //                           doAction({
                                  //                             "actionType": "setValue",
                                  //                             "componentId": "appCode",
                                  //                             "args": {
                                  //                               "value": []
                                  //                             }
                                  //                           })
                                  //                         }
                                  //                       }
                                  //                     ]
                                  //                   }
                                  //                 }
                                  //               },
                                  //               {
                                  //                 "label": "应用",
                                  //                 "type": "select",
                                  //                 "name": "appCode",
                                  //                 "id": "appCode",
                                  //                 "selectMode": "chained",
                                  //                 "searchable": true,
                                  //                 "filterOption": "return options.filter(({value, label, weapon}) => value?.includes(inputValue) || label?.includes(inputValue) || weapon?.includes(inputValue));",
                                  //                 "sortable": true,
                                  //                 "multiple": true,
                                  //                 "required": true,
                                  //                 "visibleOn": "${editShareType==1}",
                                  //                 "source": {
                                  //                   "method": "get",
                                  //                   "url": useDevBaseUrl("/app/api-share/getCurrentSysTenantAppData"),
                                  //                   adaptor: function (payload: any) {
                                  //                     sessionStorage.setItem('currentSysTenantAppData',JSON.stringify(payload.data))
                                  //                     const listData = JSON.parse(sessionStorage.getItem('share_list')!) ? JSON.parse(sessionStorage.getItem('share_list')!) : []
                                  //                     const delTenantShare:any = []
                                  //                     for(var i=0;i<listData.length;i++){
                                  //                       if(listData[i].shareType == 1){
                                  //                         delTenantShare.push(listData[i].appId)
                                  //                       }
                                  //                     }
                                  //                     const filteredData = payload.data.filter(item => !delTenantShare.includes(item.value));
                                  //                     return {
                                  //                       ...payload,
                                  //                       status: payload.code,
                                  //                       data: { ...payload.data, options: filteredData }
                                  //                     };
                                  //                   },
                                  //                 },
                                  //               },
                                  //               {
                                  //                 "label": "应用",
                                  //                 "type": "select",
                                  //                 "name": "appCode",
                                  //                 "id": "appCode",
                                  //                 "multiple": true,
                                  //                 "searchable": true,
                                  //                 "selectMode": "group",
                                  //                 "required": true,
                                  //                 "visibleOn": "${editShareType==2}",
                                  //                 "source": {
                                  //                   "method": "get",
                                  //                   "url": useDevBaseUrl("/app/api-share/getOtherSysTenantAppData"),
                                  //                   adaptor: function (payload: any) {
                                  //                     sessionStorage.setItem('otherSysTenantAppData',JSON.stringify(payload.data))
                                  //                     const listData = JSON.parse(sessionStorage.getItem('share_list')!) ? JSON.parse(sessionStorage.getItem('share_list')!) : []
                                  //                     const delPlatShare:any = []
                                  //                     for(var i=0;i<listData.length;i++){
                                  //                       if(listData[i].shareType == 2){
                                  //                         delPlatShare.push(listData[i].appId)
                                  //                       }
                                  //                     }
                                  //                     const filteredData = payload.data.map(item => ({
                                  //                       ...item,
                                  //                       children: item.children.filter(child => !delPlatShare.includes(child.value))
                                  //                     }));
                                  //                     const filteredDataVal = filteredData.filter(i=> i?.children?.length > 0)
                                  //                     return {
                                  //                       ...payload,
                                  //                       status: payload.code,
                                  //                       data: { ...payload.data, options: filteredDataVal }
                                  //                     };
                                  //                   },
                                  //                 },
                                  //               }
                                  //             ]
                                  //           },
                                  //           "onEvent": {
                                  //             "confirm": {
                                  //               "actions": [
                                  //                 {
                                  //                   "actionType": "validate",
                                  //                   "componentId": "shareForm",
                                  //                   "outputVar": 'validateResult'
                                  //                 },
                                  //                 {
                                  //                   "actionType": "custom",
                                  //                   "script": async function (context:any, doAction: any, e: any) {
                                  //                     const listData = JSON.parse(sessionStorage.getItem('share_list')!) ? JSON.parse(sessionStorage.getItem('share_list')!) : []
                                  //                     const appList = JSON.parse(sessionStorage.getItem('share_app_list')!) ? JSON.parse(sessionStorage.getItem('share_app_list')!) : []
                                  //                     const tenantList = JSON.parse(sessionStorage.getItem('share_tenant_list')!) ? JSON.parse(sessionStorage.getItem('share_tenant_list')!) : []
                                  //                     if(e.data.editShareType == 1 && e.data?.appCode?.length > 0) {
                                  //                       const data = JSON.parse(sessionStorage.getItem('currentSysTenantAppData')!)
                                  //                       const dataSelected = e.data.appCode.split(',')
                                  //                       for(var m=0;m<dataSelected.length;m++){
                                  //                         const exists = listData.some(item => item.appCode === dataSelected[m]);
                                  //                         if(!exists){
                                  //                           listData.push({
                                  //                             appId: dataSelected[m],
                                  //                             appName: data.filter(item => item.value === dataSelected[m]).map(item => item.label)[0],
                                  //                             tenantName: '[本租户]',
                                  //                             shareType: e.data.editShareType,
                                  //                           })
                                  //                           tenantList.push({
                                  //                             appId: dataSelected[m],
                                  //                             appName: data.filter(item => item.value === dataSelected[m]).map(item => item.label)[0],
                                  //                             tenantName: '[本租户]',
                                  //                             shareType: e.data.editShareType,
                                  //                           })
                                  //                         }
                                  //                       }
                                  //                     } else if(e.data.editShareType== 2 && e.data?.appCode?.length > 0){
                                  //                       const data2 = JSON.parse(sessionStorage.getItem('otherSysTenantAppData')!)
                                  //                       const dataSelected = e.data.appCode.split(',')
                                  //                       for(var m=0;m<dataSelected.length;m++){
                                  //                         const exists = listData.some(item => item.appCode === dataSelected[m]);
                                  //                         if(!exists){
                                  //                           listData.push({
                                  //                             appId: dataSelected[m],
                                  //                             appName:  getLabelsByValue(data2, dataSelected[m])?.childLabel,
                                  //                             tenantName: getLabelsByValue(data2, dataSelected[m])?.categoryLabel,
                                  //                             shareType: e.data.editShareType,
                                  //                           })
                                  //                           appList.push({
                                  //                             appId: dataSelected[m],
                                  //                             appName:  getLabelsByValue(data2, dataSelected[m])?.childLabel,
                                  //                             tenantName: getLabelsByValue(data2, dataSelected[m])?.categoryLabel,
                                  //                             shareType: e.data.editShareType,
                                  //                           })
                                  //                         }
                                  //                       }
                                  //                     }
                                  //                     sessionStorage.setItem('share_list', JSON.stringify(listData))
                                  //                     sessionStorage.setItem('share_app_list',JSON.stringify(appList) )
                                  //                     sessionStorage.setItem('share_tenant_list', JSON.stringify(tenantList))
                                  //                     doAction({
                                  //                       "actionType": "setValue",
                                  //                       "componentId": "share_list",
                                  //                       "args": {
                                  //                         "value": {
                                  //                           "items": listData,
                                  //                         }
                                  //                       }
                                  //                     })
                                  //                   }
                                  //                 }
                                  //               ]
                                  //             }
                                  //           },
                                  //         }
                                  //       },
                                  //     ]
                                  //   },
                                  //   {
                                  //     "type": "table",
                                  //     "id": "share_list",
                                  //     "columns": [
                                  //       {
                                  //         "label": "类型",
                                  //         "name": "shareType",
                                  //         "type": 'mapping',
                                  //         "map": {
                                  //           '1': "<span>租户内共享</span>",
                                  //           '2': "<span>平台内共享</span>",
                                  //           '3': "<span>外部 OPENAPI</span>",
                                  //         },
                                  //       },
                                  //       {
                                  //         "name": "tenantName",
                                  //         "label": "租户名称"
                                  //       },
                                  //       {
                                  //         "name": "appName",
                                  //         "label": "应用名称"
                                  //       },
                                  //       // {
                                  //       //   "name": "appCode",
                                  //       //   "label": "应用编码"
                                  //       // },
                                  //       {
                                  //         "type": "operation",
                                  //         "label": "操作",
                                  //         "buttons": [
                                  //           {
                                  //             "label": "删除",
                                  //             "type": "button",
                                  //             "level": "link",
                                  //             "actionType": "dialog",
                                  //             "dialog": {
                                  //               "title": '删除',
                                  //               "body": {
                                  //                 "type": 'mapping',
                                  //                 "value": '1',
                                  //                 "map": {
                                  //                   '1': '您确认要删除${appName}?'
                                  //                 }
                                  //               },
                                  //               "onEvent": {
                                  //                 "confirm": {
                                  //                   "actions": [
                                  //                     {
                                  //                       "actionType": "custom",
                                  //                       "script": async function (context:any, doAction: any, e: any) {
                                  //                         const listData = JSON.parse(sessionStorage.getItem('share_list')!)
                                  //                         const delIndex = e.data.__super.__super.index
                                  //                         listData.splice(delIndex, 1)
                                  //                         sessionStorage.setItem('share_list', JSON.stringify(listData))
                                  //                         const shareType = e.data.__super.shareType
                                  //                         if(shareType == 1) {
                                  //                           let tenantList = JSON.parse(sessionStorage.getItem('share_tenant_list')!)
                                  //                           tenantList = tenantList.filter(i=> i.appId != e.data.__super.appId)
                                  //                           sessionStorage.setItem('share_tenant_list', JSON.stringify(tenantList))
                                  //                         } else if (shareType == 2) {
                                  //                           let appList = JSON.parse(sessionStorage.getItem('share_app_list')!)
                                  //                           appList = appList.filter(i=> i.appId != e.data.__super.appId)
                                  //                           sessionStorage.setItem('share_app_list', JSON.stringify(appList))
                                  //                         }
                                  //                         doAction({
                                  //                           "actionType": "setValue",
                                  //                           "componentId": "share_list",
                                  //                           "args": {
                                  //                             "value": {
                                  //                                 "items": listData,
                                  //                             }
                                  //                           }
                                  //                         })
                                  //                       }
                                  //                     }
                                  //                   ]
                                  //                 }
                                  //               },
                                  //             },
                                  //           }
                                  //         ]
                                  //       },
                                  //     ],
                                  //   }]
                                  // },
                                  {
                                    "title": "外部共享",
                                    "tab": [{
                                      "type": "combo",
                                      "name": "externalShare",
                                      "label": "共享给",
                                      "required": "true",
                                      "items": [
                                        {
                                          "name": "text",
                                          "label": "新增",
                                          "type": "button",
                                          "level": "link",
                                          "actionType": "dialog",
                                          "dialog": {
                                            "title": "新增外部共享",
                                            "body": {
                                              "type": "form",
                                              "initApi": {
                                                "method": "get",
                                                "url": useDevBaseUrl("/app/api-share/generateAccessKey"),
                                                adaptor: function (payload: any) {
                                                  return {
                                                      ...payload,
                                                      status: payload.code,
                                                      data: { ...payload.data}
                                                  };
                                                }
                                              },
                                              "body": [
                                                {
                                                  "type": "alert",
                                                  "level": "warning",
                                                  "className": "mb-1",
                                                  "body": [{
                                                    "type": "input-text",
                                                    "name": "accessKeyId",
                                                    "label": "AccessKey ID",
                                                    "static": true,
                                                    "labelWidth": 130,
                                                  },
                                                  {
                                                    "type": "input-text",
                                                    "name": "accessKeySecret",
                                                    "label": "AccessKey Secret",
                                                    "static": true,
                                                    "labelWidth": 130,
                                                  }],
                                                },
                                                // {
                                                //   "type": "button",
                                                //   "label": "下载 CSV 文件",
                                                //   "level": "link",
                                                //   "icon": "fa fa-arrow-down",
                                                // },
                                                {
                                                  "name": "saveSecret",
                                                  "value": false,
                                                  "type": "checkbox",
                                                  "className": "appPublish_confirm_label",
                                                  "label": "",
                                                  "option": "我已保存好 AccessKey Secret",
                                                }
                                              ]
                                            },
                                            "actions": [
                                              {
                                                "type": "button",
                                                "actionType": "close",
                                                "label": "取消",
                                              },
                                              {
                                                "label": "确认",
                                                "primary": true,
                                                "type": "button",
                                                "disabledOn": "!this.saveSecret",
                                                "actionType": "close",
                                                "onEvent": {
                                                  "click": {
                                                    "actions": [
                                                      {
                                                        "actionType": "custom",
                                                        "script": async function (context: any,doAction: any,event: any) {
                                                          const listData = JSON.parse(sessionStorage.getItem('external_share_list')!) ? JSON.parse(sessionStorage.getItem('external_share_list')!) : []
                                                          listData.push({
                                                            accessKeyId: event.data.accessKeyId,
                                                            accessKeySecret: event.data.accessKeySecret,
                                                            status: 0
                                                          })
                                                          sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                                          doAction({
                                                            "actionType": "setValue",
                                                            "componentId": "external_share_list",
                                                            "args": {
                                                              "value": {
                                                                "items": listData,
                                                              }
                                                            }
                                                          })
                                                        }
                                                      }
                                                    ]
                                                  }
                                                }
                                              }
                                            ]
                                          }
                                        },
                                      ]
                                    },
                                    {
                                      "type": "table",
                                      "id": "external_share_list",
                                      "columns": [
                                        {
                                          "label": "id",
                                          "name": "id",
                                        },
                                        {
                                          "label": "AccessKey ID",
                                          "name": "accessKeyId",
                                        },
                                        {
                                          "name": "accessKeySecret",
                                          "label": "AccessKey Secret"
                                        },
                                        {
                                          "name": "status",
                                          "label": "状态",
                                          "type": 'mapping',
                                          "map": {
                                            '0': "<span>已启用</span>",
                                            '1': "<span>已禁用</span>",
                                          },
                                        },
                                        {
                                          "type": "operation",
                                          "label": "操作",
                                          "buttons": [
                                            {
                                              "label": "删除",
                                              "type": "button",
                                              "level": "link",
                                              "actionType": "dialog",
                                              "dialog": {
                                                "title": '删除',
                                                "body": {
                                                  "type": 'mapping',
                                                  "value": '1',
                                                  "map": {
                                                    '1': '您确认要删除${accessKeyId}?'
                                                  }
                                                },
                                                "onEvent": {
                                                  "confirm": {
                                                    "actions": [
                                                      {
                                                        "actionType": "custom",
                                                        "script": async function (context:any, doAction: any, e: any) {
                                                          const listData = JSON.parse(sessionStorage.getItem('external_share_list')!)
                                                          const delIndex = e.data.__super.__super.index
                                                          listData.splice(delIndex, 1)
                                                          sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                                          doAction({
                                                            "actionType": "setValue",
                                                            "componentId": "external_share_list",
                                                            "args": {
                                                              "value": {
                                                                  "items": listData,
                                                              }
                                                            }
                                                          })
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                              },
                                            },
                                            {
                                              "label": "禁用",
                                              "type": "button",
                                              "level": "link",
                                              "actionType": "dialog",
                                              "visibleOn": "${status == 0}",
                                              "dialog": {
                                                "title": '禁用',
                                                "body": {
                                                  "type": 'mapping',
                                                  "value": '1',
                                                  "map": {
                                                    '1': '您确认要禁用${accessKeyId}?'
                                                  }
                                                },
                                                "onEvent": {
                                                  "confirm": {
                                                    "actions": [
                                                      {
                                                        "actionType": "custom",
                                                        "script": async function (context:any, doAction: any, e: any) {
                                                          const listData = JSON.parse(sessionStorage.getItem('external_share_list')!)
                                                          const statusIndex = e.data.__super.__super.index
                                                          listData[statusIndex].status = 1
                                                          sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                                          doAction({
                                                            "actionType": "setValue",
                                                            "componentId": "external_share_list",
                                                            "args": {
                                                              "value": {
                                                                  "items": listData,
                                                              }
                                                            }
                                                          })
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                              },
                                            },
                                            {
                                              "label": "启用",
                                              "type": "button",
                                              "level": "link",
                                              "actionType": "dialog",
                                              "visibleOn": "${status == 1}",
                                              "dialog": {
                                                "title": '启用',
                                                "body": {
                                                  "type": 'mapping',
                                                  "value": '1',
                                                  "map": {
                                                    '1': '您确认要启用${accessKeyId}?'
                                                  }
                                                },
                                                "onEvent": {
                                                  "confirm": {
                                                    "actions": [
                                                      {
                                                        "actionType": "custom",
                                                        "script": async function (context:any, doAction: any, e: any) {
                                                          const listData = JSON.parse(sessionStorage.getItem('external_share_list')!)
                                                          const statusIndex = e.data.__super.__super.index
                                                          listData[statusIndex].status = 0
                                                          sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                                          doAction({
                                                            "actionType": "setValue",
                                                            "componentId": "external_share_list",
                                                            "args": {
                                                              "value": {
                                                                  "items": listData,
                                                              }
                                                            }
                                                          })
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                              },
                                            }
                                          ]
                                        },
                                      ],
                                    }]
                                  }
                                ],
                                "onEvent": {
                                  "change": {
                                    "actions": [
                                      {
                                        "actionType": "custom",
                                        "script": async function(_, doAction, event){
                                          if(event.data.value == 2){
                                            const listData = JSON.parse(sessionStorage.getItem('external_share_list')!) ? JSON.parse(sessionStorage.getItem('external_share_list')!) : []
                                            sessionStorage.setItem('external_share_list', JSON.stringify(listData))
                                            doAction({
                                              "actionType": "setValue",
                                              "componentId": "external_share_list",
                                              "args": {
                                                "value": {
                                                  "items": listData,
                                                }
                                              }
                                            })
                                          }
                                        }
                                      }
                                    ]
                                  }
                                }
                              }
                            ]
                          },
                          "actions": [
                            {
                              "type": "button",
                              "actionType": "close",
                              "label": "取消",
                            },
                            {
                              "label": "确认",
                              "primary": true,
                              "type": "button",
                              "onEvent": {
                                "click": {
                                  "actions": [
                                    {
                                      "actionType": "validate",
                                      "componentId": "mobile_register",
                                      "outputVar": 'validateResult'
                                    },
                                    {
                                      "actionType": "custom",
                                      "script": async function (context: any,doAction: any,event: any) {
                                        if(event.data.validateResult.error) return;
                                        let id = event.data.__super.__super.id;
                                        let shareName = event.data.__super.shareName;
                                        let remark = event.data.__super.remark;
                                        let shareTypeAll = event.data.__super.share?.shareType
                                        let apiList = JSON.parse(sessionStorage.getItem('api_collection_list')!)
                                        let shareList = JSON.parse(sessionStorage.getItem('share_list')!)
                                        let externalShareList = JSON.parse(sessionStorage.getItem('external_share_list')!)
                                        if(externalShareList == null || externalShareList?.length == 0){
                                          return toast.error('请配置外部共享', {
                                            position: "top-center"
                                          })
                                        } else {
                                          const params = {
                                            id: id,
                                            shareName: shareName,
                                            remark: remark,
                                            "shareApiData": apiList,
                                            "relationAppData": shareList,
                                            "shareType": shareTypeAll,
                                            "openApiConfig": externalShareList
                                          }
                                          const res = await saveApiShare(params)
                                          if(res.data.code == 0){
                                            doAction({
                                              actionType: "closeDialog",
                                              componentId: "share_dialog",
                                            })
                                            doAction({
                                              actionType: 'reload',
                                              componentId: 'share_crud'
                                            });
                                          } else {
                                            toast.error(res.data.msg, {
                                              position: "top-center"
                                            })
                                          }
                                        }
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        }
                      },
                      {
                        "label": "删除",
                        "type": "button",
                        "actionType": "ajax",
                        "level": "link",
                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'apiManage:api-share:delete')}",
                        "confirmText": "确认要删除${shareName}吗？",
                        "api": {
                          "url": useDevBaseUrl("/app/api-share/delete?id=${id}"),
                          "method": "delete"
                        },
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
export default () => <AMISComponent schema={schema} />;
