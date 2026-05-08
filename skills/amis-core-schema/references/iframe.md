---
component: iframe
amis_version: v6.0.0
---

# iframe

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"iframe"` | 是 |  |
| `src` | `string` | 是 | 页面地址 |
| `events` | `{ [eventName: string]: ActionSchema; }` | 否 | 事件相应，配置后当 iframe 通过 postMessage 发送事件时，可以触发 AMIS 内部的动作。 |
| `onEvent` | `OnEventProps` | 否 |  |
| `width` | `string \| number` | 否 |  |
| `height` | `string \| number` | 否 |  |
| `allow` | `string` | 否 |  |
| `name` | `string` | 否 |  |
| `referrerpolicy` | `"no-referrer" \| "no-referrer-when-downgrade" \| "origin" \| "origin-when-cross-origin" \| "same-origin" \| "strict-origin" \| "strict-origin-when-cross-origin" \| "unsafe-url"` | 否 |  |
| `sandbox` | `string` | 否 |  |
