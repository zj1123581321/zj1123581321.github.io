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

const LIST_ITEM = /^\s+- (.*)$/;
const NESTED_KEY_VALUE = /^\s+([^:\s][^:]*):\s*(.*)$/;

function unquote(text) {
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    return text.slice(1, -1);
  }
  return text;
}

export function readFrontmatter(markdownText) {
  const { frontmatterLines } = splitFrontmatter(markdownText);
  const out = {};
  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i];
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
    if (value.trim() === '') {
      const items = [];
      let j = i + 1;
      for (; j < frontmatterLines.length; j++) {
        const lm = frontmatterLines[j].match(LIST_ITEM);
        if (!lm) {
          break;
        }
        items.push(unquote(lm[1].trim()));
      }
      if (items.length > 0) {
        out[m[1]] = items;
        i = j - 1;
        continue;
      }
      const nested = {};
      let k = i + 1;
      for (; k < frontmatterLines.length; k++) {
        const nm = frontmatterLines[k].match(NESTED_KEY_VALUE);
        if (!nm) {
          break;
        }
        nested[nm[1]] = unquote(nm[2].trim());
      }
      out[m[1]] = Object.keys(nested).length > 0 ? nested : '';
      i = k - 1;
      continue;
    }
    out[m[1]] = unquote(value);
  }
  return out;
}
