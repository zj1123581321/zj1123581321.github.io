import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import {
  BridgeClient,
  PACE_MAX_MS,
  PACE_MIN_MS,
  assertSafeClickTarget,
  assertSegmentOrder,
  paceDelayMs,
  readBridgeAddress,
  runXDraft,
  waitForCondition,
} from '../lib/xdraft.mjs';

function startFakeBridge() {
  const requests = [];
  let imageCount = 0;
  const server = http.createServer(async (request, response) => {
    try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    requests.push(body);

    let data = {};
    if (body.action === 'evaluate') {
      const code = body.args.code;
      if (code.includes('target = document.querySelector')) {
        const isApply = code.includes('data-md2p-cover-apply');
        data = {
          type: 'string',
          value: JSON.stringify(
            isApply
              ? { found: true, text: '应用', ariaLabel: '' }
              : { found: true, text: '', ariaLabel: 'create' }
          ),
        };
      } else if (code.includes('data-md2p-cover-apply')) {
        data = { type: 'string', value: JSON.stringify({ found: true, text: '应用', ariaLabel: '' }) };
      } else if (code.includes('pbs.twimg.com/media/')) {
        data = { type: 'string', value: JSON.stringify({ ready: true, naturalWidth: 1200 }) };
      } else if (code.includes('[role="dialog"]') || code.includes('role="dialog"')) {
        data = true;
      } else if (code.includes('Boolean(document.querySelector')) {
        data = true;
      } else if (code.includes('kind: \'cover\'')) {
        data = { type: 'string', value: JSON.stringify({ dispatched: true, kind: 'cover' }) };
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
      } else if (code.includes('textReady')) {
        data = {
          type: 'string',
          value: JSON.stringify({ textReady: true, imageSectionCount: imageCount }),
        };
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
      } else if (code === '__timeout_probe__') {
        data = false;
      } else {
        throw new Error(`fake bridge 未处理 evaluate：${code}`);
      }
    } else if (body.action === 'navigate') {
      data = { success: true, url: body.args.url, tabId: 1 };
    } else if (body.action === 'click') {
      data = { success: true, tag: 'BUTTON', text: '' };
    } else if (body.action === 'fill') {
      data = { success: true, tag: 'TEXTAREA', mode: 'value' };
    } else {
      throw new Error(`fake bridge 未处理 action：${body.action}`);
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, data }));
    } catch (error) {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        ok: false,
        error: { code: 'fake_unhandled', message: error.message },
      }));
    }
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
  assert.doesNotThrow(() => assertSafeClickTarget({ text: '应用' }));
});

test('段顺序自检把连续文本块归并并拒绝图片前移', () => {
  assert.doesNotThrow(() =>
    assertSegmentOrder(
      [{ kind: 'TEXT' }, { kind: 'TEXT' }, { kind: 'IMG' }, { kind: 'TEXT' }],
      [
        { kind: 'html', html: '<p>A</p>' },
        { kind: 'image', src: 'assets/a.png' },
        { kind: 'html', html: '<p>B</p>' },
        { kind: 'html', html: '<p>C</p>' },
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

test('等待超时会抛错并带上描述', async () => {
  const { server } = startFakeBridge();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const bridge = new BridgeClient({ addr: `127.0.0.1:${port}` });
    await assert.rejects(
      () =>
        waitForCondition({
          bridge,
          code: '__timeout_probe__',
          description: '第 1 个图片块上传',
          timeoutMs: 80,
          pollMs: 20,
          predicate: () => false,
        }),
      /等待第 1 个图片块上传超时/
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('停顿时长生成函数在注入随机源下取到区间边界', () => {
  assert.equal(PACE_MIN_MS, 3000);
  assert.equal(PACE_MAX_MS, 8000);
  assert.equal(paceDelayMs(() => 0), PACE_MIN_MS);
  assert.equal(paceDelayMs(() => 1), PACE_MAX_MS);
  assert.equal(paceDelayMs(() => 0.5), 5500);
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
    const result = await runXDraft({
      data,
      outDir,
      bridge,
      log: (line) => logs.push(line),
      pause: async () => {},
    });

    assert.equal(result.url, 'https://x.com/compose/articles/edit/123');
    assert.match(logs[0], /图片段数量 1/);
    assert.match(logs[0], /总字数 5/);
    const actions = requests.filter((request) => request.action).map((request) => request.action);
    assert.equal(actions[0], 'navigate');
    assert.ok(!actions.includes('upload'));
    assert.equal(requests[0].session, 'md2p-x-draft');
    assert.equal(requests[0].args.group_title, 'X 草稿：测试长文章');
    assert.equal(requests.find((request) => request.action === 'fill').args.value, '测试长文章');

    const coverAssign = requests.find(
      (request) =>
        request.action === 'evaluate' &&
        request.args.code.includes("kind: 'cover'")
    );
    assert.ok(coverAssign, '应发出封面 File change 命令');
    const coverBase64Literal = coverAssign.args.code.match(/atob\(("(?:\\.|[^"\\])*")\)/)[1];
    assert.deepEqual(Buffer.from(JSON.parse(coverBase64Literal), 'base64'), coverBytes);

    const applyClicks = requests.filter(
      (request) =>
        request.action === 'click' &&
        request.args.selector === '[data-md2p-cover-apply="1"]'
    );
    assert.equal(applyClicks.length, 1);
    const applyMark = requests.find(
      (request) =>
        request.action === 'evaluate' &&
        request.args.code.includes("trim() === '应用'")
    );
    assert.ok(applyMark, '「应用」按钮应经安全闸标记后再 click');

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

test('类人停顿按锁定点位插入，进度行与预计耗时打印', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xdraft-pace-'));
  const outDir = path.join(dir, 'tools/publish/out/example');
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'assets/cover.png'), Buffer.from('cover-bytes'));
  fs.writeFileSync(path.join(outDir, 'assets/body.png'), Buffer.from([0, 1, 2, 3]));
  const data = {
    title: '节奏测试',
    cover: 'assets/cover.png',
    x: {
      segments: [
        { kind: 'image', src: 'assets/cover.png', alt: '封面' },
        { kind: 'html', html: '<p>第一段</p>' },
        { kind: 'image', src: 'assets/body.png', alt: '正文图' },
        { kind: 'html', html: '<p>末段</p>' },
      ],
    },
  };
  const { server } = startFakeBridge();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const events = [];
    const realBridge = new BridgeClient({ addr: `127.0.0.1:${port}` });
    const bridge = {
      navigate: async (args) => {
        events.push('navigate');
        return realBridge.navigate(args);
      },
      click: async (args) => {
        events.push('click');
        return realBridge.click(args);
      },
      fill: async (args) => {
        events.push('fill');
        return realBridge.fill(args);
      },
      evaluate: async (args) => {
        if (args.code.includes('new ClipboardEvent')) {
          events.push(args.code.includes("kind: 'image'") ? 'paste-image' : 'paste-html');
        } else if (args.code.includes("kind: 'cover'")) {
          events.push('cover-file');
        }
        return realBridge.evaluate(args);
      },
    };
    const logs = [];
    const result = await runXDraft({
      data,
      outDir,
      bridge,
      log: (line) => logs.push(line),
      pause: async () => {
        events.push('pause');
      },
    });

    // 3（导航后/标题后/封面后）+ 3 段 + 1 个图片段额外 = 7 次停顿，按请求与停顿交错顺序断言。
    assert.deepEqual(events, [
      'navigate',
      'pause',
      'click',
      'fill',
      'pause',
      'cover-file',
      'click',
      'pause',
      'paste-html',
      'pause',
      'paste-image',
      'pause',
      'pause',
      'paste-html',
      'pause',
    ]);
    assert.equal(events.filter((event) => event === 'pause').length, 7);
    assert.match(logs[0], /预检/);
    assert.match(logs[1], /7 次停顿/);
    assert.match(logs[1], /21~56 秒/);
    assert.match(logs[1], /不含上传时间/);
    assert.ok(logs.includes('[1/3] 已贴入 文本'));
    assert.ok(logs.includes('[2/3] 已贴入 图片'));
    assert.ok(logs.includes('[3/3] 已贴入 文本'));
    assert.equal(result.completedSegments, 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
