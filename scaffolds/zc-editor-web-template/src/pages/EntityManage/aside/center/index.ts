import getSee from "./see"
import getGenerateYamlConfiguration from "./generateYamlConfiguration"
import getDelete from "./delete"
import getEdit from "./edit"
import { history } from '@umijs/max';
import { useDevBaseUrl } from "@/utils/util"
import {toast} from 'amis';

export default () => {
    return {
        // "hiddenOn": "${IF(this.my_nav,false,true)}",
        "type": "nav",
        "name": "my_nav",
        "id": "my_nav",
        "stacked": true,
        "itemBadge": {
            "mode": "ribbon",
            "text": "${code}",
            "position": "top-left",
            "level": "${customLevel}",
            "size": 20
        },
        // "target": "entityModel",
        // "source": useDevBaseUrl("/entitymanage/dataSource/getList"),
        "source": {
            "method": "get",
            "url": useDevBaseUrl("/entitymanage/dataSource/getList"),
            adaptor: function (payload: any) {
                const customLevelList = ['info', 'success', 'warning', 'danger'];
                let data = payload?.data?.links ? payload?.data?.links : [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].label.indexOf('$') > -1) {
                        data[i].label = data[i].label.replace(/\$/g, '\\$');
                    }
                    // 用索引对 4 取余，实现循环复用（0→info，1→success，2→warning，3→danger，4→info...）
                    const levelIndex = i % customLevelList.length;
                    data[i].customLevel = customLevelList[levelIndex]
                }
                if (payload?.data?.links?.length == 0) { //都删除没有了
                    const params = new URLSearchParams(window.location.search);
                    const queryKey = params.get('queryKey');
                    const appid = params.get('appid');
                    const env = params.get('env');
                    history.push('/app/design/entityManage?appid=' + appid + '&env=' + env)
                }
                if(payload.code != 0) {
                    toast.error(payload.msg, {
                        position: 'top-right'
                    });
                }
                return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data, links: payload?.data?.links ? payload?.data?.links : [] }
                };
            }
        },
        "className": "w-md",
        "onEvent": {
            "click": {
                "actions": [
                    {
                        "actionType": "custom",
                        script: function (_: any, doAction: any, event: any) {
                            doAction({
                                "actionType": "setValue",
                                "componentId": "searchName",
                                "args": {
                                    "value": ''
                                }
                            })
                        },
                    }
                ]
            },
            "change": {
                "actions": [
                    {
                        "actionType": "custom",
                        script: function (_: any, doAction: any, event: any) {
                            setTimeout(()=>{
                                doAction({
                                    "actionType": "reload",
                                    "componentId": "entityModel",
                                    "data": {
                                        "searchName": ''
                                    }
                                })
                            },500)
                        },
                    }
                ]
            }
        },
        "itemActions": [
            {
                "type": "dropdown-button",
                "level": "link",
                "icon": "fa fa-ellipsis-h",
                "visibleOn": "${(ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-datasource:update')) || (ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-datasource:delete')) || (ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-datasource:query'))}",
                "hideCaret": true,
                "buttons": [
                    getSee(),
                    getGenerateYamlConfiguration(),
                    getEdit(),
                    getDelete(),
                ]
            }
        ]
    }
}
