---
title: "漫步者音箱红外接入 Home Assistant记录"
date: 2022-05-08
draft: false
description: "背景 最近买了一对漫步者 RT-1700 作为桌面音箱，该音箱可以通过有线和蓝牙接入，但想切换需要使用自带的红外遥控器。 这对于一个懒人而言，实在是太不方便了。 很自然地想着可以通过模拟红外信号将其接入到米家中。正好家里有一个小米空调伴侣 ..."
---

# 背景

最近买了一对漫步者 RT-1700 作为桌面音箱，该音箱可以通过有线和蓝牙接入，但想切换需要使用自带的红外遥控器。

这对于一个懒人而言，实在是太不方便了。

很自然地想着可以通过模拟红外信号将其接入到米家中。正好家里有一个小米空调伴侣 2 代，所以通过米家的『自定义遥控』的功能实现了模拟音箱遥控器的所有功能。

虽然通过接入米家的方式实现了音箱的在线控制，但不论是通过手机还是小爱音箱控制，这个过程于我而言还是有点麻烦了。我日常都是在电脑前工作，手机其实很少使用，所以家里的多数设备都是在 Quicker 使用 Home Assistant 的 API 来进行控制的。

那，怎么才能把音箱接入到 Home Assistant 中通过 API 来控制呢？

# 思路

这个问题核心是**在 HA 中怎样控制红外设备**。

目前我的 HA 中有一个小米空调伴侣 2 代，而它在米家上是支持学习自定义的红外信号的，所以很自然的想法是在 HA 中让空调伴侣也学习音箱控制的红外码。

幸运的是，找到了一些空调伴侣接入 HA 并学习红外码的参考资料：

[Home Assistant 通过空调伴侣学习红外指令 - 博客 - binsite](https://www.binss.me/blog/home-assistant-learn-ir-command-by-aqara-ac-adapter/)  
[小米空调伴侣2 插件接入HA - 『HomeAssistant』综合讨论区 - 『瀚思彼岸』» 智能家居技术论坛 - Powered by Discuz!](https://bbs.hassbian.com/thread-10763-1-1.html)  
[小米空调伴侣2Pro学习/复制的红外遥控怎么加入HA - 『HomeAssistant』综合讨论区 - 『瀚思彼岸』» 智能家居技术论坛 - Powered by Discuz!](https://bbs.hassbian.com/thread-14951-1-1.html)

但不幸的是，我的空调伴侣2在 HA 中安装的『支持 MCN02 的 miio 』插件总是失败，通过米家云端设备的接入的『自定义遥控』也是空有实体但无法控制的状态。

于是只能另寻思路，一番搜索发现：HA 中可以通过 [Xiaomi Miot Auto](https://github.com/al-one/hass-xiaomi-miot/issues/116) 插件调用小爱同学，静默执行语音指令来变相实现通过 HA 发射红外码。

然后**可以使用 Quicker、FV 悬浮球、Tasker、捷径等自动化应用调用 HA 的 API 实现音箱遥控的功能**。

那现在如果我想要控制音箱进行切换源等操作，我可以：

-   通过小爱音箱控制。
-   在 Windows 上唤起 Quicker 面板，点击对应动作。
-   在 Android 上唤起 FV 悬浮球面板，点击自定义的动作。
-   在 iOS 上划出通知栏，点击对应捷径控制。
-   通过米家 App 内控件控制。

基本满足了我这个懒人的需求。

# 全流程

## 1 在米家中添加自定义遥控

如果目前米家中有可以发射红外信号的设备(比如空调伴侣、万能遥控)，则可以在米家首页点击➕号，搜索『自定义遥控』，逐个录入不同按键对应的红外码。

录完后可以给这个遥控自定义命名，之后它会作为一个独立的设备显示在米家中。比较遗憾的是，界面很丑并且不支持后期修改、增加按键，所以建议一次搞定。

## 2 在米家中设定自定义场景控制音箱

有几个按键，就需要有几个自定义的场景，注意要勾选『使用小爱进行控制』，还可以给它添加其他的文字作为语音唤醒的指令。

## 3 将小爱音箱接入到 HA 中

可以通过 [hass-xiaomi-miot](https://github.com/al-one/hass-xiaomi-miot) 项目将米家中的小爱同学接入到 Home Assistant 中，接入一个就可以了。

## 4 在不同的应用中配置通过 HA 的 API 执行命令的动作

在 HA 中的『开发者工具-服务』 里，可以通过以下配置尝试调用小爱音箱执行自定义的指令。

```yaml
service: xiaomi_miot.intelligent_speaker
data:
  entity_id: media_player.xiaomi_lx04_7740_play_control
  text: 音箱切换有线
  execute: true
  silent: true
```

而如果想通过 [HA 的 API](https://developers.home-assistant.io/docs/api/rest/) 来控制，需要做一定的转换。

![比如在 Quicker 中的配置](http://markdown.lixingzhang.site/picgo/202205082302618.png?imageslim)

在 FV 悬浮球和捷径中也是类似的请求。

* * *

多说一句，在 HA 通过调用小爱音箱静默执行命令原则上**可以将米家的任意设备、任意场景都接入到 HA 中**，布置起来相对简单，只是这样无法实时反映设备的状态，只能用于执行命令。

希望对你有所帮助，以上。
