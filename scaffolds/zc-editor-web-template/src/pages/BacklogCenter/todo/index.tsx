import BigNumber from 'bignumber.js'
import { history } from '@umijs/max';
import { useDevBaseUrl, findEditMenu } from "@/utils/util"
const detailPerMenu = findEditMenu('/app/ownProcessDetail') ? true : false
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
                "url": useDevBaseUrl("/application/processManage/process/todoList"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "processName": "${processName|default:undefined}",
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
            //                     "type": 'input-datetime-range',
            //                     "name": "begin",
            //                     "extraName": "end",
            //                     "label": '接收时间',
            //                     "inputFormat": "YYYY-MM-DD HH:mm:ss",
            //                     "timeFormat": "HH:mm:ss",
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
                    "name": 'taskId',
                    "label": '任务编号'
                },
                {
                    "name": 'procInsId',
                    "label": '流程编号',
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
                    "name": 'taskStatus',
                    "label": '任务状态',
                    "type": 'mapping',
                    "map": {
                        "2": "<span class='label label-warning'>已挂起</span>",
                        "1": "<span class='label label-info'>进行中</span>",
                    },
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
                },
                {
                    "name": 'taskName',
                    "label": '任务节点'
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
                    "name": 'startUserName',
                    "label": '流程发起人',
                },
                {
                    "name": 'createTime',
                    "label": '接收时间',
                    "searchable": {
                        "type": 'input-datetime-range',
                        "name": "createTime[0]",
                        "extraName": "createTime[1]",
                        "label": '接收时间',
                        "inputFormat": "YYYY-MM-DD HH:mm:ss",
                        "timeFormat": "HH:mm:ss",
                        "clearable": true,
                        "size": 'sm'
                    }
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "办理",
                            "type": "button",
                            "level": "link",
                            "disabledOn": "${processStatus == 'suspended' ||  taskStatus == 2}",
                            "visibleOn": detailPerMenu ? "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:process:do')}" : "${false}",
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
                                                const taskId = data.taskId;
                                                const processed = true;
                                                const params = new URLSearchParams(window.location.search);
                                                const portalKey = params.get('portalKey');
                                                const ccIdentification = false
                                                const url = '/app/processDetail' + "?procInsId=" +  procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
                                                history.push(url)
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }]
}

export default () => <AMISComponent schema={schema} />;
