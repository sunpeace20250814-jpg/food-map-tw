// 抽 5 家 ch + 3 家 tn + Boo Thai, 開 detail page 截圖視覺驗證
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SAMPLE_IDS = [
  // CH matched
  { city: 'ch', id: 'ch-001', note: '阿三肉圓 matched' },
  { city: 'ch', id: 'ch-005', note: '正彰化肉圓 matched' },
  { city: 'ch', id: 'ch-007', note: '王罔麵線糊 matched' },
  { city: 'ch', id: 'ch-014', note: '夜市爌肉飯 matched' },
  { city: 'ch', id: 'ch-028', note: '黑公雞風味餐廳 matched' },
  // CH unknown
  { city: 'ch', id: 'ch-002', note: '阿璋肉圓 unknown' },
  { city: 'ch', id: 'ch-003', note: '北門口肉圓 unknown' },
  { city: 'ch', id: 'ch-011', note: '大元餅行 unknown(之前抓到是大元蔴薯)' },
  // TN
  { city: 'tn', id: 'tn-46', note: '西羅殿牛肉湯 v1 lh3' },
  { city: 'tn', id: 'tn-88', note: 'Boo Thai 布泰象' },
  // CH failed
  { city: 'ch', id: 'ch-004', note: '過溝仔肉圓王 0 圖' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  fs.mkdirSync('data/photo_screenshots/visual-check', { recursive: true });
  for (const s of SAMPLE_IDS) {
    const fn = path.join('data', 'shops', `${s.city}.json`);
    const shops = JSON.parse(fs.readFileSync(fn, 'utf8'));
    const shop = shops.find(x => x.id === s.id);
    if (!shop) { console.log(`Skip ${s.id}: not found`); continue; }
    const name = shop.name;
    const q = encodeURIComponent(`${name} ${shop.district || ''}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    process.stdout.write(`[${s.id}] ${s.note} → "${name}"... `);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2500);
      const first = await page.locator('[role="article"]').first();
      if (await first.count() > 0) {
        await first.click();
        await page.waitForTimeout(3000);
      }
      const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
      console.log(`h1="${h1.slice(0,30)}"`);
      const fname = `data/photo_screenshots/visual-check/${s.id}.png`;
      await page.screenshot({ path: fname });
    } catch (e) {
      console.log('ERR:', e.message.slice(0, 50));
    }
  }
  await browser.close();
  console.log('\n✅ Screenshots in data/photo_screenshots/visual-check/');
})();
