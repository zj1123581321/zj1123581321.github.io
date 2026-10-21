import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runBuild } from '../build.mjs';
import { buildXSegments } from '../lib/x.mjs';
import { launchBrowser, padImageToXAspectRatio } from '../lib/render.mjs';

async function pngDimensions(browser, buffer) {
  const page = await browser.newPage();
  try {
    return await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, buffer.toString('base64'));
  } finally {
    await page.close();
  }
}

test('竖向 PNG 左右白色补白至 3:4，原图内容不缩放', async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="4"><rect width="1" height="4" fill="#ff0000"/></svg>'
    );
    const source = await page.locator('svg').screenshot();
    await page.close();

    const padded = await padImageToXAspectRatio(browser, source);
    const gif = Buffer.from('GIF89a');
    assert.equal(await padImageToXAspectRatio(browser, gif), gif);
    const pageForPixels = await browser.newPage();
    try {
      const pixels = await pageForPixels.evaluate(async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return {
          width: canvas.width,
          height: canvas.height,
          left: Array.from(context.getImageData(0, 0, 1, 1).data),
          content: Array.from(context.getImageData(1, 0, 1, 1).data),
          right: Array.from(context.getImageData(2, 0, 1, 1).data),
        };
      }, padded.toString('base64'));
      assert.deepEqual(pixels, {
        width: 3,
        height: 4,
        left: [255, 255, 255, 255],
        content: [255, 0, 0, 255],
        right: [255, 255, 255, 255],
      });
    } finally {
      await pageForPixels.close();
    }
  } finally {
    await browser.close();
  }
});

test('封面 asset 保持原字节，其他窄正文图在 build 落盘时补白', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'md2p-x-cover-'));
  try {
    const postDir = path.join(tmp, 'content/posts/x-cover-test');
    fs.mkdirSync(path.join(postDir, 'images'), { recursive: true });
    const fixtureBrowser = await launchBrowser();
    let coverBytes;
    let narrowBytes;
    try {
      const page = await fixtureBrowser.newPage();
      await page.setContent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#00ff00"/></svg>'
      );
      coverBytes = await page.locator('svg').screenshot();
      await page.setContent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="4"><rect width="1" height="4" fill="#ff0000"/></svg>'
      );
      narrowBytes = await page.locator('svg').screenshot();
      await page.close();
    } finally {
      await fixtureBrowser.close();
    }
    fs.writeFileSync(path.join(postDir, 'images/cover.png'), coverBytes);
    fs.writeFileSync(path.join(postDir, 'images/narrow.png'), narrowBytes);
    fs.writeFileSync(
      path.join(postDir, 'index.md'),
      '---\ntitle: "cover test"\n---\n\n![封面](images/cover.png)\n\n![正文](images/narrow.png)\n'
    );

    const data = await runBuild({ repoRoot: tmp, postArg: 'content/posts/x-cover-test', skipPushCheck: true });
    const coverAssetPath = path.join(tmp, 'tools/publish/out/x-cover-test/assets/cover.png');
    const narrowAssetPath = path.join(tmp, 'tools/publish/out/x-cover-test/assets/narrow.png');
    assert.equal(data.cover, 'assets/cover.png');
    assert.deepEqual(fs.readFileSync(coverAssetPath), coverBytes);
    assert.notDeepEqual(fs.readFileSync(narrowAssetPath), narrowBytes);
    const verifyBrowser = await launchBrowser();
    try {
      assert.deepEqual(await pngDimensions(verifyBrowser, fs.readFileSync(narrowAssetPath)), { width: 3, height: 4 });
    } finally {
      await verifyBrowser.close();
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('mermaid X 副本按 SVG 实际宽度渲染到至少 1200px', async () => {
  const browser = await launchBrowser();
  try {
    const { segments, assets } = await buildXSegments('```mermaid\ngraph TD\n  A[入口] --> B[处理]\n```', {
      dirName: 'x-assets-test',
      browser,
    });
    assert.equal(assets.length, 1);
    assert.match(assets[0].destRel, /^assets\/mermaid-[0-9a-f]{12}\.png$/);
    assert.equal(segments[0].kind, 'image');
    assert.equal(segments[0].src, assets[0].destRel);
    const { width } = await pngDimensions(browser, assets[0].data);
    assert.ok(width >= 1200, `X mermaid 副本宽度 ${width}px 小于 1200px`);
  } finally {
    await browser.close();
  }
});
