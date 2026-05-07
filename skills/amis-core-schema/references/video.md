---
component: video
amis_version: v6.0.0
---

# video

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"video"` | 是 | 指定为视频类型 |
| `autoPlay` | `boolean` | 否 | 是否自动播放 |
| `columnsCount` | `number` | 否 | 如果显示切帧，通过此配置项可以控制每行显示多少帧 |
| `frames` | `{ [propName: string]: string; }` | 否 | 设置后，可以显示切帧.点击帧的时候会将视频跳到对应时间。<br><br>frames: {<br> '01:22': 'http://domain/xxx.jpg'<br>} |
| `framesClassName` | `SchemaClassName` | 否 | 配置帧列表容器className |
| `style` | `{ [propName: string]: any; }` | 否 |  |
| `isLive` | `boolean` | 否 | 如果是实时的，请标记一下 |
| `jumpFrame` | `boolean` | 否 | 点击帧画面时是否跳转视频对应的点 |
| `muted` | `boolean` | 否 | 是否初始静音 |
| `loop` | `boolean` | 否 | 是否循环播放 |
| `playerClassName` | `SchemaClassName` | 否 | 配置播放器 className |
| `poster` | `string` | 否 | 视频封面地址 |
| `splitPoster` | `boolean` | 否 | 是否将视频和封面分开显示 |
| `src` | `string` | 否 | 视频播放地址 |
| `videoType` | `string` | 否 | 视频类型如： video/x-flv |
| `aspectRatio` | `"auto" \| "4:3" \| "16:9"` | 否 | 视频比率 |
| `rates` | `number[]` | 否 | 视频速率 |
| `jumpBufferDuration` | `number` | 否 | 跳转到帧时，往前多少秒。 |
| `stopOnNextFrame` | `boolean` | 否 | 默认播放的时候到了下一帧会继续播放，同时高亮下一帧。<br>如果配置这个则会停止播放，等待用户选择新的区间再播放。 |
