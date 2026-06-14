// 重抓 6 家難抓的, 用地址直接搜 + 視覺驗證
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGETS = [
  { id: 'ch-011', name: '大元餅行', address: '彰化縣彰化市中正路二段116號', district: '彰化市' },
  { id: 'ch-018', name: '泉焢肉飯', address: '彰化縣', district: '彰化市' },
  { id: 'ch-019', name: '牟家爌肉飯', address: '彰化縣', district: '彰化市' },
  { id: 'ch-034', name: '咖啡烟', address: '彰化縣', district: '彰化市' },
  { id: 'ch-038', name: '炎生實驗室咖啡', address: '彰化縣', district: '彰化市' },
  { id: 'ch-066', name: '道香香早餐店', address: '彰化縣', district: '彰化市' },
  { id: 'ch-068', name: '彰水路無名早餐店', address: '彰化縣', district: '彰化市' },
];

// 查 ch.json 取完整地址
const ch = JSON.parse(fs.readFileSync('data/shops/ch.json', 'utf8'));
ch.forEach(s => {
  const t = TARGETS.find(x => x.id === s.id);
  if (t && s.address) t.address = s.address;
});

const SCREENSHOT_DIR = 'data/photo_screenshots/visual-check/batch3';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function fetchOne(page, s) {
  const lh3Local = new Set();
  const onResp = r => { if (r.url().includes('lh3.googleusercontent.com') && !r.url().match(/=w(36|24|48|72|96|144)-/)) lh3Local.add(r.url()); };
  page.on('response', onResp);

  const nameClean = s.name.replace(/[()（）].*?[()）]/g, '').trim();
  const queries = [
    s.address !== '彰化縣' ? `${s.name} ${s.address}` : null,
    s.address !== '彰化縣' ? s.address : null,
    `${s.name} ${s.district}`,
    s.name,
    nameClean,
  ].filter(Boolean);

  for (const q of queries) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    lh3Local.clear();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3500);
      // 嘗試點第一個結果
      const first = await page.locator('[role="article"]').first();
      if (await first.count() > 0) {
        try { await first.click({ timeout: 3000 }); await page.waitForTimeout(2500); } catch {}
      }
      const photoBtn = await page.locator('button[aria-label*="相片"], button[aria-label*="照片"]').first();
      if (await photoBtn.count() > 0) {
        try { await photoBtn.click({ timeout: 2000 }); await page.waitForTimeout(2000); } catch {}
      }
      const data = await page.evaluate(() => {
        const h1 = document.querySelector('h1')?.textContent || '';
        const urls = new Set();
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src || '';
          if (src.includes('lh3.googleusercontent.com') && !src.match(/=w(36|24|48|72|96|144)-/)) urls.add(src);
        });
        return { h1, urls: [...urls] };
      });
      const all = [...new Set([...data.urls, ...lh3Local].map(u => u.replace(/=w\d+-h\d+[^=]*$/, '')))];
      // 接受: 1) 店名 match 2) 結果頁 url 仍是 lh3 (給人工看)
      const matches = s.name.match(/[\u4e00-\u9fa5]{3,}/g) || [s.name];
      const isMatch = data.h1 && matches.some(m => data.h1.includes(m));
      // 對特定店家接受同字號 (視覺驗證確認)
      const isSameChain = (
        (s.id === 'ch-018' && data.h1.includes('阿泉爌肉飯')) ||
        (s.id === 'ch-034' && data.h1.includes('咖啡 烟')) ||
        (s.id === 'ch-038' && data.h1.includes('炎生咖啡'))
      );
      if ((isMatch || isSameChain) && all.length > 0) {
        page.off('response', onResp);
        return { urls: all.slice(0, 12), detailTitle: data.h1, matched: true, query: q };
      }
      if (all.length > 0) {
        page.off('response', onResp);
        return { urls: all.slice(0, 12), detailTitle: data.h1, matched: isMatch ? 'unknown' : 'wrong-shop', query: q };
      }
    } catch (e) {}
  }
  page.off('response', onResp);
  return { urls: [], detailTitle: '', matched: false, query: '' };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const outFile = 'data/photo_refetch5_log.json';
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  for (const s of TARGETS) {
    const r = await fetchOne(page, s);
    const icon = r.matched === true ? '✅' : (r.matched === 'wrong-shop' ? '❌' : (r.matched === 'unknown' ? '❓' : '⚠️'));
    console.log(`${icon} ${s.id} ${s.name.padEnd(20,' ')} → ${r.urls.length} 張 | h1="${r.detailTitle.slice(0,30)}" | q="${r.query.slice(0,30)}"`);
    results[s.id] = { ...r, name: s.name, city: 'ch' };
    try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${s.id}.png`) }); } catch {}
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
