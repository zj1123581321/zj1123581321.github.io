import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sourceHash } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATE = path.resolve(HERE, '..', 'translate.mjs');
const CHECK = path.resolve(HERE, '..', 'check.mjs');

const ZH_UNIQUE = '验证可闭环是一句独特的话';
const ZH_BODY = [
  '这是中文正文的第一段。',
  '',
  `${ZH_UNIQUE}，出现在第二段。`,
  '',
  '```js',
  'const x = 1; // 注释',
  '```',
  '',
].join('\n');

const STUB = {
  title: 'Demo Title: Translated',
  description: 'English description sentence.',
  body: 'First paragraph of the translated body.\n\nA unique english sentence with [a link](images/pic.png).\n',
};

const STUB_OUTPUT = [
  '=== TITLE ===',
  STUB.title,
  '=== DESCRIPTION ===',
  STUB.description,
  '=== BODY ===',
  STUB.body,
].join('\n');

const STUB_OUTPUT_NO_DESC = [
  '=== TITLE ===',
  STUB.title,
  '=== BODY ===',
  STUB.body,
].join('\n');

function makeStub(dir, { output = STUB_OUTPUT, exitCode = 0 } = {}) {
  const bin = path.join(dir, 'stub-bin');
  fs.mkdirSync(bin, { recursive: true });
  const stub = path.join(bin, 'claude');
  const script = [
    '#!/usr/bin/env node',
    "const fs = require('node:fs');",
    "const path = require('node:path');",
    "let input = '';",
    "process.stdin.on('data', (c) => { input += c; });",
    "process.stdin.on('end', () => {",
    "  fs.writeFileSync(path.join(process.cwd(), 'stub-call.json'),",
    `    JSON.stringify({ argv: process.argv.slice(2), stdin: input }));`,
    `  process.stdout.write(${JSON.stringify(output)});`,
    `  process.exitCode = ${exitCode};`,
    '});',
    '',
  ].join('\n');
  fs.writeFileSync(stub, script);
  fs.chmodSync(stub, 0o755);
  return bin;
}

// description: null 表示中文没有 description
function zhArticle({ url, description = '中文描述一句话' } = {}) {
  const fm = {
    title: '"中文标题：演示"',
    date: '2026-01-02',
    draft: 'false',
  };
  if (url !== undefined) {
    fm.url = `"${url}"`;
  }
  fm.tags = '["AI"]';
  if (description !== null) {
    fm.description = `"${description}"`;
  }
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n\n${ZH_BODY}`;
}

function withSandbox(fn, stubOpts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-translate-'));
  try {
    makeStub(dir, stubOpts);
    const postDir = path.join(dir, 'content', 'posts', '260101-demo');
    fs.mkdirSync(postDir, { recursive: true });
    return fn({ dir, postDir });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runTranslate(dir, postDir) {
  return spawnSync(process.execPath, [TRANSLATE, postDir], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${path.join(dir, 'stub-bin')}:${process.env.PATH}` },
  });
}

function runCheck(dir) {
  return spawnSync(process.execPath, [CHECK, dir], { encoding: 'utf8' });
}

function readCall(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'stub-call.json'), 'utf8'));
}

function enText(postDir) {
  return fs.readFileSync(path.join(postDir, 'index.en.md'), 'utf8');
}

test('中文有 url：frontmatter、首行声明、argv/stdin 跨边界，产物过 check', () => {
  withSandbox(({ dir, postDir }) => {
    const zh = zhArticle({ url: '/posts/demo/' });
    fs.writeFileSync(path.join(postDir, 'index.md'), zh);

    const r = runTranslate(dir, postDir);
    assert.equal(r.status, 0, r.stderr);

    const call = readCall(dir);
    assert.equal(call.argv[0], '-p');
    assert.equal(call.argv.includes('--model'), true);
    assert.equal(call.argv[call.argv.indexOf('--model') + 1], 'sonnet');
    assert.equal(call.stdin.includes(ZH_UNIQUE), true);

    const out = enText(postDir);
    assert.equal((out.match(/^draft: true$/gm) ?? []).length, 1);
    assert.match(out, /^title: "Demo Title: Translated"$/m);
    assert.match(out, /^date: 2026-01-02$/m);
    assert.match(out, /^url: "\/en\/posts\/demo\/"$/m);
    assert.match(out, new RegExp(`^sourceHash: "${sourceHash(zh)}"$`, 'm'));
    assert.match(out, /^translatedBy: "claude-cli\/sonnet"$/m);
    assert.match(out, /^description: "English description sentence\."$/m);
    assert.equal(out.includes('tags:'), false);
    assert.match(out, /\n---\n\*Translated from the \[Chinese original\]\(\/posts\/demo\/\)\.\*\n\n/);
    assert.equal(out.includes('A unique english sentence with [a link](images/pic.png).'), true);

    const c = runCheck(dir);
    assert.equal(c.status, 0, c.stdout);
  });
});

test('中文无 url：英文不写 url、声明用目录名推导，产物过 check', () => {
  withSandbox(({ dir, postDir }) => {
    fs.writeFileSync(path.join(postDir, 'index.md'), zhArticle({ url: undefined }));

    const r = runTranslate(dir, postDir);
    assert.equal(r.status, 0, r.stderr);

    const out = enText(postDir);
    assert.equal(/^url:/m.test(out), false);
    assert.match(out, /\*Translated from the \[Chinese original\]\(\/posts\/260101-demo\/\)\.\*/);
    assert.match(out, /^draft: true$/m);

    const c = runCheck(dir);
    assert.equal(c.status, 0, c.stdout);
  });
});

test('中文无 description：不要求 DESCRIPTION 段、英文不写 description', () => {
  withSandbox(({ dir, postDir }) => {
    fs.writeFileSync(
      path.join(postDir, 'index.md'),
      zhArticle({ description: null }),
    );

    const r = runTranslate(dir, postDir);
    assert.equal(r.status, 0, r.stderr);

    const call = readCall(dir);
    assert.equal(call.stdin.includes('=== DESCRIPTION ==='), false);

    const out = enText(postDir);
    assert.equal(/^description:/m.test(out), false);
    assert.match(out, /^draft: true$/m);
  }, { output: STUB_OUTPUT_NO_DESC });
});

test('已有旧译文：旧英文正文附入 prompt，生成文件被新译文覆盖', () => {
  withSandbox(({ dir, postDir }) => {
    fs.writeFileSync(path.join(postDir, 'index.md'), zhArticle({ url: '/posts/demo/' }));
    const oldEn = [
      '---',
      'title: "Old Title"',
      'date: 2026-01-02',
      'draft: false',
      'url: "/en/posts/demo/"',
      'sourceHash: "sha256:old"',
      '---',
      '',
      '*Translated from the [Chinese original](/posts/demo/).*',
      '',
      'old english marker paragraph kept verbatim.',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(postDir, 'index.en.md'), oldEn);

    const r = runTranslate(dir, postDir);
    assert.equal(r.status, 0, r.stderr);

    const call = readCall(dir);
    assert.equal(call.stdin.includes('old english marker paragraph kept verbatim.'), true);
    assert.equal(call.stdin.includes(ZH_UNIQUE), true);

    const out = enText(postDir);
    assert.equal(out.includes('old english marker paragraph'), false);
    assert.equal((out.match(/^draft: true$/gm) ?? []).length, 1);
  });
});

test('stub 非零退出：失败上抛且不写 index.en.md', () => {
  withSandbox(({ dir, postDir }) => {
    fs.writeFileSync(path.join(postDir, 'index.md'), zhArticle());

    const r = runTranslate(dir, postDir);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /I18N-TRANSLATE-FAILED/);
    assert.equal(fs.existsSync(path.join(postDir, 'index.en.md')), false);
  }, { exitCode: 1 });
});

test('stub 空输出：失败上抛且不写 index.en.md', () => {
  withSandbox(({ dir, postDir }) => {
    fs.writeFileSync(path.join(postDir, 'index.md'), zhArticle());

    const r = runTranslate(dir, postDir);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /I18N-TRANSLATE-FAILED/);
    assert.equal(fs.existsSync(path.join(postDir, 'index.en.md')), false);
  }, { output: '' });
});

test('stub 输出无标记：解析失败上抛且不写 index.en.md', () => {
  withSandbox(({ dir, postDir }) => {
    fs.writeFileSync(path.join(postDir, 'index.md'), zhArticle());

    const r = runTranslate(dir, postDir);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /I18N-TRANSLATE-FAILED/);
    assert.match(r.stderr, /cannot parse model output/);
    assert.equal(fs.existsSync(path.join(postDir, 'index.en.md')), false);
  }, { output: 'just plain text without any markers' });
});

test('已有译文时失败：原 index.en.md 字节不变', () => {
  withSandbox(({ dir, postDir }) => {
    fs.writeFileSync(path.join(postDir, 'index.md'), zhArticle());
    const before = Buffer.from([
      '---',
      'title: "Old Title"',
      'date: 2026-01-02',
      'draft: false',
      'sourceHash: "sha256:old"',
      '---',
      '',
      'old english body.',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(postDir, 'index.en.md'), before);

    const r = runTranslate(dir, postDir);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /I18N-TRANSLATE-FAILED/);
    const after = fs.readFileSync(path.join(postDir, 'index.en.md'));
    assert.equal(after.equals(before), true);
  }, { exitCode: 1 });
});
