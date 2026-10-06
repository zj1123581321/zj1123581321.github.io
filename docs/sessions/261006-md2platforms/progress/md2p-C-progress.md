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
