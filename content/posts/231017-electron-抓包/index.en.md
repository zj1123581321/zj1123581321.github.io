---
title: "Capturing Traffic from an Electron App: Fiddler Couldn't See It, HTTP Toolkit Could"
date: 2023-10-17
draft: false
url: "/en/posts/zen-yang-gei-electron-ying-yong-zhua-bao/"
sourceHash: "sha256:d4ab4fba86c572718acb7f743d264fc0a314ee87fab8128e808dda160270a0d5"
translatedBy: "claude-cli/sonnet"
description: "Today I was testing Memo's translation service and found that it kept failing, so I wanted to capture the traffic to see why. I naturally opened Fiddler on my computer, but, unexpectedly, I couldn't capture any HTTP requests from Memo at all... (HTTPS capture was enabled, and other software tested fine.) I searched around and found that it might be because of Electron..."
---
*Translated from the [Chinese original](/posts/zen-yang-gei-electron-ying-yong-zhua-bao/).*

Today I was testing Memo's translation service and found that it kept failing, so I wanted to capture the traffic to see why.

I naturally opened Fiddler on my computer, but, unexpectedly, I couldn't capture any HTTP requests from Memo at all... (HTTPS capture was enabled, and other software tested fine.)

I searched around and found that it might be because of Electron.

So, following [Packet Capture Tips (1) - Zhihu](https://zhuanlan.zhihu.com/p/581675620), I tried capturing with Wireshark. Unfortunately, Wireshark showed far too much information, and even after filtering by IP and protocol there were still a huge number of requests... so I gave up.

Later I found the article [Capturing Traffic from an Electron App - CSDN Blog](https://blog.csdn.net/lemisky/article/details/116724150).

```
code.exe --args --proxy-server=localhost:8888 --ignore-certificate-errors
```

I tested it with Fiddler and found that I could capture Memo's update-check request, but still couldn't capture the translation request...

Next, following the approach in [Capturing Traffic from an Electron App - CSDN Blog](https://blog.csdn.net/qq_37186947/article/details/127680921), I debugged the Electron app in Chrome.

```
Memo.exe -remote-debugging-port=9222
```

Then I opened `chrome://inspect/#devices` in Chrome.

![Output appears in the Console, but not in the Network tab](/post-images/image-20231017194523091.png)

Awkwardly, I could see the translation records logged in the Console, but I couldn't find any HTTP requests in the Network tab...

Finally, I searched in English and ended up finding a solution.

[Download HTTP Toolkit for Windows](https://httptoolkit.com/download/win-exe/)

![HTTP Toolkit capturing an Electron app](/post-images/image-20231017193005765.png)

The free version is enough.
