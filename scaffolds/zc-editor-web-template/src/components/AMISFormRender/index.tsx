import React, { useEffect, useState }  from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { useDevBaseUrl } from "@/utils/util"
import {getSchemaTpl} from 'amis-editor';
import { filterData } from '@/bpmn/panel/ElementTask/ServiceTask/getSchemaChange';
import { disposeTaskFormItemStatus } from '@/engine/form'
import initApiStore from "@/store/initApi"
import {advancedFeature} from '@/utils/env'
import {env} from '@/hooks/amis'
const AMISFormRender: React.FC = (props) => {
  //接口增加返回envVar
  let envVar = props?.envVarVal?.envVar;
  let zcAppVal = props?.envVarVal?.zcApp;
  let zcCompanyVal = props?.envVarVal?.zcCompany;
  let zcUserVal = props?.envVarVal?.zcUser;
  let url = props?.isEditor ? useDevBaseUrl("/processManage/process/start") : useDevBaseUrl("/application/processManage/process/start")
  let obj = {};
  for(var i=0;i<envVar?.length;i++){
      obj[envVar[i].key] = envVar[i].value;
  }
  const varData = props.variablesConfig?.properties ? props.variablesConfig?.properties : {}
  const varDataRequired = props.variablesConfig?.required ? props.variablesConfig?.required : []
  let varArr = []
  for (let key in varData) {
    if (varData.hasOwnProperty(key)) {
      varArr.push({
        label: varData[key].title,
        name: varData[key].title,
        type: varData[key].types ? varData[key].types : varData[key].type,
        // required: varData[key].required ? varData[key].required : false,
        required: varDataRequired.includes(varData[key].title) ? true : false,
        defaultValue: varData[key].default,
        arrayType: varData[key].arrayType,
      })
    }
  }
  const dataObj = {}
  varArr.map((item) => {
    dataObj[item.name] = undefined;
    return dataObj;
  });
  const variableCfg = () => {
    const result = []
    for(var j=0;j<varArr.length;j++){
      if(varArr[j].type == 'array' && varArr[j].arrayType == 'string' ){
        result.push(getSchemaTpl('formulaControl-hour', {
          variables: filterData,
          label: varArr[j].label,
          name: varArr[j].name,
          required: varArr[j].required,
          value: varArr[j].defaultValue,
          advancedFeature: advancedFeature,
        }))
      } else if(varArr[j].type == 'string' && !varArr[j].arrayType){
        result.push(getSchemaTpl('tplFormulaControl', {
          variables: filterData,
          label: varArr[j].label,
          name: varArr[j].name,
          required: varArr[j].required,
          advancedFeature: advancedFeature,
          value: varArr[j].defaultValue,
          formulaEchoVal: false,
        }))
      } else if (varArr[j].type == 'number') {
        const valueType = {
          onDisabled: false,
          placeholder: '请输入',
          type: 'number'
        };
        result.push(getSchemaTpl('formulaControl-hour', {
          variables: filterData,
          label: varArr[j].label,
          name: varArr[j].name,
          required: varArr[j].required,
          advancedFeature: advancedFeature,
          value: varArr[j].defaultValue,
          valueType: valueType
        }))
      } else if (varArr[j].type== 'boolean') {
        const valueType = {
          type: 'select',
          placeholder: '请选择',
          options: [
            {
              value: true,
              label: '开启'
            },
            {
              value: false,
              label: '关闭'
            }
          ]
        };
        result.push(getSchemaTpl('formulaControl-hour', {
          variables: filterData,
          label: varArr[j].label,
          name: varArr[j].name,
          required: varArr[j].required,
          advancedFeature: advancedFeature,
          value: varArr[j].defaultValue,
          valueType: valueType
        }))
      } else if(varArr[j].type== 'user'){
        result.push(
          {
            type: 'ae-formulaControl',
            label: varArr[j].label,
            name: varArr[j].name,
            required: varArr[j].required,
            formulaEchoVal: false,
            advancedFeature: advancedFeature,
            value: varArr[j].defaultValue,
            rendererSchema: {
              'type': 'user-select',
              'searchable':true,
              'clearable':true,
              'rightButton':true,
              'selectMode': "associated",
              'leftMode': "tree",
              'source': "app://user/source"
            }
          }
        )
      } else if(varArr[j].type== 'users'){
        result.push(
          {
            type: 'ae-formulaControl',
            label: varArr[j].label,
            name: varArr[j].name,
            required: varArr[j].required,
            formulaEchoVal: false,
            advancedFeature: advancedFeature,
            value: varArr[j].defaultValue,
            rendererSchema: {
              'type': 'user-select',
              'multiple':true,
              'searchable':true,
              'clearable':true,
              'rightButton':true,
              'selectMode': "associated",
              'leftMode': "tree",
              'source': "app://user/source"
            }
          }
        )
      } else if (varArr[j].type == 'objects' || (varArr[j].type == 'array' && varArr[j].arrayType == 'object')) {
        result.push(getSchemaTpl('formulaControl-hour', {
          variables: filterData,
          value: varArr[j].defaultValue,
          label: varArr[j].label,
          name: varArr[j].name,
          required: varArr[j].required,
          advancedFeature: advancedFeature,
          containDisabled: true,
        }))
      } else {
        result.push(getSchemaTpl('formulaControl-hour', {
          variables: filterData,
          value: varArr[j].defaultValue,
          label: varArr[j].label,
          name: varArr[j].name,
          required: varArr[j].required,
          advancedFeature: advancedFeature,
        }))
      }
    }
    return result
  }
  const disableFields = props.disFields
  const hiddenFields = props.hiddenFields
  const forceDisabled = false
  disposeTaskFormItemStatus(props?.schema?.fields, disableFields, hiddenFields, forceDisabled)
  let disAllCombo = []
  let hideAllCombo = []
  for(var i=0;i<props?.schema?.fields.length;i++){
    if(props?.schema?.fields[i].type=='combo'){
      for(var j=0;j<props?.schema?.fields[i].items.length;j++){
          const val = props?.schema?.fields[i].items[j].disabled ? props?.schema?.fields[i].items[j].disabled : false
          disAllCombo.push(val)
          const hideVal = props?.schema?.fields[i].items[j].hidden ? props?.schema?.fields[i].items[j].hidden : false
          hideAllCombo.push(hideVal)
          if(props?.schema?.fields[i].items[j].type == 'service'){
              const val = props?.schema?.fields[i].items[j].body[0].readOnly
              disAllCombo.push(val)
              const hideVal = props?.schema?.fields[i].items[j].hidden ? props?.schema?.fields[i].items[j].hidden : false
              hideAllCombo.push(hideVal)
          }
      }
      props.schema.fields[i].disabled = [...new Set(disAllCombo)].length > 1 ? false : [...new Set(disAllCombo)][0]
      props.schema.fields[i].hidden = [...new Set(hideAllCombo)].length > 1 ? false : [...new Set(hideAllCombo)][0]
    }
  }
  let disAllBtnGroupSel = []
  let hideAllBtnGroupSel = []
  for(var i=0;i<props?.schema?.fields.length;i++){
    if(props?.schema?.fields[i].type=='button-group-select'){
      for(var j=0;j<props?.schema?.fields[i]?.addControls?.length;j++){
          const val = props?.schema?.fields[i].addControls[j].disabled ? props?.schema?.fields[i].addControls[j].disabled : false
          disAllBtnGroupSel.push(val)
          const hideVal = props?.schema?.fields[i].addControls[j].hidden ? props?.schema?.fields[i].addControls[j].hidden : false
          hideAllBtnGroupSel.push(hideVal)
      }
      props.schema.fields[i].disabled = [...new Set(disAllBtnGroupSel)].length > 1 ? false : [...new Set(disAllBtnGroupSel)][0]
      props.schema.fields[i].hidden = [...new Set(hideAllBtnGroupSel)].length > 1 ? false : [...new Set(hideAllBtnGroupSel)][0]
    }
  }
  const initApi = props.schema && props.schema.formApi ? props.schema.formApi : ''
  const primaryField = props.schema && props.schema.primaryField ? props.schema.primaryField : ''
  const amisSchema = {
    type: "form",
    title: "",
    initApi: (props.dataId != null && props.dataId != '' ) ? initApi.replace('${' + primaryField + '}', props.dataId) : '',
    data: !(props.dataId != null && props.dataId != '' )  ? props.variables : {},
    "api": {
      "method": "post",
      "url": url,
      "data": {
        "variables": {
          "&": "$$"
        },
        "processDefId": props.definitionId
      },
      requestAdaptor: function (api:any, context:any) {
        if(context.startVariables) delete context.startVariables
        api.data.variables.formVariables = context
        Object.keys(api.data.variables).forEach(key => {
          if(key != 'formVariables' && key != 'startVariables') {
            delete api.data.variables[key];
          }
        })
        return {
            ...api,
        };
      },
    },
    onEvent:{
      "submitSucc": {
          "actions": [
              {
                "actionType": "closeDialog",
                "componentId": "start_process"
              }
          ]
      }
    },
    body: [
      {
        type: 'input-sub-form',
        label: '流程入参',
        name: 'startVariables',
        btnLabel: '配置流程入参',
        visibleOn: props.variablesConfig?.properties ? 'true' : 'false',
        form: {
          "data": dataObj,
          title: '流程入参',
          body: variableCfg()
        }
      },
      ...(props?.schema ? props?.schema?.fields: [])
      // {
      //     type: 'input-sub-form',
      //     label: '表单',
      //     name: 'formVariables',
      //     btnLabel: '配置表单',
      //     visibleOn: props?.schema?.fields ? 'true' : 'false',
      //     form: {
      //         title: '表单',
      //         initApi: (props.dataId != null && props.dataId != '' ) ? initApi.replace('${' + primaryField + '}', props.dataId) : '',
      //         body: props?.schema ? props?.schema?.fields: [],
      //         data:  !(props.dataId != null && props.dataId != '' )  ? props.variables : {},
      //     }
      // }
    ],
  };

  return (
    <div style={{ border: '1px solid white'}}>
      {amisRender(
          amisSchema,
          {
            context: {
              zcApp: zcAppVal,
              zcCompany: zcCompanyVal,
              zcUser: zcUserVal,
              app: initApiStore.getState().initApi,
              ...obj
            }
          },
          {
            fetcher: service,
            theme: env.theme,
          }
        )}
    </div>
  )
}
export default AMISFormRender;
