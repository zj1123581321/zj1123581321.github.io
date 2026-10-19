import test from 'node:test';
import assert from 'node:assert/strict';
import { clampLines, textTokens, wrapAndClamp, wrapText } from '../text-layout.mjs';

function width(text) {
  return Array.from(text).reduce((sum, char) => sum + (/\p{Script=Han}/u.test(char) ? 10 : 6), 0);
}

test('纯中文按字断行，且行首不出现禁则标点', () => {
  const text = '这是一段用于验证中文标题不会整段溢出的长文本，逗号后继续描述。';
  const lines = wrapText(text, 50, width);
  assert.ok(lines.length > 1);
  assert.deepEqual(lines.join(''), text);
  assert.ok(lines.every((line) => !/^[，。！？：；、）》】」』〕〉〗〙〛]/u.test(line)));
});

test('中英混排不溢出，并按英文词边界换行', () => {
  const text = '日均 40 亿 Token 的工作流 reaches a new phase';
  const lines = wrapText(text, 90, width);
  assert.ok(lines.length > 1);
  assert.equal(lines.join('').replaceAll(' ', ''), text.replaceAll(' ', ''));
  assert.ok(lines.every((line) => width(line) <= 90));
  assert.ok(lines.some((line) => line.includes('40')));
  assert.ok(lines.some((line) => line.includes('Token')));
  assert.ok(lines.some((line) => line.includes('reaches')));
});

test('超过最大行数时末行截断并添加省略号', () => {
  const lines = wrapAndClamp('第一行内容 第二行内容 第三行内容 第四行内容', 60, width, 3);
  assert.equal(lines.length, 3);
  assert.ok(lines[2].endsWith('…'));
  assert.ok(width(lines[2]) <= 60);
});

test('clampLines 仅截断超行文本', () => {
  assert.deepEqual(clampLines(['短行'], 3, 40, width), ['短行']);
  assert.deepEqual(textTokens('日均 40 亿 Token'), ['日', '均', ' ', '40', ' ', '亿', ' ', 'Token']);
});
