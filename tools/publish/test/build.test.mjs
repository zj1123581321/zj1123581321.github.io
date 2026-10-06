// node --test 全量测试。fixture 直接读仓库真实文章：
//   261004-context-and-loop（图片已全在 origin/main，含 3 条内链 + 外链脚注 + 表格）
//   260809-multi-agent-scheduling-architecture（3 个 mermaid，generated PNG 未推送 → 用 --skip-push-check）
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../build.mjs';
import { buildPostsIndex, rewriteLinksForWechat, rewriteLinksForX, resolveInternalLink, blogUrlOf, GITHUB_RAW_BASE } from '../lib/links.mjs';
import { classifyImageSrc, resolveAllImages } from '../lib/images.mjs';
import { renderWechatHtml } from '../lib/wechat.mjs';
import { assertAllPushed } from '../lib/push-check.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'tools/publish/out');

// ---------- 纯函数单元测试 ----------

test('图片三类：bundle 相对 / 站点根 migrated|post-images / http 外链；其余报错', () => {
  assert.equal(classifyImageSrc('images/cover.jpg').kind, 'bundle');
  assert.equal(classifyImageSrc('/migrated-images/a.png').kind, 'static');
  assert.equal(classifyImageSrc('/post-images/b.png').kind, 'static');
  assert.equal(classifyImageSrc('https://example.com/c.png').kind, 'external');
  assert.equal(classifyImageSrc('http://example.com/c.png').kind, 'external');
  // 不支持的形式
  assert.equal(classifyImageSrc('/uploads/c.png'), null);
  assert.equal(classifyImageSrc('../outside.png'), null);
  assert.equal(classifyImageSrc('D:%5CMyFolders%5Cx.gif'), null);
  assert.equal(classifyImageSrc('//cdn.example.com/x.png'), null);
  assert.equal(classifyImageSrc(''), null);
});

test('图片路径解析失败时报出行号与文章名', () => {
  assert.throws(
    () => resolveAllImages('第一行\n\n![x](/uploads/bad.png)', '260199-fake'),
    /第 3 行.*\/uploads\/bad\.png.*260199-fake/
  );
});

test('未推送检查：缺失路径全部列出且不通过', () => {
  assert.throws(
    () => assertAllPushed(REPO_ROOT, ['content/posts/__不存在__0217/x.png', 'static/__也不存在__0217.png']),
    (e) => {
      assert.match(e.message, /图片尚未推送/);
      assert.match(e.message, /content\/posts\/__不存在__0217\/x\.png/);
      assert.match(e.message, /static\/__也不存在__0217\.png/);
      return true;
    }
  );
});

test('未推送检查：已在 origin/main 的文件通过（已知答案为「是」）', () => {
  assertAllPushed(REPO_ROOT, ['content/posts/261004-context-and-loop/images/cover.jpg']);
});

test('内链解析三格：目录名命中 / url 末段命中 / 都不命中报错', () => {
  const index = {
    byDir: new Map([['260809-multi-agent-scheduling-architecture', { dirName: '260809-multi-agent-scheduling-architecture', fm: {} }]]),
    byUrlLast: new Map([['context-is-all-you-need', '260328-context-is-all-you-need']]),
  };
  // 目录名直接命中
  assert.deepEqual(resolveInternalLink('../260809-multi-agent-scheduling-architecture/#x', index, 'p'), {
    dirName: '260809-multi-agent-scheduling-architecture',
    hash: '#x',
  });
  // url 末段命中
  assert.deepEqual(resolveInternalLink('../context-is-all-you-need/', index, 'p'), {
    dirName: '260328-context-is-all-you-need',
    hash: '',
  });
  assert.deepEqual(resolveInternalLink('/posts/context-is-all-you-need/', index, 'p'), {
    dirName: '260328-context-is-all-you-need',
    hash: '',
  });
  // 都不命中 → 找不到内链目标
  assert.throws(
    () => resolveInternalLink('../not-exist-xyz/', index, '260100-fake-source'),
    /找不到内链目标：\.\.\/not-exist-xyz\/（来源文章：260100-fake-source）/
  );
  // 非内链形态返回 null
  assert.equal(resolveInternalLink('references/a.pdf', index, 'p'), null);
});

test('内链三态映射：有 wechat_url → 公众号链接；无 → 博客 URL+脚注 title；目标不存在 → 报错', () => {
  const index = {
    byDir: new Map([
      ['260809-multi-agent-scheduling-architecture', { dirName: '260809-multi-agent-scheduling-architecture', fm: { wechat_url: 'https://mp.weixin.qq.com/s/E64iWXnuryt9HhU2cQ91xw' } }],
      ['260328-context-is-all-you-need', { dirName: '260328-context-is-all-you-need', fm: { url: '/posts/context-is-all-you-need/' } }],
    ]),
    byUrlLast: new Map([['context-is-all-you-need', '260328-context-is-all-you-need']]),
  };
  const md = '看 [这篇](../260809-multi-agent-scheduling-architecture/) 和 [那篇](../context-is-all-you-need/)。';
  const out = rewriteLinksForWechat(md, index, '260100-fake');
  // 有 wechat_url：保持可点链接
  assert.match(out, /\[这篇\]\(https:\/\/mp\.weixin\.qq\.com\/s\/E64iWXnuryt9HhU2cQ91xw\)/);
  // 无 wechat_url：博客 URL 且带 title（随后被 linkfoot 转脚注）
  assert.match(
    out,
    /\[那篇\]\(https:\/\/zj1123581321\.com\/posts\/context-is-all-you-need\/ "那篇"\)/
  );
  // 目标不存在：报错
  assert.throws(
    () => rewriteLinksForWechat('[断链](../nope-xyz/)', index, '260100-fake'),
    /找不到内链目标/
  );
  // X：内链一律博客 URL，不带 title
  const outX = rewriteLinksForX(md, index, '260100-fake');
  assert.match(outX, /\[这篇\]\(https:\/\/zj1123581321\.com\/posts\/260809-multi-agent-scheduling-architecture\/\)/);
  assert.match(outX, /\[那篇\]\(https:\/\/zj1123581321\.com\/posts\/context-is-all-you-need\/\)/);
});

test('公众号外链转脚注：非微信 http(s) 加 title；mp.weixin 保持可点', () => {
  const index = { byDir: new Map(), byUrlLast: new Map() };
  const md = [
    '见 [Cloudflare 文章](https://blog.cloudflare.com/agent-development-lifecycle/)。',
    '微信内文 [已发文章](https://mp.weixin.qq.com/s/az3gUGA24mXs1ptYdayFjQ)。',
    '已有 title 的 [旧脚注](https://a.example/x "旧脚注")。',
  ].join('\n');
  const out = rewriteLinksForWechat(md, index, 'p');
  assert.match(out, /\[Cloudflare 文章\]\(https:\/\/blog\.cloudflare\.com\/agent-development-lifecycle\/ "Cloudflare 文章"\)/);
  assert.match(out, /\[已发文章\]\(https:\/\/mp\.weixin\.qq\.com\/s\/az3gUGA24mXs1ptYdayFjQ\)/); // 无 title
  assert.match(out, /\[旧脚注\]\(https:\/\/a\.example\/x "旧脚注"\)/); // 原样，交给 linkfoot

  // 渲染后：脚注结构与 mp.weixin 可点链接
  const html = renderWechatHtml(out, 'p');
  assert.match(html, /<span class="footnote-word"[^>]*>Cloudflare 文章<\/span><sup class="footnote-ref"[^>]*>\[1\]<\/sup>/);
  assert.match(html, /<h3 class="footnotes-sep"[^>]*>[^]*?<section class="footnotes"/);
  assert.match(html, /class="footnote-item"/);
  assert.match(html, /<a href="https:\/\/mp\.weixin\.qq\.com\/s\/az3gUGA24mXs1ptYdayFjQ"[^>]*>已发文章<\/a>/);
});

test('兰青结构与内联颜色：section#nice / 标题 span / table-container / pre.custom / teal 色值', () => {
  const md = [
    '## 二级标题',
    '',
    '一段含 **加粗** 与 [外链](https://blog.cloudflare.com/x/) 的文字。',
    '',
    '| 层次 | 例子 |',
    '|---|---|',
    '| 全局规则 | CLAUDE.md |',
    '',
    '```bash',
    'echo hi',
    '```',
  ].join('\n');
  const html = renderWechatHtml(md, 'p');
  assert.match(html, /^<section id="nice"[^>]*>/);
  assert.match(html, /<h2[^>]*><span class="prefix"[^>]*><\/span><span class="content"/);
  assert.match(html, /<\/span><span class="suffix"[^>]*><\/span><\/h2>/);
  assert.match(html, /<section class="table-container"[^>]*>\s*<table[\s>]/);
  assert.match(html, /<pre class="custom"[^>]*>/);
  assert.match(html, /<code class="hljs"[^>]*>/);
  // juice 内联后的颜色
  const h2Content = html.match(/<span class="content"[^>]*style="([^"]*)"/);
  assert.ok(h2Content, 'h2 span.content 应有内联 style');
  assert.match(h2Content[1], /color:\s*rgb\(0,\s*150,\s*136\)/);
  const strong = html.match(/<strong style="([^"]*)"/);
  assert.ok(strong, 'strong 应有内联 style');
  assert.match(strong[1], /color:\s*rgb\(0,\s*150,\s*136\)/);
});

// ---------- 集成：真实文章 build ----------

test('build 261004：data.json 契约 + 图片 URL 与手工版一致 + 内链映射 + X 分段', async () => {
  const data = await runBuild({
    repoRoot: REPO_ROOT,
    postArg: 'content/posts/261004-context-and-loop',
    skipPushCheck: false,
  });
  const dir = path.join(OUT_DIR, '261004-context-and-loop');
  const onDisk = JSON.parse(fs.readFileSync(path.join(dir, 'data.json'), 'utf8'));
  assert.deepEqual(Object.keys(onDisk).sort(), ['blog_url', 'cover', 'post', 'schema', 'title', 'wechat', 'x']);
  assert.equal(onDisk.schema, 'md2platforms/v1');
  assert.equal(onDisk.post, '261004-context-and-loop');
  assert.match(onDisk.title, /Context 与 Loop/);
  assert.equal(onDisk.blog_url, 'https://zj1123581321.com/posts/261004-context-and-loop/');
  assert.equal(onDisk.cover, 'assets/cover.jpg');
  assert.ok(fs.existsSync(path.join(dir, 'assets/cover.jpg')));

  // 图片 URL：生成结果 ⊇ 手工公众号版
  const manual = fs.readFileSync(
    path.join(REPO_ROOT, 'content/posts/261004-context-and-loop/公众号版.md'),
    'utf8'
  );
  const manualUrls = [...manual.matchAll(/!\[[^\]]*\]\((https:\/\/raw\.githubusercontent\.com[^)]+)\)/g)].map((m) => m[1]);
  assert.ok(manualUrls.length > 0);
  for (const u of manualUrls) {
    assert.ok(onDisk.wechat.html.includes(u), `生成的公众号 HTML 应包含手工版图片 URL：${u}`);
  }

  // 内链映射：目标已回填 wechat_url → 可点公众号链接（不转脚注、无相对内链残留）
  assert.ok(!/href="\.\.\//.test(onDisk.wechat.html), '公众号 HTML 不应残留相对内链');
  assert.match(
    onDisk.wechat.html,
    /<a href="https:\/\/mp\.weixin\.qq\.com\/s\/az3gUGA24mXs1ptYdayFjQ"[^>]*>Context is All You Need<\/a>/,
    '内链应映射为目标文章的 wechat_url 可点链接'
  );
  assert.match(
    onDisk.wechat.html,
    /<a href="https:\/\/mp\.weixin\.qq\.com\/s\/E64iWXnuryt9HhU2cQ91xw"[^>]*>将军赶路不追小兔<\/a>/
  );

  // X 分段
  const segs = onDisk.x.segments;
  assert.ok(segs.length > 5);
  // X：内链一律博客 URL（即使目标已回填 wechat_url）
  const xHtml = segs.filter((s) => s.kind === 'html').map((s) => s.html).join('');
  assert.match(xHtml, /href="https:\/\/zj1123581321\.com\/posts\/context-is-all-you-need\/"/);
  assert.ok(!xHtml.includes('mp.weixin.qq.com'), 'X html 段不应出现公众号链接');
  assert.equal(segs[0].kind, 'image', '首段应为封面 image 段');
  assert.equal(segs[0].src, 'assets/cover.jpg');
  let lastHtml = '';
  for (const s of segs) {
    if (s.kind === 'html') {
      assert.ok(!/<table[\s>]|<pre[\s>]|<img[\s>]/.test(s.html), `html 段不得含 table/pre/img：${s.html.slice(0, 80)}`);
      lastHtml = s.html;
    } else {
      assert.match(s.src, /^assets\//);
    }
  }
  assert.match(lastHtml, /本文首发于我的博客：<a href="https:\/\/zj1123581321\.com\/posts\/261004-context-and-loop\/">/);
  // frontmatter 不进产物：description 独有文本不应出现（tags 里的词正文也有，不能当判据）
  assert.ok(!onDisk.wechat.html.includes('一个决定 Agent 这一次做得好不好'));
  // 表格与图片：261004 有 2 张表格 → 2 个表格 image 段
  const tableSegs = segs.filter((s) => s.kind === 'image' && /x-table-/.test(s.src));
  assert.equal(tableSegs.length, 2);
  for (const s of tableSegs) {
    assert.ok(fs.existsSync(path.join(dir, s.src)));
  }
});

test('build 260809：mermaid 渲染 3 块、公众号引用 raw URL、未推送检查报缺失', async () => {
  const postDir = path.join(REPO_ROOT, 'content/posts/260809-multi-agent-scheduling-architecture');
  // 场景一（预期失败）：mermaid generated PNG 尚未推送 → 未推送检查报错，不写产物
  const outDir260809 = path.join(OUT_DIR, '260809-multi-agent-scheduling-architecture');
  fs.rmSync(outDir260809, { recursive: true, force: true });
  await assert.rejects(
    () =>
      runBuild({
        repoRoot: REPO_ROOT,
        postArg: 'content/posts/260809-multi-agent-scheduling-architecture',
        skipPushCheck: false,
      }),
    (e) => {
      assert.match(e.message, /图片尚未推送/);
      assert.match(e.message, /images\/generated\/mermaid-[0-9a-f]{12}\.png/);
      return true;
    }
  );
  assert.ok(!fs.existsSync(outDir260809), '未推送检查失败时不应写任何产物');

  // 场景二：--skip-push-check 成功
  const data = await runBuild({
    repoRoot: REPO_ROOT,
    postArg: 'content/posts/260809-multi-agent-scheduling-architecture',
    skipPushCheck: true,
  });
  const generatedDir = path.join(postDir, 'images/generated');
  const pngs = fs.readdirSync(generatedDir).filter((f) => f.endsWith('.png'));
  assert.equal(pngs.length, 3, '260809 应有 3 个 mermaid PNG');
  for (const f of pngs) {
    assert.match(f, /^mermaid-[0-9a-f]{12}\.png$/);
    // X assets 中有同名副本
    assert.ok(fs.existsSync(path.join(OUT_DIR, '260809-multi-agent-scheduling-architecture', 'assets', f)));
    // 公众号 HTML 引用其 raw URL
    assert.ok(
      data.wechat.html.includes(
        `${GITHUB_RAW_BASE}/content/posts/260809-multi-agent-scheduling-architecture/images/generated/${f}`
      ),
      `公众号 HTML 应引用 mermaid raw URL：${f}`
    );
  }
  // X 分段：3 个 mermaid image 段
  const mermaidSegs = data.x.segments.filter(
    (s) => s.kind === 'image' && s.src.includes('mermaid-')
  );
  assert.equal(mermaidSegs.length, 3);
  // 中文文件名 percent-encode（agent控制台.png）
  assert.ok(
    data.wechat.html.includes(
      `${GITHUB_RAW_BASE}/content/posts/260809-multi-agent-scheduling-architecture/images/${encodeURIComponent('agent控制台.png')}`
    )
  );
});

test('build 261004：X image 段顺序严格等于原文图片出现顺序，且每图前一个 html 段末尾 = 原文前文', async () => {
  const data = await runBuild({
    repoRoot: REPO_ROOT,
    postArg: 'content/posts/261004-context-and-loop',
    skipPushCheck: false,
  });
  const segs = data.x.segments;

  // 原文图片序列（frontmatter 之后的正文，逐行扫描）与每张图的前文锚点行
  const raw = fs.readFileSync(
    path.join(REPO_ROOT, 'content/posts/261004-context-and-loop/index.md'),
    'utf8'
  );
  const bodyLines = raw.slice(raw.indexOf('\n---\n') + 5).split('\n');
  const textify = (h) =>
    h
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, '');
  const normMd = (s) =>
    s
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/[#>*_`|]/g, '')
      .replace(/^-\s+/, '')
      .replace(/\s+/g, '');

  const expected = []; // {src, anchor|null}
  bodyLines.forEach((line, idx) => {
    const m = line.match(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
    if (!m) return;
    let anchor = null;
    for (let j = idx - 1; j >= 0; j--) {
      const l = bodyLines[j].trim();
      if (!l || /^!\[/g.test(l)) continue; // 跳过空行与图片行（261004 无连续图片）
      anchor = l;
      break;
    }
    expected.push({ src: m[2], anchor });
  });

  const imgSegIdx = [];
  segs.forEach((s, i) => {
    // 只比对正文图片段；表格/代码 PNG（x-table-/x-code-）是派生产物，不在原文图片序列里
    if (s.kind === 'image' && !/\/x-(table|code)-/.test(s.src)) imgSegIdx.push(i);
  });
  assert.equal(imgSegIdx.length, expected.length, `image 段数应等于原文图片数（${expected.length}）`);
  expected.forEach((exp, k) => {
    const seg = segs[imgSegIdx[k]];
    assert.equal(
      seg.src,
      `assets/${path.basename(exp.src)}`,
      `第 ${k + 1} 张图顺序错乱：期望 ${exp.src}，实际 ${seg.src}`
    );
  });

  // 每个图片段之前最近的 html 段的末尾文本 = 原文中该图前最近的一段文字（末尾 20 字）
  let checkedAnchors = 0;
  expected.forEach((exp, k) => {
    if (!exp.anchor) return; // 首图（cover）前无正文
    const segIdx = imgSegIdx[k];
    let prevHtml = null;
    for (let j = segIdx - 1; j >= 0; j--) {
      if (segs[j].kind === 'html') {
        prevHtml = segs[j].html;
        break;
      }
    }
    assert.ok(prevHtml, `图片 ${exp.src} 之前应存在 html 段`);
    const tailHtml = textify(prevHtml);
    const tailMd = normMd(exp.anchor);
    assert.ok(
      tailHtml.endsWith(tailMd),
      `图片 ${exp.src} 前一个 html 段末尾「…${tailHtml.slice(-30)}」未以原文前文「${tailMd}」结尾（顺序错乱或缓冲区未 flush）`
    );
    checkedAnchors += 1;
  });
  assert.ok(checkedAnchors >= 10, `应有大量锚点被检查（实际 ${checkedAnchors}）`);
});

test('X 分段最小 fixture：文字A/图a/文字B/图b/文字C → html(image){3}交替，图片不积压正文', async () => {
  const { buildXSegments } = await import('../lib/x.mjs');
  const md = '文字A\n\n![](images/a.png)\n\n文字B\n\n![](images/b.png)\n\n文字C';
  const { segments } = await buildXSegments(md, {
    dirName: '__fixture__',
    repoRoot: REPO_ROOT,
    browser: null,
    blogUrl: 'https://example.com/p/',
  });
  const kinds = segments.map((s) => s.kind).join(',');
  assert.equal(kinds, 'html,image,html,image,html,html', `段序列错乱：${kinds}`);
  assert.match(segments[0].html, /文字A/);
  assert.equal(segments[1].src, 'assets/a.png');
  assert.match(segments[2].html, /文字B/);
  assert.equal(segments[3].src, 'assets/b.png');
  assert.match(segments[4].html, /文字C/);
  assert.ok(!segments[4].html.includes('文字A'), 'html 段不应积压此前正文');
  assert.match(segments[5].html, /本文首发于我的博客/);
});

test('blog URL：frontmatter url 优先，否则 /posts/<目录名>/', () => {
  const index = buildPostsIndex(REPO_ROOT);
  assert.equal(
    blogUrlOf('260328-context-is-all-you-need', index),
    'https://zj1123581321.com/posts/context-is-all-you-need/'
  );
  assert.equal(
    blogUrlOf('261004-context-and-loop', index),
    'https://zj1123581321.com/posts/261004-context-and-loop/'
  );
});
