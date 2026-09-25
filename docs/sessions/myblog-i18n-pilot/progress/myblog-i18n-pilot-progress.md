# myblog-i18n-pilot 进度存档

## 里程碑 1：多语言站骨架（hugo.toml + EN archives/search + giscus 语言适配）

- **当前阶段**：hugo.toml 拆分为 zh/en 两个语言块并启用多语言；新建 `content/archives/index.en.md`、`content/search/index.en.md`；`layouts/partials/comments.html` 改为按页面语言输出 `data-lang`。
- **本段结论**：中文站 471 个 index.html 路径与基线 diff 为空，中文菜单、搜索 placeholder、canonical 均未变；英文站 `/en/archives/`、`/en/search/`、`/en/index.json` 均生成，frontmatter 显式 `url` 不会被二次加语言前缀。中文页 giscus 输出仍为 `data-lang=zh-CN`。
- **关键决策与已否决方案**：Hugo 多语言（`defaultContentLanguageInSubdir = false`）下会自动生成 `/zh/` 无索引跳转别名页，新增 `disableDefaultLanguageRedirect = true`（v0.140.0+ 官方配置）保持站点 URL 表面不变；英文菜单 url 写相对路径 `/archives/`（主题 `absLangURL` 会为英文站渲染成 `/en/archives/`，写死 `/en/archives/` 反而会得到 `/en/en/`）；`params.description` 用纯文本（meta 不走 markdownify），带链接的文案只放 `homeInfoParams.Content`。已否决：菜单写进顶层 `[menus]`（两种语言会互相混入）。
- **下一步唯一动作**：翻译试点文章为 `index.en.md`。
