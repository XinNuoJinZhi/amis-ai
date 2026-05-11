import {getSchemaTpl} from 'amis-editor'
import { useDevBaseUrl } from "@/utils/util"
import 'amis-editor-core/lib/style.css';
import {advancedFeature} from '@/utils/env'
import {truncateTimePrecision} from '@/utils';
export function filteredData(data:any,formData?:any) {
    let obj = {
        text: 'text',
        'serial-number': 'text',
        textarea: 'text',
        int: 'number',
        float: 'numbers',
        money: 'numbers',
        numbers: 'numbers',
        parent: 'number',
        boolean: 'boolean',
        date: 'date',
        time: 'time',
        datetime: 'datetime',
        image: 'image',
        enum: 'select',
        user: 'user',
        department: 'department',
        TEXT: 'text',
        TEXTAREA: 'text',
        INT: 'number',
        FLOAT: 'numbers',
        MONEY: 'numbers',
        PARENT: 'number',
        BOOLEAN: 'boolean',
        DATE: 'date',
        TIME: 'time',
        DATETIME: 'datetime',
        IMAGE: 'image',
        ENUM: 'select',
        USER: 'user',
        users:'users',
        USERS: 'users',
        DEPARTMENT: 'department',
        PASSWORD: 'PASSWORD',
        password:'text',
        CIPHERTEXT:'text',
        ciphertext:'text',
        FORMULA:'text',
        formula:'text',
        JSON:'text',
        json:'text',
        'rich-text':'text',
        RICH_TEXT:'text',
        DATE_RANGE:'dateRang',
        'date-range':'dateRang',
        ATTACHMENT: 'text',
        attachment:'text',
        RELATION:'text',
        relation:'text',
    }

    let customObj = {
        // textarea
        "text": {
            "value": getSchemaTpl('tplFormulaControl', {
                variables: formData,
                placeholder: '',
                valueType: {
                    type: 'text'
                },
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
                            disabled:true,
                            variables: formData,
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
                            variables: formData,
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
            isPrimaryKey:data.isPrimaryKey,
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
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
                "is_not_empty",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                "like",
                "starts_with",
                "ends_with"
            ]
        },
        "numbers": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                "precision": 2,
                "step": 0.01,
                valueType: {
                    type: 'number',
                    "precision": 2,
                    "step": 0.01,
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
                "is_not_empty",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                "like",
                "starts_with",
                "ends_with"
            ]
        },

        "boolean": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
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
                "is_not_empty",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
            ]
        },

        "date": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
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
                "not_between",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
            ]
        },

        "time": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
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
                "not_between",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
            ]
        },

        "datetime": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
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
                "not_between",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
            ]
        },

        "dateRang": {
            "value": getSchemaTpl('formulaControl', {
                variables: formData,
                rendererSchema:{
                    "type": "input-datetime-range"
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
                "not_between",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
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
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
            ],
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
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
                "is_not_empty",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                valueType: {
                    "type": 'user',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source": useDevBaseUrl("/system/user/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },
        "users": {
            "operators": [
                {
                    "value": "users_equal",
                    "label": "等于"
                },
                {
                    "value": "users_not_equals",
                    "label": "不等于"
                },
                "is_empty",
                "is_not_empty",{
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                valueType: {
                    "type": 'select',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source":useDevBaseUrl("/system/user/list-all-simple"),
                    "multiple": true,
                    "searchable": true,
                    "selectMode": "group",
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
                            variables: formData,
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
                            variables: formData,
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
                variables: formData,
                valueType: {
                    "type": 'department',
                    "source": useDevBaseUrl("/system/dept/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },

    }
    let toManyCustomObj = {
        "text": {
            "value": getSchemaTpl('tplFormulaControl', {
                variables: formData,
                placeholder: '',
                valueType: {
                    type: 'text'
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "模糊匹配（且）",
                    "value": "like and"
                },
                {
                    "label": "模糊匹配（或）",
                    "value": "like or"
                },
                {
                    "label": "不匹配（且）",
                    "value": "not_like and"
                },
                {
                    "label": "不匹配（或）",
                    "value": "not_like or"
                },
                {
                    "label": "匹配开头（且）",
                    "value": "starts_with and"
                },
                {
                    "label": "匹配开头（或）",
                    "value": "starts_with or"
                },
                {
                    "label": "匹配结尾（且）",
                    "value": "ends_with and"
                },
                {
                    "label": "匹配结尾（或）",
                    "value": "ends_with or"
                }
            ]
        },

        // "float"
        // "money"
        // "int"
        // "parent"
        "number": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                valueType: {
                    type: 'number'
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "模糊匹配（且）",
                    "value": "like and"
                },
                {
                    "label": "模糊匹配（或）",
                    "value": "like or"
                },
                {
                    "label": "匹配开头（且）",
                    "value": "starts_with and"
                },
                {
                    "label": "匹配开头（或）",
                    "value": "starts_with or"
                },
                {
                    "label": "匹配结尾（且）",
                    "value": "ends_with and"
                },
                {
                    "label": "匹配结尾（或）",
                    "value": "ends_with or"
                }
            ]
        },
        "numbers": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                "precision": 2,
                "step": 0.01,
                valueType: {
                    type: 'number',
                    "precision": 2,
                    "step": 0.01,
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "模糊匹配（且）",
                    "value": "like and"
                },
                {
                    "label": "模糊匹配（或）",
                    "value": "like or"
                },
                {
                    "label": "匹配开头（且）",
                    "value": "starts_with and"
                },
                {
                    "label": "匹配开头（或）",
                    "value": "starts_with or"
                },
                {
                    "label": "匹配结尾（且）",
                    "value": "ends_with and"
                },
                {
                    "label": "匹配结尾（或）",
                    "value": "ends_with or"
                }
            ]
        },

        "boolean": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
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
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                variables: formData,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "属于范围（且）",
                    "value": "between and"
                },
                {
                    "label": "属于范围（或）",
                    "value": "between or"
                },
                {
                    "label": "不属于范围（且）",
                    "value": "not_between and"
                },
                {
                    "label": "不属于范围（或）",
                    "value": "not_between or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                variables: formData,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'HH:mm:ss',
                    'viewMode': 'time'
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "属于范围（且）",
                    "value": "between and"
                },
                {
                    "label": "属于范围（或）",
                    "value": "between or"
                },
                {
                    "label": "不属于范围（且）",
                    "value": "not_between and"
                },
                {
                    "label": "不属于范围（或）",
                    "value": "not_between or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                variables: formData,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD HH:mm:ss',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "属于范围（且）",
                    "value": "between and"
                },
                {
                    "label": "属于范围（或）",
                    "value": "between or"
                },
                {
                    "label": "不属于范围（且）",
                    "value": "not_between and"
                },
                {
                    "label": "不属于范围（或）",
                    "value": "not_between or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "dateRang": {
            "value": getSchemaTpl('formulaControl', {
                variables: formData,
                rendererSchema:{
                    "type": "input-datetime-range"
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "属于范围（且）",
                    "value": "between and"
                },
                {
                    "label": "属于范围（或）",
                    "value": "between or"
                },
                {
                    "label": "不属于范围（且）",
                    "value": "not_between and"
                },
                {
                    "label": "不属于范围（或）",
                    "value": "not_between or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
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
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                }
            ],
            value:{}
        },

        // enum
        "select": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "select_equals and"
                },
                {
                    "label": "等于（或）",
                    "value": "select_equals or"
                },
                {
                    "label": "不等于（且）",
                    "value": "select_not_equals and"
                },
                {
                    "label": "不等于（或）",
                    "value": "select_not_equals or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                valueType: {
                    "type": 'select',
                },
                advancedFeature: advancedFeature
            }),
        },

        "user": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "user_equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "user_equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "user_not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "user_not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                valueType: {
                    "type": 'user',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source": useDevBaseUrl("/system/user/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },
        "users": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "user_equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "user_equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "user_not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "user_not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],


            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                valueType: {
                    "type": 'select',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source":useDevBaseUrl("/system/user/list-all-simple"),
                    "multiple": true,
                    "searchable": true,
                    "selectMode": "group",
                },
                advancedFeature: advancedFeature
            }),
        },

        "department": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "dep_equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "dep_equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "dep_not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "dep_not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formData,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "属于（且）",
                    "value": "dep_belong and"
                },
                {
                    "label": "属于（或）",
                    "value": "dep_belong or"
                },
                {
                    "label": "不属于（且）",
                    "value": "dep_not_belong and"
                },
                {
                    "label": "不属于（或）",
                    "value": "dep_not_belong or"
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formData,
                valueType: {
                    "type": 'department',
                    "source": useDevBaseUrl("/system/dept/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },

    }

    let ret = {}
    let beType = obj[data.primaryKeyType?data.primaryKeyType:data.type];
    // console.log(beType,'beType')
    if (beType == undefined) {
        // console.log(data,'data')
        ret = beType
    } else {
        // console.log(data,'data111')
        ret = {
            "label": data.label,
            "dbType": data.dbType,
            "yuanType": data.type,
            "type": "custom",
            "types": beType,
            "isPrimaryKey":data.isPrimaryKey,
            "isForeignKey":data.isForeignKey,
            "isCreateDate":data.isCreateDate,
            "isCreateUser":data.isCreateUser,
            "isDeleteDate":data.isDeleteDate,
            "isDeleteFlag":data.isDeleteFlag,
            "isDeleteUser":data.isDeleteUser,
            "isGenerated":data.isGenerated,
            "isNullable":data.isNullable,
            "isTreeParent":data.isTreeParent,
            "isTenantCode":data.isTenantCode,
            "isUpdateDate":data.isUpdateDate,
            "isUpdateUser":data.isUpdateUser,
            driver:data.driver,
            "sort":data.sort,
            "name": data.code?data.code:data.key?data.key:data.name,
            relationKey:data.relationKey?data.relationKey:null,
            relationMode:data.relationMode?data.relationMode:null,
            // ...customObj[beType]
        }
        if(data.type === 'time' || data.type === 'datetime'){
            ret = {...ret,
                precision:data.precision,
                showPrecision:data.showPrecision,
                precisionCompatible:data.precisionCompatible
            }
            ret.defaultValue = truncateTimePrecision('defaultValue' in data ? data.defaultValue : '',data.precisionCompatible && data.showPrecision > 3 ? 3 : data.showPrecision)
            if(data.showPrecision > 3 && !data.precisionCompatible){
                ret.types = 'text'
                beType = 'text'
            }
        }
        if(data.relationMode && data.relationMode.includes(':n')){
            ret = {...ret,...toManyCustomObj[beType]}
        }else{
            ret = {...ret,...customObj[beType]}
        }
        if (beType == 'select') {
            if (data?.meiptions == 'custom') {
                if(data.options){
                    ret['value']['valueType']['options'] = data.options
                }else{
                    ret['value']['valueType']['options'] = []
                }
            } else {
                ret['value']['valueType']['source'] = data.source
            }
        }
        if(ret['value']){
            ret['value']['variables'] = formData
        }
    }

    // console.log(ret,'retretretretretretret')

    return ret
}
