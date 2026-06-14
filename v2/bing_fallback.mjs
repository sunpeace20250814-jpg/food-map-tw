// 改用 Bing 圖片搜尋
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGETS = [
  { id: 'ch-019', name: '牟家爌肉飯', address: '彰化縣彰化市中山路一段541號' },
  { id: 'ch-066', name: '道香香早餐店', address: '彰化縣溪湖鎮大竹里彰水路二段637號' },
  { id: 'ch-068', name: '彰水路無名早餐店', address: '彰化縣溪湖鎮平和里彰水路三段181號' },
];

const SCREENSHOT_DIR = 'data/photo_screenshots/visual-check/bing';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function bingSearch(page, query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  // 滾動觸發 lazy load
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(800);
  }
  const imgs = await page.evaluate(() => {
    const out = new Set();
    document.querySelectorAll('a.iusc').forEach(a => {
      const m = a.getAttribute('m') || '';
      try {
        const obj = JSON.parse(m);
        if (obj.murl) out.add(obj.murl);
      } catch {}
    });
    return [...out].slice(0, 30);
  });
  try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${query}.png`) }); } catch {}
  return imgs;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const outFile = 'data/photo_bing_log.json';
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  for (const s of TARGETS) {
    const queries = [s.name, `${s.name} ${s.address.split(' ')[0]}`];
    for (const q of queries) {
      const imgs = await bingSearch(page, q);
      console.log(`${s.id} ${q}: ${imgs.length} 張 from Bing`);
      if (imgs.length > 0) {
        results[s.id] = { name: s.name, urls: imgs, query: q, source: 'bing' };
        console.log('  sample:', imgs[0].slice(0, 100));
        break;
      }
    }
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
