---
title: "有 ITIN 的情况下通过电话申请 EIN 记录"
date: 2024-03-13
draft: false
description: "前几天参考 中国人申请美国EIN几个方法-VPS大玩家 打电话申请了 EIN，此处做一个记录。 虽然我有 ITIN，但申请 EIN 实际上无需 ITIN ，也无需创办公司。 ITIN -网络申请：原则上可行，实际不行 秉承着能线上解决就不打..."
---

前几天参考 [中国人申请美国EIN几个方法-VPS大玩家](https://www.vpsdawanjia.com/4450.html) 打电话申请了 EIN，此处做一个记录。

虽然我有 ITIN，但申请 EIN 实际上无需 ITIN ，也无需创办公司。

## ITIN -网络申请：原则上可行，实际不行

秉承着能线上解决就不打电话的思想，我首先尝试通过在线填表的方式来申请 EIN。

打开 [雇主身份识别号码 (EIN) 在线申请 | Internal Revenue Service](https://www.irs.gov/zh-hans/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online) 这个网站，按流程操作。

这里我没有遇到大玩家里所说的**输入 ITIN 后会出现错误提示**，我输入 ITIN 后正常进入下一步填写 "Address" 的步骤，但这里就很蛋疼了，此处它询问的是：

> Where is the Sole Proprietor physically located?

![网申地址只能填写美国](/migrated-images/picgo_c63889c792f2aaccd7799dac008f790.png)

而有 ITIN 的我肉身是在中国，但此处只允许填写美国地址。

填写租用的美私地址倒也能下一步，但为了防止以后出麻烦，我还是放弃了网申的方案。

![填写美私地址下一步](/migrated-images/picgo_a5af6b46b5ec74b4239dd63bc5f1634.png)

## 通过电话申请 EIN

打电话总共用时 30 min，这里建议还是比较推荐 Chrome + Google Voice 的方式。两个原因：

-   用 gv 可以 0 成本
-   Chrome 支持 Live Caption + Live Translate，实时语音转文字的效果还是比较准的，可以有效降低沟通门槛（方法见文末）。

接线的是一位大妈，很有耐心。中间填报地址的时候她听不清我翻译的中国地址，所以她主动提出叫一个翻译加入对话。

这里如果你没什么信心的话，可以开始的时候就直接就跟她说：“I want a Chinese translator.”

### 主要问题

-   what is your position with the business? : the owner and the responsible party of the business.
-   name （需要拼写）
-   phone
-   Is this application for a limited liability company or its foreign equivalent nowadays? ：No
-   If have SSN or ITIN？
-   Address & Birth Date
-   And do you need a trade name or doing business of things?
-   Mailing Address
-   start date of business
-   are you expecting to have any U. S. Employees in the next twelve months?
-   the principal activity of the business.？
-   will this involve any U. S. Gambling or wagering, any form twenty two ninety heavy highway use tax or form seven twenty export like character?
-   Do you want to use the same phone number from earlier as your business phone number，your U. S. Business phone numbers?

### 拼写的技巧（确保不混淆，比如 g 和 j 的发音）

最好拼写字母的时候用下面的语法确保对方可以理解。

当你需要确保对方正确理解字母"W"时，你可以使用以下方式来口述：

"W" as in whiskey,  
"A" as in alpha,  
"N" as in November,  
"G" as in golf.

这样对方就会更容易理解你要表达的字母是"W"。

还有一些符号的英文名称：

-   破折号 “-” dash
-   逗号 “,” comma
-   空格 “ ” space

### Chrome 开启实时语音转文字&翻译

如果你只需要使用实时语音转文字，不需要翻译的话，任何的 chrome 都可以实现。

[在 Chrome 中使用“实时字幕”功能 - Google Chrome帮助](https://support.google.com/chrome/answer/10538231?hl=zh-Hans)

如果需要实时翻译，目前它只在 Chrome canary 频道可用。

-   下载 [Chrome Canary Features For Developers - Google Chrome](https://www.google.com/intl/en_sg/chrome/canary/)
-   快捷方式-右键-属性-添加参数

```
"C:\Users\zlx\AppData\Local\Google\Chrome SxS\Application\chrome.exe" --enable-features=LiveCaptionMultiLanguage,LiveTranslate
```

![chrome canary live caption & translate](/migrated-images/picgo_image-20240313182136127.png)

然后就可以使用了

![Chrome 实时字幕翻译](/migrated-images/picgo_59d080674165360cee9ac74b81db3e1.png)

![实时翻译使用的是 Google Translate，准确率还可以](/migrated-images/picgo_10bcf8a24f2dbbb04933274cfadb5d0.png)

* * *

以上。希望对你有所帮助。
