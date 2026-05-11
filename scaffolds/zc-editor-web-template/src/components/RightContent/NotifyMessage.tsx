import React, { useState, useEffect, Suspense  } from 'react';
import { isAppEnd } from '@/utils'
import { useDevBaseUrl } from "@/utils/util"
import MessageInfo from '@/components/Base/message/MessageInfo'
import { history } from '@umijs/max';
import {AMISComponent} from "@/hooks/amis";

const isAppEndStatus = isAppEnd()
const schema= {
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
  "initFetchOn": `\${${isAppEndStatus.toString()}}`,
  "body": [
    {
      "type": "tooltip-wrapper",
      "content": "我的站内信",
      "placement": "bottom",
      "tooltipTheme": "dark",
      "body": {
        "type": "icon",
        "icon": "fa-bell-o",
        "onEvent": {
          "click": {
            "actions": [{
              "actionType": "custom",
              "script": function () {
                if (document.getElementsByClassName('myMessage')[0]) {
                  (document.getElementsByClassName('myMessage') as any)[0].style.display = 'block';
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
                      "children":
                        ({
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
          "text": "${count==0 ? '': count}"
        },
        "className": "iconShowBtn"
      },
    }
  ]
}


const NotifyMessage: React.FC<any> = () => {
  return isAppEndStatus ? <div style={{
    lineHeight: '30px',
  }}>
    <AMISComponent schema={schema} />
  </div> : <></>
}

export default NotifyMessage;
