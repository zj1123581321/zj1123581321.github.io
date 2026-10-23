#!/usr/bin/env node
// md2platforms 生成器：博客文章 → tools/publish/out/<目录>/data.json + assets/
// 用法：node tools/publish/build.mjs content/posts/<目录> [--skip-push-check] [--ref <分支名>]
// --ref <分支名>：未推送检查改对 origin/<分支名> 做，公众号图片 raw 地址钉到该分支解析出的
//   40 位提交 SHA（「先发公众号、后合并」场景）；不带 --ref 时默认 main，产物不变。
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildPostsIndex, parseFrontmatter, blogUrlOf, rewriteLinksForWechat, rewriteLinksForX, GITHUB_RAW_BASE, GITHUB_RAW_REPO } from './lib/links.mjs';
import { resolveAllImages, rewriteImagesForWechat } from './lib/images.mjs';
import { launchBrowser, padImageToXAspectRatio, renderMermaidToPng } from './lib/render.mjs';
import { assertAllPushed } from './lib/push-check.mjs';
import { renderWechatHtml, mermaidFilename } from './lib/wechat.mjs';
import { buildXSegments } from './lib/x.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

export async function runBuild({ repoRoot, postArg, skipPushCheck, ref }) {
  const postDir = path.resolve(repoRoot, postArg);
  const dirName = path.basename(postDir);
  const indexPath = path.join(postDir, 'index.md');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`找不到文章：${indexPath}`);
  }
  // --ref：先把 origin/<分支名> 解析为 40 位提交 SHA，解析失败直接报错退出（不回退 main）。
  // 地址钉 SHA 而非分支名：分支合并删除后 raw 地址仍有效。
  let rawBase = GITHUB_RAW_BASE;
  if (ref != null) {
    const r = spawnSync('git', ['rev-parse', '--verify', `origin/${ref}^{commit}`], { cwd: repoRoot, encoding: 'utf8' });
    const sha = (r.stdout || '').trim();
    if (r.status !== 0 || !/^[0-9a-f]{40}$/.test(sha)) {
      throw new Error(`PUBLISH-REF-NOT-FOUND：--ref ${ref} 对应的 origin/${ref} 不存在或不是提交，先把该分支推送到远端再重跑`);
    }
    rawBase = `${GITHUB_RAW_REPO}/${sha}`;
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

    // 2) 未推送检查：正文图片（bundle/static 两类）+ mermaid generated，全在 origin/<ref，默认 main> 上才继续
    const resolvedImages = resolveAllImages(body, dirName);
    const localRepoRels = resolvedImages
      .filter((img) => img.kind !== 'external')
      .map((img) => img.repoRelPath.replace(/\\/g, '/'));
    if (!skipPushCheck) {
      assertAllPushed(repoRoot, [...localRepoRels, ...generatedRepoRels], ref);
    }

    // 3) 公众号 HTML（链接映射 + 图片 URL → mdnice 结构渲染 → juice 内联）
    const wechatHtml = renderWechatHtml(
      rewriteImagesForWechat(rewriteLinksForWechat(body, index, dirName), dirName, rawBase),
      dirName,
      rawBase
    );

    // 4) X 分段（链接映射 → token 流分段 + 表格/代码 PNG）
    const { segments, assets } = await buildXSegments(rewriteLinksForX(body, index, dirName), {
      dirName,
      repoRoot,
      browser,
      blogUrl: blogUrlOf(dirName, index),
    });

    // cover 与正文第一张图片同路径时保持源字节不变；其余 image 段素材统一做 X 补白。
    let cover = null;
    let coverAssetRel = null;
    if (resolvedImages.length > 0) {
      const first = resolvedImages[0];
      coverAssetRel =
        first.kind === 'external'
          ? `assets/${decodeURIComponent(path.basename(new URL(first.src).pathname))}`
          : `assets/${path.basename(first.repoRelPath)}`;
    }

    // 5) 产物落盘：out/<目录>/ 整目录重建，避免上次构建残留
    const outDir = path.join(repoRoot, 'tools/publish/out', dirName);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
    for (const a of assets) {
      const destAbs = path.join(outDir, a.destRel);
      const source = a.copyFrom ? fs.readFileSync(path.join(repoRoot, a.copyFrom)) : a.data;
      const data = a.destRel === coverAssetRel ? source : await padImageToXAspectRatio(browser, source);
      fs.writeFileSync(destAbs, data);
    }
    if (coverAssetRel && fs.existsSync(path.join(outDir, coverAssetRel))) {
      cover = coverAssetRel;
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
    fail('用法：node tools/publish/build.mjs content/posts/<目录> [--skip-push-check] [--ref <分支名>]');
  }
  let ref; // 不带 --ref 时保持 undefined，让下游默认参数生效（不能用 null：会绕过默认值变成 origin/null）
  const refIdx = argv.indexOf('--ref');
  if (refIdx !== -1) {
    const branch = argv[refIdx + 1];
    if (!branch || branch.startsWith('--')) {
      fail('用法：--ref 需要跟分支名：node tools/publish/build.mjs content/posts/<目录> [--ref <分支名>]');
    }
    ref = branch;
  }
  await runBuild({
    repoRoot: REPO_ROOT,
    postArg,
    skipPushCheck: argv.includes('--skip-push-check'),
    ref,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((e) => {
    fail(e.message);
  });
}
