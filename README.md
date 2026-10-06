# 杂谈by立行

个人博客，基于 [Hugo](https://gohugo.io/) + [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 主题，部署在 GitHub Pages。

**站点地址**：https://zj1123581321.com/

## 发布文章

需要 [Node.js](https://nodejs.org/) 环境。

```bash
# 1. 发布文章（自动下载局域网图床图片并本地化）
node publish.mjs "path/to/你的文章.md"

# 也可以自定义 URL slug
node publish.mjs "path/to/你的文章.md" my-custom-slug

# 2. 提交并推送，GitHub Actions 会自动构建部署
git add -A
git commit -m "post: 文章标题"
git push
```

发布脚本会自动：
- 扫描文章中所有 `http://192.168.*` 的图片链接并下载到本地
- 替换图片引用为相对路径
- 补全 Hugo frontmatter（标题、日期）
- 生成 [Page Bundle](https://gohugo.io/content-management/page-bundles/) 目录结构

## 同步到公众号和 X

文章发上博客后，可以用仓库里的工具把同一篇文章发到微信公众号和 X。工具的全部细节见
[tools/publish/README.md](tools/publish/README.md)，这里只写操作顺序。

前提：文章已按上面的「发布文章」流程导入并推送。公众号和 X 的配图都直接引用 GitHub
仓库里的图片，所以**图片必须先推送**，没推送的话第 1 步就会报错停下。

### 第 1 步：生成多平台数据

```bash
# 首次先安装依赖
cd tools/publish && npm ci

# 回到仓库根
cd ../..

# 生成（<目录名> 换成 content/posts/ 下的目录名）
node tools/publish/build.mjs content/posts/<目录名>
```

成功时最后一行打印复制页路径：

```
复制页路径：/md2p/page/?post=<目录名>
```

如果报 `图片尚未推送：…`，把报错列出的文件提交并推送后重跑。文章里如果有 mermaid 图，
首次构建会生成对应 PNG，同样要先提交推送再重跑一次。

### 第 2 步：复制进公众号后台

浏览器打开复制页（首次使用先跑一次 `tools/publish/serve.sh` 注册，它会打印本机的完整地址；之后不用再跑）：

```
https://<本机 tailnet 域名>/md2p/page/?post=<目录名>
```

点 **「复制公众号全文」**，到微信公众号后台的图文编辑器里粘贴，检查排版后发布。

### 第 3 步：把公众号链接写回文章

公众号发出后，在这篇文章 `index.md` 的 frontmatter（顶部两条 `---` 之间）加一行：

```yaml
wechat_url: "https://mp.weixin.qq.com/s/xxxx"
```

这行的作用：以后新文章里链接到这篇旧文章时，公众号版会自动换成可点的公众号链接。
写完提交推送。旧文章多的话可以跑回填脚本批量补（先 `--dry-run` 预览）：

```bash
node tools/publish/backfill-wechat-url.mjs --dry-run
node tools/publish/backfill-wechat-url.mjs
```

### 第 4 步：生成 X 草稿

前提：Mac 的 Chrome 里装好 Kimi 扩展并保持连接，且已登录 X。

```bash
node tools/publish/x-draft.mjs content/posts/<目录名>
```

命令会自动在 X 新建一篇长文章草稿，填好标题封面、按顺序贴完全部正文，最后打印
`草稿 URL：…`（一篇要几分钟）。打开链接检查，确认没问题后**自己点发布**——工具只
生成草稿，绝不代点发布。为免被 X 判定为机器人，每步之间会随机停 3–8 秒并逐段打印
`[n/总] 已贴入 …` 进度，慢是正常的。

### 常见问题

- X 草稿报 `extension_not_connected`：Chrome 里的 Kimi 扩展断开了，打开扩展恢复连接再重跑。
- X 草稿报 `extension_error`：X 页面上开着其他扩展的浮层（密码管理器、翻译弹窗）会导致，
  关掉再重跑。最常见的情况是 X 登录已失效、页面被跳到登录页，密码管理器弹出了自动填充——
  先在 Chrome 里重新登录 X。
- 构建报 `找不到内链目标：…`：文章里链接到了另一篇文章，但对方目录名不存在或写错了。
- 其他报错（图片上传超时、安全闸终止等）见
  [tools/publish/README.md](tools/publish/README.md)。

## 本地预览

```bash
# 安装 Hugo: https://gohugo.io/installation/
hugo server -D
```

## 目录结构

```
content/posts/          # 文章目录
  my-post/              #   Page Bundle（新文章）
    index.md            #     文章内容
    image.png           #     文章图片
  old-post.md           #   单文件（旧文章）
static/                 # 静态资源（旧文章图片）
layouts/partials/       # 自定义模板（Giscus 评论）
.github/workflows/      # GitHub Actions 自动部署
tools/publish/          # 公众号 / X 多平台发布工具
publish.mjs             # 发布脚本
hugo.toml               # Hugo 配置
```

## 评论系统

使用 [Giscus](https://giscus.app/)，基于 GitHub Discussions，无需数据库。
