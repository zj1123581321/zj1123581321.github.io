import { createHash } from 'node:crypto';

const UNPARSEABLE = 'I18N-FRONTMATTER-UNPARSEABLE';
const BLOCK_SCALAR = /^[|>][+-]?\d*$/;
const KEY_VALUE = /^([^:]+):\s*(.*)$/;

function splitFrontmatter(markdownText) {
  const text = String(markdownText).replaceAll('\r\n', '\n');
  if (!text.startsWith('---\n')) {
    throw new Error(UNPARSEABLE);
  }
  const lines = text.split('\n');
  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      closeIdx = i;
      break;
    }
  }
  if (closeIdx === -1) {
    throw new Error(UNPARSEABLE);
  }
  return {
    frontmatterLines: lines.slice(1, closeIdx),
    body: lines.slice(closeIdx + 1).join('\n'),
  };
}

export function sourceHash(zhMarkdownText) {
  const { body } = splitFrontmatter(zhMarkdownText);
  const hex = createHash('sha256').update(body.trim(), 'utf8').digest('hex');
  return `sha256:${hex}`;
}

export function readFrontmatter(markdownText) {
  const { frontmatterLines } = splitFrontmatter(markdownText);
  const out = {};
  for (const line of frontmatterLines) {
    if (line === '') {
      continue;
    }
    if (/^\s/.test(line) || line.startsWith('- ')) {
      throw new Error(UNPARSEABLE);
    }
    const m = line.match(KEY_VALUE);
    if (!m) {
      throw new Error(UNPARSEABLE);
    }
    let value = m[2];
    if (BLOCK_SCALAR.test(value.trim())) {
      throw new Error(UNPARSEABLE);
    }
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}
