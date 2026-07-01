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

// 計算可見且符合縣市的卡片數（不依賴 #statTotal，避免 race condition）
async function countVisibleCityCards(page, city) {
  return await page.evaluate((c) => {
    return Array.from(document.querySelectorAll('.shop-card'))
      .filter(el => el.style.display !== 'none' && (el.dataset.city || 'kh') === c)
      .length;
  }, city);
}

// 切到指定城市 → 計算 visible cards 數量
async function switchCityAndCount(page, cityText, cityCode, expected) {
  await page.locator('.city-chip', { hasText: cityText }).click();
  // 等卡片渲染穩定（最多 5 秒）
  await page.waitForTimeout(500);
  const n = await countVisibleCityCards(page, cityCode);
  expect(n, `${cityText} visible 店家數應為 ${expected}`).toBe(expected);
  return n;
}

test.describe('美食遊覽 v10.x — 核心 e2e', () => {

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
    await switchCityAndCount(page, '高雄', 'kh', 46);
  });

  test('3. 切到「台南」→ 看到 50 家', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await switchCityAndCount(page, '台南', 'tn', 50);
  });

  test('4. 切到「彰化」→ 看到 68 家', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await switchCityAndCount(page, '彰化', 'ch', 68);
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

    // 先打開 filter 面板（mcat chips 在 collapsed <details> 內,scrollIntoView 沒用）
    await page.evaluate(() => {
      const d = document.querySelector('details.filter-details');
      if (d) d.open = true;
    });

    // 算「高雄可見 cards」 = 這個是用戶實際看到的篩選結果,
    // 不依賴 #statTotal (它要 updateHeroStats 才會更新,但 deployed filters.js 有這個 bug)
    async function visibleKhCards() {
      return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.shop-card'))
          .filter(c => c.style.display !== 'none' && (c.dataset.city || 'kh') === 'kh')
          .length;
      });
    }

    const total = await visibleKhCards();
    expect(total, '高雄初始店家數應大於 0').toBeGreaterThan(0);

    // 點「小吃/夜市」篩選晶片
    await page.locator('[data-mcat-filter="小吃/夜市"]').click();
    await page.waitForTimeout(300);

    const filtered = await visibleKhCards();

    // 篩選後店家數應少於全部
    expect(filtered, '小吃/夜市篩選結果應少於全部店家').toBeLessThan(total);
    expect(filtered, '小吃/夜市至少要有 1 家').toBeGreaterThan(0);
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
