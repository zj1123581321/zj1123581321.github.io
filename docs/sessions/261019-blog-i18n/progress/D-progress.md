当前阶段：implementing — lib.mjs 与哈希单测落地。

本段结论：`tools/i18n/lib.mjs` 导出 `sourceHash` 与 `readFrontmatter`，按锁定决策做 CRLF 归一、闭合 `---` 切正文、trim 后 sha256。单测锁死「只改 frontmatter 不变 / 改正文变 / CRLF 等同 / 无 frontmatter 抛 I18N-FRONTMATTER-UNPARSEABLE」。

关键决策与已否决方案：哈希只吃正文不吃整文件（整文件会把 wechat_url 回填当过期）；解析失败一律抛 I18N-FRONTMATTER-UNPARSEABLE，不加兼容分支。

下一步唯一动作：写 check.mjs 夹具测试并实现检查脚本。

当前阶段：implementing — check.mjs 与夹具子进程测试落地。

本段结论：`check.mjs` 接受可选仓根参数，扫描 `content/posts/*/index.en.md`。硬错误走 `::error`/`I18N-CHECK-FAILED` 退出 1；哈希过期只 `::warning`/`I18N-STALE` 仍退出 0。夹具在临时目录构造，断言真实子进程退出码与 stdout。

关键决策与已否决方案：仓根用 argv 不用环境变量；警告不算失败（哈希只能证明「变了」不能证明「已改译」）。不检查缺译。

下一步唯一动作：写 PR 触发的 check.yml，Hugo 安装照抄 deploy.yml。

当前阶段：implementing — PR 检查工作流落地。

本段结论：新增 `.github/workflows/check.yml`，`pull_request` 目标 main 加 `workflow_dispatch`。步骤为 i18n 单测、`check.mjs`、Hugo 0.147.5 extended 构建。不改 `deploy.yml`。

关键决策与已否决方案：checkout 带 `submodules: recursive`；CI 钉 Node 20，因为 Node 22+ 的 `--test <目录>` 把目录当文件执行，卡面命令在 Node 20 才按目录展开。不加 continue-on-error、不加重试。

下一步唯一动作：把试点译文 translationSynced 迁成 sourceHash。
