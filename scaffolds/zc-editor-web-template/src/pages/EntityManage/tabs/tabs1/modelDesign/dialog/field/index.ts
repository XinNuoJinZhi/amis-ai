import {listAllDeptApi, listUserApi} from '@/api/backlogCenter';
import {formatToData} from '@/utils/util';
import {addRule, toast, confirm} from 'amis';
import * as uuid from 'uuid';
import {getZidian, clearBefore} from '@/api/entitymanage';
import { useDevBaseUrl, useAdminBaseUrl, } from "@/utils/util"
import {getRulesNumber} from '@/pages/EntityManage/tabs/tabs1/modelDesign/dialog/field/util';
import {processIndexFields, truncateTimePrecision, validateTimeInput} from '@/utils';
import {getColumnSelectFields, getColumnSelect} from '@/api/entitymanage';
import { eachRight } from 'lodash-es';
export default (moneyData: any) => {
  let dictionaryList: any;
  let isChange:any = false
  let isPrecisionChange:boolean = false
  return {
    title: '字段集合',
    tab: {
      type: 'crud',
      autoFillHeight: 500,
      syncLocation: false,
      columnsTogglable: false,
      // "strictMode": false,
      id: 'myField',
      name: 'myField',
      source: '${fields}',
      "api": {
        "method": "get",
        "url": useDevBaseUrl("/entitymanage/table/getTableInfo?tableKey=${queryKey}")
      },
      footerToolbar: [],
      alwaysShowPagination: false,
      headerToolbar: [
        {
          type: 'button',
          // "type": "action",
          actionType: 'drawer',
          label: '添加',
          level: 'primary',
          drawer: {
            id: 'drawerId',
            className: "addField",
            resizable: true,
            // "data": {
            //     "sameName": false,
            //     "sameNames": false,
            // },
            position: 'left',
            width: 400,
            actions: [],
            title: '在模型[$name]中新增字段',
            // "title": "在模型[$code]中新增字段",
            body: {
              type: 'wizard',
              mode: 'simple',
              "className": "no-border",
              steps: [
                {
                  title: '选择类型',
                  body: [
                    {
                      // "name": "type",
                      name: 'fieldType',
                      label: '系统字段',
                      type: 'radios',
                      required: true,
                      id: 'type',
                      value: 'text',
                      // "id": "fieldType",
                      inline: false,
                      onEvent: {
                        change: {
                          actions: [
                            // {
                            //     "actionType": "setValue",
                            //     "componentId": "advanced",
                            //     "args": {
                            //         "value": ""
                            //     }
                            // },
                            // {
                            //     "actionType": "setValue",
                            //     "componentId": "createForm",
                            //     "args": {
                            //         "value": ""
                            //     }
                            // },
                          ]
                        }
                      },
                      options: [
                        {
                          label: '单行文本',
                          value: 'text',
                          description:
                            '用来存储小段文本信息，比如：名称、邮箱、网址、身份证号等等'
                        },
                        {
                          label: '多行文本',
                          value: 'textarea',
                          description: '用来存储大片文本信息,长度不限'
                        },
                        {
                          label: '整数(Int)',
                          value: 'int',
                          description:
                            '用来存储整型数据，比如：年龄、长度、距离等等'
                        },
                        // {
                        //     "label": "长整型(bigInt)",
                        //     "value": "bigint",
                        //     "description": "用来存储长整型数据，比如自然数，计数器，金融数据等等"
                        // },
                        {
                          label: '小数',
                          // "label": "浮点数(Float)",
                          value: 'float',
                          description:
                            '用来存储带小数点的数字,比如：经度、纬度等等'
                        },
                        {
                          label: '富文本',
                          value: 'rich-text',
                          description: '适合用来存文章内容'
                        },
                        {
                          label: '金额',
                          value: 'money',
                          description: '用来存储金额类型字段，单位为分'
                        },
                        {
                          label: '流水号',
                          value: 'serial-number',
                          description: '系统自动生成字段，根据预设规则生成流水号信息'
                        },
                        {
                          // "hidden": true,
                          label: '枚举',
                          value: 'enum',
                          description:
                            '用来存储固定的某几个值，经常用来存储状态。'
                        },
                        {
                          label: '布尔(开关)',
                          value: 'boolean',
                          description: '用来存储是与否。'
                        },
                        {
                          label: '日期',
                          value: 'date',
                          description: '用来存储日期格式'
                          // "description": "用来存储日期格式，包含：日期时间、日期、时间和时间戳格式。",
                        },
                        {
                          label: '时间',
                          value: 'time',
                          description: '用来存储时间'
                        },
                        {
                          label: '日期时间',
                          value: 'datetime',
                          description: '用来存储日期时间格式'
                        },
                        {
                          label: '日期范围',
                          value: 'date-range',
                          description: '用来存储日期范围格式'
                        },
                        {
                          label: '附件',
                          value: 'attachment',
                          description: '用来存储文件，一般用于用户上传。'
                        },
                        {
                          label: '图片',
                          value: 'image',
                          description: '用来存储图片，一般用于用户图片上传。'
                        },
                        {
                          label: '人员信息',
                          value: 'user',
                          description:
                            '可以用来存储人员信息，与平台用户表关联。'
                        },
                        {
                          label: '人员多选',
                          value: 'users',
                          description: '可以用来人员多选。'
                        },
                        {
                          label: '部门信息',
                          value: 'department',
                          description:
                            '可以用来存储部门信息，与平台部门表关联。'
                        },
                        // {
                        //     "label": "拥有者",
                        //     "value": "owner",
                        //     "description": "用来存储数据所属人员信息，可用权限设置。"
                        // },
                        {
                          label: '密码',
                          value: 'password',
                          description:
                            '用来存储密文，只能用于结果比对，不可反解。'
                        },
                        {
                          label: '密文',
                          value: 'ciphertext',
                          description: '用来存储加密文本，可反解。'
                        },
                        {
                          label: 'JSON',
                          value: 'json',
                          description:
                            '用来存储复杂数据，对象、数组、字符、数字等都能支持。但是不可以用于检索和排序。'
                        },
                        {
                          label: '公式',
                          value: 'formula',
                          description: '不存储数据，根据公式自动计算结果'
                        }
                      ]
                    },
                    {
                      type:'container',
                      "className": "pos-fix bottom-0 pb-5 w-10/12 bg-white",
                        body:[
                          {
                            "className": "left-0",
                            label: '下一步',
                          level: 'primary',
                          type: 'button',
                            actionType: 'next'
                          },
                        ]
                    }
                  ],
                  actions:[]
                },
                {
                  title: '字段信息',
                  mode: 'horizontal',
                  horizontal: {
                    leftFixed: 'sm'
                  },
                  type: 'form',
                  name: 'createForm',
                  id: 'createForm',
                  labelWidth: '90px',
                  body: [
                    // "controls": [
                    {
                      visibleOn: "(this.relation !== '')",
                      label: '字段名',
                      type: 'input-text',
                      required: true,
                      placeholder: '表中的名称，建议英文和下划线',
                      // "name": "code",
                      name: 'fieldCode',
                      value: '',
                      validations: {
                        matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                        isZXS: true
                      },
                      validationErrors: {
                        matchRegexp: '请填写规范字段名'
                      },
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log(event,'11111111')
                                if(!isChange){
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'xianshiName',
                                    args: {
                                      value: event.data.fieldCode?event.data.fieldCode:''
                                    }
                                  });
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn: "(this.relation !== '')",
                      label: '显示名称',
                      required: true,
                      id:'xianshiName',
                      type: 'input-text',
                      // "value": "${code}",
                      // value: '${fieldName}',
                      value:'',
                      placeholder: '字段展示的名称，可以是中文',
                      name: 'fieldName',
                      validations: {
                        isSameName: true
                      },onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (_: any,
                                doAction: any,
                                event: any) {
                                isChange = true
                                if(event.data.fieldName==''){
                                isChange = false
                                }
                              }
                            }
                          ]
                        }
                      }
                      // "name": "fieldDesc"
                    },
                    {
                      // "visibleOn": "(this.advanced == 'address' || this.advanced == 'formula')",
                      label: '描述',
                      type: 'textarea',
                      mode: 'horizontal',
                      desc: '字段底部显示的描述信息',
                      name: 'describe',
                      maxLength: 200
                      // "name": "describe"
                    },
                    {
                      visibleOn: "(this.fieldType == 'money')",
                      label: '币种',
                      type: 'select',
                      name: 'currency',
                      value: 'CNY',
                      source: {
                        method: 'get',
                        url: useAdminBaseUrl('/system/dict-data/list?dictType=currency&status=0'),
                        adaptor: function (payload: any) {
                          console.log(payload, 'payload');
                          moneyData = payload.data;
                          return {
                            ...payload,
                            status: payload.code,
                            data: {...payload.data, options: payload.data}
                          };
                        }
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'date-range' || this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'int' || this.fieldType == 'float' || this.fieldType =='rich-text' || this.fieldType == 'boolean' || this.fieldType == 'time' || this.fieldType == 'enum' || this.fieldType == 'money' || this.fieldType == 'department' || this.fieldType == 'password' || this.fieldType == 'ciphertext'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      // "name": "storageType",
                      value: 'null',
                      // "desc": "${(format == 'datetime' ?'时间日期，包含时期和时间信息，没有时区信息。': format == 'datetime'? '只包含日期信息，不包含时间信息。': format == 'time'? '时间信息，不包含日期，没有时区信息。' :'' )}",
                      desc: "${(defaultValueMode=='expression'?'只支持SQL表达式':'')}",
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                        // {
                        //     "label": "表达式",
                        //     "value": "expression",
                        // }
                      ],
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'serial-number'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      desc: "请确认流水号类型的默认值为不设置，否则将不能正确处理",
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static',
                          disabled: true
                        }
                      ],
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'date' || this.fieldType == 'datetime'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'static',
                      desc: "${(defaultValueMode=='expression'?'只支持SQL表达式':'')}",
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                        // {
                        //     "label": "表达式",
                        //     "value": "expression",
                        // }
                      ],
                    },
                    {
                      visibleOn:
                        "this.defaultValueMode=='expression' && this.fieldType !== 'users' && this.fieldType !== 'datetime'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      desc: '请确认SQL语句正确，否则会造成数据库问题。',
                      value: '',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.defaultValueMode=='expression' &&  this.fieldType == 'datetime'",
                      // "visibleOn": "this.defaultValueMode=='expression' &&  this.type == 'datetime'",
                      // "visibleOn": "this.defaultValueMode=='expression' &&  this.fieldType == 'datetime'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      value: '',
                      placeholder: '默认值',
                      options: [
                        {
                          label: '当前时间',
                          value: 'CURRENT_TIMESTAMP'
                        }
                      ],
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "((this.fieldType !== 'password' && this.fieldType !== 'ciphertext' && this.fieldType !== 'date-range' && this.fieldType !=='int' && this.fieldType !=='attachment' && this.fieldType !=='department' && this.fieldType !=='textarea' && this.fieldType !== 'float' && this.fieldType !== 'rich-text' && this.fieldType !== 'boolean' && this.fieldType !== 'money' && this.fieldType !== 'date' && this.fieldType !== 'datetime' && this.fieldType !== 'time' && this.fieldType !== 'user' && this.fieldType !== 'users' && this.fieldType !== 'enum') && this.defaultValueMode=='static')",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:"this.fieldType == 'ciphertext' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      },
                      desc: '默认值为数据库中的默认值，需要进行加密处理',
                    },
                    {
                      visibleOn:"this.fieldType == 'password' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      },
                      desc: '默认值为数据库中的默认值，需要进行加密处理',
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'enum' && this.valueType == 'VARCHAR' && this.defaultValueMode=='static')",
                      label: '',
                      required: true,
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'enum' && this.valueType == 'INTEGER' && this.defaultValueMode=='static')",
                      label: '',
                      required: true,
                      type: 'input-number',
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType =='date' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.type =='date' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType =='date' && this.defaultValueMode=='static'",
                      required: true,
                      label: '',
                      value: '2020-01-01',
                      format: 'YYYY-MM-DD',
                      type: 'input-date',
                      name: 'defaultValue',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType =='datetime' && this.defaultValueMode=='static' && this.precision == 0",
                      required: true,
                      label: '',
                      value: '2020-01-01 00:00:00',
                      format: 'YYYY-MM-DD HH:mm:ss',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss',
                      type: 'input-dateTime',
                      name: 'defaultValue',
                      validations: {
                        isHaveMo: true
                      }
                    }, {
                      visibleOn:
                        "this.fieldType =='datetime' && this.defaultValueMode=='static' && this.precision == 1",
                      required: true,
                      label: '',
                      value: '2020-01-01 00:00:00',
                      format: 'YYYY-MM-DD HH:mm:ss.S',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss.S',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss.S',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss.S',
                      type: 'input-dateTime',
                      name: 'defaultValue',
                      validations: {
                        isHaveMo: true
                      }
                    }, {
                      visibleOn:
                        "this.fieldType =='datetime' && this.defaultValueMode=='static' && this.precision == 2",
                      required: true,
                      label: '',
                      value: '2020-01-01 00:00:00',
                      format: 'YYYY-MM-DD HH:mm:ss.SS',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss.SS',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss.SS',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss.SS',
                      type: 'input-dateTime',
                      name: 'defaultValue',
                      validations: {
                        isHaveMo: true
                      }
                    }, {
                      visibleOn:
                        "this.fieldType =='datetime' && this.defaultValueMode=='static' && this.precision == 3",
                      required: true,
                      label: '',
                      value: '2020-01-01 00:00:00',
                      format: 'YYYY-MM-DD HH:mm:ss.SSS',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
                      type: 'input-dateTime',
                      name: 'defaultValue',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType =='time' && this.defaultValueMode=='static' && this.precision == 0",
                      required: true,
                      label: '',
                      type: 'input-time',
                      name: 'defaultValue',
                      valueFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'float' && this.defaultValueMode=='static' && this.decimalType != 'DECIMAL'",
                      // "visibleOn": "(this.type =='int' || this.type == 'float') && this.defaultValueMode=='static'",
                      // "visibleOn": "(this.fieldType =='int' || this.fieldType == 'float') && this.defaultValueMode=='static'",
                      required: true,
                      label: '',
                      // "step": 0.0001,
                      precision: 4,
                      type: 'input-number',
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    }, {
                      visibleOn:
                        "this.fieldType =='time' && this.defaultValueMode=='static' && this.precision == 1",
                      required: true,
                      label: '',
                      type: 'input-time',
                      name: 'defaultValue',
                      format: 'HH:mm:ss.S',
                      valueFormat: 'HH:mm:ss.S',
                      inputFormat: 'HH:mm:ss.S',
                      displayFormat: 'HH:mm:ss.S',
                      validations: {
                        isHaveMo: true
                      }
                    }, {
                      visibleOn:
                        "this.fieldType =='time' && this.defaultValueMode=='static' && this.precision == 2",
                      required: true,
                      label: '',
                      type: 'input-time',
                      name: 'defaultValue',
                      format: 'HH:mm:ss.SS',
                      valueFormat: 'HH:mm:ss.SS',
                      inputFormat: 'HH:mm:ss.SS',
                      displayFormat: 'HH:mm:ss.SS',
                      validations: {
                        isHaveMo: true
                      }
                    }, {
                      visibleOn:
                        "this.fieldType =='time' && this.defaultValueMode=='static' && this.precision == 3",
                      required: true,
                      label: '',
                      type: 'input-time',
                      name: 'defaultValue',
                      format: 'HH:mm:ss.SSS',
                      valueFormat: 'HH:mm:ss.SSS',
                      inputFormat: 'HH:mm:ss.SSS',
                      displayFormat: 'HH:mm:ss.SSS',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='datetime'||this.fieldType =='time') && this.defaultValueMode=='static' && this.precision > 3",
                      required: true,
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      validations: {
                        timeRule: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'float' && this.defaultValueMode=='static' && this.decimalType == 'DECIMAL'",
                      // "visibleOn": "(this.type =='int' || this.type == 'float') && this.defaultValueMode=='static'",
                      // "visibleOn": "(this.fieldType =='int' || this.fieldType == 'float') && this.defaultValueMode=='static'",
                      required: true,
                      label: '',
                      // "step": 0.0001,scale
                      precision: '$scale',
                      // "precision": "${$scale ? $scale : 3}",
                      type: 'input-number',
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType =='int' && this.defaultValueMode=='static'",
                      // "visibleOn": "(this.type =='int' || this.type == 'float') && this.defaultValueMode=='static'",
                      // "visibleOn": "(this.fieldType =='int' || this.fieldType == 'float') && this.defaultValueMode=='static'",
                      label: '',
                      type: 'input-number',
                      required: true,
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'money' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.type == 'money' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType == 'money' && this.defaultValueMode=='static'",
                      required: true,
                      label: '',
                      step: 0.01,
                      type: 'input-number',
                      name: 'defaultValue',
                      big: true,
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      },
                      desc: '该处单位为"元"，数据库中单位为"分"，为该处的值乘以100'
                    },
                    {
                      visibleOn:
                        " this.fieldType =='textarea' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'textarea',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType =='rich-text' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'input-rich-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      options: {
                        menubar: false,
                        height: 200,
                        buttons: [
                          'undo',
                          'redo',
                          'paragraphFormat',
                          'textColor',
                          'backgroundColor',
                          'bold',
                          'underline',
                          'strikeThrough',
                          'formatOL',
                          'formatUL',
                          'align',
                          'quote',
                          'insertLink',
                          'insertImage',
                          'insertEmotion',
                          'insertVideo',
                          'insertTable',
                          'html'
                        ]
                        //     "toolbar": "undo redo | example"
                      },
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'boolean' && this.defaultValueMode=='static'",
                      label: '',
                      onText: 'TRUE',
                      offText: 'FALSE',
                      type: 'switch',
                      trueValue: 'true',
                      falseValue: 'false',
                      value: 'false',
                      name: 'defaultValue',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.fieldType == 'boolean'",
                      label: '真值文字',
                      type: 'input-text',
                      placeholder: '请输入开启时开关显示的内容',
                      name: 'onText'
                    },
                    {
                      visibleOn: "this.fieldType == 'boolean'",
                      label: '假值文字',
                      type: 'input-text',
                      placeholder: '请输入关闭时开关显示的内容',
                      name: 'offText'
                    },
                    {
                      visibleOn: "this.fieldType == 'user'",
                      // "visibleOn": "this.type == 'user'",
                      // "visibleOn": "this.fieldType == 'user'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        },
                        {
                          label: '当前用户',
                          value: 'current_user'
                        }
                      ],
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'user' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.type == 'user' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType == 'user' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'select',
                      name: 'defaultValue',
                      id: 'peopleText',
                      clearable: true,
                      source: '${ss:userSelectList}',
                      // "source": {
                      //     "url": useDevBaseUrl("/system/user/list-all-simple"),
                      //     "method": "get",
                      //     "requestAdaptor": "",
                      //     "responseData": {
                      //         "options": "${items|pick:label~nickname,value~username}"
                      //     },
                      //     "adaptor": "",
                      //     "messages": {},
                      // },
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.fieldType == 'users'",
                      // "visibleOn": "this.type == 'users'",
                      // "visibleOn": "this.fieldType == 'users'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                        // {
                        //     "label": "表达式",
                        //     "value": "expression",
                        // }
                      ],
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'users' && defaultValueMode=='static'",
                      label: '',
                      // "type": "input-tag",
                      type: 'select',
                      placeholder: '请选择',
                      // "placeholder": "请输入/选择人员",
                      name: 'defaultValue',
                      clearable: true,
                      multiple: true,
                      value: '',
                      source: '${ss:userSelectList}',
                      // "source": {
                      //     "url": useDevBaseUrl("/system/user/list-all-simple"),
                      //     "method": "get",
                      //     "requestAdaptor": "",
                      //     "responseData": {
                      //         "options": "${items|pick:label~nickname,value~username}"
                      //     },
                      //     "adaptor": "",
                      //     "messages": {},
                      // },
                      options: [],
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'users' && defaultValueMode=='expression'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      value: '',
                      desc: '请确认SQL语句正确，否则会造成数据库问题。',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    //多行文本，识别录入先隐藏掉
                    // {
                    //     "visibleOn": "(this.fieldType == 'text')",
                    //     // "visibleOn": "(this.fieldType == 'textarea')",
                    //     "type": "switch",
                    //     "label": "识别录入",
                    //     "value": false,
                    //     "name": "enableOCR",
                    //     "desc": "允许用户通过拍照或者选择图片进行文字识别",
                    // },
                    {
                      visibleOn: "(this.fieldType =='formula')",
                      // "visibleOn": "(this.type =='formula')",
                      // "visibleOn": "(this.fieldType =='formula')",
                      label: '公式',
                      id: 'formulaId',
                      title: '条件添加',
                      required: true,
                      type: 'input-formula',
                      name: 'expression',
                      evalMode: true,
                      // "value": "IF(${fields[0].id})",
                      // "variables": "${fields}"
                      variables: '${ss:formulaData}'
                      // "variables": JSON.parse(sessionStorage.getItem('fieldCrud')!)
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='attachment' || this.fieldType =='image')",
                      // "visibleOn": "(this.type =='attachment' || this.type =='image')",
                      // "visibleOn": "(this.fieldType =='attachment' || this.fieldType =='image')",
                      label: '对象存储',
                      name: 'driver',
                      // "name": "objectStorage",
                      type: 'select',
                      value: 'default',
                      source: useDevBaseUrl('/app/file-config/list-all-simple'),
                      desc: '默认不选择将上传到系统配置指定的存储位置',
                      labelField: 'name',
                      valueField: 'code'
                      // "options": [],
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date-range' && (this.nullable || this.defaultValueMode=='static') && this.dbType == 'DATETIME') && this.defaultValueMode!='expression' && this.defaultValueMode!='null'",
                      required: true,
                      label: '默认值',
                      name: 'dateTimeDefaultValue',
                      type: 'input-datetime-range',
                      format: 'YYYY-MM-DD HH:mm:ss',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date-range' && (this.nullable || this.defaultValueMode=='static') && this.dbType == 'DATE') && this.defaultValueMode!='expression' && this.defaultValueMode!='null'",
                      required: true,
                      label: '默认值',
                      name: 'dateDefaultValue',
                      type: 'input-date-range',
                      format: 'YYYY-MM-DD',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date-range' && (this.nullable || this.defaultValueMode=='static') && this.dbType == 'TIME') && this.defaultValueMode!='expression' && this.defaultValueMode!='null'",
                      required: true,
                      label: '默认值',
                      name: 'timeDefaultValue',
                      type: 'input-time-range',
                      format: 'HH:mm:ss',
                      valueFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss',
                      validations: {
                        isHaveMo: true
                      }
                    },
                    // 日期范围
                    {
                      visibleOn: "(this.fieldType =='date-range')",
                      // "visibleOn": "(this.type =='date-range')",
                      // "visibleOn": "(this.fieldType =='date-range')",
                      label: '存储类型',
                      // "name": "storageType",
                      name: 'dbType',
                      type: 'button-group-select',
                      value: 'DATETIME',
                      desc: "${(dbType== 'DATETIME' ?'时间日期，包含时期和时间信息，没有时区信息。': dbType== 'DATE'? '只包含日期信息，不包含时间信息。': dbType== 'TIME'? '时间信息，不包含日期，没有时区信息。' :'' )}",
                      options: [
                        {
                          label: '日期时间',
                          value: 'DATETIME',
                          description:
                            '时间日期，包含时期和时间信息，没有时区信息。'
                        },
                        {
                          label: '日期',
                          value: 'DATE',
                          description: '只包含日期信息，不包含时间信息。'
                        },
                        {
                          label: '时间',
                          value: 'TIME',
                          description: '时间信息，不包含日期，没有时区信息。'
                        }
                      ],
                      "onEvent": {
                        "change": {
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                console.log(event,'eventeventevent')
                                if(event.data.value == 'DATETIME'){
                                  setTimeout(() => {
                                    doAction({
                                      actionType: 'setValue',
                                      componentName: 'dateTimeDefaultValue',
                                      args: {
                                        value: "2020-01-01 00:00:00,2999-01-01 23:59:59"
                                      }
                                    });
                                  },500)
                                } else if(event.data.value == 'DATE'){
                                  setTimeout(() => {
                                    doAction({
                                      actionType: 'setValue',
                                      componentName: 'dateDefaultValue',
                                      args: {
                                        value: "2020-01-01,2999-01-01"
                                      }
                                    });
                                  },500)
                                }else if(event.data.value == 'TIME'){
                                  setTimeout(() => {
                                    doAction({
                                      actionType: 'setValue',
                                      componentName: 'timeDefaultValue',
                                      args: {
                                        value: "00:00:00,23:59:59"
                                      }
                                    });
                                  },500)
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn:
                        "(this.defaultValueType == 'regular' && this.dbType == 'datetime' && this.fieldType =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'datetime' && this.type =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'datetime' && this.fieldType =='date')",
                      label: '',
                      type: 'input-datetime',
                      name: 'defaultValue'
                    },
                    {
                      visibleOn:
                        "(this.defaultValueType == 'regular' && this.dbType == 'time' && this.fieldType =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'time' && this.type =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'time' && this.fieldType =='date')",
                      label: '',
                      type: 'input-date',
                      name: 'defaultValue'
                    },
                    {
                      visibleOn:
                        "(this.defaultValueType == 'regular' && this.dbType == 'time' && this.fieldType =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'time' && this.type =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'time' && this.fieldType =='date')",
                      label: '',
                      type: 'input-time',
                      name: 'defaultValue'
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date' && this.format == 'datetime') || (this.fieldType =='date-range' && this.dbType == 'DATETIME')",
                      // "visibleOn": "(this.type =='date' && this.format == 'datetime') || (this.type =='date-range' && this.format == 'datetime')",
                      // "visibleOn": "(this.fieldType =='date' && this.format == 'datetime') || (this.fieldType =='date-range' && this.format == 'datetime')",
                      label: '最小值',
                      type: 'input-datetime',
                      // "name": "minValue",
                      name: 'minDateTime',
                      // "name": "minDate",
                      format: 'YYYY-MM-DD HH:mm:ss'
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date' && this.format == 'date') || (this.fieldType =='date-range' && this.dbType == 'DATE')",
                      // "visibleOn": "(this.type =='date' && this.format == 'date') || (this.type =='date-range' && this.format == 'date')",
                      // "visibleOn": "(this.fieldType =='date' && this.format == 'date') || (this.fieldType =='date-range' && this.format == 'date')",
                      label: '最小值',
                      type: 'input-date',
                      // "name": "minValue",
                      name: 'minDateDate',
                      // "name": "minDate",
                      format: 'YYYY-MM-DD'
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date' && this.format == 'time') || (this.fieldType =='date-range' && this.dbType == 'TIME')",
                      // "visibleOn": "(this.type =='date' && this.format == 'time') || (this.type =='date-range' && this.format == 'time')",
                      // "visibleOn": "(this.fieldType =='date' && this.format == 'time') || (this.fieldType =='date-range' && this.format == 'time')",
                      label: '最小值',
                      type: 'input-time',
                      // "name": "minValue",
                      name: 'minDateTimes',
                      // "name": "minDate",
                      format: 'HH:mm:ss',
                      valueFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss'
                    },
                    {
                      visibleOn: "this.fieldType == 'date-range'",
                      // "visibleOn": "this.type == 'date-range'",
                      // "visibleOn": "this.fieldType == 'date-range'",
                      // "visibleOn": "(this.fieldType =='date' || this.fieldType == 'date-range')",
                      label: '',
                      name: 'minDateMsg',
                      // "name": "minValueMessage",
                      type: 'input-text',
                      placeholder: '请输入提示信息'
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date'  && this.format == 'datetime') || (this.fieldType =='date-range' && this.dbType == 'DATETIME') ",
                      // "visibleOn": "(this.type =='date'  && this.format == 'datetime') || (this.type =='date-range' && this.format == 'datetime') ",
                      // "visibleOn": "(this.fieldType =='date'  && this.format == 'datetime') || (this.fieldType =='date-range' && this.format == 'datetime') ",
                      label: '最大值',
                      type: 'input-datetime',
                      // "name": "maxValue",
                      name: 'maxDateTime',
                      // "name": "maxDate",
                      format: 'YYYY-MM-DD HH:mm:ss'
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date'  && this.format == 'date') || (this.fieldType =='date-range' && this.dbType == 'DATE')",
                      // "visibleOn": "(this.type =='date'  && this.format == 'date') || (this.type =='date-range' && this.format == 'date')",
                      // "visibleOn": "(this.fieldType =='date'  && this.format == 'date') || (this.fieldType =='date-range' && this.format == 'date')",
                      label: '最大值',
                      type: 'input-date',
                      // "name": "maxValue",
                      name: 'maxDateDate',
                      // "name": "maxDate",
                      format: 'YYYY-MM-DD'
                    },
                    {
                      visibleOn:
                        "(this.fieldType =='date'  && this.format == 'time') || (this.fieldType =='date-range' && this.dbType == 'TIME')",
                      // "visibleOn": "(this.type =='date'  && this.format == 'time') || (this.type =='date-range' && this.format == 'time')",
                      // "visibleOn": "(this.fieldType =='date'  && this.format == 'time') || (this.fieldType =='date-range' && this.format == 'time')",
                      label: '最大值',
                      type: 'input-time',
                      // "name": "maxValue",
                      name: 'maxDateTimes',
                      // "name": "maxDate",
                      format: 'HH:mm:ss',
                      valueFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss'
                    },
                    {
                      visibleOn: "this.fieldType == 'date-range'",
                      // "visibleOn": "this.type == 'date-range'",
                      // "visibleOn": "this.fieldType == 'date-range'",
                      // "visibleOn": "(this.fieldType =='date' || this.fieldType == 'date-range')",
                      label: '',
                      type: 'input-text',
                      name: 'maxDateMsg',
                      // "name": "maxValueMessage",
                      placeholder: '请输入提示信息'
                    },
                    // {
                    //     "visibleOn": "(this.requiredFlag && this.fieldType == 'boolean')",
                    //     "label": "默认值",
                    //     "type": "switch",
                    //     "name": "defaultValue",
                    //     "onText": "TRUE",
                    //     "offText": "FALSE"
                    // },
                    {
                      visibleOn: "(this.fieldType == 'enum')",
                      // "visibleOn": "(this.type == 'enum')",
                      // "visibleOn": "(this.fieldType == 'enum')",
                      type: 'select',
                      label: '选项值',
                      name: 'options',
                      // "name": "enumSelect",
                      value: 'custom',
                      options: [
                        {
                          label: '自定义选项',
                          value: 'custom'
                        },
                        {
                          label: '数据字典',
                          value: 'dictionaries'
                        }
                      ]
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'enum' && this.options == 'custom' && this.valueType == 'VARCHAR'",
                      name: 'addOptions',
                      label: '',
                      type: 'input-array',
                      draggable: true,
                      required: true,
                      addButtonText: '新增选项',
                      items: {
                        type: 'combo',
                        name: 'combination',
                        label: false,
                        items: [
                          {
                            name: 'label',
                            label: false,
                            type: 'input-text',
                            placeholder: '文本'
                          },
                          {
                            name: 'value',
                            label: false,
                            type: 'input-text',
                            placeholder: '数值'
                          }
                        ]
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'enum' && this.options == 'custom' && this.valueType == 'INTEGER'",
                      name: 'addOptions',
                      label: '',
                      required: true,
                      type: 'input-array',
                      draggable: true,
                      addButtonText: '新增选项',
                      items: {
                        type: 'combo',
                        name: 'combination',
                        label: false,
                        items: [
                          {
                            name: 'label',
                            label: false,
                            type: 'input-text',
                            placeholder: '文本'
                          },
                          {
                            name: 'value',
                            label: false,
                            type: 'input-number',
                            big: true,
                            placeholder: '数值'
                          }
                        ]
                      }
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'enum' && this.options == 'custom'",
                      // "visibleOn": "this.type == 'enum' && this.options == 'custom'",
                      // "visibleOn": "this.fieldType == 'enum' && this.options == 'custom'",
                      label: '值类型',
                      type: 'select',
                      // "name": "dbType",
                      value: 'VARCHAR',
                      name: 'valueType',
                      options: [
                        {
                          label: '文本',
                          value: 'VARCHAR'
                        },
                        {
                          label: '数字',
                          value: 'INTEGER'
                        }
                      ],
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'setValue',
                              componentName: 'addOptions',
                              args: {
                                value: []
                              }
                            },
                            {
                              actionType: 'setValue',
                              componentName: 'defaultValue',
                              args: {
                                value: ''
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      "type": "flex",
                      visibleOn:
                        "this.fieldType == 'enum' && this.options == 'dictionaries'",
                      "items": [
                        {
                          "type": "container",
                          "body": [
                            {
                              type: 'input-text',
                              name: 'source',
                              id: 'ziTree',
                              required: true,
                              readOnly: true
                            }
                          ],
                          "size": "none",
                          "style": {
                            "position": "static",
                            "display": "block",
                            "flex": "1 1 auto",
                            "flexGrow": 1,
                            "flexBasis": "80%"
                          },
                          "wrapperBody": false,
                          "isFixedHeight": false,
                          "isFixedWidth": false,
                        },
                        {
                          "type": "container",
                          "body": [
                            {
                              type: 'button',
                              label: '',
                              icon: 'fa fa-inbox',
                              actionType: 'dialog',
                              dialog: {
                                type: 'dialog',
                                title: '选择字典',
                                id: 'dictionDialog',
                                body: [
                                  {
                                    type: 'input-tree',
                                    name: 'tree',
                                    // "label": "Tree",
                                    onlyLeaf: true,
                                    searchable: true,
                                    // "labelField":"name",
                                    // "valueField":"name",
                                    // "tag": "数字",
                                    // "menuTpl": "<div class='flex justify-between'><span>${label}</span><span class='bg-gray-200 rounded p-1 text-xs text-center w-14'>${dbType}</span></div>",
                                    source: {
                                      url: useDevBaseUrl('/app/dict-type/list-all'),
                                      method: 'get',
                                      requestAdaptor: '',
                                      responseData: {
                                        options:
                                          '${items|pick:label~name,value~name}'
                                        // "options": "${items|pick:label~name,value~id}"
                                      },
                                      adaptor: '',
                                      messages: {}
                                    }
                                  }
                                ],
                                showCloseButton: true,
                                showErrorMsg: true,
                                showLoading: true,
                                className: 'app-popover',
                                closeOnEsc: false,
                                actions: [
                                  {
                                    type: 'button',
                                    label: '取消',
                                    close: true
                                  },
                                  {
                                    level: 'info',
                                    type: 'button',
                                    label: '确认',
                                    close: false,
                                    onEvent: {
                                      click: {
                                        actions: [
                                          {
                                            actionType: 'custom',
                                            script: function (_: any,doAction: any,event: any) {
                                              if (
                                                event.data.tree === true &&
                                                event.data.tree !== '1'
                                              ) {
                                                return toast.error('请选择字典', {
                                                  position: 'top-center'
                                                });
                                              }
                                              if (
                                                event.data.tree === false &&
                                                event.data.tree !== '0'
                                              ) {
                                                return toast.error('请选择字典', {
                                                  position: 'top-center'
                                                });
                                              }
                                              let dataType;
                                              dictionaryList.forEach((res: any) => {
                                                if (event.data.tree == res.name) {
                                                  if (res.dbType == 0) {
                                                    dataType = 'VARCHAR';
                                                  }
                                                  if (res.dbType == 1) {
                                                    dataType = 'INTEGER';
                                                  }
                                                }
                                              });
                                              console.log(dataType,'dataTypedataTypedataType');
                                              doAction({
                                                actionType: 'setValue',
                                                componentName: 'valueType',
                                                args: {
                                                  value: dataType
                                                }
                                              });
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'ziTree',
                                                args: {
                                                  value: event.data.tree
                                                }
                                              });
                                              doAction({
                                                actionType: 'close',
                                                componentId: 'dictionDialog'
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                                ]
                              }
                            }
                          ],
                          "size": "none",
                          "style": {
                            "position": "static",
                            "display": "block",
                            "flex": "1 1 auto",
                            "flexGrow": 1,
                            "flexBasis": "5%",
                            "marginLeft":"-15px"
                          },
                          "wrapperBody": false,
                          "isFixedHeight": false,
                          "isFixedWidth": false,
                        }
                      ],
                      "style": {
                        "position": "relative",
                        "rowGap": "0px",
                        "columnGap": "0px",
                        "flexWrap": "nowrap",
                        "maxWidth": "100%",
                        "inset": "auto",
                        "marginBottom":"20px"
                      },
                      "isFixedHeight": false,
                      "isFixedWidth": false
                    },
                    // {
                    //   visibleOn:
                    //     "this.fieldType == 'enum' && this.options == 'dictionaries'",
                    //   // "visibleOn": "this.type == 'enum' && this.options == 'dictionaries'",
                    //   // "visibleOn": "this.fieldType == 'enum' && this.options == 'dictionaries'",
                    //   label: '',
                    //   required: true,
                    //   name: 'source',
                    //   // "name": "defaultValue",
                    //   type: 'input-group',
                    //   body: [
                    //     {
                    //       type: 'input-text',
                    //       name: 'source',
                    //       id: 'ziTree',
                    //       required: true,
                    //       readOnly: true
                    //       // "inputClassName": "b-r-none p-r-none"
                    //       // "name": "defaultValue"
                    //     },
                    //     {
                    //       type: 'button',
                    //       label: '',
                    //       icon: 'fa fa-inbox',
                    //       actionType: 'dialog',
                    //       dialog: {
                    //         type: 'dialog',
                    //         title: '选择字典',
                    //         id: 'dictionDialog',
                    //         body: [
                    //           {
                    //             type: 'input-tree',
                    //             name: 'tree',
                    //             // "label": "Tree",
                    //             onlyLeaf: true,
                    //             searchable: true,
                    //             // "labelField":"name",
                    //             // "valueField":"name",
                    //             // "tag": "数字",
                    //             // "menuTpl": "<div class='flex justify-between'><span>${label}</span><span class='bg-gray-200 rounded p-1 text-xs text-center w-14'>${dbType}</span></div>",
                    //             source: {
                    //               url: useDevBaseUrl('/app/dict-type/list-all'),
                    //               method: 'get',
                    //               requestAdaptor: '',
                    //               responseData: {
                    //                 options:
                    //                   '${items|pick:label~name,value~name}'
                    //                 // "options": "${items|pick:label~name,value~id}"
                    //               },
                    //               adaptor: '',
                    //               messages: {}
                    //             }
                    //           }
                    //         ],
                    //         showCloseButton: true,
                    //         showErrorMsg: true,
                    //         showLoading: true,
                    //         className: 'app-popover',
                    //         closeOnEsc: false,
                    //         actions: [
                    //           {
                    //             type: 'button',
                    //             label: '取消',
                    //             close: true
                    //           },
                    //           {
                    //             level: 'info',
                    //             type: 'button',
                    //             label: '确认',
                    //             close: false,
                    //             onEvent: {
                    //               click: {
                    //                 actions: [
                    //                   {
                    //                     actionType: 'custom',
                    //                     script: function (_: any,doAction: any,event: any) {
                    //                       if (
                    //                         event.data.tree === true &&
                    //                         event.data.tree !== '1'
                    //                       ) {
                    //                         return toast.error('请选择字典', {
                    //                           position: 'top-center'
                    //                         });
                    //                       }
                    //                       if (
                    //                         event.data.tree === false &&
                    //                         event.data.tree !== '0'
                    //                       ) {
                    //                         return toast.error('请选择字典', {
                    //                           position: 'top-center'
                    //                         });
                    //                       }
                    //                       let dataType;
                    //                       dictionaryList.forEach((res: any) => {
                    //                         if (event.data.tree == res.name) {
                    //                           if (res.dbType == 0) {
                    //                             dataType = 'VARCHAR';
                    //                           }
                    //                           if (res.dbType == 1) {
                    //                             dataType = 'INTEGER';
                    //                           }
                    //                         }
                    //                       });
                    //                       console.log(dataType,'dataTypedataTypedataType');
                    //                       doAction({
                    //                         actionType: 'setValue',
                    //                         componentName: 'valueType',
                    //                         args: {
                    //                           value: dataType
                    //                         }
                    //                       });
                    //                       doAction({
                    //                         actionType: 'setValue',
                    //                         componentId: 'ziTree',
                    //                         args: {
                    //                           value: event.data.tree
                    //                         }
                    //                       });
                    //                       doAction({
                    //                         actionType: 'close',
                    //                         componentId: 'dictionDialog'
                    //                       });
                    //                     }
                    //                   }
                    //                 ]
                    //               }
                    //             }
                    //           }
                    //         ]
                    //       }
                    //     }
                    //   ]
                    // },
                    {
                      visibleOn:
                        "this.fieldType == 'enum' && this.options == 'dictionaries'",
                      label: '值类型',
                      type: 'select',
                      // "name": "dbType",
                      value: 'VARCHAR',
                      disabled: true,
                      name: 'valueType',
                      options: [
                        {
                          label: '文本',
                          value: 'VARCHAR'
                        },
                        {
                          label: '数字',
                          value: 'INTEGER'
                        }
                      ]
                    },
                    {
                      visibleOn: "(this.fieldType == 'password')",
                      // "visibleOn": "(this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'password')",
                      // "visibleOn": "(this.advanced == 'password')",
                      label: '加盐',
                      type: 'input-text',
                      name: 'salt',
                      required: true,
                      desc: '数据存储使用MD5加密算法，盐值混合内容方式为：{盐}.{文本}，然后将哈希值的字节数组转换为十六进制字符串，用于内容的加密和解码。'
                    },
                    {
                      visibleOn: "(this.fieldType == 'ciphertext')",
                      label: '长度',
                      placeholder: '请输入长度',
                      type: 'input-number',
                      name: 'length',
                      required: true,
                      value: 1000,
                      big: true,
                      min: 0,
                      max: 16000,
                      resetValue: 1000,
                      desc: '所用表类型的最大行大小（不包括BLOB）为65535'
                    },
                    {
                      visibleOn: "(this.fieldType == 'ciphertext')",
                      // "visibleOn": "(this.type == 'ciphertext')",
                      // "visibleOn": "(this.fieldType == 'ciphertext')",
                      // "visibleOn": "(this.advanced == 'ciphertext')",
                      label: '密钥',
                      placeholder: '请输入密钥',
                      type: 'input-text',
                      name: 'token',
                      // "name": "secretKey",
                      required: true,
                      desc: '数据存储使用AES/CBC/NoPadding加密算法;64位密钥基于输入的文本，使用SHA-256算法生成，用于内容的加密和解码。',
                      validations: {
                        tokenValidations: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'text' || this.fieldType == 'int' || this.fieldType == 'bigint')",
                      // "visibleOn": "(this.type == 'text' || this.type == 'int' || this.type == 'bigint')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'int' || this.fieldType == 'bigint')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'int' || this.fieldType == 'bigint' || this.advanced == 'ciphertext')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType == 'money'  || this.advanced == 'password' || this.advanced == 'ciphertext'  )",
                      type: 'switch',
                      label: '是否唯一',
                      value: false,
                      name: 'unique'
                    },
                    // {
                    //     "visibleOn": "(this.fieldType == 'varchar' || this.fieldType == 'text' || this.fieldType == 'rich-text' || this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType == 'float' || this.fieldType == 'money' || this.fieldType == 'enum' || this.fieldType == 'boolean' || this.fieldType == 'date' || this.fieldType == 'dataTime' || this.advanced == 'password' || this.fieldType == 'date-range')",
                    //     "type": "switch",
                    //     "label": "是否可搜",
                    //     "value": true,
                    //     "name": "enableSearch",
                    // },
                    {
                      visibleOn: "(this.fieldType == 'department')",
                      label: '字段类型',
                      type: 'combo',
                      items: [
                        {
                          name: 'textType',
                          type: 'tag',
                          label: '部门信息',
                          displayMode: 'normal',
                          color: 'active'
                        }
                      ]
                    },
                    {
                      visibleOn:
                        "((this.fieldType == 'department') && this.defaultValueMode=='static')",
                      label: '默认值',
                      type: 'tree-select',
                      // "type": "select",
                      name: 'defaultValue',
                      searchable: true,
                      clearable: true,
                      // "required": true,
                      source: '${ss:userSelectList}',
                      // "source": {
                      //     "url": useDevBaseUrl("/system/dept/list-all-simple"),
                      //     "method": "get",
                      //     "requestAdaptor": "",
                      //     // "responseData": {
                      //     //     "options": "${items|pick:label~label,value~username}"
                      //     // },
                      //     "adaptor": "",
                      //     "messages": {},
                      // },
                      validations: {
                        isHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.fieldType == 'int'",
                      // "visibleOn": "this.type == 'int'",
                      // "visibleOn": "this.fieldType == 'int'",
                      label: '整数类型',
                      type: 'select',
                      name: 'integerType',
                      // "name": "dbType",
                      value: 'INT',
                      options: [
                        {
                          label: '整型',
                          value: 'INT'
                        },
                        {
                          label: '长整型',
                          value: 'BIGINT'
                        }
                      ]
                    },
                    {
                      visibleOn:"this.fieldType == 'serial-number'",
                      "type": "input-text",
                      "label": "组合规则",
                      "id": "combinationRules",
                      "name": "combinationRules",
                      "value": "$rules",
                      "static": true
                    },
                    {
                      visibleOn:"this.fieldType == 'serial-number'",
                      validations: {
                        isRulesVal: true
                      },
                      "type": "combo",
                      "name": "rules",
                      "strictMode":false,
                      "label": "",
                      "addButtonText":"添加规则",
                      "multiLine": false,
                      "multiple": true,
                      "typeSwitchable": false,
                      "value": [
                          {
                            "type": "date",
                            "format": "yyyy"
                          },
                          {
                            "type": "auto-increase",
                            "options": {
                              "start": 1,
                              "length": 3,
                              "rrule": "none"
                            }
                          }
                      ],
                      "draggable": true,
                      "conditions": [
                        {
                          "label": "文本字符",
                          "test": "this.type === \"text\"",
                          "scaffold": {
                            "type": "text",
                            "text": ""
                          },
                          "items": [
                            {
                              "label": "文本字符",
                              "name": "text",
                              "type": "input-text",
                              "onEvent": {
                                "change": {
                                  "weight": 0,
                                  "actions": [
                                    {
                                      actionType: 'custom',
                                      script: function(_: any, doAction: any, event: any) {
                                          let rulesArr:any = []
                                          event.data.rules.forEach((rule: any,inde:number) => {
                                            if(inde == event.data.index){
                                              rulesArr.push({...rule,text:event.data.text})
                                            }else{
                                              rulesArr.push(rule)
                                            }
                                          })
                                          console.log(rulesArr,'rulesArrrulesArr')
                                          let lastData =  getRulesNumber(rulesArr)
                                        console.log(lastData,'lastData')
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'combinationRules',
                                          args: {
                                            value: lastData.join('')
                                          }
                                        });
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        },
                        {
                          "label": "创建时间",
                          "test": "this.type === \"date\"",
                          "scaffold": {
                            "type": "date",
                            "format": "yyyy"
                          },
                          "items": [
                            {
                              "name": "format",
                              "label": "创建时间",
                              "type": "select",
                              "options": [
                                {
                                  "label": "年（YYYY）",
                                  "value": "yyyy"
                                },{
                                  "label": "年月",
                                  "value": "yyyyMM"
                                },{
                                  "label": "年月日",
                                  "value": "yyyyMMdd"
                                },{
                                  "label": "年（YY）",
                                  "value": "yy"
                                },{
                                  "label": "月",
                                  "value": "MM"
                                },{
                                  "label": "日",
                                  "value": "dd"
                                },{
                                  "label": "年月日时",
                                  "value": "yyyyMMddHH"
                                },{
                                  "label": "年月日时分",
                                  "value": "yyyyMMddHHmm"
                                },{
                                  "label": "年月日时分秒",
                                  "value": "yyyyMMddHHmmss"
                                }
                              ],
                              "onEvent": {
                                "change": {
                                  "weight": 0,
                                  "actions": [
                                    {
                                      actionType: 'custom',
                                      script: function(_: any, doAction: any, event: any) {
                                        console.log(event,'event创建时间')
                                        let rulesArr:any = []
                                        event.data.rules.forEach((rule: any,inde:number) => {
                                          if(inde == event.data.index){
                                            rulesArr.push({...rule,format:event.data.format})
                                          }else{
                                            rulesArr.push(rule)
                                          }
                                        })
                                        console.log(rulesArr,'rulesArrrulesArr')
                                        let lastData = getRulesNumber(rulesArr)
                                        console.log(lastData,'lastData')
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'combinationRules',
                                          args: {
                                            value: lastData.join('')
                                          }
                                        });
                                      }
                                    }
                                  ]
                                }
                              }
                            },
                          ]
                        },
                        {
                          "label": "自动编码",
                          "test": "this.type === \"auto-increase\"",
                          "maxLength": 1,
                          "scaffold": {
                            "type": "auto-increase",
                            "options":{
                              "start": 1,
                              "length": 3,
                              "rrule":"none"
                            }
                          },
                          "items": [
                            {
                              "type": "input-sub-form",
                              "name": "options",
                              "label": "自动编码",
                              "btnLabel": "设置",
                              "validateOnChange": true,
                              "form": {
                                "title": "编号设置",
                                "body": [
                                  {
                                    "name": "start",
                                    "label": "起始值",
                                    "type": "input-number"
                                  },
                                  {
                                    "name": "length",
                                    "label": "固定位数",
                                    "type": "input-number"
                                  },
                                  {
                                    "name":"rrule",
                                    "label":"重复规则",
                                    "type": "select",
                                    "options": [
                                      {
                                        "label": "不重复",
                                        "value": "none"
                                      },{
                                        "label": "每天重复",
                                        "value": "daily"
                                      },{
                                        "label": "每周重复",
                                        "value": "weekly"
                                      },{
                                        "label": "每月重复",
                                        "value": "monthly"
                                      },{
                                        "label": "每季重复",
                                        "value": "quarterly"
                                      },{
                                        "label": "每年重复",
                                        "value": "yearly"
                                      },{
                                        "label": "不同字段值重复",
                                        "value": "fieldValuely"
                                      },
                                    ],
                                    "onEvent": {
                                      "change": {
                                        "actions": [
                                          {
                                            "actionType": "custom",
                                            script: function (_: any, doAction: any, event: any) {
                                              let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                              //排除系统字段 1-9
                                              let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                                              //排除关系字段type = relation
                                              let relList = sysList.filter((res: any) => (res.type != 'relation'|| (res.type === 'relation' && res.relationMode === 1)))
                                              //排除父级字段
                                              let parList = relList.filter((res: any) => (res.type != 'parent'))
                                              //排除流水号
                                              let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                                              //排除非必填的
                                              let nullList = serList.filter((res: any) => (res.nullable == false))
                                              //排除外键
                                              let foreignKeyList = nullList.filter((res: any) => (res.foreignKeyFlag == false))
                                              sessionStorage.setItem('serialRepeatField', JSON.stringify(foreignKeyList))
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  {
                                    "name":"fieldKey",
                                    "label":"识别字段",
                                    "type": "select",
                                    "visibleOn": "${rrule=='fieldValuely'}",
                                    "labelField": "name",
                                    "valueField": "code",
                                    "required": true,
                                    "source": "${ss:serialRepeatField}"
                                  }
                                ],
                                "actions": [
                                  {
                                    "type": "submit",
                                    "label": "提交",
                                    "primary": true,
                                    "onEvent": {
                                      "click": {
                                        "weight": 0,
                                        "actions": [
                                          {
                                            actionType: 'custom',
                                            script: function(_: any, doAction: any, event: any) {
                                              console.log(event,'event自动编码')
                                              let rulesArr:any = []
                                              event.data.rules.forEach((rule: any,inde:number) => {
                                                if(inde == event.data.index){
                                                  rulesArr.push({...rule,options: {
                                                      "start": event.data.start,
                                                      "length": event.data.length,
                                                      "rrule": event.data.rrule
                                                    }})
                                                }else{
                                                  rulesArr.push(rule)
                                                }
                                              })
                                              console.log(rulesArr,'rulesArrrulesArr')
                                              let lastData = getRulesNumber(rulesArr)
                                              console.log(lastData,'lastData')
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'combinationRules',
                                                args: {
                                                  value: lastData.join('')
                                                }
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }

                                  }
                                ]
                              },
                            }
                          ]
                        },
                        {
                          "label": "字段文本",
                          "test": "this.type === \"field\"",
                          "scaffold": {
                            "type": "field",
                            "fieldCode": ""
                          },
                          "items": [
                            {
                              "name": "fieldCode",
                              "label": "字段文本",
                              "type": "input-sub-form",
                              "btnLabel": "设置",
                              "validateOnChange": true,
                              "form": {
                                "title": "字段文本设置",
                                "onEvent": {
                                  "inited": {
                                  "actions": [
                                    {
                                      "actionType": "custom",
                                      "script": async function(_, doAction, event){
                                        console.log(2081, event)
                                        console.log(2082, _)
                                        const data = JSON.parse(sessionStorage.getItem('fieldTextList'))
                                        const selected = data.filter(i=>i.code == event.data.fieldCode)
                                        console.log(2085, selected)
                                        if(selected && selected[0].type == 'relation') {
                                          doAction({
                                            actionType: 'show',
                                            componentId: 'relationField'
                                          });
                                          let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                          const filterRelation = affData.filter(i=>i.code == event.data.fieldCode)
                                          let targetKey=''
                                          if(filterRelation && filterRelation.length > 0) {
                                            targetKey = filterRelation[0].targetKey
                                            const res = await getColumnSelect(targetKey)
                                            //除了系统字段、关系字段、json、图片、附件以外的字段
                                            let data = res.data.data
                                            //排除系统字段 1-9
                                            let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                                            //排除关系字段type = relation
                                            let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                                            //排除父级字段
                                            let parList = relList.filter((res: any) => (res.type != 'parent'))
                                            //排除流水号
                                            let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                                            //排除外键
                                            let foreignKeyList = serList.filter((res: any) => (res.foreignKeyFlag == false))
                                            //排除json
                                            let jsonList = foreignKeyList.filter((res: any) => (res.type != 'json'))
                                            //排除图片
                                            let picList = jsonList.filter((res: any) => (res.type != 'image'))
                                            //排除附件
                                            let attachList = picList.filter((res: any) => (res.type != 'attachment'))
                                            sessionStorage.setItem('relationField', JSON.stringify(attachList))
                                          }
                                        } else {
                                          doAction({
                                            actionType: 'clear',
                                            componentId: 'relationField',
                                          });
                                          setTimeout(()=>{
                                            doAction({
                                              actionType: 'hidden',
                                              componentId: 'relationField'
                                            });
                                          },300)
                                        }
                                      }
                                    }
                                  ]
                                },
                                },
                                "body": [
                                  {
                                    "name":"fieldCode",
                                    "label":"字段文本",
                                    "type": "select",
                                    "required": true,
                                    "source": "${ss:fieldTextList}",
                                    "onEvent": {
                                      "change": {
                                        "actions": [
                                          {
                                            "actionType": "custom",
                                            script: async function (_: any, doAction: any, event: any) {
                                              const selected = event.data.options.filter(i=>i.code == event.data.fieldCode)
                                              if(selected && selected[0].type == 'relation') {
                                                doAction({
                                                  actionType: 'show',
                                                  componentId: 'relationField'
                                                });
                                                let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                                const filterRelation = affData.filter(i=>i.code == event.data.fieldCode)
                                                let targetKey=''
                                                if(filterRelation && filterRelation.length > 0) {
                                                  targetKey = filterRelation[0].targetKey
                                                  const res = await getColumnSelect(targetKey)
                                                  //除了系统字段、关系字段、json、图片、附件以外的字段
                                                  let data = res.data.data
                                                  //排除系统字段 1-9
                                                  let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                                                  //排除关系字段type = relation
                                                  let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                                                  //排除父级字段
                                                  let parList = relList.filter((res: any) => (res.type != 'parent'))
                                                  //排除流水号
                                                  let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                                                  //排除外键
                                                  let foreignKeyList = serList.filter((res: any) => (res.foreignKeyFlag == false))
                                                  //排除json
                                                  let jsonList = foreignKeyList.filter((res: any) => (res.type != 'json'))
                                                  //排除图片
                                                  let picList = jsonList.filter((res: any) => (res.type != 'image'))
                                                  //排除附件
                                                  let attachList = picList.filter((res: any) => (res.type != 'attachment'))
                                                  sessionStorage.setItem('relationField', JSON.stringify(attachList))
                                                }
                                              } else {
                                                doAction({
                                                  actionType: 'clear',
                                                  componentId: 'relationField',
                                                });
                                                setTimeout(()=>{
                                                  doAction({
                                                    actionType: 'hidden',
                                                    componentId: 'relationField'
                                                  });
                                                },300)
                                              }
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  {
                                    "name":"relationField",
                                    "id": "relationField",
                                    "label":"关系表字段",
                                    "type": "select",
                                    "labelField": "name",
                                    "valueField": "code",
                                    "required": true,
                                    "visibleOn": "${fieldCode}",
                                    "source": "${ss:relationField}"
                                  }
                                ],
                                "actions": [
                                  {
                                    "type": "submit",
                                    "label": "提交",
                                    "primary": true,
                                    "onEvent": {
                                      "click": {
                                        "weight": 0,
                                        "actions": [
                                          {
                                            actionType: 'custom',
                                            script: function(_: any, doAction: any, event: any) {
                                              let rulesArr:any = []
                                              event.data.rules.forEach((rule: any,inde:number) => {
                                                if(inde == event.data.index){
                                                  rulesArr.push({...rule,fieldCode: {
                                                    "fieldCode": event.data.fieldCode,
                                                    "relationField": event.data.relationField,
                                                  }})
                                                }else{
                                                  rulesArr.push(rule)
                                                }
                                              })
                                              let lastData = getRulesNumber(rulesArr)
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'combinationRules',
                                                args: {
                                                  value: lastData.join('')
                                                }
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }

                                  }
                                ]
                              },
                            },
                          ]
                        }
                      ],
                      "items": [],
                      "onEvent": {
                        "delete":{
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                let rulesArr:any = event.data.rules.filter((res,index)=>{
                                  return index != event.data.key
                                })
                                let lastData =  getRulesNumber(rulesArr)
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'combinationRules',
                                  args: {
                                    value: lastData.join('')
                                  }
                                });
                                const rrule = rulesArr.filter(i=>i.type=='auto-increase').lengh > 0 ? rulesArr.filter(i=>i.type=='auto-increase')[0].options.rrule : ''
                                if(rrule == '') {
                                  doAction({ "actionType": "enabled", "componentId": "dateFieldAdd" })
                                  doAction({ "actionType": "show", "componentId": "expireTime_select" })
                                } else {
                                  if(rrule == 'fieldValuely' || rrule == 'none') {
                                    doAction({ "actionType": "disabled", "componentId": "dateFieldAdd" })
                                    doAction({ "actionType": "hidden", "componentId": "expireTime_select" })
                                    doAction({
                                      actionType: "setValue",
                                      componentId: "dateFieldAdd",
                                      args: {
                                        value: ''
                                      }
                                    })
                                    doAction({
                                      actionType: "setValue",
                                      componentId: "expireTime_select",
                                      args: {
                                        value: ''
                                      }
                                    })
                                  } else {
                                    doAction({ "actionType": "enabled", "componentId": "dateFieldAdd" })
                                    doAction({ "actionType": "show", "componentId": "expireTime_select" })
                                  }
                                }
                                sessionStorage.setItem('rrule',JSON.stringify(rrule));
                              }
                            }
                          ]
                        },
                        "dragEnd":{
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                let lastData =  getRulesNumber(event.data.rules)
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'combinationRules',
                                  args: {
                                    value: lastData.join('')
                                  }
                                });
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn:"this.fieldType == 'serial-number'",
                      label: '日期识别字段',
                      type: 'select',
                      name: 'parsedDateField',
                      labelField: 'name',
                      valueField: 'code',
                      searchable: true,
                      clearable: true,
                      id: "dateFieldAdd",
                      source: '${ss:dateFieldList}',
                      "onEvent": {
                        "change": {
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                console.log(event,'日期识别字段event');
                                if(event.data.selectedItems.type === "text"){
                                  doAction({
                                    actionType: 'show',
                                    componentId: 'parsedDateFormat'
                                  });
                                }else{
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'parsedDateFormat',
                                    args: {
                                      value: ''
                                    }
                                  });
                                  doAction({
                                    actionType: 'hidden',
                                    componentId: 'parsedDateFormat'
                                  });
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn: "this.fieldType == 'serial-number'",
                      label: '日期识别格式',
                      type: 'input-text',
                      name: 'parsedDateFormat',
                      id: 'parsedDateFormat',
                    },
                    {
                      "visibleOn": "this.fieldType == 'serial-number'",
                      "type": "select",
                      "name": "expireTime",
                      "id": "expireTime_select",
                      "label": "定时清理记录日志",
                      "required": true,
                      "value": 12,
                      "options": [
                        {
                          "label": "不清空",
                          "value": 0
                        },
                        {
                          "label": "1个月之前",
                          "value": 1
                        },
                        {
                          "label": "2个月之前",
                          "value": 2
                        },
                        {
                          "label": "3个月之前",
                          "value": 3
                        },
                        {
                          "label": "半年之前",
                          "value": 6
                        },
                        {
                          "label": "1年之前",
                          "value": 12
                        },
                        {
                          "label": "2年之前",
                          "value": 24
                        },
                        {
                          "label": "3年之前",
                          "value": 36
                        },
                        {
                          "label": "5年之前",
                          "value": 60
                        },
                        {
                          "label": "10年之前",
                          "value": 120
                        },
                      ]
                    },
                    {
                      hiddenOn:
                        "this.fieldType == 'formula'",
                      // "hiddenOn": "(this.type == 'serial_number' || this.type == 'formula' || this.relation == 'one_more' || this.relation == 'more_more')",
                      // "hiddenOn": "(this.fieldType == 'serial_number' || this.fieldType == 'formula' || this.relation == 'one_more' || this.relation == 'more_more')",
                      // "hiddenOn": "(this.advanced == 'serial_number' || this.fieldType == 'formula' || this.relation == 'one_more' || this.relation == 'more_more')",
                      type: 'switch',
                      label: '允许空值',
                      // value: false,
                      "value": true,
                      // "falseValue": true,
                      // "trueValue": false,
                      // "name": "requiredFlag",
                      name: 'nullable',
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log(_, '允许空值__');
                                console.log(
                                  doAction,
                                  '允许空值doActiondoAction'
                                );
                                console.log(event, '允许空值eventevent');
                                if (event.data.value) {
                                  if (
                                    (event.data.fieldType == 'user' ||
                                      event.data.fieldType == 'users') &&
                                    event.data.defaultValueMode == 'static'
                                  ) {
                                    let asd = JSON.parse(sessionStorage.getItem('userSelectList')!);
                                    // asd.unshift({
                                    //     label: '无',
                                    //     value: ''
                                    // })
                                    console.log(asd, 'asdasdasdasd');
                                    sessionStorage.setItem('userSelectList',JSON.stringify(asd));
                                    doAction({
                                      actionType: 'reload',
                                      componentId: 'peopleText'
                                    });
                                  }
                                  if (
                                    event.data.fieldType == 'department' &&
                                    event.data.defaultValueMode == 'static'
                                  ) {
                                    let asd = JSON.parse(sessionStorage.getItem('userSelectList')!);
                                    // asd.unshift({
                                    //     label: '无',
                                    //     value: ''
                                    // })
                                    console.log(asd, 'asdasdasdasd');
                                    sessionStorage.setItem('userSelectList',JSON.stringify(asd));
                                    doAction({
                                      actionType: 'reload',
                                      componentId: 'peopleText'
                                    });
                                  }
                                } else {
                                  //     doAction({
                                  //         actionType: "setValue", componentName: "defaultValueMode", "args": {
                                  //             "value": 'null'
                                  //         }
                                  //     });
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn: "this.fieldType == 'serial-number'",
                      type: 'switch',
                      label: '是否忽略租户',
                      value: false,
                      name: 'colIgnoreTenant',
                      id: 'addColIgnoreTenant',
                    },
                    {
                      visibleOn:"this.fieldType =='time' || this.fieldType =='datetime'",
                      required: true,
                      label: '精度',
                      type: 'input-number',
                      name: 'precision',
                      value: 0,
                      min: 0,
                      max: 6,
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (_: any,doAction: any,event: any) {
                                if(!isPrecisionChange){
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'showPrecision',
                                    args: {
                                      value: 'precision' in event.data ? event.data.precision:''
                                    }
                                  });
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn:"this.fieldType =='time' || this.fieldType =='datetime'",
                      required: true,
                      label: '显示精度',
                      type: 'input-number',
                      name: 'showPrecision',
                      id: 'showPrecision',
                      value: 0,
                      desc: "${IFS(fieldType =='time' ,'因为Javascript的Date对象仅能存储亳秒级精度，所以时间组件只支持到毫秒，如需更高精度，可手动修改为文本框。')}${IFS(fieldType =='datetime' ,'因为Javascript的Date对象仅能存储亳秒级精度，所以日期时间组件只支持到毫秒，如需更高精度，可手动修改为文本框。')} ",
                      min: 0,
                      max: 6,
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (_: any,doAction: any,event: any) {
                                isPrecisionChange = true
                                if(event.data.showPrecision == ''){
                                  isPrecisionChange = false
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn:  "(this.fieldType == 'time' || this.fieldType == 'datetime') && this.precision > 3",
                      type: 'switch',
                      label: '兼容模式',
                      value: true,
                      name: 'precisionCompatible',
                      id: 'precisionCompatible',
                      desc: '开启兼容模式时，仅支持到毫秒，如需更高精度，请关闭兼容模式，前端将变为文本框'
                    },
                    {
                      visibleOn:"this.fieldType =='datetime'",
                      label: '数据库类型',
                      type: 'select',
                      name: 'dbType',
                      required: true,
                      value: 'DATETIME',
                      options: [
                        {
                          label: '日期时间',
                          value: 'DATETIME'
                        },
                        {
                          label: '时间戳',
                          value: 'TIMESTAMP',
                        }
                      ]
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'address' || this.fieldType == 'position' )",
                      // "visibleOn": "(this.type == 'address' || this.type == 'position' )",
                      // "visibleOn": "(this.fieldType == 'address' || this.fieldType == 'position' )",
                      // "visibleOn": "(this.advanced == 'address' || this.advanced == 'position' )",
                      type: 'switch',
                      label: '记录城市',
                      value: true,
                      name: 'cityRecord'
                    },
                    {
                      visibleOn: "(this.fieldType == 'position')",
                      // "visibleOn": "(this.type == 'position')",
                      // "visibleOn": "(this.fieldType == 'position')",
                      // "visibleOn": "(this.advanced == 'position')",
                      type: 'switch',
                      label: '采用geometry',
                      disabled: true,
                      value: false,
                      name: 'geometry',
                      desc: '目前还不支持Gemometry类型，后续db安装相应插件在启用。'
                    },
                    {
                      visibleOn: "(this.fieldType == 'position')",
                      // "visibleOn": "(this.type == 'position')",
                      // "visibleOn": "(this.fieldType == 'position')",
                      // "visibleOn": "(this.advanced == 'position')",
                      type: 'select',
                      label: '地图类型',
                      value: 'baiduMap',
                      name: 'map',
                      options: [
                        {
                          label: '百度地图',
                          value: 'baiduMap'
                        },
                        {
                          label: '腾讯地图',
                          value: 'tengxunMap',
                          disabled: true
                        },
                        {
                          label: '高德地图',
                          value: 'gaodeMap',
                          disabled: true
                        }
                      ]
                    },
                    {
                      visibleOn: "(this.fieldType == 'address')",
                      // "visibleOn": "(this.type == 'address')",
                      // "visibleOn": "(this.advanced == 'address')",
                      type: 'switch',
                      label: '记录地区',
                      value: true,
                      name: 'areaRecord'
                    },
                    {
                      visibleOn: "(this.fieldType == 'address')",
                      // "visibleOn": "(this.type == 'address')",
                      // "visibleOn": "(this.advanced == 'address')",
                      type: 'switch',
                      label: '记录街道',
                      value: false,
                      name: 'streetRecord'
                    },
                    {
                      visibleOn: "(this.fieldType == 'image')",
                      // "visibleOn": "(this.type == 'image')",
                      // "visibleOn": "(this.fieldType == 'image')",
                      type: 'select',
                      // "type": "button-group-select",
                      label: '图片比率',
                      value: '',
                      clearable: true,
                      // "name": "PictureRatio",
                      name: 'restrictRatio',
                      source: {
                        method: 'get',
                        url: useAdminBaseUrl('/system/dict-data/list?dictType=restrictRatio&status=0'),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: {...payload.data, options: payload.data}
                          };
                        }
                      }
                    },
                    {
                      visibleOn:
                        "this.restrictRatio == 'custom' && this.fieldType == 'image'",
                      // "visibleOn": "PictureRatio == 'other'",
                      label: '',
                      type: 'input-number',
                      name: 'restrictRatioCustom',
                      big: true,
                      step: 1e-10,
                      // "name": "defaultValue",
                      placeholder: '请输入长宽比'
                    },
                    {
                      visibleOn: "(this.fieldType == 'image')",
                      // "visibleOn": "(this.type == 'image')",
                      // "visibleOn": "(this.fieldType == 'image')",
                      type: 'select',
                      multiple: true,
                      // "type": "input-tag",
                      // "type": "input-text",
                      label: '允许的格式',
                      // "name": "allowedTypes",
                      name: 'picFormat',
                      value: '.jpeg,.png,.gif,.svg',
                      options: [
                        {
                          label: 'jpeg',
                          value: '.jpeg'
                        },
                        {
                          label: 'png',
                          value: '.png'
                        },
                        {
                          label: 'gif',
                          value: '.gif'
                        },
                        {
                          label: 'svg',
                          value: '.svg'
                        }
                      ]
                    },
                    // {
                    //   "label": "允许格式",
                    //   "mode": "horizontal",
                    //   "horizontal": {
                    //     "leftFixed": "sm"
                    //   },
                    // },
                    {
                      visibleOn: "(this.fieldType == 'image')",
                      // "visibleOn": "(this.type == 'image')",
                      // "visibleOn": "(this.fieldType == 'image')",
                      type: 'input-number',
                      big: true,
                      label: '最大图片',
                      // "value": "MB",
                      suffix: 'MB',
                      name: 'maxSize'
                    },
                    {
                      visibleOn: "(this.fieldType == 'attachment')",
                      // "visibleOn": "(this.type == 'attachment')",
                      // "visibleOn": "(this.fieldType == 'attachment')",
                      type: 'input-text',
                      label: '允许的格式',
                      name: 'accept',
                      // "name": "attFormat",
                      desc: '请填写允许文件的MIME-TYPE，多个类型用逗号隔开'
                    },
                    {
                      // "visibleOn": "(this.fieldType == 'user' || this.fieldType == 'department' || this.fieldType == 'owner')",
                      visibleOn:
                        "(this.fieldType == 'users' || this.fieldType == 'user' || this.fieldType == 'owner')",
                      // "visibleOn": "(this.type == 'user' || this.type == 'owner')",
                      // "visibleOn": "(this.fieldType == 'user' || this.fieldType == 'owner')",
                      type: 'switch',
                      label: '允许修改',
                      name: 'allowInput',
                      // "name": "enableInput",
                      desc: '是否允许修改，如果不允许则意味着编辑时不可修改',
                      value: true
                    },
                    {
                      visibleOn: "(this.fieldType == 'attachment')",
                      // "visibleOn": "(this.type == 'attachment')",
                      // "visibleOn": "(this.fieldType == 'attachment')",
                      type: 'input-number',
                      big: true,
                      label: '最大附件',
                      suffix: 'MB',
                      name: 'maxSize'
                    },
                    // {
                    //     "hidden": true,
                    //     "type": "switch",
                    //     "label": "识别录入",
                    //     "desc": "允许用户通过拍照或者选择图片进行文字识别",
                    //     "value": false,
                    //     "name": "",
                    // },
                    {
                      visibleOn: "(this.fieldType == 'text')",
                      // "visibleOn": "(this.type == 'text')",
                      // "visibleOn": "(this.fieldType == 'text')",
                      label: '长度',
                      type: 'input-number',
                      value: 255,
                      big: true,
                      name: 'length',
                      min: 0,
                      max: 16000,
                      resetValue: 255,
                      // "name": "colLength",
                      id: 'colLength',
                      required: true,
                      validations: {
                        longDatas: true
                      },
                      desc: '所用表类型的最大行大小（不包括BLOB）为65535'
                    },
                    {
                      visibleOn: "(this.fieldType == 'float')",
                      // "visibleOn": "(this.type == 'float')",
                      // "visibleOn": "(this.fieldType == 'float')",
                      // "label": "存储规格",
                      label: '小数类型',
                      type: 'select',
                      name: 'decimalType',
                      // "name": "dbType",
                      // "name": "saveNorms",
                      // "value": "small",
                      value: 'FLOAT',
                      options: [
                        {
                          label: '定点数',
                          value: 'DECIMAL'
                        },
                        {
                          label: '浮点数',
                          value: 'FLOAT'
                        },
                        {
                          label: '双精度浮点数',
                          value: 'DOUBLE'
                        }
                        // {
                        //     "label": "小数值",
                        //     "value": "small"
                        // },
                        // {
                        //     "label": "正常",
                        //     "value": "normal"
                        // },
                        // {
                        //     "label": "大数值",
                        //     "value": "big"
                        // }
                      ]
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'float' && this.decimalType == 'DECIMAL')",
                      // "visibleOn": "(this.type == 'float' && this.dbType == 'DECIMAL')",
                      label: '精度',
                      name: 'precision',
                      type: 'input-number',
                      big: true,
                      value: 10,
                      desc: '精度是指整个数字里全部位的数目，也就是小数点两边的位数目。显示指定类型精度时的最大允许精度为65',
                      validations: 'matchRegexp:/^([0-9][0-9]{0,1}|65)$/',
                      trimContents: true,
                      validationErrors: {
                        matchRegexp: '最大值为65'
                      },
                      max: '65',
                      resetValue: '65',
                      required: true
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'float' && this.decimalType == 'DECIMAL')",
                      // "visibleOn": "(this.type == 'float' && this.dbType == 'DECIMAL')",
                      label: '小数位数',
                      name: 'scale',
                      type: 'input-number',
                      big: true,
                      value: 4,
                      desc: '指小数点后边的位数',
                      max: '30',
                      resetValue: '30',
                      required: true
                    },
                    // {
                    //     "visibleOn": "(this.fieldType == 'float')",
                    //     "label": "",
                    //     "type": "input-text",
                    //     "name": "defaultValue",
                    //     "placeholder": "默认值"
                    // },
                    // {
                    //     "visibleOn": "(this.fieldType == 'float' && this.saveNorms == 'small')",
                    //     "label": "精度",
                    //     "type": "input-number",
                    //     "required": true,
                    //     "name": "accuracy",
                    // "value": 10,
                    // "desc": "精度是指整个数字里全部位的数目，也就是小数点两边的位数目。显示指定类型精度时的最大允许精度为65",
                    // "validations": "matchRegexp:/^([0-9][0-9]{0,1}|65)$/",
                    // "trimContents": true,
                    // "validationErrors": {
                    //     "matchRegexp": "最大值为65"
                    // },
                    // },
                    // {
                    //     "visibleOn": "(this.fieldType == 'float' && this.saveNorms == 'small')",
                    //     "label": "小数位数",
                    //     "value": 0,
                    //     "type": "input-text",
                    //     "required": true,
                    //     "desc": "指小数点后边的位数",
                    //     "name": "decimal",
                    // },
                    {
                      visibleOn: "(this.fieldType == 'text')",
                      // "visibleOn": "(this.type == 'text')",
                      // "visibleOn": "(this.fieldType == 'text')",
                      label: '格式',
                      type: 'select',
                      required: true,
                      name: 'format',
                      value: 'normal',
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'setValue',
                              componentId: 'colLength',
                              args: {
                                value:
                                  "${value=='id'?18:value=='normal'?255:value=='phone'?20:value=='tel'?20:value=='zipcode'?10:value=='color'?30:256}"
                                // "value": "${value=='number'?18:value=='phone'?20:value=='telephone'?20:value=='postcode'?10:value=='color'?30:256}"
                              }
                            }
                          ]
                        }
                      },
                      source: {
                        method: 'get',
                        url: useAdminBaseUrl('/system/dict-data/list?dictType=formatType&status=0'),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: {...payload.data, options: payload.data}
                          };
                        }
                      }
                    },
                    {
                      visibleOn:
                        "(this.format != 'text' && this.fieldType == 'text')",
                      // "visibleOn": "(this.format != 'text' && this.type == 'text')",
                      // "visibleOn": "(this.format != 'text' && this.fieldType == 'text')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'formatMsg'
                      // "name": "formatMessage",
                    },
                    {
                      visibleOn: "(this.fieldType =='float' && this.decimalType == 'DECIMAL')",
                      label: '最小值',
                      type: 'input-number',
                      big: true,
                      name: 'minimum',
                      // "name": "minValue",
                      precision: '$scale'
                      // "precision": 2,
                      // "step": 0.01
                    },
                    {
                      visibleOn: "(this.fieldType =='float' && this.decimalType != 'DECIMAL')",
                      label: '最小值',
                      type: 'input-number',
                      big: true,
                      name: 'minimum',
                      precision: '4',
                      "step": 0.0001
                    },
                    {
                      visibleOn: "this.fieldType =='float'",
                      // "visibleOn": "(this.type == 'int' || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'minValueMessage'
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'int' || this.fieldType == 'bigint')",
                      // "visibleOn": "(this.type == 'int' || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      label: '最小值',
                      type: 'input-number',
                      big: true,
                      name: 'minimum'
                      // "name": "minValue",
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'int' || this.fieldType == 'bigint')",
                      // "visibleOn": "(this.type == 'int' || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'minValueMessage'
                    },
                    {
                      visibleOn:
                        "this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password'",
                      // "visibleOn": "this.type == 'text' || this.type == 'textarea' || this.type == 'password'",
                      // "visibleOn": "this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password'",
                      // "visibleOn": "this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password'",
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      label: '最小长度',
                      name: 'minLength'
                    },
                    {
                      // 单行多行整数浮点的最小提示
                      visibleOn:
                        "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.type == 'text' || this.type =='textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'minLengthMessage'
                    },
                    {
                      visibleOn: "(this.fieldType =='float' && this.decimalType == 'DECIMAL')",
                      // "visibleOn": "(this.type == 'int' || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      label: '最大值',
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      name: 'maximum',
                      // "name": "maxValue",
                      // "precision": 2,
                      precision: '$scale'
                      // "step": 0.01
                    },
                    {
                      visibleOn: "(this.fieldType =='float' && this.decimalType != 'DECIMAL')",
                      label: '最大值',
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      name: 'maximum',
                      precision: 4,
                      "step": 0.0001
                    },
                    {
                      visibleOn: "this.fieldType =='float'",
                      // "visibleOn": "(this.type == 'int' || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      mode: 'horizontal',
                      name: 'maxValueMessage'
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'int' || this.fieldType == 'bigint')",
                      // "visibleOn": "(this.type == 'int' || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      label: '最大值',
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      name: 'maximum'
                      // "name": "maxValue",
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'int' || this.fieldType == 'bigint')",
                      // "visibleOn": "(this.type == 'int' || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      mode: 'horizontal',
                      name: 'maxValueMessage'
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.type == 'text' || this.type =='textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      type: 'input-number',
                      big: true,
                      label: '最大长度',
                      name: 'maxLength'
                    },
                    {
                      // 单行多行整数浮点的最大提示
                      visibleOn:
                        "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.type == 'text' || this.type =='textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      mode: 'horizontal',
                      name: 'maxLengthMessage'
                    },
                    {
                      visibleOn:
                        "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.type == 'text' || this.type == 'textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      mode: 'horizontal',
                      type: 'input-text',
                      name: 'matchRegexp',
                      // "name": "regexp",
                      label: '正则校验',
                      // "size": "lg",
                      placeholder: '请输入正则表达式，如^[A-Za-z]*$',
                      options: [
                        {
                          label: '大写字母 ^[A-Z]*$',
                          value: '^[A-Z]*$'
                        },
                        {
                          label: '小写字母 ^[a-z]*$',
                          value: '^[a-z]*$'
                        },
                        {
                          label: '8位字母数字 ^w{8}$',
                          value: '^w{8}$'
                        },
                        {
                          label: '字母数字 ^[A-Za-z0-9]*$',
                          value: '^[A-Za-z0-9]*$'
                        },
                        {
                          label: '数字 ^d*$',
                          value: '^d*$'
                        },
                        {
                          label: '8位数字 ^d{8}$',
                          value: '^d{8}$'
                        }
                        // {
                        //     "label": "数字 /^[0-9]*$/",
                        //     "value": "/^[0-9]*$/"
                        // },
                        // {
                        //     "label": "身份证号 /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\d|30|31)\d{3}[\dXx]$/",
                        //     "value": "/^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\d|30|31)\d{3}[\dXx]$/"
                        // },
                        // {
                        //     "label": "小写英文字母组成 /^[a-z]+$/",
                        //     "value": "/^[a-z]+$/"
                        // },
                        // {
                        //     "label": "大写英文字母 /^[A-Z]+$/",
                        //     "value": "/^[A-Z]+$/"
                        // }
                      ]
                    },
                    {
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      visibleOn:
                        "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.type == 'text' || this.type == 'textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'regexpMessage'
                      // "name": "matchRegexp"
                    },
                    {
                      // "visibleOn": "this.fieldType !== 'user'",
                      // "visibleOn": "this.type !== 'user'",
                      // "visibleOn": "this.fieldType !== 'user'",
                      hiddenOn:"this.fieldType == 'formula'",
                      label: '注释',
                      type: 'textarea',
                      mode: 'horizontal',
                      name: 'fieldComment',
                      maxLength: 200
                    },
                    {
                      type:'container',
                      "className": "pos-fix bottom-0 pb-5 w-10/12 bg-white",
                      body:[
                        {
                          "className": "left-0",
                          label: '上一步',
                          type: 'button',
                          actionType: 'prev'
                        },
                        {
                          "className": "left-20",
                          label: '完成',
                          type: 'button',
                          id: 'submitId',
                          actionType: 'next',
                          level: 'primary',
                          countDown: 1,
                          countDownTpl: '${timeLeft} 秒后再次点击',
                          onEvent: {
                            click: {
                              "weight": 0,
                              "debounce": {
                                "wait": 100
                              },
                              actions: [
                                {
                                  actionType: 'custom',
                                  script: function (_: any,doAction: any,event: any) {
                                    let fieldCrudData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                    let haveContentCode = []
                                    haveContentCode = fieldCrudData.filter((res: any) => {
                                      return res.systemFieldType == 9
                                    })
                                    let tenantCodeName = 'tenantCode'
                                    if (haveContentCode.length > 0) {
                                      tenantCodeName = haveContentCode[0].code
                                    }
                                    let haveTreeParent = []
                                    haveTreeParent = fieldCrudData.filter((res: any) => {
                                      return res.type == 'parent'
                                    })
                                    let treeParentName = 'parentId'
                                    if (haveTreeParent.length > 0) {
                                      treeParentName = haveTreeParent[0].code
                                    }
                                    console.log('字段集合添加');
                                    console.log(_, '___');
                                    console.log(doAction,'doActiondoActiondoAction');
                                    console.log(event, 'eventeventevent');
                                    console.log(2807, event.data.defaultValue);
                                    doAction({
                                      actionType: 'disabled',
                                      componentId: 'createForm'
                                    });
                                    doAction({
                                      actionType: 'validate',
                                      componentId: 'createForm',
                                      outputVar: 'validateResult'
                                    });
                                    setTimeout(() => {
                                      if (
                                        event.data?.validateResult?.error ==
                                        '依赖的部分字段没有通过验证'
                                      ) {
                                        doAction({
                                          actionType: 'enabled',
                                          componentId: 'createForm'
                                        });
                                        return;
                                      }
                                      if (
                                        event.data.fieldCode.toUpperCase() ==
                                          'ID' ||
                                        event.data.fieldCode.toUpperCase() ==
                                          treeParentName.toUpperCase() ||
                                        event.data.fieldCode.toUpperCase() ==
                                          tenantCodeName.toUpperCase() ||
                                        event.data.fieldCode.toUpperCase() ==
                                          'CREATEDAT' ||
                                        event.data.fieldCode.toUpperCase() ==
                                          'UPDATEDAT' ||
                                        event.data.fieldCode.toUpperCase() ==
                                          'CREATEDBY' ||
                                        event.data.fieldCode.toUpperCase() ==
                                          'UPDATEBY' ||
                                        event.data.fieldCode.toUpperCase() ==
                                          'DELETEDBY' ||
                                        event.data.fieldCode.toUpperCase() ==
                                          'DELETEDAT' ||
                                        event.data.fieldCode.toUpperCase() ==
                                          'DELETED'
                                      ) {
                                        // return alert('字段名不能为系统字段同名，请换个名字。')
                                        return;
                                        // return toast.error('字段名不能和系统字段同名，请换个名字。', {
                                        //     position: "top-center"
                                        // })
                                      }
                                      if (
                                        event.data.fieldType == 'date' &&
                                        event.data.defaultValueMode == 'static'
                                      ) {
                                        event.data.defaultValue = event.data.defaultValue;
                                      } else if (
                                        event.data.fieldType == 'datetime' &&
                                        event.data.defaultValueMode == 'static'
                                      ) {
                                        event.data.defaultValue = event.data.defaultValue;
                                      } else if (
                                        event.data.fieldType == 'time' &&
                                        event.data.defaultValueMode == 'static'
                                      ) {
                                        event.data.defaultValue = event.data.defaultValue;
                                      } else {
                                        event.data.defaultValue = event.data.defaultValue;
                                      }
                                      let rightData: any = {
                                        onText: event.data.onText,
                                        offText: event.data.offText,
                                        rules: event.data.rules,
                                        colIgnoreTenant: event.data.colIgnoreTenant ? event.data.colIgnoreTenant : JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!),
                                        sort: 1,
                                        foreignKeyFlag: false,
                                        systemFieldType: 0,
                                        // systemFieldType: "NONE",
                                        // enableInput: event.data.enableInput,
                                        nullable: event.data.nullable, // 是否允许空值
                                        source: event.data.source
                                          ? 'app://dictionary/running/list?level=2&encoded=' +
                                            event.data.source
                                          : null, // 枚举字典
                                        // source: event.data.source ? 'app://dev-api/app/dict-type/list?type=' + event.data.source : null, // 枚举字典
                                        sources: event.data.source, // 枚举字典
                                        msources: event.data.source, // 枚举字典
                                        token: event.data.token, // 密钥
                                        // dbType: event.data.dbTypes, // 小数类型/整数类型
                                        dbType: event.data.dbType,
                                        valueType: event.data.valueType, // 枚举的值类型
                                        integerType: event.data.integerType, // 整数类型
                                        decimalType: event.data.decimalType, // 整数类型
                                        allowedTypes: event.data.picFormat
                                          ? event.data.picFormat.split(',')
                                          : '', // 允许的格式
                                        picFormat: event.data.picFormat, // 允许的格式
                                        maxSize: event.data.maxSize, // 最大图片
                                        restrictRatio: event.data.restrictRatio, // 图片比率
                                        restrictRatioCustom:
                                          event.data.restrictRatioCustom, // 图片比率提示值
                                        allowInput: event.data.allowInput, // 是否允许修改
                                        addOptions: event.data.addOptions, // 枚举新增选项
                                        meiptions: event.data.options, // 枚举选项值
                                        options: event.data.addOptions, // 枚举选项值
                                        // enableOCR: event.data.enableOCR, // 识别录入
                                        defaultValueMode:
                                          event.data.defaultValueMode, //默认值
                                        dateTimeDefaultValue:
                                          event.data.dateTimeDefaultValue, // 日期时间默认值
                                        dateDefaultValue:
                                          event.data.dateDefaultValue, // 日期默认值
                                        timeDefaultValue:
                                          event.data.timeDefaultValue, // 时间默认值
                                        minDateTime: event.data.minDateTime,
                                        minDateDate: event.data.minDateDate,
                                        minDateTimes: event.data.minDateTimes,
                                        maxDateTime: event.data.maxDateTime,
                                        maxDateDate: event.data.maxDateDate,
                                        maxDateTimes: event.data.maxDateTimes,
                                        comment: event.data.fieldComment, // 注释
                                        // defaultValueType: event.data.defaultValueType,
                                        // fieldName: event.data.fieldName || null, // 字段名
                                        // code: event.data.code, // 字段名
                                        code: event.data.fieldCode, // 字段名
                                        value: event.data.fieldCode, // 字段名
                                        defaultValue: event.data.defaultValue, // 默认值
                                        // fieldDesc: event.data.fieldDesc, // 显示标题
                                        name: event.data.fieldName, // 显示标题
                                        requiredFlag: event.data.requiredFlag, // 是否必填
                                        unique: event.data.unique, // 是否唯一
                                        // enableSearch: event.data.enableSearch,// 是否可搜
                                        length: Number(event.data.length), // 当行文本长度
                                        colLength: event.data.colLength, // 长度
                                        maxLength: event.data.maxLength, // 长度
                                        format: event.data.format, // 格式
                                        // formatMessage: event.data.formatMessage,// 提示信息
                                        formatMsg: event.data.formatMsg, // 提示信息
                                        minLength: event.data.minLength, // 最小长度
                                        minLengthMessage:
                                          event.data.minLengthMessage, // 最小长度提示
                                        // inputMaxLength: event.data.inputMaxLength,// 最大长度
                                        maxLengthMessage:
                                          event.data.maxLengthMessage, // 最大长度提示
                                        matchRegexp: event.data.matchRegexp, // 正则校验
                                        // regexp: event.data.regexp,// 正则校验
                                        regexpMessage: event.data.regexpMessage, // 正则校验提示信息
                                        type: event.data.fieldType, // 基本字段类型
                                        // fieldType: event.data.fieldType,// 基本字段类型
                                        relation: event.data.relation, // 关系
                                        advanced: event.data.advanced, // 高级字段
                                        maximum: event.data.maximum, // 最大值
                                        // maxValue: event.data.maxValue,// 最大值
                                        maxDate: event.data.maxDate, // 最大日期
                                        minimum: event.data.minimum, // 最小值
                                        // minValue: event.data.minValue,// 最小值
                                        minDate: event.data.minDate, // 最小日期
                                        minValueMessage: event.data.minValueMessage, // 最小值提示
                                        minDateMsg: event.data.minDateMsg, // 最小日期提示
                                        maxValueMessage: event.data.maxValueMessage, // 最大值提示
                                        maxDateMsg: event.data.maxDateMsg, // 最大日期提示
                                        accuracy: event.data.accuracy, // 精度
                                        decimal: event.data.decimal, // 小数位数
                                        saveNorms: event.data.saveNorms, // 存储规格
                                        currency: event.data.currency
                                          ? event.data.currency == 'CNY' ?
                                          {
                                            icon: '￥',
                                            label: '人民币',
                                            value: 'CNY'
                                          } : {
                                            icon: '$',
                                            label: '美元',
                                            value: 'USD'
                                          }
                                          : {
                                              icon: '￥',
                                              label: '人民币',
                                              value: 'CNY'
                                            }, // 币种
                                        driver: event.data.driver, // 对象存储
                                        // objectStorage: event.data.objectStorage,// 对象存储
                                        accept: event.data.accept, // 文件允许的形式
                                        // attFormat: event.data.attFormat,// 文件允许的形式
                                        PictureRatio: event.data.PictureRatio, // 图片比率
                                        // picFormat: event.data.picFormat,// 允许的格式
                                        salt: event.data.salt, // 加盐
                                        // secretKey: event.data.secretKey,// 密钥
                                        // describe: event.data.describe,// 描述
                                        description: event.data.describe, // 描述
                                        // cityRecord: event.data.cityRecord,// 记录城市
                                        // areaRecord: event.data.areaRecord,// 记录地区
                                        // streetRecord: event.data.streetRecord,// 记录街道
                                        // geometry: event.data.geometry,// 采用geometry
                                        // map: event.data.map,// 地图类型
                                        formula: event.data.expression, // 公式
                                        expression: event.data.expression, // 公式
                                        // target: event.data.target,// 目标模型
                                        // targetKey: event.data.targetKey,// 目标外键
                                        // cascadeDelet: event.data.cascadeDelet,// 级联删除
                                        // relevance: event.data.relevance,// 关联字段在对方
                                        // foreignKey: event.data.foreignKey,// 外键
                                        // attribute: event.data.attribute,// 可自定义属性
                                        colTypeName: '',
                                        precision: 10, // 精度
                                        scale: '',
                                        validations: {},
                                        validationErrors: {}
                                      };
                                      console.log(2886, rightData);
                                      function formatDecimal(num, decimalPlaces) {
                                        const number = Number(num);
                                        return number.toFixed(decimalPlaces);
                                      }
                                      if (rightData.type == 'text') {
                                          rightData.dbType = 'VARCHAR';
                                          delete rightData.currency;
                                      } else if (rightData.type == 'serial-number') {
                                        rightData.length = 255;
                                        rightData.parsedDateField = event.data.parsedDateField
                                        rightData.parsedDateFormat = event.data.parsedDateFormat
                                        rightData.serialClearSchedule = [{
                                          env:1,
                                          months: event.data.expireTime
                                        }]
                                        delete rightData.currency;
                                      } else if (rightData.type == 'textarea') {
                                        // rightData.type = "TEXT"
                                        rightData.dbType = 'TEXTAREA';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'rich-text') {
                                        // rightData.type = "LONGTEXT"
                                        rightData.dbType = 'RICH_TEXT';
                                        // rightData.nullable = false
                                        delete rightData.currency;
                                      } else if (rightData.type == 'int') {
                                        // rightData.type = "INT"
                                        if (rightData.integerType == 'INT') {
                                          rightData.dbType = 'INT';
                                        } else {
                                          rightData.dbType = 'BIGINT';
                                        }
                                        delete rightData.currency;
                                      } else if (rightData.type == 'bigint') {
                                        // rightData.type = "LONG"
                                        rightData.dbType = 'LONG';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'float') {
                                        // rightData.type = "FLOAT"
                                        // rightData.scale = 4
                                        rightData.dbType = event.data.decimalType;
                                        rightData.scale = event.data.scale
                                          ? event.data.scale
                                          : 4;
                                        rightData.precision = event.data.precision
                                          ? event.data.precision
                                          : 10;
                                        delete rightData.currency;
                                        if(rightData.defaultValueMode == 'static' &&
                                          rightData.decimalType == 'DECIMAL'){
                                          rightData.defaultValue = formatDecimal(rightData.defaultValue,event.data.scale?event.data.scale:4)
                                        }
                                      } else if (rightData.type == 'money') {
                                        // rightData.type = "DECIMAL"
                                        rightData.dbType = 'BIGINT';
                                        if (moneyData.length > 0) {
                                          moneyData.forEach((element: any) => {
                                            if (element.value == rightData.currency) {
                                              let iconData = JSON.parse(element.extra);
                                              rightData.currency = {
                                                icon: iconData.symbol,
                                                label: element.label,
                                                value: element.value
                                              };
                                            }
                                          });
                                        }
                                        if(rightData.defaultValueMode == 'static'){
                                          rightData.defaultValue = formatDecimal(rightData.defaultValue,2)
                                        }
                                      } else if (rightData.type == 'enum') {
                                        console.log(rightData.addOptions,'rightData.addOptions')
                                        if(!rightData.addOptions){
                                          rightData.options = []
                                          rightData.addOptions = []
                                        }
                                        if (
                                          rightData.addOptions &&
                                          rightData.addOptions.length > 0
                                        ) {
                                          if (rightData.valueType == 'INTEGER') {
                                            rightData.options =
                                              rightData.addOptions.map(
                                                (element: any) => {
                                                  return {
                                                    value: 'value' in element ? Number(element.value) : element.label,
                                                    label: 'label' in element ? element.label : '',
                                                    values: 'value' in element ? Number(element.value) : element.label,
                                                    labels: 'label' in element ? element.label : '',
                                                  };
                                                }
                                              );
                                          } else {
                                            rightData.options =
                                              rightData.addOptions.map(
                                                (element: any) => {
                                                  return {
                                                    value: 'value' in element ? element.value : element.label,
                                                    label: 'label' in element ? element.label : '',
                                                    values: 'value' in element ? element.value : element.label,
                                                    labels: 'label' in element ? element.label : '',
                                                  };
                                                }
                                              );
                                          }
                                          rightData.addOptions = rightData.options;
                                        }
                                        if (rightData.valueType == 'INTEGER') {
                                          rightData.dbType = 'INTEGER';
                                        } else {
                                          rightData.dbType = 'VARCHAR';
                                          rightData.length = 255;
                                        }
                                        if (rightData.meiptions == 'dictionaries') {
                                          dictionaryList.forEach((element: any) => {
                                            if (element.name == rightData.sources) {
                                              rightData.sources = element.type;
                                              rightData.source =
                                                'app://dictionary/running/list?level=2&encoded=' +
                                                element.type;
                                              if (element.dbType == 0) {
                                                rightData.dbType = 'VARCHAR';
                                                rightData.length = 255;
                                              }
                                              if (element.dbType == 1) {
                                                rightData.dbType = 'INTEGER';
                                              }
                                            }
                                          });
                                        }
                                        delete rightData.currency;
                                      } else if (rightData.type == 'boolean') {
                                        // rightData.type = "BIT"
                                        if (
                                          rightData.defaultValueMode == 'static'
                                        ) {
                                          rightData.defaultValue =
                                            rightData.defaultValue
                                              ? rightData.defaultValue == null
                                                ? false
                                                : rightData.defaultValue
                                              : false;
                                        }
                                        rightData.dbType = 'BOOLEAN';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'date') {
                                        // rightData.type = "DATE"
                                        rightData.dbType = 'DATE';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'datetime') {
                                        rightData.precision = event.data.precision
                                          ? event.data.precision
                                          : 0;
                                        rightData.showPrecision = event.data.showPrecision
                                          ? event.data.showPrecision
                                          : 0;
                                        rightData.precisionCompatible = 'precisionCompatible' in event.data
                                          ? event.data.precision <= 3 ? false : event.data.precisionCompatible
                                          : false;
                                        // rightData.type = "DATETIME"
                                        // rightData.dbType = 'DATETIME';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'date-range') {
                                        if (rightData.dbType == 'DATETIME') {
                                          rightData.defaultValue = rightData.dateTimeDefaultValue;
                                          rightData.minDate = rightData.minDateTime;
                                          rightData.maxDate = rightData.maxDateTime;
                                        } else if (rightData.dbType == 'DATE') {
                                          rightData.defaultValue = rightData.dateDefaultValue;
                                          rightData.minDate = rightData.minDateDate;
                                          rightData.maxDate = rightData.maxDateDate;
                                        } else if (rightData.dbType == 'TIME') {
                                          rightData.defaultValue = rightData.timeDefaultValue;
                                          rightData.minDate = rightData.minDateTimes;
                                          rightData.maxDate = rightData.maxDateTimes;
                                        }
                                        console.log(rightData,'rightDatarightDatarightDatarightDatarightDatarightData')
                                        rightData.length = 200;
                                        delete rightData.currency;
                                        delete rightData.format;
                                      } else if (rightData.type == 'time') {
                                        rightData.precision = event.data.precision
                                          ? event.data.precision
                                          : 0;
                                        rightData.showPrecision = event.data.showPrecision
                                          ? event.data.showPrecision
                                          : 0;
                                        rightData.precisionCompatible = 'precisionCompatible' in event.data
                                          ? event.data.precision <= 3 ? false : event.data.precisionCompatible
                                          : false;
                                        // rightData.type = "TIME"
                                        rightData.dbType = 'TIME';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'user') {
                                        // rightData.type = "USER_INFO"
                                        // rightData.dbType = "VARCHAR(255)"
                                        if (rightData.defaultValueMode == 'current_user') {
                                          rightData.defaultValue = 'current_user';
                                        }
                                        rightData.length = 255;
                                        rightData.dbType = 'VARCHAR';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'users') {
                                        // rightData.type = "MULTI_USER_INFO"
                                        rightData.length = 5000;
                                        rightData.usersDefaultValue = event.data.defaultValue;
                                        rightData.defaultValue ==
                                        event.data.defaultValue
                                          ? event.data.defaultValue
                                          : '';
                                        rightData.dbType = 'JSON';
                                        if (rightData.defaultValueMode == 'static') {
                                          console.log(rightData,'rightDatarightDatarightData');
                                        } else if (
                                          rightData.defaultValueMode == 'expression'
                                        ) {
                                          rightData.defaultValue = rightData.usersDefaultValue;
                                        }
                                        delete rightData.currency;
                                      } else if (rightData.type == 'department') {
                                        rightData.dbType = 'VARCHAR';
                                        rightData.length = 255;
                                        delete rightData.currency;
                                      } else if (rightData.type == 'owner') {
                                        // rightData.type = "OWNER"
                                        delete rightData.currency;
                                      } else if (rightData.type == 'password') {
                                        // rightData.type = "PASSWORD"
                                        // rightData.dbType = "VARCHAR(255)"
                                        rightData.dbType = 'VARCHAR';
                                        rightData.length = 255;
                                        delete rightData.currency;
                                      } else if (rightData.type == 'ciphertext') {
                                        // rightData.type = "CIPHERTEXT"
                                        // rightData.dbType = "VARCHAR(255)"
                                        // rightData.length = 1000;
                                        rightData.dbType = 'VARCHAR';
                                        delete rightData.currency;
                                      } else if (rightData.type == 'address') {
                                        // rightData.type = "ADDRESS"
                                        delete rightData.currency;
                                      } else if (rightData.type == 'json') {
                                        // rightData.type = "JSON"
                                        rightData.dbType = 'JSON';
                                        // rightData.nullable = false;
                                        delete rightData.currency;
                                      } else if (rightData.type == 'formula') {
                                        // rightData.type = "FORMULA"
                                        delete rightData.currency;
                                      } else if (rightData.type == 'attachment') {
                                        // rightData.type = "attachment"
                                        // rightData.dbType = "text"
                                        rightData.length = 1000;
                                        rightData.dbType = 'ATTACHMENT';
                                        // rightData.driver = "bos"
                                        rightData.defaultValueMode = 'null';
                                        rightData.defaultValue = null;
                                        delete rightData.currency;
                                      } else if (rightData.type == 'image') {
                                        rightData.length = 1000;
                                        rightData.colTypeName = 'IMAGE';
                                        rightData.dbType = 'IMAGE';
                                        rightData.defaultValueMode = 'null';
                                        rightData.defaultValue = null;
                                        delete rightData.currency;
                                      }
                                      if (event.data.maxLength) {
                                        rightData.validations.maxLength = event.data.maxLength;
                                      }
                                      if (event.data.minLength) {
                                        rightData.validations.minLength = event.data.minLength;
                                      }
                                      if (event.data.matchRegexp) {
                                        rightData.validations.matchRegexp = event.data.matchRegexp;
                                      }
                                      if (event.data.maxLengthMessage) {
                                        rightData.validationErrors.maxLength = event.data.maxLengthMessage;
                                      }
                                      if (event.data.minLengthMessage) {
                                        rightData.validationErrors.minLength = event.data.minLengthMessage;
                                      }
                                      if (event.data.regexpMessage) {
                                        rightData.validationErrors.matchRegexp = event.data.regexpMessage;
                                      }
                                      if (
                                        event.data.minimum ||
                                        event.data.minimum == 0
                                      ) {
                                        // if (event.data.minValue) {
                                        rightData.validations.minimum = event.data.minimum;
                                        // rightData.validations.minValue = event.data.minValue
                                      }
                                      if (rightData.minDate) {
                                        // if (event.data.minDate) {
                                        // rightData.validations.minDate = event.data.minDate
                                        rightData.validations.minDate = rightData.minDate;
                                      }
                                      if (event.data.minValueMessage) {
                                        rightData.validationErrors.minimum = event.data.minValueMessage;
                                        // rightData.validationErrors.minValue = event.data.minValueMessage
                                      }
                                      if (event.data.minDateMsg) {
                                        rightData.validationErrors.minDate = event.data.minDateMsg;
                                      }
                                      if (event.data.maximum) {
                                        // if (event.data.maxValue) {
                                        rightData.validations.maximum = event.data.maximum;
                                        // rightData.validations.enableSearch = event.data.maxValue
                                      }
                                      if (rightData.maxDate) {
                                        rightData.validations.maxDate = rightData.maxDate;
                                        // if (event.data.maxDate) {
                                        //     rightData.validations.maxDate = event.data.maxDate
                                      }
                                      if (event.data.maxValueMessage) {
                                        rightData.validationErrors.maximum = event.data.maxValueMessage;
                                        // rightData.validationErrors.enableSearch = event.data.maxValueMessage
                                      }
                                      if (event.data.maxDateMsg) {
                                        rightData.validationErrors.maxDateMsg = event.data.maxDateMsg;
                                        // rightData.validationErrors.enableSearch = event.data.maxDateMsg
                                      }
                                      let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                      // let dataArr = JSON.parse(getCookie('fieldCrud'))
                                      let isHave = false;
                                      if (isHave) return;
                                      if (
                                        rightData.type == 'text' ||
                                        rightData.type == 'textarea' ||
                                        rightData.type == 'user' ||
                                        rightData.type == 'users' ||
                                        rightData.type == 'department'
                                      ) {
                                        if (
                                          rightData.defaultValueMode == 'static' &&
                                          (rightData.defaultValue == '' ||
                                            !rightData.defaultValue)
                                        ) {
                                          rightData.defaultValue = '';
                                        }
                                      }
                                      let needConfig = {...rightData};
                                      delete needConfig.validations;
                                      delete needConfig.validationErrors;
                                      if(rightData.type != 'date-range'){
                                        delete rightData.dbType;
                                      }
                                      delete rightData.rules;
                                      delete rightData.colIgnoreTenant;
                                      delete rightData.length;
                                      delete rightData.parsedDateField;
                                      delete rightData.parsedDateFormat;
                                      delete rightData.precision;
                                      delete rightData.showPrecision;
                                      delete rightData.precisionCompatible;
                                      delete rightData.serialClearSchedule;
                                      if(rightData.type == 'serial-number'){
                                        needConfig.orderEvent = true;
                                      }
                                      if (
                                        (rightData.defaultValueMode == 'null' ||
                                          rightData.defaultValueMode == null) &&
                                        rightData.type != 'rich-text'
                                      ) {
                                        rightData.defaultValue = null;
                                      }
                                      console.log(rightData,'rightDatarightDatarightDatarightData');
                                      if (sessionStorage.getItem('fieldCrud')! != null) {
                                        let data = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                                        let needV4 = uuid.v4();
                                        let familyList = data.filter((sj: any) => {
                                          return (
                                            sj.systemFieldType == 0 &&
                                            !sj.foreignKeyFlag &&
                                            sj.systemFieldType != 1 &&
                                            sj.type != 'relation' &&
                                            sj.type != 'formula'
                                          );
                                        });
                                        console.log(familyList, 'familyList');
                                        if (familyList.length == 0 && needConfig.type != 'formula') {
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'nameField',
                                            args: {
                                              value: needConfig.code
                                            }
                                          });
                                          sessionStorage.setItem('nameFieldData', needConfig.code)
                                        }
                                        data.push({
                                          appId: event.data.appId,
                                          label: event.data.fieldCode,
                                          needId: needV4,
                                          // needId: uuid.v4(),
                                          config: needConfig,
                                          // config: rightData,
                                          // config: JSON.stringify(rightData),
                                          // configs: rightData,
                                          ...rightData
                                        });
                                        data.forEach(
                                          (element: any, index: number) => {
                                            element.sort = index + 1;
                                          }
                                        );
                                        let fieldCruds = data.map((res: any) => {
                                          // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                          if (res.type != 'relation' && res.systemFieldType != 6
                                            && res.systemFieldType != 8 && res.systemFieldType != 9
                                             && res.systemFieldType != 7 && res.type != 'formula') {
                                            return res;
                                          }
                                        });
                                        let puFieldCruds = data.map((res: any) => {
                                          if (
                                            !res.foreignKeyFlag &&
                                            res.systemFieldType == 0 &&
                                            res.type != 'relation'
                                          ) {
                                            return res;
                                          }
                                        });
                                        if (rightData.unique) {
                                          let keyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
                                          let fieldDatas = data.filter(
                                            (res: any) => {
                                              if (res.systemFieldType == 6) {
                                                return res;
                                              }
                                            }
                                          );
                                          let tenantCodeDatas = data.filter(
                                            (res: any) => {
                                                return res.systemFieldType == 9
                                            }
                                          );
                                          if (fieldDatas.length > 0) {
                                            if(tenantCodeDatas.length>0){
                                              keyData.push({
                                                needId: needV4,
                                                // needId: uuid.v4(),
                                                columnNames:
                                                    rightData.code + ','+fieldDatas[0].code+',' + tenantCodeName,
                                                code: '_'+rightData.code,
                                                uniqueFlag: true,
                                                systemIndex: true
                                              });
                                            }else{
                                              keyData.push({
                                                needId: needV4,
                                                // needId: uuid.v4(),
                                                columnNames:
                                                  rightData.code + ',' + fieldDatas[0].code,
                                                code: '_'+rightData.code,
                                                uniqueFlag: true,
                                                systemIndex: true
                                              });
                                            }
                                          } else {
                                            if(tenantCodeDatas.length>0){
                                              keyData.push({
                                                needId: needV4,
                                                // needId: uuid.v4(),
                                                columnNames:
                                                    rightData.code + ',' + tenantCodeName,
                                                code: '_'+rightData.code,
                                                uniqueFlag: true,
                                                systemIndex: true
                                              });
                                            }else{
                                              keyData.push({
                                                needId: needV4,
                                                // needId: uuid.v4(),
                                                columnNames: rightData.code,
                                                code: '_'+rightData.code,
                                                uniqueFlag: true,
                                                systemIndex: true
                                              });
                                            }
                                          }
                                          let keyDatas = keyData.map(
                                            (res: any, index: number) => {
                                              return {...res, sort: index + 1,
                                                columnNames:processIndexFields(res.columnNames,data)
                                              };
                                            }
                                          );
                                          doAction({
                                            actionType: 'setValue',
                                            componentId: 'keyCrud',
                                            args: {
                                              value: {
                                                items: keyDatas
                                              }
                                            }
                                          });
                                          sessionStorage.setItem('keyCrud',JSON.stringify(keyDatas));
                                        }
                                        console.log(data,'data数据')
                                        let fieldKeyCruds = data.map((res: any) => {
                                          if (
                                            res.type != 'relation' &&
                                            res.type != 'formula' &&
                                            res.type != 'textarea' &&
                                            res.type != 'rich-text' &&
                                            res.type != 'json' &&
                                            res.type != 'attachment' &&
                                            res.type != 'image' &&
                                            res.type != 'ciphertext' &&
                                            res.type != 'users'
                                          ) {
                                            if (
                                              res.type == 'text' &&
                                              res.config.length < 768
                                            ) {
                                              return res;
                                            } else if (res.type != 'text') {
                                              return res;
                                            }
                                          }
                                        });
                                        let waiList = data.filter((res: any) => {
                                          if (
                                            res.type == 'text' &&
                                            res.config.length >= 20 && res.systemFieldType == 0
                                          ) {
                                            return res;
                                          } else if (
                                            res.type == 'int' &&
                                            res.systemFieldType == 0 &&
                                            res.config.integerType == 'BIGINT'
                                          ) {
                                            return res;
                                          }
                                        });
                                        let intList = data.filter((res: any) =>
                                          res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
                                        let cuList = data.filter((res: any) =>
                                          (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
                                        let cuTimeList = data.filter((res: any) =>
                                          res.type == 'datetime' && res.systemFieldType == 0)
                                        let needPrimaryKeyType:any = []
                                        needPrimaryKeyType = data.filter((res: any) =>res.systemFieldType == 1)
                                        if(needPrimaryKeyType.length == 0){
                                          needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
                                        }
                                        let treeList = data.filter((res: any) => {
                                          if(res.type == needPrimaryKeyType[0].type &&
                                            res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
                                            return res
                                          }
                                        })
                                        data.forEach((element: any, index: number) => {
                                          //开启是否忽略租户时，流水号不显示是否忽略租户
                                          if(element.type == "serial-number" && JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)) {
                                            element.hideColIgnoreTenant = true
                                            //当由关闭到开启时，没有点击编辑操作，直接下发时，将所有流水号字段都改成开启
                                            element.config.colIgnoreTenant = JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)
                                          } else if (element.type == "serial-number" && !JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)){
                                            //当由开启到关闭时，没有点击编辑操作，直接下发时，将所有流水号字段都改成关闭
                                            element.hideColIgnoreTenant = false
                                          }
                                        });
                                        sessionStorage.setItem('intList', JSON.stringify(intList))
                                        sessionStorage.setItem('cuList', JSON.stringify(cuList))
                                        sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
                                        sessionStorage.setItem('treeList', JSON.stringify(treeList))
                                        sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                        sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                                        sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                                        sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                                        sessionStorage.setItem('fieldCrud',JSON.stringify(data));
                                        let formulArr: any[] = [];
                                        data.forEach((item: any) => {
                                          if (
                                            item.type != 'formula' &&
                                            item.systemFieldType != 6 &&
                                            item.systemFieldType != 7 &&
                                            item.systemFieldType != 8 &&
                                            item.systemFieldType != 9
                                          ) {
                                            formulArr.push({...item,label:item.name,value:item.code});
                                          }
                                        });
                                        console.log(
                                          data,
                                          'datadatadatadatadatadatadata'
                                        );
                                        sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                                        // setCookie('fieldCrud', JSON.stringify(data),null);
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'myField',
                                          args: {
                                            value: {
                                              items: data
                                            }
                                          }
                                        });
                                      } else {
                                        event.data.ceshi.push({
                                          appId: event.data.appId,
                                          needId: uuid.v4(),
                                          config: needConfig,
                                          // config: rightData,
                                          // config: JSON.stringify(rightData),
                                          // configs: rightData,
                                          ...rightData
                                        });
                                        event.data.ceshi.forEach(
                                          (element: any, index: number) => {
                                            element.sort = index + 1;
                                          }
                                        );
                                        let fieldCruds = event.data.ceshi.map(
                                          (res: any) => {
                                            // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                                            if (res.type != 'relation' && res.systemFieldType != 6
                                              && res.systemFieldType != 7 && res.systemFieldType != 9
                                               && res.systemFieldType != 8 && res.type != 'formula') {
                                              return res;
                                            }
                                          }
                                        );
                                        let puFieldCruds = event.data.ceshi.map(
                                          (res: any) => {
                                            if (
                                              !res.foreignKeyFlag &&
                                              res.systemFieldType == 0 &&
                                              res.type != 'relation'
                                            ) {
                                              return res;
                                            }
                                          }
                                        );
                                        let fieldKeyCruds = event.data.ceshi.map(
                                          (res: any) => {
                                            if (
                                              res.type != 'relation' &&
                                              res.type != 'formula' &&
                                              res.type != 'textarea' &&
                                              res.type != 'rich-text' &&
                                              res.type != 'json' &&
                                              res.type != 'attachment' &&
                                              res.type != 'image' &&
                                              res.type != 'ciphertext' &&
                                              res.type != 'users'
                                            ) {
                                              if (
                                                res.type == 'text' &&
                                                res.config.length < 768
                                              ) {
                                                return res;
                                              } else if (res.type != 'text') {
                                                return res;
                                              }
                                            }
                                          }
                                        );
                                        let waiList = event.data.ceshi.filter(
                                          (res: any) => {
                                            if (
                                              res.type == 'text' &&
                                              res.config.length >= 20 && res.systemFieldType == 0
                                            ) {
                                              return res;
                                            } else if (
                                              res.type == 'int' &&
                                              res.systemFieldType == 0 &&
                                              res.config.integerType == 'BIGINT'
                                            ) {
                                              return res;
                                            }
                                          }
                                        );
                                        sessionStorage.setItem('waiList',JSON.stringify(waiList));
                                        sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                                        sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                                        sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                                        event.data.ceshi.forEach((element: any, index: number) => {
                                          //开启是否忽略租户时，流水号不显示是否忽略租户
                                          if(element.type == "serial-number" && JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)) {
                                            element.hideColIgnoreTenant = true
                                            //当由关闭到开启时，没有点击编辑操作，直接下发时，将所有流水号字段都改成开启
                                            element.config.colIgnoreTenant = JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)
                                          } else if (element.type == "serial-number" && !JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)){
                                            //当由开启到关闭时，没有点击编辑操作，直接下发时，将所有流水号字段都改成关闭
                                            element.hideColIgnoreTenant = false
                                          }
                                        });
                                        sessionStorage.setItem('fieldCrud',JSON.stringify(event.data.ceshi));
                                        let formulArr: any[] = [];
                                        event.data.ceshi.forEach((item: any) => {
                                          if (
                                            item.type != 'formula' &&
                                            item.systemFieldType != 6 &&
                                            item.systemFieldType != 7 &&
                                            item.systemFieldType != 8 &&
                                            item.systemFieldType != 9
                                          ) {
                                            formulArr.push({...item,label:item.name,value:item.code});
                                          }
                                        });
                                        sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                                        // setCookie('fieldCrud', JSON.stringify(event.data.ceshi),null);
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'myField',
                                          args: {
                                            value: {
                                              items: event.data.ceshi
                                              // "items": event.data.ceshi
                                            }
                                          }
                                        });
                                      }
                                      doAction({
                                        actionType: 'reload',
                                        componentId: 'nameField'
                                      });
                                      // doAction({
                                      //     actionType: "close", componentId: "drawerId",
                                      // });
                                      toast.success('添加成功', {
                                        position: 'top-center'
                                      });
                                      isPrecisionChange = false
                                    }, 100);
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  ],
                  actions: [],
                  onEvent: {
                    change: {
                      weight: 0,
                      actions: [
                        {
                          actionType: 'custom',
                          script: function(_: any, doAction: any, event: any) {
                            console.log(event,'表单数据变化')
                            if(event.data.fieldType == 'time' || event.data.fieldType == 'datetime'){
                              if(Number(event.data.showPrecision) > Number(event.data.precision)){
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'showPrecision',
                                  args: {
                                    value: event.data.precision
                                  }
                                });
                              }
                                if(event.data.__super.__super.precision <= 3 && event.data.precision > 3){
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'precisionCompatible',
                                    args: {
                                      value: true
                                    }
                                  });
                                }else if(event.data.precision > 3 && event.data.precisionCompatible == true){
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'precisionCompatible',
                                    args: {
                                      value: true
                                    }
                                  });
                                }else{
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'precisionCompatible',
                                    args: {
                                      value: false
                                    }
                                  });
                                }
                            }
                            if(event.data.fieldType == 'serial-number'){
                              let lastData = getRulesNumber(event.data.rules)
                              console.log(lastData,'lastData')
                              doAction({
                                actionType: 'setValue',
                                componentId: 'combinationRules',
                                args: {
                                  value: lastData.join('')
                                }
                              });
                              //表单变化再判断是否置灰
                              const rrule = event.data.rules.filter(i=>i.type=='auto-increase')[0].options.rrule
                              if(rrule == 'fieldValuely' || rrule == 'none') {
                                doAction({ "actionType": "disabled", "componentId": "dateFieldAdd" })
                                doAction({ "actionType": "hidden", "componentId": "expireTime_select" })
                                doAction({
                                  actionType: "setValue",
                                  componentId: "dateFieldAdd",
                                  args: {
                                  value: ''
                                  }
                                })
                                doAction({
                                  actionType: "setValue",
                                  componentId: "expireTime_select",
                                  args: {
                                  value: ''
                                  }
                                })
                              } else {
                                doAction({ "actionType": "enabled", "componentId": "dateFieldAdd" })
                                doAction({ "actionType": "show", "componentId": "expireTime_select" })
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              ],
              onEvent: {
                stepChange: {
                  weight: 0,
                  actions: [
                    {
                      // "actionType": "reset",
                      // "actionType": "setValue",
                      // "componentId": "createForm",
                      // "args": {
                      //     "value": ""
                      // }
                      actionType: 'custom',
                      script: async function (_: any, doAction: any, event: any) {
                        console.log(_, '____');
                        console.log(
                          doAction,
                          'doActiondoActiondoActiondoAction'
                        );
                        console.log(event, 'eventeventeventevent切换');
                        isChange = false
                        isPrecisionChange = false
                        if (event.data.step == 2) {
                          if(event.data.fieldType == 'serial-number'){
                            let fieldList =  JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            let filterList:any[]= []
                            const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                            fieldList.forEach((item: any) => {
                              if(item.type == 'date' ||
                                item.type == 'datetime' ||
                                item.type == 'text'){
                                if(!systemFieldTypes.includes(item.systemFieldType)){
                                  filterList.push(item)
                                }
                              }
                            });
                            //排除非必填的
                            let dataFieldListR = filterList.filter((res: any) => (res.nullable == false))
                            sessionStorage.setItem('dateFieldList',JSON.stringify(dataFieldListR));
                            //除了系统字段、关系字段、json、图片、附件以外的字段
                            let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            //排除系统字段 1-9
                            let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                            //排除关系字段type = relation
                            let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                            //排除父级字段
                            let parList = relList.filter((res: any) => (res.type != 'parent'))
                            //排除流水号
                            let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                            //排除外键
                            let foreignKeyList = serList.filter((res: any) => (res.foreignKeyFlag == false))
                            //排除非必填的
                            let nullList = foreignKeyList.filter((res: any) => (res.nullable == false))
                            sessionStorage.setItem('serialRepeatField', JSON.stringify(nullList))
                            //排除json
                            let jsonList = foreignKeyList.filter((res: any) => (res.type != 'json'))
                            //排除图片
                            let picList = jsonList.filter((res: any) => (res.type != 'image'))
                            //排除附件
                            let attachList = picList.filter((res: any) => (res.type != 'attachment'))
                            sessionStorage.setItem('fieldTextList', JSON.stringify(attachList))
                            //初始先置灰，因为默认是不重复
                            doAction({ "actionType": "disabled", "componentId": "dateFieldAdd" })
                            doAction({ "actionType": "hidden", "componentId": "expireTime_select" })
                            doAction({
                              actionType: "setValue",
                              componentId: "dateFieldAdd",
                              args: {
                              value: ''
                              }
                            })
                            doAction({
                              actionType: "setValue",
                              componentId: "expireTime_select",
                              args: {
                              value: ''
                              }
                            })
                          }
                          document.getElementsByClassName('antd-Drawer-body')[0].scrollTop = 0;
                          if (
                            event.data.fieldType == 'user' ||
                            event.data.fieldType == 'users'
                          ) {
                            listUserApi().then((res: any) => {
                              console.log(res, 'ssss');
                              let asd = res.data.data.map((skjs: any) => {
                                return {
                                  ...skjs,
                                  label: skjs.nickname,
                                  value: skjs.username
                                };
                              });
                              sessionStorage.setItem('userSelectList',JSON.stringify(asd));
                            });
                          }
                          if (event.data.fieldType == 'enum') {
                            getZidian().then((res: any) => {
                              console.log(res, '获取字典数据');
                              dictionaryList = res.data.data;
                            });
                          }
                          if (event.data.fieldType == 'department') {
                            listAllDeptApi().then((res: any) => {
                              console.log(res, '部门数据');
                              let asd = res.data.data.map((skjs: any) => {
                                return {
                                  ...skjs
                                  // label:skjs.nickname,
                                  // value:skjs.username
                                };
                              });
                              sessionStorage.setItem('userSelectList',JSON.stringify(asd));
                            });
                          }
                          setTimeout(() => {
                            doAction({
                              actionType: 'reload',
                              componentId: 'formulaId'
                            });
                            window.scrollTo(0, 0);
                            if (
                              event.data.fieldType == 'date' ||
                              event.data.fieldType == 'datetime' ||
                              event.data.fieldType == 'date-range'
                            ) {
                              if (event.data.fieldType == 'date') {
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'createForm',
                                  args: {
                                    value: {
                                      defaultValueMode: 'static',
                                      defaultValue: '2020-01-01'
                                    }
                                  }
                                });
                              }
                              if (event.data.fieldType == 'datetime') {
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'createForm',
                                  args: {
                                    value: {
                                      defaultValueMode: 'static',
                                      defaultValue: '2020-01-01 00:00:00'
                                    }
                                  }
                                });
                              }
                              if (event.data.fieldType == 'date-range') {
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'createForm',
                                  args: {
                                    value: {
                                      defaultValueMode: 'static',
                                      dateTimeDefaultValue: "2020-01-01 00:00:00,2999-01-01 23:59:59",
                                      defaultValue: "2020-01-01 00:00:00,2999-01-01 23:59:59"
                                    }
                                  }
                                });
                              }
                            } else if(event.data.fieldType == 'serial-number'){
                              doAction({
                                actionType: 'setValue',
                                componentId: 'createForm',
                                args: {
                                  value: {
                                    defaultValueMode: 'null',
                                    defaultValue: '',
                                    combinationRules:new Date().getFullYear()+'001',
                                    rules:[
                                      {
                                        "type": "date",
                                        "format": "yyyy"
                                      },
                                      {
                                        "type": "auto-increase",
                                        "options": {
                                          "start": 1,
                                          "length": 3,
                                          "rrule": "none"
                                        }
                                      }
                                    ]
                                  }
                                }
                              });
                              if(JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)) {
                                doAction({
                                  "actionType": "hidden",
                                  "componentId": "addColIgnoreTenant"
                                })
                              }
                              doAction({
                                actionType: 'hidden',
                                componentId: 'parsedDateFormat'
                              });
                              if(JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!)) {
                                doAction({
                                  "actionType": "hidden",
                                  "componentId": "addColIgnoreTenant"
                                })
                              }
                            } else {
                              if (event.data.fieldType == 'date-range') {
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'createForm',
                                  args: {
                                    value: {
                                      defaultValueMode: 'null',
                                      defaultValue: '',
                                      format: 'datetime'
                                    }
                                  }
                                });
                              }else{
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'createForm',
                                  args: {
                                    value: {
                                      defaultValueMode: 'null',
                                      defaultValue: '',
                                    }
                                  }
                                });
                              }
                            }
                          }, 100);
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ],
      columns: [
        {
          name: 'code',
          // "name": "label",
          // "name": "fieldName",
          label: '字段名',
          align: 'center'
        },
        {
          // "name": "fieldDesc",
          name: 'name',
          label: '显示标题',
          align: 'center'
        },
        {
          // "name": "fieldTypeName",
          name: 'type',
          // "name": "dbType",
          // "name": "fieldType",
          label: '字段类型',
          // "value": "fieldType",
          type: 'mapping',
          map: {
            'text': '<span>单行文本</span>',
            'textarea': '<span>多行文本</span>',
            'serial-number': '<span>流水号</span>',
            'int': '<span>整数(Int)</span>',
            // "float": "${IF($decimalType == 'DECIMAL','<span>定点数</span>',IF($decimalType == 'DOUBLE','<span>双精度浮点数</span>','<span>浮点数(Float)</span>'))}",
            'float': '<span>小数</span>',
            'rich-text': '<span>富文本</span>',
            'money': '<span>金额</span>',
            'enum': '<span>枚举</span>',
            'boolean': '<span>布尔(开关)</span>',
            'date': '<span>日期</span>',
            'datetime': '<span>日期时间</span>',
            'date-range': '<span>日期范围</span>',
            'time': '<span>时间</span>',
            'attachment': '<span>附件</span>',
            'image': '<span>图片</span>',
            'user': '<span>人员信息</span>',
            'users': '<span>人员多选</span>',
            'department': '<span>部门信息</span>',
            'password': '<span>密码</span>',
            'ciphertext': '<span>密文</span>',
            'json': '<span>JSON</span>',
            'formula': '<span>公式</span>',
            'parent': '<span>父级</span>',
            'tenantCode': '<span>整数(Int)</span>',
            // "*":"${relationMode=='0'?'<span>1:1</span>':relationMode=='1'?'<span>n:1</span>':relationMode=='2'?'<span>1:n</span>':relationMode=='3'?'<span>n:n</span>':''}"
            '*': "${relationMode=='0'?'<span>一对一</span>':relationMode=='1'?'<span>多对一</span>':relationMode=='2'?'<span>一对多</span>':relationMode=='3'?'<span>多对多</span>':''}"
          },
          align: 'center'
        },
        {
          name: 'defaultValue',
          label: '默认值',
          align: 'center',
          width: 300,
          className: 'word-break',
          type: 'mapping',
          popOver: true,
          map: {
            // "${($defaultValue.includes('name') !== -1)}":"1111111111",
            '*': '${defaultValue|truncate:20}'
            // "*":"${IF((defaultValue.includes('name')),'你好',defaultValue)}"
            // "*":"${(defaultValue.includes('name')) ? defaultValue : '你好'}"
            // "*":"${(typeof defaultValue === 'string' && defaultValue.includes('name')) ? '你好' : defaultValue}"
            // "*":"${(defaultValue.indexOf('id') !== -1) ? '你好' : defaultValue}"
            // "*":'${(defaultValue.includes("name")) ? JSON.parse(defaultValue).map(obj => obj.name).join(",")) : defaultValue}'
            // 'typeof ${defaultValue} === "string"':"你好",
            // "*": '${(typeof defaultValue === "string") ? "你好" : defaultValue}'
            // "*": "${(typeof defaultValue == 'string' && defaultValue.includes('\"name\"')) ? ( defaultValue.map(obj => obj.name).join(',')) : defaultValue}"
          }
          // "itemSchema": {
          //     "type": "tag",
          //     "label": "${item | default: \"-\"}"
          //   }
          // "itemSchema":
          // // "<span style='color: red'>${item.name}</span>"
          // {
          //     "type": "tag",
          //     "label": "${defaultValue.name}"
          // }
          // "itemSchema": "<span style='color: red'>${item}</span>"
        },
        {
          name: 'nullable',
          // "name": "requiredFlag",
          label: '是否必填',
          type: 'mapping',
          map: {
            true: '<span >否</span>',
            false: '<span>是</span>'
            // "false": "<span >否</span>",
            // "true": "<span>是</span>"
          },
          align: 'center'
        },
        {
          name: 'foreignKeyFlag',
          label: '类型',
          type: 'mapping',
          // "value":"${systemFieldType==''?'普通':'系统'}",
          map: {
            '*': "${foreignKeyFlag?'外键':systemFieldType==0&&type!='relation'&&type!='parent'?'普通':type=='relation'?'关系':systemFieldType==1?'主键':type=='parent'?'父级':systemFieldType=='9'?'租户编码':'系统'}"
            // "*": "${foreignKeyFlag?'外键':systemFieldType=='NONE'&&type!='relation'?'普通':type=='relation'?'关系':systemFieldType=='PRIMARY_KEY'?'主键':'系统'}"
            // "true": "<span>外键</span>",
            // "systemFieldType==''": "<span>普通</span>",
            // "systemFieldType!=''": "<span>系统</span>",
          },
          align: 'center'
        },
        {
          type: 'operation',
          label: '操作',
          align: 'center',
          buttons: [
            {
              label: '修改',
              type: 'button',
              disabledOn:
                "${(systemFieldType != 0 && systemFieldType != 1) || type == 'relation' || type == 'parent' || systemFieldType == 9 || foreignKeyFlag}",
              // "disabledOn": "${systemFieldType != 'NONE' || type == 'relation'}",
              // "disabledOn": "${selfContainFlag}",
              level: 'link',
              actionType: 'drawer',
              onEvent: {
                click: {
                  "weight": 0,
                  "debounce": {
                    "wait": 100
                  },
                  actions: [
                    {
                      actionType: 'custom',
                      script: async function (e: any, doAction: any, event: any) {
                        console.log('字段集合修改');
                        console.log(e, 'eeeeee');
                        console.log(doAction, 'doActiondoAction');
                        console.log(event, 'eventeventeventeventevent');
                        let fieldList =  JSON.parse(sessionStorage.getItem('fieldCrud')!)
                        let filterList:any[]= []
                        const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                        fieldList.forEach((item: any) => {
                          if(item.type == 'date' ||
                            item.type == 'datetime' ||
                            item.type == 'text'){
                            if(!systemFieldTypes.includes(item.systemFieldType) && item.code != event.data.code){
                              filterList.push(item)
                            }
                          }
                        });
                        let dataFieldListR = filterList.filter((res: any) => (res.nullable == false))
                        sessionStorage.setItem('dateFieldList',JSON.stringify(dataFieldListR));
                        if (event.data.type == 'enum') {
                          getZidian().then((res: any) => {
                            console.log(res, '获取字典数据');
                            dictionaryList = res.data.data;
                            res.data.data.forEach(wsw=>{
                              if(wsw.type == event.data.config.sources){
                                setTimeout(()=>{
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'ziTree',
                                  args: {
                                    value: wsw.name
                                  }
                                });
                                },1000)
                              }
                            })
                          });
                        }
                        if (
                          event.data.config.type == 'user' ||
                          event.data.config.type == 'users'
                        ) {
                          listUserApi().then((res: any) => {
                            console.log(res, 'ssss');
                            let asd = res.data.data.map((skjs: any) => {
                              return {
                                ...skjs,
                                label: skjs.nickname,
                                value: skjs.username
                              };
                            });
                            if (event.data.defaultValue == '') {
                              // asd.unshift({
                              //     label: '无',
                              //     value: ''
                              // })
                            }
                            sessionStorage.setItem('userSelectList',JSON.stringify(asd));
                          });
                        }
                        if (event.data.config.type == 'department') {
                          listAllDeptApi().then((res: any) => {
                            console.log(res, '部门数据');
                            let asd = res.data.data.map((skjs: any) => {
                              return {
                                ...skjs
                              };
                            });
                            sessionStorage.setItem('userSelectList',JSON.stringify(asd));
                          });
                        }
                        if (event.data.config.type == 'serial-number'){
                          //除了系统字段、关系字段、json、图片、附件以外的字段
                          let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                          //排除系统字段 1-9
                          let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                          //排除关系字段type = relation
                          let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                          //排除父级字段
                          let parList = relList.filter((res: any) => (res.type != 'parent'))
                          //排除流水号
                          let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                          //排除外键
                          let foreignKeyList = serList.filter((res: any) => (res.foreignKeyFlag == false))
                          //排除非必填的
                          let nullList = foreignKeyList.filter((res: any) => (res.nullable == false))
                          sessionStorage.setItem('serialRepeatField', JSON.stringify(nullList))
                          //排除json
                          let jsonList = foreignKeyList.filter((res: any) => (res.type != 'json'))
                          //排除图片
                          let picList = jsonList.filter((res: any) => (res.type != 'image'))
                          //排除附件
                          let attachList = picList.filter((res: any) => (res.type != 'attachment'))
                          sessionStorage.setItem('fieldTextList', JSON.stringify(attachList))
                          let lastData =  getRulesNumber(event.data.config.rules)
                          console.log(lastData,'lastData')
                          setTimeout(() => {
                            doAction({
                              actionType: 'setValue',
                              componentId: 'combinationRules',
                              args: {
                                value: lastData.join('')
                              }
                            });
                            doAction({
                              actionType: 'setValue',
                              componentId: 'expireTime_select',
                              args: {
                                value: 'serialClearSchedule' in event.data.config ?
                                  event.data.config.serialClearSchedule.length == 0 ? 12 : event.data.config.serialClearSchedule[0]?.months : 12
                              }
                            })
                          }, 1000);
                        }
                        if(event.data.type == 'date-range'){
                          let dateRangeType = ''
                          if(event.data.config.dbType == "DATETIME"){
                            dateRangeType = 'dateTimeDefaultValue'
                          }else if(event.data.config.dbType == "DATE"){
                            dateRangeType = 'dateDefaultValue'
                          }else if(event.data.config.dbType == "TIME"){
                            dateRangeType = 'timeDefaultValue'
                          }
                          setTimeout(() => {
                            doAction({
                              actionType: 'setValue',
                              componentId: dateRangeType,
                              args: {
                                value: event.data.defaultValue
                              }
                            });
                          }, 1000);
                        }
                        addRule(
                          // 校验名
                          'isEdit',
                          // 校验函数，values 是表单里所有表单项的值，可用于做联合校验；value 是当前表单项的值
                          (values, value) => {
                            let sameName = false;
                            let sameNames = false;
                            let sameNamess = false;
                            let keyName = false;
                            console.log(values, '11111111111');
                            console.log(value, '2222222222');
                            let fieldCrudData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            let haveContentCode = []
                            haveContentCode = fieldCrudData.filter((res: any) => {
                              return res.systemFieldType == 9
                            })
                            let tenantCodeName = 'tenantCode'
                            if (haveContentCode.length > 0) {
                              tenantCodeName = haveContentCode[0].code
                            }
                            let haveTreeParent = []
                            haveTreeParent = fieldCrudData.filter((res: any) => {
                              return res.type == 'parent'
                            })
                            let treeParentName = 'parentId'
                            if (haveTreeParent.length > 0) {
                              treeParentName = haveTreeParent[0].code
                            }
                            if (
                              value.toUpperCase() == 'ID' ||
                              value.toUpperCase() == treeParentName.toUpperCase() ||
                              value.toUpperCase() == tenantCodeName.toUpperCase() ||
                              value.toUpperCase() == 'CREATEDAT' ||
                              value.toUpperCase() == 'UPDATEDAT' ||
                              value.toUpperCase() == 'CREATEDBY' ||
                              value.toUpperCase() == 'UPDATEBY' ||
                              value.toUpperCase() == 'DELETEDBY' ||
                              value.toUpperCase() == 'DELETEDAT' ||
                              value.toUpperCase() == 'DELETED'
                            ) {
                              return {
                                error: true,
                                msg: '字段名不能和系统字段同名，请换个名字。'
                              };
                            }
                            let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                            let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!);
                            dataArr.forEach((res: any) => {
                              if (values.needId) {
                                if (
                                  res.code.toUpperCase() == value.toUpperCase() &&
                                  res.needId != values.needId
                                ) {
                                  console.log('进入');
                                  sameName = true;
                                  return {
                                    error: true,
                                    msg:
                                      '字段名「' +
                                      value +
                                      '」已被占用（不区分大小写），请换个名字。'
                                  };
                                }
                                if (res.type == 'date-range') {
                                  let time = value + '_time';
                                  let stime = value + '_stime';
                                  let etime = value + '_etime';
                                  let fileTime = res.code + '_time';
                                  let fileStime = res.code + '_stime';
                                  let fileEtime = res.code + '_etime';
                                  if (
                                    res.code.toUpperCase() == time.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        time +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == stime.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        stime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == etime.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == value.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    fileTime.toUpperCase() == value.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    fileStime.toUpperCase() == value.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    fileEtime.toUpperCase() == value.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  }
                                }
                                if (values.fieldType == 'date-range') {
                                  let time = value + '_time';
                                  let stime = value + '_stime';
                                  let etime = value + '_etime';
                                  if (
                                    res.code.toUpperCase() == time.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        time +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == stime.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        stime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == etime.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == value.toUpperCase() &&
                                    res.needId != values.needId
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  }
                                }
                              } else {
                                if (
                                  res.code.toUpperCase() == value.toUpperCase() &&
                                  res.id != values.id
                                ) {
                                  console.log('进入');
                                  sameName = true;
                                  return {
                                    error: true,
                                    msg:
                                      '字段名「' +
                                      value +
                                      '」已被占用（不区分大小写），请换个名字。'
                                  };
                                }
                                if (res.type == 'date-range') {
                                  let time = value + '_time';
                                  let stime = value + '_stime';
                                  let etime = value + '_etime';
                                  let fileTime = res.code + '_time';
                                  let fileStime = res.code + '_stime';
                                  let fileEtime = res.code + '_etime';
                                  if (
                                    res.code.toUpperCase() == time.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        time +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == stime.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        stime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == etime.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == value.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    fileTime.toUpperCase() == value.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    fileStime.toUpperCase() == value.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    fileEtime.toUpperCase() == value.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  }
                                }
                                if (values.fieldType == 'date-range') {
                                  let time = value + '_time';
                                  let stime = value + '_stime';
                                  let etime = value + '_etime';
                                  if (
                                    res.code.toUpperCase() == time.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        time +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == stime.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        stime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == etime.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  } else if (
                                    res.code.toUpperCase() == value.toUpperCase() &&
                                    res.id != values.id
                                  ) {
                                    sameNames = true;
                                    return {
                                      error: true,
                                      msg:
                                        '字段名「' +
                                        etime +
                                        '」已被占用（不区分大小写），请换个名字。'
                                    };
                                  }
                                }
                              }
                            });
                            console.log(cacheEditLists, 'cacheEditLists');
                            if (cacheEditLists && cacheEditLists.length > 1) {
                              cacheEditLists.forEach((lists: any) => {
                                if (
                                  lists.code.toUpperCase() == value.toUpperCase()
                                ) {
                                  sameNamess = true;
                                }
                              });
                            }
                            // let keyArr = JSON.parse(sessionStorage.getItem('keyCrud')!);
                            // if (
                            //   (values.unique && values.unique == false) ||
                            //   values.config.unique == false
                            // ) {
                            //   keyArr.forEach((element: any) => {
                            //     if (values.needId) {
                            //       if (
                            //         element.code.toUpperCase() ==
                            //           values.code.toUpperCase() &&
                            //         !element.systemIndex
                            //       ) {
                            //         keyName = true;
                            //       }
                            //     } else {
                            //       if (
                            //         element.code.toUpperCase() ==
                            //           values.code.toUpperCase() &&
                            //         !element.systemIndex
                            //       ) {
                            //         keyName = true;
                            //       }
                            //     }
                            //   });
                            // }
                            if (sameName) {
                              return {
                                error: true,
                                msg:
                                  '字段名「' +
                                  value +
                                  '」已被占用（不区分大小写），请换个名字。'
                              };
                            } else if (sameNames) {
                              return {
                                error: true,
                                msg: '字段名已被占用（不区分大小写），请换个名字。'
                              };
                            } else if (sameNamess) {
                              return {
                                error: true,
                                msg: '字段名被循环修改过，请换个名字。'
                              };
                            } else if (keyName) {
                              return {
                                error: true,
                                msg: '字段名与索引列表字段名重复，请修改。'
                              };
                            } else {
                              return true;
                            }
                          }
                        );
                        addRule('timeRules',(values,value) => {
                          let isNot = false;
                          isNot = !(validateTimeInput(value,values.type, values.config.precision))
                          if(isNot){
                            return {
                              error: true,
                              msg: '请根据精度输入正确格式默认值'
                            };
                          } else {
                            return true;
                          }
                        });
                        addRule(
                          // 校验名
                          'isEditHaveMo',
                          // 校验函数，values 是表单里所有表单项的值，可用于做联合校验；value 是当前表单项的值
                          (values, value) => {
                            console.log(values, '校验默认值');
                            console.log(value, '默认值数据');
                            let sameName = false;
                            if (values.type != 'boolean' && values.type != 'float') {
                              if (values.config.nullable) {
                                if (values.type == 'date-range') {
                                  if (values.config.dbType == 'DATETIME') {
                                    if (values.config.dateTimeDefaultValue == '') {
                                      sameName = true;
                                    }
                                    if (!values.config.dateTimeDefaultValue) {
                                      sameName = true;
                                    }
                                  } else if (values.config.dbType == 'DATE') {
                                    if (values.config.dateDefaultValue == '') {
                                      sameName = true;
                                    }
                                    if (!values.config.dateDefaultValue) {
                                      sameName = true;
                                    }
                                  } else if (values.config.dbType == 'TIME') {
                                    if (values.config.timeDefaultValue == '') {
                                      sameName = true;
                                    }
                                    if (!values.config.timeDefaultValue) {
                                      sameName = true;
                                    }
                                  }
                                } else {
                                  if (
                                    !value &&
                                    values.type != 'text' &&
                                    values.type != 'textarea' &&
                                    values.type != 'user' &&
                                    values.type != 'users' &&
                                    values.type != 'department'
                                  ) {
                                    sameName = true;
                                    if (value == 0) {
                                      sameName = false;
                                    }
                                  } else if (
                                    !values.defaultValue &&
                                    values.type != 'text' &&
                                    values.type != 'textarea' &&
                                    values.type != 'user' &&
                                    values.type != 'users' &&
                                    values.type != 'department'
                                  ) {
                                    sameName = true;
                                  } else if (
                                    values.defaultValue == '' &&
                                    values.type != 'text' &&
                                    values.type != 'textarea' &&
                                    values.type != 'user' &&
                                    values.type != 'users' &&
                                    values.type != 'department'
                                  ) {
                                    sameName = true;
                                  }
                                }
                                // }
                              }else{
                                sameName = false
                              }
                            }
                            if (sameName) {
                              return {
                                error: true,
                                msg: '这是必填项'
                                // msg: '已允许空值，请设置默认值'
                              };
                            } else {
                              return true;
                            }
                          }
                        );
                        addRule(
                          // 校验名
                          'longData',
                          // 校验函数，values 是表单里所有表单项的值，可用于做联合校验；value 是当前表单项的值
                          (values: any, value: any) => {
                            console.log(values, '长度值');
                            console.log(value, '长度值1111');
                            let sameName = false;
                            let sameNames = false;
                            let sameNamess = false;
                            if (!values.needId) {
                              let bi =
                                Number(values.__super.config.length) >
                                Number(value);
                              console.log(bi, 'bibibibibibibibi');
                              if (bi) {
                                sameName = true;
                              }
                            }
                            if(Number(value)>768 && values.config.unique){
                              sameNamess = true
                            }
                            console.log(sameName, 'sameName');
                            // if (sameName) {
                            //   return {
                            //     error: true,
                            //     msg:
                            //       '长度不能小于数据库字段现有长度' +
                            //       values.__super.config.length
                            //   };
                            // } else
                            if (sameNames) {
                              return {
                                error: true,
                                msg: '该字段已被设为索引，长度不能超过768'
                              };
                            } else if(sameNamess){
                              return {
                                error: true,
                                msg: '长度大于768不能作为唯一索引'
                              };
                            } else {
                              return true;
                            }
                          }
                        );
                        addRule('tokenValidations',(values, value) => {
                          let longLength = false
                          let mastLongLength = false
                          const regex = /^.{17,}$/;
                          const mastRegex = /^.{16}$/;
                          if(regex.test(value)){
                            longLength = true
                          }
                          if(!mastRegex.test(value)){
                            mastLongLength = true
                          }
                          if (longLength) {
                            return {
                              error: true,
                              msg: '密钥字段长度不能超过16位！'
                            };
                          } else if (mastLongLength) {
                            return {
                              error: true,
                              msg: '密钥字段长度必须是16位！'
                            };
                          } else {
                            return true;
                          }
                        });
                      }
                    }
                  ]
                }
              },
              drawer: {
                resizable: true,
                position: 'right',
                title: '编辑${modelName}字段【${code}】',
                body: {
                  id: 'editForm',
                  type: 'form',
                  body: [
                    {
                      visibleOn: "(this.relation !== '' && this.systemFieldType != 1)",
                      label: '字段名',
                      type: 'input-text',
                      required: true,
                      placeholder: '表中的名称，建议英文和下划线',
                      name: 'code',
                      validations: {
                        matchRegexp: '^[a-zA-Z_][A-Za-z0-9_]*$',
                        isEdit: true
                      },
                      validationErrors: {
                        matchRegexp: '请填写规范字段名'
                      }
                    },
                    {
                      visibleOn: "(this.relation !== '' && this.systemFieldType != 1)",
                      label: '显示名称',
                      required: true,
                      type: 'input-text',
                      // "value": "${code}",
                      placeholder: '字段展示的名称，可以是中文',
                      name: 'name',
                      id: 'name',
                      validations: {
                        isSameName: true
                      }
                    },
                    {
                      label: '描述',
                      type: 'textarea',
                      mode: 'horizontal',
                      desc: '字段底部显示的描述信息',
                      name: 'description',
                      maxLength: 200,
                      visibleOn: "this.systemFieldType != 1",
                    },
                    {
                      visibleOn:"this.type == 'serial-number'",
                      "type": "input-text",
                      "label": "组合规则",
                      "id": "combinationRules",
                      "name": "combinationRules",
                      "value": "",
                      "static": true
                    },
                    {
                      visibleOn:"this.type == 'serial-number'",
                      validations: {
                        isRulesVal: true
                      },
                      "type": "combo",
                      "name": "config.rules",
                      "strictMode":false,
                      "label": "",
                      "addButtonText":"添加规则",
                      "multiLine": false,
                      "multiple": true,
                      "typeSwitchable": false,
                      "value": [],
                      "draggable": true,
                      "conditions": [
                        {
                          "label": "文本字符",
                          "test": "this.type === \"text\"",
                          "scaffold": {
                            "type": "text",
                            "text": ""
                          },
                          "items": [
                            {
                              "label": "文本字符",
                              "name": "text",
                              "type": "input-text",
                              "onEvent": {
                                "change": {
                                  "weight": 0,
                                  "actions": [
                                    {
                                      actionType: 'custom',
                                      script: function(_: any, doAction: any, event: any) {
                                        console.log(event,'eventevent')
                                        let rulesArr:any = []
                                        event.data.config.rules.forEach((rule: any,inde:number) => {
                                          if(inde == event.data.index){
                                            rulesArr.push({...rule,text:event.data.text})
                                          }else{
                                            rulesArr.push(rule)
                                          }
                                        })
                                        console.log(rulesArr,'rulesArrrulesArr')
                                        let lastData =  getRulesNumber(rulesArr)
                                        console.log(lastData,'lastData')
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'combinationRules',
                                          args: {
                                            value: lastData.join('')
                                          }
                                        });
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        },
                        {
                          "label": "创建时间",
                          "test": "this.type === \"date\"",
                          "scaffold": {
                            "type": "date",
                            "format": "yyyy"
                          },
                          "items": [
                            {
                              "name": "format",
                              "label": "创建时间",
                              "type": "select",
                              "options": [
                                {
                                  "label": "年（YYYY）",
                                  "value": "yyyy"
                                },{
                                  "label": "年月",
                                  "value": "yyyyMM"
                                },{
                                  "label": "年月日",
                                  "value": "yyyyMMdd"
                                },{
                                  "label": "年（YY）",
                                  "value": "yy"
                                },{
                                  "label": "月",
                                  "value": "MM"
                                },{
                                  "label": "日",
                                  "value": "dd"
                                },{
                                  "label": "年月日时",
                                  "value": "yyyyMMddHH"
                                },{
                                  "label": "年月日时分",
                                  "value": "yyyyMMddHHmm"
                                },{
                                  "label": "年月日时分秒",
                                  "value": "yyyyMMddHHmmss"
                                }
                              ],
                              "onEvent": {
                                "change": {
                                  "weight": 0,
                                  "actions": [
                                    {
                                      actionType: 'custom',
                                      script: function(_: any, doAction: any, event: any) {
                                        console.log(event,'event创建时间')
                                        let rulesArr:any = []
                                        event.data.config.rules.forEach((rule: any,inde:number) => {
                                          if(inde == event.data.index){
                                            rulesArr.push({...rule,format:event.data.format})
                                          }else{
                                            rulesArr.push(rule)
                                          }
                                        })
                                        console.log(rulesArr,'rulesArrrulesArr')
                                        let lastData = getRulesNumber(rulesArr)
                                        console.log(lastData,'lastData')
                                        doAction({
                                          actionType: 'setValue',
                                          componentId: 'combinationRules',
                                          args: {
                                            value: lastData.join('')
                                          }
                                        });
                                      }
                                    }
                                  ]
                                }
                              }
                            },
                          ]
                        },
                        {
                          "label": "自动编码",
                          "test": "this.type === \"auto-increase\"",
                          "scaffold": {
                            "type": "auto-increase",
                            "options":{
                              "start": 1,
                              "length": 3,
                              "rrule":"none"
                            }
                          },
                          "items": [
                            {
                              "type": "input-sub-form",
                              "name": "options",
                              "label": "自动编码",
                              "btnLabel": "设置",
                              "form": {
                                "title": "编号设置",
                                "body": [
                                  {
                                    "name": "start",
                                    "label": "起始值",
                                    "type": "input-number"
                                  },
                                  {
                                    "name": "length",
                                    "label": "固定位数",
                                    "type": "input-number"
                                  },
                                  {
                                    "name":"rrule",
                                    "label":"重复规则",
                                    "type": "select",
                                    "options": [
                                      {
                                        "label": "不重复",
                                        "value": "none"
                                      },{
                                        "label": "每天重复",
                                        "value": "daily"
                                      },{
                                        "label": "每周重复",
                                        "value": "weekly"
                                      },{
                                        "label": "每月重复",
                                        "value": "monthly"
                                      },{
                                        "label": "每季重复",
                                        "value": "quarterly"
                                      },{
                                        "label": "每年重复",
                                        "value": "yearly"
                                      },{
                                        "label": "不同字段值重复",
                                        "value": "fieldValuely"
                                      },
                                    ],
                                    "onEvent": {
                                      "change": {
                                        "actions": [
                                          {
                                            "actionType": "custom",
                                            script: function (_: any, doAction: any, event: any) {
                                              let data = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                              //排除系统字段 1-9
                                              let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                                              //排除关系字段type = relation
                                              let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                                              //排除父级字段
                                              let parList = relList.filter((res: any) => (res.type != 'parent'))
                                              //排除流水号
                                              let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                                              //排除非必填的
                                              let nullList = serList.filter((res: any) => (res.nullable == false))
                                              //排除外键
                                              let foreignKeyList = nullList.filter((res: any) => (res.foreignKeyFlag == false))
                                              sessionStorage.setItem('serialRepeatField', JSON.stringify(foreignKeyList))
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  {
                                    "name":"fieldKey",
                                    "label":"识别字段",
                                    "type": "select",
                                    "visibleOn": "${rrule=='fieldValuely'}",
                                    "labelField": "name",
                                    "valueField": "code",
                                    "required": true,
                                    "source": "${ss:serialRepeatField}"
                                  }
                                ],
                                "actions": [
                                  {
                                    "type": "submit",
                                    "label": "提交",
                                    "primary": true,
                                    "onEvent": {
                                      "click": {
                                        "weight": 0,
                                        "actions": [
                                          {
                                            actionType: 'custom',
                                            script: function(_: any, doAction: any, event: any) {
                                              console.log(event,'event自动编码')
                                              let rulesArr:any = []
                                              event.data.config.rules.forEach((rule: any,inde:number) => {
                                                if(inde == event.data.index){
                                                  rulesArr.push({...rule,options: {
                                                      "start": event.data.start,
                                                      "length": event.data.length,
                                                      "rrule": event.data.rrule
                                                    }})
                                                }else{
                                                  rulesArr.push(rule)
                                                }
                                              })
                                              console.log(rulesArr,'rulesArrrulesArr')
                                              let lastData = getRulesNumber(rulesArr)
                                              console.log(lastData,'lastData')
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'combinationRules',
                                                args: {
                                                  value: lastData.join('')
                                                }
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }

                                  }
                                ]
                              }
                            }
                          ]
                        },
                        {
                          "label": "字段文本",
                          "test": "this.type === \"field\"",
                          "scaffold": {
                            "type": "field",
                            "fieldCode": ""
                          },
                          "items": [
                            {
                              "name": "fieldCode",
                              "label": "字段文本",
                              "type": "input-sub-form",
                              "btnLabel": "设置",
                              "validateOnChange": true,
                              "form": {
                                "title": "字段文本设置",
                                "onEvent": {
                                  "inited": {
                                  "actions": [
                                    {
                                      "actionType": "custom",
                                      "script": async function(_, doAction, event){
                                        const data = JSON.parse(sessionStorage.getItem('fieldTextList')!)
                                        const selected = data.filter(i=>i.code == event.data.fieldCode)
                                        if(selected && selected[0].type == 'relation') {
                                          doAction({
                                            actionType: 'show',
                                            componentId: 'relationField'
                                          });
                                          let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                          const filterRelation = affData.filter(i=>i.code == event.data.fieldCode)
                                          let targetKey=''
                                          if(filterRelation && filterRelation.length > 0) {
                                            targetKey = filterRelation[0].targetKey
                                            const res = await getColumnSelect(targetKey)
                                            //除了系统字段、关系字段、json、图片、附件以外的字段
                                            let data = res.data.data
                                            //排除系统字段 1-9
                                            let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                                            //排除关系字段type = relation
                                            let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                                            //排除父级字段
                                            let parList = relList.filter((res: any) => (res.type != 'parent'))
                                            //排除流水号
                                            let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                                            //排除外键
                                            let foreignKeyList = serList.filter((res: any) => (res.foreignKeyFlag == false))
                                            //排除json
                                            let jsonList = foreignKeyList.filter((res: any) => (res.type != 'json'))
                                            //排除图片
                                            let picList = jsonList.filter((res: any) => (res.type != 'image'))
                                            //排除附件
                                            let attachList = picList.filter((res: any) => (res.type != 'attachment'))
                                            sessionStorage.setItem('relationField', JSON.stringify(attachList))
                                          }
                                        } else {
                                          doAction({
                                            actionType: 'clear',
                                            componentId: 'relationField',
                                          });
                                          setTimeout(()=>{
                                            doAction({
                                              actionType: 'hidden',
                                              componentId: 'relationField'
                                            });
                                          },300)
                                        }
                                      }
                                    }
                                  ]
                                },
                                },
                                "body": [
                                  {
                                    "name":"fieldCode",
                                    "label":"字段文本",
                                    "type": "select",
                                    "required": true,
                                    "source": "${ss:fieldTextList}",
                                    "onEvent": {
                                      "change": {
                                        "actions": [
                                          {
                                            "actionType": "custom",
                                            script: async function (_: any, doAction: any, event: any) {
                                              const selected = event.data.options.filter(i=>i.code == event.data.fieldCode)
                                              if(selected && selected[0].type == 'relation') {
                                                doAction({
                                                  actionType: 'show',
                                                  componentId: 'relationField'
                                                });
                                                let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
                                                const filterRelation = affData.filter(i=>i.code == event.data.fieldCode)
                                                let targetKey=''
                                                if(filterRelation && filterRelation.length > 0) {
                                                  targetKey = filterRelation[0].targetKey
                                                  const res = await getColumnSelect(targetKey)
                                                  //除了系统字段、关系字段、json、图片、附件以外的字段
                                                  let data = res.data.data
                                                  //排除系统字段 1-9
                                                  let sysList = data.filter((res: any) => (res.systemFieldType == 0))
                                                  //排除关系字段type = relation
                                                  let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                                                  //排除父级字段
                                                  let parList = relList.filter((res: any) => (res.type != 'parent'))
                                                  //排除流水号
                                                  let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                                                  //排除外键
                                                  let foreignKeyList = serList.filter((res: any) => (res.foreignKeyFlag == false))
                                                  //排除json
                                                  let jsonList = foreignKeyList.filter((res: any) => (res.type != 'json'))
                                                  //排除图片
                                                  let picList = jsonList.filter((res: any) => (res.type != 'image'))
                                                  //排除附件
                                                  let attachList = picList.filter((res: any) => (res.type != 'attachment'))
                                                  sessionStorage.setItem('relationField', JSON.stringify(attachList))
                                                }
                                              } else {
                                                doAction({
                                                  actionType: 'clear',
                                                  componentId: 'relationField',
                                                });
                                                setTimeout(()=>{
                                                  doAction({
                                                    actionType: 'hidden',
                                                    componentId: 'relationField'
                                                  });
                                                },300)
                                              }
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  {
                                    "name":"relationField",
                                    "id": "relationField",
                                    "label":"关系表字段",
                                    "type": "select",
                                    "labelField": "name",
                                    "valueField": "code",
                                    "required": true,
                                    "visibleOn": "${fieldCode}",
                                    "source": "${ss:relationField}"
                                  }
                                ],
                                "actions": [
                                  {
                                    "type": "submit",
                                    "label": "提交",
                                    "primary": true,
                                    "onEvent": {
                                      "click": {
                                        "weight": 0,
                                        "actions": [
                                          {
                                            actionType: 'custom',
                                            script: function(_: any, doAction: any, event: any) {
                                              let rulesArr:any = []
                                              event.data.config.rules.forEach((rule: any,inde:number) => {
                                                if(inde == event.data.index){
                                                  rulesArr.push({...rule,fieldCode: {
                                                    "fieldCode": event.data.fieldCode,
                                                    "relationField": event.data.relationField,
                                                  }})
                                                }else{
                                                  rulesArr.push(rule)
                                                }
                                              })
                                              let lastData = getRulesNumber(rulesArr)
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'combinationRules',
                                                args: {
                                                  value: lastData.join('')
                                                }
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                                ]
                              },
                            },
                          ]
                        }
                      ],
                      "items": [],
                      "onEvent": {
                        "delete":{
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                let rulesArr:any = event.data.config.rules.filter((res,index)=>{
                                  return index != event.data.key
                                })
                                let lastData = getRulesNumber(rulesArr)
                                const rrule = rulesArr.filter(i=>i.type=='auto-increase').lengh > 0 ? rulesArr.filter(i=>i.type=='auto-increase')[0].options.rrule : ''
                                if(rrule == '') {
                                  doAction({ "actionType": "disabled", "componentId": "edit_serial_log" })
                                  doAction({ "actionType": "enabled", "componentId": "dateFieldEdit" })
                                  doAction({ "actionType": "show", "componentId": "expireTime_select" })
                                } else {
                                  doAction({ "actionType": "enabled", "componentId": "edit_serial_log" })
                                  if(rrule == 'fieldValuely' || rrule == 'none') {
                                    doAction({ "actionType": "disabled", "componentId": "dateFieldEdit" })
                                    doAction({ "actionType": "hidden", "componentId": "expireTime_select" })
                                    doAction({
                                      actionType: "setValue",
                                      componentId: "dateFieldEdit",
                                      args: {
                                        value: ''
                                      }
                                    })
                                    doAction({
                                      actionType: "setValue",
                                      componentId: "expireTime_select",
                                      args: {
                                        value: ''
                                      }
                                    })
                                  } else {
                                    doAction({ "actionType": "enabled", "componentId": "dateFieldEdit" })
                                    doAction({ "actionType": "show", "componentId": "expireTime_select" })
                                  }
                                }
                                sessionStorage.setItem('rrule',JSON.stringify(rrule));
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'combinationRules',
                                  args: {
                                    value: lastData.join('')
                                  }
                                });
                              }
                            }
                          ]
                        },
                        "dragEnd":{
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                console.log(event,'eventeventevent')
                                let lastData = getRulesNumber(event.data.config.rules)
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'combinationRules',
                                  args: {
                                    value: lastData.join('')
                                  }
                                });
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn: "(this.type == 'money')",
                      // "visibleOn": "(this.fieldType == 'money')",
                      label: '币种',
                      type: 'select',
                      name: 'config.currency',
                      value: 'CNY',
                      source: {
                        method: 'get',
                        url: useAdminBaseUrl('/system/dict-data/list?dictType=currency&status=0'),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: {...payload.data, options: payload.data}
                          };
                        }
                      }
                    },
                    {
                      visibleOn:
                        "this.type == 'date-range' || this.type == 'text' || this.type == 'textarea' || (this.type == 'int'  && this.systemFieldType != 1) || this.type == 'float' || this.type =='rich-text' || this.type == 'boolean' || this.type == 'time' || this.type == 'enum' || this.type == 'money' || this.type == 'department' || this.type == 'password' || this.type == 'ciphertext'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      desc: "${(defaultValueMode=='expression'?'只支持SQL表达式':'')}",
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                        // {
                        //     "label": "表达式",
                        //     "value": "expression",
                        // }
                      ],
                    },
                    {
                      visibleOn: "this.type == 'serial-number' && this.config.orderEvent",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static',
                          disabled: true
                        }
                      ],
                    },
                    {
                      visibleOn: '${type == "serial-number" && config.defaultValueMode == "null" && !config.orderEvent}',
                      label: '默认值',
                      type: 'select',
                      name: 'config.defaultValueMode',
                      value: 'null',
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                      ],
                    },
                    {
                      visibleOn: "this.type == 'serial-number' && this.config.defaultValueMode == 'static' && !this.config.orderEvent",
                      label: '默认值',
                      type: 'select',
                      name: 'config.defaultValueMode',
                      desc: "<div style='color: red'>请确认流水号类型的默认值为不设置，否则将不能正确处理</div>",
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                      ],
                    },
                    {
                      visibleOn:
                        "this.type == 'date' || this.type == 'datetime'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'static',
                      desc: "${(defaultValueMode=='expression'?'只支持SQL表达式':'')}",
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                        // {
                        //     "label": "表达式",
                        //     "value": "expression",
                        // }
                      ],
                    },
                    {
                      // "hiddenOn": "this.type == 'serial_number' || this.foreignKeyFlag",
                      visibleOn: "(this.type == 'int' && this.foreignKeyFlag)",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      desc: "${(defaultValueMode=='expression'?'只支持SQL表达式':'')}",
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                        // {
                        //     "label": "表达式",
                        //     "value": "expression",
                        // }
                      ],
                      disabled: "this.dbType != 'int'"
                    },
                    {
                      visibleOn:
                        "this.defaultValueMode=='expression' && this.type !== 'users' && this.type !== 'datetime'",
                      // "visibleOn": "this.defaultValueMode=='expression' && this.fieldType !== 'users' && this.fieldType !== 'datetime'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      value: '',
                      placeholder: '默认值',
                      desc: '请确认SQL语句正确，否则会造成数据库问题。',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.defaultValueMode=='expression' &&  this.type == 'datetime'",
                      // "visibleOn": "this.defaultValueMode=='expression' &&  this.fieldType == 'datetime'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      value: '',
                      placeholder: '默认值',
                      options: [
                        {
                          label: '当前时间',
                          value: 'CURRENT_TIMESTAMP'
                        }
                      ],
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "((this.type !== 'serial-number' && this.type !== 'password' && this.type !== 'ciphertext' && this.type !== 'image' && this.type !== 'date-range' && this.type !=='int' &&  this.type !=='attachment' && this.type !=='department' && this.type !=='textarea' && this.type !== 'float' &&  this.type !== 'rich-text' && this.type !== 'boolean' && this.type !== 'money' && this.type !== 'date' && this.type !== 'datetime' && this.type !== 'time' && this.type !== 'user'  && this.type !== 'users' && this.type !== 'enum') && this.defaultValueMode=='static')",
                      // "visibleOn": "((this.fieldType !=='int' && this.fieldType !== 'float' &&  this.fieldType !== 'rich-text' && this.fieldType !== 'boolean' && this.fieldType !== 'money' && this.fieldType !== 'date' && this.fieldType !== 'datetime' && this.fieldType !== 'time' && this.fieldType !== 'user'  && this.fieldType !== 'users') && this.defaultValueMode=='static')",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "((this.type == 'serial-number') && this.config.defaultValueMode=='static')",
                      label: '',
                      type: 'input-text',
                      name: 'config.defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:"this.type == 'serial-number'",
                      label: '日期识别字段',
                      type: 'select',
                      name: 'config.parsedDateField',
                      labelField: 'name',
                      valueField: 'code',
                      searchable: true,
                      clearable: true,
                      id: "dateFieldEdit",
                      source: '${ss:dateFieldList}',
                      "onEvent": {
                        "change": {
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                console.log(event,'日期识别字段event');
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'parsedDateFormats',
                                  args: {
                                    value: ''
                                  }
                                });
                                setTimeout(() => {
                                  if(event.data.selectedItems.type === "text"){
                                    doAction({
                                      actionType: 'show',
                                      componentId: 'parsedDateFormats'
                                    });
                                  }else{
                                    doAction({
                                      actionType: 'hidden',
                                      componentId: 'parsedDateFormats'
                                    });
                                  }
                                }, 250);
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn: "this.type == 'serial-number'",
                      label: '日期识别格式',
                      type: 'input-text',
                      name: 'config.parsedDateFormat',
                      id: 'parsedDateFormats',
                    },
                    {
                      visibleOn:
                        "(this.type == 'enum' && this.config.dbType == 'VARCHAR' && this.defaultValueMode=='static')",
                      label: '',
                      required: true,
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.type == 'enum' && this.config.dbType == 'INTEGER' && this.defaultValueMode=='static')",
                      label: '',
                      required: true,
                      type: 'input-number',
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.type =='date' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType =='date' && this.defaultValueMode=='static'",
                      label: '',
                      required: true,
                      type: 'input-date',
                      value: '2020-01-01',
                      format: 'YYYY-MM-DD',
                      name: 'defaultValue',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.type =='datetime' && this.defaultValueMode=='static' && this.config.precision == 0",
                      label: '',
                      required: true,
                      type: 'input-dateTime',
                      format: 'YYYY-MM-DD HH:mm:ss',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss',
                      value: '2020-01-01 00:00:00',
                      id: 'defaultValues',
                      name: 'defaultValue',
                      validations: {
                        isEditHaveMo: true
                      }
                    },{
                      visibleOn: "this.type =='datetime' && this.defaultValueMode=='static' && this.config.precision == 1",
                      label: '',
                      required: true,
                      type: 'input-dateTime',
                      format: 'YYYY-MM-DD HH:mm:ss.S',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss.S',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss.S',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss.S',
                      value: '2020-01-01 00:00:00',
                      id: 'defaultValues',
                      name: 'defaultValue',
                      validations: {
                        isEditHaveMo: true
                      }
                    },{
                      visibleOn: "this.type =='datetime' && this.defaultValueMode=='static' && this.config.precision == 2",
                      label: '',
                      required: true,
                      type: 'input-dateTime',
                      format: 'YYYY-MM-DD HH:mm:ss.SS',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss.SS',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss.SS',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss.SS',
                      value: '2020-01-01 00:00:00',
                      id: 'defaultValues',
                      name: 'defaultValue',
                      validations: {
                        isEditHaveMo: true
                      }
                    },{
                      visibleOn: "this.type =='datetime' && this.defaultValueMode=='static' && this.config.precision == 3",
                      label: '',
                      required: true,
                      type: 'input-dateTime',
                      format: 'YYYY-MM-DD HH:mm:ss.SSS',
                      valueFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
                      inputFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
                      displayFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
                      value: '2020-01-01 00:00:00',
                      id: 'defaultValues',
                      name: 'defaultValue',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.type =='time' && this.defaultValueMode=='static' && this.config.precision == 0",
                      label: '',
                      required: true,
                      type: 'input-time',
                      format: 'HH:mm:ss',
                      valueFormat: 'HH:mm:ss',
                      inputFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss',
                      id: 'defaultValues',
                      name: 'defaultValue',
                      validations: {
                        isEditHaveMo: true
                      }
                    },{
                      visibleOn: "this.type =='time' && this.defaultValueMode=='static' && this.config.precision == 1",
                      label: '',
                      required: true,
                      type: 'input-time',
                      format: 'HH:mm:ss.S',
                      valueFormat: 'HH:mm:ss.S',
                      inputFormat: 'HH:mm:ss.S',
                      displayFormat: 'HH:mm:ss.S',
                      name: 'defaultValue',
                      id: 'defaultValues',
                      validations: {
                        isEditHaveMo: true
                      }
                    },{
                      visibleOn: "this.type =='time' && this.defaultValueMode=='static' && this.config.precision == 2",
                      label: '',
                      required: true,
                      type: 'input-time',
                      format: 'HH:mm:ss.SS',
                      valueFormat: 'HH:mm:ss.SS',
                      inputFormat: 'HH:mm:ss.SS',
                      displayFormat: 'HH:mm:ss.SS',
                      name: 'defaultValue',
                      id: 'defaultValues',
                      validations: {
                        isEditHaveMo: true
                      }
                    },{
                      visibleOn: "this.type =='time' && this.defaultValueMode=='static' && this.config.precision == 3",
                      label: '',
                      required: true,
                      type: 'input-time',
                      format: 'HH:mm:ss.SSS',
                      valueFormat: 'HH:mm:ss.SSS',
                      inputFormat: 'HH:mm:ss.SSS',
                      displayFormat: 'HH:mm:ss.SSS',
                      name: 'defaultValue',
                      id: 'defaultValues',
                      validations: {
                        isEditHaveMo: true
                      }
                    },{
                      visibleOn: "(this.type =='datetime' || this.type =='time') && this.defaultValueMode=='static' && this.config.precision > 3",
                      label: '',
                      required: true,
                      type: 'input-text',
                      name: 'defaultValue',
                      validations: {
                        timeRules: true
                      }
                    },
                    {
                      visibleOn:"this.type == 'ciphertext' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      },
                      desc: '默认值为数据库中的默认值，需要进行加密处理',
                    },
                    {
                      visibleOn:"this.type == 'password' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      },
                      desc: '默认值为数据库中的默认值，需要进行加密处理',
                    },
                    {
                      visibleOn:
                        "this.type == 'float' && this.defaultValueMode=='static'",
                      // "visibleOn": "(this.fieldType =='int' || this.fieldType == 'float') && this.defaultValueMode=='static'",
                      label: '',
                      // "step": 0.0001,
                      required: true,
                      precision: '${config.scale}',
                      type: 'input-number',
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.type =='int' && this.defaultValueMode=='static'",
                      // "visibleOn": "(this.fieldType =='int' || this.fieldType == 'float') && this.defaultValueMode=='static'",
                      label: '',
                      required: true,
                      type: 'input-number',
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.type == 'money' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType == 'money' && this.defaultValueMode=='static'",
                      label: '',
                      step: 0.01,
                      required: true,
                      type: 'input-number',
                      big: true,
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      },
                      desc: '该处单位为"元"，数据库中单位为"分"，为该处的值乘以100'
                    },
                    {
                      visibleOn:
                        "this.type =='textarea' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'textarea',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.type =='rich-text' && this.defaultValueMode=='static'",
                      label: '',
                      type: 'input-rich-text',
                      name: 'defaultValue',
                      placeholder: '默认值',
                      options: {
                        menubar: false,
                        height: 200,
                        buttons: [
                          'undo',
                          'redo',
                          'paragraphFormat',
                          'textColor',
                          'backgroundColor',
                          'bold',
                          'underline',
                          'strikeThrough',
                          'formatOL',
                          'formatUL',
                          'align',
                          'quote',
                          'insertLink',
                          'insertImage',
                          'insertEmotion',
                          'insertVideo',
                          'insertTable',
                          'html'
                        ]
                        //     "toolbar": "undo redo | example"
                      },
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.type == 'boolean' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType == 'boolean' && this.defaultValueMode=='static'",
                      label: '',
                      onText: 'TRUE',
                      offText: 'FALSE',
                      trueValue: 'true',
                      falseValue: 'false',
                      type: 'switch',
                      name: 'defaultValue',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.type == 'boolean'",
                      label: '真值文字',
                      type: 'input-text',
                      placeholder: '请输入开启时开关显示的内容',
                      name: 'config.onText'
                    },
                    {
                      visibleOn: "this.type == 'boolean'",
                      label: '假值文字',
                      type: 'input-text',
                      placeholder: '请输入关闭时开关显示的内容',
                      name: 'config.offText'
                    },
                    {
                      visibleOn: "this.type == 'user'",
                      // "visibleOn": "this.fieldType == 'user'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        },
                        {
                          label: '当前用户',
                          value: 'current_user'
                        }
                      ],
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (
                                _: any,
                                doAction: any,
                                event: any
                              ) {
                                console.log('用户进入');
                                setTimeout(() => {
                                  doAction({
                                    actionType: 'setValue',
                                    componentName: 'defaultValue',
                                    args: {
                                      value: ''
                                    }
                                  });
                                }, 1000);
                              }
                            }
                          ]
                        }
                      },
                    },
                    {
                      visibleOn:
                        "this.type == 'user' && this.defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType == 'user' && this.defaultValueMode=='static'",
                      label: ' ',
                      name: 'defaultValue',
                      type: 'select',
                      clearable: true,
                      id: 'peopleText',
                      source: '${ss:userSelectList}',
                      // "source": {
                      //     "url": useDevBaseUrl("/system/user/list-all-simple"),
                      //     "method": "get",
                      //     "requestAdaptor": "",
                      //     "responseData": {
                      //         "options": "${items|pick:label~nickname,value~username}"
                      //     },
                      //     "adaptor": "",
                      //     "messages": {}
                      // },
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.type == 'users'",
                      // "visibleOn": "this.fieldType == 'users'",
                      label: '默认值',
                      type: 'select',
                      name: 'defaultValueMode',
                      value: 'null',
                      options: [
                        {
                          label: '不设置',
                          value: 'null'
                        },
                        {
                          label: '静态值',
                          value: 'static'
                        }
                        // {
                        //     "label": "表达式",
                        //     "value": "expression",
                        // }
                      ],
                    },
                    {
                      visibleOn:
                        "this.type == 'users' && defaultValueMode=='static'",
                      // "visibleOn": "this.fieldType == 'users' && defaultValueMode=='static'",
                      label: '',
                      type: 'select',
                      // "type": "input-tag",
                      name: 'config.usersDefaultValue',
                      // "name": "defaultValue",
                      multiple: true,
                      value: '',
                      clearable: true,
                      options: [],
                      source: '${ss:userSelectList}',
                      // "source": {
                      //     "url": useDevBaseUrl("/system/user/list-all-simple"),
                      //     "method": "get",
                      //     "requestAdaptor": "",
                      //     "responseData": {
                      //         "options": "${items|pick:label~nickname,value~username}"
                      //     },
                      //     "adaptor": "",
                      //     "messages": {},
                      // },
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "this.type == 'users' && defaultValueMode=='expression'",
                      // "visibleOn": "this.fieldType == 'users' && defaultValueMode=='expression'",
                      label: '',
                      type: 'input-text',
                      name: 'defaultValue',
                      value: '',
                      desc: '请确认SQL语句正确，否则会造成数据库问题。',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    // {
                    //     "visibleOn": "(this.fieldType == 'text')",
                    //     // "visibleOn": "(this.fieldType == 'textarea')",
                    //     "type": "switch",
                    //     "label": "识别录入",
                    //     "value": false,
                    //     "name": "config.enableOCR",
                    //     "desc": "允许用户通过拍照或者选择图片进行文字识别",
                    // },
                    {
                      visibleOn:
                        "(this.type == 'int' && this.foreignKeyFlag == false && this.systemFieldType != 1)",
                      // "visibleOn": "(this.fieldType == 'int' && this.foreignKeyFlag == false)",
                      label: '整数类型',
                      type: 'select',
                      name: 'config.dbType',
                      value: 'INT',
                      options: [
                        {
                          label: '整型',
                          value: 'INT'
                        },
                        {
                          label: '长整型',
                          value: 'BIGINT'
                        }
                      ]
                    },
                    {
                      visibleOn: "(this.type =='formula')",
                      // "visibleOn": "(this.fieldType =='formula')",
                      label: '公式',
                      title: '条件添加',
                      required: true,
                      type: 'input-formula',
                      name: 'config.expression',
                      evalMode: true,
                      // "value": "IF(${fields[0].id})",
                      // "variables": "${fields}"
                      variables: '${ss:formulaData}'
                    },
                    {
                      visibleOn:
                        "(this.type =='attachment' || this.type =='image')",
                      // "visibleOn": "(this.fieldType =='attachment' || this.fieldType =='image')",
                      label: '对象存储',
                      name: 'config.driver',
                      // "name": "config.objectStorage",
                      type: 'select',
                      source: useDevBaseUrl('/app/file-config/list-all-simple'),
                      // "options": [],
                      desc: '默认不选择将上传到系统配置指定的存储位置',
                      labelField: 'name',
                      valueField: 'code'
                    },
                    // {
                    //     "visibleOn": "(this.fieldType =='date')",
                    //     "label": "存储类型",
                    //     "type": "select",
                    //     "name": "format",
                    //     // "name": "storageType",
                    //     "value": "datetime",
                    //     "desc": "${(format == 'datetime' ?'时间日期，包含时期和时间信息，没有时区信息。': format == 'datetime'? '只包含日期信息，不包含时间信息。': format == 'time'? '时间信息，不包含日期，没有时区信息。' :'' )}",
                    //     "options": [
                    //         {
                    //             "label": "日期时间",
                    //             "value": "datetime",
                    //             "description": "时间日期，包含时期和时间信息，没有时区信息。"
                    //         },
                    //         {
                    //             "label": "日期",
                    //             "value": "date",
                    //             "description": "只包含日期信息，不包含时间信息。",

                    //         },
                    //         {
                    //             "label": "时间",
                    //             "value": "time",
                    //             "description": "时间信息，不包含日期，没有时区信息。"
                    //         }
                    //     ]
                    // },
                    // 日期范围
                    {
                      visibleOn:
                        "(this.type =='date-range' && (this.config.nullable || this.defaultValueMode == 'static')  && this.config.dbType == 'DATETIME')  && this.defaultValueMode!='expression' && this.defaultValueMode!='null'",
                      // "visibleOn": "(this.fieldType =='date-range' && this.nullable && this.format == 'datetime') ",
                      // "visibleOn": "(this.fieldType =='date-range' && this.requiredFlag && this.format == 'datetime') ",
                      label: '默认值',
                      // "name": "defaultValue",
                      name: 'config.dateTimeDefaultValue',
                      id:'dateTimeDefaultValue',
                      required: true,
                      type: 'input-datetime-range',
                      format: 'YYYY-MM-DD HH:mm:ss',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.type =='date-range' && (this.config.nullable || this.defaultValueMode == 'static')  && this.config.dbType == 'DATE')  && this.defaultValueMode!='expression' && this.defaultValueMode!='null'",
                      // "visibleOn": "(this.fieldType =='date-range' && this.nullable && this.format == 'date') ",
                      // "visibleOn": "(this.fieldType =='date-range' && this.requiredFlag && this.format == 'date') ",
                      label: '默认值',
                      // "name": "defaultValue",
                      name: 'config.dateDefaultValue',
                      id:'dateDefaultValue',
                      required: true,
                      type: 'input-date-range',
                      format: 'YYYY-MM-DD',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.type =='date-range' && (this.config.nullable || this.defaultValueMode == 'static')  && this.config.dbType == 'TIME')  && this.defaultValueMode!='expression' && this.defaultValueMode!='null'",
                      // "visibleOn": "(this.fieldType =='date-range' && this.nullable && this.format == 'time') ",
                      // "visibleOn": "(this.fieldType =='date-range' && this.requiredFlag && this.format == 'time') ",
                      label: '默认值',
                      // "name": "defaultValue",
                      name: 'config.timeDefaultValue',
                      id:'timeDefaultValue',
                      type: 'input-time-range',
                      required: true,
                      format: 'HH:mm:ss',
                      valueFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss',
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn: "this.type == 'date-range'",
                      // "visibleOn": "(this.fieldType =='date-range')",
                      label: '存储类型',
                      // "name": "storageType",
                      name: 'config.dbType',
                      type: 'button-group-select',
                      value: 'DATETIME',
                      desc: "${(config.dbType == 'DATETIME' ? '时间日期，包含时期和时间信息，没有时区信息。': config.dbType== 'DATE'? '只包含日期信息，不包含时间信息。': config.dbType== 'TIME'? '时间信息，不包含日期，没有时区信息。' :'' )}",
                      options: [
                        {
                          label: '日期时间',
                          value: 'DATETIME',
                          description:
                            '时间日期，包含时期和时间信息，没有时区信息。'
                        },
                        {
                          label: '日期',
                          value: 'DATE',
                          description: '只包含日期信息，不包含时间信息。'
                        },
                        {
                          label: '时间',
                          value: 'TIME',
                          description: '时间信息，不包含日期，没有时区信息。'
                        }
                      ],
                      "onEvent": {
                        "change": {
                          "weight": 0,
                          "actions": [
                            {
                              actionType: 'custom',
                              script: function(_: any, doAction: any, event: any) {
                                console.log(event,'eventeventevent')
                                if(event.data.value == 'DATETIME'){
                                  setTimeout(() => {
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'dateTimeDefaultValue',
                                      args: {
                                        value: "2020-01-01 00:00:00,2999-01-01 23:59:59"
                                      }
                                    });
                                  },800)
                                } else if(event.data.value == 'DATE'){
                                  setTimeout(() => {
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'dateDefaultValue',
                                      args: {
                                        value: "2020-01-01,2999-01-01"
                                      }
                                    });
                                  },800)
                                }else if(event.data.value == 'TIME'){
                                  setTimeout(() => {
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'timeDefaultValue',
                                      args: {
                                        value: "00:00:00,23:59:59"
                                      }
                                    });
                                  },800)
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    // {
                    //     // 日期默认值
                    //     "visibleOn": "(this.fieldType =='date' && this.nullable)",
                    //     // "visibleOn": "(this.fieldType =='date' && this.requiredFlag)",
                    //     "label": "默认值",
                    //     "name": "defaultValueType",
                    //     // "name": "fiexd",
                    //     "value": "regular",
                    //     "type": "button-group-select",
                    //     "options": [
                    //         {
                    //             "label": "固定值",
                    //             "value": "regular"
                    //         },
                    //         {
                    //             "label": "相对值",
                    //             "value": "relative"
                    //         },
                    //     ]
                    // },
                    {
                      visibleOn:
                        "(this.defaultValueType == 'regular' && this.config.format == 'datetime' && this.type =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'datetime' && this.fieldType =='date')",
                      label: '',
                      type: 'input-datetime',
                      name: 'defaultValue'
                    },
                    {
                      visibleOn:
                        "(this.defaultValueType == 'regular' && this.config.format == 'time' && this.type =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'time' && this.fieldType =='date')",
                      label: '',
                      type: 'input-date',
                      name: 'defaultValue'
                    },
                    {
                      visibleOn:
                        "(this.defaultValueType == 'regular' && this.config.format == 'time' && this.type =='date')",
                      // "visibleOn": "(this.defaultValueType == 'regular' && this.format == 'time' && this.fieldType =='date')",
                      label: '',
                      type: 'input-time',
                      name: 'defaultValue'
                    },
                    {
                      visibleOn:
                        "(this.type =='date' && this.config.format == 'datetime') || (this.type =='date-range' && this.config.dbType == 'DATETIME')",
                      // "visibleOn": "(this.fieldType =='date' && this.format == 'datetime') || (this.fieldType =='date-range' && this.format == 'datetime')",
                      label: '最小值',
                      type: 'input-datetime',
                      // "name": "config.minValue",
                      // "name": "config.minDate",
                      name: 'config.minDateTime',
                      format: 'YYYY-MM-DD HH:mm:ss'
                    },
                    {
                      visibleOn:
                        "(this.type =='date' && this.config.format == 'date') || (this.type =='date-range' && this.config.dbType == 'DATE')",
                      // "visibleOn": "(this.fieldType =='date' && this.format == 'date') || (this.fieldType =='date-range' && this.format == 'date')",
                      label: '最小值',
                      type: 'input-date',
                      // "name": "config.minValue",
                      // "name": "config.minDate",
                      name: 'config.minDateDate',
                      format: 'YYYY-MM-DD'
                    },
                    {
                      visibleOn:
                        "(this.type =='date' && this.config.format == 'time') || (this.type =='date-range' && this.config.dbType == 'TIME')",
                      // "visibleOn": "(this.fieldType =='date' && this.format == 'time') || (this.fieldType =='date-range' && this.format == 'time')",
                      label: '最小值',
                      type: 'input-time',
                      // "name": "config.minValue",
                      // "name": "config.minDate",
                      name: 'config.minDateTimes',
                      format: 'HH:mm:ss',
                      valueFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss'
                    },
                    {
                      visibleOn: "this.type == 'date-range'",
                      // "visibleOn": "this.fieldType == 'date-range'",
                      // "visibleOn": "(this.fieldType =='date' || this.fieldType == 'date-range')",
                      label: '',
                      // "name": "config.minValueMessage",
                      name: 'config.minDateMsg',
                      type: 'input-text',
                      placeholder: '请输入提示信息'
                    },
                    {
                      visibleOn:
                        "(this.type =='date'  && this.config.format == 'datetime') || (this.type =='date-range' && this.config.dbType == 'DATETIME') ",
                      // "visibleOn": "(this.fieldType =='date'  && this.format == 'datetime') || (this.fieldType =='date-range' && this.format == 'datetime') ",
                      label: '最大值',
                      type: 'input-datetime',
                      // "name": "config.maxValue",
                      // "name": "config.maxDate",
                      name: 'config.maxDateTime',
                      format: 'YYYY-MM-DD HH:mm:ss'
                    },
                    {
                      visibleOn:
                        "(this.type =='date'  && this.config.format == 'date') || (this.type =='date-range' && this.config.dbType == 'DATE')",
                      // "visibleOn": "(this.fieldType =='date'  && this.format == 'date') || (this.fieldType =='date-range' && this.format == 'date')",
                      label: '最大值',
                      type: 'input-date',
                      // "name": "config.maxValue",
                      // "name": "config.maxDate",
                      name: 'config.maxDateDate',
                      format: 'YYYY-MM-DD'
                    },
                    {
                      visibleOn:
                        "(this.type =='date'  && this.config.format == 'time') || (this.type =='date-range' && this.config.dbType == 'TIME')",
                      // "visibleOn": "(this.fieldType =='date'  && this.format == 'time') || (this.fieldType =='date-range' && this.format == 'time')",
                      label: '最大值',
                      type: 'input-time',
                      // "name": "config.maxValue",
                      // "name": "config.maxDate",
                      name: 'config.maxDateTimes',
                      format: 'HH:mm:ss',
                      valueFormat: 'HH:mm:ss',
                      displayFormat: 'HH:mm:ss'
                    },
                    {
                      visibleOn: "this.type == 'date-range'",
                      // "visibleOn": "this.fieldType == 'date-range'",
                      // "visibleOn": "(this.fieldType =='date' || this.fieldType == 'date-range')",
                      label: '',
                      type: 'input-text',
                      name: 'config.maxDateMsg',
                      // "name": "config.maxValueMessage",
                      placeholder: '请输入提示信息'
                    },
                    // {
                    //     "visibleOn": "(this.requiredFlag && this.fieldType == 'boolean')",
                    //     "label": "默认值",
                    //     "type": "switch",
                    //     "name": "defaultValue",
                    //     "onText": "TRUE",
                    //     "offText": "FALSE"
                    // },
                    {
                      visibleOn: "(this.type == 'enum')",
                      // "visibleOn": "(this.fieldType == 'enum')",
                      type: 'select',
                      label: '选项值',
                      name: 'config.meiptions',
                      // "name": "enumSelect",
                      value: 'custom',
                      options: [
                        {
                          label: '自定义选项',
                          value: 'custom'
                        },
                        {
                          label: '数据字典',
                          value: 'dictionaries'
                        }
                      ]
                    },
                    {
                      visibleOn:
                        "this.config.type == 'enum' && this.config.meiptions == 'custom' && this.config.dbType == 'VARCHAR'",
                      name: 'config.addOptions',
                      label: '',
                      type: 'input-array',
                      required: true,
                      draggable: true,
                      addButtonText: '新增选项',
                      items: {
                        type: 'combo',
                        name: 'combination',
                        label: false,
                        items: [
                          {
                            name: 'labels',
                            label: false,
                            type: 'input-text',
                            placeholder: '文本'
                          },
                          {
                            visibleOn:
                              "this.type == 'enum' && this.config.meiptions == 'custom'",
                            name: 'values',
                            label: false,
                            type: 'input-text',
                            placeholder: '数值'
                          }
                        ]
                      }
                    },
                    {
                      visibleOn:
                        "this.config.type == 'enum' && this.config.meiptions == 'custom' && this.config.dbType == 'INTEGER'",
                      name: 'config.addOptions',
                      label: '',
                      type: 'input-array',
                      draggable: true,
                      required: true,
                      addButtonText: '新增选项',
                      items: {
                        type: 'combo',
                        name: 'combination',
                        label: false,
                        items: [
                          {
                            name: 'labels',
                            label: false,
                            type: 'input-text',
                            placeholder: '文本'
                          },
                          {
                            visibleOn:
                              "this.type == 'enum' && this.config.meiptions == 'custom'",
                            name: 'values',
                            label: false,
                            type: 'input-number',
                            big: true,
                            placeholder: '数值'
                          }
                        ]
                      }
                    },
                    {
                      visibleOn:
                        "this.type == 'enum' && this.config.meiptions == 'custom'",
                      // "visibleOn": "this.fieldType == 'enum' && this.options == 'custom'",
                      label: '值类型',
                      type: 'select',
                      value: 'VARCHAR',
                      name: 'config.valueType',
                      disabled: true,
                      options: [
                        {
                          label: '文本',
                          value: 'VARCHAR'
                        },
                        {
                          label: '数字',
                          value: 'INTEGER'
                        }
                      ]
                    },
                    {
                      "type": "flex",
                      visibleOn: "this.type == 'enum' && this.config.meiptions == 'dictionaries'",
                      "items": [
                        {
                          "type": "container",
                          "body": [
                            {
                              type: 'input-text',
                              name: 'config.msources',
                              id: 'ziTree',
                              required: true,
                              readOnly: true
                            }
                          ],
                          "size": "none",
                          "style": {
                            "position": "static",
                            "display": "block",
                            "flex": "1 1 auto",
                            "flexGrow": 1,
                            "flexBasis": "90%"
                          },
                          "wrapperBody": false,
                          "isFixedHeight": false,
                          "isFixedWidth": false,
                        },
                        {
                          "type": "container",
                          "body": [
                            {
                              type: 'button',
                              label: '',
                              icon: 'fa fa-inbox',
                              actionType: 'dialog',
                              dialog: {
                                id: 'dictionaryDialog',
                                type: 'dialog',
                                title: '选择字典',
                                body: [
                                  {
                                    type: 'input-tree',
                                    name: 'tree',
                                    // "label": "Tree",
                                    onlyLeaf: true,
                                    searchable: true,
                                    source: {
                                      url: useDevBaseUrl('/app/dict-type/list-all'),
                                      method: 'get',
                                      requestAdaptor: '',
                                      responseData: {
                                        options:
                                          '${items|pick:label~name,value~name}'
                                      },
                                      adaptor: '',
                                      messages: {}
                                    }
                                  }
                                ],
                                showCloseButton: true,
                                showErrorMsg: true,
                                showLoading: true,
                                className: 'app-popover',
                                closeOnEsc: false,
                                actions: [
                                  {
                                    type: 'button',
                                    label: '取消',
                                    close: true
                                  },
                                  {
                                    level: 'info',
                                    type: 'button',
                                    label: '确认',
                                    close: false,
                                    onEvent: {
                                      click: {
                                        actions: [
                                          {
                                            actionType: 'custom',
                                            script: function (_: any,doAction: any,event: any) {
                                              console.log(_, '___');
                                              console.log(doAction,'doActiondoActiondoAction');
                                              console.log(event, 'eventeventevent');
                                              if (event.data.tree === true &&
                                                event.data.tree != '1') {
                                                return toast.error('请选择字典', {
                                                  position: 'top-center'
                                                });
                                              }
                                              if (event.data.tree === false &&
                                                event.data.tree != '0') {
                                                return toast.error('请选择字典', {
                                                  position: 'top-center'
                                                });
                                              }
                                              let nameData: any;
                                              if (event.data.config.dbType == 'VARCHAR') {
                                                nameData = 0;
                                              }
                                              if (event.data.config.dbType == 'INTEGER') {
                                                nameData = 1;
                                              }
                                              let isTrue = false;
                                              dictionaryList.forEach((res: any) => {
                                                if (event.data.tree == res.name) {
                                                  if (res.dbType != nameData) {
                                                    isTrue = true;
                                                  }
                                                }
                                              });
                                              console.log(isTrue, 'isTrueisTrue');
                                              if (isTrue) {
                                                // return doAction({
                                                //     actionType: "toast", "args": {
                                                //         "position": "top-center",
                                                //         "msgType": "error",
                                                //         "msg": "选择值与原数据类型不一致，请选择一致的数据类型"
                                                //     }
                                                // });
                                                return toast.error(
                                                  '选择值与原数据类型不一致，请选择一致的数据类型',
                                                  {
                                                    position: 'top-center'
                                                  }
                                                );
                                              }
                                              doAction({
                                                actionType: 'setValue',
                                                componentId: 'ziTree',
                                                args: {
                                                  value: event.data.tree
                                                }
                                              });
                                              doAction({
                                                actionType: 'close',
                                                componentId: 'dictionaryDialog'
                                              });
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                                ],
                                onEvent: {
                                  confirm: {
                                    actions: [
                                      {
                                        actionType: 'custom',
                                        script: function (
                                          _: any,
                                          doAction: any,
                                          event: any
                                        ) {
                                          console.log(_, '__');
                                          console.log(doAction, 'doActiondoAction');
                                          console.log(event, 'eventevent');
                                        }
                                      }
                                    ]
                                  }
                                }
                              }
                            }
                          ],
                          "size": "none",
                          "style": {
                            "position": "static",
                            "display": "block",
                            "flex": "1 1 auto",
                            "flexGrow": 1,
                            "flexBasis": "5%",
                          },
                          "wrapperBody": false,
                          "isFixedHeight": false,
                          "isFixedWidth": false,
                        }
                      ],
                      "style": {
                        "position": "relative",
                        "rowGap": "0px",
                        "columnGap": "0px",
                        "flexWrap": "nowrap",
                        "maxWidth": "100%",
                        "inset": "auto",
                        "marginBottom":"20px"
                      },
                      "isFixedHeight": false,
                      "isFixedWidth": false
                    },
                    // {
                    //   visibleOn: "this.type == 'enum' && this.config.meiptions == 'dictionaries'",
                    //   // "visibleOn": "this.fieldType == 'enum' && this.config.meiptions == 'dictionaries'",
                    //   label: '',
                    //   name: 'confog.msources',
                    //   required: true,
                    //   type: 'input-group',
                    //   body: [
                    //     {
                    //       type: 'input-text',
                    //       name: 'config.msources',
                    //       id: 'ziTree',
                    //       required: true,
                    //       readOnly: true
                    //     },
                    //     {
                    //       type: 'button',
                    //       label: '',
                    //       icon: 'fa fa-inbox',
                    //       actionType: 'dialog',
                    //       dialog: {
                    //         id: 'dictionaryDialog',
                    //         type: 'dialog',
                    //         title: '选择字典',
                    //         body: [
                    //           {
                    //             type: 'input-tree',
                    //             name: 'tree',
                    //             // "label": "Tree",
                    //             onlyLeaf: true,
                    //             searchable: true,
                    //             source: {
                    //               url: useDevBaseUrl('/app/dict-type/list-all'),
                    //               method: 'get',
                    //               requestAdaptor: '',
                    //               responseData: {
                    //                 options:
                    //                   '${items|pick:label~name,value~name}'
                    //               },
                    //               adaptor: '',
                    //               messages: {}
                    //             }
                    //           }
                    //         ],
                    //         showCloseButton: true,
                    //         showErrorMsg: true,
                    //         showLoading: true,
                    //         className: 'app-popover',
                    //         closeOnEsc: false,
                    //         actions: [
                    //           {
                    //             type: 'button',
                    //             label: '取消',
                    //             close: true
                    //           },
                    //           {
                    //             level: 'info',
                    //             type: 'button',
                    //             label: '确认',
                    //             close: false,
                    //             onEvent: {
                    //               click: {
                    //                 actions: [
                    //                   {
                    //                     actionType: 'custom',
                    //                     script: function (_: any,doAction: any,event: any) {
                    //                       console.log(_, '___');
                    //                       console.log(doAction,'doActiondoActiondoAction');
                    //                       console.log(event, 'eventeventevent');
                    //                       if (event.data.tree == true &&
                    //                         event.data.tree != '1') {
                    //                         return toast.error('请选择字典', {
                    //                           position: 'top-center'
                    //                         });
                    //                       }
                    //                       if (event.data.tree == false &&
                    //                         event.data.tree != '0') {
                    //                         return toast.error('请选择字典', {
                    //                           position: 'top-center'
                    //                         });
                    //                       }
                    //                       let nameData: any;
                    //                       if (event.data.config.dbType == 'VARCHAR') {
                    //                         nameData = 0;
                    //                       }
                    //                       if (event.data.config.dbType == 'INTEGER') {
                    //                         nameData = 1;
                    //                       }
                    //                       let isTrue = false;
                    //                       dictionaryList.forEach((res: any) => {
                    //                         if (event.data.tree == res.name) {
                    //                           if (res.dbType != nameData) {
                    //                             isTrue = true;
                    //                           }
                    //                         }
                    //                       });
                    //                       console.log(isTrue, 'isTrueisTrue');
                    //                       if (isTrue) {
                    //                         // return doAction({
                    //                         //     actionType: "toast", "args": {
                    //                         //         "position": "top-center",
                    //                         //         "msgType": "error",
                    //                         //         "msg": "选择值与原数据类型不一致，请选择一致的数据类型"
                    //                         //     }
                    //                         // });
                    //                         return toast.error(
                    //                           '选择值与原数据类型不一致，请选择一致的数据类型',
                    //                           {
                    //                             position: 'top-center'
                    //                           }
                    //                         );
                    //                       }
                    //                       doAction({
                    //                         actionType: 'setValue',
                    //                         componentId: 'ziTree',
                    //                         args: {
                    //                           value: event.data.tree
                    //                         }
                    //                       });
                    //                       doAction({
                    //                         actionType: 'close',
                    //                         componentId: 'dictionaryDialog'
                    //                       });
                    //                     }
                    //                   }
                    //                 ]
                    //               }
                    //             }
                    //           }
                    //         ],
                    //         onEvent: {
                    //           confirm: {
                    //             actions: [
                    //               {
                    //                 actionType: 'custom',
                    //                 script: function (
                    //                   _: any,
                    //                   doAction: any,
                    //                   event: any
                    //                 ) {
                    //                   console.log(_, '__');
                    //                   console.log(doAction, 'doActiondoAction');
                    //                   console.log(event, 'eventevent');
                    //                 }
                    //               }
                    //             ]
                    //           }
                    //         }
                    //       }
                    //     }
                    //   ]
                    // },
                    {
                      visibleOn:
                        "this.type == 'enum' && this.config.meiptions == 'dictionaries'",
                      label: '值类型',
                      type: 'select',
                      // "name": "dbType",
                      value: 'VARCHAR',
                      disabled: true,
                      name: 'config.valueType',
                      options: [
                        {
                          label: '文本',
                          value: 'VARCHAR'
                        },
                        {
                          label: '数字',
                          value: 'INTEGER'
                        }
                      ]
                    },
                    {
                      visibleOn: "(this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'password')",
                      // "visibleOn": "(this.advanced == 'password')",
                      label: '加盐',
                      type: 'input-text',
                      name: 'config.salt',
                      required: true,
                      desc: '数据存储使用MD5加密算法，盐值混合内容方式为：{盐}.{文本}，然后将哈希值的字节数组转换为十六进制字符串，用于内容的加密和解码。'
                    },
                    {
                      visibleOn: "(this.type == 'ciphertext')",
                      label: '长度',
                      placeholder: '请输入长度',
                      type: 'input-number',
                      name: 'config.length',
                      required: true,
                      value: 1000,
                      big: true,
                      min: 0,
                      max: 16000,
                      resetValue: 1000,
                      desc: '所用表类型的最大行大小（不包括BLOB）为65535'
                    },
                    {
                      visibleOn: "(this.type == 'ciphertext')",
                      // "visibleOn": "(this.fieldType == 'ciphertext')",
                      // "visibleOn": "(this.advanced == 'ciphertext')",
                      label: '密钥',
                      placeholder: '请输入密钥',
                      type: 'input-text',
                      name: 'config.token',
                      required: true,
                      desc: '数据存储使用AES/CBC/NoPadding加密算法;64位密钥基于输入的文本，使用SHA-256算法生成，用于内容的加密和解码。',
                      validations: {
                        tokenValidations: true
                      }
                    },
                    {
                      visibleOn:
                        "(this.type == 'text' || (this.type == 'int' && this.systemFieldType != 1) || this.type == 'bigint')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'int' || this.fieldType == 'bigint')",
                      type: 'switch',
                      label: '是否唯一',
                      value: false,
                      name: 'config.unique'
                    },
                    {
                      visibleOn:
                        "((this.type == 'department') && this.defaultValueMode=='static')",
                      label: '',
                      type: 'tree-select',
                      name: 'defaultValue',
                      searchable: true,
                      // "required": true,
                      clearable: true,
                      source: '${ss:userSelectList}',
                      // "source": {
                      //     "url": useDevBaseUrl("/system/dept/list-all-simple"),
                      //     "method": "get",
                      //     "requestAdaptor": "",
                      //     "adaptor": "",
                      //     "messages": {},
                      // },
                      validations: {
                        isEditHaveMo: true
                      }
                    },
                    {
                      visibleOn: "(this.type == 'department')",
                      label: '字段类型',
                      type: 'combo',
                      items: [
                        {
                          name: 'textType',
                          type: 'tag',
                          label: '部门信息',
                          displayMode: 'normal',
                          color: 'active'
                        }
                      ],
                      "style": {
                        "position": "relative",
                        "rowGap": "0px",
                        "columnGap": "0px",
                        "flexWrap": "nowrap",
                        "maxWidth": "100%",
                        "inset": "auto",
                        "marginBottom":"20px"
                      },
                      "isFixedHeight": false,
                      "isFixedWidth": false
                    },
                    {
                      hiddenOn: "this.type == 'formula' || this.systemFieldType == 1",
                      type: 'switch',
                      label: '允许空值',
                      // value: true,
                      name: 'config.nullable'
                    },
                    {
                      visibleOn:"this.type == 'serial-number' && !this.hideColIgnoreTenant",
                      type: 'switch',
                      label: '是否忽略租户',
                      name: 'config.colIgnoreTenant',
                    },
                    {
                      visibleOn:"this.type =='time' || this.type =='datetime'",
                      required: true,
                      label: '精度',
                      type: 'input-number',
                      name: 'config.precision',
                      value: 0,
                      min: 0,
                      max: 6,
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (_: any,doAction: any,event: any) {
                                console.log(event,'aaaaaaaaaaaaaaaaaaaaaaa')
                                if(!isPrecisionChange){
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'showPrecisions',
                                    args: {
                                      value: 'value' in event.data ? event.data.value:''
                                    }
                                  });
                                }
                                if(event.data.__super.config.precision <= 3 && event.data.value > 3){
                                  setTimeout(() => {
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'precisionCompatible',
                                    args: {
                                      value: true
                                    }
                                  });
                                  }, 500);
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn:"this.type =='time' || this.type =='datetime'",
                      required: true,
                      label: '显示精度',
                      type: 'input-number',
                      name: 'config.showPrecision',
                      id: 'showPrecisions',
                      value: 0,
                      desc: "${IFS(type =='time' ,'因为Javascript的Date对象仅能存储亳秒级精度，所以时间组件只支持到毫秒，如需更高精度，可手动修改为文本框。')}${IFS(type =='datetime' ,'因为Javascript的Date对象仅能存储亳秒级精度，所以日期时间组件只支持到毫秒，如需更高精度，可手动修改为文本框。')} ",
                      min: 0,
                      max: 6,
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: function (_: any,doAction: any,event: any) {
                                isPrecisionChange = true
                                if(event.data.value == ''){
                                  isPrecisionChange = false
                                }
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      visibleOn:"(this.type == 'time' || this.type == 'datetime') && this.config.precision > 3",
                      type: 'switch',
                      label: '兼容模式',
                      value: true,
                      name: 'config.precisionCompatible',
                      id: 'precisionCompatible',
                      desc: '开启兼容模式时，仅支持到毫秒，如需更高精度，请关闭兼容模式，前端将变为文本框'
                    },
                    {
                      visibleOn:"this.type =='datetime'",
                      label: '数据库类型',
                      type: 'select',
                      name: 'config.dbType',
                      required: true,
                      options: [
                        {
                          label: '日期时间',
                          value: 'DATETIME'
                        },
                        {
                          label: '时间戳',
                          value: 'TIMESTAMP',
                        }
                      ]
                    },
                    {
                      "visibleOn": "${type == 'serial-number'}",
                      "type": "select",
                      "name": "expireTime",
                      "id": "expireTime_select",
                      "label": "定时清理记录日志",
                      "required": true,
                      "value": 12,
                      "options": [
                        {
                          "label": "不清空",
                          "value": 0
                        },
                        {
                          "label": "1个月之前",
                          "value": 1
                        },
                        {
                          "label": "2个月之前",
                          "value": 2
                        },
                        {
                          "label": "3个月之前",
                          "value": 3
                        },
                        {
                          "label": "半年之前",
                          "value": 6
                        },
                        {
                          "label": "1年之前",
                          "value": 12
                        },
                        {
                          "label": "2年之前",
                          "value": 24
                        },
                        {
                          "label": "3年之前",
                          "value": 36
                        },
                        {
                          "label": "5年之前",
                          "value": 60
                        },
                        {
                          "label": "10年之前",
                          "value": 120
                        },
                      ]
                    },
                    {
                      visibleOn: "(this.type == 'int' && this.foreignKeyFlag)",
                      // "hiddenOn": "(this.fieldType == 'serial_number' || this.fieldType == 'formula' || this.relation == 'one_more' || this.relation == 'more_more')",
                      type: 'switch',
                      label: '允许空值',
                      // "value": true,
                      // "falseValue": true,
                      // "trueValue": false,
                      // "name": "config.nullable",
                      name: 'nullable',
                      disabled: true
                    },
                    {
                      visibleOn: "(this.type == 'image')",
                      // "visibleOn": "(this.fieldType == 'image')",
                      type: 'select',
                      label: '图片比率',
                      value: '',
                      clearable: true,
                      name: 'config.restrictRatio',
                      source: {
                        method: 'get',
                        url: useAdminBaseUrl('/system/dict-data/list?dictType=restrictRatio&status=0'),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: {...payload.data, options: payload.data}
                          };
                        }
                      }
                    },
                    {
                      visibleOn: "config.restrictRatio == 'custom'",
                      label: '',
                      type: 'input-number',
                      big: true,
                      name: 'config.restrictRatioCustom',
                      placeholder: '请输入长宽比',
                      step: 1e-10
                    },
                    {
                      visibleOn: "(this.type == 'image')",
                      // "visibleOn": "(this.fieldType == 'image')",
                      type: 'select',
                      multiple: true,
                      // "type": "input-tag",
                      label: '允许的格式',
                      name: 'config.picFormat',
                      // "name": "config.allowedTypes",
                      value: '.jpeg,.png,.gif,.svg',
                      options: [
                        {
                          label: 'jpeg',
                          value: '.jpeg'
                        },
                        {
                          label: 'png',
                          value: '.png'
                        },
                        {
                          label: 'gif',
                          value: '.gif'
                        },
                        {
                          label: 'svg',
                          value: '.svg'
                        }
                      ]
                    },
                    {
                      visibleOn: "(this.type == 'image')",
                      // "visibleOn": "(this.fieldType == 'image')",
                      type: 'input-number',
                      big: true,
                      label: '最大图片',
                      suffix: 'MB',
                      name: 'config.maxSize'
                    },
                    {
                      visibleOn: "(this.type == 'attachment')",
                      // "visibleOn": "(this.fieldType == 'attachment')",
                      type: 'input-text',
                      label: '允许的格式',
                      name: 'config.accept',
                      desc: '请填写允许文件的MIME-TYPE，多个类型用逗号隔开'
                    },
                    {
                      visibleOn:
                        "(this.type == 'users' || this.type == 'user' || this.type == 'owner')",
                      // "visibleOn": "(this.fieldType == 'user' || this.fieldType == 'owner')",
                      type: 'switch',
                      label: '允许修改',
                      name: 'config.allowInput',
                      desc: '是否允许修改，如果不允许则意味着编辑时不可修改',
                      value: true
                    },
                    {
                      visibleOn: "(this.type == 'attachment')",
                      // "visibleOn": "(this.fieldType == 'attachment')",
                      type: 'input-number',
                      big: true,
                      label: '最大附件',
                      suffix: 'MB',
                      name: 'config.maxSize'
                    },
                    {
                      visibleOn: "(this.type == 'text')",
                      // "visibleOn": "(this.fieldType == 'text')",
                      label: '长度',
                      type: 'input-number',
                      big: true,
                      value: 255,
                      name: 'config.length',
                      id: 'colLength',
                      max: 16000,
                      min: 0,
                      resetValue: 255,
                      required: true,
                      validations: {
                        longData: true
                      },
                      desc: '所用表类型的最大行大小（不包括BLOB）为65535'
                    },
                    {
                      visibleOn: "(this.type == 'float')",
                      // "visibleOn": "(this.fieldType == 'float')",
                      label: '小数类型',
                      type: 'select',
                      name: 'config.dbType',
                      value: 'FLOAT',
                      options: [
                        {
                          label: '定点数',
                          value: 'DECIMAL'
                        },
                        {
                          label: '浮点数',
                          value: 'FLOAT'
                        },
                        {
                          label: '双精度浮点数',
                          value: 'DOUBLE'
                        }
                      ]
                    },
                    {
                      visibleOn:
                        "(this.type == 'float' && this.config.dbType == 'DECIMAL')",
                      // "visibleOn": "(this.type == 'float' && this.dbType == 'DECIMAL')",
                      label: '精度',
                      name: 'config.precision',
                      type: 'input-number',
                      big: true,
                      value: 10,
                      desc: '精度是指整个数字里全部位的数目，也就是小数点两边的位数目。显示指定类型精度时的最大允许精度为65',
                      validations: 'matchRegexp:/^([0-9][0-9]{0,1}|65)$/',
                      trimContents: true,
                      validationErrors: {
                        matchRegexp: '最大值为65'
                      },
                      max: '65',
                      resetValue: '65',
                      required: true
                    },
                    {
                      visibleOn:
                        "(this.type == 'float' && this.config.dbType == 'DECIMAL')",
                      // "visibleOn": "(this.type == 'float' && this.dbType == 'DECIMAL')",
                      label: '小数位数',
                      name: 'config.scale',
                      type: 'input-number',
                      big: true,
                      value: 4,
                      required: true,
                      max: '30',
                      resetValue: '30',
                      desc: '指小数点后边的位数'
                    },
                    {
                      visibleOn: "(this.type == 'text')",
                      // "visibleOn": "(this.fieldType == 'text')",
                      label: '格式',
                      type: 'select',
                      required: true,
                      name: 'config.format',
                      value: 'text',
                      onEvent: {
                        change: {
                          actions: [
                            {
                              actionType: 'setValue',
                              componentId: 'colLength',
                              args: {
                                // "value": "${value=='number'?18:value=='phone'?20:value=='telephone'?20:value=='postcode'?10:value=='color'?30:256}"
                                value:
                                  "${value=='id'?18:value=='normal'?255:value=='phone'?20:value=='tel'?20:value=='zipcode'?10:value=='color'?30:256}"
                              }
                            }
                          ]
                        }
                      },
                      source: {
                        method: 'get',
                        url: useAdminBaseUrl('/system/dict-data/list?dictType=formatType&status=0'),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: {...payload.data, options: payload.data}
                          };
                        }
                      }
                    },
                    {
                      visibleOn:
                        "(this.config.format != 'text' && this.type == 'text')",
                      // "visibleOn": "(this.format != 'text' && this.fieldType == 'text')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'config.formatMsg'
                    },
                    {
                      visibleOn: "(this.type =='float'  && this.config.decimalType == 'DECIMAL')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      label: '最小值',
                      type: 'input-number',
                      big: true,
                      name: 'config.minimum',
                      // "name": "config.minValue",
                      // "precision": 2,
                      // "step": 0.01
                      precision: '${config.scale}'
                    },
                    {
                      visibleOn: "(this.type == 'float'  && this.config.decimalType != 'DECIMAL')",
                      label: '最小值',
                      type: 'input-number',
                      big: true,
                      name: 'config.minimum',
                      "precision": 4,
                      "step": 0.0001
                    },
                    {
                      visibleOn:
                        "((this.type == 'int' && this.systemFieldType != 1) || this.type == 'bigint')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      label: '最小值',
                      type: 'input-number',
                      big: true,
                      name: 'config.minimum'
                      // "name": "config.minValue",
                    },
                    {
                      visibleOn:
                        "((this.type == 'int' && this.systemFieldType != 1) || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'config.minValueMessage'
                    },
                    {
                      visibleOn:
                        "this.type == 'text' || this.type == 'textarea' || this.type == 'password'",
                      // "visibleOn": "this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password'",
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      label: '最小长度',
                      name: 'config.minLength'
                    },
                    {
                      // 单行多行整数浮点的最小提示
                      visibleOn:
                        "(this.type == 'text' || this.type =='textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'config.minLengthMessage'
                    },
                    {
                      visibleOn: "(this.type =='float'  && this.config.decimalType == 'DECIMAL')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      label: '最大值',
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      name: 'config.maximum',
                      // "name": "config.maxValue",
                      precision: '${config.scale}'
                      // "precision": 2,
                      // "step": 0.01
                    },
                    {
                      visibleOn: "(this.type =='float'  && this.config.decimalType != 'DECIMAL')",
                      label: '最大值',
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      name: 'config.maximum',
                      "precision": 4,
                      "step": 0.0001
                    },
                    {
                      visibleOn:
                        "((this.type == 'int' && this.systemFieldType != 1) || this.type == 'bigint')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      label: '最大值',
                      type: 'input-number',
                      big: true,
                      mode: 'horizontal',
                      name: 'config.maximum'
                      // "name": "config.maxValue",
                    },
                    {
                      visibleOn:
                        "((this.type == 'int' && this.systemFieldType != 1) || this.type == 'bigint' || this.type =='float')",
                      // "visibleOn": "(this.fieldType == 'int' || this.fieldType == 'bigint' || this.fieldType =='float')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      mode: 'horizontal',
                      name: 'config.maxValueMessage'
                    },
                    {
                      visibleOn:
                        "(this.type == 'text' || this.type =='textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      type: 'input-number',
                      big: true,
                      label: '最大长度',
                      name: 'config.maxLength'
                    },
                    {
                      // 单行多行整数浮点的最大提示
                      visibleOn:
                        "(this.type == 'text' || this.type =='textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType =='textarea' || this.fieldType == 'password')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      mode: 'horizontal',
                      name: 'config.maxLengthMessage'
                    },
                    {
                      visibleOn:
                        "(this.type == 'text' || this.type == 'textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      mode: 'horizontal',
                      type: 'input-text',
                      name: 'validations.matchRegexp',
                      label: '正则校验',
                      placeholder: '请输入正则表达式，如^[A-Za-z]*$',
                      options: [
                        {
                          label: '大写字母 ^[A-Z]*$',
                          value: '^[A-Z]*$'
                        },
                        {
                          label: '小写字母 ^[a-z]*$',
                          value: '^[a-z]*$'
                        },
                        {
                          label: '8位字母数字 ^w{8}$',
                          value: '^w{8}$'
                        },
                        {
                          label: '字母数字 ^[A-Za-z0-9]*$',
                          value: '^[A-Za-z0-9]*$'
                        },
                        {
                          label: '数字 ^d*$',
                          value: '^d*$'
                        },
                        {
                          label: '8位数字 ^d{8}$',
                          value: '^d{8}$'
                        }
                        // {
                        //     "label": "数字 /^[0-9]*$/",
                        //     "value": "/^[0-9]*$/"
                        // },
                        // {
                        //     "label": "身份证号 /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\d|30|31)\d{3}[\dXx]$/",
                        //     "value": "/^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\d|30|31)\d{3}[\dXx]$/"
                        // },
                        // {
                        //     "label": "小写英文字母组成 /^[a-z]+$/",
                        //     "value": "/^[a-z]+$/"
                        // },
                        // {
                        //     "label": "大写英文字母 /^[A-Z]+$/",
                        //     "value": "/^[A-Z]+$/"
                        // }
                      ]
                    },
                    {
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      visibleOn:
                        "(this.type == 'text' || this.type == 'textarea' || this.type == 'password')",
                      // "visibleOn": "(this.fieldType == 'text' || this.fieldType == 'textarea' || this.fieldType == 'password')",
                      type: 'input-text',
                      placeholder: '请输入提示信息',
                      name: 'validationErrors.matchRegexp'
                      // "name": "config.validationErrors.matchRegexp"
                      // "name": "validationErrors.regexpMessage"
                      // "name": "matchRegexp"
                    },
                    {
                      hiddenOn:"this.type == 'formula' || this.systemFieldType == 1",
                      label: '注释',
                      type: 'textarea',
                      mode: 'horizontal',
                      name: 'comment',
                      maxLength: 200
                    },
                    {
                      visibleOn:"this.systemFieldType == 1",
                      label: '生成模式',
                      name: "config.primaryKeyMode",
                      type: "button-group-select",
                      options: [
                          {
                              "label": "雪花",
                              "value": "ASSIGN_ID",
                          },
                          {
                              "label": "自增",
                              "value": "AUTO",
                          }
                      ]
                    }
                  ],
                  onEvent: {
                    change: {
                      weight: 0,
                      actions: [
                        {
                          actionType: 'custom',
                          script: function(_: any, doAction: any, event: any) {
                            console.log(event,'修改表单数据变化')
                            if(event.data.type == 'time' || event.data.type == 'datetime'){
                              if(Number(event.data.config.showPrecision) > Number(event.data.config.precision)){
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'showPrecisions',
                                  args: {
                                    value: event.data.config.precision
                                  }
                                });
                              }
                              doAction({
                                actionType: 'setValue',
                                componentId: 'defaultValues',
                                args: {
                                  value: truncateTimePrecision('defaultValue' in event.data ?  event.data.defaultValue : '',event.data.config.precision)
                                }
                              });
                              if(event.data.__super.config.precision <= 3 && event.data.config.precision > 3){
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'precisionCompatible',
                                  args: {
                                    value: true
                                  }
                                });
                              }else
                                if(event.data.config.precision > 3 && event.data.config.precisionCompatible == true){
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'precisionCompatible',
                                  args: {
                                    value: true
                                  }
                                });
                              }else if(event.data.config.precision <= 3){
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'precisionCompatible',
                                  args: {
                                    value: false
                                  }
                                });
                              }
                            }
                            if(event.data.type == 'serial-number'){
                              const rrule = event.data.config.rules.filter(i=>i.type=='auto-increase')[0].options.rrule

                              sessionStorage.setItem('rrule',JSON.stringify(rrule));
                              if(rrule == 'fieldValuely' && event.data.config.createdFieldSerialUtilTableFlag) {
                                doAction({ "actionType": "enabled", "componentId": "edit_serial_log" })
                              } else if(rrule == 'fieldValuely' && !event.data.config.createdFieldSerialUtilTableFlag) {
                                doAction({ "actionType": "disabled", "componentId": "edit_serial_log" })
                              } else if(rrule != 'fieldValuely') {
                                doAction({ "actionType": "enabled", "componentId": "edit_serial_log" })
                              } else if(rrule != '') {
                                doAction({ "actionType": "disabled", "componentId": "edit_serial_log" })
                              }
                              if(rrule == 'fieldValuely' || rrule == 'none') {
                                doAction({ "actionType": "disabled", "componentId": "dateFieldEdit" })
                                doAction({ "actionType": "hidden", "componentId": "expireTime_select" })
                                doAction({
                                  actionType: "setValue",
                                  componentId: "dateFieldEdit",
                                  args: {
                                    value: ''
                                  }
                                })
                                doAction({
                                  actionType: "setValue",
                                  componentId: "expireTime_select",
                                  args: {
                                    value: ''
                                  }
                                })
                              } else {
                                doAction({ "actionType": "enabled", "componentId": "dateFieldEdit" })
                                doAction({ "actionType": "show", "componentId": "expireTime_select" })
                              }
                              let lastData = getRulesNumber(event.data.config.rules)
                              console.log(lastData,'lastData')
                              doAction({
                                actionType: 'setValue',
                                componentId: 'combinationRules',
                                args: {
                                  value: lastData.join('')
                                }
                              });
                              let fieldList =  JSON.parse(sessionStorage.getItem('fieldCrud')!)
                              let selectData = fieldList.find((item: any) => item.code == event.data.config.parsedDateField)
                              console.log(selectData,'selectData')
                              if(selectData && selectData.type === "text"){
                                doAction({
                                  actionType: 'show',
                                  componentId: 'parsedDateFormats'
                                });
                              }else{
                                doAction({
                                  actionType: 'hidden',
                                  componentId: 'parsedDateFormats'
                                });
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                },
                onEvent: {
                  confirm: {
                    actions: [
                      {
                        actionType: 'custom',
                        script: function (_: any, doAction: any, event: any) {
                          doAction({
                            actionType: 'validate',
                            componentId: 'editForm',
                            outputVar: 'validateResult'
                          });
                          setTimeout(() => {
                            let nsod = event.data.validateResult ? event.data.validateResult.payload : event.data;
                            let nsodConfigCode = 'code' in nsod.config ?  nsod.config.code : nsod.__super.code;
                            console.log(nsod,'nsod')
                            let fieldCrudData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            let haveContentCode = []
                            haveContentCode = fieldCrudData.filter((res: any) => {
                              return res.systemFieldType == 9
                            })
                            let tenantCodeName = 'tenantCode'
                            if (haveContentCode.length > 0) {
                              tenantCodeName = haveContentCode[0].code
                            }
                            let haveTreeParent = []
                            haveTreeParent = fieldCrudData.filter((res: any) => {
                              return res.type == 'parent'
                            })
                            let treeParentName = 'parentId'
                            if (haveTreeParent.length > 0) {
                              treeParentName = haveTreeParent[0].code
                            }
                            console.log('字段集合修改');
                            console.log(_, '___');
                            console.log(doAction, 'doActiondoActiondoAction');
                            console.log(event, 'eventeventevent');
                            if (
                              event.data.code.toUpperCase() == treeParentName.toUpperCase() ||
                              event.data.code.toUpperCase() == tenantCodeName.toUpperCase() ||
                              event.data.code.toUpperCase() == 'CREATEDAT' ||
                              event.data.code.toUpperCase() == 'UPDATEDAT' ||
                              event.data.code.toUpperCase() == 'CREATEDBY' ||
                              event.data.code.toUpperCase() == 'UPDATEBY' ||
                              event.data.code.toUpperCase() == 'DELETEDBY' ||
                              event.data.code.toUpperCase() == 'DELETEDAT' ||
                              event.data.code.toUpperCase() == 'DELETED'
                            ) {
                              // return alert('字段名不能和系统字段同名，请换个名字。')
                              return;
                              // return toast.error('字段名不能和系统字段同名，请换个名字。', {
                              //     position: "top-center"
                              // })
                            }
                            let isTure = false;
                            if (event.data.validateResult) {
                              console.log(event.data.validateResult, '222222');
                              console.log(event.data.validateResult.error);
                              console.log(
                                event.data.validateResult.error == ''
                              );
                              if (event.data.validateResult.error == '') {
                                isTure = false;
                              } else {
                                isTure = true;
                              }
                            }
                            console.log(isTure, 'isTure');
                            if (isTure) return;
                            let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!);
                            if (event.data.code != event.data.__super.code) {
                              let haveFirst = cacheEditLists.filter(
                                (li: any) => {
                                  if (event.data.needId) {
                                    if (li.needId == event.data.needId) {
                                      return li;
                                    }
                                  } else {
                                    if (li.id == event.data.id) {
                                      return li;
                                    }
                                  }
                                }
                              );
                              console.log(haveFirst,'haveFirsthaveFirsthaveFirst');
                              if (haveFirst.length == 0) {
                                cacheEditLists.push({
                                  ...event.data,
                                  code: event.data.__super.code,
                                  id: event.data?.id,
                                  needId: event.data?.needId
                                });
                              }
                              sessionStorage.setItem('cacheEditList',JSON.stringify(cacheEditLists));
                            }
                            let nameFieldData = sessionStorage.getItem('nameFieldData')
                            if (nameFieldData == event.data.__super.__super.code) {
                              doAction({
                                actionType: 'setValue',
                                componentId: 'nameField',
                                args: {
                                  value: event.data.code
                                }
                              });
                              // nameFieldData = event.data.code;
                              sessionStorage.setItem('nameFieldData', event.data.code)
                            }
                            let keyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
                            let dataArr1 = keyData.map((res: any) => {
                              let splitArr = res.columnNames.split(',');
                              let found = false;
                              splitArr.forEach((item) => {
                                if (item === nsodConfigCode) {
                                  found = true;
                                }
                              });
                              if (found) {
                                // 替换所有精准匹配的项
                                let newColumnNames = splitArr.map(item =>
                                  item === nsodConfigCode ? event.data.code : item
                                ).join(',');
                                // 判断 res.code 是否为 "_" + nsodConfigCode
                                let newCodeStr = res.code;
                                if (res.code === "_" + nsodConfigCode) {
                                  newCodeStr = res.code.replace(nsodConfigCode, event.data.code);
                                }
                                return {
                                  ...res,
                                  code: newCodeStr,
                                  columnNames: newColumnNames
                                };
                              } else {
                                return res;
                              }
                            });
                            let dataArr1s = dataArr1.map(
                              (res: any, index: number) => {
                                return {...res, sort: index + 1,
                                  columnNames:processIndexFields(res.columnNames,fieldCrudData)
                                };
                              }
                            );
                            sessionStorage.setItem('keyCrud',JSON.stringify(dataArr1s));
                            doAction({
                              actionType: 'setValue',
                              componentId: 'keyCrud',
                              args: {
                                value: {
                                  items: dataArr1s
                                }
                              }
                            });
                            let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                            // let data1 = JSON.parse(getCookie('fieldCrud'))
                            if (
                              event.data.type == 'date' &&
                              event.data.defaultValueMode == 'static'
                            ) {
                              // if (event.data.fieldType == "date" && event.data.defaultValueMode == "static") {
                              //修改的时候，如果不变时间或日期，下发的还是标准格式，如果改了就变成时间戳需格式化
                              if (
                                event.data.defaultValue.indexOf('-') > -1 ||
                                event.data.defaultValue.indexOf(':') > -1
                              ) {
                              } else {
                                event.data.defaultValue = formatToData(
                                  event.data.defaultValue
                                );
                              }
                            } else if (
                              event.data.type == 'date' &&
                              event.data.defaultValueMode == 'null'
                            ) {
                              // } else if (event.data.fieldType == "date" && event.data.defaultValueMode == "null") {
                              event.data.defaultValue = '';
                            } else if (
                              event.data.type == 'datetime' &&
                              event.data.defaultValueMode == 'static'
                            ) {
                              // } else if (event.data.fieldType == "datetime" && event.data.defaultValueMode == "static") {
                              if (
                                event.data.defaultValue.indexOf('-') > -1 ||
                                event.data.defaultValue.indexOf(':') > -1
                              ) {
                              } else {
                                event.data.defaultValue =
                                  event.data.defaultValue;
                                // event.data.defaultValue = formatToDataTime(event.data.defaultValue)
                              }
                            } else if (
                              event.data.type == 'datetime' &&
                              event.data.defaultValueMode == 'null'
                            ) {
                              // } else if (event.data.fieldType == "datetime" && event.data.defaultValueMode == "null") {
                              event.data.defaultValue = '';
                            } else if (
                              event.data.type == 'time' &&
                              event.data.defaultValueMode == 'static'
                            ) {
                              // } else if (event.data.fieldType == "time" && event.data.defaultValueMode == "static") {
                              if (
                                event.data.defaultValue.indexOf('-') > -1 ||
                                event.data.defaultValue.indexOf(':') > -1
                              ) {
                              } else {
                                event.data.defaultValue = event.data.defaultValue;
                                // event.data.defaultValue = formatToTime(event.data.defaultValue)
                              }
                            } else if (
                              event.data.type == 'time' &&
                              event.data.defaultValueMode == 'null'
                            ) {
                              // } else if (event.data.fieldType == "time" && event.data.defaultValueMode == "null") {
                              event.data.defaultValue = '';
                            } else {
                              event.data.defaultValue = event.data.defaultValue;
                            }
                            let rightData: any = {
                              sort: 1,
                              rules:event.data.config.rules,
                              colIgnoreTenant:event.data.config.colIgnoreTenant ? event.data.config.colIgnoreTenant : JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!),
                              primaryKeyMode: event.data.config.primaryKeyMode,
                              queryKey: event.data.needId
                                ? undefined
                                : event.data.queryKey,
                              usersDefaultValue:
                                event.data.config.usersDefaultValue,
                              onText: event.data.config.onText,
                              offText: event.data.config.offText,
                              foreignKeyFlag: false,
                              systemFieldType: event.data.systemFieldType
                                ? event.data.systemFieldType
                                : 0,
                              // systemFieldType: event.data.systemFieldType ? event.data.systemFieldType : "NONE",
                              source: event.data.config.source
                                ? 'app://dictionary/running/list?level=2&encoded=' +
                                  event.data.config.source
                                : null, // 枚举字典
                              // source: event.data.config.source ? 'app://dev-api/app/dict-type/list?type=' + event.data.config.source : null, // 枚举字典
                              sources: event.data.config.msources, // 枚举字典
                              msources: event.data.config.msources, // 枚举字典
                              nullable: event.data.config.nullable, // 是否允许空值
                              token: event.data.config.token, // 密钥
                              dbType: event.data.config.dbType, // 小数类型
                              allowedTypes: event.data.config.picFormat
                                ? event.data.config.picFormat.split(',')
                                : '', // 允许的格式
                              picFormat: event.data.config.picFormat,
                              restrictRatio: event.data.config.restrictRatio, // 图片比率
                              restrictRatioCustom:
                                event.data.config.restrictRatioCustom, // 图片比率提示值
                              //  colLength: event.data.colLength,// 长度
                              //  requiredFlag: event.data.requiredFlag,// 是否必填
                              //  attribute: event.data.attribute,// 可自定义属性
                              //  regexpMessage: event.data.regexpMessage,// 正则校验提示信息
                              minDateMsg: event.data.minDateMsg, // 最小提示提示
                              maxDateMsg: event.data.maxDateMsg, // 最大日期提示
                              maxDate: event.data.maxDate, // 最大日期
                              minDate: event.data.minDate, // 最小日期
                              //  inputMaxLength: event.data.inputMaxLength,// 最大长度
                              allowInput: event.data.config.allowInput, // 是否允许修改
                              meiptions: event.data.config.meiptions, // 枚举选项值
                              options: event.data.config.addOptions, // 枚举选项值
                              addOptions: event.data.config.addOptions, // 枚举选项值
                              // enableOCR: event.data.enableOCR, // 识别录入
                              defaultValueMode: event.data.defaultValueMode, //默认值
                              comment: event.data.comment, // 注释
                              code: event.data.code, // 字段名
                              defaultValue: event.data.defaultValue, // 默认值
                              name: event.data.name, // 显示标题
                              unique: event.data.config.unique, // 是否唯一
                              // enableSearch: event.data.config.enableSearch,// 是否可搜
                              length: Number(event.data.config.length), // 当行文本长度
                              maxLength: event.data.config.maxLength, // 长度
                              format: event.data.config.format, // 格式
                              formatMsg: event.data.config.formatMsg, // 提示信息
                              minLength: event.data.config.minLength, // 最小长度
                              minLengthMessage:
                                event.data.config.minLengthMessage, // 最小长度提示
                              maxLengthMessage:
                                event.data.config.maxLengthMessage, // 最大长度提示
                              // matchRegexp: event.data.matchRegexp,// 正则校验
                              type: event.data.type, // 基本字段类型
                              // fieldType: event.data.fieldType,// 基本字段类型
                              //  relation: event.data.relation,// 关系
                              //  advanced: event.data.advanced,// 高级字段
                              valueType: event.data.config.valueType,
                              dateTimeDefaultValue:
                                event.data.config.dateTimeDefaultValue,
                              dateDefaultValue:
                                event.data.config.dateDefaultValue,
                              timeDefaultValue:
                                event.data.config.timeDefaultValue,
                              minDateTime: event.data.config.minDateTime,
                              minDateDate: event.data.config.minDateDate,
                              minDateTimes: event.data.config.minDateTimes,
                              maxDateTime: event.data.config.maxDateTime,
                              maxDateDate: event.data.config.maxDateDate,
                              maxDateTimes: event.data.config.maxDateTimes,
                              maximum: event.data.config.maximum, // 最大值
                              // maxValue: event.data.maxValue,// 最大值
                              minimum: event.data.config.minimum, // 最小值
                              // minValue: event.data.minValue,// 最小值
                              minValueMessage: event.data.minValueMessage, // 最小值提示
                              maxValueMessage:
                                event.data.config.maxValueMessage, // 最大值提示
                              //  accuracy: event.data.accuracy,// 精度
                              //  decimal: event.data.decimal,// 小数位数
                              //  saveNorms: event.data.saveNorms,// 存储规格
                              currency: event.data.config.currency
                                      ? event.data.config.currency == 'CNY' ?
                                      {
                                        icon: '￥',
                                        label: '人民币',
                                        value: 'CNY'
                                      } : {
                                        icon: '$',
                                        label: '美元',
                                        value: 'USD'
                                      }
                                      : {
                                          icon: '￥',
                                          label: '人民币',
                                          value: 'CNY'
                                        }, // 币种
                              driver: event.data.config.driver, // 对象存储
                              // objectStorage: event.data.objectStorage,// 对象存储
                              accept: event.data.config.accept, // 文件允许的形式
                              maxSize: event.data.config.maxSize, // 最大附件
                              //  PictureRatio: event.data.PictureRatio,// 图片比率
                              salt: event.data.config.salt, // 加盐
                              description: event.data.description, // 描述
                              formula: event.data.config.expression, // 公式
                              expression: event.data.config.expression, // 公式
                              colTypeName: '',
                              precision: 10, // 精度
                              scale: '',
                              validations: {},
                              validationErrors: {}
                            };
                            console.log(rightData,'rightDatarightDatarightDatarightData');
                            function formatDecimal(num, decimalPlaces) {
                              const number = Number(num);
                              return number.toFixed(decimalPlaces);
                            }
                            if (rightData.type == 'text') {
                              // rightData.type = "VARCHAR"
                              // rightData.dbType = "VARCHAR(" + rightData.length + ")"
                              rightData.dbType = 'VARCHAR';
                              delete rightData.currency;
                            } else if (rightData.type == 'textarea') {
                              // rightData.type = "TEXT"
                              rightData.dbType = 'TEXTAREA';
                              delete rightData.currency;
                            } else if (rightData.type == 'serial-number') {
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 255 : 255;
                              rightData.defaultValueMode = nsod.config.defaultValueMode;
                              rightData.defaultValue = nsod.config.defaultValue;
                              rightData.parsedDateField = nsod.config.parsedDateField
                              rightData.parsedDateFormat = nsod.config.parsedDateFormat
                              rightData.serialClearSchedule = [{
                                env:1,
                                months: event.data.expireTime
                              }]
                              delete rightData.currency;
                            } else if (rightData.type == 'rich-text') {
                              // rightData.type = "LONGTEXT"
                              rightData.dbType = 'RICH_TEXT';
                              // rightData.nullable = false
                              delete rightData.currency;
                            } else if (
                              (rightData.type == 'int' && rightData.systemFieldType != 1) ||
                              rightData.type == 'bigint'
                            ) {
                              // rightData.type = "INT"
                              if (rightData.dbType == 'INT') {
                                rightData.dbType = 'INT';
                              } else {
                                rightData.dbType = 'BIGINT';
                              }
                              delete rightData.currency;
                            }
                            else if (rightData.type == 'float') {
                              rightData.scale = event.data.config.scale
                                ? event.data.config.scale
                                : 4;
                              rightData.precision = event.data.config.precision
                                ? event.data.config.precision
                                : 10;
                              delete rightData.currency;
                              rightData.decimalType = event.data.config.dbType
                              if(rightData.defaultValueMode == 'static' &&
                                rightData.decimalType == 'DECIMAL'){
                                rightData.defaultValue = formatDecimal(rightData.defaultValue,event.data.config.scale?event.data.config.scale:4)
                              }
                            } else if (rightData.type == 'money') {
                              // rightData.type = "DECIMAL"
                              rightData.dbType = 'BIGINT';
                              if (moneyData.length > 0) {
                                moneyData.forEach((element: any) => {
                                  if (element.value == rightData.currency) {
                                    let iconData = JSON.parse(element.extra);
                                    rightData.currency = {
                                      icon: iconData.symbol,
                                      label: element.label,
                                      value: element.value
                                    };
                                  }
                                });
                              }
                              if(rightData.defaultValueMode == 'static'){
                                rightData.defaultValue = formatDecimal(rightData.defaultValue,2)
                              }
                            } else if (rightData.type == 'enum') {
                              console.log(rightData, '修改rightDatarightData');
                              if(!rightData.addOptions){
                                rightData.options = []
                                rightData.addOptions = []
                              }
                              if (
                                rightData.addOptions &&
                                rightData.addOptions.length > 0
                              ) {
                                if (rightData.valueType == 'INTEGER') {
                                  rightData.options = rightData.addOptions.map(
                                    (element: any) => {
                                      return {
                                        value: 'values' in element ? Number(element.values) : element.labels,
                                        label: 'labels' in element ? element.labels : '',
                                        values: 'values' in element ? Number(element.values) : element.labels,
                                        labels: 'labels' in element ? element.labels : ''
                                      };
                                    }
                                  );
                                } else {
                                  rightData.options = rightData.addOptions.map(
                                    (element: any) => {
                                      return {
                                        value: 'values' in element ? element.values : element.labels,
                                        label: 'labels' in element ? element.labels : '',
                                        values: 'values' in element ? element.values : element.labels,
                                        labels: 'labels' in element ? element.labels : ''
                                      };
                                    }
                                  );
                                }
                                rightData.addOptions = rightData.options;
                              }
                              if (rightData.valueType == 'INTEGER') {
                                rightData.dbType = 'INTEGER';
                              } else {
                                rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 255 : 255;
                                rightData.dbType = 'VARCHAR';
                              }
                              if (rightData.meiptions == 'dictionaries') {
                                dictionaryList.forEach((element: any) => {
                                  if (element.name == rightData.msources) {
                                    rightData.sources = element.type;
                                    rightData.source =
                                      'app://dictionary/running/list?level=2&encoded=' +
                                      element.type;
                                    if (element.dbType == 0) {
                                      rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 255 : 255;
                                      rightData.dbType = 'VARCHAR';
                                    }
                                    if (element.dbType == 1) {
                                      rightData.dbType = 'INTEGER';
                                    }
                                  }
                                });
                              }
                              delete rightData.currency;
                            } else if (rightData.type == 'boolean') {
                              // rightData.type = "BIT"
                              rightData.dbType = 'BOOLEAN';
                              if (rightData.defaultValueMode == 'static') {
                                rightData.defaultValue = rightData.defaultValue
                                  ? rightData.defaultValue == null
                                    ? false
                                    : rightData.defaultValue
                                  : false;
                              }
                              delete rightData.currency;
                            } else if (rightData.type == 'date') {
                              // rightData.type = "DATE"
                              rightData.dbType = 'DATE';
                              delete rightData.currency;
                            } else if (rightData.type == 'datetime') {
                              rightData.showPrecision = event.data.config.showPrecision
                                ? event.data.config.showPrecision
                                : 0;
                              rightData.precision = event.data.config.precision
                                ? event.data.config.precision
                                : 0;
                              if(event.data.config){
                                rightData.precisionCompatible = 'precisionCompatible' in event.data.config
                                  ? event.data.config.precision <= 3 ? false : event.data.config.precisionCompatible
                                  : false;
                              }
                              rightData.defaultValue = truncateTimePrecision(rightData.defaultValue,rightData.precision);
                              // rightData.type = "DATETIME"
                              // rightData.dbType = 'DATETIME';
                              delete rightData.currency;
                            } else if (rightData.type == 'date-range') {
                              // rightData.type = "DATETIME_RANG"
                              // rightData.dbType = "DATETIME_RANG"
                              if (rightData.dbType == 'DATETIME') {
                                rightData.defaultValue = rightData.dateTimeDefaultValue;
                                rightData.minDate = rightData.minDateTime;
                                rightData.maxDate = rightData.maxDateTime;
                              } else if (rightData.dbType == 'DATE') {
                                rightData.defaultValue = rightData.dateDefaultValue;
                                rightData.minDate = rightData.minDateDate;
                                rightData.maxDate = rightData.maxDateDate;
                              } else if (rightData.dbType == 'TIME') {
                                rightData.defaultValue =
                                  rightData.timeDefaultValue;
                                rightData.minDate = rightData.minDateTimes;
                                rightData.maxDate = rightData.maxDateTimes;
                              }
                              // rightData.dbType = "datetime"
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 200 : 200;
                              delete rightData.currency;
                            } else if (rightData.type == 'time') {
                              rightData.showPrecision = event.data.config.showPrecision
                                ? event.data.config.showPrecision
                                : 0;
                              rightData.precision = event.data.config.precision
                                ? event.data.config.precision
                                : 0;
                              if(event.data.config){
                                rightData.precisionCompatible = 'precisionCompatible' in event.data.config
                                  ? event.data.config.precision <= 3 ? false : event.data.config.precisionCompatible
                                  : false;
                              }
                              rightData.defaultValue = truncateTimePrecision(rightData.defaultValue, rightData.precision);
                              // rightData.type = "TIME"
                              rightData.dbType = 'TIME';
                              delete rightData.currency;
                            } else if (rightData.type == 'user') {
                              // rightData.type = "USER_INFO"
                              // rightData.dbType = "VARCHAR(255)"
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 255 : 255;
                              rightData.dbType = 'VARCHAR';
                              if (
                                rightData.defaultValueMode == 'current_user'
                              ) {
                                rightData.defaultValue = 'current_user';
                              }
                              delete rightData.currency;
                            } else if (rightData.type == 'users') {
                              // rightData.type = "MULTI_USER_INFO"
                              // rightData.defaultValue = JSON.stringify(rightData.defaultValue)
                              console.log(rightData.usersDefaultValue,'rightData.usersDefaultValue');
                              rightData.dbType = 'JSON';
                              if (rightData.defaultValueMode == 'static') {
                                console.log(rightData.usersDefaultValue,'修改的rightData.usersDefaultValue');
                                rightData.defaultValue = rightData.usersDefaultValue;
                                rightData.usersDefaultValue = rightData.usersDefaultValue;
                              } else if (
                                rightData.defaultValueMode == 'expression'
                              ) {
                                rightData.defaultValue = event.data.defaultValue;
                                rightData.usersDefaultValue = event.data.defaultValue;
                              } else {
                                rightData.defaultValue = '';
                                rightData.usersDefaultValue = '';
                              }
                              console.log(rightData.usersDefaultValue,'111111111111');
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 5000 : 5000;
                              delete rightData.currency;
                            } else if (rightData.type == 'department') {
                              // rightData.type = "DEPORT_INFO"
                              // rightData.dbType = "VARCHAR(255)"
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 255 : 255;
                              rightData.dbType = 'VARCHAR';
                              // rightData.defaultValueMode = 'static'
                              // if(!rightData.defaultValue){
                              //     rightData.defaultValue = ''
                              //     rightData.defaultValueMode = 'null'
                              // }
                              delete rightData.currency;
                            } else if (rightData.type == 'owner') {
                              // rightData.type = "OWNER"
                              delete rightData.currency;
                            } else if (rightData.type == 'password') {
                              // rightData.type = "PASSWORD"
                              // rightData.dbType = "VARCHAR(255)"
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 255 : 255;
                              rightData.dbType = 'VARCHAR';
                              delete rightData.currency;
                            } else if (rightData.type == 'ciphertext') {
                              // rightData.type = "CIPHERTEXT"
                              // rightData.dbType = "VARCHAR(255)"
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 1000 : 1000;
                              rightData.dbType = 'VARCHAR';
                              delete rightData.currency;
                            } else if (rightData.type == 'address') {
                              // rightData.type = "ADDRESS"
                              delete rightData.currency;
                            } else if (rightData.type == 'json') {
                              // rightData.type = "JSON"
                              rightData.dbType = 'JSON';
                              // rightData.nullable = false;
                              delete rightData.currency;
                            } else if (rightData.type == 'formula') {
                              // rightData.type = "FORMULA"
                              delete rightData.currency;
                            } else if (rightData.type == 'attachment') {
                              // rightData.type = "FILE"
                              rightData.dbType = 'TEXT';
                              // rightData.driver = "bos"
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 1000 : 1000;
                              rightData.defaultValueMode = 'null';
                              rightData.defaultValue = null;
                              delete rightData.currency;
                            } else if (rightData.type == 'image') {
                              rightData.colTypeName = 'IMAGE';
                              // rightData.driver = "bos"
                              // rightData.type = "IMAGE"
                              rightData.length = 'length' in rightData ? rightData.length ? rightData.length : 1000 : 1000;
                              rightData.dbType = 'IMAGE';
                              rightData.defaultValueMode = 'null';
                              rightData.defaultValue = null;
                              delete rightData.currency;
                            }
                            else if(rightData.type == 'int' && rightData.systemFieldType == 1) {
                              rightData.nullable = false;
                              delete rightData.currency;
                              delete rightData.allowedTypes;
                            }
                            if (event.data.config.maxLength) {
                              rightData.validations.maxLength = event.data.config.maxLength;
                              rightData.maxLength = event.data.config.maxLength;
                            }
                            if (event.data.config.minLength) {
                              rightData.validations.minLength = event.data.config.minLength;
                              rightData.minLength = event.data.config.minLength;
                            }
                            if (event.data?.validations?.matchRegexp) {
                              rightData.validations.matchRegexp = event.data.validations.matchRegexp;
                              rightData.matchRegexp = event.data.validations.matchRegexp;
                            }
                            if (event.data?.config?.maxLengthMessage) {
                              rightData.validationErrors.maxLength = event.data.config.maxLengthMessage;
                              rightData.maxLengthMessage = event.data.config.maxLengthMessage;
                            }
                            if (event.data?.config?.minLengthMessage) {
                              rightData.validationErrors.minLength = event.data.config.minLengthMessage;
                              rightData.minLengthMessage = event.data.config.minLengthMessage;
                            }
                            if (event.data?.validationErrors?.matchRegexp) {
                              rightData.validationErrors.matchRegexp = event.data.validationErrors.matchRegexp;
                              rightData.matchRegexp = event.data.validationErrors.matchRegexp;
                            }
                            if (
                              event.data?.config?.minimum ||
                              event.data?.config?.minimum == 0
                            ) {
                              // if (event.data?.config?.minValue) {
                              rightData.validations.minimum = event.data.config.minimum;
                              // rightData.validations.minValue = event.data.config.minValue
                              rightData.minimum = event.data.config.minimum;
                              // rightData.minValue = event.data.config.minValue
                            }
                            if (rightData.minDate) {
                              rightData.validations.minDate = rightData.minDate;
                              rightData.minDate = rightData.minDate;
                            }
                            // if (event.data?.config?.minDate) {
                            //     rightData.validations.minDate = event.data.config.minDate
                            //     rightData.minDate = event.data.config.minDate
                            // }
                            if (event.data?.config?.minValueMessage) {
                              rightData.validationErrors.minimum = event.data.config.minValueMessage;
                              // rightData.validationErrors.minValue = event.data.config.minValueMessage
                              rightData.minValueMessage = event.data.config.minValueMessage;
                            }
                            if (event.data?.config?.minDateMsg) {
                              rightData.validationErrors.minDate = event.data.config.minDateMsg;
                              rightData.minDateMsg = event.data.config.minDateMsg;
                            }
                            if (event.data?.config?.maximum) {
                              rightData.validations.maximum = event.data.config.maximum;
                              rightData.maximum = event.data.config.maximum;
                            }
                            if (rightData.maxDate) {
                              rightData.validations.maxDate = rightData.maxDate;
                              rightData.maxDate = rightData.maxDate;
                            }
                            if (event.data?.config?.maxValueMessage) {
                              rightData.validationErrors.maximum = event.data.config.maxValueMessage;
                              rightData.maximum = event.data.config.maxValueMessage;
                              rightData.maxValueMessage = event.data.config.maxValueMessage;
                            }
                            if (event.data?.config?.maxDateMsg) {
                              rightData.validationErrors.maxDateMsg = event.data.config.maxDateMsg;
                              rightData.maxDateMsg = event.data.config.maxDateMsg;
                              rightData.maxDateMsg = event.data.config.maxDateMsg;
                            }
                            console.log(rightData, 'rightDatarightData');
                            let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                            console.log(dataArr, 'dataArrdataArrdataArr');
                            let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
                            let haveKeyArr = JSON.parse(sessionStorage.getItem('haveQueryKeyKey')!);
                            // let dataArr = JSON.parse(getCookie('fieldCrud'))
                            // if(rightData.defaultValueMode == 'null' || rightData.defaultValueMode == null){
                            if (
                              rightData.defaultValueMode == 'null' &&
                              rightData.type != 'rich-text' &&
                              rightData.type != 'serial-number'
                            ) {
                              rightData.defaultValue = null;
                            }
                            if (
                              rightData.defaultValueMode == null &&
                              rightData.type != 'rich-text' &&
                              rightData.type != 'serial-number'
                            ) {
                              rightData.defaultValue = null;
                            }
                            let keyDatas = dataArr1s;
                            // let keyDatas = JSON.parse(sessionStorage.getItem('keyCrud')!);
                            console.log(rightData.unique, 'rightData.unique');
                            if (rightData.unique == false) {
                              let keyArr = keyDatas.filter((element: any) => {
                                return element.code != '_'+rightData.code;
                              });
                              console.log(keyArr, 'keyArrkeyArrkeyArr');
                              let keyArrs = keyArr.map(
                                (res: any, index: number) => {
                                  return {...res, sort: index + 1,
                                    columnNames:processIndexFields(res.columnNames,dataArr)
                                  };
                                }
                              );
                              doAction({
                                actionType: 'setValue',
                                componentId: 'keyCrud',
                                args: {
                                  value: {
                                    items: keyArrs
                                  }
                                }
                              });
                              sessionStorage.setItem('keyCrud',JSON.stringify(keyArrs));
                            } else if (rightData.unique == true) {
                              let fieldDatas = dataArr.filter((res: any) => {
                                if (res.systemFieldType == 6) {
                                  return res;
                                }
                              });
                              let tenantCodeDatas = dataArr.filter(
                                  (res: any) => {
                                    return res.systemFieldType == 9
                                  }
                              );
                              console.log(fieldDatas, 'fieldDatas');
                              let queryKeyObject = {}
                              if(haveKeyArr && haveKeyArr.length > 0){
                                queryKeyObject = haveKeyArr.find((element: any) => {
                                  return element.code == '_' + nsodConfigCode;
                                });
                              }
                              let haveSame = false;
                              keyDatas.forEach((element: any) => {
                                if (element.code == '_' + nsodConfigCode) {
                                  haveSame = true;
                                }
                              });
                              console.log(haveSame,'haveSamehaveSamehaveSamehaveSame')
                              if (haveSame) {
                                console.log('进入', keyDatas);
                                let quitkeyData = keyDatas.map((dshj: any) => {
                                  let daij = {...dshj};
                                  if (
                                    daij.columnNames.includes(nsodConfigCode + ',') ||
                                    daij.columnNames.includes(',' + nsodConfigCode) ||
                                    daij.columnNames == nsodConfigCode
                                  ) {
                                    // daij.code = event.data.code;
                                    console.log(daij, '进入');
                                    let samne = daij.columnNames.split(',');
                                    let sjam = [];
                                    sjam = samne.map((sj: any) => {
                                      if (sj == nsodConfigCode) {
                                        return nsod.code;
                                      } else {
                                        return sj;
                                      }
                                    });
                                    console.log(sjam, 'sjam');
                                    daij.columnNames = sjam.join(',');
                                  }
                                  console.log(daij, 'daijdaijdaij');
                                  return daij;
                                });
                                if(rightData.unique == true){
                                  let haveUniqueFlag = true
                                  console.log(rightData,'rightData')
                                  keyDatas.forEach((element: any) => {
                                    if(element.code == '_' + nsodConfigCode){
                                      haveUniqueFlag = false
                                    }
                                  });
                                  if(haveUniqueFlag){
                                    let keyDataArr = {
                                      needId: event.data.needId
                                        ? event.data.needId
                                        : event.data.id,
                                      columnNames: rightData.code,
                                      code: '_'+rightData.code,
                                      uniqueFlag: true,
                                      systemIndex: true
                                    }
                                    if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                                      keyDataArr.queryKey = queryKeyObject.queryKey
                                    }
                                    quitkeyData.push(keyDataArr)
                                  }
                                }
                                console.log(quitkeyData, 'quitkeyData');
                                let quitkeyDatas = quitkeyData.map(
                                  (res: any, index: number) => {
                                    return {...res, sort: index + 1,
                                      columnNames:processIndexFields(res.columnNames,dataArr)
                                    };
                                  }
                                );
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'keyCrud',
                                  args: {
                                    value: {
                                      items: quitkeyDatas
                                    }
                                  }
                                });
                                sessionStorage.setItem('keyCrud',JSON.stringify(quitkeyDatas));
                              } else {
                                console.log('进入1', keyDatas);
                                let haveUniqueFlag = true
                                console.log(rightData,'rightData')
                                keyDatas.forEach((element: any) => {
                                  if(element.code == '_'+rightData.code){
                                    haveUniqueFlag = false
                                  }
                                });
                                if(haveUniqueFlag){
                                  if (fieldDatas.length > 0) {
                                    if(tenantCodeDatas.length>0){
                                      let keyDataArr = {
                                        needId: event.data.needId
                                          ? event.data.needId
                                          : event.data.id,
                                        columnNames: rightData.code + ','+fieldDatas[0].code+','+tenantCodeName,
                                        code: '_'+rightData.code,
                                        uniqueFlag: true,
                                        systemIndex: true
                                      }
                                      if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                                        keyDataArr.queryKey = queryKeyObject.queryKey
                                      }
                                      keyDatas.push(keyDataArr);
                                    }else{
                                      let keyDataArr = {
                                        needId: event.data.needId
                                          ? event.data.needId
                                          : event.data.id,
                                        columnNames: rightData.code + ','+fieldDatas[0].code,
                                        code: '_'+rightData.code,
                                        uniqueFlag: true,
                                        systemIndex: true
                                      }
                                      if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                                        keyDataArr.queryKey = queryKeyObject.queryKey
                                      }
                                      keyDatas.push(keyDataArr);
                                    }
                                  } else {
                                    if(tenantCodeDatas.length>0){
                                      let keyDataArr = {
                                        needId: event.data.needId
                                          ? event.data.needId
                                          : event.data.id,
                                        columnNames: rightData.code + ','+tenantCodeName,
                                        code: '_'+rightData.code,
                                        uniqueFlag: true,
                                        systemIndex: true
                                      }
                                      if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                                        keyDataArr.queryKey = queryKeyObject.queryKey
                                      }
                                      keyDatas.push(keyDataArr);
                                    }else{
                                      let keyDataArr = {
                                        needId: event.data.needId
                                          ? event.data.needId
                                          : event.data.id,
                                        // needId: uuid.v4(),
                                        columnNames: rightData.code,
                                        code: '_'+rightData.code,
                                        uniqueFlag: true,
                                        systemIndex: true
                                      }
                                      if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                                        keyDataArr.queryKey = queryKeyObject.queryKey
                                      }
                                      keyDatas.push(keyDataArr);
                                    }
                                  }
                                }
                                let keyDatase = keyDatas.map(
                                  (res: any, index: number) => {
                                    return {...res, sort: index + 1,
                                      columnNames:processIndexFields(res.columnNames,dataArr)
                                    };
                                  }
                                );
                                doAction({
                                  actionType: 'setValue',
                                  componentId: 'keyCrud',
                                  args: {
                                    value: {
                                      items: keyDatase
                                    }
                                  }
                                });
                                sessionStorage.setItem('keyCrud',JSON.stringify(keyDatase));
                              }
                            }
                            if (
                              rightData.type == 'text' ||
                              rightData.type == 'textarea' ||
                              rightData.type == 'user' ||
                              rightData.type == 'users' ||
                              rightData.type == 'department'
                            ) {
                              if (
                                rightData.defaultValueMode == 'static' &&
                                (rightData.defaultValue == '' ||
                                  !rightData.defaultValue)
                              ) {
                                rightData.defaultValue = '';
                              }
                            }
                            let needConfig = {...rightData};
                            delete needConfig.validations;
                            delete needConfig.validationErrors;
                            delete rightData.dbType;
                            delete rightData.rules;
                            delete rightData.colIgnoreTenant;
                            delete rightData.length;
                            delete rightData.primaryKeyMode;
                            delete rightData.serialClearSchedule;
                            let isHave = false;
                            if (dataArr) {
                              dataArr.forEach((res: any) => {
                                if (res.needId) {
                                  if (
                                    res.needId != event.data.needId &&
                                    res.code == event.data.code
                                  ) {
                                    isHave = true;
                                  }
                                } else {
                                  if (
                                    res.id != event.data.id &&
                                    res.code == event.data.code
                                  ) {
                                    isHave = true;
                                  }
                                }
                              });
                            }
                            let cacheEditListss = JSON.parse(sessionStorage.getItem('cacheEditList')!);
                            if (cacheEditListss && cacheEditListss.length > 1) {
                              console.log('进入选择');
                              cacheEditListss.forEach((lists: any) => {
                                // if(lists.needId){
                                // if(lists.code.toUpperCase()==event.data.code.toUpperCase() && lists.needId != event.data.needId){
                                if (
                                  lists.code.toUpperCase() == event.data.code.toUpperCase()
                                ) {
                                  isHave = true;
                                }
                              });
                            }
                            if (isHave) return;
                            rightData.foreignKeyFlag = event.data.foreignKeyFlag;
                            console.log(data1, 'data1data1');
                            let data = data1.map((element: any) => {
                              // console.log(element, 'elementelement')
                              if (element.id) {
                                // console.log(affData, '22222')
                                if (element.id == event.data.id) {
                                  if (element.foreignKeyFlag) {
                                    let data1 = affData.map((res: any) => {
                                      // if (res.needId == event.data.needId) {
                                      if (res.foreignKey == event.data.__super.code) {
                                        return {
                                          ...res,
                                          foreignKey: event.data.code
                                        };
                                        // if (res.foreignKeyCode == event.data.__super.code) {
                                        //     return { ...res, foreignKeyCode: event.data.code }
                                      } else {
                                        return res;
                                      }
                                    });
                                    console.log(data1, 'data1data1data1');
                                    sessionStorage.setItem('affectCrud',JSON.stringify(data1));
                                    doAction({
                                      actionType: 'setValue',
                                      componentId: 'affectCrud',
                                      args: {
                                        value: {
                                          items: data1
                                        }
                                      }
                                    });
                                  }
                                  if(event.data.type=='serial-number') {
                                    return {
                                      //  ...element,
                                      //  appId: event.data.appId,
                                      //  appId: element.appId,
                                      ...rightData,
                                      //  ...needConfig,
                                      config: needConfig,
                                      id: element.id,
                                      tableKey: element.tableKey,
                                      //  id: event.data.id,
                                    };
                                  } else {
                                    return {
                                      //  ...element,
                                      //  appId: event.data.appId,
                                      //  appId: element.appId,
                                      ...rightData,
                                      //  ...needConfig,
                                      config: needConfig,
                                      id: element.id
                                      //  id: event.data.id,
                                    };
                                  }
                                } else {
                                  return element;
                                }
                              } else if (element.needId) {
                                console.log(affData,'affDataaffDataaffDataaffDataaffData');
                                if (
                                  element.foreignKeyFlag &&
                                  element.needId == event.data.needId
                                ) {
                                  let data1 = affData.map((res: any) => {
                                    // if (res.needId == event.data.needId) {
                                    if (
                                      res.foreignKey == event.data.__super.code
                                    ) {
                                      return {
                                        ...res,
                                        foreignKey: event.data.code
                                      };
                                      // if (res.foreignKeyCode == event.data.__super.code) {
                                      //     return { ...res, foreignKeyCode: event.data.code }
                                    } else {
                                      return res;
                                    }
                                  });
                                  sessionStorage.setItem('affectCrud',JSON.stringify(data1));
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'affectCrud',
                                    args: {
                                      value: {
                                        items: data1
                                      }
                                    }
                                  });
                                  return {
                                    appId: event.data.appId,
                                    ...rightData,
                                    foreignKeyFlag: true,
                                    config: needConfig,
                                    // config: rightData,
                                    needId: event.data.needId
                                  };
                                } else {
                                  if (
                                    element.type != 'relation' &&
                                    element.needId == event.data.needId
                                  ) {
                                    return {
                                      appId: event.data.appId,
                                      ...rightData,
                                      config: needConfig,
                                      // config: rightData,
                                      needId: event.data.needId
                                    };
                                  } else {
                                    return element;
                                  }
                                }
                              } else if (element.queryKey) {
                                console.log(affData, '1111111111');
                                if (
                                  element.type != 'relation' &&
                                  element.queryKey == event.data.queryKey
                                ) {
                                  let data1 = affData.map((res: any) => {
                                    if (
                                      res.foreignKey == event.data.__super.code
                                    ) {
                                      // if (res.foreignKeyCode == event.data.__super.code) {
                                      // if (res.fieldKey == event.data.queryKey) {
                                      return {
                                        ...res,
                                        foreignKey: event.data.code
                                      };
                                      // return { ...res, foreignKeyCode: event.data.code }
                                    } else {
                                      return res;
                                    }
                                  });
                                  doAction({
                                    actionType: 'setValue',
                                    componentId: 'affectCrud',
                                    args: {
                                      value: {
                                        items: data1
                                      }
                                    }
                                  });
                                  return {
                                    appId: event.data.appId,
                                    ...rightData,
                                    config: needConfig,
                                    needId: event.data.needId
                                  };
                                }else{
                                  return element;
                                }
                              } else {
                                return element;
                              }
                            });
                            data = data.map((element: any) => {
                              let rightData = {...element}
                              if (element.type === 'serial-number'
                                && element.config
                                && element.config.parsedDateField
                                && element.config.parsedDateField !== '') {
                                if(element.config.parsedDateField == nsod.__super.code){
                                  rightData.parsedDateField = event.data.code;
                                  rightData.config.parsedDateField = event.data.code;
                                }
                              }
                              return rightData
                            });
                            console.log(data, '修改数据');
                            data.forEach((element: any, index: number) => {
                              if(element){
                               element.sort = index + 1;
                              }
                            });
                            let fieldCruds = data.map((res: any) => {
                              // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                              if (res.type != 'relation' && res.systemFieldType != 6
                                && res.systemFieldType != 7 && res.systemFieldType != 9
                                 && res.systemFieldType != 8 && res.type != 'formula') {
                                return res;
                              }
                            });
                            let puFieldCruds = data.map((res: any) => {
                              if (
                                !res.foreignKeyFlag &&
                                res.systemFieldType == 0 &&
                                res.type != 'relation'
                              ) {
                                return res;
                              }
                            });
                            let fieldKeyCruds = data.map((res: any) => {
                              if (
                                res.type != 'relation' &&
                                res.type != 'formula' &&
                                res.type != 'textarea' &&
                                res.type != 'rich-text' &&
                                res.type != 'json' &&
                                res.type != 'attachment' &&
                                res.type != 'image' &&
                                res.type != 'ciphertext' &&
                                res.type != 'users'
                              ) {
                                if (
                                  res.type == 'text' &&
                                  res.config.length < 768
                                ) {
                                  return res;
                                } else if (res.type != 'text') {
                                  return res;
                                }
                              }
                            });
                            let waiList: any[] = [];
                            data.forEach((res: any) => {
                              if (
                                res.type == 'text' &&
                                res.config.length >= 20 && res.systemFieldType == 0
                              ) {
                                waiList.push({
                                  ...res,
                                  label: res.code,
                                  value: res.code
                                });
                              } else if (
                                res.type == 'int' &&
                                res.systemFieldType == 0 &&
                                res.config.integerType == 'BIGINT'
                              ) {
                                waiList.push({
                                  ...res,
                                  label: res.code,
                                  value: res.code
                                });
                              }
                            });
                            console.log(waiList, 'waiListwaiList');
                            if(haveKeyArr && haveKeyArr.length > 0){
                              let haveKeyArrArr = haveKeyArr.map((item:any) => {
                                if(item.code == '_' + nsodConfigCode){
                                  return {
                                    ...item,
                                    code:'_' + rightData.code
                                  }
                                }else{
                                  return item
                                }
                              });
                              sessionStorage.setItem('haveQueryKeyKey',JSON.stringify(haveKeyArrArr));
                            }
                            sessionStorage.setItem('waiList',JSON.stringify(waiList));
                            sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                            sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                            sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                            sessionStorage.setItem('fieldCrud',JSON.stringify(data));
                            let formulArr: any[] = [];
                            data.forEach((item: any) => {
                              if (
                                item.type != 'formula' &&
                                item.systemFieldType != 6 &&
                                item.systemFieldType != 7 &&
                                item.systemFieldType != 8 &&
                                item.systemFieldType != 9
                              ) {
                                formulArr.push({...item,label:item.name,value:item.code});
                              }
                            });
                            sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                            doAction({
                              actionType: 'setValue',
                              componentId: 'myField',
                              args: {
                                value: {
                                  items: data
                                }
                              }
                            });
                            let systemFieldData = JSON.parse(sessionStorage.getItem('haveSystemQueryKey')!)
                            if(systemFieldData && systemFieldData.length > 0){
                              systemFieldData = systemFieldData.filter((item:any) => item.code != nsodConfigCode);
                            }
                            sessionStorage.setItem('haveSystemQueryKey',JSON.stringify(systemFieldData));
                            doAction({
                              actionType: 'reload',
                              componentId: 'nameField'
                            });
                            toast.success('修改成功', {
                              position: 'top-center'
                            });
                          }, 10);
                        }
                      }
                    ]
                  }
                },
                actions: [
                  {
                    type: 'button',
                    actionType: 'confirm',
                    label: '确认',
                    primary: true
                  }
                ]
              }
            },
            {
              label: '删除',
              type: 'button',
              // "disabledOn": "${selfContainFlag}",
              disabledOn:
                "${systemFieldType != 0 || type == 'relation' || type == 'parent' || systemFieldType == 9 || foreignKeyFlag}",
              // "disabledOn": "${systemFieldType != 'NONE' || type == 'relation'}",
              level: 'link',
              actionType: 'dialog',
              dialog: {
                title: '删除',
                body: {
                  type: 'mapping',
                  value: '1',
                  map: {
                    '1': '您确认要删除${code}?'
                    // "1": "您确认要删除${fieldName}?",
                  }
                },
                onEvent: {
                  confirm: {
                    actions: [
                      {
                        actionType: 'custom',
                        script: function (_: any, doAction: any, event: any) {
                          console.log('字段集合删除');
                          console.log(event, 'eventeventevent');
                          let newArr = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                          let haveKeyArr = JSON.parse(sessionStorage.getItem('haveQueryKeyKey')!);
                          let newArr1 = newArr.filter((res: any) => {
                            // return res.code != event.data.code
                            if (res.id) {
                              return res.id != event.data.id;
                            } else if (res.needId) {
                              return res.needId != event.data.needId;
                            } else {
                              return res;
                            }
                          });
                          newArr1.forEach((element: any, index: number) => {
                            element.sort = index + 1;
                          });
                          let fieldCruds = newArr1.map((res: any) => {
                            // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                            if (res.type != 'relation' && res.systemFieldType != 6
                              && res.systemFieldType != 7 && res.systemFieldType != 9
                               && res.systemFieldType != 8 && res.type != 'formula') {
                              return res;
                            }
                          });
                          let puFieldCruds = newArr1.map((res: any) => {
                            if (
                              !res.foreignKeyFlag &&
                              res.systemFieldType == 0 &&
                              res.type != 'relation'
                            ) {
                              return res;
                            }
                          });
                          let fieldKeyCruds = newArr1.map((res: any) => {
                            if (
                              res.type != 'relation' &&
                              res.type != 'formula' &&
                              res.type != 'textarea' &&
                              res.type != 'rich-text' &&
                              res.type != 'json' &&
                              res.type != 'attachment' &&
                              res.type != 'image' &&
                              res.type != 'ciphertext' &&
                              res.type != 'users'
                            ) {
                              if (
                                res.type == 'text' &&
                                res.config.length < 768
                              ) {
                                return res;
                              } else if (res.type != 'text') {
                                return res;
                              }
                            }
                          });
                          let waiList = newArr1.filter((res: any) => {
                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                              return res;
                            } else if (
                              res.type == 'int' &&
                              res.systemFieldType == 0 &&
                              res.config.integerType == 'BIGINT'
                            ) {
                              return res;
                            }
                          });
                          if(haveKeyArr && haveKeyArr.length > 0){
                            let haveKeyArrArr = haveKeyArr.filter((item:any) => {
                              return item.code != '_' + event.data.code
                            });
                            sessionStorage.setItem('haveQueryKeyKey',JSON.stringify(haveKeyArrArr));
                          }
                          sessionStorage.setItem('waiList', JSON.stringify(waiList));
                          sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds));
                          sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds));
                          sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds));
                          sessionStorage.setItem('fieldCrud', JSON.stringify(newArr1));
                          let formulArr: any[] = [];
                          newArr1.forEach((item: any) => {
                            if (
                              item.type != 'formula' &&
                              item.systemFieldType != 6 &&
                              item.systemFieldType != 7 &&
                              item.systemFieldType != 8 &&
                              item.systemFieldType != 9
                            ) {
                              formulArr.push({...item,label:item.name,value:item.code});
                            }
                          });
                          sessionStorage.setItem('formulaData', JSON.stringify(formulArr));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'myField',
                            args: {
                              value: {
                                items: newArr1
                              }
                            }
                          });
                          let nameFieldData = sessionStorage.getItem('nameFieldData')
                          console.log(nameFieldData,'nameFieldData')
                          console.log(event.data.code,'event.data.code')
                          if (nameFieldData == event.data.code) {
                            let ars = newArr1.filter((sc: any) => {
                              return sc.systemFieldType == 0 && sc.type != 'formula' ;
                            });
                            console.log(ars, 'arsarsarsarsarsars');
                            if (ars.length > 0) {
                              doAction({
                                actionType: 'setValue',
                                componentId: 'nameField',
                                args: {
                                  value: ars[0].code
                                }
                              });
                              // nameFieldData = ars[0].code;
                              sessionStorage.setItem('nameFieldData', ars[0].code)
                            } else {
                              doAction({
                                actionType: 'setValue',
                                componentId: 'nameField',
                                args: {
                                  value: 'id'
                                }
                              });
                              // nameFieldData = 'id';
                              sessionStorage.setItem('nameFieldData', 'id')
                            }
                          }
                          let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
                          let data = data1.filter((res: any) => {
                            // return res.code != event.data.code
                            if (res.id) {
                              return res.id != event.data.id;
                            } else if (res.needId) {
                              return res.needId != event.data.needId;
                            } else {
                              return res;
                            }
                          });
                          sessionStorage.setItem('affectCrud',JSON.stringify(data));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'affectCrud',
                            args: {
                              value: {
                                items: data
                              }
                            }
                          });
                          let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!);
                          console.log(dataArr,'dataArr')
                          console.log(event.data.__super.code,'event.data.__super.code')
                          console.log(event.data.__super.__super.code,'event.data.__super.__super.code')
                          let fieldDatas = [];
                            fieldDatas = dataArr.map((res: any) => {
                              let needCode = 'config' in event.data ?
                               'code' in event.data.config ? event.data.config.code : event.data.code
                                : event.data.code
                              let splitArr = res.columnNames.split(',');
                              let found = false;
                              splitArr.forEach((item) => {
                                if (item === needCode) {
                                  found = true;
                                }
                              });
                              if (found) {
                                const filteredArr = splitArr.filter(item => item !== needCode);
                                return {
                                  ...res,
                                  columnNames: filteredArr.join(',')
                                };
                              } else {
                                return res;
                              }
                            });
                            console.log(fieldDatas,'fieldDatas')
                          let deleteCode: any[] = [];
                          const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                          deleteCode = newArr
                            .filter(item => systemFieldTypes.includes(item.systemFieldType))
                            .map(item => item.code);
                          const blackListFields = new Set([
                            'id',
                            'deleted',
                            'deletedAt',
                            'deletedBy',
                            'updatedAt',
                            'createdAt',
                            'createdBy',
                            'updatedBy',
                            ...deleteCode
                          ]);
                          console.log(blackListFields,'blackListFields')
                          let fieldDataes: any[] = [];
                          console.log(fieldDatas,'fieldDatasfieldDatasfieldDatasfieldDatas')
                          fieldDatas.forEach((res: any) => {
                            const { columnNames } = res;
                            if (!columnNames || columnNames.trim() === '') return;
                            const fields = columnNames.split(',')
                            const hasNonBlacklisted = fields.every(f => blackListFields.has(f));
                            console.log(hasNonBlacklisted,'hasNonBlacklisted')
                            if (!hasNonBlacklisted || !res.uniqueFlag) {
                              fieldDataes.push(res);
                            }
                          });
                          let fieldDataese = fieldDataes.map(
                            (res: any, index: number) => {
                              return {...res, sort: index + 1,
                                columnNames:processIndexFields(res.columnNames,newArr1)
                              };
                            }
                          );
                          console.log(fieldDataes, 'fieldDataes');
                          sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
                          let systemFieldData = JSON.parse(sessionStorage.getItem('haveSystemQueryKey')!)
                          if(systemFieldData && systemFieldData.length > 0){
                            systemFieldData = systemFieldData.filter((item:any) => item.code != event.data.code);
                          }
                          sessionStorage.setItem('haveSystemQueryKey',JSON.stringify(systemFieldData));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'keyCrud',
                            args: {
                              value: {
                                items: fieldDataese
                              }
                            }
                          });
                          doAction({
                            actionType: 'reload',
                            componentId: 'nameField'
                          });
                          toast.success('删除成功', {
                            position: 'top-center'
                          });
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              label: '上移',
              type: 'button',
              level: 'link',
              onEvent: {
                click: {
                  actions: [
                    {
                      actionType: 'custom',
                      script: function (_: any, doAction: any, event: any) {
                        console.log('字段集合上移');
                        console.log(_, '_____');
                        console.log(doAction, 'doActiondoActiondoAction');
                        console.log(event, 'eventeventeventeventevent');
                        let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                        let indexs = null;
                        data1.forEach((element: any, index: number) => {
                          if (element.id) {
                            if (element.queryKey == event.data.queryKey) {
                              indexs = index;
                            }
                          } else if (element.needId) {
                            if (element.needId == event.data.needId && element.code == event.data.code) {
                              indexs = index;
                            }
                          } else {
                            if (element.queryKey == event.data.queryKey) {
                              indexs = index;
                            }
                          }
                        });
                        if (indexs != null && indexs>0) {
                          console.log(indexs, 'indexsindexsindexs');
                          data1[indexs] = data1.splice(
                            indexs - 1,
                            1,
                            data1[indexs]
                          )[0];
                          console.log(data1, 'dadadadadadadadadada');
                          data1.forEach((element: any, index: number) => {
                            element.sort = index + 1;
                          });
                          let fieldCruds = data1.map((res: any) => {
                            // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                            if (res.type != 'relation' && res.systemFieldType != 6
                              && res.systemFieldType != 7 && res.systemFieldType != 9
                               && res.systemFieldType != 8 && res.type != 'formula') {
                              return res;
                            }
                          });
                          let puFieldCruds = data1.map((res: any) => {
                            if (
                              !res.foreignKeyFlag &&
                              res.systemFieldType == 0 &&
                              res.type != 'relation'
                            ) {
                              return res;
                            }
                          });
                          let fieldKeyCruds = data1.map((res: any) => {
                            if (
                              res.type != 'relation' &&
                              res.type != 'formula' &&
                              res.type != 'textarea' &&
                              res.type != 'rich-text' &&
                              res.type != 'json' &&
                              res.type != 'attachment' &&
                              res.type != 'image' &&
                              res.type != 'ciphertext' &&
                              res.type != 'users'
                            ) {
                              if (
                                res.type == 'text' &&
                                res.config.length < 768
                              ) {
                                return res;
                              } else if (res.type != 'text') {
                                return res;
                              }
                            }
                          });
                          let waiList = data1.filter((res: any) => {
                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                              return res;
                            } else if (
                              res.type == 'int' &&
                              res.systemFieldType == 0 &&
                              res.config.integerType == 'BIGINT'
                            ) {
                              return res;
                            }
                          });
                          sessionStorage.setItem('waiList',JSON.stringify(waiList));
                          sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                          sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                          sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                          sessionStorage.setItem('fieldCrud',JSON.stringify(data1));
                          let formulArr: any[] = [];
                          data1.forEach((item: any) => {
                            if (
                              item.type != 'formula' &&
                              item.systemFieldType != 6 &&
                              item.systemFieldType != 7 &&
                              item.systemFieldType != 8 &&
                              item.systemFieldType != 9
                            ) {
                              formulArr.push({...item,label:item.name,value:item.code});
                            }
                          });
                          sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'myField',
                            args: {
                              value: {
                                items: data1
                              }
                            }
                          });
                        }
                        doAction({
                          actionType: 'reload',
                          componentId: 'nameField'
                        });
                      }
                    }
                  ]
                }
              }
            },
            {
              label: '下移',
              type: 'button',
              level: 'link',
              onEvent: {
                click: {
                  actions: [
                    {
                      actionType: 'custom',
                      script: function (_: any, doAction: any, event: any) {
                        console.log('字段集合下移');
                        console.log(_, '_____');
                        console.log(doAction, 'doActiondoActiondoAction');
                        console.log(event, 'eventeventeventeventevent');
                        let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
                        let indexs: any;
                        data1.forEach((element: any, index: number) => {
                          element.sort = index + 1;
                          if (element.id) {
                            if (element.code == event.data.code) {
                              indexs = index;
                            }
                          } else if (element.needId) {
                            if (element.needId == event.data.needId && element.code == event.data.code) {
                              indexs = index;
                            }
                          } else {
                            if (element.code == event.data.code) {
                              indexs = index;
                            }
                          }
                        });
                        if (indexs + 1 != data1.length) {
                          console.log(indexs, 'indexsindexsindexs');
                          data1[indexs] = data1.splice(
                            indexs + 1,
                            1,
                            data1[indexs]
                          )[0];
                          console.log(data1, 'dadadadadadadadadada');
                          data1.forEach((element: any, index: number) => {
                            element.sort = index + 1;
                          });
                          let fieldCruds = data1.map((res: any) => {
                            // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
                            if (res.type != 'relation' && res.systemFieldType != 6
                              && res.systemFieldType != 7 && res.systemFieldType != 9
                               && res.systemFieldType != 8 && res.type != 'formula') {
                              return res;
                            }
                          });
                          let puFieldCruds = data1.map((res: any) => {
                            if (
                              !res.foreignKeyFlag &&
                              res.systemFieldType == 0 &&
                              res.type != 'relation'
                            ) {
                              return res;
                            }
                          });
                          let fieldKeyCruds = data1.map((res: any) => {
                            if (
                              res.type != 'relation' &&
                              res.type != 'formula' &&
                              res.type != 'textarea' &&
                              res.type != 'rich-text' &&
                              res.type != 'json' &&
                              res.type != 'attachment' &&
                              res.type != 'image' &&
                              res.type != 'ciphertext' &&
                              res.type != 'users'
                            ) {
                              if (
                                res.type == 'text' &&
                                res.config.length < 768
                              ) {
                                return res;
                              } else if (res.type != 'text') {
                                return res;
                              }
                            }
                          });
                          let waiList = data1.filter((res: any) => {
                            if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
                              return res;
                            } else if (
                              res.type == 'int' &&
                              res.systemFieldType == 0 &&
                              res.config.integerType == 'BIGINT'
                            ) {
                              return res;
                            }
                          });
                          sessionStorage.setItem('waiList',JSON.stringify(waiList));
                          sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
                          sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
                          sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
                          sessionStorage.setItem('fieldCrud',JSON.stringify(data1));
                          let formulArr: any[] = [];
                          data1.forEach((item: any) => {
                            if (
                              item.type != 'formula' &&
                              item.systemFieldType != 6 &&
                              item.systemFieldType != 7 &&
                              item.systemFieldType != 8 &&
                              item.systemFieldType != 9
                            ) {
                              formulArr.push({...item,label:item.name,value:item.code});
                            }
                          });
                          sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
                          doAction({
                            actionType: 'setValue',
                            componentId: 'myField',
                            args: {
                              value: {
                                items: data1
                              }
                            }
                          });
                        }
                        doAction({
                          actionType: 'reload',
                          componentId: 'nameField'
                        });
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      ]
    }
  };
};
