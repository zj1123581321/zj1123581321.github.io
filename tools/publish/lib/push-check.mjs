import { spawnSync } from 'node:child_process';
import path from 'node:path';

// 未推送检查（约束卡）：repoRelPaths 逐个 `git cat-file -e origin/<branch>:<路径>`（branch 默认
// main，--ref 时为指定分支），任一失败 → 非零退出并列出全部缺失路径与实际检查的 ref；
// 调用方保证此检查先于任何产物写盘。
export function assertAllPushed(repoRoot, repoRelPaths, branch = 'main') {
  const missing = [];
  for (const rel of repoRelPaths) {
    const r = spawnSync('git', ['cat-file', '-e', `origin/${branch}:${rel}`], { cwd: repoRoot, stdio: 'ignore' });
    if (r.status !== 0) {
      missing.push(rel);
    } else if (r.error) {
      throw r.error;
    }
  }
  if (missing.length > 0) {
    throw new Error(`图片尚未推送：以下 ${missing.length} 个文件不在 origin/${branch} 上，先提交并推送后重跑（或测试用 --skip-push-check）：\n${missing.join('\n')}`);
  }
}
