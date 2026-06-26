// @ts-check
// Playwright config for 美食遊覽 v5.13 e2e
// 目標: 部署在 Vercel 的靜態前端 + Supabase Cloud

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.js$/,
  fullyParallel: false,           // 共享同一份 Vercel 部署,避免互相干擾
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,                      // 失敗就直接看,不要 retry 掩蓋問題
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'https://food-map-tw-dun.vercel.app',
    headless: true,
    viewport: { width: 390, height: 844 },  // 手機尺寸,符合 PWA 設計
    ignoreHTTPSErrors: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
});