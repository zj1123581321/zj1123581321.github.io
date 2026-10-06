import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const BRIDGE_SESSION = 'md2p-x-draft';
export const ARTICLES_URL = 'https://x.com/compose/articles';
export const CREATE_SELECTOR = 'button[aria-label="create"]';
export const TITLE_SELECTOR = 'textarea[name="文章标题"]';
export const COVER_INPUT_SELECTOR = 'input[type="file"][data-testid="fileInput"]';
export const COVER_APPLY_SELECTOR = '[data-md2p-cover-apply="1"]';
export const EDITOR_SELECTOR = '.public-DraftEditor-content';
export const IMAGE_UPLOAD_TIMEOUT_MS = 60_000;
export const IMAGE_UPLOAD_POLL_MS = 250;

const FORBIDDEN_CLICK_LABEL = /发布|publish|post/i;

export function readBridgeAddress(
  configPath = path.join(os.homedir(), '.kimi-webbridge', 'config.json')
) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`bridge 配置不存在：${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (typeof config.addr !== 'string' || config.addr.trim() === '') {
    throw new Error(`bridge 配置缺少 addr：${configPath}`);
  }
  return config.addr.trim();
}

export class BridgeClient {
  constructor({ addr, session = BRIDGE_SESSION, fetchImpl = globalThis.fetch }) {
    if (typeof fetchImpl !== 'function') {
      throw new Error('当前 Node.js 不支持 fetch');
    }
    this.endpoint = `${addr.startsWith('http://') || addr.startsWith('https://') ? addr : `http://${addr}`}/command`;
    this.session = session;
    this.fetchImpl = fetchImpl;
  }

  async command(action, args = {}) {
    let response;
    let envelope;
    try {
      response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, args, session: this.session }),
      });
      const body = await response.text();
      envelope = JSON.parse(body);
    } catch (error) {
      throw new Error(`bridge action ${action} failed: ${error.message}`, { cause: error });
    }
    if (!response.ok) {
      throw new Error(`bridge action ${action} failed: HTTP ${response.status}`);
    }
    if (envelope?.ok !== true) {
      const message = envelope?.error?.message ?? '未提供错误信息';
      throw new Error(`bridge action ${action} failed: ${message}`);
    }
    return envelope.data;
  }

  navigate(args) {
    return this.command('navigate', args);
  }

  click(args) {
    return this.command('click', args);
  }

  fill(args) {
    return this.command('fill', args);
  }

  evaluate(args) {
    return this.command('evaluate', args);
  }
}

export function evaluateValue(data) {
  if (data && data.type === 'string') {
    return JSON.parse(data.value);
  }
  if (data && Object.hasOwn(data, 'value')) {
    return data.value;
  }
  return data;
}

export function assertSafeClickTarget({ text = '', ariaLabel = '' } = {}) {
  const label = `${text} ${ariaLabel}`.trim();
  if (FORBIDDEN_CLICK_LABEL.test(label)) {
    throw new Error(`拒绝点击发布相关目标：${label || '未命名目标'}`);
  }
  return true;
}

function clickProbeCode(selector) {
  return `(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!target) return JSON.stringify({found: false});
    return JSON.stringify({
      found: true,
      text: (target.textContent || '').trim(),
      ariaLabel: target.getAttribute('aria-label') || ''
    });
  })()`;
}

const ALLOWED_CLICK_SELECTORS = new Set([CREATE_SELECTOR, COVER_APPLY_SELECTOR]);

export async function safeClick(bridge, selector) {
  if (!ALLOWED_CLICK_SELECTORS.has(selector)) {
    throw new Error(`安全闸拒绝未授权 click 选择器：${selector}`);
  }
  const target = evaluateValue(await bridge.evaluate({ code: clickProbeCode(selector) }));
  if (!target?.found) {
    throw new Error(`安全闸找不到 click 目标：${selector}`);
  }
  assertSafeClickTarget(target);
  return bridge.click({ selector });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function waitForCondition({
  bridge,
  code,
  predicate = Boolean,
  description,
  timeoutMs = IMAGE_UPLOAD_TIMEOUT_MS,
  pollMs = IMAGE_UPLOAD_POLL_MS,
}) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const value = evaluateValue(await bridge.evaluate({ code }));
    if (predicate(value)) {
      return value;
    }
    if (Date.now() >= deadline) {
      throw new Error(`等待${description}超时（${timeoutMs}ms）`);
    }
    await delay(pollMs);
  }
}

function editorReadyCode() {
  return `Boolean(document.querySelector(${JSON.stringify(EDITOR_SELECTOR)}))`;
}

function createReadyCode() {
  return `Boolean(document.querySelector(${JSON.stringify(CREATE_SELECTOR)}))`;
}

function coverDialogReadyCode() {
  return `Boolean(
    document.querySelector('dialog[aria-label="编辑媒体"]') ||
    [...document.querySelectorAll('dialog, [role="dialog"]')].some((el) =>
      (el.getAttribute('aria-label') || el.getAttribute('name') || '') === '编辑媒体'
    )
  )`;
}

function markCoverApplyCode() {
  return `(() => {
    document.querySelectorAll('[data-md2p-cover-apply]').forEach((el) => {
      el.removeAttribute('data-md2p-cover-apply');
    });
    const dialog = document.querySelector('dialog[aria-label="编辑媒体"]')
      || [...document.querySelectorAll('dialog, [role="dialog"]')].find((el) =>
        (el.getAttribute('aria-label') || el.getAttribute('name') || '') === '编辑媒体'
      );
    if (!dialog) return JSON.stringify({found: false});
    const button = [...dialog.querySelectorAll('button')].find((el) =>
      (el.textContent || '').trim() === '应用'
    );
    if (!button) return JSON.stringify({found: false});
    button.setAttribute('data-md2p-cover-apply', '1');
    return JSON.stringify({
      found: true,
      text: (button.textContent || '').trim(),
      ariaLabel: button.getAttribute('aria-label') || ''
    });
  })()`;
}

function coverImageReadyCode() {
  return `(() => {
    const editor = document.querySelector(${JSON.stringify(EDITOR_SELECTOR)});
    const image = [...document.querySelectorAll('img')].find((el) =>
      (el.getAttribute('src') || '').startsWith('https://pbs.twimg.com/media/') &&
      (!editor || !editor.contains(el))
    );
    return JSON.stringify({
      ready: Boolean(image && image.complete && image.naturalWidth > 0),
      naturalWidth: image ? image.naturalWidth : 0
    });
  })()`;
}

function imageUploadStateCode() {
  return `(() => {
    const editor = document.querySelector(${JSON.stringify(EDITOR_SELECTOR)});
    const sections = editor
      ? [...editor.querySelectorAll('section[data-block="true"]')]
      : [];
    const imageSections = sections.filter((section) => section.querySelector('img'));
    const latest = imageSections.at(-1);
    const image = latest?.querySelector('img');
    const ready =
      Boolean(latest) &&
      Boolean(image) &&
      image.src.startsWith('blob:') &&
      image.complete &&
      image.naturalWidth > 0 &&
      Boolean(latest.querySelector('[aria-label="编辑媒体"]'));
    return JSON.stringify({
      imageSectionCount: imageSections.length,
      ready
    });
  })()`;
}

function imageSectionCountCode() {
  return `(() => {
    const editor = document.querySelector(${JSON.stringify(EDITOR_SELECTOR)});
    return editor
      ? [...editor.querySelectorAll('section[data-block="true"]')]
          .filter((section) => section.querySelector('img')).length
      : 0;
  })()`;
}

function selfCheckCode() {
  return `(() => {
    const editor = document.querySelector(${JSON.stringify(EDITOR_SELECTOR)});
    const blocks = editor
      ? [...editor.querySelectorAll('[data-block="true"]')]
          .map((block) => {
            if (block.tagName === 'SECTION' && block.querySelector('img')) {
              return {kind: 'IMG'};
            }
            if (!block.textContent.trim() && !block.querySelector('img')) {
              return null;
            }
            return {kind: 'TEXT'};
          })
          .filter(Boolean)
      : [];
    return JSON.stringify({blocks});
  })()`;
}

function collapseTextKinds(kinds) {
  return kinds.filter((kind, index) => kind === 'IMG' || kinds[index - 1] !== 'TEXT');
}

export function normalizeEditorBlocks(blocks) {
  const kinds = blocks
    .map((block) => (typeof block === 'string' ? block : block.kind))
    .filter((kind) => kind === 'IMG' || kind === 'TEXT');
  return collapseTextKinds(kinds);
}

export function expectedSegmentSequence(segments) {
  return collapseTextKinds(
    segments.map((segment) => (segment.kind === 'image' ? 'IMG' : 'TEXT'))
  );
}

export function assertSegmentOrder(actualBlocks, segments) {
  const actual = normalizeEditorBlocks(actualBlocks);
  const expected = expectedSegmentSequence(segments);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `段顺序自检不一致：期望 ${expected.join(' ')}，实际 ${actual.join(' ')}`
    );
  }
  return true;
}

function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function buildHtmlPasteCode(html) {
  return `(() => {
    const editor = document.querySelector(${JSON.stringify(EDITOR_SELECTOR)});
    if (!editor) throw new Error('正文编辑器不存在');
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    const data = new DataTransfer();
    data.setData('text/html', ${JSON.stringify(html)});
    data.setData('text/plain', ${JSON.stringify(htmlToPlainText(html))});
    editor.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      clipboardData: data
    }));
    return JSON.stringify({dispatched: true, kind: 'html'});
  })()`;
}

export function buildCoverFileCode({ base64, filename, mimeType }) {
  return `(() => {
    const input = document.querySelector(${JSON.stringify(COVER_INPUT_SELECTOR)});
    if (!input) throw new Error('封面文件输入不存在');
    const bytes = Uint8Array.from(atob(${JSON.stringify(base64)}), (char) => char.charCodeAt(0));
    const file = new File([bytes], ${JSON.stringify(filename)}, {type: ${JSON.stringify(mimeType)}});
    const data = new DataTransfer();
    data.items.add(file);
    input.files = data.files;
    input.dispatchEvent(new Event('change', {bubbles: true}));
    return JSON.stringify({dispatched: true, kind: 'cover', filename: file.name});
  })()`;
}

export function buildImagePasteCode({ base64, filename, mimeType }) {
  return `(() => {
    const editor = document.querySelector(${JSON.stringify(EDITOR_SELECTOR)});
    if (!editor) throw new Error('正文编辑器不存在');
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    const bytes = Uint8Array.from(atob(${JSON.stringify(base64)}), (char) => char.charCodeAt(0));
    const file = new File([bytes], ${JSON.stringify(filename)}, {type: ${JSON.stringify(mimeType)}});
    const data = new DataTransfer();
    data.items.add(file);
    editor.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      clipboardData: data
    }));
    return JSON.stringify({dispatched: true, kind: 'image', filename: file.name});
  })()`;
}

function mimeTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return types[extension] ?? 'application/octet-stream';
}

function resolveAsset(outDir, relativePath) {
  const absolutePath = path.resolve(outDir, relativePath);
  const relative = path.relative(outDir, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`素材路径越界：${relativePath}`);
  }
  return absolutePath;
}

function isCoverSegment(segment, cover) {
  return Boolean(
    cover &&
      segment?.kind === 'image' &&
      segment.src === cover
  );
}

function textLengthOfHtml(html) {
  return htmlToPlainText(html).replace(/\s/g, '').length;
}

function withProgress(error, completedSegments) {
  const message = `${error.message}；已完成到第 ${completedSegments} 段`;
  return new Error(message, { cause: error });
}

export async function runXDraft({ data, outDir, bridge, log = console.log }) {
  const allSegments = data?.x?.segments;
  if (!Array.isArray(allSegments)) {
    throw new Error('data.json 缺少 x.segments');
  }
  const bodySegments = isCoverSegment(allSegments[0], data.cover)
    ? allSegments.slice(1)
    : allSegments;
  const imageCount = bodySegments.filter((segment) => segment.kind === 'image').length;
  const textLength = bodySegments
    .filter((segment) => segment.kind === 'html')
    .reduce((total, segment) => total + textLengthOfHtml(segment.html), 0);
  log(`预检：图片段数量 ${imageCount}，总字数 ${textLength}`);

  let completedSegments = 0;
  try {
    await bridge.navigate({
      url: ARTICLES_URL,
      newTab: true,
      group_title: `X 草稿：${data.title}`,
    });
    await waitForCondition({
      bridge,
      code: createReadyCode(),
      description: 'X 新建文章入口',
      predicate: Boolean,
    });
    await safeClick(bridge, CREATE_SELECTOR);
    await waitForCondition({
      bridge,
      code: editorReadyCode(),
      description: 'X 长文章编辑器',
      predicate: Boolean,
    });
    await bridge.fill({ selector: TITLE_SELECTOR, value: data.title });

    if (data.cover) {
      const coverPath = resolveAsset(outDir, data.cover);
      const coverBytes = fs.readFileSync(coverPath);
      await bridge.evaluate({
        code: buildCoverFileCode({
          base64: coverBytes.toString('base64'),
          filename: path.basename(coverPath),
          mimeType: mimeTypeFor(coverPath),
        }),
      });
      await waitForCondition({
        bridge,
        code: coverDialogReadyCode(),
        description: '封面编辑媒体对话框',
        predicate: Boolean,
      });
      const applyTarget = evaluateValue(await bridge.evaluate({ code: markCoverApplyCode() }));
      if (!applyTarget?.found) {
        throw new Error('安全闸找不到封面应用按钮');
      }
      assertSafeClickTarget(applyTarget);
      await safeClick(bridge, COVER_APPLY_SELECTOR);
      await waitForCondition({
        bridge,
        code: coverImageReadyCode(),
        description: '封面图上传',
        predicate: (state) => state?.ready === true,
      });
    }

    for (const segment of bodySegments) {
      if (segment.kind === 'html') {
        await bridge.evaluate({ code: buildHtmlPasteCode(segment.html) });
      } else if (segment.kind === 'image') {
        const imagePath = resolveAsset(outDir, segment.src);
        const bytes = fs.readFileSync(imagePath);
        const beforeCount = evaluateValue(
          await bridge.evaluate({ code: imageSectionCountCode() })
        );
        await bridge.evaluate({
          code: buildImagePasteCode({
            base64: bytes.toString('base64'),
            filename: path.basename(imagePath),
            mimeType: mimeTypeFor(imagePath),
          }),
        });
        await waitForCondition({
          bridge,
          code: imageUploadStateCode(),
          description: `第 ${completedSegments + 1} 个图片块上传`,
          predicate: (state) => state?.imageSectionCount === beforeCount + 1 && state.ready === true,
        });
      } else {
        throw new Error(`未知 X 段类型：${segment.kind}`);
      }
      completedSegments += 1;
    }

    const summary = evaluateValue(await bridge.evaluate({ code: selfCheckCode() }));
    assertSegmentOrder(summary.blocks, bodySegments);
    const page = evaluateValue(
      await bridge.evaluate({ code: 'JSON.stringify({url: location.href})' })
    );
    if (!page?.url) {
      throw new Error('无法读取 X 草稿 URL');
    }
    log(`草稿 URL：${page.url}`);
    return {
      url: page.url,
      imageCount,
      textLength,
      completedSegments,
      sequence: expectedSegmentSequence(bodySegments),
    };
  } catch (error) {
    throw withProgress(error, completedSegments);
  }
}
