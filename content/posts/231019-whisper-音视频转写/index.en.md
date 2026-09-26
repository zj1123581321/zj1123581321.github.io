---
title: "Accurate Transcription: An Incomplete Guide to Audio/Video-to-Text with Whisper"
date: 2023-10-19
draft: false
url: "/en/posts/liao-liao-gao-jing-du-yin-shi-pin-zhuan-wen-zi-gong-zuo-liu/"
translationSynced: 2026-09-26
---

*Translated from the [Chinese original](/posts/liao-liao-gao-jing-du-yin-shi-pin-zhuan-wen-zi-gong-zuo-liu/). Last synced 2026-09-26.*

# Background

A while ago my girlfriend started graduate school, where the courses are taught entirely in English and full of technical jargon on top, so sometimes her comprehension couldn't keep up with the pace of the lectures.

Reviewing through lecture replays/recordings therefore became a weekly routine. But re-watching a three-hour course in full is clearly unrealistic — which made audio/video-to-text transcription a must.

# Choosing an Approach

## Commercial ASR Services Mostly Fall Short of High-Accuracy Transcription

I'm a subscriber of Feishu Minutes (the meeting-transcription feature of Feishu, ByteDance's workplace collaboration suite), so when this need came up, my first thought was to try Minutes.

However, the transcription attempts showed that Minutes' accuracy on technical courses was quite poor — it couldn't meet the need of speeding up review through text transcripts.

![Minutes transcription results: untranscribed terms and frequent transcription errors](/post-images/image-20231015172805840.png)

Other commercial services (such as Tongyi Tingwu and iFlytek Tingjian, transcription products from Alibaba and iFlytek, plus Notta) deliver much the same results as Feishu Minutes, for roughly three reasons:

1.  Phones pick up sound poorly at a distance, so the audio file quality isn't great.
2.  Commercial automatic speech recognition (ASR) services generally target everyday scenarios like meetings. When the audio contains too much technical vocabulary, such ASR services struggle.
3.  Commercial ASR services must balance speed, accuracy, and cost; high accuracy usually comes at the price of higher cost and slower speed.

Given reasons 2 and 3, I gave up on hunting for other commercial ASR services.

## Whisper's Stunning Results

Since I've built quite a few workflows at work on top of [OpenAI's Whisper API](https://platform.openai.com/docs/guides/speech-to-text), I also tried the transcription quality of Whisper (Large-v2). — **Absolutely stunning**: it even transcribed the way symbols are written (theta\_i^t).

![Whisper LargeV2 transcription results: accurate enough to capture even the notation](/post-images/image-20231015172942167.png)

A quick introduction to [Whisper](https://openai.com/research/whisper): Whisper is an audio-to-text model open-sourced by OpenAI (yes, the company behind chatGPT) in September 2022, with remarkably high transcription accuracy.

But using Whisper for transcription isn't exactly easy. There are two ways to go about it: cloud or local.

Cloud transcription isn't limited by local machine performance and is relatively fast. But it has two problems:

1.  The processing pipeline is complicated: OpenAI's Whisper API caps each request at 25Mb of audio, while a 3h lecture usually runs several dozen MB. So you have to split the audio into segments first, request the results, and finally merge them — and for mp4 files you also need to extract the audio track. I stepped into plenty of pits along the way.
2.  Cost: OpenAI's Whisper model charges $0.006 per minute, so one hour of audio costs about 2.7 RMB (roughly $0.37) at an exchange rate of 7.3. Frankly, the Whisper API price is very cheap — almost a quarter of Google's Speech2Text API. But assume 5 courses, each 3 hours long, one session per week: the monthly transcription cost = 5 x 3 x 4 x 2.7 = 162 RMB (about $22), which still stings a little.

Local transcription avoids both of those problems, but has its own troubles:

1.  Laptops lack good hardware: Whisper on pure CPU is painfully slow — 3 hours of audio can take **a dozen-plus hours** to finish transcribing. For GPU acceleration, per the [Whisper model VRAM requirements table](https://github.com/openai/whisper/discussions/5), the official Whisper-large model needs 10G of VRAM, which my integrated-graphics laptop simply can't provide. The later [whisper.cpp project](https://github.com/ggerganov/whisper.cpp) did dramatically reduce the memory requirement, but that leads to the second problem.
2.  Deployment is complicated: what OpenAI open-sourced is, after all, project code, and writing your own adapter code is somewhat costly. There are plenty of Whisper GUI clients on Mac (Whisper Transcription, MacWhisper...), and Buzz on Windows, but finding one that supports GPU acceleration remains very difficult.

Setting aside cloud vs. local, the options above only cover the audio-to-text process itself; what's missing is an intuitive user interface that helps you quickly understand the audio through its text.

An ideal transcript page can borrow from Minutes' design:

-   Audio/video playback on the left, the complete transcript on the right for easy reading.
-   Clicking a line of the transcript jumps straight to the corresponding spot in the audio and plays it.

PotPlayer's subtitle browser can crudely achieve this, but it truncates the text once it gets long — barely usable.

![PotPlayer's built-in subtitle browser, Alt+E](/post-images/image-20231015184125116.png)

## Memo: Possibly the Best Whisper Client Around Right Now

Later, while browsing Xiaozhongruanjian (a well-known Chinese blog covering niche software), I came across the beta of [Memo AI](https://memo.ac/zh/), whose features fit my needs exactly.

-   On both Mac and Windows, its Whisper calls support GPU acceleration. Even integrated-graphics laptops get decent speed.
-   The results page lets you quickly skim the whole transcript, or click a subtitle line to jump to that playback position.
-   Subtitles support one-click translation, making bilingual reading convenient.
-   It goes further with batch transcription, AI chat, and other features.

![Memo page screenshot](/post-images/P1Op5XfnI9iZslz.png)

Talk about a pillow arriving just as you're getting sleepy. With Memo in hand, below is our complete transcription workflow.

# The Workflow

## Where the Audio/Video Files Come From

Files come from two main sources: course video replays provided by the school, and recordings from a phone or a voice recorder.

### Downloading Course Video Replays

Some courses offer video replays on the [Canvas LMS](https://www.canvaslms.net/) platform, but with no download option.

Downloading web videos isn't hard, though: the videos are m3u8-based and unencrypted. Just get the m3u8 URL, and an m3u8 downloader can pull the video onto your machine.

For extracting the video URL, I recommend [xifangczy/cat-catch (the "Cat Catch" Chrome resource-sniffer extension)](https://github.com/xifangczy/cat-catch). Cat Catch solves roughly 80% of web-video download problems.

For the m3u8 downloader, [N\_m3u8DL-CLI](https://github.com/nilaoda/N_m3u8DL-CLI) gets it done in one shot.

### Recordings

Courses without video replays mean recording them yourself. Two device options: a phone or a voice recorder.

Which device to pick depends on your own situation.

Usually, phones are mediocre at picking up sound from a distance. In a classroom setting, if you can't sit in the front rows, the lecturer's voice often gets buried under other noise.

A voice recorder usually does better than a phone; around 100-200 RMB (roughly $14-28) meets the need.

For study-abroad and specialized-course scenarios, **don't choose a voice recorder for its real-time speech-to-text feature** — three potentially big problems:

1.  Poor real-time transcription accuracy: theoretically, real-time transcription is harder, and since even non-real-time commercial ASR accuracy is already that mediocre, real-time transcription is nearly useless for specialized courses.
2.  Network trouble when you're abroad: real-time transcription actually sends the recorded audio to the manufacturer's server, which sends the transcription back. But many manufacturers' servers are in mainland China, so if you're overseas you may hit frequent connection drops.
3.  Poorly maintained apps: recorders touting free real-time speech-to-text usually come with companion apps, but their long-term stability is hard to trust. iFlytek's recorders, for instance, were awkwardly split across three separate phone apps (Jizhi, Tingjian, Yuji); different recorders only connect to specific apps, and some of those apps have been off the iOS App Store for over a year..

## Pre-Processing the Files (Optional)

### Noise Reduction, Loudness Normalization, and Voice Enhancement

Sometimes recordings turn out awkward. This may be due to weak phone microphones, or too much distance between the recorder and the sound source. In these cases you may run into the following problems:

-   In the recording, the target voice is so quiet it's impossible to make out.
-   The recording contains a lot of noise.
-   The volume differs greatly between the first and second halves of the recording, so playback loudness swings back and forth.

Therefore, before transcribing, it's best to process the audio a little first — this effectively improves Whisper's transcription results. I mainly do three operations: voice enhancement, noise reduction, and loudness normalization.

As for software: Pr (Premiere Pro) on Windows, Final Cut Pro on Mac.

![Pr 2020; options and values are for reference only.](/post-images/image-20231015205318025.png)

![Final Cut Pro; options and values are for reference only.](/post-images/image-20231015205512123.png)

### Removing Long Silent Stretches

Downloaded lecture replays usually contain 20 to 30 minutes of break time, and I usually choose to cut those segments out of the video. Two purposes:

1.  Shrink the file size: a 3-hour replay takes up about 1.5G of space; removing 30 minutes of video saves roughly 200M of storage.
    
2.  Reduce the chance of Whisper hallucinating: although Whisper's transcription accuracy is quite high, it occasionally hallucinates — i.e. from some point on, the transcript keeps repeating a certain phrase. Large stretches of blank time can trigger this hallucination.
    
    Manually deleting the blank segments is a very crude solution; the more elegant approach is transcription combined with voice activity detection (VAD), which automatically skips the blank segments. (The developer says a future Memo version will integrate VAD.)
    

For cutting video you can use editors like Pr/FCP, but that requires re-encoding the processed video, which is time-consuming. If you're willing to tinker, I suggest using ffmpeg with stream copy here — cutting the blanks out of a 3-hour video file usually takes just a few seconds.

Two core commands:

**Extract a specific time range from the video**

```
$$ffmpeg -i "{OriFileLoc}" -ss {RangeTimeStart} -to {RangeTimeEnd} -c:v copy -c:a copy "{OriFileParDir}\temp\temp_video_{temp_video_index}{OriFileExtension}"
```

**Join multiple videos (same format) with concat**

```
$$ffmpeg -y -hide_banner -vsync 0 -safe 0 -f concat -i "{OriFileParDir}\temp\fileList.txt" -c copy "{OriFileParDir}\RmBlank_{OriFileName}{OriFileExtension}"
```

You can toss your local file paths to chatGPT and have it generate the final commands directly, or use [QuickCut: Your most handy video processing software](https://github.com/HaujetZhao/QuickCut) or the [Quicker action](https://getquicker.net/Sharedaction?code=1783e573-f3af-49b8-127a-08dbbe5b3358) I wrote (Quicker is a Windows automation tool popular in China).

## Settling on a Prompt

![Whisper transcription options in Memo](/post-images/image-20231015211743520.png)

### Whisper's Prompt and chatGPT's Prompt Are Two Different Things

Unlike traditional ASR models, Whisper can — **in certain situations** — use a Prompt to improve audio-to-text accuracy.

Although both come from OpenAI, Whisper and chatGPT Prompts differ enormously.

If the Whisper Prompt is "请尽力保持每句话的完整 并给每句话都添加标点符号" ("Try to keep every sentence complete and add punctuation to each sentence"), you'll find this Prompt does nothing at all — Whisper's transcript may still contain large numbers of broken sentences, or lack punctuation entirely.

**That's because Whisper is trying to learn the "style" of the Prompt, not follow concrete instructions.**

So what is a Prompt's "style"?

Based on Whisper's [cookbook](https://github.com/openai/openai-cookbook/blob/main/examples/Whisper_prompting_guide.ipynb), the [Whisper prompt discussions](https://github.com/openai/whisper/discussions?discussions_q=prompt), and my own experience, a Prompt's style can show up in the following aspects:

#### Style 1: Whether the Prompt Contains Punctuation

Whisper's transcripts sometimes lack punctuation; in that case you can use a Prompt that itself contains punctuation to nudge Whisper into adding it.

1.  "生于忧患，死于安乐。岂不快哉？" ("In adversity we thrive; in comfort we perish. Is that not delightful?")
2.  "请为转写的文本添加标点符号" ("Please add punctuation to the transcribed text")

Prompt 1 is meaningful; Prompt 2 is useless.

That said, Whisper doesn't learn the Prompt's punctuation style every single time. In my testing with the Whisper-large v2 model, using a prompt usually adds punctuation for English content; for Chinese content, it's a matter of luck.

#### Style 2: Error-Prone Spellings of Personal, Product, and Company Names

This one is fairly intuitive: different words can share the same pronunciation. You can specify your preferred spelling in the Prompt.

For example, a conversation mentions Zhang San and Li Si (roughly the Chinese "John Doe"), and the sound of "Zhang San" is identical to several other character combinations...

Then the Prompt can include "张三，李四。" ("Zhang San, Li Si." written in characters).

#### Style 3: Whether to Include Some Filler Words

I'll quote the official explanation directly here — translating it into Chinese would come out a bit odd.

> The model may also leave out common filler words in the audio. If you want to keep the filler words in your transcript, you can use a prompt that contains them: "Umm, let me think like, hmm... Okay, here's what I'm, like, thinking."

#### Style 4: Simplified vs. Traditional Chinese

Because Chinese has two written forms, sometimes Whisper transcribes the audio in Traditional Chinese. Stating the Prompt in Simplified Chinese will most likely fix this.

In general, keep the Whisper Prompt's language matched to the audio's language. That is: an English prompt for English audio, a Simplified/Traditional Chinese prompt for Chinese audio.

#### Style 5: Pseudo Speaker Separation via a Dialogue-Style Prompt

This trick comes from [prompt vs prefix in DecodingOptions](https://github.com/openai/whisper/discussions/117); it works sometimes.

The plain Whisper model cannot distinguish speakers in its transcription output; for that you'd normally pair it with Pyannote. But in certain scenarios, a Prompt can approximate speaker separation — **each transcribed sentence belongs to a single speaker**, and you never get one sentence attributed to multiple speakers.

The method is a conversational Prompt:

-   "- How are you? - I'm fine, thank you."
-   "- 吃了没？- 吃了。" ("- Eaten yet? - Eaten.")

Worth a try for podcast-type material.

#### More Whisper Prompt Tips

-   A Whisper Prompt should be as long as possible — a too-short prompt's style is hard to learn.
    
-   Whisper only uses 224 tokens of the Prompt; beyond 224 tokens it defaults to the last 224 tokens. For the concept of tokens see [this article](https://zhuanlan.zhihu.com/p/618029100) (in Chinese), but Memo's Prompt simply limits string length, so token length doesn't matter here — just make sure your prompt fits completely into Memo's input box.
    
-   A Whisper Prompt is best kept in the audio's source language.
    

### How to Generate a Prompt Quickly?

Since I mostly transcribe course content, my Whisper Prompt is usually the lecture's keyword list. If the course has a lecture-notes PDF, I toss it straight to [Claude](https://claude.ai) and ask:

```
summarize the file, response me with format like :"keyword1, keyword2, keyword3,keyword4.."
```

If the course has no lecture notes, I type a few keywords manually, or just grab a random passage from the textbook as the prompt.

## Transcribing

### Choosing a Model

Whisper transcription requires specifying a model. The bigger the model, the more accurate the transcription, and the slower it runs.

![Whisper models with notes](/post-images/image-20231015230928775.png)

### GPU Acceleration

Memo implements GPU acceleration on both Windows and Mac.

#### Windows

Dedicated-GPU Windows machines should mostly be fine. Benchmarked transcription speeds for some cards:

> -   RTX4090 on the Large model: 1.2 hours of audio in 7 minutes
> -   RTX3080Ti on the Large model: 1.2 hours of audio in 8 minutes
> -   RTX3080Ti on the Large model: 0.4 hours of Japanese anime in 2 minutes
> -   RTX3060 laptop on the Large model: 1.2 hours of audio in 20 minutes
> -   RTX3060 on the Large model: 1.2 hours of audio in 12 minutes
> -   6600XT on the Large model: 1.2 hours of audio in 11 minutes
> -   5700XT on the Large model: 1.2 hours of audio in 15 minutes

If your computer only has integrated graphics, you may hit out-of-VRAM problems.

For AMD integrated graphics, you can try adjusting the VRAM size in the BIOS. (High-risk operation; proceed with care.)

[Games blowing past VRAM? Black or glitchy display? No BIOS adjustment option? A tutorial on adjusting AMD iGPU VRAM (UniversalAMDFormBrowser)](https://www.bilibili.com/video/BV1UV4y1c7br/?spm_id_from=333.880.my_history.page.click&vd_source=c2b8be35c825954dae60fa802e7dba82)  
[AMD desktop and laptop iGPU VRAM tutorial — iGPU still stuck at 512M?](https://www.bilibili.com/video/BV1w84y167ep/?spm_id_from=333.880.my_history.page.click&vd_source=c2b8be35c825954dae60fa802e7dba82)  
(Both videos are on Bilibili, China's major video-sharing platform, in Chinese.)

My laptop is an R7-6800H with 32G of RAM, factory-allocated 4G as GPU VRAM. On the Large model with GPU acceleration enabled, the VRAM fills up; transcription time : audio time is roughly 1:2.

I tried raising the VRAM to 8G; running Whisper took about 6G of it, but the speed was no better than with 4G. So if you adjust the BIOS VRAM size, 4G is usually enough.

#### Mac

I don't have an Intel machine at hand, so I'll mainly share M-series speeds.

M-series GPU acceleration scales roughly in proportion to GPU core count:

-   M1 Max, 32 GPU cores: transcription time : audio time = 1:12
-   M2 Pro, 16 GPU cores: transcription time : audio time = 1:6

For a comparison of Mac GPU core counts, see [Mac processor comparison: M1 & M2 vs Intel | Macworld](https://www.macworld.com/article/670873/which-mac-processor-apple-processor-comparison-m1-vs-intel.html).

When using Whisper GPU acceleration, besides GPU usage, memory consumption is also heavy. With the Large model, Memo took 6.4G of memory.

![6.4G of memory used with Whisper Large GPU acceleration](/post-images/image-20231015232947090.png)

## Post-Processing the Transcription Results

![Whisper raw transcription output](/post-images/image-20231016001016709.png)

If you're just creating simple subtitle files for video, you can pretty much wrap up here. But if you're doing this for courses or meetings where you need to read the full text quickly, you can optimize the transcript at this point, mainly solving two problems:

1.  Some sentences got split across two lines, which is inconvenient when running translation. (e.g. 00:15-00:19)
2.  Each line is too short, making for tiring reading. A paragraph mode with more content per timestamp would be ideal.

The developer says both features are coming in future versions, but until then we have to handle it ourselves. I wrote a Python script that converts the raw subtitles into paragraph-mode subtitles: [Adjust\_SubTitle: adjusts the srt files generated by Whisper's transcription, keeping sentences from being split across two lines and from being too short.](https://github.com/zj1123581321/Adjust_SubTitle)

You can export the raw transcript's srt file, then modify the srt file path in AdjustSrt.py; after running the script, a paragraph-mode srt subtitle file is generated automatically alongside the original. Finally, just recreate the Memo task, specifying both the audio and the subtitle file to import.

![Merging sentences into paragraphs](/post-images/image-20231016002138481.png)

Since paragraph mode's implementation logic is based on the punctuation in the raw transcription results, the precondition for running the script is **punctuation in the Whisper-generated subtitles**.

Beyond that, the punctuation-based paragraph mode **only works when there is a single speaker**. Otherwise a single paragraph may end up containing multiple speakers, which easily causes misunderstanding.

# Potential Problems and More Scenarios

## Whisper's Shortcomings

Although Whisper's ability to use context is strong and its transcription accuracy very high, Whisper also has two rather troublesome problems:

### The Headache-Inducing Hallucination Problem

"Hallucination" here means the text Whisper transcribes becomes unrelated to the audio and just keeps repeating earlier transcription results.

![Whisper hallucination: repeating the same sentence](/post-images/image-20231016003953822.png)

In my experience, two situations mainly cause hallucinations:

1.  Large stretches of blank content.
2.  Low recording quality with substantial noise.

1 is fairly easy to handle — Memo will introduce VAD to filter out blank content automatically.

Also, per [Ignore repeated prompt by heimoshuiyu · Pull Request #1253 · openai/whisper](https://github.com/openai/whisper/pull/1253), setting `--condition_on_previous_text False` — i.e. not letting Whisper condition its transcription of later audio on the preceding transcript — also lowers the probability of silence-triggered hallucinations, at the cost of giving up Whisper's context-understanding advantage. ([The developer says this option will be exposed later](https://github.com/Makememo/MemoAI/issues/23).)

But for 2, no good solution has turned up yet; all you can do is keep adjusting the strength of noise reduction and voice enhancement on the audio..

### Schrödinger's Punctuation

Going by the leaderboard, Whisper's English transcription ranks among the very best, while its Chinese transcription is mid-pack.

As mentioned above, with English audio a suitable Prompt will most likely add punctuation to the transcript, but with Chinese audio it may well fail to. That's an awkward spot, and I haven't found a good solution — if you know how to solve it, please share in the comments.

I once tried using gpt 3.5 to add punctuation to the generated text, but since gpt has hallucinations of its own, it often merged the text outright, and then the timestamps no longer matched the text.. Using 4 works but costs a bit much.

![Whisper transcription performance across languages; lower values are better.](https://raw.githubusercontent.com/openai/whisper/main/language-breakdown.svg)

## Who Whisper Suits

-   You have a strong need for audio-to-text and are willing to trade longer processing time for higher transcription accuracy.
-   You're privacy-sensitive and the audio cannot be uploaded to the internet.
-   You have decent computer hardware (16G+ RAM, capable of GPU acceleration).

* * *

Hope this write-up helps. That's all.

* * *

Also first published at [Accurate Transcription: An Incomplete Guide to Audio/Video-to-Text with Whisper - sspai](https://sspai.com/post/83644) (sspai, a Chinese tech-media site) — it's more convenient to continue the conversation over there.
