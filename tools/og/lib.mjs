import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readFrontmatter } from '../i18n/lib.mjs';

export const TEMPLATE_VERSION = '5';
export const META_PREFIX = 'blog-og-meta:v1 sha256:';
export const POSTS_DIR = path.resolve('content/posts');

export function frontmatterText(value) {
  return String(value ?? '').replace(/\\(["\\])/g, '$1');
}

export function inputHash(markdown, language) {
  const frontmatter = readFrontmatter(markdown);
  const input = JSON.stringify({
    title: frontmatterText(frontmatter.title),
    description: frontmatter.description == null ? null : frontmatterText(frontmatter.description),
    language,
    templateVersion: TEMPLATE_VERSION,
  });
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function jpegInputHash(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return null;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if (marker === 0xfe) {
      const comment = bytes.toString('ascii', offset + 2, offset + length);
      const match = comment.match(/^blog-og-meta:v1 sha256:([a-f0-9]{64})$/);
      if (match) return match[1];
    }
    offset += length;
  }
  return null;
}

export function addJpegInputHash(bytes, hash) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('OG-CARD-ENCODER-NOT-JPEG');
  }
  const payload = Buffer.from(`${META_PREFIX}${hash}`, 'ascii');
  const segment = Buffer.alloc(payload.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xfe;
  segment.writeUInt16BE(payload.length + 2, 2);
  payload.copy(segment, 4);
  return Buffer.concat([bytes.subarray(0, 2), segment, bytes.subarray(2)]);
}

export function postMarkdownFiles(postsDir = POSTS_DIR) {
  return fs.readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => ['zh', 'en'].map((language) => ({
      language,
      markdownPath: path.join(postsDir, entry.name, language === 'zh' ? 'index.md' : 'index.en.md'),
      cardPath: path.join(postsDir, entry.name, `og-card.${language}.jpg`),
    })))
    .filter(({ markdownPath }) => fs.existsSync(markdownPath));
}

export function checkCards(postsDir = POSTS_DIR) {
  const issues = [];
  for (const { language, markdownPath, cardPath } of postMarkdownFiles(postsDir)) {
    const relativeCardPath = path.relative(process.cwd(), cardPath);
    if (!fs.existsSync(cardPath)) {
      issues.push({
        code: 'OG-CARD-MISSING',
        path: relativeCardPath,
        repair: `node tools/og/generate.mjs ${path.dirname(relativeCardPath)}`,
      });
      continue;
    }
    const expected = inputHash(fs.readFileSync(markdownPath, 'utf8'), language);
    const actual = jpegInputHash(fs.readFileSync(cardPath));
    if (actual !== expected) {
      issues.push({
        code: 'OG-CARD-STALE',
        path: relativeCardPath,
        repair: `node tools/og/generate.mjs ${path.dirname(relativeCardPath)}`,
      });
    }
  }
  return issues;
}
