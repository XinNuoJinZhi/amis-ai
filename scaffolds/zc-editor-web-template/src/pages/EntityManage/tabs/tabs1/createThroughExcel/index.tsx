import { useDevBaseUrl } from '@/utils/util';
import { Tabs, TabsProps } from 'antd';
import React from 'react';
import {addRule} from 'amis'
import { allOptions } from './options';
import {saveExcel} from "@/api/entitymanage"
import {toast} from 'amis';
export default () => {
  let successFileData: any = [];
  let cacheFileName:any = '';
  let dsKeyVal:any = '';
  return {
    type: 'button',
    label: '通过 Excel 创建',
    actionType: 'dialog',
    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:create')}",
    "onEvent": {
      "click": {
        "actions": [
          {
            "actionType": "custom",
            script: function (_: any, doAction: any, event: any) {
              //字段名校验
              addRule('isHeadCodeChecked',(values, value) => {
                if(values.selected){
                  if(values.columnType == 'primary-key') { // 当前选择了主键
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'TENANTCODE', 'CREATEDAT', 'UPDATEDAT', 'CREATEDBY', 'UPDATEDBY', 'PARENTID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、tenantCode、createdAt、updatedAt、createdBy、updatedBy、parentId关键字'
                      };
                    }
                  } else if (values.columnType == 'tenantCode'){ // 当前选择了租户编码
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'CREATEDAT', 'UPDATEDAT', 'CREATEDBY', 'UPDATEDBY', 'PARENTID', 'ID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、createdAt、updatedAt、createdBy、updatedBy、parentId、id关键字'
                      };
                    }
                  } else if (values.columnType == 'createdAt'){ // 当前选择了创建时间
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'TENANTCODE', 'UPDATEDAT', 'CREATEDBY', 'UPDATEDBY', 'PARENTID', 'ID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {  
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、tenantCode、updatedAt、createdBy、updatedBy、parentId、id关键字'
                      };
                    }
                  } else if (values.columnType == 'updatedAt'){ // 当前选择了更新时间
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'TENANTCODE', 'CREATEDAT', 'CREATEDBY', 'UPDATEDBY', 'PARENTID', 'ID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {  
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、tenantCode、createdAt、createdBy、updatedBy、parentId、id关键字'
                      };
                    }
                  } else if (values.columnType == 'createdBy'){ // 当前选择了创建人
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'TENANTCODE', 'CREATEDAT', 'UPDATEDAT', 'UPDATEDBY', 'PARENTID', 'ID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {  
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、tenantCode、createdAt、updatedAt、updatedBy、parentId、id关键字'
                      };
                    }
                  } else if (values.columnType == 'updatedBy'){ // 当前选择了更新人
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'TENANTCODE', 'CREATEDAT', 'UPDATEDAT', 'CREATEDBY', 'PARENTID', 'ID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {  
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、tenantCode、createdAt、updatedAt、createdBy、parentId、id关键字'
                      };
                    }
                  } else if (values.columnType == 'parent'){ // 当前选择了父级
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'TENANTCODE', 'CREATEDAT', 'UPDATEDAT', 'CREATEDBY', 'UPDATEDBY', 'ID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {  
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、tenantCode、createdAt、updatedAt、createdBy、updatedBy、id关键字'
                      };
                    }
                  } else if (values.columnType != 'parent' && values.columnType != 'updatedBy' && values.columnType != 'createdBy' && values.columnType != 'updatedAt' && values.columnType != 'tenantCode'  && values.columnType != 'primary-key' && values.columnType != 'createdAt'){ // 当前选择了其他
                    const headNameCode = ['DELETEDBY', 'DELETEDAT', 'DELETED', 'TENANTCODE', 'CREATEDAT', 'UPDATEDAT', 'CREATEDBY', 'UPDATEDBY', 'PARENTID', 'ID']
                    if(headNameCode.includes(values.headCode.toUpperCase())) {
                      return {
                        error: true,
                        msg: '字段名不能是deletedBy、deletedAt、deleted、tenantCode、createdAt、updatedAt、createdBy、updatedBy、parentId、id关键字'
                      };
                    }
                  }
                  return true
                } else {
                  return true
                }
              })
              
              //显示标题校验
              addRule('isHeadNameChecked',(values, value) => {
                if(values.selected){
                  if(values.columnType == 'primary-key') { // 当前选择了主键
                    const headNameAll = ['删除人', '删除时间', '删除标志', '租户编码', '创建时间', '更新时间', '创建人', '更新人', '父级']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、租户编码、创建时间、更新时间、创建人、更新人、父级关键字'
                      };
                    }
                  } else if (values.columnType == 'tenantCode'){ // 当前选择了租户编码
                    const headNameAll = ['删除人', '删除时间', '删除标志', 'ID', '创建时间', '更新时间', '创建人', '更新人', '父级']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、ID、创建时间、更新时间、创建人、更新人、父级关键字'
                      };
                    }
                  } else if (values.columnType == 'createdAt'){ // 当前选择了创建时间
                    const headNameAll = ['删除人', '删除时间', '删除标志', 'ID', '租户编码', '更新时间', '创建人', '更新人', '父级']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、ID、租户编码、更新时间、创建人、更新人、父级关键字'
                      };
                    }
                  } else if (values.columnType == 'updatedAt'){ // 当前选择了更新时间
                    const headNameAll = ['删除人', '删除时间', '删除标志', 'ID', '租户编码', '创建时间', '创建人', '更新人', '父级']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、ID、租户编码、创建时间、创建人、更新人、父级关键字'
                      };
                    }
                  } else if (values.columnType == 'createdBy'){ // 当前选择了创建人
                    const headNameAll = ['删除人', '删除时间', '删除标志', 'ID', '租户编码', '创建时间', '更新时间', '更新人', '父级']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、ID、租户编码、创建时间、更新时间、更新人、父级关键字'
                      };
                    }
                  } else if (values.columnType == 'updatedBy'){ // 当前选择了更新人
                    const headNameAll = ['删除人', '删除时间', '删除标志', 'ID', '租户编码', '创建时间', '更新时间', '创建人', '父级']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、ID、租户编码、创建时间、更新时间、创建人、父级关键字'
                      };
                    }
                  } else if (values.columnType == 'parent'){ // 当前选择了父级
                    const headNameAll = ['删除人', '删除时间', '删除标志', 'ID', '租户编码', '创建时间', '更新时间', '创建人', '更新人']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、ID、租户编码、创建时间、更新时间、创建人、更新人关键字'
                      };
                    }
                  } else if (values.columnType != 'parent' && values.columnType != 'updatedBy' && values.columnType != 'createdBy' && values.columnType != 'updatedAt' && values.columnType != 'tenantCode'  && values.columnType != 'primary-key' && values.columnType != 'createdAt'){ // 当前选择了其他
                    const headNameAll = ['删除人', '删除时间', '删除标志', 'ID', '租户编码', '创建时间', '更新时间', '创建人', '更新人', '父级']
                    if(headNameAll.includes(values.headName)) {
                      return {
                        error: true,
                        msg: '显示标题不能是删除人、删除时间、删除标志、ID、租户编码、创建时间、更新时间、创建人、更新人、父级关键字'
                      };
                    }
                  }
                  return true
                } else {
                  return true
                }
              })
              
              //字段类型
              addRule('isClmTypeChecked',(values, value) => {
                if(values.selected){
                  const checkData = successFileData.filter (i=>i.id == values.__super.id)[0].headInfos
                  if(values.columnType == 'parent') { // 当前选择了父级
                    const parentAll = checkData.filter(i=> i.columnType == 'parent')
                    if(parentAll.length > 1) {
                      return {
                        error: true,
                        msg: '父级只能有一个'
                      };
                    }
                    const pkAll = checkData.filter(i=> i.columnType == 'primary-key')
                    if(pkAll.length == 0 && values.sourceColumnType != 'bigint') {
                      return {
                        error: true,
                        msg: '没有设主键字段时父级字段的源类型必须是bigint'
                      };
                    } else if (pkAll.length == 1 && pkAll[0].sourceColumnType != values.sourceColumnType) {
                      return {
                        error: true,
                        msg: '设主键字段时父级的源类型必须与主键字段相同'
                      };
                    }
                  } else if (values.columnType == 'primary-key') { //当前是主键
                    const pkAll = checkData.filter(i=> i.columnType == 'primary-key')
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
                  } else if (values.columnType == 'deleted') { // 当前是删除标志
                    const deletedAll = checkData.filter(i=> i.columnType == 'deleted')
                    if(deletedAll.length > 1){
                      return {
                        error: true,
                        msg: '删除标志只能有一个'
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
      title: '通过 Excel 创建模型',
      id: 'import_excel_dialog',
      body: {
        id: 'successFile',
        data: {
          successFileData: [],
          cacheFileName: '',
          dsKeyVal: '',
          isUpload: false
        },
        type: 'form',
        body: [
          {
            type: 'service',
            dataProvider: (data: any, setData: Function) => {
              const params = new URLSearchParams(window.location.search);
              // 获取某个参数的值
              const dsKey = params.get('dsKey'); // 'paramName' 是你想要获取的参数名称
              setData({ dsKey });
            },
            body: {
              type: 'input-file',
              "accept": ".xlsx",
              name: 'file',
              required: true,
              label: '',
              drag: true,
              receiver: {
                url: useDevBaseUrl('/entitymanage/table/excelModel'),
                data: { dsKey: '${dsKey}' }
              },
              onEvent: {
                success: {
                  actions: [
                    {
                      actionType: 'custom',
                      script: (context: any, doAction: any, event: any) => {
                        event.data.value.tableInfos.forEach((item, index: number) => {
                          item.id = index;
                          item.tableCode = item.tableCode.replace(/\$/g, '\\$')
                          item.tableName = item.tableName.replace(/\$/g, '\\$')
                          item.options = [{
                            label: item.tableName,
                            value: item.index.toString()
                          }]
                          item.headInfos.forEach((itemClm, itemClmIndex)=> {
                            itemClm.selected = false
                          })
                        });
                        cacheFileName = event.data.value.cacheFileName
                        dsKeyVal = event.data.value.dsKey
                        doAction({
                          actionType: 'setValue',
                          componentId: 'successFile',
                          args: {
                            value: {
                              successFileData: [],
                              isUpload: true,
                              cacheFileName: '',
                              dsKeyVal: ''
                            }
                          }
                        });
                        event.data.value.tableInfos.forEach((item, index: number) => {
                          item.headInfos.forEach((itemClm, itemClmIndex)=> {
                            itemClm.columnTypeList = allOptions[itemClm.sourceColumnType]
                          })
                        })
                        setTimeout(() => {
                          doAction({
                            actionType: 'setValue',
                            componentId: 'successFile',
                            args: {
                              value: {
                                successFileData: event.data.value.tableInfos,
                                isUpload: true,
                                cacheFileName: cacheFileName,
                                dsKeyVal: dsKeyVal
                              }
                            }
                          });
                        }, 10)
                        doAction({
                          actionType: 'changeActiveKey',
                          componentName: 'tabs-change-receiver',
                          args: {
                            activeKey: 1
                          }
                        });
                        successFileData = JSON.parse(JSON.stringify(event.data.value.tableInfos));
                      }
                    }
                  ]
                },
                remove: {
                  actions: [
                    {
                      actionType: 'custom',
                      script: (context: any, doAction: any, event: any) => {
                        doAction({
                          actionType: 'setValue',
                          componentId: 'successFile',
                          args: {
                            value: {
                              successFileData: [],
                              isUpload: false,
                              cacheFileName: '',
                              dsKeyVal: ''
                            }
                          }
                        });
                      }
                    }
                  ]
                },
                fail: {
                  actions: [
                    {
                      actionType: 'custom',
                      script: (context: any, doAction: any, event: any) => {
                        doAction({
                          actionType: 'toast',
                          args: {
                            msgType: "error",
                            msg: event.data.error.message,
                            position: "top-right"
                          }
                        })
                      }
                    }
                  ]
                }
              }
            }
          },

          {
            type: 'container',
            visibleOn: '${isUpload}',
            body: [
              '数据预览（前 5 条）',
              {
                type: 'tabs',
                tabsMode: 'vertical',
                source: '${successFileData}',
                tabs: [
                  {
                    // reload: true,
                    // title: '${tableName}',
                    "title": {
                      "type": "page",
                      "className": "importDataBaseSource",
                      "body": [
                        // {
                        //   "type": "tpl",
                        //   "tpl": "${tableName + ' (' + tableCode + ')'}",
                        // },
                        {
                          "name": "${index}",
                          "type": "checkboxes",
                          "label": "",
                          "source": "${options}",
                          "onEvent": {
                            "change": {
                              "actions": [
                                {
                                  "actionType": "custom",
                                  "script": async function (context: any,doAction: any,event: any) {
                                    successFileData.forEach(item => {
                                      //勾选
                                      if (event.data.value && item.index == event.data.value) {
                                        item[event.data.value] = event.data.value
                                        item.headInfos.forEach(column => {
                                          if (column.selected !== true) {
                                            column.selected = true;
                                          }
                                        });
                                      } else if(event.data.value == ''){
                                        //去勾选
                                        if (item.index == event.data.__rendererData.index) {
                                          item[event.data.__rendererData.index] = ''
                                          item.headInfos.forEach(column => {
                                            if (column.selected == true) {
                                              column.selected = false;
                                            }
                                          });
                                        }
                                      }
                                    });
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'successFile',
                                      args: {
                                        value: {
                                          successFileData
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
                          // "className": "text-info text-base iconLeft",
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
                                        "label": "模型名称",
                                        "required": true,
                                        "value": "${tableName}",
                                      },
                                      {
                                        "type": "input-text",
                                        "name": "tableCode",
                                        "label": "表名",
                                        "desc": "不可修改，请仔细填写，建议只用小写英文和下划线",
                                        "placeholder": "请填写表名",
                                        "required": true,
                                        "value": "${tableCode}",
                                        "maxLength": 64,
                                        "validations": {
                                          "matchRegexp": "^[a-zA-Z_][A-Za-z0-9_]*$"
                                        },
                                        "validationErrors": {
                                          "matchRegexp": "请填写规范的表名"
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
                                              successFileData.forEach(item => {
                                                  if (item.id === id) {
                                                    if(item.tableCode && item[item.tableCode]) {
                                                      delete item[item.tableCode]
                                                      item[event.data.tableName] = event.data.tableCode
                                                    }
                                                    item.tableCode = event.data.tableCode
                                                    item.tableName = event.data.tableName
                                                    item.tableCode = event.data.tableCode.replace(/\$/g, '\\$')
                                                    item.tableName = event.data.tableName.replace(/\$/g, '\\$')
                                                    item.options[0].label = event.data.tableName.replace(/\$/g, '\\$')
                                                  }
                                                }
                                              );
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'successFile',
                                                args: {
                                                  value: {
                                                    successFileData
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
                        type: 'tabs',
                        name: 'tabs-change-receiver',
                        tabs: [
                          {
                            title: '元数据查询',
                            body: [
                              {
                                type: 'input-table',
                                autoFillHeight: true,
                                name: 'headInfos',
                                labelWidth: 1,
                                columns: [
                                  {
                                    name: 'headCode',
                                    label: '字段名',
                                    type: 'input-text',
                                    required: true,
                                    // validations: 'isVariableName',
                                    "validations": {
                                      "isHeadCodeChecked": true
                                    },
                                    "validateOnChange": true,
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
                                              const headIndex =
                                                event.context.data.__super
                                                  .headIndex;
                                              const id =
                                                event.context.data.__super
                                                  .__super.id;
                                              successFileData.forEach(
                                                item => {
                                                  if (item.id === id) {
                                                    item.headInfos[
                                                        headIndex
                                                      ].headCode =
                                                      event.data.value;
                                                  }
                                                }
                                              );
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'successFile',
                                                args: {
                                                  value: {
                                                    successFileData
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
                                    name: 'headName',
                                    label: '显示标题',
                                    type: 'input-text',
                                    required: true,
                                    "validations": {
                                      "isHeadNameChecked": true
                                    },
                                    "validateOnChange": true,
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
                                              const headIndex =
                                                event.context.data.__super
                                                  .headIndex;
                                              const id =
                                                event.context.data.__super
                                                  .__super.id;
                                              successFileData.forEach(
                                                item => {
                                                  if (item.id === id) {
                                                    item.headInfos[
                                                        headIndex
                                                      ].headName =
                                                      event.data.value;
                                                  }
                                                }
                                              );
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'successFile',
                                                args: {
                                                  value: {
                                                    successFileData
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
                                              const headIndex = event.context.data.__super.headIndex;
                                              const id = event.context.data.__super.__super.id;
                                              successFileData.forEach(item => {
                                                if (item.id === id) {
                                                    item.headInfos[headIndex].columnType =event.data.value;
                                                    item.headInfos[headIndex].headCode = event.context.data.__super.headCode;
                                                    item.headInfos[headIndex].headName =event.context.data.__super.headName;
                                                  }
                                                }
                                              );
                                              doAction({
                                                "actionType": "validate",
                                                "componentId": "successFile",
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
                                          const index =
                                            event.context.data.__super.index;
                                          const successFileData =
                                            event.context.data.__super.__super
                                              .successFileData;
                                          successFileData[index].headInfos =
                                            event.data.value;
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'successFile',
                                            args: {
                                              value: {
                                                successFileData
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
                            body: [{
                              "type": "alert",
                              "body": "温馨提示：此处的预览数据不会自动导入数据库，请创建表后手动导入数据",
                              "level": "warning",
                              "className": "mb-1"
                            },
                            {
                              type: 'service',
                              id: "data_search",
                              data: { tableDataAmis: {} },
                              dataProvider: (data: any, setData: Function) => {
                                // debugger
                                const columns = data.__super.successFileData[
                                  data.index
                                ].headInfos.map((item2: any) => {
                                  return {
                                    name: item2.headIndex + ' ',
                                    label: item2.headName
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
                            }]
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
        ]
      },
      "actions": [
        {
          "type": "button",
          "label": "取消",
          "close": true,
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
                  "componentId": "successFile",
                  "outputVar": 'validateResult'
                },
                {
                  "actionType": "custom",
                  "script": async function (context: any,doAction: any,event: any) {
                    if(event.data.validateResult.error) return;
                    const allData = event.data.__super.successFileData
                    const selectedData = allData.filter(item => {
                      const index = item.index;
                      return item[index] == item.index.toString();
                    });
                    if(selectedData.length == 0) {
                      toast.error('没有选择导入的表', {
                        position: 'top-center'
                      });
                      return;
                    }
                    //删除后当点击确定按钮上传不成功，再点击数据查询页面没有内容
                    // for(var i=0;i<selectedData.length;i++) {
                    //   delete selectedData[i].tableData
                    // }
                    const params = {
                      "tableInfos": selectedData,
                      "cacheFileName": context.props.data.cacheFileName,
                      "dsKey": context.props.data.dsKeyVal
                    }
                    const res = await saveExcel(params)
                    if(res.data.code == 0){
                      if(res.data.data.length > 0) {
                        toast.success(res.data.data.join(''), {
                          position: "top-right"
                        })
                      }
                      doAction({
                        actionType: "closeDialog", 
                        componentId: "import_excel_dialog",
                      })
                      doAction({
                        actionType: "reload", 
                        componentId: "entityModel",
                      })
                    } else {
                      toast.error(res.data.msg, {
                        position: "top-right"
                      })
                    }
                  }
                }
              ]
            }
          }
        }
      ],
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
