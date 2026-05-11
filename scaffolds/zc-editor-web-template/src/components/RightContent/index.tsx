import React, {useEffect, useState} from "react";
import {DownOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {SelectLang as UmiSelectLang} from '@umijs/max';
import {getAppId, getEnv, isAppEnd, isEditorialEnd} from "@/utils";
import {appId, envId, goviewUrl} from '@/utils/env'
import type {MenuProps} from 'antd';
import {Button, Dropdown, Space} from 'antd';
import {getApplicationPortalListApi, getPortalListApi} from "@/services/ant-design-pro/api";
import {getAccessToken, getRefreshToken, getTenantId} from '@/utils/auth'
import {getIconElement} from '@/utils/patchClientRoutes'
import appTenantCodeStore from '@/store/appTenantCode';

export type SiderTheme = 'light' | 'dark';

export const SelectLang: React.FC = () => {
  return (
    <UmiSelectLang
      style={{
        padding: 4,
      }}
    />
  );
};

export const Question: React.FC = () => {
  return (
    <a
      href="https://pro.ant.design/docs/getting-started"
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        padding: '4px',
        fontSize: '18px',
        color: 'inherit',
      }}
    >
      <QuestionCircleOutlined />
    </a>
  );
};

export const PreviewButton: React.FC = () => {
  const [portalList,setPortalList] = useState<MenuProps['items']>([])

  const handlePreview = () => {
    const params = new URLSearchParams();
    appId && params.set('appid', appId);
    envId && params.set('env', envId);
    const targetSearch = params.toString();
    const appUrl = `${window.location.origin}/app/?${targetSearch}`;
    window.open(appUrl);
  }

  const getPortalList = async () => {
    const response = isAppEnd() ? await getApplicationPortalListApi() : await getPortalListApi();
    if (response && response.data?.code === 0) {
      const portalList = response.data.data.map((item: any) => {
        return {
          label: item.portalName,
          key: item.portalKey,
          portalType: item.type,
          icon: getIconElement(item.type === 3 ? 'fa fa-line-chart' : 'fa fa-desktop')
        }
      })
      setPortalList(portalList)
    }
  }

  const handlePortal = (e: any) => {
    const portalType = (portalList as any[]).find((item: any) => item.key === e.key).portalType;
    // 可视化大屏
    if (portalType === 3) {
      const largeScreenUrl = [
        `${goviewUrl}/#/project/big-screen-preview?token=${getAccessToken()}`,
        `&refreshToken=${getRefreshToken()}`,
        `&tenantId=${getTenantId()}`,
        `&appid=${getAppId()}`,
        `&env=${getEnv()}`,
        `&appTenantCode=${appTenantCodeStore.getState().appTenantCode}`,
        `&portalKey=${e.key}`
      ].join('');
      window.open(largeScreenUrl);
    } else {
      const target = isEditorialEnd() ? '_blank' : '_self';
      window.open(`${window.location.origin}/app/?appid=${appId}&env=${envId}&portalKey=${e.key}`, target)
    }
  }

  useEffect(() => {
    getPortalList().then(r => {})
  }, [])

  return (
    <>
      {
        (isEditorialEnd() && portalList && portalList.length === 0) && (
          <Button
            style={{
              width: '70px'
            }}
            type="primary"
            onClick={handlePreview}
          >
            预览
          </Button>
        )
      }
      {
        (portalList && portalList.length > 0) && <Dropdown menu={{  items: portalList, onClick: handlePortal }} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <Button type={isEditorialEnd() ? 'primary' : 'default'}>
                预览
                <DownOutlined />
              </Button>
            </Space>
          </a>
        </Dropdown>
      }
    </>
  )
}
