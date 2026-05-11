import { toast } from 'amis'

export default () => {
    return {
        type: "dialog",
        title: "yaml配置",
        body: [
            {
                label: false,
                type: "editor",
                name: "yamlEditorTable",
                id: "yamlEditorTable",
                size: "lg",
                options: {
                    lineNumbers: "off"
                },
                language: "yaml",
                disabled: true,
                description: "请手动将其复制于 spring.datasource.dynamic.datasource 配置下并重启服务"
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
                label: "复制",
                primary: true,
                onEvent: {
                    click: {
                        actions: [
                            {
                                "actionType": "custom",
                                "script": function (row: any) {
                                    console.log(row,'row')
                                    let url = row.props.data.yamlEditorTable
                                    let oInput = document.createElement('textarea')
                                    oInput.value = url
                                    document.body.appendChild(oInput)
                                    oInput.select() // 选择对象;
                                    document.execCommand('Copy') // 执行浏览器复制命令
                                    toast.success('复制成功', {
                                        position: 'top-center'
                                    });
                                    oInput.remove()
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
