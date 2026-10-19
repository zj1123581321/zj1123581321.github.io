const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const NO_LINE_START = /^[，。！？：；、）】」』〕〉〗〙〛…％‰℃”’"'!?.,:;%)\]}]/u;

export function textTokens(text) {
  const tokens = [];
  let word = '';
  for (const char of String(text)) {
    if (/\s/u.test(char)) {
      if (word) tokens.push(word);
      word = '';
      if (tokens.at(-1) !== ' ') tokens.push(' ');
    } else if (CJK.test(char)) {
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
    if (line && measureText(candidate) > maxWidth && !NO_LINE_START.test(token)) {
      lines.push(line);
      line = token;
    } else if (line && measureText(candidate) > maxWidth && NO_LINE_START.test(token)) {
      line += token;
    } else {
      line = candidate;
    }
    pendingSpace = false;
  }
  if (line) lines.push(line);
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
