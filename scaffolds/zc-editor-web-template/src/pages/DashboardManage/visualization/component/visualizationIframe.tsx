import React, {useState, useEffect, useCallback} from 'react';
import { getAccessToken, getRefreshToken, getTenantId, getAppTenantCode } from '@/utils/auth'
import { getAppId, getEnv } from '@/utils/index'
import bus from '@/utils/bus'
import { history } from '@umijs/max';
import {goviewUrl} from '@/utils/env'
import appTenantCodeStore from '@/store/appTenantCode';
import permStore from '@/store/permission';
const VisualizationIframe: React.FC = props => {
const [url, setUrl] = useState('')
const [iframeKey, setIframeKey] = useState(Date.now());
// 构建URL的函数（抽离出来，方便复用）
const buildIframeUrl = useCallback(() => {
  const baseUrl = goviewUrl;
  if (!baseUrl) {
    return '';
  }
  const permissions = permStore.getState().permData
  const arr:any = []
  permissions.forEach((ite) => {
      if (ite.includes('app:dvProject') || ite.includes('app:dvTemplate') || ite.includes('app:page')) {
          arr.push(ite)
      }
  })
  const str = arr.join(',')
  return `${baseUrl}/#/project?token=${getAccessToken()}&refreshToken=${getRefreshToken()}&tenantId=${getTenantId()}&appid=${getAppId()}&env=${getEnv()}&appTenantCode=${getAppTenantCode()}&permissions=${str}`;
}, []);

// 初始化URL
useEffect(() => {
  setUrl(buildIframeUrl());
}, [buildIframeUrl]);

// 定义刷新iframe的回调函数（用useCallback缓存，避免重复创建）
const handleReload = useCallback((val: string) => {
  if (val === 'app/design/visualization') {
    // 清除之前的定时器（防止多次触发时叠加）
    const timer = setTimeout(() => {
      // 先更新URL（获取最新参数），再更新key触发重建
      setUrl(buildIframeUrl());
      setIframeKey(Date.now());
      clearTimeout(timer); // 执行后清除定时器
    }, 500);
  }
}, [buildIframeUrl]);

// 正确注册/清理事件监听（核心：只绑定一次，卸载时移除）
useEffect(() => {
  // 绑定事件：将缓存的handleReload作为回调
  bus.on('reload', handleReload);

  // 组件卸载时，移除该事件的监听（关键：防止内存泄漏和重复触发）
  return () => {
    bus.off('reload', handleReload);
  };
}, [handleReload]);
return (
    <>
        <div className="boxs" style={{ width: '100%', height: 'calc(100vh - 238px)' }}>
            <iframe
                id="iframeGo"
                key={iframeKey}
                src={url}
                style={{width: '100%',height: '100%'}}
                frameBorder="no"
                scrolling="auto"
            ></iframe>
        </div>
    </>
)};

export default VisualizationIframe;
