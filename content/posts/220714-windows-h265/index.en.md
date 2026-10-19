---
title: "Finding H.265 Videos in a Mixed Folder on Windows 10"
date: 2022-07-14
draft: true
url: "/en/posts/windows-wen-jian-guan-li-qi-he-h265/"
sourceHash: "sha256:c667556a3a58febdbd0126bae29664bcd93d7b9f2c3c611ddd29cdaa6cb6a840"
translatedBy: "claude-cli/sonnet"
description: "A long time ago, the H265-related problem I ran into on Win10 was thumbnails not showing, and the fix is fairly well established: just install the Download K-Lite Codec Pack. Recently, for work, I used \"Yao Ni Ming San Qian\" to download a lot of watermark-free videos from Douyin/Kuaishou, some of which were..."
---
*Translated from the [Chinese original](/posts/windows-wen-jian-guan-li-qi-he-h265/).*

A long time ago, the H265-related problem I ran into on Win10 was thumbnails not showing. The fix is fairly well established online: just install [Download K-Lite Codec Pack](https://codecguide.com/download_kl.htm).

Recently, for work, I used "Yao Ni Ming San Qian" to download a lot of watermark-free videos from Douyin/Kuaishou. Some of them are H264-encoded and the rest are H265-encoded, and previewing them in the Win10 File Explorer is no problem.  
But of all the bad luck, I needed to drag them all into Eagle for management, and Eagle can currently only collect H265 files, but cannot preview or play them ==...  
So I needed to convert the H265 videos to H264. The conversion itself isn't complicated; [HandBrake: Open Source Video Transcoder](https://handbrake.fr/) does the job.  
The problem is: how do you find the H265 videos in a folder that mixes H264 and H265 files? Otherwise, once the number of videos grows, converting the H264 ones is just wasted time.

[Finding which videos in a directory of various videos are H.265? - Page 2 - Windows 10 Forums](https://www.tenforums.com/general-support/125903-finding-videos-directory-various-videos-h-265-a-2.html)  
I did find a similar question in an English-language search, but unfortunately it had no answer at the time.

After several attempts, I did find a solution in the end:

1.  Install [Icaros 3.3.0 Beta 3](https://shark007.net/forum/Thread-New-Release-3-3-0-Beta-3)
2.  In File Explorer, check the "Video tracks" column  
    ![Snipaste_2022-07-14_00-08-21](/migrated-images/picgo_202207140040942.png)

That's it.

# References

[Eagle 支持哪些文件格式呢？ - 知识库 | Eagle](https://docs-cn.eagle.cool/article/18-what-file-formats-does-eagle-support)
