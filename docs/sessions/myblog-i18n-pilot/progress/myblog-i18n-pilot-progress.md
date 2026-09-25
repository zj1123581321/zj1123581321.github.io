# myblog-i18n-pilot 进度存档

## 里程碑 1：多语言站骨架（hugo.toml + EN archives/search + giscus 语言适配）

- **当前阶段**：hugo.toml 拆分为 zh/en 两个语言块并启用多语言；新建 `content/archives/index.en.md`、`content/search/index.en.md`；`layouts/partials/comments.html` 改为按页面语言输出 `data-lang`。
- **本段结论**：中文站 471 个 index.html 路径与基线 diff 为空，中文菜单、搜索 placeholder、canonical 均未变；英文站 `/en/archives/`、`/en/search/`、`/en/index.json` 均生成，frontmatter 显式 `url` 不会被二次加语言前缀。中文页 giscus 输出仍为 `data-lang=zh-CN`。
- **关键决策与已否决方案**：Hugo 多语言（`defaultContentLanguageInSubdir = false`）下会自动生成 `/zh/` 无索引跳转别名页，新增 `disableDefaultLanguageRedirect = true`（v0.140.0+ 官方配置）保持站点 URL 表面不变；英文菜单 url 写相对路径 `/archives/`（主题 `absLangURL` 会为英文站渲染成 `/en/archives/`，写死 `/en/archives/` 反而会得到 `/en/en/`）；`params.description` 用纯文本（meta 不走 markdownify），带链接的文案只放 `homeInfoParams.Content`。已否决：菜单写进顶层 `[menus]`（两种语言会互相混入）。
- **下一步唯一动作**：翻译试点文章为 `index.en.md`。

## 里程碑 2：试点文章英文版 + 验收全绿

- **当前阶段**：`index.en.md` 译文完成并入库；站点自带的 `render-image.html` 覆盖升级为资源解析式；Verify-Command 与 8 项行为验收、E2E 双向切换全部通过。
- **本段结论**：`/en/posts/claude-code-risk-model-philosophy/` 正常输出，中文网址列表与基线 diff 为空，中文 RSS 条数不变；英文 RSS 恰 1 条。译文里指向中文原文的 Markdown 链接不会被加语言前缀。
- **关键决策与已否决方案**：站内旧 `render-image.html` 直接输出裸相对路径，多语言下英文页图片会 404（bundle 资源只发布在中文路径下），参照 PaperMod 原生模板改为 `PageInner.Resources.Get` 取 `.RelPermalink`，两种语言图片共享同一 URL、文件不复制；`data-lang` 用 `cond (eq .Lang "zh") "zh-CN" .Lang`（giscus 无 `zh` locale，必须地区限定码）。已否决：为英文版复制一份图片文件（卡面明确禁止）。
- **下一步唯一动作**：push 分支、清理临时目录、交验收报告。

