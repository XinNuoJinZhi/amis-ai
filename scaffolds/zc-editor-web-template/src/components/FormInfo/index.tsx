import React, { useEffect, useState } from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { getProcessFormData } from '@/api/formRender'
import { disposeTaskFormItemStatus } from '@/engine/form'
import initApiStore from "@/store/initApi"
import permStore from '@/store/permission';
import {env as amisEnv} from '@/hooks/amis';
const PageView = () => {
    const [schema, setSchema] = useState([]);
    const [show, setShow] = useState(false);
    //环境变量
    const [envVar, setEnvVar] = useState({});
    const [zcAppVal, setZCAppVal] = useState({});
    const [zcCompanyVal, setZCCompanyVal] = useState({});
    const [zcUserVal, setZCUserVal] = useState({});
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
        let schema = res.data?.data?.processFormList ? res.data?.data?.processFormList : [];
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
    }
    useEffect(() => {
        getFormData();
    }, []);
    const pageContent = (item: any) => {
        let disableFields = item.disableFields ? item.disableFields : [];
        let hiddenFields = item.hiddenFields ? item.hiddenFields : [];
        const forceDisabled = true
        disposeTaskFormItemStatus(item.fields, disableFields, hiddenFields, forceDisabled)
        let disAllCombo = []
        let hideAllCombo = []
        for(var i=0;i<item.fields?.length;i++){
            if(item.fields[i].type=='combo'){
                for(var j=0;j<item.fields[i].items.length;j++){
                    const val = item.fields[i].items[j].disabled ? item.fields[i].items[j].disabled : false
                    disAllCombo.push(val)
                    const hideVal = item.fields[i].items[j].hidden ? item.fields[i].items[j].hidden : false
                    hideAllCombo.push(hideVal)
                    if(item.fields[i].items[j].type == 'service'){
                        const val = item.fields[i].items[j].body[0].readOnly
                        disAllCombo.push(val)
                        const hideVal = item.fields[i].items[j].hidden ? item.fields[i].items[j].hidden : false
                        hideAllCombo.push(hideVal)
                    }
                }
                item.fields[i].disabled = [...new Set(disAllCombo)].length > 1 ? false : [...new Set(disAllCombo)][0]
                item.fields[i].hidden = [...new Set(hideAllCombo)].length > 1 ? false : [...new Set(hideAllCombo)][0]
            }
        }
        let disAllBtnGroupSel = []
        let hideAllBtnGroupSel = []
        for(var i=0;i<item.fields?.length;i++){
            if(item.fields[i].type=='button-group-select'){
                for(var j=0;j<item.fields[i]?.addControls?.length;j++){
                    const val = item.fields[i].addControls[j].disabled ? item.fields[i].addControls[j].disabled : false
                    disAllBtnGroupSel.push(val)
                    const hideVal = item.fields[i].addControls[j].hidden ? item.fields[i].addControls[j].hidden : false
                    hideAllBtnGroupSel.push(hideVal)
                }
                item.fields[i].disabled = [...new Set(disAllBtnGroupSel)].length > 1 ? false : [...new Set(disAllBtnGroupSel)][0]
                item.fields[i].hidden = [...new Set(hideAllBtnGroupSel)].length > 1 ? false : [...new Set(hideAllBtnGroupSel)][0]
            }
        }
        let amisSchema = {
            "type": "page",
            "title": item.title,
            "body": item.fields,
        }
        return (
            <div>
                {amisRender(amisSchema, {
                    context: {
                        zcApp: zcAppVal,
                        zcCompany: zcCompanyVal,
                        zcUser: zcUserVal,
                        app: initApiStore.getState().initApi,
                        ...item.variables,
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
    }
    return (
        <div>
            {
                show ? schema.map((item, index) => {
                    return (
                        <div style={{ border: '1px solid #bfbfbf', marginBottom: '20px' }} key={index}>
                            {pageContent(item)}
                        </div>
                    )
                }) : ' '
            }
        </div>
    )
}

export default PageView;

