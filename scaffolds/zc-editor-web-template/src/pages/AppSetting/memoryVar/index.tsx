import {isAppEnd} from '@/utils/index'
import {useDevBaseUrl} from "@/utils/util"
import {getSchemaTpl} from 'amis-editor';
import {filterData} from '@/bpmn/panel/ElementTask/ServiceTask/getSchemaChange';
import {addRule} from 'amis'
import {advancedFeature} from '@/utils/env'
import {AMISComponent} from "@/hooks/amis";

let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/variable/page") : useDevBaseUrl("/app/variable/page")
let createApi = isAppEnd() ? useDevBaseUrl("/application/app/variable/create") : useDevBaseUrl("/app/variable/create")
let getUpdateApi = isAppEnd() ? useDevBaseUrl("/application/app/variable/get?id=${id}") : useDevBaseUrl("/app/variable/get?id=${id}")
let updateApi = isAppEnd() ? useDevBaseUrl("/application/app/variable/update") : useDevBaseUrl("/app/variable/update")
let deleteApi = isAppEnd() ? useDevBaseUrl("/application/app/variable/delete?id=${id}") : useDevBaseUrl("/app/variable/delete?id=${id}")
const schema = {
    type: "page",
    body: [{
        "type": "alert",
        "body": "内存变量是应用运行时临时产生的变量，用户可以通过变量赋值动作为其重新赋值，它的生命周期会随着应用的退出而结束。",
        "level": "info",
        "showIcon": true,
        "className": "mb-1"
    }, {
        "type": "crud",
        "autoFillHeight": true,
        "api": {
            "method": "get",
            "url": crudApi,
            adaptor: function (payload: any) {
                return {
                    ...payload,
                    status: payload.code,
                    data: {
                        ...payload.data, items: payload?.data?.list ? payload.data.list : []
                    }
                };
            },
        },
        "headerToolbar": [
            {
                "type": "columns-toggler",
                "align": "right",
                "draggable": true
            },
            {
                "type": "reload",
                "align": "right",
            },
            {
                "type": "button",
                "icon": "fa fa-plus",
                "align": "left",
                "label": "创建变量",
                "level": "primary",
                "actionType": "dialog",
                "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:variable:create')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:variable:create')}",
                "onEvent": {
                    "click": {
                        "actions": [
                            {
                                "actionType": "custom",
                                script: function (_, doAction, event) {
                                    addRule('isValChecked', (values, value) => {
                                        const type = values.type
                                        const isArray = values.isArray
                                        const defaultVal = values.default ? values.default : ''
                                        const regexStr = /^\[(?:"[^"]*"(?:\s*,\s*"[^"]*")*)\]$/
                                        const regexNumber = /^\[(?:\s*\d+(?:\.\d+)?\s*(?:,\s*\d+(?:\.\d+)?\s*)*)\]$/
                                        const regexInteger = /^\[(?:\s*\d+\s*(?:,\s*\d+\s*)*)\]$/
                                        const regexBoolean = /^\[(?:\s*(?:true|false)\s*(?:,\s*(?:true|false)\s*)*)\]$/;
                                        const regexObj = /^\s*(\{(?:\s*"[^"]*"\s*:\s*(?:"[^"]*"|\d+|true|false|null|\[.*?\]|\{.*?\})?\s*,?)+\}\s*)$/
                                        const regexArrObj = /^\[\s*(\{(?:\s*"[^"]*"\s*:\s*(?:"[^"]*"|\d+|true|false|null|\[.*?\]|\{.*?\})?\s*,?)+\}\s*)\]$/
                                        const regexNum = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/
                                        const regexInt = /^-?\d+$/
                                        if(defaultVal.indexOf('${') != -1){
                                            return true
                                        }
                                        if (isArray) {
                                            if (type == 'string') {
                                                if (!regexStr.test(defaultVal)) {
                                                    return {
                                                        error: true,
                                                        msg: '默认值数据类型不合法'
                                                    };
                                                }
                                            } else if (type == 'number') {
                                                if (!regexNumber.test(defaultVal)) {
                                                    return {
                                                        error: true,
                                                        msg: '默认值数据类型不合法'
                                                    };
                                                }
                                            } else if (type == 'integer') {
                                                if (!regexInteger.test(defaultVal)) {
                                                    return {
                                                        error: true,
                                                        msg: '默认值数据类型不合法'
                                                    };
                                                }
                                            } else if (type == 'boolean') {
                                                if (!regexBoolean.test(defaultVal)) {
                                                    return {
                                                        error: true,
                                                        msg: '默认值数据类型不合法'
                                                    };
                                                }
                                            } else if (type == 'object') {
                                                if (!regexArrObj.test(defaultVal)) {
                                                    return {
                                                        error: true,
                                                        msg: '默认值数据类型不合法'
                                                    };
                                                }
                                            }
                                        } else if (type == 'boolean') {
                                            if (defaultVal == '') {
                                                return {
                                                    error: true,
                                                    msg: '默认值数据类型不合法'
                                                };
                                            } else if (defaultVal != 'false' && defaultVal != 'true') {
                                                return {
                                                    error: true,
                                                    msg: '默认值数据类型不合法'
                                                };
                                            }
                                        } else if (type == 'object') {
                                            if (defaultVal == '') {
                                                return {
                                                    error: true,
                                                    msg: '默认值数据类型不合法'
                                                };
                                            } else if (!regexObj.test(defaultVal)) {
                                                return {
                                                    error: true,
                                                    msg: '默认值数据类型不合法'
                                                };
                                            }
                                        } else if (type == 'number') {
                                            if (!regexNum.test(defaultVal)) {
                                                return {
                                                    error: true,
                                                    msg: '默认值数据类型不合法'
                                                };
                                            }
                                        } else if (type == 'integer') {
                                            if (!regexInt.test(defaultVal)) {
                                                return {
                                                    error: true,
                                                    msg: '默认值数据类型不合法'
                                                };
                                            }
                                        }
                                        return true
                                    })
                                    addRule('isAddPropertiesChecked', (values, value) => {
                                        const type = values.type
                                        const properties = values?.properties?.properties ? values?.properties?.properties : {}
                                        if (type == 'object') {
                                            if (JSON.stringify(properties) == JSON.stringify({})) {
                                                return {
                                                    error: true,
                                                    msg: '这是必填项'
                                                };
                                            }
                                        }
                                        return true
                                    })
                                }
                            }
                        ]
                    }
                },
                "dialog": {
                    "title": "创建内存变量",
                    "size": "lg",
                    "data": {},
                    "body": {
                        "type": "form",
                        "api": {
                            "method": "post",
                            "url": createApi,
                            requestAdaptor: function (api: any) {
                                const name = api.data.name;
                                const description = api.data.description;
                                const type = api.data.type;
                                const defaultVal = api.data.default;
                                const isArray = api.data.isArray ? api.data.isArray : false;
                                const properties = api.data.properties
                                let schema = {}
                                //是否是数组，没有打开时
                                if (isArray == false) {
                                    schema = {
                                        type: type,
                                        title: name,
                                        description: description,
                                        default: defaultVal
                                    }
                                    if (properties) {
                                        Object.assign(schema, properties)
                                    }
                                } else {
                                    // 是否是数组，打开时
                                    if (properties) {
                                        schema = {
                                            type: "array",
                                            title: name,
                                            description: description,
                                            default: defaultVal,
                                            items: {...properties}
                                        }
                                    } else {
                                        schema = {
                                            type: "array",
                                            title: name,
                                            description: description,
                                            default: defaultVal,
                                            items: {type: type}
                                        }
                                    }
                                }
                                return {
                                    ...api,
                                    data: {
                                        "name": name,
                                        "description": description,
                                        "scope": "application",
                                        "variableSchema": schema,
                                    }
                                };
                            },
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload?.code
                                };
                            }
                        },
                        "body": [
                            {
                                "type": "input-text",
                                "name": "name",
                                "label": "变量名称",
                                "required": "true",
                                "placeholder": "请输入变量名称，支持英文字母、数字和_，长度在1-100之间",
                                "showCounter": true,
                                "maxLength": 100,
                                "validations": {
                                    "matchRegexp": "^[a-zA-Z_][A-Za-z0-9_]*$"
                                },
                                "validationErrors": {
                                    "matchRegexp": "变量名称由数字、字母、下横线组成，且不以数字开头"
                                }
                            },
                            {
                                "type": "select",
                                "name": "type",
                                "label": "数据类型",
                                "placeholder": "请选择",
                                "value": "string",
                                "options": [{
                                        "label": "字符串",
                                        "value": "string"
                                    },
                                    {
                                        "label": "数字",
                                        "value": "number"
                                    },
                                    {
                                        "label": "整数",
                                        "value": "integer"
                                    }, {
                                        "label": "布尔",
                                        "value": "boolean"
                                    }, {
                                        "label": "自定义对象",
                                        "value": "object"
                                    }]
                            },
                            {
                                "name": "isArray",
                                "type": "switch",
                                "label": "是否数组",
                                "desc": "数组类型变量请开启当前配置",
                            },
                            getSchemaTpl('tplFormulaControl', {
                                "name": 'default',
                                "label": '默认值',
                                "visibleOn": 'this.type=="string"',
                                "placeholder": '',
                                "variables": filterData,
                                "advancedFeature": advancedFeature,
                                "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                            }),
                            getSchemaTpl('formulaControl-hour', {
                                "name": 'default',
                                "label": '默认值',
                                "visibleOn": 'this.type=="number" || this.type=="integer"',
                                "valueType": {
                                    "type": 'number'
                                },
                                "formulaEchoVal": false,
                                "variables": filterData,
                                "advancedFeature": advancedFeature,
                                "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                            }),
                            getSchemaTpl('formulaControl-hour', {
                                "name": 'default',
                                "label": '默认值',
                                "visibleOn": 'this.type=="boolean"',
                                "valueType": {
                                    'type': 'select',
                                    'options': [
                                        {
                                            'value': true,
                                            'label': 'true'
                                        },
                                        {
                                            'value': false,
                                            'label': 'false'
                                        }
                                    ]
                                },
                                "formulaEchoVal": false,
                                "variables": filterData,
                                "advancedFeature": advancedFeature,
                                "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                            }),
                            getSchemaTpl('formulaControl-hour', {
                                "name": 'default',
                                "label": '默认值',
                                "visibleOn": 'this.type=="object"',
                                "containDisabled": '${type=="object"}',
                                "variables": filterData,
                                "advancedFeature": advancedFeature,
                                "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                            }),
                            // {
                            //     "type": "input-formula",
                            //     "name": "default",
                            //     "label": "默认值",
                            //     "variableMode": "tree",
                            //     "evalMode": false,
                            //     "value": "${defaultValue}",
                            //     "inputMode": "input-group",
                            //     "variables": filterData,
                            //     "advancedFeature": advancedFeature,
                            //     "validations": {
                            //         "isValChecked": true
                            //     },
                            //     "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                            // },
                            {
                                "type": "textarea",
                                "name": "description",
                                "label": "描述信息",
                                "placeholder": "请输入变量描述信息",
                                "showCounter": true,
                                "maxLength": 200,
                            },
                            {
                                "type": 'json-schema-editor',
                                "name": 'properties',
                                "label": '成员字段',
                                "required": true,
                                "titleAndKey": true,
                                "visibleOn": "${type == 'object'}",
                                "validations": {
                                    "isAddPropertiesChecked": true
                                },
                            }
                        ]
                    }
                }
            }
        ],
        "autoGenerateFilter": true,
        "footerToolbar": [
            "statistics",
            "switch-per-page",
            "pagination"
        ],
        "alwaysShowPagination": true,
        "columns": [
            {
                "name": "name",
                "label": "变量名称",
                "searchable": {
                    "type": "input-text",
                    "name": "name",
                    "label": "变量名称",
                    "clearable": true,
                    "placeholder": '请输入变量名称',
                    "size": 'sm'
                }
            },
            {
                "name": "type",
                "label": "变量类型",
                "type": 'mapping',
                "map": {
                    'string': "<span>字符串</span>",
                    'array': "<span>数组</span>",
                    'object': "<span>对象</span>",
                    'boolean': "<span>布尔值</span>",
                    'integer': "<span>整型</span>",
                    'number': "<span>数字</span>",
                },
            },
            {
                "name": "description",
                "label": "描述信息",
            },
            {
                "type": "operation",
                "label": "操作",
                "buttons": [
                    {
                        "label": "查看",
                        "type": "button",
                        "level": "link",
                        "actionType": "drawer",
                        "drawer": {
                            "position": "right",
                            "title": "Schema结构定义",
                            "data": {
                                id: "${id}"
                            },
                            "body": [{
                                "type": "form",
                                "initApi": {
                                    "method": "get",
                                    "url": getUpdateApi,
                                    adaptor: function (payload: any) {
                                        const name = payload?.data?.name
                                        let type = ''
                                        const description = payload?.data?.description
                                        const defaultValue = payload?.data?.defaultValue
                                        const variableSchema = payload?.data?.variableSchema
                                        if (payload?.data?.variableType == 'string') {
                                            if (payload?.data?.isArray) {
                                                type = '字符串数组'
                                            } else {
                                                type = '字符串'
                                            }
                                        } else if (payload?.data?.variableType == 'number') {
                                            if (payload?.data?.isArray) {
                                                type = '数字数组'
                                            } else {
                                                type = '数字'
                                            }
                                        } else if (payload?.data?.variableType == 'integer') {
                                            if (payload?.data?.isArray) {
                                                type = '整数数组'
                                            } else {
                                                type = '整数'
                                            }
                                        } else if (payload?.data?.variableType == 'boolean') {
                                            if (payload?.data?.isArray) {
                                                type = '布尔数组'
                                            } else {
                                                type = '布尔'
                                            }
                                        } else if (payload?.data?.variableType == 'object') {
                                            if (payload?.data?.isArray) {
                                                type = '自定义对象数组'
                                            } else {
                                                type = '自定义对象'
                                            }
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: {
                                                ...payload.data,
                                                name: name,
                                                type: type,
                                                description: description,
                                                variableSchema: variableSchema,
                                                defaultValue: defaultValue
                                            }
                                        };
                                    }
                                },
                                "body": [{
                                    "type": "input-text",
                                    "name": "name",
                                    "label": "变量名称",
                                    "static": true,
                                    "value": "${name}"
                                }, {
                                    "type": "input-text",
                                    "name": "type",
                                    "label": "数据类型",
                                    "static": true,
                                    "value": "${type}"
                                }, {
                                    "type": "input-text",
                                    "name": "default",
                                    "label": "默认值",
                                    "static": true,
                                    "value": "${defaultValue}"
                                }, {
                                    "type": "static-json",
                                    "name": "schema",
                                    "label": "结构定义",
                                    "value": "${variableSchema}",
                                    "displayDataTypes": true,
                                    "enableClipboard": true,
                                }, {
                                    "type": "input-text",
                                    "name": "description",
                                    "label": "描述信息",
                                    "static": true,
                                    "value": "${description}"
                                }],
                            }],
                            "actions": [
                                {
                                    "type": 'button',
                                    "label": '关闭',
                                    "level": "default",
                                    "close": true
                                }
                            ],
                        }
                    },
                    {
                        "label": "编辑",
                        "type": "button",
                        "level": "link",
                        "actionType": "dialog",
                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:variable:update')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:variable:update')}",
                        "onEvent": {
                            "click": {
                                "actions": [
                                    {
                                        "actionType": "custom",
                                        script: function (_, doAction, event) {
                                            // addRule('isEditValChecked', (values, value) => {
                                            //     const type = values.type
                                            //     const isArray = values.isArray
                                            //     const defaultVal = values.default ? values.default : ''
                                            //     const regexStr = /^\[(?:"[^"]*"(?:\s*,\s*"[^"]*")*)\]$/
                                            //     const regexNumber = /^\[(?:\s*\d+(?:\.\d+)?\s*(?:,\s*\d+(?:\.\d+)?\s*)*)\]$/
                                            //     const regexInteger = /^\[(?:\s*\d+\s*(?:,\s*\d+\s*)*)\]$/
                                            //     const regexBoolean = /^\[(?:\s*(?:true|false)\s*(?:,\s*(?:true|false)\s*)*)\]$/;
                                            //     const regexObj = /^\s*(\{(?:\s*"[^"]*"\s*:\s*(?:"[^"]*"|\d+|true|false|null|\[.*?\]|\{.*?\})?\s*,?)+\}\s*)$/
                                            //     const regexArrObj = /^\[\s*(\{(?:\s*"[^"]*"\s*:\s*(?:"[^"]*"|\d+|true|false|null|\[.*?\]|\{.*?\})?\s*,?)+\}\s*)\]$/
                                            //     const regexNum = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/
                                            //     const regexInt = /^-?\d+$/
                                            //     if(defaultVal.indexOf('${') != -1){
                                            //         return true
                                            //     }
                                            //     if (isArray) {
                                            //         if (type == 'string') {
                                            //             if (!regexStr.test(defaultVal)) {
                                            //                 return {
                                            //                     error: true,
                                            //                     msg: '默认值数据类型不合法'
                                            //                 };
                                            //             }
                                            //         } else if (type == 'number') {
                                            //             if (!regexNumber.test(defaultVal)) {
                                            //                 return {
                                            //                     error: true,
                                            //                     msg: '默认值数据类型不合法'
                                            //                 };
                                            //             }
                                            //         } else if (type == 'integer') {
                                            //             if (!regexInteger.test(defaultVal)) {
                                            //                 return {
                                            //                     error: true,
                                            //                     msg: '默认值数据类型不合法'
                                            //                 };
                                            //             }
                                            //         } else if (type == 'boolean') {
                                            //             if (!regexBoolean.test(defaultVal)) {
                                            //                 return {
                                            //                     error: true,
                                            //                     msg: '默认值数据类型不合法'
                                            //                 };
                                            //             }
                                            //         } else if (type == 'object') {
                                            //             if (!regexArrObj.test(defaultVal)) {
                                            //                 return {
                                            //                     error: true,
                                            //                     msg: '默认值数据类型不合法'
                                            //                 };
                                            //             }
                                            //         }
                                            //     } else if (type == 'boolean') {
                                            //         if (defaultVal == '') {
                                            //             return {
                                            //                 error: true,
                                            //                 msg: '默认值数据类型不合法'
                                            //             };
                                            //         } else if (defaultVal != 'false' && defaultVal != 'true') {
                                            //             return {
                                            //                 error: true,
                                            //                 msg: '默认值数据类型不合法'
                                            //             };
                                            //         }
                                            //     } else if (type == 'object') {
                                            //         if (defaultVal == '') {
                                            //             return {
                                            //                 error: true,
                                            //                 msg: '默认值数据类型不合法'
                                            //             };
                                            //         } else if (!regexObj.test(defaultVal)) {
                                            //             return {
                                            //                 error: true,
                                            //                 msg: '默认值数据类型不合法'
                                            //             };
                                            //         }
                                            //     } else if (type == 'number') {
                                            //         if (!regexNum.test(defaultVal)) {
                                            //             return {
                                            //                 error: true,
                                            //                 msg: '默认值数据类型不合法'
                                            //             };
                                            //         }
                                            //     } else if (type == 'integer') {
                                            //         if (!regexInt.test(defaultVal)) {
                                            //             return {
                                            //                 error: true,
                                            //                 msg: '默认值数据类型不合法'
                                            //             };
                                            //         }
                                            //     }
                                            //     return true
                                            // })
                                            addRule('isEditPropertiesChecked', (values, value) => {
                                                const type = values.type
                                                const properties = values.properties
                                                if (type == 'object') {
                                                    if (JSON.stringify(properties) == JSON.stringify({"type": "object"})) {
                                                        return {
                                                            error: true,
                                                            msg: '这是必填项'
                                                        };
                                                    }
                                                }
                                                return true
                                            })
                                        }
                                    }
                                ]
                            }
                        },
                        "dialog": {
                            "title": "编辑内存变量",
                            "data": {
                                id: "${id}"
                            },
                            "size": "lg",
                            "body": [{
                                "type": "form",
                                "initApi": {
                                    "method": "get",
                                    "url": getUpdateApi,
                                    adaptor: function (payload: any) {
                                        const name = payload?.data?.name
                                        const type = payload?.data?.variableType
                                        const description = payload?.data?.description
                                        const defaultValue = payload?.data?.defaultValue
                                        const isArray = payload?.data?.isArray
                                        let properties = {}
                                        if(payload?.data?.variableType=='object'){
                                            properties = payload?.data?.variableSchema
                                        } else {
                                            properties = {
                                                "type": "object",
                                            }
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: {
                                                ...payload.data,
                                                name: name,
                                                type: type,
                                                description: description,
                                                isArray: isArray,
                                                defaultValue: defaultValue,
                                                properties: properties
                                            }
                                        };
                                    }
                                },
                                "api": {
                                    "method": "put",
                                    "url": updateApi,
                                    requestAdaptor: function (api: any) {
                                        const name = api.data.name
                                        const description = api.data.description
                                        const type = api.data.type
                                        const defaultVal = api.data.default
                                        const isArray = api.data.isArray ? api.data.isArray : false
                                        const properties = api.data.properties
                                        const id = api.data.id
                                        let schema = {}
                                        //是否是数组，没有打开时
                                        if (isArray == false) {
                                            schema = {
                                                type: type,
                                                title: name,
                                                description: description,
                                                default: defaultVal
                                            }
                                            if (api.data.variableType == 'object') {
                                                schema = {
                                                    ...properties,
                                                    ...schema,
                                                }
                                            }
                                        } else {
                                            // 是否是数组，打开时
                                            if (api.data.variableType == 'object') {
                                                schema = {
                                                    type: "array",
                                                    title: name,
                                                    description: description,
                                                    default: defaultVal,
                                                    items: {...properties.items}
                                                }
                                            } else {
                                                schema = {
                                                    type: "array",
                                                    title: name,
                                                    description: description,
                                                    default: defaultVal,
                                                    items: {type: type}
                                                }
                                            }
                                        }
                                        return {
                                            ...api,
                                            data: {
                                                "name": name,
                                                "description": description,
                                                "scope": "application",
                                                "variableSchema": schema,
                                                "id": id
                                            }
                                        };
                                    },
                                    adaptor: function (payload: any) {
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
                                        "label": "变量名称",
                                        "required": "true",
                                        "placeholder": "请输入变量名称，支持英文字母、数字和_，长度在1-100之间",
                                        "showCounter": true,
                                        "disabled": true,
                                        "maxLength": 100,
                                        "validations": {
                                            "matchRegexp": "^[a-zA-Z_][A-Za-z0-9_]*$"
                                        },
                                        "validationErrors": {
                                            "matchRegexp": "变量名称由数字、字母、下横线组成，且不以数字开头"
                                        },
                                        "value": "${name}",
                                        "desc": "已创建变量不支持修改变量名称，如需修改名称请删除后重新创建",
                                    },
                                    {
                                        "type": "select",
                                        "name": "type",
                                        "label": "数据类型",
                                        "placeholder": "请选择",
                                        "value": "${type}",
                                        "options": [{
                                                "label": "字符串",
                                                "value": "string"
                                            },
                                            {
                                                "label": "数字",
                                                "value": "number"
                                            },
                                            {
                                                "label": "整数",
                                                "value": "integer"
                                            }, {
                                                "label": "布尔",
                                                "value": "boolean"
                                            }, {
                                                "label": "自定义对象",
                                                "value": "object"
                                            }]
                                    },
                                    {
                                        "name": "isArray",
                                        "type": "switch",
                                        "label": "是否数组",
                                        "value": "${isArray}",
                                        "desc": "数组类型变量请开启当前配置",
                                    },
                                    getSchemaTpl('tplFormulaControl', {
                                        "value": "${defaultValue}",
                                        "name": 'default',
                                        "label": '默认值',
                                        "visibleOn": 'this.type=="string"',
                                        "placeholder": '',
                                        "variables": filterData,
                                        "advancedFeature": advancedFeature,
                                        "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                                    }),
                                    getSchemaTpl('formulaControl-hour', {
                                        "value": "${defaultValue}",
                                        "name": 'default',
                                        "label": '默认值',
                                        "visibleOn": 'this.type=="number" || this.type=="integer"',
                                        "valueType": {
                                            "type": 'number'
                                        },
                                        "formulaEchoVal": false,
                                        "variables": filterData,
                                        "advancedFeature": advancedFeature,
                                        "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                                    }),
                                    getSchemaTpl('formulaControl-hour', {
                                        "value": "${defaultValue}",
                                        "name": 'default',
                                        "label": '默认值',
                                        "visibleOn": 'this.type=="boolean"',
                                        "valueType": {
                                            'type': 'select',
                                            'options': [
                                                {
                                                    'value': true,
                                                    'label': 'true'
                                                },
                                                {
                                                    'value': false,
                                                    'label': 'false'
                                                }
                                            ]
                                        },
                                        "formulaEchoVal": false,
                                        "variables": filterData,
                                        "advancedFeature": advancedFeature,
                                        "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                                    }),
                                    getSchemaTpl('formulaControl-hour', {
                                        "value": "${defaultValue}",
                                        "name": 'default',
                                        "label": '默认值',
                                        "visibleOn": 'this.type=="object"',
                                        "containDisabled": '${type=="object"}',
                                        "variables": filterData,
                                        "advancedFeature": advancedFeature,
                                        "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                                    }),
                                    // {
                                    //     "type": "input-formula",
                                    //     "name": "default",
                                    //     "label": "默认值",
                                    //     "variableMode": "tree",
                                    //     "evalMode": false,
                                    //     "value": "${defaultValue}",
                                    //     "inputMode": "input-group",
                                    //     "variables": filterData,
                                    //     "advancedFeature": advancedFeature,
                                    //     "validations": {
                                    //         "isEditValChecked": true
                                    //     },
                                    //     "description": '<pre class="cxd-Code cxd-Code-pre-wrap word-break" data-lang="json"><span><span class="mtk1">数组或自定义对象类型的默认值请使用JSON格式输入，否则会导致变量解析不成功，例如：</span></span><br><span><span class="mtk1">数组:&nbsp;[</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk5">false</span><span class="mtk1">]</span></span><br><span><span class="mtk1">自定义对象：{</span><span class="mtk20">"name"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">"amis"</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"order"</span><span class="mtk1">:&nbsp;</span><span class="mtk7">123</span><span class="mtk1">,&nbsp;</span><span class="mtk20">"status"</span><span class="mtk1">:&nbsp;</span><span class="mtk5">true</span><span class="mtk1">}</span></span><br></pre>'
                                    // },
                                    {
                                        "type": "textarea",
                                        "name": "description",
                                        "label": "描述信息",
                                        "placeholder": "请输入变量描述信息",
                                        "showCounter": true,
                                        "maxLength": 200,
                                        "value": "${description}"
                                    },
                                    {
                                        "type": 'json-schema-editor',
                                        "name": 'properties',
                                        "label": '成员字段',
                                        "required": true,
                                        "titleAndKey": true,
                                        "value": "${properties}",
                                        "visibleOn": "${type == 'object'}",
                                        "validations": {
                                            "isEditPropertiesChecked": true
                                        },
                                    }
                                ]
                            }]
                        }
                    },
                    {
                        "label": "删除",
                        "type": "button",
                        "actionType": "ajax",
                        "level": "link",
                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:variable:delete')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:variable:delete')}",
                        "confirmText": "删除变量后页面中的相关引用将会失效，确认要删除当前变量「${name}」？",
                        "api": {
                            "url": deleteApi,
                            "method": "delete"
                        },
                    }
                ]
            }
        ]
    }]
}

export default () => <AMISComponent schema={schema} />;
