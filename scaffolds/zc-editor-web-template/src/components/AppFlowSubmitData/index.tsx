import React, { useEffect, useState }  from 'react';
import { render as amisRender, confirm, toast } from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import { service } from "@/utils/request"
import initApiStore from "@/store/initApi"
import { getAppProcessFormData } from '@/api/formRender'
import {setTenantId, setToken} from '@/utils/auth'
import { disposeTaskFormItemStatus } from '@/engine/form'
import permStore from '@/store/permission';
import appTenantCodeStore from "@/store/appTenantCode"
import { processAndFetchOptions } from "@/utils/util"
import './index.css'
const AppFlowSubmitData = () => {
    const [taskFormData, setTaskFormData] = useState({});
    const [existTaskForm, setExistTaskForm] = useState(false)
    const [show, setShow] = useState(false);
    const [envVar, setEnvVar] = useState({});
    const [zcAppVal, setZCAppVal] = useState({});
    const [zcCompanyVal, setZCCompanyVal] = useState({});
    const [zcUserVal, setZCUserVal] = useState({});
    const [value, setValue] = useState({});
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const tenantId = params.get('tenantId');
    const appTenantCode = params.get('appTenantCode');
    const appFormInfo = React.useRef();
    if(token){
        setToken({'accessToken': token,  'refreshToken': refreshToken})
    }
    if(tenantId){
        setTenantId(tenantId)
    }
    if(appTenantCode) {
        appTenantCodeStore.dispatch({type: "set", payload: appTenantCode});
    }

    //填写表单-form校验
    window.collectAllFormData = async function(){
        const formInfoObj = (appFormInfo.current as any).getComponentByName('appFormInfo')
        const isResult = await formInfoObj.validate()
        console.log(42, isResult)
        if(isResult){
            //告诉父，我校验完了
            uni.postMessage({
                data: { type: 'validateResult', value: isResult } 
            });
            const fetcher: any = formInfoObj.props.env.fetcher
            const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, appFormInfo.current)
            formInfoObj.props.$schema.fields = fieldsVal
            delete formInfoObj.props.$schema.body
            var message = {
                param1: {data: formInfoObj.props.data, schema: formInfoObj.props.$schema },
            };
            if (message.param1) {
                uni.postMessage({
                    data: { type: 'formData' , value: JSON.stringify(message)}
                });
            }
        } else {
            //告诉父，我校验完了
            uni.postMessage({
                data: { type: 'validateResult', value: isResult } // 标记网页加载完成
            });
        }
    }
    const getFormData = async () => {
        const params = new URLSearchParams(window.location.search);
        const procInsId = params.get('procInsId');
        const taskId = params.get('taskId');
        const ccIdentification = params.get('ccIdentification');
        let param = {
            procInsId: procInsId,
            taskId: taskId ? taskId : '',
            ccIdentification: ccIdentification
        }
        let res = await getAppProcessFormData(param);
        const existTaskForm = res?.data?.data?.existTaskForm
        let taskFormData = res?.data?.data?.taskFormData;
        //接口增加返回envVar
        let envVar = res?.data?.data?.context?.envVar;
        let zcApp = res?.data?.data?.context?.zcApp;
        let zcCompany = res?.data?.data?.context?.zcCompany;
        let zcUser = res?.data?.data?.context?.zcUser;
        let formValue = res?.data?.data?.taskFormData?.variables;
        let obj = {};
        for (var i = 0; i < envVar?.length; i++) {
            obj[envVar[i].key] = envVar[i].value;
        }
        setEnvVar(obj)
        setZCAppVal(zcApp)
        setZCCompanyVal(zcCompany)
        setZCUserVal(zcUser)
        setValue(formValue)
        setExistTaskForm(existTaskForm)
        setTaskFormData(taskFormData)
        setShow(true)
        // 延迟 500ms 确保 Uniapp 通信 SDK 加载完成
        setTimeout(() => {
            if (window.uni) {
                uni.postMessage({
                    data: { type: 'webViewLoaded' } // 标记网页加载完成
                });
                console.log('网页主动发送加载完成消息');
            }
        }, 500);
    }
    useEffect(() => {
        getFormData();
    }, []);
    const InputForm = (taskFormData:any) => {
        const initApi = taskFormData && taskFormData.formApi ? taskFormData.formApi : ''
        const primaryField = taskFormData && taskFormData.primaryField ? taskFormData.primaryField : ''
        let disableFields = taskFormData.disableFields ? taskFormData.disableFields : [];
        let hiddenFields = taskFormData.hiddenFields ? taskFormData.hiddenFields : [];
        const forceDisabled = false
        disposeTaskFormItemStatus(taskFormData.fields, disableFields, hiddenFields, forceDisabled)
        let disAllCombo = []
        let hideAllCombo = []
        for(var i=0;i<taskFormData.fields.length;i++){
            if(taskFormData.fields[i].type=='combo'){
                for(var j=0;j<taskFormData.fields[i].items.length;j++){
                    const val = taskFormData.fields[i].items[j].disabled ? taskFormData.fields[i].items[j].disabled : false
                    disAllCombo.push(val)
                    const hideVal = taskFormData.fields[i].items[j].hidden ? taskFormData.fields[i].items[j].hidden : false
                    hideAllCombo.push(hideVal)
                    if(taskFormData.fields[i].items[j].type == 'service'){
                        const val = taskFormData.fields[i].items[j].body[0].readOnly
                        disAllCombo.push(val)
                        const hideVal = taskFormData.fields[i].items[j].hidden ? taskFormData.fields[i].items[j].hidden : false
                        hideAllCombo.push(hideVal)
                    }
                }
                taskFormData.fields[i].disabled = [...new Set(disAllCombo)].length > 1 ? false : [...new Set(disAllCombo)][0]
                taskFormData.fields[i].hidden = [...new Set(hideAllCombo)].length > 1 ? false : [...new Set(hideAllCombo)][0]
            }
            //移动端表单将combo 改为 select
            if(taskFormData.fields[i].type=='select'){
                const name = taskFormData.fields[i].name
                taskFormData.fields[i].hidden = hiddenFields.some(item => item.split('.')[0] === name);
            }
            //移动端表单将combo 改为 select
            if(taskFormData.fields[i].type=='select'){
                const name = taskFormData.fields[i].name
                taskFormData.fields[i].disabled = disableFields.some(item => item.split('.')[0] === name);
            }
        }
        let disAllBtnGroupSel = []
        let hideAllBtnGroupSel = []
        for(var i=0;i<taskFormData.fields.length;i++){
            if(taskFormData.fields[i].type=='button-group-select'){
                for(var j=0;j<taskFormData.fields[i]?.addControls?.length;j++){
                    const val = taskFormData.fields[i].addControls[j].disabled ? taskFormData.fields[i].addControls[j].disabled : false
                    disAllBtnGroupSel.push(val)
                    const hideVal = taskFormData.fields[i].addControls[j].hidden ? taskFormData.fields[i].addControls[j].hidden : false
                    hideAllBtnGroupSel.push(hideVal)
                }
                taskFormData.fields[i].disabled = [...new Set(disAllBtnGroupSel)].length > 1 ? false : [...new Set(disAllBtnGroupSel)][0]
                taskFormData.fields[i].hidden = [...new Set(hideAllBtnGroupSel)].length > 1 ? false : [...new Set(hideAllBtnGroupSel)][0]
            }
        }
        const schema = {
            type: "form",
            name: "appFormInfo",
            initApi: (taskFormData.dataId != null && taskFormData.dataId != '') ? initApi.replace('${' + primaryField + '}', taskFormData.dataId) : '',
            title: taskFormData && taskFormData.title ? taskFormData.title : '',
            body: taskFormData && taskFormData.fields ? taskFormData.fields : [],
            data: !(taskFormData.dataId != null && taskFormData.dataId != '') ? taskFormData.variables : {},
            actions: [],
            onEvent: taskFormData.onEvent
        }
        return (
            <div>
                {amisRender(schema, {
                    scopeRef: (ref: any) => (appFormInfo.current = ref),
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
                    theme: amisEnv.theme
                })}
            </div>
            )
    };
    
    return (
        <div className='appFormValid'>
        {
            existTaskForm && show ?  InputForm(taskFormData) : ' '
        }
        </div>
    )
}
export default AppFlowSubmitData;

