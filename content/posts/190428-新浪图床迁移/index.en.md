---
title: "Image Hosting and Migration: Written After the Sina Weibo Image Host Went Down"
date: 2019-04-28
draft: false
url: "/en/posts/2019-04-28154/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/2019-04-28154/). Last synced 2026-09-26.*

The Sina Weibo (China's Twitter-like social platform) image host has recently been gradually rolling out hotlink protection, which has left images broken on many blogs that once depended on the Sina Weibo image host.

This post summarizes some experience with migrating image hosts and re-choosing tools. I hope it helps you.

## 1. Migration

### 1.1 [One-click migration to Alibaba Cloud OSS](https://www.qikqiak.com/post/sina-img-transfer-to-oss/)

### 1.2 [Replacing links in the database](https://www.zrahh.com/archives/461.html)

### 1.3 [Bulk-saving Weibo image-host images to a server (WordPress)](https://qq52o.me/2674.html)

### 1.4 [Bulk-saving Weibo image-host images to local storage](https://www.hostloc.com/thread-542203-1-1.html?d=1)

[Video tutorial](https://www.lanzous.com/i3wxq2b) (in Chinese)

### 1.5 [Non-migration workarounds I've collected (still working for now)](https://51.ruyo.net/12432.html)

-   Change the domain
-   Change the referrer
-   Switch to http
-   Embed via iframe
-   Third-party reverse proxy

## 2. Choosing an Image-Host Tool on Windows

### 2.1 [Mpic](http://mpic.lzhaofu.cn/)

![The magic image-uploading tool](/migrated-images/markdown_20190428_dRG9gEGcd17d.png)

Probably the best image-host tool on the Windows platform. It has the following strengths.

-   Multiple link formats to choose from
-   Auto-upload on screenshot/image copy
-   Link copied to the clipboard automatically
-   Automatic image slimming
-   ...

The downside is that it only supports Qiniu Cloud.

### 2.2 [PicGo](https://molunerfinn.com/PicGo/)

A newcomer of an image-host tool that works across Windows, Mac, and Linux. It supports the Weibo image host, Qiniu, Tencent Cloud COS v4/v5, Upyun, GitHub, SM.MS, Alibaba Cloud OSS, and Imgur.

![PicGo](/migrated-images/markdown_20190428_hfsWSDIUgsDJ.png)

It also supports [plugins](https://github.com/PicGo/Awesome-PicGo).

For the [official usage guide](https://picgo.github.io/PicGo-Doc/zh/guide/#%E5%BA%94%E7%94%A8%E8%AF%B4%E6%98%8E) (in Chinese) and more introduction to PicGo, you can look [here](https://sspai.com/post/52527).

## 3. Choosing an Image-Host Tool on Mac

### 3.1 [iPic](https://itunes.apple.com/cn/app/ipic-markdown-%E5%9B%BE%E5%BA%8A-%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E5%B7%A5%E5%85%B7/id1101244278?mt=12)

The magic image-uploading tool on Mac. It currently supports Weibo (the default host), [Qiniu Cloud](https://toolinbox.net/iPic/AddQiniuImageHost.html), [Upyun](https://toolinbox.net/iPic/AddUpYunImageHost.html), [Alibaba Cloud OSS](https://toolinbox.net/iPic/AddAliOSS.html), [Tencent Cloud COS](https://toolinbox.net/iPic/AddTencentCOS.html), [Imgur](https://imgur.com/), [Flickr](https://www.flickr.com/), and [Amazon S3](https://toolinbox.net/iPic/AddS3.html).

It supports upload-on-copy, manual upload, and drag-and-drop upload.

The author's development [journey](https://sspai.com/post/39965), and more [introduction](https://sspai.com/post/34756).

There is also [iPic Mover](https://itunes.apple.com/cn/app/ipic-mover/id1183822957?mt=12), which can **upload the images in a Markdown file (whether local or web images) to a new image host via iPic, and rewrite the image URLs in the Markdown**.

### 3.2 [PicGo](https://molunerfinn.com/PicGo/)

See above.

## 4. Choosing an Image-Host Tool on Chrome

### 4.1 [Qiniu Online Image Saver](https://chrome.google.com/webstore/detail/%E4%B8%83%E7%89%9B%E5%9C%A8%E7%BA%BF%E5%AD%98%E5%9B%BE/ojgilmgaopbpimndoelnhacamaabdpni)

![Weibo image host](/migrated-images/markdown_20190428_1hzGTe7tH7O2.png)

Ever since the Sina image host went down, it has been hard to find a Chrome extension as capable as the [Weibo Image Host](https://chrome.google.com/webstore/detail/%E5%BE%AE%E5%8D%9A%E5%9B%BE%E5%BA%8A/pinjkilghdfhnkibhcangnpmcpdpmehk?utm_source=chrome-ntp-icon) one. For me, a must-have feature of a Chrome image-host extension is uploading a web image directly to my host; I found the "Qiniu Online Image Saver" extension as a barely adequate replacement. However, it only supports Qiniu Cloud, the generated links can't be copied to the clipboard directly, and it can't upload GIFs directly... it will have to do for now.

## 5. Choosing an Image Host

You can refer to this [article](https://sspai.com/post/40499) (in Chinese).

Friends thinking of choosing Qiniu Cloud, please note: Qiniu requires you to have a domain with ICP filing (Chinese domains served from the mainland must complete the government beian registration, and purchasing and filing a domain usually takes two weeks or more) — weigh your own situation before deciding whether Qiniu Cloud is right for you.

## Reference

1.  [Cat Ya Blog: A tutorial for fixing broken images after Sina added hotlink protection](http://www.maoyabk.cn/1152.html)

2.  [Image hosts, image migration, and wheels](https://lanee.blog.fc2.com/blog-entry-350.html)

3.  [Notes on image-host migration](http://leohope.com/%E5%86%99%E9%9A%8F%E7%AC%94/2018/10/19/image-migration/)

4.  [typora + iPic: conveniently uploading images to a server](https://lushuaiyu.com/2019/01/01/typora-iPic-%E6%96%B9%E4%BE%BF%E7%9A%84%E4%B8%8A%E4%BC%A0%E5%9B%BE%E7%89%87%E5%88%B0%E6%9C%8D%E5%8A%A1%E5%99%A8\(for%20mac\)/)
