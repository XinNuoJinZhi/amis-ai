import { handleTree } from '@/utils/tree'
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import { updateStatus } from "@/api/userManage";
import {AMISComponent} from "@/hooks/amis";
const schema ={
    "type": "page",
    "body": [
        {
            "type": "crud",
            "id": "user_manage",
            "name": "fileCrud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/application/system/user/page"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "username": "${username}",
                    "status": "${status}",
                    "registerStatus": "${registerStatus}"
                },
                adaptor: function (payload:any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload?.data, items: payload?.data?.list ? payload?.data?.list : []  }
                    };
                },
            },
            "quickSaveItemApi": {
                "method": "put",
                "url": useDevBaseUrl("/application/system/user/update-status"),
                "data": {
                    "id": "${id}",
                    "status": "${status == true ? 1 : 0}",
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
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:create')}",
                    "level": "primary",
                    "dialog": {
                        "title": "新增",
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl('/application/system/user/create'),
                                requestAdaptor: function (api:any) {
                                    return {
                                        ...api,
                                        data: {
                                            "deptId": api.data.deptId,
                                            "email": api.data.email,
                                            "mobile": api.data.mobile,
                                            "nickname": api.data.nickname,
                                            "password": api.data.password,
                                            "postIds": [api.data.postIds],
                                            "remark": api.data.remark,
                                            "sex": api.data.sex,
                                            "status": api.data.status,
                                            // "supervisor": api.data.supervisor,
                                            "username": api.data.username,
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
                                    "type": "input-text",
                                    "name": "username",
                                    "label": "用户账号",
                                    "required": true,
                                    "showCounter": true,
                                    "validations": {
                                        "minLength": 4,
                                        "maxLength": 30,
                                        "matchRegexp": "/^[a-zA-Z0-9]+$/"
                                    },
                                    "validationErrors": {
                                        "matchRegexp": "用户账号由字母、数字组成",
                                        "maxLength": "用户账号长度为 4-30个字符",
                                        "minLength": "用户账号长度为 4-30个字符",
                                    },
                                    "validateOnChange": true,
                                },
                                {
                                    "type": "input-password",
                                    "name": "password",
                                    "label": "用户密码",
                                    "required": true,
                                    "showCounter": true,
                                    "validateOnChange": true,
                                    "validations": {
                                        "minLength": 4,
                                        "maxLength": 16,
                                    },
                                    "validationErrors": {
                                        "maxLength": "密码长度为 4-16 位",
                                        "minLength": "密码长度为 4-16 位",
                                    },
                                },
                                {
                                    "type": "select",
                                    "name": "sex",
                                    "label": "用户性别",
                                    "placeholder": "请选择用户性别",
                                    "source": {
                                        "method": "get",
                                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=system_user_sex&status=0"),
                                        adaptor: function (payload: any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, options: payload.data }
                                            };
                                        },
                                    },
                                },
                                {
                                    "type": "input-text",
                                    "name": "nickname",
                                    "label": "用户昵称",
                                    "required": true,
                                    "showCounter": true,
                                    "maxLength": 30,
                                },
                                {
                                    "type": "input-email",
                                    "name": "email",
                                    "label": "用户邮箱",
                                    "required": true,
                                    "placeholder": "请输入用户邮箱",
                                    "validateOnChange": true,
                                    "validations": {
                                        "isEmail": true
                                    },
                                },
                                {
                                    "type": "input-text",
                                    "name": "mobile",
                                    "label": "手机号码",
                                    "maxLength": 11,
                                    "required": true,
                                    "placeholder": "请输入手机号码",
                                    "validations": {
                                        "isNumeric": true
                                    },
                                    "validationErrors": {
                                        "isNumeric": "请输入正确的手机号码"
                                    },
                                    "validateOnChange": true,
                                },
                                {
                                    "type": "tree-select",
                                    "name": "deptId",
                                    "label": "部门",
                                    "required": true,
                                    "searchable": true,
                                    "labelField": "name",
                                    "valueField": "id",
                                    "source": {
                                        "url": useDevBaseUrl("/application/system/dept/getDeptList"),
                                        "method": "get",
                                        adaptor: function (payload:any) {
                                            let dept = handleTree(payload.data)
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
                                    "type": 'select',
                                    "name": 'postIds',
                                    "label": '岗位',
                                    "placeholder": '请选择',
                                    "clearable": true,
                                    "required": true,
                                    "labelField": "name",
                                    "valueField": "id",
                                    "source": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/application/system/post/simple-list"),
                                        adaptor: function (payload: any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, options: payload.data }
                                            };
                                        },
                                    },
                                },
                                {
                                    "type": 'select',
                                    "name": 'status',
                                    "label": '是否封禁',
                                    "placeholder": '请选择',
                                    "clearable": true,
                                    "required": true,
                                    "source": {
                                        "method": "get",
                                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=is_ban&status=0"),
                                        adaptor: function (payload: any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, options: payload.data }
                                            };
                                        },
                                    },
                                },
                                // {
                                //     "type": 'select',
                                //     "name": 'supervisor',
                                //     "label": '直属主管',
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
                                // },
                                {
                                    "type": "input-text",
                                    "name": "remark",
                                    "label": "备注",
                                    "placeholder": "请输入备注",
                                }
                            ]
                        }
                    }
                },
                {
                    "label": "导入",
                    "type": "button",
                    "icon": "fa fa-upload",
                    "actionType": "dialog",
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:import')}",
                    "level": "warning",
                    "dialog": {
                        "title": "用户导入",
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl('/application/system/user/import?updateSupport=${updateSupport}'),
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
                                                                "url": useDevBaseUrl("/application/system/user/get-import-template"),
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
                                    "label": "是否更新已经存在的用户数据",
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
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:export')}",
                    "confirmText": "是否确认导出数据项？",
                    "api": {
                        "url": useDevBaseUrl("/application/system/user/export"),
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
                    "name": "id",
                    "label": "用户编号",
                },
                {
                    "name": "username",
                    "label": "用户账号",
                    "searchable": {
                        "type": "input-text",
                        "name": "username",
                        "label": "用户账号",
                        "clearable": true,
                        "placeholder": "请输入用户账号",
                        "size": "sm",
                    }
                },
                {
                    "name": "nickname",
                    "label": "用户昵称",
                },
                {
                    "name": "deptName",
                    "label": "部门",
                },
                {
                    "name": "postName",
                    "label": "岗位",
                },
                {
                    "name": "status",
                    "label": "是否封禁",
                    "type": 'mapping',
                    "map": {
                        '0': "<span>否</span>",
                        '1': "<span>是</span>",
                    },
                    "searchable": {
                        "type": 'select',
                        "name": 'status',
                        "label": '是否封禁',
                        "placeholder": '请选择',
                        "clearable": true,
                        "size": 'sm',
                        "source": {
                            "method": "get",
                            "url": useAdminBaseUrl("/system/dict-data/list?dictType=is_ban&status=0"),
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: { ...payload.data, options: payload.data }
                                };
                            },
                        },
                    },
                    "quickEdit": {
                        "mode": "inline",
                        "type": "switch",
                        "saveImmediately": true,
                        "resetOnFailed": true
                        // "onEvent": {
                        //     "change": {
                        //         "weight": 0,
                        //         "actions": [
                        //             {
                        //                 "actionType": "confirmDialog",
                        //                 "dialog": {
                        //                     "type": "dialog",
                        //                     "title": "提示",
                        //                     "body": [
                        //                         {
                        //                             "type": "tpl",
                        //                             "tpl": "确认要${status ==1 ? '停用' : '启用'} ${username}用户吗？",
                        //                             "wrapperComponent": "",
                        //                             "inline": false,
                        //                         }
                        //                     ],
                        //                     "showCloseButton": true,
                        //                     "showErrorMsg": true,
                        //                     "showLoading": true,
                        //                     "className": "app-popover",
                        //                     "onEvent": {
                        //                         "confirm": {
                        //                             "actions": [
                        //                                 {
                        //                                     "actionType": "custom",
                        //                                     "script": async function(e: any, doAction: any) {
                        //                                         const params = {
                        //                                             id: e.props.data.__rendererData.id,
                        //                                             status: e.props.data.status == true ? 1 : 0
                        //                                         }
                        //                                         await updateStatus(params)
                        //                                         doAction({ actionType: "reload", componentId: "user_manage" })
                        //                                     }
                        //                                 }
                        //                             ]
                        //                         },
                        //                     }
                        //                 }
                        //             },

                        //         ]
                        //     }
                        // },
                    }
                },
                {
                    "name": "registerStatus",
                    "label": "审批状态",
                    "type": 'mapping',
                    "map": {
                        '0': "<span>通过</span>",
                        '1': "<span>未通过</span>",
                    },
                    "searchable": {
                        "type": 'select',
                        "name": 'registerStatus',
                        "label": '审批状态',
                        "placeholder": '请选择',
                        "clearable": true,
                        "size": 'sm',
                        "source": {
                            "method": "get",
                            "url": useAdminBaseUrl("/system/dict-data/list?dictType=approval_status&status=0"),
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: { ...payload.data, options: payload.data }
                                };
                            },
                        },
                    }
                },
                {
                    "name": "loginDate",
                    "label": "最后登录时间",
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
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:update')}",
                            "dialog": {
                                "title": "编辑",
                                "data": {
                                    id: "${id}",
                                    username: "${username}"
                                },
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "put",
                                        "url": useDevBaseUrl('/application/system/user/update'),
                                        requestAdaptor: function (api:any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "id": api.data.__super.__super.id,
                                                    "username": api.data.__super.__super.username,
                                                    "deptId": api.data.deptId,
                                                    "email": api.data.email,
                                                    "mobile": api.data.mobile,
                                                    "nickname": api.data.nickname,
                                                    "postIds": Array.isArray(api.data.postIds) ? api.data.postIds : [api.data.postIds],
                                                    "remark": api.data.remark,
                                                    "sex": api.data.sexEdit== ' ' ? 0 : api.data.sexEdit,
                                                    "status": api.data.status,
                                                    // "supervisor": api.data.supervisor,
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
                                    "initApi": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/application/system/user/get?id=${id}"),
                                        adaptor: function (payload:any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, sex: (payload?.data?.sex == 0 || payload?.data?.sex == null) ? ' ' : payload?.data?.sex }
                                            };
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "select",
                                            "name": "sexEdit",
                                            "label": "用户性别",
                                            "placeholder": "请选择用户性别",
                                            "value": "${sex==0 ? ' ' : sex}",
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=system_user_sex&status=0"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "nickname",
                                            "label": "用户昵称",
                                            "required": true,
                                            "showCounter": true,
                                            "maxLength": 30,
                                        },
                                        {
                                            "type": "input-email",
                                            "name": "email",
                                            "label": "用户邮箱",
                                            "required": true,
                                            "placeholder": "请输入用户邮箱",
                                            "validateOnChange": true,
                                            "validations": {
                                                "isEmail": true
                                            },
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "mobile",
                                            "label": "手机号码",
                                            "maxLength": 11,
                                            "required": true,
                                            "placeholder": "请输入手机号码",
                                            "validations": {
                                                "isNumeric": true
                                            },
                                            "validationErrors": {
                                                "isNumeric": "请输入正确的手机号码"
                                            },
                                            "validateOnChange": true,
                                        },
                                        {
                                            "type": "tree-select",
                                            "name": "deptId",
                                            "label": "部门",
                                            "required": true,
                                            "searchable": true,
                                            "labelField": "name",
                                            "valueField": "id",
                                            "source": {
                                                "url": useDevBaseUrl("/application/system/dept/getDeptList"),
                                                "method": "get",
                                                adaptor: function (payload:any) {
                                                    let dept = handleTree(payload.data)
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
                                            "type": 'select',
                                            "name": 'postIds',
                                            "label": '岗位',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "required": true,
                                            "labelField": "name",
                                            "valueField": "id",
                                            "source": {
                                                "method": "get",
                                                "url": useDevBaseUrl("/application/system/post/simple-list"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                        },
                                        {
                                            "type": 'select',
                                            "name": 'status',
                                            "label": '是否封禁',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "required": true,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=is_ban&status=0"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                        },
                                        // {
                                        //     "type": 'select',
                                        //     "name": 'supervisor',
                                        //     "label": '直属主管',
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
                                        // },
                                        {
                                            "type": "input-text",
                                            "name": "remark",
                                            "label": "备注",
                                            "placeholder": "请输入备注",
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
                                "data": {
                                    id: "${id}"
                                },
                                "body": {
                                    "type": "form",
                                    "initApi": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/application/system/user/get?id=${id}"),
                                        adaptor: function (payload:any) {
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, sex: (payload?.data?.sex == 0 || payload?.data?.sex == null) ? ' ' : payload.data.sex, email: payload?.data?.email == '' ? ' ' : payload?.data?.email }
                                            };
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "input-text",
                                            "name": "username",
                                            "label": "用户账号",
                                            "showCounter": true,
                                            "static": true,
                                        },
                                        {
                                            "type": "select",
                                            "name": "sex",
                                            "label": "用户性别",
                                            "static": true,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=system_user_sex&status=0"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "nickname",
                                            "label": "用户昵称",
                                            "showCounter": true,
                                            "static": true,
                                            "maxLength": 30,
                                        },
                                        {
                                            "type": "input-email",
                                            "name": "email",
                                            "label": "用户邮箱",
                                            "validateOnChange": true,
                                            "static": true,
                                            "validations": {
                                                "isEmail": true
                                            },
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "mobile",
                                            "label": "手机号码",
                                            "maxLength": 11,
                                            "static": true,
                                            "placeholder": "请输入手机号码",
                                            "validations": {
                                                "isNumeric": true
                                            },
                                            "validationErrors": {
                                                "isNumeric": "请输入正确的手机号码"
                                            },
                                            "validateOnChange": true,
                                        },
                                        {
                                            "type": "tree-select",
                                            "name": "deptId",
                                            "label": "部门",
                                            "static": true,
                                            "searchable": true,
                                            "labelField": "name",
                                            "valueField": "id",
                                            "source": {
                                                "url": useDevBaseUrl("/application/system/dept/getDeptList"),
                                                "method": "get",
                                                adaptor: function (payload:any) {
                                                    let dept = handleTree(payload.data)
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
                                            "type": 'select',
                                            "name": 'postIds',
                                            "label": '岗位',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "static": true,
                                            "labelField": "name",
                                            "valueField": "id",
                                            "source": {
                                                "method": "get",
                                                "url": useDevBaseUrl("/application/system/post/simple-list"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                        },
                                        {
                                            "type": 'select',
                                            "name": 'status',
                                            "label": '是否封禁',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "static": true,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=is_ban&status=0"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                        },
                                        {
                                            "type": "select",
                                            "name": "registerStatus",
                                            "label": "审批状态",
                                            "static": true,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=approval_status&status=0"),
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
                        {
                            "label": "删除",
                            "type": "button",
                            "actionType": "ajax",
                            "level": "link",
                            "confirmText": "确认要删除${username}吗？",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:delete')}",
                            "api": {
                                "url": useDevBaseUrl("/application/system/user/delete?id=${id}"),
                                "method": "delete"
                            },
                        },
                        {
                            "label": "重置密码",
                            "type": "button",
                            "actionType": "dialog",
                            "level": "link",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:update-password')}",
                            "dialog": {
                                "title": "重置密码",
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "put",
                                        "url": useDevBaseUrl('/application/system/user/update-password'),
                                        requestAdaptor: function (api:any) {
                                            return {
                                                ...api,
                                                data: {
                                                    "id": api.data.__super.__super.id,
                                                    "password": api.data.password,
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
                                            "type": "alert",
                                            "body": "请输入${username}的新密码",
                                            "level": "warning",
                                            "showIcon": true,
                                            "className": "mb-1"
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "password",
                                            "label": "密码",
                                            "required": true,
                                            "minLength": 4,
                                            "maxLength": 16,
                                        },
                                    ]
                                }
                            }
                        },
                        {
                            "label": "分配应用角色",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:update')}",
                            "dialog": {
                                "title": "分配应用角色",
                                "data": {
                                    id: "${id}"
                                },
                                "size": "lg",
                                "body": [
                                    {
                                    "type": "form",
                                    "initApi": {
                                        "method": "get",
                                        "url": useDevBaseUrl('/application/system/user/getRoleOptionsByType?sourceType=app&userId=${id}'),
                                        adaptor: function (payload: any) {
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, roleOptionS: payload?.data?.roleOptions, userRoleIds: payload?.data?.userRoleIds}
                                        };
                                        }
                                    },
                                    "api": {
                                        "method": "post",
                                        "url": useDevBaseUrl('/application/system/user/assignRolesByType'),
                                        requestAdaptor: function (api:any) {
                                        let roleS = [];
                                        if(api.data.roleS == ''){
                                            roleS = [];
                                        } else {
                                            roleS = Array.isArray(api.data.roleS) ? api.data.roleS : api.data.roleS.split(',');
                                        }

                                        let userId = api.data.__super.__super.id;
                                        return {
                                            ...api,
                                            data: {
                                                "sourceType": 'app',
                                                "userId": userId,
                                                "roleIds": roleS,
                                            }
                                        };
                                        },
                                        adaptor: async function (payload: any) {
                                        return {
                                            ...payload,
                                            status: payload.code
                                        };
                                        }
                                    },
                                    "body": [
                                        {
                                        "type": "transfer",
                                        "name": "roleS",
                                        "label": "角色名称",
                                        "source": "${roleOptionS}",
                                        "labelField": "name",
                                        "valueField": "id",
                                        "value": "${userRoleIds}",
                                        }
                                    ]
                                    }
                                ],
                            },
                        },
                        {
                            "label": "审批通过",
                            "type": "button",
                            "actionType": "ajax",
                            "level": "link",
                            "confirmText": "确定将用户是${username}的账号审批通过? ",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:user:approve') && registerStatus == 1}",
                            "api": {
                                "url": useDevBaseUrl("/application/system/user/approveRegister"),
                                "data": {
                                    "userId": "${id}",
                                    "successSign": true,
                                },
                                "method": "put"
                            },
                        },
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }
    ]
}

export default () => <AMISComponent schema={schema} />;
