import { useDevBaseUrl, findEditMenu } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
const interventionPerMenu = findEditMenu('/app/flowIntervention') ? true : false
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/application/processManage/processIntervene/page"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "processName": "${processName|default:undefined}",
                    "categoryKey": "${categoryKey|default:undefined}",
                    "begin": "${createTime[0]|default:undefined}",
                    "end": "${createTime[1]|default:undefined}",
                },
                adaptor: function (payload:any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data, items: payload.data?.list }
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
                    "label": '流程编号'
                },
                {
                    "name": 'processName',
                    "label": '流程名称',
                    "searchable": {
                        "type": 'input-text',
                        "name": 'processName',
                        "label": '流程名称',
                        "placeholder": '请输入流程名称',
                        "clearable": true,
                        "size": 'sm'
                    }
                },
                {
                    "name": 'category',
                    "label": '流程类别',
                    "searchable": {
                        "type": 'select',
                        "name": 'categoryKey',
                        "label": '流程类别',
                        "placeholder": '请选择',
                        "clearable": true,
                        "size": 'sm',
                        "source": {
                            "method": 'get',
                            "url": useDevBaseUrl('/processManage/category/list'),
                            "responseData": {
                                "options": '${items|pick:label~categoryName,value~queryKey}'
                            }
                        }
                    }
                },
                {
                    "name": 'procDefVersion',
                    "label": '流程版本',
                    "type": 'mapping',
                    "map": {
                        "1": "<span class='label label-danger'>v1</span>",
                        "2": "<span class='label label-warning'>v2</span>",
                        "3": "<span class='label label-info'>v3</span>",
                        "4": "<span class='label label-success'>v4</span>",
                        "*": "<span class='label label-success'>v${procDefVersion}</span>"
                    }
                },
                {
                    "name": 'taskName',
                    "label": '当前节点',
                },
                {
                    "name": 'createTime',
                    "label": '提交时间',
                    "searchable": {
                        "type": 'input-datetime-range',
                        "label": '提交时间',
                        "inputFormat": "YYYY-MM-DD HH:mm:ss",
                        "timeFormat": "HH:mm:ss",
                        "name": "createTime[0]",
                        "extraName": "createTime[1]",
                        "clearable": true,
                        "size": 'sm'
                    }
                },
                {
                    "name": 'processStatus',
                    "label": '流程状态',
                    "type": 'mapping',
                    "map": {
                        "canceled": "<span class='label label-warning'>已取消</span>",
                        "completed": "<span class='label label-success'>已完成</span>",
                        "terminated": "<span class='label label-danger'>已终止</span>",
                        "running": "<span class='label label-info'>进行中</span>",
                        "suspended": "<span class='label label-warning'>已挂起</span>",
                    },
                    "popOver": {
                        "trigger": "hover",
                        "position": "center",
                        "showIcon": false,
                        "body": {
                            "type": "tpl",
                            "tpl": "${deleteReason}"
                        }
                    },
                    "popOverEnableOn": "this.processStatus == 'terminated'"
                },
                {
                    "name": 'duration',
                    "label": '耗时',
                },
                {
                    "name": 'startUserName',
                    "label": '流程发起人',
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "节点干预",
                            "type": "button",
                            "level": "link",
                            "visibleOn": interventionPerMenu ? "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processIntervene:nodeQuery')}" : "${false}",
                            "hiddenOn": "${processStatus == 'canceled' || processStatus == 'terminated' || processStatus == 'completed' || processStatus == 'suspended'}",
                            "actionType": "link",
                            "link": './flowIntervention/nodeIntervention?procInsId=${procInsId}',
                        },
                        {
                            "label": "重置",
                            "type": "button",
                            "level": "link",
                            "hiddenOn": "${processStatus == 'canceled' || processStatus == 'terminated' || processStatus == 'completed'  || processStatus == 'suspended'}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processIntervene:reset')}",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "重置",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/reset"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "cleanGossip": context.cleanGossip ? context.cleanGossip : false,
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
                                        "type": "alert",
                                        "body": "是否重置流程实例？",
                                        "level": "warning",
                                        "showIcon": true,
                                    },{
                                        "name": "cleanGossip",
                                        "type": "checkbox",
                                        "label": "",
                                        "className": "appPublish_confirm_label",
                                        "option": "清空历史处理过程"
                                    }]
                                },

                            }
                        },
                        {
                            "label": "挂起",
                            "type": "button",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processIntervene:processSuspendOrActivate')}",
                            "hiddenOn": "${processStatus == 'suspended' || processStatus == 'canceled' || processStatus == 'terminated' || processStatus == 'completed'}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "挂起",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/suspendOrActivate"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "suspensionState": 'suspended',
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
                                        "type": "alert",
                                        "body": "是否挂起流程实例？",
                                        "level": "warning",
                                        "showIcon": true,
                                    }]
                                },

                            }
                        },
                        {
                            "label": "恢复",
                            "type": "button",
                            "hiddenOn": "${processStatus == 'canceled' || processStatus == 'terminated' || processStatus == 'completed'  || processStatus == 'running'}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processIntervene:processSuspendOrActivate')}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "恢复",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/suspendOrActivate"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "suspensionState": 'active',
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
                                        "type": "alert",
                                        "body": "是否恢复流程实例？",
                                        "level": "warning",
                                        "showIcon": true,
                                    }]
                                },

                            }
                        },
                        {
                            "label": "终止",
                            "type": "button",
                            "hiddenOn": "${processStatus == 'canceled' || processStatus == 'terminated' || processStatus == 'completed'  || processStatus == 'suspended'}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processIntervene:stop')}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "终止",
                                "body": {
                                    "type": "form",
                                    "labelAlign": "left",
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl("/application/processManage/processIntervene/stop"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "reason": context.reason,
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
                                        "type": "alert",
                                        "body": "是否终止流程实例？",
                                        "level": "warning",
                                        "showIcon": true,
                                    },{
                                        "type": "textarea",
                                        "name": "reason",
                                        "label": "终止原因",
                                        "required": true,
                                        "maxLength": 200,
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
