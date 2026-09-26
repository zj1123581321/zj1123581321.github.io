---
title: "Tasker ××: Android Automation Examples"
date: 2020-10-12
draft: false
url: "/en/posts/2020-10-12239/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/2020-10-12239/). Last synced 2026-09-26.*

# Introduction

~~A few days ago~~ — actually, a few months ago — I came across ["Automated Qianji Expense Tracking with Tasker from Notifications" on sspai](https://sspai.com/post/61292) (sspai is a popular Chinese tech-media site; Qianji is a Chinese expense-tracking app), which reminded me of Tasker, which I'd bought long ago and then forgotten in a corner... I felt a real pang of kinship. And since automated expense tracking genuinely got me, this became the start of my journey tinkering with Tasker automation.

After a few weeks of tinkering, hanging around various forums, and hacking up configurations based on all kinds of articles, the features I currently have working include:

-   Automatically syncing call recordings to Jianguoyun (Nutstore, a Chinese cloud-storage service) after a call, and automatically syncing fooView screenshots to the PC desktop
-   Map apps' opening/closing synced with GPS
-   Video apps' opening/closing synced with the auto-rotate/screen lock
-   With the screen off, connecting specific headphones auto-plays WeChat (China's dominant messaging app) notifications
-   After connecting headphones, auto-playing listening materials unless specific apps are in the foreground
-   Automated expense tracking with Qianji (with notes, selectable ledgers, deferred logging, and automatic logging for password-free payments)
-   Managing the smart home from a band tap, a phone shake, or Quicker (a Windows quick-action panel tool)
-   A band alert when the phone charges to 95%
-   When a workout starts in Keep (a Chinese fitness app), the Xiaomi band starts recording automatically
-   Controlling another phone for notification forwarding, playback control, and more
-   Running Tasker tasks via Xiao Ai (Xiaomi's voice assistant)
-   Scanning a specific NFC card opens the smart-scale connection screen
-   ...

Below I'll walk through the use cases and configuration ideas for these automations, and provide imports for some of the more complex setups. I hope you find it useful.

# 1 Tasker + FolderSync

-   [FolderSync - Apps on Google Play](https://play.google.com/store/apps/details?id=dk.tacit.android.foldersync.lite&hl=zh)

## 1.1 Auto-Sync Call Recordings to Cloud Storage

### What It Does

As a safeguard for unforeseeable needs, I want my recordings synced to cloud storage at minimum, and ideally afterwards also **synced to other devices** or **shared with family**. Xiaomi's built-in cloud service can actually sync call recordings into Xiaomi Cloud, but Xiaomi Cloud isn't run by a professional cloud-storage vendor after all — its multi-device sync and sharing controls are less polished than dedicated storage services like Dropbox or Jianguoyun.

So I needed to find a bridge that links the phone's local recordings folder with cloud storage and achieves two-way sync.

FolderSync is exactly such an app for syncing between cloud storage and local folders. It supports common providers like Google Drive, Dropbox, OneDrive, and MEGA, and can also connect to other storage over protocols like FTP, SMB, and WebDAV.

In the end I chose to use FolderSync to link the local folder with a Jianguoyun folder over WebDAV. The Jianguoyun call-recordings folder can then sync to multiple devices, and its sharing-permission controls are relatively complete.

This way, after a call ends, the recording syncs automatically to Jianguoyun, and Jianguoyun then syncs the file to the PC.

### Configuration Idea

After configuring a sync profile in FolderSync, set up the following in Tasker.

```
if (a call ending is detected):
	invoke Tasker's FolderSync plugin to sync the specific profile
Endif
```

### Dependencies

-   No Root or adb required
-   Downloading FolderSync requires kx network (Google Play) — "kx network" is Chinese slang for a VPN/proxy connection that gets past China's internet restrictions
-   If the cloud provider is a foreign product like Google Drive or Dropbox, kx network is needed too

## 1.2 Auto-Sync fooView Floating-Bubble Screenshots to the PC Desktop

[FV Floating Ball - fooView (com.fooview.android.fooview) - 1.4.4.1 - Apps - Coolapk (a Chinese Android app store and community)](https://www.coolapk.com/apk/com.fooview.android.fooview)

[FV Floating Ball - fooView, file browsing, gesture screenshots - Apps on Google Play](https://play.google.com/store/apps/details?id=com.fooview.android.fooview&hl=zh)

### What It Does

Writing phone tutorials like this inevitably means screenshot demonstrations, and the flow of "screenshot - share to PC - save on PC" is rather clunky. I wanted to simplify the screenshot-to-PC pipeline as much as possible.

So I set up two-way sync between the phone's screenshot folder and a target folder on the PC via Jianguoyun and FolderSync: once a new screenshot is detected, FolderSync syncs the local folder to Jianguoyun, and Jianguoyun then syncs that folder to the PC. The whole flow reduces to "screenshot - the result appears on the PC automatically."

So how do you detect when a new screenshot has been created?

This is where Tasker's Logcat Entry feature comes in; for the specifics, see the [official Logcat Entry documentation](https://tasker.joaoapps.com/userguide/en/help/eh_logcat_entry.html). In short: when an app performs different operations it leaves different traces behind, and Tasker can monitor those traces to infer what operation the app just completed.

At this point, as long as you've configured a new sync profile in FolderSync, this automation is done.

### Configuration Idea

```
if (Logcat Entry detects fooview saving a screenshot):
	invoke Tasker's FolderSync plugin to sync the specific profile
Endif

# My Logcat Entry settings - Mi10 - MIUI 12, for reference only. This part varies by device and default screenshot folder
Component: MiuiGallery2_SaveToCloudUtil
Filter: [thread-pool-0] insert /storage/emulated/0/Pictures/Screenshots/
```

### Dependencies

-   No Root required, but the [Logcat Entry](https://www.reddit.com/r/tasker/comments/dsf5gj/dev_tasker_59beta8_the_game_changer/) feature needs adb authorization (when you add this feature, Tasker will tell you how)
-   Downloading FolderSync requires kx network (Google Play)
-   Jianguoyun is the recommended cloud provider, but on Windows OneDrive achieves the same effect; if you'd rather not use a cloud provider, on a local network you can also sync straight to the PC over FTP or SMB.

# 2 Tasker + Notify&Fitness for Mi Band

## 2.1 Band Sends a Fully-Charged Alert at 95% Charging

[Notify & Fitness for Mi Band - Apps on Google Play](https://play.google.com/store/apps/details?id=com.mc.miband1&hl=zh)

NF for Mi Band is a third-party client for the Xiaomi Mi Band. Compared with Xiaomi's official Mi Fit app, NF is cleaner and offers far more room to tinker. For a detailed introduction to NF, see ["Say goodbye to ads and make your Mi Band better on Android: Notify & Fitness" on sspai](https://sspai.com/post/56954).

## What It Does

For the long-term health of the phone battery, I generally avoid charging it to full in daily use.

When the phone's charge reaches 95%, one approach is cutting power by controlling a smart plug. The problem, though, is figuring out what should trigger the instruction telling the plug to restore power — otherwise you might leave the phone plugged in for ages before realizing you forgot to turn the plug on.

The other approach is sending a notification to the band at that point, and pulling the charger by hand...

I originally configured this through Tasker, but later found NF ships with a fully-charged alert of its own. Anyway, the significance of this automation is that you can now link the phone and the band through Tasker, which makes the band far richer to play with.

## Configuration Idea

```
if (battery level = 95) And (charging):
	the band sends a notification
Endif
```

## Dependencies

-   No Root or adb required
-   Requires the third-party Mi Band app Notify & Fitness for Mi Band. Downloading from Google Play needs kx network and the Google suite; using [Notify & Fitness for Mi Band APKs - APKMirror](https://www.apkmirror.com/apk/onezerobit/notify-fitness-for-mi-band/) may let you skip the Google suite

# 3 Tasker + Qianji

### What It Does

This automation was mainly inspired by the article ["Automated Qianji Expense Tracking with Tasker from Notifications" on sspai](https://sspai.com/post/61292). I had tried many approaches before, but still forgot to log expenses all the time. With Tasker and Qianji working together, you can log an expense instantly right after paying, and it supports:

-   Capturing the amount from any notification that contains one
-   Adding a note
-   Choosing an account
-   Deferred logging (it creates a notification in the shade that won't be dismissed by accident)
-   Automatic logging for Alipay (China's dominant mobile-payment platform) password-free payment items

See this demo video for the specifics:

\[Demo video on Bilibili (a Chinese video-sharing platform)\]

One imperfection: I haven't yet found **how to make Tasker invoke the keyboard's numeric input mode directly**, and the extra step when typing the decimal point feels clunky. If anyone knows, please point it out in the comments — thanks.

### Configuration Idea

```
# Two Profiles, two Scenes, 16 Tasks

# Variable notes
%ACCOUNTNAME # the account to record the expense into
%Accountname1 # bank card account 1
%Accountname2 # bank card account 2
%Accountname_hb	# Huabei (Alipay's virtual credit line) as named in Qianji, default "Huabei"
%Accountname_wechat # WeChat wallet balance as named in Qianji, default "WeChat"
%Accountname_yeb	# Yu'ebao (Alipay's money-market fund) as named in Qianji

%Choice	# whether it's the Alipay family (Yu'ebao, Huabei, bank cards) or the WeChat family (WeChat wallet, bank cards); 1 = Alipay, 2 = WeChat
%Evtprm # %evtprm() is a local variable, so this stores the notification text for passing between tasks
%If_have_unrecord_bills # whether there are bills to be logged later (0 = no, 1 = yes)
%Notification_to_cancel # the text of the deferred notification to clear
%QJURL 	# the Link Qianji uses for automated logging
%Tag	# whether a ledger was selected; if none was selected, logging is cancelled
```

![Tasker + Qianji expense-tracking flow](/migrated-images/picgo_20201010144429.png)

### Dependencies

-   No Root, no adb required
-   Requires [Qianji](https://qianjiapp.com)

### References

["Automated Qianji Expense Tracking with Tasker from Notifications" - sspai](https://sspai.com/post/61292)

[Automated bookkeeping interface · Qianji user guide](http://docs.qianjiapp.com/plugin/auto_tasker.html)

### Import Instructions

1.  Long-press the little house icon in the bottom-left corner to import the project
2.  In the "Payment Logging" project, switch to the "Tasks" view and tap into "Initialize Command"
3.  Change the account names to match the account names in your own Qianji ledger
4.  Tap the bottom-left corner to run this task
5.  (Optional) Search [Iconfont - Alibaba's vector icon library](https://www.iconfont.cn/) for icons matching each account, and change each account's icon and background in "Scenes"
6.  For Alipay password-free payment notifications, you'll need to adjust the logging account, notification-text cleanup, spending category, and similar settings yourself

PS: On Huawei phones, EMUI 10 or Magic UI 3.0 or above is required to use Qianji's automated-bookkeeping interface; it's currently unclear whether older versions have a workaround.

# 4 Tasker + [HomeAssistant](https://www.home-assistant.io)

The Mi Home app (Xiaomi's smart-home platform) has in fact been working hard to streamline device control via shortcuts, widgets, lock-screen swipes, notification-shade controls, and so on. But first, I'm genuinely lazy — with those approaches I still have to think about finding the device; second, the Mi Home app can't exploit the phone's richer sensors for automation scenes, which leaves something to be desired. Once these devices are hooked into HA, though, the sky's the limit.

Also, although controlling appliances with Xiao Ai is a one-sentence affair, whenever other people are around, I find shouting at Xiao Ai deeply embarrassing...

For these two reasons I hooked my smart home into HA: one more control channel, and one more layer of scene play.

## 4.0 Installing HomeAssistant and Connecting Mi Home Devices

### Installing Home Assistant

> Home Assistant is a free and open-source home automation platform written in Python that focuses on local control and privacy. It offers extremely broad device support; as of May 2020 it supported more than 1,600 modular plugins or add-ons for integrations with different IoT technologies, with systems and services available as "integration components". Actions such as turning lights on/off are triggered via automations, voice commands, mobile apps, or controls on Home Assistant's web-based front-end user interface.
>
> [Home Assistant - Wikipedia](https://en.wikipedia.org/wiki/Home_Assistant)

As the central control hub of a smart home, Home Assistant needs to run 24 hours a day, so it's usually installed on something low-power like a [Raspberry Pi](https://www.zhihu.com/question/20859055) (the link points to a discussion on Zhihu, a Chinese Q&A site).

But I didn't have a Raspberry Pi on hand, so I tried installing on Windows first and then on an Android phone — both worked. If you don't have a Raspberry Pi, a NAS, or similar hardware, I recommend an old Android phone.

#### Installing HA on Windows

Tutorial: ["Home Assistant installation and startup" - HAChina](https://www.hachina.io/docs/330.html) (HAChina, a Chinese Home Assistant community site)

A few pitfalls to avoid:

-   As of 2020-08-12, HA requires Python 3.7 or later
-   Because some libraries pip3 downloads come in source form, the pip3 install process will invoke the local C++ compiler, so you need to install [Microsoft Visual C++ Build Tools](https://blog.csdn.net/bbhdeal/article/details/81144783) (the linked notes are on CSDN, a large Chinese developer-blog platform)
-   If you hit `Stuck at INFO:homeassistant.core:Timer:starting`, `pip install home-assistant-fronted` fixes it
-   If you want Home Assistant to start on boot, you can [create](https://jingyan.baidu.com/article/0bc808fc2e37871bd485b9f7.html) a `.bat` script and [add it to startup](https://blog.csdn.net/yanchenyu365/article/details/88732646); the following code is for reference (no lingering black console window)

```bash
@echo off
if "%1" == "h" goto begin
mshta vbscript:createobject("wscript.shell").run("""%~nx0"" h",0)(window.close)&&exit
:begin
REM

hass
```

#### Installing HA on Android

I successfully installed HA first on a Redmi Note 4x (rooted, MIUI 11-9.10.10, Android 7) and then on a Huawei Nova 2s (not rooted, EMUI 8.0, Android 8), though the problems encountered during the two installs were not the same, so the commands are for reference only.

The steps below assume the device has Termux installed. Termux is a terminal emulator for Android — open source and Root-free. For a detailed Termux tutorial, see ["Termux advanced terminal installation, usage, and configuration | Guoguang"](https://www.sqlsec.com/2018/05/termux.html).

This also assumes you have some command-line basics and are good at searching. The core idea really boils down to four words: **install whatever's missing**.

On a rooted device you can go straight into the folder and edit the file; on an unrooted device you'll need an editor like Vim to edit the relevant configuration — search for Vim usage on your own there.

Reference tutorials:

[Installing HomeAssistant on Android with Termux to serve as the home's HomeKit hub](https://gist.github.com/Caldis/7646df406de43e6c6581ff491dfd8afe)

[Turn an idle Android phone into a Home Assistant home hub - HAChina](https://www.hachina.io/7656.html)

[Installing Home Assistant + HomeKit + MQTT + Node-RED on an Android phone or TV box via Termux - "HomeAssistant" forum](https://bbs.hassbian.com/thread-7167-1-1.html)

Pitfall notes:

1.  Per [No more -dev packages - Termux Wiki](https://wiki.termux.com/wiki/No_more_-dev_packages), since 2019-07-28 Termux has dropped support for xx-dev packages, so the python-dev, openssl-dev, and similar packages in the tutorials above no longer need to be installed.
2.  Commands you may need to run in addition: `pip install Pillow`, `pip install aiohttp_cors`, `pip install home-assistant-fronted`

### Connecting Mi Home Devices

> Using the Xiaomi Smart WiFi Socket (WiFi version) as an example

-   A rooted Android device is preferable
-   Mi Home app, a version before 5.0.19
-   Google Play installed, preferably

[How to obtain the token of a Xiaomi WiFi device](https://home-assistant.cc/component/xiaomi/wifi/#token-%E8%8E%B7%E5%8F%96)

Note that in the `yaml` configuration file, every `:` should be followed by a **space**.

```yaml
switch:
  - platform: xiaomi_miio
    name: Original Xiaomi Mi Smart WiFi Socket # give your plug a name
    host: # the plug's IP address
    token:	# the token you obtained
    model: chuangmi.plug.m3
```

[Adding Xiaomi's basic smart socket to hass](https://gist.github.com/willwhui/d499629ca6c46aaf29ba2a06c2ad209d)

[Connecting a Xiaomi WiFi socket to HA, with miio installation](https://bbs.hassbian.com/thread-1238-1-1.html)

Commands that are easy to miss:

`pip3 install python-mirobo`

`npm install miio`

### References

[Home Assistant Chinese documentation](https://home-assistant.cc/)

[Documentation - Home Assistant](https://www.home-assistant.io/docs/)

[Xiaomi Smart WiFi Socket and Smart Power Strip - Home Assistant](https://www.home-assistant.io/integrations/switch.xiaomi_miio/)

[REST API | Home Assistant Developer Documentation](https://developers.home-assistant.io/docs/api/rest/)

## 4.1 Shake the Phone at a Specific Angle to Toggle the Lights

### What It Does

This is just one example to show that you can use the phone's sensors as trigger conditions for smart-home control.

-   Shake the phone at a specific angle for a certain time and the Xiaomi socket turns on/off.
-   When the phone is placed on the wireless charger and the posture sensor holds still for 5 seconds, the wireless-charging socket turns on.
-   Phone resting on a stand for 5+ seconds / the stand's NFC scanned: Bluetooth-connect to the speaker, lights off, cinema mode on.

### Configuration Idea

After updating to Tasker 5.9.3, the new [Any Sensor](https://tasker.joaoapps.com/userguide/en/help/any_sensor_base.html) feature means Tasker can use many sensors on your phone that aren't listed. See the demo video [Live Creations #42 - New Sensor State, Event and Actions - YouTube](https://www.youtube.com/watch?time_continue=1&v=766S-KRnaiE&feature=emb_logo).

```
if (shaking left-right, low sensitivity, long duration) And (gravity sensor within a specific range):
	send the light on/off command to HA
Endif
```

As for how to send requests from Tasker to HA, the article [⚙️ Using Tasker with Home Assistant (V2) - Share your Projects! - Home Assistant Community](https://community.home-assistant.io/t/using-tasker-with-home-assistant-v2/149366) explains it very clearly.

Again using the Xiaomi Smart WiFi Socket as an example, here's my configuration (**you need to import the "HA call-service" task beforehand**):

```
# Turn off the Xiaomi smart socket
In Tasker choose "Run Task", with these parameters
Name: HA call-service
Priority: %priority
Parameter1(%par1): switch.turn_off
Parameter2(%par2):{"entity_id":"the Xiaomi socket name I set"}
```

## 4.2 Toggle the Lights with a Band Tap

### What It Does

This example shows that the band can also serve as a trigger for smart-home control.

-   Go to bed without bringing the phone and turn off all the lights from the band: on the Mi Band's heart-rate screen, long-press until it vibrates, then single-tap, and the Xiaomi smart socket turns on/off.
-   After entering the bathroom, use the band to control the phone connected to the bathroom speaker: play/pause music.

### Configuration Idea

This part is really a further application of Tasker + Notify & Fitness for Mi Band.

```
If an intent is received (com.mc.miband.buttonPressed1):
	send the light on/off command to HA
Endif
```

Of course, NF for Mi Band can receive/send many more Intents; you can find the specific reference in the [Notify & Fitness for Mi Band Intent reference documentation](http://www.mibandnotify.com/help/tasker_send_intent.php).

## 4.3 Managing the HA Smart Home with Quicker

### What It Does

This part is a bit off-topic... but it really was one of my original motivations for tinkering with HA — controlling the smart home from the PC. Before, toggling the lights or the AC meant pick up the phone - unlock - tap the home-screen shortcut; far too many steps for a lazy person like me...

Now I bring up the Quicker panel on Windows, click with the mouse, and the lights toggle or the AC temperature changes — the phone never gets involved. Very comfortable.

For example, the "I'm heading out" command turns off the desk lamp, water dispenser, and AC, and the PC locks its screen and powers off the display.

![Quicker smart-home control panel](/migrated-images/picgo_20201010153508.png)

### Configuration Idea

At bottom it's Quicker sending POST requests to HA; for the details, refer to the official [REST API | Home Assistant Developer Documentation](https://developers.home-assistant.io/docs/api/rest/).

Again with the Xiaomi Smart WiFi Socket as the example, here's the Quicker HTTP request configuration for turning the socket off:

-   URL: `http://IP_ADDRESS:8123/api/services/switch/turn_off`
-   Method: `POST`
-   Headers: `Authorization: Bearer {the token you generated}`
-   Body type: `JSON`
-   Body: `{"entity_id":"find it under 'Services'"}`

Other APIs for reference:

-   Mi LED desk lamp (1st gen) on/off: `http://{IP}:8123/api/services/light/toggle`
-   Mi AC Partner (2nd gen) set temperature: `http://{IP}:8123/api/services/climate/set_temperature`

### References

[Integrating the Mi AC Partner 2 plug into HA](https://bbs.hassbian.com/thread-10763-1-1.html)

## 4.4 Keeping the Phone's Battery Between 40%-80% Automatically

### What It Does

The two phones mentioned above sit at home year-round, doubling as SMS forwarders and HA hubs. To keep their batteries as healthy and safe as possible, both phones cut power from the charging socket automatically at 80% charge, and turn the charging socket back on automatically when the battery drops to 40%.

PS: On iOS you can actually achieve the same effect with "Automations" and Mi Home scenes.

### Configuration Idea

```
if (battery reaches 40/80 %):
	turn the charging socket on/off
Endif
```

# 5 Tasker + Join

[Join](https://joaoapps.com/join/) is another product by Tasker's author — a tool for connecting Windows, Android, browsers, and IFTTT.

A few features I particularly like:

-   A page open in Chrome on Win10 can be cast straight to the phone, and vice versa, a page open on the phone can be shared straight to Chrome
-   Automatic clipboard sync
-   Sending notifications between devices + Tasker integration

Of course, Join does much more — capture the phone's screenshots or screen recordings onto the PC, locate the phone, ring the phone...

One big problem with Join, though: it relies on FCM for push delivery, so you **need a stable kx network** for a decent experience.

This part requires no Root or adb.

## 5.1 Controlling Play/Pause and Volume on Another Phone

### What It Does

I've recently been trying to rebuild my phonetic filter system following ["Everyone Can Use English - Phonetics"](https://github.com/xiaolai/everyone-can-use-english/blob/master/chapter3.md), which means listening to a lot of English material. With no speaker around for out-loud playback, I turned my eyes to my long-idle SMS-forwarding phone — the Redmi Note 4x.

Because it usually sits in an awkward spot where picking it up to operate it is inconvenient, I wanted it, besides playing for long stretches, to also allow remote control of play/pause and volume from another phone. Even further, I wanted: when a call comes in on my main phone, it pauses playback automatically; when the call ends, it resumes.

After installing Tasker on the Redmi, I found [Poweramp – Music Player for Android](https://powerampapp.com/), a local music player that supports Intent-based control of play/pause, previous track, next track, and more. So this part is really Tasker + Join + Poweramp.

### Configuration Idea

-   Create a task in Tasker on the Mi10, and use Join's Tasker plugin to send a specific text to Join on the Redmi
-   Tasker on the Redmi detects the specific text arriving via Join's plugin, and executes a command via Intent to control Poweramp playback

One thing worth noting: if you downloaded the "Poweramp(intents) v1.1" task via the [link](https://taskernet.com/shares/?user=AS35m8l%2B3zs0BR1AZDj4AuATCi6sHXkf5gWIgaHE4nGBxoUJYqGDo%2FdXDzy829iShgNjLWU%3D&id=Project%3APA+Ctrl) a Redditor shared in the reference documentation, that task's Intent `Target` defaults to `Service`; if test control doesn't work, you may need to change it to `Activity` for it to work properly. You can also import my fixed version of the task via the config link at the end of this post.

### References

[\[PROJECT SHARE\] PowerAmp control panel to control media function 😃 : tasker](https://www.reddit.com/r/tasker/comments/i26864/project_share_poweramp_control_panel_to_control/)

[powerampapi/PowerampAPI.java at master · maxmpz/powerampapi](https://github.com/maxmpz/powerampapi/blob/master/poweramp_api_lib/src/com/maxmpz/poweramp/player/PowerampAPI.java)

## 5.2 SMS Received on the Other Phone Forwarded Directly via Join

### What It Does

This phone actually already has [forwarding to Telegram via IFTTT](https://iamcristye.github.io/SMS-forwarding-using-IFTTT) configured; adding this Tasker Profile is just one more layer of insurance.

As the title says, SMS received on the Redmi is forwarded via Join directly to my Mi10.

Later, though, I found that for someone at the computer all day, forwarding SMS to WeChat is more convenient after all...

### Configuration Idea

-   Tasker detects the SMS and sends the message content, sender, and send time to the Mi10 via Join

The variable names you might use, and what they mean:

-   `%SMSRB`: SMS body
-   `%SMSRF`: sender
-   `%SMSRD`: date sent
-   `%SMSRT`: time sent

### References

[Auto-forwarding SMS received on an Android phone to WeChat with Tasker - Tasker configuration tutorial site](http://taskerm.com/2018/12/22/forwarded-sms-to-wechat/)

# 6 Tasker + Keep

## 6.1 When Keep Starts a Workout, the Xiaomi Band Starts Recording

### What It Does

Because Keep doesn't support connecting to the Xiaomi band, many of the band's sensors are of no use in Keep's workout scenarios. Every time I wanted to record a workout in Keep, I had to manually open NF for Mi Band to create the workout, then switch back to Keep — a real hassle.

With Tasker set up, tapping "Start Workout" in Keep makes the Xiaomi band automatically create a workout in "Running" mode and start monitoring data.

As above, this also uses Tasker's Logcat Entry feature as the detection condition.

### Configuration Idea

```
if (Logcat Entry catches Keep's start-workout log):
	use NF for Mi Band's Tasker plugin to create a workout in a given mode
Endif

# Reference Logcat Entry configuration
Component: ActivityTaskerManager
Filter: START u0 {cmp=com.gotokeep.keep/.tc.business.training.core.activity.TrainingActivity (has extras)} from uid 10086
```

### Dependencies

-   Notify & Fitness for Mi Band must be installed
-   No Root required, but enabling the Logcat Entry feature needs adb authorization

# 7 Others

## 7.1 Read WeChat Notifications Aloud When AirPods Connect with the Screen Off

### What It Does

The name says it all. You can also swap the AirPods for the car's Bluetooth — a roundabout way of getting a car mode for incoming WeChat messages.

For scenarios like driving or cycling, pulling out the phone to check messages is impractical, and glancing at the band hurts your attention; using your ears is a great alternative.

The features I implemented, in brief:

-   Multiple messages from the same person announce the name only once
-   The "[n messages]" prefix of merged messages is not read out
-   "@WeChatName" in group chats is replaced with "@me"

A more advanced setup worth recommending: [WeChat text-to-speech with a single Tasker configuration: WeChat message announcement + basic anti-revoke - CSDN blog_tasker get notification content](https://blog.csdn.net/h137242126/article/details/81235926)

### Configuration Idea

Mainly a walk-through of how the notification text is processed (the Mi10 invokes Xiao Ai's speech engine; other phone models need their own setup):

```
# Variable notes
%Wechat_sender # stores the WeChat sender, assigned from %evtprm2
%say_text # stores the notification text, assigned from %evtprm3

If (this sender differs from the previous one):
	store the sender's name in %Wechat_sender
	text to speech: "%Wechat_sender says"
Endif
store the notification text in %say_text
regex search-and-replace ".*:", stripping the "[n messages]:" from merged messages
If (the notification text contains "@WeChatName")
	replace "@WeChatName" with "@me"
	text to speech: "@me"
Endif
text to speech: "%say_text"
```

## 7.2 Auto-Play Listening Materials When AirPods Connect and No Media App Is in the Foreground

### What It Does

Cut from the same cloth as 5.1 — again for training the ear, mainly for when you're out and about.

After the AirPods connect, as long as the foreground is not the phone app or an audio/video app, Poweramp starts playing automatically; otherwise it stops playing.

### Configuration Idea

```
If (AirPods connected) And (foreground is none of certain apps):
	Poweramp starts playing
Else:
	stop playback
Endif
```

### Dependencies

-   Poweramp must be installed; see 5.1 for the link

## 7.3 Running Tasker Commands via Xiao Ai

### What It Does

Because the phone's Xiao Ai can be caught mid-comprehension — the voice-generated text is detectable via the Logcat Entry feature — we can say a specific phrase to the phone's Xiao Ai and have it run a particular Tasker "Task".

### Configuration Idea

The configuration below is based on the Mi10 with MIUI 12; other phones may need their own modifications. I also suggest adding a custom reply for Xiao Ai, so it doesn't answer "I don't understand, please say that again".

Detect the text Xiao Ai transcribed via Logcat Entry:

-   Component: `XmodeTextView`
-   Filter: `setTextWithAnimation{the transcribed text}`

### Dependencies

-   No Root required, but Logcat Entry needs adb to enable

## 7.4 Scanning a Specific NFC Card Opens the Smart-Scale Connection Screen

### What It Does

Every morning I measure and log my weight and body fat, and every single time "unlock the phone - find NF - switch tab - tap Weight" was just too much hassle...

Tasker streamlines this flow enormously: after getting up, put the phone on a specific spot on the desk (an NFC tag sits underneath), then step on the scale, and the weight and body-fat data sync to the phone automatically.

The scale models supported by NF for Mi Band:

> Since 7.3.6 Notify app version these scales are supported
>
> Please notice, if you are using also the official app of the scale there could be some conflicts. We suggest use only one app (notify or the official app)
>
> **Xiaomi Mi Scale 1**
> Full support
>
> **Xiaomi Mi Scale 2**
> Full support. Body values (fat, water, ...) are calculated by cloud notify server. We never save / redistribute any user data on cloud server.
>
> **Yunmai Scale Mini**
> Does not support offline data sync. Can measure values only when is connected.
>
> **Yunmai Scale SE**
> Does not support offline data sync. Can measure values only when is connected.
>
> **Beurer BF700 & BF800**
> Full support
>
> **Beurer BF710**
> Full support
>
> **Runtastic Libra**
> Full support
>
> **Sanitas SBF70**
> Full support
>
> **SilverCrest SBF75**
> Full support

### Configuration Idea

```
# The category is Send Intent; the specific parameter settings are below
Package: com.mc.miband1 # NF's package name
Class: com.mc.miband1.ui.main10.health.WeightActivity # the scale Activity inside NF
Target: Activity
```

You can get package names and the current page's Activity with [Developer Assistant (com.toshiba\_dealin.developerhelper) - 1.2.1 - Apps - Coolapk](https://www.coolapk.com/apk/com.toshiba_dealin.developerhelper).

### Dependencies

-   A phone with NFC (or any other trigger condition you prefer)
-   Notify & Fitness for Mi Band installed, plus a supported scale of your own

* * *

# Closing Notes

I once searched Zhihu for the question "what are some fun Tasker setups", but most of the answers were from 2015 and 2016, and their usefulness had badly decayed.

On Chinese platforms, constrained by the Google suite and kx network, Tasker material is rather scarce — special thanks here to sspai's @Fairyex and the several other authors whose Tasker write-ups I found truly inspiring. On international platforms, thanks go to the authors and warm-hearted folks on Reddit, who provided a great deal of material and ideas.

With Tasker's own updates and third-party apps maturing, I believe Tasker has many more possibilities in store. I'd really love for everyone to share their own setups in the comments, for the reference of more friends!

Config files: https://www.jianguoyun.com/p/Ddu1CC8QyODhBxiB1sID
