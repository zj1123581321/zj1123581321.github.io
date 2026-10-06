# md2p-A 进度存档（md2platforms 生成器）

## 里程碑：修复轮 1——X 段顺序错乱（commit a0b784f）

- **当前阶段**：implementing → 修复联调发现的 P1（静默出错）。
- **本段结论**：机理实证为主脑推断的精确化——不是所有图片段都不 flush，而是**纯图片段落**
  （inline children 只有 image）在旧代码里不经过任何非空 textRun，flushRun 的空 run 早退
  跳过了 flushHtml，htmlBuf 积压到下一个表格/代码/mermaid 或文末才吐出。修复：任何 image
  段 push 前无条件 flushHtml（flushBeforeImage）；图片后剩余文字落回缓冲区允许继续合并。
  新增两测试锁死：261004 image 段顺序 = 原文图片出现顺序（13 张，排除表格/代码派生 PNG）
  + 每图前一个 html 段以原文前文行结尾；最小 fixture 文字A/图a/文字B/图b/文字C →
  html(image){3} 交替。npm test 13/13 全绿；261004 重跑 31 段严格交替。
- **关键决策与已否决方案**：
  - 否决「在 pushImage 里统一 flush」：pushImage 是纯登记函数，flush 是段组装层的缓冲区
    语义，塞进去会让纯登记路径（fixture 无 browser）隐式依赖缓冲区状态；收在
    flushBeforeImage 一处。
  - 红验第一次注入过强（把 pushContentImage 也 return 掉），图片段全消（0!==13），语义
    不对，按条款换最小注入（仅跳过 flushHtml 调用）重验，两条新测试均转断言失败。
  - 锚点断言用「html 段以原文前文整行结尾」而非「末尾 20 字相等」：heading 与前一段落
    合并后 20 字窗口会横跨两块产生假红（d3 首跑即撞）。
- **下一步唯一动作**：等待主脑端到端复验（复制页真实粘贴流程）。

## 里程碑：脚手架 + 渲染链路全通（commit 90e0a36 / 2bccffc）

- **当前阶段**：implementing → 已完成生成器主体，进入收尾（回填已完成，README 收尾）。
- **本段结论**：`node tools/publish/build.mjs content/posts/<目录>` 全链路可用——
  mdnice 插件移植（span/linkfoot/table-container/li，GPL-3.0 头保留）→ 兰青 juice 内联
  → 图片三类 raw URL（percent-encode）→ 内链三态映射 → 外链转脚注 → mermaid/表格/代码
  PNG（playwright chromium-1223，对应 playwright 1.60.0）→ X html/image 交替分段 →
  未推送检查。`npm test` 11 例全绿（fixture：261004 真文 + 260809 三 mermaid）。
- **关键决策与已否决方案**：
  - 链接变换做在**源文本层**（与 mdnice「微信外链转脚注」同机制：非微信外链加 title，
    linkfoot 渲染时见 title 转脚注），不在 renderer 层改 href——保证报错带行号、行为与
    mdnice 线上一致。
  - 图片 URL 变换也在源文本层（`rewriteImagesForWechat`），markdown-it 的
    `normalizeLink` 会把 src percent-encode，X 段从 token 取 src 时做了 decode 还原磁盘路径。
  - X 段组装按 token 流处理：blockquote/list 必须整块消费（token 流是扁平的，否则内部
    paragraph_open 会被误当顶层段落拆分）；段内图片按 children 顺序切分，文本 run 包完整
    `<p>`。
  - mermaid PNG 落 `content/posts/<目录>/images/generated/mermaid-<sha256前12位>.png`
    且入库（公众号引用 raw URL，必须推送）；首次生成后未推送 → 构建按设计报缺失列表。
  - 否决：在 markdown-it renderer 层做链接/图片替换（拿不到行号，报错信息不满足卡面）。
- **下一步唯一动作**：写 README + progress 存档并提交。
