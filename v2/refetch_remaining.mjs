// 分批重抓剩 11 家 CH 店家
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGETS = [
  { id: 'ch-004', name: '過溝仔肉圓王', address: '彰化縣彰化市彰美路一段58-4號', district: '彰化市' },
  { id: 'ch-011', name: '大元餅行', address: '彰化縣彰化市中正路二段116號', district: '彰化市' },
  { id: 'ch-018', name: '泉焢肉飯', address: '彰化縣', district: '彰化市' },
  { id: 'ch-019', name: '牟家爌肉飯', address: '彰化縣', district: '彰化市' },
  { id: 'ch-028', name: '黑公雞風味餐廳', address: '彰化縣花壇鄉聽竹街50號', district: '花壇鄉' },
  { id: 'ch-031', name: '石頭燒肉（彰化仁愛直營館）', address: '彰化縣', district: '彰化市' },
  { id: 'ch-034', name: '咖啡烟', address: '彰化縣', district: '彰化市' },
  { id: 'ch-038', name: '炎生實驗室咖啡', address: '彰化縣', district: '彰化市' },
  { id: 'ch-058', name: '京巧手工湯包', address: '彰化縣', district: '溪湖鎮' },
  { id: 'ch-066', name: '道香香早餐店', address: '彰化縣', district: '彰化市' },
  { id: 'ch-068', name: '彰水路無名早餐店', address: '彰化縣', district: '彰化市' },
];

const SCREENSHOT_DIR = 'data/photo_screenshots/visual-check/batch';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function fetchOne(page, s) {
  const lh3Local = new Set();
  const onResp = r => { if (r.url().includes('lh3.googleusercontent.com') && !r.url().match(/=w(36|24|48|72|96|144)-/)) lh3Local.add(r.url()); };
  page.on('response', onResp);
  const nameClean = s.name.replace(/[()（）].*?[()）]/g, '').trim();
  const queries = [
    s.name,
    nameClean,
    `${nameClean} ${s.district}`,
    `${nameClean} 彰化`,
    s.address !== '彰化縣' ? `${nameClean} ${s.address}` : null,
  ].filter(Boolean);

  for (const q of queries) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    lh3Local.clear();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2200);
      const articles = await page.locator('[role="article"]').all();
      for (let i = 0; i < Math.min(articles.length, 4); i++) {
        try { await articles[i].click({ timeout: 3000 }); } catch { continue; }
        await page.waitForTimeout(2200);
        const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
        if (!h1 || h1 === '結果') continue;
        const matches = s.name.match(/[\u4e00-\u9fa5]{3,}/g) || [s.name];
        const isMatch = matches.some(m => h1.includes(m));
        if (isMatch) {
          const domUrls = await page.evaluate(() => {
            const out = new Set();
            document.querySelectorAll('img').forEach(img => {
              const src = img.src || img.dataset.src || '';
              if (src.includes('lh3.googleusercontent.com') && !src.match(/=w(36|24|48|72|96|144)-/)) out.add(src);
            });
            return [...out];
          });
          const all = [...new Set([...domUrls, ...lh3Local].map(u => u.replace(/=w\d+-h\d+[^=]*$/, '')))];
          page.off('response', onResp);
          return { urls: all.slice(0, 12), detailTitle: h1, matched: true, query: q };
        }
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1200);
      }
    } catch {}
  }
  page.off('response', onResp);
  return { urls: [], detailTitle: '', matched: false, query: '' };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const allResults = {};
  for (const s of TARGETS) {
    const r = await fetchOne(page, s);
    const icon = r.matched ? '✅' : '❌';
    console.log(`${icon} ${s.id} ${s.name.padEnd(20,' ')} → ${r.urls.length} | h1="${r.detailTitle.slice(0,25)}"`);
    allResults[s.id] = { ...r, name: s.name, city: 'ch' };
    try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${s.id}.png`) }); } catch {}
  }
  fs.writeFileSync('data/photo_refetch3_log.json', JSON.stringify(allResults, null, 2));
  const ok = Object.values(allResults).filter(r => r.matched).length;
  console.log(`\n=== 結果: ${ok}/${TARGETS.length} 成功 ===`);
  await browser.close();
})();
