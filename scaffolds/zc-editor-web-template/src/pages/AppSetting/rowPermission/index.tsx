import {filteredData, reverseTransformSelectAnyIn, transformSelectAnyIn} from "./conditionBuilder"
import {isAppEnd, isEditorialEnd} from '@/utils'
import {useDevBaseUrl} from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";

let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/rowPermission/page?tableKey=${tableKey}") : useDevBaseUrl("/app/rowPermission/page?tableKey=${tableKey}")
let newApi = isAppEnd() ? useDevBaseUrl("/application/app/rowPermission/create") : useDevBaseUrl("/app/rowPermission/create")
let conditionApi = isAppEnd() ? useDevBaseUrl("/application/entitymanage/table/getColumnSelect") : useDevBaseUrl("/entitymanage/table/getColumnSelect")
let editFormInitApi = isAppEnd() ? useDevBaseUrl("/application/app/rowPermission/get") : useDevBaseUrl("/app/rowPermission/get")
let editFormApi = isAppEnd() ? useDevBaseUrl("/application/app/rowPermission/update") : useDevBaseUrl("/app/rowPermission/update")
let deleFormApi = isAppEnd() ? useDevBaseUrl("/application/app/rowPermission/delete") : useDevBaseUrl("/app/rowPermission/delete")
import { history } from '@umijs/max';
import DeleteRecord from '@/pages/AppSetting/rowPermission/condition';
const params = new URLSearchParams(window.location.search);
const env = params.get('env');
const showCommonFlag = (env != 1 || isAppEnd() )? false : true
const editorialEndEnv = (env ==1 && isEditorialEnd()) ? true : false
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": crudApi,
                "sendOn": "${tableKey}",
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "perName": "${perName|default:undefined}",
                    // "tableKey": "${tableKey}",
                },
                adaptor: function (payload: any) {
                    let list = payload?.data?.list ? payload?.data?.list : []
                    for (let i in list) {
                        if (list[i].usersList.length < 1) {
                            list[i].usersList.push(
                                {
                                    nickname: '所有用户'
                                }
                            )
                        }
                    }
                    const params = new URLSearchParams(window.location.search)
                    let dataMod = params.get('dataMod');
                    if(payload?.data) {
                        payload.data.breadcrumb = [
                            {
                                "label": "",
                                // "href": isAppEnd() ? "../app/appPermissions?appid=" + params.get('appid') + "&env=" + params.get('env') + '&backspace=1' : "../design/appPermissions?appid=" + params.get('appid') + "&env=" + params.get('env') + '&backspace=1',
                            },
                            {
                                "label": "《" + dataMod + "》行权限",
                            }
                        ]
                    }
                    if(payload?.data?.list) {
                        payload.data.list = list
                    }
                    return payload
                },
            },
            "headerToolbar": [
                {
                    "label": "数据权限",
                    "type": "button",
                    "level": "link",
                    "className": "p-0",
                    "onEvent": {
                        "click": {
                            "actions": [
                                {
                                    "actionType": "custom",
                                    "script": (context, doAction, event) => {
                                        history.push(`${isAppEnd() ? '/app/appPermissions' : '/app/design/appPermissions'}`)
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "type": "breadcrumb",
                    'itemClassName': 'text-info',
                    "source": "${breadcrumb ?breadcrumb:[]}"
                },
                {
                    "type": "reload",
                    "align": "right",
                },
                {
                    "type": "search-box",
                    "name": "perName",
                    "align": "right",
                    "clearable": true,
                    "placeholder": "关键字检索",
                    "size": "sm"
                },
                {
                    "type": "button",
                    "icon": "fa fa-plus",
                    "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:rowPermission:create')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:rowPermission:create')}",
                    "align": "right",
                    "label": "新增",
                    "level": "primary",
                    "actionType": "dialog",
                    "dialog": {
                        "title": "新增行权限",
                        "body": {
                            "type": "form",
                            "name": "detailForm",
                            "api": {
                                "method": "post",
                                "url": newApi,
                                "data": {
                                    "tableKey": "${tableKey}",
                                    "perName": "${perName}",
                                    "filterCondition": "${filterCondition}",
                                    "accessibleUsers": "${accessibleUsers|split}",
                                    "perContent": "${perContent|toInt}",
                                    "describe": "${describe}",
                                    "perType": "${perType}"
                                },
                                "requestAdaptor": function (api, context) {
                                    let da = api.data
                                    if (da.accessibleUsers.length == 1 && da.accessibleUsers[0] == 'all') {
                                        da.accessibleUsers = []
                                    }
                                    api.data.filterCondition = transformSelectAnyIn(api.data.filterCondition)
                                    return api
                                }
                            },
                            "body": [
                                {
                                    "type": "input-text",
                                    "name": "perName",
                                    "label": "权限名称",
                                    "required": true,
                                },
                                {
                                    "name": "filterCondition",
                                    "type": "button-toolbar",
                                    "label": "数据筛选",
                                    "inputClassName": "w-full",
                                    "buttons": [
                                        {
                                            "type": "action",
                                            "label": "${filterCondition.id?'已配置条件':'点击设置条件'}",
                                            "block": true,
                                            "actionType": "dialog",
                                            "dialog": {
                                                "title": "条件设置",
                                                "size": "lg",
                                                "body": {
                                                    "type": "form",
                                                    "target": "detailForm",
                                                    "body": [
                                                        {
                                                            "name": "filterCondition",
                                                            "asFormItem": true,
                                                            "children": (data) => (
                                                                <DeleteRecord data={data} />
                                                            )
                                                        }
                                                        // {
                                                        //     "type": "condition-builder",
                                                        //     "label": "条件组件",
                                                        //     "name": "filterCondition",
                                                        //     "source": {
                                                        //         "method": "get",
                                                        //         "url": conditionApi,
                                                        //         "data": {
                                                        //             "tableKey": "${tableKey}",
                                                        //         },
                                                        //         adaptor: function (payload: any) {
                                                        //             let da = payload.data
                                                        //             let arr = []
                                                        //             let filtrationList = [6, 7, 8]
                                                        //             for (let i in da) {
                                                        //                 let obj = filtrationList.indexOf(da[i].systemFieldType) != -1 ? undefined : filteredData(da[i])
                                                        //                 if (obj != undefined) {
                                                        //                     arr.push(obj)
                                                        //                 }
                                                        //             }
                                                        //             return {
                                                        //                 fields: arr,
                                                        //                 code: 0,
                                                        //                 msg: ''
                                                        //             }
                                                        //         }
                                                        //     }
                                                        // }
                                                    ]
                                                },
                                                "actions": [
                                                    {
                                                        "type": "action",
                                                        "actionType": "cancel",
                                                        "label": "取消",
                                                    },
                                                    {
                                                        "type": "submit",
                                                        "level": "primary",
                                                        "label": "确认",
                                                    },
                                                ],
                                            }
                                        },
                                    ]
                                },
                                {
                                    "type": "select",
                                    "name": "accessibleUsers",
                                    "label": "授权对象",
                                    "maxTagCount": 4,
                                    "required": true,
                                    "multiple": true,
                                    // "checkAll": true,
                                    "searchable": true,
                                    "checkAllLabel": "所有用户",
                                    "labelField": "nickname",
                                    "valueField": "id",
                                    "source": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/system/user/list-all-simple"),
                                        adaptor: function (payload: any) {
                                            payload.data.unshift(
                                                {
                                                    id: "all",
                                                    nickname: "所有用户"
                                                }
                                            )
                                            return payload.data
                                        }
                                    },
                                    "onEvent": {
                                        "change": {
                                            "actions": [
                                                {
                                                    "actionType": "custom",
                                                    "script": (context, doAction, event) => {
                                                        let accessibleUsers = ""
                                                        let da = event.data
                                                        if (da.selectedItems.length) {
                                                            if (da.selectedItems[da.selectedItems.length - 1].id == "all") {
                                                                doAction({
                                                                    "actionType": "setValue",
                                                                    "componentName": "detailForm",
                                                                    "args": {
                                                                        "value": {
                                                                            "accessibleUsers": "all",
                                                                        }
                                                                    },
                                                                    "preventDefault": true
                                                                })
                                                            } else if (da.selectedItems.length > 1 && da.value.includes('all')) {
                                                                let list = da.value.split(',').filter(item => item != 'all')
                                                                doAction({
                                                                    "actionType": "setValue",
                                                                    "componentName": "detailForm",
                                                                    "args": {
                                                                        "value": {
                                                                            "accessibleUsers": list.join(','),
                                                                        }
                                                                    },
                                                                    "preventDefault": true
                                                                })
                                                            }
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                },
                                {
                                    "type": "checkboxes",
                                    "name": "perContent",
                                    "required": true,
                                    "label": "权限内容",
                                    "options": [
                                        {
                                            "label": "查看",
                                            "value": 1
                                        },
                                    ]
                                },
                                {
                                    "name": "perType",
                                    "type": "radios",
                                    "label": "权限类型",
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
                                    "type": "textarea",
                                    "name": "describe",
                                    "label": "权限描述",
                                    "showCounter": true,
                                    "maxLength": 50,
                                }
                            ]
                        }
                    }
                },
            ],
            "columns": [
                {
                    "name": "perName",
                    "label": "权限名称",
                },
                {
                    "name": "describe",
                    "label": "描述",
                },
                {
                    "name": "usersList",
                    "label": "应用规则",
                    "type": "each",
                    "items": {
                        "type": "tag",
                        "label": '${nickname}',
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
                            "visible": editorialEndEnv,
                            "dialog": {
                                "title": "编辑",
                                "actions": [
                                    {
                                        "label": "取消",
                                        "actionType": "close",
                                        "type": "button"
                                    },
                                    {
                                        "label": "确认",
                                        "actionType": "submit",
                                        "primary": true,
                                        "type": "button",
                                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:rowPermission:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:rowPermission:update')}",
                                    }
                                ],
                                "body": [{
                                    "type": "form",
                                    "id": "editForm",
                                    "initApi": {
                                        "method": "get",
                                        "url": editFormInitApi,
                                        "data": {
                                            "id": "${id}",
                                        },
                                        adaptor: function (payload: any) {
                                            if (payload?.data?.perContent) {
                                                payload.data.perContent = payload?.data?.perContent?.toString()
                                            }
                                            if (payload?.data?.accessibleUsers) {
                                                payload.data.accessibleUsers = payload?.data?.accessibleUsers?.join()
                                            }
                                            if (payload?.data?.accessibleUsers?.length == 0) {
                                                payload.data.accessibleUsers = 'all'
                                            }
                                            if (payload?.data?.filterCondition) {
                                                payload.data.filterCondition = reverseTransformSelectAnyIn(payload.data.filterCondition)
                                            }
                                            return payload
                                        }
                                    },
                                    "api": {
                                        "method": "put",
                                        "url": editFormApi,
                                        "data": {
                                            "id": "${id}",
                                            "tableKey": "${tableKey}",
                                            "perName": "${perName}",
                                            "filterCondition": "${filterCondition}",
                                            "accessibleUsers": "${accessibleUsers|split}",
                                            "perContent": "${perContent|toInt}",
                                            "describe": "${describe}",
                                            "perType": "${perType}"
                                        },
                                        "requestAdaptor": function (api, context) {
                                            let da = api.data
                                            if (da.accessibleUsers.length == 1 && da.accessibleUsers[0] == 'all') {
                                                da.accessibleUsers = []
                                            }
                                            api.data.filterCondition = transformSelectAnyIn(api.data.filterCondition)
                                            return api
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "input-text",
                                            "name": "perName",
                                            "label": "权限名称",
                                            "required": true,
                                        },
                                        {
                                            "name": "filterCondition",
                                            "type": "button-toolbar",
                                            "label": "数据筛选",
                                            "inputClassName": "w-full",
                                            "buttons": [
                                                {
                                                    "type": "action",
                                                    "label": "${filterCondition.id?'已配置条件':'点击设置条件'}",
                                                    "block": true,
                                                    "actionType": "dialog",
                                                    "dialog": {
                                                        "title": "条件设置",
                                                        "size": "lg",
                                                        "actions": [
                                                            {
                                                                "type": "action",
                                                                "actionType": "cancel",
                                                                "label": "取消",
                                                            },
                                                            {
                                                                "type": "submit",
                                                                "level": "primary",
                                                                "label": "确认",
                                                                "onEvent": {
                                                                    "click": {
                                                                        "actions": [
                                                                            {
                                                                                "actionType": "setValue",
                                                                                "componentId": "editForm",
                                                                                "args": {
                                                                                    "value": {
                                                                                        "filterCondition": "${filterCondition}",
                                                                                    }
                                                                                }
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                        ],
                                                        "body": {
                                                            "type": "form",
                                                            "name": "otherForm",
                                                            // "target": "editForm",
                                                            "body": [
                                                                {
                                                                    "name": "filterCondition",
                                                                    "asFormItem": true,
                                                                    "children": (data) => (
                                                                        <DeleteRecord data={data} />
                                                                    )
                                                                }
                                                                // {
                                                                //     "type": "condition-builder",
                                                                //     "label": false,
                                                                //     "name": "filterCondition",
                                                                //     "source": {
                                                                //         "method": "get",
                                                                //         "url": conditionApi,
                                                                //         "data": {
                                                                //             "tableKey": "${tableKey}",
                                                                //         },
                                                                //         adaptor: function (payload: any) {
                                                                //
                                                                //             let da = payload.data
                                                                //
                                                                //             let arr = []
                                                                //             for (let i in da) {
                                                                //                 let obj = filteredData(da[i])
                                                                //                 if (obj != undefined) {
                                                                //                     arr.push(obj)
                                                                //                 }
                                                                //             }
                                                                //             return {
                                                                //                 fields: arr,
                                                                //             }
                                                                //         }
                                                                //     }
                                                                // }
                                                            ]
                                                        }
                                                    }
                                                },
                                            ]
                                        },
                                        {
                                            "type": "select",
                                            "name": "accessibleUsers",
                                            "label": "授权对象",
                                            "maxTagCount": 4,
                                            "required": true,
                                            "multiple": true,
                                            // "checkAll": true,
                                            "searchable": true,
                                            "checkAllLabel": "所有用户",
                                            "labelField": "nickname",
                                            "valueField": "id",
                                            "defaultCheckAll": "${userAll}",
                                            "source": {
                                                "method": "get",
                                                "url": useDevBaseUrl("/system/user/list-all-simple"),
                                                adaptor: function (payload: any) {
                                                    payload.data.unshift(
                                                        {
                                                            id: "all",
                                                            nickname: "所有用户"
                                                        }
                                                    )
                                                    return payload.data
                                                }
                                            },
                                            "onEvent": {
                                                "change": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            "script": (context, doAction, event) => {
                                                                let accessibleUsers = ""
                                                                let da = event.data
                                                                if (da.selectedItems.length) {
                                                                    if (da.selectedItems[da.selectedItems.length - 1].id == "all") {
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentId": "editForm",
                                                                            "args": {
                                                                                "value": {
                                                                                    "accessibleUsers": "all",
                                                                                }
                                                                            },
                                                                            "preventDefault": true
                                                                        })
                                                                    } else if (da.selectedItems.length > 1 && da.value.includes('all')) {
                                                                        let list = da.value.split(',').filter(item => item != 'all')
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentId": "editForm",
                                                                            "args": {
                                                                                "value": {
                                                                                    "accessibleUsers": list.join(','),
                                                                                }
                                                                            },
                                                                            "preventDefault": true
                                                                        })
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            "type": "checkboxes",
                                            "required": true,
                                            "name": "perContent",
                                            "label": "权限内容",
                                            "options": [
                                                {
                                                    "label": "查看",
                                                    "value": 1
                                                },
                                            ]
                                        },
                                        {
                                            "name": "perType",
                                            "type": "radios",
                                            "label": "权限类型",
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
                                            "type": "textarea",
                                            "name": "describe",
                                            "label": "权限描述",
                                            "showCounter": true,
                                            "maxLength": 50,
                                        }
                                    ]
                                }]
                            }
                        },
                        {
                            "label": "编辑",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "visibleOn": isAppEnd() ? "${perType == 2}" : "${false}",
                            "dialog": {
                                "title": "编辑",
                                "actions": [
                                    {
                                        "label": "取消",
                                        "actionType": "close",
                                        "type": "button"
                                    },
                                    {
                                        "label": "确认",
                                        "actionType": "submit",
                                        "primary": true,
                                        "type": "button",
                                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:rowPermission:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:rowPermission:update')}",
                                    }
                                ],
                                "body": [{
                                    "type": "form",
                                    "id": "editForm",
                                    "initApi": {
                                        "method": "get",
                                        "url": editFormInitApi,
                                        "data": {
                                            "id": "${id}",
                                        },
                                        adaptor: function (payload: any) {
                                            if (payload?.data?.perContent) {
                                                payload.data.perContent = payload?.data?.perContent?.toString()
                                            }
                                            if (payload?.data?.accessibleUsers) {
                                                payload.data.accessibleUsers = payload?.data?.accessibleUsers?.join()
                                            }
                                            if (payload?.data?.accessibleUsers?.length == 0) {
                                                payload.data.accessibleUsers = 'all'
                                            }
                                            if (payload?.data?.filterCondition) {
                                                payload.data.filterCondition = reverseTransformSelectAnyIn(payload.data.filterCondition)
                                            }
                                            return payload
                                        }
                                    },
                                    "api": {
                                        "method": "put",
                                        "url": editFormApi,
                                        "data": {
                                            "id": "${id}",
                                            "tableKey": "${tableKey}",
                                            "perName": "${perName}",
                                            "filterCondition": "${filterCondition}",
                                            "accessibleUsers": "${accessibleUsers|split}",
                                            "perContent": "${perContent|toInt}",
                                            "describe": "${describe}",
                                            "perType": "${perType}"
                                        },
                                        "requestAdaptor": function (api, context) {
                                            let da = api.data
                                            if (da.accessibleUsers.length == 1 && da.accessibleUsers[0] == 'all') {
                                                da.accessibleUsers = []
                                            }
                                            api.data.filterCondition = transformSelectAnyIn(api.data.filterCondition)
                                            return api
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "input-text",
                                            "name": "perName",
                                            "label": "权限名称",
                                            "required": true,
                                        },
                                        {
                                            "name": "filterCondition",
                                            "type": "button-toolbar",
                                            "label": "数据筛选",
                                            "inputClassName": "w-full",
                                            "buttons": [
                                                {
                                                    "type": "action",
                                                    "label": "${filterCondition.id?'已配置条件':'点击设置条件'}",
                                                    "block": true,
                                                    "actionType": "dialog",
                                                    "dialog": {
                                                        "title": "条件设置",
                                                        "size": "lg",
                                                        "actions": [
                                                            {
                                                                "type": "action",
                                                                "actionType": "cancel",
                                                                "label": "取消",
                                                            },
                                                            {
                                                                "type": "submit",
                                                                "level": "primary",
                                                                "label": "确认",
                                                                "onEvent": {
                                                                    "click": {
                                                                        "actions": [
                                                                            {
                                                                                "actionType": "setValue",
                                                                                "componentId": "editForm",
                                                                                "args": {
                                                                                    "value": {
                                                                                        "filterCondition": "${filterCondition}",
                                                                                    }
                                                                                }
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                        ],
                                                        "body": {
                                                            "type": "form",
                                                            "name": "otherForm",
                                                            // "target": "editForm",
                                                            "body": [
                                                                {
                                                                    "name": "filterCondition",
                                                                    "asFormItem": true,
                                                                    "children": (data) => (
                                                                        <DeleteRecord data={data} />
                                                                    )
                                                                }
                                                                // {
                                                                //     "type": "condition-builder",
                                                                //     "label": false,
                                                                //     "name": "filterCondition",
                                                                //     "source": {
                                                                //         "method": "get",
                                                                //         "url": conditionApi,
                                                                //         "data": {
                                                                //             "tableKey": "${tableKey}",
                                                                //         },
                                                                //         adaptor: function (payload: any) {
                                                                //
                                                                //             let da = payload.data
                                                                //
                                                                //             let arr = []
                                                                //             for (let i in da) {
                                                                //                 let obj = filteredData(da[i])
                                                                //                 if (obj != undefined) {
                                                                //                     arr.push(obj)
                                                                //                 }
                                                                //             }
                                                                //             return {
                                                                //                 fields: arr,
                                                                //             }
                                                                //         }
                                                                //     }
                                                                // }
                                                            ]
                                                        }
                                                    }
                                                },
                                            ]
                                        },
                                        {
                                            "type": "select",
                                            "name": "accessibleUsers",
                                            "label": "授权对象",
                                            "maxTagCount": 4,
                                            "required": true,
                                            "multiple": true,
                                            // "checkAll": true,
                                            "searchable": true,
                                            "checkAllLabel": "所有用户",
                                            "labelField": "nickname",
                                            "valueField": "id",
                                            "defaultCheckAll": "${userAll}",
                                            "source": {
                                                "method": "get",
                                                "url": useDevBaseUrl("/system/user/list-all-simple"),
                                                adaptor: function (payload: any) {
                                                    payload.data.unshift(
                                                        {
                                                            id: "all",
                                                            nickname: "所有用户"
                                                        }
                                                    )
                                                    return payload.data
                                                }
                                            },
                                            "onEvent": {
                                                "change": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            "script": (context, doAction, event) => {
                                                                let accessibleUsers = ""
                                                                let da = event.data
                                                                if (da.selectedItems.length) {
                                                                    if (da.selectedItems[da.selectedItems.length - 1].id == "all") {
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentId": "editForm",
                                                                            "args": {
                                                                                "value": {
                                                                                    "accessibleUsers": "all",
                                                                                }
                                                                            },
                                                                            "preventDefault": true
                                                                        })
                                                                    } else if (da.selectedItems.length > 1 && da.value.includes('all')) {
                                                                        let list = da.value.split(',').filter(item => item != 'all')
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentId": "editForm",
                                                                            "args": {
                                                                                "value": {
                                                                                    "accessibleUsers": list.join(','),
                                                                                }
                                                                            },
                                                                            "preventDefault": true
                                                                        })
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            "type": "checkboxes",
                                            "required": true,
                                            "name": "perContent",
                                            "label": "权限内容",
                                            "options": [
                                                {
                                                    "label": "查看",
                                                    "value": 1
                                                },
                                            ]
                                        },
                                        {
                                            "name": "perType",
                                            "type": "radios",
                                            "label": "权限类型",
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
                                            "type": "textarea",
                                            "name": "describe",
                                            "label": "权限描述",
                                            "showCounter": true,
                                            "maxLength": 50,
                                        }
                                    ]
                                }]
                            }
                        },
                        {
                            "label": "详情",
                            "type": "button",
                            "level": "link",
                            "visible": !showCommonFlag,
                            "actionType": "dialog",
                            "dialog": {
                                "title": "详情",
                                "actions": [
                                    // {
                                    //     "label": "取消",
                                    //     "actionType": "close",
                                    //     "type": "button"
                                    // },
                                    {
                                        "label": "关闭",
                                        "actionType": "close",
                                        "level": "default",
                                        "type": "button",
                                    }
                                ],
                                "body": [{
                                    "type": "form",
                                    "id": "editForm",
                                    "initApi": {
                                        "method": "get",
                                        "url": editFormInitApi,
                                        "data": {
                                            "id": "${id}",
                                        },
                                        adaptor: function (payload: any) {
                                            if (payload?.data?.perContent) {
                                                payload.data.perContent = payload?.data?.perContent?.toString()
                                            }
                                            if (payload?.data?.accessibleUsers) {
                                                payload.data.accessibleUsers = payload?.data?.accessibleUsers?.join()
                                            }
                                            if (payload?.data?.accessibleUsers?.length == 0) {
                                                payload.data.accessibleUsers = 'all'
                                            }
                                            if (payload?.data?.filterCondition) {
                                                payload.data.filterCondition = reverseTransformSelectAnyIn(payload.data.filterCondition)
                                            }
                                            return payload
                                        }
                                    },
                                    // "api": {
                                    //     "method": "put",
                                    //     "url": editFormApi,
                                    //     "data": {
                                    //         "id": "${id}",
                                    //         "tableKey": "${tableKey}",
                                    //         "perName": "${perName}",
                                    //         "filterCondition": "${filterCondition}",
                                    //         "accessibleUsers": "${accessibleUsers|split}",
                                    //         "perContent": "${perContent|toInt}",
                                    //         "describe": "${describe}",
                                    //         "perType": "${perType}"
                                    //     },
                                    //     "requestAdaptor": function (api, context) {
                                    //         let da = api.data
                                    //         if (da.accessibleUsers.length == 1 && da.accessibleUsers[0] == 'all') {
                                    //             da.accessibleUsers = []
                                    //         }
                                    //         api.data.filterCondition = transformSelectAnyIn(api.data.filterCondition)
                                    //         return api
                                    //     }
                                    // },
                                    "body": [
                                        {
                                            "type": "input-text",
                                            "name": "perName",
                                            "label": "权限名称",
                                            "required": true,
                                            "static": true,
                                        },
                                        {
                                            "name": "filterCondition",
                                            "type": "button-toolbar",
                                            "label": "数据筛选",
                                            "inputClassName": "w-full",
                                            "buttons": [
                                                {
                                                    "type": "action",
                                                    "label": "${filterCondition.id?'已配置条件':'点击设置条件'}",
                                                    "block": true,
                                                    "actionType": "dialog",
                                                    "dialog": {
                                                        "title": "条件设置",
                                                        "size": "lg",
                                                        "actions": [
                                                            {
                                                                "label": "关闭",
                                                                "actionType": "close",
                                                                "level": "default",
                                                                "type": "button",
                                                            },
                                                            // {
                                                            //     "type": "action",
                                                            //     "actionType": "cancel",
                                                            //     "label": "取消",
                                                            // },
                                                            // {
                                                            //     "type": "submit",
                                                            //     "level": "primary",
                                                            //     "label": "确认",
                                                            //     "onEvent": {
                                                            //         "click": {
                                                            //             "actions": [
                                                            //                 {
                                                            //                     "actionType": "setValue",
                                                            //                     "componentId": "editForm",
                                                            //                     "args": {
                                                            //                         "value": {
                                                            //                             "filterCondition": "${filterCondition}",
                                                            //                         }
                                                            //                     }
                                                            //                 }
                                                            //             ]
                                                            //         }
                                                            //     }
                                                            // },
                                                        ],
                                                        "body": {
                                                            "type": "form",
                                                            "name": "otherForm",
                                                            // "target": "editForm",
                                                            "body": [
                                                                {
                                                                    "name": "filterCondition",
                                                                    "asFormItem": true,
                                                                    "children": (data) => (
                                                                        <DeleteRecord data={data} />
                                                                    )
                                                                }
                                                                // {
                                                                //     "type": "condition-builder",
                                                                //     "label": false,
                                                                //     "name": "filterCondition",
                                                                //     "source": {
                                                                //         "method": "get",
                                                                //         "url": conditionApi,
                                                                //         "data": {
                                                                //             "tableKey": "${tableKey}",
                                                                //         },
                                                                //         adaptor: function (payload: any) {
                                                                //
                                                                //             let da = payload.data
                                                                //
                                                                //             let arr = []
                                                                //             for (let i in da) {
                                                                //                 let obj = filteredData(da[i])
                                                                //                 if (obj != undefined) {
                                                                //                     arr.push(obj)
                                                                //                 }
                                                                //             }
                                                                //             return {
                                                                //                 fields: arr,
                                                                //             }
                                                                //         }
                                                                //     }
                                                                // }
                                                            ]
                                                        }
                                                    }
                                                },
                                            ]
                                        },
                                        {
                                            "type": "select",
                                            "name": "accessibleUsers",
                                            "label": "授权对象",
                                            "maxTagCount": 4,
                                            "required": true,
                                            "multiple": true,
                                            // "checkAll": true,
                                            "searchable": true,
                                            "checkAllLabel": "所有用户",
                                            "labelField": "nickname",
                                            "valueField": "id",
                                            "defaultCheckAll": "${userAll}",
                                            "static": true,
                                            "source": {
                                                "method": "get",
                                                "url": useDevBaseUrl("/system/user/list-all-simple"),
                                                adaptor: function (payload: any) {
                                                    payload.data.unshift(
                                                        {
                                                            id: "all",
                                                            nickname: "所有用户"
                                                        }
                                                    )
                                                    return payload.data
                                                }
                                            },
                                            "onEvent": {
                                                "change": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            "script": (context, doAction, event) => {
                                                                let accessibleUsers = ""
                                                                let da = event.data
                                                                if (da.selectedItems.length) {
                                                                    if (da.selectedItems[da.selectedItems.length - 1].id == "all") {
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentId": "editForm",
                                                                            "args": {
                                                                                "value": {
                                                                                    "accessibleUsers": "all",
                                                                                }
                                                                            },
                                                                            "preventDefault": true
                                                                        })
                                                                    } else if (da.selectedItems.length > 1 && da.value.includes('all')) {
                                                                        let list = da.value.split(',').filter(item => item != 'all')
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentId": "editForm",
                                                                            "args": {
                                                                                "value": {
                                                                                    "accessibleUsers": list.join(','),
                                                                                }
                                                                            },
                                                                            "preventDefault": true
                                                                        })
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            "type": "checkboxes",
                                            "required": true,
                                            "name": "perContent",
                                            "label": "权限内容",
                                            "static": true,
                                            "options": [
                                                {
                                                    "label": "查看",
                                                    "value": 1
                                                },
                                            ]
                                        },
                                        {
                                            "name": "perType",
                                            "type": "radios",
                                            "label": "权限类型",
                                            "static": true,
                                            "required": true,
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
                                            "type": "textarea",
                                            "name": "describe",
                                            "label": "权限描述",
                                            "static": true,
                                            "showCounter": true,
                                            "maxLength": 50,
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
                            "disabledOn": isAppEnd() ? "${perType == 1}" : "${false}",
                            "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:rowPermission:delete')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:rowPermission:delete')}",
                            "confirmText": "确认要删除${perName}吗？",
                            "api": {
                                "url": deleFormApi,
                                "method": "delete",
                                "data": {
                                    "id": "${id}",
                                }
                            },
                        }
                    ],
                },
            ],
            "footerToolbar": [
                "statistics",
                "switch-per-page",
                "pagination"
            ],
        }
    ]
}

export default () => <AMISComponent schema={schema} />;
