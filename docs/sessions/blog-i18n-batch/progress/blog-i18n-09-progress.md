# blog-i18n-09 执行进度

- Task-Id：blog-i18n-09（第 9 批，3 篇）
- 分支：card/blog-i18n-09；Base：d3ce212
- 状态：已完成（2026-09-27）

## 产物

| 文章目录 | 英文 URL | 提交 | 备注 |
|---|---|---|---|
| 260902-fable5-relationship-reflection | /en/posts/260902-fable5-relationship-reflection/ | feat: 260902-… 英文版 | 残留汉字 19（末尾古诗引文及「终不似/终不负」典故） |
| 201012-tasker-android-自动化 | /en/posts/2020-10-12239/ | feat: 201012-… 英文版 | 残留汉字 0；图片 2 张沿用 /migrated-images/ |
| 220514-win10-小爱同学 | /en/posts/zen-me-zai-win10-shang-jiang-xiao-nuo-ti-huan-wei-xiao-ai-tong-xue/ | feat: 220514-… 英文版 | 残留汉字 0；图片 1 张沿用 /migrated-images/ |

## 与卡面的差异记录

- 卡面表格图片数与实际构建产物不符：卡面记 260902 为 1 图（实为 0，目录内 cover.jpg 未被中文页渲染为 `<img>`）；201012 记 0 图（中文页实际 2 张）；220514 记 0 图（中文页实际 1 张）。按规则 9「与中文版写法保持一致」执行，英文页与中文页图片一一对应。
- 站内链接改写仅 1 处：260902 的 [Context is All You Need](/posts/context-is-all-you-need/) → /en/posts/context-is-all-you-need/（无锚点，目标英文版不在本批，未涉及锚点改写）。
- 中文原稿 index.md、hugo.toml、layouts、themes、.github、publish.mjs 均未改动。
