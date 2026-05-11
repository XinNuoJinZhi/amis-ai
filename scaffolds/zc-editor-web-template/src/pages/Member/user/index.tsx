import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
const schema ={
  "type": "page",
  "body": [
    {
      "type": "crud",
      "syncLocation": false,
      "autoFillHeight": true,
      "api": {
        "method": "get",
        "url": useDevBaseUrl("/system/member-level-user/page"),
        "data": {
          "pageNo": "${page}",
          "pageSize": "${perPage}",
          "username": "${username}",
          "nickname": "${nickname}",
          "memberLevelName": "${memberLevelName}",
          "mobile": "${mobile}",
          "memberCreationTimeBegin": "${memberCreationTime[0]|default:undefined}",
          "memberCreationTimeEnd": "${memberCreationTime[1]|default:undefined}",
          "appTenantCode": "${appTenantCode}"
        },
        adaptor: function (payload:any) {
          return {
            ...payload,
            status: payload.code,
            data: { ...payload?.data, items: payload?.data?.list }
          };
        },
      },
      "headerToolbar": [
        {
          "type": "columns-toggler",
          "align": "right",
          "draggable": true,
        },
        {
          "type": "reload",
          "align": "right",
        },
      ],
      "footerToolbar": [
        "statistics",
        "switch-per-page",
        "pagination"
      ],
      "alwaysShowPagination": true,
      "autoGenerateFilter": true,
      "columns": [
        {
          "name": "id",
          "label": "用户编号",
        },
        // {
        //   "name": 'appTenantName',
        //   "label": '应用租户',
        //   "searchable": {
        //     "type": 'select',
        //     "name": 'appTenantCode',
        //     "label": '应用租户',
        //     "placeholder": '请选择',
        //     "clearable": true,
        //     "size": 'sm',
        //     "source": {
        //         "method": 'get',
        //         "url": useDevBaseUrl('/system/member-level-user/allAppTenantList'),
        //         "responseData": {
        //             "options": '${items|pick:label~displayName,value~code}'
        //         }
        //     }
        //   }
        // },
        {
          "name": "username",
          "label": "用户账号",
          "searchable": {
            "type": "input-text",
            "name": "username",
            "label": "用户账号",
            "clearable": true,
            "placeholder": "请输入用户账号",
            "size": "sm",
          }
        },
        {
          "name": "nickname",
          "label": "用户昵称",
          "searchable": {
            "type": "input-text",
            "name": "nickname",
            "label": "用户昵称",
            "clearable": true,
            "placeholder": "请输入用户昵称",
            "size": "sm",
          }
        },
        {
          "name": "mobile",
          "label": "手机号码",
          "searchable": {
            "type": "input-text",
            "name": "mobile",
            "label": "手机号码",
            "clearable": true,
            "placeholder": "请输入手机号码",
            "size": "sm",
          }
        },
        {
          "name": 'memberLevelName',
          "label": '会员等级名称',
          "searchable": {
            "type": 'input-text',
            "name": 'memberLevelName',
            "label": '会员等级名称',
            "clearable": true,
            "placeholder": "请输入会员等级名称",
            "size": 'sm',
          }
        },
        {
          "name": "memberCreationTime",
          "label": "成为会员时间",
          "searchable": {
            "type": 'input-datetime-range',
            "name": "memberCreationTime[0]",
            "extraName": "memberCreationTime[1]",
            "label": '成为会员时间',
            "inputFormat": "YYYY-MM-DD HH:mm:ss",
            "timeFormat": "HH:mm:ss",
            "clearable": true,
            "size": 'sm'
          }
        },
        {
          "name": "expireTime",
          "label": "会员到期时间",
        },
        {
          "name": "email",
          "label": "用户邮箱",
        },
        {
          "name": "sex",
          "label": "用户性别",
          "type": 'mapping',
          "map": {
            '2': "<span class='label label-success'>女</span>",
            '1': "<span class='label label-info'>男</span>",
          }
        },
        {
          "name": "avatar",
          "label": "用户头像",
          "type": "static-image"
        },
        {
          "name": "status",
          "label": "是否封禁",
          "type": 'mapping',
          "map": {
            '0': "<span class='label label-success'>否</span>",
            '1': "<span class='label label-info'>是</span>",
          }
        },
        {
          "name": "loginIp",
          "label": "最后登录IP",
        },
        {
          "name": "loginDate",
          "label": "最后登录时间",
        },
        {
          "type": "operation",
          "label": "操作",
          "buttons": [
            {
              "label": "详情",
              "type": "button",
              "level": "link",
              "actionType": "dialog",
              "dialog": {
                "title": "详情",
                "actions": [
                  {
                    "label": "关闭",
                    "actionType": "close",
                    "level": "default",
                    "type": "button",
                  }
                ],
                "data": {
                  id: "${id}",
                  memberLevelId: "${memberLevelId}",
                  appTenantCode: "${appTenantCode}"
                },
                "body": {
                  "type": "form",
                  "initApi": {
                    "method": "get",
                    "url": useDevBaseUrl("/system/member-level-user/get?userId=${id}&memberLevelId=${memberLevelId}&appTenantCode=${appTenantCode}"),
                    adaptor: function (payload:any) {
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data}
                      };
                    }
                  },
                  "body": [
                    // {
                    //   "type": "input-text",
                    //   "name": "appTenantName",
                    //   "label": "应用租户",
                    //   "static": true,
                    // },
                    {
                      "type": "input-text",
                      "name": "username",
                      "label": "用户账号",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "name": "nickname",
                      "label": "用户昵称",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "name": "mobile",
                      "label": "手机号码",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "name": "memberLevelName",
                      "label": "会员等级名称",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "label": "成为会员时间",
                      "name": "memberCreationTime",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "label": "会员到期时间",
                      "name": "expireTime",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "name": "remark",
                      "label": "备注",
                      "static": true,
                    },
                    // {
                    //   "type": "input-text",
                    //   "name": "deptName",
                    //   "label": "部门名称",
                    //   "static": true,
                    // },
                    {
                      "type": "input-text",
                      "name": "email",
                      "label": "用户邮箱",
                      "static": true,
                    },
                    {
                      "type": "select",
                      "name": "sex",
                      "label": "用户性别",
                      "static": true,
                      "source": {
                        "method": "get",
                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=system_user_sex&status=0"),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: payload.data }
                          };
                        },
                      },
                    },
                    {
                      "type": "static-image",
                      "label": "用户头像",
                      "name": "avatar",
                    },
                    {
                      "type": "select",
                      "name": "status",
                      "label": "是否封禁",
                      "placeholder": "请选择是否封禁",
                      "static": true,
                      "source": {
                        "method": "get",
                        "url": useAdminBaseUrl("/system/dict-data/list?dictType=is_ban&status=0"),
                        adaptor: function (payload: any) {
                          return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, options: payload.data }
                          };
                        },
                      },
                    },
                    {
                      "type": "input-text",
                      "label": "最后登录IP",
                      "name": "loginIp",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "label": "最后登录时间",
                      "name": "loginDate",
                      "static": true,
                    },
                    {
                      "type": "input-text",
                      "label": "创建时间",
                      "name": "createTime",
                      "static": true,
                    },
                  ]
                }
              }
            },
          ]
        }
      ],
      "placeholder": "暂无数据"
    }
  ]
}

export default () => <AMISComponent schema={schema} />;
