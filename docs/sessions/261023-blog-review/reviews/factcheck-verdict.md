# 事实核查 verdict

核查日期：2026-10-23。对象：《众人拾柴火焰高：Agent 进企业，真正难的不是 Agent》（只读，以下行号指该草稿）。仅审事实与 FDE 案例；没有修改草稿或素材。

## 结论

需要改正或收窄几处客观表述，最明显的是“OpenAI、Anthropic 内部约 90% 的代码由 Agent 写”和“钉钉、企微表格能力有差距”。官方材料分别说的是不同口径的 Codex 使用量、Anthropic 合并代码作者比例；产品对比也不能概括成钉钉和企微都落后。Palantir 确实把 Forward Deployed Engineering 作为工作方法，并以 Ontology 为平台核心，但公开材料不能证明 FDE 一词最早由它发明。其余公司内部数据应标明是作者自述，历史类比和趋势判断则应写成观点。

## FDE 在国内的不同用法

三份公司/招聘方材料能说明 FDE 在国内并非统一岗位，但不足以代表整个招聘市场：

| 公司及出处 | 例子与口径 |
|---|---|
| [传音控股招聘：AI 业务部署工程师（FDE）](https://transsion.zhiye.com/campus/jobs?shareId=b3b97943-55e6-43e7-8330-154040b813c9&shareSource=2) | 按场景分层：简单场景做平台赋能，中等场景共创 Agent，复杂场景协调产品、数据、IT、AI 交付。偏业务赋能与落地。 |
| [中兴新云招聘：Forward Deployed Engineer](https://www.ztccloud.com.cn/careers/campus-forward-deployed-engineer.html) | 岗位归于咨询，深入客户识别 AI 机会、制定方案、交付项目并持续优化。偏咨询与项目交付。 |
| [遇碳科技职位：Forward Deployed Engineer](https://meet-carbon.com/about/careers/forward-deployed-engineer) | 交付中心岗位，面向客户私有环境部署模型、路由、权限和 Agent，并负责验收、培训、交接。偏技术实施与客户交付。 |

建议直接替换草稿第 15 行段落：

> 国内招聘里的 FDE 不是一个统一工种。比如传音把它用在 AI 业务赋能和 Agent 共创上，中兴新云更像帮客户找场景、做方案、交付项目，遇碳科技则强调在客户自己的环境里部署模型和 Agent。三个岗位都叫 FDE，日常工作却不一样。老板看这个岗位时，别只看头衔，先问清楚交付什么、要不要驻场、谁负责后续维护，以及最后能不能把能力留在公司里。

## 逐项核查

| 草稿行 | 原句/主张 | 结论、证据与建议 |
|---|---|---|
| 13 | “FDE…最早来自美国的 Palantir”；“给政府和大企业做数据分析”；“本体论…把现实世界的业务…建一个模型” | **需改措辞**。“最早来自”缺少可核实的发明/首用证据；Palantir 官方称其产品持续通过 Forward Deployed Engineering 与客户现场协作迭代，且 Ontology 是整合数据、逻辑、行动和安全策略的运营层。把公司称作只做数据分析过窄；“本体论”也不只是业务模型。建议改成“Palantir 官方以 FDE 描述贴近客户现场的工程方法；其 Ontology 把企业数据、业务对象、逻辑、行动与权限连起来”。[Palantir 架构说明](https://www.palantir.com/docs/foundry/architecture-center/overview)、[Ontology 说明](https://www.palantir.com/docs/foundry/ontology/overview)、[FDE 职涯介绍](https://www.palantir.com/careers/students-and-early-talent) |
| 15 | 国内“变成了一个筐，什么都往里装” | **需改措辞**。传音、中兴新云、遇碳三份招聘展示不同岗位定义；不能据此推断所有国内讨论或市场。可改成“国内招聘里，FDE 的岗位职责并不统一”，接上面的替换段落及三份招聘来源。 |
| 37 | “OpenAI 和 Anthropic…公司内部大约 90% 的代码，已经是 Agent 在写” | **有误，且口径混淆**。OpenAI 工程师 Aaron Friel 在 2025-12-03 官方论坛活动中说：“virtually every technical staff person is using Codex—like it's over 92 percent, if I recall correctly”（12 月 4 日发布）；这是技术员工使用 Codex 的比例估计，不是代码占比，且说话人明确不确定。OpenAI 2026-06-25 官方文章说平均工程师 99% 的输出 tokens 来自 Codex、全公司每周输出 tokens 的 99.8% 来自 Codex；这是 token 使用量，不等于代码由 AI 写成的比例。Anthropic 2026 年 5 月官方口径是“more than 80% of the code we merge into Anthropic’s codebase was authored by Claude”，不是约 90%。建议分公司给出原口径，并删除“写代码成本已基本解决”的因果结论或明确标作作者判断。[OpenAI 论坛活动回放](https://forum.openai.com/public/clubs/developers-and-startups-y6l6m/videos/event-replay-vibe-engineering-with-openais-codex-2025-12-03)、[OpenAI 2026-06-25 文章](https://openai.com/index/how-agents-are-transforming-work/)、[Anthropic 2026-05 文章](https://www.anthropic.com/institute/recursive-self-improvement) |
| 37、76、78、219、442、452 | “去年…今年…顶替很多顶级工程师”；领先半年/一年、Token 几乎不限；模型每年变强、决策迟早超过老板；行业数字化水平普遍不高 | **无法据此作为已证事实**。这些是时间比较、预测或行业泛化，未给可比数据。OpenAI、Anthropic 的内部采用数据不能证明领先固定半年/一年，也不证明其 token 预算“几乎不限”。建议改成“我观察到/我预计”，删去精确领先时长，或补可比指标和日期。 |
| 83、469 | XMind 联合创始人分享《分活，分圈，分钱，搞 AI》，讲从部门制转向“圈子制” | **正确**。小宇宙节目页对应此标题，嘉宾 Mango 标为 XMind 联合创始人；节目介绍明确说 XMind 从部门制转为圈子制。建议把“推荐听一下”保留为推荐语，并将链接直接指向节目页。[节目页](https://www.xiaoyuzhoufm.com/episode/6a8c42b42e27ea5b21fabac7) |
| 94 | “还没有多少成熟的行业案例” | **无法核实**。本文未定义“成熟”或行业范围；上述 FDE 招聘案例也不是企业内部 Agent 重组案例，不能反证或证实。建议限定为“我能找到的、适用于传统中小企业的公开案例还不多”。 |
| 100 | 历代改革需大量新资源分配；“北魏孝文帝改革就是一个例子” | **历史事实部分正确，因果类比证据不足**。孝文帝改革包含均田制（485）、迁都洛阳、汉化等制度变化；史料也记录改革及迁都引发反弹，但这些不能证明改革“本质上都需要大量新生资源”才能化解阻力。建议把历史例子限于“改革会触及既有利益并遭遇阻力”，把“增量业务降低组织阻力”写成本文提出的管理类比。[Wits 学术章节](https://wiser.wits.ac.za/sites/default/files/Breckenridge%20and%20Szreter%20-%202012%20-%20Registration%20and%20Recognition%20%20Documenting%20the%20Person%20in%20World%20History.pdf)、[剑桥经济史章节](https://www.cambridge.org/core/books/abs/economic-history-of-china/chinesenomad-synthesis-and-the-reunification-of-the-empire-485-to-755/08641511A95EDAEA21003E91CC1AEB88)、[Duke 学术稿](https://sites.duke.edu/hiscope/files/2022/04/Leviathan_Wang.pdf) |
| 121、125、137 | “关键业务信息都要上表”；商品全生命周期共用一张表，Agent 可读表讨论推进 | **需改措辞**。这是建议而非事实；不能推成所有信息都适合一张表，表格行数、权限、数据治理与业务系统边界均有限制。建议在“上表”前加限定：“先把跨环节、需人和 Agent 共同维护的关键状态放进可协作的数据表”。 |
| 139–144、160、168、247、249、253、259–273、289–303、325 | 商品信息来源、每日变更回访策略、外部数小时/内部两月、一个人搭公司 Agent 体系、供应链录音拍照、投放工具及 10 万到 15 万场景等 | **无法核实（作者自述或假设）**。素材能佐证部分经历：`中小企业内部Agent落地分析.txt:27` 记录“90%”判断为口述推测；`260930-思考.txt:5` 有北魏类比；`实际组织内部沟通/261021-阿甘对话02.srt:399` 有手机拍照上传并发布成应用的演示；高管的 10 万到 15 万比较是场景假设（`261021-阿甘对话01.srt:995,999,1015,1023`），不是已实现结果。第 265 行的措辞见架构讨论素材 `ChatGPT-梳理FDE分享框架-20261023-2048.md:2155`，是对话整理而非逐字录音；原始 ASR（`261021-阿甘对话02.srt:131,135`）支持其意思，但不支持引号内的逐字版本。建议取消引号或明确标为作者概括。其余业务经历应以作者自述呈现；不要从单一公司经验推出“技术上没有真正难点”或普遍因果。 |
| 150、169 | “国内最好”；大厂投入巨大，除非技术团队很强，自建系统灵活性和易用性大概率不及飞书 | **无法核实（作者观点/定位）**。第 150 行按已拍板写作决策保留；第 169 行是未经产品比较验证的判断，可标成作者经验，避免写成普遍规律。无需加“行业公认”等措辞。 |
| 154–156、162、170 | 手机拍照、表单/看板/自动化；接口和命令行工具；多层权限；附件字段仅手机拍照、发布应用“几分钟”；改字段即生效 | **部分正确，部分应限缩**。飞书有 Bitable OpenAPI、权限角色/记录和字段权限；附件字段支持限制为仅移动端拍摄上传；官方 CLI 于 2026-03-27 公布并包含 Base 能力。行数/权限和 CLI 可用性受版本、授权、配置影响；“完整接口”“都已经做好”“几分钟”“改了就生效”是绝对化或耗时判断，属具体环境/作者体验。建议写“提供相关接口、CLI 和权限能力，需配置授权；拍照上传功能可设为仅移动端拍摄，具体上线时间取决于配置”。[Bitable API FAQ](https://open.feishu.cn/document/docs/bitable-v1/faq?lang=zh-CN)、[CLI 官方更新](https://open.feishu.cn/changelog?abilityType=Tool&lang=zh-CN)、[权限角色](https://www.feishu.cn/hc/zh-CN/articles/539823920318-%E5%A4%9A%E7%BB%B4%E8%A1%A8%E6%A0%BC%E9%AB%98%E7%BA%A7%E6%9D%83%E9%99%90%E8%A7%92%E8%89%B2%E4%BB%8B%E7%BB%8D)、[记录和字段权限](https://www.feishu.cn/hc/zh-CN/articles/360049067931-%E4%BD%BF%E7%94%A8%E5%A4%9A%E7%BB%B4%E8%A1%A8%E6%A0%BC%E8%A7%86%E5%9B%BE)、[附件字段](https://www.larksuite.com/hc/zh-CN/articles/360048488232-%E4%BD%BF%E7%94%A8%E5%A4%9A%E7%BB%B4%E8%A1%A8%E6%A0%BC%E9%99%84%E4%BB%B6%E5%AD%97%E6%AE%B5) |
| 168 | 飞书有行数上限；广告数据可能有几百万行 | **需改措辞**。飞书上限正确，但应给套餐口径：官方单表上限为基础版/商业标准 2,000 行、商业专业 20,000 行、商业旗舰及企业版 50,000 行；商业版和企业版可购买扩容，部分套餐可领取扩容权益。广告数百万行是作者公司场景自述（对话素材 `261021-阿甘对话02.srt:351`），不代表一般企业数据量。[飞书行数扩容说明](https://www.feishu.cn/hc/zh-CN/articles/389918352455-%E5%A4%9A%E7%BB%B4%E8%A1%A8%E6%A0%BC%E8%A1%8C%E6%95%B0%E6%89%A9%E5%AE%B9) |
| 174 | “钉钉和企微的表格能力目前和它还有差距” | **需改措辞，现有官方资料不支持一概而论**。钉钉 AI 表格官方列出高级权限、开放接口和自动化，产品手册还记录多维表行列查看/编辑权限；腾讯文档企业版智能表官方文档列子表和行列/字段权限（企业微信生态实际使用的产品及版本应核实）。这些只证明同类产品已有相应能力，不证明功能完全等同；但“都还有差距”应删，或写成按具体团队场景比较后的个人判断。[钉钉 AI 表格](https://alidocs.dingtalk.com/product/smart-table)、[钉钉功能更新](https://alidocs.dingtalk.com/i/p/Y7kmbokZp3pgGLq2/docs/3Pl7jXNw6dBWxrxE4QQqJvKAGqOzY0D9)、[腾讯文档企业版智能表](https://cloud.tencent.com/document/product/1663/103166) |
| 178 | 有接口调接口、网页让 Agent 模拟点击、Excel 定时搬运 | **是可行方案，不是普遍保证**。网页自动化受站点登录、授权、页面变更及服务条款限制。建议把“得想办法接进来”改为“按授权、稳定性和成本选择接口、网页自动化或文件导入”。 |
| 180 | 转录所有会议“几乎零成本”，并将来成为组织最大财富 | **价值判断与成本泛化**。转录服务、存储、授权/隐私管理均可能产生成本；“最大财富”属比喻。建议“可以从重要且获准的会议开始转录归档，成本和权限按现有工具评估”。 |
| 192、219、225–235、227 | 一把手天然代表整体利益；上下文不足是多数问题；复盘/巡检能提前发现问题；员工会自然在表上协作 | **观点或条件性推论，不是可普遍核验事实**。特别是“天然”“自然”“迟早超过”等绝对措辞无证据。建议明确写为作者的工作假设，并保留“数据同步、规则明确、有人跟进”等前提。 |
| 247、249、253、281 | 外部数据数小时、内部协调两月；技术底座一人完成；Agent 落地八成组织/两成技术或 99/1 | **个人案例与估计**。以第一人称及“我这次经历里/粗略判断”呈现；不要把单个项目耗时、工作拆分比例外推至行业。 |
| 331 | “古德哈特定律：一个指标一旦被定成考核目标，它就不再是好指标了” | **需改归属和措辞**。Goodhart 原话为 “Any observed statistical regularity will tend to collapse once pressure is placed upon it for control purposes.” 常见短句“当一个度量成为目标，它就不再是一个好的度量”通常归于 Marilyn Strathern 对该思想的概括，不是 Goodhart 原文。建议写“常见的古德哈特定律转述提醒我们：指标一旦成为目标，就可能失真”。[剑桥 DAMTP 说明及出处](https://www.damtp.cam.ac.uk/user/mem2/papers/LHCE/goodhart.html)、[Wiley 对 Strathern 概括的说明](https://doi.org/10.1111/j.1740-9713.2018.01205.x) |
| 333、349、351、355、363–369 | “业务规模扩大 10 倍、人只增 2 倍”；主动学习者是少数；1–2 位架构师、3–5%积极分子；一人足够 | **目标、分层建议或作者经验，不是已验证普遍比例**。前文《老树开新花》存在相同的人员比例（`260908-smb-agent-framework/index.md:84,96`），能证实这是作者既有框架，不能证实比例普遍有效。建议清楚标为“我建议先按这个比例试排”，并把 10 倍/2 倍写成愿景目标。 |
| 391 | 同事自写 Skill；最活跃者日耗“两三亿 Token” | **作者自述，无法外部核实**。素材 `260930-思考.txt:23` 对团队 Token 使用及成本有同源记述；注明“据我团队内部用量统计”，并标清统计周期、Token 类型、系统边界，避免看成独立审计数据。 |
| 399 | “DeepSeek 的 Flash 模型”；30 人团队每日 10–20 亿 Token、月成本五六千元 | **需改措辞；业务数字无法核实**。DeepSeek 当前官方 API 模型 ID 为 `deepseek-flash`，模型列表显示名为 `DeepSeek-V4.1-Flash`。建议说明实际使用的模型 ID、供应渠道及价格时间点；团队规模、Token 和成本无法公开独立核实，可写“据团队内部统计”。[DeepSeek 模型列表](https://api-docs.deepseek.com/api/list-models/) |
| 399–404 | 便宜模型适合日常办公；顶级模型用于决策；Token 量不代表落地效果 | **经验建议/观点**，不是产品保证。不同工作任务、模型版本、上下文与价格差异很大。保留为作者方法时，避免“基本能完成日常办公任务”这种无边界判断。 |
| 452–454 | 特定行业数字化程度低、领先一点即有优势；AI 新创业者越过护城河后更有优势 | **预测与泛化判断**，没有行业数据支撑。建议加“我认为/可能”，避免写成确定结论。 |

## 来源与限制

公开核查优先使用公司官方产品/招聘/研究材料；历史判断使用学术来源。公司内部经历只能依据随卡提供的作者素材交叉定位，不能作为独立审计。最需要作者补充内部证据的数字是行 139–144 的“五六个系统”、行 160 的“回访策略一天一变”、行 249 的“两个月”、行 253 的“一人搭体系”、行 391/399 的 Token 与成本统计。上述内容若无意公开佐证，均可保留为明确的个人案例，不应包装成行业事实。
