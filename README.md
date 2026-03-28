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
publish.mjs             # 发布脚本
hugo.toml               # Hugo 配置
```

## 评论系统

使用 [Giscus](https://giscus.app/)，基于 GitHub Discussions，无需数据库。
