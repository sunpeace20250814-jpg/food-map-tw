// 重抓 unknown + failed 的 21 家, 加強驗證
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const DATA_DIR = 'data';
const SHOP_FILES = ['shops/ch.json'];
const PHOTOS_OLD = 'data/photos_lh3_ch.json';
const OUT_PHOTOS = 'data/photos_lh3_ch_v2.json';
const OUT_LOG = 'data/photo_refetch_log.json';

const photosOld = JSON.parse(fs.readFileSync(PHOTOS_OLD, 'utf8'));

async function fetchOne(page, shop) {
  const lh3Local = new Set();
  const result = { shop, urls: [], detailTitle: '', matched: false, error: null, attempts: 0 };
  const onResp = r => { if (r.url().includes('lh3.googleusercontent.com') && !r.url().match(/=w(36|24|48|72|96|144)-/)) lh3Local.add(r.url()); };
  page.on('response', onResp);

  // 多組 query 嘗試
  const nameClean = shop.name.replace(/\(.*?\)/g, '').replace(/（.*?）/g, '').trim();
  const addrClean = (shop.address || '').replace(/[0-9]+號?/g, '').trim(); // 去掉門牌號
  const queries = [
    `${nameClean} ${shop.district || ''}`,
    `${nameClean} ${addrClean}`,
    `${nameClean} ${shop.city === 'ch' ? '彰化' : ''}`,
    `${nameClean}`,
  ];

  for (const q of queries) {
    if (!q.trim()) continue;
    result.attempts++;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    try {
      lh3Local.clear();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await page.waitForTimeout(2500);
      const first = await page.locator('[role="article"]').first();
      if (await first.count() > 0) {
        await first.click();
        await page.waitForTimeout(3000);
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
      if (all.length === 0) continue;
      const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
      result.detailTitle = h1;
      // 驗證: h1 包含店名前 3 字
      const kw = nameClean.slice(0, 3);
      if (h1.includes(kw)) {
        result.urls = all.slice(0, 12);
        result.matched = true;
        page.off('response', onResp);
        return result;
      } else if (h1 && h1 !== '結果') {
        // 進了店家頁但店名不對
        result.urls = all.slice(0, 12);
        result.matched = 'wrong-shop';
        result.detailTitle = h1;
        // 繼續嘗試下一個 query
      }
    } catch (e) {
      result.error = e.message.slice(0, 60);
    }
  }
  page.off('response', onResp);
  return result;
}

async function main() {
  const allShops = [];
  for (const f of SHOP_FILES) {
    const shops = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    allShops.push(...shops.map(s => ({ ...s, _src: f })));
  }
  // 只抓 unknown + failed
  const need = allShops.filter(s => {
    const k = `${s.city}-${s.id}`;
    const p = photosOld[k];
    return !p || p.matched !== true;
  });
  console.log(`需重抓: ${need.length} 家`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const results = [];
  for (let i = 0; i < need.length; i++) {
    const s = need[i];
    const r = await fetchOne(page, s);
    const icon = r.matched === true ? '✅' : (r.matched === 'wrong-shop' ? '❌' : '❓');
    process.stdout.write(`[${i+1}/${need.length}] ${icon} ${s.name.padEnd(28,' ')} → ${r.urls.length} 張 | ${r.detailTitle.slice(0,15)} (try ${r.attempts})\n`);
    results.push({ id: s.id, name: s.name, city: s.city, urls: r.urls, detailTitle: r.detailTitle, matched: r.matched, attempts: r.attempts, error: r.error });
  }

  // 合併到 photos_lh3_ch.json
  const merged = { ...photosOld };
  for (const r of results) {
    const k = `${r.city}-${r.id}`;
    merged[k] = { name: r.name, urls: r.urls, detailTitle: r.detailTitle, matched: r.matched };
  }
  fs.writeFileSync(OUT_PHOTOS, JSON.stringify(merged, null, 2));
  fs.writeFileSync(OUT_LOG, JSON.stringify(results, null, 2));
  const ok = results.filter(r => r.matched === true).length;
  const bad = results.filter(r => r.matched === 'wrong-shop').length;
  const fail = results.filter(r => r.urls.length === 0).length;
  console.log(`\n=== 結果 ===\n✅ matched: ${ok}, ❌ wrong-shop: ${bad}, ❓ fail: ${fail}`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
