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
    return tableData.fields
        .filter((e: any) => e.type != "relation")
        .map((field: any) => {
            let {name, key, ..._field} = field;
            return {
                ..._field,
                // name: `${relation.name}.${name}`,
                label: `【${relation.name}】${name}`,
                key: `${name}`,
                name: `${name}`
                // key: `${relation.key}.${key}`,
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
export function getNoLoopRelations(allData,originRelationArr,cascaderOptions,e){
    let allDatas: any = [];
    allData.forEach(sjf => {
        if(sjf.type == 'serial-number'){
            allDatas.push({...sjf, formula: sjf?.defaultValue});
        }else{
            if (
                !sjf.isCreateDate &&
                !sjf.isUpdateDate &&
                !sjf.isForeignKey
            ) {
                allDatas.push({...sjf, formula: sjf?.defaultValue});
            }
        }
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
    console.log(tables,'tables')
    originRelationArr.forEach(resw => {
        if(resw.inverseSide == null){
            tables.forEach(sjf => {
                if(resw.targetKey == sjf.code){
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
    let lastAllDatas = allDatas.filter(wjs => !inverseSide.some(wsw => wsw.inverseSide == wjs.relationKey && wsw.key == wjs.key))
    lastAllDatas = lastAllDatas.filter(wjs => !inverseSides.some(wsw => wsw.key == wjs.relationKey && wsw.inverseSide == wjs.key))
    console.log(lastAllDatas,'lastAllDatas')
    return lastAllDatas
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
        if (value === undefined || value === '') {
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
                [key]: value === undefined || value === null ? null : value
            }
        };
    }

    // 递归处理 children
    if (newRule.children) {
        newRule.children = newRule.children.map(reverseTransformSelectAnyIn);
    }

    return newRule;
}
export const groupByRelationKeyWithPK = (data)=> {
    return data.reduce((acc, item) => {
        const key = item.relationKey;
        if (item.isPrimaryKey) {
            acc[key] = item;
        }
        return acc;
    }, {});
}
