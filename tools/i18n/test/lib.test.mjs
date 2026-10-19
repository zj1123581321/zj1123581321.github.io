import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceHash, readFrontmatter } from '../lib.mjs';

const lf = `---
title: "Hello"
date: 2026-03-28
---

body text
`;

const lfWithWechat = `---
title: "Hello"
date: 2026-03-28
wechat_url: "https://example.com"
---

body text
`;

const lfBodyChanged = `---
title: "Hello"
date: 2026-03-28
---

body text!
`;

const crlf = lf.replaceAll('\n', '\r\n');

test('sourceHash: 只改 frontmatter 哈希不变', () => {
  assert.equal(sourceHash(lf), sourceHash(lfWithWechat));
});

test('sourceHash: 改正文一个字哈希变', () => {
  assert.notEqual(sourceHash(lf), sourceHash(lfBodyChanged));
});

test('sourceHash: CRLF 与 LF 版本哈希相同', () => {
  assert.equal(sourceHash(lf), sourceHash(crlf));
});

test('sourceHash: 无 frontmatter 时抛 I18N-FRONTMATTER-UNPARSEABLE', () => {
  assert.throws(
    () => sourceHash('just body'),
    { message: 'I18N-FRONTMATTER-UNPARSEABLE' },
  );
});

test('readFrontmatter: 去掉一对包裹双引号', () => {
  const fm = readFrontmatter(lf);
  assert.equal(fm.title, 'Hello');
  assert.equal(fm.date, '2026-03-28');
});

test('readFrontmatter: 列表键抛 I18N-FRONTMATTER-UNPARSEABLE', () => {
  const listed = `---
title: Hello
tags:
  - a
---

body
`;
  assert.throws(
    () => readFrontmatter(listed),
    { message: 'I18N-FRONTMATTER-UNPARSEABLE' },
  );
});
