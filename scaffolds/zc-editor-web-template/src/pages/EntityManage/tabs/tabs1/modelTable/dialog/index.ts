import {useDevBaseUrl} from '@/utils/util';

export default () => {
    return {
        type: "dialog",
        title: "建表语句",
        body: [
            {
                "type": "spinner",
                "showOn": '${editorTable==null}',
                "overlay": '${editorTable==null}',
                body:[
                    {
                        label: false,
                        type: "editor",
                        name: "editorTable",
                        id: "editorTable",
                        size: "lg",
                        options: {
                            lineNumbers: "off"
                        },
                        language: "sql",
                        disabled: true
                    }
                ]
            }
        ],
        actions: [
            {
                type: "button",
                actionType: "cancel",
                label: "取消"
            },
            {
                close:false,
                type: "button",
                actionType: "confirm",
                label: "下载",
                id:'editDownload',
                primary: true,
                visibleOn: "${primaryField && editorTable!=null && editorTable!=''}",
                onEvent: {
                    click: {
                        actions: [
                            {
                                actionType: "ajax",
                                args: {
                                    api: {
                                        method: "post",
                                        url: useDevBaseUrl('/entitymanage/table/getCreateDdlDownload'),
                                        responseType: "blob",
                                        data: {
                                            item: "${editorTable}"
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                close:false,
                type: "button",
                actionType: "confirm",
                label: "下载",
                id:'editDownload',
                primary: true,
                visibleOn: "${!primaryField && editorTable!=null && editorTable!=''}",
                onEvent: {
                    click: {
                        actions: [
                            {
                                actionType: "ajax",
                                args: {
                                    api: {
                                        method: "post",
                                        url: useDevBaseUrl('/entitymanage/dataSource/getCreateDdlDownload'),
                                        responseType: "blob",
                                        data: {
                                            items: "${editorTable}"
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ],
        showCloseButton: true,
        closeOnOutside: false,
        closeOnEsc: false,
        showErrorMsg: true,
        showLoading: true,
        draggable: false
    }
}
