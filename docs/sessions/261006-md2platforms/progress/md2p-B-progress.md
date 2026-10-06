# md2platforms 复制页 (md2p-B) 开发进度

## 里程碑 1：测试脚手架 + fixture + 数据加载与错误处理 (milestone-1-scaffold-and-error-handling)
- **当前阶段**：milestone-1-scaffold-and-error-handling
- **本段结论**：搭建 Playwright 测试脚手架、测试静态服务器与自造 fixture；完成页面基础布局、数据加载与错误展示逻辑（缺少 post 参数、data.json 404、schema 不符等场景均展示显式错误横幅）；测试全部通过。
- **关键决策与已否决方案**：
  - 依赖选型：`@playwright/test@1.59.1` 准确命中本机 `~/.cache/ms-playwright/chromium-1217`，完全无需在线拉取浏览器。
  - 本地静态服务：`test/server.mjs` 基于 Node 原生 `node:http` 实现，按生产约定分别映射 `/page/` 与 `/out/`，零额外三方运行时依赖。
  - 依赖隔离：在 `tools/publish/page/.gitignore` 忽略 `node_modules/` 与 `test-results/`，严格遵循修改边界。
- **下一步唯一动作**：实现微信公众号全文富文本复制与剪贴板 `text/html` (含 `id="nice"`) 读回断言。

## 里程碑 2：微信公众号全文复制实现与剪贴板断言 (milestone-2-wechat-copy)
- **当前阶段**：milestone-2-wechat-copy
- **本段结论**：实现微信公众号全文复制功能；通过 `ClipboardItem({'text/html': ..., 'text/plain': ...})` 写入剪贴板；点击后按钮更新为 `✓ 已复制全文` 状态与 `.copied` 样式；Playwright 真实浏览器测试成功读回剪贴板 `text/html` 并断言包含 `id="nice"` 及标题正文。
- **关键决策与已否决方案**：
  - 富文本剪贴板格式：同时写入 `text/html` 与从 DOM 提取的 `text/plain` 纯文本，确保在不支持富文本的目标应用中也能优雅降级。
  - 错误展示：复制操作失败时展示非致命错误横幅，不隐藏已加载的正文视图。
- **下一步唯一动作**：执行公众号复制断言红验（确认改坏后测试真红），随后实现 X 分段（html / image）复制功能与 canvas PNG 转换。

