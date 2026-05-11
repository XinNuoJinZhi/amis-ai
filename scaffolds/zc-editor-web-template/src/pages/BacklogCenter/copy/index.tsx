import BigNumber from 'bignumber.js'
import { history } from '@umijs/max';
import { useDevBaseUrl, findEditMenu } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
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
                "url": useDevBaseUrl("/application/processManage/process/copyList"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "processName": "${processName|default:undefined}",
                    "originatorName": "${originatorName|default:undefined}",
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
            //                     "type": 'input-text',
            //                     "name": 'originatorName',
            //                     "label": '发起人',
            //                     "placeholder": '请输入发起人',
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
                    "name": 'copyId',
                    "label": '抄送编号'
                },
                {
                    "name": 'instanceId',
                    "label": '流程编号',
                },
                {
                    "name": 'title',
                    "label": '标题'
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
                    "name": 'originatorName',
                    "label": '发起人',
                    "searchable": {
                        "type": 'input-text',
                        "name": 'originatorName',
                        "label": '发起人',
                        "placeholder": '请输入发起人',
                        "clearable": true,
                        "size": 'sm'
                    }
                },
                {
                    "name": 'createTime',
                    "label": '创建时间'
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
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": async function (row:any) {
                                                let data = row.props.data;
                                                const appid = new BigNumber(data.appId).toString(36);
                                                const env = data.env;
                                                const procInsId = data.instanceId;
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

                        }
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }]
}

export default () => <AMISComponent schema={schema} />;
