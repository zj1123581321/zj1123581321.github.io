# blog-i18n-06 进度存档

## 里程碑 1：第 6 批 3 篇文章英文版 + 验收

- **当前阶段**：`260315-ai-时代闲言几则-正文稿`、`240313-itin-ein`、`231017-electron-抓包` 三篇 `index.en.md` 译文完成并逐篇提交；Verify-Command 与行为验收脚本全绿。
- **本段结论**：三篇英文页均落在 `/en/posts/<中文 slug>/`，frontmatter 只有 title/date/draft/url/translationSynced；正文首行为译文来源说明行。中文 `index.md` 零改动（白名单断言通过）。
- **关键决策**：三篇中文稿均无站内文章链接，站内链接改写清单为空；卡面表格把 240313/231017 的图片数记为 0，实际两篇中文页通过 `static/migrated-images/`、`static/post-images/` 各引用 4 张、2 张图片，英文版按卡面规则 9 原样保留相同引用（文件真实存在，构建产物无缺图）。`231017` 原文两处把 Fiddler 写作 "Fidder"，译文按产品名规范化为 Fiddler。
- **下一步唯一动作**：push 分支、交验收报告。
