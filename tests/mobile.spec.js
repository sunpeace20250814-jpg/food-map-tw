const { test } = require('@playwright/test');

test('mobile 渲染 (Pixel 5)', async ({ page, baseURL }) => {
  // Playwright Pixel 5 viewport is set in config
  await page.goto('http://localhost:8890/?cb=mv704', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'tests/mobile.png', fullPage: true });
});