import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { addJpegInputHash, checkCards, frontmatterText, inputHash } from '../lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CHECK_SCRIPT = path.join(ROOT, 'tools/og/check.mjs');

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-og-check-'));
  const postDir = path.join(directory, 'sample');
  fs.mkdirSync(postDir);
  const markdownPath = path.join(postDir, 'index.md');
  const cardPath = path.join(postDir, 'og-card.zh.jpg');
  const writeMarkdown = (title) => fs.writeFileSync(markdownPath, `---\ntitle: "${title}"\ndescription: "A description"\n---\nBody\n`);
  const writeCard = () => fs.writeFileSync(cardPath, addJpegInputHash(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), inputHash(fs.readFileSync(markdownPath, 'utf8'), 'zh')));
  return { directory, postDir, cardPath, writeMarkdown, writeCard };
}

test('check CLI 对缺图打印 OG-CARD-MISSING 并返回非零', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
  f.writeMarkdown('Fixture');
  const result = spawnSync(process.execPath, [CHECK_SCRIPT, f.directory], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /OG-CARD-MISSING .*og-card\.zh\.jpg 修复：node tools\/og\/generate\.mjs/);
});

test('check CLI 对标题改动后的卡片打印 OG-CARD-STALE', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
  f.writeMarkdown('Original');
  f.writeCard();
  f.writeMarkdown('Changed');
  const result = spawnSync(process.execPath, [CHECK_SCRIPT, f.directory], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /OG-CARD-STALE .*og-card\.zh\.jpg 修复：node tools\/og\/generate\.mjs/);
});

test('双引号 YAML 字符串按展示语义解码转义字符', () => {
  assert.equal(frontmatterText('A \\\"quoted\\\" title'), 'A "quoted" title');
  assert.equal(frontmatterText('C:\\\\path'), 'C:\\path');
});

test('最新卡片检查通过，语言字段也参与输入哈希', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
  f.writeMarkdown('Current');
  f.writeCard();
  assert.deepEqual(checkCards(f.directory), []);
  assert.notEqual(inputHash(fs.readFileSync(path.join(f.directory, 'sample/index.md'), 'utf8'), 'zh'), inputHash(fs.readFileSync(path.join(f.directory, 'sample/index.md'), 'utf8'), 'en'));
});
