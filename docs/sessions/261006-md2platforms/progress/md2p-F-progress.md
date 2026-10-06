# md2p-F 进度存档（X 草稿图片字幕 + 标签页复用）

当前阶段：生成器 caption 字段已实现并通过全量单测（15/15 build），待红验后提交。

本段结论：`lib/x.mjs` 的 `pushImage` 增加可选第三参 `caption`，仅正文图片路径
（`pushContentImage`）传入「作者手写的非空 alt」，表格/代码/mermaid 段与空 alt 段不带该字段
（JSON 里直接不出现这个 key），`alt` 原样不变，`schema` 仍是 `md2platforms/v1`。
`build.test.mjs` 新增 261002 断言：4 张正文图片段 `caption` 逐字等于 alt、`x-table-001.png`
段无 `caption`；260809 既有 mermaid 断言补「无 caption」；最小 fixture（空 alt）断言无 caption。

关键决策与已否决方案：否决「把 caption 定义成空串」——契约里「没有就不出现」比空串更难被下游
误判；否决「对 alt 做 trim 后再写 caption」——公众号版 figcaption 用的是原 alt，X 字幕逐字一致
才好核对，空/纯空白 alt 才不产出 caption。

下一步唯一动作：对「表格转图段带 caption」做红验（先提交真修复再改坏、贴红、只还原那一处）。