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
});
