import AMISFormRender from "@/components/AMISFormRender"
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
                "url": useDevBaseUrl("/application/processManage/process/list"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "categoryKey": "${categoryKey}",
                    "processStartType": 5,
                    "processKey": "${processKey}",
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
            // "filter": {
            //     "title": '',
            //     "body": [
            //         {
            //             "type": 'group',
            //             "body": [
            //                 {
            //                     "type": 'input-text',
            //                     "name": 'processKey',
            //                     "label": '流程标识',
            //                     "clearable": true,
            //                     "placeholder": '请输入流程标识',
            //                     "size": 'sm'
            //                 },
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
            //                     "label": '流程分类',
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
                    "name": 'processKey',
                    "label": '流程标识',
                    "searchable": {
                        "type": 'input-text',
                        "name": 'processKey',
                        "label": '流程标识',
                        "clearable": true,
                        "placeholder": '请输入流程标识',
                        "size": 'sm'
                    }
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
                    "searchable": {
                        "type": 'select',
                        "name": 'categoryKey',
                        "label": '流程分类',
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
                            "label": "发起",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "hiddenOn": "${!(bindInitiationPage || (!bindInitiationPage && processInstanceStartVariablesConfig))}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:process:start')}",
                            "dialog": {
                                "title": "发起流程",
                                "data": {
                                    definitionId: "${definitionId}",
                                    deploymentId: "${deploymentId}",
                                    processInstanceStartVariablesConfig: "${processInstanceStartVariablesConfig}"
                                },
                                "size": "lg",
                                "id": 'start_process',
                                "closeOnEsc":true,
                                "actions": [],
                                "body":[{
                                    type:"page",
                                    initApi: {
                                        "method": "get",
                                        "url": useDevBaseUrl("/processManage/process/getProcessForm?definitionId=${definitionId}&deployId=${deploymentId}"),
                                        adaptor: function (payload:any, response:any, api:any, context:any) {
                                            let formView = payload.data.formContent;
                                            let envVar = payload.data.context;
                                            let definitionId = api.query.definitionId;
                                            let disFields = payload.data.disableFieldsValue
                                            let hiddenFields = payload.data.hiddenFieldsValue
                                            let dataId = payload.data.dataId
                                            let variables = payload.data.variables
                                            let result = payload.code == 0 ? true : false
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { formView: formView, envVar: envVar, definitionId: definitionId, disFields: disFields, hiddenFields: hiddenFields, dataId: dataId, variables: variables, result: result  }
                                            };
                                        },
                                    },
                                    "initFetchOn": "${definitionId}",
                                    "body": [{
                                        name: 'formRender',
                                        asFormItem: true,
                                        "visibleOn": "${result}",
                                        children: ({ value, onChange, data }) => {
                                            return <AMISFormRender isEditor={false} schema={data.formView} disFields={data.disFields} hiddenFields={data.hiddenFields} dataId={data.dataId} variables={data.variables} envVarVal={data.envVar} definitionId={data.definitionId} variablesConfig={data.__super.processInstanceStartVariablesConfig} style={{ height: '400px' }} />
                                        }
                                    }],
                                }],

                            }
                        },{
                            "label": "发起",
                            "type": "button",
                            "level": "link",
                            "hiddenOn": "${!(!bindInitiationPage && !processInstanceStartVariablesConfig)}",
                            "actionType": "ajax",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'appProcessManage:process:start')}",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl("/application/processManage/process/start"),
                                "data": {
                                    "processDefId": "${definitionId}",
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
