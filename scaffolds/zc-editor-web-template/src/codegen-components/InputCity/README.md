# InputCity 城市选择器组件

一个基于 Ant Design Select 组件封装的中国行政区划选择器，支持省市区三级联动选择。

## 功能特性

- 🌏 **完整数据**：包含中国所有省市区数据
- 🔗 **三级联动**：省市区自动联动选择
- 🎯 **灵活配置**：可控制是否显示市级和区级选择
- 📦 **多种格式**：支持多种数据格式的输入输出
- 🔄 **智能回显**：支持数字编码、对象格式的回显
- 🎨 **样式定制**：支持自定义样式和类名

## 基础用法

```tsx
import InputCity from '@/components/InputCity/InputCity'

// 基础用法
<InputCity 
  onChange={(value) => console.log(value)}
/>

// 带初始值
<InputCity 
  value={110101}
  onChange={(value) => console.log(value)}
/>
```

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| value | 当前选中值 | `CityValue \| CityFullValue \| number` | - |
| onChange | 选择变化时的回调 | `(value: CityValue \| CityFullValue \| number \| undefined) => void` | - |
| allowCity | 是否显示市级选择 | `boolean` | `true` |
| allowDistrict | 是否显示区级选择 | `boolean` | `true` |
| disabled | 是否禁用 | `boolean` | `false` |
| searchable | 是否支持搜索 | `boolean` | `false` |
| extractValue | 返回值格式控制 | `boolean` | `true` |
| style | 自定义样式 | `React.CSSProperties` | - |
| className | 自定义类名 | `string` | - |

### 数据类型

#### CityValue
```tsx
interface CityValue {
  provinceCode?: number    // 省份编码
  cityCode?: number       // 城市编码
  districtCode?: number   // 区县编码
}
```

#### CityFullValue
```tsx
interface CityFullValue {
  code: number            // 最后一级编码
  provinceCode: number    // 省份编码
  province: string        // 省份名称
  cityCode?: number       // 城市编码
  city?: string          // 城市名称
  districtCode?: number   // 区县编码
  district?: string      // 区县名称
  street?: string        // 街道（预留）
}
```

## 使用示例

### 1. 基础三级联动

```tsx
<InputCity 
  onChange={(value) => {
    console.log('选择结果:', value)
  }}
/>
```

### 2. 只显示省市两级

```tsx
<InputCity 
  allowDistrict={false}
  onChange={(value) => {
    console.log('省市选择:', value)
  }}
/>
```

### 3. 只显示省份

```tsx
<InputCity 
  allowCity={false}
  allowDistrict={false}
  onChange={(value) => {
    console.log('省份选择:', value)
  }}
/>
```

### 4. 数字编码回显

```tsx
// 使用6位区县编码
<InputCity 
  value={110101}  // 北京市东城区
  onChange={(value) => console.log(value)}
/>

// 使用4位市级编码
<InputCity 
  value={1101}    // 北京市
  onChange={(value) => console.log(value)}
/>

// 使用2位省级编码
<InputCity 
  value={11}      // 北京
  onChange={(value) => console.log(value)}
/>
```

### 5. 对象格式回显

```tsx
// CityValue 格式
<InputCity 
  value={{
    provinceCode: 110000,
    cityCode: 110100,
    districtCode: 110101
  }}
  onChange={(value) => console.log(value)}
/>

// CityFullValue 格式
<InputCity 
  value={{
    code: 110101,
    provinceCode: 110000,
    province: '北京市',
    cityCode: 110100,
    city: '北京市市辖区',
    districtCode: 110101,
    district: '东城区'
  }}
  onChange={(value) => console.log(value)}
/>
```

### 6. 控制返回值格式

```tsx
// extractValue=true (默认): 返回最后一级的数字编码
<InputCity 
  extractValue={true}
  onChange={(value) => {
    // value: 110101 (数字)
    console.log(value)
  }}
/>

// extractValue=false: 返回完整对象信息
<InputCity 
  extractValue={false}
  onChange={(value) => {
    // value: CityFullValue 对象
    console.log(value)
  }}
/>
```

### 7. 支持搜索

```tsx
<InputCity 
  searchable={true}
  onChange={(value) => console.log(value)}
/>
```

### 8. 自定义样式

```tsx
<InputCity 
  style={{ width: '100%' }}
  className="custom-city-picker"
  onChange={(value) => console.log(value)}
/>
```

## 编码规则

中国行政区划编码遵循以下规则：

- **省级编码**：2位数字 + 0000，如 `110000`（北京市）
- **市级编码**：4位数字 + 00，如 `110100`（北京市市辖区）
- **区县编码**：6位完整数字，如 `110101`（东城区）

### 常用编码示例

| 地区 | 省级编码 | 市级编码 | 区县编码 |
|------|----------|----------|----------|
| 北京市东城区 | 110000 | 110100 | 110101 |
| 上海市黄浦区 | 310000 | 310100 | 310101 |
| 广东省广州市天河区 | 440000 | 440100 | 440106 |
| 浙江省杭州市西湖区 | 330000 | 330100 | 330106 |

## 注意事项

1. **直辖市处理**：直辖市（北京、天津、上海、重庆）也会显示市级选择器，显示为"XX市市辖区"
2. **数据更新**：组件内置的行政区划数据可能需要定期更新
3. **性能优化**：大量数据渲染时建议启用虚拟滚动（如需要可扩展）
4. **兼容性**：依赖 Ant Design 4.x+ 版本

## 更新日志

### v1.0.0
- 初始版本发布
- 支持省市区三级联动
- 支持多种数据格式输入输出
- 支持智能回显功能