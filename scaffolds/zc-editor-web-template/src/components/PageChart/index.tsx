import React, { useEffect, useState } from 'react';
import { render as amisRender } from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import { service } from "@/utils/request"
import { getChartData } from "@/api/pageManage"
import initApiStore from "@/store/initApi"
import {toast} from 'amis';
import {store} from '@/store/editor';
import permStore from '@/store/permission';
const PageChart = () => {
    const [schema, setSchema] = useState('');
    const [show, setShow] = useState(false);
    const [envVar, setEnvVar] = useState({});
    const [zcAppVal, setZCAppVal] = useState({});
    const [zcCompanyVal, setZCCompanyVal] = useState({});
    const [zcUserVal, setZCUserVal] = useState({});

    const getPageChartData = async () => {
        const params = new URLSearchParams(window.location.search);
        const pageCode = params.get('pageCode');
        const appid = params.get('appid');
        const env = params.get('env');
        let res = await getChartData(pageCode, appid, env);
        let schema = res.data.data.schema;
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
        getPageChartData();
    }, []);

    const pageContent = () => {
        return (
            <div id="form-edit">
                {amisRender(schema, {
                    context: {
                        zcApp: zcAppVal,
                        zcCompany: zcCompanyVal,
                        zcUser: zcUserVal,
                        app: initApiStore.getState().initApi,
                        ...envVar,
                        appVariables: store.EditorStore.getAppVariables({
                            zcApp: zcAppVal,
                            zcCompany: zcCompanyVal,
                            zcUser: zcUserVal,
                        }),
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
    return (
        <div style={{ border: '1px solid #bfbfbf' }}>
            {
                show ? pageContent() : ' '
            }
        </div>
    )
}
export default PageChart;

