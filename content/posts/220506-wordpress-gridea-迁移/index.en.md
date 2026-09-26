---
title: "Notes on Migrating from WordPress to Gridea"
date: 2022-05-06
draft: false
url: "/en/posts/wordpress-qian-yi-gridea-ji-lu/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/wordpress-qian-yi-gridea-ji-lu/). Last synced 2026-09-26.*

Over the May Day holiday (China's Labor Day break in early May), I spent about a day migrating my old posts from WordPress to Gridea. There were quite a few pitfalls along the way; here is a record of them.

## The Basic Process

The full process goes roughly like this:

1.  Set up Gridea's GitHub repository and the local sync network environment.
2.  Export the posts from WordPress as Markdown files.
3.  Import the old posts into Gridea, and adjust the new URLs based on the historical ones.
4.  Add a JS snippet to the 404 page to approximate 301 (redirects).

Since most of the process can be found online, I'll only record the pitfall-prone parts.

## Setting Up Gridea's Cloud Repo and Local Sync Network

[🤗 Getting Started | Gridea](https://gridea.dev/gridea-start/) — the installation isn't complicated, and there's plenty of material available to consult.

The main problem is that Gridea's local sync often fails with **[🙁 Sync encountered an error; check the FAQ or Issues for solutions](https://github.com/getgridea/gridea/issues/976)**.

GitHub is blocked under some network conditions in mainland China and connections are very unstable; smooth access to GitHub usually requires a proxy. Naturally, if Gridea deploys to GitHub Pages, a proxy is the best way to keep the connection stable.

According to the 0.9.2 release notes, Gridea should in principle support using the system proxy directly, but in my testing, with the proxy running, I couldn't capture Gridea's sync traffic at all — "Gridea uses the system proxy" is a bit of a mystical claim.

Here's a brief explanation of why this happens.

A blog hosted in a GitHub repository syncs locally through Git, and Git — sitting at the network layer — can't have its traffic managed by higher-level proxy apps like Clash (a popular proxy client in China); it needs its proxy configured separately via commands. (See more at [Two solutions to slow git clone | CaryC Blog](https://blog.wdsxhb.club/2020/05/22/git/))

Gridea wraps Git with a layer of its own, but doesn't expose proxy configuration for Git. As a result, when Clash or similar proxy software is running, the network traffic of Gridea's sync system (Git) isn't actually taken over by Clash — it tries to connect to GitHub directly, so syncing naturally breaks often.

With the cause known, the solutions follow — two directions:

-   Let the proxy software take over lower-level network traffic, e.g. Clash's Tun mode (though the issue tracker has reports of this still failing).
-   Use `proxifier` to [configure a network proxy](https://www.luoyelusheng.com/post/Gridea%E5%90%8C%E6%AD%A5github%E5%A4%B1%E8%B4%A5%E6%9C%80%E7%BB%88%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/) for Gridea specifically.

I went with the second approach myself; the drawback is having to open Proxifier in advance whenever you want to sync.

Of course, direction one can evolve into using a router-level proxy that takes over all of the computer's traffic — but the barrier is obviously higher there.

Beyond that, I also came across the idea of [using the GitHub Desktop client to handle the sync](https://sonatta.top/post/Ux6xKOeOx/) — another viable angle.

## Exporting WordPress Posts as Markdown

[Exporting WordPress posts and migrating to Gridea | Sun Jianbo's little site](https://www.sunjianbo.com/wordpress-to-gridea/)

I mainly used the approach in that article to export my old posts as Markdown. The trouble: a table-of-contents plugin on my WordPress had inserted collapsible TOCs into the post bodies, so the exported files contained partial HTML and messy formatting.

![Some HTML mixed into the export](/migrated-images/picgo_202205052359006.png)

I had no one-click fix for this problem — just file-by-file, step-by-step cleanup. Deleting some posts, then pasting back from the originals.

In practice **the document properties Gridea can recognize all sit at the top of the exported Markdown**, so the process really is: keep the header, delete the rest, paste the original text.

![Post metadata](/migrated-images/picgo_202205060002883.png)

## Fixing the URLs of Posts Imported into Gridea

Old post URLs may already have been linked from many places, so making these imported posts reachable at their old URLs takes some effort.

The ideal approach would obviously be to use the old URLs directly in Gridea. My WordPress post URLs were set to the form `https://zj1123581321.com/2020-10-12/239/`, but Gridea's default post URL is `https://zj1123581321.com/post/xxx`, where `xxx` is custom content that cannot contain '/'. So that road was blocked.

With that path closed, the natural next thought is [301 redirects](https://ahrefs.com/blog/zh/301-redirects/) (link in Chinese). Unfortunately, 301 redirects must be configured either on the server or at the domain provider. Modifying GitHub's servers is obviously unrealistic, and Alibaba Cloud (the Chinese registrar where my domain lived) offered no URL-forwarding feature either — so this road was blocked too.

After some research, I found a fairly workable approach: use JS code on the 404 page to approximate it — i.e. detect whether the visitor arrived via an old post URL, and use JS to bounce them to the post's current address.

So I set the URLs of posts imported into Gridea to `https://zj1123581321.com/post/2020-10-12239/`, then added a JS snippet in the `Gridea docs path/static/404.html` file to perform the rule-based redirect.

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

Now visiting [https://zj1123581321.com/2020-10-12/239/](https://zj1123581321.com/2020-10-12/239/) hops through the 404 page once, then lands on the new URL.

* * *

Hope this helps. That's all.
