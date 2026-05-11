import React, {useState, useEffect, useRef} from 'react';
import { render as amisRender, toast } from 'amis';
import { service } from "@/utils/request"
import ProcessViewer from '@/components/ProcessViewer'
import { getBpmnXmlModelId } from '@/api/bpmn'
import { useDevBaseUrl } from "@/utils/util"
import bus from '@/utils/bus'
import permStore from "@/store/permission"
import {env as amisEnv} from '@/hooks/amis';

const Model: React.FC = props => {
const crudInfo = React.useRef();
let processView: any
bus.on('refresh', async (val) => {
    if (val == '/app/design/model') {
        const crudObj = (crudInfo.current as any).getComponentByName('modelCrud')
        await crudObj.reload()
    }
})

const amisSchema = {
    "id":"crudId",
    "type": "crud",
    "name": 'modelCrud',
    "syncLocation": false,
    "autoFillHeight": true,
    "api": {
        "method": "get",
        "url": useDevBaseUrl("/processManage/model/list"),
        "data": {
            "pageNo": "${page}",
            "pageSize": "${perPage}",
            "modelKey": "${modelKey}",
            "modelName": "${modelName}",
            "categoryKey": "${categoryKey}",
            "processStartType": "${processStartType}",
        },
        adaptor: function (payload: any) {
            return {
                ...payload,
                status: payload.code,
                data: { ...payload?.data, items: payload?.data?.list }
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
        {
            "label": "新增",
            "type": "button",
            "actionType": "dialog",
            "level": "primary",
            "icon": "fa fa-plus",
            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:model:create')}",
            "dialog": {
                "title": "新增流程模型",
                "data": {},
                "body": {
                    "type": "form",
                    "initApi": {
                        "method": "get",
                        "url": useDevBaseUrl("/processManage/model/getZippedSnowflakeId"),
                        adaptor: function (payload: any) {
                            let code = payload.data;
                            return {
                                ...payload,
                                status: payload.code,
                                data: { ...payload.data, code: code}
                            };
                        }
                    },
                    "api": {
                        "method": "post",
                        "url": useDevBaseUrl("/processManage/model"),
                        adaptor: function (payload: any) {
                            return {
                                ...payload,
                                status: payload.code
                            };
                        }
                    },
                    "body": [
                        {
                            "type": "input-text",
                            "name": "modelKey",
                            "label": "模型标识",
                            "required": true,
                            "value": "Process_${code}",
                            "disabled": true
                        },
                        {
                            "type": "input-text",
                            "name": "modelName",
                            "label": "模型名称",
                            "required": true,
                            "value": "业务流程_${code}",
                            "maxLength": 20,
                            "showCounter": true,
                        },
                        {
                            "type": "select",
                            "name": "categoryKey",
                            "label": "流程分类",
                            "required": true,
                            "placeholder": "请选择",
                            "source": {
                                "method": "get",
                                "url": useDevBaseUrl("/processManage/category/list"),
                                "responseData": {
                                    "options": "${items|pick:label~categoryName,value~queryKey}"
                                }
                            }
                        },
                        {
                            "type": "textarea",
                            "name": "description",
                            "label": "描述",
                            "placeholder": "请输入内容",
                            "showCounter": true,
                            "maxLength": 50,
                        }
                    ]
                }
            }
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
            "name": "modelKey",
            "label": "模型标识",
            "searchable": {
                "type": "input-text",
                "name": "modelKey",
                "label": "模型标识",
                "clearable": true,
                "placeholder": "请输入模型标识",
                "size": "sm"
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
            "name": "modelName",
            "label": "模型名称",
            "searchable": {
                "type": "input-text",
                "name": "modelName",
                "label": "模型名称",
                "placeholder": "请输入模型名称",
                "clearable": true,
                "size": "sm"
            }
        },
        {
            "name": "category",
            "label": "流程分类",
            "searchable": {
                "type": "select",
                "name": "categoryKey",
                "label": "流程分类",
                "placeholder": "请选择",
                "clearable": true,
                "size": "sm",
                "source": {
                    "method": "get",
                    "url": useDevBaseUrl("/processManage/category/list"),
                    "responseData": {
                        "options": "${items|pick:label~categoryName,value~queryKey}"
                    }
                }
            }
        },
        {
            "name": "version",
            "label": "模型版本",
            "type": "mapping",
            "map": {
                "0": "<span class='label label-danger'>-</span>",
                "1": "<span class='label label-danger'>v1</span>",
                "2": "<span class='label label-warning'>v2</span>",
                "3": "<span class='label label-info'>v3</span>",
                "4": "<span class='label label-success'>v4</span>",
                "*": "<span class='label label-success'>v${version}</span>"
            }
        },
        {
            "name": "description",
            "label": "描述",
        },
        {
            "name": "creatorStr",
            "label": "创建者",
        },
        {
            "name": "createTime",
            "label": "创建时间",
        },
        {
            "type": "operation",
            "label": "操作",
            "buttons": [
                {
                    "label": "修改",
                    "type": "button",
                    "level": "link",
                    "actionType": "dialog",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:model:update')}",
                    "dialog": {
                        "title": "修改流程模型",
                        "data": {
                            modelKey: "${modelKey}",
                            modelName: "${modelName}",
                            categoryKey: "${categoryKey}",
                            description: "${description}",
                            modelId: "${modelId}"
                        },
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "put",
                                "url": useDevBaseUrl("/processManage/model"),
                                "data": {
                                    "modelId": "${modelId}",
                                    "modelKey": "${modelKey}",
                                    "modelName": "${modelName}",
                                    "categoryKey": "${categoryKey}",
                                    "description": "${description}",
                                },
                            },
                            "body": [
                                {
                                    "type": "input-text",
                                    "name": "modelKey",
                                    "label": "模型标识",
                                    "required": true,
                                    "disabled": true
                                },
                                {
                                    "type": "input-text",
                                    "name": "modelName",
                                    "label": "模型名称",
                                    "required": true,
                                    "maxLength": 20,
                                    "showCounter": true,
                                    // "disabled": true
                                },
                                {
                                    "type": "select",
                                    "name": "categoryKey",
                                    "label": "流程分类",
                                    "required": true,
                                    "placeholder": "请选择",
                                    "source": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/processManage/category/list"),
                                        "responseData": {
                                            "options": "${items|pick:label~categoryName,value~queryKey}"
                                        }
                                    }
                                },
                                {
                                    "type": "textarea",
                                    "name": "description",
                                    "label": "描述",
                                    "placeholder": "请输入内容",
                                    "showCounter": true,
                                    "maxLength": 50,
                                }
                            ]
                        }
                    }
                },
                {
                    "label": "设计",
                    "type": "button",
                    "level": "link",
                    "onEvent": {
                        "click": {
                            "actions": [
                                {
                                    "actionType": "custom",
                                    "script": function (e:any) {
                                        const params = new URLSearchParams(window.location.search);
                                        // window.open('./processManage/model/edit?appid='+params.get('appid')+'&env='+params.get('env')+'&xml=' + JSON.stringify(e.props.data))
                                        window.open(window.location.origin + '/app/design/processManage/model/edit?appid=' + params.get('appid')+'&env='+params.get('env')+'&modelId=' + e.props.data.modelId+'&modelKey=' + e.props.data.modelKey)
                                        // localStorage.setItem('bpmnXml',JSON.stringify(e.props.data))
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "label": "部署",
                    "type": "button",
                    "level": "link",
                    "actionType": "ajax",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:model:deploy')}",
                    "confirmText": "确认要部署「" + "${modelName}" + "」吗？",
                    "api": {
                        "url": useDevBaseUrl("/processManage/model/deployByModelKey?modelKey=${modelKey}"),
                        "method": "GET",
                        adaptor: function (payload: any) {
                            return {
                                ...payload,
                                status: payload.code,
                            }
                        }
                    },
                },
                {
                    "label": "删除",
                    "type": "button",
                    "level": "link",
                    "actionType": "ajax",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:model:delete')}",
                    "confirmText": "确认要删除「" + "${modelName}" + "」吗？",
                    "api": {
                        "url": useDevBaseUrl("/processManage/model/${modelId}"),
                        "method": "delete",
                        adaptor: function (payload: any) {
                            return {
                                ...payload,
                                status: payload.code,
                            }
                        }
                    },
                },
                {
                    "label": "历史",
                    "type": "button",
                    "level": "link",
                    "actionType": "dialog",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:model:historyList')}",
                    "dialog": {
                        "title": "模型历史",
                        "actions": [
                            {
                                "label": "关闭",
                                "actionType": "close",
                                "level": "default",
                                "type": "button",
                            }
                        ],
                        "data": {
                            modelKey: "${modelKey}"
                        },
                        "size": "lg",
                        "body": {
                            "type": "crud",
                            "syncLocation": false,
                            "autoFillHeight": true,
                            "api": {
                                "method": "get",
                                "url": useDevBaseUrl("/processManage/model/historyList"),
                                "data": {
                                    "pageNo": "${page}",
                                    "pageSize": "${perPage}",
                                    "modelKey": "${modelKey}",
                                },
                                adaptor: function (payload: any) {
                                    return {
                                        ...payload,
                                        status: payload.code
                                    };
                                }
                            },
                            "footerToolbar": [
                                "statistics",
                                "switch-per-page",
                                "pagination"
                            ],
                            "alwaysShowPagination": true,
                            "columns": [
                                {
                                    "name": "modelKey",
                                    "label": "模型标识",
                                },
                                {
                                    "name": "modelName",
                                    "label": "模型名称",
                                },
                                {
                                    "name": 'processStartTypeStr',
                                    "label": '流程开始类型',
                                },
                                {
                                    "name": "category",
                                    "label": "流程分类",
                                },
                                {
                                    "name": "version",
                                    "label": "模型版本",
                                    "type": "mapping",
                                    "map": {
                                        "1": "<span class='label label-danger'>v1</span>",
                                        "2": "<span class='label label-warning'>v2</span>",
                                        "3": "<span class='label label-info'>v3</span>",
                                        "4": "<span class='label label-success'>v4</span>",
                                        "*": "<span class='label label-success'>v${version}</span>"
                                    }
                                },
                                {
                                    "name": "description",
                                    "label": "描述",
                                },
                                {
                                    "name": "creatorStr",
                                    "label": "创建者",
                                },
                                {
                                    "name": "createTime",
                                    "label": "创建时间",
                                },
                                {
                                    "type": "operation",
                                    "label": "操作",
                                    "buttons": [
                                        {
                                            "label": "部署",
                                            "type": "button",
                                            "level": "link",
                                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:model:deploy')}",
                                            "actionType": "ajax",
                                            "confirmText": "确认要部署「" + "${modelName}" + "」吗？",
                                            "api": {
                                                "url": useDevBaseUrl("/processManage/model/deploy?modelId=${modelId}"),
                                                "method": "GET",
                                            },
                                        }, {
                                            "label": "设为最新",
                                            "type": "button",
                                            "level": "link",
                                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:model:latest')}",
                                            "actionType": "ajax",
                                            "confirmText": "确认要将「" + "${modelName}" + "」设为最新吗？",
                                            "api": {
                                                "url": useDevBaseUrl("/processManage/model/latest?modelId=${modelId}"),
                                                "method": "post"
                                            },
                                        },
                                        {
                                            "label": "流程图",
                                            "type": "button",
                                            "level": "link",
                                            "actionType": "dialog",
                                            "onEvent": {
                                                "click": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            "script": async function (e:any) {
                                                                let xml = await getBpmnXmlModelId(e.props.data.modelId)
                                                                if(xml.data.code != 0) {
                                                                    toast.error(xml.data.msg, {
                                                                        position: 'top-right'
                                                                    });
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
                                                "size": "full",
                                                "closeOnEsc":true,
                                                "body": [{
                                                    name: 'bpmPicture',
                                                    asFormItem: true,
                                                    children: ({ value, onChange, data }) => (
                                                        <ProcessViewer xml={processView} style={{ height: '400px' }} />
                                                    )
                                                }],
                                            }
                                        }
                                    ]
                                }
                            ],
                            "placeholder": "暂无数据"
                        },
                        "onEvent": {
                            "confirm": {
                                "actions": [
                                    {
                                    "actionType": "reload",
                                    "componentId": "crudId",
                                    }
                                ]
                            },
                            "cancel": {
                                "actions": [
                                    {
                                    "actionType": "reload",
                                    "componentId": "crudId",
                                    }
                                ]
                                }
                            }
                    }
                },
                {
                    "label": "流程图",
                    "type": "button",
                    "level": "link",
                    "actionType": "dialog",
                    "onEvent": {
                        "click": {
                            "actions": [
                                {
                                    "actionType": "custom",
                                    "script": async function (e, data) {
                                        let xml = await getBpmnXmlModelId(e.props.data.modelId)
                                        if(xml.data.code != 0) {
                                            toast.error(xml.data.msg, {
                                                position: 'top-right'
                                            });
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
                }
            ]
        }
    ],
    "placeholder": "暂无数据"
}
return (
    <>
        <div>
            {amisRender(amisSchema, {
                scopeRef: (ref: any) => (crudInfo.current = ref),
                context: {
                    $$permissionsData: permStore.getState().permData,
                }
            }, {
                fetcher: service,
                theme: amisEnv.theme
            })}
        </div>
    </>
)};

export default Model;
