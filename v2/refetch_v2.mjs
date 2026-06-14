// 簡化版: Google Maps 自動導向 detail, 直接抓 lh3
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGETS = JSON.parse(fs.readFileSync('data/refetch_targets.json', 'utf8'));
const BATCH_IDX = parseInt(process.argv[2] || '0', 10);
const BATCH_SIZE = 3;
const batch = TARGETS.slice(BATCH_IDX * BATCH_SIZE, BATCH_IDX * BATCH_SIZE + BATCH_SIZE);
const SCREENSHOT_DIR = 'data/photo_screenshots/visual-check/batch2';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function fetchOne(page, s) {
  const lh3Local = new Set();
  const onResp = r => { if (r.url().includes('lh3.googleusercontent.com') && !r.url().match(/=w(36|24|48|72|96|144)-/)) lh3Local.add(r.url()); };
  page.on('response', onResp);

  const nameClean = s.name.replace(/[()（）].*?[()）]/g, '').trim();
  const queries = [
    `${s.name} ${s.district}`,
    `${nameClean} ${s.district}`,
    s.name,
    nameClean,
  ];

  for (const q of queries) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    lh3Local.clear();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      // Maps 自動導向店家頁, 等店家 cover photo 載入
      await page.waitForTimeout(3500);
      const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
      // 店名 3 字以上中文字匹配
      const matches = s.name.match(/[\u4e00-\u9fa5]{3,}/g) || [s.name];
      const isMatch = h1 && matches.some(m => h1.includes(m));
      // 抓頁面所有 lh3 + photo gallery (按更多照片鈕)
      const photoBtn = await page.locator('button[aria-label*="相片"], button[aria-label*="照片"]').first();
      if (await photoBtn.count() > 0) {
        try { await photoBtn.click({ timeout: 2000 }); await page.waitForTimeout(2000); } catch {}
      }
      const domUrls = await page.evaluate(() => {
        const out = new Set();
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src || '';
          if (src.includes('lh3.googleusercontent.com') && !src.match(/=w(36|24|48|72|96|144)-/)) out.add(src);
        });
        return [...out];
      });
      const all = [...new Set([...domUrls, ...lh3Local].map(u => u.replace(/=w\d+-h\d+[^=]*$/, '')))];
      if (isMatch && all.length > 0) {
        page.off('response', onResp);
        return { urls: all.slice(0, 12), detailTitle: h1, matched: true, query: q };
      }
      // 即使 title 不 match 也保留 url (給人工確認)
      if (all.length > 0) {
        page.off('response', onResp);
        return { urls: all.slice(0, 12), detailTitle: h1, matched: isMatch ? 'unknown' : 'wrong-shop', query: q };
      }
    } catch (e) { /* try next */ }
  }
  page.off('response', onResp);
  return { urls: [], detailTitle: '', matched: false, query: '' };
}

(async () => {
  if (batch.length === 0) { console.log('Batch empty'); return; }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const outFile = `data/photo_refetch4_batch${BATCH_IDX}.json`;
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  for (const s of batch) {
    const r = await fetchOne(page, s);
    const icon = r.matched === true ? '✅' : (r.matched === 'wrong-shop' ? '❌' : (r.matched === 'unknown' ? '❓' : '⚠️'));
    console.log(`${icon} ${s.id} ${s.name.padEnd(20,' ')} → ${r.urls.length} 張 | h1="${r.detailTitle.slice(0,25)}" | q="${r.query.slice(0,25)}"`);
    results[s.id] = { ...r, name: s.name, city: 'ch' };
    try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${s.id}.png`) }); } catch {}
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
