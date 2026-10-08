# 新加坡住宅 IP 出口方案：从硬件到软件

> 已脱敏：IP、域名、账密、日期等信息均已隐去或相对化处理，用占位符代替

**一句话**：在新加坡朋友家放一台低功耗无风扇小主机（2G 内存、32G 盘就够），经 Tailscale 把它的家用宽带 IP 作为 AI 工具的唯一出口；国内开发机通过一台独立网关接入，对服务方呈现为**稳定、单一的新加坡住宅身份**。出问题时宁可断网，也不泄露国内 IP。

---

## 1. 背景与目标

为什么要做：

- Claude Code、Codex 等工具走机场轮换节点时，IP 频繁跳地区、跳机房，是最强的风控信号之一。
- 机场节点多为数据中心 IP，信誉检测里常被标为 hosting/proxy；住宅 IP 不会。
- 缺的是「新加坡的 IP」，不是「新加坡的算力」，所以海外只放一台最瘦、最不容易坏的网关。

三条设计红线：

1. **地理一致**：服务方能观测到的 IP、DNS 解析器、时区、WebRTC/STUN 结果全部指向新加坡；做不到一致的通道直接封掉（fail closed）。
2. **可断网，不可泄露**：网关任何组件重启、崩溃的空窗期，流量只能失败，不能回落到国内出口。
3. **远程可救**：机器在海外，任何故障都要能在国内远程修好，尽量不麻烦朋友。

当前状态：已在新加坡朋友家上线，落地为当地运营商的家庭宽带，本地带宽 500+ Mbps；上线首日 22 小时监测中主机 1297/1297 次在线，公网 IP 未变。

---

## 2. 整体架构

```
 国内 LAN                                                  新加坡朋友家
┌──────────────────────────────────────┐                ┌─────────────────────────────┐
│                                      │                │                             │
│  开发机                               │                │  SG 出口节点 (Debian 13)     │
│  · 默认网关 = 网关                    │                │  · microsocks  (仅绑 TS IP)  │
│  · DNS = 网关:5354                    │                │  · dnsmasq     (仅绑 TS IP)  │
│  · Chrome: 禁非代理 UDP / 关 DoH      │                │  · Tailscale                 │
│  · TZ=Asia/Singapore, locale en-SG    │                │        │                     │
│        │                              │                │        ▼                     │
│        ▼                              │   Tailscale    │  家用路由器 → 当地宽带        │
│  独立网关 (OpenWrt VM)                │  (WireGuard)   │        │                     │
│  · OpenClash/mihomo: TCP 全量→SOCKS5 ─┼──── DERP sin ──┼──▶  公网出口 = 住宅 IP       │
│  · dnsmasq :5354 → SG dnsmasq ────────┼────────────────┼──▶                          │
│  · 策略路由 kill switch               │                │                             │
│  · UDP 除白名单外全丢                 │                │  Pico KVM（同 LAN，独立联网） │
│                                      │                │  · 看屏幕/敲键盘/虚拟光驱    │
└──────────────────────────────────────┘                │  · Cloudflare Tunnel 兜底    │
                                                        └─────────────────────────────┘
```

关键取舍：

- **不用 Tailscale exit node 整机切**。exit node 只能替换默认路由、无法分流，而且开发机自己的 tailscaled 到 SG 的路径质量差（见第 7 节）。改为在 SG 上开 SOCKS5（仅绑 Tailscale IP，WireGuard 已加密无需再套协议），由国内网关统一决定流量怎么走。
- **单独一台网关只服务一台开发机**，不和其他机器共用分流规则，规则可以收得很死。
- exit node 能力保留在 SG 节点上，作为「整机 SG 上下文」的备用方案。

---

## 3. 硬件清单

这台机器的负载非常轻：只跑 Tailscale、一个 SOCKS5 和一个 dnsmasq。**在运行中的节点上实测：内存占用 644 MB，磁盘占用 1.9 GB，负载 0.00**（tailscaled 是最大的进程，约 150 MB）。吞吐的瓶颈在回国线路，晚高峰只有个位数 Mbps，闲时几十 Mbps，远到不了 CPU 的上限。

所以选硬件只看两件事：**少坏**，以及**坏了能远程救**。性能够用就行，多出来的配置不会提升稳定性。

### 3.1 最小可行配置

| 部件 | 最低要求 | 我们实际用的（超配） | 说明 |
|---|---|---|---|
| CPU | 任意 x86 低功耗四核（N100 / N95 / J4125 级别），TDP ≤ 10W | Intel N150（6W） | WireGuard 加密在这个级别的 CPU 上能跑到几百 Mbps，远超回国线路的上限。选 x86 是为了 Debian 原生驱动、硬件看门狗、能接 KVM 看 BIOS |
| 内存 | **2 GB**（4 GB 更宽裕） | 16 GB DDR4（复用闲置） | 实测只用 644 MB。可插拔或板载都行；板载的话坏了只能整机换 |
| 系统盘 | **32 GB** SSD | 128 GB NVMe（复用闲置） | 实测只用 1.9 GB。要可更换（M.2 / mSATA / 2.5"），**不要选板载 eMMC**：焊死、寿命低，坏了远程没救 |
| 网口 | 1 个千兆 | 4 × Intel I226-V | 只要 1 个口接上家里路由器。选 Intel 或 Realtek 主流网卡，Linux 主线内核自带驱动 |
| 散热 | 无风扇 | 无风扇金属壳 | 风扇是长期运行最容易坏的部件 |
| BIOS | **支持来电自启** | ✓ | 硬性要求，断电重插后能自动开机 |
| 电源 | 原装适配器，按目的地插头规格买 | 12V DC，英规 Type G | |

结论：**一台几百元的二手 J4125 / N100 小主机，配 4 GB 内存和 32–64 GB SSD，就够了。** 我们用 N150 + 16G + 128G，只是因为手上正好有闲置的内存和硬盘，并不是需要这么多。

ARM 小板（树莓派、R2S/R4S 一类）性能也够用，但用 SD 卡/eMMC，没有 HDMI 可以看 BIOS，也没有标准的硬件看门狗，远程救援能力明显更弱，不推荐放在海外无人值守。

### 3.2 救援配件（按优先级）

| 优先级 | 物件 | 作用 | 不买的后果 |
|---|---|---|---|
| **必需** | 备用电源适配器 ×1 | 外置电源最容易先坏，朋友换一下就好 | 电源坏了要重新买、重新寄 |
| **强烈建议** | IP-KVM（Pico KVM / JetKVM / NanoKVM 一类，几百元） | 远程看屏幕、敲键盘、挂虚拟光驱重装系统 | 卡在 BIOS、GRUB、开机自检时完全无法处理 |
| **强烈建议** | KVM 控主机通断电的电源控制线（或智能插座） | 远程硬断电重启 | 死机、panic 后只能请朋友手动拔电（我们就踩了这个坑，见下） |
| 可选 | 冷备 SSD + 硬盘盒 | 系统盘物理损坏时，让朋友换一块 | 再买再寄，等两周左右 |
| 可选 | 5 口小交换机 | 现场只有一个网口时，让主机和 KVM 各自联网 | 看现场条件 |
| 可选 | 恢复 U 盘 | KVM 的虚拟光驱已能重装，U 盘只是冗余 | 基本无影响 |

最省钱的方案：**主机 + 备用电源 + 智能插座**。没有 KVM 时，靠硬件看门狗、来电自启和智能插座断电这三样，能覆盖大多数故障；但遇到卡在 BIOS 或系统盘损坏，就只能找朋友帮忙。

### 3.3 寄出前验收

**国内 5 分钟就能做完的事，寄到海外就要两周。** 复用的旧件尤其要验：

- memtest86+ 跑一晚（我们的结果：8h45m / 6 pass / 0 错误；用 `apt install memtest86+` + `grub-reboot` 远程跑，不用插 U 盘）。
- 确认 SSD 的接口类型和 SMART 健康度（M.2 SATA 和 NVMe 外形一样，有的板子只认其中一种）。
- 记录满载和闲置时的温度基线（我们的结果：CPU 满载 79°C 后不再上升；NVMe 65°C）。
- 实测来电自启、KVM 虚拟光驱装机，以及主机断电时 KVM 是否仍然在线。

> **最大遗憾：电源控制线没接就寄出了。** 国内做故障注入时发现，内核 panic 后看门狗能让系统重启，但**网卡和整个 USB 控制器都不恢复**（插上真实的物理键盘也没反应），只有硬断电才能救回来。接上电源控制线，一个动作就能同时解决这两个问题。没接的话，遇到这种情况只能请朋友手动拔电。如果要复刻，这根线（或智能插座）应该当作寄出前的硬门槛。

---

## 4. 新加坡节点软件

### 4.1 系统

- **Debian 13 (trixie) netinst，无桌面**，内核 6.12 LTS 原生支持 Intel 低功耗平台的网卡（如 I226 的 `igc`）和看门狗 `iTCO_wdt`，**不装 backports 内核**（纯增风险面）。
- 分区：单个 ext4 `/` + ESP，**无 LVM、无全盘加密**。LUKS 和「来电自启 + 看门狗 + 远程硬重启」直接冲突，一次跳电就要人输密码；正解是这台机器不放敏感数据。
- 板载 WiFi/蓝牙 blacklist 禁用；SSH 只走公钥；journald 改 persistent（无远程断电时，重启前的日志必须落盘）。
- 看门狗：Intel 平台自带 `iTCO_wdt` + systemd `RuntimeWatchdogSec`；BIOS 里的 ITE 看门狗**不要开**。
- DHCP 客户端注释掉 `option host_name`，否则会被朋友路由器把主机名改掉。
- `/etc/gai.conf` 优先 IPv4，否则出口走 IPv6 临时地址，天天变。

### 4.2 全自动装机

- **preseed 定制 ISO + KVM 虚拟光驱**，13 分钟零交互装完；ISO 常驻 KVM 存储，远程重装只需挂载一行命令。
- 职责边界：preseed 只负责「装到能 SSH」，其余全交给幂等的 provisioning 脚本（支持只验收不改动、按模块单跑）。
- **绝不把 Tailscale auth key 烤进 ISO**：auth key 最长 90 天，ISO 的价值恰恰是半年后还能用。
- 打包 ISO 要在和 KVM 同局域网的机器上做：跨地域传 940MB 只有 374 KB/s，同网段 7.3 MB/s，差 20 倍。

### 4.3 Tailscale

- 显式 `--accept-dns=false`：否则 MagicDNS 接管解析，流量从 SG 出去但 DNS 绕回国内。
- 显式 `--accept-routes=false`：否则吃下家里子网路由，流量经 SG 又被拉回国内。
- tagged 设备默认不过期，不用去控制台手动关 key 过期。
- ACL 的 `autoApprovers` 要用 `exitNode` 字段，在 `routes` 里写 `0.0.0.0/0` 对 exit node **完全不生效**。
- 冷备盘用整盘 `dd` 保留完整 Tailscale 身份，不要指望到时候用 auth key 重新注册。

### 4.4 对外服务（都只绑 Tailscale IP）

| 服务 | 作用 | 访问控制 |
|---|---|---|
| microsocks（SOCKS5） | AI 流量的出口 | 只绑 TS IP + 账号密码 |
| dnsmasq | 让 DNS 解析也发生在新加坡 | 只绑 TS IP，nftables 只放行网关的 TS IP |
| iperf3（监测期） | 带宽测试 | 只绑 TS IP |

### 4.5 带外管理与自愈

KVM 的四种能力全部可以纯命令行（SSH + shell）操作，因此能脚本化、交给 agent：

| 能力 | 状态 | 备注 |
|---|---|---|
| 看屏幕 | ✅ | 停掉 KVM 视频服务 → `v4l2-ctl` 抓帧 → ffmpeg 转 PNG；主机无 HDMI 输出时绝不能抓，会卡死进程 |
| 敲键盘 | ✅ | 直接写 HID 设备（`dd bs=8`）；**必须配合抓屏做反馈闭环**，盲打不可靠 |
| 虚拟光驱 | ✅ | BIOS 识别为 `UEFI: KVM Virtual Media`，已用它装机 |
| 控电源 | ❌ | 电源控制线没接 |

连进 KVM 本身有三层互相独立的路径：KVM 自己的 Tailscale → 经主机跳板 → **Cloudflare Tunnel + Access**（KVM 固件自带 cloudflared，网页终端就是一个 root shell，完全不依赖 Tailscale 和主机）。

注意：这台 KVM 是百元级 Pico 尺寸的硬件，刷的是开源移植版固件，**与上游官方固件不兼容、不能刷**；已全量备份固件、封掉第三方 OTA 域名、关自动更新。

自愈：定时器检测出网，失败时先确认 tailscaled 也不在 Running 才重启（只要控制面活着就能 SSH 进去查，此时重启是纯伤害）。

---

## 5. 国内网关

一台 OpenWrt + OpenClash（mihomo 内核）虚拟机，只服务一台开发机。

### 5.1 流量

- SG 节点以 SOCKS5 形式注入 OpenClash 配置（用覆写脚本注入，不手改面板配置）。
- 「新加坡全局」模式默认开启：开发机的 TCP 全部 REDIRECT 进 mihomo 的专用 listener，子规则只有两条：
  - 国内软件源镜像（清华 TUNA）→ 直连
  - 其余全部 → SG 住宅（嗅探不到域名时也保守走 SG）
- 私网、Tailscale CGNAT 段不进代理。
- 开关脚本有 `on | off | status | ensure`；`off` 只写临时标记，重启后自动恢复 on；OpenClash 重启会把自己的规则插到前面，所以由防火墙钩子调用 `ensure` 重新置顶。
- 开发机侧通过受限 SSH key（forced command，只能 on/off/status）在桌面面板上一键切换和显示状态。

### 5.2 DNS 也在新加坡解析

```
开发机 systemd-resolved (DNS=网关:5354, 无 FallbackDNS)
   → 网关 dnsmasq :5354 (唯一上游 = SG, 无回落)
      → Tailscale → SG dnsmasq → 新加坡本地解析器
```

- 网关还把开发机发往任意 `:53` 的请求 NAT 到 5354，防止程序自带 DNS。
- 开发机 `netplan use-dns=false`、`tailscale set --accept-dns=false`。
- 验证：用 `edns.ip-api.com` 这类随机子域探测，解析器显示为新加坡。

### 5.3 网关自己怎么连到 SG

这是最费劲的部分。新加坡家宽回程到国内电信/联通会**绕美国**（实测 SG→电信 ~263ms 沿途高丢包），而 SG→香港只有 35ms 且干净。最终做法：

- 网关的 tailscaled 禁用 UDP 直连（OUTPUT 丢 41641 源端口），并屏蔽国内自建 DERP，**强制走 Tailscale 官方新加坡 DERP**。
- 到新加坡 DERP 的 IP 段在 OpenClash 里走机场新加坡节点（规则必须排在 `tailscale.com → DIRECT` 之前）。
- 效果：直连/国内 DERP 中转时 SG 回程只有 0.7 Mbps，改后下行 11–14 / 上行 8.6 Mbps，RTT 60–120ms。
- 改完 OpenClash 后要 `tailscale debug break-derp-conns`，否则旧 DERP 连接留在旧路径上。

---

## 6. 防泄露设计（可断网，不可泄露）

| 层 | 机制 | 防的是什么 |
|---|---|---|
| 1 主防线 | **策略路由**：`ip rule` 私网/Tailscale 端口查 main 表，其余**来自 LAN 口的转发一律 unreachable**（v4/v6 都有） | OpenClash 停止或重启时撤规则，网关 forward+masquerade 会让流量直接走国内 IP |
| 2 第二层 | iptables `FORWARD` 链 `leak_guard`：白名单外 LOG + REJECT；ip6tables FORWARD 全拒 | 策略路由之外的兜底 |
| 3 | 网关 `send_redirects=0`，开发机拒收 ICMP 重定向 | 空窗期 ICMP 重定向会把开发机直接引到国内路由器 |
| 4 | 开发机 `use-routes: false`，没有回退默认路由 | 网关挂了自动走旧网关 |
| 5 | 开发机 UDP 除 DNS/NTP/Tailscale/私网外全丢 | QUIC 绕过 TLS 嗅探；WebRTC/STUN 暴露真实出口（SOCKS5 不带 UDP） |
| 6 | 开 sniffer，但 `override-destination=false` + 跳过 `tailscale.com` | Cloudflare 共享 IP 被后解析的域名覆盖导致 AI 流量走错出口 |
| 7 | Chrome 策略：`WebRtcIPHandling=disable_non_proxied_udp`、`DnsOverHttpsMode=off` | 浏览器层的 WebRTC 与 DoH 旁路 |
| 8 | 开发机时区 `Asia/Singapore`、Chrome 语言 en-SG | 应用层地理一致 |

为什么策略路由是主防线：实测 fw3 重启时 iptables 的 `leak_guard` 会短暂消失（60 次采样 24 次不在）；而 fw3 和 OpenClash 都不碰 `ip rule`。另外 OpenWrt 的 netifd 启动会清空 `ip rule`，所以策略路由要用较晚的 init 顺序 + `hotplug.d/iface` 钩子重新下发。

**压测方法**：开发机每 3 秒探测一次出口 IP，同时依次做「正常 / 防火墙重启 / OpenClash 重启 / OpenClash 停 60 秒」，全程统计非预期 IP 次数。结果 **0 次**；空窗期 AI 请求为失败（fail closed）。

---

## 7. 监控与运维

| 监控 | 位置 | 频率 | 内容 |
|---|---|---|---|
| 主机资源 | Beszel | 持续 | CPU/内存/温度/掉线告警（hub 填 Tailscale IP，机器会搬家） |
| SG 自检 | SG 本机 | 每分钟 | 出网、Tailscale 状态、DERP、公网 IP 是否变化 |
| 出口一致性 | 开发机 | 每 10 分钟 | AI 域名出口 IP、通用出口 IP、DNS 解析器地理位置、STUN 结果；状态 OK / DOWN / ALERT_LEAK / ALERT_UDP / ALERT_DNS |
| 链路质量 | 网关 | 每小时 | 走哪个 DERP、RTT、5MB 下载速度 |
| 带宽 | 多点 | 每小时 | 小流量测速（全天约 2–3GB，防对端 ISP 风控） |

实测数据（上线后首个 22 小时）：

- SG 本地宽带全天 500+ Mbps，瓶颈全在回国段。
- 晚高峰 20:00–00:00 所有回国路径都塌（直连下行 0–7 Mbps）。
- 一条国内电信线路直连 SG：SG→电信方向固定 8–18% UDP 丢包，TCP 下行塌到约 0；另一条联通线路直连双向 0% 丢包。
- SG→国内移动走 CMI 直连香港 43ms 0% 丢包；**病灶在当地运营商到国内电信/联通的回程路由**。
- 后续优化方向：自有香港优化线路 VPS 做 mihomo 链式中转（`dialer-proxy`），SG→HK 段很干净。

---

## 8. 踩坑记录

**硬件 / 带外**

- panic 后网卡和 USB 控制器都不恢复，只能硬断电 → 电源控制线是寄出前硬门槛。
- 运输后 KVM 的 USB 线松了，主机 dmesg 刷 `error -71/-110`，而 **KVM 侧 UDC 状态显示 configured 是假的**；判断 USB 是否可用要看主机 `lsusb`。
- UDC 卡死时**不要软重启 KVM**，`reboot -f` 后直接起不来，只能物理断电。
- 主机无 HDMI 信号时抓帧会进入 D 状态，`kill -9` 都杀不掉。

**自愈 / 健康检查**

- 出网探测写了 `curl https://8.8.8.8`，而 8.8.8.8 根本没有 HTTPS 服务 → 必然失败 → 每 30 分钟误重启一次。**探测目标要先手动验证真的会返回响应**；自愈机制本身可能就是故障源。

**Tailscale**

- `autoApprovers` 要用 `exitNode` 字段，`routes` 里写 `0.0.0.0/0` 不生效。
- `--accept-dns=false` 和 `--accept-routes=false` 都要显式写。
- `status --json` 的 Peer.Addrs 恒为 null，别当证据；空闲后首个 `tailscale ping` 会先走 DERP，会干扰测速。

**OpenClash / 网关**

- redir-host 模式靠 IP→域名映射；访问过 DERP 域名后，后续 DERP 连接会命中 `DOMAIN-SUFFIX,tailscale.com,DIRECT`，路径悄悄回退。
- sniffer 默认 `override-destination=true` 会让 IP-CIDR 规则失效，要关掉并跳过 `tailscale.com`。
- `/etc/init.d/openclash stop` 会把 `enable` 置 0，之后 start 直接退出，要先 `uci set openclash.config.enable=1`。
- OpenClash 重启后约 20 秒内 AI 请求会失败（DERP 重建前），属于预期的 fail closed。

---

## 9. 复刻清单

前置条件（任一不满足方案作废）：

- [ ] 海外有人愿意长期挂一台设备，**知情同意**它跑隧道流量
- [ ] 落地网络无 802.1X / portal 认证（无人值守机器会被反复踢下线）

国内准备：

- [ ] 采购：x86 低功耗小主机（≥2G 内存 / ≥32G 可换 SSD / 支持来电自启）+ 备用电源；建议加 IP-KVM
- [ ] **接好远程断电手段（KVM 电源控制线或智能插座）**
- [ ] memtest 跑一晚、确认 SSD 接口与 SMART、记录温度基线
- [ ] BIOS 开来电自启，关 ITE 看门狗
- [ ] 制作 preseed ISO（不含 auth key），放进 KVM 存储
- [ ] 跑 provisioning 脚本：Tailscale（accept-dns/accept-routes=false）、看门狗、自愈、persistent journald、关 DHCP hostname
- [ ] 配好 KVM 三层访问路径（Tailscale / 主机跳板 / Cloudflare Tunnel + Access）
- [ ] 故障注入：panic、停 tailscaled、改坏 GRUB 用 KVM 救、断电验证来电自启
- [ ] 连续通电 72 小时 burn-in
- [ ] `dd` 克隆冷备盘，apt 源切回官方，给朋友写一页纸说明

落地后：

- [ ] 确认公网 IP 类型（住宅 / 机构）、信誉（proxy/hosting=false）
- [ ] 重测 Tailscale 选路，确认回国路径质量
- [ ] SG 上开 SOCKS5 + dnsmasq（只绑 TS IP）
- [ ] 国内起独立网关：注入 SG 节点、全局模式、DNS 中继、策略路由 kill switch、UDP 封堵
- [ ] 开发机：网关、DNS、时区、Chrome 策略、无回退路由
- [ ] 跑防泄露压测（重启 / 停止网关组件全程 0 泄露）
- [ ] 上监控与告警

账号层（卡、手机号、多设备登录）无法靠网络解决，需要自律：**切到新加坡后不要频繁切回国内 IP 登录同一账号**，地理横跳是最强风控信号。
