# Agent 参考材料

本文件夹是[《将军赶路不追小兔：多 Agent 调度体系的架构与实践》](../index.md)的配套参考材料。

**怎么用**：把你想解决的问题对应的文件丢给你的 Coding Agent，告诉它"参考这个帮我搭起来"。每个文件都按"解决什么问题 → 核心原则 → 最小起步方案 → 根据你的情况调整"的结构组织，Agent 读完就能动手。

## 按你的需求选择

**想让一个 Agent 内部分工更高效？**
→ [01-claude-code-sub-agent-setup.md](01-claude-code-sub-agent-setup.md)（用 Claude Code）
→ [02-codex-sub-agent-setup.md](02-codex-sub-agent-setup.md)（用 Codex）

**想让多个 Agent 协同干活？**
→ 先试 [Orca](https://github.com/stablyai/orca) 或 [Paseo](https://github.com/getpaseo/paseo)（开箱即用）
→ 需要自定义？看 [03-task-card-template.md](03-task-card-template.md) + [04-routing-profile.md](04-routing-profile.md)

**想建一套自动化质量把关？**
→ [05-agents-template.md](05-agents-template.md)（仓库级规范）+ [07-gate-ci-overview.md](07-gate-ci-overview.md)（门禁架构）

**想量化和复盘 Agent 的表现？**
→ [06-acceptance-scorecard.md](06-acceptance-scorecard.md)

所有文件均已脱敏，可直接参考使用。
