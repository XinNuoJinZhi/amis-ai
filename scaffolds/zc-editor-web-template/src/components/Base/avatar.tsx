import { isEditorialEnd, isAppEnd } from '@/utils/index'
import React from 'react';
import '@/styles/layoutHeader.scss'
import { loginOutApi } from '@/api/login'
import { removeToken, getAccessToken } from '@/utils/auth'
import { history } from '@umijs/max';
import { useCache } from '@/hooks/web/useCache'
import MessageInfo from "./message/MessageInfo"
import { useDevBaseUrl } from "@/utils/util"
import { getQueryKeyByCode } from "@/api/system/index"
import { getRefreshToken, getTenantId } from '@/utils/auth'
import { getAppId, getEnv } from '@/utils/index'
import {adminUrl, goviewUrl} from '@/utils/env'
import appTenantCodeStore from '@/store/appTenantCode';
import {appId, envId, portalKey} from "@/utils/env";
import {getPortalLoginRouterData} from "@/store/portalLoginRouter"
const { wsCache } = useCache()
const wsCacheSession = useCache('sessionStorage')
let isPreview = isEditorialEnd() ? '${true}' : '${false}'
let isBack = isAppEnd() ? '${true}' : '${false}'
const params = new URLSearchParams(window.location.search);
let env = params.get('env')
let isReturn = isAppEnd() && (env == 1) ? '${true}' : '${false}'
// let isEdit = isAppEnd() && (env == 1) ? '${true}' : '${false}'
const getPortalList = isAppEnd() ? useDevBaseUrl("/app/portal/application/portalPreviewDropdownBox ") : useDevBaseUrl("/app/portal/portalPreviewDropdownBox")
const Avatar = {
    "type": "container",
    "body": [{
        "type": "service",
        "onEvent": {
            "noticeRefresh": {
                "actions": [
                    {
                        "actionType": "reload",
                        "componentId": "station_message",
                    }
                ]
            }
        },
        "id": "station_message",
        "className": "station_message",
        "interval": 1000 * 60 * 2,
        "api": {
            "method": "get",
            "url": useDevBaseUrl("/system/notify-message/get-unread-count"),
            adaptor: function (payload: any) {
                return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data, count: payload.data }
                };
            }
        },
        "initFetchOn": isBack,
        "body": [
            {
                "type": "service",
                "onEvent": {
                    "portalChange": {
                        "actions": [
                            {
                                "actionType": "reload",
                                "componentId": "portal_list",
                            }
                        ]
                    }
                },
                "id": "portal_list",
                "api": {
                    "method": "get",
                    "url": getPortalList,
                    adaptor: function (payload: any) {
                        let data = payload.data;
                        let resultData = [];

                        if (data != null) {
                            for(var i=0; i < data.length; i++) {
                                if(data[i].type == 3 ) {
                                    let  largeScreenUrl = goviewUrl +
                                        '/#/project/big-screen-preview?token=' + getAccessToken() +
                                        '&refreshToken=' + getRefreshToken() +
                                        '&tenantId=' + getTenantId() +
                                        '&appid=' + getAppId() +
                                        '&env=' + getEnv() +
                                        '&appTenantCode=' + appTenantCodeStore.getState().appTenantCode +
                                        '&portalKey=' + data[i].portalKey
                                    resultData.push({
                                        "type": "button",
                                        "onEvent": {
                                            "click": {
                                                "actions": [
                                                    {
                                                        "actionType": "custom",
                                                        "script": async function () {
                                                            window.open(largeScreenUrl)
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "label": data[i].portalName,
                                        //type 是3的是大屏门户
                                        "icon": 'fa fa-line-chart'
                                    });
                                } else {
                                    resultData.push({
                                        "type": "button",
                                        "onEvent": {
                                            "click": {
                                                "actions": [
                                                    {
                                                        "actionType": "url",
                                                        "args": {
                                                            "url": window.location.origin + '/app/' + '?appid=' + appId + '&env=' + env + '&portalKey=' +data[i].portalKey,
                                                            "blank": isAppEnd() ? false : true,
                                                            "whiteJump": true
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "label": data[i].portalName,
                                        //type 是1 的是pc门户
                                        "icon": 'fa fa-desktop'
                                    });
                                }
                            }
                        }

                        return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, portalData: payload.data, items: resultData}
                        };
                    }
                },
                body: [{
                    type:"container",
                    "visibleOn": isPreview , //编辑端
                    body: [{
                        "type": "dropdown-button",
                        "level": "primary",
                        "id": "dropdown",
                        "visibleOn": "${items.length>0}",
                        "style": {
                            "margin": "0 10px 0 0",
                            "cursor": "pointer"
                        },
                        "label": "预览",
                        "menuClassName": "portal_list_menu",
                        "closeOnClick": true,
                        "closeOnOutside": true,
                        "buttons": "${items}",
                    },{
                        "type": "button",
                        "level": "primary",
                        "label": "预览",
                        "style": {
                            "margin": "0 10px 0 0",
                            "cursor": "pointer"
                        },
                        "visibleOn": "${items.length==0}",
                        "onEvent": {
                            "click": {
                                "actions": [
                                    {
                                        "actionType": "custom",
                                        "script": function () {
                                            let url = window.location.href;
                                            let toSearch = url.split('?')[1] ? url.split('?')[1] : ''
                                            const toParams = new URLSearchParams(toSearch);
                                            let appId = toParams.get('appid')
                                            let env = toParams.get('env')
                                            let appUrl = window.location.origin + '/app/' + '?appid=' + appId + '&env=' + env
                                            window.open(appUrl)
                                        }
                                    }
                                ]
                            }
                        }
                    }]
                },{
                    type:"container",
                    "visibleOn": isBack, //应用端
                    body: [{
                        "type": "dropdown-button",
                        "level": "default",
                        "id": "dropdown",
                        "visibleOn": "${items.length>1}",
                        "style": {
                            "margin": "0 10px 0 0",
                            "cursor": "pointer"
                        },
                        "label": "门户",
                        "menuClassName": "portal_list_menu",
                        "closeOnClick": true,
                        "closeOnOutside": true,
                        "buttons": "${items}",
                    }]
                }]
            },
            // {
            //     "type": "button",
            //     "level": "default",
            //     "label": "返回开发",
            //     "style": {
            //         "margin": "0 10px 0 0",
            //         "cursor": "pointer"
            //     },
            //     "visibleOn": isBack,
            //     "onEvent": {
            //         "click": {
            //             "actions": [
            //                 {
            //                     "actionType": "custom",
            //                     "script": function () {
            //                         const params = new URLSearchParams(window.location.search);
            //                         const appId = params.get('appid');
            //                         let env = params.get('env')
            //                         let appUrl = window.location.origin + '/app/design/pageManage' + '?appid=' + appId + '&env=' + env;
            //                         window.open(appUrl)
            //                     }
            //                 }
            //             ]
            //         }
            //     }
            // },
            // {
            //     "type": "tooltip-wrapper",
            //     "content": "设计页面",
            //     "placement": "bottom",
            //     "tooltipTheme": "dark",
            //     // "visibleOn": isReturn,
            //     "id": "isEdit",
            //     "offset": [
            //         -9,
            //         0
            //     ],
            //     "body": {
            //         "type": "icon",
            //         "icon": "fa-pencil-square-o ",
            //         "onEvent": {
            //             "click": {
            //                 "actions": [
            //                     {
            //                         "actionType": "custom",
            //                         "script": function () {
            //                             let pathname = window.location.pathname;
            //                             let code = pathname.split('/')[2];
            //                             getQueryKeyByCode(code).then((res: any) => {
            //                                 const queryKey = res.data.data
            //                                 const params = new URLSearchParams(window.location.search);
            //                                 const appId = params.get('appid');
            //                                 const env = params.get('env')
            //                                 const portalKey = params.get('portalKey')
            //                                 const url = './design/pageManage/edit?appid=' + appId + '&env=' + env + '&queryKey=' + queryKey + (portalKey ? `&portalKey=${portalKey}` : '')
            //                                 window.open(url)
            //                             })
            //                         }
            //                     }
            //                 ]
            //             }
            //         },
            //         "style": {
            //             "margin": "0 20px 0 0",
            //             "cursor": "pointer"
            //         },
            //         "className": "text-4xl iconShowBtn"
            //     },
            //     "className": "app-page-edit-toolbar",
            // },
            // {
            //     "type": "tooltip-wrapper",
            //     "content": "返回开发",
            //     "visibleOn": isReturn,
            //     "placement": "bottom",
            //     "tooltipTheme": "dark",
            //     "offset": [
            //         -9,
            //         0
            //     ],
            //     "body": {
            //         "type": "icon",
            //         "icon": "fa-arrow-circle-left",
            //         "onEvent": {
            //             "click": {
            //                 "actions": [
            //                     {
            //                         "actionType": "custom",
            //                         "script": function () {
            //                             const params = new URLSearchParams(window.location.search);
            //                             const appId = params.get('appid');
            //                             let env = params.get('env')
            //                             let appUrl = window.location.origin + '/app/design/pageManage' + '?appid=' + appId + '&env=' + env;
            //                             window.open(appUrl)
            //                         }
            //                     }
            //                 ]
            //             }
            //         },
            //         "style": {
            //             "margin": "0 20px 0 0",
            //             "cursor": "pointer"
            //         },
            //         "className": "text-xl  iconShowBtn"
            //     },
            //     "className": "mb-1",
            // },
            {
                "type": "tooltip-wrapper",
                "content": "我的站内信",
                "visibleOn": isBack,
                "placement": "bottom",
                "tooltipTheme": "dark",
                "offset": [
                    -9,
                    0
                ],
                "body": {
                    "type": "icon",
                    "icon": "fa-bell-o",
                    "onEvent": {
                        "click": {
                            "actions": [{
                                "actionType": "custom",
                                "script": function () {
                                    if (document.getElementsByClassName('myMessage')[0]) {
                                        document.getElementsByClassName('myMessage')[0].style.display = 'block';
                                    }
                                }
                            },
                            {
                                "actionType": "ajax",
                                "outputVar": "responseResult",
                                "api": {
                                    "url": useDevBaseUrl("/system/notify-message/get-unread-list"),
                                    "method": "get"
                                },
                            },
                            {
                                "actionType": "drawer",
                                "title": "我的站内信",
                                "className": "myMessage",
                                "drawer": {
                                    "position": "right",
                                    "title": "我的站内信",
                                    "id": "drawer_confirm",
                                    "className": "myMessage",
                                    "body": [
                                        {
                                            "name": "mycustom",
                                            "asFormItem": true,
                                            "children": ({
                                                value,
                                                onChange,
                                                data
                                            }: {
                                                value: any,
                                                onChange: any,
                                                data: any
                                            }) => {
                                                return (
                                                    <>
                                                        <MessageInfo data={data} />
                                                    </>
                                                )
                                            }
                                        }
                                    ],
                                    "actions": [{
                                        "type": "button",
                                        "label": "查看全部",
                                        "level": "primary",
                                        "onEvent": {
                                            "click": {
                                                "actions": [
                                                    {
                                                        "actionType": "confirm",
                                                        "componentId": "drawer_confirm"
                                                    }, {
                                                        "actionType": "custom",
                                                        "script": function () {
                                                            const params = new URLSearchParams(window.location.search);
                                                            const appid = params.get('appid');
                                                            const env = params.get('env');
                                                            const portalKey = params.get('portalKey')
                                                            let url = '';
                                                            if (window.location.pathname.indexOf('/app/design') > -1) {
                                                                url = '/app/design/user/notify-message?appid=' + appid + '&env=' + env;
                                                            } else {
                                                                url = '/app/user/notify-message?appid=' + appid + '&env=' + env + (portalKey ? `&portalKey=${portalKey}` : '');
                                                            }
                                                            history.push(url)
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }]
                                },
                            }
                            ]
                        }
                    },
                    "badge": {
                        "mode": "text",
                        "text": "${count==0 ? '': count}",
                        "offset": [
                            -20,
                            0
                        ]
                    },
                    "style": {
                        "margin": "0 20px 0 0",
                        "cursor": "pointer"
                    },
                    "className": "text-xl iconShowBtn"
                },
                "className": "mb-1",
            },
            {
                "type": "avatar",
                "showtype": "image",
                "icon": "",
                "fit": "cover",
                "style": {
                    "width": 30,
                    "height": 30,
                    "borderRadius": 20
                },
                "id": "u:fe8c79dd9a29",
                "className": "m-r-xs",
                "src": "${amisUser.avatar}"
            },
            {
                "type": "dropdown-button",
                "level": "link",
                "size": "lg",
                "label": "${amisUser.name}",
                "menuClassName": "individualCenterMenu",
                "className": "individualCenter",
                "closeOnClick": true,
                "closeOnOutside": true,
                "buttons": [
                    {
                        "type": "button",
                        "label": "个人中心",
                        "icon": "fa fa-user-cog",
                        "onEvent": {
                            "click": {
                                "actions": [
                                    {
                                        "actionType": "custom",
                                        "script": async function (row: any) {
                                            const params = new URLSearchParams(window.location.search);
                                            const appid = params.get('appid');
                                            const env = params.get('env');
                                            const portalKey = params.get('portalKey')
                                            let url = '';
                                            if (window.location.pathname.indexOf('/app/design') > -1) {
                                                url = '/app/design/user/profile?appid=' + appid + '&env=' + env;
                                            } else {
                                                url = '/app/user/profile?appid=' + appid + '&env=' + env + (portalKey ? `&portalKey=${portalKey}` : '');
                                            }
                                            history.push(url)
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "type": "button",
                        "label": "打开管理端",
                        "icon": "fa  fa-external-link",
                        "onEvent": {
                            "click": {
                                "actions": [
                                    {
                                        "actionType": "custom",
                                        "script": async function () {
                                            let url = adminUrl + '/index'
                                            window.open(url)
                                        }
                                    }
                                ]
                            }
                        },
                    },
                    {
                        "type": "button",
                        "label": "退出系统",
                        "icon": "fa fa-sign-out",
                        "actionType": "dialog",
                        "dialog": {
                            "title": "温馨提示",
                            "body": "是否退出本系统？",
                            "onEvent": {
                                "confirm": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": async function () {
                                                if (getAccessToken()) {
                                                    await loginOutApi()
                                                    removeToken()
                                                    wsCache.clear()
                                                    wsCacheSession.wsCache.clear()
                                                }
                                                const { search, pathname } = window.location;
                                                const urlParams = new URL(window.location.href).searchParams;
                                                const searchParams = new URLSearchParams({
                                                    redirect: pathname + search,
                                                });
                                                appId && searchParams.set('appid', appId);
                                                envId && searchParams.set('env', envId);
                                                portalKey && searchParams.set('portalKey', portalKey);
                                                /** 此方法会跳转到 redirect 参数所在的位置 */
                                                const redirect = urlParams.get('redirect');
                                                // Note: There may be security issues, please note
                                                if (window.location.pathname !== '/app/login' && !redirect) {
                                                    const targetPath  = portalKey ? getPortalLoginRouterData().routePath : '/app/login'
                                                    history.replace({
                                                        pathname: targetPath,
                                                        search: searchParams.toString(),
                                                    });
                                                }
                                                location.reload()
                                            }
                                        }
                                    ]
                                }
                            },
                        }
                    }
                ]
            },
        ]
    },

    ],
    "style": {
        "position": "static",
        "display": "flex",
        "overflowX": "visible",
        "margin": "0",
        "flexWrap": "nowrap",
        "justifyContent": "flex-end",
        "alignItems": "center"
    },
    "wrapperBody": false,
    "id": "u:4b8666ad57f7",
    "isFixedHeight": false,
    "isFixedWidth": false
}

export default Avatar;
