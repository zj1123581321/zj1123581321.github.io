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
