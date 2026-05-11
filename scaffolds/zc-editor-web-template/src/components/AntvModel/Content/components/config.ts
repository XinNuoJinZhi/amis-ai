export const OperationMap = {
    equal: 'Condition.equal',
    not_equal: 'Condition.not_equal',
    less: 'Condition.less',
    less_or_equal: 'Condition.less_or_equal',
    greater: 'Condition.greater',
    greater_or_equal: 'Condition.greater_or_equal',
    between: 'Condition.between',
    not_between: 'Condition.not_between',
    is_empty: 'Condition.is_empty',
    is_not_empty: 'Condition.is_not_empty',
    like: 'Condition.like',
    not_like: 'Condition.not_like',
    starts_with: 'Condition.starts_with',
    ends_with: 'Condition.ends_with',
    select_equals: 'Condition.select_equals',
    select_not_equals: 'Condition.select_not_equals',
    select_any_in: 'Condition.select_any_in',
    select_not_any_in: 'Condition.select_not_any_in'
};
export function isObject(obj: any) {
    const typename = typeof obj;
    return (
        obj &&
        typename !== 'string' &&
        typename !== 'number' &&
        typename !== 'boolean' &&
        typename !== 'function' &&
        !Array.isArray(obj)
    );
}

// 判断是否是字符串类型
export function isString(obj: any) {
    return Object.prototype.toString.call(obj).slice(8, -1) === 'String';
}

export const defaultConfig = {
    valueTypes: ['value'],
    types: {
        text: {
            placeholder: 'Condition.placeholder',
            defaultOp: 'equal',
            operators: [
                'equal',
                'not_equal',
                'is_empty',
                'is_not_empty',
                'like',
                'not_like',
                'starts_with',
                'ends_with',
                "select_any_in",
                "select_not_any_in"
            ]
        },
        number: {
            defaultOp: 'equal',
            operators: [
                'equal',
                'not_equal',
                'less',
                'less_or_equal',
                'greater',
                'greater_or_equal',
                'between',
                'not_between',
                'is_empty',
                'is_not_empty',
                "select_any_in",
                "select_not_any_in"
            ]
        },
        date: {
            defaultOp: 'equal',
            operators: [
                'equal',
                'not_equal',
                'less',
                'less_or_equal',
                'greater',
                'greater_or_equal',
                'between',
                'not_between',
                'is_empty',
                'is_not_empty',
                "select_any_in",
                "select_not_any_in"
            ]
        },

        time: {
            defaultOp: 'equal',
            operators: [
                'equal',
                'not_equal',
                'less',
                'less_or_equal',
                'greater',
                'greater_or_equal',
                'between',
                'not_between',
                'is_empty',
                'is_not_empty',
                "select_any_in",
                "select_not_any_in"
            ]
        },

        datetime: {
            defaultOp: 'equal',
            operators: [
                'equal',
                'not_equal',
                'less',
                'less_or_equal',
                'greater',
                'greater_or_equal',
                'between',
                'not_between',
                'is_empty',
                'is_not_empty',
                "select_any_in",
                "select_not_any_in"
            ]
        },

        select: {
            defaultOp: 'select_equals',
            operators: [
                'select_equals',
                'select_not_equals',
                'select_any_in',
                'select_not_any_in',
            ],
            valueTypes: ['value']
        },

        boolean: {
            defaultOp: 'equal',
            operators: ['equal', 'not_equal']
        }
    }
};

export const typeConfig: any = {
    // equal 等于
    // not_equal 不等于
    // like 模糊匹配
    // not_like 不匹配
    // starts_with 匹配开头
    // ends_with 匹配结尾
    // is_empty 为空
    // is_not_empty 不为空
    'text':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'string':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'textarea':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'int':{
        "value": {
            "type": "input-number",
        },
        "operators": [
            "equal",
            "not_equal",
            "less",
            "less_or_equal",
            "greater",
            "greater_or_equal",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'number':{
        "value": {
            "type": "input-number",
        },
        "operators": [
            "equal",
            "not_equal",
            "less",
            "less_or_equal",
            "greater",
            "greater_or_equal",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'float':{
        "value": {
            "type": "input-number",
        },
        "operators": [
            "equal",
            "not_equal",
            "less",
            "less_or_equal",
            "greater",
            "greater_or_equal",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'rich-text':{

    },
    'money':{
        "value": {
            "type": "input-number",
        },
        "operators": [
            "equal",
            "not_equal",
            "less",
            "less_or_equal",
            "greater",
            "greater_or_equal",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'enum':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'boolean':{
        "value": {
            "type": "boolean",
        },
        "operators": [
            "equal",
            "not_equal",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'date':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'time':{
        "value": {
            "type": "input-time",
        },
        "operators": [
            "equal",
            "not_equal",
            "less",
            "less_or_equal",
            "greater",
            "greater_or_equal",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'datetime':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'date-range':{},
    'attachment':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'image':{
        "value": {
        },
        "operators": [
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'user':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'users':{},
    'department':{},
    'password':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'ciphertext':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
    'json':{},
    'formula':{
        "value": {
            "type": "input-text",
        },
        "operators": [
            "equal",
            "not_equal",
            "like",
            "not_like",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "select_any_in",
            "select_not_any_in"
        ]
    },
};
export function oldGetNoLoopRelation(allData,originRelationArr,cascaderOptions,e){
    let allDatas: any = [];
    allData.forEach(sjf => {
        if (
            sjf.type == 'relation' ||
            sjf.type == 'formula' ||
            sjf.isPrimaryKey ||
            !sjf.isNullable ||
            sjf.isCreateDate ||
            sjf.isCreateUser ||
            sjf.isUpdateDate ||
            sjf.isUpdateUser
        ) {
            if (
                !sjf.isCreateDate &&
                !sjf.isUpdateDate &&
                !sjf.isForeignKey
            ) {
                allDatas.push({...sjf, formula: sjf?.defaultValue});
            }
        }
    });
    let sjiwo: any = [];
    let haveSide: any = [];
    if (originRelationArr.length > 0) {
        originRelationArr.forEach(wop => {
            if (wop.inverseSide != null) {
                sjiwo.push(wop);
            }
            if (wop.inverseSide == null) {
                haveSide.push(wop);
            }
        });
    }
    let sjiwos: any = []; //不能用的数据
    let haveSjiwos: any = []; //不能用的数据
    let otherData: any = []; //可用的数据
    allDatas.forEach(swe => {
        sjiwo.forEach(sakd => {
            if (swe.key.split('.')[1] == sakd.inverseSide) {
                sjiwos.push(swe);
            }
        });
    });
    allDatas = getUniqueObjects(allDatas,sjiwos)
    cascaderOptions.forEach(resw => {
        if (resw.value == e[0]) {
            haveSide.forEach(ress => {
                resw.children.forEach(item => {
                    if (ress.target == item.form.queryKey) {
                        item.form.originRelation.forEach(sjkw => {
                            if (sjkw.inverseSide == ress.key) {
                                haveSjiwos.push(ress)
                            }else{
                                otherData.push(sjkw)
                            }
                        });
                    }
                });
            });
        }
    });
    let haveSideArr:any = [...haveSjiwos]
    // let haveSideArr:any = [...sjiwos,...haveSjiwos]
    let lastAllDatas:any = []
    if(haveSideArr.length>0){
        lastAllDatas = [
            ...allDatas.filter(wjs => !haveSideArr.some(wsw => wsw.key == wjs.relationKey && wjs.type == 'relation')),
            ...haveSideArr.filter(wsw => !allDatas.some(wjs => wjs.relationKey == wsw.key && wjs.type == 'relation')),
            ...allDatas.filter(wjs => otherData.some(wsw => wsw.key == wjs.key.split('.')[1] && wjs.type == 'relation')),
        ];
    }else{
        lastAllDatas = allDatas
    }
    return lastAllDatas
}
export function getNoLoopRelations(allData,originRelationArr,cascaderOptions,e){
    console.log(allData,'allDataallDataallDataallData')
    let needArr:any = [];
    let allDatas: any = [];
    allData.forEach(sjf => {
        if (
            // !sjf.isCreateDate &&
            // !sjf.isUpdateDate &&
            !sjf.isForeignKey
        ) {
            allDatas.push({...sjf, formula: sjf?.defaultValue});
        }
        // }
    });
    let tables:any = []
    let inverseSide:any = []
    let inverseSides:any = []
    cascaderOptions.forEach(resw => {
        if (resw.value == e[0]) {
            resw.children.forEach(item => {
                tables.push({...item.form})
            });
        }
    });
    originRelationArr.forEach(resw => {
        if(resw.inverseSide == null){
            tables.forEach(sjf => {
                if(resw.targetKey == sjf.value){
                    sjf.originRelation.forEach(res => {
                        if(res.inverseSide == resw.key){
                            inverseSide.push(res)
                        }
                    })
                }
            })
        }else{
            inverseSides.push(resw)
        }
    })
    inverseSide =  Array.from(new Set(inverseSide.map(item => item.key)))
        .map(key => inverseSide.find(item => item.key === key));
    console.log(allDatas,'allDatasallDatasallDatas')
    console.log(inverseSide,'inverseSideinverseSide')
    console.log(inverseSides,'inverseSidesinverseSides')
    let lastAllDatas = allDatas.filter(wjs => !inverseSide.some(wsw => wsw.inverseSide == wjs.relationKey && wsw.inverseSide+'.'+wsw.key == wjs.key))
    lastAllDatas = lastAllDatas.filter(wjs => !inverseSides.some(wsw => wsw.key == wjs.relationKey && wsw.key+'.'+wsw.inverseSide == wjs.key))
    console.log(lastAllDatas,'lastAllDatas')
    return lastAllDatas
}

export function queryRelations(models: any, targetKey: string) {
    let table: any = models.filter((e: any) => e.title == targetKey)[0];
    return table;
};

export const fieldKeyQueryRelationConfig = (relations: any, key: string) => {
    return relations.filter((e: any) => e.key == key)[0];
}
/** 处理正向关联表fields */
const disposePositiveRelationsFields = (tableData: any, relation: any) => {
    console.log(tableData, 'tableDatatableDatatableDatatableDatatableData')
    console.log(relation, 'relationrelationrelationrelationrelationrelation')
    return tableData.fields
        .filter((e: any) => e.type != "relation")
        .map((field: any) => {
            let {name, key, ..._field} = field;
            return {
                ..._field,
                // name: `${relation.name}.${name}`,
                label: `【${relation.name}】${name}`,
                title: `【${relation.name}】${name}`,
                relationKey:relation.key,
                relationMode:relation.relationMode,
                // key: `${name}`,
                name: `${name}`,
                key: `${relation.key}.${key}`,
            };
        })
};

export const getNoLoopRelation = (models: any, modelId: string, isDisposePositiveRelationsFields: boolean = true, isReplaceExpress: boolean = true) => {
    models = models.map(res => {
        return {...res, ...res.form, relations: res.form.originRelation}
    })
    let sourceData = models.filter((e: any) => e.id == modelId)[0];
    console.log(sourceData, 'sourceData');
    // 本表处理
    let _sourceFields = sourceData.fields
        // 过滤掉关系字段
        .filter((e: any) => e.type != 'relation' && !e.isDeleteDate && !e.isDeleteFlag && !e.isTenantCode)
        .map((field: any) => {

            return {
                data: {
                    ...field,
                    isDisabledEnabled: !field.isNullable
                }
            };
        });
    // 关系字段处理
    let _relationsFields = sourceData.fields
        .filter((e: any) => e.type == 'relation')
        .map((field: any) => {
            return {
                data: {
                    ...field,
                    isDisabledEnabled: false
                },
                enabled: true,
                relation: fieldKeyQueryRelationConfig(sourceData.relations, field.key)
            };
        });
    // x : 1关系字段生成
    const positiveRelationsFields: any = []
    if (isDisposePositiveRelationsFields) {
        _relationsFields
            .filter((e: any) => e.relation.relationMode.split(':')[1] == '1')
            .map((field: any) => {
                // 外键在对方身上
                disposePositiveRelationsFields(queryRelations(models, field.relation.targetKey), field.relation).forEach(
                    (item: any) => {
                        positiveRelationsFields.push({
                            data: {
                                ...item,
                                foreignKey: field.relation.foreignKey,
                                isDisabledEnabled: false
                            },
                            enabled: false
                        })
                    }
                );
            });
    }
    let _newOptionData = [...[..._sourceFields, ..._relationsFields]
        .sort((a, b) => (a.data?.sort || 0) - (b.data?.sort || 0)),
        ...positiveRelationsFields]
        .filter((f: any) =>
            !f.data.isDeleteDate
            && !f.data.isDeleteFlag
            && !f.data.isDeleteUser
            && !f.data.isTenantCode
        );
    // 列表展示
    const schemaFields = _newOptionData.map((item: any) => {
        return item.data.type == 'relation' ? {
            ...item.data,
            relation: item.relation
        } : {
            ...item.data
        };
    }).filter((e: any) => !e.isForeignKey);
    return schemaFields;
};

export const groupByRelationKeyWithPK = (data)=> {
    return data.reduce((acc, item) => {
        const key = item.relationKey;
        if (item.isPrimaryKey) {
            acc[key] = item;
        }
        return acc;
    }, {});
}

import isPlainObject from 'lodash/isPlainObject';
export const typeStr: { [key: string]: any } = {
    'string': '文本',
    'number': '数字',
    'boolean': '布尔',
    'object': '对象',
    'array': '数组',
    'date': '日期'
};
export function cleanUndefined(obj: any) {
    if (!isObject(obj)) {
        return obj;
    }

    Object.keys(obj).forEach((key: string) => {
        const prop = obj[key];
        if (typeof prop === 'undefined') {
            delete obj[key];
        }
    });

    return obj;
}
// 将 json 去掉每层的 $$id，
// 同时可以选择性的去掉一些隐藏属性。
export function JSONPipeOut(
  obj: any,
  filterHiddenProps?: boolean | ((key: string, prop: any) => boolean)
) {
    if (Array.isArray(obj)) {
        let flag = false; // 有必要时才去改变对象的引用
        const ret: any = obj.map((item: any) => {
            const newItem = JSONPipeOut(item, filterHiddenProps);

            if (newItem !== item) {
                flag = true;
            }

            return newItem;
        });
        return flag ? ret : obj;
    }
    if (!isPlainObject(obj)) {
        return obj;
    }

    let flag = false;
    let toUpdate: any = {};

    if (obj.$$id) {
        flag = true;
        toUpdate.$$id = undefined;
    }

    Object.keys(obj).forEach(key => {
        let prop = obj[key];

        if (
          typeof filterHiddenProps === 'function'
            ? filterHiddenProps(key, prop)
            : filterHiddenProps !== false && key.substring(0, 2) === '__'
        ) {
            toUpdate[key] = undefined;
            flag = true;
            return;
        }

        let patched = JSONPipeOut(prop, filterHiddenProps);
        if (patched !== prop) {
            flag = true;
            toUpdate[key] = patched;
        }
    });

    flag &&
    (obj = cleanUndefined({
        ...obj,
        ...toUpdate
    }));

    return obj;
}

export const staticJsonChange = (val: any, disabledTypes = ['array', 'object', 'undefined']) => {
    console.log(val,'val')
    console.log(disabledTypes,'disabledTypes')
    let obj: any = {};
    let field: any = [];
    // 判断数组
    if (Array.isArray(val) && val.length && Object.keys(val[0]).length) {
        obj = val[0];
    }
    //判断对象
    if (typeof val === 'object' && Object.prototype.toString.call(val) === '[object Object]' && Object.keys(val).length) {
        obj = val;
    }
    if (Object.keys(obj).length) {
        obj = JSONPipeOut(obj);
        let keys = Object.keys(obj);
        field = keys.map(key => {
            let k: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'function' | 'date' | 'array' | 'object'
              = typeof obj[key];
            if (k == 'object' && Array.isArray(obj[key])) {
                k = 'array';
            }
            // 判断是string并且符合时间戳格式化 例如：2022-01-01 00:00:00
            if (k === 'string') {
                const dateRegex = /^(\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2})(\s\d{2}:\d{2}:\d{2})?$/;
                if (dateRegex.test(obj[key])) {
                    k = 'date';
                }
            }
            if(obj[key] === null){
              k = 'string'
            }
            return {
                label: key,
                value: key,
                path: typeStr[k],
                tag: typeStr[k],
                key: k,
                // value: typeStr[k],
                // disabled: disabledTypes.includes(k)
                disabled: false,
                isMember: false
            };
        });
    }
    return field;
};

