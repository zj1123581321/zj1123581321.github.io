const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const NO_LINE_START = /^[，。！？：；、）】」』〕〉〗〙〛…％‰℃”’"'!?.,:;%)\]}]/u;
const PUNCTUATION_TOKEN = /^[，。！？：；、）】」』〕〉〗〙〛…％‰℃”’]$/u;

export function textTokens(text) {
  const tokens = [];
  let word = '';
  for (const char of String(text)) {
    if (/\s/u.test(char)) {
      if (word) tokens.push(word);
      word = '';
      if (tokens.at(-1) !== ' ') tokens.push(' ');
    } else if (CJK.test(char) || PUNCTUATION_TOKEN.test(char)) {
      if (word) tokens.push(word);
      word = '';
      tokens.push(char);
    } else {
      word += char;
    }
  }
  if (word) tokens.push(word);
  return tokens;
}

export function wrapText(text, maxWidth, measureText) {
  const lines = [];
  let line = '';
  let pendingSpace = false;
  for (const token of textTokens(text)) {
    if (token === ' ') {
      pendingSpace = line !== '';
      continue;
    }
    const candidate = line ? `${line}${pendingSpace ? ' ' : ''}${token}` : token;
    if (!line || measureText(candidate) <= maxWidth) {
      line = candidate;
    } else if (!NO_LINE_START.test(token)) {
      lines.push(line);
      line = token;
    } else {
      const units = textTokens(line);
      let moved = token;
      let prefix = '';
      let fitted = false;
      while (units.length > 0) {
        const previous = units.pop();
        if (previous === ' ') continue;
        moved = `${previous}${moved}`;
        prefix = units.join('').trimEnd();
        if (!NO_LINE_START.test(moved) && measureText(moved) <= maxWidth) {
          if (prefix) lines.push(prefix);
          line = moved;
          fitted = true;
          break;
        }
      }
      if (!fitted) {
        throw new RangeError(`OG-TEXT-LINE-OVERFLOW width=${measureText(candidate)} maxWidth=${maxWidth} line=${candidate}`);
      }
    }
    pendingSpace = false;
  }
  if (line) lines.push(line);
  for (const current of lines) {
    const width = measureText(current);
    if (width > maxWidth) {
      throw new RangeError(`OG-TEXT-LINE-OVERFLOW width=${width} maxWidth=${maxWidth} line=${current}`);
    }
  }
  return lines;
}

export function clampLines(lines, maxLines, maxWidth, measureText) {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const ellipsis = '…';
  let last = kept[maxLines - 1];
  while (last && measureText(`${last}${ellipsis}`) > maxWidth) {
    last = Array.from(last).slice(0, -1).join('').trimEnd();
  }
  kept[maxLines - 1] = `${last}${ellipsis}`;
  return kept;
}

export function wrapAndClamp(text, maxWidth, measureText, maxLines) {
  return clampLines(wrapText(text, maxWidth, measureText), maxLines, maxWidth, measureText);
}
