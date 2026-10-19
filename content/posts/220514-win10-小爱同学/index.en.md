---
title: "Replacing Cortana with Xiao Ai on Win10: Binding Win+C to Launch a UWP App"
date: 2022-05-14
draft: true
url: "/en/posts/zen-me-zai-win10-shang-jiang-xiao-nuo-ti-huan-wei-xiao-ai-tong-xue/"
sourceHash: "sha256:5386156bab1d5e2085ed6489484dd9baf4773bebff21ed8b7a5f8d0b63390fec"
translatedBy: "claude-cli/sonnet"
description: "I recently got a Miwu Art keyboard with a voice wake-up key. On Win10, though, it wakes Cortana by default, and as everyone knows, Cortana is basically useless on Win10, so a natural idea came up: how do I replace Cortana with Xiao Ai (Xiaomi's voice assistant)? First, through key detection, I found that the keyboard..."
---
*Translated from the [Chinese original](/posts/zen-me-zai-win10-shang-jiang-xiao-nuo-ti-huan-wei-xiao-ai-tong-xue/).*

I recently got a Miwu Art keyboard, which has a voice wake-up key. On Win10, though, it wakes Cortana by default, and as everyone knows, Cortana is basically useless on Win10. So a natural idea came up: how do I replace the Cortana wake-up with Xiao Ai (Xiaomi's voice assistant)?

First, key detection showed that the keyboard's voice key actually simulates the `Win+C` shortcut to invoke Cortana. So the question became: how do I make `Win+C` wake Xiao Ai instead?

For custom hotkeys I've always used [HotKeyP](https://sourceforge.net/projects/hotkeyp/). I wanted to simply add a command line that opens Xiao Ai, but awkwardly found that Xiao Ai is a UWP app: it has no .exe file and can't be called through a shortcut either.

So the question changed again: how do I wake the UWP version of Xiao Ai from the command line?

[How to open UWP apps from the command line on Windows 10](https://www.addictivetips.com/windows-tips/open-uwp-apps-from-command-line-windows-10/)

After some searching, I found the solution in the document above.

```bash
explorer.exe shell:appsFolder\8497DDF3.639A2791C9AB_kf545nqv09rxe!App
```

But when I tried to add the hotkey in HotKeyP, a new problem appeared:

![No way to directly invoke a command line](/migrated-images/picgo_202205140000046.png)

So the question changed once more: how do I make HotKeyP execute a command line directly?

The approach is also natural: write the command into a `.bat` script, store it on disk, and have HotKeyP call that script.

But when I tried it, a black console window flashed up whenever the `.bat` script ran, which was really annoying. I searched for how to run a `.bat` invisibly.

[全网最详细，bat不弹黑框/不显示控制台方法\_时过境迁一样美的博客-CSDN博客\_如何运行bat文件不弹出黑框](https://blog.csdn.net/qq_28362747/article/details/110472877)

So using a `.vbs` script to execute the `.bat` script avoids the black window.

The final path to replace Cortana with Xiao Ai is now clear:

Use HotKeyP to bind the `Win+C` shortcut to a script that runs a `.vbs` file, and have the `.vbs` script call the `.bat` script without a console to wake the Xiao Ai UWP app.

The one flaw is that launching Xiao Ai from the command line takes about 3 seconds, and I haven't found a fix for that yet.

That's all.
