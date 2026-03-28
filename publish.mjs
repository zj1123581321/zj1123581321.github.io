#!/usr/bin/env node
/**
 * 发布 Obsidian 文章到 Hugo 博客
 *
 * 用法: node publish.mjs <markdown文件路径> [slug]
 *
 * 示例:
 *   node publish.mjs "path/to/my-article.md"
 *   node publish.mjs "path/to/my-article.md" custom-slug
 *
 * 功能:
 *   1. 下载文章中所有远程图床图片到文章目录（域名在 .publish.config.json 中配置）
 *   2. 复制 Obsidian 同目录下的本地图片引用
 *   3. 替换图片引用为相对路径
 *   4. 生成 Hugo Page Bundle 结构
 *   5. 自动添加 frontmatter（如果没有的话），日期从文件名前缀提取
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, 'content', 'posts');
const CONFIG_PATH = path.join(__dirname, '.publish.config.json');

// --- 读取配置 ---
let config = { imageHosts: [] };
if (fs.existsSync(CONFIG_PATH)) {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  console.log(`已加载配置，图床域名: ${config.imageHosts.length} 个`);
} else {
  console.warn('警告: 未找到 .publish.config.json，将跳过远程图片下载');
  console.warn('请创建配置文件，格式参考 .publish.config.example.json');
}

// --- 参数解析 ---
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('用法: node publish.mjs <markdown文件路径> [slug]');
  process.exit(1);
}

const sourceFile = path.resolve(args[0]);
if (!fs.existsSync(sourceFile)) {
  console.error(`错误: 文件不存在 - ${sourceFile}`);
  process.exit(1);
}

const sourceDir = path.dirname(sourceFile);
const filename = path.basename(sourceFile, '.md');
const slug = args[1] || filename.replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').toLowerCase();
const postDir = path.join(CONTENT_DIR, slug);

fs.mkdirSync(postDir, { recursive: true });

console.log(`处理文章: ${filename}`);
console.log(`目标目录: ${postDir}`);

// --- 读取源文件 ---
let content = fs.readFileSync(sourceFile, 'utf-8');

// --- 构建远程图片匹配模式 ---
// 匹配配置中所有图床域名的 URL
function buildImagePattern(hosts) {
  if (!hosts || hosts.length === 0) return null;
  // 转义域名中的特殊正则字符
  const escaped = hosts.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`https?://(?:${escaped.join('|')})[^\\s)]*`, 'g');
}

const remoteImgPattern = buildImagePattern(config.imageHosts);

// --- 下载远程图片 ---
async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

let imgCount = 0;

// 处理远程图床图片
if (remoteImgPattern) {
  const urls = [...new Set(content.match(remoteImgPattern) || [])];
  console.log(`\n发现 ${urls.length} 张远程图床图片`);

  for (const url of urls) {
    const decoded = decodeURIComponent(url.split('/').pop());
    const safeName = decoded.replace(/\s+/g, '-');

    process.stdout.write(`  下载: ${safeName} ... `);

    try {
      const data = await download(url);
      fs.writeFileSync(path.join(postDir, safeName), data);
      content = content.replaceAll(url, safeName);
      console.log(`OK (${Math.round(data.length / 1024)}KB)`);
      imgCount++;
    } catch (e) {
      console.log(`失败: ${e.message}，保留原始链接`);
    }
  }
}

// --- 处理本地图片引用 ---
// 匹配 ![alt](相对路径) 形式，排除 http 链接和已下载的纯文件名
const localImgPattern = /!\[[^\]]*\]\((?!https?:\/\/)([^)]+)\)/g;
const localMatches = [...content.matchAll(localImgPattern)];
// 过滤掉已经被远程下载替换过的纯文件名（它们已在 postDir 中）
const localImages = [...new Set(localMatches.map(m => m[1]))]
  .filter(ref => !fs.existsSync(path.join(postDir, ref)));

if (localImages.length > 0) {
  console.log(`\n发现 ${localImages.length} 张本地图片引用`);

  for (const imgRef of localImages) {
    const decodedRef = decodeURIComponent(imgRef);
    const imgSourcePath = path.join(sourceDir, decodedRef);
    const safeName = path.basename(decodedRef).replace(/\s+/g, '-');

    process.stdout.write(`  复制: ${safeName} ... `);

    if (fs.existsSync(imgSourcePath)) {
      fs.copyFileSync(imgSourcePath, path.join(postDir, safeName));
      content = content.replaceAll(imgRef, safeName);
      console.log('OK');
      imgCount++;
    } else {
      console.log(`未找到: ${imgSourcePath}`);
    }
  }
}

// --- 处理 frontmatter ---
if (!content.trimStart().startsWith('---')) {
  // 提取第一个 # 标题
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  // 尝试从文件名提取日期（支持 YYMMDD 格式，如 260220 → 2026-02-20）
  const dateMatch = filename.match(/^(\d{6})/);
  let date;
  if (dateMatch) {
    const d = dateMatch[1];
    date = `20${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}`;
  } else {
    date = new Date().toISOString().slice(0, 10);
  }

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
draft: false
---`;

  // 如果第一行是 # 标题，移除（已放入 frontmatter）
  if (content.trimStart().startsWith('# ')) {
    content = content.replace(/^#\s+.+\n+/, '');
  }

  content = frontmatter + '\n\n' + content;
}

// --- 写入文件 ---
fs.writeFileSync(path.join(postDir, 'index.md'), content, 'utf-8');

console.log(`
发布完成!
  文章: ${path.join(postDir, 'index.md')}
  图片: ${imgCount} 张已本地化

部署: git add -A && git commit -m "post: ${slug}" && git push
`);
