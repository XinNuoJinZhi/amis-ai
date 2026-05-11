import ProcessViewer from '@/components/ProcessViewer'
import { getDeployBpmnXml } from '@/api/bpmn'
import { useDevBaseUrl } from "@/utils/util"
import { toast } from 'amis';
import {AMISComponent} from "@/hooks/amis";
let processView: any
const schema = {
    type: 'page',
    body: [
        {
            type: 'crud',
            syncLocation: false,
            autoFillHeight: true,
            id: "deploy_list",
            api: {
                method: 'get',
                url: useDevBaseUrl('/processManage/deploy/page'),
                data: {
                    pageNo: '${page}',
                    pageSize: '${perPage}',
                    processKey: '${processKey}',
                    processName: '${processName}',
                    categoryKey: '${categoryKey}',
                    state: '${state}',
                    processStartType: "${processStartType}",
                },
                adaptor: function (payload:any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload?.data, items: payload?.data?.list }
                    };
                }
            },
            // filter: {
            //     title: '',
            //     body: [
            //         {
            //             type: 'group',
            //             body: [
            //                 {
            //                     type: 'input-text',
            //                     name: 'processKey',
            //                     label: '流程标识',
            //                     clearable: true,
            //                     placeholder: '请输入流程标识',
            //                     size: 'sm'
            //                 },
            //                 {
            //                     "type": 'select',
            //                     "name": 'processStartType',
            //                     "label": '流程开始类型',
            //                     "placeholder": '请选择',
            //                     "clearable": true,
            //                     "size": 'sm',
            //                     "options": [
            //                         {
            //                             "label": "定时开始",
            //                             "value": "1"
            //                         },
            //                         {
            //                             "label": "事件触发",
            //                             "value": "3"
            //                         },
            //                         {
            //                             "label": "人工触发",
            //                             "value": "5"
            //                         }
            //                     ]
            //                 },
            //                 {
            //                     type: 'input-text',
            //                     name: 'processName',
            //                     label: '流程名称',
            //                     placeholder: '请输入流程名称',
            //                     clearable: true,
            //                     size: 'sm'
            //                 },
            //                 {
            //                     type: 'select',
            //                     name: 'categoryId',
            //                     label: '流程分类',
            //                     placeholder: '请选择',
            //                     clearable: true,
            //                     size: 'sm',
            //                     source: {
            //                         method: 'get',
            //                         url: useDevBaseUrl('/processManage/category/list'),
            //                         responseData: {
            //                             options: '${items|pick:label~categoryName,value~id}'
            //                         }
            //                     }
            //                 },
            //                 {
            //                     type: 'select',
            //                     name: 'state',
            //                     label: '状态',
            //                     placeholder: '请选择状态',
            //                     clearable: true,
            //                     size: 'sm',
            //                     options: [
            //                         {
            //                             label: '激活',
            //                             value: 'active'
            //                         },
            //                         {
            //                             label: '挂起',
            //                             value: 'suspended'
            //                         }
            //                     ]
            //                 }
            //             ]
            //         }
            //     ],
            //     actions: [
            //         {
            //             type: 'reset',
            //             label: '重置'
            //         },
            //         {
            //             type: 'submit',
            //             level: 'primary',
            //             label: '查询'
            //         }
            //     ]
            // },
            headerToolbar: [
                {
                    type: "columns-toggler",
                    align: "right",
                    "draggable": true,
                },
                {
                    "type": "reload",
                    "align": "right",
                },
            ],
            footerToolbar: ["statistics", 'switch-per-page', 'pagination'],
            "alwaysShowPagination": true,
            "autoGenerateFilter": true,
            columns: [
                {
                    name: 'processKey',
                    label: '流程标识',
                    "searchable": {
                        type: 'input-text',
                        name: 'processKey',
                        label: '流程标识',
                        clearable: true,
                        placeholder: '请输入流程标识',
                        size: 'sm'
                    }
                },
                {
                    "name": 'processStartTypeStr',
                    "label": '流程开始类型',
                    "searchable": {
                        "type": 'select',
                        "name": 'processStartType',
                        "label": '流程开始类型',
                        "placeholder": '请选择',
                        "clearable": true,
                        "size": 'sm',
                        "options": [
                            {
                                "label": "定时开始",
                                "value": "1"
                            },
                            {
                                "label": "事件触发",
                                "value": "3"
                            },
                            {
                                "label": "人工触发",
                                "value": "5"
                            }
                        ]
                    }
                },
                {
                    name: 'processName',
                    label: '流程名称',
                    "searchable": {
                        type: 'input-text',
                        name: 'processName',
                        label: '流程名称',
                        placeholder: '请输入流程名称',
                        clearable: true,
                        size: 'sm'
                    }
                },
                {
                    name: 'category',
                    label: '流程分类',
                    "searchable": {
                        type: 'select',
                        name: 'categoryKey',
                        label: '流程分类',
                        placeholder: '请选择',
                        clearable: true,
                        size: 'sm',
                        source: {
                            method: 'get',
                            url: useDevBaseUrl('/processManage/category/list'),
                            responseData: {
                                options: '${items|pick:label~categoryName,value~queryKey}'
                            }
                        }
                    }
                },
                {
                    name: 'version',
                    label: '流程版本',
                    type: 'mapping',
                    map: {
                        "1": "<span class='label label-danger'>v1</span>",
                        "2": "<span class='label label-warning'>v2</span>",
                        "3": "<span class='label label-info'>v3</span>",
                        "4": "<span class='label label-success'>v4</span>",
                        "*": "<span class='label label-success'>v${version}</span>"
                    }
                },
                {
                    "name": 'modelVersion',
                    "label": '模型版本',
                    "type": 'mapping',
                    "map": {
                        "1": "<span class='label label-danger'>v1</span>",
                        "2": "<span class='label label-warning'>v2</span>",
                        "3": "<span class='label label-info'>v3</span>",
                        "4": "<span class='label label-success'>v4</span>",
                        "*": "<span class='label label-success'>v${modelVersion}</span>"
                    }
                },
                {
                    name: 'state',
                    label: '状态',
                    type: 'mapping',
                    map: {
                        false: "<span class='label label-success'>启用</span>",
                        true: "<span class='label label-info'>停用</span>"
                    },
                    "searchable": {
                        type: 'select',
                        name: 'state',
                        label: '状态',
                        placeholder: '请选择状态',
                        clearable: true,
                        size: 'sm',
                        options: [
                            {
                                label: '启用',
                                value: 'active'
                            },
                            {
                                label: '停用',
                                value: 'suspended'
                            }
                        ]
                    }
                },
                {
                    name: 'deploymentTime',
                    label: '部署时间'
                },
                {
                    type: 'operation',
                    label: '操作',
                    buttons: [
                        {
                            label: '版本管理',
                            type: 'button',
                            level: 'link',
                            actionType: 'dialog',
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:deploy:publishQuery')}",
                            dialog: {
                                title: '版本管理',
                                "data": {
                                    processKey: "${processKey}"
                                },
                                size: 'lg',
                                body: {
                                    type: 'crud',
                                    syncLocation: false,
                                    autoFillHeight: true,
                                    api: {
                                        method: 'get',
                                        url: useDevBaseUrl('/processManage/deploy/publishList'),
                                        data: {
                                            pageNo: '${page}',
                                            pageSize: '${perPage}',
                                            processKey: '${processKey}'
                                        },
                                        adaptor: function (payload:any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, items: payload?.data?.list }
                                            };
                                        }
                                    },
                                    footerToolbar: ["statistics", 'switch-per-page', 'pagination'],
                                    "alwaysShowPagination": true,
                                    columns: [
                                        {
                                            name: 'processKey',
                                            label: '流程标识'
                                        },
                                        {
                                            name: 'processName',
                                            label: '流程名称'
                                        },
                                        {
                                            "name": 'processStartTypeStr',
                                            "label": '流程开始类型',
                                        },
                                        {
                                            name: 'version',
                                            label: '流程版本',
                                            type: 'mapping',
                                            map: {
                                                "1": "<span class='label label-danger'>v1</span>",
                                                "2": "<span class='label label-warning'>v2</span>",
                                                "3": "<span class='label label-info'>v3</span>",
                                                "4": "<span class='label label-success'>v4</span>",
                                                "*": "<span class='label label-success'>v${version}</span>"
                                            }
                                        },
                                        {
                                            name: 'modelVersion',
                                            label: '模型版本',
                                            type: 'mapping',
                                            map: {
                                                "1": "<span class='label label-danger'>v1</span>",
                                                "2": "<span class='label label-warning'>v2</span>",
                                                "3": "<span class='label label-info'>v3</span>",
                                                "4": "<span class='label label-success'>v4</span>",
                                                "*": "<span class='label label-success'>v${modelVersion}</span>"
                                            }
                                        },
                                        {
                                            name: 'state',
                                            label: '状态',
                                            type: 'mapping',
                                            map: {
                                                false:
                                                    "<span class='label label-success'>启用</span>",
                                                true: "<span class='label label-info'>停用</span>"
                                            }
                                        },
                                        {
                                            type: 'operation',
                                            label: '操作',
                                            buttons: [
                                                {
                                                    label: "${state == false ? '停用' : '启用'}",
                                                    type: 'button',
                                                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:deploy:changeState')}",
                                                    level: 'link',
                                                    actionType: 'ajax',
                                                    api: {
                                                        url: useDevBaseUrl('/processManage/deploy/changeState'),
                                                        method: 'get',
                                                        data: {
                                                            state:
                                                                "${state == false ? 'suspended' : 'active'}",
                                                            definitionId: '${definitionId}'
                                                        }
                                                    }
                                                },
                                                {
                                                    "label": "流程图",
                                                    "type": "button",
                                                    "level": "link",
                                                    "actionType": "dialog",
                                                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:deploy:bpmnXml')}",
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    "script": async function (e:any) {
                                                                        let xml = await getDeployBpmnXml(e.props.data.definitionId)
                                                                        if(xml.data.code != 0) {
                                                                            toast.error(xml.data.msg, {
                                                                                position: "top-right"
                                                                            })
                                                                            return
                                                                        }
                                                                        processView = xml.data.data
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    "dialog": {
                                                        "title": "流程图",
                                                        "actions": [
                                                            {
                                                                "label": "关闭",
                                                                "actionType": "close",
                                                                "level": "default",
                                                                "type": "button",
                                                            }
                                                        ],
                                                        "size": "xl",
                                                        "closeOnEsc":true,
                                                        "body": [{
                                                            name: 'bpmPicture',
                                                            asFormItem: true,
                                                            children: ({ value, onChange, data }) => (
                                                                <ProcessViewer xml={processView} style={{ height: '400px' }} />
                                                            )
                                                        }],
                                                    }
                                                },
                                                {
                                                    label: '删除',
                                                    type: 'button',
                                                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:deploy:delete')}",
                                                    level: 'link',
                                                    actionType: 'ajax',
                                                    confirmText: "确认要删除「" + "${processName}" + "」吗？",
                                                    api: {
                                                        url: useDevBaseUrl('/processManage/deploy/${deploymentId}'),
                                                        method: 'delete'
                                                    }
                                                }
                                            ]
                                        }
                                    ],
                                    placeholder: '暂无数据'
                                },
                                "actions": [
                                    {
                                        "type": "button",
                                        "actionType": "confirm",
                                        "label": "关闭",
                                        onEvent: {
                                            "click": {
                                                "actions": [{
                                                    "actionType": "reload",
                                                    "componentId": "deploy_list"
                                                }]
                                            },
                                        }
                                    }
                                ],
                                // "onEvent": {
                                //     "confirm": {
                                //         "actions": [{
                                //             "actionType": "reload",
                                //             "componentId": "deploy_list"
                                //         }]
                                //     },
                                //     "cancel": {
                                //         "actions": [
                                //             {
                                //                 "actionType": "reload",
                                //                 "componentId": "deploy_list",
                                //             }
                                //         ]
                                //     }
                                // },
                            }
                        },
                        {
                            "label": "流程图",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:deploy:bpmnXml')}",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": async function (e:any) {
                                                let xml = await getDeployBpmnXml(e.props.data.definitionId)
                                                if(xml.data.code != 0) {
                                                    toast.error(xml.data.msg, {
                                                        position: "top-right"
                                                    })
                                                    return
                                                }
                                                processView = xml.data.data
                                            }
                                        }
                                    ]
                                }
                            },
                            "dialog": {
                                "title": "流程图",
                                "actions": [
                                    {
                                        "label": "关闭",
                                        "actionType": "close",
                                        "level": "default",
                                        "type": "button",
                                    }
                                ],
                                "size": "xl",
                                "closeOnEsc":true,
                                "body": [{
                                    name: 'bpmPicture',
                                    asFormItem: true,
                                    children: ({ value, onChange, data }) => (
                                        <ProcessViewer xml={processView} style={{ height: '400px' }} />
                                    )
                                }],
                            }
                        },
                        {
                            label: '删除',
                            type: 'button',
                            level: 'link',
                            actionType: 'ajax',
                            confirmText: "确认要删除「" + "${processName}" + "」吗？",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:deploy:delete')}",
                            api: {
                                url: useDevBaseUrl('/processManage/deploy/${deploymentId}'),
                                method: 'delete'
                            }
                        }
                    ]
                }
            ],
            placeholder: '暂无数据'
        }
    ]
}

export default () => <AMISComponent schema={schema} />;
