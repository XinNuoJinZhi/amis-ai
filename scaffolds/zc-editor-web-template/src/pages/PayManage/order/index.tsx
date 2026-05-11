import { isAppEnd, isEditorialEnd } from '@/utils/index'
import {useDevBaseUrl} from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
let memberListApi = isAppEnd() ? useDevBaseUrl("/application/pay/member-order/page") : useDevBaseUrl("/pay/member-order/page")
let memberDetailApi = isAppEnd() ? useDevBaseUrl("/application/pay/member-order/get-detail?id=${id}") : useDevBaseUrl("/pay/member-order/get-detail?id=${id}")

let customListApi = isAppEnd() ? useDevBaseUrl("/application/pay/page/getPage") : useDevBaseUrl("/pay/page/getPage")
let customDetailApi = isAppEnd() ? useDevBaseUrl("/application/pay/page/get-detail?id=${id}") : useDevBaseUrl("/pay/page/get-detail?id=${id}")
const schema = {
    "type": "page",
    "body": {
        "type": "tabs",
        "swipeable": true,
        "unmountOnExit": true,
        "tabs": [
            {
                "title": "平台会员订单",
                "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:platformMemberOrder:query')}" : "${false}",
                "tab": [
                    {
                        "type": "page",
                        "body": [
                            {
                                "type": "crud",
                                "syncLocation": false,
                                "autoFillHeight": true,
                                "api": {
                                    "method": "get",
                                    "url": useDevBaseUrl('/application/pay/member-order/platformPage'),
                                    "data": {
                                        "pageNo": "${page}",
                                        "pageSize": "${perPage}",
                                        "payStatus": "${payStatus|default:undefined}",
                                        "memberOrderType": "${memberOrderType|default:undefined}",
                                        "payTime[0]": "${payTime[0]|default:undefined}",
                                        "payTime[1]": "${payTime[1]|default:undefined}",
                                        "createTime[0]": "${createTime[0]|default:undefined}",
                                        "createTime[1]": "${createTime[1]|default:undefined}",
                                    },
                                    adaptor: function (payload:any) {
                                        if (payload?.data?.list) {
                                            payload?.data?.list.forEach(i=>{
                                                i.unitPrice = (i.unitPrice/100)
                                                i.price = (i.price/100)
                                            })
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, items: payload.data?.list }
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
                                        "name": 'id',
                                        "label": '会员订单编号'
                                    },
                                    {
                                        "name": 'userId',
                                        "label": '用户编号',
                                    },
                                    {
                                        "name": 'nickname',
                                        "label": '用户昵称',
                                    },
                                    {
                                        "name": 'username',
                                        "label": '用户账号',
                                    },
                                    {
                                        "name": 'memberLevelName',
                                        "label": '等级名称',
                                    },
                                    {
                                        "name": 'productCount',
                                        "label": '购买的商品数量',
                                    },
                                    {
                                        "name": 'paymentCycle',
                                        "label": '付款周期',
                                        "type": 'mapping',
                                        "map": {
                                            '1': "<span>月付</span>",
                                            '2': "<span>季付</span>",
                                            '3': "<span>年付</span>",
                                        },
                                    },
                                    {
                                        "name": 'unitPrice',
                                        "label": '单价(月)/元',
                                    },
                                    {
                                        "name": 'discount',
                                        "label": '折扣百分比',
                                    },
                                    {
                                        "name": 'price',
                                        "label": '总价/元',
                                    },
                                    {
                                        "name": 'payStatus',
                                        "label": '订单状态',
                                        "type": 'mapping',
                                        "map": {
                                            '0': "<span>未支付</span>",
                                            '1': "<span>已支付</span>",
                                            '2': "<span>已取消</span>",
                                        },
                                        "searchable": {
                                            "type": 'select',
                                            "name": 'payStatus',
                                            "label": '订单状态',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "size": 'sm',
                                            "options": [
                                                {
                                                    "label": "未支付",
                                                    "value": "0",
                                                },
                                                {
                                                    "label": "已支付",
                                                    "value": "1",
                                                },
                                                {
                                                    "label": "已取消",
                                                    "value": "2",
                                                },
                                            ]
                                        }
                                    },
                                    {
                                        "name": 'payOrderId',
                                        "label": '支付订单编号',
                                    },
                                    {
                                        "name": 'memberOrderType',
                                        "label": '会员订单类型',
                                        "type": 'mapping',
                                        "map": {
                                            '1': "<span>新购/续费</span>",
                                            '2': "<span>升级</span>",
                                        },
                                        "searchable": {
                                            "type": 'select',
                                            "name": 'memberOrderType',
                                            "label": '会员订单类型',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "size": 'sm',
                                            "options": [
                                                {
                                                    "label": "新购/续费",
                                                    "value": "1",
                                                },
                                                {
                                                    "label": "升级",
                                                    "value": "2",
                                                },
                                            ]
                                        }
                                    },
                                    {
                                        "name": 'payChannelCode',
                                        "label": '支付成功的支付渠道',
                                        "type": 'mapping',
                                        "map": {
                                            'wx_pub': "<span class='label label-info'>微信 JSAPI 支付</span>",
                                            'wx_lite': "<span class='label label-info'>微信小程序支付</span>",
                                            'wx_app': "<span class='label label-info'>微信 App 支付</span>",
                                            'wx_native': "<span class='label label-info'>微信 Native 支付</span>",
                                            'wx_wap': "<span class='label label-info'>微信 Wap 网站支付</span>",
                                            'wx_bar': "<span class='label label-info'>微信付款码支付</span>",
                                            'alipay_pc': "<span class='label label-info'>支付宝 PC 网站支付</span>",
                                            'alipay_wap': "<span class='label label-info'>支付宝 Wap 网站支付</span>",
                                            'alipay_app': "<span class='label label-info'>支付宝App 支付</span>",
                                            'alipay_qr': "<span class='label label-info'>支付宝扫码支付</span>",
                                            'alipay_bar': "<span class='label label-info'>支付宝条码支付</span>",
                                        }
                                    },
                                    {
                                        "name": 'payTime',
                                        "label": '订单支付时间 ',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '订单支付时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "payTime[0]",
                                            "extraName": "payTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
                                    },
                                    {
                                        "name": 'createTime',
                                        "label": '创建时间',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '创建时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "createTime[0]",
                                            "extraName": "createTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
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
                                                        id: "${id}"
                                                    },
                                                    "body": {
                                                        "type": "form",
                                                        "initApi": {
                                                            "method": "get",
                                                            "url": memberDetailApi,
                                                            adaptor: function (payload:any) {
                                                                if(payload.data.paymentCycle == 1){
                                                                    payload.data.paymentCycle = '月付'
                                                                } else if (payload.data.paymentCycle == 2) {
                                                                    payload.data.paymentCycle = '季付'
                                                                } else {
                                                                    payload.data.paymentCycle = '年付'
                                                                }
                                                                if(payload.data.payStatus == 0){
                                                                    payload.data.payStatus = '未支付'
                                                                } else if (payload.data.payStatus == 1) {
                                                                    payload.data.payStatus = '已支付'
                                                                } else {
                                                                    payload.data.payStatus = '已取消'
                                                                }
                                                                if(payload.data.memberOrderType == 1){
                                                                    payload.data.memberOrderType = '新购/续费'
                                                                } else if (payload.data.memberOrderType == 2) {
                                                                    payload.data.memberOrderType = '升级'
                                                                }

                                                                if(payload.data.payChannelCode == 'wx_pub') {
                                                                    payload.data.payChannelCode = '微信 JSAPI 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_lite') {
                                                                    payload.data.payChannelCode = '微信小程序支付'
                                                                } else if (payload.data.payChannelCode == 'wx_app') {
                                                                    payload.data.payChannelCode = '微信 App 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_native') {
                                                                    payload.data.payChannelCode = '微信 Native 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_wap') {
                                                                    payload.data.payChannelCode = '微信 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'wx_bar') {
                                                                    payload.data.payChannelCode = '微信付款码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_pc') {
                                                                    payload.data.payChannelCode = '支付宝 PC 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_wap') {
                                                                    payload.data.payChannelCode = '支付宝 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_app') {
                                                                    payload.data.payChannelCode = '支付宝App 支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_qr') {
                                                                    payload.data.payChannelCode = '支付宝扫码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_bar') {
                                                                    payload.data.payChannelCode = '支付宝条码支付'
                                                                }
                                                                payload.data.unitPrice = payload.data.unitPrice/100
                                                                payload.data.price = payload.data.price/100
                                                                payload.data.subject = payload.data.payOrderDetails.subject
                                                                payload.data.body = payload.data.payOrderDetails.body
                                                                // payload.data.notifyUrl = payload.data.payOrderDetails.notifyUrl
                                                                return {
                                                                    ...payload,
                                                                    status: payload.code,
                                                                    data: { ...payload?.data, }
                                                                };
                                                            }
                                                        },
                                                        "body": [
                                                            {
                                                                "type": "input-text",
                                                                "name": "id",
                                                                "label": "会员订单编号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "userId",
                                                                "label": "用户编号",
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
                                                                "name": "username",
                                                                "label": "用户账号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "memberLevelName",
                                                                "label": "等级名称",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "productCount",
                                                                "label": "购买的商品数量",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "paymentCycle",
                                                                "label": "付款周期",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "unitPrice",
                                                                "label": "单价",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "discount",
                                                                "label": "折扣百分比",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "price",
                                                                "label": "总价",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payStatus",
                                                                "label": "订单状态",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payOrderId",
                                                                "label": "支付订单编号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "memberOrderType",
                                                                "label": "会员订单类型",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payChannelCode",
                                                                "label": "支付成功的支付渠道",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payTime",
                                                                "label": "订单支付时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "createTime",
                                                                "label": "创建时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "subject",
                                                                "label": "支付单商品标题",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "body",
                                                                "label": "商品描述",
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
                ]
            },
            {
                "title": "应用会员订单",
                "visibleOn": isEditorialEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'devApp:memberOrder:query')}" : "${ARRAYINCLUDES(${$$permissionsData},'app:memberOrder:query')}",
                "tab": [
                    {
                        "type": "page",
                        "body": [
                            {
                                "type": "crud",
                                "syncLocation": false,
                                "autoFillHeight": true,
                                "api": {
                                    "method": "get",
                                    "url": memberListApi,
                                    "data": {
                                        "pageNo": "${page}",
                                        "pageSize": "${perPage}",
                                        "tenantName": "${tenantName|default:undefined}",
                                        "payStatus": "${payStatus|default:undefined}",
                                        "memberOrderType": "${memberOrderType|default:undefined}",
                                        "payTime[0]": "${payTime[0]|default:undefined}",
                                        "payTime[1]": "${payTime[1]|default:undefined}",
                                        "createTime[0]": "${createTime[0]|default:undefined}",
                                        "createTime[1]": "${createTime[1]|default:undefined}",
                                    },
                                    adaptor: function (payload:any) {
                                        if (payload?.data?.list) {
                                            payload?.data?.list.forEach(i=>{
                                                i.unitPrice = (i.unitPrice/100)
                                                i.price = (i.price/100)
                                            })
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, items: payload.data?.list }
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
                                        "name": 'id',
                                        "label": '会员订单编号'
                                    },
                                    {
                                        "name": 'appTenantName',
                                        "label": '应用租户',
                                        "searchable": {
                                            "type": 'input-text',
                                            "name": 'appTenantName',
                                            "label": '应用租户',
                                            "placeholder": '请输入应用租户',
                                            "clearable": true,
                                        }, 
                                        "visibleOn": isEditorialEnd() ? "${true}" : "${false}"
                                    },
                                    {
                                        "name": 'userId',
                                        "label": '用户编号',
                                    },
                                    {
                                        "name": 'nickname',
                                        "label": '用户昵称',
                                    },
                                    {
                                        "name": 'username',
                                        "label": '用户账号',
                                    },
                                    {
                                        "name": 'memberLevelName',
                                        "label": '等级名称',
                                    },
                                    {
                                        "name": 'productCount',
                                        "label": '购买的商品数量',
                                    },
                                    {
                                        "name": 'paymentCycle',
                                        "label": '付款周期',
                                        "type": 'mapping',
                                        "map": {
                                            '1': "<span>月付</span>",
                                            '2': "<span>季付</span>",
                                            '3': "<span>年付</span>",
                                        },
                                    },
                                    {
                                        "name": 'unitPrice',
                                        "label": '单价(月)/元',
                                    },
                                    {
                                        "name": 'discount',
                                        "label": '折扣百分比',
                                    },
                                    {
                                        "name": 'price',
                                        "label": '总价/元',
                                    },
                                    {
                                        "name": 'payStatus',
                                        "label": '订单状态',
                                        "type": 'mapping',
                                        "map": {
                                            '0': "<span>未支付</span>",
                                            '1': "<span>已支付</span>",
                                            '2': "<span>已取消</span>",
                                        },
                                        "searchable": {
                                            "type": 'select',
                                            "name": 'payStatus',
                                            "label": '订单状态',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "size": 'sm',
                                            "options": [
                                                {
                                                    "label": "未支付",
                                                    "value": "0",
                                                },
                                                {
                                                    "label": "已支付",
                                                    "value": "1",
                                                },
                                                {
                                                    "label": "已取消",
                                                    "value": "2",
                                                },
                                            ]
                                        }
                                    },
                                    {
                                        "name": 'payOrderId',
                                        "label": '支付订单编号',
                                    },
                                    {
                                        "name": 'memberOrderType',
                                        "label": '会员订单类型',
                                        "type": 'mapping',
                                        "map": {
                                            '1': "<span>新购/续费</span>",
                                            '2': "<span>升级</span>",
                                        },
                                        "searchable": {
                                            "type": 'select',
                                            "name": 'memberOrderType',
                                            "label": '会员订单类型',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "size": 'sm',
                                            "options": [
                                                {
                                                    "label": "新购/续费",
                                                    "value": "1",
                                                },
                                                {
                                                    "label": "升级",
                                                    "value": "2",
                                                },
                                            ]
                                        }
                                    },
                                    {
                                        "name": 'payChannelCode',
                                        "label": '支付成功的支付渠道',
                                        "type": 'mapping',
                                        "map": {
                                            'wx_pub': "<span class='label label-info'>微信 JSAPI 支付</span>",
                                            'wx_lite': "<span class='label label-info'>微信小程序支付</span>",
                                            'wx_app': "<span class='label label-info'>微信 App 支付</span>",
                                            'wx_native': "<span class='label label-info'>微信 Native 支付</span>",
                                            'wx_wap': "<span class='label label-info'>微信 Wap 网站支付</span>",
                                            'wx_bar': "<span class='label label-info'>微信付款码支付</span>",
                                            'alipay_pc': "<span class='label label-info'>支付宝 PC 网站支付</span>",
                                            'alipay_wap': "<span class='label label-info'>支付宝 Wap 网站支付</span>",
                                            'alipay_app': "<span class='label label-info'>支付宝App 支付</span>",
                                            'alipay_qr': "<span class='label label-info'>支付宝扫码支付</span>",
                                            'alipay_bar': "<span class='label label-info'>支付宝条码支付</span>",
                                        }
                                    },
                                    {
                                        "name": 'payTime',
                                        "label": '订单支付时间 ',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '订单支付时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "payTime[0]",
                                            "extraName": "payTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
                                    },
                                    {
                                        "name": 'createTime',
                                        "label": '创建时间',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '创建时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "createTime[0]",
                                            "extraName": "createTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
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
                                                        id: "${id}"
                                                    },
                                                    "body": {
                                                        "type": "form",
                                                        "initApi": {
                                                            "method": "get",
                                                            "url": memberDetailApi,
                                                            adaptor: function (payload:any) {
                                                                if(payload.data.paymentCycle == 1){
                                                                    payload.data.paymentCycle = '月付'
                                                                } else if (payload.data.paymentCycle == 2) {
                                                                    payload.data.paymentCycle = '季付'
                                                                } else {
                                                                    payload.data.paymentCycle = '年付'
                                                                }
                                                                if(payload.data.payStatus == 0){
                                                                    payload.data.payStatus = '未支付'
                                                                } else if (payload.data.payStatus == 1) {
                                                                    payload.data.payStatus = '已支付'
                                                                } else {
                                                                    payload.data.payStatus = '已取消'
                                                                }
                                                                if(payload.data.memberOrderType == 1){
                                                                    payload.data.memberOrderType = '新购/续费'
                                                                } else if (payload.data.memberOrderType == 2) {
                                                                    payload.data.memberOrderType = '升级'
                                                                }

                                                                if(payload.data.payChannelCode == 'wx_pub') {
                                                                    payload.data.payChannelCode = '微信 JSAPI 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_lite') {
                                                                    payload.data.payChannelCode = '微信小程序支付'
                                                                } else if (payload.data.payChannelCode == 'wx_app') {
                                                                    payload.data.payChannelCode = '微信 App 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_native') {
                                                                    payload.data.payChannelCode = '微信 Native 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_wap') {
                                                                    payload.data.payChannelCode = '微信 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'wx_bar') {
                                                                    payload.data.payChannelCode = '微信付款码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_pc') {
                                                                    payload.data.payChannelCode = '支付宝 PC 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_wap') {
                                                                    payload.data.payChannelCode = '支付宝 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_app') {
                                                                    payload.data.payChannelCode = '支付宝App 支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_qr') {
                                                                    payload.data.payChannelCode = '支付宝扫码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_bar') {
                                                                    payload.data.payChannelCode = '支付宝条码支付'
                                                                }
                                                                payload.data.unitPrice = payload.data.unitPrice/100
                                                                payload.data.price = payload.data.price/100
                                                                payload.data.subject = payload.data.payOrderDetails.subject
                                                                payload.data.body = payload.data.payOrderDetails.body
                                                                // payload.data.notifyUrl = payload.data.payOrderDetails.notifyUrl
                                                                return {
                                                                    ...payload,
                                                                    status: payload.code,
                                                                    data: { ...payload?.data, }
                                                                };
                                                            }
                                                        },
                                                        "body": [
                                                            {
                                                                "type": "input-text",
                                                                "name": "id",
                                                                "label": "会员订单编号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "userId",
                                                                "label": "用户编号",
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
                                                                "name": "username",
                                                                "label": "用户账号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "memberLevelName",
                                                                "label": "等级名称",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "productCount",
                                                                "label": "购买的商品数量",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "paymentCycle",
                                                                "label": "付款周期",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "unitPrice",
                                                                "label": "单价",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "discount",
                                                                "label": "折扣百分比",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "price",
                                                                "label": "总价",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payStatus",
                                                                "label": "订单状态",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payOrderId",
                                                                "label": "支付订单编号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "memberOrderType",
                                                                "label": "会员订单类型",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payChannelCode",
                                                                "label": "支付成功的支付渠道",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payTime",
                                                                "label": "订单支付时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "createTime",
                                                                "label": "创建时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "subject",
                                                                "label": "支付单商品标题",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "body",
                                                                "label": "商品描述",
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
                ]
            },
            {
                "title": "数据量订单",
                "visibleOn": isAppEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'app:quota-order:query')}" : "${false}",
                "tab": [
                    {
                        "type": "page",
                        "body": [
                            {
                                "type": "crud",
                                "syncLocation": false,
                                "autoFillHeight": true,
                                "api": {
                                    "method": "get",
                                    "url": useDevBaseUrl('/application/pay/quota-order/self/page'),
                                    "data": {
                                        "pageNo": "${page}",
                                        "pageSize": "${perPage}",
                                        "payStatus": "${payStatus|default:undefined}",
                                        "memberOrderType": "${memberOrderType|default:undefined}",
                                        "payTime[0]": "${payTime[0]|default:undefined}",
                                        "payTime[1]": "${payTime[1]|default:undefined}",
                                        "createTime[0]": "${createTime[0]|default:undefined}",
                                        "createTime[1]": "${createTime[1]|default:undefined}",
                                    },
                                    adaptor: function (payload:any) {
                                        if (payload?.data?.list) {
                                            payload?.data?.list.forEach(i=>{
                                                i.aiUnitPrice = (i.aiUnitPrice/100)
                                                i.aiPrice = (i.aiPrice/100)
                                                i.storageUnitPrice = (i.storageUnitPrice/100)
                                                i.storagePrice = (i.storagePrice/100)
                                                i.dataUnitPrice = (i.dataUnitPrice/100)
                                                i.dataPrice = (i.dataPrice/100)
                                                i.price = (i.price/100)
                                            })
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, items: payload.data?.list }
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
                                        "name": 'userId',
                                        "label": '用户编号',
                                    },
                                    {
                                        "name": 'nickname',
                                        "label": '用户昵称',
                                    },
                                    {
                                        "name": 'username',
                                        "label": '用户账号',
                                    },
                                    {
                                        "name": 'aiUnitPrice',
                                        "label": 'ai单价/元',
                                    },
                                    {
                                        "name": 'aiCount',
                                        "label": '购买的ai数量',
                                    },
                                    {
                                        "name": 'aiPrice',
                                        "label": 'ai价格/元',
                                    },
                                    {
                                        "name": 'storageUnitPrice',
                                        "label": '对象存储单价/元',
                                    },
                                    {
                                        "name": 'storageCount',
                                        "label": '购买的对象存储数量',
                                    },
                                    {
                                        "name": 'storagePrice',
                                        "label": '对象存储价格/元',
                                    },
                                    {
                                        "name": 'dataUnitPrice',
                                        "label": '数据条数单价/元',

                                    },
                                    {
                                        "name": 'dataCount',
                                        "label": '购买的数据条数数量',
                                    },
                                    {
                                        "name": 'dataPrice',
                                        "label": '数据条数价格/元',
                                    },
                                    {
                                        "name": 'price',
                                        "label": '总价格/元',
                                    },
                                    {
                                        "name": 'payStatus',
                                        "label": '订单状态',
                                        "type": 'mapping',
                                        "map": {
                                            '0': "<span>未支付</span>",
                                            '1': "<span>已支付</span>",
                                            '2': "<span>已取消</span>",
                                        },
                                        "searchable": {
                                            "type": 'select',
                                            "name": 'payStatus',
                                            "label": '订单状态',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "size": 'sm',
                                            "options": [
                                                {
                                                    "label": "未支付",
                                                    "value": "0",
                                                },
                                                {
                                                    "label": "已支付",
                                                    "value": "1",
                                                },
                                                {
                                                    "label": "已取消",
                                                    "value": "2",
                                                },
                                            ]
                                        }
                                    },
                                    {
                                        "name": 'payOrderId',
                                        "label": '支付订单编号',
                                    },
                                    {
                                        "name": 'payChannelCode',
                                        "label": '支付成功的支付渠道',
                                        "type": 'mapping',
                                        "map": {
                                            'wx_pub': "<span class='label label-info'>微信 JSAPI 支付</span>",
                                            'wx_lite': "<span class='label label-info'>微信小程序支付</span>",
                                            'wx_app': "<span class='label label-info'>微信 App 支付</span>",
                                            'wx_native': "<span class='label label-info'>微信 Native 支付</span>",
                                            'wx_wap': "<span class='label label-info'>微信 Wap 网站支付</span>",
                                            'wx_bar': "<span class='label label-info'>微信付款码支付</span>",
                                            'alipay_pc': "<span class='label label-info'>支付宝 PC 网站支付</span>",
                                            'alipay_wap': "<span class='label label-info'>支付宝 Wap 网站支付</span>",
                                            'alipay_app': "<span class='label label-info'>支付宝App 支付</span>",
                                            'alipay_qr': "<span class='label label-info'>支付宝扫码支付</span>",
                                            'alipay_bar': "<span class='label label-info'>支付宝条码支付</span>",
                                        }
                                    },
                                    {
                                        "name": 'payTime',
                                        "label": '订单支付时间 ',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '订单支付时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "payTime[0]",
                                            "extraName": "payTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
                                    },
                                    {
                                        "name": 'createTime',
                                        "label": '创建时间',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '创建时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "createTime[0]",
                                            "extraName": "createTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
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
                                                        id: "${id}"
                                                    },
                                                    "body": {
                                                        "type": "form",
                                                        "initApi": {
                                                            "method": "get",
                                                            "url": useDevBaseUrl('/application/pay/quota-order/self/get-detail?id=${id}'),
                                                            adaptor: function (payload:any) {
                                                                if(payload.data.paymentCycle == 1){
                                                                    payload.data.paymentCycle = '月付'
                                                                } else if (payload.data.paymentCycle == 2) {
                                                                    payload.data.paymentCycle = '季付'
                                                                } else {
                                                                    payload.data.paymentCycle = '年付'
                                                                }
                                                                if(payload.data.payStatus == 0){
                                                                    payload.data.payStatus = '未支付'
                                                                } else if (payload.data.payStatus == 1) {
                                                                    payload.data.payStatus = '已支付'
                                                                } else {
                                                                    payload.data.payStatus = '已取消'
                                                                }
                                                                if(payload.data.memberOrderType == 1){
                                                                    payload.data.memberOrderType = '新购/续费'
                                                                } else if (payload.data.memberOrderType == 2) {
                                                                    payload.data.memberOrderType = '升级'
                                                                }

                                                                if(payload.data.payChannelCode == 'wx_pub') {
                                                                    payload.data.payChannelCode = '微信 JSAPI 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_lite') {
                                                                    payload.data.payChannelCode = '微信小程序支付'
                                                                } else if (payload.data.payChannelCode == 'wx_app') {
                                                                    payload.data.payChannelCode = '微信 App 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_native') {
                                                                    payload.data.payChannelCode = '微信 Native 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_wap') {
                                                                    payload.data.payChannelCode = '微信 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'wx_bar') {
                                                                    payload.data.payChannelCode = '微信付款码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_pc') {
                                                                    payload.data.payChannelCode = '支付宝 PC 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_wap') {
                                                                    payload.data.payChannelCode = '支付宝 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_app') {
                                                                    payload.data.payChannelCode = '支付宝App 支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_qr') {
                                                                    payload.data.payChannelCode = '支付宝扫码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_bar') {
                                                                    payload.data.payChannelCode = '支付宝条码支付'
                                                                }
                                                                payload.data.aiUnitPrice = payload.data.aiUnitPrice/100
                                                                payload.data.aiPrice = payload.data.aiPrice/100
                                                                payload.data.storageUnitPrice = payload.data.storageUnitPrice/100
                                                                payload.data.storagePrice = payload.data.storagePrice/100
                                                                payload.data.dataUnitPrice = payload.data.dataUnitPrice/100
                                                                payload.data.dataPrice = payload.data.dataPrice/100
                                                                payload.data.price = payload.data.price/100
                                                                payload.data.subject = payload.data.payOrderDetails.subject
                                                                payload.data.body = payload.data.payOrderDetails.body
                                                                // payload.data.notifyUrl = payload.data.payOrderDetails.notifyUrl
                                                                return {
                                                                    ...payload,
                                                                    status: payload.code,
                                                                    data: { ...payload?.data, }
                                                                };
                                                            }
                                                        },
                                                        "body": [
                                                            {
                                                                "type": "input-text",
                                                                "name": "userId",
                                                                "label": "用户编号",
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
                                                                "name": "username",
                                                                "label": "用户账号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "aiUnitPrice",
                                                                "label": "ai单价/元",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "aiCount",
                                                                "label": "购买的ai数量",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "aiPrice",
                                                                "label": "ai价格/元",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "storageUnitPrice",
                                                                "label": "对象存储单价/元",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "storageCount",
                                                                "label": "购买的对象存储数量",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "storagePrice",
                                                                "label": "对象存储价格/元",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "dataUnitPrice",
                                                                "label": "数据条数单价/元",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "dataCount",
                                                                "label": "购买的数据条数数量",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "dataPrice",
                                                                "label": "数据条数价格/元",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "price",
                                                                "label": "总价格/元",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payStatus",
                                                                "label": "订单状态",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payOrderId",
                                                                "label": "支付订单编号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payChannelCode",
                                                                "label": "支付成功的支付渠道",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payTime",
                                                                "label": "订单支付时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "createTime",
                                                                "label": "创建时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "subject",
                                                                "label": "支付单商品标题",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "body",
                                                                "label": "商品描述",
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
                ]
            },
            {
                "title": "自定义支付订单",
                "visibleOn": isEditorialEnd() ? "${ARRAYINCLUDES(${$$permissionsData},'devApp:pageOrder:query')}" : "${ARRAYINCLUDES(${$$permissionsData},'app:pageOrder:query')}",
                "tab": [
                    {
                        "type": "page",
                        "body": [
                            {
                                "type": "crud",
                                "syncLocation": false,
                                "autoFillHeight": true,
                                "api": {
                                    "method": "get",
                                    "url": customListApi,
                                    "data": {
                                        "pageNo": "${page}",
                                        "pageSize": "${perPage}",
                                        "type": "${type|default:undefined}",
                                        "payStatus": "${payStatus|default:undefined}",
                                        "payTime[0]": "${payTime[0]|default:undefined}",
                                        "payTime[1]": "${payTime[1]|default:undefined}",
                                        "createTime[0]": "${createTime[0]|default:undefined}",
                                        "createTime[1]": "${createTime[1]|default:undefined}",
                                    },
                                    adaptor: function (payload:any) {
                                        if (payload?.data?.list) {
                                            payload?.data?.list.forEach(i=>{
                                                i.unitPrice = (i.unitPrice/100)
                                                i.price = (i.price/100)
                                            })
                                        }
                                        return {
                                            ...payload,
                                            status: payload.code,
                                            data: { ...payload.data, items: payload.data?.list }
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
                                        "name": 'id',
                                        "label": '订单编号'
                                    },
                                    {
                                        "name": 'name',
                                        "label": '订单名称'
                                    },
                                    {
                                        "name": 'userId',
                                        "label": '用户编号',
                                    },
                                    {
                                        "name": 'nickname',
                                        "label": '用户昵称',
                                    },
                                    {
                                        "name": 'username',
                                        "label": '用户账号',
                                    },
                                    {
                                        "name": 'type',
                                        "label": '订单类型',
                                        "searchable": {
                                            "type": 'input-text',
                                            "name": 'type',
                                            "label": '订单类型',
                                            "placeholder": '请输入订单类型',
                                            "clearable": true,
                                        }
                                    },
                                    {
                                        "name": 'desc',
                                        "label": '订单描述',
                                    },
                                    {
                                        "name": 'price',
                                        "label": '价格/元',
                                    },
                                    {
                                        "name": 'payStatus',
                                        "label": '订单状态',
                                        "type": 'mapping',
                                        "map": {
                                            '0': "<span>未支付</span>",
                                            '1': "<span>已支付</span>",
                                            '2': "<span>已取消</span>",
                                        },
                                        "searchable": {
                                            "type": 'select',
                                            "name": 'payStatus',
                                            "label": '订单状态',
                                            "placeholder": '请选择',
                                            "clearable": true,
                                            "size": 'sm',
                                            "options": [
                                                {
                                                    "label": "未支付",
                                                    "value": "0",
                                                },
                                                {
                                                    "label": "已支付",
                                                    "value": "1",
                                                },
                                                {
                                                    "label": "已取消",
                                                    "value": "2",
                                                },
                                            ]
                                        }
                                    },
                                    {
                                        "name": 'payOrderId',
                                        "label": '支付订单编号',
                                    },
                                    {
                                        "name": 'payChannelCode',
                                        "label": '支付成功的支付渠道',
                                        "type": 'mapping',
                                        "map": {
                                            'wx_pub': "<span class='label label-info'>微信 JSAPI 支付</span>",
                                            'wx_lite': "<span class='label label-info'>微信小程序支付</span>",
                                            'wx_app': "<span class='label label-info'>微信 App 支付</span>",
                                            'wx_native': "<span class='label label-info'>微信 Native 支付</span>",
                                            'wx_wap': "<span class='label label-info'>微信 Wap 网站支付</span>",
                                            'wx_bar': "<span class='label label-info'>微信付款码支付</span>",
                                            'alipay_pc': "<span class='label label-info'>支付宝 PC 网站支付</span>",
                                            'alipay_wap': "<span class='label label-info'>支付宝 Wap 网站支付</span>",
                                            'alipay_app': "<span class='label label-info'>支付宝App 支付</span>",
                                            'alipay_qr': "<span class='label label-info'>支付宝扫码支付</span>",
                                            'alipay_bar': "<span class='label label-info'>支付宝条码支付</span>",
                                        }
                                    },
                                    {
                                        "name": 'payTime',
                                        "label": '订单支付时间 ',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '订单支付时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "payTime[0]",
                                            "extraName": "payTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
                                    },
                                    {
                                        "name": 'createTime',
                                        "label": '创建时间',
                                        "searchable": {
                                            "type": 'input-datetime-range',
                                            "label": '创建时间',
                                            "inputFormat": "YYYY-MM-DD HH:mm:ss",
                                            "format": "YYYY-MM-DD HH:mm:ss",
                                            "timeFormat": "HH:mm:ss",
                                            "name": "createTime[0]",
                                            "extraName": "createTime[1]",
                                            "clearable": true,
                                            "size": 'sm'
                                        }
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
                                                        id: "${id}"
                                                    },
                                                    "body": {
                                                        "type": "form",
                                                        "initApi": {
                                                            "method": "get",
                                                            "url": customDetailApi,
                                                            adaptor: function (payload:any) {
                                                                if(payload.data.payStatus == 0){
                                                                    payload.data.payStatus = '未支付'
                                                                } else if (payload.data.payStatus == 1) {
                                                                    payload.data.payStatus = '已支付'
                                                                } else {
                                                                    payload.data.payStatus = '已取消'
                                                                }
                                                                if(payload.data.payChannelCode == 'wx_pub') {
                                                                    payload.data.payChannelCode = '微信 JSAPI 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_lite') {
                                                                    payload.data.payChannelCode = '微信小程序支付'
                                                                } else if (payload.data.payChannelCode == 'wx_app') {
                                                                    payload.data.payChannelCode = '微信 App 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_native') {
                                                                    payload.data.payChannelCode = '微信 Native 支付'
                                                                } else if (payload.data.payChannelCode == 'wx_wap') {
                                                                    payload.data.payChannelCode = '微信 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'wx_bar') {
                                                                    payload.data.payChannelCode = '微信付款码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_pc') {
                                                                    payload.data.payChannelCode = '支付宝 PC 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_wap') {
                                                                    payload.data.payChannelCode = '支付宝 Wap 网站支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_app') {
                                                                    payload.data.payChannelCode = '支付宝App 支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_qr') {
                                                                    payload.data.payChannelCode = '支付宝扫码支付'
                                                                } else if (payload.data.payChannelCode == 'alipay_bar') {
                                                                    payload.data.payChannelCode = '支付宝条码支付'
                                                                }
                                                                payload.data.price = payload.data.price/100
                                                                payload.data.subject = payload.data.payOrderDetails.subject
                                                                payload.data.body = payload.data.payOrderDetails.body
                                                                payload.data.notifyUrl = payload.data.payOrderDetails.notifyUrl
                                                                return {
                                                                    ...payload,
                                                                    status: payload.code,
                                                                    data: { ...payload?.data, }
                                                                };
                                                            }
                                                        },
                                                        "body": [
                                                            {
                                                                "type": "input-text",
                                                                "name": 'id',
                                                                "label": '订单编号',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": 'name',
                                                                "label": '订单名称',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": 'userId',
                                                                "label": '用户编号',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": 'nickname',
                                                                "label": '用户昵称',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": 'username',
                                                                "label": '用户账号',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": 'type',
                                                                "label": '订单类型',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": 'desc',
                                                                "label": '订单描述',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": 'price',
                                                                "label": '价格/元',
                                                                "static": true,
                                                            },
                                                            {
                                                                "name": 'payStatus',
                                                                "label": '订单状态',
                                                                "type": 'input-text',
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payOrderId",
                                                                "label": "支付订单编号",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payChannelCode",
                                                                "label": "支付成功的支付渠道",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "payTime",
                                                                "label": "订单支付时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "createTime",
                                                                "label": "创建时间",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "subject",
                                                                "label": "支付单商品标题",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "input-text",
                                                                "name": "body",
                                                                "label": "商品描述",
                                                                "static": true,
                                                            },
                                                            {
                                                                "type": "static-json",
                                                                "name": "payNotifyTask",
                                                                "label": "支付通知单",
                                                                "static": true,
                                                                "visibleOn": isAppEnd() ? "${false}" : "${true}"
                                                            }
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
                ]
            }
        ]
    }
}
export default () => <AMISComponent schema={schema} />;
