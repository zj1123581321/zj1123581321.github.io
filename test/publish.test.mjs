import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_PUBLISH = path.join(REPO_ROOT, 'publish.mjs');

// 无参 stub：若被意外调用立即非零退出，让“不该调翻译的路径”变红
function makeNullStub(dir) {
  const bin = path.join(dir, 'null-stub-bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\nexit 99\n');
  fs.chmodSync(path.join(bin, 'claude'), 0o755);
  return bin;
}

// 合法输出的 stub claude：记录 argv/stdin，输出固定英文草稿
function makeClaudeStub(dir, { exitCode = 0 } = {}) {
  const bin = path.join(dir, 'stub-bin');
  fs.mkdirSync(bin, { recursive: true });
  const stub = path.join(bin, 'claude');
  const output = [
    '=== TITLE ===',
    'Published Title: Translated',
    '=== DESCRIPTION ===',
    'Published description sentence.',
    '=== BODY ===',
    'Published translated body with a marker sentence.\n',
  ].join('\n');
  fs.writeFileSync(
    stub,
    [
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
    ].join('\n'),
  );
  fs.chmodSync(stub, 0o755);
  return bin;
}

function withSandbox(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-rerun-'));
  try {
    fs.copyFileSync(REPO_PUBLISH, path.join(dir, 'publish.mjs'));
    makeNullStub(dir);
    fs.mkdirSync(path.join(dir, 'content', 'posts'), { recursive: true });
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// 完整临时仓根：publish.mjs + tools/i18n + content/posts，配合 stub claude 跑默认路径
function withEnSandbox(fn, stubOpts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-en-'));
  try {
    fs.copyFileSync(REPO_PUBLISH, path.join(dir, 'publish.mjs'));
    fs.mkdirSync(path.join(dir, 'tools', 'i18n'), { recursive: true });
    for (const f of ['translate.mjs', 'lib.mjs', 'check.mjs']) {
      fs.copyFileSync(path.join(REPO_ROOT, 'tools', 'i18n', f), path.join(dir, 'tools', 'i18n', f));
    }
    makeClaudeStub(dir, stubOpts);
    fs.mkdirSync(path.join(dir, 'content', 'posts'), { recursive: true });
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runPublish(dir, sourcePath, slug, { noEn = true, stubBin = 'null-stub-bin' } = {}) {
  const args = ['publish.mjs', sourcePath];
  if (slug !== undefined) args.push(slug);
  if (noEn) args.push('--no-en');
  return spawnSync(process.execPath, args, {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${path.join(dir, stubBin)}:${process.env.PATH}` },
  });
}

function destFile(dir, slug) {
  return path.join(dir, 'content', 'posts', slug, 'index.md');
}

test('重跑保留目标已有 wechat_url 与 url 原文，title/date/正文取本次生成', () => {
  withSandbox((dir) => {
    const source = path.join(dir, '260101-src.md');
    fs.writeFileSync(source, '# 标题\n\n正文内容\n', 'utf8');
    fs.mkdirSync(path.join(dir, 'content', 'posts', 'foo'), { recursive: true });
    fs.writeFileSync(
      destFile(dir, 'foo'),
      [
        '---',
        'title: "旧标题"',
        'date: 2020-01-01',
        'draft: false',
        'wechat_url: "https://x"',
        'url: "/posts/foo/"',
        '---',
        '',
        '旧正文',
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runPublish(dir, source, 'foo');
    assert.equal(result.status, 0, result.stderr);
    const out = fs.readFileSync(destFile(dir, 'foo'), 'utf8');
    assert.match(out, /^---\n[\s\S]*\n---\n/);
    assert.equal(out.includes('wechat_url: "https://x"'), true);
    assert.equal(out.includes('url: "/posts/foo/"'), true);
    assert.match(out, /^title: "标题"$/m);
    assert.match(out, /^date: 2026-01-01$/m);
    assert.equal(out.includes('正文内容'), true);
    assert.equal(out.includes('旧正文'), false);
  });
});

test('源 frontmatter 的 title 覆盖目标旧 title，wechat_url 仍保留', () => {
  withSandbox((dir) => {
    const source = path.join(dir, 'src.md');
    fs.writeFileSync(
      source,
      [
        '---',
        'title: "新"',
        'date: 2026-03-03',
        'draft: false',
        '---',
        '',
        '新正文',
        '',
      ].join('\n'),
      'utf8',
    );
    fs.mkdirSync(path.join(dir, 'content', 'posts', 'bar'), { recursive: true });
    fs.writeFileSync(
      destFile(dir, 'bar'),
      [
        '---',
        'title: "旧"',
        'date: 2020-01-01',
        'draft: false',
        'wechat_url: "https://x"',
        '---',
        '',
        '旧正文',
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runPublish(dir, source, 'bar');
    assert.equal(result.status, 0, result.stderr);
    const out = fs.readFileSync(destFile(dir, 'bar'), 'utf8');
    assert.match(out, /^title: "新"$/m);
    assert.equal(out.includes('title: "旧"'), false);
    assert.equal(out.includes('wechat_url: "https://x"'), true);
    assert.equal(out.includes('新正文'), true);
  });
});

test('目标不存在时输出与现有生成格式逐字节一致', () => {
  withSandbox((dir) => {
    const source = path.join(dir, '260101-src.md');
    fs.writeFileSync(source, '# 标题\n\n正文内容\n', 'utf8');
    const result = runPublish(dir, source, 'foo');
    assert.equal(result.status, 0, result.stderr);
    const actual = fs.readFileSync(destFile(dir, 'foo'));
    const expected = Buffer.from(
      '---\ntitle: "标题"\ndate: 2026-01-01\ndraft: false\n---\n\n正文内容\n',
      'utf8',
    );
    assert.equal(actual.equals(expected), true, actual.toString('utf8'));
  });
});

test('目标 frontmatter 不可解析时 fail fast 且不写入', () => {
  withSandbox((dir) => {
    const source = path.join(dir, '260101-src.md');
    fs.writeFileSync(source, '# 标题\n\n正文内容\n', 'utf8');
    fs.mkdirSync(path.join(dir, 'content', 'posts', 'foo'), { recursive: true });
    const dest = destFile(dir, 'foo');
    const before = Buffer.from('这不是 YAML frontmatter\n', 'utf8');
    fs.writeFileSync(dest, before);
    const result = runPublish(dir, source, 'foo');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PUBLISH-FRONTMATTER-UNPARSEABLE/);
    assert.equal(result.stderr.includes(dest), true);
    const after = fs.readFileSync(dest);
    assert.equal(after.equals(before), true);
  });
});

test('目标 frontmatter 含多行值时 fail fast 且不写入', () => {
  withSandbox((dir) => {
    const source = path.join(dir, '260101-src.md');
    fs.writeFileSync(source, '# 标题\n\n正文内容\n', 'utf8');
    fs.mkdirSync(path.join(dir, 'content', 'posts', 'foo'), { recursive: true });
    const dest = destFile(dir, 'foo');
    const before = Buffer.from(
      [
        '---',
        'title: "旧"',
        'tags:',
        '  - a',
        '  - b',
        '---',
        '',
        '旧正文',
        '',
      ].join('\n'),
      'utf8',
    );
    fs.writeFileSync(dest, before);
    const result = runPublish(dir, source, 'foo');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PUBLISH-FRONTMATTER-UNPARSEABLE/);
    assert.equal(result.stderr.includes(dest), true);
    const after = fs.readFileSync(dest);
    assert.equal(after.equals(before), true);
  });
});

test('完工提示不再出现 git add -A，改为显式 posts 路径', () => {
  withSandbox((dir) => {
    const source = path.join(dir, '260101-src.md');
    fs.writeFileSync(source, '# 标题\n\n正文内容\n', 'utf8');
    const result = runPublish(dir, source, 'foo');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.includes('git add -A'), false);
    assert.match(result.stdout, /git add content\/posts\/foo\b/);
  });
});

// --- 英文草稿接入（默认翻译；--no-en 跳过） ---

test('默认路径自动生成英文草稿且过 check（E2E：只打桩最外层 claude）', () => {
  withEnSandbox((dir) => {
    const source = path.join(dir, '260101-src.md');
    fs.writeFileSync(
      source,
      [
        '---',
        'title: "发布测试"',
        'date: 2026-01-02',
        'draft: false',
        'description: "中文描述"',
        '---',
        '',
        '中文正文一句话。',
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runPublish(dir, source, 'foo', { noEn: false, stubBin: 'stub-bin' });
    assert.equal(result.status, 0, result.stderr);

    const call = JSON.parse(
      fs.readFileSync(path.join(dir, 'stub-call.json'), 'utf8'),
    );
    assert.equal(call.argv[0], '-p');
    assert.equal(call.argv.includes('--model'), true);
    assert.equal(call.argv[call.argv.indexOf('--model') + 1], 'sonnet');
    assert.equal(call.stdin.includes('中文正文一句话。'), true);

    const enPath = path.join(dir, 'content', 'posts', 'foo', 'index.en.md');
    const out = fs.readFileSync(enPath, 'utf8');
    assert.equal((out.match(/^draft: true$/gm) ?? []).length, 1);
    assert.match(out, /\*Translated from the \[Chinese original\]\(\/posts\/foo\/\)\.\*/);

    const check = spawnSync(
      process.execPath,
      ['tools/i18n/check.mjs', dir],
      { cwd: dir, encoding: 'utf8' },
    );
    assert.equal(check.status, 0, check.stdout);
    assert.match(check.stdout, /1 translations, 0 stale/);
  });
});

test('--no-en 时完全不调翻译，不产 index.en.md', () => {
  withEnSandbox((dir) => {
    const source = path.join(dir, '260101-src.md');
    fs.writeFileSync(source, '# 标题\n\n正文内容\n', 'utf8');

    const result = runPublish(dir, source, 'foo', { noEn: true, stubBin: 'stub-bin' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(dir, 'stub-call.json')), false);
    assert.equal(
      fs.existsSync(path.join(dir, 'content', 'posts', 'foo', 'index.en.md')),
      false,
    );
  });
});

test('翻译失败时 publish 非零退出，中文已写出且提示单独重跑', () => {
  withEnSandbox(
    (dir) => {
      const source = path.join(dir, '260101-src.md');
      fs.writeFileSync(source, '# 标题\n\n正文内容\n', 'utf8');

      const result = runPublish(dir, source, 'foo', { noEn: false, stubBin: 'stub-bin' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /I18N-TRANSLATE-FAILED/);
      assert.match(result.stderr, /中文已生成，英文失败/);
      assert.match(result.stderr, /node tools\/i18n\/translate\.mjs content\/posts\/foo/);
      assert.equal(
        fs.existsSync(path.join(dir, 'content', 'posts', 'foo', 'index.md')),
        true,
      );
      assert.equal(
        fs.existsSync(path.join(dir, 'content', 'posts', 'foo', 'index.en.md')),
        false,
      );
    },
    { exitCode: 1 },
  );
});
