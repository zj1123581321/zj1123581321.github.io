# blog-i18n-05 执行进度

- Task-Id：blog-i18n-05（第 5 批，3 篇）
- 分支：card/blog-i18n-05；base：d3ce212
- 状态：已完成，卡面 Verify-Command 与行为验收脚本（/tmp/i18n-check-5.py）均退出 0（PASS）。

## 产物

| 文章目录 | 英文网址 | 提交 |
|---|---|---|
| 260908-smb-agent-framework | /en/posts/260908-smb-agent-framework/ | 20a9452 |
| 231019-whisper-音视频转写 | /en/posts/liao-liao-gao-jing-du-yin-shi-pin-zhuan-wen-zi-gong-zuo-liu/ | 60366a9 |
| 220506-wordpress-gridea-迁移 | /en/posts/wordpress-qian-yi-gridea-ji-lu/ | 246aaae |

## 要点

- frontmatter 均为 title/date/draft/url + translationSynced: 2026-09-26；正文首行为斜体 Translated from 行。
- 站内链接改写：仅第 1 篇涉及，目标 slug 按 frontmatter 实际 url 解析（试点文章 → /en/posts/claude-code-risk-model-philosophy/，context-is-all-you-need → /en/posts/context-is-all-you-need/，其余两篇无 url 覆盖、按目录名）。无锚点链接，未触发去锚点规则。
- 残留汉字：第 1 篇 0；第 2 篇 57（均为带英文注释的 Prompt 示例原文与中文人名示例）；第 3 篇 8（JS 代码块内的 console.log 字符串，代码保持原样）。
- 图片：英文页 7/13/2 张，全部存在；与中文页差异仅第 2 篇 1 张（中文页 cover frontmatter 渲染的封面图，按锁定决策 3 英文页不复制 cover）。
- 中文原稿、hugo.toml、layouts、themes、.github、publish.mjs 均未改动（白名单断言通过）。
