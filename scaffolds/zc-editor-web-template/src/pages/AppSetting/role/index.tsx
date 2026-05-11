import User from "./component/user"
import {isAppEnd} from '@/utils/index'
import {service} from '@/utils/request'
import {getSchemaTpl} from 'amis-editor'
import {useDevBaseUrl, useAdminBaseUrl} from "@/utils/util"
import {toast} from 'amis';
import {AMISComponent} from "@/hooks/amis";

let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/role/page") : useDevBaseUrl("/app/role/page")
let addApi = isAppEnd() ? useDevBaseUrl("/application/app/role/create") : useDevBaseUrl("/app/role/create")
let initEditApi = isAppEnd() ? useDevBaseUrl("/application/app/role/get?id=${id}") : useDevBaseUrl("/app/role/get?id=${id}")
let editApi = isAppEnd() ? useDevBaseUrl("/application/app/role/update") : useDevBaseUrl("/app/role/update")
let initMemberListApi = isAppEnd() ? useDevBaseUrl("/application/app/role/getRoleMember?id=${id}") : useDevBaseUrl("/app/role/getRoleMember?id=${id}")
let createUserApi = isAppEnd() ? useDevBaseUrl("/application/app/role/createRoleAssociation") : useDevBaseUrl("/app/role/createRoleAssociation")
let allDelApi = isAppEnd() ? useDevBaseUrl("/application/app/role/deleteRoleAssociation") : useDevBaseUrl("/app/role/deleteRoleAssociation")
let delRoleApi = isAppEnd() ? useDevBaseUrl("/application/app/role/delete?id=${id}") : useDevBaseUrl("/app/role/delete?id=${id}")
const schema = {
    "type": "page",
    "body": [{
        "type": "crud",
        "syncLocation": false,
        "autoFillHeight": true,
        "api": {
            "method": "get",
            "url": crudApi,
            "data": {
                "pageNo": "${page}",
                "pageSize": "${perPage}",
                "name": "${name}",
            },
            adaptor: function (payload: any) {
                return {
                    ...payload,
                    status: payload.code,
                    data: {...payload.data, items: payload?.data?.list ? payload.data.list : []}
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
                "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:role:create')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:role:create')}",
                "align": "left",
                "label": "新增角色",
                "level": "primary",
                "actionType": "dialog",
                "dialog": {
                    "title": "新增角色",
                    "body": {
                        "type": "form",
                        "initApi": {
                            "url": useDevBaseUrl("/app/info/context"),
                            "method": "get",
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: {...payload.data, appName: payload.data.zcApp.name}
                                };
                            }
                        },
                        "api": {
                            "method": "post",
                            "url": addApi,
                            "data": {
                                "name": "${name}",
                                "code": "${code}",
                                "remark": "${remark}",
                                "status": "${status}",
                                "defaultRole": 0,
                            },
                        },
                        "body": [
                            {
                                "type": "input-text",
                                "name": "name",
                                "label": "名称",
                                "addOn": {
                                    "type": "button",
                                    "label": "${appName}" + "-",
                                    "position": "left"
                                },
                                "showCounter": true,
                                "maxLength": 50,
                                "required": true,
                            },
                            {
                                "type": "input-text",
                                "name": "code",
                                "label": "编码",
                                "showCounter": true,
                                "maxLength": 100,
                                "required": true,
                                "validations": {
                                    "matchRegexp": "^[a-zA-Z_][A-Za-z_]*$"
                                },
                                "validationErrors": {
                                    "matchRegexp": "编码只能包含字母、下划线"
                                }
                            },
                            {
                                "type": "textarea",
                                "name": "remark",
                                "label": "描述",
                                "placeholder": "请输入描述信息",
                                "showCounter": true,
                                "maxLength": 50,
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
        "autoGenerateFilter": true,
        "alwaysShowPagination": true,
        "columns": [
            {
                "name": "name",
                "label": "名称",
                "searchable": {
                    "type": "input-text",
                    "name": "name",
                    "label": "名称",
                    "clearable": true,
                    "placeholder": '请输入名称',
                    "size": 'sm'
                }
            },
            {
                "name": "remark",
                "label": "描述"
            },
            {
                "name": "status",
                "label": "状态",
                "type": 'mapping',
                "map": {
                    '0': "<span>开启</span>",
                    '1': "<span>关闭</span>",
                },
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
                        "disabledOn": "${defaultRole == 1}",
                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:role:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:role:update')}",
                        "dialog": {
                            "title": "编辑角色【${name}】",
                            "data": {
                                id: "${id}"
                            },
                            "body": [{
                                "type": "form",
                                "initApi": initEditApi,
                                "api": {
                                    "method": "put",
                                    "url": editApi,
                                    "data": {
                                        "id": "${id}",
                                        "name": "${name}",
                                        "code": "${code}",
                                        "remark": "${remark}",
                                        "status": "${status}"
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
                                        "label": "名称",
                                        "addOn": {
                                            "type": "button",
                                            "label": "${appName}" + "-",
                                            "position": "left"
                                        },
                                        "showCounter": true,
                                        "maxLength": 50,
                                        "required": true,
                                    },
                                    {
                                        "type": "input-text",
                                        "name": "code",
                                        "label": "编码",
                                        "showCounter": true,
                                        "maxLength": 100,
                                        "required": true,
                                        "disabled": true,
                                        "validations": {
                                            "matchRegexp": "^[a-zA-Z_][A-Za-z_]*$"
                                        },
                                        "validationErrors": {
                                            "matchRegexp": "编码只能包含字母、下划线"
                                        }
                                    },
                                    {
                                        "type": "textarea",
                                        "name": "remark",
                                        "label": "描述",
                                        "placeholder": "请输入描述信息",
                                        "showCounter": true,
                                        "maxLength": 50,
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
                                ]
                            }]
                        }
                    },
                    {
                        "label": "成员管理",
                        "type": "button",
                        "level": "link",
                        "actionType": "drawer",
                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:role:member')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:role:member')}",
                        "drawer": {
                            "position": "right",
                            "title": "「${name}」成员管理",
                            "body": [
                                {
                                    "type": "tabs",
                                    "name": "tabs_member",
                                    "tabsMode": "card",
                                    "tabs": [
                                        {
                                            "title": "用户",
                                            "reload": true,
                                            "tab": [{
                                                "type": "crud",
                                                "syncLocation": false,
                                                "autoFillHeight": true,
                                                "id": "list_user",
                                                "api": {
                                                    "method": "get",
                                                    "url": initMemberListApi,
                                                    // "data": {
                                                    //     "pageNo": "${page}",
                                                    //     "pageSize": "${perPage}",
                                                    // },
                                                    adaptor: function (payload: any, response: any, api: any, context: any) {
                                                        let userId = payload?.data?.adminUserList?.map(i => i.id)
                                                        return {
                                                            ...payload,
                                                            status: payload.code,
                                                            data: {
                                                                ...payload?.data,
                                                                items: payload?.data?.adminUserList ? payload?.data?.adminUserList : [],
                                                                selectUser: payload?.data?.adminUserList ? payload?.data?.adminUserList : [],
                                                                userId: userId
                                                            }
                                                        };
                                                    },
                                                },
                                                "headerToolbar": [
                                                    {
                                                        "type": "container",
                                                        "wrapWithPanel": false,
                                                        "body": [
                                                            getSchemaTpl('deptUserSelect', {
                                                                label: false,
                                                                isAdd: true,
                                                                "dialogTitle": "新增用户",
                                                                "deptApi": useDevBaseUrl("/system/dept/all_list"), //部门Api
                                                                "userApi": useDevBaseUrl("/system/user/all_page"), //人员Api
                                                                btCustom: {
                                                                    "icon": "fa fa-plus",
                                                                    "level": "primary",
                                                                    label: '新增用户',
                                                                    "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:role:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:role:update')}",
                                                                },
                                                                onDataChange: async (action: object, event: object, data: any): void => {
                                                                    let dataParams = {
                                                                        roleId: event?.data?.id,
                                                                        userIdList: data
                                                                    }
                                                                    const res = await service({
                                                                        url: createUserApi,
                                                                        method: 'post',
                                                                        data: dataParams
                                                                    })
                                                                    if (res.data.code != 0) {
                                                                        toast.error(res.data.msg, {
                                                                            position: 'top-right'
                                                                        });
                                                                        return
                                                                    }
                                                                    action({
                                                                        actionType: "reload",
                                                                        componentId: "list_user"
                                                                    })
                                                                }
                                                            }),
                                                        ]
                                                    },
                                                    "bulkActions",
                                                    {
                                                        "type": "columns-toggler",
                                                        "align": "right",
                                                        "draggable": true,
                                                    },
                                                    {
                                                        "type": "reload",
                                                        "align": "right",
                                                    },
                                                ],
                                                "keepItemSelectionOnPageChange": false,
                                                "bulkActions": [
                                                    {
                                                        "label": "批量删除",
                                                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:role:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:role:update')}",
                                                        "actionType": "ajax",
                                                        "level": "primary",
                                                        "api": {
                                                            "url": allDelApi,
                                                            "method": "post",
                                                            "data": {
                                                                "roleId": "${roleId}",
                                                                "userIdList": "${ids|split}"
                                                            },
                                                        },
                                                        "onEvent": {
                                                            "click": {
                                                                "weight": 0,
                                                                "actions": [
                                                                    {
                                                                        "componentId": "list_user",
                                                                        "groupType": "component",
                                                                        "actionType": "reload",
                                                                        "dataMergeMode": "override"
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                ],
                                                // "footerToolbar": [
                                                //     "statistics",
                                                //     "switch-per-page",
                                                //     "pagination"
                                                // ],
                                                // "alwaysShowPagination": true,
                                                "columns": [
                                                    {
                                                        "name": 'nickname',
                                                        "label": '用户'
                                                    },
                                                    {
                                                        "name": 'email',
                                                        "label": '邮箱'
                                                    },
                                                    {
                                                        "name": 'mobile',
                                                        "label": '手机号'
                                                    },
                                                    {
                                                        "label": "删除",
                                                        "type": "button",
                                                        "actionType": "ajax",
                                                        "level": "link",
                                                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:role:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:role:update')}",
                                                        "confirmText": "确认要删除${nickname}吗？",
                                                        "api": {
                                                            "url": allDelApi,
                                                            "method": "post",
                                                            "data": {
                                                                "roleId": "${roleId}",
                                                                "userIdList": ["${id}"]
                                                            }
                                                        },
                                                    }
                                                ],
                                                "placeholder": "暂无数据"
                                            }]
                                        },
                                    ],
                                },
                            ],
                            "actions": [],
                        },
                    },
                    {
                        "label": "删除",
                        "type": "button",
                        "actionType": "ajax",
                        "level": "link",
                        "disabledOn": "${defaultRole == 1}",
                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:role:delete')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:role:delete')}",
                        "confirmText": "确认要删除${name}吗？",
                        "api": {
                            "url": delRoleApi,
                            "method": "delete"
                        },
                    }
                ]
            }
        ]
    }]
}

export default () => <AMISComponent schema={schema} />;
