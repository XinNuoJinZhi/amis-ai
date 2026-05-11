import { history } from '@umijs/max';
import BigNumber from 'bignumber.js'
import { useDevBaseUrl, findEditMenu } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
const detailPerMenu = findEditMenu('/app/ownProcessDetail') ? true : false
const restartPerMenu = findEditMenu('/app/ownProcessRestart') ? true : false
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/application/processManage/process/ownList"),
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
            // "filter": {
            //     "title": '',
            //     "body": [
            //         {
            //             "type": 'group',
            //             "body": [
            //                 {
            //                     "type": 'input-text',
            //                     "name": 'processName',
            //                     "label": '流程名称',
            //                     "placeholder": '请输入流程名称',
            //                     "clearable": true,
            //                     "size": 'sm'
            //                 },
            //                 {
            //                     "type": 'select',
            //                     "name": 'categoryId',
            //                     "label": '流程类别',
            //                     "placeholder": '请选择',
            //                     "clearable": true,
            //                     "size": 'sm',
            //                     "source": {
            //                         "method": 'get',
            //                         "url": useDevBaseUrl('/processManage/category/list'),
            //                         "responseData": {
            //                             "options": '${items|pick:label~categoryName,value~id}'
            //                         }
            //                     }
            //                 },
            //                 {
            //                     "type": 'input-datetime-range',
            //                     "label": '提交时间',
            //                     "inputFormat": "YYYY-MM-DD HH:mm:ss",
            //                     "timeFormat": "HH:mm:ss",
            //                     "name": "begin",
            //                     "extraName": "end",
            //                     "clearable": true,
            //                     "size": 'sm'
            //                 },
            //             ]
            //         }
            //     ],
            //     "actions": [
            //         {
            //             "type": 'reset',
            //             "label": '重置'
            //         },
            //         {
            //             "type": 'submit',
            //             "level": 'primary',
            //             "label": '查询'
            //         }
            //     ]
            // },
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
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "详情",
                            "type": "button",
                            "level": "link",
                            "visible": detailPerMenu,
                            "actionType": "dialog",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                    {
                                        "actionType": "custom",
                                        "script": async function (row:any) {
                                            let data = row.props.data;
                                            const appid = new BigNumber(data.appId).toString(36);
                                            const env = data.env;
                                            const procInsId = data.procInsId;
                                            const procDefId = data.procDefId;
                                            const deployId = data.deployId;
                                            const processed = false;
                                            const params = new URLSearchParams(window.location.search);
                                            const portalKey = params.get('portalKey');
                                            const ccIdentification = false
                                            let url = '/app/processDetail' + "?procInsId=" +  procInsId + "&deployId=" + deployId + "&definitionId=" + procDefId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification;
                                            history.push(url)
                                        }
                                    }
                                    ]
                                }
                            }
                        },
                        // {
                        //     "label": "删除",
                        //     "type": "button",
                        //     "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:process:delete')}",
                        //     "actionType": "ajax",
                        //     "level": "link",
                        //     "confirmText": "确认要删除吗？",
                        //     "api": {
                        //         "url": useDevBaseUrl("/processManage/process/instance/${procInsId}"),
                        //         "method": "delete"
                        //     },
                        // },
                        {
                            "label": "取消",
                            "type": "button",
                            "actionType": "ajax",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:task:stopProcess')}",
                            "level": "link",
                            "confirmText": "确认要取消吗？",
                            "hiddenOn": "${processStatus == 'completed' || processStatus == 'terminated' || processStatus == 'canceled'}",
                            "api": {
                                "url": useDevBaseUrl("/application/processManage/task/stopProcess"),
                                "method": "post",
                                "data": {
                                    "procInsId": "${procInsId}",
                                },
                            },
                        },
                        {
                            "label": "重新发起",
                            "type": "button",
                            "visibleOn": restartPerMenu ? "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:process:restart')}" : "${false}",
                            "level": "link",
                            "hiddenOn": "${!(bindInitiationPage || (!bindInitiationPage && processInstanceStartVariablesConfig))}",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": function (row:any) {
                                                let data = row.props.data;
                                                const appid = new BigNumber(data.appId).toString(36);
                                                const env = data.env;
                                                const procInsId = data.procInsId;
                                                const procDefId = data.procDefId;
                                                const deployId = data.deployId;
                                                const params = new URLSearchParams(window.location.search);
                                                const portalKey = params.get('portalKey');
                                                let url = '/app/restartProcess' + "?procInsId=" +  procInsId + "&deployId=" + deployId + "&definitionId=" + procDefId + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '');
                                                history.push(url)
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "label": "重新发起",
                            "type": "button",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:process:restart')}",
                            "level": "link",
                            "hiddenOn": "${!(!bindInitiationPage && !processInstanceStartVariablesConfig)}",
                            "actionType": "ajax",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl("/application/processManage/process/restartTheProcess"),
                                "data": {
                                    "processDefId": "${procDefId}",
                                },
                            },
                        }
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }]
}

export default () => <AMISComponent schema={schema} />;
