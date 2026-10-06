当前阶段：实现中——bridge 客户端、安全闸与 X 草稿编排代码已落盘，等待完整测试确认。

本段结论：已固定使用 `~/.kimi-webbridge/config.json` 的 `addr` 和会话名 `md2p-x-draft`；
所有 bridge 错误带 action 上抛；唯一 click 只允许命中新建文章入口，并在调用前检查目标文本与
aria-label 不含「发布」「Publish」「Post」。

关键决策与已否决方案：正文图片不在页面内 fetch 外部 URL，而是 Node 侧读生成器素材并通过
合成 `ClipboardEvent` 粘贴 `File`；图片上传完成按编辑器 `section` 数量、blob URL、图片加载完成、
自然宽度和「编辑媒体」按钮判定。未新增 fallback 或重试。

下一步唯一动作：运行 `cd tools/publish && npm test`，修复新测试暴露的问题后提交该里程碑。

当前阶段：里程碑一验证完成。

本段结论：新增 X 草稿测试通过；伪 bridge 使用本地 HTTP 服务器记录并断言了实际请求 body、
会话名、封面文件路径、HTML 原文和正文图片 base64。完整测试中新代码相关测试全通过，
既有 `build 260809` 测试因 `origin/main` 已包含其 Mermaid PNG 而未触发预期的“未推送”失败，
归类为基线继承红。

关键决策与已否决方案：不修改既有生成器、推送检查或测试来掩盖继承红；图片等待仍使用 DOM
状态判据，不以固定 sleep 代替。

下一步唯一动作：提交 bridge 客户端、安全闸、草稿编排和跨 HTTP 边界测试。

当前阶段：里程碑二——真实 bridge 联调修正。

本段结论：真实 X 页面确认 `navigate` 返回早于入口 DOM 挂载，已增加基于入口存在性的等待，再
执行安全闸和新建 click。正文合成 File 粘贴已在真实草稿中产生 `blob:https://x.com/...` 图片块，
HTML、H2、列表、引用和链接块保持顺序；一次完整联调因执行窗口超时只完成到中途，草稿已删除。

关键决策与已否决方案：真实 bridge 的 `upload` 明确返回
`upload needs Chrome's per-extension file access... Allow access to file URLs`，且 CDP
`DOM.setFileInputFiles` 也返回 `Not allowed`；不绕过文件权限、不引入 fallback，保留代码使用卡面
锁定的 `upload` 动作。此前联调创建的测试草稿均已按卡面流程删除。

下一步唯一动作：提交入口等待修正，然后用有界长命令完成真实正文全量联调并核对草稿列表。

当前阶段：里程碑三——真实正文全量联调发现并修正顺序判据。

本段结论：真实联调实际完成 14/14 个正文图片上传；最终自检发现生成器末尾两个相邻 HTML
段会被 X 合并为一个文本块，图片顺序没有错。已将自检期望侧与编辑器侧统一为连续文本块归一化，
并用新增单测锁死相邻 HTML 段场景。

关键决策与已否决方案：不把 X 对相邻 HTML 段的合法合并误判为失败；仍严格保留每个图片块的
位置和上传完成判据。失败联调草稿已删除。

下一步唯一动作：提交顺序自检修正后，重新跑一次真实正文全量联调并保存成功 URL、截图和最终草稿
列表对照。

当前阶段：实现与联调收尾。

本段结论：第二次真实正文全量联调成功，预检为 14 个正文图片段、18753 字，实际完成 30 个
正文段，14 个图片块均满足上传完成判据，顺序自检通过；标题为「吃一堑，长一智：Agent 时代的
两个关键词 Context 与 Loop」。截图已保存到 delegate report 同目录的 `x-draft-editor.png`。
成功测试草稿及此前失败测试草稿均已删除，开工前后草稿列表均为 0 条且无标题；bridge 会话已关闭
5 个标签页。

关键决策与已否决方案：封面真实上传仍被本机 Chrome 文件访问权限阻断：
`upload needs Chrome's per-extension file access... Allow access to file URLs`，CDP
文件输入也返回 `Not allowed`。代码保持卡面锁定的 bridge `upload`，没有用页面脚本 fallback；
因此封面真实验收待开启该权限后由主脑复核。

下一步唯一动作：提交 README、设计更新和本进度存档，生成最终报告并保留继承红与封面权限偏差。

当前阶段：修复轮 1——封面改走合成 File，并拆开 260809 对远端推送状态的依赖。

本段结论：封面不再调用 bridge `upload`；与正文图一样在页面内还原 File，赋给封面
`input[type=file]` 后等「编辑媒体」对话框、「应用」经安全闸、以及 pbs.twimg.com 封面图。
260809 的 mermaid 三块与 raw URL 断言保留；未推送失败改由临时 git 仓构造，不再被 origin/main
已含 mermaid PNG 带绿或带红。

关键决策与已否决方案：不把 Chrome 文件访问权限当验收前提；不改 `lib/push-check.mjs` 语义；
正文粘贴、等待、自检逻辑保持不动。

下一步唯一动作：单测全绿后提交，再跑完整 `x-draft.mjs` 含封面的真实联调。

当前阶段：修复轮 1——260809 未推送断言改为临时仓。

本段结论：`npm test` 19/19 全绿。未推送失败用独立 git 仓构造，260809 只锁 mermaid 三块与 raw URL。

关键决策与已否决方案：git 调用禁用 hooksPath 并清空 GIT_DIR，避免共享 worktree 的 reference-transaction 钩子拦临时仓。

下一步唯一动作：红验未推送用例后，跑含封面的真实 x-draft 命令。

当前阶段：修复轮 1——封面对话框判据按真实 DOM 放宽。

本段结论：真实封面 File+change 已弹出媒体编辑层，但层是 `[role=dialog]` 且
`aria-label`/`name` 为空、`innerText` 含「编辑媒体 应用」。等待与标记改为
innerText 包含「编辑媒体」；点「应用」后封面 `pbs.twimg.com` 图 naturalWidth=1200。
`npm test` 19/19 仍绿。失败半成品草稿 2107429440800309248 已删除，列表回到空。

关键决策与已否决方案：不改正文粘贴/等待/自检；不把 `aria-label="编辑媒体"` 当封面层硬条件。

下一步唯一动作：提交对话框判据后跑完整含封面的 `x-draft.mjs`。

当前阶段：修复轮 1——HTML 落盘后再贴图，防止图片块回退。

本段结论：含封面的全量跑封面已成功，但正文 14 图无法同时留在编辑器里：相对 `beforeCount+1`
在前图被后续 HTML 挤掉后仍会判过，自检只看到 8–9 张。HTML 段改为等待文末指纹进入且
`imageSectionCount` 等于已完成图片数；图片等待改为绝对张数。粘贴手法、图片 ready 四项判据、
自检比对函数未改。`npm test` 19/19。

关键决策与已否决方案：不把 X 图片上限写成 9（追加第 10 张正文图成功）；不用固定 sleep。

下一步唯一动作：提交后重跑含封面的完整 `x-draft.mjs`。

当前阶段：修复轮 1 收尾——含封面全量联调通过。

本段结论：`node tools/publish/x-draft.mjs content/posts/261004-context-and-loop` 成功，草稿
`https://x.com/compose/articles/edit/2107433888780083200`，标题正确，封面 pbs 图
naturalWidth=1200，正文 14 张图均为 blob 且带「编辑媒体」，块序列自检为 14 个 IMG 交替。
截图 `x-draft-editor.png`。该草稿已删除，列表回到「你的草稿在这里」，会话已 close_session。
未触达 X 图片上限，已测封面 1 + 正文 14。红验安全闸、段顺序、未推送均为 AssertionError。

关键决策与已否决方案：封面对话框按 innerText 匹配；HTML 落盘等待保留，不引入固定 sleep 或
图片上限常量。

下一步唯一动作：提交文档与进度存档并 push。
