# 配额感知路由：让任务自动找到最合适的 Agent

## 解决什么问题

你有多个 Agent 订阅（比如 Codex $200、Kimi ¥699、Grok $30），每家额度不同、能力不同、擅长的任务也不同。手动决定"这个任务派给谁"既费精力又容易拍脑袋。

配额感知路由的作用是：**根据任务类型和各家剩余额度，自动选择最合适的执行器。** 额度快用完的暂停派发，余量充裕的多接活——让你不用操心"哪个套餐还有额度"这种琐事。

## 核心原则

1. **按任务性质匹配执行器，不是按价格**：大活需要质量高的，快活需要速度快的，前端需要审美好的——匹配的是"性格"不是"价格"。
2. **水位闸门是安全网**：当某个执行器的额度消耗到一定比例（比如 90%），自动停止向它派发，而不是等到撞线了才发现。
3. **降级链保证任务不卡住**：首选执行器额度不够时，按预定的顺序自动降级到备选，而不是停下来等人决策。

## 配置示例

```json
{
  "executors": {
    "codex": { "plan_usd_month": 200, "weekly_token_budget": 4500000000 },
    "kimi":  { "plan_usd_month": 50,  "weekly_token_budget": 750000000 },
    "grok":  { "plan_usd_month": 20,  "weekly_token_budget": 350000000 }
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

### 怎么读这个配置

**executors**：你有哪些执行器、各自的月费和周 Token 预算。

**chains**：不同类型的任务按什么顺序找执行器——
- `big`（大活）：先找 Codex（质量高），Codex 额度不够就找 Kimi
- `quick`（快活）：先找 Grok（速度快），不够再逐级降
- `slow`（前端/慢活）：先找 Kimi（审美强），不够再降

**watermark_gates**：什么时候关闸——周额度用了 90% 或短期窗口用了 80% 就不再派新任务。

## 根据你的情况调整

### 你只有两个订阅
```json
{
  "executors": {
    "claude": { "plan_usd_month": 200, "weekly_token_budget": 3000000000 },
    "codex":  { "plan_usd_month": 200, "weekly_token_budget": 4500000000 }
  },
  "chains": {
    "big":   ["codex", "claude"],
    "quick": ["codex", "claude"]
  }
}
```

### 你想省钱
把 `watermark_long_term_pct` 调低（比如 70%），更早关闸，让额度分布更均匀。

### 你有不限量的 API 渠道
可以加一个兜底执行器：
```json
"chains": {
  "big": ["codex", "kimi", "deepseek-api"]
}
```

## 这套路由需要什么配套

路由配置本身只是一个 JSON 文件。要让它真正跑起来，你还需要：
1. **一个监控面板**：实时查询各家套餐的剩余额度（可以从各家的 API 或网页爬取）
2. **一个调度脚本**：读取路由配置 + 查询监控面板 + 选择执行器 + 派发任务
3. **一种无头模式的执行方式**：让调度脚本能程序化地向执行器传入任务

这三样可以让你的 Agent 帮你从零搭建——把这份文件和你当前的套餐信息一起丢给它即可。
