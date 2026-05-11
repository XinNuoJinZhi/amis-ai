import getSteps1 from "./steps1"
import getSteps2 from "./steps2"
import { useDevBaseUrl } from "@/utils/util"
import { Encrypt } from '@/utils/cryptojs'
import getOnEventEditSerialNumber from '@/pages/EntityManage/tabs/tabs1/modelEditSerialNumber/onEvent'
import getDialogEditSerialNumber from '@/pages/EntityManage/tabs/tabs1/modelEditSerialNumber/dialog'
export default () => {
    return {
        "type": "wrapper",
        "className": "left_page",
        "body": [
            {
                "type": "tpl",
                "tpl": "数据源"
            },
            {
                "type": "container",
                "body":[
                    {
                        "type": "button",
                        "label": "",
                        "level": "link",
                        "icon": "fa fa-plus",
                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-datasource:create')}",
                        "actionType": "dialog",
                        "className": "text-xl text-dark",
                        "dialog": {
                            "actions": [],
                            "size": "md",
                            "title": "新增数据源",
                            "body": [
                                {
                                    "type": "wizard",
                                    "reload": "my_nav",
                                    "api": {
                                        "url": useDevBaseUrl("/entitymanage/dataSource/confirmCreateDataSource"),
                                        "method": "post",
                                        requestAdaptor: function (api:any) {
                                            let name = api.data.name;
                                            let code = api.data.key ? api.data.key : '';
                                            let base = 1;
                                            let type = 'MYSQL';
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
                                            // let mTables = [
                                            //     {
                                            //         "name": api.data.tableName,
                                            //         "modelName": api.data.type4$modelName,
                                            //         "useSoftDelete": api.data.type4.isDelete,
                                            //         "saveTimestamp": api.data.saveTimestamp,
                                            //         "saveOperator": api.data.operator,
                                            //         "primaryKeyField": api.data.majorKey,
                                            //         "nameField": api.data.title,
                                            //         "mapperMap": {},
                                            //     }
                                            // ]
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
                                                    // "mTables": mTables,
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
                                        //     "databaseName": "${dataName}",
                                        //     "timeZone": "${times}",
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
                                        //     ],
                                        //     "mtables": [
                                        //         {
                                        //             "name": "${tableName}",
                                        //             // "name": "this.tableName",
                                        //             "modelName": "${type4$modelName}",
                                        //             "useSoftDelete": "${type4.isDelete}",
                                        //             "saveTimestamp": "${saveTimestamp}",
                                        //             "saveOperator": "${operator}",
                                        //             "primaryKeyField": "${majorKey}",
                                        //             "nameField": "${title}",
                                        //             "mapperMap": {},
                                        //         }
                                        //     ]
                                        // },
                                        // "adaptor": "return {\n ...payload,\n status: payload.code \n}"
                                    },
                                    "mode": "simple",
                                    "steps": [
                                        getSteps1(),
                                        getSteps2(),
                                    ],
                                    "actionNextSaveLabel": "${source == 0? '下一步': '测试连通性并下一步'}"
                                }
                            ]
                        }
                    },
                    {
                        id:'editSerialNumberButton',
                        type: 'button',
                        label: "",
                        level: "link",
                        icon: "fa fa-file-text-o",
                        className: "text-xl text-dark",
                        actionType: "dialog",
                        onEvent: getOnEventEditSerialNumber(),
                        dialog:getDialogEditSerialNumber()
                    }
                ]
            }
        ]
    }

}
