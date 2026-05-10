# 后处理重构 Prompt（R3 第 2 阶段）

你正在重构一个**已生成完成的多页 UniApp + Wot UI 项目**。第 1 阶段 N 个独立 session 各自生成了 N 个页面，没有共享约束，可能存在大量重复代码。

## 你的任务

1. 扫 `src/pages/**/*.vue`，识别重复模式：
   - 重复的组件（多个页面里写了功能相似的 button/form/table 包装）
   - 重复的工具函数（多个页面里 copy 了同样的 fetchData / formatDate）
   - 重复的样式（多个页面里写了相同的 CSS class）

2. 抽到共享位置：
   - 重复组件 → `src/components/`
   - 重复工具 → `src/utils/`
   - 重复样式 → `src/styles/common.css`

3. 改原页面的 import，让它们用共享版本

4. **不要破坏功能** —— 重构前后页面行为一致

## 注意

- 只复用模式 ≥ 3 次的代码（2 次以下不值得抽）
- 不抽业务专属逻辑（如 user_list 里独有的状态过滤）
- 不改变 amis JSON 渲染结果
