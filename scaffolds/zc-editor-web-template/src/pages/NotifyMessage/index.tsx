import { useDevBaseUrl } from "@/utils/util"
import { history } from '@umijs/max';
import {AMISComponent} from "@/hooks/amis";
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "id": "notify_message_list",
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/system/notify-message/my-page"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "readStatus": "${readStatus}",
                    "createTime[0]": "${createTime[0]|default:undefined}",
                    "createTime[1]": "${createTime[1]|default:undefined}",
                },
                adaptor: function (payload:any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload?.data, items: payload?.data?.list }
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
            //                     "type": 'input-datetime-range',
            //                     "label": '发送时间',
            //                     "inputFormat": "YYYY-MM-DD HH:mm:ss",
            //                     "valueFormat": "YYYY-MM-DD HH:mm:ss",
            //                     "timeFormat": "HH:mm:ss",
            //                     "name": "createTime[0]",
            //                     "extraName": "createTime[1]",
            //                     "clearable": true,
            //                     "size": 'sm'
            //                 },
            //                 {
            //                     "type": 'select',
            //                     "name": 'readStatus',
            //                     "label": '是否已读',
            //                     "placeholder": '请选择',
            //                     "clearable": true,
            //                     "size": 'sm',
            //                     "options": [
            //                         {
            //                             "label": "全部",
            //                             "value": ""
            //                         },
            //                         {
            //                             "label": "是",
            //                             "value": "true"
            //                         },
            //                         {
            //                             "label": "否",
            //                             "value": "false"
            //                         }
            //                     ]
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
                "bulkActions",{
                    "type":"button",
                    "label": "全部已读",
                    "level": "primary",
                    "onEvent": {
                        "click": {
                            "actions": [
                                {
                                    "actionType": "ajax",
                                    "api": {
                                        "url": useDevBaseUrl("/system/notify-message/update-all-read"),
                                        "method": "put",
                                    },
                                },
                                {
                                    "actionType": "reload",
                                    "componentId": "notify_message_list"
                                },
                                {
                                    "actionType": "broadcast",
                                    "args": {
                                        "eventName": "noticeRefresh"
                                    },
                                }

                            ]
                        }
                    },
                },
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
                    "label": "标记已读",
                    level: 'info',
                    "onEvent": {
                        "click": {
                            "actions": [
                                {
                                    "actionType": "ajax",
                                    "api": {
                                        "url": useDevBaseUrl("/system/notify-message/update-read?ids=${ids}"),
                                        "method": "put",
                                    },
                                },
                                {
                                    "actionType": "reload",
                                    "componentId": "notify_message_list"
                                },
                                {
                                    "actionType": "broadcast",
                                    "args": {
                                        "eventName": "noticeRefresh"
                                    },
                                }

                            ]
                        }
                    },
                }
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
                    "name": 'templateNickname',
                    "label": '发送人名称'
                },
                {
                    "name": 'createTime',
                    "label": '发送时间',
                    "searchable": {
                        "type": "input-datetime-range",
                        "label": '发送时间',
                        "inputFormat": "YYYY-MM-DD HH:mm:ss",
                        "valueFormat": "YYYY-MM-DD HH:mm:ss",
                        "timeFormat": "HH:mm:ss",
                        "name": "createTime[0]",
                        "extraName": "createTime[1]",
                        "clearable": true,
                        "size": 'sm'
                    }
                },
                {
                    "name": 'templateType',
                    "label": '类型',
                    "type": "mapping",
                    "map": {
                        '1': "<span class='label label-info'>通知公告</span>",
                        '2': "<span class='label label-info'>系统消息</span>",
                        '3': "<span class='label label-info'>流程消息</span>",
                    }
                },
                {
                    "name": 'templateContent',
                    "label": '内容'
                },
                {
                    "name": 'readStatus',
                    "label": '是否已读',
                    "type": 'mapping',
                    "map": {
                        "false": "<span class='label label-info'>否</span>",
                        "true": "<span class='label label-danger'>是</span>",
                    },
                    "searchable": {
                        "type": 'select',
                        "name": 'readStatus',
                        "label": '是否已读',
                        "placeholder": '请选择',
                        "clearable": true,
                        "size": 'sm',
                        "options": [
                            {
                                "label": "全部",
                                "value": ""
                            },
                            {
                                "label": "是",
                                "value": "true"
                            },
                            {
                                "label": "否",
                                "value": "false"
                            }
                        ]
                    }
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "已读",
                            "type": "button",
                            "hiddenOn":"${userType ==1 || readStatus==true}",
                            "level": "link",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "ajax",
                                            "api": {
                                                "url": useDevBaseUrl("/system/notify-message/update-read?ids=${id}"),
                                                "method": "put",
                                            },
                                        },
                                        {
                                            "actionType": "reload",
                                            "componentId": "notify_message_list"
                                        },
                                        {
                                            "actionType": "broadcast",
                                            "args": {
                                                "eventName": "noticeRefresh"
                                            },
                                        }

                                    ]
                                }
                            },
                        },
                        {
                            "label": "查看流程详情",
                            "type": "button",
                            "hiddenOn":"${routePath ==null}",
                            "level": "link",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": function (row:any) {
                                                const param = new URLSearchParams(window.location.search);
                                                const appid = param.get('appid');
                                                const env = param.get('env');
                                                //应用端
                                                let params = row.props.data.routeParams;
                                                let url = '';
                                                if(params){
                                                    if(params.taskId){
                                                        url = '/app/processDetail'+'?appid='+appid+'&env='+env+'&procInsId='+params.procInsId+'&processed='+params.processed+'&taskId='+params.taskId+'&ccIdentification='+(params.ccIdentification ? params.ccIdentification : false);
                                                    } else {
                                                        url = '/app/processDetail'+'?appid='+appid+'&env='+env+'&procInsId='+params.procInsId+'&processed='+params.processed+'&taskId='+'&ccIdentification='+(params.ccIdentification ? params.ccIdentification : false);
                                                    }
                                                } else {
                                                    url = '/app/processDetail'+'?appid='+appid+'&env='+env;
                                                }
                                                history.push(url)
                                                document.getElementsByClassName('myMessage')[0].style.display = 'none';
                                            }
                                        }
                                    ]
                                }
                            },
                        }
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }]
}

export default () => <AMISComponent schema={schema} />;
