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
  safeClick,
  waitForCondition,
} from '../lib/xdraft.mjs';

function startFakeBridge({ tabs = [], blocks = [{ kind: 'TEXT' }, { kind: 'IMG' }, { kind: 'TEXT' }] } = {}) {
  const requests = [];
  let imageCount = 0;
  let captionDialogOpen = false;
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
        const isCaptionSave = code.includes('data-md2p-caption-save');
        const isCaptionOpen = code.includes('data-md2p-caption-open');
        data = {
          type: 'string',
          value: JSON.stringify(
            isApply
              ? { found: true, text: '应用', ariaLabel: '' }
              : isCaptionSave
              ? { found: true, text: '保存', ariaLabel: '保存' }
              : isCaptionOpen
              ? { found: true, text: '提供字幕（可选）', ariaLabel: '' }
              : { found: true, text: '', ariaLabel: 'create' }
          ),
        };
      } else if (code.includes('data-md2p-cover-apply')) {
        data = { type: 'string', value: JSON.stringify({ found: true, text: '应用', ariaLabel: '' }) };
      } else if (code.includes('data-md2p-caption-save')) {
        data = { type: 'string', value: JSON.stringify({ found: true, text: '保存', ariaLabel: '保存' }) };
      } else if (code.includes('data-md2p-caption-open')) {
        data = { type: 'string', value: JSON.stringify({ found: true, text: '提供字幕（可选）', ariaLabel: '' }) };
      } else if (code.includes('applied: Boolean')) {
        data = { type: 'string', value: JSON.stringify({ dialogOpen: captionDialogOpen, applied: true }) };
      } else if (code.includes('pbs.twimg.com/media/')) {
        data = { type: 'string', value: JSON.stringify({ ready: true, naturalWidth: 1200 }) };
      } else if (code.includes('编辑字幕')) {
        data = captionDialogOpen;
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
        data = { type: 'string', value: JSON.stringify({ blocks }) };
      } else if (code.includes('location.href')) {
        data = { type: 'string', value: JSON.stringify({ url: 'https://x.com/compose/articles/edit/123' }) };
      } else if (code === '__timeout_probe__') {
        data = false;
      } else {
        throw new Error(`fake bridge 未处理 evaluate：${code}`);
      }
    } else if (body.action === 'list_tabs') {
      data = { success: true, tabs };
    } else if (body.action === 'find_tab') {
      data = { success: true, url: body.args.url, tabId: 7, borrowed: false };
    } else if (body.action === 'navigate') {
      data = { success: true, url: body.args.url, tabId: 1 };
    } else if (body.action === 'click') {
      if (body.args.selector === '[data-md2p-caption-open="1"]') captionDialogOpen = true;
      if (body.args.selector === '[data-md2p-caption-save="1"]') captionDialogOpen = false;
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
    assert.equal(actions[0], 'list_tabs', '先问会话已有标签页再决定要不要新开');
    assert.equal(actions[1], 'navigate');
    assert.ok(!actions.includes('upload'));
    assert.equal(requests[0].session, 'md2p-x-draft');
    const navigateRequest = requests.find((request) => request.action === 'navigate');
    assert.equal(navigateRequest.args.group_title, 'X 草稿：测试长文章');
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
      listTabs: async () => realBridge.listTabs(),
      findTab: async (url) => realBridge.findTab(url),
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

test('安全闸拒绝白名单外的 click 选择器，且不向 bridge 发任何请求', async () => {
  const boom = async () => {
    throw new Error('不应发出请求');
  };
  const bridge = { evaluate: boom, click: boom };
  await assert.rejects(
    () => safeClick(bridge, 'button[aria-label="publish"]'),
    /安全闸拒绝未授权 click 选择器：button\[aria-label="publish"\]/
  );
});

test('图片字幕：带 caption 的图片段点占位→填值→保存；无 caption 的图片段不发字幕请求', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xdraft-caption-'));
  const outDir = path.join(dir, 'tools/publish/out/example');
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'assets/cover.png'), Buffer.from('cover'));
  fs.writeFileSync(path.join(outDir, 'assets/body1.png'), Buffer.from([1, 2, 3]));
  fs.writeFileSync(path.join(outDir, 'assets/body2.png'), Buffer.from([4, 5, 6]));
  const caption = '同一段开场白：左边是 ASR 原始转录，右边是 LLM 校对后';
  const data = {
    title: '字幕测试',
    cover: 'assets/cover.png',
    x: {
      segments: [
        { kind: 'image', src: 'assets/cover.png', alt: '封面' },
        { kind: 'html', html: '<p>开场</p>' },
        { kind: 'image', src: 'assets/body1.png', alt: caption, caption },
        { kind: 'image', src: 'assets/body2.png', alt: '表格 1' },
        { kind: 'html', html: '<p>结束</p>' },
      ],
    },
  };
  const { server, requests } = startFakeBridge({
    blocks: [{ kind: 'TEXT' }, { kind: 'IMG' }, { kind: 'IMG' }, { kind: 'TEXT' }],
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const bridge = new BridgeClient({ addr: `127.0.0.1:${port}` });
    const result = await runXDraft({ data, outDir, bridge, log: () => {}, pause: async () => {} });
    assert.equal(result.completedSegments, 4);

    const eventOf = (request) => {
      if (request.action === 'click') return `click:${request.args.selector}`;
      if (request.action === 'fill') return `fill:${request.args.selector}`;
      if (request.action === 'evaluate') {
        if (request.args.code.includes("kind: 'image'")) return 'paste-image';
        if (request.args.code.includes("kind: 'html'")) return 'paste-html';
        if (request.args.code.includes('target = document.querySelector')) return 'click-probe';
        if (request.args.code.includes('data-md2p-caption-open')) return 'mark-caption-open';
      }
      return request.action;
    };
    const events = requests.map(eventOf);
    // 两张图：只有第一张（带 caption）走字幕流程，顺序为 贴图→点占位→填值→点保存
    assert.equal(events.filter((e) => e === 'paste-image').length, 2);
    assert.deepEqual(
      events.filter((e) => e.includes('caption') || e.startsWith('fill:[')),
      [
        'mark-caption-open',
        'click:[data-md2p-caption-open="1"]',
        'fill:[role="dialog"] .public-DraftEditor-content',
        'click:[data-md2p-caption-save="1"]',
      ]
    );
    const imagePasteIdx = events
      .map((event, index) => (event === 'paste-image' ? index : -1))
      .filter((index) => index >= 0);
    const captionIdx = events.indexOf('click:[data-md2p-caption-open="1"]');
    const saveIdx = events.indexOf('click:[data-md2p-caption-save="1"]');
    assert.ok(imagePasteIdx[0] < captionIdx && saveIdx < imagePasteIdx[1], `字幕请求应夹在两张图的粘贴之间：${events.join(' > ')}`);

    // 请求体里的字幕原文与 caption 逐字一致
    const dialogFill = requests.find(
      (request) =>
        request.action === 'fill' &&
        request.args.selector === '[role="dialog"] .public-DraftEditor-content'
    );
    assert.equal(dialogFill.args.value, caption);
    // 标题填入仍走原选择器，与字幕填入区分开
    const titleFill = requests.find((request) => request.action === 'fill' && request.args.selector === 'textarea[name="文章标题"]');
    assert.equal(titleFill.args.value, '字幕测试');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('标签页：会话已有标签页则 find_tab 后不带 newTab 导航；没有才新开一个', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xdraft-tabs-'));
  const outDir = path.join(dir, 'tools/publish/out/example');
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'assets/body.png'), Buffer.from([1, 2, 3]));
  const data = {
    title: '标签页复用',
    cover: null,
    x: { segments: [{ kind: 'image', src: 'assets/body.png', alt: '正文图' }] },
  };

  const run = async (tabs) => {
    const { server, requests } = startFakeBridge({ tabs, blocks: [{ kind: 'IMG' }] });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const { port } = server.address();
      const bridge = new BridgeClient({ addr: `127.0.0.1:${port}` });
      await runXDraft({ data, outDir, bridge, log: () => {}, pause: async () => {} });
      return requests;
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  };

  try {
    const reused = await run([{ tabId: 9, url: 'https://x.com/compose/articles/edit/123' }]);
    assert.deepEqual(
      reused.slice(0, 3).map((request) => request.action),
      ['list_tabs', 'find_tab', 'navigate']
    );
    assert.deepEqual(reused[1].args, { url: 'https://x.com' });
    assert.equal(reused[2].args.newTab, undefined, '已有标签页时不应再开新标签页');
    assert.equal(reused[2].args.group_title, undefined);
    assert.equal(reused[2].args.url, 'https://x.com/compose/articles');
    assert.ok(!reused.some((request) => request.action === 'close_tab'));

    const fresh = await run([]);
    assert.deepEqual(
      fresh.slice(0, 2).map((request) => request.action),
      ['list_tabs', 'navigate']
    );
    assert.equal(fresh[1].args.newTab, true);
    assert.equal(fresh[1].args.group_title, 'X 草稿：标签页复用');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
