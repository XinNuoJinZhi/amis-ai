---
name: platform-zc-web
description: ZC 智搭低代码平台 Web 端业务规则、特有协议、组件命名约定（搭配 zc-amis-schema 桶使用）
type: knowledge
---

# ZC 智搭 Web 平台业务规则

本桶给 Agent 在生成 **ZC 风格 amis JSON** 时使用，约束 ZC 特有的协议、命名、业务套件选择。

跟 [`zc-amis-schema/`](../zc-amis-schema/) 桶配对使用：
- 本桶 = 高层业务规则（何时选 ZC 套件 / 命名风格 / 协议约定）
- zc-amis-schema = 组件级 schema 速查（每个 ZC 二开组件的 type / props）

## 何时被检索

- 用户任务 `template_name=zc-editor-web-template` 时 priority 升高，**system_prompt 直接注入**本 SKILL.md（小文档值得注入）
- 跟 `_common` / `stack-react` / `ui-antd` 桶并存

## ZC vs 原版 Amis 选哪个

| 场景 | 选 | 理由 |
|---|---|---|
| 表单含**部门字段** | ZC `department-select` | 原版 `select` 没 OA 树形数据集成 |
| 表单含**人员选择** | ZC `user-select` | 原版无 |
| 数据**实体驱动**的 CRUD（已有数据模型） | ZC `modelform` + `modeltable` | 原版要手写所有 columns/fields |
| **报表 / 数据可视化** | ZC `report-forms` 套件 | 原版 `chart` 只覆盖单个图表，ZC 是完整 BI 套件 |
| **工作流** | ZC `flowCreate` | 原版无 |
| **动态表单**（schema 后端动态返回） | ZC `dynamic-form` | 原版无 |
| **API 接入 ZC 中台** | source 用 `app://xxx/source` 协议 | ZC 私有协议，原版用 `/api/xxx` |
| 纯静态 / 没有 ZC 业务背景 | 用原版 amis 组件 | 减少耦合 |

## ZC 特有协议与约定

### apicenter 数据源协议

ZC 私有 API 中台用 `app://` 协议：

```json
{
  "type": "department-select",
  "source": {
    "url": "app://department/source"
  }
}
```

- `app://<service>/<resource>` 由 ZC apicenter 网关解析路由
- sandbox 环境不能解析真实 `app://`，开发期可以 mock 成 `/api/<service>/<resource>` 或返回静态 JSON
- 生产部署时由 ZC 部署环境自动重写

### 组件命名约定

| 命名风格 | 例子 | 说明 |
|---|---|---|
| **全小写连字符** | `department-select` / `user-select` / `dynamic-form` / `report-forms` | ZC 标准 type 名 |
| **驼峰** | `modelform` / `modeltable` / `flowCreate` / `docentity` | ZC 数据建模套件，注意大小写敏感 |
| **保留原版** | `crud` / `form` / `table` / `page` | 原版 amis 组件 type 不变，ZC 仅在 plugin 层做了行为扩展 |

LLM 输出 type 时严格按上表，不要混用连字符 / 下划线 / 驼峰。

## ZC 业务套件清单

| 套件 | 核心 type | 用途 |
|---|---|---|
| OA | `department-select` / `user-select` / `flowCreate` | 部门 / 人员 / 工作流 |
| 数据建模 | `modelform` / `modeltable` / `docentity` / `dynamic-form` | 基于数据模型生成 CRUD |
| 报表 | `report-forms` + 子图表（bar/line/pie/gauge/funnel/map/wordcloud/sankey/scatter-map/waterfall/calendar） | BI 可视化 |
| API 中台 | source: `app://` 协议 | 内部 API 调用 |
| AI 助手 | `ai-*` renderer | 编辑器内嵌 AI 对话（运行时一般不直接用） |

## 已知限制（sandbox 环境）

- `app://` 协议在 sandbox 不通 → 让 LLM 生成 mock 数据 fallback
- ReportForms 部分图表依赖 ZC 私有图表库 → 优先用通用 `bar`/`line`/`pie` 等基础图表
- 工作流 `flowCreate` 涉及 ZC BPMN 引擎 → sandbox 仅生成 schema 不跑实际流程

## 关联文档

- 二开点报告：[../../docs/zc-amis-diff-report.md](../../docs/zc-amis-diff-report.md)
- 1.3 设计：[../../docs/plans/2026-05-10-zc-amis-1.3-design.md](../../docs/plans/2026-05-10-zc-amis-1.3-design.md)
- 原版 amis 桶：[../amis-core-schema/SKILL.md](../amis-core-schema/SKILL.md)
- ZC 组件 schema 桶：[../zc-amis-schema/SKILL.md](../zc-amis-schema/SKILL.md)
