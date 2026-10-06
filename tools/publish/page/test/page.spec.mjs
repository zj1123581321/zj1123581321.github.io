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
});
