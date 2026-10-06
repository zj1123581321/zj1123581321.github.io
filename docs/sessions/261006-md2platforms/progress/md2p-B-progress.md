# md2platforms 复制页 (md2p-B) 开发进度

## 里程碑 1：测试脚手架 + fixture + 数据加载与错误处理 (milestone-1-scaffold-and-error-handling)
- **当前阶段**：milestone-1-scaffold-and-error-handling
- **本段结论**：搭建 Playwright 测试脚手架、测试静态服务器与自造 fixture；完成页面基础布局、数据加载与错误展示逻辑（缺少 post 参数、data.json 404、schema 不符等场景均展示显式错误横幅）；测试全部通过。
- **关键决策与已否决方案**：
  - 依赖选型：`@playwright/test@1.59.1` 准确命中本机 `~/.cache/ms-playwright/chromium-1217`，完全无需在线拉取浏览器。
  - 本地静态服务：`test/server.mjs` 基于 Node 原生 `node:http` 实现，按生产约定分别映射 `/page/` 与 `/out/`，零额外三方运行时依赖。
  - 依赖隔离：在 `tools/publish/page/.gitignore` 忽略 `node_modules/` 与 `test-results/`，严格遵循修改边界。
- **下一步唯一动作**：实现微信公众号全文富文本复制与剪贴板 `text/html` (含 `id="nice"`) 读回断言。
