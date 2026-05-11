import { useDevBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
const schema ={
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/processManage/category/page"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "categoryName": "${categoryName}",
                    "code": "${code}",
                },
                adaptor: function (payload:any) {
                    return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload?.data, items: payload?.data?.list }
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
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:category:create')}",
                    "actionType": "dialog",
                    "level": "primary",
                    "dialog": {
                        "title": "添加流程分类",
                        "data": {},
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl("/processManage/category/create"),
                                "data": {
                                    "categoryName": "${categoryName}",
                                    "code": "${code}",
                                    "remark": "${remark}",
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
                                    "name": "categoryName",
                                    "label": "分类名称",
                                    "required": true,
                                    "showCounter": true,
                                    "maxLength": 20,
                                },
                                {
                                    "type": "input-text",
                                    "name": "code",
                                    "label": "分类编码",
                                    "required": true,
                                    "showCounter": true,
                                    "maxLength": 20,
                                },
                                {
                                    "type": "textarea",
                                    "name": "remark",
                                    "label": "备注",
                                    "showCounter": true,
                                    "maxLength": 50,
                                }
                            ]
                        }
                    }
                },
            ],
            // "filter": {
            //     "title": "",
            //     "body": [
            //         {
            //             "type": "group",
            //             "body": [
            //                 {
            //                     "type": "input-text",
            //                     "name": "categoryName",
            //                     "label": "分类名称",
            //                     "clearable": true,
            //                     "placeholder": "请输入分类名称",
            //                     "size": "sm"
            //                 },
            //                 {
            //                     "type": "input-text",
            //                     "name": "code",
            //                     "label": "分类编码",
            //                     "clearable": true,
            //                     "placeholder": "请输入分类编码",
            //                     "size": "sm"
            //                 },
            //             ]
            //         }
            //     ],
            //     "actions": [
            //         {
            //             "type": "reset",
            //             "label": "重置"
            //         },
            //         {
            //             "type": "submit",
            //             "level": "primary",
            //             "label": "查询"
            //         }
            //     ]
            // },
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
                    "label": "分类编号",
                },
                {
                    "name": "categoryName",
                    "label": "分类名称",
                    "searchable": {
                        "type": "input-text",
                        "name": "categoryName",
                        "label": "分类名称",
                        "clearable": true,
                        "placeholder": "请输入分类名称",
                        "size": "sm"
                    }
                },
                {
                    "name": "code",
                    "label": "分类编码",
                    "searchable": {
                        "type": "input-text",
                        "name": "code",
                        "label": "分类编码",
                        "clearable": true,
                        "placeholder": "请输入分类编码",
                        "size": "sm"
                    }
                },
                {
                    "name": "remark",
                    "label": "备注",
                }, {
                    "type": "operation",
                    "label": "操作",
                    "buttons": [
                        {
                            "label": "修改",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:category:update')}",
                            "dialog": {
                                "title": "修改流程分类",
                                "data": {
                                    categoryName: "${categoryName}",
                                    code: "${code}",
                                    remark: "${remark}",
                                    id: "${id}"
                                },
                                "body": {
                                    "type": "form",
                                    "api": {
                                        "method": "put",
                                        "url": useDevBaseUrl("/processManage/category/update"),
                                        "data": {
                                            "categoryName": "${categoryName}",
                                            "code": "${code}",
                                            "remark": "${remark}",
                                            "id": "${id}",
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
                                            "name": "categoryName",
                                            "label": "分类名称",
                                            "required": true,
                                            "showCounter": true,
                                            "maxLength": 20,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "code",
                                            "label": "分类编码",
                                            "required": true,
                                            "showCounter": true,
                                            "maxLength": 20,
                                        },
                                        {
                                            "type": "textarea",
                                            "name": "remark",
                                            "label": "备注",
                                            "showCounter": true,
                                            "maxLength": 50,
                                        }
                                    ]
                                }
                            }
                        }, {
                            "label": "删除",
                            "type": "button",
                            "actionType": "ajax",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'processManage:category:delete')}",
                            "level": "link",
                            "confirmText": "确认要删除${categoryName}吗？",
                            "api": {
                                "url": useDevBaseUrl("/processManage/category/delete?id=${id}"),
                                "method": "delete"
                            },
                        }
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }]
}

export default () => <AMISComponent schema={schema} />;
