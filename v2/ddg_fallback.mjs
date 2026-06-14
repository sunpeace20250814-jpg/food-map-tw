// 對 ch-019 + ch-066 改用 DuckDuckGo 圖片搜尋
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGETS = [
  { id: 'ch-019', name: '牟家爌肉飯', address: '彰化縣彰化市中山路一段541號', district: '彰化市' },
  { id: 'ch-066', name: '道香香早餐店', address: '彰化縣溪湖鎮大竹里彰水路二段637號', district: '溪湖區' },
];

const SCREENSHOT_DIR = 'data/photo_screenshots/visual-check/ddg';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function ddgSearch(page, query) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
  const imgs = await page.evaluate(async (u) => {
    const res = await fetch(u);
    const html = await res.text();
    const m = html.matchAll(/data-src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))[^"]*"/gi);
    return [...m].map(x => x[1]);
  }, url).catch(() => []);
  return imgs;
}

async function fetchOne(page, s) {
  const queries = [
    `${s.name}`,
    `${s.name} ${s.address}`,
    `${s.name} 彰化`,
  ];
  for (const q of queries) {
    try {
      await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);
      // DDG 圖片頁: 抓 img 標籤
      const imgs = await page.evaluate(() => {
        const out = new Set();
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src || '';
          if (src.startsWith('http') && (src.includes('jpeg') || src.includes('jpg') || src.includes('webp') || src.includes('png'))) {
            out.add(src);
          }
        });
        return [...out].slice(0, 20);
      });
      if (imgs.length > 0) {
        try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${s.id}-ddg.png`) }); } catch {}
        return { urls: imgs, source: 'ddg', query: q };
      }
    } catch (e) {}
  }
  return { urls: [], source: 'ddg', query: '' };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const outFile = 'data/photo_ddg_log.json';
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  for (const s of TARGETS) {
    const r = await fetchOne(page, s);
    console.log(`${s.id} ${s.name}: ${r.urls.length} 張 from DDG | q="${r.query}"`);
    if (r.urls.length > 0) console.log('  sample:', r.urls[0].slice(0, 100));
    results[s.id] = { ...r, name: s.name, city: 'ch' };
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
