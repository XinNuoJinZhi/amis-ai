import { history } from '@umijs/max';
import { useDevBaseUrl } from "@/utils/util"
import { isAppEnd, isEditorialEnd } from '@/utils/index'
import {AMISComponent} from "@/hooks/amis";
let crudApi = isAppEnd() ? useDevBaseUrl("/application/processManage/form/page?pageNo=${page}&pageSize=${perPage}&appid=${appid}&env=${env}&groupKey=${groupKey}&type=1") : useDevBaseUrl("/processManage/form/page?pageNo=${page}&pageSize=${perPage}&appid=${appid}&env=${env}&groupKey=${groupKey}")
let initURL =  isAppEnd() ? useDevBaseUrl("/application/processManage/form-group/list") : useDevBaseUrl("/processManage/form-group/list")
let newGroupApi =  isAppEnd() ? useDevBaseUrl("/application/processManage/form-group/create") : useDevBaseUrl("/processManage/form-group/create")
let detailGroupApi =  isAppEnd() ? useDevBaseUrl("/application/processManage/form-group/get?id=${value}") : useDevBaseUrl("/processManage/form-group/get?id=${value}")
let editGroupApi =  isAppEnd() ? useDevBaseUrl("/application/processManage/form-group/update") : useDevBaseUrl("/processManage/form-group/update")
let deleteGroupApi =  isAppEnd() ? useDevBaseUrl("/application/processManage/form-group/delete?id=${value}") : useDevBaseUrl("/processManage/form-group/delete?id=${value}")
let newFormUrl = isAppEnd() ? useDevBaseUrl("/application/processManage/form/create") : useDevBaseUrl("/processManage/form/create")
let selectedGroupUrl = isAppEnd() ? useDevBaseUrl("/application/processManage/form-group/list?Type=1") : useDevBaseUrl("/processManage/form-group/list?Type=1")
let detailFormUrl = isAppEnd() ? useDevBaseUrl("/application/processManage/form/get?queryKey=${queryKey}") : useDevBaseUrl("/processManage/form/get?queryKey=${queryKey}")
let editFormUrl = isAppEnd() ? useDevBaseUrl("/application/processManage/form/update") : useDevBaseUrl("/processManage/form/update")
let deleteFormUrl = isAppEnd() ? useDevBaseUrl("/application/processManage/form/deleteDataByQueryKey?queryKey=${queryKey}") : useDevBaseUrl("/processManage/form/deleteDataByQueryKey?queryKey=${queryKey}")
const params = new URLSearchParams(window.location.search);
const env = params.get('env');
const showCommonFlag = (env != 1 || isAppEnd() )? false : true
const editorialEndEnv = (env ==1 && isEditorialEnd()) ? true : false
const schema = {
  // 布局
  "type": "page",
  "name": "formManage",
  "className": "formManage",
  "id": "formManage_page",
  "initApi": {
    "method": "get",
    "url": initURL,
    adaptor: function (payload: any,response:any, api:any, context:any) {
      const params = new URLSearchParams(window.location.search);
      let groupKey = params.get('groupKey');
      let data = payload?.data?.links ? payload?.data?.links : [];
      let val = data.some((i)=>i.queryKey==groupKey);
      if(!val){
        groupKey = 'DEFAULT'
      }
      for(var i=0;i<data.length;i++){
        if(data[i].queryKey == groupKey){
          data[i].active = true
        } else {
          data[i].active = false
        }
      }
      const appid = params.get('appid');
      const env = params.get('env');
      const portalKey = params.get('portalKey')
      let url = '';
      if (window.location.pathname.indexOf('/app/design') > -1) {
        url = '/app/design/formManage?groupKey='+groupKey+'&appid='+appid+'&env='+env;
      } else {
        url = '/app/formManage?groupKey='+groupKey+'&appid='+appid+'&env='+env + (portalKey ? `&portalKey=${portalKey}` : '');
      }
      history.push(url)
      return {
        ...payload,
        status: payload.code,
        data: { ...payload.data, links: payload?.data?.links ? payload?.data?.links : []}
      };
    }
  },
  // "onEvent": {
  //   "init": {
  //       "actions": [
  //           {
  //               "actionType": "custom",
  //               "script": function(_, doAction, event){
  //                   setTimeout(() => {
  //                     doAction({
  //                       actionType: "reload",
  //                       componentId: "formManage_nav",
  //                     });
  //                   }, 300)
  //               }
  //           }
  //       ]
  //   }
  // },
  "aside": [
    {
      "type": "wrapper",
      "className": "left_page",
      "body": [
        {
          "type": "tpl",
          "tpl": "表单分组",
        },
        {
          "type": "button",
          "label": "",
          "level": "link",
          "icon": "fa fa-plus",
          "actionType": "dialog",
          "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:formGroup:create')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:formGroup:create')}",
          // "reload": "nav",
          "reload": "formManage",
          "className": "text-xl text-dark",
          "dialog": {
            "size": "md",
            "title": "新增分组",
            "body": [
              {
                "type": "form",
                "api": {
                  "method": "post",
                  "url": newGroupApi,
                  adaptor: function (payload: any) {
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
                    "label": "分组名",
                    "required": true,
                    "placeholder": "请输入分组名称",
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
                ]
              }
            ]
          }
        },
      ]
    },
    {
      "type": "nav",
      "name": "nav",
      "id": "formManage_nav",
      "stacked": true,
      "source": "${links}",
      // "source": {
      //   "url": useDevBaseUrl("/processManage/form-group/list"),
      //   "method": "get",
      // },
      "className": "w-md",
      "itemActions": [
        {
          "type": "dropdown-button",
          "level": "link",
          "icon": "fa fa-ellipsis-h",
          "hiddenOn": "this.queryKey=='DEFAULT' || this.queryKey=='ALL'",
          "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:formGroup:update') || ARRAYINCLUDES(${$$permissionsData},'app:formGroup:delete')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:form:update') || ARRAYINCLUDES(${$$permissionsData},'devApp:form:delete')}",
          "hideCaret": true,
          "buttons": [
            {
              "type": "button",
              "label": "编辑分组",
              "actionType": "dialog",
              "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:formGroup:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:formGroup:update')}",
              // "reload": "nav",
              "reload": "formManage",
              "dialog": {
                "size": "md",
                "title": "编辑分组",
                "data": {
                  value: "${value}",
                },
                "body": [
                  {
                    "type": "form",
                    "initApi": detailGroupApi,
                    "api": {
                      "method": "put",
                      "url": editGroupApi,
                      adaptor: function (payload: any) {
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
                        "label": "分组名",
                        "required": true,
                        "placeholder": "请输入分组名称",
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
                    ]
                  }
                ]
              }
            },
            {
              "type": "button",
              "label": "删除",
              "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:formGroup:delete')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:formGroup:delete')}",
              // "reload": "nav",
              "reload": "formManage",
              "confirmText": "确认要删除${label}吗？",
              "actionType": "ajax",
              api: {
                url: deleteGroupApi,
                method: 'delete'
              }
            }
          ]
        }
      ]
    },
  ],
  "body": {
    "type": "page",
    "body": {
      "type": "crud",
      // "syncLocation": false,
      "autoFillHeight": true,
      "api": {
        "url": crudApi,
        "sendOn": "this.groupKey",
        adaptor: function (payload: any) {
          return {
            ...payload,
            status: payload.code,
            data: { ...payload.data, items:payload?.data?.list ?  payload.data.list : [] }
          };
        },
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
          "label": "新建表单",
          "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:form:create')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:form:create')}",
          "level": "primary",
          "actionType": "dialog",
          "dialog": {
            "title": "新建表单",
            "body": {
              "type": "form",
              "api": {
                "method": "post",
                "url": newFormUrl,
                requestAdaptor: function (api:any) {
                    let groupKey = api.data.queryKey;
                    let formName = api.data.formName;
                    let remark = api.data.remark;
                    let modelEventTarget = api.data.modelEventTarget;
                    let formCode = api.data.code;
                    let formType = api.data.type;
                    let perType = api.data.perType;
                    if(api.data.type == 1){ // 页面表单
                      return {
                        ...api,
                        data: {
                          "formName": formName,
                          "groupKey": groupKey,
                          "remark": remark,
                          "code": formCode,
                          "type": formType,
                          "perType": perType,
                        }
                      };
                    } else {
                      return {
                        ...api,
                        data: {
                          "formName": formName,
                          "groupKey": groupKey,
                          "modelEventTarget": modelEventTarget,
                          "remark": remark,
                          "code": formCode,
                          "type": formType,
                        }
                      };
                    }
                },
                adaptor: function (payload:any) {
                  return {
                      ...payload,
                      status: payload?.code
                  };
                }
              },
              "body": [
                {
                  "type": "input-text",
                  "name": "formName",
                  "label": "表单名称",
                  "required": "true",
                  "placeholder": "请填写表单名称",
                  "showCounter": true,
                  "maxLength": 50,
                },
                {
                  "type": "input-text",
                  "name": "code",
                  "label": "表单编码",
                  "required": "true",
                  "placeholder": "请填写表单编码",
                  "showCounter": true,
                  "maxLength": 50,
                },
                {
                  "type": "radios",
                  "name": "type",
                  "label": "表单类型",
                  "required": "true",
                  "disabled": isAppEnd() ? true : false,
                  "value": isAppEnd() ? 1 : 0,
                  "options": isAppEnd() ? [
                    {
                      "label": "页面表单",
                      "value": 1
                    }
                  ] : [{
                    "label": "流程表单",
                    "value": 0
                  },
                  {
                    "label": "页面表单",
                    "value": 1
                  }],
                  "onEvent": {
                    "change": {
                      "actions": [
                        {
                          "actionType": "setValue",
                          "componentId": "selectedEntity",
                          "args": {
                              "value": ""
                          }
                        }
                      ]
                    }
                  }
                },
                {
                  "type": "nested-select",
                  "id": "selectedEntity",
                  "name": "modelEventTarget",
                  "label": "绑定实体",
                  "required": "true",
                  "onlyLeaf": true,
                  "visibleOn": "${type == 0}",
                  "source": {
                    "method": "get",
                    "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                    adaptor: function (payload: any) {
                      let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data, options: data }
                      };
                    },
                  }
                },
                {
                  "name": "perType",
                  "type": "radios",
                  "label": "权限类型",
                  "visibleOn": "${type == 1}",
                  "required": true,
                  "selectFirst": true,
                  "options": [
                    {
                      "label": "通用",
                      "value": 1,
                      "visible": showCommonFlag
                    },
                    {
                      "label": "专用",
                      "value": 2
                    },
                  ]
                },
                {
                  "type": "select",
                  "name": "queryKey",
                  "label": "所属分组",
                  "placeholder": "请选择",
                  "valueField": "queryKey",
                  "value":"${groupKey == 'ALL' ? 'DEFAULT' : groupKey}",
                  // "disabledOn": "${groupKey == 'ALL' ? false : true}",
                  "source": {
                    "method": "get",
                    "url": selectedGroupUrl,
                    adaptor: function (payload: any) {
                      if(payload.data){
                        delete payload.data.value;
                        delete payload.data.links[0];
                      }
                      // payload.data.links.unshift({label: "默认分组",  value: 'DEFAULT', queryKey: 'DEFAULT'})
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data, options: payload?.data?.links ? payload?.data?.links : []}
                      };
                    },
                  }
                },
                {
                  "type": "textarea",
                  "name": "remark",
                  "label": "备注",
                  "placeholder": "请输入备注信息",
                  "showCounter": true,
                  "maxLength": 255,
                }
              ]
            }
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
          "name": "formName",
          "label": "表单名称"
        },
        {
          "name": "code",
          "label": "表单编码"
        },
        {
          "name": "type",
          "label": "表单类型",
          "type": 'mapping',
          "map": {
              0: "<span>流程表单</span>",
              1: "<span>页面表单</span>",
          },
        },
        {
          "name": "tableName",
          "label": "绑定实体",
          "hiddenOn": isAppEnd() ? true : false
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
              "label": "PC端设计",
              "type": "button",
              "level": "link",
              "onEvent": {
                "click": {
                  "actions": [
                    {
                      "actionType": "custom",
                      "script": function (row: any) {
                        let rowData = row.props.data;
                        let queryKey = rowData.queryKey;
                        let groupKey = rowData.groupKey;
                        let dsKey = rowData.dsKey;
                        let modelEventTarget = rowData?.modelEventTarget?.split('.')[1];
                        let type = rowData.type;
                        const params = new URLSearchParams(window.location.search);
                        const appid = params.get('appid');
                        const env = params.get('env');
                        const portalKey = params.get('portalKey')
                        const url = './formManage/form/edit?appid='+appid+'&env='+env +'&groupKey='+groupKey+'&queryKey=' + queryKey+(dsKey ? '&dsKey=' + dsKey : '')+(modelEventTarget ? '&modelEventTarget=' + modelEventTarget : '')+'&type=' + type + (portalKey ? `&portalKey=${portalKey}` : '') + '&pcEnd=' + true
                        window.open(url)
                      }
                    }
                  ]
                }
              }
            },
            {
              "label": "移动端设计",
              "type": "button",
              "level": "link",
              "visibleOn": isAppEnd() ? "${false}" : "${ARRAYINCLUDES(${$$permissionsData},'app:publish:mobile')}",
              "onEvent": {
                "click": {
                  "actions": [
                    {
                      "actionType": "custom",
                      "script": function (row: any) {
                        let rowData = row.props.data;
                        let queryKey = rowData.queryKey;
                        let groupKey = rowData.groupKey;
                        let dsKey = rowData.dsKey;
                        let modelEventTarget = rowData.modelEventTarget?.split('.')[1];
                        let type = rowData.type;
                        const params = new URLSearchParams(window.location.search);
                        const appid = params.get('appid');
                        const env = params.get('env');
                        const portalKey = params.get('portalKey')
                        const url = './formManage/form/edit?appid='+appid+'&env='+env +'&groupKey='+groupKey+'&queryKey=' + queryKey+(dsKey ? '&dsKey=' + dsKey : '' ) + (modelEventTarget ? '&modelEventTarget=' + modelEventTarget : '')+'&type=' + type + (portalKey ? `&portalKey=${portalKey}` : '') + '&appEnd=' + true
                        window.open(url)
                      }
                    }
                  ]
                }
              }
            },
            {
              "label": "设置",
              "type": "button",
              "level": "link",
              "actionType": "dialog",
              "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:form:update') }" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:form:update')}",
              "hidden": !editorialEndEnv,
              "dialog": {
                "title": "设置表单信息",
                "data": {
                  queryKey: "${queryKey}",
                  code: "${code}"
                },
                "body": [{
                  "type": "form",
                  "initApi": detailFormUrl,
                  "api": {
                    "method": "put",
                    "url": editFormUrl,
                    requestAdaptor: function (api:any) {
                      let groupKey = api.data.groupKey;
                      let formName = api.data.formName;
                      let remark = api.data.remark;
                      let modelEventTarget = api.data.modelEventTarget;
                      let formCode = api.data.code;
                      let formType = api.data.type;
                      let queryKey = api.data.queryKey;
                      let perType = api.data.perType;
                      if(api.data.type == 1){ // 页面表单
                        return {
                          ...api,
                          data: {
                            "queryKey": queryKey,
                            "formName": formName,
                            "groupKey": groupKey,
                            "remark": remark,
                            "code": formCode,
                            "type": formType,
                            "perType": perType
                          }
                        };
                      } else {
                        return {
                          ...api,
                          data: {
                            "queryKey": queryKey,
                            "formName": formName,
                            "modelEventTarget": modelEventTarget,
                            "groupKey": groupKey,
                            "remark": remark,
                            "code": formCode,
                            "type": formType,
                          }
                        };
                      }
                    },
                    adaptor: function (payload: any) {
                      return {
                        ...payload,
                        status: payload.code
                      };
                    }
                  },
                  "body": [
                    {
                      "type": "input-text",
                      "name": "formName",
                      "label": "表单名称",
                      "required": "true",
                      "placeholder": "请填写表单名称",
                      "showCounter": true,
                      "maxLength": 50,
                    },
                    {
                      "type": "input-text",
                      "name": "code",
                      "label": "表单编码",
                      "required": "true",
                      "placeholder": "请填写表单编码",
                      "showCounter": true,
                      "maxLength": 50,
                    },
                    {
                      "type": "radios",
                      "name": "type",
                      "label": "表单类型",
                      "required": "true",
                      "disabled": true,
                      "value": isAppEnd() ? 1 : 0,
                      "options": isAppEnd() ? [
                        {
                          "label": "页面表单",
                          "value": 1
                        }
                      ] : [{
                        "label": "流程表单",
                        "value": 0
                      },
                      {
                        "label": "页面表单",
                        "value": 1
                      }],
                      "onEvent": {
                        "change": {
                          "actions": [
                            {
                              "actionType": "setValue",
                              "componentId": "selectedEntity",
                              "args": {
                                  "value": ""
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      "type": "nested-select",
                      "id": "selectedEntity",
                      "name": "modelEventTarget",
                      "label": "绑定实体",
                      "required": "true",
                      "onlyLeaf": true,
                      "disabled": true,
                      "visibleOn": "${type == 0}",
                      "source": {
                        "method": "get",
                        "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                        adaptor: function (payload: any) {
                          let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: data }
                          };
                        },
                      }
                    },
                    {
                      "name": "perType",
                      "type": "radios",
                      "label": "权限类型",
                      "visibleOn": "${type == 1}",
                      "required": true,
                      "options": [
                        {
                          "label": "通用",
                          "value": 1,
                          "visible": showCommonFlag
                        },
                        {
                          "label": "专用",
                          "value": 2
                        },
                      ]
                    },
                    {
                      "type": "select",
                      "name": "groupKey",
                      "label": "所属分组",
                      "valueField": "queryKey",
                      "placeholder": "请选择",
                      // "disabledOn": "${groupKey == 'ALL' ? false : true}",
                      "source": {
                        "method": "get",
                        "url": selectedGroupUrl,
                        adaptor: function (payload: any) {
                          if(payload.data){
                            delete payload.data.value;
                            delete payload.data.links[0];
                          }
                          // payload.data.links.unshift({label: "默认分组",  value: 'DEFAULT', queryKey: 'DEFAULT'})
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: payload?.data?.links ? payload?.data?.links : []}
                          };
                        }
                      }
                    },
                    {
                      "type": "textarea",
                      "name": "remark",
                      "label": "备注",
                      "placeholder": "请输入备注信息",
                      "showCounter": true,
                      "maxLength": 255,
                    }
                  ]
                }]
              }
            },
            {
              "label": "设置",
              "type": "button",
              "level": "link",
              "actionType": "dialog",
              "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:form:update') && perType == 2}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:form:update') && false}",
              "dialog": {
                "title": "设置表单信息",
                "data": {
                  queryKey: "${queryKey}",
                  code: "${code}"
                },
                "body": [{
                  "type": "form",
                  "initApi": detailFormUrl,
                  "api": {
                    "method": "put",
                    "url": editFormUrl,
                    requestAdaptor: function (api:any) {
                      let groupKey = api.data.groupKey;
                      let formName = api.data.formName;
                      let remark = api.data.remark;
                      let modelEventTarget = api.data.modelEventTarget;
                      let formCode = api.data.code;
                      let formType = api.data.type;
                      let queryKey = api.data.queryKey;
                      let perType = api.data.perType;
                      if(api.data.type == 1){ // 页面表单
                        return {
                          ...api,
                          data: {
                            "queryKey": queryKey,
                            "formName": formName,
                            "groupKey": groupKey,
                            "remark": remark,
                            "code": formCode,
                            "type": formType,
                            "perType": perType
                          }
                        };
                      } else {
                        return {
                          ...api,
                          data: {
                            "queryKey": queryKey,
                            "formName": formName,
                            "modelEventTarget": modelEventTarget,
                            "groupKey": groupKey,
                            "remark": remark,
                            "code": formCode,
                            "type": formType,
                          }
                        };
                      }
                    },
                    adaptor: function (payload: any) {
                      return {
                        ...payload,
                        status: payload.code
                      };
                    }
                  },
                  "body": [
                    {
                      "type": "input-text",
                      "name": "formName",
                      "label": "表单名称",
                      "required": "true",
                      "placeholder": "请填写表单名称",
                      "showCounter": true,
                      "maxLength": 50,
                    },
                    {
                      "type": "input-text",
                      "name": "code",
                      "label": "表单编码",
                      "required": "true",
                      "placeholder": "请填写表单编码",
                      "showCounter": true,
                      "maxLength": 50,
                    },
                    {
                      "type": "radios",
                      "name": "type",
                      "label": "表单类型",
                      "required": "true",
                      "disabled": true,
                      "value": isAppEnd() ? 1 : 0,
                      "options": isAppEnd() ? [
                        {
                          "label": "页面表单",
                          "value": 1
                        }
                      ] : [{
                        "label": "流程表单",
                        "value": 0
                      },
                      {
                        "label": "页面表单",
                        "value": 1
                      }],
                      "onEvent": {
                        "change": {
                          "actions": [
                            {
                              "actionType": "setValue",
                              "componentId": "selectedEntity",
                              "args": {
                                  "value": ""
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      "type": "nested-select",
                      "id": "selectedEntity",
                      "name": "modelEventTarget",
                      "label": "绑定实体",
                      "required": "true",
                      "onlyLeaf": true,
                      "disabled": true,
                      "visibleOn": "${type == 0}",
                      "source": {
                        "method": "get",
                        "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                        adaptor: function (payload: any) {
                          let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: data }
                          };
                        },
                      }
                    },
                    {
                      "name": "perType",
                      "type": "radios",
                      "label": "权限类型",
                      "visibleOn": "${type == 1}",
                      "required": true,
                      "options": [
                        {
                          "label": "通用",
                          "value": 1,
                          "visible": showCommonFlag
                        },
                        {
                          "label": "专用",
                          "value": 2
                        },
                      ]
                    },
                    {
                      "type": "select",
                      "name": "groupKey",
                      "label": "所属分组",
                      "valueField": "queryKey",
                      "placeholder": "请选择",
                      // "disabledOn": "${groupKey == 'ALL' ? false : true}",
                      "source": {
                        "method": "get",
                        "url": selectedGroupUrl,
                        adaptor: function (payload: any) {
                          if(payload.data){
                            delete payload.data.value;
                            delete payload.data.links[0];
                          }
                          // payload.data.links.unshift({label: "默认分组",  value: 'DEFAULT', queryKey: 'DEFAULT'})
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: payload?.data?.links ? payload?.data?.links : []}
                          };
                        }
                      }
                    },
                    {
                      "type": "textarea",
                      "name": "remark",
                      "label": "备注",
                      "placeholder": "请输入备注信息",
                      "showCounter": true,
                      "maxLength": 255,
                    }
                  ]
                }]
              }
            },
            {
              "label": "详情",
              "type": "button",
              "level": "link",
              "actionType": "dialog",
              "visible": !showCommonFlag,
              "dialog": {
                "title": "表单信息",
                "actions": [
                  {
                    "label": "关闭",
                    "actionType": "close",
                    "level": "default",
                    "type": "button",
                  }
                ],
                "data": {
                  queryKey: "${queryKey}",
                  code: "${code}"
                },
                "body": [{
                  "type": "form",
                  "initApi": detailFormUrl,
                  "body": [
                    {
                      "type": "input-text",
                      "name": "formName",
                      "label": "表单名称",
                      "required": "true",
                      "placeholder": "请填写表单名称",
                      "showCounter": true,
                      "maxLength": 50,
                      "static": true
                    },
                    {
                      "type": "input-text",
                      "name": "code",
                      "label": "表单编码",
                      "required": "true",
                      "placeholder": "请填写表单编码",
                      "showCounter": true,
                      "maxLength": 50,
                      "static": true
                    },
                    {
                      "type": "radios",
                      "name": "type",
                      "label": "表单类型",
                      "required": "true",
                      "disabled": true,
                      "static": true,
                      "value": isAppEnd() ? 1 : 0,
                      "options": isAppEnd() ? [
                        {
                          "label": "页面表单",
                          "value": 1
                        }
                      ] : [{
                        "label": "流程表单",
                        "value": 0
                      },
                      {
                        "label": "页面表单",
                        "value": 1
                      }],
                      "onEvent": {
                        "change": {
                          "actions": [
                            {
                              "actionType": "setValue",
                              "componentId": "selectedEntity",
                              "args": {
                                  "value": ""
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      "type": "nested-select",
                      "id": "selectedEntity",
                      "name": "modelEventTarget",
                      "label": "绑定实体",
                      "required": "true",
                      "onlyLeaf": true,
                      "disabled": true,
                      "static": true,
                      "visibleOn": "${type == 0}",
                      "source": {
                        "method": "get",
                        "url": useDevBaseUrl("/entitymanage/dataSource/pickerOptions"),
                        adaptor: function (payload: any) {
                          let data = payload.data.options.filter(item=>item.children && item.children.length>0);
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: data }
                          };
                        },
                      }
                    },
                    {
                      "name": "perType",
                      "type": "radios",
                      "label": "权限类型",
                      "visibleOn": "${type == 1}",
                      "required": true,
                      "static": true,
                      "options": [
                        {
                          "label": "通用",
                          "value": 1,
                        },
                        {
                          "label": "专用",
                          "value": 2
                        },
                      ]
                    },
                    {
                      "type": "select",
                      "name": "groupKey",
                      "label": "所属分组",
                      "valueField": "queryKey",
                      "placeholder": "请选择",
                      "static": true,
                      // "disabledOn": "${groupKey == 'ALL' ? false : true}",
                      "source": {
                        "method": "get",
                        "url": selectedGroupUrl,
                        adaptor: function (payload: any) {
                          if(payload.data){
                            delete payload.data.value;
                            delete payload.data.links[0];
                          }
                          // payload.data.links.unshift({label: "默认分组",  value: 'DEFAULT', queryKey: 'DEFAULT'})
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: payload?.data?.links ? payload?.data?.links : []}
                          };
                        }
                      }
                    },
                    {
                      "type": "textarea",
                      "name": "remark",
                      "label": "备注",
                      "placeholder": "请输入备注信息",
                      "showCounter": true,
                      "maxLength": 255,
                      "static": true
                    }
                  ]
                }]
              }
            },
            {
              "label": "删除",
              "type": "button",
              "actionType": "ajax",
              "level": "link",
              "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:form:delete')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:form:delete')}",
              "disabledOn": isAppEnd() ? "${perType == 1}" : "${false}",
              "confirmText": "确认要删除${formName}吗？",
              "api": {
                "url": deleteFormUrl,
                "method": "delete"
              },
            }
          ]
        }
      ]
    }
  }
}

export default () => <AMISComponent schema={schema} />;
