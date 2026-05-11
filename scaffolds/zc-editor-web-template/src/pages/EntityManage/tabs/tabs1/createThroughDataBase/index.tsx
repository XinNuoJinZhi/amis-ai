import { useDevBaseUrl } from '@/utils/util';
import { allOptions } from './options';
import {toast} from 'amis';
import {saveDataBase} from "@/api/entitymanage"
import {addRule} from 'amis'

export default () => {
  let tableInfosData: any = [];
  return {
    type: 'button',
    label: '从数据库导入',
    actionType: 'dialog',
    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:create')}",
    "onEvent": {
      "click": {
        "actions": [
          {
            "actionType": "custom",
            script: function (_: any, doAction: any, event: any) {
              addRule('isClmTypeChecked',(values, value) => {
                if(values.selected){
                  const checkData = tableInfosData.filter (i=>i.tableCode == values.__super.tableCode)[0].columns
                  if(values.columnType == 'parent') { // 当前选择了父级
                    const parentAll = checkData.filter(i=> i.columnType == 'parent')
                    if(parentAll.length > 1) {
                      return {
                        error: true,
                        msg: '父级只能有一个'
                      };
                    }
                  } else if (values.columnType == 'pk') { //当前是主键
                    const pkAll = checkData.filter(i=> i.columnType == 'pk')
                    if(pkAll.length > 1) {
                      return {
                        error: true,
                        msg: '主键只能有一个'
                      };
                    }
                  } else if (values.columnType == 'createdBy') { // 当前是创建人
                    const createdByAll = checkData.filter(i=> i.columnType == 'createdBy')
                    if(createdByAll.length > 1){
                      return {
                        error: true,
                        msg: '创建人只能有一个'
                      };
                    }
                  } else if (values.columnType == 'updatedBy') { // 当前是更新人
                    const updatedByAll = checkData.filter(i=> i.columnType == 'updatedBy')
                    if(updatedByAll.length > 1){
                      return {
                        error: true,
                        msg: '更新人只能有一个'
                      };
                    }
                  } else if (values.columnType == 'deletedBy') { // 当前是删除人
                    const deletedByAll = checkData.filter(i=> i.columnType == 'deletedBy')
                    if(deletedByAll.length > 1){
                      return {
                        error: true,
                        msg: '删除人只能有一个'
                      };
                    }
                    const deletedAll = checkData.filter(i=> i.columnType == 'deleted')
                    const deletedAtAll = checkData.filter(i=> i.columnType == 'deletedAt')
                    if(deletedAtAll.length == 0 || deletedAll.length == 0){
                      return {
                        error: true,
                        msg: '设删除人时必须有删除时间和删除标志字段'
                      };
                    }
                  } else if (values.columnType == 'createdAt') { // 当前是创建时间
                    const createdAtAll = checkData.filter(i=> i.columnType == 'createdAt')
                    if(createdAtAll.length > 1){
                      return {
                        error: true,
                        msg: '创建时间只能有一个'
                      };
                    }
                  } else if (values.columnType == 'updatedAt') { // 当前是更新时间
                    const updatedAtAll = checkData.filter(i=> i.columnType == 'updatedAt')
                    if(updatedAtAll.length > 1){
                      return {
                        error: true,
                        msg: '更新时间只能有一个'
                      };
                    }
                  } else if (values.columnType == 'deletedAt') { // 当前是删除时间
                    const deletedAtAll = checkData.filter(i=> i.columnType == 'deletedAt')
                    if(deletedAtAll.length > 1){
                      return {
                        error: true,
                        msg: '删除时间只能有一个'
                      };
                    }
                    const deletedAll = checkData.filter(i=> i.columnType == 'deleted')
                    if(deletedAll.length == 0){
                      return {
                        error: true,
                        msg: '设删除时间时必须有删除标志字段'
                      };
                    }
                  } else if (values.columnType == 'deleted') { // 当前是删除标志
                    const deletedAll = checkData.filter(i=> i.columnType == 'deleted')
                    if(deletedAll.length > 1){
                      return {
                        error: true,
                        msg: '删除标志只能有一个'
                      };
                    }
                    const deletedAtAll = checkData.filter(i=> i.columnType == 'deletedAt')
                    if(deletedAtAll.length == 0){
                      return {
                        error: true,
                        msg: '设删除标志时必须有删除时间字段'
                      };
                    }
                  }
                  return true
                } else {
                  return true
                }
              })
            }
          }
        ]
      }
    },
    dialog: {
      size: 'xl',
      title: '从数据库导入',
      id: 'import_dialog',
      body: [{
        id: 'importDataBase',
        data: {
          tableInfos: [],
        },
        type: 'form',
        "initApi": {
          "method": "get",
          "url": useDevBaseUrl("/entitymanage/table/databaseModel"),
          data: { dsKey: '${dsKey}' },
          adaptor: function (payload: any) {
            const dsKey = payload?.data?.dsKey
            const tableInfos = payload?.data?.tableInfos ? payload?.data?.tableInfos : []
            tableInfos.forEach((item, index: number) => {
              item.id = index;
              item.columns.forEach((itemClm, itemClmIndex)=> {
                itemClm.selected = false
                itemClm.columnTypeList = allOptions[itemClm.sourceColumnType]
                if(itemClm.sourceColumnType == 'pk'){
                  itemClm.columnType = 'pk'
                } else if(itemClm.sourceColumnType == 'varchar'){
                  itemClm.columnType = 'text'
                  const sTime = item.columns.filter((i)=>i.columnCode == itemClm.columnCode+'_stime')
                  const eTime = item.columns.filter((i)=>i.columnCode == itemClm.columnCode+'_etime')
                  if(sTime.length > 0 && eTime.length > 0){
                    if(sTime[0].sourceColumnType == 'datetime' && eTime[0].sourceColumnType == 'datetime') {
                      itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                        if (item.value === 'date-range') {
                          return { ...item, disabled: true };
                        } else if(item.value === 'time-range') {
                          return { ...item, disabled: true };
                        }
                        return item;
                      });
                    } else if (sTime[0].sourceColumnType == 'date' && eTime[0].sourceColumnType == 'date') {
                      itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                        if (item.value === 'datetime-range') {
                          return { ...item, disabled: true };
                        } else if(item.value === 'time-range') {
                          return { ...item, disabled: true };
                        }
                        return item;
                      });
                    } else if (sTime[0].sourceColumnType == 'time' && eTime[0].sourceColumnType == 'time') {
                      itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                        if (item.value === 'datetime-range') {
                          return { ...item, disabled: true };
                        } else if(item.value === 'date-range') {
                          return { ...item, disabled: true };
                        }
                        return item;
                      });
                    }
                  } else {
                    itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                      if (item.value === 'datetime-range') {
                        return { ...item, disabled: true };
                      }  else if (item.value === 'date-range') {
                        return { ...item, disabled: true };
                      } else if(item.value === 'time-range') {
                        return { ...item, disabled: true };
                      }
                      return item;
                    });
                  }

                  if(itemClm.originType.includes("VARCHAR")) {
                    const filterItem = item.columns.filter(i=>i.sourceColumnType == 'pk')
                    //父级长度
                    const itemClmL = itemClm.originType.match(/^VARCHAR\((\d+)\)$/)[1]
                    const filterItemL = filterItem[0] && filterItem[0].originType.indexOf('(') > -1 ? filterItem[0].originType.match(/^VARCHAR\((\d+)\)$/)[1] : 0
                    if(!(filterItem[0] && filterItem[0].originType.includes("VARCHAR") && (itemClmL >= filterItemL))) {
                      itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                        if (item.value === 'parent') {
                          return { ...item, disabled: true };
                        }
                        return item;
                      });
                    }
                  }

                  const originItemL = itemClm.originType.indexOf('(') > -1 ? itemClm.originType.match(/^VARCHAR\((\d+)\)$/)[1] : 0
                  itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                    if (item.value === 'attachment' && originItemL < 1000) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'image' && originItemL < 1000) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'ciphertext' && originItemL < 1000) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'password' && originItemL < 255) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'department' && originItemL < 255) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'users' && originItemL < 5000) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'user' && originItemL < 255) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'user' && originItemL < 255) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'date-range' && originItemL < 200) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'enum' && originItemL < 255) {
                      return { ...item, disabled: true };
                    }
                    if (item.value === 'serial-number' && originItemL < 255) {
                      return { ...item, disabled: true };
                    }
                    return item;
                  });
                  if(itemClm.defaultValue == null) {
                    itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                      if (item.value === 'deletedBy') {
                        return { ...item, disabled: true };
                      }
                      return item;
                    });
                  }
                } else if(itemClm.sourceColumnType == 'text'){
                  itemClm.columnType = 'textarea'
                } else if(itemClm.sourceColumnType == 'date'){
                  itemClm.columnType = 'date'
                } else if(itemClm.sourceColumnType == 'datetime'){
                  itemClm.columnType = 'datetime'
                } else if(itemClm.sourceColumnType == 'time'){
                  itemClm.columnType = 'time'
                } else if(itemClm.sourceColumnType == 'int'){
                  itemClm.columnType = 'int'
                } else if(itemClm.sourceColumnType == 'bigint'){
                  itemClm.columnType = 'bigint'
                  if(itemClm.originType == "BIGINT") {
                    const filterItem = item.columns.filter(i=>i.sourceColumnType == 'pk')
                    if(filterItem[0] && filterItem[0].originType != "BIGINT") {
                      itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                        if (item.value === 'parent') {
                          return { ...item, disabled: true };
                        }
                        return item;
                      });
                    }
                  }
                } else if(itemClm.sourceColumnType == 'float'){
                  itemClm.columnType = 'float'
                } else if(itemClm.sourceColumnType == 'double'){
                  itemClm.columnType = 'double'
                } else if(itemClm.sourceColumnType == 'decimal'){
                  itemClm.columnType = 'decimal'
                } else if(itemClm.sourceColumnType == 'bit'){
                  itemClm.columnType = 'boolean'
                } else if(itemClm.sourceColumnType == 'json'){
                  itemClm.columnType = 'json'
                } else if(itemClm.sourceColumnType == 'timestamp'){
                  itemClm.columnType = 'timestamp'
                }
              })
            });
            tableInfosData = JSON.parse(JSON.stringify(tableInfos))
            return {
                ...payload,
                status: payload.code,
                data: { ...payload.data, dsKey: dsKey, tableInfos: tableInfos }
            };
          }
        },
        body: [
          {
            type: 'container',
            body: [
              '数据预览（前 5 条）',
              {
                type: 'tabs',
                tabsMode: 'vertical',
                source: '${tableInfos}',
                className: "importDataBase_aside",
                tabs: [
                  {
                    "title": {
                      "type": "page",
                      "className": 'importDataBaseSource',
                      "body": [
                        {
                          "name": "${tableCode}",
                          "type": "checkboxes",
                          "label": "",
                          "source": "${options}",
                          "onEvent": {
                            "change": {
                              "actions": [
                                {
                                  "actionType": "custom",
                                  "script": async function (context: any,doAction: any,event: any) {
                                    const unSelectedVal = Object.keys(event.data).find(key => {
                                      // 条件：键名不是 'value'，且对应的值为 true
                                      return key !== 'value' && event.data[key] === '';
                                    });
                                    tableInfosData.forEach(item => {
                                      //勾选
                                      if (item.tableCode === event.data.value) {
                                        item[event.data.value] = event.data.value
                                        item.columns.forEach(column => {
                                          if (column.selected !== true) {
                                            column.selected = true;
                                          }
                                        });
                                      } else if(event.data.value == ''){
                                        //去勾选
                                        if (item.tableCode === item[unSelectedVal]) {
                                          item[unSelectedVal] = ''
                                          item.columns.forEach(column => {
                                            if (column.selected == true) {
                                              column.selected = false;
                                            }
                                          });
                                        }
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'importDataBase',
                                      args: {
                                        value: {
                                          tableInfos: tableInfosData
                                        }
                                      }
                                    });
                                  }
                                }
                              ]
                            }
                          }
                        },
                        {
                          "type": "icon",
                          "icon": "far fa-edit",
                          "hiddenOn": "${tipInfo}",
                          "className": "text-info text-base iconImportDataBase",
                          "onEvent": {
                            "click": {
                              "actions": [
                                {
                                  "actionType": "dialog",
                                  "dialog": {
                                      "title": "编辑",
                                      "body": {
                                        "type": "form",
                                        "mode": "horizontal",
                                        "body": [{
                                          "type": "input-text",
                                          "name": "tableName",
                                          "label": "表名",
                                          "required": true,
                                          "value": "${tableName}",
                                        },
                                        {
                                          "type": "input-text",
                                          "name": "tableCode",
                                          "label": "表Code",
                                          "desc": "不可修改，请仔细填写，建议只用小写英文和下划线",
                                          "placeholder": "请填写表名",
                                          "required": true,
                                          "value": "${tableCode}",
                                          "maxLength": 64,
                                          "disabled": true,
                                          "validations": {
                                              "matchRegexp": "^[a-zA-Z_][A-Za-z0-9_]*$"
                                          },
                                          "validationErrors": {
                                              "matchRegexp": "请填写规范的表Code"
                                          }
                                        }],
                                      },
                                      "onEvent": {
                                        "confirm": {
                                            "actions": [
                                                {
                                                  "actionType": "custom",
                                                  "script": async function (context: any,doAction: any,event: any) {
                                                    const id = event.data.__super.id
                                                    tableInfosData.forEach(item => {
                                                        if (item.id === id) {
                                                          item.tableCode = event.data.tableCode
                                                          item.tableName = event.data.tableName
                                                          item.options[0].label = event.data.tableName
                                                        }
                                                      }
                                                    );
                                                    doAction({
                                                      actionType: 'setValue',
                                                      componentId: 'importDataBase',
                                                      args: {
                                                        value: {
                                                          tableInfos: tableInfosData
                                                        }
                                                      }
                                                    });
                                                    doAction({
                                                      actionType: 'reload',
                                                      componentId: 'data_search',
                                                    });
                                                  }
                                                }
                                            ]
                                        }
                                    },
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    },
                    body: [
                      {
                        "type": "alert",
                        "body": "${tipInfo}",
                        "level": "warning",
                        "className": "mb-1",
                        "visibleOn": "${tipInfo}",
                      },
                      {
                        type: 'tabs',
                        name: 'tabs-change-receiver',
                        tabs: [
                          {
                            title: '元数据查询',
                            body: [
                              {
                                type: 'input-table',
                                autoFillHeight: true,
                                name: 'columns',
                                labelWidth: 1,
                                columns: [
                                  {
                                    name: 'columnCode',
                                    label: '字段名',
                                    type: 'input-text',
                                    required: true,
                                    validations: 'isVariableName',
                                    static: true,
                                    onEvent: {
                                      blur: {
                                        actions: [
                                          {
                                            actionType: 'custom',
                                            script: function (context: any,doAction: any,event: any) {
                                              const columnIndex = event.context.data.__super.columnIndex;
                                              const id = event.context.data.__super.__super.id;
                                              tableInfosData.forEach(item => {
                                                  if (item.id === id) {
                                                    item.columns[columnIndex].columnCode = event.data.value;
                                                  }
                                                }
                                              );
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'importDataBase',
                                                args: {
                                                  value: {
                                                    tableInfos: tableInfosData
                                                  }
                                                }
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  {
                                    name: 'columnName',
                                    label: '显示标题',
                                    type: 'input-text',
                                    required: true,
                                    "disabledOn": "${disabled == true ? true : false}",
                                    onEvent: {
                                      blur: {
                                        actions: [
                                          {
                                            actionType: 'custom',
                                            script: function (
                                              context: any,
                                              doAction: any,
                                              event: any
                                            ) {
                                              const columnIndex = event.context.data.__super.columnIndex;
                                              const id = event.context.data.__super.__super.id;
                                              tableInfosData.forEach(item => {
                                                  if (item.id === id) {
                                                    item.columns[
                                                        columnIndex
                                                      ].columnName =
                                                      event.data.value;
                                                  }
                                                }
                                              );
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'importDataBase',
                                                args: {
                                                  value: {
                                                    tableInfos: tableInfosData
                                                  }
                                                }
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  {
                                    name: 'columnType',
                                    label: '字段类型',
                                    type: 'select',
                                    source: '${columnTypeList}',
                                    required: true,
                                    "validations": {
                                      "isClmTypeChecked": true
                                    },
                                    "validateOnChange": true,
                                    "disabledOn": "${disabled == true ? true : false}",
                                    onEvent: {
                                      change: {
                                        actions: [
                                          {
                                            actionType: 'custom',
                                            script: function (
                                              context: any,
                                              doAction: any,
                                              event: any
                                            ) {
                                              const columnIndex = event.context.data.__super.columnIndex;
                                              const id = event.context.data.__super.__super.id;
                                              tableInfosData.forEach(item => {
                                                if (item.id === id) {
                                                    item.columns[columnIndex].columnType = event.data.value;
                                                    item.columns[columnIndex].columnCode = event.context.data.__super.columnCode;
                                                    item.columns[columnIndex].columnName = event.context.data.__super.columnName;
                                                  }
                                                }
                                              );
                                              if(event.context.data.columnType == 'datetime-range' || event.context.data.columnType == 'date-range' || event.context.data.columnType == 'time-range'){
                                                const sTimeCode = event.context.data.__rendererData.columnCode+'_stime'
                                                const eTimeCode = event.context.data.__rendererData.columnCode+'_etime'
                                                tableInfosData.forEach(item => {
                                                  if (item.id === id) {
                                                    item.columns = item.columns.map(item => {
                                                    if (item.columnCode === sTimeCode) {
                                                      return { ...item, disabled: true };
                                                    } else if(item.columnCode === eTimeCode) {
                                                      return { ...item, disabled: true };
                                                    }
                                                    return item;
                                                    });
                                                  }
                                                })
                                                doAction({
                                                  actionType: 'setValue',
                                                  componentId: 'importDataBase',
                                                  args: {
                                                    value: {
                                                      tableInfos: tableInfosData
                                                    }
                                                  }
                                                });
                                              } else if (event.context.data.columnType == 'createdAt' || event.context.data.columnType == 'updatedAt' || event.context.data.columnType == 'deletedAt'){
                                                let columnCode = event.context.data.__super.columnCode.split('_')[0]
                                                tableInfosData.forEach(item => {
                                                  if (item.id === id) {
                                                    item.columns.forEach((itemClm, itemClmIndex)=> {
                                                      if(itemClm.sourceColumnType == 'varchar' && itemClm.columnCode == columnCode){
                                                        itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                                                          if (item.value === 'datetime-range') {
                                                            return { ...item, disabled: true };
                                                          }
                                                          return item;
                                                        });
                                                      }
                                                    }) 
                                                  }
                                                })
                                                doAction({
                                                  actionType: 'setValue',
                                                  componentId: 'importDataBase',
                                                  args: {
                                                    value: {
                                                      tableInfos: tableInfosData
                                                    }
                                                  }
                                                });
                                              } else if (event.context.data.columnType == 'datetime') {
                                                let columnCode = event.context.data.__super.columnCode.split('_')[0]
                                                tableInfosData.forEach(item => {
                                                  if (item.id === id) {
                                                    item.columns.forEach((itemClm, itemClmIndex)=> {
                                                      if(itemClm.sourceColumnType == 'varchar' && itemClm.defaultValue && itemClm.columnCode == columnCode){
                                                        itemClm.columnTypeList = itemClm.columnTypeList.map(item => {
                                                          if (item.value === 'datetime-range') {
                                                            return { ...item, disabled: false };
                                                          }
                                                          return item;
                                                        });
                                                      }
                                                    }) 
                                                  }
                                                })
                                                doAction({
                                                  actionType: 'setValue',
                                                  componentId: 'importDataBase',
                                                  args: {
                                                    value: {
                                                      tableInfos: tableInfosData
                                                    }
                                                  }
                                                });
                                              } else {
                                                const datetimeRange = event.context.data.columnType != 'datetime-range' && event.context.data.__super.columnType == 'datetime-range'
                                                const dateRange = event.context.data.columnType != 'date-range' && event.context.data.__super.columnType == 'date-range'
                                                const timeRange = event.context.data.columnType != 'time-range' && event.context.data.__super.columnType == 'time-range'
                                                if(datetimeRange || dateRange || timeRange){
                                                  const sTimeCode = event.context.data.__super.columnCode+'_stime'
                                                  const eTimeCode = event.context.data.__super.columnCode+'_etime'
                                                  tableInfosData.forEach(item => {
                                                    if (item.id === id) {
                                                      item.columns = item.columns.map(item => {
                                                        if (item.columnCode === sTimeCode) {
                                                          return { ...item, disabled: false };
                                                        } else if(item.columnCode === eTimeCode) {
                                                          return { ...item, disabled: false };
                                                        }
                                                        return item;
                                                      });
                                                    }
                                                  })
                                                  doAction({
                                                    actionType: 'setValue',
                                                    componentId: 'importDataBase',
                                                    args: {
                                                      value: {
                                                        tableInfos: tableInfosData
                                                      }
                                                    }
                                                  });
                                                }
                                              }
                                              doAction({
                                                "actionType": "validate",
                                                "componentId": "importDataBase",
                                                // "outputVar": 'validateResult'
                                              })
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                ],
                                onEvent: {
                                  change: {
                                    actions: [
                                      {
                                        actionType: 'custom',
                                        script: function (
                                          context: any,
                                          doAction: any,
                                          event: any
                                        ) {
                                          const index = event.context.data.__super.index;
                                          const tableInfos = event.context.data.__super.__super.tableInfos;
                                          const val1 = event.data.value.filter(i=>i.columnType === 'datetime-range')
                                          const val2 = event.data.value.filter(i=>i.columnType === 'date-range')
                                          const val3 = event.data.value.filter(i=>i.columnType === 'time-range')
                                          if(val1.length > 0 || val2.length > 0 || val3.length > 0){
                                            
                                          } else {
                                            const sTimeCode = '_stime'
                                            const eTimeCode = '_etime'
                                            tableInfosData.forEach(item => {
                                              if (item.id === event.context.data.__super.id) {
                                                item.columns = item.columns.map(item => {
                                                  if (item.columnCode.includes(sTimeCode)) {
                                                    return { ...item, disabled: false };
                                                  } else if(item.columnCode.includes(eTimeCode)) {
                                                    return { ...item, disabled: false };
                                                  }
                                                  return item;
                                                }); 
                                              }
                                            })
                                            event.data.value = event.data.value.map(item => {
                                              if (item.disabled == true) {
                                                return { ...item, disabled: false }; // 仅需修改时生成新对象
                                              } else {
                                                return item
                                              }
                                            });
                                          }
                                          tableInfos[index].columns = event.data.value;
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'importDataBase',
                                            args: {
                                              value: {
                                                tableInfos
                                              }
                                            }
                                          });
                                        }
                                      }
                                    ]
                                  }
                                }
                              }
                            ]
                          },
                          {
                            reload: true,
                            title: '数据查询',
                            body: {
                              type: 'service',
                              id: "data_search",
                              data: { tableDataAmis: {} },
                              dataProvider: (data: any, setData: Function) => {
                                const columns = data.__super.tableInfos[data.index].columns.map((item2: any) => {
                                  return {
                                    name: item2.columnIndex + ' ',
                                    label: item2.columnName
                                  };
                                });
                                const tableData = data.tableData.map(
                                  (item3: any) => {
                                    return addPrefixToKeys(item3, ' ');
                                  }
                                );
                                setData({
                                  tableDataAmis: {
                                    type: 'service',
                                    data: {
                                      tableData
                                    },
                                    body: {
                                      type: 'crud',
                                      columnsTogglable: false,
                                      columns,
                                      source: '${tableData}'
                                    }
                                  },
                                  tableData
                                });
                              },
                              body: {
                                type: 'amis',
                                name: 'tableDataAmis'
                              }
                            }
                          }
                        ]
                      }
                    ]
                  }
                ],
                "onEvent": {
                  "change": {
                    "actions": [
                      {
                        "actionType": "custom",
                        "script": function(_, doAction, event) {
                          doAction({
                            actionType: "changeActiveKey",
                            componentName: "tabs-change-receiver",
                            "args": {
                                "activeKey": 1
                            }
                          });
                        }
                      },
                    ]
                  },
                }
              }
            ]
          }
        ],
      }],
      "actions": [
        {
          "type": "button",
          "label": "取消",
          "actionType": "close",
        },
        {
          "type": "button",
          "label": "确认",
          "primary": true,
          "actionType": "custom",
          "onEvent": {
            "click": {
              "actions": [
                {
                  "actionType": "validate",
                  "componentId": "importDataBase",
                  "outputVar": 'validateResult'
                },
                {
                  "actionType": "custom",
                  "script": async function (context: any,doAction: any,event: any) {
                    if(event.data.validateResult.error) return;
                    const allData = event.data.__super.tableInfos
                    const selectedData = allData.filter(item => {
                      const tableCode = item.tableCode; // 获取当前对象的 tableCode（如 "c"、"f"）
                      // 判断对象中是否存在 tableCode 对应的属性，且值为 true
                      return item[tableCode] === tableCode;
                    });
                    if(selectedData.length == 0) {
                      toast.error('没有选择导入的表', {
                        position: 'top-center'
                      });
                      return;
                    }
                    for (var m = 0; m < selectedData.length; m++) {
                      const tableInfo = { ...selectedData[m] };
                      delete tableInfo.tableData;
                      delete tableInfo.options;
                      tableInfo.columns = tableInfo.columns.filter(item => {
                        return item?.disabled !== true; // 保留 disabled 不是 true 的元素
                      });
                      selectedData[m] = tableInfo;
                    }
                    const params = {
                      "tableInfos": selectedData,
                      "dsKey": event.data.__super.dsKey
                    }
                    const res = await saveDataBase(params)
                    if (res.data.code != 0) {
                      toast.error(res.data.msg, {
                        position: 'top-right'
                      });
                      return
                    }
                    doAction({
                      actionType: "closeDialog", 
                      componentId: "import_dialog",
                    })
                    doAction({
                      actionType: "reload", 
                      componentId: "entityModel",
                    })          
                  }
                }
              ]
            }
          }
        }
      ]
    }
  };
};
function addPrefixToKeys(obj: any, prefix: string) {
  return Object.keys(obj).reduce((newObj: any, key: string) => {
    // 在原key前添加prefix，并将结果作为新对象的key
    newObj[key + prefix] = obj[key];
    return newObj;
  }, {}); // 初始值为一个空对象
}
