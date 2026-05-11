export interface ResItem {
    id: string,
    name: string,
    nameField: string,
    parentField: string,
    x: number,
    y: number,
    fields: Field[],
    relations: Relation[],
    sort: number,
    type: number,
    key: string
}

export interface Field {
    "id": string,
    "key": string,
    "name": string,
    "type": string,
    "defaultValueMode": string,
    "isNullable": boolean,
    "isGenerated": boolean,
    "isForeignKey": boolean,
    "sort": number,
    "isPrimaryKey": boolean,
    "isCreateUser": boolean,
    "isUpdateUser": boolean,
    "isCreateDate": boolean,
    "isUpdateDate": boolean,
    "isDeleteDate": boolean,
    "isDeleteUser": boolean,
    "isDeleteFlag": boolean,
    "isTenantCode": boolean,
    "validations": {},
    "validationErrors": {},
    "dbType": string,
    "primaryKeyMode": string
}

export interface Relation {
    "id": string,
    "key": string,
    "name": string,
    "relationMode": "n:1",
    "description": null,
    "target": string,
    "targetKey": string,
    "targetName": string,
    "fieldId": null,
    "foreignKey": string,
    "isNullable": boolean,
    "cascadeRemove": null,
    "inverseSide": null,
    "sort": number,
    "withCustomProps": null,
    "displayType": null,
    "displayColumns": null,
    "displayTpl": null,
    "autoFills": null,
    "inputType": null,
    "inputColumns": null,
    "inputCreateable": null,
    "inputEditable": null,
    "inputRemovable": null,
    "quickEdit": null,
    "quickEditSettings": null
}


