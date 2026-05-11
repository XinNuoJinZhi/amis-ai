import { isAppEnd } from '@/utils/index'
import { useDevBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/var/list") : useDevBaseUrl("/app/var/list")
let setApi = isAppEnd() ? useDevBaseUrl("/application/app/var/setting") : useDevBaseUrl("/app/var/setting")
const schema = {
    type: "page",
    body: [{
        "type": "form",
        "id": "envVar_page",
        "initApi": {
            "method": "get",
            "url": crudApi,
            adaptor: function (payload:any) {
                return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data, 'envVar': payload.data }
                };
            }
        },
        "api": {
            "method": "post",
            "url": setApi,
            requestAdaptor: function (api:any) {
                let data = api.data.envVar;
                // data.map(item=>item.var = item.var.toUpperCase())
                return {
                    ...api,
                    data: {
                        vars: data
                    }
                };
            },
            adaptor: function (payload: any) {
                return {
                    ...payload,
                    status: payload.code
                };
            }
        },
        "actions": [
            {
                "type": "submit",
                "label": "提交",
                "level": "primary",
                "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:var:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:var:update')}",
            }
        ],
        "title": "",
        "mode": "horizontal",
        "horizontal": {
            "right": 7,
            "offset": 2
        },
        "body": [
            {
                "type": "combo",
                "name": "envVar",
                "label": "变量名",
                "multiple": true,
                // "required": true,
                "items": [
                    {
                        "name": "var",
                        "type": "input-text",
                        "placeholder": "如：API_HOST",
                        "required": true,
                        "validations": {
                            "matchRegexp": "[A-Z]"
                        },
                        "validationErrors": {
                            "matchRegexp": "必须是大写字母"
                        },
                    },
                    {
                        "name": "value",
                        "type": "input-text",
                        "placeholder": "值",
                        "required": true,
                    }
                ],
                "desc":"此处定义的环境变量可用于「页面配置」、「对象存储」、「应用设置」中，语法为\\${VARIABLE_NAME}，变量名请采用大写。"
            }
        ],
        onEvent: {
            submitSucc: {
                actions: [
                    {
                        actionType: "reload",
                        componentId: "envVar_page"
                    },
                ]
            }
        }
    }]
}

export default () => <AMISComponent schema={schema} />;
