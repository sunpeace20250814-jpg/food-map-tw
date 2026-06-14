// 分批跑 (3 家/批) + 每批獨立 browser 避免超時
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGETS = JSON.parse(fs.readFileSync('data/refetch_targets.json', 'utf8'));
const BATCH_IDX = parseInt(process.argv[2] || '0', 10); // 0,1,2,3
const BATCH_SIZE = 3;
const batch = TARGETS.slice(BATCH_IDX * BATCH_SIZE, BATCH_IDX * BATCH_SIZE + BATCH_SIZE);
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
  ];

  for (const q of queries) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    lh3Local.clear();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(2000);
      const articles = await page.locator('[role="article"]').all();
      for (let i = 0; i < Math.min(articles.length, 3); i++) {
        try { await articles[i].click({ timeout: 2500 }); } catch { continue; }
        await page.waitForTimeout(2000);
        const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
        if (!h1 || h1 === '結果') continue;
        const matches = s.name.match(/[\u4e00-\u9fa5]{3,}/g) || [s.name];
        if (matches.some(m => h1.includes(m))) {
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
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(1000);
      }
    } catch {}
  }
  page.off('response', onResp);
  return { urls: [], detailTitle: '', matched: false, query: '' };
}

(async () => {
  if (batch.length === 0) { console.log('Batch empty'); return; }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const outFile = `data/photo_refetch3_batch${BATCH_IDX}.json`;
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  for (const s of batch) {
    const r = await fetchOne(page, s);
    const icon = r.matched ? '✅' : '❌';
    console.log(`${icon} ${s.id} ${s.name.padEnd(20,' ')} → ${r.urls.length} | h1="${r.detailTitle.slice(0,25)}"`);
    results[s.id] = { ...r, name: s.name, city: 'ch' };
    try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${s.id}.png`) }); } catch {}
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
