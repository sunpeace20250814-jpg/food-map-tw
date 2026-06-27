const { test, expect } = require('@playwright/test');

test('hover lift 效果', async ({ page }) => {
  await page.goto('https://food-map-tw-dun.vercel.app/?cb=v613test', { waitUntil: 'networkidle' });
  
  // 等卡片載入
  await page.waitForSelector('.shop-card');
  
  // 取第 1 張卡片
  const card = page.locator('.shop-card').first();
  
  // hover 前 transform
  const before = await card.evaluate(el => getComputedStyle(el).transform);
  console.log('Before hover transform:', before);
  
  // hover
  await card.hover();
  await page.waitForTimeout(400);
  
  // hover 後 transform
  const after = await card.evaluate(el => getComputedStyle(el).transform);
  console.log('After hover transform:', after);
  
  // 截圖
  await page.screenshot({ path: 'tests/hover-result.png' });
  
  // 驗證有改變
  expect(before).not.toBe(after);
});
