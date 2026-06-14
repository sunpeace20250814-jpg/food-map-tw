// 修抓: 加 title 驗證 + 精準 query (店名 + 地址關鍵字)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const DATA_DIR = 'data';
const SHOP_FILES = ['shops/ch.json', 'shops/tn.json'];
const OUT_PHOTOS = 'data/photos_lh3_ch.json';
const OUT_LOG = 'data/photo_fetch_log.json';
const SCREENSHOT_DIR = 'data/photo_screenshots';

function shopKey(s) { return `${s.city}-${s.id}`; }

// 用店名前 3 字 + 地址前 4 字做精準 query
function buildQuery(s) {
  const name = s.name.replace(/\(.*?\)/g, '').replace(/（.*?）/g, '').trim();
  const addr = (s.address || s.district || '').split(/[縣市]/)[0]; // 彰化縣
  return `${name} ${addr}`;
}

// 驗證: 抓 detail h1, 看是否含店名關鍵字
async function fetchOne(page, shop) {
  const query = buildQuery(shop);
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const lh3Local = new Set();
  const result = { shop, urls: [], detailTitle: '', matched: false, error: null };
  const onResp = r => { if (r.url().includes('lh3.googleusercontent.com') && !r.url().match(/=w(36|24|48|72|96|144)-/)) lh3Local.add(r.url()); };
  page.on('response', onResp);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
    result.urls = all.slice(0, 12);
    result.detailTitle = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
    // 驗證
    const kw = shop.name.replace(/\(.*?\)/g, '').replace(/（.*?）/g, '').trim().slice(0, 3);
    if (kw && result.detailTitle.includes(kw)) result.matched = true;
    else if (result.urls.length > 0) result.matched = 'unknown';
  } catch (e) {
    result.error = e.message.slice(0, 100);
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
  // 排除已有 lh3
  const need = allShops.filter(s => !(s.photos?.length > 0 && s.photos[0].includes('lh3.googleusercontent.com')));
  console.log(`待抓: ${need.length}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const lh3Net = new Set();
  page.on('response', r => { if (r.url().includes('lh3.googleusercontent.com')) lh3Net.add(r.url()); });

  const results = [];
  const photoPool = {};
  for (let i = 0; i < need.length; i++) {
    const s = need[i];
    const r = await fetchOne(page, s);
    photoPool[shopKey(s)] = { name: s.name, urls: r.urls, detailTitle: r.detailTitle, matched: r.matched };
    const icon = r.matched === true ? '✅' : (r.matched === 'unknown' ? '❓' : '❌');
    process.stdout.write(`[${i+1}/${need.length}] ${icon} ${s.name.padEnd(30,' ')} → ${r.urls.length} | ${r.detailTitle.slice(0,15)}\n`);
    results.push({ id: s.id, name: s.name, city: s.city, count: r.urls.length, detailTitle: r.detailTitle, matched: r.matched, firstUrl: r.urls[0] || null, error: r.error });
  }

  fs.writeFileSync(OUT_PHOTOS, JSON.stringify(photoPool, null, 2));
  fs.writeFileSync(OUT_LOG, JSON.stringify(results, null, 2));
  const ok = results.filter(r => r.matched === true).length;
  const unk = results.filter(r => r.matched === 'unknown').length;
  const bad = results.filter(r => r.matched === false || r.count === 0).length;
  console.log(`\n=== 結果 ===`);
  console.log(`✅ matched: ${ok}, ❓ unknown: ${unk}, ❌ failed: ${bad}`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
