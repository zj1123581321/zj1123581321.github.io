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
async function renderMermaidSvg(page, source) {
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
}

export async function renderMermaidToPng(browser, source) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
  try {
    await renderMermaidSvg(page, source);
    return await page.locator('body > svg').screenshot();
  } finally {
    await page.close();
  }
}

// X 专用副本按实际 SVG CSS 宽度放大到至少 1200px；公众号仍走原渲染函数。
export async function renderMermaidToPngForX(browser, source) {
  const viewport = { width: 1600, height: 1200 };
  const measurePage = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  let deviceScaleFactor;
  try {
    await renderMermaidSvg(measurePage, source);
    const box = await measurePage.locator('body > svg').boundingBox();
    if (!box || box.width <= 0) throw new Error('mermaid SVG 宽度无效，无法计算 X 渲染倍率');
    deviceScaleFactor = Math.max(1, Math.ceil(1200 / box.width));
  } finally {
    await measurePage.close();
  }

  const page = await browser.newPage({ viewport, deviceScaleFactor });
  try {
    await renderMermaidSvg(page, source);
    return await page.locator('body > svg').screenshot();
  } finally {
    await page.close();
  }
}

// 将竖图左右补白到 3:4；GIF 保留原字节，其他变换只支持 PNG/JPEG/WebP 栅格输入。
export async function padImageToXAspectRatio(browser, input) {
  const signature = input.toString('ascii', 0, 12);
  if (signature.startsWith('GIF87a') || signature.startsWith('GIF89a')) return input;

  let mime;
  if (input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    mime = 'image/png';
  } else if (input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) {
    mime = 'image/jpeg';
  } else if (signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP') {
    mime = 'image/webp';
  } else if (/<svg(?:\s|>)/i.test(input.toString('utf8', 0, 512))) {
    mime = 'image/svg+xml';
  } else {
    throw new Error(`不支持为 X 补白的图片格式：${signature.slice(0, 12)}`);
  }

  const page = await browser.newPage();
  try {
    const result = await page.evaluate(async ({ base64, imageMime }) => {
      const image = new Image();
      image.src = `data:${imageMime};base64,${base64}`;
      await image.decode();
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (width / height >= 0.75) return { padded: false };

      const outputWidth = Math.ceil((height * 3) / 4);
      if (imageMime === 'image/svg+xml') {
        const left = Math.floor((outputWidth - width) / 2);
        return {
          padded: true,
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${height}" viewBox="0 0 ${outputWidth} ${height}"><rect width="100%" height="100%" fill="#ffffff"/><image x="${left}" y="0" width="${width}" height="${height}" preserveAspectRatio="none" href="data:image/svg+xml;base64,${base64}"/></svg>`,
        };
      }
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, outputWidth, height);
      context.drawImage(image, Math.floor((outputWidth - width) / 2), 0, width, height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, imageMime, 1));
      if (!blob) throw new Error(`无法编码补白后的图片：${imageMime}`);
      return { padded: true, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())) };
    }, { base64: input.toString('base64'), imageMime: mime });
    if (!result.padded) return input;
    return result.svg ? Buffer.from(result.svg) : Buffer.from(result.bytes);
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
