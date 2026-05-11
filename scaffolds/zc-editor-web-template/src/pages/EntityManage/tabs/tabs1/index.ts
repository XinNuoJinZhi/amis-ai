import { toast, } from "amis"
import getModelDesign from "./modelDesign"
import getModelJson from "./modelJson"
import getModelTable from "./modelTable"
import getModelEditTable from "./modelEditTable"
import BigNumber from "bignumber.js"
import { history } from '@umijs/max';
import { useDevBaseUrl } from "@/utils/util"
import {adminUrl} from '@/utils/env'
import createThroughExcel from "./createThroughExcel"
import getOnEventJson from '@/pages/EntityManage/tabs/tabs1/modelJson/onEvent';
import getDialogJson from '@/pages/EntityManage/tabs/tabs1/modelJson/dialog';
import getOnEventTable from '@/pages/EntityManage/tabs/tabs1/modelTable/onEvent';
import getDialogTable from '@/pages/EntityManage/tabs/tabs1/modelTable/dialog';
import getOnEventEditTable from '@/pages/EntityManage/tabs/tabs1/modelEditTable/onEvent';
import getDialogEditTable from '@/pages/EntityManage/tabs/tabs1/modelEditTable/dialog';
import createThroughDataBase from "./createThroughDataBase"
export default () => {
    return {
        title: "实体模型",
        visibleOn: "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:query')}",
        unmountOnExit: true,
        body: [{
            type: 'service',
            id: "verifyAll",
            body: [
                {
                    type: "crud",
                    id: "entityModel",
                    source: "${entityModel}",
                    draggable: true,
                    syncLocation: false,
                    autoFillHeight: true,
                    saveOrderApi: {
                        url: useDevBaseUrl("/entitymanage/table/sort"),
                        adaptor: function (payload: any) {
                            console.log(payload, 'payloadpayloadpayload')
                            if (payload.data) {
                                toast.success('排序成功', {
                                    position: "top-center"
                                })
                            }
                            return payload
                        }
                        // "data":{
                        //     "id": "${ids.id}",
                        // }
                    },//表排序
                    "api": {
                        "url": useDevBaseUrl("/entitymanage/table/getTableList?pageNo=${page}&pageSize=${perPage}&dsKey=${dsKey}&name=${searchName}"),
                        "sendOn": "this.dsKey",
                        "trackExpression": "none",
                        adaptor: function (payload: any, response: any, api: any) {
                            payload.data = {
                                entityModel: payload.data,
                            }
                            if (payload.data.entityModel?.length === 0 && (api.query.pageNo == 1 || api.query.pageNo == "")) {
                                payload.data.disabledVerifyAll = true
                            } else {
                                payload.data.disabledVerifyAll = false
                            }
                            console.log(payload,'payloadpayloadpayloadpayload')
                            return payload
                        }
                    },
                    autoGenerateFilter: {
                        columnsNum: 2,
                        showBtnToolbar: false
                    },
                    headerToolbar: [
                        {
                            type: "columns-toggler",
                            align: "right",
                            draggable: true,
                            overlay: true,
                            footerBtnSize: "sm"
                        },
                        {
                            type: "reload",
                            align: "right",
                        },
                        {
                            type: "button",
                            align: "left",
                            label: "新建实体模型",
                            level: "primary",
                            actionType: "dialog",
                            visibleOn: "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:create')}",
                            disabledOn: "${my_nav?true:false}",
                            dialog: {
                                title: "新建模型",
                                size: "md",
                                body: {
                                    type: "form",
                                    preventEnterSubmit: true,
                                    api: {
                                      "method": "post",
                                      "url": useDevBaseUrl("/entitymanage/table/saveModel"),
                                      requestAdaptor: function (api:any) {
                                        const params = new URLSearchParams(window.location.search);
                                        let data = {
                                          ...api,
                                          data: {
                                            dsKey: params.get('dsKey'),
                                            tableName: api.body.formName,
                                            name: api.body.newModel,
                                            comment: api.body.comment
                                          }
                                        };
                                        return data
                                      },
                                      adaptor: function (payload: any, response: any, api: any) {
                                            return {
                                                ...payload,
                                                status: payload.code
                                            };
                                        }
                                    },
                                    body: [
                                        {
                                            type: "input-text",
                                            name: "newModel",
                                            label: "模型名称",
                                            required: "true",
                                            placeholder: "请填写模型名称",
                                            onEvent: {
                                                change: {
                                                    actions: [
                                                        {
                                                            actionType: "setValue",
                                                            componentId: "formName",
                                                            args: {
                                                                value: "${newModel}"
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            name: "formName",
                                            id: "formName",
                                            type: "input-text",
                                            label: "表名",
                                            desc: "不可修改，请仔细填写，建议只用小写英文和下划线",
                                            placeholder: "请填写表名",
                                            required: "true",
                                            maxLength: 64,
                                            validations: {
                                                matchRegexp: "^[a-zA-Z_][A-Za-z0-9_]*$"
                                                // "matchRegexp": "^[^A-Z]*$"
                                            },
                                            validationErrors: {
                                                matchRegexp: "请填写规范的表名"
                                                // "matchRegexp": "不能包含大写字母"
                                            }
                                        },
                                        {
                                            label: '注释',
                                            type: 'input-text',
                                            mode: 'horizontal',
                                            name: 'comment',
                                            maxLength: 300,
                                            showCounter: true
                                        },
                                        {
                                            "label": "主键模式",
                                            "name": "primaryKeyMode",
                                            "type": "button-group-select",
                                            "value": "ASSIGN_ID",
                                            "options": [
                                                {
                                                    "label": "雪花",
                                                    "value": "ASSIGN_ID",
                                                },
                                                {
                                                    "label": "自增",
                                                    "value": "AUTO",
                                                }
                                            ]
                                        }
                                    ]
                                },
                                actions: [
                                    {
                                        type: "button",
                                        actionType: "close",
                                        label: "取消"
                                    },
                                    {
                                        type: "button",
                                        label: "确认",
                                        level: "primary",
                                        actionType: "confirm",
                                        api: {
                                          url: useDevBaseUrl('/entitymanage/table/saveModel'),
                                          method: "post",
                                          requestAdaptor: function (api:any) {
                                            const params = new URLSearchParams(window.location.search);
                                            let data = {
                                              ...api,
                                              data: {
                                                dsKey: params.get('dsKey'),
                                                tableName: api.body.formName,
                                                name: api.body.newModel,
                                                comment: api.body.comment,
                                                primaryKeyMode: api.body.primaryKeyMode,
                                                confirmed:true
                                              }
                                            };
                                            return data
                                          },
                                        },
                                        primary: true
                                    },
                                ]
                            }
                        },
                        createThroughExcel(),
                        createThroughDataBase(),
                        {
                            type: 'button',
                            label: "全部验证",
                            level: 'default',
                            disabledOn: "${disabledVerifyAll}",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:create')}",
                            onEvent: {
                                click: {
                                    actions: [
                                        {
                                            actionType: "custom",
                                            script: function (context: any, doAction: any, event: any) {
                                                doAction({
                                                    actionType: "dialog", dialog:
                                                        getVerifyDialog(useDevBaseUrl("/entitymanage/table/validateTableByDataSource?dsKey=${dsKey}"), doAction)
                                                })
                                            }
                                        }
                                    ]
                                }
                            },
                        },
                        {
                            id:'jsonButton',
                            type: 'button',
                            label: "生成元数据json",
                            level: 'default',
                            actionType: "dialog",
                            onEvent: getOnEventJson(),
                            dialog:getDialogJson()
                        },
                        {
                            id:'tableButton',
                            type: 'button',
                            label: "生成建表语句",
                            level: 'default',
                            actionType: "dialog",
                            onEvent: getOnEventTable(),
                            dialog:getDialogTable()
                        },
                        {
                            id:'editTableButton',
                            type: 'button',
                            label: "生成修改表语句",
                            level: 'default',
                            actionType: "dialog",
                            onEvent: getOnEventEditTable(),
                            dialog:getDialogEditTable()
                        },
                        {
                            "type": 'button',
                            "label": "查看权限数据",
                            "level": 'default',
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": async function () {
                                                let url = adminUrl + '/system/menu?menuScenario=1'
                                                window.open(url)
                                            }
                                        }
                                    ]
                                }
                            },
                        }
                    ],
                    columns: [
                        {
                            name: "name",
                            label: "模型名称",
                            align: "center",
                            searchable: {
                                type: "input-text",
                                name: "searchName",
                                label: "请输入模型名称",
                                "id":"searchName",
                            }
                        },
                        {
                            name: "code",
                            label: "表名",
                            align: "center"
                        },
                        {
                            // "name": "creator",
                            name: "creatorName",
                            label: "创建人",
                            align: "center"
                        },
                        {
                            // "name": "updater",
                            name: "updaterName",
                            label: "修改人",
                            align: "center"
                        },
                        {
                            name: "createTime",
                            label: "创建时间",
                            align: "center"
                        },
                        {
                            name: "updateTime",
                            label: "修改时间",
                            align: "center"
                        },
                        {
                            name: "validateStatus",
                            label: "验证状态",
                            visibleOn: "${ARRAYINCLUDES(${ $$permissionsData }, 'entitymanage:meta-table:validate')}",
                            align: "center",
                            type: "mapping",
                            map: {
                                "0": "<span class='label label-success'>已通过</span>",
                                "1": "<span class='label label-info'>待验证</span>",
                                "2": "<span class='label label-danger'>未通过</span>",
                            }
                        },
                        {
                            type: "operation",
                            label: "操作",
                            align: "center",
                            buttons: [
                                getModelDesign(),
                                // {
                                //     label: "数据管理",
                                //     level: "link",
                                //     visibleOn: "${ARRAYINCLUDES(${ $$permissionsData }, 'devApp:datamanage:edit')}",
                                //     onEvent: {
                                //         click: {
                                //             actions: [
                                //                 {
                                //                     actionType: "custom",
                                //                     script: async function (row: any) {
                                //                         let data = row.props.data;
                                //                         let appid = new BigNumber(data.appId).toString(36);
                                //                         let env = data.env;
                                //                         let dsKey = data.dsKey;
                                //                         let queryKey = data.queryKey;
                                //                         history.push('/app/design/dataManage?appid=' + appid + '&env=' + env + '&dsKey=' + dsKey + '&queryKey=' + queryKey)
                                //                     }
                                //                 }
                                //             ]
                                //         }
                                //     }
                                // },
                                {
                                    label: "删除",
                                    level: "link",
                                    // reload: "none",
                                    actionType: "ajax",
                                    visibleOn: "${ARRAYINCLUDES(${ $$permissionsData }, 'entitymanage:meta-table:delete')}",
                                    // api: {
                                        // url: useDevBaseUrl('/entitymanage/table/removeTableById?tableKey=${queryKey}'),
                                        // method: 'delete'
                                    // },
                                    "editorSetting": {
                                        "behavior": "delete"
                                    },
                                    "confirmText": "确定要删除？",
                                    type: "button",
                                    api: {
                                        url: useDevBaseUrl('/entitymanage/table/removeTableById?tableKey=${queryKey}&confirmed=true'),
                                        method: 'delete'
                                    },
                                    primary: true
                                },
                                // {
                                //     label: "解绑",
                                //     level: "link",
                                //     confirmText: "是否解绑该数据表？",
                                //     actionType: "ajax",
                                //     api: {
                                //         url: useDevBaseUrl('/entitymanage/table/unbindTable?tableKey=${queryKey}'),
                                //         method: 'delete',
                                //         adaptor: function (payload: any) {
                                //             return {
                                //                 ...payload,
                                //                 status: payload.code,
                                //             }
                                //         },
                                //     },
                                //     visibleOn: "${ARRAYINCLUDES(${ $$permissionsData }, 'entitymanage:meta-table:delete')}",
                                // },
                                {
                                    label: "验证",
                                    level: "link",
                                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:create')}",
                                    disabledOn: "this.validateStatus === 0",
                                    onEvent: {
                                        click: {
                                            actions: [
                                                {
                                                    actionType: "custom",
                                                    script: function (context: any, doAction: any, event: any) {
                                                        const queryKey = event.data.queryKey
                                                        doAction({ actionType: "dialog", dialog: getVerifyDialog(useDevBaseUrl("/entitymanage/table/validateTable?tableKey=" + queryKey), doAction) })
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                },
                                getModelJson(),
                                getModelTable(),
                                getModelEditTable(),
                                {
                                    label: "初始化权限数据",
                                    level: "link",
                                    actionType: "ajax",
                                    visibleOn: "${ARRAYINCLUDES(${ $$permissionsData }, 'entitymanage:meta-table:delete')}",
                                    "confirmText": "确定要初始化权限数据？",
                                    type: "button",
                                    api: {
                                        url: useDevBaseUrl('/entitymanage/table/generatePermissions?dsKey=${dsKey}&tableKey=${queryKey}'),
                                        method: 'get',
                                        "messages": {
                                            "success": "初始化成功"
                                        }
                                    },
                                    primary: true
                                },
                            ]
                        }
                    ]
                }]
        }],
    }
}
const getVerifyDialog = (url: string, doAction: Function) => {
    return {
        title: "验证结果",
        actions: [
            {
                type: "button",
                actionType: "confirm",
                label: "确定",
                primary: true
            }
        ],
        body: {
            type: "form",
            initApi: {
                url,
                adaptor: function (payload: any, response: any, api: any, context: any) {
                    const result = payload?.data ? Object.entries(payload.data).map(([key, value]) => {
                        return { name: key, value: value };
                    }) : [];
                    // debugger
                    doAction({
                        "actionType": "reload",
                        // "target": "entityModel"
                        componentId: "entityModel"
                    })
                    return {
                        ...payload,
                        data: { result }
                    };
                }
            },
            body: [
                {
                    type: "each",
                    source: '${result}',
                    visibleOn: "${result.length > 0}",
                    items: [
                        {
                            type: "alert",
                            level: "${item.value.length > 0 ? 'info' : 'success'}",
                            body: [
                                { type: 'container', body: "${item.name}", className: 'text-lg font-medium' },
                                {
                                    type: "each",
                                    visibleOn: "${item.value.length > 0}",
                                    source: '${item.value}',
                                    items: {
                                        type: "container",
                                        body: "${index + 1}. ${item}"
                                    }
                                },
                                {
                                    type: 'container',
                                    visibleOn: "${item.value.length === 0}",
                                    body: "验证通过",
                                }
                            ],
                        },
                    ]
                },
                {
                    type: 'alert',
                    level: "success",
                    visibleOn: "result.length===0",
                    body: "验证通过",
                    className: "py-2"
                }
            ]
        },
    }
}

