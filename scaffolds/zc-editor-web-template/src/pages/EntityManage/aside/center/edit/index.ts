import { getDataSourceName } from "@/api/entitymanage";
import { toast } from "amis";
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import appDefaultImg from '@/assets/imgs/app-default.png';
import { Encrypt, Decrypt } from '@/utils/cryptojs';
export default () => {
    return {
        "type": "button",
        "label": "编辑",
        "reload": "my_nav",
        "actionType": "dialog",
        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-datasource:update')}",
        "dialog": {
            "id": "dataDialog",
            "size": "md",
            "title": "数据源信息",
            "data": {
                queryKey: "${queryKey}",
            },
            "body": [
                {
                    "type": "form",
                    "initApi": {
                                method: 'get',
                                url: useDevBaseUrl("/entitymanage/dataSource/getInfo?dsKey=${queryKey}"),
                                adaptor: function (payload: any) {
                                    console.log(payload,';payload编辑')
                                    // Encrypt
                                    let data = {
                                        ...payload,
                                        status: payload.code,
                                        data:{
                                                ...payload?.data?.data
                                        }
                                    }
                                    console.log(data.data.dataSourceEnvs,'data.data.dataSourceEnvs')
                                    if(data?.data?.dataSourceEnvs?.length > 0){
                                        data.data.officialDataName=payload.data.data.dataSourceEnvs[0].databaseName
                                        data.data.officialAddress=payload.data.data.dataSourceEnvs[0].host
                                        data.data.officialPort=payload.data.data.dataSourceEnvs[0].port
                                        data.data.officialUser=payload.data.data.dataSourceEnvs[0].userName
                                        // data.data.officialPassword=payload.data.data.dataSourceEnvs[0].password

                                        data.data.testDataName=payload.data.data.dataSourceEnvs[1].databaseName
                                        data.data.testAddress=payload.data.data.dataSourceEnvs[1].host
                                        data.data.testPort=payload.data.data.dataSourceEnvs[1].port
                                        data.data.testUser=payload.data.data.dataSourceEnvs[1].userName
                                        // data.data.testPassword=payload.data.data.dataSourceEnvs[1].password
                                    }
                                    console.log(data,'data')
                                    return data;
                                }
                            },
                    "reload": "nav",
                    "body": [
                        {
                            "type": "fieldSet",
                            "title": "基本信息",
                            "mode": "horizontal",
                            "body": [
                                {
                                    "type": "control",
                                    "label": "同步模式",
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
                                    "required": true,
                                    "name": "name",
                                    "size": "md",
                                    "maxLength": 200,
                                    "showCounter": true,
                                },
                                {
                                    "type": "input-text",
                                    "label": "数据源Key",
                                    "required": true,
                                    "name": "code",
                                    "size": "md",
                                    "static": true
                                },
                                // {
                                //     "type": "list-select",
                                //     "label": "数据库来源",
                                //     "clearable": true,
                                //     "disabled": true,
                                //     "name": "base",
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
                                    "labelField": "label",
                                    "valueField": "key",
                                    "visibleOn": '${base == 1}',
                                    "options": [
                                        {
                                            "label": "mysql",
                                            "key": "MYSQL"
                                        }
                                    ]
                                },
                                {
                                    "type": "group",
                                    "mode": "horizontal",
                                    "visibleOn": '${base == 1}',
                                    "body": [
                                        {
                                            "required": true,
                                            "type": "input-text",
                                            "name": "host",
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
                                    "visibleOn": "base == 1",
                                    "type": "input-text",
                                    "required": true,
                                    "placeholder": "请输入数据库名",
                                    "mode": "horizontal",
                                    "label": "数据库名",
                                    "size": "md",
                                    // "disabled": true,
                                    "id": "officialData",
                                    "desc": "如果数据库名与其他环境数据库名一致时将共用模型数据。",
                                    "name": "databaseName"
                                },
                                {
                                    "visibleOn": "base == 1",
                                    "type": "input-text",
                                    "label": "用户名",
                                    "mode": "horizontal",
                                    "required": true,
                                    "placeholder": "请输入用户名",
                                    "size": "md",
                                    "name": "userName"
                                },
                                {
                                    "visibleOn": "base == 1",
                                    "type": "input-password",
                                    "label": "密码",
                                    "placeholder": "请输入密码",
                                    "mode": "horizontal",
                                    "size": "md",
                                    "name": "payLoadPassword",
                                    "revealPassword":false,
                                    "description": "如需修改密码，请填写新密码，如不需修改密码，请保持空"
                                },
                                // {
                                //     "visibleOn": "base == 1",
                                //     "type": "tabs",
                                //     "tabsMode": "card",
                                //     "tabs": [
                                //         {
                                //             "visibleOn": '${dataSourceEnvs.length > 1}',
                                //             "title": "测试环境",
                                //             "body": [
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
                                //                     "type": "input-text",
                                //                     "label": "用户名",
                                //                     "mode": "horizontal",
                                //                     "required": true,
                                //                     "placeholder": "请输入用户名",
                                //                     "size": "md",
                                //                     "name": "officialUser"
                                //                 },
                                //                 {
                                //                     "type": "input-password",
                                //                     "label": "密码",
                                //                     "placeholder": "请输入密码",
                                //                     "mode": "horizontal",
                                //                     "size": "md",
                                //                     "name": "officialPassword",
                                //                     "revealPassword":false,
                                //                     "description": "如需修改密码，请填写新密码，如不需修改密码，请保持空"
                                //                 }
                                //             ]
                                //         },
                                //         {
                                //             "visibleOn": '${dataSourceEnvs.length > 1}',
                                //             "title": "正式环境",
                                //             "tab": [
                                //                 {
                                //                     "type": "input-text",
                                //                     "required": true,
                                //                     "placeholder": "请输入数据库名",
                                //                     "label": "数据库名",
                                //                     "mode": "horizontal",
                                //                     "size": "md",
                                //                     "value": "",
                                //                     "desc": "如果数据库名与其他环境数据库名一致时将共用模型数据。",
                                //                     "name": "testDataName",
                                //                 },
                                //                 {
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
                                //                     "type": "input-text",
                                //                     "label": "用户名",
                                //                     "required": true,
                                //                     "placeholder": "请输入用户名",
                                //                     "mode": "horizontal",
                                //                     "size": "md",
                                //                     "name": "testUser"
                                //                 },
                                //                 {
                                //                     "type": "input-password",
                                //                     "label": "密码",
                                //                     "placeholder": "请输入密码",
                                //                     "mode": "horizontal",
                                //                     "size": "md",
                                //                     "name": "testPassword",
                                //                     "revealPassword":false,
                                //                     "description": "如需修改密码，请填写新密码，如不需修改密码，请保持空"
                                //                 }
                                //             ]
                                //         }
                                //     ]
                                // }
                            ]
                        }
                    ]
                }
            ],
            "actions": [
                {
                    "type": "button",
                    "label": "取消",
                    "close": true,
                },
                {
                    "level": "info",
                    "type": "button",
                    "label": "确认",
                    "close": false,
                    "onEvent": {
                        "click": {
                            "actions": [
                                {
                                    "actionType": "custom",
                                    script: function (e: any, doAction: any, event: any) {
                                        console.log(e, 'e')
                                        console.log(doAction, 'doAction')
                                        console.log(event, 'event')

                                        let dataSourceEnvs = event.data.dataSourceEnvs.length == 0 ? [] : [
                                            {
                                                "sameAsDev": false,
                                                "databaseName": event.data.testDataName,
                                                "host": event.data.testAddress ? event.data.testAddress : '',
                                                "port": event.data.testPort ? event.data.testPort : '',
                                                "userName": event.data.testUser ? event.data.testUser : '',
                                                "password": 'testPassword' in event.data ?
                                                  event.data.testPassword == '' ? event.data.dataSourceEnvs[0].password : Encrypt(event.data.testPassword) : event.data.dataSourceEnvs[0].password,
                                                "env": "4"
                                            },
                                            {
                                                "sameAsDev": false,
                                                "databaseName": event.data.officialDataName,
                                                "host": event.data.officialAddress ? event.data.officialAddress : '',
                                                "port": event.data.officialPort ? event.data.officialPort : '',
                                                "userName": event.data.officialUser ? event.data.officialUser : '',
                                                "password": 'officialPassword' in event.data ?
                                                  event.data.officialPassword == '' ? event.data.dataSourceEnvs[1].password : Encrypt(event.data.officialPassword) : event.data.dataSourceEnvs[1].password,
                                                "env": "2"
                                            }
                                        ]
                                        let postData = {
                                            ...event.data,
                                            base:event.data.base,
                                            name: event.data.name,
                                            code: event.data.code ? event.data.code : '',
                                            type: "MYSQL",
                                            host: event.data.host,
                                            port: event.data.port,
                                            databaseName: event.data.databaseName,
                                            timeZone: event.data.timeZone ? event.data.timeZone : '',
                                            poolLimit: event.data.poolLimit,
                                            userName: event.data.userName,
                                            password: 'payLoadPassword' in event.data ?
                                              event.data.payLoadPassword == '' ? event.data.password : Encrypt(event.data.payLoadPassword) : event.data.password,
                                            dataSourceEnvs:dataSourceEnvs
                                        }
                                        delete postData.testDataName
                                        delete postData.testAddress
                                        delete postData.testPort
                                        delete postData.testUser
                                        delete postData.testPassword
                                        delete postData.officialDataName
                                        delete postData.officialAddress
                                        delete postData.officialPort
                                        delete postData.officialUser
                                        delete postData.officialPassword
                                        delete postData.payLoadPassword
                                        console.log(postData,'postData')
                                        getDataSourceName(event.data.queryKey,postData).then((res: any) => {
                                            console.log(res, '返回值')
                                            if (res.data.code == 403 || res.data.code == 500) {
                                                return toast.error(res.data.msg, {
                                                    position: "top-center"
                                                })
                                                return
                                            };
                                            toast.success('修改成功', {
                                                position: "top-center"
                                            })
                                            doAction({ actionType: "reload", componentId: "my_nav" });
                                            doAction({ actionType: "closeDialog", componentId: "dataDialog" });
                                        }).catch((error: any) => {
                                            console.log(error, '错误返回值')
                                            return toast.error('错误', {
                                                position: "top-center"
                                            })
                                        })
                                    }
                                }
                            ]
                        }
                    }
                }
            ],
        }
    }
}
