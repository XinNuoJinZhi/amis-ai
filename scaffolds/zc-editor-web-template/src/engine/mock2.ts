export const model2 = [
  {
    "id": "bGZ0jyqw75",
    "key": "oneoneparent",
    "name": "一对一父级",
    "fields": [
      {
        "type": "int",
        "id": "649144d0-e061-4000-a8c0-c88e2dc39000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "f8eaee78-3801-4000-a028-ee8db2ced000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "9e5478ad-2c38-4000-aac1-bb297af42000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "e11af08b-1ec2-4000-a314-bed19f314000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "datetime",
        "id": "202c1359-1b54-4000-a182-37b43ab95000",
        "key": "deletedAt",
        "name": "删除时间",
        "precision": 10,
        "isNullable": true,
        "isDeleteDate": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "datetime",
        "id": "3648eeaf-cdf5-4000-a0de-e5ce280e7000",
        "key": "createdAt",
        "name": "创建时间",
        "precision": 10,
        "isNullable": false,
        "isCreateDate": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "datetime",
        "id": "fe9e3ab0-10c5-4000-a933-92cee6f55000",
        "key": "updatedAt",
        "name": "更新时间",
        "precision": 10,
        "isNullable": false,
        "isUpdateDate": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "user",
        "id": "4cfb9376-ac81-4000-a04f-b88b0f378000",
        "key": "createdBy",
        "name": "创建人",
        "precision": 10,
        "isNullable": false,
        "isCreateUser": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "user",
        "id": "6d440843-e00b-4000-adb7-cce178956000",
        "key": "updatedBy",
        "name": "更新人",
        "precision": 10,
        "isNullable": false,
        "isUpdateUser": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "user",
        "id": "f8283d11-b783-4000-a8f4-a45d8df40000",
        "key": "deletedBy",
        "name": "删除人",
        "precision": 10,
        "isNullable": true,
        "isDeleteUser": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "d19b888a-91e6-4000-a975-66cf1cd1b000",
        "key": "oneonechildId_field_name",
        "name": "oneonechildId_field_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "4888f314-176f-4000-adaa-7de335ce1000",
        "key": "oneonechild_key",
        "name": "oneonechild_key",
        "relationId": "d63b627d-abf0-4000-a4b8-47f7ec69a000",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "1:1",
        "id": "d63b627d-abf0-4000-a4b8-47f7ec69a000",
        "key": "oneonechild_key",
        "target": "l6Eg75PEjP",
        "targetKey": "oneonechild",
        "targetName": "oneonechild",
        "fieldId": "d19b888a-91e6-4000-a975-66cf1cd1b000",
        "isNullable": true,
        "cascadeRemove": true,
        "foreignKey": "oneonechildId_field_name",
        "fieldItemType": "1:1",
        "name": "oneonechild_key",
        "description": "11",
        "inputType": "embed",
        "quickEdit": true,
        "quickEditSettings": {"inputType": "select"}
      }
    ],
    "useSoftDelete": true,
    "description": "一对一父级",
    "titleTpl": "${code}_${name}",
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2137.1873,
      "y": 3217.2344
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "name"
  },
  {
    "id": "l6Eg75PEjP",
    "key": "oneonechild",
    "name": "一对一子级",
    "fields": [
      {
        "type": "int",
        "id": "ef6f4485-110d-4000-a580-b6477b945000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "f4e32afc-5eed-4000-a30c-fe4b3e044000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "51a29d6c-9a74-4000-ac30-b0fd3de53000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "65cd1010-be16-4000-a45f-555b45b2a000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "description": "一对一子级",
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2442.7656,
      "y": 3241.4688
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "name"
  },
  {
    "id": "KVZOrX0EBd",
    "key": "oneoneparent2",
    "name": "oneoneparent2",
    "fields": [
      {
        "type": "int",
        "id": "9d77bb12-71b6-4000-a08a-e05707d83000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "81ec363d-0ac9-4000-a9da-b76337e4c000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "49ed5f00-8b80-4000-a0d0-f9185d47d000",
        "key": "oneonechild2",
        "name": "oneonechild2",
        "relationId": "fcbbc041-49a4-4000-a513-3b9fc3691000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "1:1",
        "id": "fcbbc041-49a4-4000-a513-3b9fc3691000",
        "key": "oneonechild2",
        "target": "VDZBrQeZNW",
        "targetKey": "oneonechild2",
        "targetName": "oneonechild2",
        "isNullable": false,
        "inverseSide": "oneoneparent2",
        "cascadeRemove": true,
        "joinColumnAtTarget": true,
        "foreignKey": "oneonechild2Id",
        "fieldItemType": "1:1",
        "name": "oneonechild2",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2161.9688,
      "y": 3563.4844
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "name"
  },
  {
    "id": "VDZBrQeZNW",
    "key": "oneonechild2",
    "name": "oneonechild2",
    "fields": [
      {
        "type": "int",
        "id": "2d078263-c073-4000-a8a3-5ade04244000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "012c04b2-2656-4000-a95b-63fa4c118000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "16156924-8866-4000-a21f-fa98ae876000",
        "key": "oneoneparent2Id",
        "name": "oneoneparent2Id",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "2d6625d0-5dcf-4000-afbf-f3b292c97000",
        "key": "oneoneparent2",
        "name": "oneoneparent2",
        "relationId": "aed83155-a541-4000-ab90-91aeae085000",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "1:1",
        "id": "aed83155-a541-4000-ab90-91aeae085000",
        "key": "oneoneparent2",
        "target": "KVZOrX0EBd",
        "targetKey": "oneoneparent2",
        "targetName": "oneoneparent2",
        "fieldId": "16156924-8866-4000-a21f-fa98ae876000",
        "isNullable": true,
        "cascadeRemove": true,
        "foreignKey": "oneoneparent2Id",
        "fieldItemType": "1:1",
        "name": "oneoneparent2",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2441.9375,
      "y": 3565.4062
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "name"
  },
  {
    "id": "VbELrQmodr",
    "key": "multioneparent",
    "name": "multioneparent",
    "fields": [
      {
        "type": "int",
        "id": "0a88babd-dbaa-4000-a13d-dd3a4adff000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "351896d2-fcba-4000-a4ad-6e8cc784d000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "79c09e30-eaad-4000-a653-64367d044000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "f1d6157c-8b91-4000-a55b-7785bcca6000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "baac9064-2f77-4000-ad07-37a0df9f9000",
        "key": "multeonechildId_field_name",
        "name": "multeonechildId_field_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "930bef15-30df-4000-a162-94f8f9325000",
        "key": "multeonechild_key",
        "name": "multeonechild_key",
        "relationId": "a7867860-5b28-4000-ae15-f46929fd8000",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:1",
        "id": "a7867860-5b28-4000-ae15-f46929fd8000",
        "key": "multeonechild_key",
        "target": "vxo9r3gwP1",
        "targetKey": "multeonechild",
        "targetName": "multeonechild",
        "fieldId": "baac9064-2f77-4000-ad07-37a0df9f9000",
        "isNullable": true,
        "foreignKey": "multeonechildId_field_name",
        "fieldItemType": "n:1",
        "name": "multeonechild",
        "displayType": "embed",
        "inputType": "select",
        "inputCreateable": true,
        "inputEditable": true,
        "inputRemovable": false,
        "quickEdit": true,
        "displayColumns": ["code","name"],
        "quickEditSettings": {
          "inputCreateable": true,
          "inputEditable": true,
          "inputRemovable": true,
          "inputType": "radios",
          "inputColumns": ["code","name","desc"],
          "autoFills": [
            {
              "to": "code",
              "from": "code"
            },
            {
              "to": "name",
              "from": "name"
            }
          ],
        },
        "inputColumns": ["code","name"]
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1546.4218,
      "y": 3202.5156
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "vxo9r3gwP1",
    "key": "multeonechild",
    "name": "multeonechild",
    "fields": [
      {
        "type": "int",
        "id": "3ae2ae8a-a2dd-4000-a121-29f2c6df2000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "89e83c27-0742-4000-ab9c-d0bf99ab0000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "f3974643-c787-4000-afd4-0d2fbf9fd000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "f24eb07c-1b3a-4000-aa5f-f7ef8a589000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1851.4061,
      "y": 3220.4375
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "name"
  },
  {
    "id": "BzwQAeWwM2",
    "key": "onemulitparent",
    "name": "onemulitparent",
    "fields": [
      {
        "type": "int",
        "id": "8f9afce0-750b-4000-af43-2dd3e46a5000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "85004cfc-583d-4000-af94-548eaacc5000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "edbbbaae-5fff-4000-adbf-eaff20dbe000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "e3f74147-e662-4000-a1f4-115f793bf000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "c61eae41-fbce-4000-a010-f251faf41000",
        "key": "onemultichilds_key",
        "name": "onemultichilds_key",
        "relationId": "98104005-9bb7-4000-aef3-7a5d2ebca000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "1:n",
        "id": "98104005-9bb7-4000-aef3-7a5d2ebca000",
        "key": "onemultichilds_key",
        "target": "0WZJr1rZ1G",
        "targetKey": "onemultichild",
        "targetName": "onemultichild",
        "isNullable": false,
        "inverseSide": "onemulitparent_key",
        "cascadeRemove": true,
        "foreignKey": "",
        "fieldItemType": "1:n",
        "name": "onemultichild",
        "displayType": "embed",
        "inputType": "list-select",
        "inputCreateable": true,
        "inputEditable": true,
        "inputRemovable": false,
        "quickEdit": true,
        "displayColumns": ["code","name"],
        "quickEditSettings": {
          "inputCreateable": true,
          "inputEditable": true,
          "inputRemovable": true,
          "inputType": "checkboxes",
          "inputColumns": ["code","name","desc"],
          "autoFills": [
            {
              "to": "code",
              "from": "code"
            },
            {
              "to": "name",
              "from": "name"
            }
          ],
        },
        "inputColumns": ["code","name"]
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1548.9688,
      "y": 3539.5156
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "0WZJr1rZ1G",
    "key": "onemultichild",
    "name": "onemultichild",
    "fields": [
      {
        "type": "int",
        "id": "636a6a0e-9017-4000-adcf-a656a44fd000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "44b3680e-d67f-4000-a58d-383aacb19000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "a5b8a529-0ddb-4000-af86-dcdf6653f000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "52aa5a91-285c-4000-a58a-0f114dffb000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "5af9871a-4061-4000-a5d3-e027a509a000",
        "key": "onemulitparentId_field_name",
        "name": "onemulitparentId_field_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "1d1e8cb5-a0fc-4000-a9fd-d632a7a2a000",
        "key": "onemulitparent_key",
        "name": "onemulitparent_key",
        "relationId": "aa7e22ea-a854-4000-adb0-f3843a4d6000",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:1",
        "id": "aa7e22ea-a854-4000-adb0-f3843a4d6000",
        "key": "onemulitparent_key",
        "target": "BzwQAeWwM2",
        "targetKey": "onemulitparent",
        "targetName": "onemulitparent",
        "fieldId": "5af9871a-4061-4000-a5d3-e027a509a000",
        "isNullable": true,
        "foreignKey": "onemulitparentId_field_name",
        "fieldItemType": "n:1",
        "name": "onemulitparent",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1855.1874,
      "y": 3532.5312
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "name"
  },
  {
    "id": "4VojnaVozG",
    "key": "multimultiparent",
    "name": "multimultiparent",
    "fields": [
      {
        "type": "int",
        "id": "f9323720-afc1-4000-a3b0-a26bb11a2000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "4731159c-8c1b-4000-a8c3-260c789ec000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "c6ee4492-3861-4000-a5f3-fcd7bd32d000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "15514b6c-9945-4000-af3a-e69f30d2e000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "948e6fba-dd47-4000-a0ec-6c52b89bc000",
        "key": "multimultichilds_key",
        "name": "multimultichilds_key",
        "relationId": "e4deba5c-2ef4-4000-ad3e-52f3e31db000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:n",
        "id": "e4deba5c-2ef4-4000-ad3e-52f3e31db000",
        "key": "multimultichilds_key",
        "target": "YVw6r4Rwva",
        "targetKey": "multimultichild",
        "targetName": "multimultichild",
        "isNullable": false,
        "joinTable": {
          "key": "multimultichild_multimultiparent_junction",
          "joinColumn": {
            "key": "multimultiparentId_self_field_name"
          },
          "inverseJoinColumn": {
            "key": "multimultichildId_target_field_name"
          }
        },
        "foreignKey": "",
        "fieldItemType": "n:n",
        "name": "multimultichild",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1541.6875,
      "y": 3868.25
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "YVw6r4Rwva",
    "key": "multimultichild",
    "name": "multimultichild",
    "fields": [
      {
        "type": "int",
        "id": "e23bb6cf-10f7-4000-a932-f69132d41000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "af3ed23a-40d4-4000-ad3c-786ac20fd000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "2a471f50-8be8-4000-a815-17dedce6a000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "711eeb66-9905-4000-a0e2-9493d2496000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1855.9843,
      "y": 3873.0625
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "Yrw1XQzoK9",
    "key": "multimultiparent2",
    "name": "multimultiparent2",
    "fields": [
      {
        "type": "int",
        "id": "23cc3f25-29f7-4000-a22c-a18366a5d000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "4ad0ba96-340c-4000-a27b-ec929d7c7000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "687d0fc1-ac3b-4000-a3e5-26b3c721f000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "49262da5-7c92-4000-a62e-1359da8a7000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "b265047f-6417-4000-a7fd-e9882f26b000",
        "key": "multimultichild2s",
        "name": "multimultichild2s",
        "relationId": "bc587665-b2ba-4000-a18f-3f72d41ab000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:n",
        "id": "bc587665-b2ba-4000-a18f-3f72d41ab000",
        "key": "multimultichild2s",
        "target": "nywldybwgX",
        "targetKey": "multimultichild2",
        "targetName": "multimultichild2",
        "isNullable": false,
        "inverseSide": "multimultiparent2s_key",
        "joinColumnAtTarget": true,
        "foreignKey": "",
        "fieldItemType": "n:n",
        "name": "multimultichild2",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1532.9688,
      "y": 4187.5156
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "nywldybwgX",
    "key": "multimultichild2",
    "name": "multimultichild2",
    "fields": [
      {
        "type": "int",
        "id": "8f863263-40b7-4000-a38c-33a54bd4e000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "407bb956-3862-4000-a51a-053012111000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "d13e0948-bf1f-4000-a8bc-efd931230000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "5b985d04-35ae-4000-a2c8-0043d9363000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "adcdb640-d6db-4000-aa0b-8bccab4cc000",
        "key": "multimultiparent2s_key",
        "name": "multimultiparent2s_key",
        "relationId": "3c3508ce-5a7e-4000-a193-95e99dacf000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:n",
        "id": "3c3508ce-5a7e-4000-a193-95e99dacf000",
        "key": "multimultiparent2s_key",
        "target": "Yrw1XQzoK9",
        "targetKey": "multimultiparent2",
        "targetName": "multimultiparent2",
        "isNullable": false,
        "inverseSide": "multimultichild2s",
        "joinTable": {
          "key": "multimultichild2_multimultiparent2_junction",
          "joinColumn": {
            "key": "multimultichild2Id_self_field_name"
          },
          "inverseJoinColumn": {
            "key": "multimultiparent2Id_target_field_name"
          }
        },
        "foreignKey": "",
        "fieldItemType": "n:n",
        "name": "multimultiparent2",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 1848.0311,
      "y": 4190.422
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "Qyw7rQAogG",
    "key": "multimultiparent3",
    "name": "multimultiparent3",
    "fields": [
      {
        "type": "int",
        "id": "9e04fa66-7404-4000-ad75-6a6cf4329000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "d86cafc0-5fe0-4000-a4d2-f7dd89fec000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "ec967f60-5012-4000-a9dd-6c0333a14000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "eeaa92d7-c386-4000-a6bb-a9839829a000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "30f6110f-4016-4000-ad00-26c5ce892000",
        "key": "multimultichild3s_key",
        "name": "multimultichild3s_key",
        "relationId": "c8471515-e7f0-4000-af11-54a3ca32f000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "a6baee75-3dd0-4000-a749-b155ba784000",
        "key": "multimultichild3_multimultiparent3_junctions",
        "name": "multimultichild3_multimultiparent3_junctions",
        "relationId": "270a25e3-3cfc-4000-ab2e-6de163a89000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:n",
        "id": "c8471515-e7f0-4000-af11-54a3ca32f000",
        "key": "multimultichild3s_key",
        "target": "9QEWYvQop8",
        "targetKey": "multimultichild3",
        "targetName": "multimultichild3",
        "isNullable": false,
        "withCustomProps": true,
        "joinTable": {
          "key": "multimultichild3_multimultiparent3_junction",
          "joinColumn": {
            "key": "multimultiparent3Id_self_field_name"
          },
          "inverseJoinColumn": {
            "key": "multimultichild3Id_target_field_name"
          }
        },
        "foreignKey": "",
        "fieldItemType": "n:n",
        "name": "multimultichild3",
      },
      {
        "relationMode": "1:n",
        "id": "270a25e3-3cfc-4000-ab2e-6de163a89000",
        "key": "multimultichild3_multimultiparent3_junctions",
        "target": "7b34fccd-858b-4000-a38b-6ccb7f3b8000",
        "targetKey": "multimultichild3_multimultiparent3_junction",
        "targetName": "multimultichild3_multimultiparent3_junction",
        "isNullable": false,
        "inverseSide": "multimultiparent3",
        "fieldItemType": "1:n",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2159.2031,
      "y": 3875.1406
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "9QEWYvQop8",
    "key": "multimultichild3",
    "name": "multimultichild3",
    "fields": [
      {
        "type": "int",
        "id": "89d32e7f-9e4d-4000-aad3-caaf908a8000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "84b56f72-1708-4000-aa9d-151e81983000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "8d399266-236e-4000-a0a7-f7ae06564000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "e397f61c-13ca-4000-a3dd-7441da68a000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2790.3906,
      "y": 3767.7344
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "MdZGrY8E58",
    "key": "multimultichild3_multimultiparent3_junction",
    "name": "multimultichild3_multimultiparent3_junction",
    "fields": [
      {
        "type": "int",
        "id": "5f2f900e-d460-4000-adc9-f23a78cd3000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "0eca548c-ebc1-4000-ae22-a846c71d4000",
        "key": "multimultiparent3Id_self_field_name",
        "name": "multimultiparent3Id_self_field_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "ec49cbb5-5332-4000-a7df-e2c6ea969000",
        "key": "multimultiparent3",
        "name": "multimultiparent3",
        "relationId": "ce0321bd-d7aa-4000-a8e3-685185131000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "677223f9-c88e-4000-ac1e-1d1967a8d000",
        "key": "multimultichild3Id_target_field_name",
        "name": "multimultichild3Id_target_field_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "ba018924-0767-4000-ac95-b98ede882000",
        "key": "multimultichild3",
        "name": "multimultichild3",
        "relationId": "39f90f85-2a99-4000-a1fb-216838c21000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:1",
        "id": "ce0321bd-d7aa-4000-a8e3-685185131000",
        "key": "multimultiparent3",
        "target": "Qyw7rQAogG",
        "targetKey": "multimultiparent3",
        "targetName": "multimultiparent3",
        "fieldId": "0eca548c-ebc1-4000-ae22-a846c71d4000",
        "isNullable": false,
        "foreignKey": "multimultiparent3Id_self_field_name",
        "fieldItemType": "n:1",
      },
      {
        "relationMode": "n:1",
        "id": "39f90f85-2a99-4000-a1fb-216838c21000",
        "key": "multimultichild3",
        "target": "9QEWYvQop8",
        "targetKey": "multimultichild3",
        "targetName": "multimultichild3",
        "fieldId": "677223f9-c88e-4000-ac1e-1d1967a8d000",
        "isNullable": false,
        "foreignKey": "multimultichild3Id_target_field_name",
        "fieldItemType": "n:1",
      }
    ],
    "isRelationShip": true,
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2517.1094,
      "y": 3933.4844
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "id"
  },
  {
    "id": "lDZnA4xEX7",
    "key": "multimultiparent4",
    "name": "multimultiparent4",
    "fields": [
      {
        "type": "int",
        "id": "f629b9a6-7c22-4000-a98b-168399d8a000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "371634ec-dc86-4000-aee7-fe110ebf0000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "8b87d9c4-ec4f-4000-a7d4-dfe569254000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "d3f87eff-565d-4000-ac71-e690ba7b5000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "fd89f158-6f72-4000-aa3b-9972e26cd000",
        "key": "multimultichild4s",
        "name": "multimultichild4s",
        "relationId": "2f7d7f5d-de78-4000-aec3-1fdb5d6e3000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:n",
        "id": "2f7d7f5d-de78-4000-aec3-1fdb5d6e3000",
        "key": "multimultichild4s",
        "target": "5b28abe8-7ca9-4000-acfa-e3eacba6b000",
        "targetKey": "multimultichild4",
        "targetName": "multimultichild4",
        "isNullable": false,
        "inverseSide": "multimultiparent4s_key",
        "joinColumnAtTarget": true,
        "foreignKey": "",
        "fieldItemType": "n:n",
        "name": "multimultichild4",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2159.2031,
      "y": 4258.1406
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "R7EXm3VZNV",
    "key": "multimultichild4",
    "name": "multimultichild4",
    "fields": [
      {
        "type": "int",
        "id": "14dd3446-1ecf-4000-a504-175a47f9c000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "01a74960-16a3-4000-a297-7df05bcfc000",
        "key": "code",
        "name": "code",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "44947def-4821-4000-a984-407f0e76e000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "813e1218-5cd2-4000-a188-a09265ad1000",
        "key": "desc",
        "name": "desc",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "56d9e80b-b80e-4000-af50-3dd483639000",
        "key": "multimultiparent4s_key",
        "name": "multimultiparent4s_key",
        "relationId": "30cdb80a-3f05-4000-a3c8-7e8b44197000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "c2daf59c-f9f6-4000-adab-85481d21a000",
        "key": "multimultichild4_multimultiparent4_junctions",
        "name": "multimultichild4_multimultiparent4_junctions",
        "relationId": "37d99469-8bde-4000-ab7f-9ce76ba68000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:n",
        "id": "30cdb80a-3f05-4000-a3c8-7e8b44197000",
        "key": "multimultiparent4s_key",
        "target": "9b79dd6b-e694-4000-ae6e-676890fc8000",
        "targetKey": "multimultiparent4",
        "targetName": "multimultiparent4",
        "isNullable": false,
        "inverseSide": "multimultichild4s",
        "withCustomProps": true,
        "joinTable": {
          "key": "multimultichild4_multimultiparent4_junction",
          "joinColumn": {
            "key": "multimultichild4Id_self_field_name"
          },
          "inverseJoinColumn": {
            "key": "multimultiparent4Id_target_field_name"
          }
        },
        "foreignKey": "",
        "fieldItemType": "n:n",
        "name": "multimultiparent4",
      },
      {
        "relationMode": "1:n",
        "id": "37d99469-8bde-4000-ab7f-9ce76ba68000",
        "key": "multimultichild4_multimultiparent4_junctions",
        "target": "2ac82b46-8374-4000-aae1-77bef237d000",
        "targetKey": "multimultichild4_multimultiparent4_junction",
        "targetName": "multimultichild4_multimultiparent4_junction",
        "isNullable": false,
        "inverseSide": "multimultichild4",
        "fieldItemType": "1:n",
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2852.4219,
      "y": 4346.7656
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "code"
  },
  {
    "id": "vnZd64lw4X",
    "key": "multimultichild4_multimultiparent4_junction",
    "name": "multimultichild4_multimultiparent4_junction",
    "fields": [
      {
        "type": "int",
        "id": "c0c260c2-a846-4000-ac1e-5532145c8000",
        "key": "id",
        "name": "ID",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "04712a08-b0ed-4000-ac8b-bd6437ef3000",
        "key": "multimultichild4Id_self_field_name",
        "name": "multimultichild4Id_self_field_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "a9cafb70-ac29-4000-a4a4-66b5d9bba000",
        "key": "multimultichild4",
        "name": "multimultichild4",
        "relationId": "b61ea05d-c8f6-4000-a782-471a2e9e8000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "40d67f7b-7138-4000-a406-a420e96f8000",
        "key": "multimultiparent4Id_target_field_name",
        "name": "multimultiparent4Id_target_field_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "7c0f8503-52f5-4000-af13-ffa054cda000",
        "key": "multimultiparent4",
        "name": "multimultiparent4",
        "relationId": "2e90cad4-8067-4000-a336-4bf340608000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "n:1",
        "id": "b61ea05d-c8f6-4000-a782-471a2e9e8000",
        "key": "multimultichild4",
        "target": "5b28abe8-7ca9-4000-acfa-e3eacba6b000",
        "targetKey": "multimultichild4",
        "targetName": "multimultichild4",
        "fieldId": "04712a08-b0ed-4000-ac8b-bd6437ef3000",
        "isNullable": false,
        "foreignKey": "multimultichild4Id_self_field_name",
        "fieldItemType": "n:1",
      },
      {
        "relationMode": "n:1",
        "id": "2e90cad4-8067-4000-a336-4bf340608000",
        "key": "multimultiparent4",
        "target": "9b79dd6b-e694-4000-ae6e-676890fc8000",
        "targetKey": "multimultiparent4",
        "targetName": "multimultiparent4",
        "fieldId": "40d67f7b-7138-4000-a406-a420e96f8000",
        "isNullable": false,
        "foreignKey": "multimultiparent4Id_target_field_name",
        "fieldItemType": "n:1",
      }
    ],
    "isRelationShip": true,
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2554.9375,
      "y": 4259.4375
    },
    "dsId": "vxo9Y2PoP1",
    "bindKey": {},
    "acl": {
      "create": [
        "role:58511"
      ],
      "read": [
        "role:58511",
        "role:58510"
      ],
      "write": [
        "owner",
        "role:58511"
      ],
      "owner": {
        "write": true,
        "delete": true
      },
      "126106": {
        "read": true
      },
      "role:58511": {
        "read": true,
        "write": true,
        "delete": true
      },
      "role:58510": {
        "read": true
      }
    },
    "nameField": "id"
  }
]

