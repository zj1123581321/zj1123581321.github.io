## Project Declaration

**GATE_TIER:** personal

这是个人静态博客，由单一维护者维护，不保存持久化用户数据。P1 红线是数据丢失、静默错误、构建/发布崩溃；review 上限 3 轮，连续 1 轮无新增 P1 即收敛。

Spec 入口：`README.md`、`hugo.toml`、`.github/workflows/deploy.yml`。ADR：无。

## Build, Test, and Development Commands

- 权威验证：Hugo v0.147.5 执行 `hugo --gc --minify --baseURL <url> --destination <临时目录>`，并执行 `git diff --check`。
- 本地预览：`hugo server -D`。

提交按逻辑显式暂存路径，使用工具署名 `[codex]`；不要使用 `git add -A`。
