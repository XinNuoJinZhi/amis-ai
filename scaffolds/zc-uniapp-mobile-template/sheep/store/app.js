import { defineStore } from 'pinia';
import $platform from '@/sheep/platform';
import $router from '@/sheep/router';
import sys from './sys';
import first1 from "@/static/images/1-001.png";
import first2 from "@/static/images/1-002.png";
import second1 from "@/static/images/2-001.png";
import second2 from "@/static/images/2-002.png";
import third1 from "@/static/images/3-001.png";
import third2 from "@/static/images/3-002.png";
import four1 from "@/static/images/4-001.png";
import four2 from "@/static/images/4-002.png";
import Api from "@/sheep/api/system/api"
const app = defineStore({
    id: 'app',
    state: () => ({
        info: {
            // 应用信息
            name: '', // 商城名称
            logo: '', // logo
            version: '', // 版本号
            copyright: '', // 版权信息 I
            copytime: '', // 版权信息 II

            cdnurl: '', // 云存储域名
            filesystem: '', // 云存储平台
        },
        platform: {
            share: {
                methods: [], // 支持的分享方式
                forwardInfo: {}, // 默认转发信息
                posterInfo: {}, // 海报信息
                linkAddress: '', // 复制链接地址
            },
            bind_mobile: 0, // 登陆后绑定手机号提醒 (弱提醒，可手动关闭)
        },
        template: {
            // 店铺装修模板
            basic: {}, // 基本信息
            home: {
                // 首页模板
                style: {},
                data: [],
            },
            user: {
                // 个人中心模板
                style: {},
                data: [],
            },
        },
        tabBarBadges: {
            // 键为tabBar的text，值为角标数，初始值从模板中取
            首页: 0,
            待办: 0,
            消息: 0,
            我的: 0
        },
        shareInfo: {}, // 全局分享信息
        has_wechat_trade_managed: 0, // 小程序发货信息管理  0 没有 || 1 有
    }),
    actions: {
        // 获取Shopro应用配置和模板
        async init(templateId = null) {
            // 检查网络
            const networkStatus = await $platform.checkNetwork();
            if (!networkStatus) {
                $router.error('NetworkError');
            }

            // 加载装修配置
            await adaptTemplate(this.template, templateId);
            if (this.template.basic?.tabbar?.items) {
                this.template.basic.tabbar.items.forEach(item => {
                    if (this.tabBarBadges[item.text] !== undefined) {
                        item.badge = this.tabBarBadges[item.text];
                    }
                });
            }
            // TODO 芋艿：未来支持管理后台可配；对应 https://api.shopro.sheepjs.com/shop/api/init
            // if (true) {
            //     this.info = {
            //         name: '芋道商城',
            //         logo: 'https://static.iocoder.cn/ruoyi-vue-pro-logo.png',
            //         version: '2.4.0',
            //         copyright: '全部开源，个人与企业可 100% 免费使用',
            //         copytime: 'Copyright© 2018-2024',

            //         cdnurl: 'https://file.sheepjs.com', // 云存储域名
            //         filesystem: 'qcloud', // 云存储平台
            //     };
            //     this.platform = {
            //         share: {
            //             methods: ['forward', 'poster', 'link'],
            //             linkAddress: 'http://127.0.0.1:3000', // TODO 芋艿：可以考虑改到 .env 那
            //             posterInfo: {
            //             user_bg: '/static/img/shop/config/user-poster-bg.png',
            //             goods_bg: '/static/img/shop/config/goods-poster-bg.png',
            //             groupon_bg: '/static/img/shop/config/groupon-poster-bg.png',
            //             },
            //             forwardInfo: {
            //             title: '',
            //             image: '',
            //             desc: '',
            //             },
            //         },
            //         bind_mobile: 0,
            //     };
            //     this.has_wechat_trade_managed = 0;

            //     // 加载主题
            //     const sysStore = sys();
            //     sysStore.setTheme();

            //     // 模拟用户登录
            //     // const userStore = user();
            //     // if (userStore.isLogin) {
            //     //   userStore.loginAfter();
            //     // }
            //     // return Promise.resolve(true);
            // } else {
            //     $router.error('InitError', res.msg || '加载失败');
            // }
        },
        // 新增：更新单个tabBar的角标值
        updateTabBarBadge(tabText, count) {
            // 1. 更新store中的角标状态
            this.tabBarBadges[tabText] = count;
            
            // 2. 更新template中的badge值（用于视图渲染）
            if (this.template.basic?.tabbar?.items) {
                const targetItem = this.template.basic.tabbar.items.find(
                    item => item.text === tabText
                );
                if (targetItem) {
                    targetItem.badge = count;
                    // 3. 调用uniapp API局部更新tabBar，不触发全局重渲染
                    const index = this.template.basic.tabbar.items.findIndex(
                        item => item.text === tabText
                    );
                    if (index > -1) {
                        uni.setTabBarBadge({
                            index,
                            text: count > 0 ? count.toString() : '', // 0则清空角标
                            fail: (err) => {
                                console.warn('更新tabBar角标失败:', err);
                            }
                        });
                    }
                }
            }
        },
        // 新增：请求接口获取最新角标数
        async fetchTabBarBadgeData() {
            try {
                // 替换为你的真实接口请求
                const res = await Api.getUnreadCount();
                const badgeData = {
                    '消息': res?.data ? res?.data : 0
                }
                // 遍历更新每个tab的角标
                Object.keys(badgeData).forEach(tabText => {
                    this.updateTabBarBadge(tabText, badgeData[tabText]);
                });
            } catch (err) {
                console.error('请求角标数据失败:', err);
            }
        },
        // 新增：启动定时更新任务
        startBadgeTimer() {
            // 立即执行一次
            this.fetchTabBarBadgeData();
            
            // 每隔2分钟执行一次（120000毫秒）
            const timer = setInterval(() => {
                this.fetchTabBarBadgeData();
            }, 120000);
            
            // 防止页面销毁后定时器残留（uniapp中需全局存储timer）
            uni.$tabBarBadgeTimer = timer;
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                key: 'app-store',
                // 持久化时排除定时器相关，只存必要状态
                paths: ['info', 'platform', 'template', 'tabBarBadges']
            },
        ],
    },
});

// todo: @owen 先做数据适配，后期重构
const adaptTemplate = async (appTemplate, templateId) => {
  // const { data: diyTemplate } = templateId
  //   ? // 查询指定模板，一般是预览时使用
  //     await DiyApi.getDiyTemplate(templateId)
  //   : await DiyApi.getUsedDiyTemplate();
  // // 模板不存在
  // if (!diyTemplate) {
  //   $router.error('TemplateError');
  //   return;
  // }

//   await DiyApi.getUsedDiyTemplate()

    const diyTemplate = {
        "id": 5,
        "name": "test1",
        "property": {
            "page": {
                "description": "",
                "backgroundColor": "#f5f5f5",
                "backgroundImage": ""
            },
            "navigationBar": {
                "title": "页面标题",
                "description": "",
                "navBarHeight": 35,
                "backgroundColor": "#fff",
                "backgroundImage": "",
                "styleType": "default",
                "alwaysShow": true,
                "showGoBack": true
            },
            "tabBar": {
                "theme": "red",
                "style": {
                    "bgType": "color",
                    "bgColor": "#fff",
                    "color": "#282828",
                    "activeColor": "#006ad4"
                },
                "items": [
                    {
                        "text": "首页",
                        "url": "/pages/index/index",
                        "iconUrl": first1,
                        "activeIconUrl": first2,
                        "icon": "home"
                    },
                    {
                        "text": "待办",
                        "url": "/pages/index/backlog",
                        "iconUrl": second1,
                        "activeIconUrl": second2,
                        "icon": "list"
                    },
                    {
                        "text": "消息",
                        "url": "/pages/index/notify",
                        "iconUrl": third1,
                        "activeIconUrl": third2,
                        "icon": "notification"
                    },
                    {
                        "text": "我的",
                        "url": "/pages/index/user",
                        "iconUrl": four1,
                        "activeIconUrl": four2,
                        "icon": "user"
                    }
                ]
            },
            "components": []
        },
        "home": {
            "page": {
                "description": "",
                "backgroundColor": "#f5f5f5",
                "backgroundImage": ""
            },
            "navigationBar": {
                "title": "阿巴阿巴",
                "description": "",
                "navBarHeight": 35,
                "backgroundColor": "#fff",
                "backgroundImage": "",
                "styleType": "default",
                "alwaysShow": true,
                "showGoBack": true
            },
            "components": [
                // {
                //     "id": "SearchBar",
                //     "property": {
                //         "height": 28,
                //         "showScan": false,
                //         "borderRadius": 0,
                //         "placeholder": "搜索商品",
                //         "placeholderPosition": "left",
                //         "backgroundColor": "rgb(238, 238, 238)",
                //         "textColor": "rgb(150, 151, 153)",
                //         "hotKeywords": [
                //             "手机",
                //             "电脑"
                //         ],
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "#fff",
                //             "marginBottom": 8,
                //             "paddingTop": 8,
                //             "paddingRight": 8,
                //             "paddingBottom": 8,
                //             "paddingLeft": 8
                //         }
                //     }
                // },
                // {
                //     "id": "Carousel",
                //     "property": {
                //         "type": "card",
                //         "indicator": "number",
                //         "autoplay": true,
                //         "interval": 3,
                //         "items": [
                //             {
                //                 "type": "img",
                //                 "imgUrl": "https://static.iocoder.cn/mall/banner-01.jpg",
                //                 "videoUrl": ""
                //             },
                //             {
                //                 "type": "img",
                //                 "imgUrl": "https://static.iocoder.cn/mall/banner-02.jpg",
                //                 "videoUrl": ""
                //             }
                //         ],
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "#fff",
                //             "marginBottom": 8
                //         }
                //     }
                // },
                // {
                //     "id": "MenuGrid",
                //     "property": {
                //         "column": 4,
                //         "list": [
                //             {
                //                 "title": "拼团",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000",
                //                     "text": "1"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/f4c02443eee97732f614d112afe79c6f3f85d43b6e17c4159d1aff73e180d8f9.png",
                //                 "url": "/pages/activity/groupon/list"
                //             },
                //             {
                //                 "title": "秒杀",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/a3d1416c107471b038a3f865af51b3f47e15adebfe84c55b4235e8126cc91a2c.png",
                //                 "url": "/pages/activity/seckill/list"
                //             },
                //             {
                //                 "title": "砍价",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/c4ce96eb6c71719f6a567e6cb90e526534e0315fc2dc3c5f3b6b6abb691ab87b.png",
                //                 "url": "/pages/coupon/list"
                //             },
                //             {
                //                 "title": "领劵",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/728ad2d53d002feab0e12abf4f323c1d47fe9ba9cddd1f4ff1125133a3e2dc07.png"
                //             },
                //             {
                //                 "title": "签到",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/04755b7db1ab6f2674f6fa6388e05d2573adb58d079596085c52f00d5aa07580.png",
                //                 "url": "/pages/app/sign"
                //             },
                //             {
                //                 "title": "分销",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/ae2f0e241fa730002e8a35d59815d047ccd85e814cfb2b4b01af511dbc4b4e0e.png",
                //                 "url": "/pages/commission/index"
                //             },
                //             {
                //                 "title": "商品",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/3544ce5e3466f10b92daec21c52166056b75cb3e68a921531c9b1daa6ac71b53.png",
                //                 "url": "/pages/goods/list"
                //             },
                //             {
                //                 "title": "收藏",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "iconUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/a4e493b1cd6b8d7475167baab48b76b770b2fc145897853dc9007abeaebbd9db.png",
                //                 "url": "/pages/user/goods-collect"
                //             }
                //         ],
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "#fff",
                //             "marginBottom": 8,
                //             "marginLeft": 8,
                //             "marginRight": 8,
                //             "padding": 8,
                //             "paddingTop": 8,
                //             "paddingRight": 8,
                //             "paddingBottom": 8,
                //             "paddingLeft": 8,
                //             "borderRadius": 8,
                //             "borderTopLeftRadius": 8,
                //             "borderTopRightRadius": 8,
                //             "borderBottomRightRadius": 8,
                //             "borderBottomLeftRadius": 8
                //         }
                //     }
                // },
                // {
                //     "id": "CouponCard",
                //     "property": {
                //         "columns": 2,
                //         "bgImg": "https://file.sheepjs.com/storage/decorate/20221115/046f2fddfc4f6778ff890a62547d8a1a.png",
                //         "textColor": "#E9B461",
                //         "button": {
                //             "color": "#434343",
                //             "bgColor": ""
                //         },
                //         "space": 0,
                //         "couponIds": [
                //             15,
                //             14,
                //             2,
                //             1
                //         ],
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "",
                //             "marginBottom": 8
                //         }
                //     }
                // },
                // {
                //     "id": "FloatingActionButton",
                //     "property": {
                //         "direction": "horizontal",
                //         "list": [
                //             {
                //                 "imgUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/e475dec5f7197646ea74decf3f67201de75bd80ba54db3f0d7c43a7e949bceca.jpg",
                //                 "textColor": "#FFFFFF",
                //                 "text": "客服"
                //             },
                //             {
                //                 "text": "首页",
                //                 "imgUrl": "http://127.0.0.1:48080/admin-api/infra/file/4/get/788ad4fc572a9613c54e6d2a972262f6939d902b09191ed3bd1d2cd89868e4ef.jpg",
                //                 "textColor": "#FFFFFF"
                //             }
                //         ],
                //         "showText": true
                //     }
                // },
                // {
                //     "id": "ProductCard",
                //     "property": {
                //         "layoutType": "oneColBigImg",
                //         "fields": {
                //             "name": {
                //                 "show": true,
                //                 "color": "#000"
                //             },
                //             "introduction": {
                //                 "show": true,
                //                 "color": "#999"
                //             },
                //             "price": {
                //                 "show": true,
                //                 "color": "#ff3000"
                //             },
                //             "marketPrice": {
                //                 "show": true,
                //                 "color": "#c4c4c4"
                //             },
                //             "salesCount": {
                //                 "show": true,
                //                 "color": "#c4c4c4"
                //             },
                //             "stock": {
                //                 "show": false,
                //                 "color": "#c4c4c4"
                //             }
                //         },
                //         "badge": {
                //             "show": false,
                //             "imgUrl": ""
                //         },
                //         "btnBuy": {
                //             "type": "text",
                //             "text": "立即购买",
                //             "bgBeginColor": "#FF6000",
                //             "bgEndColor": "#FE832A",
                //             "imgUrl": ""
                //         },
                //         "borderRadiusTop": 8,
                //         "borderRadiusBottom": 8,
                //         "space": 8,
                //         "spuIds": [
                //             633,
                //             634
                //         ],
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "",
                //             "marginLeft": 8,
                //             "marginRight": 8,
                //             "marginBottom": 8
                //         }
                //     }
                // }
            ]
        },
        "user": {
            "page": {
                "description": "",
                "backgroundColor": "#f5f5f5",
                "backgroundImage": "https://file.sheepjs.com/storage/decorate/20221115/b530150a466c8cda0a4cd5b29e2c8d11.png"
            },
            "navigationBar": {
                "title": "页面标题",
                "description": "",
                "navBarHeight": 35,
                "backgroundColor": "#fff",
                "backgroundImage": "",
                "styleType": "default",
                "alwaysShow": true,
                "showGoBack": true
            },
            "components": [
                {
                    "id": "UserCard",
                    "property": {
                        "style": {
                            "bgType": "img",
                            "bgColor": "",
                            "marginLeft": 8,
                            "marginRight": 8,
                            "marginBottom": 8
                        }
                    }
                },
                {
                    "id": "LogOut",
                    "property": {
                        "style": {
                            "bgType": "color",
                            "bgColor": "#fff",
                            "marginLeft": 8,
                            "marginRight": 8,
                            "marginBottom": 8
                        }
                    }
                },
                {
                    "id": "ChangePortal",
                    "property": {
                        "style": {
                            "bgType": "color",
                            "bgColor": "#fff",
                            "marginLeft": 8,
                            "marginRight": 8,
                            "marginBottom": 8
                        }
                    }
                }
                // {
                //     "id": "UserOrder",
                //     "property": {
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "#fff",
                //             "marginLeft": 8,
                //             "marginRight": 8,
                //             "marginBottom": 8
                //         }
                //     }
                // },
                // {
                //     "id": "UserWallet",
                //     "property": {
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "#FFF",
                //             "marginLeft": 8,
                //             "marginRight": 8,
                //             "marginBottom": 8
                //         }
                //     }
                // },
                // {
                //     "id": "UserCoupon",
                //     "property": {
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "#FFF",
                //             "marginLeft": 8,
                //             "marginRight": 8,
                //             "marginBottom": 8
                //         }
                //     }
                // },
                // {
                //     "id": "MenuGrid",
                //     "property": {
                //         "column": 4,
                //         "list": [
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/9ff8442f8cda57f88aac61059d7d3f21.png",
                //                 "title": "签到",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/app/sign"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/29559cc94ff33b1f39f570c5f7bc37c1.png",
                //                 "title": "充值",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/pay/recharge"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/5cb05c3cb99058ad38477205f9ecdcbb.png",
                //                 "title": "提现",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/pay/withdraw"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/9464fe770d388c7982df73b2d1b1d457.png",
                //                 "title": "设置",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/public/setting"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/ac3bdfced7c4c5f17f03b48f6d3fa3ec.png",
                //                 "title": "收藏",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/user/goods-collect"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/94eb324f16b6b48e65c4ea1cf7d3c1fd.png",
                //                 "title": "浏览足迹",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/user/goods-log"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/408f106f7e8d709156a45b6a96ea6d9c.png",
                //                 "title": "分销中心",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/commission/index"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/d49bc66b70c240bfa399f9f414bdbefa.png",
                //                 "title": "拼团订单",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/activity/groupon/order"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/0c37315a83f9424a4717ef684984c9c0.png",
                //                 "title": "常见问题",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/public/faq"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/58fe6c2a400d6d18a43949f3d8c58021.png",
                //                 "title": "积分商城",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/app/score-shop"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/6d0a8c85ba41464b5493226c91c72459.png",
                //                 "title": "关于我们",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/public/richtext?id=3"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/92bf692d57b8fc2e76815ce6627ef1f9.png",
                //                 "title": "隐私协议",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/public/richtext?id=2"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/26dff8fb21473e219c6f024fc6a5e39a.png",
                //                 "title": "收货地址",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/user/address/list"
                //             },
                //             {
                //                 "iconUrl": "https://file.sheepjs.com/storage/decorate/20221115/3c7eb06563d1cf28b4b34bb0d1647659.png",
                //                 "title": "联系客服",
                //                 "titleColor": "#333",
                //                 "subtitle": "",
                //                 "subtitleColor": "#bbb",
                //                 "badge": {
                //                     "show": false,
                //                     "textColor": "#fff",
                //                     "bgColor": "#FF6000"
                //                 },
                //                 "url": "/pages/chat/index"
                //             }
                //         ],
                //         "style": {
                //             "bgType": "color",
                //             "bgColor": "#fff",
                //             "marginBottom": 8,
                //             "marginLeft": 8,
                //             "marginRight": 8,
                //             "padding": 8,
                //             "paddingTop": 8,
                //             "paddingRight": 8,
                //             "paddingBottom": 8,
                //             "paddingLeft": 8,
                //             "borderRadius": 8,
                //             "borderTopLeftRadius": 8,
                //             "borderTopRightRadius": 8,
                //             "borderBottomRightRadius": 8,
                //             "borderBottomLeftRadius": 8
                //         }
                //     }
                // }
            ]
        }
    }
    console.log(127, diyTemplate)
    const tabBar = diyTemplate?.property?.tabBar;
    if (tabBar) {
        appTemplate.basic.tabbar = tabBar;
        // TODO 商城装修没有对 tabBar 进行角标配置，测试角标需打开以下注释
        appTemplate.basic.tabbar.items.forEach((tabBar) => {
            tabBar.dot = false
            tabBar.badge = 0
        })
        appTemplate.basic.tabbar.badgeStyle = {
            backgroundColor: '#882222',
        }
        if (tabBar?.theme) {
            appTemplate.basic.theme = tabBar?.theme;
        }
    }
    appTemplate.home = diyTemplate?.home;
    appTemplate.user = diyTemplate?.user;
};

export default app;
