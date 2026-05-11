import React, { useEffect, useState }  from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import {getAppFormContent, getAppStartVarConfig} from '@/api/formRender'
import { useDevBaseUrl } from "@/utils/util"
import {getSchemaTpl} from 'amis-editor';
import { filterData } from '@/bpmn/panel/ElementTask/ServiceTask/getSchemaChange';
import { disposeTaskFormItemStatus } from '@/engine/form'
import initApiStore from "@/store/initApi"
import {advancedFeature} from '@/utils/env'
import {env as amisEnv} from '@/hooks/amis';
import {setTenantId, setToken} from '@/utils/auth'
import appTenantCodeStore from "@/store/appTenantCode"
const AppRestart = () => {
    const [schema, setSchema] = useState({});
    const [variables, setVariables] = useState({});
    const [dataId, setDataId] = useState(null);
    const [show, setShow] = useState(false);
    const [noticeSuccess, setNoticeSuccess] = useState(false);
    //环境变量
    const [envVar, setEnvVar] = useState({});
    const [zcAppVal, setZCAppVal] = useState({});
    const [zcCompanyVal, setZCCompanyVal] = useState({});
    const [zcUserVal, setZCUserVal] = useState({});
    const [value, setValue] = useState({});
    const [varArr, setVarArr] = useState([]);
    const params = new URLSearchParams(window.location.search);
    const definitionId = params.get('definitionId');
    const deployId = params.get('deployId');
    const procInsId  = params.get('procInsId');
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const tenantId = params.get('tenantId');
    const appTenantCode = params.get('appTenantCode');
    if(token){
        setToken({'accessToken': token,  'refreshToken': refreshToken})
    }
    if(tenantId){
        setTenantId(tenantId)
    }
    if(appTenantCode) {
        appTenantCodeStore.dispatch({type: "set", payload: appTenantCode});
    }
    const getFormData = async()=>{
        let param = {
            definitionId: definitionId,
            deployId:deployId,
            procInsId: procInsId,
        }
        let res = await getAppFormContent(param);

        let schema = res.data.data?.formContent ? res.data.data?.formContent : {fields:[]};
        const variables = res.data.data?.variables
        const dataId = res.data.data?.dataId
        const disableFields = res.data.data?.disableFieldsValue
        const hiddenFields = res.data.data?.hiddenFieldsValue
        const forceDisabled = false
        disposeTaskFormItemStatus(schema?.fields, disableFields, hiddenFields, forceDisabled)
        let disAllCombo = []
        let hideAllCombo = []
        for(var i=0;i<schema?.fields.length;i++){
            if(schema.fields[i].type=='combo'){
                for(var j=0;j<schema.fields[i].items.length;j++){
                    const val = schema.fields[i].items[j].disabled ? schema.fields[i].items[j].disabled : false
                    disAllCombo.push(val)
                    const hideVal = schema.fields[i].items[j].hidden ? schema.fields[i].items[j].hidden : false
                    hideAllCombo.push(hideVal)
                    if(schema.fields[i].items[j].type == 'service'){
                        const val = schema.fields[i].items[j].body[0].readOnly
                        disAllCombo.push(val)
                        const hideVal = schema.fields[i].items[j].hidden ? schema.fields[i].items[j].hidden : false
                        hideAllCombo.push(hideVal)
                    }
                }
                schema.fields[i].disabled = [...new Set(disAllCombo)].length > 1 ? false : [...new Set(disAllCombo)][0]
                schema.fields[i].hidden = [...new Set(hideAllCombo)].length > 1 ? false : [...new Set(hideAllCombo)][0]
            }
        }
        let disAllBtnGroupSel = []
        let hideAllBtnGroupSel = []
        for(var i=0;i<schema?.fields.length;i++){
            if(schema.fields[i].type=='button-group-select'){
                for(var j=0;j<schema.fields[i].addControls.length;j++){
                    const val = schema.fields[i].addControls[j].disabled ? schema.fields[i].addControls[j].disabled : false
                    disAllBtnGroupSel.push(val)
                    const hideVal = schema.fields[i].addControls[j].hidden ? schema.fields[i].addControls[j].hidden : false
                    hideAllBtnGroupSel.push(hideVal)
                }
                schema.fields[i].disabled = [...new Set(disAllBtnGroupSel)].length > 1 ? false : [...new Set(disAllBtnGroupSel)][0]
                schema.fields[i].hidden = [...new Set(hideAllBtnGroupSel)].length > 1 ? false : [...new Set(hideAllBtnGroupSel)][0]
            }
        }
        let formValue = res.data.data.processVariables;
        for(var i=0;i<schema.length;i++){
            formValue.push(schema[i].variables)
        }
        //接口增加返回envVar
        let envVar = res?.data?.data?.context?.envVar;
        let zcApp = res?.data?.data?.context?.zcApp;
        let zcCompany = res?.data?.data?.context?.zcCompany;
        let zcUser = res?.data?.data?.context?.zcUser;
        let obj = {};
        for(var i=0;i<envVar?.length;i++){
            obj[envVar[i].key] = envVar[i].value;
        }
        setEnvVar(obj)
        setZCAppVal(zcApp)
        setZCCompanyVal(zcCompany)
        setZCUserVal(zcUser)
        setSchema(schema)
        setVariables(variables)
        setDataId(dataId)
        setShow(true)
        setValue(formValue)
    }
    const getStartVarConfigData = async()=>{
        let param = {
            processDefId: definitionId,
        }
        let res = await getAppStartVarConfig(param);
        const varData = res?.data?.data?.properties ? res?.data?.data?.properties : {}
        const varDataRequired = res?.data?.data?.required ? res?.data?.data?.required : []
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
        setVarArr(varArr)
    }
    const dataObj = {}
    varArr.map((item) => {
        dataObj[item.name] = null;
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
    useEffect(()=>{
        getFormData();
        getStartVarConfigData()
    },[]);
    const pageContent = () => {
        const initApi = schema && schema.formApi ? schema.formApi : ''
        const primaryField = schema && schema.primaryField ? schema.primaryField : ''
        const amisSchema = {
            "type": "form",
            // "title": schema.title,
            body: [
                {
                    type: 'input-sub-form',
                    label: '流程入参',
                    name: 'startVariables',
                    btnLabel: '配置流程入参',
                    visibleOn: varArr.length > 0 ? 'true' : 'false',
                    form: {
                        "data": dataObj,
                        title: '流程入参',
                        body: variableCfg()
                    }
                },
                ...(schema.fields ? schema.fields : [])
                // {
                //     type: 'input-sub-form',
                //     label: '表单',
                //     name: 'formVariables',
                //     btnLabel: '配置表单',
                //     visibleOn: schema?.fields ? 'true' : 'false',
                //     form: {
                //         title: '表单',
                //         initApi: (schema.dataId != null && schema.dataId != '' ) ? initApi.replace('${' + primaryField + '}', schema.dataId) : '',
                //         body: schema.fields ? schema.fields : [],
                //         data:  !(schema.dataId != null && schema.dataId != '' )  ? variables : {},
                //     }
                // }
            ],
            "api": {
                "method": "post",
                "url": useDevBaseUrl("/processManage/process/start"),
                "data": {
                    "variables": {
                        "&": "$$",
                    },
                    "processDefId": definitionId,
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
            initApi: (schema.dataId != null && schema.dataId != '' ) ? initApi.replace('${' + primaryField + '}', schema.dataId) : '',
            data: !(schema.dataId != null && schema.dataId != '' )  ? variables : {},
            onEvent:{
                "submitSucc": {
                    "actions": [
                        {
                            "actionType": "custom",
                            script: function () {
                                setNoticeSuccess(true)
                            }
                        }
                    ]
                }
            }
        }
        return (
            <div id="form-edit">
                {amisRender(amisSchema,{
                    context: {
                        zcApp: zcAppVal,
                        zcCompany: zcCompanyVal,
                        zcUser: zcUserVal,
                        app: initApiStore.getState().initApi,
                        ...value,
                        ...envVar
                    },
                }, {
                    fetcher: service,
                    theme: amisEnv.theme
                })}
            </div>
        )
    }
    if (noticeSuccess) {
    // 检查 uni 是否已初始化
        if (window.uni) {
            // 已初始化，直接调用
            uni.postMessage({
                data: {
                action: 'backToList'
                }
            });
        } else {
            // 未初始化，监听事件等待触发（仅可能在页面刚加载时出现）
            document.addEventListener('UniAppJSBridgeReady', function() {
                uni.postMessage({
                    data: {
                        action: 'backToList'
                    }
                });
            });
        }
    }
    return (
        <div style={{ border: '1px solid #bfbfbf', paddingTop: '10px', paddingBottom: '10px'}}>
            {
                show ?  pageContent() : ' '
            }
        </div>
    )
}
export default AppRestart;

