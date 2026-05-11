import {getPermissions} from "@/api/acl"
import permStore from "@/store/permission"
import { isAppEnd } from '@/utils/index'
import { useDevBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
let isVal = isAppEnd() ? '${2}' : '${1}'
let searchOptions = isAppEnd() ? [
    {
        "label": "应用端",
        "value": 2
    }] : [ {
        "label": "编辑端",
        "value": 1
    },
    {
        "label": "应用端",
        "value": 2
    }]
let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/permission/app-permissionList") : useDevBaseUrl("/app/permission/permissionList")
let deferApi = isAppEnd() ? useDevBaseUrl("/application/app/permission/app-getPermissionListByParentId") : useDevBaseUrl("/app/permission/getPermissionListByParentId")
let crudData = !isAppEnd() ? {
    "menuScenario": "${menuScenario}",
} : {};
let deferData = !isAppEnd() ? {
    "menuScenario": "${menuScenario}",
    "menuId": "${menuId}"
} : {
    "menuId": "${menuId}"
};
let AuthApi = isAppEnd() ? useDevBaseUrl("/application/app/permission/app-assignRolePermission") : useDevBaseUrl("/app/permission/assignRolePermission")
let AuthDetailApi = isAppEnd() ? useDevBaseUrl("/application/app/permission/app-permissionDetail?menuId=${menuId}") : useDevBaseUrl("/app/permission/permissionDetail?menuId=${menuId}")
const schema = {
    "type": "page",
    "body": [{
        "type": "alert",
        "body": "温馨提示：应用的创建者默认拥有全部权限",
        "level": "warning",
        "className": "mb-1"
    },{
        "type": "crud",
        "id":"crudPage",
        "syncLocation": false,
        "autoFillHeight": true,
        "api": {
            "method": "get",
            "url": crudApi,
            "data": crudData,
            adaptor: function (payload: any) {
                return {
                    ...payload,
                    status: payload.code,
                    data: {
                        ...payload.data, items:payload?.data ?  payload.data : []
                    }
                };
            },
        },
        "deferApi": {
            "method": "get",
            "url": deferApi,
            "data": deferData,
        },
        "headerToolbar": [
            {
                "type": "columns-toggler",
                "align": "right",
                "draggable": true
            },
            {
                "type": "reload",
                "align": "right",
            },
        ],
        "autoGenerateFilter": true,
        "columns": [
            {
                "name": "menuName",
                "label": "菜单名称"
            },
            // {
            //     "name": "menuType",
            //     "label": "菜单类型",
            //     "type": 'mapping',
            //     "map": {
            //         1: "<span>目录</span>",
            //         2: "<span>菜单</span>",
            //         3: "<span>按钮</span>",
            //     },
            // },
            {
                "name": "menuScenario",
                "label": "菜单场景",
                "type": 'mapping',
                "map": {
                    '1': "<span>编辑端</span>",
                    '2': "<span>应用端</span>",
                },
                "searchable": {
                    "type": "select",
                    "name": "menuScenario",
                    "label": "菜单场景",
                    "clearable": true,
                    "placeholder": "请选择",
                    "size": "sm",
                    "options": searchOptions,
                    // "options": [ {
                    //     "label": "编辑端",
                    //     "value": 1
                    // },
                    // {
                    //     "label": "应用端",
                    //     "value": 2
                    // }],
                    "value": isVal,
                },

            },
            {
                "name": "menuPermission",
                "label": "权限标识"
            },
            {
                "type": "operation",
                "label": "操作",
                "buttons": [
                    {
                        "label": "授权",
                        "type": "button",
                        "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:permission:assign')}" : "${ARRAYINCLUDES(${$$permissionsData},'devApp:permission:assign')}",
                        "level": "link",
                        "actionType": "dialog",
                        "dialog": {
                            "title": "「" + "${menuName}"+ "」分配角色",
                            "data": {
                                menuId: "${menuId}",
                                menuName: "${menuName}",
                                menuScenario: "${menuScenario}"
                            },
                            "size": "lg",
                            "body": [
                                {
                                    "type": "form",
                                    "initApi": {
                                        "method": "get",
                                        "url": AuthDetailApi,
                                        adaptor: function (payload: any) {
                                            // payload?.data?.roleOptionS.forEach((item:any)=>{item.value = item.id, item.label = item.roleName})
                                            return {
                                                ...payload,
                                                status: payload.code,
                                                data: { ...payload.data, roleOptionS: payload?.data?.roleOptionS, roleIdList: payload?.data?.roleIdList}
                                            };
                                        }
                                    },
                                    "api": {
                                        "method": "post",
                                        "url": AuthApi,
                                        requestAdaptor: function (api:any) {
                                            let roleS = [];
                                            if(api.data.roleS == ''){
                                                roleS = [];
                                            } else {
                                                let roleSData = Array.isArray(api.data.roleS) ? api.data.roleS : api.data.roleS.split(',');
                                                roleS = [];
                                                // roleSData.map((item) => {
                                                //     let newData = {};
                                                //     newData.roleId = item.split('-')[0];
                                                //     newData.sourceType = item.split('-')[1];
                                                //     roleS.push(newData);
                                                // });
                                                let roleOptions = api.data.roleOptionS;
                                                roleSData.map((item) => {
                                                    let roleData = roleOptions.filter(item1=>item1.id == item)
                                                    let newData = {};
                                                    newData.roleId = item;
                                                    newData.sourceType = roleData[0].sourceType;
                                                    roleS.push(newData);
                                                });
                                            }

                                            let menuId = api.data.__super.__super.menuId;
                                            return {
                                                ...api,
                                                data: {
                                                    "menuId": menuId,
                                                    "roleS": roleS,
                                                    "linkageSubMenuAuthFlag": api.data.linkageSubMenuAuthFlag ? api.data.linkageSubMenuAuthFlag : false,
                                                    "menuScenario": api.data.__super.__super.menuScenario,
                                                }
                                            };
                                        },
                                        adaptor: async function (payload: any) {
                                            let permissionRes = await getPermissions()
                                            let data = permissionRes.data.data.permissions
                                            permStore.dispatch({type: "set", payload: data });
                                            return {
                                                ...payload,
                                                status: payload.code
                                            };
                                        }
                                    },
                                    "body": [
                                        {
                                            "type": "transfer",
                                            "name": "roleS",
                                            "label": "角色名称",
                                            "source": "${roleOptionS}",
                                            "labelField": "roleName",
                                            "valueField": "id",
                                            "value": "${roleIdList}",
                                        },
                                        {
                                            "name": "linkageSubMenuAuthFlag",
                                            "type": "checkbox",
                                            "label": "联动授权",
                                            "option": "联动授权",
                                            "visibleOn": "${menuType != 3}"
                                        }
                                    ]
                                }
                            ],
                        },
                    },
                ]
            }
        ]
    }]
}

export default () => <AMISComponent schema={schema} />;
