import { format } from "sql-formatter"
import getBase from "./base"
import getField from "./field"
import getIndex from "./myIndex/index"
import getRelationship from "./relationship"
import { useDevBaseUrl } from "@/utils/util"
import {toast} from 'amis';
import permStore from "@/store/permission"
export default () => {
    let refTable: any
    let refTables1: any
    let refTableType: any
    let refIndex: any
    // let usersList: any
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
        "className":"modelDailog",
        "name":"modelDailog",
        "id":"modelDailog",
        "data": {
            queryKey: "${queryKey}",
            $$permissionsData: permStore.getState().permData
        },
        "size": "lg",
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
                "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:update')}",
                "actionType": "confirm",
                "api": {
                    "url": useDevBaseUrl("/entitymanage/table/saveTableInfo/true"),
                    "method": "post",
                    "data": {
                        "metaTable": {
                            "dsKey": '${dsKey}',
                            "code": "${code}",
                            "name": "${name}",
                            "comment": "${comment}",
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
                            "updateTime": "${updateTime}",
                            "timeEnableFlag": "${timeEnableFlag}",
                            "createEnableFlag": "${createEnableFlag}",
                            "useSoftDelete": '${useSoftDelete}',
                            "treePattern": '${tree? 0: 0}',
                            "tree": '${tree}',
                            "ignoreTenant": "${ignoreTenant}",
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
                    requestAdaptor: function (api:any) {
                      console.log(api, 'api')
                      return {
                        ...api,
                        data: {
                          ...api.data,
                          fields: api.data.fields.map((item: any) => {
                            if (item.type == 'serial-number') {
                              if (item.defaultValueMode == 'null')
                                return {
                                  ...item,
                                  defaultValue: null,
                                  config: {
                                    ...item.config,
                                    defaultValue: null
                                  }
                                }
                            }
                            return item
                          }),
                          metaTable: {
                            ...api.data.metaTable,
                            comment: api.data.metaTable.comment === '' ? null : api.data.metaTable.comment
                          }
                        }
                      }
                    },
                    adaptor: function (payload: any) {
                        console.log(payload,'payloadpayloadpayload');
                        if(payload.data){
                            if(payload.data.length>0){
                                toast.warning('以下语句未生效：'+payload.data);
                            }
                        }
                        return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, }
                        };
                    }
                },
                "primary": true,
            }
        ],
        "body": [
            {
                "type": "form",
                "mode": "horizontal",
                "id":"modelDailogForm",
                "initApi": {
                    "method": "get",
                    "url": useDevBaseUrl("/entitymanage/table/getTableInfo?tableKey=${queryKey}"),
                    adaptor: function (payload: any) {
                        if(payload.code == 500){
                            return payload
                        }
                        sessionStorage.setItem('acl', JSON.stringify(payload?.data?.acl))
                        let aiValue = JSON.parse(sessionStorage.getItem('dataValue'))
                        if(aiValue && aiValue != null){
                            payload = {...payload, data: aiValue.response}
                        }
                        console.log(payload,'payloadpayload')
                            sessionStorage.setItem('ignoreTenantFlag', JSON.stringify(payload.data.metaTable.ignoreTenant))
                            sessionStorage.setItem('fieldCrud', JSON.stringify(payload?.data?.fields.map(fieldData=>{
                                if (fieldData.config) {
                                    let returnData = {
                                        ...fieldData, config: {
                                            ...fieldData.config,
                                            defaultValue: fieldData.defaultValue,
                                            defaultValueMode: fieldData.defaultValueMode
                                        }
                                    }
                                    if (fieldData.type === "serial-number" && fieldData.defaultValueMode === "static") {
                                        returnData.config = {
                                            ...fieldData.config,
                                            orderEvent: false,
                                            defaultValueMode: fieldData.defaultValueMode,
                                            defaultValue: fieldData.defaultValue
                                        }
                                    }
                                    if (fieldData.type === "serial-number" && fieldData.defaultValueMode === "null") {
                                        returnData.config = {
                                            ...fieldData.config,
                                            orderEvent: true,
                                            defaultValue:null
                                        }
                                        returnData.defaultValue = null
                                    }
                                    return returnData
                                }
                              return fieldData
                            })))
                            // sessionStorage.setItem('acl', JSON.stringify(payload?.data?.acl))
                            sessionStorage.setItem('keyCrud', JSON.stringify(payload?.data?.indexes))
                        let systemFields:any = []
                        const fieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                        systemFields = payload?.data?.fields
                          .filter(item => fieldTypes.includes(item.systemFieldType) || item.code == 'deletedAt' || item.code == 'tenantCode')
                        let keyCrudData:any = []
                        payload?.data?.indexes?.forEach((item:any)=>{
                            if(item.queryKey){
                                keyCrudData.push(item)
                            }
                        })
                            let relaArrs: any = []
                        payload?.data?.relations?.forEach((item: any) => {
                                if (item.relationMode == 0) {
                                    relaArrs.push({ ...item, disNullable: item.nullable, foreignKey: item.name })
                                } else if (item.relationMode == 1) {
                                    relaArrs.push({ ...item, disNullable: item.nullable, foreignKey: item.name })
                                } else {
                                    relaArrs.push({ ...item, foreignKey: item.name })
                                }
                            })
                            sessionStorage.setItem('affectCrud', JSON.stringify(relaArrs))
                            sessionStorage.setItem('cacheEditList', JSON.stringify([]))
                            sessionStorage.setItem('removeRelations', JSON.stringify([]))
                            sessionStorage.setItem('haveQueryKeyKey', JSON.stringify(keyCrudData))
                            sessionStorage.setItem('haveSystemQueryKey', JSON.stringify(systemFields))
                            let formulArr: any[] = []
                            payload?.data?.fields?.forEach((item: any) => {
                                if (item.type != 'formula'
                                    && item.systemFieldType != 8
                                    && item.systemFieldType != 7
                                    && item.systemFieldType != 6
                                    && item.systemFieldType != 9) {
                                    formulArr.push({...item,label:item.name,value:item.code});
                                }
                            })
                            sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                            let fieldKeyCrudss = payload?.data?.fields?.map((res: any) => {
                                if (res.type != 'relation' && res.type != 'formula'
                                    && res.type != 'textarea'
                                    && res.type != 'rich-text'
                                    && res.type != 'json'
                                    && res.type != 'attachment'
                                    && res.type != 'image'
                                    && res.type != 'ciphertext'
                                    && res.type != 'users'
                                ) {
                                    if (res.type == 'text' && res.config.length < 768) {
                                        return res
                                    } else if (res.type != 'text') {
                                        return res;
                                    }
                                }
                            })
                            console.log(fieldKeyCrudss, 'fieldKeyCrudss')
                            sessionStorage.setItem('fieldKeyCrudss', JSON.stringify(fieldKeyCrudss))
                        console.log(payload, 'payloadpayload------------')
                        let data = payload?.data
                        sessionStorage.setItem('keyCrud', JSON.stringify(data?.indexes))
                        sessionStorage.setItem('cacheEditList', JSON.stringify([]))
                        sessionStorage.setItem('removeRelations', JSON.stringify([]))
                        nameFieldData = data?.metaTable?.nameField
                        sessionStorage.setItem('nameFieldData', data?.metaTable?.nameField)

                        data?.fields.forEach(i=>{
                            //开启是否忽略租户时，流水号不显示是否忽略租户
                            if(i.type == "serial-number" && JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)) {
                                i.hideColIgnoreTenant = true
                            } else {
                                i.hideColIgnoreTenant = false
                            }
                        })

                        sessionStorage.setItem('fieldCrud', JSON.stringify(data?.fields.map(fieldData=>{
                            if (fieldData.config) {
                                let returnData = {
                                    ...fieldData, config: {
                                        ...fieldData.config,
                                        defaultValue: fieldData.defaultValue,
                                        defaultValueMode: fieldData.defaultValueMode
                                    }
                                }
                                if (fieldData.type === "serial-number" && fieldData.defaultValueMode === "static") {
                                    returnData.config = {
                                        ...fieldData.config,
                                        orderEvent: false,
                                        defaultValueMode: fieldData.defaultValueMode,
                                        defaultValue: fieldData.defaultValue
                                    }
                                }
                                if (fieldData.type === "serial-number" && fieldData.defaultValueMode === "null") {
                                    returnData.config = {
                                        ...fieldData.config,
                                        orderEvent: true,
                                        defaultValue:null
                                    }
                                    returnData.defaultValue = null
                                }
                                return returnData
                            }
                          return fieldData
                        })))
                        let fieldCruds = data?.fields?.map((res: any) => {
                            if (res.type != 'relation' && res.systemFieldType != 8
                                && res.systemFieldType != 7
                                && res.systemFieldType != 6 &&
                                res.type != 'formula' && res.systemFieldType != 9
                            ) {
                                return res
                            }
                        })
                        sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
                        let fieldKeyCruds = data?.fields?.map((res: any) => {
                            if (res.type != 'relation'
                                && res.type != 'formula'
                                && res.type != 'textarea'
                                && res.type != 'rich-text'
                                && res.type != 'json'
                                && res.type != 'attachment'
                                && res.type != 'image'
                                && res.type != 'ciphertext'
                                && res.type != 'users') {
                                if (res.type == 'text' && res.config.length && res.config.length < 768) {
                                    return res
                                } else if (res.type != 'text') {
                                    return res;
                                }
                            }
                        })
                        console.log(fieldKeyCruds, '索引列表')
                        let waiList = data?.fields?.filter((res: any) => {
                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                return res
                            } else if (res.type == 'int' && res.systemFieldType == 0 && res.config.integerType == 'BIGINT') {
                                return res
                            }
                        })
                        sessionStorage.setItem('waiList', JSON.stringify(waiList))
                        let puFieldCruds = data?.fields?.map((res: any) => {
                            if (!res.foreignKeyFlag && res.systemFieldType == 0 && res.type != 'relation') {
                                return res
                            }
                        })
                        sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
                        let relaArr: any = []
                        data?.relations?.forEach((res: any) => {
                            if (res.relationMode == 0) {
                                relaArr.push({ ...res, disNullable: res.nullable, foreignKey: res.name })
                            } else if (res.relationMode == 1) {
                                relaArr.push({ ...res, disNullable: res.nullable, foreignKey: res.name })
                            } else {
                                relaArr.push({ ...res, foreignKey: res.name })
                            }
                        })
                        sessionStorage.setItem('affectCrud', JSON.stringify(relaArr))
                        console.log(data, 'aaaaaaaaaaaaaaaa')
                        let field = payload?.data?.fields;
                        let setCreatedBy = field?.filter((item: any) => item.systemFieldType == 2).length > 0 ? true : false;
                            data.metaTable.createdBy = setCreatedBy;
                        let setUpdatedBy = field?.filter((item: any) => item.systemFieldType == 3).length > 0 ? true : false;
                            data.metaTable.updatedBy = setUpdatedBy;
                        let setCreatedAt = field?.filter((item: any) => item.systemFieldType == 4).length > 0 ? true : false;
                            data.metaTable.createdAt = setCreatedAt;
                        let setUpdatedAt = field?.filter((item: any) => item.systemFieldType == 5).length > 0 ? true : false;
                            data.metaTable.updatedAt = setUpdatedAt;
                        let setDeleteBy = field?.filter((item: any) => item.systemFieldType == 7).length > 0 ? true : false;
                            data.metaTable.deletedBy = setDeleteBy;
                        if (data?.metaTable?.useSoftDelete) {
                            let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            console.log(data1,'data1data1data1data1data1')
                            let dataLength = data1.filter((element: any) => {
                                return element.systemFieldType == 6
                            });
                            console.log(dataLength, 'dataLength')
                            if (dataLength.length == 0) {
                                //删除时间
                                data1.push({
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
                                data1.push({
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
                                data1.forEach((element: any, index: number) => {
                                    element.sort = index + 1
                                });
                                let fieldCruds = data1.map((res: any) => {
                                    // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
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
                                        if (res.type == 'text' && res.config.length < 768) {
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
                                sessionStorage.setItem('fieldCrud', JSON.stringify(data1.map(fieldData=> {
                                    if (fieldData.config) {
                                        let returnData = {
                                            ...fieldData, config: {
                                                ...fieldData.config,
                                                defaultValue: fieldData.defaultValue,
                                                defaultValueMode: fieldData.defaultValueMode
                                            }
                                        }
                                        if (fieldData.type === "serial-number" && fieldData.defaultValueMode === "static") {
                                            returnData.config = {
                                                ...fieldData.config,
                                                orderEvent: false,
                                                defaultValueMode: fieldData.defaultValueMode,
                                                defaultValue: fieldData.defaultValue
                                            }
                                        }
                                        if (fieldData.type === "serial-number" && fieldData.defaultValueMode === "null") {
                                            returnData.config = {
                                                ...fieldData.config,
                                                orderEvent: true,
                                                defaultValue:null
                                            }
                                            returnData.defaultValue = null
                                        }
                                            return returnData
                                    }
                                    return fieldData
                                })))
                                let formulArr: any[] = []
                                data1.forEach((item: any) => {
                                    if (item.type != 'formula'
                                        && item.systemFieldType != 8
                                        && item.systemFieldType != 7
                                        && item.systemFieldType != 6
                                        && item.systemFieldType != 9) {
                                        formulArr.push({...item,label:item.name,value:item.code})
                                    }
                                })
                                sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                                // //删除人
                                // data.fields.push({
                                //     type: 'user',
                                //     systemFieldType: 'DELETE_USER',
                                //     tableKey: data.metaTable.queryKey,
                                //     code: 'deletedBy',
                                //     name: '删除人',
                                //     nullable: true,
                                //     sort: 1,
                                // })
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
                            }else{
                                sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds))
                            }
                            data.metaTable.tree = data.metaTable.tree == null ? false : data.metaTable.tree
                            data.fields.forEach((element: any, index: number) => {
                                element.sort = index + 1
                            });
                        }else{
                            sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds))
                        }
                        let intList = data?.fields?.filter((res: any) =>
                          res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
                        let cuList = data?.fields?.filter((res: any) =>
                          (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
                        let cuTimeList = data?.fields?.filter((res: any) =>
                          res.type == 'datetime' && res.systemFieldType == 0)
                        let needPrimaryKeyType:any = []
                        needPrimaryKeyType = data?.fields?.filter((res: any) =>res.systemFieldType == 1)
                        if(needPrimaryKeyType?.length == 0){
                            needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
                        }
                        let treeList = data?.fields?.filter((res: any) => {
                            if(res.type == needPrimaryKeyType[0].type &&
                              res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
                                return res
                            }
                        })
                        sessionStorage.setItem('intList', JSON.stringify(intList))
                        sessionStorage.setItem('cuList', JSON.stringify(cuList))
                        sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
                        sessionStorage.setItem('treeList', JSON.stringify(treeList))
                        return {
                            ...payload,
                            status: payload.code,
                            data:{
                                ...data,
                                ...data.metaTable
                            }
                        }
                    },
                },
                "api": {
                    "url": useDevBaseUrl("/entitymanage/table/saveTableInfo/false"),
                    "method": "post",
                    "data": {
                        "metaTable": {
                            "dsKey": '${dsKey}',
                            // "modelName": "${modelName}",
                            // "tableName": "${tableName}",
                            "code": "${code}",
                            "comment": "${comment}",
                            "name": "${name}",
                            "key": "${key}",
                            "env": '${env}',
                            "description": "${description}",
                            "synchronousFlag": '${synchronousFlag}',
                            // "primaryField": "${primaryField}",
                            // "primaryKeyColumnKey": "${primaryKeyColumnKey}",
                            "nameField": "${nameField}",
                            // "titleColumnKey": "${titleColumnKey}",
                            "titleTpl": "${titleTpl}",
                            "creator": "${creator}",
                            "updater": "${updater}",
                            "deletedBy": "${deletedBy}",
                            "createTime": "${createTime}",
                            "updateTime": "${updateTime}",
                            "timeEnableFlag": "${timeEnableFlag}",
                            "createEnableFlag": "${createEnableFlag}",
                            // "titleTemplate": "${titleTemplate}",
                            // "deleteEnableFlag": '${deleteEnableFlag}',
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
                            // "tableKey": "${tableKey}",
                        },
                        "fields": '${ss:fieldCrud}',
                        // "fields": 'JSON.parse(${cookie:fieldCrud})',
                        // "validators": '${ss:validatorCrud}',
                        "indexes": '${ss:keyCrud}',
                        "relations": '${ss:affectCrud}',
                        "removeRelations": '${ss:removeRelations}'
                        // "fields": '${fields}',
                        // "validators": '${validators}',
                        // "indexes": '${indexes}',
                        // "relations": '${relations}'
                    },
                    requestAdaptor: function (api:any) {
                        return {
                            ...api,
                            data: {
                                ...api.data,
                                fields: api.data.fields.map((item: any) => {
                                    if (item.type == 'serial-number') {
                                        if (item.defaultValueMode == 'null')
                                            return {
                                                ...item,
                                                defaultValue: null,
                                                config: {
                                                    ...item.config,
                                                    defaultValue: null
                                                }
                                            }
                                    }
                                    return item
                                }),
                                metaTable: {
                                    ...api.data.metaTable,
                                    comment: api.data.metaTable.comment === '' ? null : api.data.metaTable.comment
                                }
                            }
                        }
                    },
                    "adaptor": function (payload: any) {
                        console.log(payload, '11111111111111111')
                        let a = payload?.data?.confirmText ? format(payload.data.confirmText) : ''
                        // let a = formatDialect(payload.data.confirmText,{
                        //     style:'1'
                        // })
                        console.log(a, 'aaaaaaaaaaaaaaaaaaaaaaa')
                        // console.log({ ...payload, status: payload.code },'{ ...payload, status: payload.code }')
                        let data = { ...payload, status: payload.code }
                        if (data.data?.confirmText) {
                            data.data.confirmText = a
                        }
                        console.log(data, 'aaaaaaaaaaaa')
                        return data
                        // return { ...payload, status: payload.code }
                    }
                    // "adaptor": "return {\n ...payload,\n status: payload.code \n}"
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
                },
                onEvent: {
                    inited: {
                        actions: [
                            {
                                actionType: 'custom',
                                script: function (_: any, doAction: any, event: any) {
                                    const { responseData } = event.data;
                                    doAction({
                                        actionType: 'setValue',
                                        componentId: 'myField',
                                        args: {
                                            value: {
                                                items: responseData?.fields || [],
                                            }
                                        }
                                    });
                                }
                            }
                        ]
                    }
                }
            }
        ],
        "onEvent": {
            "confirm": {
                "weight": 0,
                "actions": [{
                    "actionType": "custom",
                    // script: function (_, doAction, event) {
                    //     console.log(_, '_')
                    //     console.log(doAction, 'doAction')
                    //     console.log(event, 'event')
                    // },
                }
                ]
            }
        }
    }
}
