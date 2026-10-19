# DESIGN-note：英文版本化——先修体验，再让新文章自带英文草稿

## 目标

读者只在文章真有英文版时才看到语言切换。新文章发布时自动生成一份英文草稿（`draft: true`），作者审过后改为公开。中文改了而英文没跟上时，PR 上会出现警告，不再静默过期。

## 非目标

- 不强制每篇都有英文版。先试运行 3–5 篇，根据审稿耗时再决定是否改成必译。
- 不批量回译旧文。
- 不做术语表系统、按图片/代码块计数的结构闸门、全站内链自动改写、`x-default` hreflang、中英评论合并（Codex 咨询 2026-10-19 建议首版砍掉）。
- 不在 CI 或构建期调用模型。
- 公众号/X 分发工具（`tools/publish/`）只读中文 `index.md`，本批不改。
- Obsidian 源头不存英文；英文以仓内 `index.en.md` 为唯一真本。

## 为什么不是分区 / 删除 / 约定

- **分区**：中英文本来就分文件（`index.md` / `index.en.md`），英文不回写中文。新鲜度检查只读不写，不需要锁或状态机。
- **删除**：砍掉「必译」硬规则和截止日期门槛（文章可能用旧日期发布、旧文也会持续编辑，日期判不准）；砍掉结构计数闸门（数量一致照样可能漏译，数量不同也可能是合理改写）。
- **约定**：英文 url 按约定从中文推导（中文有 `url` 时为 `/en` + 中文 url；中文无 `url` 时英文也不写）。新鲜度判据用一个 frontmatter 字段 `sourceHash` 承载，不另建账本。

## 方案要点与已否决方案

- **要点**：
  1. 卡 A（体验）：语言切换只在当前页有译文时出现；英文菜单补 About，并新增 `content/about/index.en.md`；英文页的 RSS 图标指向 `/en/index.xml`。
  2. 卡 B（发布脚本重跑安全）：`publish.mjs` 重跑时保留目标 `index.md` 已有的 frontmatter 字段（如 `wechat_url`、`url`）；把完工提示里的 `git add -A` 改成显式路径。
  3. 卡 D（新鲜度契约 + PR 检查）：新建 `tools/i18n/`，内含共享哈希函数 `sourceHash`、检查脚本 `check.mjs`，以及 PR 触发的 `.github/workflows/check.yml`（Hugo 构建 + 检查脚本）。同时把试点译文的 `translationSynced` 迁移为 `sourceHash`。
  4. 卡 C（英文草稿生成）：新建 `tools/i18n/translate.mjs <文章目录>`，调用本机 `claude -p` 把中文正文译成英文，写出 `index.en.md`（`draft: true`、`sourceHash`、`translatedBy`、推导出的 `url`）。目标文件已存在时，把旧译文一并喂给模型，只改变动部分。`publish.mjs` 末尾默认调用它，传 `--no-en` 时跳过。
  5. 并行关系：A、B、D 互不依赖，并行；C 依赖 B（同改 `publish.mjs`）和 D（复用 `sourceHash`），串行在后。
- **已否决**：
  - CI/构建期自动翻译：构建不可复现、未审文本直接上线、CI 需要模型密钥。
  - 整文件哈希：公众号回填 `wechat_url` 也会触发误报。改为只哈希正文。
  - 哈希不一致时阻断合并：哈希只能证明「变了」，不能证明「译文已修正」。阻断会逼人改哈希消警，所以只警告。
  - 「某日期后必须有英文」规则：日期不可靠。
  - 在 Obsidian 再存一份英文：会和仓内真本分叉。

## 关键不变式

1. [契约] `sourceHash` = 中文 `index.md` 去掉 frontmatter 后的正文，CRLF 归一为 LF、首尾空白 trim，再取 sha256 小写十六进制，写成 `sha256:<hex>`。全仓只有 `tools/i18n/lib.mjs` 的一个导出函数实现它，`check.mjs` 与 `translate.mjs` 都 import 它。由卡 D 的单测锁定（改 frontmatter 不变、改正文变）。
2. [契约] 每个 `index.en.md` 必须有 `sourceHash`；英文 url 符合上面的推导约定；同目录必须存在 `index.md`。违反时 `check.mjs` 退出非零。哈希不一致时只输出 `::warning` 行，退出 0。由卡 D 单测锁定。
3. [契约] 语言切换链接只在 `.IsTranslated` 为真的页面渲染。由卡 A 的构建产物 grep 锁定：未翻译中文页不含指向 `/en/` 的切换链接，试点页含。
4. [契约] `publish.mjs` 重跑不丢目标文件已有的 frontmatter 键。由卡 B 单测锁定。
5. [契约] 翻译工具生成的文件 `draft: true`，绝不直接公开。由卡 C 单测锁定。

## 待验证前提

1. [推断] `claude -p` 在本机可非交互调用、单篇约 20KB 中文能一次完成翻译。卡 C 用一篇真实文章实测，失败则在报告中给出实测输出。
2. [推断] PaperMod 的 `header.html` 用 `site.Home.Translations` 决定是否显示切换（`themes/PaperMod/layouts/partials/header.html:61`），覆盖该 partial 即可改为页面级判断。卡 A 实测。

## 验收路径

1. 入口：本机 `node publish.mjs <Obsidian 文章.md>`。
2. 步骤：生成中文 bundle 与英文草稿 → `hugo server -D` 预览英文草稿 → 把 `draft` 改为 `false` → 开 PR → `check.yml` 运行。
3. 预期：PR 检查通过；线上中文文章右上角只在有译文时显示 "En"；英文页 About 与 RSS 可用；之后修改中文正文再开 PR，检查给出新鲜度警告但不阻断。
