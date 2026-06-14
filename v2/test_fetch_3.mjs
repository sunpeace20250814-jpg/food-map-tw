// 試跑 3 家
import { chromium } from 'playwright';

const TEST_SHOPS = [
  { id: 'ch-001', name: '阿三肉圓', city: 'ch', address: '彰化縣彰化市三民路242號' },
  { id: 'ch-002', name: '彰化肉圓', city: 'ch', address: '彰化縣' },
  { id: 'tn-87', name: 'Boo Thai Fun (布泰象泰式廚房)', city: 'tn', address: '台南市東區崇善路179號' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await ctx.newPage();
  const lh3Net = new Set();
  page.on('response', r => { if (r.url().includes('lh3.googleusercontent.com')) lh3Net.add(r.url()); });

  for (const s of TEST_SHOPS) {
    lh3Net.clear();
    const q = encodeURIComponent(`${s.name} ${s.address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    console.log(`\n=== ${s.name} ===`);
    console.log('URL:', url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(4000);
      // 截圖搜尋頁
      await page.screenshot({ path: `test-${s.id}-1-search.png` });
      // 嘗試點第一個結果
      const first = await page.locator('[role="article"]').first();
      if (await first.count() > 0) {
        await first.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `test-${s.id}-2-detail.png` });
      }
      const domUrls = await page.evaluate(() => {
        const out = new Set();
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src') || '';
          if (src.includes('lh3.googleusercontent.com')) out.add(src);
        });
        return [...out];
      });
      console.log(`  網路攔截 lh3: ${lh3Net.size}`);
      console.log(`  DOM img lh3: ${domUrls.length}`);
      [...new Set([...lh3Net, ...domUrls])].slice(0, 5).forEach(u => console.log('    ' + u.slice(0, 100)));
    } catch (e) {
      console.log('  ERROR:', e.message.slice(0, 100));
    }
  }
  await browser.close();
})();
