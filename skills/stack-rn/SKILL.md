---
name: stack-rn
description: React Native 技术栈反向代码生成规则 —— 原生移动 App 方向
kind: stack
platforms: [mobile]
tech_stacks: [rn, react-native]
requires: [_common, platform-mobile]
conflicts: [stack-uniapp]
priority: 50
---

# Skill: stack-rn

把 Amis JSON 翻译成 **React Native 0.74+** 项目代码。UI 组件库按具体 `ui.*` 决定。

## 底座关键文件

```
App.tsx
index.js / index.ts
src/
  navigation/          # @react-navigation/native-stack 栈导航
  screens/             # 页面组件
  components/
  api/
  hooks/
  theme/
ios/ android/          # 原生工程目录（eject 后有）
metro.config.js
```

## 依赖基线

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.74.3",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.10.0",
    "react-native-safe-area-context": "^4.10.0",
    "react-native-screens": "^3.32.0"
  }
}
```

## 启动命令

- `pnpm start` 或 `pnpm run ios` / `pnpm run android`
- Metro bundler 默认端口 8081
- 调试：摇一摇设备打开 RN Dev Menu

## Amis → RN 套路

- **page** → Screen 组件 + 注册到 navigation stack
- **form** → 用 UI 库表单组件 + `useState` 管状态
- **crud** → `FlatList` / `SectionList` + 下拉刷新 + 上拉加载更多

## 强约束

- 样式用 `StyleSheet.create`（或 tailwind-rn / nativewind）
- 不用浏览器 API（`window` / `document`）
- 图片必须 `require` 或 HTTPS URL
- 性能：列表务必 `keyExtractor` + `getItemLayout`（已知行高时）

## 工作流程

1. 读现有目录识别是否已初始化 RN 项目
2. 无模板：通过 `@react-native-community/cli` 初始化（需环境准备）
3. 创建业务 Screen + 注册到 Stack
4. API 封装 `src/api/`
5. `pnpm start` 验证 Metro 启动
