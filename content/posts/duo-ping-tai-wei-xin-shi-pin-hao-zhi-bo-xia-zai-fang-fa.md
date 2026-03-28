---
title: "多平台微信视频号直播下载方法"
date: 2022-05-15
draft: false
description: "昨日晚上在外面吃饭时发现有两个比较感兴趣的老师都在视频号做直播，两边的内容都想听，但无奈只有一台手机，也没办法确定之后是否有回放，遂生下载微信视频号直播随后观看的想法。 下载微信视频号直播大体可以分成三步：  抓包获取视频号直播推流地址 调..."
---

昨日晚上在外面吃饭时发现有两个比较感兴趣的老师都在视频号做直播，两边的内容都想听，但无奈只有一台手机，也没办法确定之后是否有回放，遂生**下载微信视频号直播**随后观看的想法。

下载微信视频号直播大体可以分成三步：

-   抓包获取视频号直播推流地址
-   调用下载器下载，最后生成一个 flv 文件
-   将 flv 转码成 mp4 文件

# 抓包获取视频号推流地址

核心是在各个平台上设置 https 抓包，推流的 URL Host 为 `http://voipfinderliveplay.wxqcloud.qq.com`，按这个地址过滤就可以直接找到可以下载直播视频流的 Url。

## Windows 平台

[Fiddler配合Proxifier抓包PC客户端HTTPS明文数据 - 飘易博客](http://www.piaoyi.org/network/Fiddler-Proxifier-PC-package.html)

在电脑上打开直播的视频号，使用 Fidder 抓包。

![可以用 '@voip' 过滤](http://markdown.lixingzhang.site/picgo/202205152311867.png?imageslim)

## Android

Android 7.0 + 抓包比较麻烦，要么需要 Root 迁入证书，要么使用平行空间等创建一个虚拟环境来抓包。我自身手机是 Root 过的，就直接将 http canary 的证书迁入系统即可。

[安卓11 httpcanary小黄鸟系统证书的安装\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1z54y1W7Wq/)

http canary 安装完毕后，针对微信抓包即可。

## iOS

iOS 上抓包 https 相对来说非常简单，我是使用 Stream 来完成的。

[IOS抓包工具Stream——让移动端的抓包变得轻而易举 - 温一壶清酒 - 博客园](https://www.cnblogs.com/hong-fithing/p/12562448.html)

# 调用下载器下载 flv 文件

原则上在什么设备上拿到了视频号地址，那可以直接在对应的设备上使用下载器下载。

但手机的网络不太稳定，所以我更倾向于统一用电脑下载，在电脑上我使用的下载器是 IDM。

[使用IDM下载直播视频-IDM中文网站](https://www.idmchina.net/use/idm-euds.html#:~:text=%E7%AE%80%E5%8D%95%E6%80%BB%E7%BB%93%EF%BC%8C%E4%BD%BF%E7%94%A8IDM%E4%B8%8B%E8%BD%BD,%E4%BE%BF%E8%83%BD%E6%AD%A3%E5%B8%B8%E6%92%AD%E6%94%BE%E4%BA%86%E3%80%82)

利用 Quicker 的长链接功能实现[手机远程调用电脑上的 IDM](https://getquicker.net/KC/Manual/Doc/connection) 完成下载。

[动动嘴就能下载文件，我用快捷指令 + Quicker 实现远程操作 - 少数派](https://sspai.com/post/70188)

![Quicker 长链接调用 IDM 下载](http://markdown.lixingzhang.site/picgo/202205152324283.png?imageslim)

创建下载任务成功的通知我没有使用 Bark App，而是发送到了企业微信的应用，这样我的多台设备都可以收到通知。

[用 Tasker 实现收到 Android 手机短信自动转发到微信 | Tasker 配置教程站](https://taskerm.com/2018/12/21/wechat)

然后 Android 上通过 FV 悬浮球调用，iOS 上通过捷径调用。

[利用长连接实现手机与电脑的剪贴板文本交换【fooView】【仅限文本】 - Quicker](https://getquicker.net/KC/Kb/Article/928)  
[同步剪贴板 - 动作信息 - Quicker](https://getquicker.net/Sharedaction?code=51cfce12-6aa6-4ad6-a067-08d9ac50b9f2)

# 将 flv 转码为 mp4

想要得到视频号直播的 flv 文件，通常有两种方法：

-   等待视频号直播结束，则下载也会自动结束。
-   提前结束 IDM 的下载，到缓存文件夹找到下载内容，重命名后缀为 `.flv`。

但不论是哪种 flv 文件，用普通的播放器播放时进度条基本失去了作用，这主要是因为：

[如何录制木有弹幕木有水印的直播？ - freejishu的美丽世界](https://www.freejishu.com/%E5%A6%82%E4%BD%95%E5%BD%95%E5%88%B6%E6%9C%A8%E6%9C%89%E5%BC%B9%E5%B9%95%E6%9C%A8%E6%9C%89%E6%B0%B4%E5%8D%B0%E7%9A%84%E7%9B%B4%E6%92%AD%EF%BC%9F/)

> 这个时候，使用大多数播放器就可以播放了，原汁原味的流，味道怎样？
> 
> 不过，我们发现在播放器内快进快退、播放条等和时间有关的功能失去了作用。原因很简单，就是这种flv流的时间帧数据并不是从0分0秒000开始的（你总不可能主播一开播你就开始录制，而且直播平台大概率会吃掉前1-2秒的流）。我们还需要做一些处理。
> 
> #### 6、处理录制文件
> 
> MediaCoder这个时候就要排上用场了。MediaCoder不仅支持CUDA编码加速，而且可以复制流，乃处理这种flv的神器了。
> 
> 我们把待处理的flv拖进去，找到下面视频选项卡，勾中“复制视频流”，再找到音频选项卡，选择“复制音频流”。其他设定随意，别忘了改一改保存地址，然后Start就可以了。

可以用 Mediacoder 处理，或者是小丸工具箱。

**20240116 更新**：  
目前抖音、视频号等平台的直播流已经有部分是 hevc 格式，而非原始的 h264 格式。而上述的所有工具都无法将 hevc 格式的 flv 转换为 mp4 视频。

但这种 flv 又可以通过 potplayer 进行解码播放。

这里的原因在于 ffmpeg 目前对 flv 的支持编码里不含 hevc，所以这些利用 ffmpeg 进行视频转换的工具都会报错：编码错误。

那有什么解决办法？

[zymill/flvAnalyser: FLV v1.0 analyser](https://github.com/zymill/flvAnalyser)  
这款工具可以完美解决 flv+h265 的转换问题，开发者是这块的专家。软件自带一键 flv 转换 mp4 功能：）

如果你需要将视频转成文字版快速浏览，可以省去转码这一步，直接上传 flv 文件到飞书妙记，照样可以识别文字、音视频也可以正常播放。

[年度征文 | 节时提效，用飞书妙记提升学习体验 - 少数派](https://sspai.com/post/70960)

* * *

以上。
