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
 *   1. 下载文章中所有局域网图床图片到文章目录
 *   2. 替换图片引用为相对路径
 *   3. 生成 Hugo Page Bundle 结构
 *   4. 自动添加 frontmatter（如果没有的话）
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, 'content', 'posts');

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

const filename = path.basename(sourceFile, '.md');
const slug = args[1] || filename.replace(/\s+/g, '-').toLowerCase();
const postDir = path.join(CONTENT_DIR, slug);

fs.mkdirSync(postDir, { recursive: true });

console.log(`处理文章: ${filename}`);
console.log(`目标目录: ${postDir}`);

// --- 读取源文件 ---
let content = fs.readFileSync(sourceFile, 'utf-8');

// --- 提取并下载局域网图片 ---
const imgPattern = /http:\/\/192\.168\.[^\s)]+/g;
const urls = [...new Set(content.match(imgPattern) || [])];

console.log(`发现 ${urls.length} 张局域网图片\n`);

function download(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

let imgCount = 0;

for (const url of urls) {
  // 从 URL 提取文件名并解码
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

// --- 处理 frontmatter ---
if (!content.trimStart().startsWith('---')) {
  // 提取第一个 # 标题
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename;
  const date = new Date().toISOString().slice(0, 10);

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
