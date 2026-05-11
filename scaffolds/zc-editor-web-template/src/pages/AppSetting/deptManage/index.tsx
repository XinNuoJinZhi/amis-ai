import { handleTree } from '@/utils/tree'
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
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
                "url": useDevBaseUrl("/application/system/dept/page"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "name": "${name}",
                    "status": "${status}",
                },
                adaptor: function (payload:any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload?.data, items: payload?.data?.list ? payload?.data?.list : []  }
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
                    "label": "新增",
                    "type": "button",
                    "icon": "fa fa-plus",
                    "actionType": "dialog",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:dept:create')}",
                    "level": "primary",
                    "dialog": {
                        "title": "新增",
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl('/application/system/dept/create'),
                                requestAdaptor: function (api:any) {
                                    return {
                                    ...api,
                                    data: {
                                        "parentId": api.data.parentId,
                                        "name": api.data.name,
                                        "code": api.data.code,
                                        "phone": api.data.phone,
                                        "email": api.data.email,
                                        "sort": api.data.sort,
                                        "status": 0,
                                    }
                                    };
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
                                    "type": "tree-select",
                                    "name": "parentId",
                                    "label": "上级部门",
                                    "searchable": true,
                                    "labelField": "name",
                                    "valueField": "id",
                                    "source": {
                                        "url": useDevBaseUrl("/application/system/dept/simple-list"),
                                        "method": "get",
                                        adaptor: function (payload:any) {
                                            let dept = [{ id: 0, name: '顶级部门', children: [] }]
                                            dept[0].children = handleTree(payload.data)
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: {
                                                    ...payload.data,
                                                    options: dept ? dept : [],
                                                }
                                            };
                                        }
                                    },
                                },
                                {
                                    "type": "input-text",
                                    "name": "name",
                                    "label": "部门名称",
                                    "required": true,
                                    "showCounter": true,
                                    "maxLength": 20,
                                },
                                {
                                    "type": "input-text",
                                    "name": "code",
                                    "label": "部门编码",
                                    "required": true,
                                    "showCounter": true,
                                    "maxLength": 20,
                                    "validations": {
                                        "matchRegexp": "/^[a-zA-Z0-9_]+$/"
                                    },
                                    "validationErrors": {
                                        "matchRegexp": "部门编码由字母、数字、下划线组成"
                                    },
                                    "validateOnChange": true,
                                },
                                // {
                                //     "type": 'select',
                                //     "name": 'leaderUserId',
                                //     "label": '部门主管',
                                //     "placeholder": '请选择',
                                //     "clearable": true,
                                //     "required": true,
                                //     "labelField": "nickname",
                                //     "valueField": "id",
                                //     "source": {
                                //         "method": "get",
                                //         "url": useDevBaseUrl("/application/system/user/simple-list"),
                                //         adaptor: function (payload: any) {
                                //             return {
                                //                 ...payload,
                                //                 status: payload.code,
                                //                 data: { ...payload.data, options: payload.data }
                                //             };
                                //         },
                                //     },
                                // },
                                {
                                    "type": "input-text",
                                    "name": "phone",
                                    "label": "联系电话",
                                    "maxLength": 11,
                                    "placeholder": "请输入联系电话",
                                    "validations": {
                                        "isNumeric": true
                                    },
                                    "validationErrors": {
                                        "isNumeric": "请输入正确的联系电话"
                                    },
                                    "validateOnChange": true,
                                },
                                {
                                    "type": "input-email",
                                    "name": "email",
                                    "label": "邮箱",
                                    "placeholder": "请输入邮箱",
                                    "validateOnChange": true,
                                    "validations": {
                                        "isEmail": true
                                    },
                                },
                                {
                                    "type": "input-number",
                                    "name": "sort",
                                    "label": "显示排序",
                                    "required": "true",
                                    "placeholder": "请输入显示排序",
                                    "value": 0,
                                },
                                // {
                                //     "type": "select",
                                //     "name": "status",
                                //     "label": "状态",
                                //     "placeholder": "请选择状态",
                                //     "required": true,
                                //     "source": {
                                //         "method": "get",
                                //         "url": useAdminBaseUrl("/system/dict-data/list?dictType=common_status&status=0"),
                                //         adaptor: function (payload: any) {
                                //             return {
                                //                 ...payload,
                                //                 status: payload.code,
                                //                 data: { ...payload.data, options: payload.data }
                                //             };
                                //         },
                                //     },
                                // },
                            ]
                        }
                    }
                },
                {
                    "label": "导入",
                    "type": "button",
                    "icon": "fa fa-upload",
                    "actionType": "dialog",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:dept:import')}",
                    "level": "warning",
                    "dialog": {
                        "title": "部门导入",
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl('/application/system/dept/import?updateSupport=${updateSupport}'),
                                requestAdaptor: function (api:any) {
                                    return {
                                        ...api,
                                        data: {
                                            "file": api.data.file,
                                        }
                                    };
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
                                    "type": "static-container",
                                    "label": "模板下载",
                                    "body": [{
                                        "className": "no-padder",
                                        "label": "点击下载",
                                        "level": "link",
                                        "type": "button",
                                        "onEvent": {
                                            "click": {
                                                "actions": [
                                                    {
                                                        "actionType": "ajax",
                                                        "args": {
                                                            "api": {
                                                                "method": "get",
                                                                "url": useDevBaseUrl("/application/system/dept/get-import-template"),
                                                                "responseType": "blob"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }]
                                },
                                {
                                    "accept": ".xls,.xlsx",
                                    "label": "文件上传",
                                    "maxSize": 104857600,
                                    "name": "file",
                                    "required": true,
                                    "type": "input-file",
                                    "drag": true,
                                    "maxLength": 1,
                                    "autoUpload": false,
                                    "hideUploadButton": true,
                                    "asBlob": true,
                                    "description": "请上传 .xls , .xlsx格式文件"
                                },
                                {
                                    "name": "updateSupport",
                                    "type": "checkbox",
                                    "label": "是否更新已经存在的部门数据",
                                    "option": ""
                                }
                            ]
                        }
                    }
                },
                {
                    "label": "导出",
                    "type": "button",
                    "icon": "fa fa-download",
                    "level": "warning",
                    "actionType": "ajax",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:dept:export')}",
                    "confirmText": "是否确认导出数据项？",
                    "api": {
                        "url": useDevBaseUrl("/application/system/dept/export-excel"),
                        "method": "get",
                        "responseType": "blob",
                        adaptor: function (payload:any) {
                            return {
                                ...payload,
                                status: payload.code,
                            };
                        },
                    },
                }
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
                    "name": "name",
                    "label": "部门名称",
                    "searchable": {
                        "type": "input-text",
                        "name": "name",
                        "label": "部门名称",
                        "clearable": true,
                        "placeholder": "请输入部门名称",
                        "size": "sm",
                    }
                },
                {
                    "name": "code",
                    "label": "部门编码",
                },
                // {
                //     "name": "deptLeader",
                //     "label": "部门主管",
                // },
                {
                    "name": "phone",
                    "label": "联系电话",
                },
                {
                    "name": "sort",
                    "label": "显示排序",
                },
                // {
                //     "name": "status",
                //     "label": "状态",
                //     "type": 'mapping',
                //     "map": {
                //         '0': "<span>开启</span>",
                //         '1': "<span>关闭</span>",
                //     },
                //     "searchable": {
                //         "type": 'select',
                //         "name": 'status',
                //         "label": '状态',
                //         "placeholder": '请选择',
                //         "clearable": true,
                //         "size": 'sm',
                //         "source": {
                //             "method": "get",
                //             "url": useAdminBaseUrl("/system/dict-data/list?dictType=common_status&status=0"),
                //             adaptor: function (payload: any) {
                //                 return {
                //                     ...payload,
                //                     status: payload.code,
                //                     data: { ...payload.data, options: payload.data }
                //                 };
                //             },
                //         },
                //     }
                // },
                {
                    "name": "createTime",
                    "label": "创建时间",
                },
                {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "编辑",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:dept:update')}",
                            "dialog": {
                                "title": "编辑",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "put",
                                        "url": useDevBaseUrl('/application/system/dept/update'),
                                        "data": {
                                            "id": "${id}",
                                            "parentId": "${parentId}",
                                            "name": "${name}",
                                            "code": "${code}",
                                            "leaderUserId": "${leaderUserId}",
                                            "phone": "${phone}",
                                            "email": "${email}",
                                            "sort": "${sort}",
                                            "status": 0,
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
                                            "type": "tree-select",
                                            "name": "parentId",
                                            "label": "上级部门",
                                            "searchable": true,
                                            "labelField": "name",
                                            "valueField": "id",
                                            "source": {
                                                "url": useDevBaseUrl("/application/system/dept/simple-list"),
                                                "method": "get",
                                                adaptor: function (payload:any) {
                                                    let dept = [{ id: 0, name: '顶级部门', children: [] }]
                                                    dept[0].children = handleTree(payload.data)
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: {
                                                            ...payload.data,
                                                            options: dept ? dept : [],
                                                        }
                                                    };
                                                }
                                            },
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "name",
                                            "label": "部门名称",
                                            "required": true,
                                            "showCounter": true,
                                            "maxLength": 20,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "code",
                                            "label": "部门编码",
                                            "disabled": true,
                                            "required": true,
                                            "showCounter": true,
                                            // "maxLength": 20,
                                            "validations": {
                                                "matchRegexp": "/^[a-zA-Z0-9_@]+$/"
                                            },
                                            "validationErrors": {
                                                "matchRegexp": "部门编码由字母、数字、下划线、@组成"
                                            },
                                            "validateOnChange": true,
                                        },
                                        // {
                                        //     "type": 'select',
                                        //     "name": 'leaderUserId',
                                        //     "label": '部门主管',
                                        //     "placeholder": '请选择',
                                        //     "clearable": true,
                                        //     "required": true,
                                        //     "labelField": "nickname",
                                        //     "valueField": "id",
                                        //     "source": {
                                        //         "method": "get",
                                        //         "url": useDevBaseUrl("/application/system/user/simple-list"),
                                        //         adaptor: function (payload: any) {
                                        //             return {
                                        //                 ...payload,
                                        //                 status: payload.code,
                                        //                 data: { ...payload.data, options: payload.data }
                                        //             };
                                        //         },
                                        //     },
                                        // },
                                        {
                                            "type": "input-text",
                                            "name": "phone",
                                            "label": "联系电话",
                                            "maxLength": 11,
                                            "placeholder": "请输入联系电话",
                                            "validations": {
                                                "isNumeric": true
                                            },
                                            "validationErrors": {
                                                "isNumeric": "请输入正确的联系电话"
                                            },
                                            "validateOnChange": true,
                                        },
                                        {
                                            "type": "input-email",
                                            "name": "email",
                                            "label": "邮箱",
                                            "placeholder": "请输入邮箱",
                                            "validateOnChange": true,
                                            "validations": {
                                                "isEmail": true
                                            },
                                        },
                                        {
                                            "type": "input-number",
                                            "name": "sort",
                                            "label": "显示排序",
                                            "required": "true",
                                            "placeholder": "请输入显示排序",
                                            "value": 0,
                                        },
                                        // {
                                        //     "type": "select",
                                        //     "name": "status",
                                        //     "label": "状态",
                                        //     "placeholder": "请选择状态",
                                        //     "required": true,
                                        //     "source": {
                                        //         "method": "get",
                                        //         "url": useAdminBaseUrl("/system/dict-data/list?dictType=common_status&status=0"),
                                        //         adaptor: function (payload: any) {
                                        //             return {
                                        //                 ...payload,
                                        //                 status: payload.code,
                                        //                 data: { ...payload.data, options: payload.data }
                                        //             };
                                        //         },
                                        //     },
                                        // },
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
                                "data": {
                                    id: "${id}"
                                },
                                "body": {
                                    "type": "form",
                                    "initApi": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/application/system/dept/get?id=${id}"),
                                        adaptor: function (payload:any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload?.data, email: payload?.data?.email ? payload?.data?.email : ' ', phone: payload?.data?.phone ? payload?.data?.phone : ' '}
                                            };
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "tree-select",
                                            "name": "parentId",
                                            "label": "上级部门",
                                            "searchable": true,
                                            "labelField": "name",
                                            "valueField": "id",
                                            "source": {
                                                "url": useDevBaseUrl("/application/system/dept/simple-list"),
                                                "method": "get",
                                                adaptor: function (payload:any) {
                                                    let dept = [{ id: 0, name: '顶级部门', children: [] }]
                                                    dept[0].children = handleTree(payload.data)
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: {
                                                            ...payload.data,
                                                            options: dept ? dept : [],
                                                        }
                                                    };
                                                }
                                            },
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "name",
                                            "label": "部门名称",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "code",
                                            "label": "部门编码",
                                            "static": true,
                                        },
                                        // {
                                        //     "type": 'select',
                                        //     "name": 'leaderUserId',
                                        //     "label": '部门主管',
                                        //     "placeholder": '请选择',
                                        //     "clearable": true,
                                        //     "labelField": "nickname",
                                        //     "valueField": "id",
                                        //     "source": {
                                        //         "method": "get",
                                        //         "url": useDevBaseUrl("/application/system/user/simple-list"),
                                        //         adaptor: function (payload: any) {
                                        //             return {
                                        //                 ...payload,
                                        //                 status: payload.code,
                                        //                 data: { ...payload.data, options: payload.data }
                                        //             };
                                        //         },
                                        //     },
                                        //     "static": true,
                                        // },
                                        {
                                            "type": "input-text",
                                            "name": "phone",
                                            "label": "联系电话",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "email",
                                            "label": "邮箱",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-number",
                                            "name": "sort",
                                            "label": "显示排序",
                                            "placeholder": "请输入显示排序",
                                            "static": true,
                                        },
                                        // {
                                        //     "type": "select",
                                        //     "name": "status",
                                        //     "label": "状态",
                                        //     "placeholder": "请选择状态",
                                        //     "source": {
                                        //         "method": "get",
                                        //         "url": useAdminBaseUrl("/system/dict-data/list?dictType=common_status&status=0"),
                                        //         adaptor: function (payload: any) {
                                        //             return {
                                        //                 ...payload,
                                        //                 status: payload.code,
                                        //                 data: { ...payload.data, options: payload.data }
                                        //             };
                                        //         },
                                        //     },
                                        //     "static": true,
                                        // },
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
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:dept:delete')}",
                            "api": {
                                "url": useDevBaseUrl("/application/system/dept/delete?id=${id}"),
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

export default () => <AMISComponent schema={schema} />;
