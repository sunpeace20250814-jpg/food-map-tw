// @ts-check
// 美食遊覽 v9.2 — Playwright e2e
// 目標: https://food-map-tw-dun.vercel.app
//
// 7 個測試覆蓋核心 user flows:
//   1. 首頁可訪問且看到主標題
//   2-4. 三個城市切換 + 店家數量正確
//   5. 主題切換 (dark → light)
//   6. 篩選晶片（點小吃/夜市 → 店家變少）
//   7. 店家詳情 sheet（點卡片 → sheet 彈出 + 有標題）

const { test, expect } = require('@playwright/test');

// 共用: 每次測試都用乾淨的 storage,避免主題/收藏殘留影響斷言
test.beforeEach(async ({ context, page }) => {
  await context.clearCookies();
  // 強制不用 HTTP cache
  await context.route('**/*', (route) => {
    const headers = { ...route.request().headers(), 'cache-control': 'no-cache' };
    route.continue({ headers });
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await context.addInitScript(() => {
    try { localStorage.clear(); } catch (_) { /* ignore */ }
  });
});

// 讀取 #statTotal 並轉成整數
async function readStatTotal(page) {
  const text = (await page.locator('#statTotal').textContent())?.trim() ?? '';
  if (!/^\d+$/.test(text)) {
    throw new Error(`#statTotal 不是數字: "${text}"`);
  }
  return parseInt(text, 10);
}

// 切到指定城市並等待 #statTotal 反映新值
async function switchCityAndRead(page, cityText, expected) {
  await page.locator('.city-chip', { hasText: cityText }).click();
  await expect(page.locator('#statTotal')).not.toHaveText('--', { timeout: 10_000 });
  const n = await readStatTotal(page);
  expect(n, `${cityText} 店家數應為 ${expected}`).toBe(expected);
  return n;
}

test.describe('美食遊覽 v9.2 — 核心 e2e', () => {

  test('1. 首頁載入 + 看到「宵夜地圖」標題', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response, '應該有 HTTP response').not.toBeNull();
    expect(response.status(), '首頁 HTTP 狀態').toBeLessThan(400);

    const h1 = page.locator('h1.app-h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('宵夜地圖');

    await expect(page.locator('#themeToggle')).toBeVisible();
  });

  test('2. 切到「高雄」→ 看到 46 家', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await switchCityAndRead(page, '高雄', 46);
  });

  test('3. 切到「台南」→ 看到 50 家', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await switchCityAndRead(page, '台南', 50);
  });

  test('4. 切到「彰化」→ 看到 68 家', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await switchCityAndRead(page, '彰化', 68);
  });

  test('5. 點 #themeToggle → data-theme 變 light', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark', { timeout: 5_000 });

    await page.locator('#themeToggle').click();

    await expect(html).toHaveAttribute('data-theme', 'light', { timeout: 5_000 });
  });

  test('6. 點「小吃/夜市」篩選晶片 → 店家數變少（少於全部）', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // 先看高雄全部店家數
    const total = await readStatTotal(page);
    expect(total).toBeGreaterThan(0);

    // 點「小吃/夜市」篩選（quick-bar overflow-x: auto, 需 scrollIntoView）
    await page.evaluate(() => {
      const el = document.querySelector('[data-mcat-filter="小吃/夜市"]');
      if (el) el.scrollIntoView();
    });
    await page.locator('[data-mcat-filter="小吃/夜市"]').click({ force: true });
    await expect(page.locator('#statTotal')).not.toHaveText('--', { timeout: 10_000 });
    const filtered = await readStatTotal(page);

    // 篩選後店家數應少於全部
    expect(filtered, '小吃/夜市篩選結果應少於全部店家').toBeLessThan(total);
  });

  test('7. 點第一張卡片 → 店家詳情 sheet 彈出 + 有標題', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 等第一張卡片出現
    const firstCard = page.locator('.shop-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    // 點卡片
    await firstCard.click();

    // Sheet modal 應出現（#shopSheet 有 .show class）
    const sheet = page.locator('#shopSheet');
    await expect(sheet).toHaveClass(/show/, { timeout: 10_000 });

    // sheet 內有標題
    const title = page.locator('#shopSheet .sheet-title');
    await expect(title).toBeVisible({ timeout: 5_000 });
    await expect(title).not.toHaveText('');
  });
});
