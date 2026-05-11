import { toast } from 'amis'
import { formatSize } from "@/utils/util"
import { isAppEnd } from '@/utils/index'
import { useDevBaseUrl } from "@/utils/util"
let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/file/page") : useDevBaseUrl("/app/file/page")
let uploadApi = isAppEnd() ? useDevBaseUrl("/application/app/file/upload/${configCode}") : useDevBaseUrl("/app/file/upload/${configCode}")
let deleteApi = isAppEnd() ? useDevBaseUrl("/application/app/file/delete?id=${id}") : useDevBaseUrl("/app/file/delete?id=${id}")
const schema ={
    "type": "page",
    "body": [
        {
            "type": "crud",
            "name": "fileCrud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": crudApi,
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "path": "${path}",
                    "type": "${type}",
                },
                adaptor: function (payload:any) {
                    payload?.data?.list.map(item=>item.size= formatSize(item.size))
                    let arr = payload?.data?.list.map(element => {
                        if (element.type.indexOf('image/') == 0) {
                            return {
                                ...element,
                                dataType: 'image',
                            };  
                        } else if(element.type.indexOf('video/') == 0){
                            return {
                                ...element,
                                dataType: 'video',
                            };  
                        } else {
                            return {
                                ...element,
                                dataType: 'file',
                                file: { name: element.url, url: element.url}
                            }; 
                        }
                    });
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload?.data, items: payload?.data?.list ? arr : []  }
                    };
                },
            },
            "headerToolbar": [
                {
                    "type": "columns-toggler",
                    "align": "right",
                    "draggable": true,
                },
                {
                    "type": "reload",
                    "align": "right",
                },
                {
                    "label": "上传文件",
                    "type": "button",
                    "icon": "fa fa-plus",
                    "actionType": "dialog",
                    "level": "primary",
                    "dialog": {
                        "title": "上传",
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": uploadApi,
                                "data": {
                                    "file": "${file}",
                                },
                                adaptor: function (payload:any) {
                                    return {
                                        ...payload,
                                        status: payload.code
                                    };
                                }
                            },
                            "body": [
                                {
                                    "type": "input-file",
                                    "name": "file",
                                    "label": "文件",
                                    "accept": "*",
                                    "asBlob": true,
                                    "drag": true,
                                    "required": true,
                                },
                                {
                                    "type": 'select',
                                    "name": 'configCode',
                                    "label": '文件存储器',
                                    "placeholder": '请选择',
                                    "clearable": true,
                                    "required": true,
                                    "labelField": "name",
                                    "valueField": "code",
                                    "source": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/app/file-config/list-all-simple"),
                                        adaptor: function (payload: any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, options: payload.data }
                                            };
                                        },
                                    },
                                },
                            ]
                        }
                    }
                },
            ],
            "footerToolbar": [
                "statistics",
                "switch-per-page",
                "pagination"
            ],
            "alwaysShowPagination": true,
            "autoGenerateFilter": true,
            "columns": [
                {
                    "name": "id",
                    "label": "序号",
                    "width": 60,
                },
                {
                    "name": "configName",
                    "label": "配置名",
                    "width": 40,
                },
                {
                    "name": "name",
                    "label": "文件名",
                },
                {
                    "name": "path",
                    "label": "文件路径",
                    "width": 210,
                    "searchable": {
                        "type": "input-text",
                        "name": "path",
                        "label": "文件路径",
                        "clearable": true,
                        "placeholder": "请输入文件路径",
                        "size": "sm",
                    }
                },
                {
                    "name": "dataType",
                    "label": "URL",
                    "type": "mapping",
                    "map": {
                        "image": {
                            "type": "image",
                            "src": "${url}",
                            // "originalSrc": "${url}",
                            // "enlargeAble": true,
                        },
                        "video": {
                            "type": "video",
                            "src": "${url}",
                        },
                        "file": {
                            "type": "static-tpl",
                            tpl: "<% let value = data && data['file'];%><% if (value) { %>\n        <%\n          let file = value;\n          try {\n            file = typeof file === 'string' ? JSON.parse(file) : file;\n          } catch {\n            file = {}\n          }\n          let url = file.url;\n          let a = document.createElement('a');\n          a.href = url;\n        %>\n          <a target=\"_blank\" href=\"<%= url %>\" download><%- file.name %></a>\n        <% } else {%>\n          -\n        <% }%>\n        "
                        },
                    },
                },
                {
                    "name": "size",
                    "label": "文件大小",
                },
                {
                    "name": "type",
                    "label": "文件类型",
                    "width": 60,
                    "searchable": {
                        "type": "input-text",
                        "name": "type",
                        "label": "文件类型",
                        "clearable": true,
                        "placeholder": "请输入文件类型",
                        "size": "sm",
                    }
                },
                {
                    "name": "createTime",
                    "label": "创建时间",
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "复制",
                            "type": "button",
                            "level": "link",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": function (row: any) {
                                                let url = row.props.data.url
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

                        },
                        {
                            "label": "详情",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "dialog": {
                                "title": "详情",
                                "actions": [
                                    {
                                        "label": "关闭",
                                        "actionType": "close",
                                        "level": "default",
                                        "type": "button",
                                    }
                                ],
                                "body": {
                                    "type": "form",
                                    "body": [
                                        {
                                            "type": "input-text",
                                            "name": "name",
                                            "label": "文件名",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "path",
                                            "label": "文件路径",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "url",
                                            "label": "URL",
                                            "static": true,
                                        },
                                        {
                                            "type": 'select',
                                            "name": 'size',
                                            "label": '文件大小',
                                            "static": true,
                                        },
                                        {
                                            "type": 'input-text',
                                            "name": 'type',
                                            "label": '文件类型',
                                            "static": true,
                                        },
                                        {
                                            "type": 'input-datetime',
                                            "name": 'createTime',
                                            "label": '创建时间',
                                            "valueFormat": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "size": 'sm',
                                            "static": true,
                                        },
                                    ]
                                }
                            }
                        }, 
                        {
                            "label": "删除",
                            "type": "button",
                            "actionType": "ajax",
                            "level": "link",
                            "confirmText": "确认要删除${name}吗？",
                            "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:file:delete')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:file:delete')}",
                            "api": {
                                "url": deleteApi,
                                "method": "delete"
                            },
                        }
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }
    ]
}

export default schema;