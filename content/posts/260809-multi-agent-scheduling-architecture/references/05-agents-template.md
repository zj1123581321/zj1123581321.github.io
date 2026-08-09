# AGENTS.md 仓库级全局指南模板

每个代码仓库的根目录放一份 `AGENTS.md`，作为所有协作者和 Agent 的高信号索引。
不是详细手册——装不下的细节链接到对应文档，控制在 200 行以内。

## 模板

```markdown
# Repository Guidelines

## Project Declaration

- **风险等级**：personal | internal | saas
  <!-- 决定评审轮次上限和收敛条件：
       personal: 3轮，连续1轮无新增阻断问题即收敛
       internal: 5轮，连续2轮无新增即收敛
       saas: 8轮，连续2轮无新增即收敛 -->
- **设计文档目录**：docs/specs/
- **架构决策记录（ADR）目录**：docs/adr/
  <!-- 已拍板不再重开的决策落此；接口冻结、方案否决及理由 -->

## Project Structure & Module Organization

<!-- 一句话说明：顶层目录都是什么、代码/测试/资源分别放在哪、模块边界怎么划分 -->

## Build, Test, and Development Commands

<!-- 列出本仓实际能跑的构建/测试/本地开发命令。
     必须从 package.json / Makefile / CI 配置中核实，不许编造——
     写错命令比不写更误导。 -->

```bash
# 构建
npm run build

# 测试
npm test

# 代码检查
npm run lint
```

## Coding Style & Naming Conventions

<!-- 除语言级风格外，务必写清"可检索性约定"——Agent 靠 grep 找代码：
     - 导出符号命名：2-4 词且含领域词
     - 文件命名：带领域前缀，禁止裸 utils/types/config
     - 日志和错误消息：写完整字面量，不做模板拼接
     - 同一概念统一拼法（如 orgId 还是 organizationId，选一个固定）
     - 测试文件与源文件的对应命名规则 -->

## Testing Guidelines

<!-- 使用的测试框架、测试文件存放位置、覆盖率要求 -->

## Commit & PR Guidelines

<!-- commit message 格式、PR 描述模板、合并前必须通过的检查项 -->

## Security & Configuration Tips

<!-- 密钥/环境变量管理方式、哪些文件禁止提交、本地配置初始化步骤 -->
```

## 设计要点

1. **全文 ≤ 200 行**：是索引不是手册。运行态的进度、当前在改的 bug、谁在跑哪个任务——这些属于任务卡的职责，不要写进来。

2. **构建/测试命令必须可核实**：从仓库的实际配置文件里核实再抄进来，不要编造。

3. **风险等级决定评审纪律**：personal 级别的个人项目和 saas 级别的对外服务，评审轮次和严格程度完全不同。

4. **可检索性约定是给 Agent 的导航地图**：Agent 靠关键词搜索来找代码，如果命名混乱、日志拼接、同一概念多种拼法，Agent 的检索效率会大幅下降。
