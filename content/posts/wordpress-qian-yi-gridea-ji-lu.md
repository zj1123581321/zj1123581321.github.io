---
title: "WordPress 迁移 Gridea 记录"
date: 2022-05-06
draft: false
description: "五一假期花了大概一天把之前放在 WordPress 上的历史文章迁移到 Gridea 上面，里面还是存了不少坑，这里做个记录。 基本流程 全套流程大概可以有以下几步：  配置 Gridea 在 Github 的仓库和本地同步网络环境。 导出..."
---

五一假期花了大概一天把之前放在 WordPress 上的历史文章迁移到 Gridea 上面，里面还是存了不少坑，这里做个记录。

## 基本流程

全套流程大概可以有以下几步：

1.  配置 Gridea 在 Github 的仓库和本地同步网络环境。
2.  导出 WordPress 中文章成 Markdown 系列。
3.  导入历史文章到 Gridea，并根据历史 URL 修改新 URL。
4.  给 404 页面添加 JS 脚本变相实现 301(重定向)。

因为多数流程都可以在网络上找到，所以我只记录一些容易出现坑的地方。

## 配置 Gridea 云端仓库和本地同步网络环境

[🤗 快速上手 | Gridea](https://gridea.dev/gridea-start/)，安装的过程并不复杂，也有比较多的资料可供查询。

主要的问题在于 Gridea 本地同步经常提示 **[🙁 同步遇到了错误，请查阅 FAQ 或 Issues 来寻找解决方案](https://github.com/getgridea/gridea/issues/976)**。

Github 在部分网络条件下是被墙了，连接非常不稳，想要流畅访问 Github 通常都需要挂代理。自然，Gridea 如果部署在 Github Page 上，想要稳定连接，最好还是走代理。

按照 0.9.2 版本的更新内容，Gridea 原则上支持直接使用系统代理，但实测结果是开着代理的条件下，完全抓不到 Gridea 同步时的包，『Gridea 使用系统代理』多少有点玄学了。

这里略微解释一下为什么会出现这个问题。

放在 Github 仓库的博客在本地是通过 Git 来同步的，而 Git 这种处于网络层的应用无法被上层类似于 Clash 这种代理软件管理网络流量，需要单独通过命令设置代理。(更多可以参考 [git clone 网速过慢问题的两种解决方案 | CaryC Blog](https://blog.wdsxhb.club/2020/05/22/git/))

Gridea 对 Git 应该是做了一层封装，但是没有针对 Git 做网络代理配置。这就导致了在开启 Clash 等代理软件情况下，Gridea 的同步系统(Git)的网络流量实际上并没有被 Clash 接管，而是直接尝试连接 Github，自然同步也会经常出问题。

知道了原因，解决方案也就出来了，两个方向：

-   使代理软件接管更底层的网络流量，比如 Clash 的 Tun 模式(但 Issue 区也有反馈依旧失败的)。
-   通过 `proxifier` 给 Gridea 单独[设置网络代理](https://www.luoyelusheng.com/post/Gridea%E5%90%8C%E6%AD%A5github%E5%A4%B1%E8%B4%A5%E6%9C%80%E7%BB%88%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/)。

我自己是采用第二种方式的，缺点是想要同步时还需要把 Proxifier 提前打开。

当然，思路一还可以演化为使用路由器代理，直接接管电脑上的所有流量，不过这个显然门槛就更高了。

除此之外，还看到一个思路[利用 Github Desktop 客户端来完成同步](https://sonatta.top/post/Ux6xKOeOx/)的，也是一种思路。

## 导出 WordPress 中文章成 Markdown 系列

[WordPress文章导出迁移到Gridea | 孙建博的小站](https://www.sunjianbo.com/wordpress-to-gridea/)

我主要使用这篇文章中的方案将历史文章导出成 Markdown，麻烦的地方在于由于在 WP 使用了目录插件将文章可折叠的目录插入到了正文，文章导出后包含了部分 HTML 的内容，且格式混乱。

![混入了部分 HTML 的内容](/migrated-images/picgo_202205052359006.png)

这个问题我没啥一键处理的方案，都是单个文件逐步处理。删一些文章，然后从原稿中粘贴过来。

实际上**导出的 Markdown 里 Gridea 能识别的文档属性都在开头**，所以其实过程就是保留开头，删除剩余，粘贴原稿。

![文章信息](/migrated-images/picgo_202205060002883.png)

## 修改导入 Gridea 文章的 URL

因为历史文章的 URL 可能在多个地方已经被使用了，为了让这些导入的文章还能通过旧的 URL 访问，我们还需要花一定的功夫。

最理想的方法显然是在 Gridea 中直接使用旧的 URL。在 WP 中的文章 URL 我设置的是 `https://zj1123581321.com/2020-10-12/239/` 这种形式，但 Gridea 中文章的默认设置是 `https://zj1123581321.com/post/xxx`，其中 `xxx` 为自定义的内容，不能包含『/』，所以这条路被堵死了。

这条路走不通，很自然地想到[设置 301 跳转](https://ahrefs.com/blog/zh/301-redirects/)。可惜 301 跳转要么在服务器上做，要么在域名提供商处做。修改 Github 的服务器显然不现实，而国内阿里云也没有提供设置 URL 跳转的功能，所以这条路也是走不通的。

找了找资料，发现比较可行的方式是通过 404 页面的 JS 代码来实现变相访问，即判断如果用户是通过历史文章的 URL 进来的，通过 JS 使用户跳到文章现在的网址上。

所以我把导入 Gridea 的文章 URL 设置成 `https://zj1123581321.com/post/2020-10-12239/`，然后在 `Gridea 文档路径/static/404.html`中新增一段 JS 代码完成规则跳转。

```javascript
  <script>
  var url = window.location.href;
  var OldWpUrlReg = /.*zj1123581321\.com\/\d{4}-\d{2}-\d{2}\/\d.*/i;
  if (OldWpUrlReg.test(url)) {
      console.log('检测到是历史 WordPress Url');
      var new_url = url.replace('.com/', '.com/post/');
      console.log(new_url);
      var new_url = new_url.replace('https://zj1123581321.com/post/','JustForTemp');
      console.log(new_url);
      var new_url = new_url.replace(/\//g,'');
      console.log(new_url);
      var new_url = new_url.replace('JustForTemp','https://zj1123581321.com/post/');
      console.log('跳转 url：' + new_url);
      window.location.replace(new_url); 
  }  
  </script>
```

如今访问 [https://zj1123581321.com/2020-10-12/239/](https://zj1123581321.com/2020-10-12/239/) 就可以通过 404 页面中转一次，然后跳转到新的 URL 了。

* * *

希望对你有帮助，以上。
