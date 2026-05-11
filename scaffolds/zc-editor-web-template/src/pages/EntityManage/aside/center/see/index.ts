import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
export default () => {
    return {
        "type": "button",
        "label": "查看信息",
        "actionType": "dialog",
        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-datasource:query')}",
        "dialog": {
            "size": "md",
            "title": "数据源信息",
            "actions": [
                {
                    "label": "关闭",
                    "actionType": "close",
                    "level": "default",
                    "type": "button",
                }
            ],
            "data": {
                queryKey: "${queryKey}",
            },
            "body": [
                {
                    "type": "form",
                    "columnCount": 2,
                    "initApi": useDevBaseUrl("/entitymanage/dataSource/getInfo?dsKey=${queryKey}"),
                    "body": [
                        {
                            "type": "fieldSet",
                            "title": "基本信息",
                            "mode": "horizontal",
                            "body": [
                                {
                                    "type": "control",
                                    "label": "同步模式",
                                    "className": "entity_detail",
                                    "body": {
                                        "type": "mapping",
                                        "value": 4,
                                        "map": {
                                            "4": "<span class='label label-primary'>自动同步</span>"
                                        }
                                    }
                                },
                                {
                                    "type": "control",
                                    "label": "隔离模式",
                                    "className": "entity_detail",
                                    "body": {
                                        "type": "mapping",
                                        "value": 1,
                                        "map": {
                                            "1": "<span class='label label-success'>数据库隔离</span>"
                                        }
                                    }
                                },
                                {
                                    "type": "input-text",
                                    "label": "数据源名称",
                                    "disabled": true,
                                    "name": "data.name",
                                    "size": "md",
                                    "maxLength": 200,
                                    "showCounter": true,
                                },
                                {
                                    "type": "input-text",
                                    "label": "数据源Key",
                                    // "required": true,
                                    // "name": "data.queryKey",
                                    "name": "data.code",
                                    "size": "md",
                                    "static": true
                                },
                                {
                                    "type": "control",
                                    "label": "是否忽略大小写",
                                    "className": "entity_detail",
                                    "name": "data.caseNotSensitive",
                                    "body": {
                                        "type": "mapping",
                                        "map": {
                                            true: "<span>是</span>",
                                            false: "<span>否</span>",
                                        }
                                    }
                                },
                                // {
                                //     "type": "list-select",
                                //     "label": "数据库来源",
                                //     "clearable": true,
                                //     "disabled": true,
                                //     "name": "data.base",
                                //     "value": 0,
                                //     "id": "source1",
                                //     "source": {
                                //         "method": "get",
                                //         "url": useAdminBaseUrl("/system/dict-data/list?dictType=datasource_base&status=0"),
                                //         adaptor: function (payload: any) {
                                //             payload.data.map((item: any) => { return { ...payload.data, value: Number(item.value) } })
                                //             return {
                                //                 ...payload,
                                //                 status: payload.code,
                                //                 data: { ...payload.data, options: payload.data }
                                //             };
                                //         },
                                //     },
                                // },
                                {
                                    "name": "typeSelect",
                                    "mode": "horizontal",
                                    "label": "数据库类型",
                                    "type": "select",
                                    "size": "md",
                                    "required": true,
                                    "value": "MYSQL",
                                    "id": "typeSelect",
                                    "disabled": true,
                                    "labelField": "label",
                                    "valueField": "key",
                                    "hiddenOn": "data.base != 1",
                                    "options": [
                                        {
                                            "label": "mysql",
                                            "key": "MYSQL"
                                        }
                                    ]
                                },
                                {
                                    "hiddenOn": "data.base != 1",
                                    "type": "fieldSet",
                                    "title": "开发环境",
                                    "collapsable": false,
                                    "collapsed": false,
                                    "mode": "horizontal",
                                    "disabled": true,
                                    "size": "md",
                                    "body": [
                                        {
                                            "type": "group",
                                            "body": [
                                                {
                                                    "required": true,
                                                    "type": "input-text",
                                                    "name": "data.host",
                                                    "label": "数据库地址",
                                                    "size": "md",
                                                },
                                                {
                                                    "type": "input-number",
                                                    "name": "data.port",
                                                    "label": ":",
                                                    "labelClassName": "w-auto p-r-none",
                                                    "size": "xs",
                                                    "horizontal": {
                                                        "left": "col-sm-0",
                                                        "right": "col-sm-8"
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "type": "input-text",
                                            "required": true,
                                            "label": "数据库名",
                                            "size": "md",
                                            "desc": "开发环境数据库名称最好_dev结尾来区分。",
                                            "name": "data.databaseName",
                                        },
                                        {
                                            "type": "input-text",
                                            "label": "时区",
                                            "size": "md",
                                            "desc": "数据库时区",
                                            "name": "data.timeZone"
                                        },
                                        {
                                            "type": "input-number",
                                            "label": "最大连接数",
                                            "size": "md",
                                            "desc": "连接池最大连接数限制，只能限制到单个 pod，设置时请参考当前 pod 数。",
                                            "name": "data.poolLimit"
                                        },
                                        {
                                            "type": "input-text",
                                            "label": "用户名",
                                            "required": true,
                                            "size": "md",
                                            "name": "data.userName"
                                        },
                                        // {
                                        //     "type": "input-password",
                                        //     "label": "密码",
                                        //     "required": true,
                                        //     "placeholder": "请输入密码",
                                        //     "size": "md",
                                        //     "name": "password"
                                        // }
                                    ]
                                },
                                // {
                                //     "type": "tabs",
                                //     "tabsMode": "card",
                                //     "hiddenOn": "data.base != 1",
                                //     "tabs": [
                                //         {
                                //             "title": "测试环境",
                                //             "tab": [
                                //                 {
                                //                     "name": "data.dataSourceEnvs[0].sameAsDev",
                                //                     "type": "switch",
                                //                     "label": "复用账号",
                                //                     "mode": "horizontal",
                                //                     "desc": "与开发环境相同",
                                //                     "disabled": true,
                                //                     "value": true
                                //                 },
                                //                 {
                                //                     "type": "input-text",
                                //                     "required": true,
                                //                     "placeholder": "请输入数据库名",
                                //                     "label": "数据库名",
                                //                     "disabled": true,
                                //                     "mode": "horizontal",
                                //                     "size": "md",
                                //                     // "disabled": true,
                                //                     "value": "",
                                //                     "desc": "如果数据库名与其他环境数据库名一致时将共用模型数据。",
                                //                     "name": "data.dataSourceEnvs[0].databaseName",
                                //                     "id": "testData"
                                //                 },
                                //                 {
                                //                     "visibleOn": "data.dataSourceEnvs[0].sameAsDev == false",
                                //                     "type": "group",
                                //                     "mode": "horizontal",
                                //                     "body": [
                                //                         {
                                //                             "required": true,
                                //                             "type": "input-text",
                                //                             "name": "data.dataSourceEnvs[0].host",
                                //                             "label": "数据库地址",
                                //                             "placeholder": "请输入数据库地址",
                                //                             "disabled": true,
                                //                             "size": "md"
                                //                         },
                                //                         {
                                //                             "type": "input-number",
                                //                             "name": "data.dataSourceEnvs[0].port",
                                //                             "label": ":",
                                //                             "disabled": true,
                                //                             "placeholder": "端口",
                                //                             "labelClassName": "w-auto p-r-none",
                                //                             "size": "xs",
                                //                             "horizontal": {
                                //                                 "left": "col-sm-0",
                                //                                 "right": "col-sm-8"
                                //                             }
                                //                         }
                                //                     ]
                                //                 },
                                //                 {
                                //                     "visibleOn": "testSwitch == false",
                                //                     "type": "input-text",
                                //                     "label": "用户名",
                                //                     "disabled": true,
                                //                     "required": true,
                                //                     "placeholder": "请输入用户名",
                                //                     "mode": "horizontal",
                                //                     "size": "md",
                                //                     "name": "data.dataSourceEnvs[0].userName"
                                //                 },
                                //                 // {
                                //                 //     "visibleOn": "testSwitch == false",
                                //                 //     "type": "input-password",
                                //                 //     "label": "密码",
                                //                 //     "required": true,
                                //                 //     "placeholder": "请输入密码",
                                //                 //     "mode": "horizontal",
                                //                 //     "size": "md",
                                //                 //     "name": "testPassword"
                                //                 // }
                                //             ]
                                //         },
                                //         {
                                //             "title": "正式环境",
                                //             "body": [
                                //                 {
                                //                     "name": "data.dataSourceEnvs[1].sameAsDev",
                                //                     "type": "switch",
                                //                     "label": "复用账号",
                                //                     "desc": "与开发环境相同",
                                //                     "disabled": true,
                                //                     "mode": "horizontal",
                                //                     "value": true
                                //                 },
                                //                 {
                                //                     "type": "input-text",
                                //                     "required": true,
                                //                     "placeholder": "请输入数据库名",
                                //                     "mode": "horizontal",
                                //                     "disabled": true,
                                //                     "label": "数据库名",
                                //                     "size": "md",
                                //                     // "disabled": true,
                                //                     "id": "officialData",
                                //                     "desc": "如果数据库名与其他环境数据库名一致时将共用模型数据。",
                                //                     "name": "data.dataSourceEnvs[1].databaseName"
                                //                 },
                                //                 {
                                //                     "visibleOn": "data.dataSourceEnvs[1].sameAsDev == false",
                                //                     "type": "group",
                                //                     "mode": "horizontal",
                                //                     "body": [
                                //                         {
                                //                             "required": true,
                                //                             "type": "input-text",
                                //                             "name": "data.dataSourceEnvs[0].host",
                                //                             "label": "数据库地址",
                                //                             "placeholder": "请输入数据库地址",
                                //                             "disabled": true,
                                //                             "size": "md"
                                //                         },
                                //                         {
                                //                             "type": "input-number",
                                //                             "name": "data.dataSourceEnvs[0].port",
                                //                             "label": ":",
                                //                             "placeholder": "端口",
                                //                             "labelClassName": "w-auto p-r-none",
                                //                             "size": "xs",
                                //                             "disabled": true,
                                //                             "horizontal": {
                                //                                 "left": "col-sm-0",
                                //                                 "right": "col-sm-8"
                                //                             }
                                //                         }
                                //                     ]
                                //                 },
                                //                 {
                                //                     "visibleOn": "officialSwitch == false",
                                //                     "type": "input-text",
                                //                     "label": "用户名",
                                //                     "mode": "horizontal",
                                //                     "disabled": true,
                                //                     "required": true,
                                //                     "placeholder": "请输入用户名",
                                //                     "size": "md",
                                //                     "name": "data.dataSourceEnvs[0].userName"
                                //                 },
                                //                 // {
                                //                 //     "visibleOn": "officialSwitch == false",
                                //                 //     "type": "input-password",
                                //                 //     "label": "密码",
                                //                 //     "required": true,
                                //                 //     "placeholder": "请输入密码",
                                //                 //     "mode": "horizontal",
                                //                 //     "size": "md",
                                //                 //     "name": "officialPassword"
                                //                 // }
                                //             ]
                                //         }
                                //     ]
                                // }
                            ]
                        }
                    ]
                }
            ]
        }
    }
}
