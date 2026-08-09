# Agent 参考材料

本文件夹是[《将军赶路不追小兔：多 Agent 调度体系的架构与实践》](../index.md)的配套参考材料。

**面向 Agent 阅读**：这些文件是给你的 Coding Agent 看的，不是给人看的。你可以把整个文件夹或单个文件丢给 Agent，让它帮你搭建类似的多 Agent 调度体系。

## 文件索引

| 文件 | 对应文章章节 | 说明 |
|------|-------------|------|
| [01-claude-code-sub-agent-setup.md](01-claude-code-sub-agent-setup.md) | 第一层：单 Agent 子代理 | Claude Code 的 implementer/reviewer 子代理角色定义模板 |
| [02-codex-sub-agent-setup.md](02-codex-sub-agent-setup.md) | 第一层：单 Agent 子代理 | Codex 的 AGENTS.md 主脑编排 + implementer/reviewer/explorer 子代理配置 |
| [03-task-card-template.md](03-task-card-template.md) | 第三层：自定义编排 | 任务卡模板（目标/修改边界/完成条件/基线信息） |
| [04-routing-profile.md](04-routing-profile.md) | 第三层：自定义编排 | 配额感知路由配置（执行器顺位/水位闸门） |
| [05-agents-template.md](05-agents-template.md) | 质量保障 | 仓库级 AGENTS.md 全局指南模板（六段式骨架） |
| [06-acceptance-scorecard.md](06-acceptance-scorecard.md) | 指标监测 | 验收记分卡 schema（执行器 x 任务类型 -> 质量维度） |
| [07-gate-ci-overview.md](07-gate-ci-overview.md) | 质量保障 | 门禁系统概述（tier/chain/shadow 角色、多 Agent review 架构） |

## 使用方式

1. **想搭第一层**（单 Agent 内部子代理分工）：读 01 或 02
2. **想搭第三层**（自定义编排）：读 03 + 04
3. **想搭质量门禁**：读 05 + 07
4. **想搭指标监测**：读 06

所有文件均已脱敏，可直接参考使用。
