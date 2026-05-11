import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import { Encrypt, Decrypt } from '@/utils/cryptojs'
const schema ={
    "type": "page",
    "body": [
        {
            "type": "crud",
            "syncLocation": false,
            "autoFillHeight": true,
            "api": {
                "method": "get",
                "url": useDevBaseUrl("/app/file-config/page"),
                "data": {
                    "pageNo": "${page}",
                    "pageSize": "${perPage}",
                    "name": "${name}",
                    "code": "${code}",
                    "storage": "${storage}"
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
                    "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:file-config:create')}",
                    "actionType": "dialog",
                    "level": "primary",
                    "dialog": {
                        "title": "新增",
                        "data": {},
                        "body": {
                            "type": "form",
                            "api": {
                                "method": "post",
                                "url": useDevBaseUrl("/app/file-config/create"),
                                requestAdaptor: function (api:any) {
                                    let base = api.data.base;
                                    let name = api.data.name;
                                    let code = api.data.code;
                                    let remark = api.data.remark;
                                    let storage = api.data.storage;
                                    let devConfig = base == 0 ? '' : Encrypt(JSON.stringify({
                                        "accessKey": api.data.devAccessKey,
                                        "accessSecret": api.data.devAccessSecret,
                                        "domain": api.data.devDomain,
                                        "endpoint": api.data.devEndpoint,
                                        "bucket": api.data.devBucket,
                                    }))
                                    let testConfig = base == 0 ? '' : Encrypt(JSON.stringify({
                                        "accessKey": api.data.testAccessKey,
                                        "accessSecret": api.data.testAccessSecret,
                                        "domain": api.data.testDomain,
                                        "endpoint": api.data.testEndpoint,
                                        "bucket": api.data.testBucket,
                                    }))
                                    let prodConfig = base == 0 ? '' : Encrypt(JSON.stringify({
                                        "accessKey": api.data.prodAccessKey,
                                        "accessSecret": api.data.prodAccessSecret,
                                        "domain": api.data.prodDomain,
                                        "endpoint": api.data.prodEndpoint,
                                        "bucket": api.data.prodBucket,
                                    }))

                                    return {
                                        ...api,
                                        data: {
                                            "name": name,
                                            "code": code,
                                            "base": base,
                                            "remark": remark,
                                            "storage": storage,
                                            "devConfigText": devConfig,
                                            "testConfigText": testConfig,
                                            "prodConfigText": prodConfig,
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
                                    "name": "name",
                                    "label": "配置名",
                                    "required": true,
                                    "showCounter": true,
                                    "maxLength": 60,
                                },
                                {
                                    "type": "input-text",
                                    "name": "code",
                                    "label": "配置编码",
                                    "required": true,
                                    "showCounter": true,
                                    "maxLength": 40,
                                    "validations": {
                                        "matchRegexp": "^[^-][a-z,0-9,-]*[^-]$"
                                    },
                                    "validationErrors": {
                                        "matchRegexp": "请填写规范的编码"
                                    },
                                    "desc": "${IFS(base == '0' ,'不可修改，请仔细填写，只能使用英文小写、数字和中划线且不能以中横线开头和结尾')}${IFS(base == '1' ,'不可修改，请仔细填写，只能使用英文小写、数字和中划线且不能以中横线开头和结尾；改名称为桶名，需要确保在对象存储中存在，并且和自定义域名对应')} ",
                                },
                                {
                                    "type": "input-text",
                                    "name": "remark",
                                    "label": "备注",
                                    "showCounter": true,
                                    "maxLength": 200,
                                },
                                {
                                    "type": 'select',
                                    "name": 'storage',
                                    "label": '存储器',
                                    "placeholder": '请选择',
                                    "clearable": true,
                                    "required": true,
                                    "source": {
                                        "method": "get",
                                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=app_file_storage"),
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
                                    "name": "base",
                                    "mode": "horizontal",
                                    "label": "文件配置来源",
                                    "type": "list-select",
                                    "value": 0,
                                    "required": true,
                                    "source": {
                                        "method": "get",
                                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=app_config_storage_source"),
                                        adaptor: function (payload: any) {
                                            payload.data.map(item => { return { ...payload.data, value: Number(item.value) } })
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, options: payload.data }
                                            };
                                        },
                                    },
                                },
                                {
                                    "type": "tabs",
                                    "visibleOn": "${base==1}",
                                    "tabs": [
                                        {
                                            "title": "开发环境",
                                            "tab": [{
                                                type: "page",
                                                body: [{
                                                    "type": "input-text",
                                                    "name": "devEndpoint",
                                                    "label": "节点地址",
                                                    "required": true,
                                                    // "onEvent": {
                                                    //     "change": {
                                                    //         "actions": [
                                                    //             {
                                                    //                 "actionType": "setValue",
                                                    //                 "componentId": "devDomain",
                                                    //                 "args": {
                                                    //                     "value": "${devEndpoint}"
                                                    //                 }
                                                    //             }
                                                    //         ]
                                                    //     }
                                                    // }
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "devDomain",
                                                    "id": "devDomain",
                                                    "label": "自定义域名",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "devBucket",
                                                    "id": "devBucket",
                                                    "label": "存储 bucket",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "devAccessKey",
                                                    "label": "accessKey",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-password",
                                                    "name": "devAccessSecret",
                                                    "label": "accessSecret",
                                                    "required": true,
                                                }]
                                            }]
                                        },
                                        {
                                            "title": "测试环境",
                                            "tab": [{
                                                type: "page",
                                                body: [{
                                                    "type": "input-text",
                                                    "name": "testEndpoint",
                                                    "label": "节点地址",
                                                    "required": true,
                                                    // "onEvent": {
                                                    //     "change": {
                                                    //         "actions": [
                                                    //             {
                                                    //                 "actionType": "setValue",
                                                    //                 "componentId": "testDomain",
                                                    //                 "args": {
                                                    //                     "value": "${testEndpoint}"
                                                    //                 }
                                                    //             }
                                                    //         ]
                                                    //     }
                                                    // }
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "testDomain",
                                                    "id": "testDomain",
                                                    "label": "自定义域名",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "testBucket",
                                                    "id": "testBucket",
                                                    "label": "存储 bucket",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "testAccessKey",
                                                    "label": "accessKey",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-password",
                                                    "name": "testAccessSecret",
                                                    "label": "accessSecret",
                                                    "required": true,
                                                }]
                                            }]
                                        },
                                        {
                                            "title": "正式环境",
                                            "tab": [{
                                                type: "page",
                                                body: [{
                                                    "type": "input-text",
                                                    "name": "prodEndpoint",
                                                    "label": "节点地址",
                                                    "required": true,
                                                    // "onEvent": {
                                                    //     "change": {
                                                    //         "actions": [
                                                    //             {
                                                    //                 "actionType": "setValue",
                                                    //                 "componentId": "prodDomain",
                                                    //                 "args": {
                                                    //                     "value": "${prodEndpoint}"
                                                    //                 }
                                                    //             }
                                                    //         ]
                                                    //     }
                                                    // }
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "prodDomain",
                                                    "id": "prodDomain",
                                                    "label": "自定义域名",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "prodBucket",
                                                    "id": "prodBucket",
                                                    "label": "存储 bucket",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-text",
                                                    "name": "prodAccessKey",
                                                    "label": "accessKey",
                                                    "required": true,
                                                },
                                                {
                                                    "type": "input-password",
                                                    "name": "prodAccessSecret",
                                                    "label": "accessSecret",
                                                    "required": true,
                                                }]
                                            }]
                                        }
                                    ]  
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
                    "label": "配置编号",
                },
                {
                    "name": "name",
                    "label": "配置名",
                    "searchable": {
                        "type": "input-text",
                        "name": "name",
                        "label": "配置名",
                        "clearable": true,
                        "placeholder": "请输入配置名",
                        "size": "sm",
                    }
                },
                {
                    "name": "code",
                    "label": "配置编码",
                    "searchable": {
                        "type": "input-text",
                        "name": "code",
                        "label": "配置编码",
                        "clearable": true,
                        "placeholder": "请输入配置编码",
                        "size": "sm",
                    }
                },
                {
                    "name": "storage",
                    "label": "存储器",
                    "searchable": {
                        "type": "select",
                        "name": "storage",
                        "label": "存储器",
                        "clearable": true,
                        "placeholder": "请选择存储器",
                        "size": "sm",
                        "source": {
                            "method": "get",
                            "url": useAdminBaseUrl("/system/dict-data/list?dictType=app_file_storage"),
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: { ...payload.data, options: payload.data }
                                };
                            },
                        },
                    },
                    "type": 'mapping',
                    "map": {
                        '1': "<span class='label label-info'>S3 对象存储</span>",
                    }
                },{
                    "name": "base",
                    "label": "文件配置来源",
                    "type": 'mapping',
                    "map": {
                        '0': "<span class='label label-info'>内置</span>",
                        '1': "<span class='label label-default'>外置</span>",
                    }
                },
                {
                    "name": "remark",
                    "label": "备注",
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
                            "label": "编辑",
                            "type": "button",
                            "level": "link",
                            "actionType": "dialog", 
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:file-config:update')}",
                            "dialog": {
                                "title": "编辑",
                                "data": {
                                    queryKey: "${queryKey}",
                                    id: "${id}"
                                },
                                "body": {
                                    "type": "form",
                                    "initApi": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/app/file-config/get?queryKey=${queryKey}"),
                                        adaptor: function (payload:any) {
                                            let prodEndpoint = '';
                                            let prodDomain = '';
                                            let prodAccessKey = '';
                                            let prodAccessSecret = '';
                                            let prodBucket = '';
                                            if(payload?.data?.prodConfig){
                                                prodAccessKey = JSON.parse(Decrypt(payload.data.prodConfig)).accessKey
                                                prodAccessSecret = JSON.parse(Decrypt(payload.data.prodConfig)).accessSecret
                                                prodDomain = JSON.parse(Decrypt(payload.data.prodConfig)).domain
                                                prodEndpoint = JSON.parse(Decrypt(payload.data.prodConfig)).endpoint
                                                prodBucket = JSON.parse(Decrypt(payload.data.prodConfig)).bucket
                                            }
                                            let testEndpoint = ''
                                            let testDomain = ''
                                            let testAccessKey = ''
                                            let testAccessSecret = ''
                                            let testBucket = ''
                                            if(payload?.data?.testConfig){
                                                testAccessKey = JSON.parse(Decrypt(payload.data.testConfig)).accessKey
                                                testAccessSecret = JSON.parse(Decrypt(payload.data.testConfig)).accessSecret
                                                testDomain = JSON.parse(Decrypt(payload.data.testConfig)).domain
                                                testEndpoint = JSON.parse(Decrypt(payload.data.testConfig)).endpoint
                                                testBucket = JSON.parse(Decrypt(payload.data.testConfig)).bucket
                                            }
                                            let devAccessKey = ''
                                            let devAccessSecret = ''
                                            let devDomain = ''
                                            let devEndpoint = ''
                                            let devBucket = ''
                                            if(payload?.data?.devConfig){
                                                devAccessKey =JSON.parse(Decrypt(payload.data.devConfig)).accessKey
                                                devAccessSecret = JSON.parse(Decrypt(payload.data.devConfig)).accessSecret
                                                devDomain = JSON.parse(Decrypt(payload.data.devConfig)).domain
                                                devEndpoint = JSON.parse(Decrypt(payload.data.devConfig)).endpoint
                                                devBucket = JSON.parse(Decrypt(payload.data.devConfig)).bucket
                                            }
                                            let base = payload?.data?.base;
                                            let name = payload?.data?.name;
                                            let code = payload?.data?.code;
                                            let remark = payload?.data?.remark;
                                            let storage = payload?.data?.storage;
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                
                                                data: {'devAccessKey': devAccessKey, 'devAccessSecret': devAccessSecret, 'devDomain': devDomain,  'devEndpoint': devEndpoint, 'devBucket': devBucket,
                                                    'testAccessKey': testAccessKey, 'testAccessSecret': testAccessSecret, 'testDomain': testDomain, 'testEndpoint': testEndpoint, 'testBucket': testBucket,
                                                    'prodAccessKey': prodAccessKey, 'prodAccessSecret': prodAccessSecret, 'prodDomain': prodDomain, 'prodEndpoint': prodEndpoint, 'prodBucket': prodBucket,
                                                    "base": base, "name": name, "code": code, "remark": remark, "storage": storage
                                                }
                                            };
                                        }
                                    },
                                    "api": {
                                        "method": "put",
                                        "url": useDevBaseUrl("/app/file-config/update"),
                                        requestAdaptor: function (api:any, context:any) {
                                            let queryKey = api.data.queryKey;
                                            let id = api.data.id;
                                            let base = api.data.base;
                                            let name = api.data.name;
                                            let code = api.data.code;
                                            let remark = api.data.remark;
                                            let storage = api.data.storage;
                                            let devConfig = base == 0 ? '' : Encrypt(JSON.stringify({
                                                "accessKey": api.data.devAccessKey,
                                                "accessSecret": api.data.editDevAccessSecret ? api.data.editDevAccessSecret : context.devAccessSecret,
                                                "domain": api.data.devDomain,
                                                "endpoint": api.data.devEndpoint,
                                                "bucket":  api.data.devBucket,
                                            }))
                                            let testConfig = base == 0 ? '' : Encrypt(JSON.stringify({
                                                "accessKey": api.data.testAccessKey,
                                                "accessSecret": api.data.editTestAccessSecret ? api.data.editTestAccessSecret : context.testAccessSecret,
                                                "domain": api.data.testDomain,
                                                "endpoint": api.data.testEndpoint,
                                                "bucket":  api.data.testBucket,
                                            }))
                                            let prodConfig = base == 0 ? '' : Encrypt(JSON.stringify({
                                                "accessKey": api.data.prodAccessKey,
                                                "accessSecret": api.data.editProdAccessSecret ? api.data.editProdAccessSecret : context.prodAccessSecret,
                                                "domain": api.data.prodDomain,
                                                "endpoint": api.data.prodEndpoint,
                                                "bucket":  api.data.prodBucket,
                                            }))
                                            return {
                                                ...api,
                                                data: {
                                                    "queryKey": queryKey,
                                                    "id": id,
                                                    "name": name,
                                                    "code": code,
                                                    "base": base,
                                                    "remark": remark,
                                                    "storage": storage,
                                                    "devConfigText": devConfig,
                                                    "testConfigText": testConfig,
                                                    "prodConfigText": prodConfig,
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
                                            "name": "name",
                                            "label": "配置名",
                                            "required": true,
                                            "showCounter": true,
                                            "maxLength": 60,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "code",
                                            "label": "配置编码",
                                            "required": true,
                                            "showCounter": true,
                                            "disabled": true,
                                            "maxLength": 40,
                                            "validations": {
                                                "matchRegexp": "^[^-][a-z,0-9,-]*[^-]$"
                                            },
                                            "validationErrors": {
                                                "matchRegexp": "请填写规范的编码"
                                            },
                                            "desc": "不可修改，请仔细填写，只能使用英文小写、数字和中划线且不能以中横线开头和结尾",
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "remark",
                                            "label": "备注",
                                            "showCounter": true,
                                            "maxLength": 200,
                                        },
                                        {
                                            "type": 'select',
                                            "name": 'storage',
                                            "label": '存储器',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "required": true,
                                            "disabled": true,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=app_file_storage"),
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
                                            "name": "base",
                                            "mode": "horizontal",
                                            "label": "文件配置来源",
                                            "type": "list-select",
                                            "value": 0,
                                            "required": true,
                                            "disabled": true,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=app_config_storage_source"),
                                                adaptor: function (payload: any) {
                                                    payload.data.map(item => { return { ...payload.data, value: Number(item.value) } })
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                        },
                                        {
                                            "type": "tabs",
                                            "visibleOn": "${base==1}",
                                            "tabs": [
                                                {
                                                    "title": "开发环境",
                                                    "tab": [{
                                                        type: "page",
                                                        body: [{
                                                            "type": "input-text",
                                                            "name": "devEndpoint",
                                                            "label": "节点地址",
                                                            "required": true,
                                                            // "onEvent": {
                                                            //     "change": {
                                                            //         "actions": [
                                                            //             {
                                                            //                 "actionType": "setValue",
                                                            //                 "componentId": "devDomain",
                                                            //                 "args": {
                                                            //                     "value": "${devEndpoint}"
                                                            //                 }
                                                            //             }
                                                            //         ]
                                                            //     }
                                                            // }
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "devDomain",
                                                            "id": "devDomain",
                                                            "label": "自定义域名",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "devBucket",
                                                            "id": "devBucket",
                                                            "label": "存储 bucket",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "devAccessKey",
                                                            "label": "accessKey",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-password",
                                                            "name": "editDevAccessSecret",
                                                            "label": "accessSecret",
                                                            // "required": true,
                                                            "revealPassword": false,
                                                            "description": "如需修改密码，请填写新密码，如不需修改密码，请保持空"
                                                        }]
                                                    }]
                                                },
                                                {
                                                    "title": "测试环境",
                                                    "tab": [{
                                                        type: "page",
                                                        body: [{
                                                            "type": "input-text",
                                                            "name": "testEndpoint",
                                                            "label": "节点地址",
                                                            "required": true,
                                                            // "onEvent": {
                                                            //     "change": {
                                                            //         "actions": [
                                                            //             {
                                                            //                 "actionType": "setValue",
                                                            //                 "componentId": "testDomain",
                                                            //                 "args": {
                                                            //                     "value": "${testEndpoint}"
                                                            //                 }
                                                            //             }
                                                            //         ]
                                                            //     }
                                                            // }
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "testDomain",
                                                            "id": "testDomain",
                                                            "label": "自定义域名",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "testBucket",
                                                            "id": "testBucket",
                                                            "label": "存储 bucket",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "testAccessKey",
                                                            "label": "accessKey",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-password",
                                                            "name": "editTestAccessSecret",
                                                            "label": "accessSecret",
                                                            // "required": true,
                                                            "revealPassword": false,
                                                            "description": "如需修改密码，请填写新密码，如不需修改密码，请保持空"
                                                        }]
                                                    }]
                                                },
                                                {
                                                    "title": "正式环境",
                                                    "tab": [{
                                                        type: "page",
                                                        body: [{
                                                            "type": "input-text",
                                                            "name": "prodEndpoint",
                                                            "label": "节点地址",
                                                            "required": true,
                                                            // "onEvent": {
                                                            //     "change": {
                                                            //         "actions": [
                                                            //             {
                                                            //                 "actionType": "setValue",
                                                            //                 "componentId": "prodDomain",
                                                            //                 "args": {
                                                            //                     "value": "${prodEndpoint}"
                                                            //                 }
                                                            //             }
                                                            //         ]
                                                            //     }
                                                            // }
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "prodDomain",
                                                            "id": "prodDomain",
                                                            "label": "自定义域名",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "prodBucket",
                                                            "id": "prodBucket",
                                                            "label": "存储 bucket",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "prodAccessKey",
                                                            "label": "accessKey",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type": "input-password",
                                                            "name": "editProdAccessSecret",
                                                            "label": "accessSecret",
                                                            // "required": true,
                                                            "revealPassword": false,
                                                            "description": "如需修改密码，请填写新密码，如不需修改密码，请保持空"
                                                        }]
                                                    }]
                                                }
                                            ]  
                                        },
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
                                    queryKey: "${queryKey}"
                                },
                                "body": {
                                    "type": "form",
                                    "initApi": {
                                        "method": "get",
                                        "url": useDevBaseUrl("/app/file-config/get?queryKey=${queryKey}"),
                                        adaptor: function (payload:any) {
                                            let prodEndpoint = '';
                                            let prodDomain = '';
                                            let prodAccessKey = '';
                                            let prodAccessSecret = '';
                                            let prodBucket = '';
                                            if(payload.data?.prodConfig){
                                                prodAccessKey = JSON.parse(Decrypt(payload.data.prodConfig)).accessKey
                                                prodAccessSecret = JSON.parse(Decrypt(payload.data.prodConfig)).accessSecret
                                                prodDomain = JSON.parse(Decrypt(payload.data.prodConfig)).domain
                                                prodEndpoint = JSON.parse(Decrypt(payload.data.prodConfig)).endpoint
                                                prodBucket = JSON.parse(Decrypt(payload.data.prodConfig)).bucket 
                                            }
                                            let testEndpoint = ''
                                            let testDomain = ''
                                            let testAccessKey = ''
                                            let testAccessSecret = ''
                                            let testBucket = ''
                                            if(payload.data?.testConfig){
                                                testAccessKey = JSON.parse(Decrypt(payload.data.testConfig)).accessKey
                                                testAccessSecret = JSON.parse(Decrypt(payload.data.testConfig)).accessSecret
                                                testDomain = JSON.parse(Decrypt(payload.data.testConfig)).domain
                                                testEndpoint = JSON.parse(Decrypt(payload.data.testConfig)).endpoint
                                                testBucket = JSON.parse(Decrypt(payload.data.prodConfig)).bucket 
                                            }
                                            let devAccessKey = ''
                                            let devAccessSecret = ''
                                            let devDomain = ''
                                            let devEndpoint = ''
                                            let devBucket = ''
                                            if(payload.data?.devConfig){
                                                devAccessKey =JSON.parse(Decrypt(payload.data.devConfig)).accessKey
                                                devAccessSecret = JSON.parse(Decrypt(payload.data.devConfig)).accessSecret
                                                devDomain = JSON.parse(Decrypt(payload.data.devConfig)).domain
                                                devEndpoint = JSON.parse(Decrypt(payload.data.devConfig)).endpoint
                                                devBucket = JSON.parse(Decrypt(payload.data.prodConfig)).bucket
                                            }
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, 
                                                    'devAccessKey': devAccessKey, 'devAccessSecret': devAccessSecret, 'devDomain': devDomain, 'devEndpoint': devEndpoint, 'devBucket': devBucket,
                                                    'testAccessKey': testAccessKey, 'testAccessSecret': testAccessSecret, 'testDomain': testDomain, 'testEndpoint': testEndpoint, 'testBucket': testBucket,
                                                    'prodAccessKey': prodAccessKey, 'prodAccessSecret': prodAccessSecret, 'prodDomain': prodDomain, 'prodEndpoint': prodEndpoint, 'prodBucket': prodBucket,
                                                }
                                            };
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "input-text",
                                            "name": "name",
                                            "label": "配置名",
                                            "showCounter": true,
                                            "maxLength": 60,
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "code",
                                            "label": "配置编码",
                                            "showCounter": true,
                                            "disabled": true,
                                            "maxLength": 40,
                                            "validations": {
                                                "matchRegexp": "^[^-][a-z,0-9,-]*[^-]$"
                                            },
                                            "validationErrors": {
                                                "matchRegexp": "请填写规范的编码"
                                            },
                                            // "desc": "不可修改，请仔细填写，只能使用英文小写、数字和中划线且不能以中横线开头和结尾",
                                            "static": true,
                                        },
                                        {
                                            "type": "input-text",
                                            "name": "remark",
                                            "label": "备注",
                                            "showCounter": true,
                                            "maxLength": 200,
                                            "static": true,
                                        },
                                        {
                                            "type": 'select',
                                            "name": 'storage',
                                            "label": '存储器',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=app_file_storage"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                            "static": true,
                                        },
                                        {
                                            "name": "base",
                                            "mode": "horizontal",
                                            "label": "文件配置来源",
                                            "type": "list-select",
                                            "value": 0,
                                            "source": {
                                                "method": "get",
                                                "url": useAdminBaseUrl("/system/dict-data/list?dictType=app_config_storage_source"),
                                                adaptor: function (payload: any) {
                                                    payload.data.map(item => { return { ...payload.data, value: Number(item.value) } })
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: { ...payload.data, options: payload.data }
                                                    };
                                                },
                                            },
                                            "static": true,
                                        },
                                        {
                                            "type": "tabs",
                                            "visibleOn": "${base==1}",
                                            "tabs": [
                                                {
                                                    "title": "开发环境",
                                                    "tab": [{
                                                        type: "page",
                                                        body: [{
                                                            "type": "input-text",
                                                            "name": "devEndpoint",
                                                            "label": "节点地址",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "devDomain",
                                                            "id": "devDomain",
                                                            "label": "自定义域名",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "devBucket",
                                                            "id": "devBucket",
                                                            "label": "存储 bucket",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "devAccessKey",
                                                            "label": "accessKey",
                                                            "static": true
                                                        },
                                                        // {
                                                        //     "type": "input-password",
                                                        //     "name": "devAccessSecret",
                                                        //     "label": "accessSecret",
                                                        //     "static": true
                                                        // }
                                                        ]
                                                    }]
                                                },
                                                {
                                                    "title": "测试环境",
                                                    "tab": [{
                                                        type: "page",
                                                        body: [{
                                                            "type": "input-text",
                                                            "name": "testEndpoint",
                                                            "label": "节点地址",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "testDomain",
                                                            "id": "testDomain",
                                                            "label": "自定义域名",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "testBucket",
                                                            "id": "testBucket",
                                                            "label": "存储 bucket",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "testAccessKey",
                                                            "label": "accessKey",
                                                            "static": true
                                                        },
                                                        // {
                                                        //     "type": "input-password",
                                                        //     "name": "testAccessSecret",
                                                        //     "label": "accessSecret",
                                                        //     "static": true
                                                        // }
                                                        ]
                                                    }]
                                                },
                                                {
                                                    "title": "正式环境",
                                                    "tab": [{
                                                        type: "page",
                                                        body: [{
                                                            "type": "input-text",
                                                            "name": "prodEndpoint",
                                                            "label": "节点地址",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "prodDomain",
                                                            "id": "prodDomain",
                                                            "label": "自定义域名",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "prodBucket",
                                                            "id": "prodBucket",
                                                            "label": "存储 bucket",
                                                            "static": true
                                                        },
                                                        {
                                                            "type": "input-text",
                                                            "name": "prodAccessKey",
                                                            "label": "accessKey",
                                                            "static": true
                                                        },
                                                        // {
                                                        //     "type": "input-password",
                                                        //     "name": "prodAccessSecret",
                                                        //     "label": "accessSecret",
                                                        //     "static": true
                                                        // }
                                                        ]
                                                    }]
                                                }
                                            ]  
                                        },
                                        // {
                                        //     "type": "input-text",
                                        //     "name": "endpoint",
                                        //     "label": "节点地址",
                                        //     "visibleOn": "this.base==1",
                                        //     "onEvent": {
                                        //         "change": {
                                        //             "actions": [
                                        //                 {
                                        //                     "actionType": "setValue",
                                        //                     "componentId": "domain",
                                        //                     "args": {
                                        //                         "value": "${endpoint}"
                                        //                     }
                                        //                 }
                                        //             ]
                                        //         }
                                        //     },
                                        //     "static": true,
                                        // },
                                        // {
                                        //     "type": "input-text",
                                        //     "name": "domain",
                                        //     "id": "domain",
                                        //     "label": "自定义域名",
                                        //     "visibleOn": "this.base==1",
                                        //     "static": true,
                                        // },
                                        // {
                                        //     "type": "input-text",
                                        //     "name": "accessKey",
                                        //     "label": "accessKey",
                                        //     "visibleOn": "this.base==1",
                                        //     "static": true,
                                        // },
                                        // {
                                        //     "type": "input-text",
                                        //     "name": "accessSecret",
                                        //     "label": "accessSecret",
                                        //     "visibleOn": "this.base==1",
                                        //     "static": true,
                                        // },
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
                            "label": "测试",
                            "type": "button",
                            "actionType": "ajax",
                            "level": "link",
                            "api": {
                                "url": useDevBaseUrl("/app/file-config/test?queryKey=${queryKey}"),
                                "method": "get",
                            },
                            "feedback": {
                                "title": "系统提示",
                                "className": 'word-break',
                                "body": "测试通过，上传文件成功！访问地址："+ "${url}"
                            }
                        },
                        {
                            "label": "删除",
                            "type": "button",
                            "actionType": "ajax",
                            "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:file-config:delete')}",
                            "level": "link",
                            "confirmText": "确认要删除${name}吗？",
                            "disabledOn": "this.code == 'default'",
                            "api": {
                                "url": useDevBaseUrl("/app/file-config/delete?queryKey=${queryKey}"),
                                "method": "delete"
                            },
                        }
                    ]
                }
            ],
            "placeholder": "暂无数据"
        }]
}

export default schema;