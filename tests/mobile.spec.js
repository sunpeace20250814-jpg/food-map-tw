const { test } = require('@playwright/test');

test('mobile 渲染 (Pixel 5)', async ({ page, baseURL }) => {
  // Playwright Pixel 5 viewport is set in config
  // 用 baseURL (Vercel production) 取代舊的 localhost:8890 local server
  await page.goto(`${baseURL}/?cb=mv704`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'tests/mobile.png', fullPage: true });
});