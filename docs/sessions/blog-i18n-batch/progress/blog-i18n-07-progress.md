# blog-i18n-07 进度

- Task-Id: blog-20260926-07
- 批次：第 7 批，4 篇
- Base: d3ce212df9b14a82ee4dd5c60d75b8c90d93ccb7
- 状态：4/4 篇 index.en.md 已提交（每篇一个 commit），已构建验证，待主脑验收

| 文章目录 | 英文 URL | 提交 |
|---|---|---|
| 260809-multi-agent-scheduling-architecture | /en/posts/260809-multi-agent-scheduling-architecture/ | 0a5b34f |
| 190324-中文教材-pdf | /en/posts/2019-03-25129/ | f505a02 |
| 190428-新浪图床迁移 | /en/posts/2019-04-28154/ | 5f65d05 |
| 220504-迁移之前 | /en/posts/220504-start/ | a073b02 |

## 已知事项（详见 report.md）

1. 卡面验收脚本对文章 1 报 3 条「图片缺文件」，经核实为百分号编码误报：
   Hugo 渲染管线（render-image 钩子与内置 shortcode 均如此）对非 ASCII 文件名
   的 `<img src>` 一律输出百分号编码 URL，脚本用未解码的字面路径查盘必然找不到；
   URL 解码后文件全部存在于构建产物中，且与中文页渲染出的 URL 逐字节相同
   （中文线上页同款 URL 一直在正常出图）。无真实 404。
2. 卡面表格四篇「图片 0」与实际不符（实际 5 / 18 / 3 / 0 张）。
3. 金额按上下文补了美元括注（可选规则），已在 report.md 列明位置。
