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

## 里程碑 3：X 文章分段列表渲染与富文本/图片复制 (milestone-3-x-segments-copy)
- **当前阶段**：milestone-3-x-segments-copy
- **本段结论**：实现 X 分段列表渲染（HTML 预览与图片预览）；HTML 分段复制富文本与纯文本；图片分段通过 `createImageBitmap` + `canvas` 转为 PNG Blob 后经 `ClipboardItem({'image/png': pngBlob})` 写入剪贴板（源图为 JPEG 时同样保证写入 PNG）；点击后更新卡片状态、段落按钮文字（如 `✓ 第 1 段已复制`）并联动更新 `#x-progress` 进度徽标；Playwright 真实浏览器测试成功断言 HTML 段富文本及 JPEG 源图复制后的 `image/png` 类型与大小。
- **关键决策与已否决方案**：
  - 图片转码方案：直接使用标准的 `createImageBitmap` 异步解码并在 canvas 绘制后导出 `image/png`，既高效又避免在 Chrome 剪贴板中因为 JPEG 类型被拒。
  - 进度感知：每张分段卡片独立维护 `.copied` 样式，顶部徽标动态统计已复制段数，方便用户在 X 编辑器中按顺序推进。
- **下一步唯一动作**：执行 X 图片段写入 `image/png` 的红验；随后实现标题与封面独立复制按钮及全局复制错误横幅展示。

## 里程碑 4：标题封面独立复制、已复制状态指示与错误显式化 (milestone-4-title-cover-status-errors)
- **当前阶段**：milestone-4-title-cover-status-errors
- **本段结论**：实现标题复制（text/plain）与封面图复制（经 canvas 转 PNG）；当 post 无封面时自动将按钮标记为“无封面图”并禁用；当剪贴板权限被拒时，页面非致命显式呈现 `#error-banner` 红色横幅，不吞错、不使用 alert、保持正文可见；Playwright 真实浏览器测试新增 4 个场景（标题复制、封面转 PNG 复制与无封面降级、权限拒绝错误横幅、Chromium 存在性硬断言），共 11 项用例全部通过。
- **关键决策与已否决方案**：
  - 复制错误提示：通过页面级 `#error-banner` 显示详细错误，不弹出阻断性 window.alert，保持现代 Web 交互与测试可观测性。
  - 封面处理：cover 为 null 时保留禁用态按钮，提供明确视觉反馈，避免界面元素闪烁或布局跳动。
- **下一步唯一动作**：编写 tools/publish/serve.sh 注册脚本、tools/publish/page/README.md 文档，并完成全套 Narrow-Verify 与全量回归。

## 里程碑 5：Tailscale serve 注册脚本、文档说明与全量回归 (milestone-5-serve-and-docs)
- **当前阶段**：milestone-5-serve-and-docs
- **本段结论**：编写 `tools/publish/serve.sh` 脚本，基于自身物理路径解析并使用 `tailscale serve --bg --set-path /md2p` 挂载，输出对应 HTTPS 访问样例且不干扰其他挂载；编写 `tools/publish/page/README.md` 详细记录目录结构、注册方式、发布步骤及常见错误排查；全量测试与验证命令均顺利通过。
- **关键决策与已否决方案**：
  - 域名获取：从 `tailscale status --json` 读取 `.Self.DNSName` 自动剥离末尾句点，在无网络/无登录时优雅回退为占位符提示。
  - 安全与测试隔离：不执行实际的系统级 `tailscale serve` 注册以防影响现有开发环境；保留收工干净现场。
- **下一步唯一动作**：执行 Verify-Command 与 Narrow-Verify，汇总反向红验与收尾答案，撰写最终报告。




