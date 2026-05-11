import { getZippedSnowflakeId } from "@/api/entitymanage";
import { addRule } from "amis";
import * as uuid from 'uuid'
import {processIndexFields} from '@/utils';

export default (codeName: any, refIndex: any) => {
    return {
        "title": "索引设置",
        "tab": [
            {
                "type": "crud",
                "id": "keyCrud",
                "autoFillHeight": 500,
                "name": "keyCrud",
                "syncLocation": false,
                "columnsTogglable": false,
                "alwaysShowPagination": false,
                "footerToolbar": [],
                "source": "$indexes",
                "headerToolbar": [
                    {
                        "type": "action",
                        "actionType": "drawer",
                        "label": "新增索引",
                        "level": "primary",
                        "onEvent": {
                            "click": {
                                "actions": [
                                    {
                                        "actionType": "custom",
                                        "script": function (e: any, doAction: any, event: any) {
                                            addRule(
                                                'isKeyCrud',
                                                (values, value) => {
                                                    console.log(values, '新增索引values')
                                                    console.log(value, '新增索引value')
                                                    let isHave = false
                                                    let isHaves = false
                                                    let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                                    if (/^(?!_).*/.test(value) == false) {
                                                        isHaves = true
                                                    }
                                                    dataArr.forEach((res: any) => {
                                                        if (res.code == value) {
                                                            isHave = true
                                                        }
                                                    })
                                                    if (isHave) {
                                                        return {
                                                            error: true,
                                                            msg: '不允许存在相同的字段'
                                                        };
                                                    }else if (isHaves) {
                                                        return {
                                                            error: true,
                                                            msg: '索引名称不能以下划线开头'
                                                        };
                                                    } else {
                                                        return true;
                                                    }
                                                }
                                            );
                                            addRule(
                                                'isColumnNames',
                                                (values, value) => {
                                                    console.log(values, '新增索引values')
                                                    console.log(value, '新增索引value')
                                                    let isHave = false
                                                    let isHaves = false
                                                    let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                    let deleteCode: any[] = [];
                                                    let deleteCode1: any[] = [];
                                                    const systemFieldTypes = [1, 6, 8, 9];
                                                    const fieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                                                    deleteCode = dataArr
                                                      .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                                      .map(item => item.code);
                                                    deleteCode1 = dataArr
                                                      .filter(item => fieldTypes.includes(item.systemFieldType))
                                                      .map(item => item.code);
                                                    const blackListFields = [
                                                        'id',
                                                        'deleted',
                                                        'deletedAt',
                                                        ...deleteCode
                                                    ];
                                                    const blackList = new Set([
                                                        'id',
                                                        'deleted',
                                                        'deletedAt',
                                                        'deletedBy',
                                                        'updatedAt',
                                                        'createdAt',
                                                        'createdBy',
                                                        'updatedBy',
                                                        ...deleteCode1
                                                    ]);
                                                    if (
                                                      blackListFields.some(val => val === value) &&
                                                      values.uniqueFlag
                                                    ) {
                                                        isHave = true;
                                                    }
                                                    let yuan = values.columnNames.split(',')
                                                    let isTure = yuan.filter((res: any) => {
                                                        if (!blackList.has(res)) {
                                                            return res
                                                        }
                                                    })
                                                    console.log(isTure, 'isTure')
                                                    if (isTure.length == 0 && values.uniqueFlag) {
                                                        isHaves = true
                                                    }
                                                    if (isHave) {
                                                        return {
                                                            error: true,
                                                            msg: '此字段不能单独设置为唯一索引'
                                                        };
                                                    } else if (isHaves) {
                                                        return {
                                                            error: true,
                                                            msg: '选择的字段不能全部为系统字段'
                                                        };
                                                    } else {
                                                        return true;
                                                    }
                                                }
                                            );
                                            getZippedSnowflakeId().then((res: any) => {
                                                codeName = res.data.data
                                            })
                                        }
                                    }
                                ]
                            }
                        },
                        "drawer": {
                            "resizable": true,
                            "position": "left",
                            "width": 380,
                            "title": "新增索引",
                            "id": "uploadKey",
                            "name": "uploadKey",
                            "body": [
                                {
                                    "type": "form",
                                    "title": "表单",
                                    "body": [
                                        {
                                            "label": "索引名称",
                                            "type": "input-text",
                                            "name": "codes",
                                            "validations": {
                                                "matchRegexp": "^[a-zA-Z_][A-Za-z0-9_]*$",
                                                "isKeyCrud": true
                                            },
                                            "validationErrors": {
                                                "matchRegexp": "请填写规范字段名"
                                            },
                                        },
                                        {
                                            "type": "select",
                                            "label": "字段名",
                                            "name": "columnNames",
                                            // "name": "columnKeys",
                                            "required": "true",
                                            "multiple": true,
                                            "checkAll": false,
                                            // "labelField": "fieldTypeName",
                                            "labelField": "code",
                                            // "valueField": "value",
                                            "valueField": "code",
                                            //   "source":"$myField"
                                            "source": "${ss:fieldKeyCruds}",
                                            "validations": {
                                                "isColumnNames": true
                                            },
                                            "onEvent": {
                                                "change": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            script: function (_: any, doAction: any, event: any) {
                                                                console.log(event, 'eventeventevent')
                                                                let arr: any[] = []
                                                                refIndex = []
                                                                event.data.selectedItems.forEach((element: any) => {
                                                                    arr.push(element.code)
                                                                    // arr.push(element.label)
                                                                });
                                                                refIndex = arr.join(',')
                                                                console.log(refIndex, 'refIndexrefIndexrefIndex')
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            "type": "switch",
                                            "label": "是否唯一",
                                            "name": "uniqueFlag",
                                            "id": "u:9971620607ca"
                                        }
                                    ],
                                }
                            ],
                            "actions": [
                                {
                                    "type": "button",
                                    "label": "取消",
                                    // "level": "info",
                                    "close": "uploadKey"
                                },
                                {
                                    "type": "button",
                                    "actionType": "confirm",
                                    "label": "确认",
                                    "primary": true,
                                    // "close": false,
                                    "onEvent": {
                                        "click": {
                                            "weight": 0,
                                            "debounce": {
                                                "wait": 100
                                            },
                                            "actions": [
                                                {
                                                    "actionType": "custom",
                                                    script: function (_: any, doAction: any, event: any) {
                                                        let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                        let deleteCode: any[] = [];
                                                        let deleteCode1: any[] = [];
                                                        const systemFieldTypes = [1, 6, 8, 9]; // 要提取的字段类型
                                                        const fieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9]
                                                        deleteCode = fieldData
                                                          .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                                          .map(item => item.code);
                                                        deleteCode1 = fieldData
                                                          .filter(item => fieldTypes.includes(item.systemFieldType))
                                                          .map(item => item.code);
                                                        const blackListFields = [
                                                            'id',
                                                            'deleted',
                                                            'deletedAt',
                                                            ...deleteCode
                                                        ];
                                                        const blackList = new Set([
                                                            'id',
                                                            'deleted',
                                                            'deletedAt',
                                                            'deletedBy',
                                                            'updatedAt',
                                                            'createdAt',
                                                            'createdBy',
                                                            'updatedBy',
                                                            ...deleteCode1
                                                        ]);
                                                        if (
                                                          blackListFields.some(val => val === event.data.columnNames) &&
                                                          event.data.uniqueFlag
                                                        ) {
                                                            return
                                                        }
                                                        if (/^(?!_).*/.test(event.data.codes) == false) {
                                                            return
                                                        }
                                                        let yuan = event.data.columnNames.split(',')
                                                        let isTures = yuan.filter((res: any) => {
                                                            if (!blackList.has(res)) {
                                                                return res
                                                            }
                                                        })
                                                        console.log(isTures, 'isTures')
                                                        if (isTures.length == 0 && event.data.uniqueFlag) {
                                                            return
                                                        }
                                                        console.log('新增索引设置')
                                                        console.log(_, '____')
                                                        console.log(doAction, 'doActiondoActiondoActiondoAction')
                                                        console.log(event, 'eventeventeventevent')
                                                        setTimeout(() => {
                                                            if (/^[a-zA-Z_][A-Za-z0-9_]*$/.test(event.data.codes) == false) return
                                                            if (!event.data.columnNames) return
                                                            // if (!event.data.columnKeys) return
                                                            let codeNames
                                                            if (!event.data.codes || event.data.codes == "") {
                                                                codeNames = codeName
                                                            } else {
                                                                codeNames = event.data.codes
                                                            }
                                                            let data: any = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                                            let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                                            let fieldDataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                            console.log(fieldData, 'fieldData')
                                                            let deleteString = ''
                                                            let fieldDatas = fieldData.filter((res: any) => res.systemFieldType == 6)
                                                            deleteString  = fieldDatas.length > 0 ? fieldDatas[0].code : ''
                                                            let haveContentCode = fieldData.filter((res: any) => {
                                                              return res.systemFieldType == 9
                                                            })
                                                            let isHave = false
                                                            dataArr.forEach((res: any) => {
                                                                if (res.code == event.data.codes) {
                                                                    isHave = true
                                                                }
                                                            })
                                                            if (isHave) return
                                                            if (fieldDatas.length > 0 && event.data.uniqueFlag) {
                                                              const columnArr = event.data.columnNames
                                                                .split(',')                    // 分割
                                                                .map(col => col.trim());       // 去空格
                                                              const exists = columnArr.some(col => col === deleteString);
                                                              if (!exists) {
                                                                columnArr.push(deleteString); // 不存在则添加
                                                              }
                                                              if(haveContentCode.length > 0 && event.data.uniqueFlag){
                                                                const contentExists = columnArr.some(col => col === haveContentCode[0].code);
                                                                if (!contentExists) {
                                                                  columnArr.push(haveContentCode[0].code); // 不存在则添加
                                                                }
                                                                data.push({
                                                                  needId: uuid.v4(),
                                                                  columnNames: columnArr.join(','),
                                                                  code: codeNames,
                                                                  uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                })
                                                              } else {
                                                                data.push({
                                                                  needId: uuid.v4(),
                                                                  columnNames: columnArr.join(','),
                                                                  code: codeNames,
                                                                  uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                })
                                                              }
                                                            } else if(haveContentCode.length > 0
                                                              && event.data.uniqueFlag
                                                              && (!event.data.columnNames.includes(','+haveContentCode[0].code)
                                                                && !event.data.columnNames.includes(haveContentCode[0].code))){
                                                              const columnArr = event.data.columnNames
                                                                .split(',')                    // 分割
                                                                .map(col => col.trim());       // 去空格
                                                              const exists = columnArr.some(col => col === haveContentCode[0].code);
                                                              if (!exists) {
                                                                columnArr.push(haveContentCode[0].code); // 不存在则添加
                                                              }
                                                              data.push({
                                                                needId: uuid.v4(),
                                                                columnNames: columnArr.join(','),
                                                                code: codeNames,
                                                                uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                              })
                                                            } else {
                                                                data.push({
                                                                    needId: uuid.v4(),
                                                                    columnNames: event.data.columnNames,
                                                                    code: codeNames,
                                                                    uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
                                                                });
                                                            }
                                                            let dataws = data.map((res: any, index: number) => {
                                                                return { ...res, sort: index + 1,
                                                                    columnNames:processIndexFields(res.columnNames,fieldDataArr)
                                                                    }
                                                            })
                                                            console.log(dataws,'datawsdatawsdatawsdatawsdatawsdataws')
                                                            sessionStorage.setItem('keyCrud', JSON.stringify(dataws))
                                                            console.log(data, '增加索引字段')
                                                            doAction({
                                                                actionType: "setValue", componentId: "keyCrud", "args": {
                                                                    "value": {
                                                                        "items": dataws
                                                                    }
                                                                }
                                                            });
                                                        }, 10);
                                                    },
                                                }
                                            ]
                                        }
                                    }
                                },]
                        }
                    }
                ],
                "columns": [
                    {
                        // "name": "columnNames",
                        "name": "code",
                        "label": "索引名称",
                        "align": "center"
                    },
                    {
                        "name": "columnNames",
                        // "name": "name",
                        "label": "字段",
                        "align": "center"
                    },
                    {
                        "name": "uniqueFlag",
                        "label": "是否唯一",
                        "type": "mapping",
                        "map": {
                            "false": "<span class='label label-success'>否</span>",
                            "true": "<span class='label label-info'>是</span>"
                        },
                        "align": "center"
                    },
                    {
                        "type": "operation",
                        "label": "操作",
                        "align": "center",
                        "buttons": [
                            {
                                "label": "修改",
                                "type": "button",
                                "level": "link",
                                "disabledOn": "${systemIndex}",
                                "onEvent": {
                                    "click": {
                                        "actions": [
                                            {
                                                "actionType": "custom",
                                                "script": function (e: any, doAction: any, event: any) {
                                                    getZippedSnowflakeId().then((res: any) => {
                                                        codeName = res.data.data
                                                    })
                                                    addRule(
                                                        'isKeys',
                                                        (values, value) => {
                                                            let isHave = false
                                                            let isHaves = false
                                                            let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                                            dataArr.forEach((res: any) => {
                                                                if (res.needId) {
                                                                    if (res.needId != values.needId && res.code == values.code) {
                                                                        isHave = true
                                                                        // return toast.error('不允许存在相同的字段', {
                                                                        //     position: "top-center"
                                                                        // })
                                                                        // return alert('不允许存在相同的字段')
                                                                    }
                                                                } else {
                                                                    if (res.id != values.id && res.code == values.code) {
                                                                        isHave = true
                                                                        // return toast.error('不允许存在相同的字段', {
                                                                        //     position: "top-center"
                                                                        // })
                                                                        // return alert('不允许存在相同的字段')
                                                                    }
                                                                }
                                                            })
                                                            if (/^(?!_).*/.test(value) == false) {
                                                                isHaves = true
                                                            }
                                                            if (isHave) {
                                                                return {
                                                                    error: true,
                                                                    msg: '不允许存在相同的字段'
                                                                };
                                                            } else if (isHaves) {
                                                                return {
                                                                    error: true,
                                                                    msg: '索引名称不能以下划线开头'
                                                                };
                                                            } else {
                                                                return true;
                                                            }
                                                        }
                                                    );
                                                    addRule(
                                                        'isColumnNames',
                                                        (values, value) => {
                                                            console.log(values, '新增索引values')
                                                            console.log(value, '新增索引value')
                                                            let isHave = false
                                                            let isHaves = false
                                                            let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                            let deleteCode: any[] = [];
                                                            let deleteCode1: any[] = [];
                                                            const systemFieldTypes = [1, 6, 8, 9];
                                                            const fieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9]
                                                            deleteCode = dataArr
                                                              .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                                              .map(item => item.code);
                                                            deleteCode1 = dataArr
                                                              .filter(item => fieldTypes.includes(item.systemFieldType))
                                                              .map(item => item.code);
                                                            const blackListFields = [
                                                                'id',
                                                                'deleted',
                                                                'deletedAt',
                                                                ...deleteCode
                                                            ];
                                                            const blackList = new Set([
                                                                'id',
                                                                'deleted',
                                                                'deletedAt',
                                                                'deletedBy',
                                                                'updatedAt',
                                                                'createdAt',
                                                                'createdBy',
                                                                'updatedBy',
                                                                ...deleteCode1
                                                            ]);
                                                            if (
                                                              blackListFields.some(val => val === value) &&
                                                              values.uniqueFlag
                                                            ) {
                                                                isHave = true;
                                                            }
                                                            let yuan = values.columnNames.split(',')
                                                            let isTure = yuan.filter((res: any) => {
                                                                if (!blackList.has(res)) {
                                                                    return res
                                                                }
                                                            })
                                                            console.log(isTure, 'isTure')
                                                            if (isTure.length == 0 && values.uniqueFlag) {
                                                                isHaves = true
                                                            }
                                                            if (isHave) {
                                                                return {
                                                                    error: true,
                                                                    msg: '此字段不能单独设置为唯一索引'
                                                                };
                                                            } else if (isHaves) {
                                                                return {
                                                                    error: true,
                                                                    msg: '选择的字段不能全部为系统字段'
                                                                };
                                                            } else {
                                                                return true;
                                                            }
                                                        }
                                                    );
                                                }
                                            },
                                            {
                                                "actionType": "drawer",
                                                "drawer": {
                                                    "resizable": true,
                                                    "name": "uploadindexes",
                                                    "position": "right",
                                                    "width": 380,
                                                    "title": "修改索引设置",
                                                    "body": [
                                                        {
                                                            "type": "form",
                                                            "title": "表单",
                                                            "body": [
                                                                {
                                                                    "label": "索引名称",
                                                                    "type": "input-text",
                                                                    "name": "code",
                                                                    "validations": {
                                                                        "matchRegexp": "^[a-zA-Z_][A-Za-z0-9_]*$",
                                                                        "isKeys": true
                                                                    },
                                                                    "validationErrors": {
                                                                        "matchRegexp": "请填写规范字段名"
                                                                    },
                                                                },
                                                                {
                                                                    "type": "select",
                                                                    "label": "字段名",
                                                                    "name": "columnNames",
                                                                    // "name": "columnKeys",
                                                                    "required": "true",
                                                                    "multiple": true,
                                                                    "checkAll": false,
                                                                    "labelField": "code",
                                                                    // "labelField": "fieldTypeName",
                                                                    "valueField": "code",
                                                                    "validations": {
                                                                        "isColumnNames": true
                                                                    },
                                                                    // "valueField": "value",
                                                                    //   "source":"$myField"
                                                                    "source": "${ss:fieldKeyCruds}",
                                                                    "onEvent": {
                                                                        "change": {
                                                                            "actions": [
                                                                                {
                                                                                    "actionType": "custom",
                                                                                    script: function (_: any, doAction: any, event: any) {
                                                                                        console.log(event, 'eventeventevent')
                                                                                        let arr: any[] = []
                                                                                        refIndex = []
                                                                                        event.data.selectedItems.forEach((element: any) => {
                                                                                            arr.push(element.label)
                                                                                        });
                                                                                        refIndex = arr.join(',')
                                                                                        console.log(refIndex, 'refIndexrefIndexrefIndex')
                                                                                    }
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    "type": "switch",
                                                                    "label": "是否唯一",
                                                                    "name": "uniqueFlag",
                                                                }
                                                            ],
                                                        }
                                                    ],
                                                    "actions": [
                                                        {
                                                            "type": "button",
                                                            "label": "取消",
                                                            // "level": "info",
                                                            "close": "uploadindexes"
                                                        },
                                                        {
                                                            "type": "button",
                                                            "actionType": "confirm",
                                                            "label": "确认",
                                                            "primary": true,
                                                            "onEvent": {
                                                                "click": {
                                                                    "weight": 0,
                                                                    "debounce": {
                                                                        "wait": 100
                                                                    },
                                                                    "actions": [
                                                                        {
                                                                            "actionType": "custom",
                                                                            script: function (_: any, doAction: any, event: any) {
                                                                                console.log('修改索引设置')
                                                                                console.log(_, '____')
                                                                                console.log(doAction, 'doActiondoActiondoActiondoAction')
                                                                                console.log(event, 'eventeventeventevent')
                                                                                let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                                                if (!event.data.columnNames) return
                                                                                if (/^(?!_).*/.test(event.data.code) == false) {
                                                                                    return
                                                                                }
                                                                                let haveContentCode = []
                                                                                haveContentCode = fieldData.filter((res: any) => {
                                                                                  return res.systemFieldType == 9
                                                                                })
                                                                                let tenantCodeName = 'tenantCode'
                                                                                if (haveContentCode.length > 0) {
                                                                                  tenantCodeName = haveContentCode[0].code
                                                                                }
                                                                                let deleteCode: any[] = [];
                                                                                const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                                                                                deleteCode = fieldData
                                                                                  .filter(item => systemFieldTypes.includes(item.systemFieldType))
                                                                                  .map(item => item.code);
                                                                                const blackList = new Set([
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
                                                                                let yuan = event.data.columnNames.split(',')
                                                                                let isTures = yuan.filter((res: any) => {
                                                                                    if (!blackList.has(res)) {
                                                                                        return res
                                                                                    }
                                                                                })
                                                                                console.log(isTures, 'isTures')
                                                                                if (isTures.length == 0 && event.data.uniqueFlag) {
                                                                                    return
                                                                                }
                                                                                // if (!event.data.columnKeys) return
                                                                                let codeNames: any
                                                                                if ((event.data.code && event.data.code == "") || !event.data.code) {
                                                                                    console.log('进入')
                                                                                    codeNames = codeName
                                                                                } else {
                                                                                    codeNames = event.data.code
                                                                                }
                                                                                if (/^[a-zA-Z_][A-Za-z0-9_]*$/.test(codeNames) == false) { return }
                                                                                let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                                                                let deleteString = ''
                                                                                let fieldDatas = fieldData.filter((res: any) => res.systemFieldType == 6)
                                                                                deleteString = fieldDatas.length > 0 ? fieldDatas[0].code : ''
                                                                                let isHave = false
                                                                                dataArr.forEach((res: any) => {
                                                                                    if (res.needId) {
                                                                                        if (res.needId != event.data.needId && res.code == event.data.code) {
                                                                                            isHave = true
                                                                                        }
                                                                                    } else {
                                                                                        if (res.id != event.data.id && res.code == event.data.code) {
                                                                                            isHave = true
                                                                                        }
                                                                                    }
                                                                                })
                                                                                if (isHave) return
                                                                                let data1 = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                                                                let data = data1.map((element: any) => {
                                                                                    if (element.id == event.data.id) {
                                                                                        if (fieldDatas.length > 0 &&
                                                                                            event.data.uniqueFlag &&
                                                                                            (!event.data.columnNames.includes(','+deleteString) &&
                                                                                            !event.data.columnNames.includes(deleteString))) {
                                                                                          const columnArr = event.data.columnNames
                                                                                            .split(',')
                                                                                            .map(col => col.trim());
                                                                                          const exists = columnArr.some(col => col === deleteString);
                                                                                          if (!exists) {
                                                                                            columnArr.push(deleteString);
                                                                                          }
                                                                                            if(haveContentCode.length > 0
                                                                                                && event.data.uniqueFlag
                                                                                                && (!event.data.columnNames.includes(','+tenantCodeName)
                                                                                                    && !event.data.columnNames.includes(tenantCodeName))){
                                                                                              const tenantExists = columnArr.some(col => col === tenantCodeName);
                                                                                              if (!tenantExists) {
                                                                                                columnArr.push(tenantCodeName);
                                                                                              }
                                                                                                return {
                                                                                                    ...event.data,
                                                                                                    queryKey:event.data.queryKey,
                                                                                                    id: event.data.id,
                                                                                                    code: codeNames,
                                                                                                    uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                                                    appId: event.data.appId,
                                                                                                    columnNames: columnArr.join(','),
                                                                                                    createTime: event.data.createTime,
                                                                                                    env: event.data.env,
                                                                                                    latest: event.data.latest,
                                                                                                    tableKey: event.data.tableKey,
                                                                                                    ver: event.data.ver,
                                                                                                }
                                                                                            }else{
                                                                                                return {
                                                                                                    ...event.data,
                                                                                                    queryKey:event.data.queryKey,
                                                                                                    id: event.data.id,
                                                                                                    // columnKeys: event.data.columnNames + ',deletedAt',
                                                                                                    code: codeNames,
                                                                                                    uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                                                    appId: event.data.appId,
                                                                                                    columnNames: columnArr.join(','),
                                                                                                    // columnNames: refIndex ? refIndex : event.data.columnNames,
                                                                                                    createTime: event.data.createTime,
                                                                                                    env: event.data.env,
                                                                                                    latest: event.data.latest,
                                                                                                    tableKey: event.data.tableKey,
                                                                                                    ver: event.data.ver,
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            return {
                                                                                                ...event.data,
                                                                                                queryKey:event.data.queryKey,
                                                                                                id: event.data.id,
                                                                                                // columnKeys: event.data.columnNames,
                                                                                                code: codeNames,
                                                                                                uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                                                appId: event.data.appId,
                                                                                                columnNames: event.data.columnNames,
                                                                                                // columnNames: refIndex ? refIndex : event.data.columnNames,
                                                                                                createTime: event.data.createTime,
                                                                                                env: event.data.env,
                                                                                                latest: event.data.latest,
                                                                                                tableKey: event.data.tableKey,
                                                                                                ver: event.data.ver,
                                                                                            }
                                                                                        }
                                                                                    } else if (element.needId && (element.needId == event.data.needId)) {
                                                                                        if (fieldDatas.length > 0 &&
                                                                                            event.data.uniqueFlag &&
                                                                                            (!event.data.columnNames.includes(','+deleteString) &&
                                                                                                !event.data.columnNames.includes(deleteString))) {
                                                                                          const columnArr = event.data.columnNames
                                                                                            .split(',')                    // 分割
                                                                                            .map(col => col.trim());
                                                                                          const exists = columnArr.some(col => col === deleteString);
                                                                                          if (!exists) {
                                                                                            columnArr.push(deleteString); // 不存在则添加
                                                                                          }
                                                                                            if(haveContentCode.length > 0
                                                                                                && event.data.uniqueFlag
                                                                                                && (!event.data.columnNames.includes(','+tenantCodeName)
                                                                                                    && !event.data.columnNames.includes(tenantCodeName))){
                                                                                              const tenantExists = columnArr.some(col => col === tenantCodeName);
                                                                                              if (!tenantExists) {
                                                                                                columnArr.push(tenantCodeName); // 不存在则添加
                                                                                              }
                                                                                              return {
                                                                                                    ...event.data,
                                                                                                    needId: event.data.needId,
                                                                                                    queryKey:event.data.queryKey,
                                                                                                    // columnKeys: event.data.columnNames + ',deletedAt',
                                                                                                    code: codeNames,
                                                                                                    uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                                                    appId: event.data.appId,
                                                                                                    columnNames: columnArr.join(','),
                                                                                                    // columnNames: refIndex ? refIndex : event.data.columnNames,
                                                                                                    createTime: event.data.createTime,
                                                                                                    env: event.data.env,
                                                                                                    latest: event.data.latest,
                                                                                                    tableKey: event.data.tableKey,
                                                                                                    ver: event.data.ver,
                                                                                                }
                                                                                            }else{
                                                                                                return {
                                                                                                    ...event.data,
                                                                                                    needId: event.data.needId,
                                                                                                    queryKey:event.data.queryKey,
                                                                                                    // columnKeys: event.data.columnNames + ',deletedAt',
                                                                                                    code: codeNames,
                                                                                                    uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                                                    appId: event.data.appId,
                                                                                                    columnNames: columnArr.join(','),
                                                                                                    // columnNames: refIndex ? refIndex : event.data.columnNames,
                                                                                                    createTime: event.data.createTime,
                                                                                                    env: event.data.env,
                                                                                                    latest: event.data.latest,
                                                                                                    tableKey: event.data.tableKey,
                                                                                                    ver: event.data.ver,
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            return {
                                                                                                ...event.data,
                                                                                                needId: event.data.needId,
                                                                                                // columnKeys: event.data.columnNames,
                                                                                                queryKey:event.data.queryKey,
                                                                                                code: codeNames,
                                                                                                uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
                                                                                                appId: event.data.appId,
                                                                                                columnNames: event.data.columnNames,
                                                                                                // columnNames: refIndex ? refIndex : event.data.columnNames,
                                                                                                createTime: event.data.createTime,
                                                                                                env: event.data.env,
                                                                                                latest: event.data.latest,
                                                                                                tableKey: event.data.tableKey,
                                                                                                ver: event.data.ver,
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        return element
                                                                                    }
                                                                                })
                                                                                console.log(data, 'aaaaaaaa')
                                                                                let dataws = data.map((res: any, index: number) => {
                                                                                    return { ...res, sort: index + 1,
                                                                                        columnNames:processIndexFields(res.columnNames,fieldData)
                                                                                    }
                                                                                })
                                                                                sessionStorage.setItem('keyCrud', JSON.stringify(dataws))
                                                                                console.log(data, '修改索引设置')
                                                                                doAction({
                                                                                    actionType: "setValue", componentId: "keyCrud", "args": {
                                                                                        "value": {
                                                                                            "items": dataws
                                                                                        }
                                                                                    }
                                                                                });
                                                                            },
                                                                        },
                                                                    ]
                                                                }
                                                            },
                                                        }
                                                    ],
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "label": "删除",
                                "type": "button",
                                "level": "link",
                                "actionType": "dialog",
                                "disabledOn": "${systemIndex}",
                                "dialog": {
                                    "title": "删除",
                                    "body": {
                                        "type": "mapping",
                                        "value": "1",
                                        "map": {
                                            "1": "您确认要删除${code}?",
                                            // "1": "您确认要删除${name}?",
                                        },
                                    },
                                    "onEvent": {
                                        "confirm": {
                                            "actions": [
                                                {
                                                    "actionType": "custom",
                                                    script: function (_: any, doAction: any, event: any) {
                                                        console.log('删除索引设置')
                                                        console.log(_, '____')
                                                        console.log(doAction, 'doActiondoActiondoActiondoAction')
                                                        console.log(event, 'eventeventeventevent')
                                                        let data1 = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                                        let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                                        console.log(data1, '111111111')
                                                        // let data = _.props.data.items.map(res=>{
                                                        let data = data1.filter((res: any) => {
                                                            // return res.id != event.data.id
                                                            if (res.needId) {
                                                                return res.needId != event.data.needId
                                                            } else {
                                                                return res.id != event.data.id
                                                            }
                                                        })
                                                        let dataws = data.map((res: any, index: number) => {
                                                            return { ...res, sort: index + 1,
                                                                columnNames:processIndexFields(res.columnNames,fieldData)
                                                            }
                                                        })
                                                        sessionStorage.setItem('keyCrud', JSON.stringify(dataws))
                                                        console.log(data, 'datadatadata')
                                                        doAction({
                                                            actionType: "setValue", componentId: "keyCrud", "args": {
                                                                "value": {
                                                                    "items": dataws
                                                                }
                                                            }
                                                        });
                                                    },
                                                },
                                            ]
                                        }
                                    },
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
