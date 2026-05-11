import {getSchemaTpl} from 'amis-editor'
import { useDevBaseUrl } from "@/utils/util"
import 'amis-editor-core/lib/style.css';
export function filteredDatas(data,formuVariables) {

    let obj = {
    text: 'text',
    textarea: 'text',
    'serial-number': 'text',
    'SERIALNUMBER': 'text',
    int: 'number',
    numbers: 'numbers',
    float: 'numbers',
    money: 'numbers',
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
    ATTACHMENT: 'attachment',
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
    USERS: 'users',
    DEPARTMENT: 'department',
    RICH_TEXT:'text',
    PASSWORD:'text',
    password:'text',
    CIPHERTEXT:'text',
    ciphertext:'text',
    RELATION:'text',
    relation:'text',
    FORMULA:'text',
    formula:'text',
    JSON:'text',
    json:'text',
    DATE_RANGE:'dateRang',
    'rich-text':'text',
    'date-range':'dateRang',
    attachment:'attachment',
    users:'users',
}

let customObj = {
    // textarea
    "text": {
        "value":  {
            variables: formuVariables,
            placeholder: '',
        }
    },
    "number": {
        "value":{
            variables: formuVariables,
                valueType: {
                    type: 'number'
                },
                formulaEchoVal: false,
        }
    },
    "numbers": {
        "value":{
            variables: formuVariables,
                "precision": 2,
                "step": 0.01,
                valueType: {
                    type: 'number',
                    "precision": 2,
                    "step": 0.01,
                },
                formulaEchoVal: false,
        }
    },

    "boolean": {
        "value": {
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
        }
    },

    "date": {
        "value":  {
            variables: formuVariables,
            valueType: {
                "type": 'time',
                'valueFormat': 'YYYY-MM-DD',
            }
        }
    },

    "time": {
        "value": {
            variables: formuVariables,
            valueType: {
                "type": 'time',
                'valueFormat': 'HH:mm:ss',
                'viewMode': 'time'
            }
        }
    },

    "datetime": {
        "value":  {
            variables: formuVariables,
            valueType: {
                "type": 'time',
                'valueFormat': 'YYYY-MM-DD HH:mm:ss',
            }
        }
    },

    "dateRang": {
        value:{
            variables: formuVariables,
            rendererSchema:{
                "type": "input-datetime-range"
            },
            valueType: {
                type: 'dateRang'
            },
        }
    },

    "image": {
        "operators": [
            "is_empty",
            "is_not_empty"
        ],
        value:{
            rendererSchema:{
                "type": "input-image",
                "accept": ".jpg,.jfif,.pjpeg,.pjp,.jpg,.png,.gif",
            variables: formuVariables,
            },
            valueType: {
                type: 'image'
            },
        }
    },
    "attachment": {
        "operators": [
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ],
        value:{
            rendererSchema:{
                "type": "input-file",
            variables: formuVariables,
            },
            valueType: {
                type: 'attachment'
            },
        }
    },

    // enum
    "select": {
        "operators": [
            "select_equals",
            "select_not_equals",
            "select_any_in",
            "select_not_any_in",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ],
        "value":  {
            rendererSchema:{
                "type": "select",
              variables: formuVariables,
            },
            valueType: {
                "type": 'select'
            }
        }
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
            "select_any_in",
            "select_not_any_in"
        ],

        // "value":  {
        //     variables: formuVariables,
        //     valueType: {
        //         "type": 'select',
        //         // "type": 'user',
        //         "labelField": "nickname",
        //         "valueField": "username",
        //         "source": useDevBaseUrl("/system/user/list-all-simple"),
        //     }
        // }
        value: {
            rendererSchema:{
              type: 'select',
              labelField: 'nickname',
              valueField: 'username',
              source: useDevBaseUrl('/system/user/list-all-simple?type=current_user'),
          variables: formuVariables,
          },
          valueType: {
                    "type": 'select',
          }
        }
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
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ],
        value: {
            rendererSchema:{
              type: 'select',
              labelField: 'nickname',
              valueField: 'username',
              source: useDevBaseUrl('/system/user/list-all-simple'),
              "multiple": true,
            "searchable": true,
            "selectMode": "group",
          variables: formuVariables,
          },
          valueType: {
            "type": 'select',
  }
          }
        // "value":  {
        //     variables: formuVariables,
        //     valueType: {
        //         "type": 'select',
        //         // "type": 'user',
        //         "labelField": "nickname",
        //         "valueField": "username",
        //         "source": useDevBaseUrl("/system/user/list-all-simple"),
        //         "multiple": true,
        // "searchable": true,
        // "selectMode": "group",
        //     }
        // }
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
                "value": "dep_belong",
                "label": "属于"
            },
            {
                "value": "dep_not_belong",
                "label": "不属于"
            },
            "select_any_in",
            "select_not_any_in"
        ],

        value: {
            rendererSchema:{
              type: 'tree-select',
             source: useDevBaseUrl('/system/dept/list-all-simple'),
          variables: formuVariables,
          }
        }
        // "value":  {
        //     variables: formuVariables,
        //     valueType: {
        //         "type": 'department',
        //         "source": useDevBaseUrl("/system/dept/list-all-simple"),
        //     },
        // }
    },

}

let ret = {}
// console.log(obj,'obj')
// console.log(data,'data')
    if(data){
        let beType = obj[data];
        // console.log(beType,'beType')
        // console.log(customObj[beType],'服务编排customObj[beType]')
        ret=customObj[beType].value
// console.log(ret,'ret11111')

return ret
    }
}
