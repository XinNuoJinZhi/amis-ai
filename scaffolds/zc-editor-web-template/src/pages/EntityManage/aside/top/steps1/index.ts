import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import { Encrypt } from '@/utils/cryptojs'
export default () => {
    return {
        "title": "数据源设置",
        "body": [
            {
                "name": "name",
                "mode": "horizontal",
                "label": "数据源名称",
                "type": "input-text",
                "required": "true",
                "size": "md",
                "placeholder": "请输入数据源名称",
                "maxLength": 200,
                "showCounter": true,
            },
            {
                "name": "key",
                "mode": "horizontal",
                "label": "数据源Key",
                "maxLength": 28,
                "showCounter": true,
                "type": "input-text",
                "size": "md",
                "placeholder": "请输入数据源Key",
                "desc": "数据源资源标识，请输入唯一且符合字母开头，由字母数字组成的文本<br><span style='color: red'>新建数据源后不可修改，在数据库名和代码生成后的前后端文件夹名中使用，请谨慎选择一两个(最好一个)最能代表模块业务含义的英文单词，小写驼峰命名，如order、scoreStat等</span>",
                "validations": "matchRegexp:^[a-zA-Z][A-Za-z0-9]*$",
                "trimContents": true,
                "validationErrors": {
                    "matchRegexp": "请输入合法的变量名"
                }
            },
            // {
            //     "name": "source",
            //     "mode": "horizontal",
            //     "label": "数据库来源",
            //     "type": "list-select",
            //     "size": "md",
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
                "type": "fieldSet",
                // "visibleOn": "source == 1",
                "headingClassName": "ceshi",
                "body": [
                    {
                        "name": "typeSelect",
                        "mode": "horizontal",
                        "label": "数据库类型",
                        "type": "select",
                        "size": "md",
                        "required": true,
                        "value": "MYSQL",
                        "id": "typeSelect",
                        "labelField": "label",
                        "valueField": "key",
                        "options": [
                            {
                                "label": "mysql",
                                "key": "MYSQL"
                            }
                        ]
                    },
                    {
                        "type": "alert",
                        "title": "",
                        "hiddenOn": "data.source != 1",
                        // "body": "以下所有输入都支持使用环境变量，使用语法为\\${ VARIABLE_NAME}<br/>${IFS(typeSelect == 'MYSQL' ,'注意：MYSQL数据库名，表名不支持大小写敏感，建议全部用小写。','')}",
                        "body": "${IFS(typeSelect == 'MYSQL' ,'注意：MYSQL数据库名，表名不支持大小写敏感，建议全部用小写。','')}",
                        "level": "info",
                        "className": "mb-3"
                    },
                    {
                        "type": "fieldSet",
                        "title": "数据库配置",
                        "collapsable": false,
                        "collapsed": false,
                        "mode": "horizontal",
                        "size": "md",
                        "body": [
                            {
                                "type": "group",
                                "body": [
                                    {
                                        "required": true,
                                        "type": "input-text",
                                        "name": "databaseAddress",
                                        "label": "数据库地址",
                                        "placeholder": "请输入数据库地址",
                                        "size": "md"
                                    },
                                    {
                                        "type": "input-number",
                                        "name": "port",
                                        "label": ":",
                                        "placeholder": "端口",
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
                                "placeholder": "请输入数据库名",
                                "label": "数据库名",
                                "size": "md",
                                "desc": "开发环境数据库名称最好_dev结尾来区分。",
                                "name": "dataName",
                                "onEvent": {
                                    "change": {
                                        "actions": [
                                            {
                                                "actionType": "setValue",
                                                "componentId": "testData",
                                                "args": {
                                                    "value": "${dataName}_test"
                                                }
                                            },
                                            {
                                                "actionType": "setValue",
                                                "componentId": "officialData",
                                                "args": {
                                                    "value": "${dataName}_prod"
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "type": "input-text",
                                "placeholder": "+08:00",
                                "label": "时区",
                                "size": "md",
                                "desc": "数据库时区",
                                "name": "times"
                            },
                            {
                                "type": "input-number",
                                "value": 10,
                                "label": "最大连接数",
                                "size": "md",
                                "desc": "连接池最大连接数限制，只能限制到单个 pod，设置时请参考当前 pod 数。",
                                "name": "batteries"
                            },
                            {
                                "type": "input-text",
                                "label": "用户名",
                                "required": true,
                                "placeholder": "请输入用户名",
                                "size": "md",
                                "name": "user"
                            },
                            {
                                "type": "input-password",
                                "label": "密码",
                                "required": true,
                                "placeholder": "请输入密码",
                                "size": "md",
                                "name": "password"
                            }
                        ]
                    }
                ]
            },
            // {
            //     "type": "tabs",
            //     "tabsMode": "card",
            //     "hiddenOn": "source != 1",
            //     // "hiddenOn": "data.source != 1",
            //     "tabs": [
            //         {
            //             "title": "测试环境",
            //             "tab": [
            //                 {
            //                     "name": "testSwitch",
            //                     "type": "switch",
            //                     "label": "复用账号",
            //                     "mode": "horizontal",
            //                     "desc": "与开发环境相同",
            //                     "value": true
            //                 },
            //                 {
            //                     "type": "input-text",
            //                     "required": true,
            //                     "placeholder": "请输入数据库名",
            //                     "label": "数据库名",
            //                     "mode": "horizontal",
            //                     "size": "md",
            //                     // "disabled": true,
            //                     "value": "",
            //                     "desc": "如果数据库名与其他环境数据库名一致时将共用模型数据。",
            //                     "name": "testDataName",
            //                     "id": "testData"
            //                 },
            //                 {
            //                     "visibleOn": "testSwitch == false",
            //                     "type": "group",
            //                     "mode": "horizontal",
            //                     "body": [
            //                         {
            //                             "required": true,
            //                             "type": "input-text",
            //                             "name": "testAddress",
            //                             "label": "数据库地址",
            //                             "placeholder": "请输入数据库地址",
            //                             "size": "md"
            //                         },
            //                         {
            //                             "type": "input-number",
            //                             "name": "testPort",
            //                             "label": ":",
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
            //                     "required": true,
            //                     "placeholder": "请输入用户名",
            //                     "mode": "horizontal",
            //                     "size": "md",
            //                     "name": "testUser"
            //                 },
            //                 {
            //                     "visibleOn": "testSwitch == false",
            //                     "type": "input-password",
            //                     "label": "密码",
            //                     "required": true,
            //                     "placeholder": "请输入密码",
            //                     "mode": "horizontal",
            //                     "size": "md",
            //                     "name": "testPassword"
            //                 }
            //             ]
            //         },
            //         {
            //             "title": "正式环境",
            //             "body": [
            //                 {
            //                     "name": "officialSwitch",
            //                     "type": "switch",
            //                     "label": "复用账号",
            //                     "desc": "与开发环境相同",
            //                     "mode": "horizontal",
            //                     "value": true
            //                 },
            //                 {
            //                     "type": "input-text",
            //                     "required": true,
            //                     "placeholder": "请输入数据库名",
            //                     "mode": "horizontal",
            //                     "label": "数据库名",
            //                     "size": "md",
            //                     // "disabled": true,
            //                     "id": "officialData",
            //                     "desc": "如果数据库名与其他环境数据库名一致时将共用模型数据。",
            //                     "name": "officialDataName"
            //                 },
            //                 {
            //                     "visibleOn": "officialSwitch == false",
            //                     "type": "group",
            //                     "mode": "horizontal",
            //                     "body": [
            //                         {
            //                             "required": true,
            //                             "type": "input-text",
            //                             "name": "officialAddress",
            //                             "label": "数据库地址",
            //                             "placeholder": "请输入数据库地址",
            //                             "size": "md"
            //                         },
            //                         {
            //                             "type": "input-number",
            //                             "name": "officialPort",
            //                             "label": ":",
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
            //                     "visibleOn": "officialSwitch == false",
            //                     "type": "input-text",
            //                     "label": "用户名",
            //                     "mode": "horizontal",
            //                     "required": true,
            //                     "placeholder": "请输入用户名",
            //                     "size": "md",
            //                     "name": "officialUser"
            //                 },
            //                 {
            //                     "visibleOn": "officialSwitch == false",
            //                     "type": "input-password",
            //                     "label": "密码",
            //                     "required": true,
            //                     "placeholder": "请输入密码",
            //                     "mode": "horizontal",
            //                     "size": "md",
            //                     "name": "officialPassword"
            //                 }
            //             ]
            //         }
            //     ]
            // }
        ],
        "api": {
            "method": "post",
            "url": useDevBaseUrl("/entitymanage/dataSource/test"),
            requestAdaptor: function (api:any) {
                let name = api.data.name;
                let code = api.data.key ? api.data.key : '';
                let base = 1;
                let type = api.data.typeSelect;
                let host = api.data.databaseAddress;
                let port = api.data.port;
                let databaseName = api.data.dataName;
                let timeZone = api.data.times ? api.data.times : '';
                let poolLimit = api.data.batteries;
                let userName = api.data.user;
                let password = Encrypt(api.data.password);
                let dataSourceEnvs = [
                    {
                        "sameAsDev": api.data.testSwitch,
                        "databaseName": api.data.testDataName,
                        "host": api.data.testAddress ? api.data.testAddress : '',
                        "port": api.data.testPort ? api.data.testPort : '',
                        "userName": api.data.testUser ? api.data.testUser : '',
                        "password": api.data.testPassword ? Encrypt(api.data.testPassword) : '',
                        "env": "2"
                    },
                    {
                        "sameAsDev": api.data.officialSwitch,
                        "databaseName": api.data.officialDataName,
                        "host": api.data.officialAddress ? api.data.officialAddress : '',
                        "port": api.data.officialPort ? api.data.officialPort : '',
                        "userName": api.data.officialUser ? api.data.officialUser : '',
                        "password": api.data.officialPassword ? Encrypt(api.data.officialPassword) : '',
                        "env": "4"
                    }
                ]
                return {
                    ...api,
                    data: {
                        "name": name,
                        "code": code,
                        "base": base,
                        "type": type,
                        "host": host,
                        "port": port,
                        "databaseName": databaseName,
                        "timeZone": timeZone,
                        "poolLimit": poolLimit,
                        "userName": userName,
                        "password": password,
                        "dataSourceEnvs": dataSourceEnvs,
                    }
                };
            },
            adaptor: function (payload:any) {
                return {
                    ...payload,
                    status: payload.code
                };
            },
            // "data": {
            //     "name": "${name}",
            //     "code": "${key}",
            //     "base": "${source}",
            //     "type": "${typeSelect}",
            //     "host": "${databaseAddress}",
            //     "port": "${port}",
            //     "timeZone": "${times}",
            //     "databaseName": "${dataName}",
            //     "poolLimit": "${batteries}",
            //     "userName": "${user}",
            //     "password": "${password}",
            //     "dataSourceEnvs": [
            //         {
            //             "sameAsDev": "${testSwitch}",
            //             "databaseName": "${testDataName}",
            //             "host": "${testAddress}",
            //             "port": "${testPort}",
            //             "userName": "${testUser}",
            //             "password": "${testPassword}",
            //             "env": "2"
            //             // "env": "${env}"
            //         },
            //         {
            //             "sameAsDev": "${officialSwitch}",
            //             "databaseName": "${officialDataName}",
            //             "host": "${officialAddress}",
            //             "port": "${officialPort}",
            //             "userName": "${officialUser}",
            //             "password": "${officialPassword}",
            //             "env": "4"
            //             // "env": "${env}"
            //         }
            //     ]
            // },
            // "adaptor": "return {\n ...payload,\n status: payload.code \n}"
        }
    }

}
