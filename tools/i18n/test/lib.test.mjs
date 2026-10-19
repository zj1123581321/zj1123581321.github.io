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

test('readFrontmatter: 块列表解析为字符串数组', () => {
  const listed = `---
title: Hello
tags:
  - a
---

body
`;
  const fm = readFrontmatter(listed);
  assert.deepEqual(fm.tags, ['a']);
});

test('readFrontmatter: 带引号 item 去引号，多 key 多列表', () => {
  const multi = `---
title: "中文"
tags:
  - "书籍"
  - "找书"
aliases:
  - "/post/2019-03-25129/"
url: "/posts/2019-03-25129/"
---

body
`;
  const fm = readFrontmatter(multi);
  assert.deepEqual(fm.tags, ['书籍', '找书']);
  assert.deepEqual(fm.aliases, ['/post/2019-03-25129/']);
  assert.equal(fm.url, '/posts/2019-03-25129/');
});

test('readFrontmatter: 孤立缩进行无前置空值 key 仍抛 I18N-FRONTMATTER-UNPARSEABLE', () => {
  const orphan = `---
title: Hello
  - a
---

body
`;
  assert.throws(
    () => readFrontmatter(orphan),
    { message: 'I18N-FRONTMATTER-UNPARSEABLE' },
  );
});

test('readFrontmatter: 空值 key 下缩进 key: value 解析为嵌套对象', () => {
  const nested = `---
title: "X"
cover:
  image: "/post-images/220504-Start.jpg"
url: "/posts/220504-start/"
---

body
`;
  const fm = readFrontmatter(nested);
  assert.deepEqual(fm.cover, { image: '/post-images/220504-Start.jpg' });
  assert.equal(fm.url, '/posts/220504-start/');
});
