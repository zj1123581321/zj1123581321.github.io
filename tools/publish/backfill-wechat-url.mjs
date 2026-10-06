#!/usr/bin/env node
// 一次性回填：从已有 *公众号版.md 提取「原文内链 → 公众号 URL」对应关系，
// 给目标文章 frontmatter 追加 wechat_url: "<url>"。
//
// 配对规则：原文 index.md 的内链 [文本](../<x>/ 或 /posts/<x>/) 与公众号版中
// 同文本的 [文本](https://mp.weixin.qq.com/s/...) 配对（同一文本在两边都唯一，
// 冲突即报错停止；同一目标从不同文章得到不同 URL 也报错停止）。
// 用法：node tools/publish/backfill-wechat-url.mjs [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPostsIndex, matchInternalLink, resolveInternalLink } from './lib/links.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dryRun = process.argv.includes('--dry-run');

const LINK_RE = /(?<!!)(\[((?:[^\][\\]|\[[^\]]*\])*)\])\(([^)\s]*)(?:\s+"([^"]*)")?\)/g;
const MP_RE = /https:\/\/mp\.weixin\.qq\.com\/s\/[A-Za-z0-9_-]+/;

const postsRoot = path.join(REPO_ROOT, 'content/posts');
const index = buildPostsIndex(REPO_ROOT);

// 目标目录名 → { url, sources: [证据来源] }
const mapping = new Map();
const skipped = [];

for (const dir of fs.readdirSync(postsRoot)) {
  const postDir = path.join(postsRoot, dir);
  if (!fs.statSync(postDir).isDirectory()) continue;
  const wechatFile = fs.readdirSync(postDir).find((f) => f.includes('公众号版') && f.endsWith('.md'));
  if (!wechatFile) continue;
  const body = fs.readFileSync(path.join(postDir, 'index.md'), 'utf8');
  const wechat = fs.readFileSync(path.join(postDir, wechatFile), 'utf8');

  // 公众号版：文本 → mp URL（同文本多个 URL 即报错）
  const textToMp = new Map();
  for (const m of wechat.matchAll(/\[([^\]]+)\]\((https:\/\/mp\.weixin\.qq\.com\/s\/[^)\s]+)\)/g)) {
    if (textToMp.has(m[1]) && textToMp.get(m[1]) !== m[2]) {
      throw new Error(`公众号版同文本多 URL：${dir}/${wechatFile} 文本「${m[1]}」`);
    }
    textToMp.set(m[1], m[2]);
  }

  // 原文内链：文本 → 目标目录名（同文本多个目标即报错）
  const textToTarget = new Map();
  for (const m of body.matchAll(LINK_RE)) {
    const internal = matchInternalLink(m[3]);
    if (!internal) continue;
    let target;
    try {
      target = resolveInternalLink(m[3], index, dir).dirName;
    } catch (e) {
      skipped.push(`${dir}：${e.message}`);
      continue;
    }
    if (textToTarget.has(m[2]) && textToTarget.get(m[2]) !== target) {
      throw new Error(`原文同文本多目标：${dir} 文本「${m[2]}」→ ${textToTarget.get(m[2])} 与 ${target}`);
    }
    textToTarget.set(m[2], target);
  }

  // 配对：同文本两侧都在 → 目标 → mp URL
  for (const [text, target] of textToTarget) {
    const mp = textToMp.get(text);
    if (!mp) {
      skipped.push(`${dir}：「${text}」→ ${target}（公众号版无对应链接）`);
      continue;
    }
    if (target === dir) continue; // 自引用不回填
    if (!mapping.has(target)) {
      mapping.set(target, { url: mp, sources: [] });
    }
    const rec = mapping.get(target);
    if (rec.url !== mp) {
      throw new Error(`目标 ${target} 得到冲突 URL：${rec.url}（${rec.sources.join('、')}）与 ${mp}（${dir}）`);
    }
    rec.sources.push(`${dir}/${wechatFile}`);
  }
}

console.log(`共 ${mapping.size} 个目标待回填：`);
for (const [target, rec] of mapping) {
  console.log(`  ${target}\n    ${rec.url}\n    证据：${rec.sources.join('、')}`);
}
if (skipped.length) {
  console.log(`\n跳过 ${skipped.length} 条：`);
  for (const s of skipped) console.log(`  - ${s}`);
}

if (dryRun) {
  console.log('\n--dry-run：未写入。');
  process.exit(0);
}

console.log('');
for (const [target, rec] of mapping) {
  const indexPath = path.join(postsRoot, target, 'index.md');
  const raw = fs.readFileSync(indexPath, 'utf8');
  if (/^wechat_url:/m.test(raw)) {
    console.log(`跳过（已有 wechat_url）：${target}`);
    continue;
  }
  const fmEnd = raw.indexOf('\n---\n');
  if (fmEnd < 0) {
    throw new Error(`找不到 frontmatter 结束标记：${indexPath}`);
  }
  const insertAt = fmEnd; // 在结束 --- 行前插入
  const updated = raw.slice(0, insertAt) + `\nwechat_url: "${rec.url}"` + raw.slice(insertAt);
  fs.writeFileSync(indexPath, updated);
  console.log(`已写入：${target} → ${rec.url}`);
}
