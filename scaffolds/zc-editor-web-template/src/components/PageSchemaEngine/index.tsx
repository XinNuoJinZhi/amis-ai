import React, {useState, useEffect} from 'react';
import {render as amisRender} from 'amis';
import {service} from "@/utils/request"
import emptyImg from '@/assets/img/page-empty.png'
import {getDesignButton} from "@/api/pageManage";
import {toast} from 'amis';
import {observer} from "mobx-react"
import {env as amisEnv} from '@/hooks/amis';
import {store} from '@/store/editor';
import initApiStore from "@/store/initApi"
import permStore from '@/store/permission';
import MobilePreview from '@/components/MobilePreview';
import {testMode} from '@/utils/env'

const PageSchemaEngine: React.FC = observer((props: any) => {
    const [loading, setLoading] = useState(false);
    const [schema, setSchema] = useState({type: "page"});
    const [schemaToolbar, setSchemaToolbar] = useState({type: "page"});
    const {env} = props;
    let envVar = props?.data?.context?.envVar;
    let zcAppVal = props?.data?.context?.zcApp;
    let zcCompanyVal = props?.data?.context?.zcCompany;
    let zcUserVal = props?.data?.context?.zcUser;
    let permDataVal = props?.data?.customizeAcl;
    const queryKey = props?.data?.queryKey
    const pageCode = props?.data?.pageCode
    let obj = {};
    for (var i = 0; i < envVar?.length; i++) {
        obj[envVar[i].key] = envVar[i].value;
    }

    let amisSchema: any = {};
    let amisSchemaToolbar: any = {};
    const dealEdit = async () => {
        const paramsObj = new URLSearchParams(window.location.search);
        const appId = paramsObj.get('appid');
        const env = paramsObj.get('env');
        let params = {
            queryKey: queryKey,
        }
        let res = await getDesignButton(params)
        if (res.data.code != 0) {
            toast.error(res.data.msg, {
                position: 'top-right'
            });
            return
        }
        let pageType = res.data.data.pageType; // 1 普通页面 3 文件夹
        let pageTerminal = res.data.data.pageTerminal;
        if (pageType == 1) {
            const url = './pageManage/edit?appid=' + appId + '&env=' + env + '&queryKey=' + queryKey + '&pageCode=' + pageCode + (pageTerminal != 2 ? "&pcEnd=true" : "&appEnd=true")
            window.open(url)
        } else {
            //给提示信息
            toast.info('当前选中的是文件夹，请选择页面进行设计', '提示');
        }
    }
    if (props?.data?.pageType == '2') {
        amisSchema = {
            type: "page",
            body: [{
                type: "link",
                href: props?.data?.pageContent,
            }]
        }
        amisSchemaToolbar = {}
    } else {
        const paramsObj = new URLSearchParams(window.location.search);
        const appId = paramsObj.get('appid');
        const env = paramsObj.get('env');
        if(props?.data?.schema?.body) {
            amisSchema = props?.data?.schema
            amisSchemaToolbar = {
                type: "page",
                className: "pageManage_toolbar",
                toolbar: [
                    {
                        "type": "button",
                        "label": "设计页面",
                        "level": "primary",
                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:page:query')}",
                        "className": "design_page_button",
                        "onEvent": {
                            "click": {
                                "actions": [
                                    {
                                        "actionType": "custom",
                                        "script": async function () {
                                            dealEdit()
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ],
            }
        } else {
            if (props?.data?.pageTerminal == 2) {
                amisSchema = {
                    type: "page",
                    data: {
                        "pageName": props?.data?.pageName,
                        "appName": props?.data?.appName,
                        "href": window.location.origin + window.location.pathname + '/edit' + '?appid=' + appId + '&env=' + env + '&queryKey=' + queryKey + '&pageCode=' + pageCode + (props?.data?.pageTerminal != 2 ? "&pcEnd=true" : "&appEnd=true"),
                    },
                    body: [{
                        type: "image",
                        src: emptyImg,
                        className: "empty-img"
                    }, {
                        type: "wrapper",
                        style: {
                            display: "flex",
                            justifyContent: "center",
                            padding: "10px",
                            textAlign: "center",
                        },
                        body: [
                          {
                            "type": "tpl",
                            "tpl": "欢迎进入「" + "${appName}" + "」系统，" + "这是页面" + "${pageName}" + "。",
                          }
                        ],
                    }, {
                        type: "wrapper",
                        style: {
                            display: "flex",
                            justifyContent: "center",
                            padding: "0",
                        },
                        body: [
                            {
                                type: "link",
                                href: "${href}",
                                body: "马上开始编辑",
                                visibleOn: "${ARRAYINCLUDES(${$$permissionsData},'app:page:query')}",
                                blank: true
                            }
                        ]
                    }]
                }
                amisSchemaToolbar = {
                    type: "page",
                    className: "pageManage_toolbar",
                    toolbar: [
                        {
                            "type": "button",
                            "label": "设计页面",
                            "level": "primary",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:page:query')}",
                            "className": "design_page_button",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": async function () {
                                                dealEdit()
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                }
            }
            else {
                amisSchema = {
                    type: "page",
                    className: "pageManage_toolbar",
                    "data": {
                        "pageName": props?.data?.pageName,
                        "appName": props?.data?.appName,
                        "href": window.location.origin + window.location.pathname + '/edit' + '?appid=' + appId + '&env=' + env + '&queryKey=' + queryKey + '&pageCode=' + pageCode + (props?.data?.pageTerminal != 2 ? "&pcEnd=true" : "&appEnd=true"),
                    },
                    "toolbar": [
                        {
                            "type": "button",
                            "label": "设计页面",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:page:query')}",
                            "level": "primary",
                            "className": "design_page_button",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": async function () {
                                                dealEdit()
                                            }
                                        }
                                    ]
                                }
                            }

                        }
                    ],
                    body: [{
                        "type": "image",
                        "src": emptyImg,
                        "className": "empty-img"
                    }, {
                        type: "wrapper",
                        "className": "empty-info",
                        body: [{
                            "type": "tpl",
                            "tpl": "欢迎进入「" + "${appName}" + "」系统，" + "这是页面" + "${pageName}" + "。",
                        }, {
                            "type": "link",
                            "href": "${href}",
                            "body": "马上开始编辑",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:page:query')}",
                            "blank": true
                        }],
                    }]
                }
                amisSchemaToolbar = {}
            }
        }
    }

    useEffect(() => {
        setLoading(false)
        setTimeout(() => {
            setSchema(amisSchema)
            setSchemaToolbar(amisSchemaToolbar)
            setLoading(true)
        }, 100)
    }, [props.data]);

    return (
        loading && (<div style={{border: '1px solid white', height: '100%'}}>
            {amisRender(
                schemaToolbar,
                {
                    context: {
                        zcApp: zcAppVal,
                        zcCompany: zcCompanyVal,
                        zcUser: zcUserVal,
                        appVariables: store.EditorStore.getAppVariables({
                            zcApp: zcAppVal,
                            zcCompany: zcCompanyVal,
                            zcUser: zcUserVal,
                        }),
                        app: initApiStore.getState().initApi,
                        ...obj,
                        $$noPer: true,
                        $$permissionsData: permStore.getState().permData,
                        $$testMode: testMode,
                    },
                },
                {
                    fetcher: service,
                    permData: permDataVal,
                    beforeSetData: (obj: object) => {
                        // TODO: 编辑端 将改变的内存变量set到store中
                        store.EditorStore.setAppVariables({
                            ...store.EditorStore.getAppVariables({
                                zcApp: zcAppVal,
                                zcCompany: zcCompanyVal,
                                zcUser: zcUserVal,
                            }),
                            ...obj
                        })
                    },
                  theme: amisEnv.theme
                } as any
            )}
            {props?.data?.pageTerminal == 2 ?
              (
                <MobilePreview
                  schema={schema}
                  env={
                      {
                          fetcher: service,
                          permData: permDataVal,
                          beforeSetData: (obj: object) => {
                              // TODO: 编辑端 将改变的内存变量set到store中
                              store.EditorStore.setAppVariables({
                                  ...store.EditorStore.getAppVariables({
                                      zcApp: zcAppVal,
                                      zcCompany: zcCompanyVal,
                                      zcUser: zcUserVal
                                  }),
                                  ...obj
                              });
                          },
                          theme: 'cxd',
                          isCancel: env?.isCancel,
                          copy: env?.copy,
                          updateLocation: env?.updateLocation,
                          jumpTo: env?.jumpTo,
                          notify: env?.notify,
                          isCurrentUrl: env?.isCurrentUrl,
                          pdfjsWorkerSrc: env?.pdfjsWorkerSrc,
                          toastPosition: env?.toastPosition
                      } as any
                  }
                  rootRenderProps={
                      {
                          context: {
                              zcApp: zcAppVal,
                              zcCompany: zcCompanyVal,
                              zcUser: zcUserVal,
                              appVariables: store.EditorStore.getAppVariables({
                                  zcApp: zcAppVal,
                                  zcCompany: zcCompanyVal,
                                  zcUser: zcUserVal
                              }),
                              app: initApiStore.getState().initApi,
                              ...obj,
                              $$noPer: true,
                              $$permissionsData: permStore.getState().permData,
                              $$testMode: testMode
                          }
                      }
                  }
                />
              ) :
              amisRender(
                schema,
                {
                    context: {
                        zcApp: zcAppVal,
                        zcCompany: zcCompanyVal,
                        zcUser: zcUserVal,
                        appVariables: store.EditorStore.getAppVariables({
                            zcApp: zcAppVal,
                            zcCompany: zcCompanyVal,
                            zcUser: zcUserVal,
                        }),
                        app: initApiStore.getState().initApi,
                        ...obj,
                        $$noPer: true,
                        $$permissionsData: permStore.getState().permData,
                        $$testMode: testMode,
                    },
                },
                {
                    fetcher: service,
                    permData: permDataVal,
                    beforeSetData: (obj: object) => {
                        // TODO: 编辑端 将改变的内存变量set到store中
                        store.EditorStore.setAppVariables({
                            ...store.EditorStore.getAppVariables({
                                zcApp: zcAppVal,
                                zcCompany: zcCompanyVal,
                                zcUser: zcUserVal,
                            }),
                            ...obj
                        })
                    },
                  theme: amisEnv.theme
                } as any
            )}
        </div>)
    )
})

export default PageSchemaEngine;
