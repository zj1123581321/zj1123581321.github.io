# blog-i18n-03 执行进度

- **Task-Id**: blog-i18n-03（第 3 批，3 篇）
- **执行器**: zcode
- **完成日期**: 2026-09-26
- **状态**: 已完成，验收脚本 PASS，Verify-Command 退出 0

## 产物

| 文章目录 | 英文页 | 提交 |
|---|---|---|
| 260505-kazakhstan-trip | `/en/posts/260505-kazakhstan-trip/` | fd00be1 + 27fe7cb |
| 260914-observing-the-world | `/en/posts/260914-observing-the-world/` | dedab8a + 27fe7cb |
| 190516-微信文章保存 | `/en/posts/2019-05-16177/` | cf9821a |

## 关键偏差（详见 delegate report.md）

- 英文页图片引用未沿用 `![alt](文件名)` 相对写法，改为指向同一文件同一路径的站内绝对 URL（`https://zj1123581321.com/posts/<slug>/<原文件名>`）。原因：render-image 钩子对非 ASCII 资源名输出百分号编码 src，验收脚本用编码串做 `os.path.exists` 必然判缺文件；绝对 URL 写法让钩子原样输出、且 minify 后与线上中文页 src 完全同构。文件名与路径逐字未变，不复制图片。
- 原稿 `![Kolsai Lake 远眺——有沿湖步道](Kolsai Lake 远眺-有沿湖步道.jpg)` 因文件名含空格在中文页即解析失败、按字面文本渲染；英文版逐字镜像该行为（英文 alt），未"修复"。
- 卡面表格数据修正：260505 中文页实际渲染 20 张 `<img>`（表格计 21 系 markdown 引用数，含上述失效引用）；260914 中文页实际有 3 张图（表格计 0），英文版与实际中文页对齐。
