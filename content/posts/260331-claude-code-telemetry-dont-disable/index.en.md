---
title: "Don't Turn Off Claude Code Telemetry: Why It Makes Your Account More Dangerous, Not Safer"
date: 2026-03-31
draft: true
sourceHash: "sha256:1de3db827aa867c48e13a619ed3ff4130b4af1160a37b7fa5962819377211e3d"
translatedBy: "claude-cli/sonnet"
description: "After the Claude Code source code leaked, tutorials for turning off telemetry went viral in the community. But from the standpoint of risk-control logic, turning off telemetry is walking right into the line of fire. This article analyzes why from a risk-control perspective, and what you should actually do."
---
*Translated from the [Chinese original](/posts/260331-claude-code-telemetry-dont-disable/).*

> Yesterday Claude Code's source code leaked, and the hottest move in the Chinese-speaking community has been following tutorials to turn off telemetry. **Please don't do this.** This article explains why.

---

![主图](https://image.178494.xyz/image/2026/04/2225a90f5bcdcfbce89de3aade1606f3.png)

## What happened yesterday

The source code of the current version of Claude Code (`cli.js.map`) was leaked through reverse engineering. The leak includes all of the telemetry reporting logic: which fields are reported, how many channels they go through, and how to turn telemetry off via environment variables.

Soon after, the Chinese-speaking community started spreading a "[telemetry teardown document](https://bytedance.sg.larkoffice.com/docx/QNsIdi8VFoKm00xY8SRlkXxygve)". One of its suggestions was: **set a few environment variables to turn telemetry off, so Anthropic can't see your information and your account will be safe.**

I suspect a great many people followed it.

I'm writing this article because I believe this advice is **not only useless, but harmful**. It makes your account more dangerous, not safer.

---

## Before we start: two shared premises

**First, every risk-control policy is a black box.** Apart from Anthropic's internal risk-control team, nobody knows the exact rules and weights. All we can do is infer the logic from observed behavior and make judgments based on experience. This article itself is my speculation and analysis, not inside information.

**Second, risk control is a probability question, not a yes-or-no question.** What a risk-control system does is assign each user a "risk score", judging by cross-checking multiple signals. This leads to a familiar phenomenon: the same action is fine for A but gets B banned. It's not that the rules are inconsistent; it's that the two people's other signals combine differently, so their final scores differ.

Keep these two points in mind and the analysis below will be easier to follow.

---

## An important background: Claude Code is deeply involved in how Anthropic operates

Before getting into risk control, there's a piece of background worth stating on its own.

Anthropic has said publicly on multiple occasions that a large share of the work inside the company, including code development and building internal tools, is done by Claude Code itself. In other words, Claude Code is not only a product they sell to users, but also a production tool they use every day.

So we have reason to make a reasonable inference: **Claude itself has probably also been deeply involved in designing Claude Code's risk-control policies, analyzing its signals, and even its decision logic.**

What does that mean? It means the risk-control system you're facing is unlikely to be a pile of hard-coded `if-else` rules. It more likely has the analytical ability of a large language model: it can understand context, reason across multiple signals, and recognize behavioral patterns.

In plain words: **the "examiner" you're facing may well be Claude itself.** And the telemetry you cleverly turned off may look to it like nothing more than a very conspicuous anomaly signal.

---

## The two goals of Claude Code's risk control

Before analyzing specific behaviors, let's understand what risk control is guarding against. Claude Code's risk control mainly targets two kinds of people:

### 1. Anti-reverse-engineering / anti-automation

Some people reverse-engineer the Claude Code client and expose API endpoints to resell access. Claude Code is a monthly subscription (the Max plan is $200/month), but if you reverse it and use it as an API, you can get far more usage than the subscription price covers. The profit margin in between is huge, so the economic incentive is strong.

### 2. Anti-use from non-compliant regions

Because of US export controls and sanctions compliance requirements, Anthropic must prohibit users in certain regions from using its products. These regions include mainland China, North Korea, Iran, Cuba, and others.

The two goals sometimes overlap: for example, a user in a non-compliant region reverse-engineers the client in order to use it, and so crosses both lines at once. But this article focuses on the second one: **as a user in mainland China, how to reduce the probability of being hit by risk control.**

---

## The core argument: why turning off telemetry is actually more dangerous

This is the most important part of the article.

### Analogy one: roll call in a class

Imagine a class of 50 students. The teacher suspects that one of them has a cold and wants to find out who.

If that person only has a slight cough, hidden among the crowd, they're actually hard to spot. After all, plenty of people cough once in a while.

But if that person **simply doesn't show up to class** and their seat is empty, the teacher doesn't even need to observe anyone. One glance tells them who's absent.

**Turning off telemetry is like skipping class.** You think you're hiding, but in fact you're the most conspicuous person in the whole class.

### Analogy two: the medical checkup report

Every year the company does a physical checkup, and everyone hands in a report. Some numbers are high and some are low: one person has slightly high blood pressure, another has high uric acid. All of that is normal.

But one person hands in a blank sheet of paper and says, "I didn't get the checkup."

Do you think HR would conclude this person is the healthiest? Or would they suspect this person **has something to hide**?

Normal telemetry data is your checkup report. Whether the numbers in it are good or bad doesn't matter; what matters is that you handed it in. **Not handing in the report is itself the biggest anomaly signal.**

### Why does this logic hold? Let's break it down

#### First: tutorials for turning off telemetry spread only in the Chinese-speaking community

After this source leak, through what channels did the "turn off telemetry" tutorials mainly spread? WeChat groups, Chinese Telegram groups, Chinese tech forums.

That means: **the vast majority of people who came across this information are Chinese-speaking users**, especially users in mainland China. Most English-speaking users in compliant regions don't even know about it, and even if they did, they'd have no strong motivation to do it.

So from a risk-control standpoint, the act of "turning off telemetry" carries a **geographic tag** of its own: whoever does it has a high probability of being a user in mainland China.

#### Second: the motivations are completely asymmetric

Who has a strong motivation to turn off telemetry?

- **Users in mainland China**: telemetry data might reveal their real geographic location → account ban → financial loss. This is a "**survival motive**": if you don't turn it off, you might die.
- **Privacy-conscious users in compliant regions**: they might want it off out of a privacy preference, but leaving it on has no consequences at all. This is a "**preference motive**": they don't much care.
- **Ordinary compliant users**: they don't know it can be turned off, and don't care.

The conversion rate of behavior driven by a survival motive is far higher than that driven by a preference motive. The risk-control system doesn't need to know who you are. It only needs to know: **among all users who turn off telemetry, the proportion from non-compliant regions is significantly elevated.**

That's enough.

#### Third: what you can't turn off far outweighs what you can

Many people think turning off telemetry makes them "invisible". But telemetry is only one of many signals. The signals below are ones the server can see on **every API request, no matter how you set your environment variables**:

- Your connecting IP and its geographic attribution
- IP type (residential IP vs. data center / VPN)
- TLS handshake fingerprint (JA3/JA4)
- HTTP fingerprint (header order, behavioral characteristics)
- Your OAuth Token and account information
- API call parameters, frequency, and time distribution
- Client version number

When you turn off telemetry, not one of these signals goes away. The server still sees everything it was going to see. The only thing you've accomplished is **exposing one more signal: this person deliberately turned off telemetry.**

It's like walking down the street in a slightly suspicious coat, then taking the coat off, but sticking a note on your face that says "I just took my coat off".

#### Connecting the three points

When a risk-control system sees a user who has turned off telemetry, its chain of reasoning probably goes like this:

1. This person turned off telemetry → they know how → they've seen a Chinese-community tutorial → **most likely a Chinese-speaking user**
2. Why did they turn it off? → compliant users have no strong motive → **most likely a user in a non-compliant region, afraid of being exposed**
3. With telemetry off, the telemetry profile is missing → **but all the server-side hard signals are there** → it can keep cross-checking through IP, behavior patterns, and registration info

Final conclusion: **turning off telemetry not only fails to reduce risk, it hands the risk-control system one more high-weight basis for its decision.**

---

## So what should you do?

The core idea fits in one sentence: **make yourself look like a normal user in a compliant region, rather than making yourself disappear.**

### 1. Don't turn off telemetry

Don't set any telemetry-related environment variables. Just keep the defaults. If you've already set some, clear them as soon as possible.

```bash
# 检查是否已经设了相关变量
env | grep -i telemetry
env | grep -i otel
env | grep -i analytics

# 如果有，去你的 shell 配置文件里删掉对应的行
# 检查这些文件：~/.bashrc, ~/.zshrc, ~/.profile, ~/.bash_profile
```

### 2. Don't install the mobile client

This point is very important, but many people overlook it.

The mobile client collects three kinds of hardware-level geographic signals that are almost impossible to fake:

- **GPS location**: directly locates your physical position
- **SIM card MCC/MNC**: which country your SIM card's carrier belongs to (the codes for China's three major carriers are 460/461, written into the hardware)
- **Cell tower positioning**: even with GPS off, cell towers can locate you

These three signals are the **highest-confidence geographic evidence** in a risk-control system. If any one of them hits a sanctioned region, it's basically an immediate verdict.

There's actually more than that. iOS has dedicated APIs; see my earlier article: [Claude Code: Avoiding Bans, Model Selection, and Design Philosophy](https://mp.weixin.qq.com/s/Set_2-M-QP2xSAhyl1MonQ)

Also, faking these signals is extremely costly. You either remotely control a phone and SIM card bought in a compliant region, or use a rooted device with a location-spoofing module. The former is a hassle, and the latter easily triggers root detection and backfires.

**The best strategy is simply not to install it.** Right now Claude Code's core functionality lives in the desktop CLI, so skipping the mobile client doesn't affect your use. Without the mobile client, the risk-control system loses an entire class of high-confidence signal sources. One less dimension of data means one less chance of being exposed.

### 3. Network: use a good-quality proxy and keep it stable

- Use a **residential IP** whenever possible; don't use data center IPs or free VPNs (IP type can be detected)
- Once you pick an IP in a compliant region, **pin it** and don't switch countries frequently
- **Keep the proxy connected the whole time**; don't go through the proxy sometimes and not other times. An IP location suddenly jumping from New York to Shanghai is far too strong a signal

### 4. Environment consistency: make all signals point to the same place

If your IP is in New York, your system time zone and language settings should line up with it too:

```bash
# 时区与 IP 归属地一致
export TZ="America/New_York"

# 语言设置为英文
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"
```

**The most common slip-up: the IP is in New York, but the time zone is `Asia/Shanghai`.** A contradiction like this is glaringly obvious to a risk-control system.

By the same logic, if you use Linux, avoid China-specific distributions like deepin and UOS, since the distribution name itself is a strong geographic signal. Use internationally common distributions such as Ubuntu or Debian.

### 5. Use it normally; don't automate

- Normal interactive use, with gaps and pauses
- Don't make calls around the clock without a break
- Don't run batches with scripts
- Keep a reasonable call frequency

Risk control looks not only at "where you are" but also at "how you use it". An account that shows automation traits will be flagged no matter where it is.

### 6. If this device has ever been banned, the whole environment needs to be cleaned

Many people overlook this. If your device has a record of a banned account, switching to another account and logging in again isn't enough. A risk-control system will most likely collect device-level identifiers, such as deviceId, hardware fingerprint, and locally stored history. These things don't disappear when you change accounts. They stay on your device like a "criminal record".

When a new account logs in and the risk-control system links it up and finds that this device has a ban history, the risk score maxes out immediately.

So if you're in this situation, you need to thoroughly clean the entire runtime environment. Exactly which factors need handling can in fact be determined by reverse-analyzing the client source code: look at what it stores locally, which device identifiers it reports, and which paths hold persistent data. Only after cleaning all of that out have you truly "switched to a new device".

---

## One-sentence summary

**The adversarial logic of risk control is not "disappear" but "blend in".** You don't need to turn yourself into a ghost with no data at all, because that's actually the most conspicuous thing you can be. What you need is to look no different from the countless normal users in compliant regions.

Keep telemetry on, keep your environment consistent, keep your network stable, and keep a normal usage pattern. This can't guarantee 100% safety (remember, risk control is a probability question), but it's the **best strategy** available right now.

And turning off telemetry? That's telling the risk-control system: "I have something to hide."

---

Here's also a simple framework for judgment: whenever you're considering any "ban-avoidance measure", ask yourself one question: **does this action make me look more like an ordinary user, or less like one?** If the answer is the latter, it's most likely doing more harm than good.

One last thing: I have no intention of debating this with anyone. If, after your own analysis, you still believe turning off telemetry is the better choice, I fully respect your judgment and support it. Risk control is essentially a black box, and nobody can produce conclusive evidence that "doing it this way is definitely right" or "doing it that way is definitely wrong". You can't verify it in practice the way you run unit tests. I'm just sharing my own line of analysis for your reference.

---

> The first draft of this article was dictated by voice. The article structure and wording were developed in collaboration with Claude Code + Opus 4.6, and the cover image was generated by Nano Banana.

---

## Appendix: reference documents

The following two documents are detailed analyses of Claude Code's risk-control system from different perspectives (attacker and defender). They are long and highly technical, and are provided for readers who want to dig deeper.

**It must be emphasized that the content of these two documents is also speculation based on source code analysis, and does not represent Anthropic's actual risk-control policies.** But their analytical logic has reference value.

### Appendix A: Red team perspective — a playbook for evading risk control for users in non-compliant regions

> This document lays out evasion methods from the attacker's perspective. Notably, even from the standpoint of "how to get around risk control", the document states explicitly: **disguise rather than disable**. Turning off telemetry is itself a risk signal, and the optimal strategy is to let the signals be reported but have their content be disguised.

---

## 1. Attacker profile and premises

### Resources the attacker has

| Resource | Description |
|------|------|
| Coding Agent source code | The current version's `cli.js.map` has leaked; telemetry logic, environment variable switches, and reported fields are all visible |
| Technical ability | Basic development skills; can read JS source, modify environment variables, and configure proxies |
| Economic motivation | The product has quota value, and a ban means financial loss, so there is a strong motive to keep using it |
| Information channels | Chinese tech communities (forums, WeChat groups, Telegram groups) have active experience sharing |

### Risk-control signals the attacker faces (known)

Based on the leaked source code and the risk-control policy document, the attacker knows the defender collects and analyzes the following signals:

```
服务端硬信号（无法从客户端侧消除）：
  - 连接 IP 及地理归属、IP 类型（住宅/机房/VPN）
  - TLS 握手指纹（JA3/JA4）
  - HTTP 指纹（Header 顺序、行为特征）
  - OAuth Token 行为
  - API 调用参数、频率、时间分布
  - 客户端版本号

注册信息（注册时已提交）：
  - 手机号（含国家码）
  - 邮箱
  - 银行卡（BIN 可识别发卡国）
  - 收货地址

遥测信号（客户端可控）：
  - 系统时区、locale、平台、架构
  - Linux 发行版、WSL 版本
  - 终端类型、包管理器、运行时
  - 工具调用行为
  - 进程资源占用

移动端信号（如果安装）：
  - GPS 定位
  - SIM 卡 MCC/MNC
  - 基站定位
```

---

## 2. Core adversarial principles

### Principle 1: Full-chain disguise, no weak links

Risk control cross-validates multiple signals, and any layer left out becomes a breach point. You must disguise layer by layer; a partial job won't do.

### Principle 2: Disguise rather than disable

Turning off telemetry is itself a risk signal. The optimal strategy is to let all signals be reported, but with the reported content being a disguised, compliant profile.

### Principle 3: Maintain consistency

All disguised signals must point to the same compliant identity. IP in New York, time zone in Los Angeles, phone number in London: that kind of inconsistency is more dangerous than no disguise at all.

### Principle 4: Maintain stability

Don't change IP, identity, or device frequently. Frequent change is itself an anomaly signal. Once you've chosen a compliant identity, keep using it long term.

---

## 3. Layered evasion plan

### Layer 1: Identity construction (registration stage)

Goal: make the registration info point entirely to a compliant region, and pass the screening at registration.

#### Phone number

```
方案：获取合规地区手机号

  选项 A：Google Voice 美国号码
    获取方式：需要一个已有的美国号码激活，或通过二手市场购买
    成本：免费（自行注册）或 $5-20（购买）
    风险：Google Voice 号段被部分平台识别为虚拟号

  选项 B：美国 MVNO 实体 SIM 卡
    服务商：Mint Mobile / Tello / Ultra Mobile 等
    获取方式：通过转运购买预付费 SIM 卡
    成本：$15-30/月
    优势：真实运营商号码，不是虚拟号

  选项 C：英国 / 日本等合规地区号码
    根据目标身份选择对应国家的号码

不要使用：
  - +86 中国大陆号码
  - +98 伊朗号码
  - 一次性接码平台号码（容易被识别）
```

#### Email

```
方案：使用国际邮箱服务商

  推荐 Gmail（最普遍）
  推荐 Outlook / Hotmail
  推荐 ProtonMail（隐私导向，但不可疑）
  推荐 自有域名邮箱

  不要用 qq.com / 163.com / 126.com / yeah.net / foxmail.com
  不要用 任何中国邮箱服务商域名

注意：
  Gmail 注册时的 IP 和语言设置也应与目标身份一致
  邮箱用户名不要包含拼音姓名
```

#### Bank card

```
方案：获取合规地区发行的支付方式

  选项 A：Wise（原 TransferWise）虚拟卡
    支持美国、英国等多国卡 BIN
    成本：开户免费，使用时有小额费用

  选项 B：Stripe Issuing / Privacy.com 虚拟卡
    美国卡 BIN

  选项 C：合规地区实体银行账户
    如果有海外关系人可协助开户

不要使用：
  - 中国银联卡（62 开头 BIN）
  - 伊朗银行发行的任何卡
  - 通过非正规渠道获取的他人银行卡（违法）
```

#### Shipping address

```
方案：使用合规地区地址

  选项 A：美国转运仓地址（如 Anytime Mailbox / US Global Mail）
  选项 B：合规地区朋友/亲属地址
  选项 C：合规地区商业虚拟地址服务
```

#### Identity consistency check

```
所有注册信息必须指向同一个国家/地区：

  一致的示例：
    手机号：美国 +1
    邮箱：Gmail
    银行卡：Wise 美国卡
    地址：美国加州

  不一致的示例：
    手机号：英国 +44
    邮箱：Gmail
    银行卡：Wise 美国卡
    地址：日本东京
    → 多国混杂，反而更可疑
```

---

### Layer 2: Network disguise (connecting IP)

Goal: make the source IP of every API request appear as a genuine residential IP in a compliant region.

#### Core requirements

```
必须满足：
  1. IP 地理归属在合规地区
  2. IP 类型为住宅 IP（不是机房/数据中心）
  3. IP 出口固定或变化范围小（同一城市/ISP）
  4. IP 归属地与注册身份地区一致
```

#### Proxy options compared

| Option | IP type | Stability | Cost | Detection risk |
|------|--------|--------|------|-----------|
| Data center VPN (ExpressVPN, etc.) | Data center IP | High | $10/month | **High — IP type detection flags it directly** |
| Residential proxy provider | Residential IP | Medium | $30-100/month | Low, but well-known providers' IP pools may be flagged |
| Self-built residential proxy (deployed at a friend's home in a compliant region) | Real residential IP | High | Hardware cost + electricity | **Extremely low — indistinguishable from a real user** |
| Compliant-region VPS + residential IP tunnel | Depends on tunnel exit | Medium | $20-50/month | Medium |

#### Optimal plan

```
优先级：
  1. 自建住宅代理（如果有合规地区的关系人）
     在朋友/亲属家部署一个小设备（树莓派等）作为代理出口
     成本低、稳定、完全不可检测

  2. 高质量住宅代理服务商
     选择不太知名的小型服务商，IP 池被标记概率更低
     务必选择“静态住宅 IP”而非“轮转住宅 IP”

  3. 机房 VPN（不推荐）
     只在其他方案不可用时作为临时过渡
```

#### Usage discipline

```
固定使用同一个出口 IP（或同一小段 IP 范围）
IP 归属地与注册信息、时区设置一致
在使用产品的全程保持代理连接

不要频繁切换不同国家的 IP
不要有时走代理有时不走（IP 地理跳变）
不要使用免费公共代理（IP 信誉极差）
```

---

### Layer 3: Environment disguise (telemetry signals)

Goal: **do not turn off telemetry**; instead, make the environment profile reported by telemetry consistent with the compliant identity.

#### System time zone

```bash
# 设置为与 IP 归属地一致的时区
export TZ="America/New_York"

# 持久化：写入 shell 配置文件
echo 'export TZ="America/New_York"' >> ~/.bashrc

# 验证
date  # 应显示 EST/EDT 时间
```

**Key point: the time zone must match the IP's geographic location.** An IP in New York with a time zone of `Asia/Shanghai` is the most common slip-up.

#### System language and locale

```bash
# 设置为英文 locale
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"
export LANGUAGE="en_US:en"

# 持久化
echo 'export LANG="en_US.UTF-8"' >> ~/.bashrc
echo 'export LC_ALL="en_US.UTF-8"' >> ~/.bashrc

# 验证
locale  # 所有项应显示 en_US.UTF-8
```

#### Linux distribution

```
高风险发行版（中国特有，直接暴露）：
  - deepin
  - UOS（统信）
  - openKylin（开放麒麟）
  - openEuler（华为）
  - EulerOS

安全发行版（国际通用）：
  - Ubuntu
  - Fedora
  - Debian
  - Arch Linux
  - macOS（最不可疑）

如果当前使用高风险发行版：
  方案 A：更换发行版（最彻底）
  方案 B：在 Docker 容器中运行 Claude Code，容器使用 Ubuntu 镜像（推荐，简单且有效）
```

#### Docker containerization plan (recommended)

```dockerfile
# 使用标准 Ubuntu 镜像
FROM ubuntu:22.04

# 设置合规环境
ENV TZ="America/New_York"
ENV LANG="en_US.UTF-8"
ENV LC_ALL="en_US.UTF-8"

# 安装必要工具
RUN apt-get update && apt-get install -y \
    nodejs npm curl git locales && \
    locale-gen en_US.UTF-8

# 安装 Claude Code
# ...
```

#### Package managers and mirror sources

```
风险点：部分遥测可能采集包管理器信息，间接暴露镜像源配置

检查并替换：
  npm：
    不要用 registry.npmmirror.com（淘宝镜像）
    应该用 registry.npmjs.org（官方源）

  pip：
    不要用 pypi.tuna.tsinghua.edu.cn（清华镜像）
    应该用 pypi.org（官方源）

  apt：
    不要用 mirrors.aliyun.com / mirrors.tuna.tsinghua.edu.cn
    应该用 archive.ubuntu.com（官方源）

命令：
  npm config set registry https://registry.npmjs.org/
```

#### Telemetry-signal disguise self-check list

```
在启动 Claude Code 前逐项确认：

  [ ] TZ 环境变量设置为合规地区时区
  [ ] LANG / LC_ALL 设置为 en_US.UTF-8
  [ ] 发行版为国际通用发行版（或使用 Docker 容器）
  [ ] 包管理器镜像源为官方源
  [ ] 终端语言设置为英文
  [ ] 代理已连接，IP 归属地与时区一致
  [ ] 未设置任何关闭遥测的环境变量
```

---

### Layer 4: Behavioral disguise (daily rhythm and usage patterns)

Goal: make the time distribution of API calls consistent with the claimed geographic location.

#### The daily-rhythm problem

```
核心矛盾：
  真实位置：中国大陆（UTC+8）
  伪装位置：美国纽约（UTC-5，即 UTC+8 减 13 小时）

  如果正常工作时间是北京时间 9:00-21:00
  对应纽约时间 20:00-08:00（前一天晚上到第二天早上）

  风控视角：一个“纽约用户”每天晚上 8 点开始工作到凌晨 → 可疑但不绝对异常
```

#### Countermeasures

```
策略 A：接受“夜猫子”画像
  很多程序员确实是夜间工作者
  纽约时间晚 8 点到凌晨的活跃不算极端异常
  只要不是严格的 UTC+8 9-to-5 模式就不太突出
  评估：中等风险，对于个人用户通常足够

策略 B：选择时差更小的合规地区
  日本（UTC+9）与中国（UTC+8）仅差 1 小时
  → 伪装为日本用户，作息几乎无需调整
  → 但需要全套日本身份（获取难度更高）
  澳大利亚东部（UTC+10/11），与中国差 2-3 小时
  评估：如果能获取对应地区身份，这是最优解
```

#### Usage pattern notes

```
正常的交互式使用模式（有间隔、有停顿）
偶尔的非工作时间使用（真实用户也会有）
合理的 API 调用频率

不要 24 小时无间断调用（明显自动化）
不要精确的整点/半点调用（脚本特征）
不要极端均匀的调用间隔（非人类行为）
```

---

### Layer 5: Handling version upgrades

```
关键操作：清除所有旧版关闭遥测的痕迹

1. 检查并删除旧环境变量
   env | grep -i telemetry
   env | grep -i otel
   env | grep -i analytics

2. 清理所有 shell 配置文件

3. 正常升级到新版本

4. 不要停留在旧版本（旧版本本身是高风险信号）
```

---

### Self-assessment of the plan's weaknesses (an honest red-team evaluation)

| Stage | Weakness | Probability of being caught |
|------|------|-----------|
| Identity construction | The issuance patterns of virtual numbers/virtual cards may be identified in bulk | Low |
| Network disguise | Residential proxy providers' IP pools may be gradually flagged | Medium-low |
| Environment disguise | Missing a field leaves the profile inconsistent | Medium (a discipline issue) |
| Daily rhythm | **Long-term statistics can reveal the real time zone; the hardest to disguise** | **Medium-high** |
| Version upgrades | New versions introduce unknown new detection methods | Unknown |
| Operational discipline | **The biggest risk — any single lapse leaves a permanent record** | **High** |

---

### Appendix B: Defender perspective — a risk-control policy design document

> This document analyzes the signal system, user segmentation, scoring model, and enforcement policy from the risk-control designer's point of view. It can help you understand "what the other side is thinking".



## 1. Goals of risk control

### Goal 1: Anti-use from non-compliant regions

Prohibit users in sanctioned/non-compliant regions (mainland China, North Korea, Iran, etc.) from using the product, to meet US export control and sanctions compliance requirements.

### Goal 2: Anti-abuse (black market)

Crack down on black-market behavior such as reverse-engineered products, bulk registration, and quota resale, to reduce economic losses.

---

## 2. Current situation and constraints

### Client forms

| Client | Description |
|--------|------|
| **Coding Agent** | Every user has it; a desktop CLI tool |
| **Mobile client** | Installed by some users, not by others |

### The source leak incident

- The current version's Coding Agent source code (`cli.js.map`) has been leaked through reverse engineering
- The leak includes the telemetry reporting logic and the methods for turning off telemetry via environment variables
- The leaked information has spread mainly in the Chinese-speaking community, and some users have already turned off telemetry accordingly

### Signals naturally visible to the server (unaffected by the telemetry switch)

Whether or not the client turns off telemetry, the server necessarily sees the following on every API request:

- Connecting IP and its geographic attribution
- IP type (residential / data center / VPN / proxy)
- TLS handshake fingerprint (JA3/JA4)
- HTTP fingerprint (header order, behavioral characteristics)
- OAuth Token and account identity
- API call parameters (model, token usage)
- Client version number
- Request timestamps

### Information already collected at registration

- Registration phone number (including country code)
- Registration email
- Payment bank card (BIN can identify the issuing country)
- Shipping address

---

## 3. User segmentation model

Along two dimensions (whether the mobile client is installed, whether telemetry is turned off), users naturally fall into four groups:

```
                      遥测开启                遥测关闭
                ┌────────────────────┬────────────────────┐
  有移动端      │  A 群：信号最全      │  B 群：移动端兜底    │
                │  识别难度：★☆☆☆☆   │  识别难度：★★☆☆☆   │
                ├────────────────────┼────────────────────┤
  无移动端      │  C 群：依赖遥测画像  │  D 群：仅剩服务端    │
                │  识别难度：★★★☆☆   │  识别难度：★★★★★   │
                └────────────────────┴────────────────────┘
```

---

## 4. The logical argument for "telemetry off" as a risk-control signal

### Geographic bias in how information spreads

After the source leak, the "turn off telemetry tutorial" spread mainly through the Chinese-speaking community. This means **the group of users who came across this information is itself not geographically uniform**.

### Asymmetry in motivation strength

| User type | Motivation to turn off telemetry | Nature of motivation |
|---------|--------------|---------|
| Users in non-compliant regions | Very strong — telemetry exposing geographic signals leads to a ban | **Survival motive** (not turning it off = ban = financial loss) |
| Privacy-conscious users in compliant regions | Moderate — prefer privacy, but leaving it on has no effect | **Preference motive** (no consequence if not turned off) |
| Ordinary compliant users | Almost none — don't know and don't care | No motive |

### Bayesian reasoning

```
P(不合规地区 | 关闭遥测)

    P(关闭遥测 | 不合规地区) × P(不合规地区)
= ─────────────────────────────────────────
              P(关闭遥测)

其中：
  P(关闭遥测 | 不合规地区) → 极高（信息触达 + 求生动机）
  P(关闭遥测 | 合规地区)   → 低（多数人不知道，知道的也缺乏强动机）
```

**Conclusion: "telemetry off" is a high-weight signal for identifying users in non-compliant regions.**

---

## 5. Version upgrade strategy: creating a screening window

### Three key actions in the new version

| Action | Purpose |
|------|------|
| **Rename the telemetry-switch environment variable** | Invalidate the old tutorials and force telemetry reporting to resume |
| **Detect and report whether the old environment variable exists** | Identify users who deliberately turned off telemetry |
| **Set a minimum version requirement** | Force all users into the new version's telemetry coverage |

### Three behaviors of users after the upgrade

**Behavior 1: upgraded to the new version + old environment variable not detected**
→ An ordinary user who never turned off telemetry; handled normally

**Behavior 2: upgraded to the new version + old environment variable detected**
→ Previously turned off telemetry on purpose; yields both a motivation signal and the restored environment profile

**Behavior 3: refuses to upgrade / stays on the old version**
→ Deliberately keeps telemetry off; the API denies service after a grace period

---

## 6. Composite scoring model

### Signal weight table

| Signal | Weight | Description |
|------|------|------|
| GPS/cell tower location in a sanctioned region | Very high (can decide alone) | The most direct geographic evidence |
| SIM card MCC in a sanctioned region | Very high (can decide alone) | Hardware-level geographic identifier |
| Residential IP in a sanctioned region | Very high (can decide alone) | A real IP, not a VPN |
| Bank card BIN from a sanctioned region | High | Geographic identifier from the financial system |
| Phone number country code from a sanctioned region | High | Needs combined judgment |
| System time zone in a sanctioned region | High | Telemetry signal; can be turned off |
| Linux distribution is China-specific | High | deepin/UOS, etc. |
| IP is VPN/data center type | Medium | Auxiliary signal |
| Email domain from a Chinese email provider | Medium | Auxiliary signal |
| Telemetry off | Medium | Not decisive alone; acts as an amplifier |
| Old telemetry environment variable detected | Medium-high | Signal specific to the new version |
| API activity rhythm contradicts IP time zone | Medium | Behavioral inference |

### Enforcement tiers

| Composite score | Action |
|---------|---------|
| **≥ 0.9** | Immediate ban, appeal channel retained |
| **0.6 - 0.9** | Feature downgrade, additional verification required |
| **0.3 - 0.6** | Flag for observation, enter the manual review queue |
| **< 0.3** | Pass normally |

---

## 7. Dedicated anti-abuse strategies

| Abusive behavior | Detection method |
|---------|---------|
| Bulk registration to hoard quota | Same IP range + close timing + similar email patterns |
| Reverse-engineered client calling the API directly | Abnormal TLS fingerprint + Challenge mechanism |
| Quota resale (one account, many users) | Same Token from multiple IPs/devices |
| Automated scripts running in bulk | Abnormal QPS + 24h non-stop + request timing with no human traits |

---

## 8. Safeguards against false positives

| Mechanism | Description |
|------|------|
| **Multi-signal cross-validation** | No ban on a single signal (except very-high-confidence signals) |
| **Tiered enforcement** | Not black-or-white; there are downgrade and verification steps in between |
| **Appeal channel** | Banned users can appeal by uploading a passport/visa/proof of residence |
| **Compliant-user whitelist** | Verified compliant users are added to a whitelist |
| **False-positive monitoring** | Continuously track the appeal success rate; a rate that is too high means the policy is too strict |
