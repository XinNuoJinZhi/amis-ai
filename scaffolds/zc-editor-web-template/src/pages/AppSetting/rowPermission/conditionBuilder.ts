import {getSchemaTpl} from 'amis-editor'
import {useDevBaseUrl} from "@/utils/util"
import 'amis-editor-core/lib/style.css';
import {advancedFeature} from '@/utils/env'


var formuVariables = [
    {
        label: '当前登录用户信息',
        value: 'zcUser',
        type: 'object',
        tag: '对象',
        children: [
            {
                label: '用户ID',
                value: 'zcUser.id',
                type: 'string',
                tag: '文本'
            },
            {
                label: '用户名',
                value: 'zcUser.name',
                type: 'string',
                tag: '文本'
            },
            {
                label: '昵称',
                value: 'zcUser.nickName',
                type: 'string',
                tag: '文本'
            },
            {
                label: '应用角色编码',
                value: 'zcUser.appRoleCodes',
                type: 'array',
                tag: '数组',
            },
            {
                label: '手机号',
                value: 'zcUser.phone',
                type: 'string',
                tag: '文本'
            },
            {
                label: '邮箱',
                value: 'zcUser.email',
                type: 'string',
                tag: '文本'
            },
            {
                label: '头像',
                value: 'zcUser.avatar',
                type: 'string',
                tag: '文本'
            },
            {
                label: '部门名称',
                value: 'zcUser.department',
                type: 'string',
                tag: '文本'
            },
            {
                label: '部门ID',
                value: 'zcUser.departmentId',
                type: 'string',
                tag: '文本'
            },
            {
                label: '部门编号',
                value: 'zcUser.departmentCode',
                type: 'string',
                tag: '文本'
            },
            {
                label: '部门路径',
                value: 'zcUser.departmentPath',
                type: 'string',
                tag: '文本'
            },
            {
                label: '租户编码',
                value: 'zcUser.tenantCode',
                type: 'string',
                tag: '文本'
            },
            {
                label: '租户名称',
                value: 'zcUser.tenantName',
                type: 'string',
                tag: '文本'
            },
            {
                label: '显示名称',
                path: '当前登录用户信息.显示名称',
                value: 'zcUser.displayName',
                type: 'string',
                tag: '文本'
            },
            {
                label: '简称',
                path: '当前登录用户信息.简称',
                value: 'zcUser.abbreviation',
                type: 'string',
                tag: '文本'
            },
            {
                label: '短名字',
                path: '当前登录用户信息.短名字',
                value: 'zcUser.shortName',
                type: 'string',
                tag: '文本'
            }
        ]
    },
    {
        label: '当前应用信息',
        value: 'zcApp',
        type: 'object',
        tag: '对象',
        children: [
            {
                label: '应用ID',
                value: 'zcApp.id',
                type: 'string',
                tag: '文本'
            },
            {
                label: '应用名称',
                value: 'zcApp.name',
                type: 'string',
                tag: '文本'
            },
            {
                label: '应用Logo',
                value: 'zcApp.logo',
                type: 'string',
                tag: '文本'
            },
            {
                label: '应用门户',
                value: 'zcApp.portals',
                type: 'array',
                tag: '数组'
            },
            {
                label: '当前运行环境',
                value: 'zcApp.env',
                type: 'string',
                tag: '文本'
            }
        ]
    },
    {
        label: '应用所属组织信息',
        value: 'zcCompany',
        type: 'object',
        tag: '对象',
        children: [
            {
                label: '组织ID',
                value: 'zcCompany.id',
                type: 'string',
                tag: '文本'
            },
            {
                label: '组织名称',
                value: 'zcCompany.name',
                type: 'string',
                tag: '文本'
            },
            {
                label: '组织Logo',
                value: 'zcCompany.logo',
                type: 'string',
                tag: '文本'
            },
            {
                label: '组织标识',
                value: 'zcCompany.key',
                type: 'string',
                tag: '文本'
            }
        ]
    },
    {
        label: '浏览器',
        value: 'window:location',
        type: 'object',
        tag: '对象',
        children: [
            {
                label: 'href',
                value: 'window:location.href',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'origin',
                value: 'window:location.origin',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'protocol',
                value: 'window:location.protocol',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'host',
                value: 'window:location.host',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'hostname',
                value: 'window:location.hostname',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'port',
                value: 'window:location.port',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'pathname',
                value: 'window:location.pathname',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'search',
                value: 'window:location.search',
                type: 'string',
                tag: '文本'
            },
            {
                label: 'hash',
                value: 'window:location.hash',
                type: 'string',
                tag: '文本'
            }
        ]
    }
]

export function filteredData(data) {

    let obj = {
        text: 'text',
        textarea: 'text',
        "serial-number": 'text',
        int: 'number',
        float: 'number',
        money: 'number',
        parent: 'number',
        boolean: 'boolean',
        date: 'date',
        time: 'time',
        datetime: 'datetime',
        image: 'image',
        enum: 'select',
        user: 'user',
        department: 'department',
    }

    let customObj = {
        // textarea
        "text": {
            "value": getSchemaTpl('tplFormulaControl', {
                variables: formuVariables,
                placeholder: '',
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                "like",
                "not_like",
                "starts_with",
                "ends_with",
            ]
        },

        // "float"
        // "money"
        // "int"
        // "parent"
        "number": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    type: 'number'
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                "like",
                "starts_with",
                "ends_with",
            ]
        },

        "boolean": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                    "options": [
                        {
                            "value": true,
                            "label": "开启"
                        },
                        {
                            "value": false,
                            "label": "关闭"
                        }
                    ],
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "date": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
                "not_between",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "time": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'HH:mm:ss',
                    'viewMode': 'time'
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
                "not_between",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "datetime": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD HH:mm:ss',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
                "not_between",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "image": {
            "operators": [
                "is_empty",
                "is_not_empty"
            ]
        },

        // enum
        "select": {
            "operators": [
                "select_equals",
                "select_not_equals",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                },
                advancedFeature: advancedFeature
            }),
        },

        "user": {
            "operators": [
                {
                    "value": "user_equal",
                    "label": "等于"
                },
                {
                    "value": "user_not_equal",
                    "label": "不等于"
                },
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'user',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source": useDevBaseUrl("/system/user/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },

        "department": {
            "operators": [
                {
                    "value": "dep_equal",
                    "label": "等于"
                },
                {
                    "value": "dep_not_equal",
                    "label": "不等于"
                },
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "value": "dep_belong",
                    "label": "属于"
                },
                {
                    "value": "dep_not_belong",
                    "label": "不属于"
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'department',
                    "source": useDevBaseUrl("/system/dept/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },

    }


    let ret = {}
    let beType = obj[data.type];
    if (beType == undefined) {
        ret = beType
    } else {

        ret = {
            "label": data.name,
            "type": "custom",
            "name": data.key,
            ...customObj[beType]
        }

        if (beType == 'select') {
            if (data.meiptions == 'custom') {
                ret['value']['valueType']['options'] = data.options
            } else {
                ret['value']['valueType']['source'] = data.source
            }
        }
        if(ret['value']){
            ret['value']['variables'] = formuVariables
        }
    }

    return ret
}
// 变化包含不包含数据
export function transformSelectAnyIn(rule) {
    if (Array.isArray(rule)) {
        return rule.map(transformSelectAnyIn);
    }

    if (!rule || typeof rule !== 'object') {
        return rule;
    }

    const SELECT_OP_MAP = {
        'select_any_in': 'selectAnyIn',
        'select_any_in and': 'selectAnyIn',
        'select_any_in or': 'selectAnyIn',
        'select_not_any_in': 'selectNotAnyIn',
        'select_not_any_in and': 'selectNotAnyIn',
        'select_not_any_in or': 'selectNotAnyIn'
    };

    const key = SELECT_OP_MAP[rule.op];
    let newRule = { ...rule };

    if (key && newRule.right && typeof newRule.right === 'object' && !Array.isArray(newRule.right)) {
        let value = newRule.right[key];

        // 如果值为 undefined，则赋值为空字符串
        if (value === undefined) {
            value = null;
        }

        newRule = {
            ...newRule,
            right: value
        };
    }

    // 递归处理 children
    if (newRule.children) {
        newRule.children = transformSelectAnyIn(newRule.children);
    }

    return newRule;
}
export function reverseTransformSelectAnyIn(rule) {
    if (Array.isArray(rule)) {
        return rule.map(reverseTransformSelectAnyIn);
    }

    if (!rule || typeof rule !== 'object') {
        return rule;
    }

    const SELECT_OP_MAP = {
        'select_any_in': 'selectAnyIn',
        'select_any_in and': 'selectAnyIn',
        'select_any_in or': 'selectAnyIn',
        'select_not_any_in': 'selectNotAnyIn',
        'select_not_any_in and': 'selectNotAnyIn',
        'select_not_any_in or': 'selectNotAnyIn'
    };

    const key = SELECT_OP_MAP[rule.op];
    let newRule = { ...rule };

    if (key) {
        let value = newRule.right;

        // 判断是否已经是正确的对象结构，如果是则跳过
        if (
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null
        ) {
            // 已经是正确结构，不做任何改变
            return newRule;
        }

        // 否则进行包装，并将 undefined 转为空字符串
        newRule = {
            ...newRule,
            right: {
                [key]: value === undefined ? null : value
            }
        };
    }

    // 递归处理 children
    if (newRule.children) {
        newRule.children = newRule.children.map(reverseTransformSelectAnyIn);
    }

    return newRule;
}
