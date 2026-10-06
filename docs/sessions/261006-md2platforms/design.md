# DESIGN-note：博客文章一键生成公众号 / X 长文章的「复制页」

## 目标

写完 `content/posts/<目录>/index.md` 后跑一条命令，在 Mac 浏览器打开一个 HTTPS 页面：
公众号版点一次「复制」即可粘进公众号后台（兰青样式 + 外链脚注 + 内链换公众号链接），
X 版按顺序点「复制」→ 粘贴（正文段落与图片交替），不再需要 Markdown Nice、手工换图床、手工补图。

## 非目标

- 不调公众号 API / X API，不自动发布、不推草稿箱（用户要在后台继续编辑；X API 按量付费不划算）。
- 不做网页编辑器；改稿仍在 Markdown 里，平台措辞微调在各平台后台做。
- 不再生成 `公众号版.md` / `X版.md` 中间文件（已有的保留不动）。
- 不做浏览器自动化插图（baoyu-post-to-x 等），第一版靠逐段复制；嫌烦再加。
- 不处理旧文章的站点根路径图片（`/migrated-images/` 等）以外的历史格式兼容；遇到无法解析的图片直接报错。

## 为什么不是分区 / 删除 / 约定

- **分区**：两个平台的产物完全独立（公众号 HTML / X 分段），共享的只有「解析 Markdown + 链接映射」，
  按「生成器（Node 命令）」与「复制页（静态前端）」切两块，中间只隔一个 `data.json` 契约。
- **删除**：砍掉中间 md 文件、砍掉 API 发布、砍掉 X 自动插图；剩下的每一步都是现在手工在做的。
- **约定**：链接映射不建单独表，用约定——已发公众号的文章在自己的 frontmatter 写 `wechat_url:`；
  生成物统一落 `tools/publish/.out/<目录名>/`（gitignore）；复制页靠目录约定定位数据，无服务端。

## 方案要点与已否决方案

- **要点**：
  - 代码放博客仓库 `tools/publish/`（独立 `package.json`，Node 24，ESM）。Hugo 不读该目录。
  - 入口：`node tools/publish/build.mjs content/posts/<目录>` → 产出
    `tools/publish/.out/<目录>/data.json` + `assets/`，并打印复制页 URL。
  - 复制页：`tools/publish/page/index.html`（无构建链静态页），用 `?post=<目录>` 读
    `../.out/<目录>/data.json`。整个 `tools/publish/` 用 `tailscale serve` 挂成 HTTPS（剪贴板写图片要求安全上下文）。
  - **公众号版**：markdown-it + 移植 mdnice 开源仓库（GPL-3.0）的插件（span/linkfoot/table-container 等），
    生成与 mdnice 同构的 HTML（`<section id="nice">`、标题 `.prefix/.content/.suffix`、脚注 `.footnote-word` 等），
    再用 juice 把 `themes/lanqing.css`（从 mdnice 线上「兰青」主题导出的 CSSOM，含代码块主题）内联成 style 属性。
    - 图片 → `https://raw.githubusercontent.com/zj1123581321/zj1123581321.github.io/main/content/posts/<目录>/<相对路径>`（中文 percent-encode）。
    - 内链（`../<目录>/`、`/posts/<slug>/`）→ 目标文章 frontmatter `wechat_url`；没有则 → 博客 URL（随后作为外链转脚注）。
    - 外链 → 脚注（mp.weixin.qq.com 链接保持可点）。
    - mermaid → PNG，写入文章目录 `images/generated/mermaid-<内容哈希>.png`（需提交推送，公众号要从 GitHub 拉图）。
    - 表格保留（mdnice 表格样式）。
  - **X 版**：分段数组：`html` 段（标题/段落/列表/引用/链接）与 `image` 段交替。
    - 表格、代码块、mermaid → PNG（只放 `.out/<目录>/assets/`，不进 git）。
    - 内链 → 博客 URL（尊重 frontmatter `url:` 覆盖）；文末追加「本文首发于我的博客：<博客 URL>」。
    - 标题与封面单独给复制按钮（X 标题、封面是独立字段）。
  - 复制实现：公众号 `ClipboardItem({'text/html', 'text/plain'})`；X 图片段 fetch 同源资源 → canvas 转 PNG →
    `ClipboardItem({'image/png'})`（Chrome 剪贴板只收 PNG）。
  - 发布前检查：公众号版引用的本地图片若不在 `origin/main` 上（`git cat-file -e origin/main:<路径>`），
    build 直接报错列出缺失文件，不生成。
  - 一次性回填：从已有 10 份 `公众号版.md` 里提取「内链 → mp.weixin 链接」对应关系，回填到目标文章 frontmatter `wechat_url`。
- **已否决**：
  - wenyan-cli 直推草稿箱：用户要保留后台编辑，且未认证订阅号有 48001 风险。
  - wenyan 自带 lapis 主题：实测颜色（蓝 #4870ac）与 H2 样式与兰青不符。
  - doocs/md + COSE 扩展：X 适配器整段贴 HTML，图片/表格会丢，且有未关闭超时问题。
  - X 官方 Articles API：需按量付费 + 自写 DraftJS 转换。
  - 单独维护链接映射表：与 frontmatter 双写易漂移。
  - 远程 `<img src>` 粘进 X：主流工具均逐张上传，旁证表明 X 不会拉远程图（待验证前提 2）。

## 关键不变式

1. [实测] 兰青主题依赖 mdnice 的 DOM 结构：`themes/lanqing.css` 130 条规则全部以 `#nice` 开头，依赖类名
   `.content/.prefix/.suffix/.table-container/.footnote-word/.footnote-ref/.footnotes/.footnote-item/.custom`。
   → 锁定：生成器快照测试断言公众号 HTML 中这些结构存在且关键元素带内联 `color: rgb(0, 150, 136)`（H2 内容、strong）。
2. [实测] 现有手工公众号版的图片 URL 形态为 raw.githubusercontent（见 `261004-context-and-loop/公众号版.md`）。
   → 锁定：以 261004 为 fixture，生成结果的图片 URL 集合 ⊇ 手工版的图片 URL 集合。
3. 内链映射三态必须区分：有 `wechat_url` → 公众号链接；无 → 博客 URL；目标目录不存在 → build 报错（不静默放过）。
   → 锁定：生成器单测三格。
4. 本地图片未推送 → build 失败且列出路径（不生成半成品）。→ 锁定：生成器单测。
5. X 分段里不出现 `<table>`、`<pre>`、mermaid 源码；每个表格/代码块/mermaid 对应一个 image 段。→ 锁定：生成器单测。
6. 复制页：点公众号「复制」后剪贴板含 `text/html` 且含 `id="nice"`；点 X 图片段后剪贴板含 `image/png`。
   → 锁定：Playwright（本机 chromium）真浏览器测试，授予 clipboard 权限后读回剪贴板断言。

## 待验证前提

1. [推断] 公众号编辑器粘贴带 raw.githubusercontent 图片的富文本会自动转存图片——现有手工流程旁证成立，最终以用户真实粘贴验收为准。
2. [推断] X 编辑器粘贴 HTML 不带入远程图片、但接受剪贴板 `image/png` 粘贴——验收时在 X 草稿真实粘一次确认；若 HTML 里的图片其实能带入，则 X 版可简化为整篇一次复制。
3. [推断] 本机 tailscale 可对 `tools/publish/` 做 `tailscale serve` HTTPS（用户已确认有 HTTPS 能力，具体命令待执行器实测）。
4. [推断] mdnice 线上兰青主题与开源插件产出的 DOM 结构一致（主题 CSS 与开源仓 `markdown-it-span` 等的类名对得上）。

## 验收路径

1. 入口：博客仓库根目录 `node tools/publish/build.mjs content/posts/261004-context-and-loop`，Mac 浏览器打开打印出的 HTTPS 链接。
2. 步骤：点公众号「复制」→ 粘进公众号后台新建图文；按 X 分段依次复制粘贴进 X 长文章草稿（不发布）。
3. 预期：公众号预览与 Markdown Nice 兰青效果一致（标题、加粗、引用、图片、脚注）、内链为公众号链接；
   X 草稿图片位置正确、表格以图片呈现、文末有首发声明。
