import { useDevBaseUrl, useAdminBaseUrl, addSelectValToAllNodes, extractValidMenuNodes, updateSelectValByResult } from "@/utils/util"
import { handleTree } from '@/utils/tree'
import Resource from "./component/Resource"
import {getLevelMenuList} from "@/api/member"
import {AMISComponent} from "@/hooks/amis";
import {findTargetNode, updateAllChildrenSelectVal, updateSelectVal} from "@/utils/util"
import {useCache} from '@/hooks/web/useCache'
const {wsCache} = useCache('sessionStorage')
const schema ={
  "type": "page",
  "body": [
    {
      "type": "crud",
      "syncLocation": false,
      "autoFillHeight": true,
      "api": {
        "method": "get",
        "url": useDevBaseUrl("/system/member-level/page"),
        "data": {
          "pageNo": "${page}",
          "pageSize": "${perPage}",
        },
        adaptor: function (payload:any) {
          if (payload?.data?.list) {
            payload?.data?.list.forEach(i=>{
              i.price = (i.price/100)
            })
          }
          return {
            ...payload,
            status: payload.code,
            data: { ...payload?.data, items: payload?.data?.list }
          };
        },
      },
      "headerToolbar": [
        {
          "type": "columns-toggler",
          "align": "right",
          "draggable": true,
        },
        {
          "type": "reload",
          "align": "right",
        },
        {
          "label": "新增",
          "type": "button",
          "icon": "fa fa-plus",
          "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:member-level:create')}",
          "actionType": "dialog",
          "level": "primary",
          "dialog": {
            "title": "新增",
            "data": {},
            "body": {
              "type": "form",
              "labelWidth": 120,
              "api": {
                "method": "post",
                "url": useDevBaseUrl("/system/member-level/create"),
                requestAdaptor: function (api: any, context: any) {
                  return {
                    ...api,
                    data: {
                      "name": api.data.name,
                      "level": api.data.level,
                      "icon":  api.data.icon,
                      "price": api.data.price * 100,
                      // "backgroundUrl": api.data.backgroundUrl,
                      "quarterDiscount": api.data.quarterDiscount,
                      "yearDiscount": api.data.yearDiscount,
                      "trialDays": api.data.trialDays,
                      "trialExpiryDate": api.data.trialExpiryDate,
                      "status": api.data.status,
                      "remark": api.data.remark
                    }
                  };
                },
              },
              "body": [
                {
                  "type": "input-text",
                  "name": "name",
                  "label": "等级名称",
                  "required": true,
                },
                {
                  "type": "input-number",
                  "name": "level",
                  "label": "等级",
                  "displayMode": "enhance",
                  "required": true,
                },
                {
                  "type": "input-image",
                  "label": "等级图标",
                  "name": "icon",
                  "maxSize": 204800,
                  "receiver": {
                    "method": "post",
                    "url": useDevBaseUrl("/app/file/convert/base64"),
                    adaptor: function (payload: any) {
                      return {
                        ...payload,
                        status: payload.code,
                        data: {
                          "value": payload.data
                        }
                      };
                    }
                  }
                },
                {
                  "type": "input-number",
                  "name": "price",
                  "label": "会员月付价格/元",
                  "required": true,
                },
                // {
                //   "type": "input-image",
                //   "label": "等级背景图",
                //   "name": "backgroundUrl",
                //   "maxSize": 204800,
                //   "receiver": {
                //     "method": "post",
                //     "url": useDevBaseUrl("/app/file/convert/base64"),
                //     adaptor: function (payload: any) {
                //       return {
                //         ...payload,
                //         status: payload.code,
                //         data: {
                //           "value": payload.data
                //         }
                //       };
                //     }
                //   }
                // },
                {
                  "type": "input-number",
                  "name": "quarterDiscount",
                  "label": "季付折扣百分比",
                  "required": true,
                },
                {
                  "type": "input-number",
                  "name": "yearDiscount",
                  "label": "年付折扣百分比",
                  "required": true,
                },
                {
                  "type": "input-number",
                  "name": "trialDays",
                  "label": "免费试用天数",
                  "required": false,
                  "min": 1,
                },
                {
                  "type": "input-datetime",
                  "name": "trialExpiryDate",
                  "label": "限时免费截止日期",
                  "required": false,
                  "valueFormat": "x",
                  "dateParseFormat": "x"
                },
                {
                  "type": "select",
                  "name": "status",
                  "label": "状态",
                  "placeholder": "请选择状态",
                  "required": true,
                  "source": {
                    "method": "get",
                    "url": useAdminBaseUrl("/system/dict-data/list?dictType=common_status&status=0"),
                    adaptor: function (payload: any) {
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data, options: payload.data }
                      };
                    },
                  },
                },
                {
                  "type": "input-text",
                  "name": "remark",
                  "label": "等级描述",
                  "placeholder": "请输入等级描述",
                }
              ]
            }
          }
        },
      ],
      "footerToolbar": [
        "statistics",
        "switch-per-page",
        "pagination"
      ],
      "alwaysShowPagination": true,
      "autoGenerateFilter": true,
      "columns": [
        {
          "name": "id",
          "label": "编号",
        },
        {
          "name": "name",
          "label": "等级名称",
        },
        {
          "name": "level",
          "label": "等级",
        },
        {
          "name": "icon",
          "label": "等级图标",
          "type": "static-image"
        },
        {
          "name": "price",
          "label": "会员月付价格",
        },
        // {
        //   "name": "backgroundUrl",
        //   "label": "等级背景图",
        //   "type": "static-image"
        // },
        {
          "name": "quarterDiscount",
          "label": "季付折扣百分比",
        },
        {
          "name": "yearDiscount",
          "label": "年付折扣百分比",
        },
        {
          "name": "trialDays",
          "label": "免费试用天数",
        },
        {
          "name": "trialExpiryDate",
          "label": "限时免费截止日期",
          "type": "input-datetime",
          "valueFormat": "x",
          "dateParseFormat": "x",
          "static": true,
        },
        {
          "name": "status",
          "label": "状态",
          "type": 'mapping',
          "map": {
            '0': "<span class='label label-success'>开启</span>",
            '1': "<span class='label label-info'>关闭</span>",
          }
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
              "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:member-level:update')}",
              "dialog": {
                "title": "编辑",
                "data": {
                  id: "${id}"
                },
                "body": {
                  "type": "form",
                  "labelWidth": 120,
                  "initApi": {
                    "method": "get",
                    "url": useDevBaseUrl("/system/member-level/get?id=${id}"),
                    adaptor: function (payload:any) {
                      if(payload?.data) {
                        payload.data.price = (payload?.data.price / 100).toFixed(2)
                      }
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data}
                      };
                    }
                  },
                  "api": {
                      "method": "put",
                      "url": useDevBaseUrl("/system/member-level/update"),
                      requestAdaptor: function (api: any, context: any) {
                        return {
                          ...api,
                          data: {
                            "id": api.data.id,
                            "name": api.data.name,
                            "level": api.data.level,
                            "icon":  api.data.icon,
                            "price": api.data.price * 100,
                            // "backgroundUrl": api.data.backgroundUrl,
                            "quarterDiscount": api.data.quarterDiscount,
                            "yearDiscount": api.data.yearDiscount,
                            "trialDays": api.data.trialDays,
                            "trialExpiryDate": api.data.trialExpiryDate,
                            "status": api.data.status,
                            "remark": api.data.remark
                          }
                        };
                      },
                      adaptor: function (payload:any) {
                        return {
                          ...payload,
                          status: payload.code
                        };
                      }
                  },
                  "body": [
                    {
                      "type": "input-text",
                      "name": "name",
                      "label": "等级名称",
                      "required": true,
                    },
                    {
                      "type": "input-number",
                      "name": "level",
                      "label": "等级",
                      "displayMode": "enhance",
                      "required": true,
                    },
                    {
                      "type": "input-image",
                      "label": "等级图标",
                      "name": "icon",
                      "maxSize": 204800,
                      "receiver": {
                        "method": "post",
                        "url": useDevBaseUrl("/app/file/convert/base64"),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: {
                              "value": payload.data
                            }
                          };
                        }
                      }
                    },
                    {
                      "type": "input-number",
                      "name": "price",
                      "label": "会员月付价格/元",
                      "required": true,
                    },
                    // {
                    //   "type": "input-image",
                    //   "label": "等级背景图",
                    //   "name": "backgroundUrl",
                    //   "maxSize": 204800,
                    //   "receiver": {
                    //     "method": "post",
                    //     "url": useDevBaseUrl("/app/file/convert/base64"),
                    //     adaptor: function (payload: any) {
                    //       return {
                    //         ...payload,
                    //         status: payload.code,
                    //         data: {
                    //           "value": payload.data
                    //         }
                    //       };
                    //     }
                    //   }
                    // },
                    {
                      "type": "input-number",
                      "name": "quarterDiscount",
                      "label": "季付折扣百分比",
                      "required": true,
                    },
                    {
                      "type": "input-number",
                      "name": "yearDiscount",
                      "label": "年付折扣百分比",
                      "required": true,
                    },
                    {
                      "type": "input-number",
                      "name": "trialDays",
                      "label": "免费试用天数",
                      "required": false,
                      "min": 1,
                    },
                    {
                      "type": "input-datetime",
                      "name": "trialExpiryDate",
                      "label": "限时免费截止日期",
                      "required": false,
                      "valueFormat": "x",
                      "dateParseFormat": "x"
                    },
                    {
                      "type": "select",
                      "name": "status",
                      "label": "状态",
                      "placeholder": "请选择状态",
                      "required": true,
                      "source": {
                        "method": "get",
                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=common_status&status=0"),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: payload.data }
                          };
                        },
                      },
                    },
                    {
                      "type": "input-text",
                      "name": "remark",
                      "label": "等级描述",
                      "placeholder": "请输入等级描述",
                    }
                  ]
                }
              }
            },
            {
              "label": "详情",
              "type": "button",
              "level": "link",
              "actionType": "dialog",
              "dialog": {
                "title": "详情",
                "actions": [
                  {
                    "label": "关闭",
                    "actionType": "close",
                    "level": "default",
                    "type": "button",
                  }
                ],
                "data": {
                  id: "${id}"
                },
                "body": {
                  "type": "form",
                  "labelWidth": 120,
                  "initApi": {
                    "method": "get",
                    "url": useDevBaseUrl("/system/member-level/get?id=${id}"),
                    adaptor: function (payload:any) {
                      if(payload?.data) {
                        payload.data.price = (payload?.data.price / 100).toFixed(2)
                      }
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data}
                      };
                    }
                  },
                  "body": [
                    {
                      "type": "input-text",
                      "name": "name",
                      "label": "等级名称",
                      "static": true,
                    },
                    {
                      "type": "input-number",
                      "name": "level",
                      "label": "等级",
                      "displayMode": "enhance",
                      "static": true,
                    },
                    {
                      "type": "static-image",
                      "label": "等级图标",
                      "name": "icon",
                    },
                    {
                      "type": "input-number",
                      "name": "price",
                      "label": "会员月付价格/元",
                      "static": true,
                    },
                    // {
                    //   "type": "static-image",
                    //   "label": "等级背景图",
                    //   "name": "backgroundUrl",
                    // },
                    {
                      "type": "input-number",
                      "name": "quarterDiscount",
                      "label": "季付折扣百分比",
                      "static": true,
                    },
                    {
                      "type": "input-number",
                      "name": "yearDiscount",
                      "label": "年付折扣百分比",
                      "static": true,
                    },
                    {
                      "type": "input-number",
                      "name": "trialDays",
                      "label": "免费试用天数",
                      "required": false,
                      "min": 1,
                      "static": true,
                    },
                    {
                      "type": "input-datetime",
                      "name": "trialExpiryDate",
                      "label": "限时免费截止日期",
                      "required": false,
                      "static": true,
                      "valueFormat": "x",
                      "dateParseFormat": "x"
                    },
                    {
                      "type": "select",
                      "name": "status",
                      "label": "状态",
                      "placeholder": "请选择状态",
                      "static": true,
                      "source": {
                        "method": "get",
                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=common_status&status=0"),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: payload.data }
                          };
                        },
                      },
                    },
                    {
                      "type": "input-text",
                      "name": "remark",
                      "label": "等级描述",
                      "static": true,
                    }
                  ]
                }
              }
            },
            {
              "label": "删除",
              "type": "button",
              "actionType": "ajax",
              "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:member-level:delete')}",
              "level": "link",
              "confirmText": "确认要删除${name}吗？",
              "api": {
                  "url": useDevBaseUrl("/system/member-level/delete?id=${id}"),
                  "method": "delete"
              },
            },
            {
              "label": "会员资源",
              "type": "button",
              "level": "link",
              "actionType": "dialog",
              "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:member-level:assign-menu')}",
              "dialog": {
                "title": "会员资源",
                "size": "lg",
                "id": "levelConfig",
                "body": [
                  // {
                  //   "type": "alert",
                  //   "body": "温馨提示：当前数据来源于正式环境，请谨慎操作！",
                  //   "level": "warning",
                  //   "className": "mb-1"
                  // },
                  {
                    "label": "",
                    "asFormItem": true,
                    "children": ({
                      value,
                      onChange,
                      data
                    }: {
                      value: any,
                      onChange: any,
                      data: any
                    }) => {
                      return (
                        <>
                          <Resource value={value} data={data} hide={true}/>
                        </>
                      )
                    }
                  }
                ],
                "actions": []
              }
            },
            {
              "label": "会员功能",
              "type": "button",
              "level": "link",
              "actionType": "dialog",
              "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:member-level:assign-menu')}",
              "dialog": {
                "title": "会员功能",
                "size": "lg",
                "id": 'memberFunction',
                "data": {
                  menuAuthList: [],
                  id: '${id}',
                  memberLevelId: "${id}",
                  name: '${name}'
                },
                "body": {
                  "type": "form",
                  "className": "levelAuth",
                  "id": "member_level_auth",
                  "initApi": {
                    "method": "get",
                    "url": useDevBaseUrl("/system/member-level/simple-list"),
                    adaptor: async function (payload:any,response:any, api:any, context:any) {
                      const id = context.__super.id
                      const res = await getLevelMenuList(id)
                      const levelAuth = res?.data?.data ? res?.data?.data : []
                      const treeData = handleTree(payload.data)
                      const treeDataVal = addSelectValToAllNodes(treeData)
                      const treeDataResult = updateSelectValByResult(treeDataVal, levelAuth)
                      const des = '该处配置的菜单和权限项为小于该等级时需要控制的功能，选项为前端隐藏时，隐藏对应的界面元素，选项为后端控制时，前端不隐藏，后端提示会员等级不足，高权限等级配置覆盖低权限等级配置，如：在黄金和白金同时配置了某权限项，白金生效，低于白金的都要控制。'
                      wsCache.set('menuAuthList', treeDataResult)
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data, menuAuthList: treeDataResult, levelAuth: levelAuth, des: des}
                      };
                    }
                  },
                  "body": [
                    {
                      "type": "input-text",
                      "name": "name",
                      "label": "等级名称",
                      "static": true,
                    },
                    {
                      "type": "crud",
                      "deferApi": {
                        "method": "get",
                        "url": useDevBaseUrl("/system/member-level/simple-listByParentId"),
                        "data":{
                          "menuId": "${id}"
                        },
                        adaptor: function (payload: any, response:any, api:any, context:any) {
                          const dataList = addSelectValToAllNodes(payload.data.children)
                          const levelAuth = context.__super.__super.levelAuth
                          const treeDataResult = updateSelectValByResult(dataList, levelAuth)
                          payload.data.children = treeDataResult
                          return {
                            ...payload,
                            status: payload.code,
                            data: { 
                              ...payload.data, items: payload.data ? payload.data : []
                            }
                          };
                        }
                      },
                      "quickSaveItemApi": {
                        "method": "post",
                        "url": useDevBaseUrl("/system/member-level/assign-level-menu"),
                        requestAdaptor: function (api:any, context:any) {
                          const id = context.id;
                          const selected = context.selectVal
                          return {
                            ...api,
                            data: {
                              memberLevelId: context.__super.__super.__super.__super.id,
                              menuId: id, 
                              memberPermissionMode: selected,
                              linkageSubMenuAuthFlag : false,
                            }
                          };
                        }
                      },
                      "label": "权限范围",
                      "id": "menuAuthList",
                      "name": "menuAuthList",
                      "source": "${menuAuthList}",
                      "className": "m-b-none",
                      "columnsTogglable": false,
                      "keyField": "id",
                      "columns": [
                        {
                          "name": "name",
                          "label": "菜单名称"
                        },
                        {
                          "name": "selectVal",
                          "label": "控制方式",
                          "quickEdit": {
                            "mode": "inline",
                            "type": "select",
                            "size": "xs",
                            "source": "${options}",
                            "saveImmediately": true
                          }
                        },
                        {
                          "type": "operation",
                          "label": "操作",
                          "buttons": [
                            {
                              "name": "operate",
                              "label": "级联控制子级",
                              "type": "button",
                              "visibleOn": "${defer}",
                              "actionType": "dialog",
                              "dialog": {
                                "title": "级联控制子级",
                                "data": {
                                  "options": "${options}",
                                  "selectVal": "${selectVal}",
                                  "menuId": "${id}",
                                  "memberLevelId": "${memberLevelId}"
                                },
                                "body": [
                                  {
                                    "type": "form",
                                    "body": [{
                                      "type": "select",
                                      "label": "控制方式",
                                      "name": "controlType",
                                      "source": "${options}",
                                      "value": "${selectVal}",
                                    }],
                                    "api": {
                                      "method": "post",
                                      "url": useDevBaseUrl("/system/member-level/assign-level-menu"),
                                      requestAdaptor: function (api:any, context:any) {
                                        const selected = context.controlType
                                        return {
                                          ...api,
                                          data: {
                                            memberLevelId: context.__super.__super.memberLevelId,
                                            menuId: context.__super.__super.menuId, 
                                            memberPermissionMode: selected,
                                            linkageSubMenuAuthFlag : true,
                                          }
                                        };
                                      }
                                    },
                                    "onEvent": {
                                      "submitSucc": {
                                        "actions": [
                                          {
                                            "actionType": "custom",
                                            "script": function(_, doAction, event) {
                                              doAction({
                                                "actionType": "reload",
                                                "componentId": "member_level_auth"
                                              })
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                                ],
                              }
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "type": "input-text",
                      "name": "des",
                      "label": "",
                      "labelWidth": 1,
                      "static": true,
                    }
                  ]
                },
                "actions": [{
                  "label": "关闭",
                  "actionType": "close",
                  "level": "default",
                  "type": "button",
                }]
              }
            }
          ]
        }
      ],
      "placeholder": "暂无数据"
    }
  ]
}

export default () => <AMISComponent schema={schema} />;
