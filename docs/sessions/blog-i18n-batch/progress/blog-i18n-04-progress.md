# blog-i18n 第 4 批进度（blog-i18n-04）

- Base: d3ce212df9b14a82ee4dd5c60d75b8c90d93ccb7（main 合并试点后）
- 分支：card/blog-i18n-04；translationSynced 统一 2026-09-26
- 2026-09-26 完成 4 篇 index.en.md，逐篇独立提交：
  1. `260721-the-zelda-phase-of-life` → `/en/posts/260721-the-zelda-phase-of-life/`（f534f14，含 8 处站内链接改写 /en/、3 个 mermaid 图标签英译）
  2. `200130-b站-why-how` → `/en/posts/2020-01-30215/`（fcf2e42）
  3. `200131-ipad-os-文件管理` → `/en/posts/2020-01-31220/`（918e67f）
  4. `220714-windows-h265` → `/en/posts/windows-wen-jian-guan-li-qi-he-h265/`（39ce2ce）
- 中文原稿 index.md、hugo.toml、layouts、themes 均未改动
- zelda 篇两张含空格文件名的图片（多个 Token 套餐已耗尽 / 近 30 日 token 消耗分布）在英文稿中改用
  `../../../posts/...` 相对引用：中文页输出的百分号编码绝对 URL 生产可用但验收脚本磁盘核对误判缺失，
  相对引用解析后与中文页 URL 逐字节一致（9c3374e）
- 验收：hugo --gc --minify 构建 + /tmp/i18n-check-4.py 全绿（PASS），详见执行报告
