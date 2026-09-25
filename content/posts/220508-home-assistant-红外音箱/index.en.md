---
title: "Hooking an Edifier Speaker into Home Assistant over Infrared: A Record"
date: 2022-05-08
draft: false
url: "/en/posts/man-bu-zhe-yin-xiang-hong-wai-jie-ru-home-assistant-ji-lu/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/man-bu-zhe-yin-xiang-hong-wai-jie-ru-home-assistant-ji-lu/). Last synced 2026-09-26.*

# Background

I recently bought a pair of Edifier RT-1700 speakers as desk speakers. They can connect over cable and Bluetooth, but switching between the two requires the infrared remote that comes with them.

For a lazy person, this is really inconvenient.

Naturally, I thought of pulling the speakers into Mi Home (Xiaomi's smart-home ecosystem app) by emulating the infrared signal. As it happened, I had a Xiaomi Air Conditioner Companion 2 (a smart IR hub) at home, so through Mi Home's "Custom Remote" feature I recreated every function of the speaker's remote.

Although online control of the speakers was achieved through the Mi Home integration, controlling them via the phone or the Xiao AI smart speaker still felt a bit cumbersome to me. I work at a computer all day and rarely use my phone, so most of the devices at home are controlled from Quicker (a Windows automation app) using the Home Assistant API.

So, how can the speakers be hooked into Home Assistant and controlled through its API?

# The Approach

The core of this problem is **how to control infrared devices in HA**.

My HA currently has a Xiaomi Air Conditioner Companion 2, and on the Mi Home side it supports learning custom infrared signals, so the natural idea was to have the AC Companion also learn the speakers' IR codes inside HA.

Fortunately, I found some reference material on bringing the AC Companion into HA and learning IR codes:

[Home Assistant learning IR commands via the AC Companion - Blog - binsite](https://www.binss.me/blog/home-assistant-learn-ir-command-by-aqara-ac-adapter/)  
[Integrating the Xiaomi Air Conditioner Companion 2 plugin into HA - "HomeAssistant" general discussion board - "Hans Bi'an" (hassbian) » Smart Home Tech Forum - Powered by Discuz!](https://bbs.hassbian.com/thread-10763-1-1.html)  
[How to add IR remotes learned/copied by the Xiaomi Air Conditioner Companion 2 Pro into HA - "HomeAssistant" general discussion board - "Hans Bi'an" (hassbian) » Smart Home Tech Forum - Powered by Discuz!](https://bbs.hassbian.com/thread-14951-1-1.html)

Unfortunately, the "miio with MCN02 support" integration for my AC Companion 2 kept failing to install in HA, and the "Custom Remote" added through the Mi Home cloud integration was in a state of having entities but no ability to control anything.

So I had to look for another approach. After a round of searching, I found that HA can call Xiao AI (Xiaomi's voice assistant) through the [Xiaomi Miot Auto](https://github.com/al-one/hass-xiaomi-miot/issues/116) integration and have it silently execute voice commands — a roundabout way to emit the speakers' IR codes through HA.

Then **automation apps such as Quicker, FV Floating Ball (an Android quick-action bubble app), Tasker, and iOS Shortcuts can call HA's API to reproduce the speaker remote's functions**.

So now, if I want the speakers to switch sources and such, I can:

-   Control them through the Xiao AI speaker.
-   Bring up the Quicker panel on Windows and click the matching action.
-   Bring up the FV Floating Ball panel on Android and tap the custom action.
-   Pull down the notification shade on iOS and tap the matching Shortcut.
-   Control them through the widget inside the Mi Home app.

That basically covers this lazy person's needs.

# The Full Process

## 1 Add a Custom Remote in Mi Home

If you currently have a device in Mi Home that can emit infrared signals (an AC Companion or a universal remote, for example), you can tap the ➕ on the Mi Home home screen, search for "Custom Remote," and enter the IR code for each button one by one.

Once the entries are done, you can give the remote a custom name, and it will show up in Mi Home as an independent device. The pity is that the interface is ugly and doesn't support later modification or adding buttons, so it's best to get it all done in one pass.

## 2 Set Up Custom Scenes in Mi Home to Control the Speakers

One button means one custom scene. Be sure to check "Allow control via Xiao AI," and you can also add other phrases to serve as voice commands.

## 3 Bring the Xiao AI Speaker into HA

The [hass-xiaomi-miot](https://github.com/al-one/hass-xiaomi-miot) project can bring the Xiao AI assistant from Mi Home into Home Assistant; integrating one speaker is enough.

## 4 Configure Actions in Different Apps to Run Commands via HA's API

In HA's "Developer Tools - Services," you can try calling the Xiao AI speaker with a custom instruction using the following configuration.

```yaml
service: xiaomi_miot.intelligent_speaker
data:
  entity_id: media_player.xiaomi_lx04_7740_play_control
  text: 音箱切换有线
  execute: true
  silent: true
```

(The value of `text` is the literal Chinese voice command sent to the speaker — "speaker, switch to wired input.")

And if you want to control it through [HA's API](https://developers.home-assistant.io/docs/api/rest/), a certain amount of conversion is needed.

![For example, the configuration in Quicker](/migrated-images/picgo_202205082302618.png)

The requests in FV Floating Ball and Shortcuts are similar.

* * *

One more note: having HA call the Xiao AI speaker to execute commands silently means, in principle, **any Mi Home device and any scene can be brought into HA**. Setting it up is relatively simple; the only catch is that device state can't be reflected in real time, so it can only be used to execute commands.

Hope this helps. That's all.
