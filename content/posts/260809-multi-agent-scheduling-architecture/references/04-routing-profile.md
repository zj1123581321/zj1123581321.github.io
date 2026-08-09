# 配额感知路由配置

调度器根据这份配置来决定任务路由。配合一个实时监控面板读取各家套餐的剩余额度，
自动选择最合适的执行器。

## 配置文件（routing-profile.json）

```json
{
  "schema_version": 1,
  "calibrated_at": "2026-08-04",
  "executors": {
    "codex": {
      "plan_usd_month": 200,
      "weekly_token_budget": 4500000000
    },
    "kimi": {
      "plan_usd_month": 50,
      "weekly_token_budget": 750000000
    },
    "grok": {
      "plan_usd_month": 20,
      "weekly_token_budget": 350000000
    }
  },
  "chains": {
    "big":   ["codex", "kimi"],
    "quick": ["grok", "codex", "kimi"],
    "slow":  ["kimi", "codex", "grok"]
  },
  "watermark_gates": {
    "watermark_long_term_pct": 90,
    "watermark_short_term_pct": 80
  }
}
```

## 字段说明

### executors（执行器）
每个执行器登记它的月订阅费和周 Token 预算。调度器用这些数据来判断当前水位。

### chains（调度链）
定义不同任务类型的执行器优先级顺序：

- **big**（大活）：优先 Codex → 不够时降级 Kimi
- **quick**（快活/赶时间）：优先 Grok（速度快）→ Codex → Kimi
- **slow**（前端/慢活）：优先 Kimi（审美强）→ Codex → Grok

调度器从链首开始，逐个检查水位，水位够就派发，不够就跳到下一个。

### watermark_gates（水位闸门）
- **watermark_long_term_pct = 90**：周额度消耗超过 90% 时，停止向该执行器派发新任务
- **watermark_short_term_pct = 80**：短期窗口（如 5 小时）消耗超过 80% 时，也停止派发

## 调度器工作流程

```
1. 主脑拆出一张任务卡，标记任务类型（如 "big"）
2. 调度器读取 routing-profile.json，找到对应的 chain：["codex", "kimi"]
3. 调度器查询监控面板 API，获取各执行器当前水位
4. 从 chain 首位开始：codex 水位 < 90%？
   - 是 → 派给 codex
   - 否 → 检查 kimi 水位 < 90%？
     - 是 → 派给 kimi
     - 否 → 全链被闸，报告给主脑，不硬闯
5. 派发后生成 envelope（回执），包含 dispatch_id、wait_command 等
```

## 与监控面板的配合

调度器需要一个实时的额度监控服务来提供水位数据。
常见的监控数据包括：
- 各家套餐当前周期的已用量和剩余量
- Token 消耗速率（每小时/每天）
- 分模型、分项目的消耗明细
- 预估额度耗尽时间

这些数据不仅服务于自动调度，也是后续复盘和路由优化的基础。
