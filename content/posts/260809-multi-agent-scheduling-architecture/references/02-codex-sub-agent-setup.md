# Codex：让一个 Agent 内部分工

## 解决什么问题

和 Claude Code 同样的问题——一个 Agent 又想又做又审，上下文越来越乱。Codex 的解法原理相同（主脑 + 子代理分工），但配置方式不同：用 AGENTS.md 写编排规则，用 .toml 文件定义子代理。

## 核心原则

和 Claude Code 完全一致：分工靠角色、边界靠契约、主脑不动手。

Codex 额外有一个独特的设计：**每个子代理可以绑定不同的模型和推理强度**。比如执行者用高推理强度保证质量，探索者用低推理强度省成本——这在 Claude Code 里目前做不到。

## 最小起步方案

### 第一步：创建全局编排规则

在 `~/.codex/AGENTS.md` 中写入：

```markdown
# 模型编排

- 主代理只负责：理解需求、规划、拆任务、审查结果、最终验收。
- 所有写代码的工作委派给 implementer 代理。
- 所有只读检索的工作委派给 explorer 代理。
- 主代理不直接写代码，也不自行修补子代理的结果——有问题就拆新任务再委派。
- 唯一例外：无需设计判断的机械性单行改动（typo、单个配置值）。
```

### 第二步：创建子代理角色文件

在 `~/.codex/agents/` 目录下创建：

**`implementer.toml`**（执行者）：
```toml
name = "implementer"
description = "有边界的代码实现代理：负责代码、测试、验证和修复。"

# 根据你的订阅选择模型和推理强度
# model = "gpt-5.6-luna"
# model_reasoning_effort = "xhigh"

[developer_instructions]
content = """
你是执行者，按任务卡完成具体实现。
- 只改任务卡允许范围内的文件
- 改完必须跑验证命令
- 偏离计划当场记录
- 小步提交
"""
```

**`reviewer.toml`**（审查者）：
```toml
name = "reviewer"
description = "只读审查代理：审查 diff 和验收证据，不直接改代码。"

[developer_instructions]
content = """
你是审查者，只读不写。
审查重点：需求不符 → 逻辑错误 → 安全问题 → 缺失测试 → 命名可检索性。
每个问题给出位置 + 失败场景 + 修复建议。
"""
```

**`explorer.toml`**（探索者，可选）：
```toml
name = "explorer"
description = "只读探索代理：负责代码检索和文件定位，不写文件。"

# 探索者可以用更便宜的模型，因为只需要检索能力
# model_reasoning_effort = "medium"

[developer_instructions]
content = """
你是探索者，只检索不写入。
搜索结果以 文件路径 + 行号 + 一句话概述 的格式返回。
"""
```

### 第三步：开始使用

正常使用 Codex 即可。当你给它复杂任务时，它会自动把实现工作委派给 implementer，把代码检索委派给 explorer。

## 和 Claude Code 的主要差异

| 维度 | Claude Code | Codex |
|------|------------|-------|
| 编排规则 | `CLAUDE.md` | `AGENTS.md` |
| 子代理定义 | `.claude/agents/*.md` | `~/.codex/agents/*.toml` |
| 模型绑定 | 子代理跟随主会话模型 | 每个 toml 可独立绑模型和推理强度 |
| 典型角色 | implementer + reviewer | implementer + reviewer + explorer |

## 根据你的情况调整

- **成本敏感**：给 explorer 配更便宜的模型 / 更低的推理强度——它只做检索，不需要太高的智力。
- **大型代码库**：强烈建议加 explorer 角色——让它专门负责翻代码找信息，不占用 implementer 的上下文。
- **团队场景**：每个仓库可以在 `AGENTS.md` 里追加仓库级别的规范（见 05-agents-template.md）。
