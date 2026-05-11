import { isAppEnd } from '@/utils/index'
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/operateLog/list") : useDevBaseUrl("/app/operateLog/list")
let detailApi = isAppEnd() ? useDevBaseUrl("/application/app/operateLog/get?id=${id}") : useDevBaseUrl("/app/operateLog/get?id=${id}")
const schema ={
    "type": "page",
    "body": [{
        "type": "page",
        "body": {
            "type": "crud",
            "autoFillHeight": true,
            "syncLocation": false,
            "api": {
                "method": "get",
                "url": crudApi,
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "title": "${title|default:undefined}",
                    "businessType": "${businessType|default:undefined}",
                    "requestMethod": "${requestMethod|default:undefined}",
                    "operateName": "${operateName|default:undefined}",
                    "operateTimeStart": "${operateTime[0]|default:undefined}",
                    "operateTimeEnd": "${operateTime[1]|default:undefined}",
                },
                adaptor: function (payload: any) {
                    return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data, items:payload?.data?.list ?  payload.data.list : [] }
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
            ],
            "footerToolbar": [
                "statistics",
                "switch-per-page",
                "pagination"
            ],
            "alwaysShowPagination": true,
            "autoGenerateFilter": true,
            "columns": [{
                    "name": "scenario",
                    "label": "应用场景",
                    "type": 'mapping',
                    "map": {
                        'edit': "<span>编辑端</span>",
                        'app': "<span>应用端</span>",
                    },
                },
                {
                    "name": "title",
                    "label": "模块标题",
                    "width": 30,
                    "searchable": {
                        "type": "input-text",
                        "name": "title",
                        "label": "模块标题",
                        "clearable": true,
                        "placeholder": "请输入模块标题",
                        "size": "sm"
                    }
                },
                {
                    "name": "businessType",
                    "label": "业务类型",
                    "type": 'mapping',
                    "map": {
                        '0': "<span>其它</span>",
                        '1': "<span>新增</span>",
                        '2': "<span>修改</span>",
                        '3': "<span>删除</span>",
                        '4': "<span>授权</span>",
                        '5': "<span>导出</span>",
                        '6': "<span>导入</span>",
                        '7': "<span'>清空数据</span>",
                        '8': "<span>查询</span>",
                    },
                    "searchable": {
                        "type": "select",
                        "name": "businessType",
                        "label": "业务类型",
                        "clearable": true,
                        "placeholder": "请输入业务类型",
                        "size": "sm",
                        "source": {
                            "method": "get",
                            "url": useAdminBaseUrl("/system/dict-data/list?dictType=businessType&status=0"),
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: { ...payload.data, options: payload.data }
                                };
                            },
                        },
                    }
                },
                // {
                //     "name": "method",
                //     "label": "方法名称",
                //     "width": 30,
                // },
                {
                    "name": "requestMethod",
                    "label": "请求方式",
                    "searchable": {
                        "type": "select",
                        "name": "requestMethod",
                        "label": "请求方式",
                        "clearable": true,
                        "placeholder": "请输入请求方式",
                        "size": "sm",
                        "source": {
                            "method": "get",
                            "url": useAdminBaseUrl("/system/dict-data/list?dictType=requestMethod&status=0"),
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: { ...payload.data, options: payload.data }
                                };
                            },
                        },
                    }
                },
                {
                    "name": "operateName",
                    "label": "操作人员",
                    "searchable": {
                        "type": "input-text",
                        "name": "operateName",
                        "label": "操作人员",
                        "clearable": true,
                        "placeholder": "请输入操作人员",
                        "size": "sm"
                    }
                },
                {
                    "name": "operateUrl",
                    "label": "请求URL"
                },
                {
                    "name": "operateIp",
                    "label": "主机地址"
                },
                {
                    "name": "operateLocation",
                    "label": "IP归属地"
                },
                // {
                //     "name": "operateParam",
                //     "label": "请求参数"
                // },
                // {
                //     "name": "jsonResult",
                //     "label": "返回参数"
                // },
                {
                    "name": "status",
                    "label": "操作状态",
                    "type": 'mapping',
                    "map": {
                        '0': "<span class='label label-success'>正常</span>",
                        '1': "<span class='label label-warning'>异常</span>",
                    }
                },
                {
                    "name": "errorMsg",
                    "label": "错误消息"
                },
                {
                    "name": "operateTime",
                    "label": "操作时间",
                    "searchable": {
                        "type": "input-datetime-range",
                        "label": "操作时间",
                        "clearable": true,
                        "placeholder": "请输入操作时间",
                        "format": "YYYY-MM-DD HH:mm:ss",
                        //valueFormat
                        "size": "sm",
                        "name": "operateTime[0]",
                        "extraName": "operateTime[1]"
                    }
                },
                {
                    "name": "costTime",
                    "label": "耗时"
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "详情",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "查看日志详情",
                                "actions": [
                                    {
                                        "label": "关闭",
                                        "actionType": "close",
                                        "level": "default",
                                        "type": "button",
                                    }
                                ],
                                "data": {
                                    id: "${id}"
                                },
                                "body": [{
                                    "type": "form",
                                    "initApi": {
                                        "method": "get",
                                        "url": detailApi,
                                        adaptor: function (payload:any) {
                                            if(payload?.data?.status) {
                                                payload.data.status = payload?.data?.status== 0 ? '正常' : '异常';
                                            }
                                            if(payload?.data?.scenario == 'edit'){
                                                payload.data.scenario = '编辑端'
                                            } else if(payload?.data?.scenario == 'app'){
                                                payload.data.scenario = '应用端'
                                            }
                                            if(payload?.data?.businessType == 0){
                                                payload.data.businessType = '其它'
                                            } else if(payload?.data?.businessType == 1){
                                                payload.data.businessType = '新增'
                                            } else if(payload?.data?.businessType == 2){
                                                payload.data.businessType = '修改'
                                            } else if(payload?.data?.businessType == 3){
                                                payload.data.businessType = '删除'
                                            } else if(payload?.data?.businessType == 4){
                                                payload.data.businessType = '授权'
                                            } else if(payload?.data?.businessType == 5){
                                                payload.data.businessType = '导出'
                                            } else if(payload?.data?.businessType == 6){
                                                payload.data.businessType = '导入'
                                            } else if(payload?.data?.businessType == 7){
                                                payload.data.businessType = '清空数据'
                                            } else if(payload?.data?.businessType == 8){
                                                payload.data.businessType = '查询'
                                            }
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, }
                                            };
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "input-text",
                                            "name": "scenario",
                                            "label": "应用场景",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "title",
                                            "label": "模块标题",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "businessType",
                                            "label": "业务类型",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "method",
                                            "label": "方法名称",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "requestMethod",
                                            "label": "请求方式",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "operateName",
                                            "label": "操作人员",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "operateUrl",
                                            "label": "请求URL",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "operateIp",
                                            "label": "主机地址",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "operateLocation",
                                            "label": "IP归属地",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "operateParam",
                                            "label": "请求参数",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "jsonResult",
                                            "label": "返回参数",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "status",
                                            "label": "操作状态",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "errorMsg",
                                            "label": "错误消息",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "operateTime",
                                            "label": "操作时间",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "costTime",
                                            "label": "耗时",
                                            "static": true,
                                        },
                                    ]
                                }]
                            }
                        },
                    ]
                },
            ]
        }
    }]
}

export default () => <AMISComponent schema={schema} />;
