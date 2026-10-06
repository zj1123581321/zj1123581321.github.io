# md2p-A 进度存档（md2platforms 生成器）

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
