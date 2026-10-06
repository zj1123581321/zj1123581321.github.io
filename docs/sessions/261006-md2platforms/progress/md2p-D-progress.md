当前阶段：收尾——根 README 端到端操作指引落地。

本段结论：根 README「发布文章」之后新增「同步到公众号和 X」节，按真实顺序写四步
（生成多平台数据 → 复制进公众号 → wechat_url 写回 → X 草稿）加常见问题；「目录结构」
表补 `tools/publish/` 一行。步骤中每条命令、输出与报错文案均对照源码核实：
`node tools/publish/build.mjs`（build.mjs:11,135）、复制页路径输出（build.mjs:129）、
「图片尚未推送…」（lib/push-check.mjs:17）、「找不到内链目标…」（lib/links.mjs:65）、
「草稿 URL：…」（lib/xdraft.mjs:514）、绝不点发布（lib/xdraft.mjs:94）、
wechat_url 与回填脚本（tools/publish/README.md「wechat_url 约定」、
backfill-wechat-url.mjs:7）、复制页 URL 格式（serve.sh:26，卡面现场事实已注册）。

关键决策与已否决方案：根 README 只写操作流程，细节一律链接 tools/publish/README.md，
不复制大段技术内容（锁定决策 2）；常见问题只列仓主高频会撞到的三条
（extension_not_connected、extension_error、找不到内链目标），其余链接到
tools/publish/README.md「常见报错」。

下一步唯一动作：清理 tools/publish/README.md 开发过程用语并加指回根 README 的导航，
核查 page/README.md 同类用语，跑 `cd tools/publish && npm test` 后提交。
