// X 分段：html 段（标题/段落/列表/引用/链接）与 image 段（表格/代码/mermaid/正文图片）交替，
// 段顺序与原文一致；html 段里不得出现 <table、<pre、<img（不变式 5，违规即抛错）。
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { renderHtmlToPng } from './render.mjs';
import { classifyImageSrc } from './images.mjs';
import { mermaidFilename } from './wechat.mjs';

export function createXMd() {
  const md = new MarkdownIt({ html: true });
  // fence/table 由段组装层拦截转 PNG，渲染器若被调用说明组装层漏拦 —— 直接抛错
  md.renderer.rules.fence = () => {
    throw new Error('X html 段中不应出现代码块（应由段组装层转 PNG）');
  };
  return md;
}

function escapeForPngPre(code) {
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function findClose(tokens, openIdx, closeType) {
  for (let j = openIdx + 1; j < tokens.length; j++) {
    if (tokens[j].type === closeType) return j;
  }
  throw new Error(`token 流不平衡：找不到 ${closeType}（open at ${openIdx}）`);
}

// 组装 X 分段。ctx: {dirName, repoRoot, browser, blogUrl}
// 返回 {segments, assets: [{destRel, data?}|{destRel, copyFrom}]}，素材落盘由主流程统一执行。
export async function buildXSegments(markdown, ctx) {
  const md = createXMd();
  const tokens = md.parse(markdown, {});
  const segments = [];
  const assets = [];
  const takenNames = new Set();
  const pngCounters = { table: 0, code: 0 };
  let htmlBuf = [];

  const flushHtml = () => {
    if (htmlBuf.length === 0) return;
    const html = htmlBuf.join('\n');
    if (/<table[\s>]|<pre[\s>]|<img[\s>]/.test(html)) {
      throw new Error(`X html 段中出现禁用标签（<table/<pre/<img）：${html.slice(0, 120)}…`);
    }
    segments.push({ kind: 'html', html });
    htmlBuf = [];
  };

  const takeName = (name) => {
    if (takenNames.has(name)) {
      throw new Error(`assets 文件名冲突：${name}（文章：${ctx.dirName}）`);
    }
    takenNames.add(name);
    return name;
  };

  const pushImage = (destRel, alt) => {
    segments.push({ kind: 'image', src: destRel, alt });
  };

  const writeAsset = (destName, data) => {
    const destRel = `assets/${takeName(destName)}`;
    assets.push({ destRel, data });
    return destRel;
  };

  const registerCopyAsset = (destName, repoRel) => {
    const destRel = `assets/${takeName(destName)}`;
    assets.push({ destRel, copyFrom: repoRel });
    return destRel;
  };

  // 正文图片 token → image 段：本地（bundle/static）复制到 assets；http(s) 下载到 assets。
  // 注意 markdown-it parse 时 normalizeLink 会把 src percent-encode，本地路径需先解码再对磁盘。
  const pushContentImage = async (child) => {
    const rawSrc = child.attrGet('src') ?? '';
    let src = rawSrc;
    if (!/^https?:\/\//.test(rawSrc)) {
      try {
        src = decodeURIComponent(rawSrc);
      } catch {
        // 非法编码序列保持原样，交由 classifyImageSrc 判定
      }
    }
    const alt = child.content ?? '';
    const c = classifyImageSrc(src);
    if (!c) {
      throw new Error(`图片路径不属于受支持的三类：${src}（文章：${ctx.dirName}）`);
    }
    let destRel;
    if (c.kind === 'external') {
      const resp = await fetch(src);
      if (!resp.ok) {
        throw new Error(`外链图片下载失败（${resp.status}）：${src}（文章：${ctx.dirName}）`);
      }
      const basename = decodeURIComponent(path.basename(new URL(src).pathname)) || 'external-image';
      destRel = writeAsset(basename, Buffer.from(await resp.arrayBuffer()));
    } else {
      const repoRel =
        c.kind === 'bundle' ? `content/posts/${ctx.dirName}/${c.relPath}` : c.repoRelPath;
      destRel = registerCopyAsset(path.basename(repoRel), repoRel);
    }
    pushImage(destRel, alt);
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'fence') {
      flushHtml();
      const info = t.info.trim();
      if (info === 'mermaid') {
        // 与公众号共用 content/posts/<目录>/images/generated/<mermaid-hash>.png，复制到 assets
        const destRel = registerCopyAsset(
          mermaidFilename(t.content),
          `content/posts/${ctx.dirName}/images/generated/${mermaidFilename(t.content)}`
        );
        pushImage(destRel, '架构图');
      } else {
        const png = await renderHtmlToPng(
          ctx.browser,
          `<pre><code>${escapeForPngPre(t.content)}</code></pre>`
        );
        pngCounters.code += 1;
        const src = writeAsset(`x-code-${String(pngCounters.code).padStart(3, '0')}.png`, png);
        pushImage(src, `代码 ${pngCounters.code}`);
      }
      continue;
    }
    if (t.type === 'table_open') {
      flushHtml();
      const close = findClose(tokens, i, 'table_close');
      const html = md.renderer.render(tokens.slice(i, close + 1), md.options, {});
      const png = await renderHtmlToPng(ctx.browser, html);
      pngCounters.table += 1;
      const src = writeAsset(`x-table-${String(pngCounters.table).padStart(3, '0')}.png`, png);
      pushImage(src, `表格 ${pngCounters.table}`);
      i = close;
      continue;
    }
    // 嵌套块整体渲染：引用 / 有序 / 无序列表（token 流是扁平的，必须先吃掉整块，
    // 否则内部 paragraph_open 会被误当顶层段落拆分）
    if (
      t.type === 'blockquote_open' ||
      t.type === 'bullet_list_open' ||
      t.type === 'ordered_list_open'
    ) {
      const closeType = t.type.replace('_open', '_close');
      const close = findClose(tokens, i, closeType);
      htmlBuf.push(md.renderer.render(tokens.slice(i, close + 1), md.options, {}));
      i = close;
      continue;
    }
    if (t.type === 'paragraph_open') {
      // 顶层段落：open( i ) + inline( i+1 ) + close( i+2 )，按 children 里的图片切分成 文本/图片 交替
      const inline = tokens[i + 1];
      const close = findClose(tokens, i, 'paragraph_close');
      if (inline.type !== 'inline') {
        throw new Error(`段落结构异常：paragraph_open 后不是 inline（at ${i}，文章：${ctx.dirName}）`);
      }
      const children = inline.children ?? [];
      if (!children.some((c) => c.type === 'image')) {
        htmlBuf.push(md.renderer.render(tokens.slice(i, close + 1), md.options, {}));
        i = close;
        continue;
      }
      let textRun = [];
      // 图片段 push 前必须先落文本 run（若有）并 flush 整个 html 缓冲区：
      // 否则纯图片段落（无文本 run）会跳过 flush，htmlBuf 积压导致段顺序错乱（修复轮 1）。
      const flushBeforeImage = async (child) => {
        if (textRun.length > 0) {
          htmlBuf.push(`<p>${md.renderer.renderInline(textRun, md.options, {})}</p>\n`);
          textRun = [];
        }
        flushHtml();
        await pushContentImage(child);
      };
      for (const child of children) {
        if (child.type === 'image') {
          await flushBeforeImage(child);
        } else {
          textRun.push(child);
        }
      }
      if (textRun.length > 0) {
        // 图片后剩余文字：落回缓冲区，允许与后续相邻 html 块继续合并
        htmlBuf.push(`<p>${md.renderer.renderInline(textRun, md.options, {})}</p>\n`);
        textRun = [];
      }
      i = close;
      continue;
    }
    // 其余顶层块（heading/hr/html_block…）累积进 html 段（相邻块合并为一段）
    htmlBuf.push(md.renderer.render([t], md.options, {}));
  }
  flushHtml();
  if (ctx.blogUrl) {
    // 约束卡：文末追加首发声明 html 段
    segments.push({
      kind: 'html',
      html: `<p>本文首发于我的博客：<a href="${ctx.blogUrl}">${ctx.blogUrl}</a></p>`,
    });
  }
  return { segments, assets };
}
