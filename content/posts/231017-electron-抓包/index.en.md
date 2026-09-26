---
title: "How to Capture Network Traffic from an Electron App"
date: 2023-10-17
draft: false
url: "/en/posts/zen-yang-gei-electron-ying-yong-zhua-bao/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/zen-yang-gei-electron-ying-yong-zhua-bao/). Last synced 2026-09-26.*

Today, while testing Memo's translation service, I found it failing frequently, so I wanted to capture the network traffic to see why.

Naturally, I opened Fiddler on my computer, but to my surprise I couldn't capture a single HTTP request from Memo... (HTTPS capture was already enabled, and other apps tested fine)

I searched around and found that the cause was probably Electron.

So, following [Packet-Capture Lessons Learned (Part 1) - Zhihu](https://zhuanlan.zhihu.com/p/581675620) (Zhihu is China's Quora-like Q&A site), I tried Wireshark, but unfortunately Wireshark simply has too much information — filtering by IP and protocol alone still left a large number of requests... so I gave up on it.

Later I came across this post: [Capturing traffic from Electron apps \_ electron program packet capture - CSDN blog](https://blog.csdn.net/lemisky/article/details/116724150) (CSDN is a Chinese developer-blog platform).

```
code.exe --args --proxy-server=localhost:8888 --ignore-certificate-errors
```

I tested it with Fiddler, and this way I could capture Memo's update-check requests, but I still couldn't capture the translation requests..

Then, following the approach in [My Electron packet-capture experience - CSDN blog](https://blog.csdn.net/qq_37186947/article/details/127680921), I debugged the Electron app from Chrome.

```
Memo.exe -remote-debugging-port=9222
```

Then open `chrome://inspect/#devices` in Chrome

![Output in the Console, nothing in Network](/post-images/image-20231017194523091.png)

The awkward part was that I could see the translation records printed in the Console, but couldn't find any HTTP requests in the Network tab..

In the end I searched in English, and that finally turned up the solution.

[Download HTTP Toolkit for Windows](https://httptoolkit.com/download/win-exe/)

![HTTP Toolkit capturing an Electron app](/post-images/image-20231017193005765.png)

The free version is enough.
