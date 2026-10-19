import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CHECK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'check.mjs');

function hashBody(body) {
  return `sha256:${createHash('sha256').update(body.trim(), 'utf8').digest('hex')}`;
}

function article({ fm, body }) {
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n\n${body}\n`;
}

function writePost(root, dir, { zh, en }) {
  const d = path.join(root, 'content', 'posts', dir);
  fs.mkdirSync(d, { recursive: true });
  if (zh !== undefined) {
    fs.writeFileSync(path.join(d, 'index.md'), zh);
  }
  if (en !== undefined) {
    fs.writeFileSync(path.join(d, 'index.en.md'), en);
  }
}

function runCheck(root) {
  return spawnSync(process.execPath, [CHECK, root], { encoding: 'utf8' });
}

function withFixture(setup) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-check-'));
  try {
    setup(root);
    return runCheck(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const BODY = 'hello body';
const HASH = hashBody(BODY);
const DIR = '260101-demo';

test('check: 全合规退出 0', () => {
  const r = withFixture((root) => {
    writePost(root, DIR, {
      zh: article({ fm: { title: '中', url: '"/posts/demo/"' }, body: BODY }),
      en: article({
        fm: { title: 'En', url: '"/en/posts/demo/"', sourceHash: `"${HASH}"` },
        body: 'en body',
      }),
    });
  });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /i18n check: 1 translations, 0 stale/);
});

test('check: 缺 sourceHash 退出 1', () => {
  const r = withFixture((root) => {
    writePost(root, DIR, {
      zh: article({ fm: { title: '中', url: '"/posts/demo/"' }, body: BODY }),
      en: article({ fm: { title: 'En', url: '"/en/posts/demo/"' }, body: 'en body' }),
    });
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /::error file=content\/posts\/260101-demo\/index\.en\.md::I18N-CHECK-FAILED missing sourceHash/);
});

test('check: url 不符退出 1', () => {
  const r = withFixture((root) => {
    writePost(root, DIR, {
      zh: article({ fm: { title: '中', url: '"/posts/demo/"' }, body: BODY }),
      en: article({
        fm: { title: 'En', url: '"/posts/demo/"', sourceHash: `"${HASH}"` },
        body: 'en body',
      }),
    });
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /::error file=content\/posts\/260101-demo\/index\.en\.md::I18N-CHECK-FAILED/);
});

test('check: zh 无 url 而 en 有 url 退出 1', () => {
  const r = withFixture((root) => {
    writePost(root, DIR, {
      zh: article({ fm: { title: '中' }, body: BODY }),
      en: article({
        fm: { title: 'En', url: '"/en/posts/demo/"', sourceHash: `"${HASH}"` },
        body: 'en body',
      }),
    });
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /::error file=content\/posts\/260101-demo\/index\.en\.md::I18N-CHECK-FAILED/);
});

test('check: 缺 index.md 退出 1', () => {
  const r = withFixture((root) => {
    writePost(root, DIR, {
      en: article({
        fm: { title: 'En', sourceHash: `"${HASH}"` },
        body: 'en body',
      }),
    });
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /::error file=content\/posts\/260101-demo\/index\.md::I18N-CHECK-FAILED/);
});

test('check: 哈希过期退出 0 且含 I18N-STALE 警告', () => {
  const r = withFixture((root) => {
    writePost(root, DIR, {
      zh: article({ fm: { title: '中', url: '"/posts/demo/"' }, body: BODY }),
      en: article({
        fm: {
          title: 'En',
          url: '"/en/posts/demo/"',
          sourceHash: `"sha256:${'0'.repeat(64)}"`,
        },
        body: 'en body',
      }),
    });
  });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /::warning file=content\/posts\/260101-demo\/index\.en\.md::I18N-STALE 260101-demo: Chinese source changed since translation/);
  assert.match(r.stdout, /i18n check: 1 translations, 1 stale/);
});
