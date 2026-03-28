---
title: "Windows 文件管理器和 H265"
date: 2022-07-14
draft: false
description: "很早之前在 Win10 遇到的和 H265 相关的问题是不显示缩略图，解决方法往上比较成熟，安装Download K-Lite Codec Pack 即可。 最近业务需要，通过『要你命三千』从抖音/快手上下载了很多无水印的视频，其中一部分是..."
---

很早之前在 Win10 遇到的和 H265 相关的问题是不显示缩略图，解决方法往上比较成熟，安装[Download K-Lite Codec Pack](https://codecguide.com/download_kl.htm) 即可。

最近业务需要，通过『要你命三千』从抖音/快手上下载了很多无水印的视频，其中一部分是 H264 编码，另一部分则是 H265 编码，在 Win10 文件管理器中预览不成问题。  
但好死不死的，我需要把它们统一拖进 Eagle 进行管理，Eagle 目前只能支持 H265 的收藏，但是不支持 Eagle 预览播放==...  
所以我需要把 H265 的视频转换成 H264，转换倒也不复杂，使用 [HandBrake: Open Source Video Transcoder](https://handbrake.fr/) 就行。  
但问题是，怎么从 H264 和 H265 混合的视频文件夹里找出 H265 的视频文件呢？不然视频数量一多，H264 相当于白白浪费转换时间。

[Finding which videos in a directory of various videos are H.265? - Page 2 - Windows 10 Forums](https://www.tenforums.com/general-support/125903-finding-videos-directory-various-videos-h-265-a-2.html)  
英文搜索倒是找到了相似的问题，可惜当时没有解答。

几经尝试，最后还真找出了解决方案：

1.  安装 [Icaros 3.3.0 Beta 3](https://shark007.net/forum/Thread-New-Release-3-3-0-Beta-3)
2.  在文件管理器中勾选『Video tracks』列  
    ![Snipaste_2022-07-14_00-08-21](http://markdown.lixingzhang.site/picgo/202207140040942.png?imageslim)

以上。

# 参考文档

[Eagle 支持哪些文件格式呢？ - 知识库 | Eagle](https://docs-cn.eagle.cool/article/18-what-file-formats-does-eagle-support)
