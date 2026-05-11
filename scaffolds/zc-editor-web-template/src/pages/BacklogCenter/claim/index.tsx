import BigNumber from 'bignumber.js'
import { history } from '@umijs/max';
import { claimTask } from '@/api/backlogCenter'
import { useDevBaseUrl } from "@/utils/util"
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
                "url": useDevBaseUrl("/application/processManage/process/claimList"),
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
                            "label": "签收",
                            "type": "button",
                            "level": "link",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:task:claim')}",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": async function (row:any) {
                                                await claimTask({ taskId: row.props.data.taskId });
                                                let data = row.props.data;
                                                const appid = new BigNumber(data.appId).toString(36);
                                                const env = data.env;
                                                let url = "/app/todoList?appid=" + appid + "&env=" + env
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
