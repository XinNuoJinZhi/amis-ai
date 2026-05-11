import { history } from '@umijs/max';
import { getAppDictData, getAdminDictData } from "@/api/dataDict"
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import {toast} from 'amis';
import {AMISComponent} from "@/hooks/amis";
let newOperation = false
const schema = {
    "type": "page",
    "className": "dictManage",
    "onEvent": {
        "init": {
            "actions": [
                {
                    "actionType": "custom",
                    "script": function(_, doAction, event){
                        let activeKeyVal = new URLSearchParams(window.location.search).get('scope') ? Number(new URLSearchParams(window.location.search).get('scope')) : 1;
                        setTimeout(() => {
                            // doAction({
                            //     actionType: "reload",
                            //     componentId: "appNav",
                            // });
                            doAction({
                                actionType: "changeActiveKey",
                                componentId: "tabs-change-receiver",
                                "args": {
                                    "activeKey": activeKeyVal
                                }
                            });
                        }, 300)
                    }
                },
            ]
        },
    },
    "aside": [
        {
            "type": "wrapper",
            "className": "dict_wrapper",
            "body": [
                {
                    "type": "tpl",
                    "tpl": "字典",
                    "className": "page_title",
                },
                {
                    "type": "button",
                    "label": "",
                    "icon": "fas fa-plus",
                    "level": "link",
                    "className": "text-xl text-dark add_plus",
                    "actionType": "dialog",
                    "reload": "appNav",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:create') && scope==1}",
                    // "visibleOn": "${scope==1}",
                    "dialog": {
                        "size": "md",
                        "title": "新增字典类型",
                        "body": [
                        {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl("/app/dict-type/create"),
                                adaptor: function (payload:any) {
                                    newOperation = true
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
                                    "label": "字典名称",
                                    "required": true,
                                    "placeholder": "请输入字典名称",
                                },
                                {
                                    "type": "input-text",
                                    "name": "type",
                                    "label": "字典类型",
                                    "required": true,
                                    "placeholder": "",
                                    "validations": "matchRegexp:^[a-zA-Z][A-Za-z0-9]*$",
                                    "validationErrors": {
                                        "matchRegexp": "字典类型由数字、字母组成，且不以数字开头"
                                    }
                                },
                                {
                                    "type": "select",
                                    "name": "dbType",
                                    "label": "类型",
                                    "placeholder": "请选择类型",
                                    "required": true,
                                    "source": {
                                        "method": "get",
                                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=dbType&status=0"),
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
                                    "type": "textarea",
                                    "name": "remark",
                                    "label": "备注",
                                    "placeholder": "请输入描述",
                                    "showCounter": true,
                                    "maxLength": 500,
                                },
                            ]
                        }]
                    }
                },
                {
                    "type": "tabs",
                    "id": "tabs-change-receiver",
                    "name": "tabs_dataDict",
                    "className": "tab_padding_top",
                    "tabs": [
                        {
                            "title": "应用级",
                            "reload": true,
                            "className": "dataDict_search",
                            "tab": [{
                                "name": "searchText",
                                "type": "input-text",
                                "className": "left_page_search",
                                "label": "",
                                "placeholder": "搜索",
                                "clearable": true,
                            },{
                                "type": "nav",
                                "name": "appNav",
                                "id": "appNav",
                                "stacked": true,
                                "source": {
                                    "url": useDevBaseUrl("/app/dict-type/list?name=${searchText}"),
                                    "method": "get",
                                    // "sendOn": "${scope == 1 || !scope}",
                                    adaptor: function (payload: any, response:any, api:any, context:any) {
                                      const params = new URLSearchParams(window.location.search);
                                        let dictType = params.get('dictType');
                                        let val = payload?.data ? payload?.data?.filter((i)=> i.type==dictType) : [];
                                        if(val.length==0){
                                            dictType = payload?.data && payload?.data[0] ? payload?.data[0]?.type : '';
                                        } else {
                                            if(newOperation){
                                                // const params = new URLSearchParams(window.location.search);
                                                const appid = params.get('appid');
                                                const env = params.get('env');
                                                let dictType = payload?.data[payload?.data?.length -1].type
                                                let url = '';
                                                if(["/app/design/dataDict", "/app/design/appSetting/dataDict"].includes(window.location.pathname)){
                                                  url = '/app/design/dataDict?scope=1&dictType='+dictType+'&appid='+appid+'&env='+env;
                                                }
                                                newOperation = false
                                                history.replace(url)
                                            }
                                        }
                                        // let valData = '?dictType='+dictType+'&scope=1';
                                        let valData = '?scope=1&dictType='+dictType;
                                        let data = payload?.data ? payload?.data : [];
                                        data.forEach((item:any)=>{item.value = item.id, item.label = item.name, item.to='?scope=1&dictType='+item.type})
                                        if(payload.code != 0) {
                                            toast.error(payload.msg, {
                                                position: 'top-right'
                                            });
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, links: data, value:valData }
                                        };
                                    },
                                },
                                "onEvent": {
                                    "click": {
                                        "actions": [
                                            {
                                            "actionType": "custom",
                                            "script": function(_, doAction, event){
                                                newOperation = false
                                            }
                                            }
                                        ]
                                    }
                                },
                                "itemActions": [
                                {
                                    "type": "dropdown-button",
                                    "level": "link",
                                    "icon": "fa fa-ellipsis-h",
                                    "hideCaret": true,
                                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:update') || ARRAYINCLUDES(${$$permissionsData},'devApp:dict:delete')}",
                                    "buttons": [
                                        {
                                            "type": "button",
                                            "label": "编辑",
                                            "actionType": "dialog",
                                            "reload": "appNav",
                                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:update')}",
                                            "dialog": {
                                                "size": "md",
                                                "title": "编辑字典类型",
                                                "data": {
                                                    value: "${value}",
                                                    id: "${id}"
                                                },
                                                "body": [
                                                {
                                                    "type": "form",
                                                    "initApi": {
                                                        "method": "get",
                                                        "url": useDevBaseUrl("/app/dict-type/get?id=${value}"),
                                                        adaptor: function (payload: any,response:any, api:any, context:any) {

                                                            return {
                                                                ...payload,
                                                                status: payload.code,
                                                                data: { ...payload.data}
                                                            };
                                                        }
                                                    },
                                                    "api": {
                                                        "method": "put",
                                                        "url": useDevBaseUrl("/app/dict-type/update"),
                                                        "data": {
                                                            "id": "${id}",
                                                            "name": "${name}",
                                                            "type": "${type}",
                                                            "dbType": "${dbType}",
                                                            "status": "${status}",
                                                            "remark": "${remark}",
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
                                                            "name": "name",
                                                            "label": "字典名称",
                                                            "required": true,
                                                            "placeholder": "请输入字典名称",
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "type",
                                                            "label": "字典类型",
                                                            "static": true,
                                                            "required": true,
                                                            "placeholder": "",
                                                        },
                                                        {
                                                            "type": "select",
                                                            "name": "dbType",
                                                            "label": "类型",
                                                            "placeholder": "请选择类型",
                                                            "required": true,
                                                            "disabled": true,
                                                            "source": {
                                                                "method": "get",
                                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=dbType&status=0"),
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
                                                            "type": "textarea",
                                                            "name": "remark",
                                                            "label": "备注",
                                                            "placeholder": "请输入描述",
                                                            "showCounter": true,
                                                            "maxLength": 500,
                                                        }
                                                    ]
                                                }]
                                            }
                                        },
                                        {
                                            "type": "button",
                                            "label": "删除",
                                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:delete')}",
                                            "reload": "appNav",
                                            "confirmText": "确认要删除${label}吗？",
                                            "actionType": "ajax",
                                            api: {
                                                url: useDevBaseUrl('/app/dict-type/delete?id=${value}'),
                                                method: 'delete'
                                            }
                                        }
                                    ]
                                }]
                            }]
                        },
                        {
                            "title": "组织级",
                            "reload": true,
                            "tab": [{
                                "name": "orgSearchText",
                                "type": "input-text",
                                "className": "left_page_search",
                                "label": "",
                                "placeholder": "搜索",
                                "clearable": true,
                            },{
                                "type": "nav",
                                "name": "nav",
                                "id": "orgNav",
                                "stacked": true,
                                "source": {
                                    "url": useDevBaseUrl("/app/dict-type/shared/list?name=${orgSearchText}"),
                                    "method": "get",
                                    adaptor: function (payload: any, response:any, api:any, context:any) {
                                        const params = new URLSearchParams(window.location.search);
                                        let dictType = params.get('dictType');
                                        let val = payload?.data ? payload.data.filter((i)=> i.type==dictType ) : [];
                                        if(val.length==0){
                                            dictType = payload?.data && payload?.data[0] ? payload?.data[0]?.type : '';
                                        }
                                        let data = payload?.data ? payload?.data : [];
                                        data.forEach((item:any)=>{item.value = item.id, item.label = item.name, item.to='?dictType='+item.type+'&scope=2'})
                                        let valData = '?dictType='+dictType+'&scope=2';
                                        if(payload.code != 0) {
                                            toast.error(payload.msg, {
                                                position: 'top-right'
                                            });
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, links: data, value:valData }
                                        };
                                    },
                                },
                                "itemActions": [
                                    {
                                        "type": "dropdown-button",
                                        "level": "link",
                                        "icon": "fa fa-ellipsis-h",
                                        "hideCaret": true,
                                        "buttons": [
                                            {
                                                "type": "button",
                                                "label": "详情",
                                                "actionType": "dialog",
                                                "reload": "appNav",
                                                "dialog": {
                                                    "size": "md",
                                                    "title": "查看字典类型",
                                                    "actions": [
                                                        {
                                                            "label": "关闭",
                                                            "actionType": "close",
                                                            "level": "default",
                                                            "type": "button",
                                                        }
                                                    ],
                                                    "data": {
                                                        value: "${value}"
                                                    },
                                                    "body": [
                                                    {
                                                        "type": "form",
                                                        "initApi": useDevBaseUrl("/app/dict-type/shared/get?id=${value}"),
                                                        "body": [
                                                            {
                                                                "type": "input-text",
                                                                "name": "name",
                                                                "label": "字典名称",
                                                                "required": true,
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "type",
                                                                "label": "字典类型",
                                                                "static": true,
                                                                "required": true,
                                                                "placeholder": "",
                                                            },
                                                            {
                                                                "type": "select",
                                                                "name": "dbType",
                                                                "label": "值类型",
                                                                "static": true,
                                                                "required": true,
                                                                "source": {
                                                                    "method": "get",
                                                                    "url": useAdminBaseUrl("/system/dict-data/list?dictType=dbType&status=0"),
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
                                                                "type": "select",
                                                                "name": "status",
                                                                "label": "状态",
                                                                "required": true,
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
                                                                "type": "textarea",
                                                                "name": "remark",
                                                                "label": "备注",
                                                                "static": true,
                                                                "showCounter": true,
                                                                "maxLength": 500,
                                                            }
                                                        ]
                                                    }]
                                                }
                                            }
                                        ]
                                    }]
                            }]
                        }
                    ],
                    "onEvent": {
                        "change": {
                            "actions": [
                                {
                                    "actionType": "custom",
                                    "script": async function(_, doAction, event){
                                        if(event.data.value == 1){
                                            // let res = await getAppDictData();
                                            // let dictVal = res.data?.data && res.data?.data[0]?.type || '';
                                            // let params = new URLSearchParams(window.location.search);
                                            // const appid = params.get('appid');
                                            // const env = params.get('env');
                                            // const dictType = dictVal;
                                            // const scope = 1;
                                            // const currentSearch = `?scope=${scope}&dictType=${dictType}&appid=${appid}&env=${env}`;
                                            // if (window.location.search !== currentSearch) {
                                            //       history.push(window.location.pathname + currentSearch);
                                            // }
                                        }
                                        if(event.data.value == 2){
                                            // let res = await getAdminDictData();
                                            // let dictVal = res.data?.data[0]?.type || '';
                                            // let params = new URLSearchParams(window.location.search);
                                            // const appid = params.get('appid');
                                            // const env = params.get('env');
                                            // const dictType = params.get('dictType');
                                            // const scope = 2;
                                            // let url = '/app/design/dataDict?scope='+scope+'&dictType='+dictType+'&appid='+appid+'&env='+env;
                                            // history.push(url)
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
            ]
        },
    ],
    "body": [{
        "type": "page",
        "body": {
            "type": "crud",
            "autoFillHeight": true,
            "id": "list_data_dict",
            "api": {
                "url": useDevBaseUrl("/app/dict-data${scope==1 ? '' : '/shared'}/page?pageNo=${page}&pageSize=${perPage}&dictType=${dictType}"),
                "sendOn": "this.dictType",
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
                    "label": "新增",
                    "level": "primary",
                    "actionType": "dialog",
                    'hiddenOn': 'this.scope==2',
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:create')}",
                    'disabledOn': "this.scope==1 && this.dictType == ''",
                    "dialog": {
                        "title": "新增字典数据",
                        "size": "md",
                        "body": {
                            "type": "form",
                            "initApi": {
                                "method": "get",
                                "url": useDevBaseUrl("/app/dict-type/list"),
                                adaptor: function (payload:any) {
                                    const params = new URLSearchParams(window.location.search);
                                    const dictType = params.get('dictType');
                                    let data = payload.data.filter(item=>item.type==dictType)
                                    return {
                                        ...payload,
                                        status: payload.code,
                                        data: { ...payload.data, dbType: data[0].dbType }
                                    };
                                }
                            },
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl("/app/dict-data/create"),
                                requestAdaptor: function (api:any) {
                                    const params = new URLSearchParams(window.location.search);
                                    const dictType = params.get('dictType');
                                    let label = api.data.label;
                                    let value = api.data.value;
                                    let sort = api.data.sort;
                                    let status = api.data.status;
                                    let remark = api.data.remark;
                                    return {
                                        ...api,
                                        data: {
                                            "dictType": dictType,
                                            "label": label,
                                            "value": value,
                                            "sort": sort,
                                            "status": status,
                                            "remark": remark,
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
                            "body": [
                            {
                                "type": "input-text",
                                "name": "label",
                                "label": "数据标签",
                                "required": "true",
                                "placeholder": "请输入数据标签",
                                "showCounter": true,
                                "maxLength": 100,
                            },
                            {
                                "type": "input-text",
                                "name": "value",
                                "label": "数据键值",
                                "required": "true",
                                "placeholder": "请输入数据键值",
                                "showCounter": true,
                                "maxLength": 100,
                                "visibleOn": "${dbType == 0}"
                            },
                            {
                                "type": "input-number",
                                "name": "value",
                                "label": "数据键值",
                                "required": "true",
                                "placeholder": "请输入数据键值",
                                "showCounter": true,
                                "maxLength": 100,
                                "visibleOn": "${dbType == 1}"
                            },
                            {
                                "type": "input-number",
                                "name": "sort",
                                "label": "显示排序",
                                "required": "true",
                                "placeholder": "请输入显示排序",
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
                                "type": "textarea",
                                "name": "remark",
                                "label": "备注",
                                "placeholder": "请输入备注",
                                "showCounter": true,
                                "maxLength": 500,
                            }
                            ]
                        }
                    }
                },
                "bulkActions",
            ],
            "keepItemSelectionOnPageChange": false,
            "bulkActions": [
                {
                    "label": "批量删除",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:delete')}",
                    "actionType": "ajax",
                    "level": "primary",
                    'hiddenOn': 'this.scope==2',
                    "api": {
                        "url": useDevBaseUrl("/app/dict-data/delete"),
                        "method": "post",
                        "data": "${ids|split}",
                    },
                    "onEvent": {
                        "click": {
                            "weight": 0,
                            "actions": [
                                {
                                    "componentId": "list_data_dict",
                                    "actionType": "reload",
                                }
                            ]
                        }
                    }
                },
                {
                    "label": "批量开启",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:update')}",
                    "actionType": "ajax",
                    "level": "primary",
                    'hiddenOn': 'this.scope==2',
                    "api": {
                        "url": useDevBaseUrl("/app/dict-data/enable/0"),
                        "method": "post",
                        "data": "${ids|split}"
                    },
                    "onEvent": {
                        "click": {
                            "weight": 0,
                            "actions": [
                                {
                                    "componentId": "list_data_dict",
                                    "actionType": "reload",
                                }
                            ]
                        }
                    }
                },
                {
                    "label": "批量关闭",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:update')}",
                    "actionType": "ajax",
                    "level": "primary",
                    'hiddenOn': 'this.scope==2',
                    "api": {
                        "url": useDevBaseUrl("/app/dict-data/enable/1"),
                        "method": "post",
                        "data": "${ids|split}"
                    },
                    "onEvent": {
                        "click": {
                            "weight": 0,
                            "actions": [
                                {
                                    "componentId": "list_data_dict",
                                    "actionType": "reload",
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
                    "name": "label",
                    "label": "数据标签"
                },
                {
                    "name": "value",
                    "label": "数据键值"
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
                    'hiddenOn': 'this.scope==2',
                    "buttons": [
                    {
                        "label": "编辑",
                        "type": "button",
                        "level": "link",
                        "actionType": "dialog",
                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:update')}",
                        "dialog": {
                            "title": "编辑字典数据",
                            "data": {
                                id: "${id}"
                            },
                            "body": [{
                                "type": "form",
                                "initApi": {
                                    "method": "get",
                                    "url": useDevBaseUrl("/app/dict-data/get?id=${id}"),
                                    adaptor: function (payload:any) {
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, dbType: payload.data?.dbType }
                                        };
                                    }
                                },
                                "api": {
                                    "method": "put",
                                    "url": useDevBaseUrl("/app/dict-data/update"),
                                    requestAdaptor: function (api:any) {
                                        const params = new URLSearchParams(window.location.search);
                                        const dictType = params.get('dictType');
                                        let id = api.data.id;
                                        let label = api.data.label;
                                        let value = api.data.value;
                                        let sort = api.data.sort;
                                        let status = api.data.status;
                                        let remark = api.data.remark;
                                        return {
                                            ...api,
                                            data: {
                                                "dictType": dictType,
                                                "id": id,
                                                "label": label,
                                                "value": value,
                                                "sort": sort,
                                                "status": status,
                                                "remark": remark,
                                            }
                                        };
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
                                        "name": "label",
                                        "label": "数据标签",
                                        "required": "true",
                                        "placeholder": "请输入数据标签",
                                        "showCounter": true,
                                        "maxLength": 100,
                                    },
                                    {
                                        "type": "input-text",
                                        "name": "value",
                                        "label": "数据键值",
                                        "required": "true",
                                        "placeholder": "请输入数据键值",
                                        "showCounter": true,
                                        "maxLength": 100,
                                        "disabled": true,
                                        "visibleOn": "${dbType == 0}"
                                    },
                                    {
                                        "type": "input-number",
                                        "name": "value",
                                        "label": "数据键值",
                                        "required": "true",
                                        "placeholder": "请输入数据键值",
                                        "showCounter": true,
                                        "maxLength": 100,
                                        "disabled": true,
                                        "visibleOn": "${dbType == 1}"
                                    },
                                    {
                                        "type": "input-number",
                                        "name": "sort",
                                        "label": "显示排序",
                                        "required": "true",
                                        "placeholder": "请输入显示排序",
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
                                        "type": "textarea",
                                        "name": "remark",
                                        "label": "备注",
                                        "placeholder": "请输入备注",
                                        "showCounter": true,
                                        "maxLength": 500,
                                    }
                                ]
                            }]
                        }
                    },
                    {
                        "label": "删除",
                        "type": "button",
                        "actionType": "ajax",
                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:delete')}",
                        "level": "link",
                        "confirmText": "确认要删除${value}吗？",
                        "api": {
                            "url": useDevBaseUrl("/app/dict-data/delete/${id}"),
                            "method": "delete"
                        },
                    }
                    ]
                }
            ]
        }
    }]
}

export default () => <AMISComponent schema={schema} />;
