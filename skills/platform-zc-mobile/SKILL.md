---
name: platform-zc-mobile
description: ZC 智搭低代码平台 小程序端业务规则、shopro 电商套件、app:// 协议约定（搭配 stack-uniapp + ui-wot + zc-amis-schema 使用）
type: knowledge
---

# ZC 智搭 小程序端业务规则

本桶给 Agent 在 **把 Amis JSON 出码成 ZC 小程序 (uniapp + Wot UI)** 时使用，约束 ZC 特有的业务套件、模板复用、API 协议。

跟以下桶配对使用：
- [`stack-uniapp/`](../stack-uniapp/) = uniapp 写法骨架（页面组织 / pages.json / 跳转 / 数据流）
- [`ui-wot/`](../ui-wot/) = Wot UI 组件库映射
- [`zc-amis-schema/`](../zc-amis-schema/) = 输入端 Amis JSON 含 ZC 二开 type 时查 schema
- 本桶 = 移动端业务模式 + ZC 协议层

## 何时被检索

- 用户任务 `template_name=zc-uniapp-mobile-template` 时 priority 升高，**system_prompt 直接注入**本 SKILL.md
- 跟 `_common` / `stack-uniapp` / `ui-wot` 并存

## ZC 小程序 vs 原版 uniapp+wot 选哪个

| 场景 | 选 | 理由 |
|---|---|---|
| 电商业务（商品 / 订单 / 购物车 / 优惠券 / 支付） | ZC `zc-uniapp-mobile-template`（含 shopro 套件） | 业务页结构成熟，直接基于 `pages/goods/*` / `pages/order/*` 增量 |
| OA 业务（部门 / 人员 / 待办 / 工作流） | 等 1.3.2 OA 套件移植 | 当前 1.3.1 仅含电商套件 |
| 纯展示 / 没有 ZC 业务背景 | 用 `uniapp-wot-h5-template`（1.2） | 减少耦合，启动更轻 |

## shopro 电商业务模板内置页（直接复用）

scaffold `pages/` 下已自带的业务页（**修改而非重写**）：

| 路径 | 内容 |
|---|---|
| `pages/index/` | 商城首页（banner + 分类 + 推荐） |
| `pages/goods/` | 商品列表 / 详情 / 评价 / 收藏 |
| `pages/order/` | 订单确认 / 详情 / 列表 / 售后 |
| `pages/pay/` | 收银台 / 结果页 |
| `pages/coupon/` | 优惠券列表 / 领取 / 我的 |
| `pages/user/` | 个人中心 / 地址 / 设置 / 资料 |
| `pages/activity/` | 拼团 / 秒杀 / 砍价 / 限时优惠 |
| `pages/chat/` | 客服对话 |
| `pages/commission/` | 分销中心 |

业务套件 `sheep/` 下：
- `sheep/api/` — 业务 API 调用封装
- `sheep/store/` — Pinia 状态管理（user / cart / app）
- `sheep/components/` — 业务组件（s-goods-card / s-cart-bar 等）
- `sheep/hooks/` — 业务 hooks（usePay / useAddress 等）

## ZC 特有协议与约定

### apicenter 数据源协议

ZC 私有 API 中台用 `app://` 协议（与 Web 端 [platform-zc-web](../platform-zc-web/SKILL.md) 一致）：

```js
// sheep/api/goods.js 等业务 API 文件默认用 ZC apicenter
import { request } from '@/sheep/request'
export default {
  list: (params) => request('app://goods/list', { params }),
  detail: (id) => request(`app://goods/detail/${id}`),
}
```

- sandbox 环境 `app://` 不通 → mock 成 `/api/goods/list` 或返回静态 JSON
- 生产部署时由 ZC 部署环境自动重写

### 多端构建命令

scaffold `package.json` scripts：
- `pnpm run dev:h5` → H5（sandbox 内默认，5173 端口）
- `pnpm run dev:mp-weixin` → 微信小程序（sandbox 不直接预览，输出 `dist/dev/mp-weixin/` 供导入微信开发者工具）
- `pnpm run build:h5` / `pnpm run build:mp-weixin` → 生产构建

sandbox 评测走 `dev:h5`，因为浏览器可访问。

## Amis JSON 翻译策略（小程序版）

LLM 拿到 Amis JSON 翻译成 uniapp + Wot 代码时：

1. **顶层 schema 映射**：
   - `type: "page"` → uniapp 页面 `.vue` 文件
   - `type: "crud"` → `pages/<entity>/list.vue` + `s-list` / `wd-list` 组件 + 下拉刷新 + 触底加载
   - `type: "form"` → `pages/<entity>/edit.vue` + `<wd-form>` + `<wd-input>` / `<wd-picker>`
   - `type: "service"` → `onLoad` 钩子内 API 调用 + `ref` 数据绑定

2. **ZC 二开 type 输入时**（用户 Amis JSON 含 `department-select` / `modeltable` 等）：
   - 先 `Skill({skill: "zc-amis-schema"})` 检索对应 `references/<type>.md` 看 schema
   - 翻译时找 shopro `sheep/components/` 同语义业务组件优先（如 `s-user-picker`）
   - 没有同语义组件 → 用 Wot 基础组件（`<wd-picker>` + 树形数据源）模拟

3. **路由生成**：
   - 每个 Amis JSON page → 在 `pages.json` 注册一条 route
   - 路由命名跟 scaffold 现有页结构对齐（业务实体名复数：`goods` / `orders` / `coupons`）

## 已知限制（sandbox 环境）

- `app://` 协议在 sandbox 不通 → 让 LLM 生成 mock 数据 fallback（参考 `sheep/api/` 现成 mock 模式）
- `mp-weixin` 编译输出不能浏览器预览 → 评测走 `dev:h5` 模式即可
- ZC 私有图表组件在 uniapp 端要换 `uchart` / `echarts-uniapp` 等开源替代

## 按需检索的业务模式 references

LLM 翻译 Amis JSON → uniapp 代码时按命中的 schema type **主动检索**对应模式（progressive disclosure 协议）：

- `references/list-pattern.md` — Amis `crud` → uniapp z-paging + s-goods-card 列表
- `references/detail-pattern.md` — Amis `page` + carousel/tpl/image → uniapp 详情布局
- `references/form-pattern.md` — Amis `form` + controls → uniapp wd-form + 校验
- `references/cart-pattern.md` — Amis `crud` + footerToolbar → uniapp 购物车 + 计价
- `references/api-pattern.md` — Amis `api: "app://..."` → uniapp sheep/api 封装 + mock

每个 reference 含「骨架代码 + 关键决策表 + scaffold 内可 Read 的同类参考页 + DO/DON'T」。

## 关联文档

- ZC Web 平台桶：[../platform-zc-web/SKILL.md](../platform-zc-web/SKILL.md)（协议层共享）
- ZC 组件 schema 桶：[../zc-amis-schema/SKILL.md](../zc-amis-schema/SKILL.md)
- uniapp 栈桶：[../stack-uniapp/SKILL.md](../stack-uniapp/SKILL.md)
- Wot UI 桶：[../ui-wot/SKILL.md](../ui-wot/SKILL.md)
- 1.3 设计：[../../docs/plans/2026-05-10-zc-amis-1.3-design.md](../../docs/plans/2026-05-10-zc-amis-1.3-design.md)
