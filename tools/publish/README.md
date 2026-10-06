# tools/publish — md2platforms 生成器

把一篇 Hugo page bundle 文章转成「公众号 HTML + X 分段」的 `data.json`，供复制页
（`tools/publish/page/`）读取。

> 端到端操作流程（从文章导入到公众号/X 发出）见仓库根 [README.md](../../README.md) 的「同步到公众号和 X」一节。

```bash
cd tools/publish
npm ci                       # 安装依赖（playwright 复用 ~/.cache/ms-playwright 的 chromium-1223）
node build.mjs content/posts/261004-context-and-loop
```

成功时产物落在 `tools/publish/out/<目录名>/`（已 gitignore），stdout 最后一行打印复制页路径：

```
复制页路径：/md2p/page/?post=261004-context-and-loop
```

## 产物结构

```
tools/publish/out/<目录名>/
├── data.json        # schema: md2platforms/v1，见下
└── assets/          # X 版素材：正文图片副本、表格/代码块 PNG、mermaid PNG 副本
```

`data.json` 契约（所有 src/cover 相对于 data.json 所在目录）：

```jsonc
{
  "schema": "md2platforms/v1",
  "post": "261004-context-and-loop",
  "title": "…",                  // frontmatter title（frontmatter 本身不进任何产物）
  "blog_url": "https://zj1123581321.com/posts/<目录名>/",
  "cover": "assets/cover.jpg",   // 正文第一张图片；无图则 null
  "wechat": { "html": "<section id=\"nice\" …>…</section>" },  // 兰青样式已内联
  "x": { "segments": [
    { "kind": "html",  "html": "<h2>…</h2><p>…</p>" },
    { "kind": "image", "src": "assets/x-table-001.png", "alt": "表格 1" },
    { "kind": "image", "src": "assets/a.png", "alt": "图注文字", "caption": "图注文字" }
  ] }
}
```

`caption` 是可选字段：只有作者在 Markdown 里手写的非空图片说明（`![说明](src)` 的 alt）才有，
且与 `alt` 逐字相同；表格/代码块/mermaid 等生成器自造的图没有这个字段，X 草稿填充时也不会点字幕。

X 分段规则：html 段（相邻块合并为一段）与 image 段交替；表格/代码块/mermaid 各渲染成
PNG（宽 680px、deviceScaleFactor 2）；html 段中不出现 `<table>`/`<pre>`/`<img>`；
文末追加「本文首发于我的博客」段。

## 图片约定

正文图片 `![alt](src)` 的 src 只接受三类，其余形式构建报错并给出行号：

1. bundle 内相对路径（`images/cover.jpg`）→ 公众号引用
   `https://raw.githubusercontent.com/zj1123581321/zj1123581321.github.io/main/content/posts/<目录>/<相对路径>`
2. 站点根路径 `/migrated-images/...`、`/post-images/...`（对应仓库 `static/`）→
   `…/main/static/<路径>`
3. `http(s)://` 外链 → 原样保留

路径段做 percent-encode（中文文件名）。

## 未推送检查

公众号图片走 raw.githubusercontent，因此①②类图片（含 mermaid 生成的
`images/generated/mermaid-<sha256前12位>.png`）必须已在 `origin/main` 上。缺失时构建
非零退出并逐个列出缺失路径，不写任何产物：

```
图片尚未推送：以下 N 个文件不在 origin/main 上，先提交并推送后重跑（或测试用 --skip-push-check）：
content/posts/260809-…/images/generated/mermaid-50ebba13a0e2.png
```

`--skip-push-check` 只给测试用。mermaid PNG 首次生成后需提交、推送，再重跑构建。

## 内链约定

链接目标形如 `../<x>/` 或 `/posts/<x>/`（可带 `#锚点`）视为内链，`<x>` 先按目录名
匹配 `content/posts/<x>/`，再按各文章 frontmatter `url:` 末段匹配；都匹配不到构建报错。

- 公众号：目标有 `wechat_url` → 用它（保持可点链接）；没有 → 目标博客 URL（随后按
  mdnice 同款转脚注）。
- X：一律 → 目标博客 URL（frontmatter `url:` 优先，否则 `/posts/<目录名>/`）。
- 外链（除 `mp.weixin.qq.com`）在公众号版全部转为文末脚注。

## wechat_url 约定

文章发布公众号后，在其 frontmatter 手工加一行（或跑一次性回填脚本）：

```yaml
---
title: "…"
wechat_url: "https://mp.weixin.qq.com/s/xxxx"
---
```

回填脚本（已运行过一次；新文章发布后可再跑，已有 wechat_url 的会跳过）：

```bash
node tools/publish/backfill-wechat-url.mjs --dry-run   # 先看映射表
node tools/publish/backfill-wechat-url.mjs             # 实际写入 frontmatter
```

配对规则：原文内链文本 × `*公众号版.md` 中同文本的 mp.weixin 链接；同一目标得到冲突
URL、同一文本对应多个目标/URL 时报错停止。

## 结构与移植说明

- `lib/mdnice/` 移植自 [mdnice/markdown-nice](https://github.com/mdnice/markdown-nice)
  `src/utils/`（GPL-3.0），原文件逻辑未改；`LICENSE` 为 GPL-3.0 全文。
- `lib/wechat.mjs`：markdown-it + 上述插件 + implicit-figures 渲染成
  `<section id="nice">` 结构，再用 juice 把 `themes/lanqing.css` 内联为 style 属性
  （`inlinePseudoElements`、`preserveImportant`，与 mdnice 线上一致）。主题 CSS 不得修改。
- `lib/render.mjs`：playwright chromium 统一渲染 mermaid（mermaid npm 包、default 主题）
  与表格/代码块 PNG。
- 测试：`npm test`（node:test）。fixture 直接读仓库真实文章 261004-context-and-loop、
  260809-multi-agent-scheduling-architecture。

## X 草稿自动填充

前提：

- Mac Chrome 已安装 Kimi Browser Extension，并登录了 X；
- Kimi WebBridge 守护进程正在运行，扩展已连接；
- `tools/publish/out/<目录>/` 中的素材可由生成器产出；若 `data.json` 不存在，命令会先在
  进程内运行现有 build。

运行：

```bash
node tools/publish/x-draft.mjs content/posts/261004-context-and-loop
```

命令会打印预检的图片段数量、总字数和带字幕的图片数，然后在 X 新建一篇长文章草稿，填写标题、
上传封面并按 `x.segments` 顺序粘贴正文。封面与第一段图片相同时，正文会跳过该段。每个正文图片都等待
编辑器图片块实际上传完成；带 `caption` 的图片会再点开图片块的「提供字幕（可选）」对话框、填入字幕
并点「保存」，等字幕出现在图片块下方才继续。最后校验编辑器块顺序并打印草稿 URL；
命令绝不会点击「发布」。

命令先看 `md2p-x-draft` 会话里有没有现成标签页：有就切过去直接导航，不新开（反复跑不会越攒越多），
没有才新开一个标签页。跑完停在草稿页不关，方便自己检查；要收拾干净就关掉这个标签页组。

常见报错：

- `bridge 配置不存在` / `bridge 配置缺少 addr`：检查 `~/.kimi-webbridge/config.json` 的
  `addr` 字段；
- `extension_not_connected`：打开 Chrome 中的 Kimi 扩展并恢复连接；
- `上传超时`：X 未在 60 秒内生成已上传图片块或封面，命令会非零退出并报告已完成段数；
- `HTML 落盘且图片块保持`：长 HTML 粘贴后图片块数回退或文末未进入编辑器，同样非零退出；
- `图片字幕对话框` / `图片字幕保存`：X 的字幕对话框没弹出，或点了保存后字幕没落到图片块下方；
- `安全闸找不到 click 目标：[data-md2p-caption-save="1"]`：X 改了字幕对话框结构，命令会停在这里
  而不是盲点按钮；
- `拒绝点击发布相关目标` 或 `段顺序自检不一致`：安全闸和顺序自检会直接终止，避免误发布或
  生成顺序错误的草稿。
