# Amis 1.1 评测集

20 条固定 prompt，覆盖高频场景，用于 1.1 vs 1.0 的 A/B 跑分。

## 跑法

```bash
# 1. 在 1.0 baseline 跑（切到 release/v1.0.0）
git checkout release/v1.0.0
./shared/scripts/start-services.sh restart
sleep 30
uv run --project ../../agent python runner.py --output baseline-1.0.jsonl

# 2. 切回 1.1
git checkout dev/1.1.0
./shared/scripts/start-services.sh restart
sleep 30
uv run --project ../../agent python runner.py --output 1.1.jsonl

# 3. 对比报告
uv run --project ../../agent python runner.py --compare baseline-1.0.jsonl 1.1.jsonl
```

## 验收门槛

- adopt_rate（每条 prompt 的产出能否覆盖 expected_components）相比 1.0 提升 ≥ +10pp
- fail_rate（生成无效 JSON）不上升

## 结构

- `prompts.json` — 20 条评测题
- `runner.py` — 跑 chat 接口 + 评分 + 对比
- `baseline-1.0.jsonl` — 1.0 跑分结果（生成后提交）
- `1.1.jsonl` — 1.1 跑分结果（生成后提交）
- `ab-report.json` — 对比报告（生成后提交）
