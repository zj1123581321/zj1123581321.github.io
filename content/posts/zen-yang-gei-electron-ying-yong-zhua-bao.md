---
title: "怎样给 Electron 应用抓包"
date: 2023-10-17
draft: false
description: "今天测试 Memo 的翻译服务，发现经常失败，于是想抓包看看失败原因。 很自然的打开了电脑上的 Fidder，但出乎意料的是完全抓不到 Memo 的任何 Http 请求...(已开启 https 抓包，其他软件测试正常) 搜了一下，发现可能..."
tags:
  - "雕虫小技"
---

今天测试 Memo 的翻译服务，发现经常失败，于是想抓包看看失败原因。

很自然的打开了电脑上的 Fidder，但出乎意料的是完全抓不到 Memo 的任何 Http 请求...(已开启 https 抓包，其他软件测试正常)

搜了一下，发现可能是由于 Electron 的缘故。

于是又参考 [抓包经验总结（一） - 知乎](https://zhuanlan.zhihu.com/p/581675620) 尝试使用 wireshark 来抓包，但无奈 wireshark 里面信息太多了，我光通过 ip 和协议过滤还是有大量请求...遂放弃。

后来搜到了 [Electron应用抓包\_electron 程序 抓包-CSDN博客](https://blog.csdn.net/lemisky/article/details/116724150) 这篇文章。

```
code.exe --args --proxy-server=localhost:8888 --ignore-certificate-errors
```

我拿 Fidder 测试了一下，发现可以抓取到 Memo 检测更新的请求，但是依旧抓取不到翻译的请求。。

接着按照 [Electron抓包体验-CSDN博客](https://blog.csdn.net/qq_37186947/article/details/127680921) 的思路，在 Chrome 里调试 Electron 应用。

```
Memo.exe -remote-debugging-port=9222
```

然后用 Chrome 打开 `chrome://inspect/#devices`

![Console 里有输出，network 里没有](/post-images/image-20231017194523091.png)

尴尬的是，能看到 Console 里输出了翻译的记录，但在 Network 里没有发现任何 http 请求。。

最后用英文搜了一下，最终找到了解决方案。

[Download HTTP Toolkit for Windows](https://httptoolkit.com/download/win-exe/)

![HTTP Toolkit 抓取 Electron 应用](/post-images/image-20231017193005765.png)

免费版本的足够了。
