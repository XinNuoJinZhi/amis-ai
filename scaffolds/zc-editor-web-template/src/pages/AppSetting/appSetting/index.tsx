import { toast } from 'amis'
import { useDevBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";

const schema = {
    "type": "page",
    "body": [{
        "type": "form",
        "initApi": {
            "method": "get",
            "url": useDevBaseUrl("/app/info/get"),
            adaptor: function (payload: any,response:any, api:any, context:any) {
                return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data}
                };
            }
        },
        "api": {
            "method": "put",
            "url": useDevBaseUrl("/app/info/update"),
            requestAdaptor: function (api:any) {
                let id = api.data.id;
                let name = api.data.name;
                let icon = api.data.icon;
                let remark = api.data.remark;
                // let packagePrefix = api.data.packagePrefix
                return {
                    ...api,
                    data: {
                        "id": id,
                        "name": name,
                        "icon": icon,
                        "remark": remark,
                        // "packagePrefix": packagePrefix
                    }
                };
            },
            adaptor: function (payload:any) {
                return {
                    ...payload,
                    status: payload?.code
                };
            }
        },
        onEvent:{
            "submitSucc": {
                "actions": [
                    {
                        "actionType": "custom",
                        "script": async function () {
                            toast.success('修改成功', {
                                position: 'top-center'
                            });
                        }
                    }
                ]
            }
        },
        "title": "",
        "mode": "horizontal",
        "horizontal": {
            "left": 1,
            "right": 4,
            "offset": 2
        },
        "actions": [
            {
                "type": "submit",
                "label": "提交",
                "level": "primary",
                "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:info:update')}",
            }
        ],
        "body": [{
            "type": "input-text",
            "name": "name",
            "label": "应用名称",
            "required": true,
            "showCounter": true,
            "maxLength": 34,
        },
        // {
        //     "type": "input-text",
        //     "name": "packagePrefix",
        //     "label": "包前缀",
        //     "required": false,
        //     "showCounter": true,
        //     "maxLength": 30,
        //     "placeholder": "请输入包前缀如(生成应用的包配置):com.xx.server",
        //     "validations": {
        //         "matchRegexp": "^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+$"
        //     },
        //     "validationErrors": {
        //         "matchRegexp": "包前缀格式错误，请输入以下格式：com.xx.server"
        //     }
        // },
        {
            "type": "input-image",
            "label": "Logo",
            "name": "icon",
            // "crop": true,
            "maxSize": 51200,
            "receiver": {
                "method": "post",
                "url": useDevBaseUrl("/app/file/convert/base64"),
                adaptor: function (payload: any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: {
                            "value": payload.data
                        }
                    };
                }
            }
        },
        // {
        //     "type": "switch",
        //     "name": "breadcrumbNavigation",
        //     "label": "面包屑导航",
        //     "onText": "开启",
        //     "offText": "关闭",
        //     "trueValue": 1,
        //     "falseValue": 0
        // },{
        //     "type": "switch",
        //     "name": "pageHistoryNavigation",
        //     "label": "页面历史导航",
        //     "onText": "开启",
        //     "offText": "关闭",
        //     "trueValue": 1,
        //     "falseValue": 0
        // },{
        //     "type": "switch",
        //     "name": "launchApplicationLog",
        //     "label": "启动应用日志",
        //     "onText": "开启",
        //     "offText": "关闭",
        //     "trueValue": 1,
        //     "falseValue": 0
        // },
        {
            "type": "textarea",
            "name": "remark",
            "label": "描述",
            "placeholder": "请输入描述信息",
            "showCounter": true,
            "maxLength": 255,
        }]
    }]
}
export default () => <AMISComponent schema={schema} />;
