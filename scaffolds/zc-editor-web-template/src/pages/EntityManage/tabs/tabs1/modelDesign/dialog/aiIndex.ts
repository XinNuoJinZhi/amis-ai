import {format} from "sql-formatter"
import getBase from "./base"
import getField from "./field"
import getIndex from "./myIndex/index"
import getRelationship from "./relationship"
import {useDevBaseUrl} from "@/utils/util"
import {toast} from 'amis';

export default () => {
    let refTable: any
    let refTables1: any
    let refTableType: any
    let refIndex: any
    let codeName: any
    let nameFieldData: any
    let inverseData: any
    let inverseJoinColumnCodes: any
    let inverseJoinColumnKeys: any
    let fanData: any
    let relationNullable: any
    let moneyData: any = [] // 金额数组
    let middleData: any = {
        joinTableCode: false,
        joinColumnCode: false,
        inverseJoinColumnCode: false,
        editCode: false,
        editName: false
    }
    return {
        "title": ' ',
        "size": "lg",
        "className":"aiModeDesign",
        "name":"aiModeDesign",
        "id":"aiModeDesign",
        "showCloseButton": true,
        "actions": [
            {
                "type": "button",
                "actionType": "close",
                "label": "取消"
            },
            {
                "hotKey": "enter",
                "type": "button",
                "label": "确认",
                "level": "primary",
                "visibleOn": "${CONTAINS(${$$permissionsData},'entitymanage:meta-table:update')}",
                // "visibleOn": "${CONTAINS(${$$permissionsData},'entitymanage:meta-table:update') && CONTAINS(${ss:acl},'write')}",
                "actionType": "confirm",
                "feedback": {
                    "title": "确认",
                    "visibleOn": "this.data !== null",
                    "position": "top-center",
                    "skipRestOnCancel": true,
                    "size": "md",
                    "body": {
                        "type": "form",
                        "body": [
                            {
                                "type": "alert",
                                "title": "本次操作将涉及 DB 变更，请确认",
                                "body": [{
                                    "type": "code",
                                    "language": "sql",
                                    "value": "${confirmText|raw}"
                                }],
                                "position": "top-center",
                                "level": "warning",
                                "className": "mb-3"
                            }
                        ]
                    },
                    "actions": [
                        {
                            "type": "button",
                            "actionType": "close",
                            "label": "取消"
                        },
                        {
                            "type": "button",
                            "actionType": "confirm",
                            "api": {
                                "url": useDevBaseUrl("/entitymanage/table/createModelByTableInfo/true"),
                                "method": "post",
                                "data": {
                                    "metaTable": {
                                        "dsKey": '${dsKey}',
                                        "code": "${code}",
                                        "name": "${name}",
                                        "key": "${key}",
                                        "env": '${env}',
                                        "description": "${description}",
                                        "synchronousFlag": '${synchronousFlag}',
                                        "nameField": "${nameField}",
                                        "titleTpl": "${titleTpl}",
                                        "creator": "${creator}",
                                        "updater": "${updater}",
                                        "createTime": "${createTime}",
                                        "deletedBy": "${deletedBy}",
                                        "ignoreTenant": "${ignoreTenant}",
                                        "updateTime": "${updateTime}",
                                        "timeEnableFlag": "${timeEnableFlag}",
                                        "createEnableFlag": "${createEnableFlag}",
                                        "useSoftDelete": '${useSoftDelete}',
                                        "treePattern": '${tree? 0: 0}',
                                        "tree": '${tree}',
                                        "type": '${type}',
                                        "appId": '${appId}',
                                        "ver": "${ver}",
                                        "id": "${id}",
                                        "queryKey": "${queryKey}",
                                        "latest": '${latest}',
                                        "tableKey": "${queryKey}",
                                    },
                                    "fields": '${ss:fieldCrud}',
                                    "indexes": '${ss:keyCrud}',
                                    "relations": '${ss:affectCrud}',
                                    "removeRelations": '${ss:removeRelations}'
                                },
                                adaptor: function (payload: any) {
                                    console.log(payload, 'payloadpayloadpayload');
                                    if (payload.data) {
                                        if (payload.data.length > 0) {
                                            toast.warning('以下语句未生效：' + payload.data);
                                        }
                                    }
                                    return {
                                        ...payload,
                                        status: payload.code,
                                        data: {...payload.data,}
                                    };
                                }
                            },
                            "label": "确认",
                            "primary": true,
                            "onEvent": {
                                "click": {
                                    "weight": 0,
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": function(_, doAction, event){
                                                setTimeout(()=>{
                                                    doAction({
                                                        actionType: "reload",
                                                        componentId: "entityModel",
                                                    });
                                                },1000)
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            },

        ],
        "body": [
            {
                "type": "form",
                "mode": "horizontal",
                "id":"aiForm",
                "initApi": {
                    "method": "get",
                    "url": useDevBaseUrl("/entitymanage/table/getTableInfo?tableKey=${queryKey}"),
                    adaptor: function (payload: any) {
                        console.log(JSON.parse(sessionStorage.getItem('dataValue')))
                        let aiValue = JSON.parse(sessionStorage.getItem('dataValue')).response
                        console.log(aiValue, 'aiValueaiValue')
                        sessionStorage.setItem('fieldCrud', JSON.stringify(aiValue.fields))
                        sessionStorage.setItem('acl', JSON.stringify(aiValue.acl))
                        sessionStorage.setItem('keyCrud', JSON.stringify(aiValue.indexes))
                        sessionStorage.setItem('affectCrud', JSON.stringify([]))
                        sessionStorage.setItem('cacheEditList', JSON.stringify([]))
                        sessionStorage.setItem('removeRelations', JSON.stringify([]))
                        let formulArr: any[] = []
                        aiValue.fields.forEach((item: any) => {
                            if (item.type != 'formula'
                                && item.systemFieldType != 8
                                && item.systemFieldType != 7
                                && item.systemFieldType != 6
                                && item.systemFieldType != 9) {
                                formulArr.push(item)
                            }
                        })
                        sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                        let fieldKeyCrudss = aiValue.fields.map((res: any) => {
                            if (res.type != 'relation' && res.type != 'formula'
                                && res.type != 'textarea'
                                && res.type != 'rich-text'
                                && res.type != 'json'
                                && res.type != 'attachment'
                                && res.type != 'image'
                                && res.type != 'ciphertext'
                                && res.type != 'users'
                            ) {
                                if (res.type == 'text' && res?.config.length < 768) {
                                    return res
                                } else if (res.type != 'text') {
                                    return res;
                                }
                            }
                        })
                        console.log(fieldKeyCrudss, 'fieldKeyCrudss')
                        sessionStorage.setItem('fieldKeyCrudss', JSON.stringify(fieldKeyCrudss))
                        let data = aiValue
                        nameFieldData = data.metaTable.nameField
                        sessionStorage.setItem('nameFieldData', data.metaTable.nameField)
                        sessionStorage.setItem('fieldCrud', JSON.stringify(data.fields))
                        let fieldCruds = data.fields.map((res: any) => {
                            if (res.type != 'relation' && res.systemFieldType != 8
                                && res.systemFieldType != 7
                                && res.systemFieldType != 6 &&
                                res.type != 'formula' && res.systemFieldType != 9
                            ) {
                                return res
                            }
                        })
                        sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
                        let fieldKeyCruds = data.fields.map((res: any) => {
                            if (res.type != 'relation' && res.type != 'formula'
                                && res.type != 'textarea'
                                && res.type != 'rich-text'
                                && res.type != 'json'
                                && res.type != 'attachment'
                                && res.type != 'image'
                                && res.type != 'ciphertext'
                                && res.type != 'users') {
                                if (res.type == 'text' && res?.config.length < 768) {
                                    return res
                                } else if (res.type != 'text') {
                                    return res;
                                }
                            }
                        })
                        console.log(fieldKeyCruds, '索引列表')
                        let waiList = data.fields.filter((res: any) => {
                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                return res
                            } else if (res.type == 'int' && res.systemFieldType == 0 && res.config.integerType == 'BIGINT') {
                                return res
                            }
                        })
                        sessionStorage.setItem('waiList', JSON.stringify(waiList))
                        let puFieldCruds = data.fields.map((res: any) => {
                            if (!res.foreignKeyFlag && res.systemFieldType == 0 && res.type != 'relation') {
                                return res
                            }
                        })
                        sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
                        console.log(data, 'aaaaaaaaaaaaaaaa')
                        let field = aiValue.fields;
                        let setCreatedBy = field.filter((item: any) => item.systemFieldType == 2).length > 0 ? true : false;
                        data.metaTable.createdBy = setCreatedBy;
                        let setUpdatedBy = field.filter((item: any) => item.systemFieldType == 3).length > 0 ? true : false;
                        data.metaTable.updatedBy = setUpdatedBy;
                        let setCreatedAt = field.filter((item: any) => item.systemFieldType == 4).length > 0 ? true : false;
                        data.metaTable.createdAt = setCreatedAt;
                        let setUpdatedAt = field.filter((item: any) => item.systemFieldType == 5).length > 0 ? true : false;
                        data.metaTable.updatedAt = setUpdatedAt;
                        let setDeleteBy = field.filter((item: any) => item.systemFieldType == 7).length > 0 ? true : false;
                        data.metaTable.deletedBy = setDeleteBy;
                        if (data.metaTable.useSoftDelete) {
                            let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            let dataLength = data1.filter((element: any) => {
                                return element.code == 'deletedAt'
                            });
                            console.log(dataLength, 'dataLength')
                            if (dataLength.length == 0) {
                                //删除时间
                                data1.push({
                                    type: 'datetime',
                                    systemFieldType: 6,
                                    tableKey: data.metaTable.queryKey,
                                    code: 'deletedAt',
                                    name: '删除时间',
                                    nullable: false, foreignKeyFlag: false,
                                    defaultValueMode: 'static',
                                    defaultValue: "0001-01-01 00:00:00",
                                    sort: 1,
                                })
                                //删除标志
                                data1.push({
                                    type: 'boolean',
                                    systemFieldType: 8,
                                    tableKey: data.metaTable.queryKey,
                                    code: 'deleted',
                                    name: '删除标志', foreignKeyFlag: false,
                                    nullable: false,
                                    defaultValueMode: 'static',
                                    defaultValue: "false",
                                    sort: 1,
                                })
                                data1.forEach((element: any, index: number) => {
                                    element.sort = index + 1
                                });
                                let fieldCruds = data1.map((res: any) => {
                                    if (res.type != 'relation' && res.systemFieldType != 8
                                        && res.systemFieldType != 7
                                        && res.systemFieldType != 6 &&
                                        res.type != 'formula' && res.systemFieldType != 9) {
                                        return res
                                    }
                                })
                                let puFieldCruds = data1.map((res: any) => {
                                    if (!res.foreignKeyFlag && res.systemFieldType == 0 && res.type != 'relation') {
                                        return res
                                    }
                                })
                                let fieldKeyCruds = data1.map((res: any) => {
                                    if (res.type != 'relation' && res.type != 'formula'
                                        && res.type != 'textarea'
                                        && res.type != 'rich-text'
                                        && res.type != 'json'
                                        && res.type != 'attachment'
                                        && res.type != 'image'
                                        && res.type != 'ciphertext'
                                        && res.type != 'users') {
                                        if (res.type == 'text' && res?.config.length < 768) {
                                            return res
                                        } else if (res.type != 'text') {
                                            return res;
                                        }
                                    }
                                })
                                sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds))
                                let waiList = data1.filter((res: any) => {
                                    if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                        return res
                                    } else if (res.type == 'int' && res.systemFieldType == 0 && res.config.integerType == 'BIGINT') {
                                        return res
                                    }
                                })
                                sessionStorage.setItem('waiList', JSON.stringify(waiList))
                                sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
                                sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
                                sessionStorage.setItem('fieldCrud', JSON.stringify(data1))
                                let formulArr: any[] = []
                                data1.forEach((item: any) => {
                                    if (item.type != 'formula'
                                        && item.systemFieldType != 8
                                        && item.systemFieldType != 7
                                        && item.systemFieldType != 6
                                        && item.systemFieldType != 9) {
                                        formulArr.push({...item, label: item.name, value: item.code})
                                    }
                                })
                                sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                                //删除时间
                                data.fields.push({
                                    type: 'datetime',
                                    systemFieldType: 6,
                                    // systemFieldType: 'DELETE_DATE',
                                    tableKey: data.metaTable.queryKey,
                                    code: 'deletedAt',
                                    name: '删除时间',
                                    nullable: false, foreignKeyFlag: false,
                                    defaultValueMode: 'static',
                                    defaultValue: "0001-01-01 00:00:00",
                                    sort: 1,
                                })
                                //删除标志
                                data.fields.push({
                                    type: 'boolean',
                                    systemFieldType: 8,
                                    // systemFieldType: 'DELETE_FLAG',
                                    tableKey: data.metaTable.queryKey,
                                    code: 'deleted',
                                    name: '删除标志', foreignKeyFlag: false,
                                    nullable: false,
                                    defaultValueMode: 'static',
                                    defaultValue: "false",
                                    sort: 1,
                                })
                            }
                            data.metaTable.tree = data.metaTable.tree == null ? false : data.metaTable.tree
                            data.fields.forEach((element: any, index: number) => {
                                element.sort = index + 1
                            });
                        }
                        console.log({...data, ...data.metaTable},'{...data, ...data.metaTable}')
                        return {...data, ...data.metaTable}
                    },
                },
                "api": {
                    "url": useDevBaseUrl("/entitymanage/table/createModelByTableInfo/false"),
                    "method": "post",
                    "data": {
                        "metaTable": {
                            "dsKey": '${dsKey}',
                            "code": "${code}",
                            "name": "${name}",
                            "key": "${key}",
                            "env": '${env}',
                            "description": "${description}",
                            "synchronousFlag": '${synchronousFlag}',
                            "nameField": "${nameField}",
                            "titleTpl": "${titleTpl}",
                            "creator": "${creator}",
                            "updater": "${updater}",
                            "deletedBy": "${deletedBy}",
                            "createTime": "${createTime}",
                            "updateTime": "${updateTime}",
                            "timeEnableFlag": "${timeEnableFlag}",
                            "createEnableFlag": "${createEnableFlag}",
                            "useSoftDelete": '${useSoftDelete}',
                            "treePattern": '${tree ? 0: 0}',
                            "ignoreTenant": '${ignoreTenant}',
                            "tree": '${tree}',
                            "type": '${type}',
                            "appId": '${appId}',
                            "ver": "${ver}",
                            "id": "${id}",
                            "queryKey": "${queryKey}",
                            "latest": '${latest}',
                            "tableKey": "${queryKey}",
                        },
                        "fields": '${ss:fieldCrud}',
                        "indexes": '${ss:keyCrud}',
                        "relations": '${ss:affectCrud}',
                        "removeRelations": '${ss:removeRelations}'
                    },
                    "adaptor": function (payload: any) {
                        console.log(payload, '11111111111111111')
                        let a = payload?.data?.confirmText ? format(payload.data.confirmText) : ''
                        console.log(a, 'aaaaaaaaaaaaaaaaaaaaaaa')
                        let data = {...payload, status: payload.code}
                        if (data.data?.confirmText) {
                            data.data.confirmText = a
                        }
                        console.log(data, 'aaaaaaaaaaaa')
                        return data
                    }
                },
                "wrapWithPanel": false,
                "body": {
                    "type": "tabs",
                    "tabs": [
                        // 基本设置
                        getBase(),
                        // 字段集合
                        getField(moneyData),
                        // 索引设置
                        getIndex(codeName, refIndex),
                        // 关系设置
                        getRelationship(
                            middleData,
                            fanData,
                            relationNullable,
                            inverseData,
                            inverseJoinColumnCodes,
                            inverseJoinColumnKeys,
                            refTable,
                            refTables1,
                            refTableType,
                        )
                    ]
                }
            }
        ]
    }
}
