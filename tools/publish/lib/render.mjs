// playwright 统一渲染：mermaid / 表格 / 代码块 HTML → PNG。
// 本机 ~/.cache/ms-playwright 已有 chromium-1223（对应 playwright 1.60.0，见 package.json）。
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

export async function launchBrowser() {
  const { chromium } = await import('playwright');
  return chromium.launch();
}

// mermaid 源码 → PNG buffer。主题 default（白底），与手工渲染一致。
export async function renderMermaidToPng(browser, source) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
  try {
    await page.setContent('<!doctype html><html><body style="margin:0;background:#fff"></body></html>');
    const mermaidDist = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'node_modules/mermaid/dist/mermaid.min.js'
    );
    await page.addScriptTag({ path: mermaidDist });
    await page.evaluate(async (src) => {
      window.mermaid.initialize({ startOnLoad: false, theme: 'default' });
      const { svg } = await window.mermaid.render('mmd-' + Math.random().toString(36).slice(2), src);
      document.body.innerHTML = svg;
    }, source);
    const el = page.locator('body > svg');
    return await el.screenshot();
  } finally {
    await page.close();
  }
}

// 表格/代码块等 HTML 片段 → PNG buffer。简洁白底、宽 680px、devicePixelRatio 2。
const RASTER_CSS = `
body { margin: 0; background: #fff; }
#shot { width: 680px; box-sizing: border-box; background: #fff; }
table { border-collapse: collapse; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 14px; color: #24292f; }
th, td { border: 1px solid #d0d7de; padding: 8px 12px; text-align: left; line-height: 1.6; }
th { background: #f6f8fa; font-weight: 600; }
pre { margin: 0; padding: 16px; background: #f6f8fa; border-radius: 6px; overflow: visible; }
code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 13px; line-height: 1.6; color: #24292f; white-space: pre-wrap; word-break: break-word; }
`;

export async function renderHtmlToPng(browser, bodyHtml) {
  const page = await browser.newPage({ viewport: { width: 720, height: 600 }, deviceScaleFactor: 2 });
  try {
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>${RASTER_CSS}</style></head>` +
        `<body><div id="shot">${bodyHtml}</div></body></html>`
    );
    const el = page.locator('#shot');
    return await el.screenshot();
  } finally {
    await page.close();
  }
}
