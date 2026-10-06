import fs from 'node:fs';
import path from 'node:path';
import grayMatter from 'gray-matter';

export const SITE_BASE = 'https://zj1123581321.com';
export const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/zj1123581321/zj1123581321.github.io/main';

// 扫描 content/posts，建「目录名 → frontmatter」与「frontmatter url 末段 → 目录名」两张索引。
// 消费者：build.mjs（内链解析）、backfill-wechat-url.mjs（回填映射）。
export function buildPostsIndex(repoRoot) {
  const postsRoot = path.join(repoRoot, 'content/posts');
  const byDir = new Map();
  const byUrlLast = new Map();
  for (const entry of fs.readdirSync(postsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(postsRoot, entry.name, 'index.md');
    if (!fs.existsSync(indexPath)) continue;
    const fm = grayMatter(fs.readFileSync(indexPath, 'utf8')).data ?? {};
    byDir.set(entry.name, { dirName: entry.name, fm, indexPath });
    if (typeof fm.url === 'string' && fm.url) {
      const last = fm.url.replace(/\/$/, '').split('/').pop();
      if (!last) continue;
      if (byUrlLast.has(last) && byUrlLast.get(last) !== entry.name) {
        throw new Error(`url 末段冲突：${last} 同时对应 ${byUrlLast.get(last)} 与 ${entry.name}`);
      }
      byUrlLast.set(last, entry.name);
    }
  }
  return { byDir, byUrlLast };
}

export function parseFrontmatter(indexPath) {
  const raw = fs.readFileSync(indexPath, 'utf8');
  return { matter: grayMatter(raw), raw };
}

// href 是否为内链形态：../<x>/ 或 /posts/<x>/（可带 #锚点）
export function matchInternalLink(href) {
  const hashIdx = href.indexOf('#');
  const base = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
  let m;
  if ((m = base.match(/^\.\.\/([^/]+)\/?$/))) {
    return { target: m[1], hash };
  }
  if ((m = base.match(/^\/posts\/([^/]+)\/?$/))) {
    return { target: m[1], hash };
  }
  return null;
}

// 解析内链目标：先按目录名匹配 content/posts/<x>/，再按各文章 frontmatter url: 末段匹配。
// 匹配不到抛错（找不到内链目标）。
export function resolveInternalLink(href, index, sourceDirName) {
  const matched = matchInternalLink(href);
  if (!matched) return null;
  const { target, hash } = matched;
  let dirName = null;
  if (index.byDir.has(target)) {
    dirName = target;
  } else if (index.byUrlLast.has(target)) {
    dirName = index.byUrlLast.get(target);
  } else {
    throw new Error(`找不到内链目标：${href}（来源文章：${sourceDirName}）`);
  }
  return { dirName, hash };
}

// 目标文章的博客 URL = https://zj1123581321.com + (frontmatter url: 若有，否则 /posts/<目录名>/)
export function blogUrlOf(dirName, index) {
  const post = index.byDir.get(dirName);
  const urlPath = typeof post?.fm?.url === 'string' && post.fm.url ? post.fm.url : `/posts/${dirName}/`;
  return SITE_BASE + urlPath;
}

const LINK_RE = /(?<!!)(\[((?:[^\][\\]|\[[^\]]*\])*)\])\(([^)\s]*)(?:\s+"([^"]*)")?\)/g;

function rewriteLinks(markdown, fn) {
  return markdown.replace(LINK_RE, (whole, _wrap, text, href, title) => {
    const replaced = fn(text, href, title);
    return replaced === null || replaced === undefined ? whole : replaced;
  });
}

// 公众号链接映射（约束卡「内链解析」「外链转脚注」）：
//   内链有 wechat_url → 公众号链接（保持可点，mp.weixin 不转脚注）
//   内链无 wechat_url → 博客 URL，并按外链转脚注（mdnice 同款加 title）
//   外链 http(s) 除 mp.weixin.qq.com → 加 title 转脚注；已带 title 的原样（linkfoot 处理）
//   其余 → 原样
export function rewriteLinksForWechat(markdown, index, dirName) {
  return rewriteLinks(markdown, (text, href, title) => {
    const internal = resolveInternalLink(href, index, dirName);
    if (internal) {
      const wechatUrl = index.byDir.get(internal.dirName)?.fm?.wechat_url;
      const blogUrl = blogUrlOf(internal.dirName, index) + internal.hash;
      if (typeof wechatUrl === 'string' && wechatUrl) {
        return `[${text}](${wechatUrl}${internal.hash})`;
      }
      return `[${text}](${blogUrl} "${text}")`;
    }
    if (isFootnoteEligibleExternal(href)) {
      if (title) return null;
      return `[${text}](${href} "${text}")`;
    }
    return null;
  });
}

// X 链接映射：内链一律 → 博客 URL；外链原样。
export function rewriteLinksForX(markdown, index, dirName) {
  return rewriteLinks(markdown, (text, href) => {
    const internal = resolveInternalLink(href, index, dirName);
    if (!internal) return null;
    return `[${text}](${blogUrlOf(internal.dirName, index) + internal.hash})`;
  });
}

function isFootnoteEligibleExternal(href) {
  if (!/^https?:\/\//.test(href)) return false;
  let hostname;
  try {
    hostname = new URL(href).hostname;
  } catch {
    return false;
  }
  return !/(^|\.)mp\.weixin\.qq\.com$/.test(hostname);
}
