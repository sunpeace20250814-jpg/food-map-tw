// 最後一輪: ch-068 彰水路無名早餐店, 純地址搜
import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const lh3Local = new Set();
  const onResp = r => { if (r.url().includes('lh3.googleusercontent.com') && !r.url().match(/=w(36|24|48|72|96|144)-/)) lh3Local.add(r.url()); };
  page.on('response', onResp);

  const queries = [
    '彰化縣溪湖鎮平和里彰水路三段181號',
    '彰水路三段181號 早餐',
    '彰水路 無名早餐',
  ];
  for (const q of queries) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    lh3Local.clear();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3500);
      const first = await page.locator('[role="article"]').first();
      if (await first.count() > 0) {
        try { await first.click({ timeout: 3000 }); await page.waitForTimeout(2500); } catch {}
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
      console.log(`"${q}" h1="${data.h1}" lh3=${all.length}`);
      if (all.length > 0) {
        await page.screenshot({ path: 'data/photo_screenshots/visual-check/batch3/ch-068-addr.png' });
        fs.writeFileSync('data/photo_ch068.json', JSON.stringify({ urls: all, h1: data.h1, query: q }, null, 2));
        if (data.h1.includes('早餐') || data.h1.includes('早餐店') || all.length > 0) {
          console.log('  ✅ Got results, break');
          break;
        }
      }
    } catch (e) { console.log('  err:', e.message.slice(0, 50)); }
  }
  await browser.close();
})();
