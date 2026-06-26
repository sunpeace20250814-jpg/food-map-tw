// @ts-check
// 美食遊覽 v5.13 — Playwright e2e
// 目標: https://food-map-tw-dun.vercel.app
//
// 5 個測試覆蓋核心 user flows:
//   1. 首頁可訪問且看到主標題
//   2-4. 三個城市切換 + 店家數量正確
//   5. 主題切換 (dark → light)

const { test, expect } = require('@playwright/test');

// 共用: 每次測試都用乾淨的 storage,避免主題/收藏殘留影響斷言
test.beforeEach(async ({ context }) => {
  await context.clearCookies();
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
  // 等待 statTotal 變成預期值 (或是其他數字,以脫離 "--" 為門檻)
  await expect(page.locator('#statTotal')).not.toHaveText('--', { timeout: 10_000 });
  const n = await readStatTotal(page);
  expect(n, `${cityText} 店家數應為 ${expected}`).toBe(expected);
  return n;
}

test.describe('美食遊覽 v5.13 — 核心 e2e', () => {

  test('1. 首頁載入 + 看到「宵夜地圖」標題', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response, '應該有 HTTP response').not.toBeNull();
    expect(response.status(), '首頁 HTTP 狀態').toBeLessThan(400);

    // 主標題: <h1 class="app-h1">宵夜地圖</h1>
    const h1 = page.locator('h1.app-h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('宵夜地圖');

    // 主題切換按鈕也要存在
    await expect(page.locator('#themeToggle')).toBeVisible();
  });

  test('2. 切到「高雄」→ 看到 46 家', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // 首頁預設是高雄,但保險起見也點一次
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

    // 預設主題是 dark,點一次 → light
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark', { timeout: 5_000 });

    await page.locator('#themeToggle').click();

    await expect(html).toHaveAttribute('data-theme', 'light', { timeout: 5_000 });
  });
});