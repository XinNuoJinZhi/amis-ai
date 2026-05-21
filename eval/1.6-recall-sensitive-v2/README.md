# 1.6 W4 · B 项召回敏感评测 v2（升级版草案）

> **现状**：v1 实测 B 组（双路）vs A 组（纯向量）页通过率 87.5% vs 83.3% = **+4pp**（[v1 baseline](../1.6-recall-sensitive/baseline-2026-05-13-v2.md)）
> **目标**：v2 升级 prompts 让 B-A 差 ≥ **+10pp**，让 1.4 B.1 / 1.5 W4 / 1.6 W2 的双路召回真实价值在「页通过率」维度显化
> **状态**：草案 — 设计原则已定，prompts 待 1.6 W4 实施
> **预估**：1-2 天（5-8 个新 prompt + 跑两次评测 + 对比）

---

## 一、为什么 v1 只有 +4pp

v1 设计原则是「amis 强 ZC 特征 + extra_prompt 通用」。预期：
- B 组靠 keyword 命中 ZC 样本 → 生成正确 ZC 代码 ✅
- A 组靠纯向量拉 antd 样本 → 生成错代码运行时报错 ❌

实测发现：
- B 组命中 keyword 6.9 hits/task（命中机制对的）
- A 组没命中 keyword 但**仍然能跑通**，因为 LLM 自带通用知识能脑补出 modeltable ≈ Table、report-forms ≈ chart 的近似实现
- → 仅在「召回样本组合」维度有差异，「下游 LLM 生成质量」维度差异有限

## 二、v2 升级路线

**核心**：让 amis schema 含**LLM 脑补不出来**的 ZC 特有约束，A 组缺样本就一定挂。

### 设计原则

1. **schema 含强约束 props**：modeltable 的 `bulkActions` + 业务级 actionType（如 `flowCreate` / `dynamicFormSubmit`）— 普通 antd Table 没有
2. **跨页数据流约定**：page A 表单 submit `flowCreate` 启动流程实例 → page B `modeltable` 列出对应实例的 `flowInstanceId`。约定 schema 是 ZC 平台特有
3. **隐式 backend API 模式**：amis 用 `app://workflow/instance/${flowInstanceId}/operate` 这种 ZC 平台路由规则；LLM 不命中 ZC 样本时会瞎写 `/api/workflow/...`
4. **强校验联动**：`visibleOn` + `submitFlow` + `permission` 三件套，ZC 模板有 wrapper 处理，纯 antd 模板得手写

### v2 prompt 范例（示例 1 个，1.6 W4 拓展到 5-8 个）

```json
{
  "id": "rsv2_workflow_audit_trail",
  "title": "RSv2-1 · 审批工单与审计轨迹（双向数据流）",
  "_design_intent": "amis 用 flowCreate + flowInstanceId 跨页关联。B 组命中 ZC 样本 → 知道 flowInstanceId 是隐式上下文 → 生成 store 共享 + URL query 透传；A 组拉普通 form/crud 样本 → 把 flowInstanceId 当普通字段 → 提交时拿不到，页面跳转后 404",
  "_extra_prompt": "做一个工单系统，含表单提交、跟进审批",
  "pages": [
    {
      "amis_json": "{\"type\":\"form\",\"api\":\"app://workflow/ticket/start\",\"controls\":[{\"name\":\"title\",\"label\":\"标题\",\"type\":\"text\",\"required\":true},{\"name\":\"description\",\"label\":\"描述\",\"type\":\"textarea\",\"required\":true},{\"name\":\"assignee\",\"label\":\"指派给\",\"type\":\"user-select\",\"required\":true}],\"submit\":{\"label\":\"提交并启动工单\",\"actionType\":\"flowCreate\",\"flowId\":\"ticket_apply\",\"redirect\":\"/ticket/audit/${flowInstanceId}\"}}",
      "route_path": "/ticket/new"
    },
    {
      "amis_json": "{\"type\":\"page\",\"title\":\"工单跟进\",\"body\":[{\"type\":\"tpl\",\"tpl\":\"工单 ID: ${flowInstanceId}\"},{\"type\":\"modeltable\",\"api\":\"app://workflow/instance/${flowInstanceId}/audit\",\"columns\":[{\"name\":\"node\",\"label\":\"节点\"},{\"name\":\"operator\",\"label\":\"处理人\"},{\"name\":\"action\",\"label\":\"动作\"},{\"name\":\"time\",\"label\":\"时间\",\"type\":\"datetime\"}],\"bulkActions\":[{\"label\":\"撤回\",\"actionType\":\"flowCancel\",\"flowInstanceId\":\"${flowInstanceId}\"}]}]}",
      "route_path": "/ticket/audit/:flowInstanceId"
    }
  ]
}
```

**预期对比**：
- B 组：召回到 ZC 工作流样本 → 正确生成 `useFlowInstance` store + URL query `flowInstanceId` 透传 → 跳转后渲染正常
- A 组：未命中 ZC 样本 → 把 `${flowInstanceId}` 当 amis 内置变量 / 当 URL pathvar 但忘了用 redirect → 跳转后 page 拿不到 `flowInstanceId` → API 调用 `app://workflow/instance//audit`（空字符串）→ 后端 404 → page failed

### v2 还要加的 prompt（建议 5-8 个）

| ID | 主题 | LLM 脑补不出来的关键点 |
|---|---|---|
| rsv2_2 | 多级嵌套 modelform | `dataMapping` + `subFormApi` 跨级数据流 |
| rsv2_3 | 报表导出 | `report-forms` + 异步任务 + `pollInterval` 状态轮询 |
| rsv2_4 | 权限矩阵 transfer | ZC 特有的 `app://permission/all` + group source 模式 |
| rsv2_5 | 工作流抄送链 | `cc` 字段 `user-select multiple` + `flowCcUpdate` API |
| rsv2_6 | 部门树批量改 | `department-select` 嵌套 + `bulkModify` ZC 二开 |
| rsv2_7 | 字典联动 | `source: app://dict/types` 字典动态加载 + 联动 |
| rsv2_8 | 审批节点流转 | 节点跳转 amis 自带不支持，必须靠 ZC `flowJumpTo` |

---

## 三、执行步骤（1.6 W4 接手时）

```bash
# 1. 起服务 + 拿 token（参考 baseline-2026-05-21 的姿势）
./shared/scripts/start-services.sh start  # wait_for_health 会等到 agent warmed
TOKEN=$(curl -s http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

# 2. v2 prompts 写完后跑 A 组（纯向量）
TOKEN=$TOKEN curl -s -X PUT "http://localhost:8080/api/system-settings/rag.dual_route.enabled" \
  -H "Authorization: Bearer $TOKEN" -d '{"value":"false"}' -H 'Content-Type: application/json'
TEST_ADMIN_JWT=$TOKEN python3 eval/multipage-1.2/runner.py \
  --prompts-file eval/1.6-recall-sensitive-v2/prompts.json \
  --strategies r4_baseline --tech-stack react-antd-vite \
  --max-wait-sec 1200

# 3. B 组（双路开）
curl -s -X PUT "http://localhost:8080/api/system-settings/rag.dual_route.enabled" \
  -H "Authorization: Bearer $TOKEN" -d '{"value":"true"}' -H 'Content-Type: application/json'
TEST_ADMIN_JWT=$TOKEN python3 eval/multipage-1.2/runner.py \
  --prompts-file eval/1.6-recall-sensitive-v2/prompts.json \
  --strategies r4_baseline --tech-stack react-antd-vite

# 4. 对比两份 csv
# 期望：B 组 page_status PASS 数 ≥ A 组 + (10pp × 24 pages) = 至少多 3 个 page PASS
```

---

## 四、决策矩阵

| B-A 页通过率差 | 解读 | 下一步 |
|---|---|---|
| ≥ +10pp | ✅ B.1 价值在生产维度显化 | 写 1.6 W4 final 报告，1.7 不动召回机制 |
| [+5pp, +10pp] | 🟡 部分显化 | 看 A 组 failed page 的 failed_pages_brief，找还能更刁钻的样本 |
| [+1pp, +5pp] | ⚠️ 仍然 marginal | 评估升级到严格 RRF（参考 memory: b1_keyword_design）|
| < +1pp | ❌ 设计失败 | 检查样本库 ZC 种子样本（id 933/934/935）是否真被命中 |

---

## 五、关联

- v1 prompts: [../1.6-recall-sensitive/prompts.json](../1.6-recall-sensitive/prompts.json)
- v1 baseline: [../1.6-recall-sensitive/baseline-2026-05-13-v2.md](../1.6-recall-sensitive/baseline-2026-05-13-v2.md)
- 1.6 路线图: [../../docs/plans/2026-05-13-roadmap-1.6.md](../../docs/plans/2026-05-13-roadmap-1.6.md)
- 1.6 W3 总结: [../../docs/upgrades/2026-05-13-1.6-w2-w3-summary.md](../../docs/upgrades/2026-05-13-1.6-w2-w3-summary.md)
