#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFrontmatter } from '../i18n/lib.mjs';
import { frontmatterText, inputHash, jpegInputHash, POSTS_DIR, postMarkdownFiles } from './lib.mjs';
import { renderCard } from './render.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AVATAR_PATH = path.join(REPO_ROOT, 'static/images/avatar.png');

function selectedFiles(argument) {
  if (!argument) return postMarkdownFiles(POSTS_DIR);
  const directory = path.resolve(argument);
  const relative = path.relative(POSTS_DIR, directory);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
    throw new Error(`OG-CARD-INVALID-POST-DIRECTORY ${argument}`);
  }
  const files = postMarkdownFiles(POSTS_DIR).filter(({ markdownPath }) => path.dirname(markdownPath) === directory);
  if (files.length === 0) throw new Error(`OG-CARD-NO-ARTICLES ${argument}`);
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('用法：node tools/og/generate.mjs [content/posts/<slug>]');
  const files = selectedFiles(args[0]);
  for (const { language, markdownPath, cardPath } of files) {
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    const frontmatter = readFrontmatter(markdown);
    const hash = inputHash(markdown, language);
    if (fs.existsSync(cardPath) && jpegInputHash(fs.readFileSync(cardPath)) === hash) {
      console.log(`未变：${path.relative(REPO_ROOT, cardPath)}`);
      continue;
    }
    const bytes = await renderCard({
      title: frontmatterText(frontmatter.title),
      description: frontmatter.description == null ? '' : frontmatterText(frontmatter.description),
      language,
      avatarPath: AVATAR_PATH,
      hash,
    });
    if (bytes.length > 150 * 1024) {
      throw new Error(`OG-CARD-TOO-LARGE ${path.relative(REPO_ROOT, cardPath)} ${bytes.length} bytes`);
    }
    if (fs.existsSync(cardPath) && fs.readFileSync(cardPath).equals(bytes)) {
      console.log(`未变：${path.relative(REPO_ROOT, cardPath)}`);
      continue;
    }
    fs.writeFileSync(cardPath, bytes);
    console.log(`生成：${path.relative(REPO_ROOT, cardPath)} (${Math.ceil(bytes.length / 1024)}KB)`);
  }
}

await main();
