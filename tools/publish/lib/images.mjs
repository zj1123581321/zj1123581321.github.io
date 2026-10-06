import fs from 'node:fs';
import path from 'node:path';
import { GITHUB_RAW_BASE } from './links.mjs';

// 正文图片三类（约束卡「图片三类」）：
//   ① bundle 内相对路径 images/xx.png        → content/posts/<目录>/<相对路径>
//   ② 站点根路径 /migrated-images/...、/post-images/... → static/<路径>
//   ③ http(s) 外链                            → 原样保留
// 其余形式（含 Windows 盘符、站根其它目录、协议相对 // 等）→ 抛错并给出行号。
export function classifyImageSrc(src) {
  if (/^https?:\/\//.test(src)) {
    return { kind: 'external', src };
  }
  if (/^\/(migrated-images|post-images)\//.test(src)) {
    const rel = src.slice(1); // static/<路径>
    return {
      kind: 'static',
      repoRelPath: `static/${rel}`,
      wechatUrl: `${GITHUB_RAW_BASE}/static/${encodePathSegments(rel)}`,
    };
  }
  // bundle 内相对路径：不允许 ../ 逃出 bundle、不允许站根绝对路径、不允许协议相对
  if (!src.trim() || /^\/|^\/\/|\.\.\//.test(src) || /^[A-Za-z]:/.test(src)) {
    return null;
  }
  return { kind: 'bundle', relPath: src };
}

function encodePathSegments(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}

// ① 类图片的公众号 raw URL（需要目录名）
export function bundleWechatUrl(dirName, relPath) {
  return `${GITHUB_RAW_BASE}/content/posts/${encodeURIComponent(dirName)}/${encodePathSegments(relPath)}`;
}

// 从 markdown 正文提取全部图片引用（含行号），用于：未推送检查、图片复制、X assets。
// 返回 [{src, line}]
export function extractImages(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const re = /!\[([^\]]*)\]\(([^)\s]*)(?:\s+"[^"]*")?\)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      out.push({ alt: m[1], src: m[2], line: i + 1 });
    }
  });
  return out;
}

// 解析一篇正文的全部图片 → [{..., resolved}]，解析不了直接抛错（带行号）
export function resolveAllImages(markdown, dirName) {
  return extractImages(markdown).map(({ alt, src, line }) => {
    const c = classifyImageSrc(src);
    if (!c) {
      throw new Error(`图片路径不属于受支持的三类（bundle 相对 / /migrated-images|/post-images / http外链）：第 ${line} 行 ${src}（文章：${dirName}）`);
    }
    if (c.kind === 'bundle') {
      const filePath = path.join('content/posts', dirName, src);
      c.repoRelPath = filePath;
      c.wechatUrl = bundleWechatUrl(dirName, src);
    }
    return { alt, src, line, ...c };
  });
}

// 公众号图片 URL 替换（约束卡）：①bundle ②static → raw.githubusercontent（逐段 percent-encode），③外链原样。
// 在渲染前对源文本替换；路径不合法由 resolveAllImages 先抛错（带行号）。
export function rewriteImagesForWechat(markdown, dirName) {
  const resolved = resolveAllImages(markdown, dirName);
  const urlBySrc = new Map();
  for (const img of resolved) {
    if (img.kind !== 'external') urlBySrc.set(img.src, img.wechatUrl);
  }
  return markdown.replace(/(!\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g, (whole, pre, src, post) =>
    urlBySrc.has(src) ? `${pre}${urlBySrc.get(src)}${post}` : whole
  );
}

export function copyFileToDir(srcAbs, destDir, destName) {
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, destName);
  fs.copyFileSync(srcAbs, dest);
  return dest;
}
