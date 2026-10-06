# md2platforms 复制页

静态无构建链前端页面，用于读取生成器产出的 `../out/<目录名>/data.json`，在 Mac Chrome 浏览器中为微信公众号后台与 X (Twitter) 长文章编辑器提供一键复制与分段复制功能。

## 目录结构

- `index.html`：静态页结构与布局（双栏响应式设计）。
- `page.js`：原生交互逻辑（JSON 加载、公众号富文本写入、Canvas 解码转 PNG、状态追踪与错误处理）。
- `page.css`：视觉样式（支持微信绿色与 X 清爽布局、卡片状态、错误横幅）。
- `test/`：Playwright 端到端浏览器回归测试与 fixture 数据。
- `test/server.mjs`：测试专用的零依赖极简静态 HTTP 服务。

## 部署与注册 (serve.sh)

由于现代浏览器安全策略要求剪贴板写入复杂对象（特别是图片 `image/png`）必须在**安全上下文**（HTTPS 或 localhost）中运行，页面设计为通过本机 Tailscale Serve 挂载。

运行注册脚本：

```bash
tools/publish/serve.sh
```

- 该脚本会自动将 `tools/publish/` 挂载至 Tailscale 的 `/md2p` 路径（使用 `--bg --set-path /md2p`）。
- 脚本会解析自身绝对物理路径，无论在主仓还是其他环境均可安全执行。
- 脚本仅影响 `/md2p` 路由，严格隔离本机已挂载的其他服务（如根路径 `/`、`/canvas` 等）。
- 执行完毕后终端会输出形如 `https://<本机 tailnet 域名>/md2p/page/?post=<目录名>` 的访问地址。

## 访问与使用流程

在 Mac 上的 Chrome 浏览器打开对应 URL：

```text
https://<本机 tailnet 域名>/md2p/page/?post=261004-context-and-loop
```

### 1. 微信公众号发布

1. 在左侧面板点击 **「复制公众号全文」**。
2. 按钮将变为 `✓ 已复制全文`。
3. 打开微信公众号后台图文编辑器，按 `Cmd+V` 粘贴即可。已内联 Markdown Nice 兰青样式及外链脚注。

### 2. X (Twitter) 文章发布

由于 X 编辑器不自动拉取远程图片，正文需交替复制粘贴：

1. 点击顶部 **「复制标题」**：粘入 X 文章标题框。
2. 点击顶部 **「复制封面图」**（若有）：保存或粘入 X 封面图。
3. 按右侧分段列表顺序逐段操作：
   - **富文本段**：点击 **「复制第 N 段」** 后，在 X 编辑器中直接粘贴。
   - **图片段**：点击 **「复制第 N 段」**（页面会自动将 JPEG/PNG 解码并通过 Canvas 转换为剪贴板所要求的 `image/png` 格式），在 X 编辑器中直接粘贴。
4. 每段复制后卡片均会高亮显示并标记 `✓ 第 N 段已复制`，顶部徽标会实时更新复制进度（如 `3 / 10 已复制`）。

## 常见报错与排查

1. **页面显示「剪贴板写入失败: NotAllowedError」或无法复制**：
   - 必须通过 HTTPS（Tailscale 域名）或 `http://localhost` 访问，禁止直接用未经加密的局域网 IP 访问。
   - 首次点击时请注意浏览器地址栏权限弹窗，允许网页访问剪贴板。
2. **页面显示「加载失败: 未找到数据文件 ../out/<目录名>/data.json (HTTP 404)」**：
   - 请确认已成功运行生成器命令（`node tools/publish/build.mjs content/posts/<目录名>`），并在 `tools/publish/out/<目录名>/` 下生成了 `data.json`。
3. **页面显示「缺少 post 参数」**：
   - 请检查 URL query 参数，必须携带 `?post=<目录名>`。
4. **页面显示「不支持的 schema」**：
   - 数据格式必须遵循 `md2platforms/v1` 契约，若版本不符页面会显式报错拒绝渲染。

## 测试与本地验证

本地测试使用 Playwright 启动真实 Chromium 浏览器并授权剪贴板，校验完整端到端读写：

```bash
cd tools/publish/page
npm ci
npm test
```
