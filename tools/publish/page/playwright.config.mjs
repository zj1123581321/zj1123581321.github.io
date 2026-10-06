import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: /.*\.spec\.mjs/,
  timeout: 10000,
  retries: 0,
  workers: 1,
  use: {
    browserName: 'chromium',
    headless: true,
    baseURL: 'http://127.0.0.1:3344',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  webServer: {
    command: 'node test/server.mjs',
    url: 'http://127.0.0.1:3344/page/',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
