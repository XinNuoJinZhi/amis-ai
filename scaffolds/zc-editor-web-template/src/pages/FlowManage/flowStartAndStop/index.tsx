import FlowRecord from '../../BacklogCenter/detail/component/flowRecord'
import BPMNProcessViewer from "@/components/BPMNProcessViewer/index"
import FormView from "./component/index"
import { useDevBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
let height = document.documentElement.clientHeight - 205 + 'px';
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/application/processManage/processStartAndStop/page"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "state": "${state}",
                    "processName": "${processName}",
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
                    "name": 'processKey',
                    "label": '流程标识',
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
                    "name": 'processStartTypeStr',
                    "label": '流程开始类型',
                },
                {
                    "name": 'category',
                    "label": '流程分类',
                },
                {
                    "name": 'version',
                    "label": '流程版本',
                    "type": 'mapping',
                    "map": {
                        "1": "<span class='label label-danger'>v1</span>",
                        "2": "<span class='label label-warning'>v2</span>",
                        "3": "<span class='label label-info'>v3</span>",
                        "4": "<span class='label label-success'>v4</span>",
                        "*": "<span class='label label-success'>v${version}</span>"
                    }
                },
                {
                    "name": 'state',
                    "label": '状态',
                    "type": 'mapping',
                    "map": {
                        false: "<span class='label label-success'>启用</span>",
                        true: "<span class='label label-info'>停用</span>"
                    },
                    "searchable": {
                        "type": 'select',
                        "name": 'state',
                        "label": '状态',
                        "placeholder": '请选择',
                        "clearable": true,
                        "size": 'sm',
                        "options": [
                            {
                                "label": "启用",
                                "value": "active"
                            },
                            {
                                "label": "停用",
                                "value": "suspended"
                            }
                        ],
                    }
                },
                {
                    "name": 'deploymentTime',
                    "label": '部署时间'
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "启动",
                            "type": "button",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processStartAndStop:changeState')}",
                            "hiddenOn": "${state == false}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "启动",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/application/processManage/processStartAndStop/changeState"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "state": 'active',
                                                    "definitionId": context.__super.__super.definitionId,
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
                                        "body": "是否启动流程实例？",
                                        "level": "warning",
                                        "showIcon": true,
                                    }]
                                },

                            }
                        },
                        {
                            "label": "暂停",
                            "type": "button",
                            "hiddenOn": "${state == true}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processStartAndStop:changeState')}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "暂停",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/application/processManage/processStartAndStop/changeState"),
                                        requestAdaptor: function (api:any,  context: any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "state": 'suspended',
                                                    "definitionId": context.__super.__super.definitionId,
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
                                        "body": "是否暂停流程实例？",
                                        "level": "warning",
                                        "showIcon": true,
                                    }]
                                },

                            }
                        },
                        {
                            "label": "详情",
                            "type": "button",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processStartAndStop:query')}",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "size": "xl",
                                "title": "详情",
                                "data": {
                                    definitionId: "${definitionId}",
                                    processStatus: "${processStatus}"
                                },
                                "body": {
                                    "type": "crud",
                                    "syncLocation": false,
                                    "autoFillHeight": true,
                                    "api": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/application/processManage/processStartAndStop/detail"),
                                        "data": {
                                            "definitionId": "${definitionId}",
                                            "pageNo": "${page}",
                                            "pageSize": "${perPage}",
                                            "processStatus": "${processStatus}",
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
                                        },
                                        {
                                            "name": 'category',
                                            "label": '流程类别',
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
                                            "popOverEnableOn": "this.processStatus == 'terminated'",
                                            "searchable": {
                                                "type": 'select',
                                                "name": 'processStatus',
                                                "label": '状态',
                                                "placeholder": '请选择',
                                                "clearable": true,
                                                "size": 'sm',
                                                "options": [
                                                    {
                                                        "label": "已取消",
                                                        "value": "canceled"
                                                    },
                                                    {
                                                        "label": "已完成",
                                                        "value": "completed"
                                                    },
                                                    {
                                                        "label": "已终止",
                                                        "value": "terminated"
                                                    },
                                                    {
                                                        "label": "进行中",
                                                        "value": "running"
                                                    },
                                                    {
                                                        "label": "已挂起",
                                                        "value": "suspended"
                                                    }
                                                ],
                                            }
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
                                                    "label": "详情",
                                                    "type": "button",
                                                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:processStartAndStop:query')}",
                                                    "level": "link",
                                                    "actionType": "dialog",
                                                    "dialog": {
                                                        "title": "详情",
                                                        "data": {
                                                            procInsId: "${procInsId}"
                                                        },
                                                        "size": "xl",
                                                        "body": {
                                                            "type": "page",
                                                            "initApi": {
                                                                "method": "get",
                                                                "url": useDevBaseUrl("/application/processManage/processStartAndStop/process/detail?procInsId=${procInsId}"),
                                                                adaptor: function (payload:any) {
                                                                    let historyProcNodeList = payload.data?.historyProcNodeList;
                                                                    let xmlData = payload.data?.bpmnXml;
                                                                    let finishedInfo = payload.data?.flowViewer;
                                                                    let existForm = payload.data?.processFormList.length > 0 ? true : false;
                                                                    let formData = payload.data?.processFormList;
                                                                    let context = payload.data?.context
                                                                    return {
                                                                        ...payload,
                                                                        status: payload.code,
                                                                        data: {historyProcNodeList:historyProcNodeList, xmlData:xmlData, finishedInfo:finishedInfo, existForm: existForm, formData: formData, context: context}
                                                                    };
                                                                }
                                                            },
                                                            "data": {
                                                                activeKeyOne: 0,
                                                                activeKeyTwo: 1,
                                                            },
                                                            "body": {
                                                                "type": "tabs",
                                                                "id": "tabs-change",
                                                                "activeKey": "${existForm ? ${activeKeyOne|toInt} : ${activeKeyTwo|toInt}}",
                                                                "tabs": [
                                                                    {
                                                                        "title": "表单信息",
                                                                        "className": "process_detail",
                                                                        "visibleOn": "${existForm}",
                                                                        "tab": [{
                                                                            "type": "page",
                                                                            "body": [{
                                                                                name: 'formRender',
                                                                                asFormItem: true,
                                                                                children: ({ value, onChange, data }) => {
                                                                                    const obj = {
                                                                                        formData: data.__super.formData,
                                                                                        context: data.__super.context,
                                                                                    }
                                                                                    return <FormView data={obj} />
                                                                                }
                                                                            }]
                                                                        }]
                                                                    },
                                                                    {
                                                                        "title": "流转记录",
                                                                        "className": "process_detail",
                                                                        "tab": [{
                                                                            "type": "page",
                                                                            "body": [{
                                                                                name: 'formRender',
                                                                                asFormItem: true,
                                                                                "visibleOn": "${historyProcNodeList}",
                                                                                children: ({ value, onChange, data }) => (
                                                                                    <FlowRecord historyProcNodeList={data.historyProcNodeList} />
                                                                                )
                                                                            }]
                                                                        }]
                                                                    },
                                                                    {
                                                                        "title": "流程跟踪",
                                                                        "className": "process_detail",
                                                                        "tab": [{
                                                                            "type": "page",
                                                                            "body": [{
                                                                                name: 'formRender',
                                                                                "visibleOn": "${xmlData}",
                                                                                children: ({ value, onChange, data }) => (
                                                                                    <BPMNProcessViewer height={height} xml={data.xmlData}
                                                                                        finishedInfo={data.finishedInfo} allCommentList={data.historyProcNodeList}/>
                                                                                )
                                                                            }]
                                                                        }]
                                                                    },
                                                                ]
                                                            }
                                                        },
                                                    }
                                                },
                                            ]
                                        }
                                    ],
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
