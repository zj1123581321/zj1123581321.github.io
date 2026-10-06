import { test, expect } from '@playwright/test';

test.describe('md2platforms page initialization and error handling', () => {
  test('fails if post parameter is missing', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/page/');
    const banner = page.locator('#error-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('缺少 post 参数');
    await expect(page.locator('#app-content')).toBeHidden();
    expect(consoleErrors).toEqual([]);
  });

  test('fails if data.json returns 404', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/page/?post=non-existent-post');
    const banner = page.locator('#error-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('未找到数据文件');
    await expect(page.locator('#app-content')).toBeHidden();
  });

  test('fails if schema is not md2platforms/v1', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/page/?post=invalid-schema');
    const banner = page.locator('#error-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('不支持的 schema');
    await expect(page.locator('#app-content')).toBeHidden();
  });

  test('loads valid post without errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/page/?post=valid-post');
    await expect(page.locator('#error-banner')).toBeHidden();
    await expect(page.locator('#app-content')).toBeVisible();
    await expect(page.locator('#post-title')).toHaveText('测试文章标题：吃一堑，长一智');
    await expect(page.locator('#post-meta')).toContainText('valid-post');
    expect(consoleErrors).toEqual([]);
  });

  test('copies wechat html and verifies clipboard content with id="nice"', async ({ page }) => {
    await page.goto('/page/?post=valid-post');
    const copyBtn = page.locator('#btn-copy-wechat');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText('复制公众号全文');

    await copyBtn.click();
    await expect(copyBtn).toContainText('已复制');
    await expect(copyBtn).toHaveClass(/copied/);

    const clipboardHtml = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          return await blob.text();
        }
      }
      return null;
    });

    expect(clipboardHtml).toBeTruthy();
    expect(clipboardHtml).toContain('id="nice"');
    expect(clipboardHtml).toContain('测试微信标题');
    expect(clipboardHtml).toContain('测试微信正文内容');
  });

  test('copies X html segment and verifies rich text clipboard', async ({ page }) => {
    await page.goto('/page/?post=valid-post');
    const seg1 = page.locator('#x-segment-1');
    const seg1Btn = seg1.locator('.btn-copy-segment');
    await expect(seg1Btn).toBeVisible();
    await expect(seg1Btn).toHaveText('复制第 1 段');

    await seg1Btn.click();
    await expect(seg1Btn).toHaveText('✓ 第 1 段已复制');
    await expect(seg1).toHaveClass(/copied/);
    await expect(page.locator('#x-progress')).toHaveText('1 / 4 已复制');

    const clipboardHtml = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          return await blob.text();
        }
      }
      return null;
    });

    expect(clipboardHtml).toContain('X段落1标题');
    expect(clipboardHtml).toContain('X段落1正文');
  });

  test('copies X image segment (from JPEG) and verifies image/png clipboard', async ({ page }) => {
    await page.goto('/page/?post=valid-post');
    // Segment 4 uses assets/x-002.jpg
    const seg4 = page.locator('#x-segment-4');
    const seg4Btn = seg4.locator('.btn-copy-segment');
    await expect(seg4Btn).toBeVisible();
    await expect(seg4Btn).toHaveText('复制第 4 段');

    await seg4Btn.click();
    await expect(seg4Btn).toHaveText('✓ 第 4 段已复制');
    await expect(seg4).toHaveClass(/copied/);

    const imageInfo = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('image/png')) {
          const blob = await item.getType('image/png');
          return { type: blob.type, size: blob.size };
        }
      }
      return null;
    });

    expect(imageInfo).not.toBeNull();
    expect(imageInfo.type).toBe('image/png');
    expect(imageInfo.size).toBeGreaterThan(0);
  });

  test('copies title as plain text and verifies clipboard', async ({ page }) => {
    await page.goto('/page/?post=valid-post');
    const titleBtn = page.locator('#btn-copy-title');
    await expect(titleBtn).toBeVisible();
    await expect(titleBtn).toHaveText('复制标题');

    await titleBtn.click();
    await expect(titleBtn).toHaveText('✓ 标题已复制');
    await expect(titleBtn).toHaveClass(/copied/);

    const titleText = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          return await blob.text();
        }
      }
      return null;
    });

    expect(titleText).toBe('测试文章标题：吃一堑，长一智');
  });

  test('copies cover image (JPEG to PNG) and handles posts without cover', async ({ page }) => {
    // 1. Post with cover
    await page.goto('/page/?post=valid-post');
    const coverBtn = page.locator('#btn-copy-cover');
    await expect(coverBtn).toBeVisible();
    await expect(coverBtn).toHaveText('复制封面图');
    await expect(coverBtn).toBeEnabled();

    await coverBtn.click();
    await expect(coverBtn).toHaveText('✓ 封面已复制');
    await expect(coverBtn).toHaveClass(/copied/);

    const coverInfo = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('image/png')) {
          const blob = await item.getType('image/png');
          return { type: blob.type, size: blob.size };
        }
      }
      return null;
    });

    expect(coverInfo).not.toBeNull();
    expect(coverInfo.type).toBe('image/png');
    expect(coverInfo.size).toBeGreaterThan(0);

    // 2. Post without cover
    await page.goto('/page/?post=no-cover-post');
    const noCoverBtn = page.locator('#btn-copy-cover');
    await expect(noCoverBtn).toBeVisible();
    await expect(noCoverBtn).toHaveText('无封面图');
    await expect(noCoverBtn).toBeDisabled();
  });

  test('shows visible error banner when clipboard write is denied', async ({ page, context }) => {
    await page.goto('/page/?post=valid-post');
    // Clear clipboard permissions to simulate user/browser denial
    await context.clearPermissions();

    const titleBtn = page.locator('#btn-copy-title');
    await titleBtn.click();

    const banner = page.locator('#error-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('失败');
    // App content remains visible (non-fatal error)
    await expect(page.locator('#app-content')).toBeVisible();
  });

  test('ensures chromium browser is explicitly verified and non-empty', async ({ browserName }) => {
    expect(browserName).toBe('chromium');
  });
});
