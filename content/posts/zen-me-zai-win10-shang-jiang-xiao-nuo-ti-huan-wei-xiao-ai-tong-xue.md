---
title: "怎么在 Win10 上将小娜替换为小爱同学？"
date: 2022-05-14
draft: false
description: "最近入手了一台米物 Art 键盘，上面有一个语音唤醒键。但是在 Win10 上，它默认唤醒的是小娜(Cortana)，众所周知小娜在 Win10 上基本没用，所以自然产生一个想法：怎么把唤醒的小娜替换为小爱同学？ 首先通过键位监测发现，键盘..."
---

最近入手了一台米物 Art 键盘，上面有一个语音唤醒键。但是在 Win10 上，它默认唤醒的是小娜(Cortana)，众所周知小娜在 Win10 上基本没用，所以自然产生一个想法：怎么把唤醒的小娜替换为小爱同学？

首先通过键位监测发现，键盘的语音键实际上是模拟了 `Win+C` 的命令实现调用小娜，那问题就转变成：如何使 `Win+C` 唤醒的是小爱同学？

自定义快捷键的应用我一直使用的是 [HotKeyP](https://sourceforge.net/projects/hotkeyp/)，本来想直接添加一个命令行打开小爱同学的命令，但尴尬地发现小爱同学是 UWP 应用，没有 .exe 的文件，也没办法通过快捷方式调用。

所以问题又转换成了：如何通过命令行唤醒 UWP 的小爱同学？

[How to open UWP apps from the command line on Windows 10](https://www.addictivetips.com/windows-tips/open-uwp-apps-from-command-line-windows-10/)

搜寻一番，通过上述文档找到了解决办法。

```bash
explorer.exe shell:appsFolder\8497DDF3.639A2791C9AB_kf545nqv09rxe!App
```

但往 HotKeyP 中添加热键的时候又出现了新的问题：

![没找到直接调用命令行的方法](/migrated-images/picgo_202205140000046.png)

问题又转变成：如何使 HotKeyP 可以直接执行命令行？

方法也很自然，将命令写成 `.bat` 脚本存放在磁盘里，用 HotKeyP 调用此脚本。

但实验起来发现执行 `.bat` 脚本时会有一个黑色的控制台闪过，非常不爽。搜了一下怎样让 `.bat` 隐身运行。

[全网最详细，bat不弹黑框/不显示控制台方法\_时过境迁一样美的博客-CSDN博客\_如何运行bat文件不弹出黑框](https://blog.csdn.net/qq_28362747/article/details/110472877)

所以再使用 `.vbs` 命令执行 `.bat` 脚本就可以避免黑框。

所以最终用小爱同学替换小娜的路径就明确了：

用 HotKeyP 给 `Win+C` 快捷键绑定上执行 `.vbs` 命令的脚本，`.vbs` 脚本无控制台调用 `.bat` 脚本唤醒小爱同学 UWP 应用。

美中不足的是用命令行调用小爱同学大概需要等待 3s，这个暂时没有找到解决办法。

以上。
