import {useDevBaseUrl} from '@/utils/util';
export default () => {
    return {
        type: "dialog",
        title: "源代码json",
        body: [
            {
                "type": "spinner",
                "showOn": '${editorJson==null}',
                "overlay": '${editorJson==null}',
                body:[
                    {
                        label: false,
                        type: "editor",
                        name: "editorJson",
                        id: "editorJson",
                        size: "lg",
                        options: {
                            lineNumbers: "off"
                        },
                        language: "json",
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
                primary: true,
                visibleOn: "${primaryField}",
                onEvent: {
                    click: {
                        actions: [
                            {
                                actionType: "ajax",
                                args: {
                                    api: {
                                        method: "post",
                                        url: useDevBaseUrl('/entitymanage/table/getModelJsonDownload'),
                                        responseType: "blob",
                                        data: "${editorJson}"
                                    }
                                }
                            }
                        ]
                    }
                }
                // onEvent: {
                //     click: {
                //         actions: [
                //             {
                //                 actionType: 'custom',
                //                 script: function(_: any,doAction: any,event: any) {
                //                     console.log(event,'点击确认json数据')
                //                     const fileContent = JSON.stringify(event.data.editorJson, null, 2);
                //                     const blob = new Blob([fileContent], { type: 'application/json' });
                //                     const a = document.createElement('a');
                //                     const url = URL.createObjectURL(blob);
                //                     a.href = url;
                //                     a.download = 'downloadedFile.json'; // 设置下载的文件名
                //                     document.body.appendChild(a);
                //                     a.click();
                //                     URL.revokeObjectURL(url);
                //                     doAction({ actionType: "closeDialog" });
                //                 }
                //             }
                //         ]
                //     }
                // }
            },
            {
                close:false,
                type: "button",
                actionType: "confirm",
                label: "下载",
                primary: true,
                visibleOn: "${!primaryField}",
                onEvent: {
                    click: {
                        actions: [
                            {
                                actionType: "ajax",
                                args: {
                                    api: {
                                        method: "post",
                                        url: useDevBaseUrl('/entitymanage/dataSource/getModelJsonDownload'),
                                        responseType: "blob",
                                        data: "${editorJson}"
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
