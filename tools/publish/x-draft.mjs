#!/usr/bin/env node
// md2platforms X 长文章草稿自动填充。
// 用法：node tools/publish/x-draft.mjs content/posts/<目录>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runBuild } from './build.mjs';
import {
  BridgeClient,
  BRIDGE_SESSION,
  readBridgeAddress,
  runXDraft,
} from './lib/xdraft.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function main(argv) {
  const postArg = argv.find((arg) => !arg.startsWith('--'));
  if (!postArg) {
    throw new Error('用法：node tools/publish/x-draft.mjs content/posts/<目录>');
  }

  const postDir = path.resolve(REPO_ROOT, postArg);
  const dirName = path.basename(postDir);
  const outDir = path.join(REPO_ROOT, 'tools/publish/out', dirName);
  const dataPath = path.join(outDir, 'data.json');
  if (!fs.existsSync(dataPath)) {
    await runBuild({
      repoRoot: REPO_ROOT,
      postArg,
      skipPushCheck: false,
    });
  }
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const bridge = new BridgeClient({
    addr: readBridgeAddress(),
    session: BRIDGE_SESSION,
  });
  return runXDraft({ data, outDir, bridge });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
