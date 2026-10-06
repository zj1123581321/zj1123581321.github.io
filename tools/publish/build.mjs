#!/usr/bin/env node
// md2platforms 生成器：博客文章 → tools/publish/out/<目录>/data.json + assets/
// 用法：node tools/publish/build.mjs content/posts/<目录> [--skip-push-check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildPostsIndex, parseFrontmatter, blogUrlOf, rewriteLinksForWechat, rewriteLinksForX } from './lib/links.mjs';
import { resolveAllImages, rewriteImagesForWechat } from './lib/images.mjs';
import { launchBrowser, renderMermaidToPng } from './lib/render.mjs';
import { assertAllPushed } from './lib/push-check.mjs';
import { renderWechatHtml, mermaidFilename } from './lib/wechat.mjs';
import { buildXSegments } from './lib/x.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

export async function runBuild({ repoRoot, postArg, skipPushCheck }) {
  const postDir = path.resolve(repoRoot, postArg);
  const dirName = path.basename(postDir);
  const indexPath = path.join(postDir, 'index.md');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`找不到文章：${indexPath}`);
  }
  const { matter } = parseFrontmatter(indexPath);
  const fm = matter.data ?? {};
  const body = matter.content;
  const index = buildPostsIndex(repoRoot);

  // 1) mermaid 预渲染：content/posts/<目录>/images/generated/mermaid-<sha12>.png，已存在则复用
  const mermaidBlocks = [...body.matchAll(/^```mermaid\n([\s\S]*?)^```/gm)].map((m) => m[1]);
  const generatedDir = path.join(postDir, 'images/generated');
  const generatedRepoRels = [];
  if (mermaidBlocks.length > 0) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const browser = await launchBrowser();
  try {
    for (const source of mermaidBlocks) {
      const filename = mermaidFilename(source);
      const file = path.join(generatedDir, filename);
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, await renderMermaidToPng(browser, source));
        console.error(`mermaid 已渲染：content/posts/${dirName}/images/generated/${filename}`);
      }
      generatedRepoRels.push(`content/posts/${dirName}/images/generated/${filename}`);
    }

    // 2) 未推送检查：正文图片（bundle/static 两类）+ mermaid generated，全在 origin/main 上才继续
    const resolvedImages = resolveAllImages(body, dirName);
    const localRepoRels = resolvedImages
      .filter((img) => img.kind !== 'external')
      .map((img) => img.repoRelPath.replace(/\\/g, '/'));
    if (!skipPushCheck) {
      assertAllPushed(repoRoot, [...localRepoRels, ...generatedRepoRels]);
    }

    // 3) 公众号 HTML（链接映射 + 图片 URL → mdnice 结构渲染 → juice 内联）
    const wechatHtml = renderWechatHtml(
      rewriteImagesForWechat(rewriteLinksForWechat(body, index, dirName), dirName),
      dirName
    );

    // 4) X 分段（链接映射 → token 流分段 + 表格/代码 PNG）
    const { segments, assets } = await buildXSegments(rewriteLinksForX(body, index, dirName), {
      dirName,
      repoRoot,
      browser,
      blogUrl: blogUrlOf(dirName, index),
    });

    // 5) 产物落盘：out/<目录>/ 整目录重建，避免上次构建残留
    const outDir = path.join(repoRoot, 'tools/publish/out', dirName);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
    for (const a of assets) {
      const destAbs = path.join(outDir, a.destRel);
      if (a.copyFrom) {
        fs.copyFileSync(path.join(repoRoot, a.copyFrom), destAbs);
      } else {
        fs.writeFileSync(destAbs, a.data);
      }
    }

    // 6) cover：正文第一张图片落到 assets 后的相对路径；无图则 null
    let cover = null;
    if (resolvedImages.length > 0) {
      const first = resolvedImages[0];
      const destRel =
        first.kind === 'external'
          ? `assets/${decodeURIComponent(path.basename(new URL(first.src).pathname))}`
          : `assets/${path.basename(first.repoRelPath)}`;
      if (fs.existsSync(path.join(outDir, destRel))) {
        cover = destRel;
      }
    }

    const data = {
      schema: 'md2platforms/v1',
      post: dirName,
      title: fm.title,
      blog_url: blogUrlOf(dirName, index),
      cover,
      wechat: { html: wechatHtml },
      x: { segments },
    };
    fs.writeFileSync(path.join(outDir, 'data.json'), JSON.stringify(data, null, 2) + '\n');
    console.log(`产物目录：tools/publish/out/${dirName}/`);
    console.log(`复制页路径：/md2p/page/?post=${dirName}`);
    return data;
  } finally {
    await browser.close();
  }
}

export async function main(argv) {
  const postArg = argv.find((a) => !a.startsWith('--'));
  if (!postArg) {
    fail('用法：node tools/publish/build.mjs content/posts/<目录> [--skip-push-check]');
  }
  await runBuild({
    repoRoot: REPO_ROOT,
    postArg,
    skipPushCheck: argv.includes('--skip-push-check'),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((e) => {
    fail(e.message);
  });
}
