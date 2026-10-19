#!/usr/bin/env node
import { checkCards, POSTS_DIR } from './lib.mjs';

const issues = checkCards(process.argv[2] ?? POSTS_DIR);
if (issues.length === 0) {
  console.log('OG-CARD-OK');
} else {
  for (const issue of issues) {
    console.error(`${issue.code} ${issue.path} 修复：${issue.repair}`);
  }
  process.exitCode = 1;
}
