import {isAppEnd} from '@/utils/index'
import {findEditMenu, useDevBaseUrl} from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";

let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/rowPermission/list") : useDevBaseUrl("/app/rowPermission/list")
let rowPerMenu = true
if(isAppEnd()) {
    rowPerMenu = findEditMenu('/app/appPermissions') ? true : false
} else {
    rowPerMenu = findEditMenu('/app/design/appPermissions') ? true : false
}
const schema = {
    "type": "page",
    "body": {
        "type": "tabs",
        "swipeable": true,
        "unmountOnExit": true,
        "tabs": [
            {
                "title": "数据权限",
                "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:rowPermission:query')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:rowPermission:query')}",
                "tab": [{
                    "type": "crud",
                    "syncLocation": false,
                    "autoFillHeight": true,
                    "api": {
                        "method": "get",
                        "url": crudApi,
                        "data": {
                            "pageNo": "${page}",
                            "pageSize": "${perPage}",
                            "dataModel": "${dataModel|default:undefined}",
                        },
                    },
                    "headerToolbar": [
                        {
                            "type": "reload",
                            "align": "right",
                        },
                        {
                            "type": "search-box",
                            "name": "dataModel",
                            "align": "right",
                            "clearable": true,
                            "placeholder": "关键字检索",
                            "size": "sm"
                        },
                    ],
                    "columns": [
                        {
                            "name": "dataModel",
                            "label": "数据模型",
                        },
                        {
                            "name": "code",
                            "label": "标识",
                        },
                        {
                            "name": "dataSourceName",
                            "label": "数据源",
                        },
                        {
                            "type": "operation",
                            "label": "操作",
                            "buttons": [
                                {
                                    "label": "行权限",
                                    "level": "link",
                                    "type": "button",
                                    "actionType": "link",
                                    "visibleOn": isAppEnd() ? (rowPerMenu ? "${ARRAYINCLUDES(${$$permissionsData},'app:rowPermission:query')}" : "${false}"): (rowPerMenu ? "${ARRAYINCLUDES(${$$permissionsData},'devApp:rowPermission:query')}" : "${false}"),
                                    "link": isAppEnd() ? '/app/rowPermission?tableKey=${tableKey}&dataMod=${dataModel}' : '/app/design/rowPermission?tableKey=${tableKey}&dataMod=${dataModel}',
                                }
                            ]
                        },
                    ],
                    "footerToolbar": [
                        "statistics",
                        "switch-per-page",
                        "pagination"
                    ],
                }]
            }
        ]
    }
}
export default () => <AMISComponent schema={schema} />;
