---
title: "Choosing and Migrating Image Hosts after Sina Weibo's Hotlink Protection"
date: 2019-04-28
draft: false
url: "/en/posts/2019-04-28154/"
sourceHash: "sha256:b839e5795276239603db22cb6c629ffbf0b385de88838d8b1f32ea47da2059c4"
translatedBy: "claude-cli/sonnet"
description: "Sina Weibo's image-hosting service recently began rolling out hotlink protection, so many blog images that relied on it can no longer be displayed. This article shares lessons from migrating image hosts and choosing new tools. I hope it helps. 1 Migration 1.1 One-click migration to Alibaba Cloud OSS 1.2 Replacing links in the database 1.3 Batch..."
---
*Translated from the [Chinese original](/posts/2019-04-28154/).*

Sina Weibo's image-hosting service recently began rolling out hotlink protection, so many blog images that relied on it can no longer be displayed.

This article shares some lessons from migrating image hosts and choosing new tools. I hope it helps.

## 1 Migration

### 1.1 [One-click migration to Alibaba Cloud OSS](https://www.qikqiak.com/post/sina-img-transfer-to-oss/)

### 1.2 [Replacing links in the database](https://www.zrahh.com/archives/461.html)

### 1.3 [Batch-saving Weibo-hosted images to your server (WordPress)](https://qq52o.me/2674.html)

### 1.4 [Batch-saving Weibo-hosted images to your computer](https://www.hostloc.com/thread-542203-1-1.html?d=1)

[Video tutorial](https://www.lanzous.com/i3wxq2b)

### 1.5 [Some non-migration workarounds (still working for now)](https://51.ruyo.net/12432.html)

-   Change the domain name
-   Modify the referrer
-   Switch to http
-   Embed an iframe
-   Use a third-party reverse proxy

## 2 Choosing Image-Hosting Tools for Windows

### 2.1 [Mpic](http://mpic.lzhaofu.cn/)

![Mpic image-hosting app](/migrated-images/markdown_20190428_dRG9gEGcd17d.png)

For Windows, this is probably the best image-hosting app. Its advantages include:

-   Multiple link formats to choose from
-   Automatic upload for screenshots/copied images
-   Links automatically copied to the clipboard
-   Automatic image compression
-   ...

The downside is that it only supports Qiniu Cloud.

### 2.2 [PicGo](https://molunerfinn.com/PicGo/)

A newer cross-platform image-hosting app for Windows, Mac, and Linux. It supports Weibo, Qiniu Cloud, Tencent Cloud COS v4/v5, Upyun, GitHub, SM.MS, Alibaba Cloud OSS, and Imgur.

![PicGo](/migrated-images/markdown_20190428_hfsWSDIUgsDJ.png)

It also supports [plugins](https://github.com/PicGo/Awesome-PicGo).

[Official usage guide](https://picgo.github.io/PicGo-Doc/zh/guide/#%E5%BA%94%E7%94%A8%E8%AF%B4%E6%98%8E). For more about PicGo, you can look [here](https://sspai.com/post/52527).

## 3 Choosing Image-Hosting Tools for Mac

### 3.1 [iPic](https://itunes.apple.com/cn/app/ipic-markdown-%E5%9B%BE%E5%BA%8A-%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E5%B7%A5%E5%85%B7/id1101244278?mt=12)

A great image-hosting app for Mac. It currently supports Weibo (its default host), [Qiniu Cloud](https://toolinbox.net/iPic/AddQiniuImageHost.html), [Upyun](https://toolinbox.net/iPic/AddUpYunImageHost.html), [Alibaba Cloud OSS](https://toolinbox.net/iPic/AddAliOSS.html), [Tencent Cloud COS](https://toolinbox.net/iPic/AddTencentCOS.html), [Imgur](https://imgur.com/), [Flickr](https://www.flickr.com/), and [Amazon S3](https://toolinbox.net/iPic/AddS3.html).

It supports uploading images from the clipboard, manual uploads, and drag-and-drop uploads.

Read the developer's [story](https://sspai.com/post/39965) and a more detailed [introduction](https://sspai.com/post/34756).

There is also [iPic Mover](https://itunes.apple.com/cn/app/ipic-mover/id1183822957?mt=12), which can **upload images in a Markdown file (local or online) to a new image-hosting service via iPic, then replace their URLs in the Markdown**.

### 3.2 [PicGo](https://molunerfinn.com/PicGo/)

See above.

## 4 Choosing Image-Hosting Tools for Chrome

### 4.1 [Qiniu Online Image Storage](https://chrome.google.com/webstore/detail/%E4%B8%83%E7%89%9B%E5%9C%A8%E7%BA%BF%E5%AD%98%E5%9B%BE/ojgilmgaopbpimndoelnhacamaabdpni)

![Weibo image-hosting extension](/migrated-images/markdown_20190428_1hzGTe7tH7O2.png)

Since the Sina image-hosting service stopped working, it has been hard to find a Chrome extension as powerful as [Weibo Image Host](https://chrome.google.com/webstore/detail/%E5%BE%AE%E5%8D%9A%E5%9B%BE%E5%BA%8A/pinjkilghdfhnkibhcangnpmcpdpmehk?utm_source=chrome-ntp-icon). For me, a must-have feature in a Chrome image-hosting extension is uploading images directly from web pages. I found "Qiniu Online Image Storage" as a barely adequate replacement. It only supports Qiniu Cloud, its generated links cannot be copied straight to the clipboard, and it cannot upload GIFs directly... I'll have to make do.

## 5 Choosing an Image-Hosting Service

You can refer to this [article](https://sspai.com/post/40499).

If you're considering Qiniu Cloud, note that it requires you to have a domain name with an ICP filing (buying a domain and getting it filed usually takes more than two weeks). Decide whether Qiniu Cloud suits you based on your own situation.

## Reference

1.  [Maoya Blog: A tutorial on fixing images broken by Sina's hotlink protection](http://www.maoyabk.cn/1152.html)
    
2.  [Image-hosting services and image migration tools](https://lanee.blog.fc2.com/blog-entry-350.html)
    
3.  [Image-hosting service migration notes](http://leohope.com/%E5%86%99%E9%9A%8F%E7%AC%94/2018/10/19/image-migration/)
    
4.  [typora + iPic: conveniently uploading images to a server](https://lushuaiyu.com/2019/01/01/typora-iPic-%E6%96%B9%E4%BE%BF%E7%9A%84%E4%B8%8A%E4%BC%A0%E5%9B%BE%E7%89%87%E5%88%B0%E6%9C%8D%E5%8A%A1%E5%99%A8\(for%20mac\)/)
