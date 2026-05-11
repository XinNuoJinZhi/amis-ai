import BigNumber from 'bignumber.js'
import { history } from '@umijs/max';
import {AMISComponent} from "@/hooks/amis";
import { useDevBaseUrl, findEditMenu } from "@/utils/util"
const detailPerMenu = findEditMenu('/app/ownProcessDetail') ? true : false
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/application/processManage/process/finishedList"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "processName": "${processName|default:undefined}",
                    "finishBegin": "${finishTime[0]|default:undefined}",
                    "finishEnd": "${finishTime[1]|default:undefined}",
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
            //                     "name": "finishBegin",
            //                     "extraName": "finishEnd",
            //                     "label": '审批时间',
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
                    "name": 'taskName',
                    "label": '任务节点'
                },
                {
                    "name": 'startUserName',
                    "label": '流程发起人',
                },
                {
                    "name": 'createTime',
                    "label": '接收时间'
                },
                {
                    "name": 'finishTime',
                    "label": '审批时间',
                    "searchable": {
                        "type": 'input-datetime-range',
                        "name": "finishTime[0]",
                        "extraName": "finishTime[1]",
                        "label": '审批时间',
                        "inputFormat": "YYYY-MM-DD HH:mm:ss",
                        "timeFormat": "HH:mm:ss",
                        "clearable": true,
                        "size": 'sm'
                    }
                },
                {
                    "name": 'duration',
                    "label": '耗时'
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "流转记录",
                            "type": "button",
                            "level": "link",
                            "visible": detailPerMenu,
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
                                                const processed = false;
                                                const params = new URLSearchParams(window.location.search);
                                                const portalKey = params.get('portalKey');
                                                const ccIdentification = true
                                                let url = '/app/processDetail' + "?procInsId=" +  procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
                                                history.push(url)
                                            }
                                        }
                                    ]
                                }
                            }
                        },{
                            "label": "撤回",
                            "type": "button",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:process:revokeProcess')}",
                            "actionType": "ajax",
                            "level": "link",
                            "confirmText": "确认要撤回吗？",
                            "api": {
                                "url": useDevBaseUrl("/application/processManage/task/revokeProcess"),
                                "method": "post",
                                "data": {
                                    "procInsId": "${procInsId}",
                                    "taskId": "${taskId}",
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
