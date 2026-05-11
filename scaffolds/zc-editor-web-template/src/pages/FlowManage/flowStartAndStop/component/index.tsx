import React, { useEffect, useState } from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { disposeTaskFormItemStatus } from '@/engine/form'
import initApiStore from "@/store/initApi"
import {env as amisEnv} from '@/hooks/amis';
const FormView = (props) => {
    const [schema, setSchema] = useState([]);
    const [show, setShow] = useState(false);
    //环境变量
    const [envVar, setEnvVar] = useState({});
    const [zcAppVal, setZCAppVal] = useState({});
    const [zcCompanyVal, setZCCompanyVal] = useState({});
    const [zcUserVal, setZCUserVal] = useState({});
    const getFormData = async (data) => {
        let schema = data.data.formData ? data.data.formData : [];
        //接口增加返回envVar
        let envVar = data.data?.context?.envVar;
        let zcApp = data.data?.context?.zcApp;
        let zcCompany = data.data?.context?.zcCompany;
        let zcUser = data.data?.context?.zcUser;
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
        getFormData(props);
    }, []);
    const pageContent = (item: any) => {
        const forceDisabled = true
        disposeTaskFormItemStatus(item.fields, [], [], forceDisabled)
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
                        ...envVar
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

export default FormView;

