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

当前阶段：X 字幕交互与标签页复用已实现，单测全绿（25/25），红验完成，真实账号联调通过。

本段结论：字幕交互按实测 DOM 实现——图片块结构是 `section > 包装 div > （图片区 + 字幕入口）`，
字幕入口是该包装 div 的最后一个子元素（占位文案「提供字幕（可选）」或已有字幕），先用 evaluate
给它打 `data-md2p-caption-open="1"` 再走 `safeClick`；对话框是 `[role="dialog"]`，内含的是
Draft.js 的 contenteditable（**不是 textarea**，与卡面描述不同），bridge `fill` 能触发它的
React/Draft 状态（返回 `mode: "contenteditable"`），保存按钮同样先打
`data-md2p-caption-save="1"` 再 `safeClick`。完成判据 = 字幕对话框消失 + 该图片块 innerText
含字幕原文。标签页：先 `list_tabs`，有则 `find_tab('https://x.com')` 后 `navigate`（不带
`newTab`），没有才 `newTab:true` + `group_title`；运行结束不关标签页。

关键决策与已否决方案：实测 1200 字字幕不被截断（60/100/120/135/200/500/1000/1200 全部原样落盘），
因此**不设**长度上限与预检 fail fast——凭空写一个上限只会把合法长说明挡在门外；否决「每次运行
重新 find 字幕入口选择器并直接 click」——正文会同时存在多个图片块，必须先按结构定位再打标记，
否则会点错图；否决「先探测对话框再决定要不要字幕」——无第二消费者。

下一步唯一动作：主脑验收。

当前阶段：红验与真实联调完成，待主脑验收。

本段结论：两次红验均为断言失败型——（1）给表格段加上 `caption` 后
`build.test.mjs` 报 `AssertionError: 表格转图段不应带 caption：assets/x-table-001.png`；
（2）复用分支里给 `navigate` 加回 `newTab: true` 后
`xdraft.test.mjs` 报 `AssertionError: 已有标签页时不应再开新标签页`；另加一次「删掉保存按钮标记」
的红验，报 `安全闸找不到 click 目标：[data-md2p-caption-save="1"]`，说明伪 bridge 只在 mark 过之后
才认这个选择器。真实账号联调（261002，5 图 4 字幕）：连续跑两次均复用同一标签页（`list_tabs`
前后都是 1 个 tabId 1038025871），4 条字幕与原 alt 逐字一致，表格图 `caption=null`；
自建 4 篇测试草稿已全部删除，草稿列表恢复为开工时的 1 篇用户草稿。

关键决策与已否决方案：字幕点击/保存沿用既有「标记 + 安全闸 probe + click」三步，与封面「应用」
按钮同一套机制；未新增重试与 fallback；未动粘贴手法、上传判据、段序自检与节奏停顿。

下一步唯一动作：主脑合并后按真实草稿检查 4 条字幕的呈现效果（尤其长字幕是否换行好看）。