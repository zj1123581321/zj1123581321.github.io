#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { sourceHash, readFrontmatter } from './lib.mjs';

const repoRoot = process.argv[2] ?? process.cwd();
const postsDir = path.join(repoRoot, 'content', 'posts');

function rel(dir, name) {
  return path.posix.join('content', 'posts', dir, name);
}

const errors = [];
let translations = 0;
let stale = 0;

const dirs = fs.existsSync(postsDir)
  ? fs.readdirSync(postsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
  : [];

for (const dir of dirs) {
  const enAbs = path.join(postsDir, dir, 'index.en.md');
  if (!fs.existsSync(enAbs)) {
    continue;
  }
  translations += 1;
  const enRel = rel(dir, 'index.en.md');
  const zhAbs = path.join(postsDir, dir, 'index.md');
  const zhRel = rel(dir, 'index.md');
  if (!fs.existsSync(zhAbs)) {
    errors.push({ file: zhRel, reason: `missing Chinese index.md for ${dir}` });
    continue;
  }

  const enText = fs.readFileSync(enAbs, 'utf8');
  const zhText = fs.readFileSync(zhAbs, 'utf8');
  let enFm;
  let zhFm;
  try {
    enFm = readFrontmatter(enText);
  } catch (e) {
    errors.push({ file: enRel, reason: e.message });
    continue;
  }
  try {
    zhFm = readFrontmatter(zhText);
  } catch (e) {
    errors.push({ file: zhRel, reason: e.message });
    continue;
  }

  if (!Object.hasOwn(enFm, 'sourceHash')) {
    errors.push({ file: enRel, reason: 'missing sourceHash' });
  }

  if (Object.hasOwn(zhFm, 'url')) {
    const expected = `/en${zhFm.url}`;
    if (enFm.url !== expected) {
      errors.push({ file: enRel, reason: `url must be ${expected}` });
    }
  } else if (Object.hasOwn(enFm, 'url')) {
    errors.push({ file: enRel, reason: 'url must be absent when Chinese has no url' });
  }

  if (Object.hasOwn(enFm, 'sourceHash')) {
    const actual = sourceHash(zhText);
    if (enFm.sourceHash !== actual) {
      stale += 1;
      console.log(`::warning file=${enRel}::I18N-STALE ${dir}: Chinese source changed since translation`);
    }
  }
}

for (const err of errors) {
  console.log(`::error file=${err.file}::I18N-CHECK-FAILED ${err.reason}`);
}

if (errors.length > 0) {
  process.exit(1);
}
console.log(`i18n check: ${translations} translations, ${stale} stale`);
