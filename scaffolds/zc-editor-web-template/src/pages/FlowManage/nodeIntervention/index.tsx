import { useAdminBaseUrl, useDevBaseUrl } from "@/utils/util"
import {getSchemaTpl} from 'amis-editor'
import {AMISComponent} from "@/hooks/amis";
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/application/processManage/processIntervene/nodeIntervene/list?procInsId=${procInsId}"),
                "sendOn": "${procInsId}",
                adaptor: function (payload:any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data, items: payload.data }
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
                    "name": 'procInsId',
                    "label": '流程实例id'
                },
                {
                    "name": 'nodeId',
                    "label": '节点ID',
                },
                {
                    "name": 'nodeName',
                    "label": '节点名称',
                },
                {
                    "name": 'processName',
                    "label": '流程名称',
                },
                {
                    "name": 'suspensionState',
                    "label": '任务状态',
                    "type": 'mapping',
                    "map": {
                        "active": "<span class='label label-info'>运行中</span>",
                        "suspended": "<span class='label label-warning'>已挂起</span>",
                    },
                },
                {
                    "name": 'taskAssigneesStr',
                    "label": '任务处理人集合',
                },
                {
                    "name": 'createTime',
                    "label": '任务创建时间',
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "实例控制",
                            "type": "button",
                            "level": "link",
                            "hiddenOn": "${suspensionState == 'suspended'}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:nodeIntervene:instanceControl')}",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "实例控制",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/nodeIntervene/instanceControl"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "action":  context.action,
                                                    "changeUser": context.changeUser,
                                                    "nodeId": context.__super.__super.nodeId,
                                                    "procInsId": context.__super.__super.procInsId,
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
                                    "body": [{
                                        "name": "action",
                                        "type": "radios",
                                        "label": "操作类型",
                                        "selectFirst": true,
                                        "options": [
                                            {
                                                "label": "添加办理人",
                                                "value": "addUser"
                                            },
                                            {
                                                "label": "删除办理人",
                                                "value": "deleteUser"
                                            },
                                        ]
                                    },
                                    {
                                        "type": "input-group",
                                        "label": "分配给",
                                        "required": true,
                                        "body": [
                                            {
                                                "type": "select",
                                                "name": "changeUser",
                                                "id": "changeUser",
                                                "multiple": true,
                                                "required": true,
                                                "selectMode": 'group',
                                                "clearable": true,
                                                "labelField": 'nickname',
                                                "valueField": "id",
                                                "placeholder": "请通过右侧按钮选择移交给",
                                                "joinValues": false,
                                                "extractValue": true,
                                                "source": useDevBaseUrl("/application/system/user/allList")
                                            },
                                            getSchemaTpl('deptUserSelect', {
                                                "label": '',
                                                "name": "changeUser",
                                                "dialogTitle": "组织人员",
                                                "deptApi": useDevBaseUrl("/system/dept/all_list"), //部门Api
                                                "userApi": useDevBaseUrl("/system/user/all_page"), //人员Api
                                                "btCustom": {
                                                    "icon": "fa fa-edit",
                                                    "level": "primary",
                                                    "style": {
                                                        borderRadius: '50%',
                                                        marginLeft: '15px'
                                                    },
                                                    "label": '',
                                                },
                                            }),
                                        ]
                                    }]
                                },
                            }
                        },
                        {
                            "label": "移交",
                            "type": "button",
                            "level": "link",
                            "hiddenOn": "${suspensionState == 'suspended'}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:nodeIntervene:transfer')}",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "移交",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/nodeIntervene/transfer"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "changeUser": context.changeUser,
                                                    "nodeId": context.__super.__super.nodeId,
                                                    "procInsId": context.__super.__super.procInsId,
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
                                    "body": [{
                                        "type": "input-group",
                                        "label": "移交给",
                                        "required": true,
                                        "body": [
                                            {
                                                "type": "select",
                                                "name": "changeUser",
                                                "id": "changeUser",
                                                "multiple": true,
                                                "required": true,
                                                "selectMode": 'group',
                                                "clearable": true,
                                                "labelField": 'nickname',
                                                "valueField": "id",
                                                "placeholder": "请通过右侧按钮选择移交给",
                                                "joinValues": false,
                                                "extractValue": true,
                                                "source": useDevBaseUrl("/application/system/user/allList")
                                            },
                                            getSchemaTpl('deptUserSelect', {
                                                "label": '',
                                                "name": "changeUser",
                                                "dialogTitle": "组织人员",
                                                "deptApi": useDevBaseUrl("/system/dept/all_list"), //部门Api
                                                "userApi": useDevBaseUrl("/system/user/all_page"), //人员Api
                                                "btCustom": {
                                                    "icon": "fa fa-edit",
                                                    "level": "primary",
                                                    "style": {
                                                        borderRadius: '50%',
                                                        marginLeft: '15px'
                                                    },
                                                    "label": '',
                                                },
                                            }),
                                        ]
                                    }]
                                },
                            }
                        },
                        {
                            "label": "跳转",
                            "type": "button",
                            "hiddenOn": "${suspensionState == 'suspended'}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:nodeIntervene:jump')}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "跳转",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/nodeIntervene/jump"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "skipToNodeId": context.skipToNodeId,
                                                    "procInsId": context.__super.__super.procInsId,
                                                    "nodeId": context.__super.__super.nodeId,
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
                                    "body": [{
                                        "type": "select",
                                        "name": 'skipToNodeId',
                                        "label": '跳转节点',
                                        "placeholder": '请选择',
                                        "clearable": true,
                                        "required": true,
                                        "source": {
                                            "method": 'get',
                                            "url": useDevBaseUrl('/application/processManage/processIntervene/nodeIntervene/getAllNodeInfo?procInsId=${procInsId}'),
                                        }
                                    }]
                                },

                            }
                        },
                        {
                            "label": "挂起",
                            "type": "button",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:nodeIntervene:suspendOrActivate')}",
                            "hiddenOn": "${suspensionState == 'suspended'}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "挂起",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/nodeIntervene/suspendOrActivate"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "suspensionState": 'suspended',
                                                    "procInsId": context.__super.__super.procInsId,
                                                    "nodeId": context.__super.__super.nodeId,
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
                                    "body": [{
                                        "type": "alert",
                                        "body": "确认要挂起？",
                                        "level": "warning",
                                        "showIcon": true,
                                    }]
                                },

                            }
                        },
                        {
                            "label": "恢复",
                            "type": "button",
                            "hiddenOn": "${suspensionState == 'active'}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:nodeIntervene:suspendOrActivate')}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "恢复",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/nodeIntervene/suspendOrActivate"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "suspensionState": 'active',
                                                    "procInsId": context.__super.__super.procInsId,
                                                    "nodeId": context.__super.__super.nodeId,
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
                                    "body": [{
                                        "type": "alert",
                                        "body": "确认要恢复？",
                                        "level": "warning",
                                        "showIcon": true,
                                    }]
                                },

                            }
                        },
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }]
}

export default () => <AMISComponent schema={schema} />;
