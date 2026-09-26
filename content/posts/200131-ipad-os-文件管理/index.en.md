---
title: "Getting Started with iPadOS File Management"
date: 2020-01-31
draft: false
url: "/en/posts/2020-01-31220/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/2020-01-31220/). Last synced 2026-09-26.*

# Getting Started with iPadOS File Management

> Note: iOS and iPadOS are used interchangeably below.

This post is mainly for people who frequently need to **transfer/sync** files between a computer and an iPhone/iPad — Windows users first and foremost, though Mac users will also find it useful.

Before buying an iPad, what always gave me headaches was iOS's file-management capability. But after getting the device and tinkering for a while, I found the problem can in fact be handled fairly well through various means.

In nearly a year of using an iPad, aside from charging I have rarely touched a data cable — almost everything goes over the air.

Wireless transfer boils down to two approaches: third-party cloud drives, or a direct connection between computer and tablet. Each has its strengths and weaknesses; below I'll share some of my experience and the pits I've stepped in.

Every method in this post pursues just two words — **convenience**. Share a file out on iOS, and the computer receives it automatically, no downloading needed.

## Third-Party Cloud Drives

### [OneDrive](https://onedrive.live.com/about/zh-cn/)

![OneDrive web client](/migrated-images/markdown_20200131_8adjxpApz97c.png)

1 Full-platform client support: Windows, Mac, iOS, Android, and the web.

2 Under Windows 10, files in the OneDrive folder can be set to automatic sync and on-demand sync — quite convenient.

![OneDrive on-demand sync](/migrated-images/markdown_20200131_JQ1A2TOo5XSI.png)

3 The personal edition comes with 5 GB of space (ample if you only use it to sync files); Office 365 editions come with 1 TB. Some Chinese universities let you register for Office 365 Education with a school email address, which also carries 1 TB of OneDrive — application link below.

![Office edition comparison](/migrated-images/markdown_20200131_dcBHU7pQU5xO.png)

4 OneDrive supports many third-party integrations, but note: if your OneDrive Education edition was registered with a mainland-Chinese school email (ending in .edu.cn), **it may fail to connect properly in certain third-party apps (nPlayer, PDF Expert, Documents, Notability, for example)**. It works normally in Microsoft's own apps.

![nPlayer showing an error](/migrated-images/markdown_20200131_yP4H3vebTuaz.png)

5 The OneDrive personal-edition web client is unreachable from mainland China without a proxy; the desktop client does connect, though different OneDrive versions on different Chinese ISP networks can show inexplicable speeds. Possible solutions at the link below.

6 If your C: drive is short on space, consider moving the OneDrive folder's storage location to another drive — tutorial below.

#### More

[Office 365 Education sign-up](https://signup.microsoft.com/signup?sku=Education)

[How to change the OneDrive folder's storage location (path)](https://www.windows10.pro/onedrive-folder-change-location/)

[Syncing files with the OneDrive sync client on Windows](http://dwz.date/mYS)

[Setting OneDrive to auto-sync any folder](https://www.jianshu.com/p/e256f808e676)

[Why OneDrive transfers are slow — causes and analysis](https://www.mr-technos.com/thread-3334-1-1.html)

### [Nutstore (Jianguoyun)](https://www.jianguoyun.com/)

![My Nutstore](/migrated-images/markdown_20200131_7q6hIIOkCW1f.png)

I've used Nutstore (Jianguoyun, a Chinese sync-first cloud drive) for three years; it's my main cloud drive day to day. Sync of any folder, incremental sync, collaborative sharing... plenty of features to earn Nutstore its reputation as "the best sync-drive platform in China" (Nutstore, if you're reading this, please contact me for payment — thanks).

1 The best multi-platform sync client in China: it supports syncing **any folder** on your computer, which is extremely convenient. On top of that: incremental sync, WebDAV, permission-based sharing, and many other thoughtful features.

2 The free tier gets **1 GB** of upload traffic and 3 GB of download traffic per month; space is bounded by the upload traffic. Paid tiers lift the traffic cap, with 30 GB of space (Pro plan, ¥199/year — about $28).

3 One of the few Chinese cloud drives that supports [WebDAV](http://dwz.date/mYY). Click the link for a detailed introduction; in plain terms, WebDAV lets the drive's storage be **shared with third-party apps** (as long as the app supports the WebDAV protocol), so the app can conveniently enjoy file sync, sharing, and other functions.

Common iPad apps that support WebDAV: Notability (handy for note export and backup), PDF Expert (two-way file sync with the computer), nPlayer (plays videos straight off the drive), WPS (opens drive files quickly), Documents (a powerful file-management app).

[More ways to pair Nutstore with WebDAV](http://help.jianguoyun.com/?s=webdav)

### iCloud

![iCloud in the Windows 10 Store](/migrated-images/markdown_20200131_YgxsKcLizq1l.png)

If you're a Mac user, no contest — iCloud + AirDrop should be the most convenient choice. But Windows users can also try iCloud for file sync.

1.  The free tier is 5 GB; I strongly recommend paying for the 50 GB plan (¥8/month — about $1) for **data backups** of the many iOS apps. An iPad can be replaced; your data can't.

2.  [iCloud for Windows 10](https://support.apple.com/zh-cn/HT204283) supports automatic sync of files under the iCloud folder. But installing iCloud on Windows 10 can interfere with OneDrive or other programs — if your computer starts showing small, never-before-seen bugs after you install iCloud, try uninstalling iCloud. Already reported to Microsoft; no idea where that stands now.

3.  The cloud drive that works best with iPadOS (Apple's own child, after all) — most apps that support any cloud drive support iCloud (sometimes it's the only one supported).

4.  Likewise, if your C: drive is short on space, consider moving the iCloud folder's storage location to another drive.

    One more note: for Notability versions before 9.2 (inclusive), avoid iCloud auto-backup — a bug could cause notes to be routinely wiped and then re-downloaded from the cloud, which sometimes seriously gets in the way. No word on when a later version will fix it.

## Direct Computer–Tablet Connections

Both approaches below require a **LAN** (home Wi-Fi, campus network, or office network) to work — somewhat limiting, but they win big on speed. Beginners shouldn't go apply for a public IP to tinker with this; the risk isn't worth it.

### FTP + Documents + FileZilla

FTP is a file-transfer protocol supported by many apps on iOS, Android, and desktop.

Documents is an iOS file manager that supports the FTP protocol; FileZilla is software that turns a Windows 10 PC into an FTP server (more convenient and more complete than the FTP built into Windows 10).

[Tutorial: setting up an FTP server with FileZilla on Windows 10 over a LAN](https://blog.csdn.net/wwyy2018/article/details/98188689)

Once FileZilla is installed on Windows 10, you can pick any number of folders to serve as sync folders.

A few uses of FTP on iPadOS:

**1 PDF Expert auto-syncs the files in a folder**

Besides the WebDAV protocol, PDF Expert also supports FTP, which enables two-way sync of any computer folder — edit a file on the computer and the file updates automatically in PDF Expert, and vice versa.

![Adding FTP to PDF Expert](/migrated-images/markdown_20200131_1yBBH9k251B0.gif)

![PDF Expert synced folders](/migrated-images/markdown_20200131_8lHsoJsIgPso.gif)

If you're on a LAN most of the time anyway, this is a very convenient way to **sync/backup** your material.

**2 nPlayer plays videos on the computer**

Videos downloaded on the computer play smoothly right on the iPad. nPlayer also has an Android client.

![Protocols nPlayer supports](/migrated-images/markdown_20200131_2l2vzjEvSf8b.jpg)

**3 Documents moves large files**

Documents and PDF Expert come from the same developer, so Documents also supports WebDAV and FTP. A file of several hundred megabytes takes about a dozen seconds.

The one inconvenience: files have to be placed inside Documents first before they can go over FTP. Who knows when iPadOS's Files will natively support the FTP protocol.

### SMB + the Files app

![iPad connecting to a server](/migrated-images/markdown_20200131_UmsnO69d3UGL.gif)

After updating to iOS 13 or iPadOS, the built-in Files app has a "Connect to Server" option. Windows can transfer files with iOS quickly over the SMB protocol.

[Tutorial: setting up an SMB connection from iOS on Windows 10](https://zhuanlan.zhihu.com/p/83983289)

1.  Native support inside "Files" — probably the most convenient and fastest file-transfer option over a LAN.

2.  Complex, large LANs such as campus networks can produce inexplicable problems.

3.  Even after a successful first connection, a later reconfiguration may hit the mysterious problem of the share not showing up in the sidebar.

4.  You can likewise use nPlayer to play videos over the LAN, and PDF Expert to sync files.

## A Few More Words

### Make good use of iPadOS's built-in Files app

OneDrive, Nutstore, iCloud, and the SMB protocol can all be integrated into the system's "Files" app — very convenient to use.

![iPadOS's built-in Files](/migrated-images/markdown_20200131_W4iez5G9gmC1.png)

### What about other cloud drives?

Google Drive and Dropbox are also perfectly convenient once you've solved the network problem, but given the network conditions most readers in China face, no recommendation here.

I don't recommend Baidu Netdisk (Baidu's consumer cloud drive): first, throttled speeds; second, an overly closed ecosystem — it can't work together with third-party apps, can't sync directly, and serves only as a file way-station.

### Closing

If you're an iPad + Mac user, iCloud is the best cloud-drive choice; if you're an iPad + Windows user, OneDrive and Nutstore make good primary drives.

Used well, cloud drives also cut down on the space taken up on the iPad itself — my 32 GB iPad still has 7 GB free to this day.

And if you're often on a LAN, consider trying the FTP and SMB protocols.

One last, tangential remark: back up your iPad's data. A lost iPad can be bought again; lost data is truly gone.

This post was first published on my WeChat Official Account [杂谈by立行 (Zatan by Lixing)](https://mp.weixin.qq.com/s/Ob5UYCR1qnBbYA7wX8wz7w) (ztbylx).
