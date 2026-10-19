当前阶段：implementing — lib.mjs 与哈希单测落地。

本段结论：`tools/i18n/lib.mjs` 导出 `sourceHash` 与 `readFrontmatter`，按锁定决策做 CRLF 归一、闭合 `---` 切正文、trim 后 sha256。单测锁死「只改 frontmatter 不变 / 改正文变 / CRLF 等同 / 无 frontmatter 抛 I18N-FRONTMATTER-UNPARSEABLE」。

关键决策与已否决方案：哈希只吃正文不吃整文件（整文件会把 wechat_url 回填当过期）；解析失败一律抛 I18N-FRONTMATTER-UNPARSEABLE，不加兼容分支。

下一步唯一动作：写 check.mjs 夹具测试并实现检查脚本。
