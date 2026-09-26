---
title: "Windows File Explorer and H.265"
date: 2022-07-14
draft: false
url: "/en/posts/windows-wen-jian-guan-li-qi-he-h265/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/windows-wen-jian-guan-li-qi-he-h265/). Last synced 2026-09-26.*

A long time ago on Windows 10 I ran into an H.265-related problem: thumbnails wouldn't show. The fix is well documented online — just install the [K-Lite Codec Pack](https://codecguide.com/download_kl.htm).

Recently, for work, I used "Yao Ni Ming San Qian" (要你命三千, "Ultimate Weapon 3000" — a downloader tool named after the gadget in a classic Stephen Chow comedy) to grab a large batch of watermark-free videos from Douyin and Kuaishou (China's TikTok-like short-video platforms). Some of them were H.264-encoded, the rest H.265-encoded, and previewing them in the Windows 10 File Explorer was no problem.
But then, as luck would have it, I needed to drag them all into Eagle (an image and video asset manager) for organization. Eagle currently supports saving H.265 files, but doesn't support preview playback for them ==...
So I needed to convert the H.265 videos to H.264. The conversion itself isn't complicated — [HandBrake: Open Source Video Transcoder](https://handbrake.fr/) does the job.
The problem, though: how do I pick out the H.265 video files from a folder of videos mixed between H.264 and H.265? Otherwise, once there are enough videos, converting the H.264 ones wastes conversion time for nothing.

[Finding which videos in a directory of various videos are H.265? - Page 2 - Windows 10 Forums](https://www.tenforums.com/general-support/125903-finding-videos-directory-various-videos-h-265-a-2.html)
An English search did turn up the same question, but alas it had no answer at the time.

After several attempts, a solution did finally turn up:

1.  Install [Icaros 3.3.0 Beta 3](https://shark007.net/forum/Thread-New-Release-3-3-0-Beta-3)
2.  Enable the "Video tracks" column in File Explorer
    ![Snipaste_2022-07-14_00-08-21](/migrated-images/picgo_202207140040942.png)

That's all.

# References

[Which file formats does Eagle support? - Knowledge Base | Eagle](https://docs-cn.eagle.cool/article/18-what-file-formats-does-eagle-support)
