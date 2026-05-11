import { useDevBaseUrl } from "@/utils/util"
export default () => {
    return {
        "type": "button",
        "label": "删除",
        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-datasource:delete')}",
        // "actionType": "ajax",
        // api: {
        //     url: useDevBaseUrl('/entitymanage/dataSource/deleteDataSource/false?dataSourceKey=${queryKey}'),
        //     method: 'delete'
        // },
        "onEvent": {
            "click": {
                "actions": [
                    {
                        "actionType": "dialog",
                        "dialog": {
                            "type": "dialog",
                            "title": "提示",
                            "body": [
                                {
                                    "type": "tpl",
                                    "tpl": "<p>确定删除吗？</p>",
                                }
                            ],
                            "actions": [
                                {
                                    "type": "button",
                                    "actionType": "cancel",
                                    "label": "取消",
                                },
                                {
                                    "type": "button",
                                    "actionType": "ajax",
                                    "close": true,
                                    api: {
                                        url: useDevBaseUrl('/entitymanage/dataSource/deleteDataSource/true?dataSourceKey=${queryKey}'),
                                        method: 'delete'
                                    },
                                    "label": "确认",
                                    "primary": true,
                                    "reload": "my_nav,entityModel",
                                }
                            ],
                            "showCloseButton": true,
                            "closeOnOutside": false,
                            "closeOnEsc": false,
                            "showErrorMsg": true,
                            "showLoading": true,
                            "draggable": false
                        }
                    }
                ]
            }
        }
    }
}
