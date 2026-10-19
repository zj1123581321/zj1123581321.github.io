import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function textInkBounds(relativePath) {
  const image = await loadImage(fs.readFileSync(path.join(ROOT, relativePath)));
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const left = 40;
  const top = 60;
  const width = image.width - 80;
  const height = 460;
  const pixels = context.getImageData(left, top, width, height).data;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < pixels.length; index += 4) {
    const gray = (pixels[index] * 299 + pixels[index + 1] * 587 + pixels[index + 2] * 114) / 1000;
    if (gray < 170) {
      const y = top + Math.floor(index / 4 / width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { minY, maxY };
}

for (const [label, relativePath] of [
  ['标题与描述', 'content/posts/260721-the-zelda-phase-of-life/og-card.zh.jpg'],
  ['无描述标题', 'content/posts/260328-context-is-all-you-need/og-card.zh.jpg'],
]) {
  test(`${label}文字墨迹在顶边距与 footer 上沿间垂直居中`, async () => {
    const { minY, maxY } = await textInkBounds(relativePath);
    const center = (minY + maxY) / 2;
    assert.ok(minY >= 82, `top ink ${minY} is above the 82px content margin`);
    assert.ok(Math.abs(center - (82 + 520) / 2) <= 12, `ink center ${center} is not centered in [82, 520]`);
  });
}
