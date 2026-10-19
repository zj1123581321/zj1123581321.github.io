import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_PUBLISH = path.join(REPO_ROOT, 'publish.mjs');

function withSandbox(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-rerun-'));
  try {
    fs.copyFileSync(REPO_PUBLISH, path.join(dir, 'publish.mjs'));
    fs.mkdirSync(path.join(dir, 'content', 'posts'), { recursive: true });
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runPublish(dir, sourcePath, slug) {
  const args = ['publish.mjs', sourcePath];
  if (slug !== undefined) args.push(slug);
  return spawnSync(process.execPath, args, {
    cwd: dir,
    encoding: 'utf8',
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
