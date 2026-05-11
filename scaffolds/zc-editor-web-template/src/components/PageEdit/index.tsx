import React, { useEffect, useState } from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { getProcessFormData } from '@/api/formRender'
import { disposeTaskFormItemStatus } from '@/engine/form'
import { processAndFetchOptions } from "@/utils/util"
import initApiStore from "@/store/initApi"
import {toast} from 'amis';
import permStore from '@/store/permission';
import {env as amisEnv} from '@/hooks/amis';

const PageEdit = () => {
    const [schema, setSchema] = useState('');
    const [show, setShow] = useState(false);
    const [toParentHeight, setToParentHeight] = useState()
    //环境变量
    const [envVar, setEnvVar] = useState({});
    const [zcAppVal, setZCAppVal] = useState({});
    const [zcCompanyVal, setZCCompanyVal] = useState({});
    const [zcUserVal, setZCUserVal] = useState({});
    const [value, setValue] = useState({});
    const formInfo = React.useRef();

    const getFormData = async () => {
        const params = new URLSearchParams(window.location.search);
        const procInsId = params.get('procInsId');
        const taskId = params.get('taskId');
        const ccIdentification = params.get('ccIdentification');
        let param = {
            procInsId: procInsId,
            taskId: taskId,
            ccIdentification: ccIdentification
        }
        let res = await getProcessFormData(param);
        let schema = res.data.data.taskFormData;
        let disableFields = schema.disableFields ? schema.disableFields : [];
        let hiddenFields = schema.hiddenFields ? schema.hiddenFields : [];
        const forceDisabled = false
        disposeTaskFormItemStatus(schema.fields, disableFields, hiddenFields, forceDisabled)
        let disAllCombo = []
        let hideAllCombo = []
        for(var i=0;i<schema.fields.length;i++){
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
        for(var i=0;i<schema.fields.length;i++){
            if(schema.fields[i].type=='button-group-select'){
                for(var j=0;j<schema.fields[i]?.addControls?.length;j++){
                    const val = schema.fields[i].addControls[j].disabled ? schema.fields[i].addControls[j].disabled : false
                    disAllBtnGroupSel.push(val)
                    const hideVal = schema.fields[i].addControls[j].hidden ? schema.fields[i].addControls[j].hidden : false
                    hideAllBtnGroupSel.push(hideVal)
                }
                schema.fields[i].disabled = [...new Set(disAllBtnGroupSel)].length > 1 ? false : [...new Set(disAllBtnGroupSel)][0]
                schema.fields[i].hidden = [...new Set(hideAllBtnGroupSel)].length > 1 ? false : [...new Set(hideAllBtnGroupSel)][0]
            }
        }
        let formValue = res.data.data.taskFormData.variables;
        //接口增加返回envVar
        let envVar = res?.data?.data?.context?.envVar;
        let zcApp = res?.data?.data?.context?.zcApp;
        let zcCompany = res?.data?.data?.context?.zcCompany;
        let zcUser = res?.data?.data?.context?.zcUser;
        let obj = {};
        for (var i = 0; i < envVar?.length; i++) {
            obj[envVar[i].key] = envVar[i].value;
        }
        setEnvVar(obj)
        setZCAppVal(zcApp)
        setZCCompanyVal(zcCompany)
        setZCUserVal(zcUser)
        setSchema(schema)
        setShow(true)
        setValue(formValue)
        //监听来自父页面的消息，并执行函数
        window.addEventListener('message', async(event) => {
            if (event.data.type === 'validate') {
                await formInfoValidate()
            }
        }, false)

    }
    useEffect(() => {
        getFormData();
    }, []);
    //填写表单-form校验
    const formInfoValidate = async () => {
        const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
        const isResult = await formInfoObj.validate()
        if(isResult){
            const fetcher: any = formInfoObj.props.env.fetcher
            const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, formInfo.current)
            formInfoObj.props.$schema.fields = fieldsVal
            delete formInfoObj.props.$schema.body
            var message = {
                param1: {data: formInfoObj.props.data, schema: formInfoObj.props.$schema },
            };
            if (message.param1) {
                window.parent.postMessage({
                    type: 'formResult',
                    data: JSON.stringify(message)
                }, "*");
                //告诉父，我校验完了
                window.parent.postMessage({
                    type: 'validateResult',//消息类型，用于父页面区分不同的消息data: result
                    data: isResult
                }, '*');
            }
        } else {
            //告诉父，我校验完了
            window.parent.postMessage({
                type: 'validateResult',//消息类型，用于父页面区分不同的消息data: result
                data: isResult
            }, '*');
        }
    }
    const pageContent = () => {
        const initApi = schema && schema.formApi ? schema.formApi : ''
        const primaryField = schema && schema.primaryField ? schema.primaryField : ''
        const amisSchema = {
            type: "form",
            initApi: (schema.dataId != null && schema.dataId != '' ) ? initApi.replace('${' + primaryField + '}', schema.dataId) : '',
            name: 'formInfo',
            actions: [],
            title: schema.title,
            body: schema.fields ? schema.fields : [],
            data:  !(schema.dataId != null && schema.dataId != '' )  ? schema.variables : {},
            onEvent: {
                "inited": {
                    actions: [{
                        "actionType": "custom",
                        script: function (data: any) {
                            setTimeout(()=>{
                                setToParentHeight(window.document.documentElement.scrollHeight)
                            }, 100)
                        }
                    },...(schema?.onEvent?.inited?.actions ? schema?.onEvent?.inited?.actions : [])]
                },
                "init": schema?.onEvent?.init ? schema?.onEvent?.init : {},
                "pullRefresh": schema?.onEvent?.pullRefresh ? schema?.onEvent?.pullRefresh : {},
            }
        }

        schema.dataId != null && schema.dataId != ''  ? "" : (setTimeout(()=>{
            setToParentHeight(window.document.documentElement.scrollHeight)
        }, 100))
        return (
            <div id="form-edit">
                {amisRender(amisSchema, {
                    scopeRef: (ref: any) => (formInfo.current = ref),
                    context: {
                        zcApp: zcAppVal,
                        zcCompany: zcCompanyVal,
                        zcUser: zcUserVal,
                        app: initApiStore.getState().initApi,
                        ...value,
                        ...envVar,
                        $$noPer: true,
                        $$permissionsData: permStore.getState().permData,
                    }
                }, {
                    fetcher: service,
                    notify(type: string, msg: string, conf: any) {
                        if (msg == "Cannot read properties of undefined (reading 'data')") return
                        if (msg == "您暂无权限进行此操作") return
                        if (msg.includes('没有查询表单分组列表权限')) return
                        (toast as any)[type](msg, conf)
                    },
                    theme: amisEnv.theme
                })}
            </div>
        )
    }
    var heightVal = {
        param1: toParentHeight,
    };
    if (toParentHeight) {
        window.parent.postMessage({
            type: 'formHeight',
            data: JSON.stringify(heightVal)
        }, "*");
    }
    return (
        <div style={{ border: '1px solid #bfbfbf' }}>
            {
                show ? pageContent() : ' '
            }
        </div>
    )
}
export default PageEdit;

