import { isAppEnd } from '@/utils/index'
import { useDevBaseUrl } from "@/utils/util"
let crudApi = isAppEnd() ? useDevBaseUrl("/application/apiManage/api/page") : useDevBaseUrl("/apiManage/api/page")
let updateApi = isAppEnd() ? useDevBaseUrl("/application/apiManage/api/switchTrigger") : useDevBaseUrl("/apiManage/api/switchTrigger")
const schema = {
    "type": "page",
    "body": [
        {
            "type": "crud",
            "autoFillHeight": true,
            "syncLocation": false,
            "api": {
                "url": crudApi,
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "code": "${code|default:undefined}",
                    "types": "1,2"
                },
            },
            "headerToolbar": [
                {
                    "type": "columns-toggler",
                    "align": "right",
                    "draggable": true
                },
                {
                    "type": "reload",
                    "align": "right",
                }
            ],
            "alwaysShowPagination": true,
            "autoGenerateFilter": true,
            "columns": [
                {
                    "name": "code",
                    "label": "标识",
                    "width": "30%",
                    "searchable": {
                        "type": "input-text",
                        "name": "code",
                        "label": "标识",
                        "clearable": true,
                        "placeholder": "请输入标识",
                        "size": "sm",
                    }
                },
                {
                    "name": "name",
                    "label": "触发器名称",
                },
                {
                    "name": "type",
                    "label": "类型",
                    "type": 'mapping',
                    "map": {
                        // '0': "<span>调用</span>",
                        '1': "<span>事件触发</span>",
                        '2': "<span>定时触发</span>",
                    },
                },
                {
                    "name": "status",
                    "label": "状态",
                    "type": 'mapping',
                    "map": {
                        '0': "<span>启动</span>",
                        '1': "<span>暂停</span>",
                    },
                },
                {
                    "name": "updateTime",
                    "label": "修改时间",
                    "width": 180,
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "禁用",
                            "type": "button",
                            "actionType": "ajax",
                            "level": "link",
                            "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:trigger:setStatus') && status==0}" : "${ARRAYINCLUDES(${$$permissionsData},'apiManage:api:update')  && status==0}",
                            "confirmText": '确认要禁用触发器"${name}"吗？',
                            "api": {
                                "method": "put",
                                "url": updateApi,
                                "data": {
                                    "id": "${id}",
                                    "status": "1",
                                },
                                adaptor: function (payload: any) {
                                    return {
                                        ...payload,
                                        status: payload.code
                                    };
                                }
                            },
                        },
                        {
                            "label": "启用",
                            "type": "button",
                            "actionType": "ajax",
                            "level": "link",
                            "visibleOn":  isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:trigger:setStatus') && status==1}" : "${ARRAYINCLUDES(${$$permissionsData},'apiManage:api:update')  && status==1}",
                            "confirmText": '确认要启用触发器"${name}"吗？',
                            "api": {
                                "method": "put",
                                "url": updateApi,
                                "data": {
                                    "id": "${id}",
                                    "status": "0",
                                },
                                adaptor: function (payload: any) {
                                    return {
                                        ...payload,
                                        status: payload.code
                                    };
                                }
                            },
                        }
                    ]
                },
            ],
            "footerToolbar": [
                "statistics",
                "switch-per-page",
                "pagination"
            ],
        }
    ]
}
export default schema