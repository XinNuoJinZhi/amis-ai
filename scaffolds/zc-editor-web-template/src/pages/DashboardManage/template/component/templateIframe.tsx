import React, {useState, useEffect} from 'react';
import { getAccessToken, getRefreshToken, getTenantId } from '@/utils/auth'
import { getAppId, getEnv } from '@/utils/index'
import {goviewUrl} from '@/utils/env'
import permStore from '@/store/permission';
import appTenantCodeStore from '@/store/appTenantCode';
const TemplateIframe: React.FC = props => {
const [url, setUrl] = useState('')
useEffect(() => {
    const permissions = permStore.getState().permData
    const arr:any = []
    permissions.forEach((ite) => {
        if (ite.includes('app:dvProject') || ite.includes('app:dvTemplate') || ite.includes('app:page')) {
            arr.push(ite)
        }
    })
    const str = arr.join(',')
    const urlVal = goviewUrl +
    '/#/project/my-template?token=' + getAccessToken() +
    '&refreshToken=' + getRefreshToken() +
    '&tenantId=' + getTenantId() +
    '&appid=' + getAppId() +
    '&env=' + getEnv() +
    '&appTenantCode=' + appTenantCodeStore.getState().appTenantCode +
    '&permissions=' + str
    setUrl(urlVal)
},[])
return (
    <>
        <div className="boxs" style={{ width: '100%', height: 'calc(100vh - 238px)' }}>
            <iframe
                id="iframeGo"
                src={url}
                style={{width: '100%',height: '100%'}}
                frameBorder="no"
                scrolling="auto"
            ></iframe>
        </div>
    </>
)};

export default TemplateIframe;
