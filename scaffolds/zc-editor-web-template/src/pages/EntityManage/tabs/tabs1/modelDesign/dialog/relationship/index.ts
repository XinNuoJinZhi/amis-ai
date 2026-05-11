import {getColumnSelect, getExternalList, getTablesFields} from '@/api/entitymanage';
import {addRule} from 'amis';
import * as uuid from 'uuid';
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import { getTableData, getTableList } from "@/api/entitymanage";
import { processIndexFields } from '@/utils';
import { checkAndRenameField } from  './util'
export default (
  middleData: any,
  fanData: any,
  relationNullable: any,
  inverseData: any,
  inverseJoinColumnCodes: any,
  inverseJoinColumnKeys: any,
  refTable: any,
  refTables1: any,
  refTableType: any
) => {
  let haveWail = false;
  let allTable:any = []
  let joinTableExpand:any = {
    joinTableInfo:{},
    joinColumnInfo: {},
    inverseJoinColumnInfo:{}
  }
  let isChange:any = false
  return {
    title: '关系设置',
    tab: [
      {
        name: 'affectCrud',
        id: 'affectCrud',
        type: 'crud',
        autoFillHeight: 500,
        syncLocation: false,
        columnsTogglable: false,
        alwaysShowPagination: false,
        footerToolbar: [],
        source: '$relations',
        headerToolbar: [
          {
            type: 'action',
            actionType: 'drawer',
            label: '添加',
            level: 'primary',
            onEvent: {
              click: {
                actions: [
                  {
                    actionType: 'custom',
                    script: function (_: any, doAction: any, event: any) {
                      console.log(_,'_')
                      console.log(doAction,'doAction')
                      console.log(event,'event')
                      joinTableExpand = {
                        joinTableInfo:{},
                        joinColumnInfo: {},
                        inverseJoinColumnInfo:{}
                      }
                      addRule(
                        // 校验名
                        'foreignKeyValid',
                        // 校验函数，values 是表单里所有表单项的值，可用于做联合校验；value 是当前表单项的值
                        (values, value) => {
                          let sameName = false;
                          let sameNames = false;
                          let sameNamess = false;
                          let haveSameName = false;
                          let haveSameNames = false;
                          let sameKey = false;
                          console.log(values, '11111111111');
                          console.log(value, '2222222222');
                          let data = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                          let haveContentCode = []
                          haveContentCode = data.filter((res: any) => {
                            return res.systemFieldType == 9
                          })
                          let tenantCodeName = 'tenantCode'
                          if (haveContentCode.length > 0) {
                            tenantCodeName = haveContentCode[0].code
                          }
                          let haveTreeParent = []
                          haveTreeParent = data.filter((res: any) => {
                            return res.type == 'parent'
                          })
                          let treeParentName = 'parentId'
                          if (haveTreeParent.length > 0) {
                            treeParentName = haveTreeParent[0].code
                          }
                          data.forEach((res: any) => {
                            if (
                              res.code == values.names &&
                              values.determineType != 'choice'
                            ) {
                              sameName = true;
                            }
                            if (
                              res.name.toUpperCase() == value.toUpperCase() &&
                              values.determineType != 'choice'
                            ) {
                              haveSameName = true;
                            }
                            if (
                              value.toUpperCase() == 'ID' ||
                              value.toUpperCase() == '删除时间' ||
                              value.toUpperCase() == '删除标志' ||
                              value.toUpperCase() == '删除人' ||
                              value.toUpperCase() == '更新时间' ||
                              value.toUpperCase() == '创建时间' ||
                              value.toUpperCase() == '更新人' ||
                              value.toUpperCase() == '创建人' ||
                              value.toUpperCase() == '父级节点'
                            ) {
                              haveSameNames = true;
                            }
                          });
                          let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                          data1.forEach((res: any) => {
                            if (res.code == values.names) {
                              sameNames = true;
                            }
                          });
                          if (
                            value.toUpperCase() == 'ID' ||
                            value.toUpperCase() == treeParentName.toUpperCase() ||
                            value.toUpperCase() == tenantCodeName.toUpperCase() ||
                            value.toUpperCase() == 'CREATEDAT' ||
                            value.toUpperCase() == 'UPDATEDAT' ||
                            value.toUpperCase() == 'CREATEDBY' ||
                            value.toUpperCase() == 'UPDATEBY' ||
                            value.toUpperCase() == 'DELETEDBY' ||
                            value.toUpperCase() == 'DELETEDAT' ||
                            value.toUpperCase() == 'DELETED'
                          ) {
                            sameNamess = true;
                          }
                          if (
                            values.names.toUpperCase() ==
                              values.codes.toUpperCase() &&
                            values.determineType != 'choice'
                          ) {
                            sameKey = true;
                          }
                          if (sameName) {
                            return {
                              error: true,
                              msg: '字段集合列表字段重复'
                            };
                          } else if (sameNames) {
                            return {
                              error: true,
                              msg: '关系设置列表字段重复'
                            };
                          } else if (sameNamess) {
                            return {
                              error: true,
                              msg: '字段名不能和系统字段同名，请换个名字。'
                            };
                          } else if (haveSameName) {
                            return {
                              error: true,
                              msg: '字段集合名称重复'
                            };
                          } else if (haveSameNames) {
                            return {
                              error: true,
                              msg: '不能与系统字段同名'
                            };
                          } else if (sameKey) {
                            return {
                              error: true,
                              msg: '关系key不能与外键字段名相同'
                            };
                          } else {
                            return true;
                          }
                        }
                      );
                      addRule(
                        // 校验名
                        'relationKeyValid',
                        // 校验函数，values 是表单里所有表单项的值，可用于做联合校验；value 是当前表单项的值
                        (values, value) => {
                          middleData.editName = true
                          let sameName = false;
                          let sameNames = false;
                          // let sameKey = false
                          console.log(values, '11111111111');
                          console.log(value, '2222222222');
                          let data = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                          data.forEach((res: any) => {
                            if (res.code == values.codes) {
                              sameName = true;
                            }
                          });
                          let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                          data1.forEach((res: any) => {
                            if (res.code == values.codes) {
                              sameNames = true;
                            }
                          });
                          // if(values.names.toUpperCase() == values.codes.toUpperCase()){
                          //     sameKey = true
                          // }
                          if (sameNames) {
                            return {
                              error: true,
                              msg: '关系设置列表字段重复'
                            };
                          } else if (sameName) {
                            return {
                              error: true,
                              msg: '字段集合列表字段重复'
                            };
                          }
                          //  else if (sameKey) {
                          //     return {
                          //         error: true,
                          //         msg: '外键字段名不能与关系key相同'
                          //     };
                          // }
                          else {
                            middleData.editName = false
                            return true;
                          }
                        }
                      );
                      addRule(
                        // 校验名
                        'isMiddTa',
                        // 校验函数，values 是表单里所有表单项的值，可用于做联合校验；value 是当前表单项的值
                        (values, value) => {
                          // let sameName = false;
                          let sameNames = false;
                          console.log(values, '11111111111');
                          console.log(value, '2222222222');
                          let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                          data1.forEach((res: any) => {
                            if (res.joinTableCode == values.joinTableCode) {
                              sameNames = true;
                            }
                          });
                          if (sameNames) {
                            return {
                              error: true,
                              msg: '中间表名重复'
                            };
                          } else {
                            return true;
                          }
                        }
                      );
                      addRule(
                        // 校验名
                        'isSelectMiddTa',
                        // 校验函数，values 是表单里所有表单项的值，可用于做联合校验；value 是当前表单项的值
                        (values, value) => {
                          let sameNames = false;
                          console.log(values, '11111111111');
                          console.log(value, '2222222222');
                          let data = JSON.parse(sessionStorage.getItem('targetList')!);
                          console.log(data,'data1')
                          let allIsNull:any = []
                          let cunIsNull:any = []
                          allIsNull = data.filter(res=>{
                            return !res.isNullable
                          })
                          cunIsNull = allIsNull.filter((res: any) => {
                            if (values.joinColumnCode == res.key) {
                              return res
                            }
                            if (values.inverseJoinColumnCode == res.key) {
                              return res
                            }
                          });
                          console.log(allIsNull,'allIsNull')
                          console.log(cunIsNull,'cunIsNull')
                          function hasExtraFields(groupA, groupB) {
                            const keysA = new Set(groupA.map(item => item.key));
                            const keysB = new Set(groupB.map(item => item.key));
                            for (let key of keysA) {
                              if (!keysB.has(key)) {
                                return true;
                              }
                            }
                            return false;
                          }
                          if(hasExtraFields(allIsNull,cunIsNull) && !values.withCustomProps){
                          // if(allIsNull.length != cunIsNull.length && !values.withCustomProps){
                            sameNames = true
                          }
                          if (sameNames) {
                            return {
                              error: true,
                              msg: '该表存在必填字段，必须打开可自定义属性'
                              // msg: '该表存在非外键的必填字段，必须打开可自定义属性'
                            };
                          } else {
                            return true;
                          }
                        }
                      );
                      addRule('targetKeyValidations', (values, value) => {
                        middleData.editCode = true
                        // let sameName = false;
                        let sameNames = false;
                        let sameNamess = false;
                        console.log(values, 'targetKeyValidations values');
                        console.log(value, 'targetKeyValidations value');
                        let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                        let haveSameTable = data1.filter((res: any) => {
                          return (
                            Number(res.relationMode) == 0 &&
                            res.targetName == refTable
                          );
                        });
                        if (haveSameTable.length > 0) {
                          sameNames = true;
                        }
                        let haveSama = data1.filter((res: any) => {
                          return (
                            Number(values.relationType) == 0 &&
                            res.targetName == refTable
                          );
                        });
                        if (haveSama.length > 0) {
                          sameNamess = true;
                        }
                        // let haveSama = data1.filter((res: any) => {
                        //   return res.targetName == refTable;
                        // });
                        // if (haveSama.length > 0) {
                        //   sameNamess = true;
                        // }
                        // console.log(haveSama, 'haveSamahaveSamahaveSama');
                        if (sameNames) {
                          return {
                            error: true,
                            msg: '目标表已存在一对一关系，请选择其他目标表'
                          };
                        } else if (sameNamess) {
                          return {
                            error: true,
                            msg: '已存在其他关系不能建立「一对一」关系'
                            // msg: '目标表已存在关系，请选择其他目标表'
                          };
                        } else {
                          middleData.editCode = false
                          return true;
                        }
                      });
                      let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                      let waiList: any[] = [];
                      fieldData.forEach((res: any) => {
                        if (!res.foreignKeyFlag && res.systemFieldType == 0) {
                          if (res.type == 'text' && res.config.length >= 20) {
                            // return res
                            waiList.push({
                              ...res,
                              label: res.code,
                              value: res.code
                            });
                          } else if (
                            res.type == 'int' &&
                            res.config.dbType == 'BIGINT'
                          ) {
                            // return res
                            waiList.push({
                              ...res,
                              label: res.code,
                              value: res.code
                            });
                          }
                        }
                      });
                      sessionStorage.setItem('waiList',JSON.stringify(waiList));
                      let watTableList: any[] = [];
                      console.log(event.data.entityModel,'event.data.entityModel');
                      if(event.data.entityModel){
                        event.data.entityModel.forEach((res: any) => {
                          if(res.code != event.data.code){
                            watTableList.push({
                              ...res,
                              label: res.code,
                              value: res.code
                            });
                          }
                        });
                      }else{
                        const params = new URLSearchParams(window.location.search);
                        const dsKey = params.get('dsKey');
                        getTableList(dsKey).then(res=>{
                          console.log(res,'resresres')
                          if(res.data.code==0){
                            allTable = res.data.data
                            res.data.data.forEach((res: any) => {
                              if(res.code != event.data.code){
                                watTableList.push({
                                  ...res,
                                  label: res.code,
                                  value: res.code
                                });
                              }
                            });
                          }
                        }).catch(e => {
                          watTableList = []
                        });
                      }
                      sessionStorage.setItem('watTableList',JSON.stringify(watTableList));
                      sessionStorage.setItem('externalList',JSON.stringify([]))
                      sessionStorage.setItem('associationFileList',JSON.stringify([]))
                      sessionStorage.setItem('assFileList',JSON.stringify([]))
                      sessionStorage.setItem('targetList',JSON.stringify([]))
                    }
                  }
                ]
              }
            },
            drawer: {
              resizable: true,
              position: 'left',
              actions: [],
              width: 380,
              title: '在模型[$code]中新增关系',
              body: {
                type: 'wizard',
                mode: 'simple',
                nextAutoLoading:true,
                steps: [
                  {
                    title: '选择类型',
                    body: [
                      {
                        name: 'relationType',
                        id: 'relationType',
                        label: '关系',
                        type: 'radios',
                        required: true,
                        inline: false,
                        value: '1',
                        // "value": "MORE_ONE",
                        // "onEvent": {
                        //     "change": {
                        //         "actions": [
                        //             {
                        //                 "actionType": "setValue",
                        //                 "componentId": "fieldType",
                        //                 "args": {
                        //                     "value": ""
                        //                 }
                        //             },
                        //             {
                        //                 "actionType": "setValue",
                        //                 "componentId": "advanced",
                        //                 "args": {
                        //                     "value": ""
                        //                 }
                        //             },
                        //         ]
                        //     }
                        // },
                        options: [
                          {
                            label: '一对一',
                            value: '0',
                            // "value": "ONE_ONE",
                            // "value": "1:1",
                            // "value": "one",
                            description:
                              '当前模型一条数据仅对应目标模型一条数据。比如[用户]与[资料]之间的关系。关系字段将创建在当前模型上。'
                          },
                          {
                            label: '一对多',
                            value: '2',
                            // "value": "ONE_MORE",
                            // "value": "1:n",
                            // "value": "one_more",
                            description:
                              '当前模型一条数据对应目标模型多条数据，可以理解为拥有关系，比如[作者]拥有很多[文章]。关系字段将在当前模型中创建。'
                          },
                          {
                            label: '多对一',
                            value: '1',
                            // "value": "MORE_ONE",
                            // "value": "n:1",
                            // "value": "more_one",
                            description:
                              '当前模型多条数据对应目标模型一条数据，可以理解为属于关系，比如多篇[文章]属于同一个[作者]。关系字段将在目标模型中创建。'
                          },
                          {
                            label: '多对多',
                            value: '3',
                            // "value": "MORE_MORE",
                            // "value": "n:n",
                            // "value": "more_more",
                            description:
                              '当前模型一条数据可以对应多条目标模型数据，同时目标模型一条数据也可以对应多条当前模板数据。比如[文章]和[标签]之间的关系，一篇文章可以有多个标签，同时一个标签可以关联多篇文章。'
                          }
                        ]
                      }
                    ]
                  },
                  {
                    name: 'affectForm',
                    id: 'affectForm',
                    title: '字段信息',
                    mode: 'horizontal',
                    type: 'form',
                    canAccessSuperData: false,
                    // wrapWithPanel: false,
                    horizontal: {
                      leftFixed: 'sm'
                    },
                    body: [
                      {
                        visibleOn: "(this.relationType != '')",
                        label: '实体目标',
                        // "label": "目标模型",
                        // "name": "refTableKey",
                        id: 'targetKey',
                        name: 'targetKey',
                        // "name": "tableKey",
                        type: 'select',
                        source:
                          useDevBaseUrl('/entitymanage/table/getTableSelect?dsKey=${dsKey}&excludeTableKey=${queryKey}'),
                        required: true,
                        validations: {
                          targetKeyValidations: true
                        },
                        validateApi: {
                          url: useDevBaseUrl("/entitymanage/table/checkRelation?tableKey=${queryKey}&targetTableKey=${targetKey}&isForward=${relationType == '0' ? !joinColumnAtTarget : true}&type=${relationType == '0' ? 0 : relationType == '1' ? 1 : relationType == '2' ? 2 : relationType == '3' ? 3 : 0}"),
                          method: 'get',
                          dataType: 'json',
                          requestAdaptor: '',
                          adaptor: function (
                            payload: any,
                            response: any,
                            api: any
                          ) {
                            console.log(payload, 'payloadpayload实体目标');
                            console.log(response, 'responseresponse');
                            console.log(api, 'apiapi');
                            return payload;
                          }
                        },
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (_: any,doAction: any,event: any) {
                                  console.log(event, 'eventeventevent');
                                  let dsKey = event.data.dsKey;
                                  getExternalList({
                                    tableKey: event.data.queryKey,
                                    targetTableKey: event.data.value,
                                    relationMode: event.data.relationType,
                                    autoCreate: event.data.relationType == '0' && !!event.data.joinColumnAtTarget ? true : event.data.relationType == '2' ? true : false,
                                  }).then((res: any) => {
                                    // getExternalList({ tableKey: dsKey, targetTableKey: event.data.value }).then((res:any) => {
                                    console.log(res, '11111111111111');
                                    for (var i = 0;i < res.data.data.length;i++) {
                                      if (res.data.data[i].relationMode == 0) {
                                        res.data.data[i].code =
                                          res.data.data[i].code + '(1:1)';
                                      }
                                      if (res.data.data[i].relationMode == 1) {
                                        res.data.data[i].code =
                                          res.data.data[i].code + '(n:1)';
                                      }
                                      if (res.data.data[i].relationMode == 2) {
                                        res.data.data[i].code =
                                          res.data.data[i].code + '(1:n)';
                                      }
                                      if (res.data.data[i].relationMode == 3) {
                                        res.data.data[i].code =
                                          res.data.data[i].code + '(n:n)';
                                      }
                                    }
                                    let externalListArr = []
                                    externalListArr = res.data.data
                                    if((event.data.relationType == '0' && event.data.joinColumnAtTarget) || event.data.relationType == '2'){
                                      if(externalListArr.length==0){
                                        externalListArr.unshift({
                                          "tableKey": null,
                                          "name": null,
                                          "nullable": true,
                                          "cascadeRemove": null,
                                          "relationMode": null,
                                          "code": "自动创建",
                                          "description": null,
                                          "joinTableKey": null,
                                          "joinTableCode": null,
                                          "joinColumnKey": null,
                                          "joinColumnCode": null,
                                          "inverseJoinColumnKey": null,
                                          "inverseJoinColumnCode": null,
                                          "targetKey": null,
                                          "fieldKey": null,
                                          "foreignKeyCode": null,
                                          "foreignKeyKey": "0",
                                          "joinColumnAtTarget": null,
                                          "inverseSideKey": null,
                                          "withCustomProps": null,
                                          "sort": null,
                                          "config": null,
                                          "appId": null,
                                          "env": null,
                                          "ver": null,
                                          "latest": null,
                                          "queryKey": "0",
                                          "id": null,
                                          "createTime": null,
                                          "targetName": null,
                                          "targetCode": null,
                                          "targetType": null,
                                          "determineType": null,
                                          "joinTableExpand": null
                                        })
                                      }
                                    }
                                    sessionStorage.setItem('externalList',JSON.stringify(externalListArr));
                                    if(event.data.relationType === '2'){
                                        doAction({
                                          actionType: 'hidden',
                                          componentId: 'inverseSideKeys'
                                        });
                                      setTimeout(() => {
                                        doAction({
                                          actionType: 'show',
                                          componentId: 'inverseSideKeys'
                                        });
                                      }, 100);
                                    }
                                  });
                                  getTableData(event.data.selectedItems.value).then((res: any) => {
                                    console.log(res,'resresresres')
                                    sessionStorage.setItem('targetFieldList',JSON.stringify(res.data.data.fields));
                                  })
                                  refTables1 = event.data.selectedItems.extra;
                                  // refTable = event.data.selectedItems.value
                                  refTable = event.data.selectedItems.label;
                                  refTableType = event.data.selectedItems.primaryType;
                                  let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                  let waiList = fieldData.map((res: any) => {
                                    if(event.data.selectedItems.primaryType == 'int'){
                                      if (!res.foreignKeyFlag) {
                                        if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                          return {
                                            ...res,
                                            label: res.code,
                                            value: res.code
                                          };
                                        } else if (
                                          res.type == 'int' &&
                                          res.systemFieldType == 0 &&
                                          res.config.dbType == 'BIGINT'
                                        ) {
                                          return {
                                            ...res,
                                            label: res.code,
                                            value: res.code
                                          };
                                        }
                                      }
                                    }else{
                                      if (
                                        res.type ==
                                        event.data.selectedItems.primaryType
                                        && !res.foreignKeyFlag
                                      ) {
                                        if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                                          return {
                                            ...res,
                                            label: res.code,
                                            value: res.code
                                          };
                                        } else if (
                                          res.type == 'int' &&
                                          res.systemFieldType == 0 &&
                                          res.config.dbType == 'BIGINT'
                                        ) {
                                          return {
                                            ...res,
                                            label: res.code,
                                            value: res.code
                                          };
                                        }
                                      }
                                    }
                                  });
                                  sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                  if (event.data.determineType == 'create') {
                                    let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                    let needField = `${event.data.selectedItems.extra}Id`
                                    let aaaa = checkAndRenameField(fieldData,needField,'code')
                                    let bbbb = checkAndRenameField(fieldData,aaaa,'name')
                                    let cccc = checkAndRenameField(data1,bbbb,'code')
                                    if(aaaa == bbbb == cccc){
                                      needField = aaaa
                                    }else{
                                      needField = cccc
                                    }
                                    console.log(needField,'needFieldneedFieldneedFieldneedField')
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'nameId',
                                      args: {
                                        value:needField
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'joinColum',
                                      args: {
                                        value: '${code}Id'
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'inverseJoinColumn',
                                      args: {
                                        value:
                                          '${event.data.selectedItems.extra}Id'
                                      }
                                    });
                                  } else {
                                    let watTableList: any[] = [];
                                    if(event.data.entityModel){
                                    event.data.entityModel.forEach((res: any) => {
                                      if(res.code != event.data.code && res.queryKey != event.data.value){
                                        watTableList.push({
                                          ...res,
                                          label: res.code,
                                          value: res.code
                                        });
                                      }
                                    });
                                  }else{
                                    allTable.forEach((res: any) => {
                                      if(res.code != event.data.code && res.queryKey != event.data.value){
                                        watTableList.push({
                                          ...res,
                                          label: res.code,
                                          value: res.code
                                        });
                                      }
                                    });
                                  }
                                    sessionStorage.setItem('watTableList',JSON.stringify(watTableList));
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'nameId',
                                      args: {
                                        value: ''
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'joinColum',
                                      args: {
                                        value: ''
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'inverseJoinColumn',
                                      args: {
                                        value: ''
                                      }
                                    });
                                  sessionStorage.setItem('associationFileList',JSON.stringify([]))
                                  sessionStorage.setItem('assFileList',JSON.stringify([]))
                                  sessionStorage.setItem('targetList',JSON.stringify([]))
                                  }
                                  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                  let haveSamaData:any = []
                                  data1.forEach((res: any) => {
                                    if (res.code == (event.data.__super.__super.relationType=='3'||event.data.__super.__super.relationType=='2')?(event.data.selectedItems.extra+'s'):(event.data.selectedItems.extra)
                                    && res.relationMode == event.data.__super.__super.relationType) {
                                      haveSamaData.push(res)
                                    }
                                  });
                                  console.log(haveSamaData,'haveSamaData')
                                  let needField:string = ''
                                  if(event.data.__super.__super.relationType=='3' || event.data.__super.__super.relationType=='2'){
                                    needField = event.data.selectedItems.extra+'s'
                                  }else{
                                    needField = event.data.selectedItems.extra
                                  }
                                  let aaaa = checkAndRenameField(fieldData,needField,'code')
                                  let bbbb = checkAndRenameField(data1,needField,'code')
                                  if(aaaa == bbbb){
                                    needField = aaaa
                                  }else{
                                    needField = bbbb
                                  }
                                  console.log(needField,'needField')
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'field',
                                    args: {
                                      value:needField
                                    }
                                  });
                                  if (event.data.determineType == 'create') {
                                    let middenCode:string = event.data.code+'_'+event.data.selectedItems.extra+'_junction'
                                    let data1 = JSON.parse(sessionStorage.getItem('watTableList')!);
                                    middenCode = checkAndRenameField(data1,middenCode,'code')
                                    let data2 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                    middenCode = checkAndRenameField(data2,middenCode,'joinTableCode')
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'joinTableCode',
                                      args: {
                                        value:middenCode
                                      }
                                    });
                                  } else {
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'joinTableCode',
                                      args: {
                                        value:
                                          ''
                                      }
                                    });
                                  }
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'inverseSideKey',
                                    args: {
                                      value: ''
                                    }
                                  });
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'inverseSideKeys',
                                    args: {
                                      value: ''
                                    }
                                  });
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn: "(this.relationType !== '')",
                        required: true,
                        label: '关系key',
                        // "label": "字段名",
                        type: 'input-text',
                        name: 'codes',
                        // "name": "colName",
                        // "name": "correlationField",
                        id: 'field',
                        placeholder: '关系字段名',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                          relationKeyValid: true
                        },
                        validationErrors: {
                          matchRegexp: '请填写规范字段名'
                        }
                      },
                      {
                        visibleOn: "(this.relationType == '0')",
                        // "visibleOn": "(this.relationType == 'ONE_ONE')",
                        // "visibleOn": "(this.relationType == '1:1')",
                        // "label": "关联字段在对方",
                        label: '外键在对方',
                        type: 'switch',
                        value: false,
                        // "name": "belongForTableFlag",
                        // "name": "fieldInOppositeFlag",
                        name: 'joinColumnAtTarget',
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function(_: any, doAction: any, event: any) {
                                  console.log(event, 'event')
                                  if (event.data.value && event.data.targetKey){
                                    getExternalList({
                                      tableKey: event.data.queryKey,
                                      targetTableKey: event.data.targetKey,
                                      relationMode: event.data.relationType,
                                      autoCreate: event.data.relationType == '0' && !!event.data.joinColumnAtTarget ? true : event.data.relationType == '2' ? true : false,
                                    }).then((res: any) => {
                                      for (
                                        var i = 0;
                                        i < res.data.data.length;
                                        i++
                                      ) {
                                        if (res.data.data[i].relationMode == 0) {
                                          res.data.data[i].code =
                                            res.data.data[i].code + '(1:1)';
                                        }
                                        if (res.data.data[i].relationMode == 1) {
                                          res.data.data[i].code =
                                            res.data.data[i].code + '(n:1)';
                                        }
                                        if (res.data.data[i].relationMode == 2) {
                                          res.data.data[i].code =
                                            res.data.data[i].code + '(1:n)';
                                        }
                                        if (res.data.data[i].relationMode == 3) {
                                          res.data.data[i].code =
                                            res.data.data[i].code + '(n:n)';
                                        }
                                      }
                                      let externalListArr = []
                                      externalListArr = res.data.data
                                      if((event.data.relationType == '0' || event.data.relationType == '2') && event.data.joinColumnAtTarget){
                                        if(externalListArr.length==0){
                                          externalListArr.unshift({
                                            "tableKey": null,
                                            "name": null,
                                            "nullable": true,
                                            "cascadeRemove": null,
                                            "relationMode": null,
                                            "code": "自动创建",
                                            "description": null,
                                            "joinTableKey": null,
                                            "joinTableCode": null,
                                            "joinColumnKey": null,
                                            "joinColumnCode": null,
                                            "inverseJoinColumnKey": null,
                                            "inverseJoinColumnCode": null,
                                            "targetKey": null,
                                            "fieldKey": null,
                                            "foreignKeyCode": null,
                                            "foreignKeyKey": "0",
                                            "joinColumnAtTarget": null,
                                            "inverseSideKey": null,
                                            "withCustomProps": null,
                                            "sort": null,
                                            "config": null,
                                            "appId": null,
                                            "env": null,
                                            "ver": null,
                                            "latest": null,
                                            "queryKey": "0",
                                            "id": null,
                                            "createTime": null,
                                            "targetName": null,
                                            "targetCode": null,
                                            "targetType": null,
                                            "determineType": null,
                                            "joinTableExpand": null
                                          })
                                        }
                                      }
                                      sessionStorage.setItem('externalList',JSON.stringify(externalListArr));
                                    });
                                  }
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn:
                          "(this.joinColumnAtTarget || this.relationType == '3') && this.joinColumnAtTarget && this.relationType != '2'",
                        // "visibleOn": "(this.joinColumnAtTarget || this.relationType == 'MORE_MORE') && this.joinColumnAtTarget",
                        // "visibleOn": "(this.fieldInOppositeFlag || this.relationType == '1:n' || this.relationType == 'n:n')",
                        label: '反向关系',
                        type: 'select',
                        required: true,
                        name: 'inverseSideKey',
                        id: 'inverseSideKey',
                        labelField: 'code',
                        // "valueField": "code",
                        // "labelField": "name",
                        valueField: 'queryKey',
                        desc: "如果没有反向关系，请先点选目标模型创建关系，${(relationType == '0' ? '此时依赖一个反向的一对一，且指定了外键的关系' : relationType == '2' ? '此时依赖一个反向的多对一关系' : relationType == '3' ? '此时依赖一个反向的多对多，且包含中间表信息的关系' : '')}",
                        source: '${ss:externalList}',
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (
                                  _: any,
                                  doAction: any,
                                  event: any
                                ) {
                                  console.log(event, 'event1111111111');
                                  fanData = event.data.selectedItems;
                                  relationNullable = event.data.selectedItems.nullable;
                                  inverseData = event.data.selectedItems.withCustomProps;
                                  if(event.data.selectedItems.foreignKeyKey == '0'){
                                    inverseJoinColumnCodes = event.data.code+'Id'
                                  }else{
                                  inverseJoinColumnCodes = event.data.selectedItems.inverseJoinColumnCode == null
                                      ? event.data.selectedItems.foreignKeyCode : event.data.selectedItems.inverseJoinColumnCode;
                                  }
                                  console.log(event.data.relationType,'event.data.relationType')
                                  if(event.data.relationType == '3'){
                                  inverseJoinColumnKeys = event.data.selectedItems.inverseJoinColumnKey == null
                                      ? undefined : event.data.selectedItems.inverseJoinColumnKey;
                                  }else{
                                    console.log('进入',event.data.selectedItems.foreignkeykey)
                                    inverseJoinColumnKeys = event.data.selectedItems.foreignKeyKey
                                  }
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn: "this.relationType == '2'",
                        // "visibleOn": "this.relationType == 'ONE_MORE'",
                        label: '反向关系',
                        type: 'select',
                        required: true,
                        name: 'inverseSideKey',
                        id: 'inverseSideKeys',
                        labelField: 'code',
                        // "valueField": "code",
                        // "labelField": "name",
                        valueField: 'queryKey',
                        desc: '如果没有反向关系，请先点选目标模型创建关系，此时依赖一个反向的多对一关系',
                        source: '${ss:externalList}',
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (
                                  _: any,
                                  doAction: any,
                                  event: any
                                ) {
                                  console.log(event, 'event1111111111');
                                  relationNullable = event.data.selectedItems.nullable;
                                  if(event.data.selectedItems.foreignKeyKey == '0'){
                                    inverseJoinColumnCodes = event.data.code + 'Id'
                                  }else{
                                    inverseJoinColumnCodes = event.data.selectedItems.foreignKeyCode;
                                  }

                                  inverseJoinColumnKeys = event.data.selectedItems.foreignKeyKey;
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        // "visibleOn": "((this.relationType == '0' || this.relationType == '1') && !this.joinColumnAtTarget)",
                        visibleOn:
                          "(this.relationType == '0' && !this.joinColumnAtTarget) || this.relationType == '1'",
                        name: 'determineType',
                        id: 'determineType',
                        label: '外键类型',
                        type: 'radios',
                        value: 'create',
                        options: [
                          {
                            label: '新建外键字段',
                            value: 'create'
                          },
                          {
                            label: '选择现有字段',
                            value: 'choice'
                          }
                        ],
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (
                                  _: any,
                                  doAction: any,
                                  event: any
                                ) {
                                  if (event.data.value == 'choice') {
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'nameId',
                                      args: {
                                        value: ''
                                      }
                                    });
                                  } else {
                                    console.log(
                                      refTables1,
                                      'refTables1refTables1'
                                    );
                                    if (refTables1 && refTables1 != '') {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameId',
                                        args: {
                                          value: refTables1 + 'Id'
                                        }
                                      });
                                    }
                                  }
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn:
                          "((this.relationType == '0' || this.relationType == '1') && !this.joinColumnAtTarget && this.determineType == 'create')",
                        // "visibleOn": "((this.relationType == 'ONE_ONE' || this.relationType == 'MORE_ONE') && !this.joinColumnAtTarget)",
                        // "visibleOn": "((this.relationType == '1:1' || this.relationType == 'n:1') && !this.joinColumnAtTarget)",
                        // "visibleOn": "((this.relationType == '1:1' || this.relationType == 'n:1') && !this.fieldInOppositeFlag)",
                        required: true,
                        label: '外键字段名',
                        type: 'input-text',
                        name: 'names',
                        id: 'nameId',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                          foreignKeyValid: true
                        },
                        validationErrors: {
                          matchRegexp: '请填写规范字段名'
                        }
                      },
                      {
                        required: true,
                        label: '外键字段名',
                        visibleOn:
                          "((this.relationType == '0' || this.relationType == '1') && !this.joinColumnAtTarget && this.determineType == 'choice')",
                        name: 'names',
                        id: 'nameId',
                        type: 'select',
                        desc:'只允许单行文本且长度大于等于20或长整型类型的字段才允许设置(所选外键应与实体目标表主键类型一致)',
                        source: '${ss:waiList}',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                          foreignKeyValid: true
                        },
                        validationErrors: {
                          matchRegexp: '请选择拥有规范字段名'
                        }
                      },
                      {
                        visibleOn:
                          "(this.relationType == '0' || this.relationType == '1') && !this.joinColumnAtTarget && this.determineType!='choice'",
                        // "visibleOn": "(this.relationType == 'ONE_ONE' || this.relationType == 'MORE_ONE') && !this.joinColumnAtTarget",
                        // "visibleOn": "(this.relationType == '1:1' || this.relationType == 'n:1') && !this.joinColumnAtTarget",
                        // "visibleOn": "(this.relationType == '1:1' || this.relationType == 'n:1') && !this.fieldInOppositeFlag",
                        type: 'switch',
                        label: '允许空值',
                        value: true,
                        name: 'nullable'
                        // "name": "allowNullFlag",
                      },
                      {
                        visibleOn: "this.relationType == '3'",
                        // "visibleOn": "this.relationType == 'MORE_MORE'",
                        // "visibleOn": "this.relationType == 'n:n'",
                        type: 'switch',
                        label: '关联反向关系',
                        value: false,
                        name: 'joinColumnAtTarget',
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (_: any,doAction: any,event: any) {
                                  if(event.data.relationType == 3 && event.data.joinColumnAtTarget){
                                    doAction({
                                      actionType: 'hidden',
                                      componentId: 'joinColum1'
                                    });
                                    doAction({
                                      actionType: 'hidden',
                                      componentId: 'inverseJoinColumn1'
                                    });
                                  }else if(event.data.determineType == 'choice'){
                                    doAction({
                                      actionType: 'show',
                                      componentId: 'joinColum1'
                                    });
                                    doAction({
                                      actionType: 'show',
                                      componentId: 'inverseJoinColumn1'
                                    });
                                  }
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn:"this.relationType == '3' && !this.joinColumnAtTarget",
                        name: 'determineType',
                        label: '中间表类型',
                        type: 'radios',
                        value: 'create',
                        options: [
                          {
                            label: '新建中间表',
                            value: 'create'
                          },
                          {
                            label: '选择现有表',
                            value: 'choice'
                          }
                        ],
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (_: any,doAction: any,event: any) {
                                  console.log(event,'选择中间表')
                                  console.log(allTable,'选择中间表')
                                  if (event.data.selectedItems.value == 'choice') {
                                    doAction({
                                      actionType: 'show',
                                      componentId: 'joinColum1'
                                    });
                                    doAction({
                                      actionType: 'show',
                                      componentId: 'inverseJoinColumn1'
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'joinTableCode',
                                      args: {
                                        value: ''
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'joinColum',
                                      args: {
                                        value: ''
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'inverseJoinColumn',
                                      args: {
                                        value: ''
                                      }
                                    });
                                    let watTableList: any[] = [];
                                    if(event.data.entityModel){
                                      event.data.entityModel.forEach((res: any) => {
                                        if(res.code != event.data.code && res.queryKey != event.data.targetKey){
                                          watTableList.push({
                                            ...res,
                                            label: res.code,
                                            value: res.code
                                          });
                                        }
                                      });
                                    }else{
                                      allTable.forEach((res: any) => {
                                        if(res.code != event.data.code && res.queryKey != event.data.targetKey){
                                          watTableList.push({
                                            ...res,
                                            label: res.code,
                                            value: res.code
                                          });
                                        }
                                      });

                                    }
                                    sessionStorage.setItem('watTableList',JSON.stringify(watTableList));
                                  } else if(event.data.selectedItems.value == 'create') {
                                    joinTableExpand = {
                                      joinTableInfo:{},
                                      joinColumnInfo: {},
                                      inverseJoinColumnInfo:{}
                                    }
                                    console.log(refTables1,'refTables1refTables1');
                                    // if (refTables1 && refTables1 != '') {
                                      doAction({
                                        actionType: 'hidden',
                                        componentId: 'joinColum1'
                                      });
                                      doAction({
                                        actionType: 'hidden',
                                        componentId: 'inverseJoinColumn1'
                                      });
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'inverseJoinColumn',
                                        args: {
                                          value:''
                                        }
                                      });
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'joinColum',
                                        args: {
                                          value: ''
                                        }
                                      });
                                      if(event.data.targetKey){
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'joinTableCode',
                                          args: {
                                            value: '${code}_'+refTables1+'_junction'
                                          }
                                        });
                                        setTimeout(() => {
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'inverseJoinColumn',
                                            args: {
                                              value:
                                                refTables1+'Id'
                                            }
                                          });
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'joinColum',
                                            args: {
                                              value: '${code}Id'
                                            }
                                          });
                                        }, 300);
                                      }
                                    // }
                                  }
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn:
                          "(this.relationType == '3' && !this.joinColumnAtTarget) && this.determineType == 'create'",
                        // "visibleOn": "this.relationType == 'MORE_MORE'",
                        // "visibleOn": "this.relationType == 'MORE_MORE' && !this.withCustomProps",
                        required: true,
                        label: '中间表名',
                        type: 'input-text',
                        name: 'joinTableCode',
                        // "name": "joinTableCode.key",
                        id: 'joinTableCode',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                          isMiddTa: true
                        },
                        validationErrors: {
                          matchRegexp: '请填写规范字段名'
                        },
                        validateApi: {
                          url: useDevBaseUrl('/entitymanage/table/validateMiddleTable?dsKey=${dsKey}&tableCode=${joinTableCode}'),
                          method: 'get',
                          dataType: 'json',
                          requestAdaptor: '',
                          messages: {
                            failed: '表名在实体模型或数据库中存在，请修改'
                          },
                          adaptor: function (
                            payload: any,
                            response: any,
                            api: any
                          ) {
                            console.log(payload, 'payloadpayload1');
                            console.log(response, 'responseresponse');
                            console.log(api, 'apiapi');
                            if (payload.code != 0) {
                              middleData.joinTableCode = true;
                            return {...payload,
                              data:null,
                              errors:payload.errors,
                              status:422
                            };
                            }else{
                              middleData.joinTableCode = false;
                            return payload;
                            }
                          }
                        }
                      },
                      {
                        visibleOn:
                          "(this.relationType == '3' && !this.joinColumnAtTarget) && this.determineType == 'create'",
                        // "visibleOn": "this.relationType == 'MORE_MORE'",
                        // "visibleOn": "this.relationType == 'MORE_MORE' && !this.withCustomProps",
                        required: true,
                        label: '关联本身字段名',
                        type: 'input-text',
                        name: 'joinColumnCode',
                        // "name": "joinTableCode.joinColum.key",
                        id: 'joinColum',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$'
                        },
                        validationErrors: {
                          matchRegexp: '请填写规范字段名',
                          idJoin: true
                        },
                        validateApi: {
                          url: useDevBaseUrl('/entitymanage/table/validateMiddleTable?dsKey=${dsKey}&joinColumnCode=${joinColumnCode}&inverseJoinColumnCode=${inverseJoinColumnCode}'),
                          method: 'get',
                          dataType: 'json',
                          requestAdaptor: '',
                          // "messages": {
                          //     "failed": "关联本身字段名不能与关联目标字段名相同，请修改"
                          // },
                          adaptor: function (
                            payload: any,
                            response: any,
                            api: any
                          ) {
                            console.log(
                              payload,
                              '关联本身字段名payloadpayload'
                            );
                            console.log(response, 'responseresponse');
                            console.log(api, 'apiapi');
                            if (payload.code != 0) {
                              middleData.joinColumnCode = true;
                              return {...payload,
                                data:null,
                                errors:payload.errors,
                                status:422
                              };
                            }else{
                              middleData.joinColumnCode = false;
                              return payload;
                            }
                          }
                        }
                        // "name": "codeBody"
                      },
                      {
                        visibleOn:
                          "(this.relationType == '3' && !this.joinColumnAtTarget) && this.determineType == 'create'",
                        // "visibleOn": "this.relationType == 'MORE_MORE'",
                        // "visibleOn": "this.relationType == 'MORE_MORE' && !this.withCustomProps",
                        required: true,
                        label: '关联目标字段名',
                        type: 'input-text',
                        id: 'inverseJoinColumn',
                        // "name": "joinTableCode.inverseJoinColumn.key",
                        // "value":"${refTable+'Id'}",
                        name: 'inverseJoinColumnCode',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                          idJoins: true
                        },
                        validationErrors: {
                          matchRegexp: '请填写规范字段名'
                        },
                        validateApi: {
                          url: useDevBaseUrl('/entitymanage/table/validateMiddleTable?dsKey=${dsKey}&joinColumnCode=${joinColumnCode}&inverseJoinColumnCode=${inverseJoinColumnCode}'),
                          method: 'get',
                          dataType: 'json',
                          requestAdaptor: '',
                          // "messages": {
                          //     "failed": "关联目标字段名不能与本身字段名相同，请修改"
                          // },
                          adaptor: function (
                            payload: any,
                            response: any,
                            api: any
                          ) {
                            console.log(
                              payload,
                              '关联目标字段名payloadpayload'
                            );
                            console.log(response, 'responseresponse');
                            console.log(api, 'apiapi');
                            if (payload.code != 0) {
                              middleData.inverseJoinColumnCode = true;
                              return {...payload,
                                data:null,
                                errors:payload.errors,
                                status:422
                              };
                            }else{
                              middleData.inverseJoinColumnCode = false;
                              return payload;
                            }
                          }
                        }
                      },
                      {
                        visibleOn:
                          "(this.relationType == '3' && !this.joinColumnAtTarget) && this.determineType == 'choice'",
                        required: true,
                        label: '中间表名',
                        type: 'select',
                        name: 'joinTableCode',
                        id: 'joinTableCode',
                        source: '${ss:watTableList}',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                          isSelectMiddTa: true
                        },
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (_: any,doAction: any,event: any) {
                                  console.log(_,'_')
                                  console.log(doAction,'doAction')
                                  console.log(event,'event')
                                  joinTableExpand.joinTableInfo = event.data.selectedItems
                                  getTablesFields(event.data.selectedItems.dsId?event.data.selectedItems.dsId:event.data.selectedItems.dsKey,event.data.selectedItems.queryKey).then((res: any) => {
                                    console.log(res,'ssssssssssssssss')
                                    if(res.data.code == 0){
                                      let fieldArr:any = []
                                      res.data.data.forEach(fieRes=>{
                                        if(!fieRes.isForeignKey){
                                          if(refTableType == 'int'){
                                            if(fieRes.type == 'text' && fieRes.length >= 20 && !fieRes.isPrimaryKey){
                                              fieldArr.push({
                                                ...fieRes,
                                                label:fieRes.name,
                                                value:fieRes.key,
                                                disabled:false,
                                                isNullable:fieRes.isNullable
                                              })
                                            }
                                            if(fieRes.type == 'int' && fieRes.dbType == "BIGINT" && !fieRes.isPrimaryKey){
                                              fieldArr.push({
                                                ...fieRes,
                                                label:fieRes.name,
                                                value:fieRes.key,
                                                disabled:false,
                                                isNullable:fieRes.isNullable
                                              })
                                            }
                                          }else{
                                            if(fieRes.type == refTableType){
                                              if(fieRes.type == 'text' && fieRes.length >= 20 && !fieRes.isPrimaryKey){
                                                fieldArr.push({
                                                  ...fieRes,
                                                  label:fieRes.name,
                                                  value:fieRes.key,
                                                  disabled:false,
                                                  isNullable:fieRes.isNullable
                                                })
                                              }
                                              if(fieRes.type == 'int' && fieRes.dbType == "BIGINT" && !fieRes.isPrimaryKey){
                                                fieldArr.push({
                                                  ...fieRes,
                                                  label:fieRes.name,
                                                  value:fieRes.key,
                                                  disabled:false,
                                                  isNullable:fieRes.isNullable
                                                })
                                              }
                                          }
                                          }
                                        }
                                      })
                                        fieldArr = fieldArr.filter(resw=>{
                                            return !resw.isTenantCode
                                        })
                                      console.log(fieldArr,'获取符合的数据')
                                      sessionStorage.setItem(
                                        'targetList',
                                        JSON.stringify(res.data.data.filter(res=>{
                                          return !res.isPrimaryKey
                                          // !res.isForeignKey
                                          // && !res.isCreateDate
                                          // && !res.isCreateUser
                                          // && !res.isDeleteDate
                                          // && !res.isDeleteFlag
                                          // && !res.isDeleteUser
                                          // && !res.isUpdateUser
                                          // && !res.isUpdateDate
                                          // && !res.isPrimaryKey
                                          // && !res.isTenantCode
                                        }))
                                      );
                                      sessionStorage.setItem('assFileList',JSON.stringify(fieldArr));
                                      sessionStorage.setItem('associationFileList',JSON.stringify(fieldArr));
                                      doAction({
                                        actionType: 'hidden',
                                        componentId: 'joinColum1'
                                      });
                                      doAction({
                                        actionType: 'hidden',
                                        componentId: 'inverseJoinColumn1'
                                      });
                                      doAction({
                                        actionType: 'show',
                                        componentId: 'joinColum1'
                                      });
                                      doAction({
                                        actionType: 'show',
                                        componentId: 'inverseJoinColumn1'
                                      });
                                      setTimeout(() => {
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'joinColum1',
                                          args: {
                                            value:''
                                          }
                                        });
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'inverseJoinColumn1',
                                          args: {
                                            value:''
                                          }
                                        });
                                      }, 1000);
                                    }
                                  })
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn:
                          "(this.relationType == '3' && !this.joinColumnAtTarget)  && this.determineType == 'choice'",
                        required: true,
                        label: '关联本身字段名',
                        type: 'select',
                        source: '${ss:assFileList}',
                        name: 'joinColumnCode',
                        id: 'joinColum1',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$'
                        },
                        validationErrors: {
                          matchRegexp: '请填写规范字段名',
                          idJoin: true
                        },
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (_: any,doAction: any,event: any) {
                                  console.log(event,'选择本身字段名')
                                  joinTableExpand.joinColumnInfo = event.data.selectedItems
                                  let fieldData = JSON.parse(sessionStorage.getItem('associationFileList'));
                                  let newArr = fieldData.map(res=>{
                                    let mapRes = {...res,disabled:false}
                                    if(res.value == event.data.selectedItems.value){
                                      mapRes.disabled=true
                                    }
                                    return mapRes
                                  })
                                  sessionStorage.setItem('associationFileList',JSON.stringify(newArr))
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn:
                          "(this.relationType == '3' && !this.joinColumnAtTarget) && this.determineType == 'choice'",
                        required: true,
                        label: '关联目标字段名',
                        type: 'select',
                        source: '${ss:associationFileList}',
                        id: 'inverseJoinColumn1',
                        name: 'inverseJoinColumnCode',
                        validations: {
                          matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                          idJoins: true
                        },
                        validationErrors: {
                          matchRegexp: '请填写规范字段名'
                        },
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (_: any,doAction: any,event: any) {
                                  console.log(event,'选择目标字段名')
                                  joinTableExpand.inverseJoinColumnInfo = event.data.selectedItems
                                  let fieldData = JSON.parse(sessionStorage.getItem('assFileList'));
                                  let newArr = fieldData.map(res=>{
                                    let mapRes = {...res,disabled:false}
                                    if(res.value == event.data.selectedItems.value){
                                      mapRes.disabled=true
                                    }
                                    return mapRes
                                  })
                                  sessionStorage.setItem('assFileList',JSON.stringify(newArr))
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn: "(this.relationType == '')",
                        label: '显示名称',
                        type: 'input-text',
                        placeholder: '字段展示的名称，可以是中文',
                        name: 'fieldDesc'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'float' && this.nullable == false ) || ( this.nullable == false && this.fieldType== 'money') || ( this.nullable == false && this.fieldType =='int') || ( this.nullable == false && this.fieldType =='bigint')",
                        // "visibleOn": "(this.fieldType == 'float' && this.allowNullFlag == false ) || ( this.allowNullFlag == false && this.fieldType== 'money') || ( this.allowNullFlag == false && this.fieldType =='int') || ( this.allowNullFlag == false && this.fieldType =='bigint')",
                        label: '默认值',
                        type: 'input-number',
                        big: true,
                        mode: 'horizontal',
                        name: 'defaultValue'
                      },
                      {
                        // 日期和时间
                        // "visibleOn": "(this.fieldType == 'date' && this.storageType== 'dateTime') "
                      },
                      // {
                      // "visibleOn": "(this.advanced == 'address' || this.advanced == 'formula')",
                      //     "label": "描述",
                      //     "type": "textarea",
                      //     "mode": "horizontal",
                      //     "desc": "字段底部显示的描述信息",
                      //     "name": "describe"
                      // },
                      {
                        visibleOn: "(this.advanced =='formula')",
                        label: '公式',
                        title: '条件添加',
                        required: true,
                        type: 'input-formula',
                        name: 'formula',
                        evalMode: true,
                        value: 'IF(${fields[0].id})',
                        // "variables": "${fields}"
                        variables: '${ss:formulaData}'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='attachment' || this.fieldType =='image')",
                        label: '对象存储',
                        // "name": "objectStorage",
                        name: 'driver',
                        type: 'select',
                        options: [],
                        desc: '默认不选择将上传到系统配置指定的存储位置'
                      },
                      {
                        visibleOn: "(this.fieldType =='date')",
                        label: '存储类型',
                        type: 'select',
                        name: 'storageType',
                        value: 'dateTime',
                        desc: "${(storageType== 'dateTime' ?'时间日期，包含时期和时间信息，没有时区信息。': storageType== 'datetimer'? '只包含日期信息，不包含时间信息。': storageType== 'timer'? '时间信息，不包含日期，没有时区信息。' :'' )}",
                        options: [
                          {
                            label: '日期时间',
                            value: 'dateTime',
                            description:
                              '时间日期，包含时期和时间信息，没有时区信息。'
                          },
                          {
                            label: '日期',
                            value: 'datetimer',
                            description: '只包含日期信息，不包含时间信息。'
                          },
                          {
                            label: '时间',
                            value: 'timer',
                            description: '时间信息，不包含日期，没有时区信息。'
                          }
                        ]
                      },
                      // 日期范围
                      {
                        visibleOn: "(this.fieldType =='date-range')",
                        label: '存储类型',
                        name: 'storageType',
                        type: 'button-group-select',
                        value: 'dateTime',
                        desc: "${(storageType== 'dateTime' ?'时间日期，包含时期和时间信息，没有时区信息。': storageType== 'datetimer'? '只包含日期信息，不包含时间信息。': storageType== 'timer'? '时间信息，不包含日期，没有时区信息。' :'' )}",
                        options: [
                          {
                            label: '日期时间',
                            value: 'dateTime',
                            description:
                              '时间日期，包含时期和时间信息，没有时区信息。'
                          },
                          {
                            label: '日期',
                            value: 'datetimer',
                            description: '只包含日期信息，不包含时间信息。'
                          },
                          {
                            label: '时间',
                            value: 'timer',
                            description: '时间信息，不包含日期，没有时区信息。'
                          }
                        ]
                      },
                      {
                        // 日期默认值
                        visibleOn:
                          "(this.fieldType =='date' && this.allowNullFlag == false)",
                        label: '默认值',
                        name: 'fiexd',
                        value: 'a',
                        type: 'button-group-select',
                        options: [
                          {
                            label: '固定值',
                            value: 'a'
                          },
                          {
                            label: '相对值',
                            value: 'b'
                          }
                        ]
                      },
                      {
                        visibleOn:
                          "(this.fiexd == 'a' && this.storageType == 'dateTime' && this.fieldType =='date')",
                        label: '',
                        type: 'input-datetime',
                        name: 'defaultValue'
                      },
                      {
                        visibleOn:
                          "(this.fiexd == 'a' && this.storageType == 'datetimer' && this.fieldType =='date')",
                        label: '',
                        type: 'input-date',
                        name: 'defaultValue'
                      },
                      {
                        visibleOn:
                          "(this.fiexd == 'a' && this.storageType == 'timer' && this.fieldType =='date')",
                        label: '',
                        type: 'input-time',
                        name: 'defaultValue'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date-range' && this.allowNullFlag == false && this.storageType == 'dateTime') ",
                        label: '默认值',
                        name: 'defaultValue',
                        type: 'input-datetime-range',
                        format: 'YYYY-MM-DD HH:mm:ss'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date-range' && this.allowNullFlag == false && this.storageType == 'datetimer') ",
                        label: '默认值',
                        name: 'defaultValue',
                        type: 'input-date-range'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date-range' && this.allowNullFlag == false && this.storageType == 'timer') ",
                        label: '默认值',
                        name: 'defaultValue',
                        type: 'input-time-range'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date' && this.storageType == 'datetime') || (this.fieldType =='date-range' && this.storageType == 'datetime')",
                        label: '最小值',
                        type: 'input-datetime',
                        name: 'min'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date' && this.storageType == 'date') || (this.fieldType =='date-range' && this.storageType == 'date')",
                        label: '最小值',
                        type: 'input-date',
                        name: 'min'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date' && this.storageType == 'time') || (this.fieldType =='date-range' && this.storageType == 'time')",
                        label: '最小值',
                        type: 'input-time',
                        name: 'min'
                      },

                      {
                        visibleOn:
                          "(this.fieldType =='date' || this.fieldType == 'date-range')",
                        label: '',
                        type: 'input-text',
                        placeholder: '请输入提示信息'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date'  && this.storageType == 'dateTime') || (this.fieldType =='date-range' && this.storageType == 'dateTime') ",
                        label: '最大值',
                        type: 'input-datetime',
                        name: 'max'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date'  && this.storageType == 'datetimer') || (this.fieldType =='date-range' && this.storageType == 'datetimer')",
                        label: '最大值',
                        type: 'input-date',
                        name: 'max'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date'  && this.storageType == 'timer') || (this.fieldType =='date-range' && this.storageType == 'timer')",
                        label: '最大值',
                        type: 'input-time',
                        name: 'max'
                      },
                      {
                        visibleOn:
                          "(this.fieldType =='date' || this.fieldType == 'date-range')",
                        label: '',
                        type: 'input-text',
                        placeholder: '请输入提示信息'
                      },
                      {
                        visibleOn:
                          "(this.allowNullFlag == false  && this.fieldType == 'boolean')",
                        label: '默认值',
                        type: 'switch',
                        name: 'defaultValue',
                        onText: 'TRUE',
                        offText: 'FALSE',
                        trueValue: 'true',
                        falseValue: 'false'
                      },
                      {
                        visibleOn: "(this.fieldType == 'enum')",
                        type: 'select',
                        label: '选项值',
                        name: 'options',
                        options: [
                          {
                            label: '自定义选项',
                            value: 'custom'
                          },
                          {
                            label: '数据字典',
                            value: 'dictionaries'
                          }
                        ]
                      },
                      {
                        visibleOn:
                          "this.fieldType == 'enum' && this.options == 'custom'",
                        name: 'addOptions',
                        type: 'input-array',
                        draggable: true,
                        addButtonText: '新增选项',
                        items: {
                          type: 'combo',
                          name: 'combination',
                          label: false,
                          items: [
                            {
                              name: 'label',
                              label: false,
                              type: 'input-text',
                              placeholder: '文本'
                            },
                            {
                              name: 'value',
                              label: false,
                              type: 'input-text',
                              placeholder: '数值'
                            }
                          ]
                        }
                      },
                      {
                        label: '默认值',
                        type: 'input-text',
                        visibleOn:
                          "(this.allowNullFlag == false && this.fieldType == 'text' )",
                        name: 'defaultValue'
                      },
                      {
                        visibleOn:
                          "(this.allowNullFlag == false && this.fieldType =='rich-text' ) || (this.allowNullFlag == false && this.fieldType =='textarea' ) ",
                        label: '默认值',
                        type: 'textarea',
                        name: 'defaultValue'
                      },
                      {
                        visibleOn: "(this.advanced == 'password')",
                        label: '加盐',
                        type: 'input-text',
                        name: 'salt',
                        desc: '数据存储使用MD5加密算法，盐值混合内容方式为：{盐}.{文本}，然后将哈希值的字节数组转换为十六进制字符串，用于内容的加密和解码。'
                      },
                      {
                        visibleOn: "(this.advanced == 'ciphertext')",
                        label: '密钥',
                        placeholder: '请输入密钥',
                        type: 'input-text',
                        name: 'secretKey',
                        required: true,
                        desc: '数据存储使用aes-256-cbc加密算法;64位密钥基于输入的文本，使用SHA-256算法生成，用于内容的加密和解码。'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'text' || this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType == 'money'  || this.advanced == 'password' || this.advanced == 'ciphertext'  )",
                        type: 'switch',
                        label: '是否唯一',
                        value: false,
                        name: 'unique'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'rich-text' || this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType == 'float' || this.fieldType == 'money' || this.fieldType == 'enum' || this.fieldType == 'boolean' || this.fieldType == 'date' || this.fieldType == 'dataTime' || this.advanced == 'password')",
                        type: 'switch',
                        label: '是否可搜',
                        value: true,
                        name: 'enableSearch'
                      },

                      {
                        visibleOn:
                          "(this.advanced == 'address' || this.advanced == 'position' )",
                        type: 'switch',
                        label: '记录城市',
                        value: false,
                        name: 'cityRecord'
                      },
                      {
                        visibleOn: "(this.advanced == 'position')",
                        type: 'switch',
                        label: '采用geometry',
                        disabled: true,
                        value: false,
                        name: 'geometry',
                        desc: '目前还不支持Gemometry类型，后续db安装相应插件在启用。'
                      },
                      {
                        visibleOn: "(this.advanced == 'position')",
                        type: 'select',
                        label: '地图类型',
                        value: 'baiduMap',
                        name: 'map',
                        options: [
                          {
                            label: '百度地图',
                            value: 'baiduMap'
                          },
                          {
                            label: '腾讯地图',
                            value: 'tengxunMap',
                            disabled: true
                          },
                          {
                            label: '高德地图',
                            value: 'gaodeMap',
                            disabled: true
                          }
                        ]
                      },
                      {
                        visibleOn: "(this.advanced == 'address')",
                        type: 'switch',
                        label: '记录地区',
                        value: true,
                        name: 'areaRecord'
                      },
                      {
                        visibleOn: "(this.advanced == 'address')",
                        type: 'switch',
                        label: '记录街道',
                        value: false,
                        name: 'streetRecord'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'user' || this.fieldType == 'department' || this.fieldType == 'owner') && (this.requiredFlag)",
                        // "visibleOn": "(this.fieldType == 'user' || this.fieldType == 'department' || this.fieldType == 'owner') && (this.requiredFlag == false)",
                        type: 'select',
                        label: '默认值',
                        value: 'a',
                        name: 'defaultValue',
                        options: [
                          {
                            label: '当前用户',
                            value: 'a'
                          }
                          // {
                          //     "label": "B",
                          //     "value": "b"
                          // },
                        ]
                      },
                      {
                        visibleOn: "(this.fieldType == 'image')",
                        type: 'button-group-select',
                        label: '图片比率',
                        value: '',
                        clearable: true,
                        name: 'PictureRatio',
                        source: {
                          method: 'get',
                          url: useAdminBaseUrl('/system/dict-data/list?dictType=restrictRatio&status=0'),
                          adaptor: function (payload: any) {
                            return {
                              ...payload,
                              status: payload.code,
                              data: {...payload.data, options: payload.data}
                            };
                          }
                        }
                        // "options": [
                        //     {
                        //         "label": "4:3",
                        //         "value": "4:3"
                        //     },
                        //     {
                        //         "label": "16:9",
                        //         "value": "16:9"
                        //     },
                        //     {
                        //         "label": "1:1",
                        //         "value": "1:1"
                        //     },
                        //     {
                        //         "label": "其他",
                        //         "value": "other"
                        //     }
                        // ]
                      },
                      {
                        visibleOn: "PictureRatio == 'other'",
                        label: '',
                        type: 'input-text',
                        name: 'defaultValue',
                        placeholder: '请输入长宽比',
                        step: 1e-10
                      },
                      // {
                      //   "label": "允许格式",
                      //   "mode": "horizontal",
                      //   "horizontal": {
                      //     "leftFixed": "sm"
                      //   },
                      // },
                      {
                        visibleOn: "(this.fieldType == 'image')",
                        type: 'input-text',
                        label: '最大图片',
                        value: 'MB',
                        name: 'maxSize'
                      },
                      {
                        visibleOn: "(this.fieldType == 'attachment')",
                        type: 'input-text',
                        label: '允许的格式',
                        desc: '请填写允许文件的MIME-TYPE，多个类型用逗号隔开',
                        name: 'attFormat'
                      },
                      {
                        visibleOn: "(this.fieldType == 'image')",
                        type: 'input-text',
                        label: '允许的格式',
                        name: 'picFormat'
                      },
                      {
                        visibleOn: "(this.fieldType == 'user')",
                        type: 'switch',
                        label: '允许输入',
                        name: 'enableInput',
                        desc: '是否允许输入，如果不允许则意味着会自动填写',
                        value: true
                      },
                      {
                        visibleOn: "(this.fieldType == 'attachment')",
                        type: 'input-text',
                        label: '最大附件',
                        value: 'MB',
                        name: 'maxSize'
                      },
                      // {
                      //     "hidden": true,
                      //     "type": "switch",
                      //     "label": "识别录入",
                      //     "desc": "允许用户通过拍照或者选择图片进行文字识别",
                      //     "value": false,
                      //     "name": "",
                      // },
                      {
                        visibleOn: "(this.fieldType == 'text')",
                        label: '长度',
                        type: 'input-number',
                        big: true,
                        value: '255',
                        name: 'maxLength'
                      },
                      {
                        visibleOn: "(this.fieldType == 'float')",
                        label: '存储规格',
                        type: 'select',
                        name: 'saveNorms',
                        value: 'small',
                        options: [
                          {
                            label: '小数值',
                            value: 'small'
                          },
                          {
                            label: '正常',
                            value: 'normal'
                          },
                          {
                            label: '大数值',
                            value: 'large'
                          }
                        ]
                      },
                      {
                        visibleOn: "(this.fieldType == 'money')",
                        label: '币种',
                        type: 'select',
                        name: 'currency',
                        source: {
                          method: 'get',
                          url: useAdminBaseUrl('/system/dict-data/list?dictType=currency&status=0'),
                          adaptor: function (payload: any) {
                            return {
                              ...payload,
                              status: payload.code,
                              data: {...payload.data, options: payload.data}
                            };
                          }
                        }
                        // "options": [
                        //     {
                        //         "label": "人民币",
                        //         "value": "CNY"
                        //     },
                        // ]
                      },

                      {
                        visibleOn:
                          "(this.fieldType == 'float' && this.saveNorms == 'small')",
                        label: '精度',
                        type: 'input-number',
                        big: true,
                        required: true,
                        name: 'accuracy',
                        desc: '精度是指整个数字里全部位的数目，也就是小数点两边的位数目。显示指定类型精度时的最大允许精度为65',
                        validations: 'matchRegexp:/^([0-9][0-9]{0,1}|65)$/',
                        trimContents: true,
                        validationErrors: {
                          matchRegexp: '最大值为65'
                        }
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'float' && this.saveNorms == 'small')",
                        label: '小数位数',
                        type: 'input-text',
                        required: true,
                        desc: '指小数点后边的位数',
                        name: 'decimal'
                      },
                      {
                        visibleOn: "(this.fieldType == 'textarea')",
                        label: '格式',
                        type: 'select',
                        required: true,
                        name: 'format',
                        source: {
                          method: 'get',
                          url: useAdminBaseUrl('/system/dict-data/list?dictType=formatType&status=0'),
                          adaptor: function (payload: any) {
                            return {
                              ...payload,
                              status: payload.code,
                              data: {...payload.data, options: payload.data}
                            };
                          }
                        }
                        // "options": [
                        //     {
                        //         "label": "普通文本",
                        //         "value": "text"
                        //     },
                        //     {
                        //         "label": "邮箱",
                        //         "value": "email"
                        //     },
                        //     {
                        //         "label": "网址",
                        //         "value": "url"
                        //     },
                        //     {
                        //         "label": "身份证号",
                        //         "value": "number"
                        //     },
                        //     {
                        //         "label": "手机号",
                        //         "value": "phone"
                        //     },
                        //     {
                        //         "label": "电话号",
                        //         "value": "telephone"
                        //     }, {
                        //         "label": "邮编",
                        //         "value": "postcode"
                        //     },
                        //     {
                        //         "label": "颜色",
                        //         "value": "color"
                        //     },
                        //     {
                        //         "label": "年份",
                        //         "value": "year"
                        //     },
                        // ]
                      },
                      {
                        visibleOn: "(this.fieldType == 'text')",
                        type: 'input-text',
                        placeholder: '请输入提示信息',
                        name: 'formatMessage'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                        label: '最小值',
                        type: 'input-number',
                        big: true,
                        name: 'min'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'text' || this.fieldType =='textarea')",
                        type: 'input-text',
                        mode: 'horizontal',
                        label: '最小长度',
                        name: 'minLength'
                      },
                      {
                        // 单行多行整数浮点的最小提示
                        visibleOn:
                          "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                        type: 'input-text',
                        placeholder: '请输入提示信息',
                        name: 'minLengthMessage'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                        label: '最大值',
                        type: 'input-number',
                        big: true,
                        mode: 'horizontal',
                        name: 'max'
                      },
                      {
                        visibleOn:
                          "(this.fieldType == 'text' || this.fieldType =='textarea')",
                        type: 'input-number',
                        big: true,
                        label: '最大长度',
                        name: 'inputMaxLength'
                      },
                      {
                        // // 单行多行整数浮点的最大提示
                        visibleOn:
                          "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                        type: 'input-text',
                        placeholder: '请输入提示信息',
                        mode: 'horizontal'
                      },
                      {
                        visibleOn: "(this.fieldType == 'text')",
                        type: 'input-text',
                        name: 'regexp',
                        label: '正则校验',
                        options: [
                          {
                            label: '数字 /^[0-9]*$/',
                            value: '/^[0-9]*$/'
                          },
                          {
                            label:
                              '身份证号 /^[1-9]d{5}(?:18|19|20)d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]d|30|31)d{3}[dXx]$/',
                            value:
                              '/^[1-9]d{5}(?:18|19|20)d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]d|30|31)d{3}[dXx]$/'
                          },
                          {
                            label: '小写英文字母组成 /^[a-z]+$/',
                            value: '/^[a-z]+$/'
                          },
                          {
                            label: '大写英文字母 /^[A-Z]+$/',
                            value: '/^[A-Z]+$/'
                          }
                        ]
                      },
                      {
                        visibleOn: "(this.fieldType == 'text' )",
                        type: 'input-text',
                        placeholder: '请输入提示信息',
                        name: 'regexpMessage'
                      },
                      {
                        visibleOn:
                          "this.relationType == '3' && !this.joinColumnAtTarget",
                        // "visibleOn": "this.relationType == 'MORE_MORE'",
                        // "visibleOn": "this.relationType == 'n:n' && this.allowNullFlag==false",
                        label: '可自定义属性',
                        type: 'switch',
                        name: 'withCustomProps',
                        value: false,
                        desc: '除了单纯的关系信息外，如果你想额外的保存一些其他信息比如，关系建立时间、是否为特殊关系等等，请勾选此选项，平台将自动创建关系模型，在创建的关系模型中添加字段即可。',
                        onEvent: {
                          change: {
                            actions: [
                              {
                                actionType: 'custom',
                                script: function (_: any,doAction: any,event: any) {
                                  console.log(event,'event.data.value')
                                  doAction({
                                    actionType: 'setValue',
                                    componentName: 'withCustomProps',
                                    args: {
                                      value: event.data.value
                                    }
                                  });
                                  setTimeout(()=>{
                                    doAction({
                                      actionType: 'validateFormItem',
                                      componentId: 'joinTableCode'
                                    });
                                  },500)
                                }
                              }
                            ]
                          }
                        }
                      },
                      {
                        visibleOn:
                          "(this.relationType == '0' || this.relationType == '2')",
                        // "visibleOn": "(this.relationType == 'ONE_ONE' || this.relationType == 'ONE_MORE')",
                        // "visibleOn": "(this.relationType == '1:1' || this.relationType == '1:n')",
                        label: '级联删除',
                        type: 'switch',
                        name: 'cascadeRemove',
                        // "name": "delCascadeFlag",
                        // "name": "cascadeDelet",
                        value: false,
                        desc: '开启后当前数据删除时级联删除目标关系表中的数据'
                      },
                      {
                        visibleOn: "this.relationType == '2')",
                        // "visibleOn": "this.relationType == 'ONE_MORE')",
                        // "visibleOn": "(this.relationType == '1:1' || this.relationType == '1:n')",
                        label: '级联更新',
                        type: 'switch',
                        name: 'conCascadeFlag',
                        value: false,
                        desc: '开启后当前数据删除时级联删除目标关系表中的数据'
                      }
                    ],
                  }
                ],
                onEvent: {
                  nextFinish: {
                    "weight": 0,
                    "debounce": {
                      "wait": 100
                    },
                    actions: [
                      {
                        actionType: 'custom',
                        script: function (_: any, doAction: any, event: any) {
                          console.log('关系设置添加');
                          console.log(_, '_____');
                          console.log(doAction,'doActiondoAction');
                          console.log(event, 'eventeventeventeventevent');
                            if (middleData.editCode) {
                                 doAction({
                                actionType: 'enabled',
                                componentId: 'affectForm'
                              });
                              return;
                            }
                            if (middleData.editName) {
                                 doAction({
                                actionType: 'enabled',
                                componentId: 'affectForm'
                              });
                              return;
                            }
                            if (middleData.joinTableCode) {
                                 doAction({
                                actionType: 'enabled',
                                componentId: 'affectForm'
                              });
                              return;
                            }
                            if (middleData.joinColumnCode) {
                                 doAction({
                                actionType: 'enabled',
                                componentId: 'affectForm'
                              });
                              return;
                            }
                            if (middleData.inverseJoinColumnCode) {
                                 doAction({
                                actionType: 'enabled',
                                componentId: 'affectForm'
                              });
                              return;
                            }
                          if (!event.data.targetKey) return;
                          let namesTest = /^[a-zA-Z_][A-Za-z0-9_]*$/
                          if(!namesTest.test(event.data.codes)) return
                          if(event.data.relationType === '0' && event.data.joinColumnAtTarget && (event.data.inverseSideKey == '' || !event.data.inverseSideKey)) return
                          // if(!event.data.joinColumnAtTarget || event.data.inverseSideKey != '0'){
                          //   if(!namesTest.test(event.data.names)) return
                          // }
                          if('names' in event.data && !namesTest.test(event.data.names)) return
                          // if (!event.data.tableKey) return
                          let assData = JSON.parse(sessionStorage.getItem('targetList')!);
                          console.log(assData,'assDataassData');
                          if(event.data.relationType == '3' && event.data.determineType=='choice'){
                            let allIsNull:any = []
                            let cunIsNull:any = []
                            allIsNull = assData.filter(res=>{
                              return !res.isNullable
                            })
                            cunIsNull = allIsNull.filter((res: any) => {
                              if (event.data.joinColumnCode == res.key) {
                                return res
                              }
                              if (event.data.inverseJoinColumnCode == res.key) {
                                return res
                              }
                            });
                            console.log(allIsNull,'allIsNull')
                            console.log(cunIsNull,'cunIsNull')
                            function hasExtraFields(groupA, groupB) {
                              const keysA = new Set(groupA.map(item => item.key));
                              const keysB = new Set(groupB.map(item => item.key));
                              for (let key of keysA) {
                                if (!keysB.has(key)) {
                                  return true;
                                }
                              }
                              return false;
                            }
                            if(hasExtraFields(allIsNull,cunIsNull) && !event.data.withCustomProps){
                            // if(allIsNull.length != cunIsNull.length && !event.data.withCustomProps){
                              return
                            }
                          }
                          let needUuid = uuid.v4();
                          let data = JSON.parse(sessionStorage.getItem('affectCrud')!);
                          let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                          if(event.data.inverseSideKey == '0'){
                            let targetFieldData = JSON.parse(sessionStorage.getItem('targetFieldList'))
                            console.log(targetFieldData,'targetFieldData')
                            console.log(inverseJoinColumnCodes,'inverseJoinColumnCodes')
                            let aaaa = checkAndRenameField(targetFieldData,inverseJoinColumnCodes,'code')
                            let bbbb = checkAndRenameField(targetFieldData,inverseJoinColumnCodes,'name')
                            let cccc = checkAndRenameField(data,bbbb,'foreignKeyCode')
                            console.log(aaaa == bbbb,'aaaa == bbbb')
                              if(aaaa == bbbb == cccc){
                                inverseJoinColumnCodes = aaaa
                              }else{
                                inverseJoinColumnCodes = cccc
                              }
                          }
                          // let havadata:boolean = false
                          // data1.forEach(res=>{
                          //   if(res.code == event.data.names){
                          //     havadata = true
                          //   }
                          // })
                          // console.log(havadata,'havadatahavadata')
                          // if(havadata)return
                          console.log(inverseJoinColumnCodes,'inverseJoinColumnCodes');
                          if (event.data.relationType == '3') {
                            // if(event.data.joinTableCode == '' && !event.data.joinColumnAtTarget){return}
                            console.log('多对多');
                            // if (event.data.relationType == 'MORE_MORE') {
                            data.push({
                              joinTableExpand:joinTableExpand,
                              determineType:event.data.determineType,
                              joinTableKey: event.data.joinColumnAtTarget
                                ? fanData.joinTableKey
                                : event.data.joinTableKey,
                              joinColumnKey: event.data.joinColumnAtTarget
                                ? fanData.joinColumnKey
                                : event.data.joinColumnKey,
                              joinTableCode: event.data.joinTableCode,
                              joinColumnCode: event.data.joinColumnCode
                                ? event.data.joinColumnCode
                                : fanData.joinColumnCode,
                              inverseJoinColumnCode: event.data.inverseJoinColumnCode
                                ? event.data.inverseJoinColumnCode
                                : fanData.inverseJoinColumnCode,
                              inverseJoinColumnKey: event.data.joinColumnAtTarget
                                ? fanData.inverseJoinColumnKey
                                : event.data.inverseJoinColumnKey,
                              nullable: event.data.joinColumnAtTarget
                                ? relationNullable
                                : event.data.nullable
                                  ? !event.data.nullable
                                  : true, // 允许空值
                              // forTableName: event.data.modelName,// 目标模型名
                              // forTableKey: event.data.queryKey, // 当前模型
                              name: refTable, // 当前模型
                              // name: event.data.codes, // 当前模型
                              needId: needUuid,
                              joinColumnAtTarget: event.data.joinColumnAtTarget,
                              inverseSideKey: event.data.inverseSideKey,
                              // foreignKey:inverseJoinColumnCodes,
                              tableKey: event.data.tableKey, // 目标模型
                              fieldInOppositeFlag:
                                event.data.fieldInOppositeFlag, // 关联字段在对方
                              code: event.data.codes, // 字段名
                              cascadeRemove: event.data.cascadeRemove
                                ? event.data.cascadeRemove
                                : false, // 级联删除
                              conCascadeFlag: event.data.conCascadeFlag, // 级联更新
                              fkName: event.data.fkName, // 外键
                              withCustomProps: event.data.joinColumnAtTarget
                                ? inverseData
                                : event.data.withCustomProps, // 可自定义属性
                              relationMode: event.data.relationType, // 关系类型
                              fieldItemType: event.data.relationType, // 关系类型
                              targetCode: refTables1, // 父表模型名称
                              targetName: refTable, // 父表模型名称
                              // refTableName: refTable, // 父表模型名称
                              targetKey: event.data.targetKey, // 目标模型
                              // foreignKey: event.data.names,
                              foreignKeyKey: event.data.joinColumnAtTarget
                                ? inverseJoinColumnKeys
                                : undefined,
                              foreignKeyCode: event.data.joinColumnCode
                                ? event.data.joinColumnCode
                                : inverseJoinColumnCodes
                            });
                          } else if (event.data.relationType == '2') {
                            console.log('一对多');
                            console.log(
                              inverseJoinColumnKeys,
                              'inverseJoinColumnKeys'
                            );
                            if(!event.data.inverseSideKey || event.data.inverseSideKey==''){
                              return
                            }
                            data.push({
                              // foreignKey:event.data.inverseSideKey,
                              joinTableCode: event.data.joinTableCode, // 中间表名
                              joinColumnCode: event.data.joinColumnCode, // 关联本身字段名
                              inverseJoinColumnCode:
                                event.data.inverseJoinColumnCode, // 关联目标字段名
                              // forTableName: event.data.modelName,// 目标模型名
                              // forTableKey: event.data.queryKey, // 当前模型
                              name: refTable, // 当前模型
                              // name: event.data.names?event.data.names:event.data.codes, // 当前模型
                              needId: needUuid,
                              joinColumnAtTarget: true,
                              inverseSideKey: event.data.inverseSideKey,
                              // foreignKey:inverseJoinColumnCodes,
                              tableKey: event.data.tableKey, // 目标模型
                              fieldInOppositeFlag:
                                event.data.fieldInOppositeFlag, // 关联字段在对方
                              code: event.data.codes, // 字段名
                              nullable: relationNullable, // 允许空值                                                                                                                    ,// 允许空值
                              // nullable: !event.data.nullable,// 允许空值
                              cascadeRemove: event.data.cascadeRemove, // 级联删除
                              conCascadeFlag: event.data.conCascadeFlag, // 级联更新
                              fkName: event.data.fkName, // 外键
                              withCustomProps: event.data.withCustomProps, // 可自定义属性
                              relationMode: event.data.relationType, // 关系类型
                              fieldItemType: event.data.relationType, // 关系类型
                              targetCode: refTables1, // 父表模型名称
                              targetName: refTable, // 父表模型名称
                              targetKey: event.data.targetKey, // 目标模型
                              foreignKeyKey: inverseJoinColumnKeys,
                              // foreignKeyKey: event.data.joinColumnAtTarget ? inverseJoinColumnKeys : undefined,
                              foreignKeyCode: inverseJoinColumnCodes
                            });
                          } else if (event.data.relationType == '1') {
                            console.log('多对一');
                            let waiD: any = {};
                            data1.forEach((sjw: any) => {
                              if (sjw.code == event.data.names) {
                                waiD = {...sjw};
                              }
                            });
                            console.log(waiD, 'waiD');
                            data.push({
                              // foreignKey:event.data.inverseSideKey,
                              joinTableCode: event.data.joinTableCode, // 中间表名
                              joinColumnCode: event.data.joinColumnCode, // 关联本身字段名
                              inverseJoinColumnCode:
                                event.data.inverseJoinColumnCode, // 关联目标字段名
                              // forTableName: event.data.modelName,// 目标模型名
                              // forTableKey: event.data.queryKey, // 当前模型
                              name: refTable, // 当前模型
                              // name: event.data.names?event.data.names:event.data.codes, // 当前模型
                              needId: needUuid,
                              joinColumnAtTarget: false,
                              inverseSideKey: event.data.inverseSideKey,
                              tableKey: event.data.tableKey, // 目标模型
                              fieldInOppositeFlag:
                                event.data.fieldInOppositeFlag, // 关联字段在对方
                              code: event.data.codes, // 字段名
                              nullable:
                                event.data.determineType == 'create'
                                  ? event.data.nullable
                                  : waiD.nullable, // 允许空值
                              cascadeRemove: event.data.cascadeRemove, // 级联删除
                              conCascadeFlag: event.data.conCascadeFlag, // 级联更新
                              fkName: event.data.fkName, // 外键
                              withCustomProps: event.data.withCustomProps, // 可自定义属性
                              relationMode: event.data.relationType, // 关系类型
                              fieldItemType: event.data.relationType, // 关系类型
                              targetCode: refTables1, // 父表模型名称
                              targetName: refTable, // 父表模型名称
                              targetKey: event.data.targetKey, // 目标模型
                              foreignKeyCode: event.data.joinColumnAtTarget
                                ? inverseJoinColumnCodes
                                : event.data.names
                            });
                          } else {
                            console.log('一对一');
                            let waiD: any = {};
                            data1.forEach((sjw: any) => {
                              if (sjw.code == event.data.names) {
                                waiD = {...sjw};
                              }
                            });
                            console.log(waiD, 'waiD');
                            data.push({
                              // fkModel: {
                              // refTableName:refTable,// 当前模型名
                              // refTableKey: event.data.refTableKey,// 目标模型
                              // belongForTableFlag: event.data.belongForTableFlag,// 关联字段在对方
                              // colName: event.data.colName,// 字段名
                              // keyName: event.data.colName,// 字段名
                              // allowNullFlag: event.data.allowNullFlag,// 允许空值
                              // delCascadeFlag: event.data.delCascadeFlag,// 级联删除
                              // joinTableCode: { ...event.data.joinTableCode },
                              joinTableCode: event.data.joinTableCode, // 中间表名
                              joinColumnCode: event.data.joinColumnCode, // 关联本身字段名
                              inverseJoinColumnCode:
                                event.data.inverseJoinColumnCode, // 关联目标字段名
                              // forTableName: event.data.modelName,// 目标模型名
                              // forTableKey: event.data.queryKey, // 当前模型
                              name: refTable, // 当前模型
                              // name: event.data.names?event.data.names:event.data.codes, // 当前模型
                              needId: needUuid,
                              joinColumnAtTarget: event.data.joinColumnAtTarget,
                              inverseSideKey: event.data.inverseSideKey,
                              // foreignKey:inverseJoinColumnCodes,
                              tableKey: event.data.tableKey, // 目标模型
                              fieldInOppositeFlag:
                                event.data.fieldInOppositeFlag, // 关联字段在对方
                              code: event.data.codes, // 字段名
                              nullable:
                                event.data.determineType == 'create'
                                  ? event.data.joinColumnAtTarget
                                    ? relationNullable
                                    : event.data.nullable
                                  : waiD.nullable, // 允许空值
                              cascadeRemove: event.data.cascadeRemove, // 级联删除
                              conCascadeFlag: event.data.conCascadeFlag, // 级联更新
                              fkName: event.data.fkName, // 外键
                              withCustomProps: event.data.withCustomProps, // 可自定义属性
                              relationMode: event.data.relationType, // 关系类型
                              fieldItemType: event.data.relationType, // 关系类型
                              targetCode: refTables1, // 父表模型名称
                              targetName: refTable, // 父表模型名称
                              // refTableName: refTable, // 父表模型名称
                              targetKey: event.data.targetKey, // 目标模型
                              // foreignKey: event.data.names,
                              foreignKeyKey: event.data.joinColumnAtTarget
                                ? inverseJoinColumnKeys
                                : undefined,
                              foreignKeyCode: event.data.joinColumnAtTarget
                                ? inverseJoinColumnCodes
                                : event.data.names
                              // code: event.data.codeBody // 关联本身字段名
                              // fkKey: event.data.fkKey,// 目标外键
                              // relationType: event.data.relationType,// 关系类型
                              // },
                              // fkInput: {},
                              // fkPrompt: {}
                            });
                          }
                          // 多对多选择可自定义属性后 添加一条多对多和一条一对多数据
                          if (
                            event.data.relationType == '3' &&
                            event.data.withCustomProps &&
                            !event.data.joinColumnAtTarget
                          ) {
                            data.push({
                              relationMode: 2,
                              isNullable: true, //该字段可用于自动生成的一对多的反向关系显示隐藏的判断
                              nullable: true,
                              fieldItemType: 2,
                              code: event.data.joinTableCode + 's',
                              name: event.data.joinTableCode + 's',
                              // targetKey:event.data.joinTableCode,
                              cascadeRemove: event.data.cascadeRemove
                                ? event.data.cascadeRemove
                                : false, // 级联删除
                              targetCode: event.data.joinTableCode,
                              targetName: event.data.joinTableCode,
                              foreignKey: event.data.joinColumnCode,
                              foreignKeyCode: event.data.joinColumnCode
                                ? event.data.joinColumnCode
                                : inverseJoinColumnCodes,
                              needId: needUuid + 1,
                              targetType: 1,
                              needHaveId:true
                            });
                          }
                          data.forEach((element: any, index: number) => {
                            element['sort'] = index + 1;
                          });
                          console.log(data, 'sssss');
                          sessionStorage.setItem('affectCrud',JSON.stringify(data));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'affectCrud',
                            args: {
                              value: {
                                items: data
                              }
                            }
                          });
                          if (
                            event.data.relationType != '2' &&
                            event.data.relationType != '3' &&
                            !event.data.joinColumnAtTarget
                          ) {
                            if (event.data.determineType == 'create') {
                              // if (event.data.relationType != 'ONE_MORE' && event.data.relationType != 'MORE_MORE' && !event.data.joinColumnAtTarget) {
                              data1.push({
                                sort: 1,
                                type: refTableType,
                                dbType: refTableType=='text'?'VARCHAR':'BIGINT',
                                code: event.data.names,
                                // "code": event.data.codes,
                                name: event.data.names,
                                precision: 10,
                                isForeignKey: true,
                                nullable:
                                  'nullable' in event.data
                                    ? event.data.nullable
                                    : true,
                                foreignKeyFlag: true,
                                config: {
                                  dbType: refTableType=='text'?'VARCHAR':'BIGINT'
                                },
                                // "fieldType": "int",
                                needId: needUuid,
                                relationMode: event.data.relationType,
                                defaultValueMode: 'null'
                                // "defaultValueType": null,
                                // "relative": false
                              });
                            } else {
                              data1 = data1.map((sjk: any) => {
                                if (sjk.code == event.data.names) {
                                  let yuanData: any = [];
                                  if (sessionStorage.getItem('yuanData')!) {
                                    yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
                                    yuanData.push({...sjk, needId: needUuid});
                                  } else {
                                    yuanData.push({...sjk, needId: needUuid});
                                  }
                                  sessionStorage.setItem('yuanData',JSON.stringify(yuanData));
                                  return {
                                    ...sjk,
                                    // type: 'int',
                                    // dbType: 'bigint',
                                    foreignKeyFlag: true,
                                    isForeignKey: true,
                                    precision: 10,
                                    needId: needUuid,
                                    relationMode: event.data.relationType,
                                    defaultValueMode: 'null'
                                  };
                                } else {
                                  return sjk;
                                }
                              });
                            }
                          }
                          // let refTables = event.data.codes;
                          let refTables = refTable;
                          let refTabless = event.data.joinTableCode + 's';
                          let needData: any = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                          needData.forEach((element: any) => {
                            if (
                              element.name.toUpperCase() ==
                              refTable.toUpperCase()
                            ) {
                              // refTables = refTable + uuid.v1().substring(0, 5);
                              refTables = checkAndRenameField(needData,refTable,'name')
                            }
                            if (
                              element.name.toUpperCase() ==
                              refTabless.toUpperCase()
                            ) {
                              // refTabless =
                              //   event.data.joinTableCode +
                              //   uuid.v1().substring(0, 5) +
                              //   's';
                              refTabless = checkAndRenameField(needData,event.data.joinTableCode,'name')
                            }
                          });
                          let waiD: any = {};
                          data1.forEach((sjw: any) => {
                            if (sjw.code == event.data.names) {
                              waiD = {...sjw};
                            }
                          });
                          console.log(data,'aaaaaaaaaaaaaaaaaaaaaa')
                          console.log(refTables,'refTablesrefTablesrefTables')
                          let lastData = data.map(rsw=>{
                            let returnDara = {...rsw}
                            if(rsw.code == event.data.codes){
                              returnDara.name = refTables
                            }
                            return returnDara
                          })
                          sessionStorage.setItem('affectCrud',JSON.stringify(lastData));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'affectCrud',
                            args: {
                              value: {
                                items: lastData
                              }
                            }
                          });
                          let nsjs = {
                            sort: 1,
                            type: 'relation',
                            code: event.data.codes,
                            name: refTables,
                            precision: 10,
                            nullable:
                              event.data.determineType == 'create'
                                ? event.data.joinColumnAtTarget
                                  ? relationNullable
                                  : event.data.nullable
                                : waiD.nullable,
                            foreignKeyFlag: false,
                            systemFieldType: 0,
                            needId: needUuid,
                            relationMode: event.data.relationType
                            // "defaultValueType": null,
                            // "relative": false
                          }
                          console.log(JSON.stringify(nsjs.nullable) == undefined,'JSON.stringify(nsjs.nullable) == undefined')
                          data1.push({
                            ...nsjs,
                            nullable:JSON.stringify(nsjs.nullable) == undefined ? true : nsjs.nullable
                          });
                          if (
                            event.data.relationType == '3' &&
                            event.data.withCustomProps &&
                            !event.data.joinColumnAtTarget
                          ) {
                            // if (event.data.relationType == 'MORE_MORE' && event.data.withCustomProps) {
                            data1.push({
                              // "fieldType": "relation",
                              sort: 1,
                              type: 'relation',
                              code: refTabless,
                              // "code": event.data.joinTableCode + 's',
                              // "code": event.data.codes,
                              // "code": event.data.code + '_on_' + event.data.codes,
                              // "name": event.data.names,
                              name: refTabless,
                              // "name": event.data.joinTableCode + 's',
                              // "name": event.data.codes,
                              // "name": event.data.code + '_on_' + event.data.codes,
                              precision: 10,
                              nullable:
                                'nullable' in event.data
                                  ? event.data.nullable
                                  : true,
                              foreignKeyFlag: false,
                              systemFieldType: 0,
                              needId: needUuid,
                              relationMode: '2'
                              // "defaultValueType": null,
                              // "relative": false
                            });
                          }
                          console.log(data1, 'dasdasdasdasdasdsa');
                          data1.forEach((element: any, index: number) => {
                            element.sort = index + 1;
                          });
                          let fieldCruds = data1.map((res: any) => {
                            // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                            if (
                              res.type != 'relation' &&
                              res.systemFieldType != 6 &&
                              res.systemFieldType != 7 &&
                              res.systemFieldType != 8 &&
                              res.systemFieldType != 9 && res.type != 'formula'
                            ) {
                              return res;
                            }
                          });
                          let puFieldCruds = data1.map((res: any) => {
                            if (
                              !res.foreignKeyFlag &&
                              res.systemFieldType == 0 &&
                              res.type != 'relation'
                            ) {
                              return res;
                            }
                          });
                          let fieldKeyCruds = data1.map((res: any) => {
                            if (
                              res.type != 'relation' &&
                              res.type != 'formula' &&
                              res.type != 'textarea' &&
                              res.type != 'rich-text' &&
                              res.type != 'json' &&
                              res.type != 'attachment' &&
                              res.type != 'image' &&
                              res.type != 'ciphertext' &&
                              res.type != 'users'
                            ) {
                              if (
                                res.type == 'text' &&
                                res.config.length < 768
                              ) {
                                return res;
                              } else if (res.type != 'text') {
                                return res;
                              }
                            }
                          });
                          let waiList = data1.filter((res: any) => {
                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                              return res;
                            } else if (
                              res.type == 'int' &&
                              res.systemFieldType == 0 &&
                              res.config.dbType == 'BIGINT'
                            ) {
                              return res;
                            }
                          });
                          let intList = data1.filter((res: any) =>
                            res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
                          let cuList = data1.filter((res: any) =>
                            (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
                          let cuTimeList = data1.filter((res: any) =>
                            res.type == 'datetime' && res.systemFieldType == 0)
                          let needPrimaryKeyType:any = []
                          needPrimaryKeyType = data1.filter((res: any) =>res.systemFieldType == 1)
                          if(needPrimaryKeyType.length == 0){
                            needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
                          }
                          let treeList = data1.filter((res: any) => {
                            if(res.type == needPrimaryKeyType[0].type &&
                              res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
                              return res
                            }
                          })
                          sessionStorage.setItem('intList', JSON.stringify(intList))
                          sessionStorage.setItem('cuList', JSON.stringify(cuList))
                          sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
                          sessionStorage.setItem('treeList', JSON.stringify(treeList))
                          sessionStorage.setItem('waiList',JSON.stringify(waiList));
                          sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                          sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                          sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                          sessionStorage.setItem('fieldCrud',JSON.stringify(data1));
                          let formulArr: any[] = [];
                          data1.forEach((item: any) => {
                            if (
                              item.type != 'formula' &&
                              item.systemFieldType != 6 &&
                              item.systemFieldType != 7 &&
                              item.systemFieldType != 8 &&
                              item.systemFieldType != 9
                            ) {
                              formulArr.push({...item,label:item.name,value:item.code});
                            }
                          });
                          sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'myField',
                            args: {
                              value: {
                                items: data1
                              }
                            }
                          });
                          doAction({
                            actionType: 'reload',
                            componentId: 'nameField'
                          });
                          // }, 1000);
                        }
                      }
                    ]
                  },
                  stepChange: {
                    weight: 0,
                    actions: [
                      {
                        actionType: 'custom',
                        script: function (_: any, doAction: any, event: any) {
                          console.log(event, 'eventeventeventevent');
                          refTables1 = '';
                          doAction({
                            actionType: 'setValue',
                            componentId: 'targetKey',
                            arg:{
                              value:''
                            }
                          });
                          doAction({
                            actionType: 'setValue',
                            componentId: 'field',
                            arg:{
                              value:''
                            }
                          });
                          doAction({
                            actionType: 'reset',
                            componentId: 'affectForm'
                          });
                          doAction({
                            actionType: 'clear',
                            componentId: 'affectForm'
                          });
                          doAction({
                            actionType: 'hidden',
                            componentId: 'joinColum1'
                          });
                          doAction({
                            actionType: 'hidden',
                            componentId: 'inverseJoinColumn1'
                          });
                          let externalListArr = []
                          let haveExternalList = []
                          haveExternalList = JSON.parse(sessionStorage.getItem('externalList')!);
                          if(haveExternalList.length === 0 && event.data.relationType == '2'){
                            externalListArr.unshift({
                              "tableKey": null,
                              "name": null,
                              "nullable": true,
                              "cascadeRemove": null,
                              "relationMode": null,
                              "code": "自动创建",
                              "description": null,
                              "joinTableKey": null,
                              "joinTableCode": null,
                              "joinColumnKey": null,
                              "joinColumnCode": null,
                              "inverseJoinColumnKey": null,
                              "inverseJoinColumnCode": null,
                              "targetKey": null,
                              "fieldKey": null,
                              "foreignKeyCode": null,
                              "foreignKeyKey": "0",
                              "joinColumnAtTarget": null,
                              "inverseSideKey": null,
                              "withCustomProps": null,
                              "sort": null,
                              "config": null,
                              "appId": null,
                              "env": null,
                              "ver": null,
                              "latest": null,
                              "queryKey": "0",
                              "id": null,
                              "createTime": null,
                              "targetName": null,
                              "targetCode": null,
                              "targetType": null,
                              "determineType": null,
                              "joinTableExpand": null
                            })
                          }
                          sessionStorage.setItem('externalList',JSON.stringify(externalListArr));
                          sessionStorage.setItem('targetFieldList',JSON.stringify([]));
                          setTimeout(() => {
                            doAction({
                              actionType: 'setValue',
                              componentId: 'targetKey',
                              arg:{
                                value:''
                              }
                            });
                            doAction({
                              actionType: 'setValue',
                              componentId: 'field',
                              arg:{
                                value:''
                              }
                            });
                            doAction({
                              actionType: 'hidden',
                              componentId: 'joinColum1'
                            });
                            doAction({
                              actionType: 'hidden',
                              componentId: 'inverseJoinColumn1'
                            });
                            doAction({
                              actionType: 'reset',
                              componentId: 'affectForm'
                            });
                          }, 100);
                        }
                      }
                    ]
                  },
                  // finished: {}
                }
              }
            }
          }
        ],
        columns: [
          {
            name: 'code',
            label: '关系key',
            align: 'center'
          },
          {
            name: 'name',
            label: '字段名称',
            align: 'center'
          },
          {
            name: 'relationMode',
            label: '关系类型',
            type: 'mapping',
            map: {
              '0': '<span>一对一</span>',
              '1': '<span>多对一</span>',
              '2': '<span>一对多</span>',
              '3': '<span>多对多</span>'
              // "ONE_ONE": "<span>一对一</span>",
              // "MORE_ONE": "<span>多对一</span>",
              // "ONE_MORE": "<span>一对多</span>",
              // "MORE_MORE": "<span>多对多</span>"
            },
            align: 'center'
          },
          {
            name: 'targetName',
            // "name": "refTableName",
            // "name": "fkModel.refTableName",
            // "label": "父表模型名称",
            label: '关系目标',
            align: 'center'
          },
          {
            name: 'nullable',
            // "name": "fkModel.allowNullFlag",
            label: '允许空值',
            type: 'mapping',
            map: {
              false: '<span>否</span>',
              true: '<span>是</span>'
            },
            align: 'center'
          },
          {
            name: 'cascadeRemove',
            // "name": "fkModel.delCascadeFlag",
            label: '级联删除',
            type: 'mapping',
            map: {
              false: '<span>否</span>',
              true: '<span>是</span>'
            },
            align: 'center'
          },
          {
            type: 'operation',
            label: '操作',
            align: 'center',
            buttons: [
              {
                label: '修改',
                type: 'button',
                level: 'link',
                // "hiddenOn": "${!fkModel.id}",
                onEvent: {
                  click: {
                    "weight": 0,
                    "debounce": {
                      "wait": 100
                    },
                    actions: [
                      {
                        actionType: 'custom',
                        script: function (_: any, doAction: any, event: any) {
                          console.log(_, '____');
                          console.log(
                            doAction,
                            'doActiondoActiondoActiondoAction'
                          );
                          console.log(event, 'eventeventeventevent');
                          inverseJoinColumnKeys = null
                          isChange = false
                          sessionStorage.removeItem('affevtData');
                          sessionStorage.removeItem('inputData');
                          // sessionStorage.removeItem('formData');
                          sessionStorage.removeItem('externalList');
                          sessionStorage.removeItem('affevtDatas');
                          sessionStorage.removeItem('inputDatas');
                          middleData.joinTableCode = false;
                          middleData.joinColumnCode = false;
                          middleData.inverseJoinColumnCode = false;
                          getExternalList({
                            tableKey: event.data.tableKey
                              ? event.data.tableKey
                              : event.data.queryKey,
                            targetTableKey: event.data.targetKey,
                            relationMode: event.data.relationMode
                          }).then((res: any) => {
                            let needId:any = ''
                            for (var i = 0; i < res.data.data.length; i++) {
                              if(res.data.data[i].queryKey == event.data.inverseSideKey){
                                needId = res.data.data[i].code
                              }
                              if (res.data.data[i].relationMode == 0) {
                                res.data.data[i].code =
                                  res.data.data[i].code + '(1:1)';
                              }
                              if (res.data.data[i].relationMode == 1) {
                                res.data.data[i].code =
                                  res.data.data[i].code + '(n:1)';
                              }
                              if (res.data.data[i].relationMode == 2) {
                                res.data.data[i].code =
                                  res.data.data[i].code + '(1:n)';
                              }
                              if (res.data.data[i].relationMode == 3) {
                                res.data.data[i].code =
                                  res.data.data[i].code + '(n:n)';
                              }
                            }
                            let externalListArr = []
                            externalListArr = res.data.data
                            if(event.data.inverseSideKey == '0'){
                              if(externalListArr.length == 0){
                                externalListArr.unshift({
                                  "tableKey": null,
                                  "name": null,
                                  "nullable": true,
                                  "cascadeRemove": null,
                                  "relationMode": null,
                                  "code": "自动创建",
                                  "description": null,
                                  "joinTableKey": null,
                                  "joinTableCode": null,
                                  "joinColumnKey": null,
                                  "joinColumnCode": null,
                                  "inverseJoinColumnKey": null,
                                  "inverseJoinColumnCode": null,
                                  "targetKey": null,
                                  "fieldKey": null,
                                  "foreignKeyCode": null,
                                  "foreignKeyKey": "0",
                                  "joinColumnAtTarget": null,
                                  "inverseSideKey": null,
                                  "withCustomProps": null,
                                  "sort": null,
                                  "config": null,
                                  "appId": null,
                                  "env": null,
                                  "ver": null,
                                  "latest": null,
                                  "queryKey": "0",
                                  "id": null,
                                  "createTime": null,
                                  "targetName": null,
                                  "targetCode": null,
                                  "targetType": null,
                                  "determineType": null,
                                  "joinTableExpand": null
                                })
                              }
                            }
                            sessionStorage.setItem('externalList',JSON.stringify(externalListArr));
                            getColumnSelect(
                              event.data.targetKey
                                ? event.data.targetKey
                                : event.data.targetCode
                            ).then((res: any) => {
                              getTableData(event.data.targetKey).then((targetRess: any) => {
                                console.log(targetRess,'targetResstargetRess')
                              let allData = res.data.data.filter((item: any) => {
                                // if (item.targetKey != event.data.__super.queryKey) {
                                  return item;
                                // }
                              });
                              let inverseSide:any = []
                              let inverseSides:any = []
                              let relationArr:any = []
                              allData.forEach(jj=>{
                                if(jj.type == 'relation'){
                                  relationArr.push(jj)
                                }
                              })
                              if(event.data.inverseSideKey == null){
                                targetRess.data.data.relations.forEach(sjf => {
                                  if(sjf.inverseSideKey == event.data.queryKey && event.data.relationMode != 3){
                                  // if(sjf.foreignKeyKey == event.data.foreignKeyKey && event.data.relationMode != 3){
                                    inverseSide.push(sjf)
                                  }
                                  if(sjf.inverseJoinColumnKey == event.data.inverseJoinColumnKey && event.data.relationMode == 3){
                                    inverseSide.push(sjf)
                                  }
                                })
                              }else{
                                inverseSides.push(event.data)
                              }
                              inverseSide =  Array.from(new Set(inverseSide.map(item => item.code)))
                                .map(key => inverseSide.find(item => item.code === key));
                              let lastAllDatas = allData.filter(wjs => !inverseSide.some(wsw => wsw.code == wjs.code))
                              lastAllDatas = lastAllDatas.filter(wjs => needId != wjs.code)
                              allData = lastAllDatas
                              let affevtData: any = []; // 默认展示
                              let affevtDatas: any = []; // 默认展示数据
                              let inputData: any = []; // 默认输入
                              let inputDatas: any = []; // 默认输入数据
                              let inputDatass: any = []; // 默认输入数据
                              let formData: any = []; // form自增
                                console.log(allData,'allDataallDataallData')
                              if (Number(event.data.relationMode) == 0) {
                                console.log('进入一对一');
                                allData.forEach((item: any) => {
                                  if (
                                    item.type != 'relation' &&
                                    item.systemFieldType == 0 &&
                                    !item.foreignKeyFlag &&
                                    item.systemFieldType != 9
                                  ) {
                                    affevtData.push(item);
                                  }
                                });
                              } else if (Number(event.data.relationMode) == 1) {
                                allData.forEach((item: any) => {
                                  if (
                                    item.type != 'relation' &&
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9 &&
                                    !item.foreignKeyFlag
                                  ) {
                                    affevtData.push(item);
                                  }
                                  if (
                                    (item.systemFieldType == 0 ||
                                      item.type == 'relation') &&
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9 &&
                                    !item.foreignKeyFlag
                                  ) {
                                    if (!item.nullable) {
                                      inputData.push({
                                        ...item,
                                        disabled: true
                                      });
                                    } else {
                                      inputData.push(item);
                                    }
                                  }
                                });
                              } else if (Number(event.data.relationMode) == 2) {
                                allData.forEach((item: any) => {
                                  if (
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                      item.systemFieldType != 9 &&
                                    !item.foreignKeyFlag
                                  ) {
                                    affevtData.push(item);
                                  }
                                  if (
                                    (item.systemFieldType == 0 ||
                                      item.type == 'relation') &&
                                    !item.foreignKeyFlag &&
                                      item.systemFieldType != 9
                                  ) {
                                    console.log(item,'itemitemitemitem')
                                    if (!item.nullable) {
                                      inputData.push({
                                        ...item,
                                        disabled: true
                                      });
                                    } else {
                                      inputData.push(item);
                                    }
                                  }
                                });
                              } else if (Number(event.data.relationMode) == 3) {
                                allData.forEach((item: any) => {
                                  // if(item.systemFieldType>0 && item.systemFieldType != 6 && item.systemFieldType != 7 && item.systemFieldType != 8){
                                  if (
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9 &&
                                    !item.foreignKeyFlag
                                  ) {
                                    affevtData.push(item);
                                  }
                                  if (
                                    (item.systemFieldType == 0 ||
                                      item.type == 'relation') &&
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9 &&
                                    !item.foreignKeyFlag
                                  ) {
                                    if (!item.nullable) {
                                      inputData.push({
                                        ...item,
                                        disabled: true
                                      });
                                    } else {
                                      inputData.push(item);
                                    }
                                  }
                                });
                              }
                              allData.forEach((item: any) => {
                                if (
                                  item.type != 'relation' &&
                                  item.systemFieldType != 6 &&
                                  item.systemFieldType != 7 &&
                                  item.systemFieldType != 8 &&
                                  item.systemFieldType != 9
                                ) {
                                  formData.push(item);
                                }
                              });
                              if (event.data.config?.displayColumns) {
                                if (
                                  event.data.config?.displayColumns.length > 0
                                ) {
                                  event.data.config.displayColumns.forEach(
                                    (disItem: any) => {
                                      affevtDatas.push(disItem);
                                    }
                                  );
                                }
                                if (
                                  affevtDatas.length == 0 &&
                                  event.data.config?.displayColumns.length > 0
                                ) {
                                  affevtDatas = affevtData;
                                }
                              }
                              if (
                                event.data.config?.quickEditSettings?.inputColumns
                              ) {
                                if (
                                  event.data.config?.quickEditSettings
                                    ?.inputColumns.length > 0
                                ) {
                                  event.data.config.quickEditSettings.inputColumns.forEach(
                                    (disItem: any) => {
                                      inputData.forEach((disItems: any) => {
                                        // if (disItem == disItems.code) {
                                        if (disItem == disItems.queryKey) {
                                          inputDatas.push(disItem);
                                        }
                                      });
                                    }
                                  );
                                }
                                if (
                                  inputDatas.length == 0 &&
                                  event.data.config?.quickEditSettings
                                    ?.inputColumns.length > 0
                                ) {
                                  inputDatas = inputData;
                                }
                              }
                              if (event.data.config?.inputColumns) {
                                if (event.data.config?.inputColumns.length > 0) {
                                  event.data.config.inputColumns.forEach(
                                    (disItem: any) => {
                                      inputData.forEach((disItems: any) => {
                                        if (disItem == disItems.queryKey) {
                                        // if (disItem == disItems.code) {
                                          inputDatass.push(disItem);
                                        }
                                      });
                                    }
                                  );
                                }
                              }
                              console.log(inputData,'inputData')
                              console.log(inputDatass,'inputDatass')
                                if (
                                  inputDatass.length == 0 &&
                                  event.data.config &&
                                  event.data.config.inputColumns &&
                                  event.data.config.inputColumns.length > 0
                                ) {
                                  inputDatass = inputData;
                                }
                                if (
                                  inputDatass.length == 0 &&
                                  event.data.config &&
                                  !event.data.config.inputColumns &&
                                  event.data.config.displayColumns &&
                                  event.data.config.displayColumns.length > 0
                                ) {
                                  inputDatass = inputData;
                                }
                              console.log(
                                affevtData,
                                'affevtDataaffevtDataaffevtData'
                              );
                              if (!event.data.config) {
                                console.log('进入');
                                affevtDatas = affevtData;
                                inputDatas = inputData;
                                inputDatass = inputData;
                              }
                              if(event.data.config && !event.data.config.quickEditSettings){
                                inputDatas = inputData;
                              }
                              console.log(inputDatas, 'inputDatas');
                                sessionStorage.setItem('formData',JSON.stringify(formData));
                              setTimeout(()=>{
                                sessionStorage.setItem('affevtData',JSON.stringify(affevtData));
                                sessionStorage.setItem('affevtDatas',JSON.stringify(affevtDatas));
                                sessionStorage.setItem('inputData',JSON.stringify(inputData));
                                sessionStorage.setItem('inputDatas',JSON.stringify(inputDatas));
                                sessionStorage.setItem('inputDatass',JSON.stringify(inputDatass));
                                // sessionStorage.setItem(
                                //   'formData',
                                //   JSON.stringify(formData)
                                // );
                                doAction({
                                  actionType:'setValue',
                                  componentId:'config.quickEditSettings.inputColumnss',
                                  args: {
                                    value: inputDatas
                                  }
                                })
                                doAction({
                                  actionType:'setValue',
                                  componentId:'config.inputColumnss',
                                  args: {
                                    value: inputDatass
                                  }
                                })
                                doAction({
                                  actionType:'setValue',
                                  componentId:'config.displayColumns',
                                  args: {
                                    value: affevtDatas
                                  }
                                })
                                doAction({
                                  actionType:'reload',
                                  componentId:'config.quickEditSettings.inputColumnss'
                                })
                                doAction({
                                  actionType:'reload',
                                  componentId:'config.displayColumns'
                                })
                                doAction({
                                  actionType:'reload',
                                  componentId:'config.inputColumnss'
                                })
                                doAction({
                                  actionType:'reload',
                                  componentId:'config.autoFills'
                                })
                                doAction({
                                  actionType:'reload',
                                  componentId:'config.quickEditSettings.autoFills'
                                })
                                doAction({
                                  actionType:'reload',
                                  componentId:'config.quickEditSettings.autoFills'
                                })
                              },100);
                              const time = ''; //补充time
                              addRule(
                                'isForeign',
                                (values, value) => {
                                  let sameName = false;
                                  let sameNames = false;
                                  console.log(values, '11111111111');
                                  console.log(value, '2222222222');
                                  let data = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                  if (values.needId) {
                                    if (
                                      res.code == values.foreignKeyCode &&
                                      res.code != values.__super.foreignKeyCode &&
                                      res.needId != values.needId
                                    ) {
                                      sameName = true;
                                    }
                                  } else {
                                    if (
                                      res.code == values.foreignKeyCode &&
                                      res.code != values.__super.foreignKeyCode &&
                                      res.id != values.id
                                    ) {
                                      sameName = true;
                                    }
                                  }
                                  if (sameName) {
                                    return {
                                      error: true,
                                      msg: '字段集合列表字段重复。'
                                    };
                                  } else if (sameNames) {
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        time +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else {
                                    return true;
                                  }
                                }
                              );
                              addRule(
                                'isMiddTas',
                                (values, value) => {
                                  let sameName = false;
                                  let sameNames = false;
                                  console.log(values, '11111111111');
                                  console.log(value, '2222222222');
                                  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                  data1.forEach((res: any) => {
                                    if (res.needId) {
                                      if (
                                        res.joinTableCode ==
                                          values.joinTableCode &&
                                        res.needId != values.needId
                                      ) {
                                        sameNames = true;
                                      }
                                    } else {
                                      if (
                                        res.joinTableCode ==
                                          values.joinTableCode &&
                                        res.id != values.id
                                      ) {
                                        sameNames = true;
                                      }
                                    }
                                  });
                                  if (sameNames) {
                                    return {
                                      error: true,
                                      msg: '中间表名重复'
                                    };
                                  } else {
                                    return true;
                                  }
                                }
                              );
                              addRule(
                                'editCode',
                                (values, value) => {
                                  let sameName = false;
                                  console.log(values, '关系key数据校验');
                                  console.log(value, '关系key数据校验');
                                  middleData.editCode = false;
                                  let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                  data1.forEach((res: any) => {
                                    if (res.code == value) {
                                      sameName = true;
                                      middleData.editCode = true;
                                      if (
                                        res.needId &&
                                        (values.needId == res?.needId ||
                                          values.needId == res?.needId + 1)
                                      ) {
                                        sameName = false;
                                        middleData.editCode = false;
                                      } else {
                                        if (
                                          values.fieldKey &&
                                          values.queryKey &&
                                          values.fieldKey == res.queryKey
                                        ) {
                                          sameName = false;
                                          middleData.editCode = false;
                                        } else if (
                                          values.needId &&
                                          res.needId &&
                                          values.needId == res.needId
                                        ) {
                                          sameName = false;
                                          middleData.editCode = false;
                                        } else if (
                                          values.queryKey &&
                                          res.relationKey &&
                                          values.queryKey == res.relationKey
                                        ) {
                                          sameName = false;
                                          middleData.editCode = false;
                                        }
                                      }
                                    }
                                  });
                                  if (sameName) {
                                    return {
                                      error: true,
                                      msg: '该字段与字段集合列表中字段名重复，请换个字段'
                                    };
                                  } else {
                                    return true;
                                  }
                                }
                              );
                              addRule(
                                'editName',
                                (values, value) => {
                                  let sameName = false;
                                  let sameNames = false;
                                  middleData.editName = false;
                                  console.log(values, '字段名称数据校验');
                                  console.log(value, '字段名称数据校验');
                                  let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                  console.log(data1,'data1');
                                  console.log(value,'value');
                                  data1.forEach((res: any) => {
                                    if (res.name == value) {
                                      sameName = true;
                                      middleData.editCode = true;
                                      if (
                                        res.needId &&
                                        (values.needId == res.needId ||
                                          values.needId == res.needId + 1)
                                      ) {
                                        sameName = false;
                                        middleData.editCode = false;
                                      } else {
                                        if (
                                          values.fieldKey &&
                                          values.fieldKey == res.queryKey
                                        ) {
                                          sameName = false;
                                          middleData.editCode = false;
                                        } else if (
                                          res.needId &&
                                          values.needId == res.needId
                                        ) {
                                          sameName = false;
                                          middleData.editCode = false;
                                        } else if (
                                          values.queryKey &&
                                          res.relationKey &&
                                          values.queryKey == res.relationKey
                                        ) {
                                          sameName = false;
                                          middleData.editCode = false;
                                        }
                                      }
                                    }
                                  });
                                  if (sameName) {
                                    return {
                                      error: true,
                                      msg: '该字段与字段集合列表中显示标题重复，请换个字段'
                                    };
                                  } else {
                                    return true;
                                  }
                                }
                              );
                            });
                          })
                          }).catch(error=>{
                            console.log(error,'error')
                          });
                        }
                      },
                      {
                        actionType: 'drawer',
                        drawer: {
                          resizable: true,
                          name: 'uploadAffect',
                          id: 'uploadAffect',
                          position: 'right',
                          width: 380,
                          title: '编辑关系【$code】',
                          body: {
                            type: 'form',
                            id: 'rationForm',
                            close: false,
                            mode: 'horizontal',
                            wrapWithPanel: false,
                            body: {
                              type: 'collapse-group',
                              expandIconPosition: 'right',
                              activeKey: ['1'],
                              enableFieldSetStyle: false,
                              body: [
                                {
                                  type: 'collapse',
                                  key: '1',
                                  header: '基本设置',
                                  body: [
                                    {
                                      type: 'combo',
                                      label: '关系类型',
                                      items: [
                                        {
                                          name: 'relationMode',
                                          type: 'mapping',
                                          map: {
                                            '0': "<span  class='label label-info'>一对一</span>",
                                            '1': "<span  class='label label-info'>多对一</span>",
                                            '2': "<span  class='label label-info'>一对多</span>",
                                            '3': "<span  class='label label-info'>多对多</span>"
                                            // "ONE_ONE": "<span  class='label label-info'>一对一</span>",
                                            // "MORE_ONE": "<span  class='label label-info'>多对一</span>",
                                            // "ONE_MORE": "<span  class='label label-info'>一对多</span>",
                                            // "MORE_MORE": "<span  class='label label-info'>多对多</span>",
                                          }
                                        }
                                      ]
                                    },
                                    {
                                      type: 'combo',
                                      label: '关系目标',
                                      // "label": "目标模型",
                                      items: [
                                        {
                                          name: 'targetName',
                                          // "name": "refTableName",
                                          type: 'tag',
                                          displayMode: 'normal',
                                          color: 'active'
                                        }
                                      ]
                                    },
                                    {
                                      required: true,
                                      label: '关系key',
                                      type: 'input-text',
                                      name: 'code',
                                      placeholder: '关系key',
                                      // "disabled": true,
                                      validations: {
                                        matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                        editCode: true
                                      },
                                      validationErrors: {
                                        matchRegexp: '请填写规范字段名'
                                      },
                                      onEvent: {
                                        change: {
                                          actions: [
                                            {
                                              actionType: 'custom',
                                              script: function (_: any,doAction: any,event: any) {
                                                if(!isChange){
                                                  doAction({
                                                    actionType: 'setValue',
                                                    componentId: 'fieldNamec',
                                                    args: {
                                                      value: event.data.code
                                                    }
                                                  });
                                                }
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    },
                                    {
                                      required: true,
                                      label: '字段名称',
                                      type: 'input-text',
                                      name: 'name',
                                      id: 'fieldNamec',
                                      placeholder: '字段名称',
                                      validations: {
                                        editName: true
                                      },
                                      onEvent: {
                                        change: {
                                          actions: [
                                            {
                                              actionType: 'custom',
                                              script: function (_: any,doAction: any,event: any) {
                                                isChange = true
                                                if(event.data.name==''){
                                                  isChange = false
                                                }
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    },
                                    {
                                      label: '描述',
                                      type: 'textarea',
                                      mode: 'horizontal',
                                      name: 'description'
                                    },
                                    {
                                      visibleOn: "(this.relationMode == '0')",
                                      // "visibleOn": "(this.relationMode == 'ONE_ONE')",
                                      label: '外键在对方',
                                      type: 'switch',
                                      value: false,
                                      disabled: true,
                                      name: 'joinColumnAtTarget'
                                    },
                                    {
                                      visibleOn: "(this.relationMode == '3')",
                                      // "visibleOn": "(this.relationMode == 'MORE_MORE')",
                                      label: '关联反向关系',
                                      type: 'switch',
                                      value: false,
                                      disabled: true,
                                      name: 'joinColumnAtTarget'
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '3' && !this.joinColumnAtTarget",
                                      // "visibleOn": "this.relationMode == 'MORE_MORE' && !this.joinColumnAtTarget",
                                      // "visibleOn": "this.relationType == 'n:n' && !this.joinColumnAtTarget",
                                      required: true,
                                      label: '中间表名',
                                      type: 'input-text',
                                      // "name": "fieldDesc",
                                      // "name": "joinTableCode.key",
                                      name: 'joinTableCode',
                                      validations: {
                                        matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                        isMiddTas: true
                                      },
                                      validationErrors: {
                                        matchRegexp: '请填写规范字段名'
                                      },
                                      validateApi: {
                                        url: useDevBaseUrl('/entitymanage/table/validateMiddleTable?dsKey=${dsKey}&relationQueryKey=${queryKey}&tableCode=${joinTableCode}&tableQueryKey=${joinTableExpand.joinTableInfo.queryKey}'),
                                        method: 'get',
                                        dataType: 'json',
                                        requestAdaptor: '',
                                        messages: {
                                          failed:
                                            '表名在实体模型或数据库中存在，请修改'
                                        },
                                        // "adaptor": "return {\r\n  status:true\r\n}",
                                        adaptor: function (
                                          payload: any,
                                          response: any,
                                          api: any
                                        ) {
                                          console.log(payload,'payloadpayload');
                                          console.log(response,'responseresponse');
                                          console.log(api, 'apiapi');
                                          if (payload.code != 0) {
                                            middleData.joinTableCode = true;
                                            return {...payload,
                                              data:null,
                                              errors:payload.errors,
                                              status:422
                                            };
                                          } else {
                                            middleData.joinTableCode = false;
                                            return payload;
                                          }
                                        }
                                      }
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '3' && !this.joinColumnAtTarget",
                                      // "visibleOn": "this.relationMode == 'MORE_MORE' && !this.joinColumnAtTarget",
                                      required: true,
                                      label: '关联本身字段名',
                                      type: 'input-text',
                                      name: 'joinColumnCode',
                                      validations: {
                                        matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                        idJoin: true
                                      },
                                      validationErrors: {
                                        matchRegexp: '请填写规范字段名'
                                      },
                                      // "name": "fieldDesc"
                                      // "name": "joinTableCode.joinColum.key",
                                      validateApi: {
                                        url: useDevBaseUrl('/entitymanage/table/validateMiddleTable?dsKey=${dsKey}&relationQueryKey=${queryKey}&joinColumnCode=${joinColumnCode}&joinColumnQueryKey=${joinTableExpand.joinColumnInfo.id}'),
                                        method: 'get',
                                        dataType: 'json',
                                        requestAdaptor: '',
                                        // "messages": {
                                        //     "failed": "关联本身字段名不能与关联目标字段名相同，请修改"
                                        // },
                                        adaptor: function (
                                          payload: any,
                                          response: any,
                                          api: any
                                        ) {
                                          console.log(
                                            payload,
                                            '关联本身字段名payloadpayload'
                                          );
                                          console.log(
                                            response,
                                            'responseresponse'
                                          );
                                          console.log(api, 'apiapi');
                                          if (payload.code != 0) {
                                            middleData.joinColumnCode = true;
                                            return {...payload,
                                              data:null,
                                              errors:payload.errors,
                                              status:422
                                            };
                                          } else {
                                            middleData.joinColumnCode = false;
                                            return payload;
                                          }
                                        }
                                      }
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '3' && !this.joinColumnAtTarget",
                                      // "visibleOn": "this.relationMode == 'MORE_MORE' && !this.joinColumnAtTarget",
                                      required: true,
                                      label: '关联目标字段名',
                                      type: 'input-text',
                                      // "name": "fieldDesc"
                                      // "name": "joinTableCode.inverseJoinColumn.key",
                                      // "name": "config.joinColumnCode"
                                      name: 'inverseJoinColumnCode',
                                      validations: {
                                        matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                                        idJoins: true
                                      },
                                      validationErrors: {
                                        matchRegexp: '请填写规范字段名'
                                      },
                                      validateApi: {
                                        url: useDevBaseUrl('/entitymanage/table/validateMiddleTable?dsKey=${dsKey}&relationQueryKey=${queryKey}&inverseJoinColumnCode=${inverseJoinColumnCode}&inverseJoinColumnQueryKey=${joinTableExpand.inverseJoinColumnInfo.id}'),
                                        method: 'get',
                                        dataType: 'json',
                                        requestAdaptor: '',
                                        // "messages": {
                                        //     "failed": "关联目标字段名不能与本身字段名相同，请修改"
                                        // },
                                        adaptor: function (
                                          payload: any,
                                          response: any,
                                          api: any
                                        ) {
                                          console.log(
                                            payload,
                                            '关联目标字段名payloadpayload'
                                          );
                                          console.log(
                                            response,
                                            'responseresponse'
                                          );
                                          console.log(api, 'apiapi');
                                          // if (payload.data) {
                                          if (payload.code != 0) {
                                            middleData.inverseJoinColumnCode = true;
                                              return {...payload,
                                                data:null,
                                                errors:payload.errors,
                                                status:422
                                              };
                                          } else {
                                            middleData.inverseJoinColumnCode = false;
                                            return payload;
                                          }
                                        }
                                      }
                                    },
                                    {
                                      visibleOn:
                                        "(this.relationMode == '0' || this.relationMode == '1') && !this.joinColumnAtTarget",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE' || this.relationMode == 'MORE_ONE'",
                                      type: 'input-text',
                                      label: '外键',
                                      // "name": "foreignKey",
                                      name: 'foreignKeyCode',
                                      validations: {
                                        isForeign: true
                                      }
                                    },
                                    {
                                      visibleOn:
                                        "((this.relationMode == '0' && !this.joinColumnAtTarget) || this.relationMode == '1') && !this.disNullable",
                                      type: 'switch',
                                      label: '允许空值',
                                      // "value": false,
                                      name: 'nullable'
                                    },
                                    {
                                      visibleOn:
                                        "((this.relationMode == '0' && !this.joinColumnAtTarget) || this.relationMode == '1') && this.disNullable",
                                      type: 'switch',
                                      label: '允许空值',
                                      // disabled: true,
                                      // "value": false,
                                      name: 'nullable'
                                    },
                                    {
                                      visibleOn:
                                        "(this.relationMode == '0' || this.relationMode == '3') && this.joinColumnAtTarget",
                                      // "visibleOn": "(this.relationMode == 'ONE_ONE' || this.relationMode == 'MORE_MORE') && this.joinColumnAtTarget",
                                      required: true,
                                      label: '反向关系',
                                      desc: "如果没有反向关系，请先点选目标模型创建关系，${(relationMode == '0' ? '此时依赖一个反向的一对一，且指定了外键的关系' : relationMode == '2' ? '此时依赖一个反向的多对一关系' : relationMode == '3' ? '此时依赖一个反向的多对多，且包含中间表信息的关系' : '')}",
                                      type: 'select',
                                      labelField: 'code',
                                      // "valueField": "code",
                                      valueField: 'queryKey',
                                      name: 'inverseSideKey',
                                      source: '${ss:externalList}',
                                      onEvent: {
                                        change: {
                                          actions: [
                                            {
                                              actionType: 'custom',
                                              script: function (_: any,doAction: any,event: any) {
                                                console.log(event,'event1111111111'                                                );
                                                inverseData = event.data.selectedItems.withCustomProps;
                                                relationNullable = event.data.selectedItems.nullable;
                                                inverseJoinColumnCodes = event.data.selectedItems.inverseJoinColumnCode == null
                                                    ? event.data.selectedItems.foreignKeyCode
                                                    : event.data.selectedItems.inverseJoinColumnCode;
                                                inverseJoinColumnKeys = event.data.selectedItems.inverseJoinColumnKey == null
                                                    ? undefined : event.data.selectedItems.inverseJoinColumnKey;
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '2' && !this.isNullable",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE'",
                                      required: true,
                                      label: '反向关系',
                                      type: 'select',
                                      labelField: 'code',
                                      desc: '如果没有反向关系，请先点选目标模型创建关系，此时依赖一个反向的多对一关系',
                                      // "valueField": "code",
                                      valueField: 'queryKey',
                                      name: 'inverseSideKey',
                                      source: '${ss:externalList}',
                                      onEvent: {
                                        change: {
                                          actions: [
                                            {
                                              actionType: 'custom',
                                              script: function (_: any,doAction: any,event: any) {
                                                console.log(event,'event1111111111');
                                                relationNullable = event.data.selectedItems.nullable;
                                                inverseJoinColumnCodes = event.data.selectedItems.foreignKeyCode;
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '0' || this.relationMode == '2'",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE' || this.relationMode == 'ONE_MORE'",
                                      label: '级联删除',
                                      type: 'switch',
                                      name: 'cascadeRemove',
                                      value: false
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '3' && !this.joinColumnAtTarget",
                                      disabled: true,
                                      label: '可自定义属性',
                                      type: 'switch',
                                      name: 'withCustomProps',
                                      value: false,
                                      desc: '除了单纯的关系信息外，如果你想额外的保存一些其他信息比如，关系建立时间、是否为特殊关系等等，请勾选此选项，平台将自动创建关系模型，在创建的关系模型中添加字段即可。'
                                    }
                                  ]
                                },
                                {
                                  visibleOn:"!this.needHaveId",
                                  type: 'collapse',
                                  key: '2',
                                  header: '默认展示',
                                  body: [
                                    {
                                      visibleOn:
                                        "this.relationMode == '0' || this.relationMode == '1'",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE' || this.relationMode == 'MORE_ONE'",
                                      label: '展示形式',
                                      type: 'select',
                                      name: 'config.displayType',
                                      value: 'titleField',
                                      options: [
                                        {
                                          label: '标题字段',
                                          value: 'titleField'
                                        },
                                        {
                                          label: '内嵌展示',
                                          value: 'embed'
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '2' || this.relationMode == '3'",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE' || this.relationMode == 'MORE_MORE'",
                                      label: '展示形式',
                                      type: 'select',
                                      name: 'config.displayType',
                                      value: 'dialog',
                                      options: [
                                        {
                                          label: '弹框',
                                          value: 'dialog'
                                        },
                                        {
                                          label: '抽屉',
                                          value: 'drawer'
                                        },
                                        {
                                          label: '内嵌「数据量小时适用」',
                                          value: 'embed'
                                        },
                                        {
                                          label: '点击跳转页面',
                                          value: 'goOther',
                                          disabled: true
                                        }
                                      ]
                                    },
                                    {
                                      // visibleOn:
                                        // "(this.relationMode == '0'  || this.relationMode == '1') && this.config.displayType=='embed'",
                                      // "visibleOn": "(this.relationMode == 'ONE_ONE'  || this.relationMode == 'MORE_ONE') && this.config.displayType=='embed'",
                                      label: '展示字段',
                                      type: 'checkboxes',
                                      defaultCheckAll:true,
                                      id: 'config.displayColumns',
                                      name: 'config.displayColumns',
                                      source: '${ss:affevtData}',
                                      value: '${ss:affevtDatas}',
                                      labelField: 'name',
                                      valueField: 'queryKey'
                                      // valueField: 'code'
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '2' || this.relationMode == '3'",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE' || this.relationMode == 'MORE_MORE'",
                                      label: '自定义展示模板',
                                      type: 'textarea',
                                      name: 'config.displayTpl',
                                      placeholder: '查看关联的列表'
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '0' || this.relationMode == '1'",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE' || this.relationMode == 'MORE_ONE'",
                                      label: '可快速编辑',
                                      type: 'switch',
                                      name: 'config.quickEdit'
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '0' && this.inverseSideKey && config.quickEdit",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE' && this.inverseSideKey",
                                      label: '输入形式',
                                      type: 'select',
                                      name: 'config.quickEditSettings.inputType',
                                      value: 'embed',
                                      options: [
                                        {
                                          label: '内嵌',
                                          value: 'embed'
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '0' && this.config.quickEdit && !this.inverseSideKey",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE' && !this.inverseSideKey",
                                      label: '输入形式',
                                      type: 'select',
                                      value: 'embed',
                                      name: 'config.quickEditSettings.inputType',
                                      options: [
                                        {
                                          label: '内嵌',
                                          value: 'embed'
                                        },
                                        {
                                          label: '下拉关联',
                                          value: 'select'
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && this.config.quickEdit",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && this.config.quickEdit",
                                      label: '输入形式',
                                      type: 'select',
                                      value: 'select',
                                      name: 'config.quickEditSettings.inputType',
                                      options: [
                                        {
                                          label: '下拉选择框',
                                          value: 'select'
                                          // "value": "dropdownSelect"
                                        },
                                        {
                                          label: '单选按钮',
                                          value: 'radios'
                                        },
                                        {
                                          label: '按钮组选择',
                                          value: 'button-group-select'
                                        },
                                        {
                                          label: '平铺列表选择',
                                          value: 'list-select'
                                        },
                                        {
                                          label: '级联查询',
                                          value: 'hierarchicalQueries',
                                          disabled: true
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && this.config.quickEdit",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && this.config.quickEdit",
                                      label: '关联新建',
                                      type: 'switch',
                                      name: 'config.quickEditSettings.inputCreateable',
                                      value: false
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && this.config.quickEdit",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && this.config.quickEdit",
                                      label: '关联编辑',
                                      type: 'switch',
                                      name: 'config.quickEditSettings.inputEditable',
                                      value: false
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && (this.config.quickEditSettings.inputCreateable || this.config.quickEditSettings.inputEditable) && this.config.quickEdit",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && (this.config.quickEditSettings.inputCreateable || this.config.quickEditSettings.inputEditable || this.config.quickEditSettings.inputRemovable) && this.config.quickEdit",
                                      label: '关联字段选择',
                                      inline: false,
                                      type: 'checkboxes',
                                      defaultCheckAll:true,
                                      id: 'config.quickEditSettings.inputColumnss',
                                      name: 'config.quickEditSettings.inputColumnss',
                                      // "name": "config.quickEditSettings.inputColumns",
                                      source: '${ss:inputData}',
                                      value: '${ss:inputDatas}',
                                      labelField: 'name',
                                      valueField: 'queryKey'
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && this.config.quickEdit",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && this.config.quickEdit",
                                      label: '关联删除',
                                      type: 'switch',
                                      name: 'config.quickEditSettings.inputRemovable',
                                      value: false
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && this.config.quickEditSettings.inputType == 'select' && this.config.quickEdit",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && this.config.quickEditSettings.inputType == 'dropdownSelect' && this.config.quickEdit",
                                      type: 'combo',
                                      name: 'config.quickEditSettings.autoFills',
                                      id: 'config.quickEditSettings.autoFills',
                                      strictMode: false,
                                      addable: true,
                                      multiple: true,
                                      label: '自动填充',
                                      items: [
                                        {
                                          type: 'select',
                                          name: 'from',
                                          placeholder: '请选择',
                                          labelField: 'name',
                                          valueField: 'queryKey',
                                          // valueField: 'code',
                                          source: '${ss:formData}'
                                        },
                                        {
                                          type: 'select',
                                          name: 'to',
                                          placeholder: '请选择',
                                          labelField: 'name',
                                          valueField: 'queryKey',
                                          // valueField: 'code',
                                          source: '${ss:puFieldCruds}'
                                        }
                                        // {
                                        //     "name": "platform",
                                        //     "label": "平台",
                                        //     "type": "input-text"
                                        // },
                                        // {
                                        //     "name": "version",
                                        //     "label": "版本",
                                        //     "type": "input-text"
                                        // }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  visibleOn:"!this.needHaveId",
                                  type: 'collapse',
                                  key: '3',
                                  header: '默认输入',
                                  body: [
                                    {
                                      visibleOn:
                                        "this.relationMode == '0' && this.inverseSideKey",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE'",
                                      label: '输入形式',
                                      type: 'select',
                                      value: 'embed',
                                      name: 'config.inputType',
                                      options: [
                                        {
                                          label: '内嵌',
                                          value: 'embed'
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '0' && !this.inverseSideKey",
                                      // "visibleOn": "this.relationMode == 'ONE_ONE'",
                                      label: '输入形式',
                                      type: 'select',
                                      value: 'embed',
                                      name: 'config.inputType',
                                      options: [
                                        {
                                          label: '内嵌',
                                          value: 'embed'
                                        },
                                        {
                                          label: '下拉关联',
                                          value: 'select'
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn: "this.relationMode == '1'",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE'",
                                      label: '输入形式',
                                      type: 'select',
                                      name: 'config.inputType',
                                      value: 'select',
                                      // "value": "dropdownSelect",
                                      options: [
                                        {
                                          label: '下拉选择框',
                                          value: 'select'
                                          // "value": "dropdownSelect"
                                        },
                                        {
                                          label: '单选按钮',
                                          value: 'radios'
                                        },
                                        {
                                          label: '按钮组选择',
                                          value: 'button-group-select'
                                        },
                                        {
                                          label: '平铺列表选择',
                                          value: 'list-select'
                                        },
                                        {
                                          label: '级联查询',
                                          value: 'hierarchicalQueries',
                                          disabled: true
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '2'",
                                        // "this.relationMode == '2' && this.targetType == 0",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE'",
                                      label: '输入形式',
                                      type: 'select',
                                      name: 'config.inputType',
                                      value: 'combo',
                                      options: [
                                        {
                                          label: '组合',
                                          value: 'combo'
                                        },
                                        {
                                          label: '表格编辑',
                                          value: 'table'
                                        },
                                        {
                                          label: '下拉选择框',
                                          value: 'select'
                                        },
                                        {
                                          label: '复选框',
                                          value: 'checkboxes'
                                        },
                                        {
                                          label: '平铺列表选择',
                                          value: 'list-select'
                                        },
                                        {
                                          label: '表格选择',
                                          value: 'picker'
                                        }
                                      ],
                                      onEvent: {
                                        change: {
                                          actions: [
                                            {
                                              actionType: 'custom',
                                              script: function (
                                                _: any,
                                                doAction: any,
                                                event: any
                                              ) {
                                                console.log(_, '__');
                                                console.log(
                                                  doAction,
                                                  'doActiondoAction'
                                                );
                                                console.log(
                                                  event,
                                                  'eventevent'
                                                );
                                                if (
                                                  event.data.value == 'picker'
                                                ) {
                                                  // setTimeout(() => {
                                                    doAction({
                                                      actionType: 'setValue',
                                                      componentId: 'tableId',
                                                      args: {
                                                        value: false
                                                      }
                                                    });
                                                  // }, 1000);
                                                } else {
                                                  doAction({
                                                    actionType: 'setValue',
                                                    componentId: 'tableId',
                                                    args: {
                                                      value: true
                                                    }
                                                  });
                                                }
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    },
                                    {
                                      visibleOn: "this.relationMode == '3'",
                                      // "visibleOn": "this.relationMode == 'MORE_MORE'",
                                      label: '输入形式',
                                      type: 'select',
                                      name: 'config.inputType',
                                      value: 'picker',
                                      options: [
                                        {
                                          label: '组合',
                                          value: 'combo'
                                        },
                                        {
                                          label: '表格编辑',
                                          value: 'table'
                                        },
                                        {
                                          label: '下拉选择框',
                                          value: 'select'
                                        },
                                        {
                                          label: '复选框',
                                          value: 'checkboxes'
                                        },
                                        {
                                          label: '平铺列表选择',
                                          value: 'list-select'
                                        },
                                        {
                                          label: '表格选择',
                                          value: 'picker'
                                        }
                                      ]
                                    },
                                    {
                                      visibleOn: "this.relationMode == '3'",
                                      // "visibleOn": "this.relationMode == 'MORE_MORE'",
                                      label: '关联字段',
                                      type: 'checkboxes',
                                      defaultCheckAll:true,
                                      id: 'config.inputColumnss',
                                      name: 'config.inputColumnss',
                                      source: '${ss:inputData}',
                                      value: '${ss:inputDatass}',
                                      labelField: 'name',
                                      valueField: 'queryKey'
                                      // valueField: 'code'
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '2' && (this.config.inputType == 'picker' || this.inputType == 'picker')",
                                      label: '可否新建',
                                      type: 'switch',
                                      name: 'config.inputCreateable',
                                      id: 'tableId',
                                      disabled: true,
                                      value: false
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '2' && this.config.inputType != 'picker'",
                                      label: '可否新建',
                                      type: 'switch',
                                      id: 'tableId',
                                      name: 'config.inputCreateable',
                                      value: true
                                    },
                                    {
                                      visibleOn: "this.relationMode == '3'",
                                      label: '可否新建',
                                      type: 'switch',
                                      id: 'tableId',
                                      name: 'config.inputCreateable',
                                      value: true
                                    },
                                    {
                                      visibleOn: "this.relationMode == '2'",
                                      // "visibleOn": "this.relationMode == '2' && this.config.inputType=='table'",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE' && this.config.inputType=='table'",
                                      label: '可否编辑',
                                      type: 'switch',
                                      name: 'config.inputEditable',
                                      value: true
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '3' && (this.config.inputType=='table' || this.config.inputType=='select')",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE' && this.config.inputType=='table'",
                                      label: '可否编辑',
                                      type: 'switch',
                                      name: 'config.inputEditable',
                                      value: true
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '3' || this.relationMode == '2'",
                                      // "visibleOn": "this.relationMode == 'MORE_MORE' || this.relationMode == 'ONE_MORE'",
                                      label: '可否删除',
                                      type: 'switch',
                                      name: 'config.inputRemovable',
                                      value: true
                                    },
                                    {
                                      visibleOn: "this.relationMode == '2'",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE'",
                                      // "visibleOn": "this.relationMode == 'ONE_MORE' && this.inputCreateable",
                                      label: '关联字段',
                                      type: 'checkboxes',
                                      defaultCheckAll:true,
                                      id: 'config.inputColumnss',
                                      name: 'config.inputColumnss',
                                      source: '${ss:inputData}',
                                      value: '${ss:inputDatass}',
                                      labelField: 'name',
                                      valueField: 'queryKey'
                                      // valueField: 'code'
                                    },
                                    {
                                      visibleOn: "this.relationMode == '1'",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE'",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' || this.relationMode == 'ONE_MORE'",
                                      label: '关联新建',
                                      type: 'switch',
                                      name: 'config.inputCreateable',
                                      value: false
                                    },
                                    {
                                      visibleOn: "this.relationMode == '1'",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE'",
                                      label: '关联编辑',
                                      type: 'switch',
                                      name: 'config.inputEditable',
                                      value: false
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && (this.config.inputCreateable || this.config.inputEditable)",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && (this.config.inputCreateable || this.config.inputEditable || this.config.inputRemovable)",
                                      label: '关联字段选择',
                                      type: 'checkboxes',
                                      defaultCheckAll:true,
                                      inline: false,
                                      id: 'config.inputColumnss',
                                      name: 'config.inputColumnss',
                                      source: '${ss:inputData}',
                                      value: '${ss:inputDatass}',
                                      labelField: 'name',
                                      valueField: 'queryKey'
                                      // valueField: 'code'
                                    },
                                    {
                                      visibleOn: "this.relationMode == '1'",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE'",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' || this.relationMode == 'ONE_MORE'",
                                      label: '关联删除',
                                      type: 'switch',
                                      name: 'config.inputRemovable',
                                      value: false
                                    },
                                    {
                                      visibleOn:
                                        "this.relationMode == '1' && this.config.inputType == 'select'",
                                      // "visibleOn": "this.relationMode == 'MORE_ONE' && this.config.inputType == 'dropdownSelect'",
                                      type: 'combo',
                                      id: 'config.autoFills',
                                      name: 'config.autoFills',
                                      strictMode: false,
                                      addable: true,
                                      multiple: true,
                                      label: '自动填充',
                                      items: [
                                        {
                                          type: 'select',
                                          name: 'from',
                                          placeholder: '请选择',
                                          labelField: 'name',
                                          valueField: 'queryKey',
                                          // valueField: 'code',
                                          source: '${ss:formData}'
                                        },
                                        {
                                          type: 'select',
                                          name: 'to',
                                          placeholder: '请选择',
                                          labelField: 'name',
                                          valueField: 'queryKey',
                                          // valueField: 'code',
                                          source: '${ss:puFieldCruds}'
                                          // "source": "${ss:fieldCrud}",
                                        }
                                        // {
                                        //     "name": "platform",
                                        //     "label": "平台",
                                        //     "type": "input-text"
                                        // },
                                        // {
                                        //     "name": "version",
                                        //     "label": "版本",
                                        //     "type": "input-text"
                                        // }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          },
                          actions: [
                            {
                              type: 'button',
                              id: 'buttonID',
                              // "actionType": "confirm",
                              label: '确认',
                              close: false,
                              primary: true,
                              onEvent: {
                                click: {
                                  actions: [
                                    {
                                      actionType: 'custom',
                                      script: function (
                                        _: any,
                                        doAction: any,
                                        event: any
                                      ) {
                                        console.log('修改关系设置');
                                        console.log(_, '____');
                                        console.log(doAction,'doActiondoActiondoActiondoAction');
                                        console.log(event,'eventeventeventevent');
                                        // if (event.data.relationMode != 3) {
                                          doAction({
                                            actionType: 'validate',
                                            componentId: 'rationForm',
                                            outputVar: 'validateResult'
                                          });
                                        // }
                                        doAction({
                                          actionType: 'disabled',
                                          componentId: 'rationForm'
                                        });
                                        doAction({
                                          actionType: 'disabled',
                                          componentId: 'buttonID'
                                        });

                                        setTimeout(() => {
                                          if (
                                            event.data?.validateResult?.error ==
                                            '依赖的部分字段没有通过验证'
                                          ) {
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'rationForm'
                                            });
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'buttonID'
                                            });
                                            return;
                                          }
                                          console.log(middleData, 'middleData');
                                          if (middleData.editCode) {
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'rationForm'
                                            });
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'buttonID'
                                            });
                                            return;
                                          }
                                          if (middleData.editName) {
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'rationForm'
                                            });
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'buttonID'
                                            });
                                            return;
                                          }
                                          if (middleData.joinTableCode) {
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'rationForm'
                                            });
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'buttonID'
                                            });
                                            return;
                                          }
                                          if (middleData.joinColumnCode) {
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'rationForm'
                                            });
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'buttonID'
                                            });
                                            return;
                                          }
                                          if (middleData.inverseJoinColumnCode) {
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'rationForm'
                                            });
                                            doAction({
                                              actionType: 'enabled',
                                              componentId: 'buttonID'
                                            });
                                            return;
                                          }
                                          // 修改外键 关联字段集合列表相应数据的code name修改
                                          let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                          let fieldData1 = fieldData.map(
                                            (res: any) => {
                                              // console.log(event.data.__super.foreignKeyCode,
                                              //   'event.data.__super.foreignKeyCode');
                                              // console.log(event.data.__super.code,'event.data.__super.code');
                                              // console.log(event.data.code,'event.data.code');
                                              // console.log(res.code == event.data.__super.foreignKeyCode,
                                              //   'res.code == event.data.__super.foreignKeyCode');
                                              // console.log(res.code == event.data.__super.code,
                                              //   'res.code == event.data.__super.code');
                                              // console.log(res.code == event.data.code,
                                              //   'res.code == event.data.code');
                                              // if (event.data.__super.code) {
                                              // if (res.code == event.data.__super.foreignKey && res.foreignKeyFlag) {
                                              if (res.code == event.data.__super.__super.foreignKeyCode && res.foreignKeyFlag) {
                                                console.log('进入');
                                                // if (res.queryKey == event.data.fieldKey && res.foreignKeyFlag) {
                                                return {
                                                  ...res,
                                                  // code: event.data.foreignKey,
                                                  // name: event.data.foreignKey
                                                  code: event.data.foreignKeyCode,
                                                  name: event.data.foreignKeyCode,
                                                  nullable: event.data.nullable
                                                };
                                              } else if (
                                                res.code == event.data.__super.__super.code &&
                                                res.code != event.data.code &&
                                                res.type == 'relation'
                                              ) {
                                                console.log('进入1');
                                                return {
                                                  ...res,
                                                  code: event.data.code,
                                                  name: event.data.name,
                                                  nullable: event.data.nullable
                                                };
                                              } else if (
                                                res.code == event.data.code &&
                                                res.type == 'relation'
                                              ) {
                                                console.log('进入2');
                                                return {
                                                  ...res,
                                                  name: event.data.name,
                                                  nullable: event.data.nullable
                                                };
                                              } else {
                                                console.log('进入3');
                                                return res;
                                              }
                                            }
                                          );
                                          fieldData1.forEach(
                                            (element: any, index: number) => {
                                              element.sort = index + 1;
                                            }
                                          );
                                          let fieldCruds = fieldData1.map(
                                            (res: any) => {
                                              // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                              if (
                                                res.type != 'relation' &&
                                                res.systemFieldType != 6 &&
                                                res.systemFieldType != 7 &&
                                                res.systemFieldType != 8 &&
                                                res.systemFieldType != 9 && res.type != 'formula'
                                              ) {
                                                return res;
                                              }
                                            }
                                          );
                                          let puFieldCruds = fieldData1.map(
                                            (res: any) => {
                                              if (
                                                !res.foreignKeyFlag &&
                                                res.systemFieldType == 0 &&
                                                res.type != 'relation'
                                              ) {
                                                return res;
                                              }
                                            }
                                          );
                                          let fieldKeyCruds = fieldData1.map(
                                            (res: any) => {
                                              if (
                                                res.type != 'relation' &&
                                                res.type != 'formula' &&
                                                res.type != 'textarea' &&
                                                res.type != 'rich-text' &&
                                                res.type != 'json' &&
                                                res.type != 'attachment' &&
                                                res.type != 'image' &&
                                                res.type != 'ciphertext' &&
                                                res.type != 'users'
                                              ) {
                                                if (
                                                  res.type == 'text' &&
                                                  res.config.length < 768
                                                ) {
                                                  return res;
                                                } else if (res.type != 'text') {
                                                  return res;
                                                }
                                              }
                                            }
                                          );
                                          let waiList = fieldData1.filter(
                                            (res: any) => {
                                              if (
                                                res.type == 'text' &&
                                                res.config.length >= 20 && res.systemFieldType == 0
                                              ) {
                                                return res;
                                              } else if (
                                                res.type == 'int' &&
                                                res.systemFieldType == 0 &&
                                                res.config.dbType ==
                                                  'BIGINT'
                                              ) {
                                                return res;
                                              }
                                            }
                                          );
                                          sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                          sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                                          sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                                          sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                                          sessionStorage.setItem('fieldCrud',JSON.stringify(fieldData1));
                                          let formulArr: any[] = [];
                                          fieldData1.forEach((item: any) => {
                                            if (
                                              item.type != 'formula' &&
                                              item.systemFieldType != 6 &&
                                              item.systemFieldType != 7 &&
                                              item.systemFieldType != 8 &&
                                              item.systemFieldType != 9
                                            ) {
                                              formulArr.push({...item,label:item.name,value:item.code});
                                            }
                                          });
                                          sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'myField',
                                            args: {
                                              value: {
                                                items: fieldData1
                                              }
                                            }
                                          });
                                          let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                          let data1 = affData.map(
                                            (element: any) => {
                                              if (element.needId) {
                                                if (element.needId == event.data.needId) {
                                                  let nsod = event.data.validateResult ? event.data.validateResult.payload : event.data;
                                                  let data = {
                                                    ...element,
                                                    ...nsod,
                                                    foreignKeyCode:
                                                      nsod.foreignKeyCode
                                                        ? nsod.foreignKeyCode
                                                        : inverseJoinColumnCodes,
                                                    foreignKeyKey:
                                                      nsod.joinColumnAtTarget
                                                        ? inverseJoinColumnKeys == null ? nsod.foreignKeyKey : inverseJoinColumnKeys
                                                        : undefined
                                                  };
                                                  if (data.config?.displayColumns || data.config?.displayColumns == '') {
                                                    if (data.config?.displayColumns == '') {
                                                      let asrr = JSON.parse(sessionStorage.getItem('affevtData')!);
                                                      let asrrs: any = [];
                                                      if(asrr && asrr.length<0){
                                                      asrr.forEach(
                                                        (element: any) => {
                                                          asrrs.push(
                                                            element.queryKey
                                                            // element.code
                                                          );
                                                        }
                                                      );
                                                      }
                                                      data.config.displayColumns = asrrs.length==0?null:asrrs;
                                                    } else {
                                                      if (typeof data.config?.displayColumns != 'string') {
                                                        let retuData:any = []
                                                        retuData = data.config.displayColumns.map(
                                                            (col: any) => {
                                                              return col.queryKey ==
                                                                null
                                                                ? col
                                                                : col.queryKey;
                                                                // : col.code;
                                                            }
                                                          );
                                                        data.config.displayColumns = retuData.length==0?null:retuData
                                                      } else {
                                                        let needD = []
                                                        needD =  data.config.displayColumns.split(
                                                            ','
                                                          );
                                                        data.config.displayColumns =
                                                          needD.length==0?null:needD;
                                                      }
                                                    }
                                                  }
                                                  if (
                                                    event.data.relationMode !=
                                                      3 &&
                                                    event.data.relationMode !=
                                                      0 &&
                                                    event.data.relationMode != 2
                                                  ) {
                                                    if (
                                                      data.config?.quickEditSettings?.inputColumnss || data.config
                                                        ?.quickEditSettings
                                                        ?.inputColumnss == ''
                                                    ) {
                                                      if (data.config?.quickEditSettings?.inputColumnss == '') {
                                                        let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                                                        let asrrs: any = [];
                                                        asrr.forEach(
                                                          (element: any) => {
                                                            asrrs.push(
                                                              element.queryKey
                                                              // element.code
                                                            );
                                                          }
                                                        );
                                                        data.config.quickEditSettings.inputColumns = asrrs.length==0?null:asrrs;
                                                      } else {
                                                        if (typeof data.config.quickEditSettings.inputColumnss =='string') {
                                                          let ratData = []
                                                          ratData = data.config.quickEditSettings.inputColumnss.split(',');
                                                          data.config.quickEditSettings.inputColumns = ratData.length==0?null:ratData
                                                        } else {
                                                          let needDat: any[] = [];
                                                          data.config.quickEditSettings.inputColumnss.forEach(
                                                            (it: any) => {
                                                              needDat.push(it.queryKey==null?it:it.queryKey);
                                                            }
                                                          );
                                                          console.log(needDat,'needDatneedDat');
                                                          data.config.quickEditSettings.inputColumns = needDat.length==0?null:needDat;
                                                        }
                                                      }
                                                    }
                                                  }
                                                  if (event.data.relationMode != 0) {
                                                    if (data.config?.inputColumnss || data.config?.inputColumnss == '') {
                                                      if (data.config.inputColumnss == '') {
                                                        let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                                                        let asrrs: any = [];
                                                        asrr.forEach(
                                                          (element: any) => {
                                                            asrrs.push(
                                                              element.queryKey
                                                              // element.code
                                                            );
                                                          }
                                                        );
                                                        data.config.inputColumns = asrrs.length==0?null:asrrs;
                                                      } else {
                                                        if (typeof data.config.inputColumnss == 'string') {
                                                          let retunData = []
                                                          retunData = data.config.inputColumnss.split(',');
                                                          data.config.inputColumns = retunData.length==0?null:retunData
                                                        } else {
                                                          let art: any[] = [];
                                                          data.config.inputColumnss.forEach(
                                                            (res: any) => {
                                                              if (res === null) {
                                                                console.log("null");
                                                              } else if (typeof res === "string") {
                                                                console.log("string");
                                                                art.push(res)
                                                              } else if (typeof res === "object" && res !== null) {
                                                                console.log("object");
                                                                art.push(res.queryKey)
                                                              }
                                                            }
                                                          );
                                                          data.config.inputColumns = art.length==0?null:art;
                                                          // data.config.inputColumns = art.join(',')
                                                        }
                                                      }
                                                    }
                                                  }
                                                  if(data.relationMode == 3){
                                                    if(data.config && data.config.inputType!="table" && data.config.inputType!="select"){
                                                      data.config.inputEditable = true
                                                    }
                                                  }
                                                  return {
                                                    ...data
                                                  };
                                                } else {
                                                  return element;
                                                }
                                              } else {
                                                if (element.queryKey == event.data.queryKey) {
                                                  console.log('存在queryKey');
                                                  let nsod = event.data.validateResult
                                                    ? event.data.validateResult.payload
                                                    : event.data;
                                                  let data = {
                                                    ...element,
                                                    ...nsod,
                                                    foreignKeyCode:nsod.foreignKeyCode
                                                        ? event.data.foreignKeyCode
                                                        : inverseJoinColumnCodes,
                                                    foreignKeyKey:
                                                      nsod.joinColumnAtTarget
                                                        ?  inverseJoinColumnKeys == null ? nsod.foreignKeyKey : inverseJoinColumnKeys : undefined
                                                  };
                                                  data = JSON.parse(JSON.stringify(data))
                                                  if (data.config?.displayColumns || data.config?.displayColumns == '') {
                                                    if (data.config?.displayColumns == '') {
                                                      let asrr = JSON.parse(sessionStorage.getItem('affevtData')!);
                                                      let asrrs: any = [];
                                                      if(asrr && asrr.length>0){
                                                      asrr.forEach(
                                                        (element: any) => {
                                                          asrrs.push(
                                                            element.queryKey
                                                            // element.code
                                                          );
                                                        }
                                                      );
                                                      }
                                                      data.config.displayColumns = asrrs.length==0?null:asrrs;
                                                    } else {
                                                      if (typeof data.config?.displayColumns != 'string') {
                                                        let returnData:any = []
                                                        returnData =
                                                          data.config.displayColumns.map(
                                                            (col: any) => {
                                                              return col.code == null
                                                                ? col : col.queryKey;
                                                                // ? col : col.code;
                                                            }
                                                          );
                                                        data.config.displayColumns = returnData.length==0?null:returnData
                                                      } else {
                                                        let needD = []
                                                        needD = data.config.displayColumns.split(',');
                                                        data.config.displayColumns = needD.length==0?null:needD;
                                                      }
                                                    }
                                                  }
                                                  if (event.data.relationMode != 3 &&
                                                    event.data.relationMode != 0 &&
                                                    event.data.relationMode != 2) {
                                                    if (data.config?.quickEditSettings?.inputColumnss ||
                                                      data.config?.quickEditSettings?.inputColumnss == '') {
                                                      if (data.config?.quickEditSettings?.inputColumnss == '') {
                                                        let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                                                        let asrrs: any = [];
                                                        asrr.forEach(
                                                          (element: any) => {
                                                            asrrs.push(element.queryKey);
                                                            // asrrs.push(element.code);
                                                          }
                                                        );
                                                        data.config.quickEditSettings.inputColumns = asrrs.length==0?null:asrrs;
                                                      } else {
                                                        console.log('进入11111111111111');
                                                        if (typeof data.config.quickEditSettings.inputColumnss =='string') {
                                                          let returnData:any = []
                                                          returnData = data.config.quickEditSettings.inputColumnss.split(',');
                                                          data.config.quickEditSettings.inputColumns = returnData.length==0?null:returnData
                                                        } else {
                                                          let needDat: any[] = [];
                                                          data.config.quickEditSettings.inputColumnss.forEach(
                                                            (it: any) => {
                                                              needDat.push(it.queryKey==null?it:it.queryKey
                                                                // it.code == null ? it : it.code
                                                              );
                                                            }
                                                          );
                                                          console.log(needDat,'needDatneedDat');
                                                          data.config.quickEditSettings.inputColumns = needDat.length==0?null:needDat;
                                                        }
                                                      }
                                                    }
                                                  }
                                                  if (event.data.relationMode != 0) {
                                                    if (data.config.inputColumnss || data.config.inputColumnss == ''                                                    ) {
                                                      console.log('进入');
                                                      if (data.config.inputColumnss == '') {
                                                        let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                                                        let asrrs: any = [];
                                                        asrr.forEach(
                                                          (element: any) => {
                                                            asrrs.push(element.queryKey);
                                                            // asrrs.push(element.code);
                                                          }
                                                        );
                                                        data.config.inputColumns = asrrs.length==0?null:asrrs;
                                                      } else {
                                                        if (typeof data.config.inputColumnss == 'string') {
                                                          let returnData:any = []
                                                          returnData = data.config.inputColumnss.split(',');
                                                          data.config.inputColumns = returnData.length==0?null:returnData
                                                        } else {
                                                          let art: any[] = [];
                                                          data.config.inputColumnss.forEach(
                                                            (res: any) => {
                                                              if (res === null) {
                                                                console.log("null");
                                                              } else if (typeof res === "string") {
                                                                console.log("string");
                                                                art.push(res)
                                                              } else if (typeof res === "object" && res !== null) {
                                                                console.log("object");
                                                                art.push(res.queryKey)
                                                              }
                                                            }
                                                          );
                                                          data.config.inputColumns = art.length==0?null:art;
                                                          // data.config.inputColumns = art.join(',')
                                                        }
                                                      }
                                                    }
                                                  }
                                                  console.log(data, 'datadata');
                                                  if(data.relationMode == 3){
                                                    if(data.config && data.config.inputType!="table" && data.config.inputType!="select"){
                                                      data.config.inputEditable = true
                                                    }
                                                  }
                                                  return {
                                                    ...data
                                                  };
                                                } else {
                                                  return element;
                                                }
                                              }
                                            }
                                          );
                                          if(event.data.relationMode=='3' && event.data.withCustomProps){
                                            data1 = data1.map((resk:any,index: number)=>{
                                              let returnResk = {...resk,
                                                sort: index + 1
                                              }
                                              if(event.data.joinTableKey){
                                                if(resk.targetKey == event.data.joinTableKey
                                                  && resk.relationMode == 2){
                                                    returnResk.targetCode = event.data.joinTableCode
                                                    returnResk.targetName = event.data.joinTableCode
                                                }
                                              }else{
                                                if(resk.targetCode == event.data.__super.__super.joinTableCode
                                                && resk.relationMode == 2){
                                                  returnResk.targetCode = event.data.joinTableCode
                                                  returnResk.targetName = event.data.joinTableCode
                                                }
                                              }
                                              // if(resk.needId){
                                              //   delete returnResk.config;
                                              // }
                                              return returnResk
                                            })
                                          }
                                          sessionStorage.setItem('affectCrud',JSON.stringify(data1));
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'affectCrud',
                                            args: {
                                              value: {
                                                items: data1
                                              }
                                            }
                                          });
                                          doAction({
                                            actionType: 'reload',
                                            componentId: 'nameField'
                                          });
                                          let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
                                          if (neKeyData.length > 0) {
                                            let neKeyData2 = neKeyData.map(
                                              (dshj: any) => {
                                                  let daij = {...dshj};
                                                  let nsod = event.data.validateResult
                                                    ? event.data.validateResult.payload
                                                    : event.data;
                                                if (
                                                  event.data.foreignKeyCode &&
                                                  nsod.foreignKeyCode != nsod.__super.foreignKeyCode
                                                ) {
                                                  if (
                                                    daij.columnNames.includes(nsod.__super.foreignKeyCode + ',') ||
                                                    daij.columnNames.includes(',' +nsod.__super.foreignKeyCode) ||
                                                    daij.columnNames == nsod.__super.foreignKeyCode
                                                  ) {
                                                    console.log(daij, '进入');
                                                    let samne = daij.columnNames.split(',');
                                                    let sjam: any = [];
                                                    samne.map((sj: any) => {
                                                      if (sj == nsod.__super.foreignKeyCode) {
                                                        sjam.push(nsod.foreignKeyCode);
                                                      } else {
                                                        sjam.push(sj);
                                                      }
                                                    });
                                                    console.log(sjam, 'sjam');
                                                    daij.columnNames = sjam.join(',');
                                                  }
                                                  console.log(daij,'daijdaijdaij');
                                                  return daij;
                                                } else {
                                                  return dshj;
                                                }
                                              }
                                            );
                                            let deleteCode: any[] = [];
                                            const systemFieldTypes = [1, 6, 8, 9];
                                            deleteCode = fieldData1
                                              .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                              .map(item => item.code);
                                            const blackListFields = new Set([
                                              'id',
                                              'deleted',
                                              'deletedAt',
                                              ...deleteCode
                                            ]);
                                            let fieldDataesa = neKeyData2.filter((res: any) => {
                                              const { columnNames } = res;
                                              if (!columnNames) return false;
                                              const allInBlacklist = columnNames.split(',').every(field => blackListFields.has(field));
                                              if(res.uniqueFlag){
                                                return !allInBlacklist;
                                              }else{
                                                return true
                                              }
                                            });
                                            let fieldDataesae =
                                              fieldDataesa.map(
                                                (res: any, index: number) => {
                                                  return {
                                                    ...res,
                                                    sort: index + 1,
                                                    columnNames:processIndexFields(res.columnNames,fieldData1)
                                                  };
                                                }
                                              );
                                            sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataesae));
                                            doAction({
                                              actionType: 'setValue',
                                              componentId: 'keyCrud',
                                              args: {
                                                value: {
                                                  items: fieldDataesae
                                                }
                                              }
                                            });
                                          }
                                          console.log('进入111');
                                          doAction({
                                            actionType: 'close',
                                            componentId: 'uploadAffect'
                                          });
                                        }, 1000);
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
                label: '删除',
                type: 'button',
                level: 'link',
                onEvent: {
                  click: {
                    actions: [
                      {
                        actionType: 'custom',
                        script: function (
                          _: any,
                          doAction: any,
                          event: any
                        ) {
                          console.log(event,'eventeventeventeventevent')

                          let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                          let haveWai = fieldData.filter(res=>{
                            return res.code == event.data.foreignKeyCode
                          })
                          console.log(haveWai,'haveWai')
                          if(haveWai.length==0){
                            haveWail = true
                          }else{
                            haveWail = false
                          }
                        }
                      }
                    ]
                  }
                },
                actionType: 'dialog',
                dialog: {
                  title: '删除',
                  id: 'deleteDialogId',
                  body: {
                    type: 'mapping',
                    value: '1',
                    map: {
                      '1': '您确认要删除${fkModel.keyName}?'
                    }
                  },
                  actions: [{
                    "type": "service",
                    onEvent: {
                      init: {
                        actions: [
                          {
                            actionType: 'custom',
                            script: function (
                              _: any,
                              doAction: any,
                              event: any
                            ) {
                              console.log(event,'初始化')
                              console.log(event.data.id,'ssss')
                              let affectData = JSON.parse(sessionStorage.getItem('affectCrud')!);
                              let idEdit = affectData.filter(res=>{
                                return res.queryKey == event.data.queryKey && res.id
                              })
                              if(!haveWail){
                                doAction({
                                  actionType: 'show',
                                  componentId: 'baoId',
                                });
                                doAction({
                                  actionType: 'show',
                                  componentId: 'shanId',
                                });
                                doAction({
                                  actionType: 'hidden',
                                  componentId: 'shanZiId',
                                });
                                doAction({
                                  actionType: 'hidden',
                                  componentId: 'shanImplicitId',
                                });
                                doAction({
                                  actionType: 'hidden',
                                  componentId: 'shanMiddleId',
                                });
                              }else{
                                doAction({
                                  actionType: 'hidden',
                                  componentId: 'baoId',
                                });
                                doAction({
                                  actionType: 'hidden',
                                  componentId: 'shanId',
                                });
                                if(event.data.relationMode == '3' && !event.data.withCustomProps && idEdit.length>0){
                                  doAction({
                                    actionType: 'show',
                                    componentId: 'shanImplicitId',
                                  });
                                  doAction({
                                    actionType: 'show',
                                    componentId: 'shanMiddleId',
                                  });
                                  doAction({
                                    actionType: 'hidden',
                                    componentId: 'shanZiId',
                                  });
                                }else{
                                  doAction({
                                    actionType: 'hidden',
                                    componentId: 'shanMiddleId',
                                  });
                                  doAction({
                                    actionType: 'hidden',
                                    componentId: 'shanImplicitId',
                                  });
                                  doAction({
                                    actionType: 'show',
                                    componentId: 'shanZiId',
                                  });
                                }
                              }
                            }
                          }
                        ]
                      }
                    },
                    body:[
                      {
                      id:"baoId",
                      type: 'button',
                      label: '保留外键字段',
                      onEvent: {
                        click: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log(_, '_保留外键字段');
                                console.log(doAction, 'doAction保留外键字段');
                                console.log(event, 'event保留外键字段');
                                let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                let data4 = data1.filter((res: any) => {
                                  // return res.code != event.data.code
                                  if (event.data.needId) {
                                    return res.needId != event.data.needId;
                                  } else {
                                    return res.id != event.data.id;
                                  }
                                });
                                data4.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                sessionStorage.setItem('affectCrud',JSON.stringify(data4));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'affectCrud',
                                  args: {
                                    value: {
                                      items: data4
                                    }
                                  }
                                });
                                let data = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                let data2 = data.map((res: any) => {
                                  if (event.data.foreignKeyCode == res.code) {
                                    if (res.type == 'int') {
                                      console.log('shjbsjahbdashjkdb');
                                      return {
                                        ...res,
                                        defaultValueMode: 'static',
                                        defaultValue: 0,
                                        foreignKeyFlag: false,
                                        config: {
                                          ...res.config,
                                          nullable: res.nullable,
                                          defaultValueMode: 'static',
                                          defaultValue: 0
                                        }
                                      };
                                    } else {
                                      return {
                                        ...res,
                                        foreignKeyFlag: false,
                                        config: {
                                          ...res.config,
                                          nullable: res.nullable
                                        }
                                      };
                                    }
                                  } else {
                                    return res;
                                  }
                                });
                                console.log(data2, 'data2data2data2');
                                let yuanData: any;
                                if (sessionStorage.getItem('yuanData')!) {
                                  yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
                                }
                                let data3: any[] = [];
                                data2.forEach((ress: any) => {
                                  if (!event.data.foreignKeyFlag) {
                                    if (event.data.__super.foreignKeyCode) {
                                      console.log(yuanData, '进入');
                                      let haveData: any = {};
                                      if (yuanData) {
                                        yuanData.forEach((siw: any) => {
                                          if (ress.needId) {
                                            if (
                                              siw.needId == ress.needId &&
                                              ress.systemFieldType == 0 &&
                                              ress.type != 'relation'
                                            ) {
                                              // return siw
                                              haveData = siw;
                                            }
                                          }
                                        });
                                      }
                                      if (JSON.stringify(haveData) === '{}') {
                                        console.log(ress,'进入保留');
                                        if(ress.type == 'relation' && ress.code == event.data.__super.code){
                                        }else  {
                                          data3.push(ress);
                                        }
                                      } else {
                                        console.log('进入1');
                                        console.log(haveData, 'haveData[0]');
                                        if (haveData.type == 'int') {
                                          data3.push({
                                            ...haveData,
                                            defaultValueMode: 'static',
                                            defaultValue: 0,
                                            foreignKeyFlag: false,
                                            config: {
                                              ...haveData.config,
                                              nullable: haveData.nullable,
                                              defaultValueMode: 'static',
                                              defaultValue: 0
                                            }
                                          });
                                        } else {
                                          data3.push(haveData);
                                        }
                                      }
                                    } else if (
                                      event.data.inverseSideKey != null &&
                                      ress.type == 'relation' &&
                                      (ress.needId || ress.id)
                                    ) {
                                      console.log('进入1');
                                      if (ress.code != event.data.code) {
                                        data.push(ress);
                                      }
                                      // return res.code != event.data.code
                                    } else {
                                      console.log('进入2');
                                      if (event.data.id) {
                                        if (ress.id != event.data.id) {
                                          data.push(ress);
                                        }
                                        // return res.id != event.data.id
                                      } else {
                                        if (ress.needId != event.data.needId) {
                                          data.push(ress);
                                        }
                                        // return res.needId != event.data.needId
                                      }
                                    }
                                  }
                                });
                                sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'myField',
                                  args: {
                                    value: {
                                      items: data3
                                    }
                                  }
                                });
                                doAction({
                                  actionType: 'reload',
                                  componentId: 'nameField'
                                });
                                doAction({
                                  actionType: 'closeDialog',
                                  componentId: 'deleteDialogId'
                                });
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      id:"shanId",
                      type: 'button',
                      label: '删除外键字段',
                      level: 'primary',
                      onEvent: {
                        click: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log('删除关系设置');
                                console.log(_, '____');
                                console.log(
                                  doAction,
                                  'doActiondoActiondoActiondoAction'
                                );
                                console.log(event, 'eventeventeventevent');
                                let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                let data = data1.filter((res: any) => {
                                  // return res.code != event.data.code
                                  if (event.data.needId) {
                                    return res.needId != event.data.needId;
                                  } else {
                                    return res.id != event.data.id;
                                  }
                                });
                                data.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                sessionStorage.setItem('affectCrud',JSON.stringify(data));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'affectCrud',
                                  args: {
                                    value: {
                                      items: data
                                    }
                                  }
                                });
                                let data2 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                console.log(data2, 'ssssssssssss');
                                let yuanData: any;
                                if (sessionStorage.getItem('yuanData')!) {
                                  yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
                                }
                                let data3: any[] = [];
                                data2.forEach((ress: any) => {
                                  if (event.data.__super.foreignKeyCode) {
                                    console.log(yuanData, '进入');
                                    let haveData = {};
                                    if (yuanData) {
                                      yuanData.forEach((siw: any) => {
                                        if (ress.needId) {
                                          if (
                                            siw.needId == ress.needId &&
                                            ress.systemFieldType == 0 &&
                                            ress.type != 'relation'
                                          ) {
                                            // return siw
                                            haveData = siw;
                                          }
                                        }
                                      });
                                    }
                                    if (JSON.stringify(haveData) === '{}') {
                                      if(ress.type == 'relation' && ress.code == event.data.__super.code){
                                      } else if (ress.code != event.data.__super.foreignKeyCode) {
                                        data3.push(ress);
                                      }
                                    } else {
                                      console.log('进入1');
                                      console.log(haveData, 'haveData[0]');
                                      data3.push(haveData);
                                      // return haveData
                                    }
                                    // return res.queryKey != event.data.fieldKey
                                  } else if (
                                    event.data.inverseSideKey != null &&
                                    ress.type == 'relation' &&
                                    (ress.needId || ress.id)
                                  ) {
                                    console.log('进入1');
                                    if (ress.code != event.data.code) {
                                      data.push(ress);
                                    }
                                    // return res.code != event.data.code
                                  } else {
                                    console.log('进入2');
                                    if (event.data.id) {
                                      if (ress.id != event.data.id) {
                                        data.push(ress);
                                      }
                                      // return res.id != event.data.id
                                    } else {
                                      if (ress.needId != event.data.needId) {
                                        data.push(ress);
                                      }
                                      // return res.needId != event.data.needId
                                    }
                                  }
                                });
                                console.log(data3, 'data3data3data3');
                                data3.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                let fieldCruds = data3.map((res: any) => {
                                  // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                  if (res.type != 'relation' && res.systemFieldType != 6
                                    && res.systemFieldType != 7 && res.systemFieldType != 9
                                     && res.systemFieldType != 8 && res.type != 'formula') {
                                    return res;
                                  }
                                });
                                let puFieldCruds = data3.map((res: any) => {
                                  if (
                                    !res.foreignKeyFlag &&
                                    res.systemFieldType == 0 &&
                                    res.type != 'relation'
                                  ) {
                                    return res;
                                  }
                                });
                                let fieldKeyCruds = data3.map((res: any) => {
                                  if (
                                    res.type != 'relation' &&
                                    res.type != 'formula' &&
                                    res.type != 'textarea' &&
                                    res.type != 'rich-text' &&
                                    res.type != 'json' &&
                                    res.type != 'attachment' &&
                                    res.type != 'image' &&
                                    res.type != 'ciphertext' &&
                                    res.type != 'users'
                                  ) {
                                    if (
                                      res.type == 'text' &&
                                      res.config.length < 768
                                    ) {
                                      return res;
                                    } else if (res.type != 'text') {
                                      return res;
                                    }
                                  }
                                });
                                let waiList = data3.filter((res: any) => {
                                  if (
                                    res.type == 'text' &&
                                    res.config.length >= 20 && res.systemFieldType == 0
                                  ) {
                                    return res;
                                  } else if (
                                    res.type == 'int' &&
                                    res.systemFieldType == 0 &&
                                    res.config.dbType == 'BIGINT'
                                  ) {
                                    return res;
                                  }
                                });
                                sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                                sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                                sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                                sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
                                let formulArr: any[] = [];
                                data3.forEach((item: any) => {
                                  if (
                                    item.type != 'formula' &&
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9
                                  ) {
                                    formulArr.push({...item,label:item.name,value:item.code});
                                  }
                                });
                                sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'myField',
                                  args: {
                                    value: {
                                      items: data3
                                    }
                                  }
                                });
                                doAction({
                                  actionType: 'reload',
                                  componentId: 'nameField'
                                });
                                let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
                                console.log(neKeyData, 'neKeyDataneKeyData');
                                if (neKeyData.length > 0) {
                                  let neKeyData2 = neKeyData.map(
                                    (dshj: any) => {
                                      if (event.data.foreignKeyCode) {
                                        let daij = {...dshj};
                                        if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                                          daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                                          daij.columnNames == event.data.foreignKeyCode
                                        ) {
                                          console.log(daij, '进入');
                                          let samne = daij.columnNames.split(',');
                                          let sjam: any = [];
                                          sjam = samne.filter((sj: any) => {
                                            if (sj != event.data.foreignKeyCode) {
                                              return sj;
                                            }
                                          });
                                          console.log(sjam, 'sjam');
                                          daij.columnNames = sjam.join(',');
                                        }
                                        console.log(daij, 'daijdaijdaij');
                                        return daij;
                                      }
                                    }
                                  );
                                  let deleteCode: any[] = [];
                                  const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                                  deleteCode = data3
                                    .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                    .map(item => item.code);
                                  const blackListFields = new Set([
                                    'id',
                                    'deleted',
                                    'deletedAt',
                                    'deletedBy',
                                    'updatedAt',
                                    'createdAt',
                                    'createdBy',
                                    'updatedBy',
                                    ...deleteCode
                                  ]);
                                  let fieldDataes: any[] = [];
                                  neKeyData2.forEach((res: any) => {
                                    const { columnNames } = res;
                                    if (!columnNames) {
                                      return;
                                    }
                                    const fields = columnNames
                                      .split(',')
                                      .map(f => f.trim())
                                      .filter(Boolean);
                                    const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
                                    if (hasNonBlacklisted && !res.uniqueFlag) {
                                      fieldDataes.push(res);
                                    }else if(!res.uniqueFlag){
                                      fieldDataes.push(res);
                                    }
                                  });
                                  let fieldDataese = fieldDataes.map(
                                    (res: any, index: number) => {
                                      return {...res, sort: index + 1,
                                        columnNames:processIndexFields(res.columnNames,data3)
                                      };
                                    }
                                  );
                                  sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'keyCrud',
                                    args: {
                                      value: {
                                        items: fieldDataese
                                      }
                                    }
                                  });
                                  let nameFieldData = sessionStorage.getItem('nameFieldData')
                                  if (
                                    nameFieldData == event.data.foreignKeyCode
                                  ) {
                                    let ars = data3.filter(sc => {
                                      return sc.systemFieldType == 0;
                                    });
                                    console.log(ars, 'arsarsarsarsarsars');
                                    if (ars.length > 0) {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: ars[0].code
                                        }
                                      });
                                      // nameFieldData = ars[0].code;
                                      sessionStorage.setItem('nameFieldData', ars[0].code)
                                    } else {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: 'id'
                                        }
                                      });
                                      // nameFieldData = 'id';
                                      sessionStorage.setItem('nameFieldData', 'id')
                                    }
                                  }
                                }
                                doAction({
                                  actionType: 'closeDialog',
                                  componentId: 'deleteDialogId'
                                });
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      id:"shanImplicitId",
                      type: 'button',
                      label: '保留中间表',
                      level: 'primary',
                      onEvent: {
                        click: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log('删除关系设置');
                                console.log(_, '____');
                                console.log(
                                  doAction,
                                  'doActiondoActiondoActiondoAction'
                                );
                                console.log(event, 'eventeventeventevent');
                                let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                let data = data1.filter((res: any) => {
                                  if (event.data.needId) {
                                    return res.needId != event.data.needId;
                                  } else {
                                    return res.id != event.data.id;
                                  }
                                });
                                data.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                sessionStorage.setItem('affectCrud',JSON.stringify(data));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'affectCrud',
                                  args: {
                                    value: {
                                      items: data
                                    }
                                  }
                                });
                                let data2 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                console.log(data2, 'ssssssssssss');
                                let yuanData: any;
                                if (sessionStorage.getItem('yuanData')!) {
                                  yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
                                }
                                let data3: any[] = [];
                                data2.forEach((ress: any) => {
                                  if (event.data.__super.foreignKeyCode) {
                                    console.log(yuanData, '进入');
                                    let haveData = {};
                                    if (yuanData) {
                                      yuanData.forEach((siw: any) => {
                                        if (ress.needId) {
                                          if (
                                            siw.needId == ress.needId &&
                                            ress.systemFieldType == 0 &&
                                            ress.type != 'relation'
                                          ) {
                                            // return siw
                                            haveData = siw;
                                          }
                                        }
                                      });
                                    }
                                    if (JSON.stringify(haveData) === '{}') {
                                      console.log('进入');
                                      if (
                                        ress.code !=
                                          event.data.__super.foreignKeyCode &&
                                        ress.code != event.data.__super.code
                                      ) {
                                        data3.push(ress);
                                      }
                                      // return res.code != event.data.__super.foreignKeyCode && res.code != event.data.__super.code
                                    } else {
                                      console.log('进入1');
                                      console.log(haveData, 'haveData[0]');
                                      data3.push(haveData);
                                      // return haveData
                                    }
                                    // return res.queryKey != event.data.fieldKey
                                  } else if (
                                    event.data.inverseSideKey != null &&
                                    ress.type == 'relation' &&
                                    (ress.needId || ress.id)
                                  ) {
                                    console.log('进入1');
                                    if (ress.code != event.data.code) {
                                      data.push(ress);
                                    }
                                    // return res.code != event.data.code
                                  } else {
                                    console.log('进入2');
                                    if (event.data.id) {
                                      if (ress.id != event.data.id) {
                                        data.push(ress);
                                      }
                                      // return res.id != event.data.id
                                    } else {
                                      if (ress.needId != event.data.needId) {
                                        data.push(ress);
                                      }
                                      // return res.needId != event.data.needId
                                    }
                                  }
                                });
                                console.log(data3, 'data3data3data3');
                                data3.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                let fieldCruds = data3.map((res: any) => {
                                  // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                  if (res.type != 'relation' && res.systemFieldType != 6
                                    && res.systemFieldType != 7 && res.systemFieldType != 9
                                     && res.systemFieldType != 8 && res.type != 'formula') {
                                    return res;
                                  }
                                });
                                let puFieldCruds = data3.map((res: any) => {
                                  if (
                                    !res.foreignKeyFlag &&
                                    res.systemFieldType == 0 &&
                                    res.type != 'relation'
                                  ) {
                                    return res;
                                  }
                                });
                                let fieldKeyCruds = data3.map((res: any) => {
                                  if (
                                    res.type != 'relation' &&
                                    res.type != 'formula' &&
                                    res.type != 'textarea' &&
                                    res.type != 'rich-text' &&
                                    res.type != 'json' &&
                                    res.type != 'attachment' &&
                                    res.type != 'image' &&
                                    res.type != 'ciphertext' &&
                                    res.type != 'users'
                                  ) {
                                    if (
                                      res.type == 'text' &&
                                      res.config.length < 768
                                    ) {
                                      return res;
                                    } else if (res.type != 'text') {
                                      return res;
                                    }
                                  }
                                });
                                let waiList = data3.filter((res: any) => {
                                  if (
                                    res.type == 'text' &&
                                    res.config.length >= 20 && res.systemFieldType == 0
                                  ) {
                                    return res;
                                  } else if (
                                    res.type == 'int' &&
                                    res.systemFieldType == 0 &&
                                    res.config.dbType == 'BIGINT'
                                  ) {
                                    return res;
                                  }
                                });
                                sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                                sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                                sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                                sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
                                let formulArr: any[] = [];
                                data3.forEach((item: any) => {
                                  if (
                                    item.type != 'formula' &&
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9
                                  ) {
                                    formulArr.push({...item,label:item.name,value:item.code});
                                  }
                                });
                                sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'myField',
                                  args: {
                                    value: {
                                      items: data3
                                    }
                                  }
                                });
                                doAction({
                                  actionType: 'reload',
                                  componentId: 'nameField'
                                });
                                let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
                                console.log(neKeyData, 'neKeyDataneKeyData');
                                if (neKeyData.length > 0) {
                                  let neKeyData2 = neKeyData.map(
                                    (dshj: any) => {
                                      if (event.data.foreignKeyCode) {
                                        let daij = {...dshj};
                                        if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                                          daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                                          daij.columnNames == event.data.foreignKeyCode
                                        ) {
                                          console.log(daij, '进入');
                                          let samne = daij.columnNames.split(',');
                                          let sjam: any = [];
                                          sjam = samne.filter((sj: any) => {
                                            if (sj != event.data.foreignKeyCode) {
                                              return sj;
                                            }
                                          });
                                          console.log(sjam, 'sjam');
                                          daij.columnNames = sjam.join(',');
                                        }
                                        console.log(daij, 'daijdaijdaij');
                                        return daij;
                                      }
                                    }
                                  );
                                  let deleteCode: any[] = [];
                                  const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                                  deleteCode = data3
                                    .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                    .map(item => item.code);
                                  const blackListFields = new Set([
                                    'id',
                                    'deleted',
                                    'deletedAt',
                                    'deletedBy',
                                    'updatedAt',
                                    'createdAt',
                                    'createdBy',
                                    'updatedBy',
                                    ...deleteCode
                                  ]);
                                  let fieldDataes: any[] = [];
                                  neKeyData2.forEach((res: any) => {
                                    const { columnNames } = res;
                                    if (!columnNames) {
                                      return;
                                    }
                                    const fields = columnNames
                                      .split(',')
                                      .map(f => f.trim())
                                      .filter(Boolean);
                                    const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
                                    if (hasNonBlacklisted && !res.uniqueFlag) {
                                      fieldDataes.push(res);
                                    }else if(!res.uniqueFlag){
                                      fieldDataes.push(res);
                                    }
                                  });
                                  let fieldDataese = fieldDataes.map(
                                    (res: any, index: number) => {
                                      return {...res, sort: index + 1,
                                        columnNames:processIndexFields(res.columnNames,data3)
                                      };
                                    }
                                  );
                                  sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'keyCrud',
                                    args: {
                                      value: {
                                        items: fieldDataese
                                      }
                                    }
                                  });
                                  let nameFieldData =
                                  sessionStorage.getItem('nameFieldData')
                                  if (
                                    nameFieldData == event.data.foreignKeyCode
                                  ) {
                                    let ars = data3.filter(sc => {
                                      return sc.systemFieldType == 0;
                                    });
                                    console.log(ars, 'arsarsarsarsarsars');
                                    if (ars.length > 0) {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: ars[0].code
                                        }
                                      });
                                      // nameFieldData = ars[0].code;
                                      sessionStorage.setItem('nameFieldData', ars[0].code)
                                    } else {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: 'id'
                                        }
                                      });
                                      // nameFieldData = 'id';
                                      sessionStorage.setItem('nameFieldData', 'id')
                                    }
                                  }
                                }
                                let removeRelationsArr = JSON.parse(
                                  sessionStorage.getItem('removeRelations')!
                                );
                                console.log(removeRelationsArr,'removeRelationsArr')
                                removeRelationsArr.push(event.data.queryKey)
                                console.log(removeRelationsArr,'removeRelationsArr')
                                sessionStorage.setItem('removeRelations',JSON.stringify(removeRelationsArr));
                                doAction({
                                  actionType: 'closeDialog',
                                  componentId: 'deleteDialogId'
                                });
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      id:"shanMiddleId",
                      type: 'button',
                      label: '删除中间表',
                      level: 'primary',
                      onEvent: {
                        click: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log('删除关系设置');
                                console.log(_, '____');
                                console.log(
                                  doAction,
                                  'doActiondoActiondoActiondoAction'
                                );
                                console.log(event, 'eventeventeventevent');
                                let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                let data = data1.filter((res: any) => {
                                  // return res.code != event.data.code
                                  if (event.data.needId) {
                                    return res.needId != event.data.needId;
                                  } else {
                                    return res.id != event.data.id;
                                  }
                                });
                                data.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                sessionStorage.setItem('affectCrud',JSON.stringify(data));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'affectCrud',
                                  args: {
                                    value: {
                                      items: data
                                    }
                                  }
                                });
                                let data2 = JSON.parse(
                                  sessionStorage.getItem('fieldCrud')!
                                );
                                console.log(data2, 'ssssssssssss');
                                let yuanData: any;
                                if (sessionStorage.getItem('yuanData')!) {
                                  yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
                                }
                                let data3: any[] = [];
                                data2.forEach((ress: any) => {
                                  if (event.data.__super.foreignKeyCode) {
                                    console.log(yuanData, '进入');
                                    let haveData = {};
                                    if (yuanData) {
                                      yuanData.forEach((siw: any) => {
                                        if (ress.needId) {
                                          if (
                                            siw.needId == ress.needId &&
                                            ress.systemFieldType == 0 &&
                                            ress.type != 'relation'
                                          ) {
                                            // return siw
                                            haveData = siw;
                                          }
                                        }
                                      });
                                    }
                                    if (JSON.stringify(haveData) === '{}') {
                                      console.log('进入');
                                      if (
                                        ress.code !=
                                          event.data.__super.foreignKeyCode &&
                                        ress.code != event.data.__super.code
                                      ) {
                                        data3.push(ress);
                                      }
                                      // return res.code != event.data.__super.foreignKeyCode && res.code != event.data.__super.code
                                    } else {
                                      console.log('进入1');
                                      console.log(haveData, 'haveData[0]');
                                      data3.push(haveData);
                                      // return haveData
                                    }
                                    // return res.queryKey != event.data.fieldKey
                                  } else if (
                                    event.data.inverseSideKey != null &&
                                    ress.type == 'relation' &&
                                    (ress.needId || ress.id)
                                  ) {
                                    console.log('进入1');
                                    if (ress.code != event.data.code) {
                                      data.push(ress);
                                    }
                                    // return res.code != event.data.code
                                  } else {
                                    console.log('进入2');
                                    if (event.data.id) {
                                      if (ress.id != event.data.id) {
                                        data.push(ress);
                                      }
                                      // return res.id != event.data.id
                                    } else {
                                      if (ress.needId != event.data.needId) {
                                        data.push(ress);
                                      }
                                      // return res.needId != event.data.needId
                                    }
                                  }
                                });
                                console.log(data3, 'data3data3data3');
                                data3.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                let fieldCruds = data3.map((res: any) => {
                                  // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                  if (res.type != 'relation' && res.systemFieldType != 6
                                    && res.systemFieldType != 7 && res.systemFieldType != 9
                                     && res.systemFieldType != 8 && res.type != 'formula') {
                                    return res;
                                  }
                                });
                                let puFieldCruds = data3.map((res: any) => {
                                  if (
                                    !res.foreignKeyFlag &&
                                    res.systemFieldType == 0 &&
                                    res.type != 'relation'
                                  ) {
                                    return res;
                                  }
                                });
                                let fieldKeyCruds = data3.map((res: any) => {
                                  if (
                                    res.type != 'relation' &&
                                    res.type != 'formula' &&
                                    res.type != 'textarea' &&
                                    res.type != 'rich-text' &&
                                    res.type != 'json' &&
                                    res.type != 'attachment' &&
                                    res.type != 'image' &&
                                    res.type != 'ciphertext' &&
                                    res.type != 'users'
                                  ) {
                                    if (
                                      res.type == 'text' &&
                                      res.config.length < 768
                                    ) {
                                      return res;
                                    } else if (res.type != 'text') {
                                      return res;
                                    }
                                  }
                                });
                                let waiList = data3.filter((res: any) => {
                                  if (
                                    res.type == 'text' &&
                                    res.config.length >= 20 && res.systemFieldType == 0
                                  ) {
                                    return res;
                                  } else if (
                                    res.type == 'int' &&
                                    res.systemFieldType == 0 &&
                                    res.config.dbType == 'BIGINT'
                                  ) {
                                    return res;
                                  }
                                });
                                sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                                sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                                sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                                sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
                                let formulArr: any[] = [];
                                data3.forEach((item: any) => {
                                  if (
                                    item.type != 'formula' &&
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9
                                  ) {
                                    formulArr.push({...item,label:item.name,value:item.code});
                                  }
                                });
                                sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'myField',
                                  args: {
                                    value: {
                                      items: data3
                                    }
                                  }
                                });
                                doAction({
                                  actionType: 'reload',
                                  componentId: 'nameField'
                                });
                                let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
                                console.log(neKeyData, 'neKeyDataneKeyData');
                                if (neKeyData.length > 0) {
                                  // let neKeyData2 = neKeyData.filter((res:any) => {
                                  //     if (event.data.foreignKeyCode) {
                                  //         return res.columnNames != event.data.foreignKeyCode
                                  //     }
                                  // })
                                  let neKeyData2 = neKeyData.map(
                                    (dshj: any) => {
                                      if (event.data.foreignKeyCode) {
                                        let daij = {...dshj};
                                        if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                                          daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                                          daij.columnNames == event.data.foreignKeyCode
                                        ) {
                                          console.log(daij, '进入');
                                          let samne = daij.columnNames.split(',');
                                          let sjam: any = [];
                                          sjam = samne.filter((sj: any) => {
                                            if (sj != event.data.foreignKeyCode) {
                                              return sj;
                                            }
                                          });
                                          console.log(sjam, 'sjam');
                                          daij.columnNames = sjam.join(',');
                                        }
                                        console.log(daij, 'daijdaijdaij');
                                        return daij;
                                      }
                                    }
                                  );
                                  let deleteCode: any[] = [];
                                  const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                                  deleteCode = data3
                                    .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                    .map(item => item.code);
                                  const blackListFields = new Set([
                                    'id',
                                    'deleted',
                                    'deletedAt',
                                    'deletedBy',
                                    'updatedAt',
                                    'createdAt',
                                    'createdBy',
                                    'updatedBy',
                                    ...deleteCode
                                  ]);
                                  let fieldDataes: any[] = [];
                                  neKeyData2.forEach((res: any) => {
                                    const { columnNames } = res;
                                    if (!columnNames) {
                                      return;
                                    }
                                    const fields = columnNames
                                      .split(',')
                                      .map(f => f.trim())
                                      .filter(Boolean);
                                    const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
                                    if (hasNonBlacklisted && !res.uniqueFlag) {
                                      fieldDataes.push(res);
                                    }else if(!res.uniqueFlag){
                                      fieldDataes.push(res);
                                    }
                                  });
                                  let fieldDataese = fieldDataes.map(
                                    (res: any, index: number) => {
                                      return {...res, sort: index + 1,
                                        columnNames:processIndexFields(res.columnNames,data3)
                                      };
                                    }
                                  );
                                  sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'keyCrud',
                                    args: {
                                      value: {
                                        items: fieldDataese
                                      }
                                    }
                                  });
                                  let nameFieldData =
                                  sessionStorage.getItem('nameFieldData')
                                  if (
                                    nameFieldData == event.data.foreignKeyCode
                                  ) {
                                    let ars = data3.filter(sc => {
                                      return sc.systemFieldType == 0;
                                    });
                                    console.log(ars, 'arsarsarsarsarsars');
                                    if (ars.length > 0) {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: ars[0].code
                                        }
                                      });
                                      // nameFieldData = ars[0].code;
                                      sessionStorage.setItem('nameFieldData', ars[0].code)
                                    } else {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: 'id'
                                        }
                                      });
                                      // nameFieldData = 'id';
                                      sessionStorage.setItem('nameFieldData', 'id')
                                    }
                                  }
                                }
                                doAction({
                                  actionType: 'closeDialog',
                                  componentId: 'deleteDialogId'
                                });
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      id:"shanZiId",
                      type: 'button',
                      label: '删除关系',
                      level: 'primary',
                      onEvent: {
                        click: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log('删除关系设置');
                                console.log(_, '____');
                                console.log(
                                  doAction,
                                  'doActiondoActiondoActiondoAction'
                                );
                                console.log(event, 'eventeventeventevent');
                                let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                let data = data1.filter((res: any) => {
                                  // return res.code != event.data.code
                                  if (event.data.needId) {
                                    return res.needId != event.data.needId;
                                  } else {
                                    return res.id != event.data.id;
                                  }
                                });
                                data.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                sessionStorage.setItem('affectCrud',JSON.stringify(data));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'affectCrud',
                                  args: {
                                    value: {
                                      items: data
                                    }
                                  }
                                });
                                let data2 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                console.log(data2, 'ssssssssssss');
                                let yuanData: any;
                                if (sessionStorage.getItem('yuanData')!) {
                                  yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
                                }
                                let data3: any[] = [];
                                data2.forEach((ress: any) => {
                                  if (event.data.__super.foreignKeyCode) {
                                    console.log(yuanData, '进入');
                                    let haveData = {};
                                    if (yuanData) {
                                      yuanData.forEach((siw: any) => {
                                        if (ress.needId) {
                                          if (
                                            siw.needId == ress.needId &&
                                            ress.systemFieldType == 0 &&
                                            ress.type != 'relation'
                                          ) {
                                            // return siw
                                            haveData = siw;
                                          }
                                        }
                                      });
                                    }
                                    if (JSON.stringify(haveData) === '{}') {
                                      console.log('进入');
                                      if (
                                        ress.code !=
                                          event.data.__super.foreignKeyCode &&
                                        ress.code != event.data.__super.code
                                      ) {
                                        data3.push(ress);
                                      }
                                      // return res.code != event.data.__super.foreignKeyCode && res.code != event.data.__super.code
                                    } else {
                                      console.log('进入1');
                                      console.log(haveData, 'haveData[0]');
                                      data3.push(haveData);
                                      // return haveData
                                    }
                                    // return res.queryKey != event.data.fieldKey
                                  } else if (
                                    event.data.inverseSideKey != null &&
                                    ress.type == 'relation' &&
                                    (ress.needId || ress.id)
                                  ) {
                                    console.log('进入1');
                                    if (ress.code != event.data.code) {
                                      data3.push(ress);
                                    }
                                    // return res.code != event.data.code
                                  } else {
                                    console.log('进入2');
                                    if (event.data.id) {
                                      if (ress.id != event.data.id) {
                                        data3.push(ress);
                                      }
                                      // return res.id != event.data.id
                                    } else {
                                      if (ress.needId != event.data.needId) {
                                        data3.push(ress);
                                      }
                                      // return res.needId != event.data.needId
                                    }
                                  }
                                });
                                console.log(data3, 'data3data3data3');
                                data3.forEach((element: any, index: number) => {
                                  element.sort = index + 1;
                                });
                                let fieldCruds = data3.map((res: any) => {
                                  // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                  if (res.type != 'relation' && res.systemFieldType != 6
                                    && res.systemFieldType != 7 && res.systemFieldType != 9
                                     && res.systemFieldType != 8 && res.type != 'formula') {
                                    return res;
                                  }
                                });
                                let puFieldCruds = data3.map((res: any) => {
                                  if (
                                    !res.foreignKeyFlag &&
                                    res.systemFieldType == 0 &&
                                    res.type != 'relation'
                                  ) {
                                    return res;
                                  }
                                });
                                let fieldKeyCruds = data3.map((res: any) => {
                                  if (
                                    res.type != 'relation' &&
                                    res.type != 'formula' &&
                                    res.type != 'textarea' &&
                                    res.type != 'rich-text' &&
                                    res.type != 'json' &&
                                    res.type != 'attachment' &&
                                    res.type != 'image' &&
                                    res.type != 'ciphertext' &&
                                    res.type != 'users'
                                  ) {
                                    if (
                                      res.type == 'text' &&
                                      res.config.length < 768
                                    ) {
                                      return res;
                                    } else if (res.type != 'text') {
                                      return res;
                                    }
                                  }
                                });
                                let waiList = data3.filter((res: any) => {
                                  if (
                                    res.type == 'text' &&
                                    res.config.length >= 20 && res.systemFieldType == 0
                                  ) {
                                    return res;
                                  } else if (
                                    res.type == 'int' &&
                                    res.systemFieldType == 0 &&
                                    res.config.dbType == 'BIGINT'
                                  ) {
                                    return res;
                                  }
                                });
                                sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                                sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                                sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                                sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
                                let formulArr: any[] = [];
                                data3.forEach((item: any) => {
                                  if (
                                    item.type != 'formula' &&
                                    item.systemFieldType != 6 &&
                                    item.systemFieldType != 7 &&
                                    item.systemFieldType != 8 &&
                                    item.systemFieldType != 9
                                  ) {
                                    formulArr.push({...item,label:item.name,value:item.code});
                                  }
                                });
                                sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'myField',
                                  args: {
                                    value: {
                                      items: data3
                                    }
                                  }
                                });
                                doAction({
                                  actionType: 'reload',
                                  componentId: 'nameField'
                                });
                                let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
                                console.log(neKeyData, 'neKeyDataneKeyData');
                                if (neKeyData.length > 0) {
                                  // let neKeyData2 = neKeyData.filter((res:any) => {
                                  //     if (event.data.foreignKeyCode) {
                                  //         return res.columnNames != event.data.foreignKeyCode
                                  //     }
                                  // })
                                  let neKeyData2 = neKeyData.map(
                                    (dshj: any) => {
                                      if (event.data.foreignKeyCode) {
                                        let daij = {...dshj};
                                        if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                                          daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                                          daij.columnNames == event.data.foreignKeyCode
                                        ) {
                                          console.log(daij, '进入');
                                          let samne = daij.columnNames.split(',');
                                          let sjam: any = [];
                                          sjam = samne.filter((sj: any) => {
                                            if (sj != event.data.foreignKeyCode) {
                                              return sj;
                                            }
                                          });
                                          console.log(sjam, 'sjam');
                                          daij.columnNames = sjam.join(',');
                                        }
                                        console.log(daij, 'daijdaijdaij');
                                        return daij;
                                      }
                                    }
                                  );
                                  let deleteCode: any[] = [];
                                  const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                                  deleteCode = data3
                                    .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                    .map(item => item.code);
                                  const blackListFields = new Set([
                                    'id',
                                    'deleted',
                                    'deletedAt',
                                    'deletedBy',
                                    'updatedAt',
                                    'createdAt',
                                    'createdBy',
                                    'updatedBy',
                                    ...deleteCode
                                  ]);
                                  let fieldDataes: any[] = [];
                                  neKeyData2.forEach((res: any) => {
                                    const { columnNames } = res;
                                    if (!columnNames) {
                                      return;
                                    }
                                    const fields = columnNames
                                      .split(',')
                                      .map(f => f.trim())
                                      .filter(Boolean);
                                    const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
                                    if (hasNonBlacklisted && !res.uniqueFlag) {
                                      fieldDataes.push(res);
                                    }else if(!res.uniqueFlag){
                                      fieldDataes.push(res);
                                    }
                                  });
                                  let fieldDataese = fieldDataes.map(
                                    (res: any, index: number) => {
                                      return {...res, sort: index + 1,
                                        columnNames:processIndexFields(res.columnNames,data3)
                                      };
                                    }
                                  );
                                  sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'keyCrud',
                                    args: {
                                      value: {
                                        items: fieldDataese
                                      }
                                    }
                                  });
                                  let nameFieldData = sessionStorage.getItem('nameFieldData')
                                  if (nameFieldData == event.data.foreignKeyCode) {
                                    let ars = data3.filter(sc => {
                                      return sc.systemFieldType == 0;
                                    });
                                    console.log(ars, 'arsarsarsarsarsars');
                                    if (ars.length > 0) {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: ars[0].code
                                        }
                                      });
                                      // nameFieldData = ars[0].code;
                                      sessionStorage.setItem('nameFieldData', ars[0].code)
                                    } else {
                                      doAction({
                                        actionType: 'setValue',
                                        componentId: 'nameField',
                                        args: {
                                          value: 'id'
                                        }
                                      });
                                      // nameFieldData = 'id';
                                      sessionStorage.setItem('nameFieldData', 'id')
                                    }
                                  }
                                }
                                doAction({
                                  actionType: 'closeDialog',
                                  componentId: 'deleteDialogId'
                                });
                              }
                            }
                          ]
                        }
                      }
                    }
                  ]}]
                }
              }
            ]
          }
        ]
      }
    ]
  };
};
