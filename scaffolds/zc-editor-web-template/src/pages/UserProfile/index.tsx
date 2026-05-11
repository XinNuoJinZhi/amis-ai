import {formatDate} from "@/utils/util"
import { updateUserProfileApi, getUserProfileApi, updateUserPwdApi, loginOutApi } from "@/api/login"
import { toast, confirm, } from 'amis'
import { removeToken } from '@/utils/auth'
import { useCache } from '@/hooks/web/useCache'
import avatarImg from '@/assets/imgs/avatar.gif'
import { useAdminBaseUrl, useDevBaseUrl } from "@/utils/util"
import { createMembership, createAppMembership, getMemberOrder, getAppMemberOrder, getMemberLevelList, getAppMemberLevelList, setOrderCancel, createDataManage, cancelDataManage, getDataMangeOrder, getRenewalVal, getAppRenewalVal } from "@/api/member"
import { isEditorialEnd, isAppEnd } from '@/utils/index'
import {AMISComponent} from "@/hooks/amis";
const { wsCache } = useCache()

const wsCacheSession = useCache('sessionStorage')
let getMemberDataApi = isAppEnd() ? useDevBaseUrl("/application/system/user/profile/getMemberData") : useDevBaseUrl("/system/user/profile/getMemberData")
const schema = {
    "type": "page",
    "className": "userProfile",
    "initApi": {
        "method": "get",
        "url":  useDevBaseUrl("/system/user/profile/get"),
        adaptor: function (payload:any) {
            payload.data.deptName = payload.data.dept?.name;
            payload.data.postName = payload.data.posts && payload.data.posts[0].name;
            payload.data.roles = payload.data.roles.map((role) => role.name).join(',')
            payload.data.avatar = payload.data.avatar ? payload.data.avatar : avatarImg
            payload.data.createTime = formatDate(payload.data.createTime)
            let showMemberFlag = true
            let showDataFlag = true
            if (payload.data.individualTenantFlag) { //游客租户不显示会员管理
                showMemberFlag = false
            } else {
                // if (payload.data.systemTenantFlag) {
                //     showMemberFlag = false
                //     showDataFlag = false
                // } else {
                    // 非系统租户的编辑端显示会员管理
                    showMemberFlag = true
                    showDataFlag = true
                // }
            }
            return {
                ...payload,
                status: payload.code,
                data: { ...payload.data, showMemberFlag: showMemberFlag, showDataFlag: showDataFlag}
            };
        }
    },
    "onEvent": {
        "init": {
            "actions": [
                {
                    "actionType": "custom",
                    "script": function(_, doAction, event){
                        doAction({
                            actionType: "changeActiveKey",
                            componentId: "tabs-change",
                            "args": {
                                "activeKey": 1
                            }
                        });
                    }
                }
            ]
        },
    },
    "initFetch": true,
    "body": {
        "type": "page",
        "className": "userProfile_page",
        "body": {
            "type": "tabs",
            "id": "tabs-change",
            "tabsMode": "vertical",
            "tabs": [
                {
                    "title": "个人资料",
                    "tab": [{
                        "type": "wrapper",
                        "className": "userProfile",
                        "body": [
                            {
                                "type": "wrapper",
                                "className": "user_info",
                                "body":[
                                    {
                                        "type": "form",
                                        "title": '',
                                        "actions": [],
                                        "labelAlign": "left",
                                        "body": [{
                                            "type": "tpl",
                                            "tpl": "个人信息",
                                            "className": "personInfo"
                                        },{
                                            "type": "divider"
                                        },{
                                            "type": "input-image",
                                            "className": "user_info_image",
                                            "name": "avatar",
                                            "label": "",
                                            "receiver": {
                                                "method": "post",
                                                "url": useDevBaseUrl("/system/user/profile/update-avatar"),
                                                adaptor: function (payload: any) {
                                                    return {
                                                        ...payload,
                                                        status: payload.code,
                                                        data: {
                                                            "value": payload.data
                                                        }
                                                    };
                                                }
                                            },
                                            "onEvent": {
                                                "success": {
                                                    "actions": [
                                                        {
                                                            "actionType": "custom",
                                                            "script": function (_,doAction,event) {
                                                                event.data.__super.avatar = event.data.value
                                                                event.data.__super.__super.__super.avatar = event.data.value
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },{
                                            "type": "divider"
                                        },{
                                            "type": "input-text",
                                            "name": "username",
                                            "label": "用户名称",
                                            "static": true,
                                            "icon": "fa fa:user-o",
                                            "mode": "horizontal",
                                            "horizontal": {
                                                "left": 4,
                                                "right": 8,
                                                "offset": 2
                                            },
                                        },{
                                            "type": "divider"
                                        },{
                                            "type": "input-text",
                                            "name": "mobile",
                                            "label": "手机号码",
                                            "static": true,
                                            "mode": "horizontal",
                                            "horizontal": {
                                                "left": 4,
                                                "right": 8,
                                                "offset": 2
                                            },
                                        },{
                                            "type": "divider"
                                        },{
                                            "type": "input-text",
                                            "name": "email",
                                            "label": "用户邮箱",
                                            "static": true,
                                            "mode": "horizontal",
                                            "horizontal": {
                                                "left": 4,
                                                "right": 8,
                                                "offset": 2
                                            },
                                        },{
                                            "type": "divider"
                                        },{
                                            "type": "input-text",
                                            "name": "deptName",
                                            "label": "所属部门",
                                            "static": true,
                                            "mode": "horizontal",
                                            "horizontal": {
                                                "left": 4,
                                                "right": 8,
                                                "offset": 2
                                            },
                                        },{
                                            "type": "divider"
                                        },
                                        // {
                                        //     "type": "input-text",
                                        //     "name": "postName",
                                        //     "label": "所属岗位",
                                        //     "static": true,
                                        //     "mode": "horizontal",
                                        //     "horizontal": {
                                        //         "left": 4,
                                        //         "right": 8,
                                        //         "offset": 2
                                        //     },
                                        // },
                                        // {
                                        //     "type": "divider"
                                        // },
                                        {
                                            "type": "input-text",
                                            "name": "roles",
                                            "label": "所属角色",
                                            "static": true,
                                            "mode": "horizontal",
                                            "horizontal": {
                                                "left": 4,
                                                "right": 8,
                                                "offset": 2
                                            },
                                        },{
                                            "type": "divider"
                                        },{
                                            "type": "input-text",
                                            "name": "createTime",
                                            "label": "创建日期",
                                            "static": true,
                                            "mode": "horizontal",
                                            "horizontal": {
                                                "left": 4,
                                                "right": 8,
                                                "offset": 2
                                            },
                                        },{
                                            "type": "divider"
                                        }]
                                    }
                                ]
                            },
                            {
                                "type": "page",
                                "className": "basic_info",
                                "body": {
                                    "type": "form",
                                    "title": '',
                                    "actions": [],
                                    "labelAlign": "left",
                                    "mode": "horizontal",
                                    "horizontal": {
                                        "left": 4,
                                        "right": 10,
                                        "offset": 2
                                    },
                                    "body": [{
                                        "type": "tpl",
                                        "tpl": "基本信息",
                                        "className": "personInfo"
                                    },{
                                        "type": "divider"
                                    },{
                                        "type": "tabs",
                                        "swipeable": true,
                                        "tabs": [
                                            {
                                                "title": "基本资料",
                                                "tab":  [{
                                                    "type": "form",
                                                    "id": "form_basic",
                                                    "title": '',
                                                    "labelAlign": "right",
                                                    "mode": "horizontal",
                                                    "horizontal": {
                                                        "left": 2,
                                                        "right": 10,
                                                        "offset": 2
                                                    },
                                                    "wrapWithPanel": false,
                                                    "body": [
                                                        {

                                                            "type": "input-text",
                                                            "name": "nickname",
                                                            "id": "nickname",
                                                            "label": "用户昵称",
                                                            "required": true,
                                                        },
                                                        {

                                                            "type": "input-text",
                                                            "name": "mobile",
                                                            "id": "mobile",
                                                            "label": "手机号码",
                                                            "required": true,
                                                            "validateOnChange": true,
                                                            "validations": {
                                                                "isPhoneNumber": true,
                                                            },
                                                        },
                                                        {

                                                            "type": "input-email",
                                                            "name": "email",
                                                            "id": "email",
                                                            "label": "用户邮箱",
                                                            "required": true,
                                                            "validateOnChange": true,
                                                            "validations": {
                                                                "isEmail": true
                                                            },
                                                        },
                                                        {

                                                            "type": "radios",
                                                            "name": "sex",
                                                            "id": "sex",
                                                            "label": "性别",
                                                            "options": [
                                                                {
                                                                    "label": "男",
                                                                    "value": 1
                                                                },
                                                                {
                                                                    "label": "女",
                                                                    "value": 2
                                                                },

                                                            ]
                                                        },
                                                        {
                                                            "type":'container',
                                                            "className": "individual_save_button",
                                                            "body":[{
                                                                "type": "button",
                                                                "label": "保存",
                                                                "primary": true,
                                                                "className": "save_button",
                                                                "onEvent": {
                                                                    "click": {
                                                                        "actions": [
                                                                            {
                                                                                "actionType": "validate",
                                                                                "componentId": "form_basic",
                                                                            },
                                                                            {
                                                                                "actionType": "custom",
                                                                                "script": async function(data:any){
                                                                                    const cfg = data.props.data;
                                                                                    if(cfg.nickname == '' || cfg.mobile == '' || cfg.email == ''){
                                                                                        return;
                                                                                    }
                                                                                    let params = data.props.data.__super.__super.__super.__super;
                                                                                    let paramsCfg = {...params, ...cfg}
                                                                                    const res = await updateUserProfileApi(paramsCfg)
                                                                                    if(res.data.code == 0) {
                                                                                        //保存成功
                                                                                        toast.success('修改成功', {
                                                                                            position: 'top-center'
                                                                                        });
                                                                                        await getUserProfileApi()
                                                                                    } else {
                                                                                        toast.error(res.data.msg, {
                                                                                            position: 'top-center'
                                                                                        });
                                                                                    }
                                                                                },
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                "type": "button",
                                                                "label": '重置',
                                                                "level": "danger",
                                                                "className": "reset_button",
                                                                "onEvent": {
                                                                    "click": {
                                                                        "actions": [
                                                                            {
                                                                                "actionType": "custom",
                                                                                "script": async function (_, doAction, event) {
                                                                                    let res = await getUserProfileApi()
                                                                                    doAction({
                                                                                        actionType: "setValue",
                                                                                        componentId: "nickname",
                                                                                        "args": {
                                                                                            "value": res.data.data.nickname
                                                                                        }
                                                                                    });
                                                                                    doAction({
                                                                                        actionType: "setValue",
                                                                                        componentId: "mobile",
                                                                                        "args": {
                                                                                            "value": res.data.data.mobile
                                                                                        }
                                                                                    });
                                                                                    doAction({
                                                                                        actionType: "setValue",
                                                                                        componentId: "email",
                                                                                        "args": {
                                                                                            "value": res.data.data.email
                                                                                        }
                                                                                    });
                                                                                    doAction({
                                                                                        actionType: "setValue",
                                                                                        componentId: "sex",
                                                                                        "args": {
                                                                                            "value": res.data.data.sex
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            }]
                                                        },
                                                    ]
                                                },
                                            ]
                                            },
                                            {
                                                "title": "修改密码",
                                                "tab":  [{
                                                    "type": "form",
                                                    "id": "form_modify_password",
                                                    "title": '',
                                                    "labelAlign": "right",
                                                    "mode": "horizontal",
                                                    "horizontal": {
                                                        "left": 2,
                                                        "right": 10,
                                                        "offset": 2
                                                    },
                                                    "wrapWithPanel": false,
                                                    "body": [
                                                        {

                                                            "type": "input-password",
                                                            "name": "oldPassword",
                                                            "id": "oldPassword",
                                                            "label": "旧密码",
                                                            "required": true,
                                                        },
                                                        {

                                                            "type": "input-password",
                                                            "name": "newPassword",
                                                            "id": "newPassword",
                                                            "label": "新密码",
                                                            "required": true,
                                                        },
                                                        {

                                                            "type": "input-password",
                                                            "name": "confirmPassword",
                                                            "id": "confirmPassword",
                                                            "label": "确认密码",
                                                            "required": true,
                                                        },
                                                        {
                                                            "type":'container',
                                                            "className": "individual_save_button",
                                                            "body":[
                                                                {
                                                                    "type": "button",
                                                                    "label": "保存",
                                                                    "primary": true,
                                                                    "className": "save_button",
                                                                    "onEvent": {
                                                                        "click": {
                                                                            "actions": [
                                                                                {
                                                                                    "actionType": "validate",
                                                                                    "componentId": "form_modify_password",
                                                                                },
                                                                                {
                                                                                    "actionType": "custom",
                                                                                    "script": async function(data,doAction,event){
                                                                                        const cfg = data.props.data;
                                                                                        if(cfg.oldPassword == undefined || cfg.newPassword == undefined || cfg.confirmPassword == undefined){
                                                                                            return;
                                                                                        }
                                                                                        if(cfg.oldPassword && cfg.newPassword &&  cfg.oldPassword == cfg.newPassword){
                                                                                            toast.error('新密码不能与旧密码一致', {
                                                                                                position: 'top-center'
                                                                                            });
                                                                                            return;
                                                                                        }
                                                                                        if(cfg.confirmPassword && cfg.newPassword &&  cfg.confirmPassword != cfg.newPassword){
                                                                                            toast.error('新密码与确认密码应一致', {
                                                                                                position: 'top-center'
                                                                                            });
                                                                                            return;
                                                                                        }
                                                                                        let oldPassword = data.props.data.oldPassword;
                                                                                        let newPassword = data.props.data.newPassword;
                                                                                        let res = await updateUserPwdApi(oldPassword, newPassword)
                                                                                        if(res.data.code == 500 || res.data.code == 400){
                                                                                            toast.error(res.data.msg, {
                                                                                                position: 'top-center'
                                                                                            })
                                                                                            return
                                                                                        }
                                                                                        //保存成功
                                                                                        toast.success('修改成功', {
                                                                                            position: 'top-center'
                                                                                        });
                                                                                        //todo
                                                                                        confirm('需重新登录后才能进行其他操作', '提示','OK','').then(async(res) =>{
                                                                                            if(res){
                                                                                                await loginOutApi()
                                                                                                removeToken()
                                                                                                wsCache.clear()
                                                                                                wsCacheSession.wsCache.clear()
                                                                                                location.reload()
                                                                                            }
                                                                                        })
                                                                                    },
                                                                                },
                                                                            ]
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    "type": "reset",
                                                                    "label": '重置',
                                                                    "level": "danger",
                                                                    "className": "reset_button",
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                }]
                                            }
                                        ]
                                    }]
                                }
                            },
                        ]
                    }]
                },
                {
                    "title": "所属角色",
                    "tab": [{
                        "type": "page",
                        "body": [{
                            "type": "page",
                            "body": {
                                "type": "crud",
                                "combineNum": 1,
                                "autoFillHeight": true,
                                "api": {
                                    "method": "get",
                                    "url": useAdminBaseUrl("/system/user/profile/getRoles"),
                                    adaptor: function (payload: any) {
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, items:payload?.data? payload.data : [] }
                                        };
                                    },
                                },
                                "columns": [
                                    {
                                        "name": "companyName",
                                        "label": "租户名",
                                    },
                                    {
                                        "name": "appName",
                                        "label": "应用名",
                                    },
                                    {
                                        "name": "roleName",
                                        "label": "角色名"
                                    },
                                ]
                            }
                        }]
                    }]
                },
                {
                    "title": "会员管理",
                    "visibleOn": isAppEnd() ? "${showMemberFlag}" : "${false}",
                    "className": "userProfile_member",
                    "tab": [{
                        "type": "page",
                        "id": "page_refresh",
                        "initApi": {
                            "method": "get",
                            "url":  getMemberDataApi,
                            adaptor: async function (payload:any) {
                                let memberLevels:any = []
                                let nonMember = false
                                let memLevelRes
                                let platformFreeMemberFlag = false // 是否显示限时免费会员
                                let platformFreeMemberInfo = {} // 是否显示限时免费会员信息
                                if (isEditorialEnd()) {
                                    memLevelRes = await getMemberLevelList()
                                } else {
                                    memLevelRes = await getAppMemberLevelList()
                                }
                                let memLevelList = memLevelRes.data.data
                                memLevelList.forEach(m=>{
                                    m.monthPriceOpen = (m.monthPrice/100).toFixed(2)
                                    m.quarterPriceOpen = (m.quarterPrice/100).toFixed(2)
                                    m.yearPriceOpen = (m.yearPrice/100).toFixed(2)
                                })
                                if (isEditorialEnd()) {
                                    if(payload.data.platformMemberLevels.length > 0) {
                                        const maxLevel = payload.data.platformMemberLevels.reduce((max, current) => {
                                            return current.level > max ? current.level : max;
                                        }, payload.data.platformMemberLevels[0]?.level ?? 0);
                                        nonMember = false
                                        payload.data.platformMemberLevels.forEach(i=>{
                                            let targetLevelList = memLevelList.filter(item=>item.level > maxLevel)
                                            if (i.icon == null){
                                                i.icon = ''
                                            }
                                            targetLevelList.forEach(obj=>{
                                                obj.monthPriceUpdate = (obj.monthPrice/100).toFixed(2)
                                                obj.quarterPriceUpdate = (obj.quarterPrice/100).toFixed(2)
                                                obj.yearPriceUpdate = (obj.yearPrice/100).toFixed(2)
                                            })
                                            i.targetLevelOptions = targetLevelList
                                            i.monthPrice = (i.monthPrice/100).toFixed(2)
                                            i.quarterPrice = (i.quarterPrice/100).toFixed(2)
                                            i.yearPrice = (i.yearPrice/100).toFixed(2)
                                        })
                                        memberLevels = payload.data.platformMemberLevels

                                        //限时免费会员信息
                                        const platformFreeMaxLevel = payload.data.platformFreeMemberLevels.reduce((max, current) => {
                                            return current.level > max ? current.level : max;
                                        }, payload.data.platformFreeMemberLevels[0]?.level ?? 0);
                                        if(platformFreeMaxLevel > maxLevel) {
                                            platformFreeMemberFlag = true
                                        }
                                        platformFreeMemberInfo = payload?.data?.platformFreeMemberLevels?.filter(i=> i.level == platformFreeMaxLevel)[0]

                                    } else {
                                        memberLevels = [{
                                            name: "非会员",
                                            icon: '',
                                            expireTime: '',
                                        }]
                                        nonMember = true
                                        const platformFreeMaxLevel = payload.data.platformFreeMemberLevels.reduce((max, current) => {
                                            return current.level > max ? current.level : max;
                                        }, payload.data.platformFreeMemberLevels[0]?.level ?? 0);
                                        if(platformFreeMaxLevel) {
                                            platformFreeMemberFlag = true
                                        }
                                        platformFreeMemberInfo = payload?.data?.platformFreeMemberLevels?.filter(i=> i.level == platformFreeMaxLevel)[0]
                                    }
                                } else {
                                    if(payload.data.appMemberLevels.length > 0) {
                                        nonMember = false
                                        const maxLevel = payload.data.appMemberLevels.reduce((max, current) => {
                                            return current.level > max ? current.level : max;
                                        }, payload.data.appMemberLevels[0]?.level ?? 0);
                                        payload.data.appMemberLevels.forEach(i=>{
                                            let targetLevelList = memLevelList.filter(item=>item.level > maxLevel)
                                            if (i.icon == null){
                                                i.icon = ''
                                            }
                                            targetLevelList.forEach(obj=>{
                                                obj.monthPriceUpdate = (obj.monthPrice/100).toFixed(2)
                                                obj.quarterPriceUpdate = (obj.quarterPrice/100).toFixed(2)
                                                obj.yearPriceUpdate = (obj.yearPrice/100).toFixed(2)
                                            })
                                            i.targetLevelOptions = targetLevelList
                                            i.monthPrice = (i.monthPrice/100).toFixed(2)
                                            i.quarterPrice = (i.quarterPrice/100).toFixed(2)
                                            i.yearPrice = (i.yearPrice/100).toFixed(2)
                                        })
                                        memberLevels = payload.data.appMemberLevels

                                        //限时免费会员信息
                                        const platformFreeMaxLevel = payload.data.appFreeMemberLevels.reduce((max, current) => {
                                            return current.level > max ? current.level : max;
                                        }, payload.data.appFreeMemberLevels[0]?.level ?? 0);
                                        if(platformFreeMaxLevel > maxLevel) {
                                            platformFreeMemberFlag = true
                                        }
                                        platformFreeMemberInfo = payload?.data?.appFreeMemberLevels?.filter(i=> i.level == platformFreeMaxLevel)[0]
                                    } else {
                                        memberLevels = [{
                                            name: "非会员",
                                            icon: '',
                                            expireTime: '',
                                        }]
                                        nonMember = true

                                        const platformFreeMaxLevel = payload.data.appFreeMemberLevels.reduce((max, current) => {
                                            return current.level > max ? current.level : max;
                                        }, payload.data.appFreeMemberLevels[0]?.level ?? 0);
                                        if(platformFreeMaxLevel) {
                                            platformFreeMemberFlag = true
                                        }
                                        platformFreeMemberInfo = payload?.data?.appFreeMemberLevels?.filter(i=> i.level == platformFreeMaxLevel)[0]
                                    }
                                }
                                //targetLevelOptions 开通会员使用
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: { ...payload.data, memberLevels: memberLevels, targetLevelOptionsCreate: memLevelList,  nonMember: nonMember, platformFreeMemberFlag: platformFreeMemberFlag, platformFreeMemberInfo: platformFreeMemberInfo}
                                };
                            }
                        },
                        "body": [
                            {
                                "type": "wrapper",
                                "body": [
                                    {
                                        "type": "form",
                                        "mode": "horizontal",
                                        "title": "限时免费会员信息",
                                        "visibleOn": "${platformFreeMemberFlag}",
                                        "actions": [],
                                        "body": [
                                            {
                                                "type": "input-text",
                                                "label": "等级名称",
                                                "name": "name",
                                                "static": true,
                                                "value": "${platformFreeMemberInfo.name}"
                                            },
                                            {
                                                "name": "icon",
                                                "label": "等级图标",
                                                "type": "static-image",
                                                "value": "${platformFreeMemberInfo.icon}"
                                            },
                                            {
                                                "name": "trialExpiryDate",
                                                "label": "到期时间",
                                                "type": "input-text",
                                                "static": true,
                                                "value": "${platformFreeMemberInfo.trialExpiryDate}"
                                            },
                                            {
                                                "name": "remark",
                                                "label": "等级描述",
                                                "type": "input-text",
                                                "static": true,
                                                "value": "${platformFreeMemberInfo.remark}"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "type": "each",
                                "name": "memberLevels",
                                "className": "member_list",
                                "items": {
                                    "type": "wrapper",
                                    "body": [{
                                        "type": "wrapper",
                                        "className": "member_list_one",
                                        "body": [
                                            {
                                                "type": "form",
                                                "mode": "horizontal",
                                                "title": "会员信息${highestLevelFlag ? '（当前）' : ''}",
                                                "actions": [],
                                                "body": [
                                                    {
                                                        "type": "input-text",
                                                        "label": "等级名称",
                                                        "name": "name",
                                                        "static": true,
                                                        "value": "${name}"
                                                    },
                                                    {
                                                        "name": "icon",
                                                        "label": "等级图标",
                                                        "type": "static-image",
                                                        "value": "${icon}"
                                                    },
                                                    {
                                                        "name": "expireTime",
                                                        "label": "到期时间",
                                                        "type": "input-text",
                                                        "static": true,
                                                        "value": "${expireTime}"
                                                    },
                                                    {
                                                        "name": "remark",
                                                        "label": "等级描述",
                                                        "type": "input-text",
                                                        "static": true,
                                                        "value": "${remark}"
                                                    },
                                                    {
                                                        "type": "form",
                                                        "mode": "horizontal",
                                                        "title": "会员续费",
                                                        "visibleOn": "${!nonMember}",
                                                        "body": [
                                                            {
                                                                "name": "paymentCycle",
                                                                "type": "radios",
                                                                "label": "开通方式",
                                                                "required": true,
                                                                "value": 1,
                                                                "options": [
                                                                    {
                                                                        "label": "按月",
                                                                        "value": 1
                                                                    },
                                                                    {
                                                                        "label": "按季度",
                                                                        "value": 2
                                                                    },
                                                                    {
                                                                        "label": "按年",
                                                                        "value": 3
                                                                    },
                                                                ],
                                                                "onEvent": {
                                                                    "change": {
                                                                        "actions": [
                                                                            {
                                                                                "actionType": "custom",
                                                                                "script": async function(context: any, doAction: any, event: any) {
                                                                                    const selected = context.props.data.__super
                                                                                    if(event.data.value == 1) {
                                                                                        setTimeout(()=>{
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '月'
                                                                                                }
                                                                                            })
                                                                                        }, 500)
                                                                                    }
                                                                                    if(event.data.value == 2) {
                                                                                        setTimeout(()=>{
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '季度'
                                                                                                }
                                                                                            })
                                                                                        }, 500)
                                                                                    }
                                                                                    if(event.data.value == 3) {
                                                                                        setTimeout(()=>{
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '年'
                                                                                                }
                                                                                            })
                                                                                        }, 500)
                                                                                    }
                                                                                    const params = {
                                                                                        "memberLevelId": selected.id,
                                                                                        "paymentCycle": event.data.paymentCycle,
                                                                                        "productCount": event.data.productCount,
                                                                                        "memberOrderType": 1,
                                                                                        "channelCode": event.data.channelCode
                                                                                    }
                                                                                    let res;
                                                                                    if (isEditorialEnd()) {
                                                                                        res = await getRenewalVal(params)
                                                                                    } else {
                                                                                        res = await getAppRenewalVal(params)
                                                                                    }
                                                                                    const val = (res.data.data/100).toFixed(2)
                                                                                    doAction({
                                                                                        actionType: 'setValue',
                                                                                        componentId: 'renewalVal',
                                                                                        args: {
                                                                                            value: val
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                "name": "monthPrice",
                                                                "label": "每月/元",
                                                                "type": "input-text",
                                                                "static": true,
                                                                "visibleOn": "${paymentCycle == 1}",
                                                            },
                                                            {
                                                                "name": "quarterPrice",
                                                                "label": "季度/元",
                                                                "type": "input-text",
                                                                "static": true,
                                                                "visibleOn": "${paymentCycle == 2}"
                                                            },
                                                            {
                                                                "name": "yearPrice",
                                                                "label": "年/元",
                                                                "type": "input-text",
                                                                "static": true,
                                                                "visibleOn": "${paymentCycle == 3}"
                                                            },
                                                            {
                                                                "type": "container",
                                                                "className": "member_fee_info",
                                                                "body": [
                                                                    {
                                                                        "type": "input-number",
                                                                        "label": "开通时长",
                                                                        "name": "productCount",
                                                                        "visibleOn": "${paymentCycle}",
                                                                        "value": 1,
                                                                        "min": 1,
                                                                        "required": true,
                                                                        "onEvent": {
                                                                            "change": {
                                                                                "actions": [
                                                                                    {
                                                                                        "actionType": "custom",
                                                                                        "script": async function(context: any, doAction: any, event: any){
                                                                                            const selected = context.props.data.__super
                                                                                            const params = {
                                                                                                "memberLevelId": selected.id,
                                                                                                "paymentCycle": event.data.paymentCycle,
                                                                                                "productCount": event.data.productCount,
                                                                                                "memberOrderType": 1,
                                                                                                "channelCode": event.data.channelCode
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalVal',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "units",
                                                                        "static": true,
                                                                        "labelWidth": 1,
                                                                        "visibleOn": "${paymentCycle}",
                                                                        "value": "月"
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                "name": "channelCode",
                                                                "type": "radios",
                                                                "label": "支付渠道",
                                                                "visibleOn": "${paymentCycle}",
                                                                "required": true,
                                                                "value": "wx_qr",
                                                                "options": [
                                                                    {
                                                                        "label": "微信",
                                                                        "value": "wx_qr"
                                                                    },
                                                                    {
                                                                        "label": "支付宝",
                                                                        "value": "alipay_qr"
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "static": true,
                                                                "label": "报价/元",
                                                                "name": "renewalVal",
                                                                "value": "${monthPrice}",
                                                                "id": "renewalVal"
                                                            },
                                                        ],
                                                        "actions": [
                                                            {
                                                                "type": "button",
                                                                "label": "提交",
                                                                "level": "primary",
                                                                "actionType": "submit",
                                                                "onEvent": {
                                                                    "click": {
                                                                        "actions": [{
                                                                            "actionType": "custom",
                                                                            "script": async function (context: any, doAction: any, event: any) {
                                                                                const selected = context.props.data.__super
                                                                                const params = {
                                                                                    "memberLevelId": selected.id,
                                                                                    "paymentCycle": event.data.paymentCycle,
                                                                                    "productCount": event.data.productCount,
                                                                                    "memberOrderType": 1,
                                                                                    "channelCode": event.data.channelCode
                                                                                }
                                                                                const submitFun = async() => {
                                                                                    let res
                                                                                    if (isEditorialEnd()) {
                                                                                        res = await createMembership(params)
                                                                                    } else {
                                                                                        res = await createAppMembership(params)
                                                                                    }

                                                                                    if(res.data.code == 0) {
                                                                                        const displayContent = res.data.data.displayContent
                                                                                        const price = (res.data.data.price/100).toFixed(2)
                                                                                        const orderId = res.data.data.payOrderId
                                                                                        const tenantId = res.data.data.tenantId
                                                                                        let timer:any;
                                                                                        doAction({
                                                                                            "actionType": "dialog",
                                                                                            "dialog": {
                                                                                                "size": "sm",
                                                                                                "title": `请支付${price}元`,
                                                                                                "id": "payment",
                                                                                                "showCloseButton": false,
                                                                                                "body": [
                                                                                                    {
                                                                                                        "type": "form",
                                                                                                        "body": [
                                                                                                            {
                                                                                                                "type": "qr-code",
                                                                                                                "codeSize": 128,
                                                                                                                "value": displayContent,
                                                                                                                "style": {"textAlign":"center"},
                                                                                                            }
                                                                                                        ]
                                                                                                    }
                                                                                                ],
                                                                                                "actions": [{
                                                                                                    "type": "button",
                                                                                                    "label": "取消订单",
                                                                                                    "onEvent": {
                                                                                                        "click": {
                                                                                                            "actions": [
                                                                                                                {
                                                                                                                    "actionType": "custom",
                                                                                                                    "script": async function (context: any, doAction: any, event: any) {
                                                                                                                        const orderId = res.data.data.payOrderId
                                                                                                                        const tenantId = res.data.data.tenantId
                                                                                                                        confirm('是否确认取消支付订单？', '提示','确定','取消').then(async(result) =>{
                                                                                                                            //true 确定 false 取消
                                                                                                                            if(result){
                                                                                                                                //点击确定的话，关闭弹窗，请求接口，取消支付
                                                                                                                                const res2 = await setOrderCancel(orderId, tenantId)
                                                                                                                                if (res2.data.code != 0) {
                                                                                                                                    toast.error(res2.data.msg, {
                                                                                                                                        position: 'top-right'
                                                                                                                                    })
                                                                                                                                } else {
                                                                                                                                    doAction({
                                                                                                                                        "actionType": "close",
                                                                                                                                        "componentId": "payment",
                                                                                                                                    })
                                                                                                                                    doAction({
                                                                                                                                        "actionType": "reload",
                                                                                                                                        "componentId": "page_refresh",
                                                                                                                                    })
                                                                                                                                }

                                                                                                                            } else {
                                                                                                                                //点击取消的话，继续支付
                                                                                                                            }
                                                                                                                        })
                                                                                                                    }
                                                                                                                }
                                                                                                            ]
                                                                                                        }
                                                                                                    },
                                                                                                }]
                                                                                            }
                                                                                        })
                                                                                        const fetchData = async() => {
                                                                                            try {
                                                                                                let res
                                                                                                if (isEditorialEnd()) {
                                                                                                    res = await getMemberOrder(orderId, tenantId)
                                                                                                } else {
                                                                                                    res = await getAppMemberOrder(orderId, tenantId)
                                                                                                }
                                                                                                if(res.data.code == 0) {
                                                                                                    // 10 支付成功 30 支付关闭
                                                                                                    if (res.data.data.payOrder.status == 30) {
                                                                                                        // 清除定时器，停止后续请求
                                                                                                        clearInterval(timer);
                                                                                                        doAction({
                                                                                                            "actionType": "close",
                                                                                                            "componentId": "payment",
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "reload",
                                                                                                            "componentId": "page_refresh",
                                                                                                        })
                                                                                                        toast.success('订单支付取消成功', {
                                                                                                            position: 'top-right'
                                                                                                        })
                                                                                                    }
                                                                                                    if(res.data.data.payOrder.status == 10 && res.data.data.memberOrder.payStatus) {
                                                                                                        // 清除定时器，停止后续请求
                                                                                                        clearInterval(timer);
                                                                                                        doAction({
                                                                                                            "actionType": "close",
                                                                                                            "componentId": "payment",
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "reload",
                                                                                                            "componentId": "page_refresh",
                                                                                                        })
                                                                                                        toast.success('会员续费成功', {
                                                                                                            position: 'top-right'
                                                                                                        })
                                                                                                    }
                                                                                                } else {
                                                                                                    toast.error(res.data.msg, {
                                                                                                        position: 'top-right'
                                                                                                    })
                                                                                                }
                                                                                            } catch (e){
                                                                                                clearInterval(timer);
                                                                                            }
                                                                                        }
                                                                                        // 每隔一秒执行一次请求
                                                                                        timer = setInterval(fetchData, 1000);
                                                                                        // 初始时立即执行一次
                                                                                        fetchData();
                                                                                    } else {
                                                                                        toast.error(res.data.msg, {
                                                                                            position: 'top-right'
                                                                                        })
                                                                                    }
                                                                                }
                                                                                if(event.data.paymentCycle == 1 && event.data.productCount >= 3 && event.data.productCount < 12) {
                                                                                    confirm('按季度续费有折扣，是否按季度续费', '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            //点击确定的话，弹窗消失，开通方式显示按季度
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "paymentCycle",
                                                                                                "args": {
                                                                                                    "value": 2
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "productCount",
                                                                                                "args": {
                                                                                                    "value": 1
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '季度'
                                                                                                }
                                                                                            })
                                                                                            const params = {
                                                                                                "memberLevelId": selected.id,
                                                                                                "paymentCycle": 2,
                                                                                                "productCount": 1,
                                                                                                "memberOrderType": 1,
                                                                                                "channelCode": event.data.channelCode
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalVal',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        } else {
                                                                                            //点击取消的话，按当前充值
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                } else if (event.data.paymentCycle == 1 && event.data.productCount >= 12) {
                                                                                    confirm('按年度续费有折扣，是否按年度续费', '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            //点击确定的话，弹窗消失，开通方式显示按年度
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "paymentCycle",
                                                                                                "args": {
                                                                                                    "value": 3
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "productCount",
                                                                                                "args": {
                                                                                                    "value": 1
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '年'
                                                                                                }
                                                                                            })
                                                                                            const params = {
                                                                                                "memberLevelId": selected.id,
                                                                                                "paymentCycle": 3,
                                                                                                "productCount": 1,
                                                                                                "memberOrderType": 1,
                                                                                                "channelCode": event.data.channelCode
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalVal',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        } else {
                                                                                            //点击取消的话，按当前充值
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                }else if(event.data.paymentCycle == 2 && event.data.productCount >= 4) {
                                                                                    confirm('按年度续费有折扣，是否按年度续费', '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            //点击确定的话，弹窗消失，开通方式显示按年度
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "paymentCycle",
                                                                                                "args": {
                                                                                                    "value": 3
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "productCount",
                                                                                                "args": {
                                                                                                    "value": 1
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '年'
                                                                                                }
                                                                                            })
                                                                                            const params = {
                                                                                                "memberLevelId": selected.id,
                                                                                                "paymentCycle": 3,
                                                                                                "productCount": 1,
                                                                                                "memberOrderType": 1,
                                                                                                "channelCode": event.data.channelCode
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalVal',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        } else {
                                                                                            //点击取消的话，按当前充值
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                } else {
                                                                                    confirm('你确定要续费吗？', '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                }
                                                                            }
                                                                        }]
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                    },
                                                    {
                                                        "type": "form",
                                                        "mode": "horizontal",
                                                        "name": "memberShip_upgrade",
                                                        "title": "会员升级",
                                                        "visibleOn": "${!nonMember && targetLevelOptions.length > 0 && highestLevelFlag}",
                                                        "body": [
                                                            {
                                                                "label": "目标等级",
                                                                "type": "select",
                                                                "name": "memberLevelId",
                                                                "valueField": "id",
                                                                "labelField": "name",
                                                                "source": "${targetLevelOptions}",
                                                                "required": true,
                                                                "onEvent": {
                                                                    "change": {
                                                                        "actions": [
                                                                            {
                                                                                "actionType": "custom",
                                                                                "script": async function(context: any, doAction: any, event: any) {
                                                                                    setTimeout(()=>{
                                                                                        if(context.props.data.paymentCycle == 1) {
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '月'
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "monthPriceUpdate",
                                                                                                "args": {
                                                                                                    "value": event.data.selectedItems.monthPriceUpdate
                                                                                                }
                                                                                            })
                                                                                        } else if(context.props.data.paymentCycle == 2) {
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '季度'
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "quarterPriceUpdate",
                                                                                                "args": {
                                                                                                    "value": event.data.selectedItems.quarterPriceUpdate
                                                                                                }
                                                                                            })
                                                                                        } else {
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '年'
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "yearPriceUpdate",
                                                                                                "args": {
                                                                                                    "value": event.data.selectedItems.yearPriceUpdate
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    }, 1000)
                                                                                    const currentMember = context.props.data.__super.item
                                                                                    const params = {
                                                                                        "currentMemberLevelId": currentMember.id,
                                                                                        "memberLevelId": event.data.memberLevelId,
                                                                                        "memberOrderType": 2,
                                                                                        "channelCode": 'alipay_qr',
                                                                                        "paymentCycle": 1,
                                                                                        "productCount": 1,
                                                                                    }

                                                                                    let res;
                                                                                    if (isEditorialEnd()) {
                                                                                        res = await getRenewalVal(params)
                                                                                    } else {
                                                                                        res = await getAppRenewalVal(params)
                                                                                    }
                                                                                    const val = (res.data.data/100).toFixed(2)
                                                                                    setTimeout(()=>{
                                                                                        doAction({
                                                                                            actionType: 'setValue',
                                                                                            componentId: 'renewalUpdate',
                                                                                            args: {
                                                                                                value: val
                                                                                            }
                                                                                        });
                                                                                    },1000)
                                                                                }
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                "name": "paymentCycle",
                                                                "type": "radios",
                                                                "label": "开通方式",
                                                                "visibleOn": "${memberLevelId}",
                                                                "required": true,
                                                                "value": 1,
                                                                "options": [
                                                                    {
                                                                        "label": "按月",
                                                                        "value": 1
                                                                    },
                                                                    {
                                                                        "label": "按季度",
                                                                        "value": 2
                                                                    },
                                                                    {
                                                                        "label": "按年",
                                                                        "value": 3
                                                                    },
                                                                ],
                                                                "onEvent": {
                                                                    "change": {
                                                                        "actions": [
                                                                            {
                                                                                "actionType": "custom",
                                                                                "script": async function(context: any, doAction: any, event: any) {
                                                                                    const allLevelInfo = context.props.data.__super.targetLevelOptions
                                                                                    const selectedLevel = context.props.data.memberLevelId
                                                                                    const selected = allLevelInfo.filter(i=>i.id == selectedLevel)[0]
                                                                                    if(event.data.value == 1) {
                                                                                        setTimeout(()=>{
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "monthPriceUpdate",
                                                                                                "args": {
                                                                                                    "value": selected.monthPriceUpdate
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '月'
                                                                                                }
                                                                                            })
                                                                                        }, 1000)
                                                                                    }
                                                                                    if(event.data.value == 2) {
                                                                                        setTimeout(()=>{
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "quarterPriceUpdate",
                                                                                                "args": {
                                                                                                    "value": selected.quarterPriceUpdate
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '季度'
                                                                                                }
                                                                                            })
                                                                                        }, 1000)
                                                                                    }
                                                                                    if(event.data.value == 3) {
                                                                                        setTimeout(()=>{
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "yearPriceUpdate",
                                                                                                "args": {
                                                                                                    "value": selected.yearPriceUpdate
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '年'
                                                                                                }
                                                                                            })
                                                                                        }, 1000)
                                                                                    }
                                                                                    const currentMember = context.props.data.__super.item
                                                                                    const params = {
                                                                                        "currentMemberLevelId": currentMember.id,
                                                                                        "memberLevelId": event.data.memberLevelId,
                                                                                        "memberOrderType": 2,
                                                                                        "channelCode": event.data.channelCode,
                                                                                        "paymentCycle": event.data.paymentCycle,
                                                                                        "productCount": event.data.productCount,
                                                                                    }
                                                                                    let res;
                                                                                    if (isEditorialEnd()) {
                                                                                        res = await getRenewalVal(params)
                                                                                    } else {
                                                                                        res = await getAppRenewalVal(params)
                                                                                    }
                                                                                    const val = (res.data.data/100).toFixed(2)
                                                                                    doAction({
                                                                                        actionType: 'setValue',
                                                                                        componentId: 'renewalUpdate',
                                                                                        args: {
                                                                                            value: val
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                "name": "monthPriceUpdate",
                                                                "label": "每月/元",
                                                                "type": "input-text",
                                                                "static": true,
                                                                "visibleOn": "${paymentCycle == 1 && memberLevelId}",
                                                            },
                                                            {
                                                                "name": "quarterPriceUpdate",
                                                                "label": "季度/元",
                                                                "type": "input-text",
                                                                "static": true,
                                                                "visibleOn": "${paymentCycle == 2 && memberLevelId}"
                                                            },
                                                            {
                                                                "name": "yearPriceUpdate",
                                                                "label": "年/元",
                                                                "type": "input-text",
                                                                "static": true,
                                                                "visibleOn": "${paymentCycle == 3 && memberLevelId}"
                                                            },
                                                            {
                                                                "type": "container",
                                                                "className": "member_fee_info",
                                                                "body": [
                                                                    {
                                                                        "type": "input-number",
                                                                        "label": "开通时长",
                                                                        "name": "productCount",
                                                                        "visibleOn": "${paymentCycle && memberLevelId}",
                                                                        "value": 1,
                                                                        "min": 1,
                                                                        "required": true,
                                                                        "onEvent": {
                                                                            "change": {
                                                                                "actions": [
                                                                                    {
                                                                                        "actionType": "custom",
                                                                                        "script": async function(context: any, doAction: any, event: any){
                                                                                            const currentMember = context.props.data.__super.item
                                                                                            const params = {
                                                                                                "currentMemberLevelId": currentMember.id,
                                                                                                "memberLevelId": event.data.memberLevelId,
                                                                                                "memberOrderType": 2,
                                                                                                "channelCode": event.data.channelCode,
                                                                                                "paymentCycle": event.data.paymentCycle,
                                                                                                "productCount": event.data.productCount,
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalUpdate',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        "type": "input-text",
                                                                        "name": "units",
                                                                        "static": true,
                                                                        "labelWidth": 1,
                                                                        "visibleOn": "${memberLevelId}",
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                "name": "channelCode",
                                                                "type": "radios",
                                                                "label": "支付渠道",
                                                                "visibleOn": "${memberLevelId}",
                                                                "required": true,
                                                                "value": "wx_qr",
                                                                "options": [
                                                                    {
                                                                        "label": "微信",
                                                                        "value": "wx_qr"
                                                                    },
                                                                    {
                                                                        "label": "支付宝",
                                                                        "value": "alipay_qr"
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "static": true,
                                                                "label": "报价/元",
                                                                "name": "renewalUpdate",
                                                                "id": "renewalUpdate",
                                                                "visibleOn": "${memberLevelId}",
                                                            },
                                                        ],
                                                        "actions": [
                                                            {
                                                                "type": "button",
                                                                "label": "提交",
                                                                "level": "primary",
                                                                "actionType": "submit",
                                                                "onEvent": {
                                                                    "click": {
                                                                        "actions": [{
                                                                            "actionType": "custom",
                                                                            "script": async function (context: any, doAction: any, event: any) {
                                                                                const currentMember = context.props.data.__super.item
                                                                                const params = {
                                                                                    "currentMemberLevelId": currentMember.id,
                                                                                    "memberLevelId": event.data.memberLevelId,
                                                                                    "memberOrderType": 2,
                                                                                    "channelCode": event.data.channelCode,
                                                                                    "paymentCycle": event.data.paymentCycle,
                                                                                    "productCount": event.data.productCount,
                                                                                }
                                                                                const selectedId = event.data.memberLevelId
                                                                                const allMember = event.data.__super.targetLevelOptions
                                                                                const selectedName = allMember.filter(i=>i.id == selectedId)[0].name
                                                                                const selected = allMember.filter(i=>i.id == selectedId)[0]
                                                                                const submitFun = async() => {
                                                                                    let res
                                                                                    if (isEditorialEnd()) {
                                                                                        res = await createMembership(params)
                                                                                    } else {
                                                                                        res = await createAppMembership(params)
                                                                                    }
                                                                                    if(res.data.code == 0) {
                                                                                        const displayContent = res.data.data.displayContent
                                                                                        const price = (res.data.data.price/100).toFixed(2)
                                                                                        const orderId = res.data.data.payOrderId
                                                                                        const tenantId = res.data.data.tenantId
                                                                                        let timer:any;
                                                                                        doAction({
                                                                                            "actionType": "dialog",
                                                                                            "dialog": {
                                                                                                "size": "sm",
                                                                                                "title": `请支付${price}元`,
                                                                                                "id": "payment",
                                                                                                "showCloseButton": false,
                                                                                                "body": [
                                                                                                    {
                                                                                                        "type": "form",
                                                                                                        "body": [
                                                                                                            {
                                                                                                                "type": "qr-code",
                                                                                                                "codeSize": 128,
                                                                                                                "value": displayContent,
                                                                                                                "style": {"textAlign":"center"},
                                                                                                            }
                                                                                                        ]
                                                                                                    }
                                                                                                ],
                                                                                                "actions": [{
                                                                                                    "type": "button",
                                                                                                    "label": "取消订单",
                                                                                                    "onEvent": {
                                                                                                        "click": {
                                                                                                            "actions": [
                                                                                                                {
                                                                                                                    "actionType": "custom",
                                                                                                                    "script": async function (context: any, doAction: any, event: any) {
                                                                                                                        const orderId = res.data.data.payOrderId
                                                                                                                        const tenantId = res.data.data.tenantId
                                                                                                                        confirm('是否确认取消支付订单？', '提示','确定','取消').then(async(result) =>{
                                                                                                                            //true 确定 false 取消
                                                                                                                            if(result){
                                                                                                                                //点击确定的话，关闭弹窗，请求接口，取消支付
                                                                                                                                const res2 = await setOrderCancel(orderId, tenantId)
                                                                                                                                if (res2.data.code != 0) {
                                                                                                                                    toast.error(res2.data.msg, {
                                                                                                                                        position: 'top-right'
                                                                                                                                    })
                                                                                                                                } else {
                                                                                                                                    doAction({
                                                                                                                                        "actionType": "close",
                                                                                                                                        "componentId": "payment",
                                                                                                                                    })
                                                                                                                                    doAction({
                                                                                                                                        "actionType": "reload",
                                                                                                                                        "componentId": "page_refresh",
                                                                                                                                    })
                                                                                                                                }

                                                                                                                            } else {
                                                                                                                                //点击取消的话，关闭弹窗
                                                                                                                            }
                                                                                                                        })
                                                                                                                    }
                                                                                                                }
                                                                                                            ]
                                                                                                        }
                                                                                                    },
                                                                                                }]
                                                                                            }
                                                                                        })
                                                                                        const fetchData = async() => {
                                                                                            try {
                                                                                                let res
                                                                                                if (isEditorialEnd()) {
                                                                                                    res = await getMemberOrder(orderId, tenantId)
                                                                                                } else {
                                                                                                    res = await getAppMemberOrder(orderId, tenantId)
                                                                                                }
                                                                                                if(res.data.code == 0) {
                                                                                                    // 10 支付成功 30 支付关闭
                                                                                                    if (res.data.data.payOrder.status == 30) {
                                                                                                        // 清除定时器，停止后续请求
                                                                                                        clearInterval(timer);
                                                                                                        doAction({
                                                                                                            "actionType": "close",
                                                                                                            "componentId": "payment",
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "reload",
                                                                                                            "componentId": "page_refresh",
                                                                                                        })
                                                                                                        toast.success('订单支付取消成功', {
                                                                                                            position: 'top-right'
                                                                                                        })
                                                                                                    }
                                                                                                    if(res.data.data.payOrder.status == 10 && res.data.data.memberOrder.payStatus) {
                                                                                                        // 清除定时器，停止后续请求
                                                                                                        clearInterval(timer);
                                                                                                        doAction({
                                                                                                            "actionType": "close",
                                                                                                            "componentId": "payment",
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "setValue",
                                                                                                            "componentName": "memberLevelId",
                                                                                                            "args": {
                                                                                                                "value": ''
                                                                                                            }
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "reload",
                                                                                                            "componentId": "page_refresh",
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "reload",
                                                                                                            "componentName": "memberShip_upgrade",
                                                                                                        })
                                                                                                        toast.success('会员升级成功', {
                                                                                                            position: 'top-right'
                                                                                                        })
                                                                                                    }
                                                                                                } else {
                                                                                                    toast.error(res.data.msg, {
                                                                                                        position: 'top-right'
                                                                                                    })
                                                                                                }
                                                                                            } catch (e){
                                                                                                clearInterval(timer);
                                                                                            }
                                                                                        }
                                                                                        // 每隔一秒执行一次请求
                                                                                        timer = setInterval(fetchData, 1000);
                                                                                        // 初始时立即执行一次
                                                                                        fetchData();
                                                                                    } else {
                                                                                        toast.error(res.data.msg, {
                                                                                            position: 'top-right'
                                                                                        })
                                                                                    }
                                                                                }
                                                                                if (event.data.paymentCycle == 1 && event.data.productCount >= 3 && event.data.productCount < 12) {
                                                                                    confirm('按季度升级有折扣，是否按季度升级', '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            //点击确定的话，弹窗消失，开通方式显示按季度
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "paymentCycle",
                                                                                                "args": {
                                                                                                    "value": 2
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "productCount",
                                                                                                "args": {
                                                                                                    "value": 1
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '季度'
                                                                                                }
                                                                                            })
                                                                                            setTimeout(()=>{
                                                                                                doAction({
                                                                                                    "actionType": "setValue",
                                                                                                    "componentName": "quarterPriceUpdate",
                                                                                                    "args": {
                                                                                                        "value": selected.quarterPriceUpdate
                                                                                                    }
                                                                                                })
                                                                                            }, 1000)
                                                                                            const params = {
                                                                                                "currentMemberLevelId": currentMember.id,
                                                                                                "memberLevelId": selected.id,
                                                                                                "paymentCycle": 2,
                                                                                                "productCount": 1,
                                                                                                "memberOrderType": 2,
                                                                                                "channelCode": event.data.channelCode
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalUpdate',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        } else {
                                                                                            //点击取消的话，按当前充值
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                } else if (event.data.paymentCycle == 1 && event.data.productCount >= 12) {
                                                                                    confirm('按年度升级有折扣，是否按年度升级', '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            //点击确定的话，弹窗消失，开通方式显示按年度
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "paymentCycle",
                                                                                                "args": {
                                                                                                    "value": 3
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "productCount",
                                                                                                "args": {
                                                                                                    "value": 1
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '年'
                                                                                                }
                                                                                            })

                                                                                            setTimeout(()=>{
                                                                                                doAction({
                                                                                                    "actionType": "setValue",
                                                                                                    "componentName": "yearPriceUpdate",
                                                                                                    "args": {
                                                                                                        "value": selected.yearPriceUpdate
                                                                                                    }
                                                                                                })
                                                                                            },1000)
                                                                                            const params = {
                                                                                                "currentMemberLevelId": currentMember.id,
                                                                                                "memberLevelId": selected.id,
                                                                                                "paymentCycle": 3,
                                                                                                "productCount": 1,
                                                                                                "memberOrderType": 2,
                                                                                                "channelCode": event.data.channelCode
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalUpdate',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        } else {
                                                                                            //点击取消的话，按当前充值
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                } else if(event.data.paymentCycle == 2 && event.data.productCount >= 4) {
                                                                                    confirm('按年度升级有折扣，是否按年度升级', '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            //点击确定的话，弹窗消失，开通方式显示按年度
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "paymentCycle",
                                                                                                "args": {
                                                                                                    "value": 3
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "productCount",
                                                                                                "args": {
                                                                                                    "value": 1
                                                                                                }
                                                                                            })
                                                                                            doAction({
                                                                                                "actionType": "setValue",
                                                                                                "componentName": "units",
                                                                                                "args": {
                                                                                                    "value": '年'
                                                                                                }
                                                                                            })
                                                                                            setTimeout(()=>{
                                                                                                doAction({
                                                                                                    "actionType": "setValue",
                                                                                                    "componentName": "yearPriceUpdate",
                                                                                                    "args": {
                                                                                                        "value": selected.yearPriceUpdate
                                                                                                    }
                                                                                                })
                                                                                            },1000)
                                                                                            const params = {
                                                                                                "currentMemberLevelId": currentMember.id,
                                                                                                "memberLevelId": selected.id,
                                                                                                "paymentCycle": 3,
                                                                                                "productCount": 1,
                                                                                                "memberOrderType": 2,
                                                                                                "channelCode": event.data.channelCode
                                                                                            }
                                                                                            let res;
                                                                                            if (isEditorialEnd()) {
                                                                                                res = await getRenewalVal(params)
                                                                                            } else {
                                                                                                res = await getAppRenewalVal(params)
                                                                                            }
                                                                                            const val = (res.data.data/100).toFixed(2)
                                                                                            doAction({
                                                                                                actionType: 'setValue',
                                                                                                componentId: 'renewalUpdate',
                                                                                                args: {
                                                                                                    value: val
                                                                                                }
                                                                                            });
                                                                                        } else {
                                                                                            //点击取消的话，按当前充值
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                } else {
                                                                                    confirm(`你确定要升级为${selectedName}吗？`, '提示','确定','取消').then(async(res) =>{
                                                                                        //true 确定 false 取消
                                                                                        if(res){
                                                                                            submitFun()
                                                                                        }
                                                                                    })
                                                                                }
                                                                            }
                                                                        }]
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                    }
                                                ]
                                            }
                                        ]
                                    }]
                                }
                            },
                            {
                                "type": "form",
                                "mode": "horizontal",
                                "title": "开通会员",
                                "id": "memberShip",
                                "visibleOn": "${nonMember}",
                                "body": [
                                    {
                                        "label": "目标等级",
                                        "type": "select",
                                        "name": "memberLevelId",
                                        "valueField": "id",
                                        "labelField": "name",
                                        "source": "${targetLevelOptionsCreate}",
                                        "required": true,
                                        "onEvent": {
                                            "change": {
                                                "actions": [
                                                    {
                                                        "actionType": "custom",
                                                        "script": function(context: any, doAction: any, event: any) {
                                                            const allLevelInfo = context.props.data.targetLevelOptionsCreate
                                                            const selectedLevel = event.data.memberLevelId
                                                            const selected = allLevelInfo.filter(i=>i.id == selectedLevel)[0]
                                                            setTimeout(()=>{
                                                                if(context.props.data.paymentCycle == 1) {
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '月'
                                                                        }
                                                                    })

                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "monthPriceOpen",
                                                                        "args": {
                                                                            "value": selected.monthPriceOpen
                                                                        }
                                                                    })
                                                                } else if(context.props.data.paymentCycle == 2) {
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '季度'
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "quarterPriceOpen",
                                                                        "args": {
                                                                            "value": selected.quarterPriceOpen
                                                                        }
                                                                    })
                                                                } else {
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '年'
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "monthPriceOpen",
                                                                        "args": {
                                                                            "value": selected.monthPriceOpen
                                                                        }
                                                                    })
                                                                }
                                                            }, 1000)
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        "name": "paymentCycle",
                                        "type": "radios",
                                        "label": "开通方式",
                                        "visibleOn": "${memberLevelId}",
                                        "required": true,
                                        "value": 1,
                                        "options": [
                                            {
                                                "label": "按月",
                                                "value": 1
                                            },
                                            {
                                                "label": "按季度",
                                                "value": 2
                                            },
                                            {
                                                "label": "按年",
                                                "value": 3
                                            },
                                        ],
                                        "onEvent": {
                                            "change": {
                                                "actions": [
                                                    {
                                                        "actionType": "custom",
                                                        "script": async function(context: any, doAction: any, event: any) {
                                                            const allLevelInfo = context.props.data.targetLevelOptionsCreate
                                                            const selectedLevel = context.props.data.memberLevelId
                                                            const selected = allLevelInfo.filter(i=>i.id == selectedLevel)[0]
                                                            if(event.data.value == 1) {
                                                                setTimeout(()=>{

                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "monthPriceOpen",
                                                                        "args": {
                                                                            "value": selected.monthPriceOpen
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '月'
                                                                        }
                                                                    })
                                                                }, 1000)
                                                            }
                                                            if(event.data.value == 2) {
                                                                setTimeout(()=>{
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "quarterPriceOpen",
                                                                        "args": {
                                                                            "value": selected.quarterPriceOpen
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '季度'
                                                                        }
                                                                    })
                                                                }, 1000)
                                                            }
                                                            if(event.data.value == 3) {
                                                                setTimeout(()=>{
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "yearPriceOpen",
                                                                        "args": {
                                                                            "value": selected.yearPriceOpen
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '年'
                                                                        }
                                                                    })
                                                                }, 1000)
                                                            }
                                                            const params = {
                                                                "memberLevelId": selected.id,
                                                                "paymentCycle": event.data.paymentCycle,
                                                                "productCount": event.data.productCount,
                                                                "memberOrderType": 1,
                                                                "channelCode": event.data.channelCode
                                                            }
                                                            let res;
                                                            if (isEditorialEnd()) {
                                                                res = await getRenewalVal(params)
                                                            } else {
                                                                res = await getAppRenewalVal(params)
                                                            }
                                                            const val = (res.data.data/100).toFixed(2)
                                                            doAction({
                                                                actionType: 'setValue',
                                                                componentId: 'renewalOpen',
                                                                args: {
                                                                    value: val
                                                                }
                                                            });
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        "name": "monthPriceOpen",
                                        "label": "每月/元",
                                        "type": "input-text",
                                        "static": true,
                                        "visibleOn": "${paymentCycle == 1}",
                                    },
                                    {
                                        "name": "quarterPriceOpen",
                                        "label": "季度/元",
                                        "type": "input-text",
                                        "static": true,
                                        "visibleOn": "${paymentCycle == 2}"
                                    },
                                    {
                                        "name": "yearPriceOpen",
                                        "label": "年/元",
                                        "type": "input-text",
                                        "static": true,
                                        "visibleOn": "${paymentCycle == 3}"
                                    },
                                    {
                                        "type": "container",
                                        "className": "member_fee_info",
                                        "body": [
                                            {
                                                "type": "input-number",
                                                "label": "开通时长",
                                                "name": "productCount",
                                                "visibleOn": "${paymentCycle}",
                                                "value": 1,
                                                "min": 1,
                                                "required": true,
                                                "onEvent": {
                                                    "change": {
                                                        "actions": [
                                                            {
                                                                "actionType": "custom",
                                                                "script": async function(context: any, doAction: any, event: any){
                                                                    const selected = context.props.data
                                                                    const params = {
                                                                        "memberLevelId": selected.memberLevelId,
                                                                        "paymentCycle": event.data.paymentCycle,
                                                                        "productCount": event.data.productCount,
                                                                        "memberOrderType": 1,
                                                                        "channelCode": event.data.channelCode
                                                                    }
                                                                    let res;
                                                                    if (isEditorialEnd()) {
                                                                        res = await getRenewalVal(params)
                                                                    } else {
                                                                        res = await getAppRenewalVal(params)
                                                                    }
                                                                    const val = (res.data.data/100).toFixed(2)
                                                                    doAction({
                                                                        actionType: 'setValue',
                                                                        componentId: 'renewalOpen',
                                                                        args: {
                                                                            value: val
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                "type": "input-text",
                                                "name": "units",
                                                "static": true,
                                                "labelWidth": 1,
                                                "visibleOn": "${memberLevelId}",
                                            }
                                        ]
                                    },
                                    {
                                        "name": "channelCode",
                                        "type": "radios",
                                        "label": "支付渠道",
                                        "visibleOn": "${memberLevelId}",
                                        "required": true,
                                        "value": "wx_qr",
                                        "options": [
                                            {
                                                "label": "微信",
                                                "value": "wx_qr"
                                            },
                                            {
                                                "label": "支付宝",
                                                "value": "alipay_qr"
                                            },
                                        ],
                                    },
                                    {
                                        "type": "input-text",
                                        "static": true,
                                        "label": "报价/元",
                                        "name": "renewalOpen",
                                        "value": "${monthPriceOpen}",
                                        "id": "renewalOpen",
                                        "visibleOn": "${memberLevelId}",
                                    }
                                ],
                                "actions": [
                                    {
                                        "type": "button",
                                        "label": "提交",
                                        "level": "primary",
                                        "actionType": "submit",
                                        "onEvent": {
                                            "click": {
                                                "actions": [
                                                {
                                                    "actionType": "validate",
                                                    "componentId": "memberShip",
                                                    "outputVar": 'validateResult'
                                                },
                                                {
                                                    "actionType": "custom",
                                                    "script": async function (context: any, doAction: any, event: any) {
                                                        if(event.data.validateResult.error) return;
                                                        const params = {
                                                            "memberLevelId": event.data.memberLevelId,
                                                            "paymentCycle": event.data.paymentCycle,
                                                            "productCount": event.data.productCount,
                                                            "memberOrderType": 1,
                                                            "channelCode": event.data.channelCode
                                                        }
                                                        const allLevelInfo = context.props.data.targetLevelOptionsCreate
                                                        const selectedLevel = context.props.data.memberLevelId
                                                        const selected = allLevelInfo.filter(i=>i.id == selectedLevel)[0]
                                                        const submitFun = async() => {
                                                            let res
                                                            if (isEditorialEnd()) {
                                                                res = await createMembership(params)
                                                            } else {
                                                                res = await createAppMembership(params)
                                                            }
                                                            if(res.data.code == 0) {
                                                                const displayContent = res.data.data.displayContent
                                                                const price = (res.data.data.price/100).toFixed(2)
                                                                const orderId = res.data.data.payOrderId
                                                                const tenantId = res.data.data.tenantId
                                                                let timer:any;
                                                                doAction({
                                                                    "actionType": "dialog",
                                                                    "dialog": {
                                                                        "size": "sm",
                                                                        "title": `请支付${price}元`,
                                                                        "id": "payment",
                                                                        "showCloseButton": false,
                                                                        "body": [
                                                                            {
                                                                                "type": "form",
                                                                                "body": [
                                                                                    {
                                                                                        "type": "qr-code",
                                                                                        "codeSize": 128,
                                                                                        "value": displayContent,
                                                                                        "style": {"textAlign":"center"},
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ],
                                                                        "actions": [{
                                                                            "type": "button",
                                                                            "label": "取消订单",
                                                                            "onEvent": {
                                                                                "click": {
                                                                                    "actions": [
                                                                                        {
                                                                                            "actionType": "custom",
                                                                                            "script": async function (context: any, doAction: any, event: any) {
                                                                                                const orderId = res.data.data.payOrderId
                                                                                                const tenantId = res.data.data.tenantId
                                                                                                confirm('是否确认取消支付订单？', '提示','确定','取消').then(async(result) =>{
                                                                                                    //true 确定 false 取消
                                                                                                    if(result){
                                                                                                        //点击确定的话，关闭弹窗，请求接口，取消支付
                                                                                                        const res2 = await setOrderCancel(orderId, tenantId)
                                                                                                        if (res2.data.code != 0) {
                                                                                                            toast.error(res2.data.msg, {
                                                                                                                position: 'top-right'
                                                                                                            })
                                                                                                        } else {
                                                                                                            doAction({
                                                                                                                "actionType": "close",
                                                                                                                "componentId": "payment",
                                                                                                            })
                                                                                                            doAction({
                                                                                                                "actionType": "reload",
                                                                                                                "componentId": "page_refresh",
                                                                                                            })
                                                                                                        }

                                                                                                    } else {
                                                                                                        //点击取消的话，关闭弹窗
                                                                                                    }
                                                                                                })
                                                                                            }
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            },
                                                                        }]
                                                                    }
                                                                })
                                                                const fetchData = async() => {
                                                                    try {
                                                                        let res
                                                                        if (isEditorialEnd()) {
                                                                            res = await getMemberOrder(orderId, tenantId)
                                                                        } else {
                                                                            res = await getAppMemberOrder(orderId, tenantId)
                                                                        }
                                                                        if(res.data.code == 0) {
                                                                            // 10 支付成功 30 支付关闭
                                                                            if (res.data.data.payOrder.status == 30) {
                                                                                // 清除定时器，停止后续请求
                                                                                clearInterval(timer);
                                                                                doAction({
                                                                                    "actionType": "close",
                                                                                    "componentId": "payment",
                                                                                })
                                                                                doAction({
                                                                                    "actionType": "reload",
                                                                                    "componentId": "page_refresh",
                                                                                })
                                                                                toast.success('订单支付取消成功', {
                                                                                    position: 'top-right'
                                                                                })
                                                                            }
                                                                            if(res.data.data.payOrder.status == 10 && res.data.data.memberOrder.payStatus) {
                                                                                // 清除定时器，停止后续请求
                                                                                clearInterval(timer);
                                                                                doAction({
                                                                                    "actionType": "close",
                                                                                    "componentId": "payment",
                                                                                })
                                                                                doAction({
                                                                                    "actionType": "reload",
                                                                                    "componentId": "page_refresh",
                                                                                })
                                                                                toast.success('会员开通成功', {
                                                                                    position: 'top-right'
                                                                                })
                                                                            }
                                                                        } else {
                                                                            toast.error(res.data.msg, {
                                                                                position: 'top-right'
                                                                            })
                                                                        }
                                                                    } catch (e){
                                                                        clearInterval(timer);
                                                                    }
                                                                }
                                                                // 每隔一秒执行一次请求
                                                                timer = setInterval(fetchData, 1000);
                                                                // 初始时立即执行一次
                                                                fetchData();
                                                            } else {
                                                                toast.error(res.data.msg, {
                                                                    position: 'top-right'
                                                                })
                                                            }
                                                        }
                                                        if (event.data.paymentCycle == 1 && event.data.productCount >= 3 && event.data.productCount < 12) {
                                                            confirm('按季度充值有折扣，是否按季度充值', '提示','确定','取消').then(async(res) =>{
                                                                //true 确定 false 取消
                                                                if(res){
                                                                    //点击确定的话，弹窗消失，开通方式显示按季度
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "paymentCycle",
                                                                        "args": {
                                                                            "value": 2
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "productCount",
                                                                        "args": {
                                                                            "value": 1
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '季度'
                                                                        }
                                                                    })
                                                                    setTimeout(()=>{
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentName": "quarterPriceOpen",
                                                                            "args": {
                                                                                "value": selected.quarterPriceOpen
                                                                            }
                                                                        })
                                                                    }, 1000)
                                                                    const params = {
                                                                        "memberLevelId": selected.id,
                                                                        "paymentCycle": 2,
                                                                        "productCount": 1,
                                                                        "memberOrderType": 1,
                                                                        "channelCode": event.data.channelCode
                                                                    }
                                                                    let res;
                                                                    if (isEditorialEnd()) {
                                                                        res = await getRenewalVal(params)
                                                                    } else {
                                                                        res = await getAppRenewalVal(params)
                                                                    }
                                                                    const val = (res.data.data/100).toFixed(2)
                                                                    doAction({
                                                                        actionType: 'setValue',
                                                                        componentId: 'renewalOpen',
                                                                        args: {
                                                                            value: val
                                                                        }
                                                                    });
                                                                } else {
                                                                    //点击取消的话，按当前充值
                                                                    submitFun()
                                                                }
                                                            })
                                                        } else if (event.data.paymentCycle == 1 && event.data.productCount >= 12) {
                                                            confirm('按年度充值有折扣，是否按年度充值', '提示','确定','取消').then(async(res) =>{
                                                                //true 确定 false 取消
                                                                if(res){
                                                                    //点击确定的话，弹窗消失，开通方式显示按年度
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "paymentCycle",
                                                                        "args": {
                                                                            "value": 3
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "productCount",
                                                                        "args": {
                                                                            "value": 1
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '年'
                                                                        }
                                                                    })
                                                                    setTimeout(()=>{
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentName": "yearPriceOpen",
                                                                            "args": {
                                                                                "value": selected.yearPriceOpen
                                                                            }
                                                                        })
                                                                    },1000)
                                                                    const params = {
                                                                        "memberLevelId": selected.id,
                                                                        "paymentCycle": 3,
                                                                        "productCount": 1,
                                                                        "memberOrderType": 1,
                                                                        "channelCode": event.data.channelCode
                                                                    }
                                                                    let res;
                                                                    if (isEditorialEnd()) {
                                                                        res = await getRenewalVal(params)
                                                                    } else {
                                                                        res = await getAppRenewalVal(params)
                                                                    }
                                                                    const val = (res.data.data/100).toFixed(2)
                                                                    doAction({
                                                                        actionType: 'setValue',
                                                                        componentId: 'renewalOpen',
                                                                        args: {
                                                                            value: val
                                                                        }
                                                                    });
                                                                } else {
                                                                    //点击取消的话，按当前充值
                                                                    submitFun()
                                                                }
                                                            })
                                                        } else if(event.data.paymentCycle == 2 && event.data.productCount >= 4) {
                                                            confirm('按年度充值有折扣，是否按年度充值', '提示','确定','取消').then(async(res) =>{
                                                                //true 确定 false 取消
                                                                if(res){
                                                                    //点击确定的话，弹窗消失，开通方式显示按年度
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "paymentCycle",
                                                                        "args": {
                                                                            "value": 3
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "productCount",
                                                                        "args": {
                                                                            "value": 1
                                                                        }
                                                                    })
                                                                    doAction({
                                                                        "actionType": "setValue",
                                                                        "componentName": "units",
                                                                        "args": {
                                                                            "value": '年'
                                                                        }
                                                                    })
                                                                    setTimeout(()=>{
                                                                        doAction({
                                                                            "actionType": "setValue",
                                                                            "componentName": "yearPriceOpen",
                                                                            "args": {
                                                                                "value": selected.yearPriceOpen
                                                                            }
                                                                        })
                                                                    },1000)
                                                                    const params = {
                                                                        "memberLevelId": selected.id,
                                                                        "paymentCycle": 3,
                                                                        "productCount": 1,
                                                                        "memberOrderType": 1,
                                                                        "channelCode": event.data.channelCode
                                                                    }
                                                                    let res;
                                                                    if (isEditorialEnd()) {
                                                                        res = await getRenewalVal(params)
                                                                    } else {
                                                                        res = await getAppRenewalVal(params)
                                                                    }
                                                                    const val = (res.data.data/100).toFixed(2)
                                                                    doAction({
                                                                        actionType: 'setValue',
                                                                        componentId: 'renewalOpen',
                                                                        args: {
                                                                            value: val
                                                                        }
                                                                    });
                                                                } else {
                                                                    //点击取消的话，按当前充值
                                                                    submitFun()
                                                                }
                                                            })
                                                        } else {
                                                            confirm('你确定要充值吗？', '提示','确定','取消').then(async(res) =>{
                                                                //true 确定 false 取消
                                                                if(res){
                                                                    submitFun()
                                                                }
                                                            })
                                                        }
                                                    }
                                                }]
                                            }
                                        }
                                    }
                                ],
                            },
                        ]
                    }]
                },
                {
                    "title": "数据量管理",
                    "visibleOn": "${false}",
                    "className": "userProfile_member",
                    "tab": [{
                        "type": "page",
                        "id": "dataCountManage",
                        "initApi": {
                            "method": "get",
                            "url": useDevBaseUrl("/application/app/quota/get"),
                            adaptor: async function (payload:any) {
                                //数据库条数
                                let freeRemainQuantity = payload.data.monthlyFreeDataQuota
                                let remainPurchaseQuantity = payload.data.permanentPaidDataQuota
                                let databasePrice = (payload.data.dataPrice/100).toFixed(2)
                                //对象存储流量
                                let freeRemainingData = ((payload.data.monthlyFreeStorageQuota/1024)/1024).toFixed(1) + ' MB'
                                let remainPurchaseData = ((payload.data.permanentPaidStorageQuota/1024)/1024).toFixed(1) + ' MB'
                                let dataPrice = (payload.data.storagePrice/100).toFixed(2)
                                //AI调用次数
                                let feeRemainingCallCount = payload.data.monthlyFreeAiQuota
                                let remainPurchaseCallCount = payload.data.permanentPaidAiQuota
                                let callPrice = (payload.data.aiPrice/100).toFixed(2)
                                return {
                                    ...payload,
                                    status: payload.code,
                                    data: {
                                        ...payload.data,
                                        freeRemainQuantity: freeRemainQuantity,
                                        remainPurchaseQuantity: remainPurchaseQuantity,
                                        databasePrice: databasePrice,
                                        freeRemainingData: freeRemainingData,
                                        remainPurchaseData: remainPurchaseData,
                                        dataPrice: dataPrice,
                                        feeRemainingCallCount: feeRemainingCallCount,
                                        remainPurchaseCallCount: remainPurchaseCallCount,
                                        callPrice: callPrice
                                    }
                                };
                            }
                        },
                        "body": [{
                            "type": "form",
                            "title": "",
                            "mode": "horizontal",
                            "labelWidth": 120,
                            "body": [
                                {
                                    "type": "fieldSet",
                                    "title": "数据库条数",
                                    "body": [{
                                        "type": "input-text",
                                        "name": "freeRemainQuantity",
                                        "label": "免费剩余条数",
                                        "static": true
                                    },{
                                        "type": "input-text",
                                        "name": "remainPurchaseQuantity",
                                        "label": "已购剩余条数",
                                        "static": true
                                    },{
                                        "type": "input-text",
                                        "name": "databasePrice",
                                        "label": "单价(元/10万条)",
                                        "static": true,
                                    },{
                                        "type": "input-number",
                                        "name": "databaseCount",
                                        "label": "本次购买数量",
                                        "min": 1,
                                        "unitOptions": [
                                            "10万条",
                                        ]
                                    }]
                                },
                                {
                                    "type": "fieldSet",
                                    "title": "对象存储流量",
                                    "body": [{
                                        "type": "input-text",
                                        "name": "freeRemainingData",
                                        "label": "免费剩余流量",
                                        "static": true
                                    },{
                                        "type": "input-text",
                                        "name": "remainPurchaseData",
                                        "label": "已购剩余流量",
                                        "static": true
                                    },{
                                        "type": "input-text",
                                        "name": "dataPrice",
                                        "label": "单价(元/1G)",
                                        "static": true,
                                    },{
                                        "type": "input-number",
                                        "name": "dataCount",
                                        "label": "本次购买数量",
                                        "min": 1,
                                        "unitOptions": [
                                            "G",
                                        ]
                                    }]
                                },
                                {
                                    "type": "fieldSet",
                                    "title": "AI调用次数",
                                    "body": [{
                                        "type": "input-text",
                                        "name": "feeRemainingCallCount",
                                        "label": "免费剩余调用次数",
                                        "static": true
                                    },{
                                        "type": "input-text",
                                        "name": "remainPurchaseCallCount",
                                        "label": "已购剩余调用次数",
                                        "static": true
                                    },{
                                        "type": "input-text",
                                        "name": "callPrice",
                                        "label": "单价(元/万次)",
                                        "static": true
                                    },{
                                        "type": "input-number",
                                        "name": "callCount",
                                        "label": "本次购买数量",
                                        "min": 1,
                                        "unitOptions": [
                                            "万次",
                                        ]
                                    }]
                                },
                                {
                                    "type": "divider"
                                },
                                {
                                    "name": "channelCode",
                                    "type": "radios",
                                    "label": "支付渠道",
                                    "required": true,
                                    "value": "wx_qr",
                                    "options": [
                                        {
                                            "label": "微信",
                                            "value": "wx_qr"
                                        },
                                        {
                                            "label": "支付宝",
                                            "value": "alipay_qr"
                                        },
                                    ],
                                }
                            ],
                            "actions": [
                                {
                                    "type": "button",
                                    "label": "提交",
                                    "level": "primary",
                                    "actionType": "submit",
                                    "onEvent": {
                                        "click": {
                                            "actions": [{
                                                "actionType": "custom",
                                                "script": async function (context: any, doAction: any, event: any) {
                                                    let databaseCount = event?.data?.databaseCount ? Number(event.data.databaseCount.split('10万条')[0]) : 0
                                                    let dataCount = event?.data?.dataCount ? Number(event.data.dataCount.split('G')[0]) : 0
                                                    let callCount = event?.data?.callCount ? Number(event.data.callCount.split('万次')[0]) : 0
                                                    if (databaseCount == 0 && dataCount == 0 && callCount == 0) {
                                                        toast.error('请填写本次购买数量', {
                                                            position: 'top-right'
                                                        })
                                                        return
                                                    }

                                                    const params = {
                                                        "dataPurchaseNum": databaseCount,
                                                        "storagePurchaseNum": dataCount,
                                                        "aiPurchaseNum": callCount,
                                                        "channelCode": event.data.channelCode
                                                    }
                                                    const submitFun = async() => {
                                                        let res = await createDataManage(params)
                                                        if(res.data.code == 0) {
                                                            const displayContent = res.data.data.displayContent
                                                            const price = (res.data.data.price/100).toFixed(2)
                                                            const orderId = res.data.data.payOrderId
                                                            let timer:any;
                                                            doAction({
                                                                "actionType": "dialog",
                                                                "dialog": {
                                                                    "size": "sm",
                                                                    "title": `请支付${price}元`,
                                                                    "id": "payment",
                                                                    "showCloseButton": false,
                                                                    "body": [
                                                                        {
                                                                            "type": "form",
                                                                            "body": [
                                                                                {
                                                                                    "type": "qr-code",
                                                                                    "codeSize": 128,
                                                                                    "value": displayContent,
                                                                                    "style": {"textAlign":"center"},
                                                                                }
                                                                            ]
                                                                        }
                                                                    ],
                                                                    "actions": [{
                                                                        "type": "button",
                                                                        "label": "取消订单",
                                                                        "onEvent": {
                                                                            "click": {
                                                                                "actions": [
                                                                                    {
                                                                                        "actionType": "custom",
                                                                                        "script": async function (context: any, doAction: any, event: any) {
                                                                                            const orderId = res.data.data.payOrderId
                                                                                            confirm('是否确认取消支付订单？', '提示','确定','取消').then(async(result) =>{
                                                                                                //true 确定 false 取消
                                                                                                if(result){
                                                                                                    //点击确定的话，关闭弹窗，请求接口，取消支付
                                                                                                    const res2 = await cancelDataManage(orderId)
                                                                                                    if (res2.data.code != 0) {
                                                                                                        toast.error(res2.data.msg, {
                                                                                                            position: 'top-right'
                                                                                                        })
                                                                                                    } else {
                                                                                                        doAction({
                                                                                                            "actionType": "close",
                                                                                                            "componentId": "payment",
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "reload",
                                                                                                            "componentId": "dataCountManage",
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "setValue",
                                                                                                            "componentName": "databaseCount",
                                                                                                            "args": {
                                                                                                                "value": ''
                                                                                                            }
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "setValue",
                                                                                                            "componentName": "dataCount",
                                                                                                            "args": {
                                                                                                                "value": ''
                                                                                                            }
                                                                                                        })
                                                                                                        doAction({
                                                                                                            "actionType": "setValue",
                                                                                                            "componentName": "callCount",
                                                                                                            "args": {
                                                                                                                "value": ''
                                                                                                            }
                                                                                                        })
                                                                                                    }

                                                                                                } else {
                                                                                                    //点击取消的话，关闭弹窗
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }
                                                                        },
                                                                    }]
                                                                }
                                                            })
                                                            const fetchData = async() => {
                                                                try {
                                                                    let res = await getDataMangeOrder(orderId)
                                                                    if(res.data.code == 0) {
                                                                        // 10 支付成功 30 支付关闭
                                                                        if (res.data.data.payOrder.status == 30) {
                                                                            // 清除定时器，停止后续请求
                                                                            clearInterval(timer);
                                                                            doAction({
                                                                                "actionType": "close",
                                                                                "componentId": "payment",
                                                                            })
                                                                            doAction({
                                                                                "actionType": "reload",
                                                                                "componentId": "dataCountManage",
                                                                            })
                                                                            toast.success('订单支付取消成功', {
                                                                                position: 'top-right'
                                                                            })
                                                                        }
                                                                        if(res.data.data.payOrder.status == 10 && res.data.data.quotaOrder.payStatus) {
                                                                            // 清除定时器，停止后续请求
                                                                            clearInterval(timer);
                                                                            doAction({
                                                                                "actionType": "close",
                                                                                "componentId": "payment",
                                                                            })
                                                                            doAction({
                                                                                "actionType": "reload",
                                                                                "componentId": "dataCountManage",
                                                                            })
                                                                            doAction({
                                                                                "actionType": "setValue",
                                                                                "componentName": "databaseCount",
                                                                                "args": {
                                                                                    "value": ''
                                                                                }
                                                                            })
                                                                            doAction({
                                                                                "actionType": "setValue",
                                                                                "componentName": "dataCount",
                                                                                "args": {
                                                                                    "value": ''
                                                                                }
                                                                            })
                                                                            doAction({
                                                                                "actionType": "setValue",
                                                                                "componentName": "callCount",
                                                                                "args": {
                                                                                    "value": ''
                                                                                }
                                                                            })
                                                                            toast.success('购买成功', {
                                                                                position: 'top-right'
                                                                            })
                                                                        }
                                                                    } else {
                                                                        toast.error(res.data.msg, {
                                                                            position: 'top-right'
                                                                        })
                                                                    }
                                                                } catch (e){
                                                                    clearInterval(timer);
                                                                }
                                                            }
                                                            // 每隔一秒执行一次请求
                                                            timer = setInterval(fetchData, 1000);
                                                            // 初始时立即执行一次
                                                            fetchData();
                                                        } else {
                                                            toast.error(res.data.msg, {
                                                                position: 'top-right'
                                                            })
                                                        }
                                                    }
                                                    confirm('你确定要购买吗？', '提示','确定','取消').then(async(res) =>{
                                                        //true 确定 false 取消
                                                        if(res){
                                                            submitFun()
                                                        }
                                                    })
                                                }
                                            }]
                                        }
                                    }
                                }
                            ],
                        }]
                    }]
                }
            ]
        }
    },
}

export default () => <AMISComponent schema={schema} />;

