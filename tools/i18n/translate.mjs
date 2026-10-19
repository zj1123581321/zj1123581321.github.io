#!/usr/bin/env node
/**
 * 把中文文章翻译成英文草稿
 *
 * 用法: node tools/i18n/translate.mjs <文章目录>
 *   <文章目录> 形如 content/posts/260101-demo（相对或绝对路径）
 *
 * 行为:
 *   - 读 <文章目录>/index.md 中文原文
 *   - 调用本机 claude -p --model sonnet 翻译，prompt 从 stdin 传入
 *   - 写出 <文章目录>/index.en.md：frontmatter 由脚本生成，draft: true
 *   - 已有 index.en.md 时把旧英文正文喂给模型，只改动与中文变化对应的部分
 *   - 失败（claude 非零退出 / 输出为空 / 解析不出标题或正文）→ 退出非零，
 *     stderr 含 I18N-TRANSLATE-FAILED，不写、不改 index.en.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { sourceHash, readFrontmatter } from './lib.mjs';

const FAIL = 'I18N-TRANSLATE-FAILED';
const MODEL = 'sonnet';

function fail(reason) {
  console.error(`${FAIL} ${reason}`);
  process.exit(1);
}

function bodyOf(markdownText) {
  const text = String(markdownText).replaceAll('\r\n', '\n');
  if (!text.startsWith('---\n')) {
    fail('article must start with YAML frontmatter');
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
    fail('frontmatter has no closing ---');
  }
  return lines.slice(closeIdx + 1).join('\n').trim();
}

function buildPrompt({ zhBody, wantDescription, oldEnBody }) {
  const lines = [
    '你是一名中译英的博客译员。把下面这篇中文博客文章翻译成英文。',
    '输出必须严格遵循以下机器可解析格式：每个标记行独占一行、原样输出；标记行之外不得输出任何解释或多余内容。',
    '',
    '=== TITLE ===',
    '<英文标题，一行>',
  ];
  if (wantDescription) {
    lines.push('=== DESCRIPTION ===', '<英文描述，对应中文 description，一行>');
  }
  lines.push(
    '=== BODY ===',
    '<英文正文，Markdown>',
    '',
    '翻译要求：',
    '- 保持作者第一人称口吻与语气，忠实翻译，不增删观点。',
    '- 技术名词保留英文原样，不要翻译：Claude Code、Codex、Pi、agent、coding agent、harness、Token、Skill、MCP、Context、Loop 等。',
    '- Markdown 结构（标题层级、列表、表格、引用、链接）原样保留；图片引用的路径一字不改。',
    '- 代码块与 mermaid 图内的代码一律不翻译，只翻译其中的注释文字。',
    '- 中文引号「」与“”按英文习惯转换为英文引号。',
    '',
    '中文全文如下：',
    '',
    zhBody,
  );
  if (oldEnBody) {
    lines.push(
      '',
      '下面是这篇文章的上一版英文译文。中文原文可能有更新：只改动与中文变化对应的部分，其余部分逐字保留。',
      '',
      oldEnBody,
    );
  }
  return lines.join('\n');
}

function parseModelOutput(text, wantDescription) {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const marks = {};
  for (const [i, line] of lines.entries()) {
    const m = line.match(/^=== (TITLE|DESCRIPTION|BODY) ===$/);
    if (m && !(m[1] in marks)) {
      marks[m[1]] = i;
    }
  }
  if (!('TITLE' in marks) || !('BODY' in marks)) {
    return null;
  }
  if (wantDescription && !('DESCRIPTION' in marks)) {
    return null;
  }
  const starts = Object.values(marks).sort((a, b) => a - b);
  const section = (name) => {
    const after = starts.find((i) => i > marks[name]);
    return lines.slice(marks[name] + 1, after ?? lines.length).join('\n');
  };
  const oneLine = (name) => section(name).replace(/\s+/g, ' ').trim();
  const title = oneLine('TITLE');
  const body = section('BODY').trim();
  if (!title || !body) {
    return null;
  }
  let description;
  if ('DESCRIPTION' in marks) {
    description = oneLine('DESCRIPTION');
    if (!description) {
      return null;
    }
  }
  if (wantDescription && !description) {
    return null;
  }
  return { title, description, body };
}

function yamlQuoted(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

// --- 参数 ---
const dirArg = process.argv[2];
if (!dirArg) {
  fail('usage: node tools/i18n/translate.mjs <文章目录>');
}
const postDir = path.resolve(dirArg);
const zhPath = path.join(postDir, 'index.md');
const enPath = path.join(postDir, 'index.en.md');
if (!fs.existsSync(zhPath)) {
  fail(`missing ${zhPath}`);
}

const zhText = fs.readFileSync(zhPath, 'utf8');
let zhFm;
try {
  zhFm = readFrontmatter(zhText);
} catch (e) {
  fail(`Chinese frontmatter unparseable: ${e.message}`);
}
if (!zhFm.date) {
  fail('Chinese frontmatter has no date');
}

const slug = path.basename(postDir);
const hasUrl = Object.hasOwn(zhFm, 'url');
const zhPagePath = hasUrl ? zhFm.url : `/posts/${slug}/`;
const wantDescription = Object.hasOwn(zhFm, 'description');
const oldEnBody = fs.existsSync(enPath) ? bodyOf(fs.readFileSync(enPath, 'utf8')) : null;

// --- 调用 claude（prompt 走 stdin） ---
const prompt = buildPrompt({ zhBody: bodyOf(zhText), wantDescription, oldEnBody });
const r = spawnSync('claude', ['-p', '--model', MODEL], { input: prompt, encoding: 'utf8' });
if (r.error) {
  fail(`cannot spawn claude: ${r.error.message}`);
}
if (r.status !== 0) {
  const errTail = (r.stderr ?? '').trim().slice(-500);
  fail(`claude exited with status ${r.status}${errTail ? `: ${errTail}` : ''}`);
}
const output = (r.stdout ?? '').trim();
if (!output) {
  fail('claude produced empty output');
}

const parsed = parseModelOutput(output, wantDescription);
if (!parsed) {
  fail(`cannot parse model output: expected === TITLE ===${wantDescription ? ' / === DESCRIPTION ===' : ''} / === BODY === sections`);
}

// --- 写出英文草稿（frontmatter 由脚本生成，不让模型生成） ---
const fmLines = [
  '---',
  `title: ${yamlQuoted(parsed.title)}`,
  `date: ${zhFm.date}`,
  'draft: true',
];
if (hasUrl) {
  fmLines.push(`url: ${yamlQuoted(`/en${zhFm.url}`)}`);
}
fmLines.push(
  `sourceHash: ${yamlQuoted(sourceHash(zhText))}`,
  `translatedBy: "claude-cli/${MODEL}"`,
);
if (wantDescription) {
  fmLines.push(`description: ${yamlQuoted(parsed.description)}`);
}
fmLines.push('---');

const enText =
  `${fmLines.join('\n')}\n` +
  `*Translated from the [Chinese original](${zhPagePath}).*\n` +
  `\n${parsed.body}\n`;
fs.writeFileSync(enPath, enText);
console.log(`英文草稿已生成: ${enPath} (draft: true，审阅后改为 false)`);
