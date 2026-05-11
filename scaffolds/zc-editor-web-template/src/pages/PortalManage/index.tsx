import MenuList from "./component/MenuList"
import {getUpdatePortal} from "@/api/portalManage"
import { toast } from 'amis';
import appDefaultImg from '@/assets/imgs/appDefaultImg.png'
import { useDevBaseUrl, longDecimalMod } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
import { getRefreshToken, getTenantId, getAccessToken, getAppTenantCode } from '@/utils/auth'
import { getAppId, getEnv } from '@/utils/index'
import appTenantCodeStore from '@/store/appTenantCode';
import {goviewUrl} from '@/utils/env'
const schema = {
    "type": "page",
    "body": {
        "type": "crud",
        "name": "portal_page",
        "id": "portal_page",
        "className": "portal_page",
        "syncLocation": false,
        "mode": "cards",
        "defaultParams": {
            "perPage": 12
        },
        "api": {
            "method": "get",
            "url": useDevBaseUrl("/app/portal/page"),
            "data": {
                "pageNo": "${page}",
                "pageSize": "${perPage}",
            },
            adaptor: function (payload: any) {
                // payload.data?.list?.forEach(item=> item.logo =  item.logo ? item.logo : appDefaultImg)
                for(var i=0; i < payload.data?.list?.length; i++){
                    if(payload.data.list[i]?.logo==''){
                        payload.data.list[i].logo = appDefaultImg
                        payload.data.list[i].bg = longDecimalMod(payload.data?.list[i].id, 5)
                    } else {
                        payload.data.list[i].bg = ''
                    }
                }
                return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data, arr: payload.data?.list}
                };
            }
        },
        "headerToolbar": [
            {
                "type": "button",
                "label": "新建应用门户",
                "level": "info",
                "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:portal:create')}",
                "actionType": "dialog",
                "reload": "portal_page",
                "dialog": {
                    "title": "新建应用门户",
                    "body": [{
                        "type": "form",
                        "api": {
                            "method": "post",
                            "url": useDevBaseUrl("/app/portal/create"),
                            "data": {
                                "portalName": "${portalName}",
                                "type": "${type}",
                                "remark": "${remark}",
                                "logo": "${logo}",
                                "sort": "${sort}"
                            },
                            adaptor: function (payload: any) {
                                return {
                                    ...payload,
                                    status: payload.code
                                };
                            }
                        },
                        "mode": "horizontal",
                        "horizontal": {
                            "left": 2,
                            "right": 10,
                            "offset": 2
                        },
                        "body": [
                            {
                                "type": "input-text",
                                "name": "portalName",
                                "label": "门户名称",
                                // "required": true,
                                "placeholder": "请输入门户名称",
                                "showCounter": true,
                                "maxLength": 20,
                                "desc": "为空默认为应用名称"
                            },
                            {
                                "type": "button-group-select",
                                "label": "门户类型",
                                "name": "type",
                                "required": true,
                                "value": '1',
                                "options": [
                                    {
                                        "label": "PC门户",
                                        "value": "1",
                                    },
                                    {
                                        "label": "移动端门户",
                                        "value": "2",
                                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:publish:mobile')}"
                                    },
                                    {
                                        "label": "大屏门户",
                                        "value": "3",
                                    },
                                ],
                            },
                            {
                                "type": "input-text",
                                "name": "queryKey",
                                "label": "路径",
                                "disabled": true,
                                "placeholder": "进入门户地址栏的标识，系统自己生成",
                            },
                            {
                                "type": "input-number",
                                "name": "sort",
                                "label": "排序",
                                "required": "true",
                                "min": 0,
                                "placeholder": "请输入排序",
                                "value": 0,
                            },
                            {
                                "type": "textarea",
                                "name": "remark",
                                "label": "描述",
                                "placeholder": "请输入描述信息",
                                "showCounter": true,
                                "maxLength": 50,
                            },
                            {
                                "type": "input-image",
                                "label": "Logo",
                                "name": "logo",
                                // "crop": true,
                                "maxSize": 51200,
                                "receiver": {
                                    "method": "post",
                                    "url": useDevBaseUrl("/app/file/convert/base64"),
                                    adaptor: function (payload: any) {
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: {
                                                "value": payload.data
                                            }
                                        };
                                    }
                                }
                            },
                        ],
                        onEvent:{
                            "submitSucc": {
                                "actions": [
                                    {
                                        "actionType": "broadcast",
                                        "args": {
                                            "eventName": "portalChange"
                                        },
                                    }
                                ]
                            }
                        }
                    }],
                    // "onEvent": {
                    //     "confirm": {
                    //         "actions": [
                    //             {
                    //                 "actionType": "custom",
                    //                 "script": async function () {
                    //                     window.location.reload()
                    //                 }
                    //             }
                    //         ]
                    //     }
                    // }
                }
            },
        ],
        "footerToolbar": [
            "statistics",
            "switch-per-page",
            "pagination"
        ],
        "perPageAvailable": [12, 24, 36, 48, 60],
        "alwaysShowPagination": true,
        "columnsCount": 6,
        "card": {
            "className": "portalManage_list",
            "body": [{
                "type": "wrapper",
                "className": "portalManage_list_one",
                "body": [{
                    "type": "wrapper",
                    "className": "portalManage_list_one_top",
                    "body": [{
                        "type": "image",
                        "src": "${logo}",
                        "className": "${bg}"
                    },{
                        "type": "tpl",
                        "tpl": "${portalName}",
                        "className": "portalManage_name",
                        "showNativeTitle": true,
                    },{
                        "type": 'mapping',
                        "value": "1",
                        "className": "portalManage_category",
                        "name": "type",
                        "map": {
                            "1": "<span class='label label-info'>PC门户</span>",
                            "2": "<span class='label label-info'>移动端门户</span>",
                            "3": "<span class='label label-info'>大屏门户</span>",
                        }
                    }]
                },{
                    "type": "wrapper",
                    "className": "portalManage_list_one_middle",
                    "body": [
                        {
                            "type": "tpl",
                            "className": "portalManage_list_one_middle_info",
                            "tpl": "${remark ? ${remark} : '暂无说明'}",
                            "showNativeTitle": true,
                        }
                    ]
                },{
                    "type": "wrapper",
                    "className": "portalManage_list_one_bottom",
                    "body": [{
                        "type": "wrapper",
                        "className": "portalManage_list_one_bottom_info",
                        "body": [
                            {
                                "type": "container",
                                "visibleOn": "${type != 2}",
                                "body": [{
                                    "type": "icon",
                                    "icon": "far fa-eye",
                                    "className": "portalManage_list_icon",
                                },{
                                    "type": "tpl",
                                    "tpl": "预览",
                                }],
                                "onEvent": {
                                    "click": {
                                        "actions": [
                                            {
                                                "actionType": "custom",
                                                "script": function (obj:any) {
                                                    let url = window.location.href;
                                                    let toSearch = url.split('?')[1] ? url.split('?')[1] : ''
                                                    const toParams = new URLSearchParams(toSearch);
                                                    let appId = toParams.get('appid')
                                                    let env = toParams.get('env')
                                                    let portalKey = obj.props.data.queryKey;
                                                    if(obj.props.data.type == 1) {//pc门户
                                                        let appUrl = window.location.origin + '/app/' + '?appid=' + appId + '&env=' + env + '&portalKey=' + portalKey;
                                                        window.open(appUrl)
                                                    } else if(obj.props.data.type == 3){//大屏门户
                                                        let largeScreenUrl = goviewUrl +
                                                            '/#/project/big-screen-preview?token=' + getAccessToken() +
                                                            '&refreshToken=' + getRefreshToken() +
                                                            '&tenantId=' + getTenantId() +
                                                            '&appid=' + getAppId() +
                                                            '&appTenantCode=' + getAppTenantCode() +
                                                            '&env=' + getEnv()
                                                        largeScreenUrl = largeScreenUrl + '&portalKey=' + portalKey
                                                        window.open(largeScreenUrl)
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "type": "container",
                                "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:portal:update')}",
                                "body": [{
                                    "type": "icon",
                                    "icon": "far fa-edit",
                                    "className": "portalManage_list_icon",
                                },{
                                    "type": "tpl",
                                    "tpl": "编辑",
                                }],
                                "onEvent": {
                                    "click": {
                                        "actions": [{
                                            "actionType": "dialog",
                                            "dialog": {
                                                "title": "编辑应用门户",
                                                "id": "edit_portal_dialog",
                                                "className": "editPortalDialog",
                                                "data": {
                                                    id: "${id}",
                                                    type: "${type}"
                                                },
                                                "body": {
                                                    "type": "form",
                                                    "mode": "horizontal",
                                                    "wrapWithPanel": false,
                                                    "id": "editPortal",
                                                    "initApi": {
                                                        "method": "get",
                                                        "url": useDevBaseUrl("/app/portal/get?id=${id}"),
                                                        adaptor: function (payload:any) {
                                                            let rolesOptions = payload?.data?.rolesOptions?.map(item => { return { label: item.name, value: item.id } })
                                                            // let val = rolesOptions.map(item=> item.value)
                                                            // payload.data.accessibleRoles == null ? payload.data.accessibleRoles = val : payload.data.accessibleRoles;
                                                            let commonBadgeVal = 0;
                                                            if(payload?.data?.commonBadge && JSON.stringify(payload?.data?.commonBadge) == "{}" || JSON.stringify(payload?.data?.commonBadge) == "null"){
                                                                commonBadgeVal = 0;
                                                            } else {
                                                                commonBadgeVal = 1;
                                                            }
                                                            return {
                                                                ...payload,
                                                                status: payload.code,
                                                                data: { ...payload.data, rolesOptions: rolesOptions, commonBadge: commonBadgeVal, commonBadgeDetail: payload?.data?.commonBadge  }
                                                            };
                                                        }
                                                    },
                                                    "horizontal": {
                                                        "left": 2,
                                                        "right": 10,
                                                        "offset": 2
                                                    },
                                                    "body": {
                                                        "type": "tabs",
                                                        "tabs": [
                                                            {
                                                                "title": "基本配置",
                                                                "body": [
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "portalName",
                                                                        "label": "门户名称",
                                                                        // "required": true,
                                                                        "placeholder": "请输入门户名称",
                                                                        "showCounter": true,
                                                                        "maxLength": 20,
                                                                        "desc": "为空默认为应用名称"
                                                                    },
                                                                    {
                                                                        "type": "button-group-select",
                                                                        "label": "门户类型",
                                                                        "name": "type",
                                                                        "required": true,
                                                                        "disabled": true,
                                                                        "options": [
                                                                            {
                                                                                "label": "PC门户",
                                                                                "value": "1",
                                                                            },
                                                                            {
                                                                                "label": "移动端门户",
                                                                                "value": "2",
                                                                                "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:publish:mobile')}"
                                                                            },
                                                                            {
                                                                                "label": "大屏门户",
                                                                                "value": "3",
                                                                            },
                                                                        ],
                                                                    },
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "queryKey",
                                                                        "label": "路径",
                                                                        "disabled": true,
                                                                    },
                                                                    {
                                                                        "type": "input-number",
                                                                        "name": "sort",
                                                                        "label": "排序",
                                                                        "required": "true",
                                                                        "placeholder": "请输入排序",
                                                                    },
                                                                    {
                                                                        "type": "textarea",
                                                                        "name": "remark",
                                                                        "label": "描述",
                                                                        "placeholder": "请输入描述信息",
                                                                        "showCounter": true,
                                                                        "maxLength": 50,
                                                                    },
                                                                    {
                                                                        "type": "input-image",
                                                                        "label": "Logo",
                                                                        "name": "logo",
                                                                        // "crop": true,
                                                                        "maxSize": 51200,
                                                                        "receiver": {
                                                                            "method": "post",
                                                                            "url": useDevBaseUrl("/app/file/convert/base64"),
                                                                            adaptor: function (payload: any) {
                                                                                return {
                                                                                    ...payload,
                                                                                    status: payload.code,
                                                                                    data: {
                                                                                        "value": payload.data
                                                                                    }
                                                                                };
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        "type": "select",
                                                                        "label": "可访问角色",
                                                                        "name": "accessibleRoles",
                                                                        "multiple": true,
                                                                        "source": "${rolesOptions}",
                                                                        "desc": "为空默认所有用户拥有权限"
                                                                    },
                                                                    {
                                                                        "type": "switch",
                                                                        "name": "commonBadge",
                                                                        "id": "enableBadge",
                                                                        "label": "启用角标",
                                                                        "trueValue": 1,
                                                                        "falseValue": 0,
                                                                        "hidden": true,
                                                                    },
                                                                    {
                                                                        "name": "mode",
                                                                        "type": "radios",
                                                                        "label": "角标类型",
                                                                        "required": true,
                                                                        "visibleOn": "this.commonBadge == 1",
                                                                        "selectFirst": true,
                                                                        "options": [
                                                                            {
                                                                                "label": "点",
                                                                                "value": "dot"
                                                                            },
                                                                            {
                                                                                "label": "文字",
                                                                                "value": "text"
                                                                            },
                                                                            {
                                                                                "label": "绸缎",
                                                                                "value": "ribbon"
                                                                            },
                                                                        ],
                                                                        "value": "${commonBadgeDetail.mode}"
                                                                    },
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "overflowCount",
                                                                        "label": "封顶数字",
                                                                        "required": true,
                                                                        "placeholder": "请输入名称",
                                                                        "visibleOn": "this.commonBadge == 1 && this.mode == 'text'",
                                                                        "value": "${commonBadgeDetail.overflowCount || 99}"
                                                                    },
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "size",
                                                                        "label": "角标大小",
                                                                        "required": true,
                                                                        "placeholder": "请输入名称",
                                                                        "suffix": "px",
                                                                        "visibleOn": "this.commonBadge == 1",
                                                                        "value": "${commonBadgeDetail.size}"
                                                                    },
                                                                    {
                                                                        "type": "select",
                                                                        "name": "level",
                                                                        "label": "角标主题",
                                                                        "required": true,
                                                                        "visibleOn": "this.commonBadge == 1",
                                                                        "options": [
                                                                            {
                                                                                "label": "成功",
                                                                                "value": "success"
                                                                            },
                                                                            {
                                                                                "label": "警告",
                                                                                "value": "warning"
                                                                            },
                                                                            {
                                                                                "label": "危险",
                                                                                "value": "danger"
                                                                            },
                                                                            {
                                                                                "label": "信息",
                                                                                "value": "info"
                                                                            },
                                                                        ],
                                                                        "value": "${commonBadgeDetail.level || 'danger'}"
                                                                    },
                                                                    {
                                                                        "type": "select",
                                                                        "name": "position",
                                                                        "label": "角标位置",
                                                                        "visibleOn": "this.commonBadge == 1",
                                                                        "required": true,
                                                                        "options": [
                                                                            {
                                                                                "label": "左上脚",
                                                                                "value": "top-left"
                                                                            },
                                                                            {
                                                                                "label": "右上脚",
                                                                                "value": "top-right"
                                                                            },
                                                                            {
                                                                                "label": "左下角",
                                                                                "value": "bottom-left"
                                                                            },
                                                                            {
                                                                                "label": "右下角",
                                                                                "value": "bottom-right"
                                                                            },
                                                                        ],
                                                                        "value": "${commonBadgeDetail.position || 'top-right'}"
                                                                    },
                                                                    {
                                                                        "type": "container",
                                                                        "className": "portal_badge",
                                                                        "body": [
                                                                        {
                                                                            "type": "input-text",
                                                                            "name": "badgeOffsetX",
                                                                            "label": "偏移量",
                                                                            "visibleOn": "this.commonBadge == 1",
                                                                            "className": "badgeOffsetX",
                                                                            "addOn": {
                                                                                "type": "button",
                                                                                "label": "X",
                                                                                "position": "left"
                                                                            },
                                                                            "required": true,
                                                                            "value": "${(commonBadgeDetail.offset)[0] || 0}"
                                                                        },
                                                                        {
                                                                            "type": "input-text",
                                                                            "name": "badgeOffsetY",
                                                                            "visibleOn": "this.commonBadge == 1",
                                                                            "label": "",
                                                                            "className": "portal_badge_Y",
                                                                            "addOn": {
                                                                                "type": "button",
                                                                                "label": "Y",
                                                                                "position": "left"
                                                                            },
                                                                            "required": true,
                                                                            "value": "${(commonBadgeDetail.offset)[1] || 0}"
                                                                        }]
                                                                    },
                                                                    {
                                                                        "type": "tree-select",
                                                                        "name": "homePageKey",
                                                                        "label": "首页",
                                                                        "placeholder": "请选择首页",
                                                                        "clearable": true,
                                                                        "visibleOn": "${type == 1}",
                                                                        "desc": "作为首页的页面不会出现在菜单导航中,为空时默认系统首页",
                                                                        "source": {
                                                                            "method": "get",
                                                                            "url": useDevBaseUrl("/app/portal/getPageManage"),
                                                                            adaptor: function (payload: any) {
                                                                                return {
                                                                                    ...payload,
                                                                                    status: payload.code,
                                                                                    data: {
                                                                                        ...payload.data,
                                                                                        options: payload?.data ? payload.data : [],
                                                                                    }
                                                                                };
                                                                            },
                                                                        }
                                                                    },
                                                                    {
                                                                        "label": "菜单导航",
                                                                        "name": "navigation",
                                                                        "asFormItem": true,
                                                                        "children": ({
                                                                            value,
                                                                            onChange,
                                                                            data
                                                                        }: {
                                                                            value: any,
                                                                            onChange: any,
                                                                            data: any
                                                                        }) => {
                                                                            return (
                                                                                <>
                                                                                    <MenuList data={data} value={value} sendValueToFather={(item) => onChange(item)}/>
                                                                                </>
                                                                            )
                                                                        }
                                                                    },
                                                                ]
                                                            
                                                            },
                                                            {
                                                                "title": "登录页配置",
                                                                "body": [
                                                                    {
                                                                        "type": "input-image",
                                                                        "label": "背景图",
                                                                        "name": "background",
                                                                        "maxSize": 51200,
                                                                        "receiver": {
                                                                            "method": "post",
                                                                            "url": useDevBaseUrl("/app/file/convert/base64"),
                                                                            adaptor: function (payload: any) {
                                                                                return {
                                                                                    ...payload,
                                                                                    status: payload.code,
                                                                                    data: {
                                                                                        "value": payload.data
                                                                                    }
                                                                                };
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "componentRoute",
                                                                        "label": "生成后路由地址",
                                                                        "placeholder": "请输入生成后路由地址",
                                                                        "visibleOn": "${type == 1}",
                                                                        "disabled": true,
                                                                    },
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "componentName",
                                                                        "label": "生成后组件名称",
                                                                        "placeholder": "请输入生成后组件名称",
                                                                        "visibleOn": "${type == 1}",
                                                                        "disabled": true,
                                                                    },
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                },
                                                "actions": [
                                                    {
                                                        "type": "button",
                                                        "label": "取消",
                                                        "close": true,
                                                    },
                                                    {
                                                        "type": "button",
                                                        "label": "确认",
                                                        "primary": true,
                                                        "actionType": "custom",
                                                        "onEvent": {
                                                            "click": {
                                                                "actions": [
                                                                    {
                                                                        "actionType": "validate",
                                                                        "componentId": "editPortal",
                                                                        "outputVar": 'validateResult'
                                                                    },
                                                                    {
                                                                        "actionType": "custom",
                                                                        "script": async function (context: any,doAction: any,event: any) {
                                                                            if(event.data.validateResult.error) return;
                                                                            let api = event;
                                                                            let id = api.data.id;
                                                                            let queryKey = api.data.queryKey;
                                                                            let portalName = api.data.portalName;
                                                                            let type = api.data.type;
                                                                            let sort = api.data.sort;
                                                                            let remark = api.data.remark;
                                                                            let logo = api.data.logo;
                                                                            let homePageKey = api.data.homePageKey;
                                                                            let background = api.data.background;
                                                                            let componentRoute = api.data.componentRoute;
                                                                            let componentName = api.data.componentName;
                                                                            let accessibleRoles = [];
                                                                            if(Array.isArray(api.data.accessibleRoles)){
                                                                                accessibleRoles = api.data.accessibleRoles;
                                                                            } else if(api.data.accessibleRoles == null || api.data.accessibleRoles == ''){
                                                                                accessibleRoles = []
                                                                            } else {
                                                                                accessibleRoles = api.data.accessibleRoles.split(',');
                                                                            }
                                                                            let navigation = api.data.navigation;
                                                                            let commonBadge = api.data.commonBadge;
                                                                            let commonBadgeVal = null;
                                                                            if(commonBadge == 0){
                                                                                commonBadgeVal = {};
                                                                            } else {
                                                                                if(api.data.mode == 'dot' || api.data.mode == 'ribbon'){
                                                                                    commonBadgeVal = {
                                                                                        mode: api.data.mode,
                                                                                        position: api.data.position,
                                                                                        size: api.data.size,
                                                                                        level: api.data.level,
                                                                                        offset: [api.data.badgeOffsetX,api.data.badgeOffsetY]
                                                                                    }
                                                                                } else if(api.data.mode == 'text'){
                                                                                    commonBadgeVal = {
                                                                                        mode: api.data.mode,
                                                                                        position: api.data.position,
                                                                                        overflowCount: api.data.overflowCount,
                                                                                        size: api.data.size,
                                                                                        level: api.data.level,
                                                                                        offset: [api.data.badgeOffsetX,api.data.badgeOffsetY]
                                                                                    }
                                                                                }
                                                                            }
                                                                            let apiData = {
                                                                                "id": id,
                                                                                "queryKey": queryKey,
                                                                                "portalName": portalName,
                                                                                "type": type,
                                                                                "sort": sort,
                                                                                "remark": remark,
                                                                                "logo": logo,
                                                                                "accessibleRoles": accessibleRoles,
                                                                                "navigation": navigation,
                                                                                "commonBadge": commonBadgeVal,
                                                                                "homePageKey": homePageKey,
                                                                                "background": background,
                                                                                "componentRoute": componentRoute,
                                                                                "componentName": componentName
                                                                            }
                                                                            let res = await getUpdatePortal(apiData)
                                                                            if(res.data.code != 0) {
                                                                                toast.error(res.data.msg, {
                                                                                    position: 'top-right'
                                                                                });
                                                                                return
                                                                            }
                                                                            doAction({
                                                                                actionType: "broadcast",
                                                                                "args": {
                                                                                    "eventName": "portalChange"
                                                                                }
                                                                            });
                                                                            doAction({ actionType: "closeDialog", componentId: "edit_portal_dialog",})
                                                                            doAction({ actionType: "reload", componentId: "portal_page" });
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }]
                                    }
                                },
                            },
                            {
                                "type": "container",
                                "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:portal:delete')}",
                                "body": [{
                                    "type": "icon",
                                    "icon": "far fa-trash",
                                    "className": "portalManage_list_icon",
                                },{
                                    "type": "tpl",
                                    "tpl": "删除",
                                }],
                                "onEvent": {
                                    "click": {
                                        "actions": [{
                                            "actionType": "dialog",
                                            "dialog": {
                                                "title": "系统消息",
                                                "body": [{
                                                    "type": "tpl",
                                                    "tpl": "您确认要删除${portalName}吗？"
                                                }],
                                                "onEvent": {
                                                    "confirm": {
                                                        "actions": [
                                                            {
                                                                "actionType": "ajax",
                                                                api: {
                                                                    url: useDevBaseUrl('/app/portal/delete?id=${id}'),
                                                                    method: 'delete'
                                                                }
                                                            },{
                                                                "actionType": "custom",
                                                                script: function (_, doAction, event) {
                                                                    doAction({ actionType: "reload", componentId: "portal_page" });
                                                                    // window.location.reload()
                                                                    doAction({
                                                                        actionType: "broadcast",
                                                                        "args": {
                                                                            "eventName": "portalChange"
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                            }
                                        }]
                                    }
                                }
                            }
                        ]
                    }]
                }]
            }]
        }
    }
}

export default () => <AMISComponent schema={schema} />;



