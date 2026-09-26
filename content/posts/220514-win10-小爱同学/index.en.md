---
title: "How to Replace Cortana with Xiaomi's Xiao Ai on Windows 10"
date: 2022-05-14
draft: false
url: "/en/posts/zen-me-zai-win10-shang-jiang-xiao-nuo-ti-huan-wei-xiao-ai-tong-xue/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/zen-me-zai-win10-shang-jiang-xiao-nuo-ti-huan-wei-xiao-ai-tong-xue/). Last synced 2026-09-26.*

I recently got a MiiiW Art keyboard (MiiiW is a Xiaomi-ecosystem accessories brand), which has a voice-assistant wake key. On Win10, though, it wakes Cortana by default, and Cortana is famously next to useless on Win10 — which naturally raises the question: how do I replace the Cortana that gets woken with Xiao Ai (Xiaomi's voice assistant)?

First, key-event monitoring revealed that the keyboard's voice key actually invokes Cortana by simulating the `Win+C` command. So the problem becomes: how do I make `Win+C` wake Xiao Ai instead?

For custom shortcuts I've always used [HotKeyP](https://sourceforge.net/projects/hotkeyp/). I originally planned to just add a command-line command that opens Xiao Ai, but embarrassingly discovered that Xiao Ai is a UWP app: there's no .exe file, and it can't be launched through a shortcut either.

So the problem turned into: how do I wake the UWP Xiao Ai from the command line?

[How to open UWP apps from the command line on Windows 10](https://www.addictivetips.com/windows-tips/open-uwp-apps-from-command-line-windows-10/)

After some searching, I found the solution through the document above.

```bash
explorer.exe shell:appsFolder\8497DDF3.639A2791C9AB_kf545nqv09rxe!App
```

But when adding the hotkey in HotKeyP, a new problem appeared:

![No direct way to invoke the command line found](/migrated-images/picgo_202205140000046.png)

So the problem became yet again: how do I make HotKeyP execute a command line directly?

The fix was the natural one: write the command into a `.bat` script stored on disk, and have HotKeyP call that script.

But in practice, running the `.bat` script flashes a black console window, which is deeply annoying. I searched for how to run a `.bat` invisibly.

[The most detailed guide anywhere: running a .bat without a black console window / without showing the console - CSDN blog (CSDN, a large Chinese developer-blog platform) - how to run a .bat without a black console popping up](https://blog.csdn.net/qq_28362747/article/details/110472877)

So having a `.vbs` command execute the `.bat` script avoids the black window.

With that, the final path for replacing Cortana with Xiao Ai is clear:

Use HotKeyP to bind the `Win+C` shortcut to a script that executes the `.vbs` command; the `.vbs` script calls the `.bat` script without a console window, and the `.bat` script wakes the Xiao Ai UWP app.

The one imperfection: invoking Xiao Ai from the command line takes a wait of about 3s — no fix found for that so far.

That's all.
