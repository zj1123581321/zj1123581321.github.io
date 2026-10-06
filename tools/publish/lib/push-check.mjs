import { spawnSync } from 'node:child_process';
import path from 'node:path';

// 未推送检查（约束卡）：repoRelPaths 逐个 `git cat-file -e origin/main:<路径>`，
// 任一失败 → 非零退出并列出全部缺失路径；调用方保证此检查先于任何产物写盘。
export function assertAllPushed(repoRoot, repoRelPaths) {
  const missing = [];
  for (const rel of repoRelPaths) {
    const r = spawnSync('git', ['cat-file', '-e', `origin/main:${rel}`], { cwd: repoRoot, stdio: 'ignore' });
    if (r.status !== 0) {
      missing.push(rel);
    } else if (r.error) {
      throw r.error;
    }
  }
  if (missing.length > 0) {
    throw new Error(`图片尚未推送：以下 ${missing.length} 个文件不在 origin/main 上，先提交并推送后重跑（或测试用 --skip-push-check）：\n${missing.join('\n')}`);
  }
}
