# 卡 C 进度：新文章自带英文草稿（translate.mjs + publish.mjs 接入）

## 里程碑 1：translate.mjs + 单测

- 当前阶段：implementing
- 本段结论：`tools/i18n/translate.mjs` 完成并入库，8 个单测全绿（全套 26 绿）。模型输出格式定为 `=== TITLE === / === DESCRIPTION === / === BODY ===` 标记行协议，标题与 description 做空白折叠、正文原样保留，脚本可确定性解析；frontmatter 全部由脚本生成（draft: true / sourceHash / translatedBy / url 推导 / 首行声明）。失败路径（stub 非零退出、空输出、无标记、已有译文时失败字节不变）均 fail-loud 上抛 `I18N-TRANSLATE-FAILED` 且不写目标文件。
- 关键决策与已否决方案：frontmatter 切分在 translate.mjs 本地实现 bodyOf()（lib.mjs 禁改、其 splitFrontmatter 未导出，不改签名新增导出也超出本卡边界）；标题/描述多行输出折叠为单行而非报错（模型输出此类空白差异属常态，折叠是确定性规范化而非 fallback）。
- 下一步唯一动作：publish.mjs 接入默认翻译 + --no-en，补 test/publish.test.mjs 集成用例。

## 里程碑 2：publish.mjs 接入

- 当前阶段：implementing
- 本段结论：publish.mjs 写完中文后默认 spawn 调 translate.mjs（stdio inherit），失败时报「中文已生成，英文失败，可单独重跑」并以非零退出；`--no-en` 传入后完全跳过，位置参数 `<md> [slug]` 兼容不变。test/publish.test.mjs 新增 3 例（默认路径 E2E 打桩最外层 claude 并跑 check、--no-en 不调用、翻译失败中文已落盘），存量 6 例改走 --no-en 并注入空 stub 防误触真模型，全套 29 绿。
- 关键决策与已否决方案：存量用例不共用翻译 sandbox——它们只测中文 frontmatter 合并逻辑，统一 --no-en + 空 stub（误触翻译即非零退出转红），避免为它们伪造合法模型输出。
- 下一步唯一动作：check.yml 加跑仓根 test/，README 发布一节补英文草稿流程。
