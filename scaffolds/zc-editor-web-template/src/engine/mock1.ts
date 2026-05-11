export const model1 = [
  {
    "id": "1Jw8kx3o8G",
    "key": "oneoneparent",
    "name": "oneoneparent",
    "fields": [
      {
        "type": "int",
        "id": "65ec9285-1783-4000-a006-51efcfde7000",
        "key": "id",
        "name": "ID显示",
        "precision": 10,
        "isNullable": false,
        "isPrimaryKey": true,
        "isGenerated": true,
        "defaultValueMode": "null",
        "comment": "ID注释",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "3e9c39c9-97e5-4000-a95e-8065aecec000",
        "key": "name",
        "name": "名称",
        "length": 100,
        "precision": 10,
        "format": "normal",
        "isNullable": true,
        "defaultValue": "默认名称",
        "defaultValueMode": "static",
        "description": "名称描述",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "textarea",
        "id": "7dc6545c-2d44-4000-acd4-3e427ef8a000",
        "key": "multiline",
        "name": "多行名称",
        "precision": 10,
        "isNullable": true,
        "validations": {
          "maxLength": 1000,
          "minLength": 10,
          "matchRegexp": "^[A-Z]*$"
        },
        "validationErrors": {
          "maxLength": "最大长度提示",
          "minLength": "最小长度提示",
          "matchRegexp": "正则提示"
        },
        "enableOCR": false,
        "description": "多行描述",
        "comment": "多行注释",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "16e543eb-447c-4000-af69-e66c58252000",
        "key": "integer",
        "name": "整数",
        "precision": 10,
        "isNullable": true,
        "defaultValueMode": "null",
        "validations": {
          "maximum": 1000,
          "minimum": 10
        },
        "validationErrors": {
          "maximum": "最大值提示",
          "minimum": "最小值提示"
        },
        "description": "整数描述",
        "comment": "整数注释",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "float",
        "id": "fd943b88-3105-4000-a9a1-0af6b97ca000",
        "key": "double",
        "name": "双精度",
        "dbType": "DOUBLE",
        "precision": 10,
        "scale": 4,
        "isNullable": true,
        "defaultValueMode": "null",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "float",
        "id": "d939951a-191c-4000-ae53-c09d96ce1000",
        "key": "float",
        "name": "单精度",
        "dbType": "FLOAT",
        "precision": 10,
        "scale": 4,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "float",
        "id": "fe9f3833-ea3c-4000-a835-fb11f2c7c000",
        "key": "decimal",
        "name": "高精度",
        "dbType": "DECIMAL",
        "precision": 10,
        "scale": 4,
        "isNullable": false,
        "defaultValueMode": "null",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "rich-text",
        "id": "6a6c43b9-8db7-4000-ad94-3e5f9b2f8000",
        "key": "richtext",
        "name": "富文本",
        "precision": 10,
        "isNullable": true,
        "defaultValueMode": "null",
        "description": "富文本描述",
        "comment": "富文本注释",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "password",
        "id": "aa87039a-fe9b-4000-a2ed-0dcbfcc75000",
        "key": "pwd",
        "name": "密码",
        "precision": 10,
        "salt": "abc",
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "attachment",
        "id": "8901e8c2-d725-4000-a1c4-bb9450769000",
        "key": "file",
        "name": "附件",
        "precision": 10,
        "isNullable": true,
        "driver": "bos",
        "description": "附件描述",
        "comment": "附件注释",
        "defaultValueType": null,
        "relative": false,
        "accept": "png,jpeg"
      },
      {
        "type": "boolean",
        "id": "db9664a6-a6e7-4000-a20e-7d30b99e3000",
        "key": "bool",
        "name": "布尔",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "ciphertext",
        "id": "fe94f4ce-1943-4000-a726-c49778263000",
        "key": "en",
        "name": "加密",
        "precision": 10,
        "token": "abc",
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "date",
        "id": "e79131dc-460a-4000-a00e-072173f41000",
        "key": "date",
        "name": "日期",
        "precision": 10,
        "isNullable": true,
        "defaultValueMode": "null",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "datetime",
        "id": "7e9d7e32-04f6-4000-a106-b9ff2b7f7000",
        "key": "datetime",
        "name": "日期时间",
        "precision": 10,
        "isNullable": true,
        "defaultValue": "CURRENT_TIMESTAMP",
        "defaultValueMode": "expression",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "time",
        "id": "bf00ab81-36a7-4000-aded-a0a7d7dbe000",
        "key": "time",
        "name": "时间",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "enum",
        "id": "3635f2c9-b1a1-4000-a5ea-5f7c64c1e000",
        "key": "enum",
        "name": "枚举",
        "dbType": "VARCHAR",
        "precision": 10,
        "options": [
          {
            "label": "a",
            "value": "a1"
          },
          {
            "label": "b",
            "value": "b1"
          }
        ],
        "isNullable": true,
        "defaultValueMode": "null",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "image",
        "id": "c080af26-be56-4000-a68f-0b47cb533000",
        "key": "pic",
        "name": "图片",
        "precision": 10,
        "isNullable": true,
        "allowedTypes": [
          ".jpeg",
          ".png",
          ".gif",
          ".svg"
        ],
        "restrictRatioCustom": 32,
        "restrictRatio": "custom",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "json",
        "id": "599efd3f-2274-4000-a3a4-6c196b6bf000",
        "key": "json",
        "name": "JSON",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "money",
        "id": "f2945df1-5d93-4000-acc2-45fbe4496000",
        "key": "money",
        "name": "金额",
        "precision": 10,
        "isNullable": true,
        "defaultValueMode": "null",
        "currency": {
          "icon": "￥",
          "label": "人民币",
          "value": "CNY"
        },
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "user",
        "id": "54f45e62-075b-4000-a3a8-3ed26d373000",
        "key": "user",
        "name": "人员",
        "precision": 10,
        "allowInput": true,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "users",
        "id": "28e5105f-72e6-4000-ad5b-d18c2d855000",
        "key": "users",
        "name": "人员多选",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "department",
        "id": "897a4839-8986-4000-a8ed-6af999d2f000",
        "key": "dept",
        "name": "部门",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "enum",
        "id": "aa77f1e9-7050-4000-abfc-32caafe35000",
        "key": "enum2",
        "name": "枚举2",
        "dbType": "INTEGER",
        "precision": 10,
        "options": [
          {
            "label": "1a",
            "value": "1"
          },
          {
            "label": "2b",
            "value": "2"
          }
        ],
        "isNullable": true,
        "defaultValueMode": "null",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "enum",
        "id": "0e17b55f-384d-4000-a138-3c29a7729000",
        "key": "enum3",
        "name": "枚举3",
        "dbType": "VARCHAR",
        "precision": 10,
        "isNullable": true,
        "defaultValueMode": "null",
        "defaultValueType": null,
        "source": "app://dictionary/running/list?level=2&encoded=dict2",
        "relative": false
      },
      {
        "type": "enum",
        "id": "d391ec98-01cd-4000-a223-429a11fd5000",
        "key": "enum4",
        "name": "枚举4",
        "dbType": "INTEGER",
        "precision": 10,
        "isNullable": true,
        "defaultValueMode": "null",
        "defaultValueType": null,
        "source": "app://dictionary/running/list?level=2&encoded=dict1",
        "relative": false
      },
      {
        "id": "1cac7719-5287-4808-bcd2-198853b8e576",
        "key": "datetimerange",
        "name": "日期时间范围",
        "type": "date-range",
        "dbType": "datetime",
        "maxDate": "1694361600",
        "minDate": "1693843200",
        "isNullable": false,
        "defaultValueMode": "static",
        "defaultValue": [
          "1693497600",
          "1693929599"
        ]
      },
      {
        "id": "da91fd24-394b-4436-8be1-08afba085ecb",
        "key": "daterange",
        "name": "日期范围",
        "type": "date-range",
        "dbType": "date",
        "maxDate": "1694275200",
        "minDate": "1693843200",
        "isNullable": false,
        "defaultValueMode": "static",
        "defaultValue": [
          "1693843200",
          "1696694399"
        ]
      },
      {
        "id": "293cd4eb-95f4-48c6-aedf-35ae1caf79c0",
        "key": "timerange",
        "name": "时间范围",
        "type": "date-range",
        "dbType": "time",
        "maxDate": "1693497600",
        "minDate": "1693497600",
        "isNullable": false,
        "defaultValueMode": "static",
        "defaultValue": [
          "1693497600",
          "1693497605"
        ]
      },
      {
        "id": "378ec2cb-c859-449b-9331-d66f3917db1b",
        "key": "formula",
        "name": "公式",
        "type": "formula",
        "isNullable": false,
        "formula": "TRIM(name)",
        "typeLabel": "公式",
        "description": "公式描述"
      },
      {
        "id": "2f48eff8-68a8-44b7-815b-eeba7519c9f5",
        "key": "parentId",
        "name": "父级节点",
        "type": "parent",
        "isNullable": true,
        "isTreeParentId": true
      },
      {
        "type": "int",
        "id": "70c9a6bd-eaf3-4000-ae3a-4fa1cc47a000",
        "key": "oneonechildId_name",
        "name": "oneonechildId_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "d45aab7a-87f5-4000-af25-8d1f82401000",
        "key": "oneonechild_key",
        "name": "oneonechild_key",
        "relationId": "bda76366-a91a-4000-a4be-062e46961000",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "int",
        "id": "713a162d-9e52-4000-a03d-b183129ba000",
        "key": "oneonechlid2Id_name",
        "name": "oneonechlid2Id_name",
        "precision": 10,
        "isForeignKey": true,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "relation",
        "id": "4f523f1c-651e-4000-a390-1aeb33cf0000",
        "key": "oneonechlid2_key",
        "name": "oneonechlid2_key",
        "relationId": "d83b39b2-793d-4000-a95b-e962ba6ac000",
        "precision": 10,
        "isNullable": false,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "relations": [
      {
        "relationMode": "1:1",
        "id": "bda76366-a91a-4000-a4be-062e46961000",
        "key": "oneonechild_key",
        "target": "Qyw7nlOogG",
        "targetKey": "oneonechild",
        "targetName": "oneonechild",
        "fieldId": "70c9a6bd-eaf3-4000-ae3a-4fa1cc47a000",
        "isNullable": true,
        "cascadeRemove": true,
        "foreignKey": "oneonechildId_name",
        "fieldItemType": "1:1",
        "name": "oneonechild_key",
        "inputType": "embed",
        "quickEdit": true,
        "quickEditSettings": {"inputType": "embed"}
      },
      {
        "relationMode": "1:1",
        "id": "d83b39b2-793d-4000-a95b-e962ba6ac000",
        "key": "oneonechlid2_key",
        "target": "b9940252-5bde-4000-ab1d-5b084f766000",
        "targetKey": "oneonechlid2",
        "targetName": "oneonechlid2",
        "fieldId": "713a162d-9e52-4000-a03d-b183129ba000",
        "isNullable": false,
        "joinColumnAtTarget": false,
        "foreignKey": "oneonechlid2Id_name",
        "fieldItemType": "1:1",
        "name": "oneonechlid2",
        "displayType": "embed",
        "quickEdit": true,
        "quickEditSettings": {"inputType": "select"}
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 3065.5784,
      "y": 4144.7827
    },
    "dsId": "VbELL6qEdr",
    "dsKey": "ds1",
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
    "id": "7zEN1mRwMa",
    "key": "singlelinetext",
    "name": "singlelinetext",
    "fields": [
      {
        "type": "int",
        "id": "6e19a471-75b0-4000-aeb6-629144294000",
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
        "id": "2f72ecc3-57a9-4000-aabd-3c1a29f44000",
        "key": "text1",
        "name": "text1",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "adbfdc60-bdb6-4000-a94e-0da2e575b000",
        "key": "text2",
        "name": "text2",
        "length": 256,
        "precision": 10,
        "format": "email",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "邮箱提示",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "c01344e9-c59e-4000-ae96-0daf9650f000",
        "key": "text3",
        "name": "text3",
        "length": 256,
        "precision": 10,
        "format": "url",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "网址提示",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "6c70c945-ebce-4000-a88d-4314d76d2000",
        "key": "text4",
        "name": "text4",
        "length": 18,
        "precision": 10,
        "format": "id",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "身份证号提示",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "ea1134dd-d9f9-4000-a8de-f51485075000",
        "key": "text5",
        "name": "text5",
        "length": 20,
        "precision": 10,
        "format": "phone",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "手机号提示",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "5725f26b-d405-4000-a06f-725f28359000",
        "key": "text6",
        "name": "text6",
        "length": 20,
        "precision": 10,
        "format": "tel",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "电话号码提示",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "f2198eaa-a6ba-4000-a8b3-77758b150000",
        "key": "text7",
        "name": "text7",
        "length": 10,
        "precision": 10,
        "format": "zipcode",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "邮编提示",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "224b0cd1-c3a0-4000-ae8f-b988ef1eb000",
        "key": "text8",
        "name": "text8",
        "length": 30,
        "precision": 10,
        "format": "color",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "颜色提示",
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "text",
        "id": "7db6a802-e446-4000-a03a-bb0607761000",
        "key": "text9",
        "name": "text9",
        "length": 256,
        "precision": 10,
        "format": "year",
        "isNullable": true,
        "defaultValueMode": "null",
        "formatMsg": "年份提示",
        "defaultValueType": null,
        "relative": false
      }
    ],
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 2721.5073,
      "y": 4151.5127
    },
    "dsId": "VbELL6qEdr",
    "dsKey": "ds1",
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
    "nameField": "text1"
  },
  {
    "id": "Qyw7nlOogG",
    "key": "oneonechild",
    "name": "oneonechild",
    "fields": [
      {
        "type": "int",
        "id": "89cf3d7c-cd80-4000-af6a-3e0d4ab88000",
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
        "id": "54f0af6b-74ca-4000-a1f6-600137675000",
        "key": "name",
        "name": "name",
        "precision": 10,
        "isNullable": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "user",
        "id": "a1bf7b60-051e-4000-a62e-8e9ada472000",
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
        "id": "3ab4ba2b-4ade-4000-af77-104b98a4c000",
        "key": "updatedBy",
        "name": "更新人",
        "precision": 10,
        "isNullable": false,
        "isUpdateUser": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "datetime",
        "id": "064ab4e9-83bd-4000-a6b5-62e6b4cb5000",
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
        "id": "5808a371-ee0a-4000-afb8-1dc20b063000",
        "key": "updatedAt",
        "name": "更新时间",
        "precision": 10,
        "isNullable": false,
        "isUpdateDate": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "datetime",
        "id": "83444d69-a716-4000-a732-61c73ba8d000",
        "key": "deletedAt",
        "name": "删除时间",
        "precision": 10,
        "isNullable": true,
        "isDeleteDate": true,
        "defaultValueType": null,
        "relative": false
      },
      {
        "type": "user",
        "id": "fb5cefb5-bdda-4000-a49a-6222d3117000",
        "key": "deletedBy",
        "name": "删除人",
        "precision": 10,
        "isNullable": true,
        "isDeleteUser": true,
        "defaultValueType": null,
        "relative": false
      }
    ],
    "useSoftDelete": true,
    "parentField": "parentId",
    "primaryField": "id",
    "validateRules": [],
    "diagramInfo": {
      "x": 3475.7344,
      "y": 4154.375
    },
    "dsId": "VbELL6qEdr",
    "dsKey": "ds1",
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
    "id": "9QEW8JOZp8",
    "key": "oneonechlid2",
    "name": "oneonechlid2",
    "fields": [
      {
        "type": "int",
        "id": "0f1a231b-2676-4000-a21a-a28c3b813000",
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
        "id": "46d499cf-90b0-4000-a15d-b134f2e5d000",
        "key": "name",
        "name": "name",
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
      "x": 3467.125,
      "y": 4592.578
    },
    "dsId": "VbELL6qEdr",
    "dsKey": "ds1",
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
  }
]
