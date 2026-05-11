import { useDevBaseUrl } from "@/utils/util"
import {processIndexFields, next, systemNext} from '@/utils';
import { toast } from "amis";
import * as uuid from 'uuid';
export default () => {
    return {
        "source": "$metaTable",
        "title": "基本设置",
        "tab": [
            {
                "type": "input-text",
                "name": "name",
                // "name": "modelName",
                "label": "模型名称",
                "required": true
            },
            {
                "type": "input-text",
                "name": "code",
                // "name": "key",
                // "name": "tableName",
                "label": "表名",
                "disabled": true,
                "required": true
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
                "type": "textarea",
                "label": "描述",
                "name": "description",
                "maxLength": 200
            },
            // {
            //     "label": "主键字段",
            //     "desc": "选择当前模型的主键，需要设置自动递增",
            //     "visibleOn": "${base !== 'INSIDE'}",
            //     "type": "select",
            //     "required": true,
            //     "name": "primaryField",
            //     // "name": "primaryKeyColumnKey",
            //     "source": "${ss:fieldCrud}",
            // },
            {
                "label": "标题字段",
                "type": "select",
                "name": "nameField",
                "id": "nameField",
                // "name": "titleColumnKey",
                "desc": "请选择一个字段，当在关系视图下，用来展示并帮助用户选择该模型",
                "size": "md",
                "labelField": "name",
                "valueField": "code",
                "source": "${ss:fieldCruds}",
                "onEvent": {
                    "change": {
                        "actions": [{
                            "actionType": "custom",
                            script: function (_: any, doAction: any, event: any) {
                                console.log(event, '标题模板1111')
                                sessionStorage.setItem('nameFieldData', event.data.value)
                            }
                        }]
                    }
                }
            },
            {
                "label": "标题模板",
                "type": "input-text",
                "name": "titleTpl",
                // "name": "titleTemplate",
                "desc": "功能和标题字段一样，如果设置优先使用这个",
                "placeholder": "\\{{id}}"
                // "placeholder": "\\{{id}}\\{{字段名}}"
            },
            {
                "label": "软删除",
                "type": "switch",
                "name": "useSoftDelete",
                "desc": "使用标记删除而不是物理删除,方便找回数据",
                "onEvent": {
                    "change": {
                        "actions": [{
                            "actionType": "custom",
                            script: function (_: any, doAction: any, event: any) {
                                let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                let fieldData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                let affectCrudData = JSON.parse(sessionStorage.getItem('affectCrud')!)
                                // let data = JSON.parse(getCookie('fieldCrud'))
                                console.log(event, 'eventeventevent')
                                console.log(event.data.nameField, 'nameField')
                                let nameFieldData = sessionStorage.getItem('nameFieldData')
                                let systemFieldData = JSON.parse(sessionStorage.getItem('haveSystemQueryKey')!)
                                let deletedAtEntrys = systemFieldData.find(
                                  item => item.systemFieldType == 6
                                );
                                if(!deletedAtEntrys){
                                    deletedAtEntrys = systemFieldData.find(
                                      item => item.code == 'deletedAt'
                                    );
                                }
                                let deletedEntrys = systemFieldData.find(
                                  item => item.systemFieldType == 8
                                );
                                if(!deletedEntrys){
                                    deletedEntrys = systemFieldData.find(
                                      item => item.code == 'deleted'
                                    );
                                }
                                console.log(nameFieldData, 'nameFieldData')
                                console.log(systemFieldData,'systemFieldDatasystemFieldDatasystemFieldDatasystemFieldDatasystemFieldData')
                                if (event.data.useSoftDelete) {
                                    //删除人
                                    // if(event.data.deletedBy){
                                    //     data.push({
                                    //         type: 'user',
                                    //         systemFieldType: 'DELETE_USER',
                                    //         tableKey: event.data.queryKey,
                                    //         code: 'deletedBy',
                                    //         name: '删除人',
                                    //         nullable: true,
                                    //         sort: 1,
                                    //     })
                                    // }
                                    const deletedAtEntry = data.filter(
                                      item => item.systemFieldType == 6
                                    );
                                    const deletedEntry = data.filter(
                                      item => item.systemFieldType == 8
                                    );
                                    const haveSameDeletedAt = data.filter(
                                      item => item.code == 'deletedAt'
                                    );
                                    const haveSameDeleted = data.filter(
                                      item => item.code == 'deleted'
                                    )
                                    const deletedAtItem = data.find(item => item.systemFieldType === 6);
                                    let needCode = deletedAtItem?.code;
                                    if(deletedAtEntry.length == 0){
                                        if(haveSameDeletedAt.length == 0){
                                            //删除时间
                                            data.push({
                                                type: 'datetime',
                                                systemFieldType: 6,
                                                // systemFieldType: 'DELETE_DATE',
                                                tableKey: event.data.queryKey,
                                                code: 'deletedAt',
                                                name: '删除时间',
                                                nullable: false, foreignKeyFlag: false,
                                                defaultValueMode: 'static',
                                                defaultValue: "0001-01-01 00:00:00",
                                                sort: 1,
                                                queryKey: deletedAtEntrys ? deletedAtEntrys.queryKey : undefined,
                                                needId: uuid.v4(),
                                                config:{
                                                    "precisionCompatible": false,
                                                    "precision": 0,
                                                    "showPrecision": 0,
                                                    "defaultValue": "0001-01-01 00:00:00",
                                                    "defaultValueMode": "static",
                                                    "dbType":"DATETIME"
                                                }
                                            })
                                            needCode = 'deletedAt'
                                        }else{
                                            setTimeout(()=>{
                                                doAction({
                                                    actionType: "setValue",
                                                    componentName: "useSoftDelete",
                                                    "args": {
                                                        "value": false
                                                    }
                                                });
                                            },10)
                                            needCode = undefined
                                            toast.error('已存在相同字段名deletedAt，请修改');
                                        }
                                    }
                                    if(deletedEntry.length == 0){
                                        if(haveSameDeleted.length == 0){
                                            //删除标志
                                            data.push({
                                                type: 'boolean',
                                                systemFieldType: 8,
                                                // systemFieldType: 'DELETE_FLAG',
                                                tableKey: event.data.queryKey,
                                                code: 'deleted',
                                                name: '删除标志', foreignKeyFlag: false,
                                                nullable: false,
                                                defaultValueMode: 'static',
                                                defaultValue: "false",
                                                sort: 1,
                                                queryKey: deletedEntrys ? deletedEntrys.queryKey : undefined,
                                                needId: uuid.v4(),
                                                config:{
                                                    dbType: "BIGINT",
                                                }
                                            })
                                        }else{
                                            setTimeout(()=>{
                                                doAction({
                                                    actionType: "setValue",
                                                    componentName: "useSoftDelete",
                                                    "args": {
                                                        "value": false
                                                    }
                                                });
                                            },10)
                                            needCode = undefined
                                            toast.error('已存在相同字段名deleted，请修改');
                                        }
                                    }
                                    let fieldDatas = [];
                                    if (needCode) {
                                        fieldDatas = fieldData.map(res => {
                                            if (res.uniqueFlag){
                                                let columnNamesArr = res.columnNames.split(',');
                                                let haveCode = []
                                                haveCode = columnNamesArr.filter(item => item == needCode);
                                                if(haveCode.length==0){
                                                    return {
                                                        ...res,
                                                        columnNames: res.columnNames + ',' + needCode
                                                    };
                                                }
                                            }
                                            return res;
                                        });
                                        let fieldDatase = fieldDatas.map((res: any, index: number) => {
                                            return { ...res, sort: index + 1,
                                                columnNames:processIndexFields(res.columnNames,data)
                                            }
                                        })
                                        sessionStorage.setItem('keyCrud', JSON.stringify(fieldDatase))
                                        doAction({
                                            actionType: "setValue", componentId: "keyCrud", "args": {
                                                "value": {
                                                    "items": fieldDatase
                                                }
                                            }
                                        });
                                        setTimeout(() => {
                                            doAction({
                                                actionType: "setValue", componentId: "keyCrud", "args": {
                                                    "value": {
                                                        "items": fieldDatase
                                                    }
                                                }
                                            });
                                            doAction({
                                                actionType: "setValue", componentId: "deletedBys", "args": {
                                                    "value": false
                                                }
                                            });
                                        }, 1000);
                                    }
                                } else {
                                    let fieldsToRemove:any = [];
                                    const systemFieldTypes = [6, 7, 8];
                                    fieldsToRemove = data
                                      .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                      .map(item => item.code);
                                    const systemFieldTypesToRemove = new Set([6, 7, 8]);
                                    data = data.filter(item => !systemFieldTypesToRemove.has(item.systemFieldType));
                                    const fieldDatas = fieldData.map((res: any) => {
                                        if (res.columnNames) {
                                            const filteredColumns = res.columnNames
                                              .split(',')
                                              .map(col => col.trim())
                                              .filter(col => !fieldsToRemove.includes(col));
                                            return {
                                                ...res,
                                                columnNames: filteredColumns.join(',') // 重新拼接
                                            };
                                        } else {
                                            return res;
                                        }
                                    });
                                    let fieldDatase = fieldDatas.filter((res: any) => {
                                        return res.columnNames != ""
                                    })
                                    let fieldDatasee = fieldDatase.map((res: any, index: number) => {
                                        return { ...res, sort: index + 1,
                                            columnNames:processIndexFields(res.columnNames,data)
                                        }
                                    })
                                    console.log(fieldDatasee, 'fieldDataes')
                                    sessionStorage.setItem('keyCrud', JSON.stringify(fieldDatasee))
                                    doAction({
                                        actionType: "setValue", componentId: "keyCrud", "args": {
                                            "value": {
                                                "items": fieldDatasee
                                            }
                                        }
                                    });
                                    console.log(nameFieldData, 'nameFieldData')
                                    console.log(data, 'datadata')
                                    if (fieldsToRemove.some(field => field === nameFieldData)) {
                                        let ars = data.filter((sc: any) => {
                                            return sc.systemFieldType == 0
                                        })
                                        console.log(ars, 'ars')
                                        if (ars.length > 0) {
                                            doAction({
                                                actionType: "setValue", componentId: "nameField", "args": {
                                                    "value": ars[0].code
                                                }
                                            });
                                            // nameFieldData = ars[0].code
                                            sessionStorage.setItem('nameFieldData', ars[0].code)
                                        } else {
                                            doAction({
                                                actionType: "setValue", componentId: "nameField", "args": {
                                                    "value": 'id'
                                                }
                                            });
                                            // nameFieldData = 'id'
                                            sessionStorage.setItem('nameFieldData', 'id')
                                        }
                                    }
                                    doAction({ actionType: "reload", componentId: "nameField" });
                                }
                                data.forEach((element: any, index: number) => {
                                    element.sort = index + 1
                                });
                                let fieldCruds = data.map((res: any) => {
                                    // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                    if (res.type != 'relation' && res.systemFieldType !== 6
                                        && res.systemFieldType !== 7 && res.systemFieldType !== 9
                                         && res.systemFieldType !== 8 && res.type != 'formula') {
                                        return res
                                    }
                                })
                                let puFieldCruds = data.map((res: any) => {
                                    if (!res.foreignKeyFlag && res.systemFieldType == 0 && res.type != 'relation') {
                                        return res
                                    }
                                })
                                let fieldKeyCruds = data.map((res: any) => {
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
                                let waiList = data.filter((res: any) => {
                                    if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                        return res
                                    } else if (res.type == 'int' && res.systemFieldType == 0 && res.config.integerType == 'BIGINT') {
                                        return res
                                    }
                                })
                                let intList = data.filter((res: any) =>
                                  res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
                                let cuList = data.filter((res: any) =>
                                  (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
                                let cuTimeList = data.filter((res: any) =>
                                  res.type == 'datetime' && res.systemFieldType == 0)
                                let needPrimaryKeyType:any = []
                                needPrimaryKeyType = data.filter((res: any) =>res.systemFieldType == 1)
                                if(needPrimaryKeyType.length == 0){
                                    needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
                                }
                                let treeList = data.filter((res: any) => {
                                    if(res.type == needPrimaryKeyType[0].type &&
                                      res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
                                        return res
                                    }
                                })
                                sessionStorage.setItem('intList', JSON.stringify(intList))
                                sessionStorage.setItem('cuList', JSON.stringify(cuList))
                                sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
                                sessionStorage.setItem('treeList', JSON.stringify(treeList))
                                sessionStorage.setItem('waiList', JSON.stringify(waiList))
                                sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds))
                                sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
                                sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
                                sessionStorage.setItem('fieldCrud', JSON.stringify(data))
                                let formulArr: any = []
                                data.forEach((item: any) => {
                                    if (item.type != 'formula'
                                        && item.systemFieldType != 6
                                        && item.systemFieldType != 7
                                        && item.systemFieldType != 8
                                        && item.systemFieldType != 9) {
                                        formulArr.push({...item,label:item.name,value:item.code})
                                    }
                                })
                                sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                                // setCookie('fieldCrud', JSON.stringify(data),null);
                                doAction({
                                    actionType: "setValue", componentId: "myField", "args": {
                                        "value": {
                                            "items": data
                                        }
                                    }
                                });
                                setTimeout(() => {
                                    doAction({
                                        actionType: "setValue", componentId: "myField", "args": {
                                            "value": {
                                                "items": data
                                            }
                                        }
                                    });
                                    doAction({
                                        actionType: "setValue", componentId: "affectCrud", "args": {
                                            "value": {
                                                "items": affectCrudData
                                            }
                                        }
                                    });
                                }, 1000);
                            }
                        }]
                    }
                }
            },
            {
                "type": "group",
                "body": [
                    {
                        "label": "树形结构",
                        "type": "switch",
                        "name": "tree",
                        "value": false,
                        "onEvent": {
                            "change": {
                                "actions": [
                                  {
                                    "actionType": "custom",
                                    script: function (_: any, doAction: any, event: any) {
                                        console.log(event, '树形结构')
                                        let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                        let haveTreeParent = []
                                        haveTreeParent = data.filter((res: any) => {
                                            return res.type == 'parent'
                                        })
                                        let parentCodeName = 'parentId'
                                        if (haveTreeParent.length > 0) {
                                            parentCodeName = haveTreeParent[0].code
                                        }
                                        if (event.data.value) {
                                            // let needType = data.filter((sx: any) => {
                                            //     return sx.systemFieldType == 1
                                            // })
                                            // let treeData = data.filter((res: any) => {
                                            //     return res.type == 'parent' && res.systemFieldType == 0
                                            // })
                                            // let haveSameParent = data.filter((res: any) => {
                                            //     return res.code == 'parentId'
                                            // })
                                            // if(treeData.length==0){
                                            //     if(haveSameParent.length==0){
                                            //         let configData = {}
                                            //         if(needType.length>0){
                                            //             if(needType[0].type == 'text'){
                                            //                 configData.dbType = 'varchar'
                                            //                 configData.length = needType[0].config.length
                                            //             }else{
                                            //                 configData.dbType = needType[0].config.dbType
                                            //             }
                                            //         }
                                            //         data.push({
                                            //             type: 'parent',
                                            //             systemFieldType: 0,
                                            //             tableKey: event.data.queryKey,
                                            //             code: 'parentId',
                                            //             name: '父级节点',
                                            //             foreignKeyFlag: false,
                                            //             nullable: true,
                                            //             defaultValueMode: 'static',
                                            //             defaultValue: 0,
                                            //             sort: 1,
                                            //             config: configData
                                            //         })
                                            //     }else{
                                            //         setTimeout(()=>{
                                            //             doAction({
                                            //                 actionType: "setValue",
                                            //                 componentName: "tree",
                                            //                 "args": {
                                            //                     "value": false
                                            //                 }
                                            //             });
                                            //         },10)
                                            //         toast.error('已存在相同字段名，请修改');
                                            //     }
                                            // }
                                        } else {
                                            let nameFieldData = sessionStorage.getItem('nameFieldData')
                                            let haveTenantCode = []
                                            let primaryKeyType:any = []
                                            haveTenantCode = data.filter((res: any) => {
                                                return res.systemFieldType == 9
                                            })
                                            primaryKeyType = data.filter((res: any) => {
                                              return res.systemFieldType == 1
                                            })
                                            let tenantCodeName = 'tenantCode'
                                            if (haveTenantCode.length > 0) {
                                                tenantCodeName = haveTenantCode[0].code
                                            }
                                            if (nameFieldData == tenantCodeName || nameFieldData == parentCodeName) {
                                                let ars = data.filter((sc: any) => {
                                                    return sc.systemFieldType == 0
                                                })
                                                if (ars.length > 0) {
                                                    doAction({
                                                        actionType: "setValue", componentId: "nameField", "args": {
                                                            "value": ars[0].code
                                                        }
                                                    });
                                                    // nameFieldData = ars[0].code
                                                    sessionStorage.setItem('nameFieldData', ars[0].code)
                                                } else {
                                                    doAction({
                                                        actionType: "setValue", componentId: "nameField", "args": {
                                                            "value": 'id'
                                                        }
                                                    });
                                                    // nameFieldData = 'id'
                                                    sessionStorage.setItem('nameFieldData', 'id')
                                                }
                                            }
                                            doAction({ actionType: "reload", componentId: "nameField" });
                                            console.log(data, '2222')
                                            data = data.map((res: any) => {
                                              if(res.code == parentCodeName){
                                                return {
                                                  ...res,
                                                  type:primaryKeyType[0].type,
                                                  config: {dbType:primaryKeyType[0].config.dbType,allowInput:true,nullable:true},
                                                  systemFieldType:0
                                                }
                                              }
                                              return res
                                            })
                                            let fieldCrudData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                            let fieldCrudDatas = fieldCrudData.map((res: any) => {
                                                let splitArr = res.columnNames.split(',');
                                                let found = false;
                                                splitArr.forEach((item) => {
                                                    if (item === parentCodeName) {
                                                        found = true;
                                                    }
                                                });
                                                if (found) {
                                                    const filteredArr = splitArr.filter(item => item !== parentCodeName);
                                                    return {
                                                        ...res,
                                                        columnNames: filteredArr.join(',')
                                                    };
                                                } else {
                                                    return res;
                                                }
                                            })
                                            let fieldCrudDatass = fieldCrudDatas.filter((res: any) => {
                                                return res.columnNames != ""
                                            })
                                            let fieldCrudDatassa = fieldCrudDatass.map((res: any, index: number) => {
                                                return { ...res, sort: index + 1,
                                                    columnNames:processIndexFields(res.columnNames,data)
                                                }
                                            })
                                            sessionStorage.setItem('keyCrud', JSON.stringify(fieldCrudDatassa))
                                            doAction({
                                                actionType: "setValue", componentId: "keyCrud", "args": {
                                                    "value": {
                                                        "items": fieldCrudDatassa
                                                    }
                                                }
                                            });
                                        }
                                        data.forEach((element: any, index: number) => {
                                            element.sort = index + 1
                                        });
                                        console.log(data, '333')
                                        let fieldCruds = data.map((res: any) => {
                                            if (res.type != 'relation' && res.systemFieldType != 6
                                                && res.systemFieldType != 7 && res.systemFieldType != 9
                                                 && res.systemFieldType != 8 && res.type != 'formula') {
                                                // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                                return res
                                            }
                                        })
                                        let puFieldCruds = data.map((res: any) => {
                                            if (!res.foreignKeyFlag && res.systemFieldType == 0 && res.type != 'relation') {
                                                return res
                                            }
                                        })
                                        let fieldKeyCruds = data.map((res: any) => {
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
                                        let waiList = data.filter((res: any) => {
                                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                                return res
                                            } else if (res.type == 'int' && res.systemFieldType == 0 && res.config.integerType == 'BIGINT') {
                                                return res
                                            }
                                        })
                                        let intList = data.filter((res: any) =>
                                          res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
                                        let cuList = data.filter((res: any) =>
                                          (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
                                        let cuTimeList = data.filter((res: any) =>
                                          res.type == 'datetime' && res.systemFieldType == 0)
                                        let needPrimaryKeyType:any = []
                                        needPrimaryKeyType = data.filter((res: any) =>res.systemFieldType == 1)
                                        if(needPrimaryKeyType.length == 0){
                                            needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
                                        }
                                        let treeList = data.filter((res: any) => {
                                            if(res.type == needPrimaryKeyType[0].type &&
                                              res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
                                                return res
                                            }
                                        })
                                        sessionStorage.setItem('intList', JSON.stringify(intList))
                                        sessionStorage.setItem('cuList', JSON.stringify(cuList))
                                        sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
                                        sessionStorage.setItem('treeList', JSON.stringify(treeList))
                                        sessionStorage.setItem('waiList', JSON.stringify(waiList))
                                        sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
                                        sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
                                        sessionStorage.setItem('fieldCrud', JSON.stringify(data))
                                        let formulArr: any = []
                                        data.forEach((item: any) => {
                                            if (item.type != 'formula'
                                                && item.systemFieldType != 6
                                                && item.systemFieldType != 7
                                                && item.systemFieldType != 8
                                                && item.systemFieldType != 9) {
                                                formulArr.push({...item,label:item.name,value:item.code})
                                            }
                                        })
                                        sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                                        doAction({
                                            actionType: "setValue", componentId: "myField", "args": {
                                                "value": {
                                                    "items": data
                                                }
                                            }
                                        });
                                        doAction({
                                            actionType: "setValue", componentId: "treePattern", "args": {
                                                "value": 0
                                            }
                                        });
                                    }
                                  },
                                  {
                                        "ignoreError": false,
                                        "actionType": "dialog",
                                        "expression": "${event.data.tree == true}",
                                        "dialog": {
                                            "id":"treeDialog",
                                            "title": "请选择与主键字段类型相同字段",
                                            "body": [
                                                {
                                                    "type": "form",
                                                    "title": "表单",
                                                    "mode": "flex",
                                                    "resetAfterSubmit": true,
                                                    "feat": "Insert",
                                                    "dsType": "model-entity",
                                                    "id":"treeForm",
                                                    "body": [
                                                        {
                                                            "type": "radios",
                                                            "label": "操作方式",
                                                            "name": "operatingMode",
                                                            "options": [
                                                                {
                                                                    "label": "新建字段",
                                                                    "value": 0
                                                                },
                                                                {
                                                                    "label": "选择现有字段",
                                                                    "value": 1
                                                                }
                                                            ],
                                                            "row": 0,
                                                            "optionType": "default",
                                                            "colSize": "1",
                                                            "value": 0
                                                        },
                                                        {
                                                            "visibleOn": "${operatingMode == 1}",
                                                            "type": "select",
                                                            "label": "选择现有字段",
                                                            "name": "treeSelect",
                                                            "source": "${ss:treeList}",
                                                            "labelField":"code",
                                                            "valueField":"code",
                                                            "multiple": false,
                                                            "required": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "label": "字段名",
                                                            "name": "treeCode",
                                                            "required": true,
                                                            "value": "parentId",
                                                            "clearable": true,
                                                            "visibleOn": "${operatingMode == 0}",
                                                            validations: {
                                                                matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                                                isTree: true
                                                            },
                                                            validationErrors: {
                                                                matchRegexp: '请填写规范字段名'
                                                            },
                                                        },
                                                        {
                                                            visibleOn: "(operatingMode == 0)",
                                                            label: '显示名称',
                                                            required: true,
                                                            type: 'input-text',
                                                            placeholder: '字段展示的名称，可以是中文',
                                                            name: 'treeName',
                                                            id: 'treeName',
                                                            value: "父级节点",
                                                            validations: {
                                                                isSameTreeName: true
                                                            },
                                                        }
                                                    ],
                                                    "actions": [],
                                                    "labelAlign": "top"
                                                }
                                            ],
                                            "onEvent": {
                                                "cancel": {
                                                    "weight": 0,
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            script: function(_: any, doAction: any, event: any) {
                                                                doAction({
                                                                    actionType: "setValue", componentName: "tree", "args": {
                                                                        "value": false
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            "actions": [
                                                {
                                                    "type": "button",
                                                    "actionType": "cancel",
                                                    "label": "取消",
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: "setValue", componentName: "tree", "args": {
                                                                                "value": false
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    "type": "button",
                                                    "actionType": "confirm",
                                                    "label": "确定",
                                                    "primary": true,
                                                    "close":false,
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: 'validate',
                                                                            componentId: 'treeForm',
                                                                            outputVar: 'validateResult'
                                                                        });
                                                                        setTimeout(()=>{
                                                                            console.log(event,'校验结果')
                                                                            let data:any = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                            let needType = data.filter((sx: any) => {
                                                                                return sx.systemFieldType == 1
                                                                            })
                                                                            let haveTreeCode = []
                                                                            haveTreeCode = data.filter((res: any) => {
                                                                                return res.type == 'parent' && res.systemFieldType == 0
                                                                            })
                                                                            let treeCodeName = 'parentId'
                                                                            if (haveTreeCode.length > 0) {
                                                                                treeCodeName = haveTreeCode[0].code
                                                                            }
                                                                            if(event.data.validateResult.error == ''){
                                                                                if(haveTreeCode.length == 0){
                                                                                    let configData = {}
                                                                                    if(needType.length>0){
                                                                                        if(needType[0].type == 'text'){
                                                                                            configData.dbType = 'VARCHAR'
                                                                                            configData.length = needType[0].config.length
                                                                                        }else{
                                                                                            configData.dbType = needType[0].config.dbType
                                                                                        }
                                                                                    }
                                                                                    if(event.data.validateResult.payload.operatingMode == 0){
                                                                                        data.push({
                                                                                            type: 'parent',
                                                                                            systemFieldType: 0,
                                                                                            tableKey: event.data.queryKey,
                                                                                            code: event.data.validateResult.payload.treeCode,
                                                                                            name: event.data.validateResult.payload.treeName,
                                                                                            foreignKeyFlag: false,
                                                                                            nullable: true,
                                                                                            defaultValueMode: 'static',
                                                                                            defaultValue: 0,
                                                                                            sort: 1,
                                                                                            config: configData,
                                                                                            needId: uuid.v4()
                                                                                        })
                                                                                        treeCodeName = event.data.validateResult.payload.treeCode
                                                                                    }else{
                                                                                        data = data.map((res: any) => {
                                                                                            if(res.code == event.data.validateResult.payload.treeSelect){
                                                                                                treeCodeName = res.code
                                                                                                return {
                                                                                                    ...res,
                                                                                                    systemFieldType: 0,
                                                                                                    type:'parent',
                                                                                                    config: configData
                                                                                                }
                                                                                            }
                                                                                            return res
                                                                                        })
                                                                                    }
                                                                                }
                                                                                next(treeCodeName,data,doAction,'treeDialog',false)
                                                                            }
                                                                        },10)
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "label": "忽略租户",
                        "type": "switch",
                        "name": "ignoreTenant",
                        "value": false,
                        "onEvent": {
                            "change": {
                                "actions": [
                                    {
                                    "actionType": "custom",
                                    script: function (_: any, doAction: any, event: any) {
                                        console.log(event, '是否忽略租户')
                                        sessionStorage.setItem('ignoreTenantFlag', event.data.value)
                                        let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                        let haveContentCode = []
                                        haveContentCode = data.filter((res: any) => {
                                            return res.systemFieldType == 9
                                        })
                                        let tenantCodeName = 'tenantCode'
                                        if (haveContentCode.length > 0) {
                                            tenantCodeName = haveContentCode[0].code
                                        }
                                        if (!event.data.value) {
                                            // if(haveContentCode.length == 0){
                                            //     data.push({
                                            //         type: 'int',
                                            //         systemFieldType: 9,
                                            //         tableKey: event.data.queryKey,
                                            //         code: 'tenantCode',
                                            //         name: '租户编码',
                                            //         foreignKeyFlag: false,
                                            //         nullable: false,
                                            //         defaultValueMode: 'static',
                                            //         defaultValue: null,
                                            //         sort: 1,
                                            //         config: {
                                            //             "dbType": 'BIGINT'
                                            //         },
                                            //         queryKey: deletedAtEntry ? deletedAtEntry.queryKey : undefined
                                            //     }) // 不能为标题字段 能为索引
                                            // }
                                            // let fieldData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                            // let fieldDatas = fieldData.map((res: any) => {
                                            //     if (!res.columnNames.includes(tenantCodeName) && res.uniqueFlag) {
                                            //         return {
                                            //             ...res,
                                            //             columnNames: res.columnNames + ','+tenantCodeName
                                            //         }
                                            //     } else {
                                            //         return res
                                            //     }
                                            // })
                                            // console.log(fieldDatas, 'fieldDatas')
                                            // let fieldDatase = fieldDatas.map((res: any, index: number) => {
                                            //     return { ...res, sort: index + 1 }
                                            // })
                                            // sessionStorage.setItem('keyCrud', JSON.stringify(fieldDatase))
                                            // doAction({
                                            //     actionType: "setValue", componentId: "keyCrud", "args": {
                                            //         "value": {
                                            //             "items": fieldDatase
                                            //         }
                                            //     }
                                            // });
                                        } else {
                                            data = data.map((res: any) => {
                                                if(res.code == tenantCodeName){
                                                    return {
                                                        ...res,
                                                        type:"int",
                                                        systemFieldType:0
                                                    }
                                                }
                                                return res
                                            })
                                            console.log(data,'datadatadatadatadatadata')
                                        }
                                        data.forEach((element: any, index: number) => {
                                            element.sort = index + 1
                                            //开启是否忽略租户时，流水号不显示是否忽略租户
                                            if(element.type == "serial-number" && JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)) {
                                                element.hideColIgnoreTenant = true
                                                //当由关闭到开启时，没有点击编辑操作，直接下发时，将所有流水号字段都改成开启
                                                element.config.colIgnoreTenant = JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)
                                            } else if (element.type == "serial-number" && !JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)){
                                                //当由开启到关闭时，没有点击编辑操作，直接下发时，将所有流水号字段都改成关闭
                                                element.hideColIgnoreTenant = false
                                                element.config.colIgnoreTenant = JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)
                                            }
                                        });
                                        let fieldCruds = data.map((res: any) => {
                                            if (res.type != 'relation' && res.code!='deletedAt'
                                                && res.code!='deleted'
                                                && res.code!='deletedBy' && res.type != 'formula' && res.systemFieldType != 9) {
                                                return res
                                            }
                                        })
                                        let puFieldCruds = data.map((res: any) => {
                                            if (!res.foreignKeyFlag && res.systemFieldType == 0 && res.type != 'relation') {
                                                return res
                                            }
                                        })
                                        let fieldKeyCruds = data.map((res: any) => {
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
                                        let waiList = data.filter((res: any) => {
                                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                                return res
                                            } else if (res.type == 'int' && res.systemFieldType == 0 && res.config.integerType == 'BIGINT') {
                                                return res
                                            }
                                        })
                                        let fieldArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                        let newFieldArr = fieldArr.map((res: any, index: number) => {
                                            return { ...res, sort: index + 1,
                                                columnNames:processIndexFields(res.columnNames,data)}
                                        })
                                        let intList = data.filter((res: any) =>
                                          res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
                                        let cuList = data.filter((res: any) =>
                                          (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
                                        let cuTimeList = data.filter((res: any) =>
                                          res.type == 'datetime' && res.systemFieldType == 0)
                                        let needPrimaryKeyType:any = []
                                        needPrimaryKeyType = data.filter((res: any) =>res.systemFieldType == 1)
                                        if(needPrimaryKeyType.length == 0){
                                            needPrimaryKeyType.push({type:'int'})
                                        }
                                        let treeList = data.filter((res: any) => {
                                            if(res.type == needPrimaryKeyType[0].type && res.systemFieldType == 0){
                                                return res
                                            }
                                        })
                                        sessionStorage.setItem('intList', JSON.stringify(intList))
                                        sessionStorage.setItem('cuList', JSON.stringify(cuList))
                                        sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
                                        sessionStorage.setItem('treeList', JSON.stringify(treeList))
                                        sessionStorage.setItem('keyCrud', JSON.stringify(newFieldArr))
                                        sessionStorage.setItem('waiList', JSON.stringify(waiList))
                                        sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
                                        sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
                                        sessionStorage.setItem('fieldCrud', JSON.stringify(data))
                                        let formulArr: any = []
                                        data.forEach((item: any) => {
                                            if (item.type != 'formula'
                                              && item.systemFieldType != 6
                                              && item.systemFieldType != 7
                                              && item.systemFieldType != 8
                                              && item.systemFieldType != 9) {
                                                formulArr.push({...item,label:item.name,value:item.code})
                                            }
                                        })
                                        sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                                        setTimeout(() => {
                                            doAction({
                                                actionType: "setValue", componentId: "keyCrud", "args": {
                                                    "value": {
                                                        "items": newFieldArr
                                                    }
                                                }
                                            });
                                            doAction({
                                                actionType: "setValue", componentId: "myField", "args": {
                                                    "value": {
                                                        "items": data
                                                    }
                                                }
                                            });
                                        }, 1000);
                                    }
                                },
                                    {
                                        "ignoreError": false,
                                        "actionType": "dialog",
                                        "expression": "${event.data.ignoreTenant == false}",
                                        "dialog": {
                                            "id":"tenantDialog",
                                            // "type": "dialog",
                                            "title": "请选择非系统长整型字段",
                                            "body": [
                                                {
                                                    "type": "form",
                                                    "title": "表单",
                                                    "mode": "flex",
                                                    "resetAfterSubmit": true,
                                                    "feat": "Insert",
                                                    "dsType": "model-entity",
                                                    "id":"tantentForm",
                                                    "body": [
                                                        {
                                                            "type": "radios",
                                                            "label": "操作方式",
                                                            "name": "operatingMode",
                                                            "options": [
                                                                {
                                                                    "label": "新建字段",
                                                                    "value": 0
                                                                },
                                                                {
                                                                    "label": "选择现有字段",
                                                                    "value": 1
                                                                }
                                                            ],
                                                            "row": 0,
                                                            "optionType": "default",
                                                            "colSize": "1",
                                                            "value": 0
                                                        },
                                                        {
                                                            "visibleOn": "${operatingMode == 1}",
                                                            "type": "select",
                                                            "label": "选择现有长整型字段",
                                                            "name": "tenantCodeSelect",
                                                            "source": "${ss:intList}",
                                                            "labelField":"code",
                                                            "valueField":"code",
                                                            "multiple": false,
                                                            "required": true,
                                                            validations: {
                                                                selectFiled: true
                                                            },
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "label": "字段名",
                                                            "name": "tenantCode",
                                                            "required": true,
                                                            "value": "tenantCode",
                                                            "clearable": true,
                                                            "visibleOn": "${operatingMode == 0}",
                                                            validations: {
                                                                matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                                                isTenant: true
                                                            },
                                                            validationErrors: {
                                                                matchRegexp: '请填写规范字段名'
                                                            },
                                                        },
                                                        {
                                                            visibleOn: "(operatingMode == 0)",
                                                            label: '显示名称',
                                                            required: true,
                                                            type: 'input-text',
                                                            placeholder: '字段展示的名称，可以是中文',
                                                            name: 'tenantName',
                                                            id: 'tenantName',
                                                            value: "租户编码",
                                                            validations: {
                                                                isTenantSameName: true
                                                            },
                                                        }
                                                    ],
                                                    "actions": [],
                                                    "labelAlign": "top"
                                                }
                                            ],
                                            "onEvent": {
                                                "cancel": {
                                                    "weight": 0,
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            script: function(_: any, doAction: any, event: any) {
                                                                doAction({
                                                                    actionType: "setValue", componentName: "ignoreTenant", "args": {
                                                                        "value": true
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            "actions": [
                                                {
                                                    "type": "button",
                                                    "actionType": "cancel",
                                                    "label": "取消",
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: "setValue", componentName: "ignoreTenant", "args": {
                                                                                "value": true
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    "type": "button",
                                                    "actionType": "confirm",
                                                    "label": "确定",
                                                    "primary": true,
                                                    "close":false,
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: 'validate',
                                                                            componentId: 'tantentForm',
                                                                            outputVar: 'validateResult'
                                                                        });
                                                                        setTimeout(()=>{
                                                                            console.log(event,'校验结果')
                                                                            let data:any = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                            let haveContentCode = []
                                                                            haveContentCode = data.filter((res: any) => {
                                                                                return res.systemFieldType == 9
                                                                            })
                                                                            let tenantCodeName = 'tenantCode'
                                                                            if (haveContentCode.length > 0) {
                                                                                tenantCodeName = haveContentCode[0].code
                                                                            }
                                                                            let systemFieldData = JSON.parse(sessionStorage.getItem('haveSystemQueryKey')!)
                                                                            let deletedAtEntry = systemFieldData.find(
                                                                              item => item.systemFieldType == 9
                                                                            );
                                                                            if(!deletedAtEntry){
                                                                                deletedAtEntry = systemFieldData.find(
                                                                                  item => item.code == 'tenantCode'
                                                                                );
                                                                            }
                                                                            if(event.data.validateResult.error == ''){
                                                                                if(haveContentCode.length == 0){
                                                                                    if(event.data.validateResult.payload.operatingMode == 0){
                                                                                        data.push({
                                                                                            type: 'int',
                                                                                            systemFieldType: 9,
                                                                                            tableKey: event.data.queryKey,
                                                                                            code: event.data.validateResult.payload.tenantCode,
                                                                                            name: event.data.validateResult.payload.tenantName,
                                                                                            foreignKeyFlag: false,
                                                                                            nullable: false,
                                                                                            defaultValueMode: 'null',
                                                                                            defaultValue: null,
                                                                                            sort: 1,
                                                                                            config: {
                                                                                                "dbType": 'BIGINT'
                                                                                            }
                                                                                        })
                                                                                        tenantCodeName = event.data.validateResult.payload.tenantCode
                                                                                    }else{
                                                                                        data = data.map((res: any) => {
                                                                                            if(res.code == event.data.validateResult.payload.tenantCodeSelect){
                                                                                                tenantCodeName = res.code
                                                                                                return {
                                                                                                    ...res,
                                                                                                    systemFieldType: 9,
                                                                                                    config: {
                                                                                                        "dbType": 'BIGINT'
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            return res
                                                                                        })
                                                                                    }
                                                                                }
                                                                                next(tenantCodeName,data,doAction,'tenantDialog',true)
                                                                            }
                                                                        },10)
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    // {
                    //     "label": "树存储方式",
                    //     "type": "select",
                    //     "name": "treePattern",
                    //     "id": "treePattern",
                    //     "size": "md",
                    //     "visibleOn": '${tree}',
                    //     "value": 0,
                    //     "options": [
                    //         {
                    //             "label": "物化路径",
                    //             "value": 0
                    //         }
                    //     ],
                    // "source": useDevBaseUrl("/entitymanage/table/getColumnSelect?tableKey=${queryKey}")
                    // },
                ]
            },
            {
                "type": "group",
                "body": [
                    {
                        "label": "记录创建人",
                        "type": "switch",
                        "name": "createdBy",
                        // "name": "creator",
                        "value": false,
                        "onEvent": {
                            "change": {
                                "actions": [
                                  {
                                    "actionType": "custom",
                                    script: function (_: any, doAction: any, event: any) {
                                        console.log(_, '__')
                                        console.log(doAction, 'doActiondoAction')
                                        console.log(event, 'eventevent')
                                        let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                        let haveCreatedByParent = []
                                        haveCreatedByParent = data.filter((res: any) => {
                                            return res.systemFieldType == 2
                                        })
                                        let createdByCodeName = 'createdBy'
                                        if (haveCreatedByParent.length > 0) {
                                          createdByCodeName = haveCreatedByParent[0].code
                                        }
                                        if (event.data.createdBy) {
                                            // let haveCreatedBy = data.filter((res: any) => res.systemFieldType == 2)
                                            // let haveSameCreatedBy = data.filter((res: any) => res.code == 'createdBy')
                                            // if(haveCreatedBy.length==0){
                                            //     if(haveSameCreatedBy.length==0){
                                            //         data.push({
                                            //             type: 'user',
                                            //             systemFieldType: 2,
                                            //             // systemFieldType: 'CREATE_USER',
                                            //             tableKey: event.data.queryKey,
                                            //             code: 'createdBy',
                                            //             name: '创建人',
                                            //             foreignKeyFlag: false,
                                            //             nullable: false,
                                            //             defaultValueMode: 'null',
                                            //             sort: 1,
                                            //         })
                                            //     }else{
                                            //         setTimeout(()=>{
                                            //             doAction({
                                            //                 actionType: "setValue",
                                            //                 componentName: "createdBy",
                                            //                 "args": {
                                            //                     "value": false
                                            //                 }
                                            //             });
                                            //         },10)
                                            //         toast.error('已存在相同字段名createdBy，请修改');
                                            //     }
                                            // }
                                        } else {
                                            let nameFieldData = sessionStorage.getItem('nameFieldData')
                                            data = data.map((res: any) => {
                                              if(res.code == createdByCodeName){
                                                let needConfigData = {}
                                                if('config' in res && res.config){
                                                    needConfigData = res.config
                                                    if(!('allowInput' in res.config)){
                                                        needConfigData.allowInput = true
                                                    }
                                                    if(!('nullable' in res.config)){
                                                        needConfigData.nullable = true
                                                    }
                                                }else{
                                                    needConfigData = {
                                                    dbType: 'VARCHAR',allowInput:true,nullable: false
                                                    }
                                                }
                                                return {
                                                  ...res,
                                                  config:needConfigData,
                                                  systemFieldType:0
                                                }
                                              }
                                              return res
                                            })
                                            if (nameFieldData == createdByCodeName) {
                                                let ars = data.filter((sc: any) => {
                                                    return sc.systemFieldType == 0
                                                })
                                                if (ars.length > 0) {
                                                    doAction({
                                                        actionType: "setValue", componentId: "nameField", "args": {
                                                            "value": ars[0].code
                                                        }
                                                    });
                                                    // nameFieldData = ars[0].code
                                                    sessionStorage.setItem('nameFieldData', ars[0].code)
                                                } else {
                                                    doAction({
                                                        actionType: "setValue", componentId: "nameField", "args": {
                                                            "value": 'id'
                                                        }
                                                    });
                                                    // nameFieldData = 'id'
                                                    sessionStorage.setItem('nameFieldData', 'id')
                                                }
                                            }
                                            doAction({ actionType: "reload", componentId: "nameField" });
                                            let fieldCrudData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                            let needCreatedByCode = data.find((res: any) => res.systemFieldType === 2)?.code || 'createdBy';
                                            let fieldCrudDatas = fieldCrudData.map((res: any) => {
                                                let splitArr = res.columnNames.split(',');
                                                let found = false;
                                                splitArr.forEach((item) => {
                                                    if (item === needCreatedByCode) {
                                                        found = true;
                                                    }
                                                });
                                                if (found) {
                                                    const filteredArr = splitArr.filter(item => item !== needCreatedByCode);
                                                    return {
                                                        ...res,
                                                        columnNames: filteredArr.join(',')
                                                    };
                                                } else {
                                                    return res;
                                                }
                                            })
                                            let fieldCrudDatass = fieldCrudDatas.filter((res: any) => {
                                                return res.columnNames != ""
                                            })
                                            let fieldCrudDatasse = fieldCrudDatass.map((res: any, index: number) => {
                                                return { ...res, sort: index + 1,
                                                    columnNames:processIndexFields(res.columnNames,data)
                                                }
                                            })
                                            sessionStorage.setItem('keyCrud', JSON.stringify(fieldCrudDatasse))
                                            doAction({
                                                actionType: "setValue", componentId: "keyCrud", "args": {
                                                    "value": {
                                                        "items": fieldCrudDatasse
                                                    }
                                                }
                                            });
                                        }
                                        systemNext(data,doAction)
                                    }
                                },
                                  {
                                        "ignoreError": false,
                                        "actionType": "dialog",
                                        "expression": "${event.data.createdBy == true}",
                                        "dialog": {
                                            "id":"createdByDialog",
                                            "title": "请选择文本或人员字段",
                                            "body": [
                                                {
                                                    "type": "form",
                                                    "title": "表单",
                                                    "mode": "flex",
                                                    "resetAfterSubmit": true,
                                                    "feat": "Insert",
                                                    "dsType": "model-entity",
                                                    "id":"createdByForm",
                                                    "body": [
                                                        {
                                                            "type": "radios",
                                                            "label": "操作方式",
                                                            "name": "operatingMode",
                                                            "options": [
                                                                {
                                                                    "label": "新建字段",
                                                                    "value": 0
                                                                },
                                                                {
                                                                    "label": "选择现有字段",
                                                                    "value": 1
                                                                }
                                                            ],
                                                            "row": 0,
                                                            "optionType": "default",
                                                            "colSize": "1",
                                                            "value": 0
                                                        },
                                                        {
                                                            "visibleOn": "${operatingMode == 1}",
                                                            "type": "select",
                                                            "label": "选择现有字段",
                                                            "name": "createdBySelect",
                                                            "source": "${ss:cuList}",
                                                            "labelField":"code",
                                                            "valueField":"code",
                                                            "multiple": false,
                                                            "required": true,
                                                            validations: {
                                                                selectFiled: true
                                                            },
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "label": "字段名",
                                                            "name": "createdByCode",
                                                            "required": true,
                                                            "value": "createdBy",
                                                            "clearable": true,
                                                            "visibleOn": "${operatingMode == 0}",
                                                            validations: {
                                                                matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                                                isCreatedBy: true
                                                            },
                                                            validationErrors: {
                                                                matchRegexp: '请填写规范字段名'
                                                            },
                                                        },
                                                        {
                                                            visibleOn: "(operatingMode == 0)",
                                                            label: '显示名称',
                                                            required: true,
                                                            type: 'input-text',
                                                            placeholder: '字段展示的名称，可以是中文',
                                                            name: 'createdByName',
                                                            id: 'createdByName',
                                                            value: "创建人",
                                                            validations: {
                                                                isSameCreatedByName: true
                                                            },
                                                        }
                                                    ],
                                                    "actions": [],
                                                    "labelAlign": "top"
                                                }
                                            ],
                                            "onEvent": {
                                                "cancel": {
                                                    "weight": 0,
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            script: function(_: any, doAction: any, event: any) {
                                                                doAction({
                                                                    actionType: "setValue", componentName: "createdBy", "args": {
                                                                        "value": false
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            "actions": [
                                                {
                                                    "type": "button",
                                                    "actionType": "cancel",
                                                    "label": "取消",
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: "setValue", componentName: "createdBy", "args": {
                                                                                "value": false
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    "type": "button",
                                                    "actionType": "confirm",
                                                    "label": "确定",
                                                    "primary": true,
                                                    "close":false,
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: 'validate',
                                                                            componentId: 'createdByForm',
                                                                            outputVar: 'validateResult'
                                                                        });
                                                                        setTimeout(()=>{
                                                                            console.log(event,'校验结果')
                                                                            let data:any = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                            let haveCreatedByCode = []
                                                                            haveCreatedByCode = data.filter((res: any) => {
                                                                                return res.systemFieldType == 2
                                                                            })
                                                                            let createdByCodeName = 'createdBy'
                                                                            if (haveCreatedByCode.length > 0) {
                                                                                createdByCodeName = haveCreatedByCode[0].code
                                                                            }
                                                                            if(event.data.validateResult.error == ''){
                                                                                if(haveCreatedByCode.length == 0){
                                                                                    if(event.data.validateResult.payload.operatingMode == 0){
                                                                                        data.push({
                                                                                            type: 'user',
                                                                                            systemFieldType: 2,
                                                                                            tableKey: event.data.queryKey,
                                                                                            code: event.data.validateResult.payload.createdByCode,
                                                                                            name: event.data.validateResult.payload.createdByName,
                                                                                            foreignKeyFlag: false,
                                                                                            nullable: false,
                                                                                            defaultValueMode: 'null',
                                                                                            sort: 1,
                                                                                            needId: uuid.v4(),
                                                                                            config:{
                                                                                                "dbType":"VARCHAR"
                                                                                            }
                                                                                        })
                                                                                        createdByCodeName = event.data.validateResult.payload.createdByCode
                                                                                    }else{
                                                                                        data = data.map((res: any) => {
                                                                                            if(res.code == event.data.validateResult.payload.createdBySelect){
                                                                                                createdByCodeName = res.code
                                                                                                return {
                                                                                                    ...res,
                                                                                                    systemFieldType: 2
                                                                                                }
                                                                                            }
                                                                                            return res
                                                                                        })
                                                                                    }
                                                                                }
                                                                                next(createdByCodeName,data,doAction,'createdByDialog',false)
                                                                            }
                                                                        },10)
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "label": "记录删除人",
                        "type": "switch",
                        "name": "deletedBy",
                        "id": "deletedBys",
                        "visibleOn": '${useSoftDelete}',
                        // "name": "useSoftDelete",
                        "value": false,
                        "onEvent": {
                            "change": {
                                "actions": [
                                  {
                                    "actionType": "custom",
                                    script: function (_: any, doAction: any, event: any) {
                                        let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                        let needDeletedByCode = data.find((res: any) => res.systemFieldType === 7)?.code || 'deletedBy';
                                        let nameFieldData = sessionStorage.getItem('nameFieldData')
                                        // let data = JSON.parse(getCookie('fieldCrud'))
                                        if (event.data.deletedBy) {
                                            // let haveDeletedBy = data.filter((res: any) => res.systemFieldType == 7)
                                            // let haveSameDeletedBy = data.filter((res: any) => res.code == 'deletedBy')
                                            // if(haveDeletedBy.length==0) {
                                            //     if(haveSameDeletedBy.length==0){
                                            //         data.push({
                                            //             type: 'user',
                                            //             systemFieldType: 7,
                                            //             // systemFieldType: 'DELETE_USER',
                                            //             tableKey: event.data.queryKey,
                                            //             code: 'deletedBy',
                                            //             name: '删除人',
                                            //             foreignKeyFlag: false,
                                            //             nullable: false,
                                            //             defaultValueMode: 'static',
                                            //             defaultValue: '',
                                            //             sort: 1,
                                            //         })
                                            //     }else{
                                            //         setTimeout(()=>{
                                            //             doAction({
                                            //                 actionType: "setValue",
                                            //                 componentName: "deletedBy",
                                            //                 "args": {
                                            //                     "value": false
                                            //                 }
                                            //             });
                                            //         },10)
                                            //         toast.error('已存在相同字段名deletedBy，请修改');
                                            //     }
                                            // }
                                        } else {
                                            data = data.map((res: any) => {
                                              if(res.code == needDeletedByCode){
                                                  let needConfigData = {}
                                                  if('config' in res && res.config){
                                                      needConfigData = res.config
                                                      if(!('allowInput' in res.config)){
                                                          needConfigData.allowInput = true
                                                      }
                                                      if(!('nullable' in res.config)){
                                                          needConfigData.nullable = true
                                                      }
                                                  }else{
                                                      needConfigData = {
                                                          dbType: 'VARCHAR',allowInput:true,nullable:true
                                                      }
                                                  }
                                                  return {
                                                      ...res,
                                                      config:needConfigData,
                                                      systemFieldType:0
                                                  }
                                              }
                                              return res
                                            })
                                            if (nameFieldData == needDeletedByCode) {
                                                let ars = data.filter((sc: any) => {
                                                    return sc.systemFieldType == 0
                                                })
                                                if (ars.length > 0) {
                                                    doAction({
                                                        actionType: "setValue", componentId: "nameField", "args": {
                                                            "value": ars[0].code
                                                        }
                                                    });
                                                    // nameFieldData = ars[0].code
                                                    sessionStorage.setItem('nameFieldData', ars[0].code)
                                                } else {
                                                    doAction({
                                                        actionType: "setValue", componentId: "nameField", "args": {
                                                            "value": 'id'
                                                        }
                                                    });
                                                    // nameFieldData = 'id'
                                                    sessionStorage.setItem('nameFieldData', 'id')
                                                }
                                            }
                                            doAction({ actionType: "reload", componentId: "nameField" });
                                            let fieldCrudData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                            let fieldCrudDatas = fieldCrudData.map((res: any) => {
                                                let splitArr = res.columnNames.split(',');
                                                let found = false;
                                                splitArr.forEach((item) => {
                                                    if (item === needDeletedByCode) {
                                                        found = true;
                                                    }
                                                });
                                                if (found) {
                                                    const filteredArr = splitArr.filter(item => item !== needDeletedByCode);
                                                    return {
                                                        ...res,
                                                        columnNames: filteredArr.join(',')
                                                    };
                                                } else {
                                                    return res;
                                                }
                                            })
                                            let fieldCrudDatass = fieldCrudDatas.filter((res: any) => {
                                                return res.columnNames != ""
                                            })
                                            let fieldCrudDatasse = fieldCrudDatass.map((res: any, index: number) => {
                                                return { ...res, sort: index + 1,
                                                    columnNames:processIndexFields(res.columnNames,data)
                                                }
                                            })
                                            sessionStorage.setItem('keyCrud', JSON.stringify(fieldCrudDatasse))
                                            doAction({
                                                actionType: "setValue", componentId: "keyCrud", "args": {
                                                    "value": {
                                                        "items": fieldCrudDatasse
                                                    }
                                                }
                                            });
                                        }
                                        systemNext(data,doAction)
                                    }
                                },
                                  {
                                        "ignoreError": false,
                                        "actionType": "dialog",
                                        "expression": "${event.data.deletedBy == true}",
                                        "dialog": {
                                            "id":"deletedByDialog",
                                            "title": "请选择文本或人员字段",
                                            "body": [
                                                {
                                                    "type": "form",
                                                    "title": "表单",
                                                    "mode": "flex",
                                                    "resetAfterSubmit": true,
                                                    "feat": "Insert",
                                                    "dsType": "model-entity",
                                                    "id":"deletedByForm",
                                                    "body": [
                                                        {
                                                            "type": "radios",
                                                            "label": "操作方式",
                                                            "name": "operatingMode",
                                                            "options": [
                                                                {
                                                                    "label": "新建字段",
                                                                    "value": 0
                                                                },
                                                                {
                                                                    "label": "选择现有字段",
                                                                    "value": 1
                                                                }
                                                            ],
                                                            "row": 0,
                                                            "optionType": "default",
                                                            "colSize": "1",
                                                            "value": 0
                                                        },
                                                        {
                                                            "visibleOn": "${operatingMode == 1}",
                                                            "type": "select",
                                                            "label": "选择现有字段",
                                                            "name": "deletedBySelect",
                                                            "source": "${ss:cuList}",
                                                            "labelField":"code",
                                                            "valueField":"code",
                                                            "multiple": false,
                                                            "required": true,
                                                            validations: {
                                                                selectFiled: true
                                                            },
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "label": "字段名",
                                                            "name": "deletedByCode",
                                                            "required": true,
                                                            "value": "deletedBy",
                                                            "clearable": true,
                                                            "visibleOn": "${operatingMode == 0}",
                                                            validations: {
                                                                matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                                                isDeletedBy: true
                                                            },
                                                            validationErrors: {
                                                                matchRegexp: '请填写规范字段名'
                                                            },
                                                        },
                                                        {
                                                            visibleOn: "(operatingMode == 0)",
                                                            label: '显示名称',
                                                            required: true,
                                                            type: 'input-text',
                                                            placeholder: '字段展示的名称，可以是中文',
                                                            name: 'deletedByName',
                                                            id: 'deletedByName',
                                                            value: "删除人",
                                                            validations: {
                                                                isSameDeletedByName: true
                                                            },
                                                        }
                                                    ],
                                                    "actions": [],
                                                    "labelAlign": "top"
                                                }
                                            ],
                                            "onEvent": {
                                                "cancel": {
                                                    "weight": 0,
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            script: function(_: any, doAction: any, event: any) {
                                                                doAction({
                                                                    actionType: "setValue", componentName: "deletedBy", "args": {
                                                                        "value": false
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            "actions": [
                                                {
                                                    "type": "button",
                                                    "actionType": "cancel",
                                                    "label": "取消",
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: "setValue", componentName: "deletedBy", "args": {
                                                                                "value": false
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    "type": "button",
                                                    "actionType": "confirm",
                                                    "label": "确定",
                                                    "primary": true,
                                                    "close":false,
                                                    "onEvent": {
                                                        "click": {
                                                            "actions": [
                                                                {
                                                                    "actionType": "custom",
                                                                    script: function(_: any, doAction: any, event: any) {
                                                                        doAction({
                                                                            actionType: 'validate',
                                                                            componentId: 'deletedByForm',
                                                                            outputVar: 'validateResult'
                                                                        });
                                                                        setTimeout(()=>{
                                                                            console.log(event,'校验结果')
                                                                            let data:any = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                            let haveDeletedByCode = []
                                                                            haveDeletedByCode = data.filter((res: any) => {
                                                                                return res.systemFieldType == 7
                                                                            })
                                                                            let deletedByCodeName = 'deletedBy'
                                                                            if (haveDeletedByCode.length > 0) {
                                                                                deletedByCodeName = haveDeletedByCode[0].code
                                                                            }
                                                                            if(event.data.validateResult.error == ''){
                                                                                if(haveDeletedByCode.length == 0){
                                                                                    if(event.data.validateResult.payload.operatingMode == 0){
                                                                                        data.push({
                                                                                            type: 'user',
                                                                                            systemFieldType: 7,
                                                                                            tableKey: event.data.queryKey,
                                                                                            code: event.data.validateResult.payload.deletedByCode,
                                                                                            name: event.data.validateResult.payload.deletedByName,
                                                                                            foreignKeyFlag: false,
                                                                                            nullable: false,
                                                                                            defaultValueMode: 'static',
                                                                                            defaultValue: '',
                                                                                            sort: 1,
                                                                                            needId: uuid.v4(),
                                                                                            config:{
                                                                                                "dbType":"VARCHAR"
                                                                                            }
                                                                                        })
                                                                                        deletedByCodeName = event.data.validateResult.payload.deletedByCode
                                                                                    }else{
                                                                                        data = data.map((res: any) => {
                                                                                            if(res.code == event.data.validateResult.payload.deletedBySelect){
                                                                                                deletedByCodeName = res.code
                                                                                                return {
                                                                                                    ...res,
                                                                                                    systemFieldType: 7
                                                                                                }
                                                                                            }
                                                                                            return res
                                                                                        })
                                                                                    }
                                                                                }
                                                                                next(deletedByCodeName,data,doAction,'deletedByDialog',false)
                                                                            }
                                                                        },10)
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                ]
            },
            {
                "type": "group",
                "body": [{
                    "label": "记录更新人",
                    "type": "switch",
                    "name": "updatedBy",
                    // "name": "updater",
                    "value": false,
                    "onEvent": {
                        "change": {
                            "actions": [
                              {
                                "actionType": "custom",
                                script: function (_: any, doAction: any, event: any) {
                                    console.log(_, '__')
                                    console.log(doAction, 'doActiondoAction')
                                    console.log(event, 'eventevent')
                                    let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                    let needUpdatedByCode = data.find((res: any) => res.systemFieldType === 3)?.code || 'updatedBy';
                                    // let data = JSON.parse(getCookie('fieldCrud'))
                                    if (event.data.updatedBy) {
                                        // let haveUpdatedBy = data.filter((res: any) => res.systemFieldType == 3)
                                        // let haveSameUpdatedBy = data.filter((res: any) => res.code == 'updatedBy')
                                        // if(haveUpdatedBy.length==0) {
                                        //     if(haveSameUpdatedBy.length==0){
                                        //         data.push({
                                        //             type: 'user',
                                        //             systemFieldType: 3,
                                        //             // systemFieldType: 'UPDATE_USER',
                                        //             tableKey: event.data.queryKey,
                                        //             code: 'updatedBy',
                                        //             name: '更新人',
                                        //             nullable: false, foreignKeyFlag: false,
                                        //             defaultValueMode: 'null',
                                        //             sort: 1,
                                        //         })
                                        //     }else{
                                        //         setTimeout(()=>{
                                        //             doAction({
                                        //                 actionType: "setValue",
                                        //                 componentName: "updatedBy",
                                        //                 "args": {
                                        //                     "value": false
                                        //                 }
                                        //             });
                                        //         },10)
                                        //         toast.error('已存在相同字段名updatedBy，请修改');
                                        //     }
                                        // }
                                    } else {
                                        let nameFieldData = sessionStorage.getItem('nameFieldData')
                                        data = data.map((res: any) => {
                                          if(res.code == needUpdatedByCode){
                                              let needConfigData = {}
                                              if('config' in res && res.config){
                                                  needConfigData = res.config
                                                  if(!('allowInput' in res.config)){
                                                      needConfigData.allowInput = true
                                                  }
                                                  if(!('nullable' in res.config)){
                                                      needConfigData.nullable = true
                                                  }
                                              }else{
                                                  needConfigData = {
                                                      dbType: 'VARCHAR',allowInput:true,nullable:true
                                                  }
                                              }
                                              return {
                                                  ...res,
                                                  config:needConfigData,
                                                  systemFieldType:0
                                              }
                                          }
                                          return res
                                        })
                                        if (nameFieldData == 'updatedBy') {
                                            let ars = data.filter((sc: any) => {
                                                return sc.systemFieldType == 0
                                            })
                                            if (ars.length > 0) {
                                                doAction({
                                                    actionType: "setValue", componentId: "nameField", "args": {
                                                        "value": ars[0].code
                                                    }
                                                });
                                                // nameFieldData = ars[0].code
                                                sessionStorage.setItem('nameFieldData', ars[0].code)
                                            } else {
                                                doAction({
                                                    actionType: "setValue", componentId: "nameField", "args": {
                                                        "value": 'id'
                                                    }
                                                });
                                                // nameFieldData = 'id'
                                                sessionStorage.setItem('nameFieldData', 'id')
                                            }
                                        }
                                        doAction({ actionType: "reload", componentId: "nameField" });
                                        let fieldCrudData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                        let fieldCrudDatas = fieldCrudData.map((res: any) => {
                                            let splitArr = res.columnNames.split(',');
                                            let found = false;
                                            splitArr.forEach((item) => {
                                                if (item === needUpdatedByCode) {
                                                    found = true;
                                                }
                                            });
                                            if (found) {
                                                const filteredArr = splitArr.filter(item => item !== needUpdatedByCode);
                                                return {
                                                    ...res,
                                                    columnNames: filteredArr.join(',')
                                                };
                                            } else {
                                                return res;
                                            }
                                        })
                                        //         sessionStorage.setItem('keyCrud', JSON.stringify(fieldCrudDatas))
                                        // doAction({
                                        //     actionType: "setValue", componentId: "keyCrud", "args": {
                                        //         "value": {
                                        //             "items": fieldCrudDatas
                                        //         }
                                        //     }
                                        // });
                                        let fieldCrudDatass = fieldCrudDatas.filter((res: any) => {
                                            return res.columnNames != ""
                                        })
                                        let fieldCrudDatasse = fieldCrudDatass.map((res: any, index: number) => {
                                            return { ...res, sort: index + 1,
                                                columnNames:processIndexFields(res.columnNames,data)
                                            }
                                        })
                                        sessionStorage.setItem('keyCrud', JSON.stringify(fieldCrudDatasse))
                                        doAction({
                                            actionType: "setValue", componentId: "keyCrud", "args": {
                                                "value": {
                                                    "items": fieldCrudDatasse
                                                }
                                            }
                                        });
                                    }
                                    systemNext(data,doAction)
                                }
                            },
                              {
                                    "ignoreError": false,
                                    "actionType": "dialog",
                                    "expression": "${event.data.updatedBy == true}",
                                    "dialog": {
                                        "id":"updatedByDialog",
                                        "title": "请选择文本或人员字段",
                                        "body": [
                                            {
                                                "type": "form",
                                                "title": "表单",
                                                "mode": "flex",
                                                "resetAfterSubmit": true,
                                                "feat": "Insert",
                                                "dsType": "model-entity",
                                                "id":"updatedByForm",
                                                "body": [
                                                    {
                                                        "type": "radios",
                                                        "label": "操作方式",
                                                        "name": "operatingMode",
                                                        "options": [
                                                            {
                                                                "label": "新建字段",
                                                                "value": 0
                                                            },
                                                            {
                                                                "label": "选择现有字段",
                                                                "value": 1
                                                            }
                                                        ],
                                                        "row": 0,
                                                        "optionType": "default",
                                                        "colSize": "1",
                                                        "value": 0
                                                    },
                                                    {
                                                        "visibleOn": "${operatingMode == 1}",
                                                        "type": "select",
                                                        "label": "选择现有字段",
                                                        "name": "updatedBySelect",
                                                        "source": "${ss:cuList}",
                                                        "labelField":"code",
                                                        "valueField":"code",
                                                        "multiple": false,
                                                        "required": true,
                                                        validations: {
                                                            selectFiled: true
                                                        },
                                                    },
                                                    {
                                                        "type": "input-text",
                                                        "label": "字段名",
                                                        "name": "updatedByCode",
                                                        "required": true,
                                                        "value": "updatedBy",
                                                        "clearable": true,
                                                        "visibleOn": "${operatingMode == 0}",
                                                        validations: {
                                                            matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                                            isUpdatedBy: true
                                                        },
                                                        validationErrors: {
                                                            matchRegexp: '请填写规范字段名'
                                                        },
                                                    },
                                                    {
                                                        visibleOn: "(operatingMode == 0)",
                                                        label: '显示名称',
                                                        required: true,
                                                        type: 'input-text',
                                                        placeholder: '字段展示的名称，可以是中文',
                                                        name: 'updatedByName',
                                                        id: 'updatedByName',
                                                        value: "更新人",
                                                        validations: {
                                                            isSameUpdatedByName: true
                                                        },
                                                    }
                                                ],
                                                "actions": [],
                                                "labelAlign": "top"
                                            }
                                        ],
                                        "onEvent": {
                                            "cancel": {
                                                "weight": 0,
                                                "actions": [
                                                    {
                                                        "actionType": "custom",
                                                        script: function(_: any, doAction: any, event: any) {
                                                            doAction({
                                                                actionType: "setValue", componentName: "updatedBy", "args": {
                                                                    "value": false
                                                                }
                                                            });
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "actions": [
                                            {
                                                "type": "button",
                                                "actionType": "cancel",
                                                "label": "取消",
                                                "onEvent": {
                                                    "click": {
                                                        "actions": [
                                                            {
                                                                "actionType": "custom",
                                                                script: function(_: any, doAction: any, event: any) {
                                                                    doAction({
                                                                        actionType: "setValue", componentName: "updatedBy", "args": {
                                                                            "value": false
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                "type": "button",
                                                "actionType": "confirm",
                                                "label": "确定",
                                                "primary": true,
                                                "close":false,
                                                "onEvent": {
                                                    "click": {
                                                        "actions": [
                                                            {
                                                                "actionType": "custom",
                                                                script: function(_: any, doAction: any, event: any) {
                                                                    doAction({
                                                                        actionType: 'validate',
                                                                        componentId: 'updatedByForm',
                                                                        outputVar: 'validateResult'
                                                                    });
                                                                    setTimeout(()=>{
                                                                        console.log(event,'校验结果')
                                                                        let data:any = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                        let haveUpdatedByCode = []
                                                                        haveUpdatedByCode = data.filter((res: any) => {
                                                                            return res.systemFieldType == 3
                                                                        })
                                                                        let updatedByCodeName = 'updatedBy'
                                                                        if (haveUpdatedByCode.length > 0) {
                                                                            updatedByCodeName = haveUpdatedByCode[0].code
                                                                        }
                                                                        if(event.data.validateResult.error == ''){
                                                                            if(haveUpdatedByCode.length == 0){
                                                                                if(event.data.validateResult.payload.operatingMode == 0){
                                                                                    data.push({
                                                                                        type: 'user',
                                                                                        systemFieldType: 3,
                                                                                        tableKey: event.data.queryKey,
                                                                                        code: event.data.validateResult.payload.updatedByCode,
                                                                                        name: event.data.validateResult.payload.updatedByName,
                                                                                        nullable: false,
                                                                                        foreignKeyFlag: false,
                                                                                        defaultValueMode: 'null',
                                                                                        sort: 1,
                                                                                        needId: uuid.v4(),
                                                                                        config:{
                                                                                            "dbType":"VARCHAR"
                                                                                        }
                                                                                    })
                                                                                    updatedByCodeName = event.data.validateResult.payload.updatedByCode
                                                                                }else{
                                                                                    data = data.map((res: any) => {
                                                                                        if(res.code == event.data.validateResult.payload.updatedBySelect){
                                                                                            updatedByCodeName = res.code
                                                                                            return {
                                                                                                ...res,
                                                                                                systemFieldType: 3
                                                                                            }
                                                                                        }
                                                                                        return res
                                                                                    })
                                                                                }
                                                                            }
                                                                            next(updatedByCodeName,data,doAction,"updatedByDialog",false)
                                                                        }
                                                                    },10)
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }, {
                    "label": "记录删除时间",
                    "type": "switch",
                    // "value": "${useSoftDelete}",
                    "value": true,
                    "visibleOn": '${useSoftDelete}',
                    "disabled": true,
                    "name": "deletedAt",
                }]
            },
            {
                "type": "group",
                "body": [{
                    "label": "记录创建时间",
                    "type": "switch",
                    "name": "createdAt",
                    // "name": "createTime",
                    "value": false,
                    "onEvent": {
                        "change": {
                            "actions": [
                              {
                                "actionType": "custom",
                                script: function (_: any, doAction: any, event: any) {
                                    console.log(_, '__')
                                    console.log(doAction, 'doActiondoAction')
                                    console.log(event, 'eventevent')
                                    let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                    let needCreatedAtCode = data.find((res: any) => res.systemFieldType === 4)?.code || 'createdAt';
                                    // let data = JSON.parse(getCookie('fieldCrud'))
                                    if (event.data.createdAt) {
                                        // let haveCreatedAt = data.filter((res: any) => res.systemFieldType == 4)
                                        // let haveSameCreatedAt = data.filter((res: any) => res.code == 'createdAt')
                                        // if(haveCreatedAt.length==0) {
                                        //     if(haveSameCreatedAt.length==0){
                                        //         data.push({
                                        //             type: 'datetime',
                                        //             systemFieldType: 4,
                                        //             // systemFieldType: 'CREATE_DATE',
                                        //             tableKey: event.data.queryKey,
                                        //             code: 'createdAt',
                                        //             name: '创建时间', foreignKeyFlag: false,
                                        //             nullable: false,
                                        //             defaultValueMode: 'static',
                                        //             defaultValue: '0001-01-01 00:00:00',
                                        //             sort: 1
                                        //         })
                                        //     }else{
                                        //         setTimeout(()=>{
                                        //             doAction({
                                        //                 actionType: "setValue",
                                        //                 componentName: "createdAt",
                                        //                 "args": {
                                        //                     "value": false
                                        //                 }
                                        //             });
                                        //         },10)
                                        //         toast.error('已存在相同字段名createdAt，请修改');
                                        //     }
                                        // }
                                    } else {
                                        let nameFieldData = sessionStorage.getItem('nameFieldData')
                                        data = data.map((res: any) => {
                                          if(res.code == needCreatedAtCode){
                                              let needConfigData = {}
                                              if('config' in res && res.config){
                                                  needConfigData = res.config
                                                  if(!('allowInput' in res.config)){
                                                      needConfigData.allowInput = true
                                                  }
                                                  if(!('nullable' in res.config)){
                                                      needConfigData.nullable = true
                                                  }
                                              }else{
                                                  needConfigData = {
                                                      dbType: 'DATETIME',
                                                      defaultValue:"2020-01-01 00:00:00",
                                                      defaultValueMode:"static",
                                                      allowInput:true,
                                                      nullable:true
                                                  }
                                              }
                                              return {
                                                  ...res,
                                                  config:needConfigData,
                                                  systemFieldType:0
                                              }
                                          }
                                          return res
                                        })
                                        if (nameFieldData == 'createdAt') {
                                            let ars = data.filter((sc: any) => {
                                                return sc.systemFieldType == 0
                                            })
                                            if (ars.length > 0) {
                                                doAction({
                                                    actionType: "setValue", componentId: "nameField", "args": {
                                                        "value": ars[0].code
                                                    }
                                                });
                                                // nameFieldData = ars[0].code
                                            sessionStorage.setItem('nameFieldData', ars[0].code)
                                            } else {
                                                doAction({
                                                    actionType: "setValue", componentId: "nameField", "args": {
                                                        "value": 'id'
                                                    }
                                                });
                                                // nameFieldData = 'id'
                                            sessionStorage.setItem('nameFieldData', 'id')
                                            }
                                        }
                                        doAction({ actionType: "reload", componentId: "nameField" });
                                        let fieldCrudData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                        let fieldCrudDatas = fieldCrudData.map((res: any) => {
                                            let splitArr = res.columnNames.split(',');
                                            let found = false;
                                            splitArr.forEach((item) => {
                                                if (item === needCreatedAtCode) {
                                                    found = true;
                                                }
                                            });
                                            if (found) {
                                                const filteredArr = splitArr.filter(item => item !== needCreatedAtCode);
                                                return {
                                                    ...res,
                                                    columnNames: filteredArr.join(',')
                                                };
                                            } else {
                                                return res;
                                            }
                                        })
                                        let fieldCrudDatass = fieldCrudDatas.filter((res: any) => {
                                            return res.columnNames != ""
                                        })
                                        let fieldCrudDatasse = fieldCrudDatass.map((res: any, index: number) => {
                                            return { ...res, sort: index + 1,
                                                columnNames:processIndexFields(res.columnNames,data)
                                            }
                                        })
                                        sessionStorage.setItem('keyCrud', JSON.stringify(fieldCrudDatasse))
                                        doAction({
                                            actionType: "setValue", componentId: "keyCrud", "args": {
                                                "value": {
                                                    "items": fieldCrudDatasse
                                                }
                                            }
                                        });
                                    }
                                    systemNext(data,doAction)
                                }
                            },
                              {
                                    "ignoreError": false,
                                    "actionType": "dialog",
                                    "expression": "${event.data.createdAt == true}",
                                    "dialog": {
                                        "id":"createdAtDialog",
                                        "title": "请选择日期时间字段",
                                        "body": [
                                            {
                                                "type": "form",
                                                "title": "表单",
                                                "mode": "flex",
                                                "resetAfterSubmit": true,
                                                "feat": "Insert",
                                                "dsType": "model-entity",
                                                "id":"createdAtForm",
                                                "body": [
                                                    {
                                                        "type": "radios",
                                                        "label": "操作方式",
                                                        "name": "operatingMode",
                                                        "options": [
                                                            {
                                                                "label": "新建字段",
                                                                "value": 0
                                                            },
                                                            {
                                                                "label": "选择现有字段",
                                                                "value": 1
                                                            }
                                                        ],
                                                        "row": 0,
                                                        "optionType": "default",
                                                        "colSize": "1",
                                                        "value": 0
                                                    },
                                                    {
                                                        "visibleOn": "${operatingMode == 1}",
                                                        "type": "select",
                                                        "label": "选择现有字段",
                                                        "name": "createdAtSelect",
                                                        "source": "${ss:cuTimeList}",
                                                        "labelField":"code",
                                                        "valueField":"code",
                                                        "multiple": false,
                                                        "required": true,
                                                        validations: {
                                                            selectFiled: true
                                                        },
                                                    },
                                                    {
                                                        "type": "input-text",
                                                        "label": "字段名",
                                                        "name": "createdAtCode",
                                                        "required": true,
                                                        "value": "createdAt",
                                                        "clearable": true,
                                                        "visibleOn": "${operatingMode == 0}",
                                                        validations: {
                                                            matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                                            isCreatedAt: true
                                                        },
                                                        validationErrors: {
                                                            matchRegexp: '请填写规范字段名'
                                                        },
                                                    },
                                                    {
                                                        visibleOn: "(operatingMode == 0)",
                                                        label: '显示名称',
                                                        required: true,
                                                        type: 'input-text',
                                                        placeholder: '字段展示的名称，可以是中文',
                                                        name: 'createdAtName',
                                                        id: 'createdAtName',
                                                        value: "创建时间",
                                                        validations: {
                                                            isSameCreatedAtName: true
                                                        },
                                                    }
                                                ],
                                                "actions": [],
                                                "labelAlign": "top"
                                            }
                                        ],
                                        "onEvent": {
                                            "cancel": {
                                                "weight": 0,
                                                "actions": [
                                                    {
                                                        "actionType": "custom",
                                                        script: function(_: any, doAction: any, event: any) {
                                                            doAction({
                                                                actionType: "setValue", componentName: "createdAt", "args": {
                                                                    "value": false
                                                                }
                                                            });
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "actions": [
                                            {
                                                "type": "button",
                                                "actionType": "cancel",
                                                "label": "取消",
                                                "onEvent": {
                                                    "click": {
                                                        "actions": [
                                                            {
                                                                "actionType": "custom",
                                                                script: function(_: any, doAction: any, event: any) {
                                                                    doAction({
                                                                        actionType: "setValue", componentName: "createdAt", "args": {
                                                                            "value": false
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                "type": "button",
                                                "actionType": "confirm",
                                                "label": "确定",
                                                "primary": true,
                                                "close":false,
                                                "onEvent": {
                                                    "click": {
                                                        "actions": [
                                                            {
                                                                "actionType": "custom",
                                                                script: function(_: any, doAction: any, event: any) {
                                                                    doAction({
                                                                        actionType: 'validate',
                                                                        componentId: 'createdAtForm',
                                                                        outputVar: 'validateResult'
                                                                    });
                                                                    setTimeout(()=>{
                                                                        console.log(event,'校验结果')
                                                                        let data:any = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                        let haveCreatedAtCode = []
                                                                        haveCreatedAtCode = data.filter((res: any) => {
                                                                            return res.systemFieldType == 4
                                                                        })
                                                                        let createdAtCodeName = 'createdAt'
                                                                        if (haveCreatedAtCode.length > 0) {
                                                                            createdAtCodeName = haveCreatedAtCode[0].code
                                                                        }
                                                                        if(event.data.validateResult.error == ''){
                                                                            if(haveCreatedAtCode.length == 0){
                                                                                if(event.data.validateResult.payload.operatingMode == 0){
                                                                                    data.push({
                                                                                        type: 'datetime',
                                                                                        systemFieldType: 4,
                                                                                        tableKey: event.data.queryKey,
                                                                                        code: event.data.validateResult.payload.createdAtCode,
                                                                                        name: event.data.validateResult.payload.createdAtName,
                                                                                        foreignKeyFlag: false,
                                                                                        nullable: false,
                                                                                        defaultValueMode: 'static',
                                                                                        defaultValue: '0001-01-01 00:00:00',
                                                                                        sort: 1,
                                                                                        needId: uuid.v4(),
                                                                                        config:{
                                                                                            "precisionCompatible": false,
                                                                                            "precision": 0,
                                                                                            "showPrecision": 0,
                                                                                            "defaultValue": "0001-01-01 00:00:00",
                                                                                            "defaultValueMode": "static",
                                                                                            "dbType":"DATETIME"
                                                                                        }
                                                                                    })
                                                                                    createdAtCodeName = event.data.validateResult.payload.createdAtCode
                                                                                }else{
                                                                                    data = data.map((res: any) => {
                                                                                        if(res.code == event.data.validateResult.payload.createdAtSelect){
                                                                                            createdAtCodeName = res.code
                                                                                            return {
                                                                                                ...res,
                                                                                                systemFieldType:4,
                                                                                            }
                                                                                        }
                                                                                        return res
                                                                                    })
                                                                                }
                                                                            }
                                                                            next(createdAtCodeName,data,doAction,"createdAtDialog",false)
                                                                        }
                                                                    },10)
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }, {
                    "label": "删除标志",
                    "type": "switch",
                    // "value": true,
                    "value": "${useSoftDelete}",
                    "disabled": true,
                    "visibleOn": '${useSoftDelete}',
                    "name": "deleted",
                }]
            },
            {
                "label": "记录更新时间",
                "type": "switch",
                "name": "updatedAt",
                // "name": "updateTime",
                "value": false,
                "onEvent": {
                    "change": {
                        "actions": [
                          {
                            "actionType": "custom",
                            script: function (_: any, doAction: any, event: any) {
                                console.log(_, '__')
                                console.log(doAction, 'doActiondoAction')
                                console.log(event, 'eventevent')
                                let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                let needUpdatedAtCode = data.find((res: any) => res.systemFieldType === 5)?.code || 'updatedAt';
                                // let data = JSON.parse(getCookie('fieldCrud'))
                                if (event.data.updatedAt) {
                                    // let haveUpdatedAt = data.filter((res: any) => res.systemFieldType == 5)
                                    // let haveSameUpdatedAt = data.filter((res: any) => res.code == 'updatedAt')
                                    // if(haveUpdatedAt.length==0) {
                                    //     if(haveSameUpdatedAt.length==0){
                                    //         data.push({
                                    //             type: 'datetime',
                                    //             systemFieldType: 5,
                                    //             // systemFieldType: 'UPDATE_DATE',
                                    //             tableKey: event.data.queryKey,
                                    //             code: 'updatedAt',
                                    //             name: '更新时间', foreignKeyFlag: false,
                                    //             nullable: false,
                                    //             defaultValueMode: 'static',
                                    //             defaultValue: '0001-01-01 00:00:00',
                                    //             sort: 1
                                    //         })
                                    //     }else{
                                    //         setTimeout(()=>{
                                    //             doAction({
                                    //                 actionType: "setValue",
                                    //                 componentName: "updatedAt",
                                    //                 "args": {
                                    //                     "value": false
                                    //                 }
                                    //             });
                                    //         },10)
                                    //         toast.error('已存在相同字段名updatedAt，请修改');
                                    //     }
                                    // }
                                } else {
                                    let nameFieldData = sessionStorage.getItem('nameFieldData')
                                    data = data.map((res: any) => {
                                      if(res.code == needUpdatedAtCode){
                                          let needConfigData = {}
                                          if('config' in res && res.config){
                                              needConfigData = res.config
                                              if(!('allowInput' in res.config)){
                                                  needConfigData.allowInput = true
                                              }
                                              if(!('nullable' in res.config)){
                                                  needConfigData.nullable = true
                                              }
                                          }else{
                                              needConfigData = {
                                                  dbType: 'DATETIME',
                                                  defaultValue:"2020-01-01 00:00:00",
                                                  defaultValueMode:"static",
                                                  allowInput:true,
                                                  nullable:true
                                              }
                                          }
                                          return {
                                              ...res,
                                              config:needConfigData,
                                              systemFieldType:0
                                          }
                                      }
                                      return res
                                    })
                                    if (nameFieldData == needUpdatedAtCode) {
                                        let ars = data.filter((sc: any) => {
                                            return sc.systemFieldType == 0
                                        })
                                        if (ars.length > 0) {
                                            doAction({
                                                actionType: "setValue", componentId: "nameField", "args": {
                                                    "value": ars[0].code
                                                }
                                            });
                                            // nameFieldData = ars[0].code
                                            sessionStorage.setItem('nameFieldData', ars[0].code)
                                        } else {
                                            doAction({
                                                actionType: "setValue", componentId: "nameField", "args": {
                                                    "value": 'id'
                                                }
                                            });
                                            // nameFieldData = 'id'
                                            sessionStorage.setItem('nameFieldData', 'id')
                                        }
                                    }
                                    doAction({ actionType: "reload", componentId: "nameField" });
                                    let fieldCrudData = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                    let fieldCrudDatas = fieldCrudData.map((res: any) => {
                                        let splitArr = res.columnNames.split(',');
                                        let found = false;
                                        splitArr.forEach((item) => {
                                            if (item === needUpdatedAtCode) {
                                                found = true;
                                            }
                                        });
                                        if (found) {
                                            const filteredArr = splitArr.filter(item => item !== needUpdatedAtCode);
                                            return {
                                                ...res,
                                                columnNames: filteredArr.join(',')
                                            };
                                        } else {
                                            return res;
                                        }
                                    })
                                    let fieldCrudDatass = fieldCrudDatas.filter((res: any) => {
                                        return res.columnNames != ""
                                    })
                                    let fieldCrudDatasse = fieldCrudDatass.map((res: any, index: number) => {
                                        return { ...res, sort: index + 1,
                                            columnNames:processIndexFields(res.columnNames,data)
                                        }
                                    })
                                    sessionStorage.setItem('keyCrud', JSON.stringify(fieldCrudDatasse))
                                    doAction({
                                        actionType: "setValue", componentId: "keyCrud", "args": {
                                            "value": {
                                                "items": fieldCrudDatasse
                                            }
                                        }
                                    });
                                }
                                systemNext(data,doAction)
                            }
                        },
                          {
                                "ignoreError": false,
                                "actionType": "dialog",
                                "expression": "${event.data.updatedAt == true}",
                                "dialog": {
                                    "id":"updatedAtDialog",
                                    "title": "请选择日期时间字段",
                                    "body": [
                                        {
                                            "type": "form",
                                            "title": "表单",
                                            "mode": "flex",
                                            "resetAfterSubmit": true,
                                            "feat": "Insert",
                                            "dsType": "model-entity",
                                            "id":"updatedAtForm",
                                            "body": [
                                                {
                                                    "type": "radios",
                                                    "label": "操作方式",
                                                    "name": "operatingMode",
                                                    "options": [
                                                        {
                                                            "label": "新建字段",
                                                            "value": 0
                                                        },
                                                        {
                                                            "label": "选择现有字段",
                                                            "value": 1
                                                        }
                                                    ],
                                                    "row": 0,
                                                    "optionType": "default",
                                                    "colSize": "1",
                                                    "value": 0
                                                },
                                                {
                                                    "visibleOn": "${operatingMode == 1}",
                                                    "type": "select",
                                                    "label": "选择现有字段",
                                                    "name": "updatedAtSelect",
                                                    "source": "${ss:cuTimeList}",
                                                    "labelField":"code",
                                                    "valueField":"code",
                                                    "multiple": false,
                                                    "required": true,
                                                    validations: {
                                                        selectFiled: true
                                                    },
                                                },
                                                {
                                                    "type": "input-text",
                                                    "label": "字段名",
                                                    "name": "updatedAtCode",
                                                    "required": true,
                                                    "value": "updatedAt",
                                                    "clearable": true,
                                                    "visibleOn": "${operatingMode == 0}",
                                                    validations: {
                                                        matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                                        isUpdatedAt: true
                                                    },
                                                    validationErrors: {
                                                        matchRegexp: '请填写规范字段名'
                                                    },
                                                },
                                                {
                                                    visibleOn: "(operatingMode == 0)",
                                                    label: '显示名称',
                                                    required: true,
                                                    type: 'input-text',
                                                    placeholder: '字段展示的名称，可以是中文',
                                                    name: 'updatedAtName',
                                                    id: 'updatedAtName',
                                                    value: "更新时间",
                                                    validations: {
                                                        isSameUpdatedAtName: true
                                                    },
                                                }
                                            ],
                                            "actions": [],
                                            "labelAlign": "top"
                                        }
                                    ],
                                    "onEvent": {
                                        "cancel": {
                                            "weight": 0,
                                            "actions": [
                                                {
                                                    "actionType": "custom",
                                                    script: function(_: any, doAction: any, event: any) {
                                                        doAction({
                                                            actionType: "setValue", componentName: "updatedAt", "args": {
                                                                "value": false
                                                            }
                                                        });
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    "actions": [
                                        {
                                            "type": "button",
                                            "actionType": "cancel",
                                            "label": "取消",
                                            "onEvent": {
                                                "click": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            script: function(_: any, doAction: any, event: any) {
                                                                doAction({
                                                                    actionType: "setValue", componentName: "updatedAt", "args": {
                                                                        "value": false
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            "type": "button",
                                            "actionType": "confirm",
                                            "label": "确定",
                                            "primary": true,
                                            "close":false,
                                            "onEvent": {
                                                "click": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            script: function(_: any, doAction: any, event: any) {
                                                                doAction({
                                                                    actionType: 'validate',
                                                                    componentId: 'updatedAtForm',
                                                                    outputVar: 'validateResult'
                                                                });
                                                                setTimeout(()=>{
                                                                    console.log(event,'校验结果')
                                                                    let data:any = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                    let updatedAtName = data.find((res: any) => res.systemFieldType === 5)?.code || 'updatedAt';
                                                                    if(event.data.validateResult.error == ''){
                                                                            if(event.data.validateResult.payload.operatingMode == 0){
                                                                                data.push({
                                                                                    type: 'datetime',
                                                                                    systemFieldType: 5,
                                                                                    tableKey: event.data.queryKey,
                                                                                    code: event.data.validateResult.payload.updatedAtCode,
                                                                                    name: event.data.validateResult.payload.updatedAtName,
                                                                                    foreignKeyFlag: false,
                                                                                    nullable: false,
                                                                                    defaultValueMode: 'static',
                                                                                    defaultValue: '0001-01-01 00:00:00',
                                                                                    sort: 1,
                                                                                    needId: uuid.v4(),
                                                                                    config:{
                                                                                        "precisionCompatible": false,
                                                                                        "precision": 0,
                                                                                        "showPrecision": 0,
                                                                                        "defaultValue": "0001-01-01 00:00:00",
                                                                                        "defaultValueMode": "static",
                                                                                        "dbType":"DATETIME"
                                                                                    }
                                                                                })
                                                                                updatedAtName = event.data.validateResult.payload.updatedAtCode
                                                                            }else{
                                                                                data = data.map((res: any) => {
                                                                                    if(res.code == event.data.validateResult.payload.updatedAtSelect){
                                                                                        updatedAtName = res.code
                                                                                        return {
                                                                                            ...res,
                                                                                            systemFieldType: 5,
                                                                                        }
                                                                                    }
                                                                                    return res
                                                                                })
                                                                            }
                                                                        next(updatedAtName,data,doAction,"updatedAtDialog",false)
                                                                    }
                                                                },10)
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            },
        ]
    }
}
