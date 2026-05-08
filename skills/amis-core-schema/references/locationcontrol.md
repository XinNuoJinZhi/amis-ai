---
component: locationcontrol
amis_version: v6.0.0
---

# locationcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"location-picker"` | 是 |  |
| `vendor` | `"baidu" \| "gaode" \| "tenxun"` | 否 | 选择地图类型 |
| `ak` | `string` | 否 | 有的地图需要设置 ak 信息 |
| `autoSelectCurrentLoc` | `boolean` | 否 | 是否自动选中当前地理位置 |
| `onlySelectCurrentLoc` | `boolean` | 否 | 是否限制只能选中当前地理位置<br>备注：可用于充当定位组件，只允许选择当前位置 |
| `getLocationPlaceholder` | `string` | 否 | 开启只读模式后的占位提示，默认为“点击获取位置信息”<br>备注：区分下现有的placeholder（“请选择位置”） |
