# blog-i18n 第 4 批进度（blog-i18n-04）

- Base: d3ce212df9b14a82ee4dd5c60d75b8c90d93ccb7（main 合并试点后）
- 分支：card/blog-i18n-04；translationSynced 统一 2026-09-26
- 2026-09-26 完成 4 篇 index.en.md，逐篇独立提交：
  1. `260721-the-zelda-phase-of-life` → `/en/posts/260721-the-zelda-phase-of-life/`（f534f14，含 8 处站内链接改写 /en/、3 个 mermaid 图标签英译）
  2. `200130-b站-why-how` → `/en/posts/2020-01-30215/`（fcf2e42）
  3. `200131-ipad-os-文件管理` → `/en/posts/2020-01-31220/`（918e67f）
  4. `220714-windows-h265` → `/en/posts/windows-wen-jian-guan-li-qi-he-h265/`（39ce2ce）
- 中文原稿 index.md、hugo.toml、layouts、themes 均未改动
- 验收：hugo --gc --minify 构建 + /tmp/i18n-check-4.py 全绿，详见执行报告
