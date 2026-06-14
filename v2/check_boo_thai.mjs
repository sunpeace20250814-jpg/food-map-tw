// 下載 + 顯示 Boo Thai 前 3 張圖, 視覺驗證
import fs from 'fs';
import https from 'https';
import { chromium } from 'playwright';

const photos = JSON.parse(fs.readFileSync('data/photos_lh3_ch.json', 'utf8'));
const bts = photos['tn-88'];
if (!bts) { console.error('not found'); process.exit(1); }
console.log('Boo Thai:', bts.name);
console.log('url count:', bts.urls.length);

// 用 Playwright 直接在 google 圖片搜尋模式看 lh3 url
const browser = await chromium.launch();
const page = await browser.newPage();

// 開其中第一張 url 測試
const testUrl = bts.urls[0] + '=w800-h600';
console.log('Test load:', testUrl);
const resp = await page.request.get(testUrl);
console.log('Status:', resp.status(), 'Content-Type:', resp.headers()['content-type']);

// 開店家 google maps 頁面看 photo gallery
const mapsUrl = 'https://www.google.com/maps/search/' + encodeURIComponent('Boo Thai Fun 布泰象台南');
await page.goto(mapsUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const first = await page.locator('[role="article"]').first();
if (await first.count() > 0) {
  await first.click();
  await page.waitForTimeout(3000);
}
await page.screenshot({ path: 'data/photo_screenshots/boo-thai-detail.png' });
const h1 = await page.locator('h1').first().textContent();
console.log('Detail h1:', h1);

// 抓頁面所有 lh3 + 過濾後保留
const allUrls = await page.evaluate(() => {
  const out = new Set();
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.dataset.src || '';
    if (src.includes('lh3.googleusercontent.com')) out.add(src);
  });
  return [...out];
});
console.log('Page lh3 urls:', allUrls.length);
const filtered = allUrls.filter(u => !u.match(/=w(36|24|48|72|96|144)-/) && !u.includes('=s24-') && !u.includes('=s48-'));
console.log('After filter:', filtered.length);

await browser.close();
