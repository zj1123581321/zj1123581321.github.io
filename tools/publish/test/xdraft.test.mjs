import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import {
  BridgeClient,
  assertSafeClickTarget,
  assertSegmentOrder,
  readBridgeAddress,
  runXDraft,
} from '../lib/xdraft.mjs';

function startFakeBridge() {
  const requests = [];
  let imageCount = 0;
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    requests.push(body);

    let data = {};
    if (body.action === 'evaluate') {
      const code = body.args.code;
      if (code.includes('target = document.querySelector')) {
        data = { type: 'string', value: JSON.stringify({ found: true, text: '', ariaLabel: 'create' }) };
      } else if (code.includes('Boolean(document.querySelector')) {
        data = true;
      } else if (code.includes('data.items.add(file)')) {
        imageCount += 1;
        data = { type: 'string', value: JSON.stringify({ dispatched: true, kind: 'image' }) };
      } else if (code.includes('data.setData(\'text/html\'')) {
        data = { type: 'string', value: JSON.stringify({ dispatched: true, kind: 'html' }) };
      } else if (
        code.includes('filter((section) => section.querySelector(\'img\')).length') &&
        !code.includes('imageSectionCount')
      ) {
        data = imageCount;
      } else if (code.includes('imageSectionCount')) {
        data = { type: 'string', value: JSON.stringify({ imageSectionCount: imageCount, ready: true }) };
      } else if (code.includes('return JSON.stringify({blocks});')) {
        data = {
          type: 'string',
          value: JSON.stringify({
            blocks: [{ kind: 'TEXT' }, { kind: 'IMG' }, { kind: 'TEXT' }],
          }),
        };
      } else if (code.includes('location.href')) {
        data = { type: 'string', value: JSON.stringify({ url: 'https://x.com/compose/articles/edit/123' }) };
      } else {
        throw new Error(`fake bridge 未处理 evaluate：${code}`);
      }
    } else if (body.action === 'navigate') {
      data = { success: true, url: body.args.url, tabId: 1 };
    } else if (body.action === 'click') {
      data = { success: true, tag: 'BUTTON', text: '' };
    } else if (body.action === 'fill') {
      data = { success: true, tag: 'TEXTAREA', mode: 'value' };
    } else if (body.action === 'upload') {
      data = { success: true, fileCount: 1 };
    } else {
      throw new Error(`fake bridge 未处理 action：${body.action}`);
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, data }));
  });
  return { server, requests };
}

test('bridge 配置缺失或缺少 addr 直接报错', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xdraft-config-'));
  try {
    assert.throws(
      () => readBridgeAddress(path.join(dir, 'missing.json')),
      /bridge 配置不存在/
    );
    const configPath = path.join(dir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({}));
    assert.throws(
      () => readBridgeAddress(configPath),
      /bridge 配置缺少 addr/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('安全闸拒绝中文和英文发布按钮', () => {
  assert.throws(
    () => assertSafeClickTarget({ text: '发布' }),
    /拒绝点击发布相关目标/
  );
  assert.throws(
    () => assertSafeClickTarget({ ariaLabel: 'Publish' }),
    /拒绝点击发布相关目标/
  );
  assert.throws(
    () => assertSafeClickTarget({ ariaLabel: 'Post' }),
    /拒绝点击发布相关目标/
  );
  assert.doesNotThrow(() => assertSafeClickTarget({ ariaLabel: 'create' }));
});

test('段顺序自检把连续文本块归并并拒绝图片前移', () => {
  assert.doesNotThrow(() =>
    assertSegmentOrder(
      [{ kind: 'TEXT' }, { kind: 'TEXT' }, { kind: 'IMG' }, { kind: 'TEXT' }],
      [
        { kind: 'html', html: '<p>A</p>' },
        { kind: 'image', src: 'assets/a.png' },
        { kind: 'html', html: '<p>B</p>' },
      ]
    )
  );
  assert.throws(
    () =>
      assertSegmentOrder(
        [{ kind: 'IMG' }, { kind: 'TEXT' }],
        [
          { kind: 'html', html: '<p>A</p>' },
          { kind: 'image', src: 'assets/a.png' },
        ]
      ),
    /段顺序自检不一致/
  );
});

test('伪 bridge 记录真实 HTTP body：导航、新建、标题、封面、按序粘贴', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xdraft-run-'));
  const outDir = path.join(dir, 'tools/publish/out/example');
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  const coverBytes = Buffer.from('cover-bytes');
  const bodyBytes = Buffer.from([0, 1, 2, 3, 250, 251]);
  fs.writeFileSync(path.join(outDir, 'assets/cover.png'), coverBytes);
  fs.writeFileSync(path.join(outDir, 'assets/body.png'), bodyBytes);
  const data = {
    title: '测试长文章',
    cover: 'assets/cover.png',
    x: {
      segments: [
        { kind: 'image', src: 'assets/cover.png', alt: '封面' },
        { kind: 'html', html: '<h2>标题 &amp;</h2>' },
        { kind: 'image', src: 'assets/body.png', alt: '正文图' },
        { kind: 'html', html: '<p>结束</p>' },
      ],
    },
  };
  const { server, requests } = startFakeBridge();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const logs = [];
    const bridge = new BridgeClient({ addr: `127.0.0.1:${port}` });
    const result = await runXDraft({ data, outDir, bridge, log: (line) => logs.push(line) });

    assert.equal(result.url, 'https://x.com/compose/articles/edit/123');
    assert.match(logs[0], /图片段数量 1/);
    assert.match(logs[0], /总字数 5/);
    assert.deepEqual(
      requests.filter((request) => request.action).map((request) => request.action),
      [
        'navigate',
        'evaluate',
        'click',
        'evaluate',
        'fill',
        'upload',
        'evaluate',
        'evaluate',
        'evaluate',
        'evaluate',
        'evaluate',
        'evaluate',
        'evaluate',
      ]
    );
    assert.equal(requests[0].session, 'md2p-x-draft');
    assert.equal(requests[0].args.group_title, 'X 草稿：测试长文章');
    assert.equal(requests.find((request) => request.action === 'fill').args.value, '测试长文章');
    assert.deepEqual(
      requests.find((request) => request.action === 'upload').args,
      {
        selector: 'input[type="file"][data-testid="fileInput"]',
        files: [path.join(outDir, 'assets/cover.png')],
      }
    );

    const pasteRequests = requests.filter(
      (request) =>
        request.action === 'evaluate' &&
        request.args.code.includes('new ClipboardEvent')
    );
    assert.equal(pasteRequests.length, 3);
    assert.match(pasteRequests[0].args.code, /<h2>标题 &amp;<\/h2>/);
    const imageBase64Literal = pasteRequests[1].args.code.match(/atob\(("(?:\\.|[^"\\])*")\)/)[1];
    assert.deepEqual(Buffer.from(JSON.parse(imageBase64Literal), 'base64'), bodyBytes);
    assert.match(pasteRequests[2].args.code, /<p>结束<\/p>/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
