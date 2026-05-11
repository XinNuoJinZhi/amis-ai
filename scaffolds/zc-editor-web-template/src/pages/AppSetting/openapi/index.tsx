import {useDevBaseUrl, findPathByValue, findPathById, getLabelsByValue} from "@/utils/util"
import { toast } from 'amis'
import { saveAppOpenApi } from "@/api/interfaceManage"
import {AMISComponent} from "@/hooks/amis";
const schema = {
  "type": "page",
  "body": {
    "type": "crud",
    "syncLocation": false,
    "autoFillHeight": true,
    "id": "openapi_crud",
    "api": {
      "method": "get",
      "url": useDevBaseUrl("/application/app/api-share/page"),
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
            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:openApi:update')}",
            "dialog": {
              "title": "编辑共享",
              "id": "openapi_dialog",
              "size": "md",
              "body": {
                "type": "form",
                "id": "openapi_validate",
                "onEvent": {
                  "inited": {
                    "actions": [
                      {
                        "actionType": "custom",
                        "script": async function (context:any, doAction: any, e: any) {
                          const listVal = context.props.data.__super
                          const apiCollectionList = listVal.shareApiData
                          let apiCollectionListVal = []
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
                            "componentId": "openapi_api_list",
                            "args": {
                              "value": {
                                "items": apiCollectionListVal,
                              }
                            }
                          })
                          sessionStorage.setItem('openapi_api_collection_list', JSON.stringify(apiCollectionListVal))
                          const externalShareToList = listVal.openApiConfig
                          doAction({
                            "actionType": "setValue",
                            "componentId": "openapi_external_share_list",
                            "args": {
                              "value": {
                                "items": externalShareToList,
                              }
                            }
                          })
                          sessionStorage.setItem('openapi_external_share_list', JSON.stringify(externalShareToList))
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
                    "disabled": true,
                  },
                  {
                    "type": "textarea",
                    "name": "remark",
                    "label": "备注",
                    "placeholder": "请输入备注信息",
                    "showCounter": true,
                    "maxLength": 255,
                    "disabled": true,
                  },
                  {
                    "type": "combo",
                    "name": "apiCollection",
                    "label": "API集合",
                    "required": "true",
                    "items": [
                    ]
                  },
                  {
                    "type": "table",
                    "id": "openapi_api_list",
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
                      {
                        "name": "operationsShow",
                        "label": "操作类型"
                      }
                    ],
                  },
                  {
                    "type": "tabs",
                    "swipeable": true,
                    "tabs": [
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
                                    "url": useDevBaseUrl("/application/app/api-share/generateAccessKey"),
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
                                              const listData = JSON.parse(sessionStorage.getItem('openapi_external_share_list')!) ? JSON.parse(sessionStorage.getItem('openapi_external_share_list')!) : []
                                              listData.push({
                                                accessKeyId: event.data.accessKeyId,
                                                accessKeySecret: event.data.accessKeySecret,
                                                status: 0
                                              })
                                              sessionStorage.setItem('openapi_external_share_list', JSON.stringify(listData))
                                              doAction({
                                                "actionType": "setValue",
                                                "componentId": "openapi_external_share_list",
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
                          "id": "openapi_external_share_list",
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
                                              const listData = JSON.parse(sessionStorage.getItem('openapi_external_share_list')!)
                                              const delIndex = e.data.__super.__super.index
                                              listData.splice(delIndex, 1)
                                              sessionStorage.setItem('openapi_external_share_list', JSON.stringify(listData))
                                              doAction({
                                                "actionType": "setValue",
                                                "componentId": "openapi_external_share_list",
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
                                              const listData = JSON.parse(sessionStorage.getItem('openapi_external_share_list')!)
                                              const statusIndex = e.data.__super.__super.index
                                              listData[statusIndex].status = 1
                                              sessionStorage.setItem('openapi_external_share_list', JSON.stringify(listData))
                                              doAction({
                                                "actionType": "setValue",
                                                "componentId": "openapi_external_share_list",
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
                                              const listData = JSON.parse(sessionStorage.getItem('openapi_external_share_list')!)
                                              const statusIndex = e.data.__super.__super.index
                                              listData[statusIndex].status = 0
                                              sessionStorage.setItem('openapi_external_share_list', JSON.stringify(listData))
                                              doAction({
                                                "actionType": "setValue",
                                                "componentId": "openapi_external_share_list",
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
                          "componentId": "openapi_validate",
                          "outputVar": 'validateResult'
                        },
                        {
                          "actionType": "custom",
                          "script": async function (context: any,doAction: any,event: any) {
                            if(event.data.validateResult.error) return;
                            let id = event.data.__super.__super.id;
                            let shareName = event.data.__super.shareName;
                            let remark = event.data.__super.remark;
                            // let shareTypeAll = event.data.__super.share?.shareType
                            let apiList = JSON.parse(sessionStorage.getItem('openapi_api_collection_list')!)
                            let  externalShareList = JSON.parse(sessionStorage.getItem('openapi_external_share_list')!)
                            if(externalShareList?.length == 0){
                              return toast.error('请配置外部共享', {
                                position: "top-center"
                              })
                            } else {
                              const params = {
                                id: id,
                                shareName: shareName,
                                remark: remark,
                                "shareApiData": apiList,
                                // "shareType": shareTypeAll,
                                "openApiConfig": externalShareList
                              }
                              const res = await saveAppOpenApi(params)
                              if(res.data.code == 0){
                                doAction({
                                  actionType: "closeDialog",
                                  componentId: "openapi_dialog",
                                })
                                doAction({
                                  actionType: 'reload',
                                  componentId: 'openapi_crud'
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
        ]
      }
    ]
  }
}
export default () => <AMISComponent schema={schema} />;
