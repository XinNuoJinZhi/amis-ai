---
component: audio
amis_version: v6.0.0
---

# audio

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"audio"` | 是 | 指定为音频播放器 |
| `inline` | `boolean` | 否 | 是否是内联模式 |
| `src` | `string` | 否 | "视频播放地址, 支持 $ 取变量。 |
| `loop` | `boolean` | 否 | 是否循环播放 |
| `autoPlay` | `boolean` | 否 | 是否自动播放 |
| `rates` | `number[]` | 否 | 配置可选播放倍速 |
| `controls` | `("time" \| "rates" \| "play" \| "process" \| "volume")[]` | 否 | 可以配置控制器 |
