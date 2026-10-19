import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { addJpegInputHash } from './lib.mjs';
import { wrapAndClamp, wrapText } from './text-layout.mjs';

const FONT_SHA256 = 'a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da';
const FONT_URL = 'https://raw.githubusercontent.com/google/fonts/2894aab31764f10f29c421bdfd2340d3b382d384/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf';
const FONT_PATH = path.join(os.homedir(), '.cache', 'blog-og', 'NotoSansSC-wght.ttf');
const WIDTH = 1200;
const HEIGHT = 630;
const COLORS = { background: '#f7f5f0', teal: '#187c75', title: '#202020', description: '#696969' };
let registeredFont = false;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function fontFile() {
  fs.mkdirSync(path.dirname(FONT_PATH), { recursive: true });
  if (!fs.existsSync(FONT_PATH)) {
    const response = await fetch(FONT_URL);
    if (!response.ok) throw new Error(`OG-FONT-DOWNLOAD-FAILED HTTP ${response.status}: ${FONT_URL}`);
    fs.writeFileSync(FONT_PATH, Buffer.from(await response.arrayBuffer()));
  }
  const bytes = fs.readFileSync(FONT_PATH);
  const actual = sha256(bytes);
  if (actual !== FONT_SHA256) {
    throw new Error(`OG-FONT-SHA256-MISMATCH expected=${FONT_SHA256} actual=${actual} path=${FONT_PATH}`);
  }
  return FONT_PATH;
}

async function registerFont() {
  if (registeredFont) return;
  GlobalFonts.registerFromPath(await fontFile(), 'Noto Sans SC');
  registeredFont = true;
}

function drawLines(ctx, lines, x, y, lineHeight, strokeWidth = 0) {
  if (strokeWidth > 0) {
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
  }
  for (let i = 0; i < lines.length; i++) {
    if (strokeWidth > 0) ctx.strokeText(lines[i], x, y + i * lineHeight);
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}

function assertLinesFit(ctx, lines, maxWidth, label) {
  for (const line of lines) {
    const width = ctx.measureText(line).width;
    if (width > maxWidth) {
      throw new Error(`OG-TEXT-LINE-OVERFLOW ${label} width=${width} maxWidth=${maxWidth} line=${line}`);
    }
  }
}

function fitTitle(ctx, text, maxWidth) {
  const layout = (size) => {
    ctx.font = `700 ${size}px "Noto Sans SC"`;
    const measure = (value) => ctx.measureText(value).width;
    return { size, raw: wrapText(text, maxWidth, measure), lines: wrapAndClamp(text, maxWidth, measure, 3) };
  };
  const first = layout(68);
  if (first.raw.length !== 3 || ctx.measureText(first.raw[2]).width >= maxWidth * 0.24) {
    return { size: first.size, lines: first.lines };
  }
  for (let size = 66; size >= 48; size -= 2) {
    const candidate = layout(size);
    if (candidate.raw.length <= 2) return { size: candidate.size, lines: candidate.lines };
  }
  return { size: first.size, lines: first.lines };
}

function fitDescription(ctx, text, maxWidth) {
  ctx.font = '400 28px "Noto Sans SC"';
  return wrapAndClamp(text, maxWidth, (value) => ctx.measureText(value).width, 3);
}

export async function renderCard({ title, description, language, avatarPath, hash }) {
  await registerFont();
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = COLORS.teal;
  ctx.fillRect(0, 0, 16, HEIGHT);

  const x = 82;
  const maxWidth = 1034;
  const topMargin = 82;
  const footerTop = 520;
  const heading = fitTitle(ctx, title, maxWidth);
  const titleLineHeight = Math.round(heading.size * 1.2);
  ctx.font = `700 ${heading.size}px "Noto Sans SC"`;
  assertLinesFit(ctx, heading.lines, maxWidth, 'title');

  const descriptionLines = description ? fitDescription(ctx, description, maxWidth) : [];
  const descriptionLineHeight = 41;
  ctx.font = '400 28px "Noto Sans SC"';
  if (descriptionLines.length) assertLinesFit(ctx, descriptionLines, maxWidth, 'description');

  const titleBlockHeight = heading.lines.length * titleLineHeight;
  const descriptionGap = descriptionLines.length ? 25 : 0;
  const descriptionBlockHeight = descriptionLines.length * descriptionLineHeight;
  const contentBlockHeight = titleBlockHeight + descriptionGap + descriptionBlockHeight;
  if (contentBlockHeight > footerTop - topMargin) {
    throw new Error(`OG-TEXT-BLOCK-OVERFLOW height=${contentBlockHeight} available=${footerTop - topMargin}`);
  }
  const contentTop = topMargin + ((footerTop - topMargin) - contentBlockHeight) / 2;

  ctx.font = `700 ${heading.size}px "Noto Sans SC"`;
  ctx.fillStyle = COLORS.title;
  drawLines(ctx, heading.lines, x, contentTop + heading.size, titleLineHeight, 2.4);

  if (descriptionLines.length) {
    const descriptionY = contentTop + titleBlockHeight + descriptionGap + 28;
    ctx.font = '400 28px "Noto Sans SC"';
    ctx.fillStyle = COLORS.description;
    drawLines(ctx, descriptionLines, x, descriptionY, descriptionLineHeight, 0.8);
  }

  const avatar = await loadImage(avatarPath);
  const avatarSize = 58;
  const avatarX = x;
  const avatarY = Math.min(footerTop, HEIGHT - avatarSize - 22);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  const cropSize = Math.min(avatar.width, avatar.height);
  const sx = (avatar.width - cropSize) / 2;
  const sy = (avatar.height - cropSize) / 2;
  ctx.drawImage(avatar, sx, sy, cropSize, cropSize, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  const brand = language === 'zh' ? '杂谈by立行' : "Lixing's Blog";
  const footerTextX = avatarX + avatarSize + 18;
  ctx.fillStyle = COLORS.title;
  ctx.font = '700 24px "Noto Sans SC"';
  ctx.lineWidth = 1.1;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle;
  ctx.strokeText(brand, footerTextX, avatarY + 25);
  ctx.fillText(brand, footerTextX, avatarY + 25);
  ctx.fillStyle = COLORS.teal;
  ctx.font = '400 20px "Noto Sans SC"';
  ctx.lineWidth = 0.65;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.strokeText('@bylixing · zj1123581321.com', footerTextX, avatarY + 51);
  ctx.fillText('@bylixing · zj1123581321.com', footerTextX, avatarY + 51);

  const jpeg = canvas.toBuffer('image/jpeg', 88);
  return addJpegInputHash(jpeg, hash);
}
