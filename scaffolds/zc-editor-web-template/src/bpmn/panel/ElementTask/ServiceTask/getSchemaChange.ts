import {getSchemaTpl} from 'amis-editor';

import { useDevBaseUrl } from "@/utils/util"
import 'amis-editor-core/lib/style.css';
import {getFormatStringByPrecision} from '@/utils';
export const filterData = [
  {
      label: '当前登录用户信息',
      value: 'zcUser',
      path: '当前登录用户信息',
      type: 'object',
      tag: '对象',
      isMember: false,
      disabled: false,
      children: [
          {
              label: '用户ID',
              value: 'zcUser.id',
              path: '当前登录用户信息.用户ID',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '用户名',
              value: 'zcUser.name',
              path: '当前登录用户信息.用户名',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '手机号',
              value: 'zcUser.phone',
              path: '当前登录用户信息.手机号',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '邮箱',
              value: 'zcUser.email',
              path: '当前登录用户信息.邮箱',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '昵称',
              value: 'zcUser.nickName',
              path: '当前登录用户信息.昵称',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '应用角色编码',
              value: 'zcUser.appRoleCodes',
              path: '当前登录用户信息.应用角色编码',
              type: 'array',
              tag: '数组',
              isMember: false,
              disabled: false
          },
          {
            label: '部门名称',
            path: '当前登录用户信息.部门名称',
            value: 'zcUser.department',
            type: 'string',
            tag: '文本'
          },
          {
              label: '部门ID',
              path: '当前登录用户信息.部门ID',
              value: 'zcUser.departmentId',
              type: 'string',
              tag: '文本'
          },
          {
              label: '部门编号',
              path: '当前登录用户信息.部门编号',
              value: 'zcUser.departmentCode',
              type: 'string',
              tag: '文本'
          },
          {
              label: '部门路径',
              path: '当前登录用户信息.部门路径',
              value: 'zcUser.departmentPath',
              type: 'string',
              tag: '文本'
          },
          {
            label: '租户编码',
            path: '当前登录用户信息.租户编码',
            value: 'zcUser.tenantCode',
            type: 'string',
            tag: '文本'
          },
          {
            label: '租户名称',
            path: '当前登录用户信息.租户名称',
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
      path: '当前应用信息',
      type: 'object',
      tag: '对象',
      isMember: false,
      disabled: false,
      children: [
          {
              label: '应用ID',
              value: 'zcApp.id',
              path: '当前应用信息.应用ID',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '应用名称',
              value: 'zcApp.name',
              path: '当前应用信息.应用名称',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '应用Logo',
              value: 'zcApp.logo',
              path: '当前应用信息.应用Logo',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '应用门户',
              value: 'zcApp.portals',
              path: '当前应用信息.应用门户',
              type: 'array',
              tag: '数组',
              isMember: false,
              disabled: false
          },
          {
              label: '当前运行环境',
              value: 'zcApp.env',
              path: '当前应用信息.当前运行环境',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          }
      ]
  },
  {
      label: '应用所属组织信息',
      value: 'zcCompany',
      path: '应用所属组织信息',
      type: 'object',
      tag: '对象',
      isMember: false,
      disabled: false,
      children: [
          {
              label: '组织ID',
              value: 'zcCompany.id',
              path: '应用所属组织信息.组织ID',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '组织名称',
              value: 'zcCompany.name',
              path: '应用所属组织信息.组织名称',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          },
          {
              label: '应用标识',
              value: 'zcCompany.key',
              path: '应用所属组织信息.应用标识',
              type: 'string',
              tag: '文本',
              isMember: false,
              disabled: false
          }
      ]
  }
]
export function filteredDatas(data:any, formuVariables:any, yuanData?:any) {
  let obj = {
    text: 'text',
    textarea: 'text',
    ID: 'number',
    id: 'number',
    int: 'number',
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
    attachment: 'attachment',
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
    users: 'users',
    DEPARTMENT: 'department',
    RICH_TEXT: 'text',
    'rich-text': 'text',
    PASSWORD: 'text',
    password: 'text',
    CIPHERTEXT: 'text',
    ciphertext: 'text',
    'serial-number': 'text',
    RELATION: 'text',
    relation: 'text',
    FORMULA: 'text',
    formula: 'text',
    JSON: 'text',
    json: 'text',
    DATE_RANGE: 'dateRang',
    date_range: 'dateRang',
    number: 'number',
    dateRang: 'dateRang',
    'date-range': 'dateRang',
    select: 'select',
    numbers: 'numbers',
  };

  let customObj = {
    // textarea
    text: {
      value: {
        variables: formuVariables,
        placeholder: '',
      }
    },
    number: {
      value: {
        variables: formuVariables,
        valueType: {
          type: 'number'
        },
        formulaEchoVal: false
      }
    },
    numbers: {
      value: {
        variables: formuVariables,
        valueType: {
          type: 'number',
          "precision": 2,
          "step": 0.01,
        },
        formulaEchoVal: false
      }
    },
    boolean: {
      value: {
        variables: formuVariables,
        valueType: {
          type: 'select',
          options: [
            {
              value: true,
              label: '开启'
            },
            {
              value: false,
              label: '关闭'
            }
          ]
        },
        formulaEchoVal: false
      }
    },

    date: {
      value: {
        variables: formuVariables,
        valueType: {
          type: 'time',
          valueFormat: 'YYYY-MM-DD'
        }
      }
    },

    time: {
      value: {
        variables: formuVariables,
        valueType: {
          type: 'time',
          valueFormat: 'HH:mm:ss',
          viewMode: 'time'
        }
      }
    },

    datetime: {
      value: {
        variables: formuVariables,
        valueType: {
          type: 'time',
          valueFormat: 'YYYY-MM-DD HH:mm:ss'
        }
      }
    },

    dateRang: {
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
          }
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
            }
        }
    },

    // enum
    select: {
      operators: [
        'select_equals',
        'select_not_equals',
        'is_empty',
        'is_not_empty',
        "select_any_in",
        "select_not_any_in"
      ],
      value: {
        // variables: formuVariables,
        // valueType: {
        //   type: 'select'
        // }
        rendererSchema:{
          "type": "select",
        variables: formuVariables,
      }
      }
    },

    user: {
      operators: [
        {
          value: 'user_equal',
          label: '等于'
        },
        {
          value: 'user_not_equal',
          label: '不等于'
        },
        'is_empty',
        'is_not_empty',
        "select_any_in",
        "select_not_any_in"
      ],

      // value: {
      //   variables: formuVariables,
      //   valueType: {
      //     type: 'user',
      //     labelField: 'nickname',
      //     valueField: 'username',
          // source: useDevBaseUrl('/system/user/list-all-simple')
      //   }
      // }
      value: {
        rendererSchema:{
          type: 'select',
          labelField: 'nickname',
          valueField: 'username',
          source: useDevBaseUrl('/system/user/list-all-simple'),
      variables: formuVariables,
      }
    }
    },
    users: {
      operators: [
        {
          value: 'user_equal',
          label: '等于'
        },
        {
          value: 'user_not_equal',
          label: '不等于'
        },
        'is_empty',
        'is_not_empty',
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
      }
        // variables: formuVariables,
        // valueType: {
        //   type: 'select',
        //   labelField: 'nickname',
        //   valueField: 'username',
        //   source: useDevBaseUrl('/system/user/list-all-simple'),
        //   "multiple": true,
        // "searchable": true,
        // "selectMode": "group",
        // }
      }
    },

    department: {
      operators: [
        {
          value: 'dep_equal',
          label: '等于'
        },
        {
          value: 'dep_not_equal',
          label: '不等于'
        },
        'is_empty',
        'is_not_empty',
        "select_any_in",
        "select_not_any_in",
        {
          value: 'dep_belong',
          label: '属于'
        },
        {
          value: 'dep_not_belong',
          label: '不属于'
        }
      ],

      value: {
        rendererSchema:{
          type: 'tree-select',
         source: useDevBaseUrl('/system/dept/list-all-simple'),
      variables: formuVariables,
      }
    }
      // value: {
      //   variables: formuVariables,
      //   valueType: {
      //     type: 'department',
      //     source: useDevBaseUrl('/system/dept/list-all-simple')
      //   }
      // }
    }
  };

  let ret = {};
  // console.log(obj, 'obj');
  // console.log(data, 'data');
  let beType = obj[data];
  // console.log(beType, 'beType');
  // if (beType == undefined) {
  //     console.log(data,'data')
  //     ret = beType
  // } else {
  //     console.log(data,'data111')
  //     ret = {
  //         "label": data.label,
  //         // "type": "custom",
  //         // "type": data.type,
  //         "type": beType,
  //         "name": data.code?data.code:data.key?data.key:data.name,
  //         // "name": data.code,
  //         ...customObj[beType]
  //     }
  //     // if (beType == 'select') {
  //     //     if (data.config?.meiptions == 'custom') {
  //     //         ret['value']['valueType']['options'] = data.config.options
  //     //     } else {
  //     //         ret['value']['valueType']['source'] = data.config.source
  //     //     }
  //     // }
  //     // ret['value']['variables'] = formuVariables
  // }
  // console.log(customObj[beType],'customObj[beType]')
  ret = customObj[beType].value;
  if(ret.valueType){
    if(ret.valueType.type === "time" || ret.valueType.type === "datetime"){
      const formatString = getFormatStringByPrecision(
        data === "datetime" ?
        'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', yuanData.precisionCompatible ? 3 : yuanData.showPrecision, yuanData.precisionCompatible);
      ret.valueType.format = formatString
      ret.valueType.valueFormat = formatString
      ret.valueType.inputFormat = formatString
      ret.valueType.displayFormat = formatString
    }
  }

  // console.log(ret, 'ret11111');

  return ret;
}
