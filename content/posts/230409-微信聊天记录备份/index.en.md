---
title: "Fixing WeChat's Chat History Backup Network Errors"
date: 2023-04-09
draft: false
url: "/en/posts/bei-fen-shou-ji-wei-xin-liao-tian-ji-lu-dao-dian-nao-jie-jue-ti-shi-wen-ti-dang-qian-wang-luo-huan-jing-fu-za-qing-chang-shi-shi-yong-qi-ta-wang-luo/"
sourceHash: "sha256:ddef5b9db73083f997cdd554bcf0f7f53744030748b60cdc5de331c3ef1cc7f8"
translatedBy: "claude-cli/sonnet"
description: "Test devices: Windows WeChat 3.7.6.44, Android WeChat 8.0.34, Redmi K50, MIUI 13. Background: I have a habit that has lasted three years: backing up that week's WeChat chat history every week. But WeChat's backup feature is really badly done, and I often run into network problems: Current..."
---
*Translated from the [Chinese original](/posts/bei-fen-shou-ji-wei-xin-liao-tian-ji-lu-dao-dian-nao-jie-jue-ti-shi-wen-ti-dang-qian-wang-luo-huan-jing-fu-za-qing-chang-shi-shi-yong-qi-ta-wang-luo/).*

## Test Devices

-   Windows WeChat 3.7.6.44
-   Android WeChat 8.0.34
-   Redmi K50, MIUI 13

## Background

I have a habit that has lasted three years: backing up that week's WeChat chat history every week. But WeChat's backup feature is really badly done, and I often run into network problems:

-   "The current network is complex, please try another network"
-   A prompt saying the phone and the computer are on different networks (even though both are clearly on the same Wi-Fi, and the network name shown on the backup screen is identical)
-   ...

I searched the internet, and the solutions amount to nothing more than:

-   Restart WeChat / the phone
-   Grant the location permission (Android) / grant the Local Network permission (iOS)

But in practice these don't solve the problem 100% of the time.

## The Real Solution

Follow the steps below. It has never failed for me.

### Prerequisites

1.  The phone and the computer are on the same Wi-Fi (ideally with the 2.4G and 5G bands named separately)
2.  On Android, WeChat has been granted the location permission (because the location permission includes some Wi-Fi information); on iOS, WeChat has been granted the Local Network Access permission
3.  On Android, the location switch is **turned on**.

### When You Hit a Network Problem and Backup Fails

1.  Kill the WeChat process. You need to go to the app info page and tap "Force stop". On MIUI, this is: long-press the icon => "App info" => "Force stop".
2.  In WeChat for PC, click "Migrate & Back Up" => "Migrate" (yes, use migration first, not backup).
3.  Migrate a very small chat history, so that the phone and the computer complete the communication handshake.
4.  After the migration succeeds, click "Back Up". Usually there won't be any network problems at this point.

![](/post-images/1680973263571.png)

If it still doesn't work, I suggest going back and re-checking the steps above.
