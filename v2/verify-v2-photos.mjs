// 截圖驗證 v2 渲染
import { chromium } from 'playwright';

const URL = 'http://localhost:8765/';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  async function snap(label, cityLabel) {
    if (cityLabel) {
      const btn = await page.locator(`.city-chip:has-text("${cityLabel}")`).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(1500);
      } else {
        console.log(`⚠️ 找不到 .city-chip "${cityLabel}"`);
      }
    }
    const stats = await page.evaluate(() => {
      const allCards = document.querySelectorAll('.shop-card');
      const visibleCards = [...allCards].filter(c => c.offsetParent !== null);
      const imgs = [...document.querySelectorAll('.shop-card img')];
      const loadedImgs = imgs.filter(i => i.complete && i.naturalWidth > 0);
      const brokenImgs = imgs.filter(i => i.complete && i.naturalWidth === 0);
      const sampleFirst = document.querySelector('.shop-card img');
      return {
        totalDom: allCards.length,
        totalVisible: visibleCards.length,
        totalImgs: imgs.length,
        loadedImgs: loadedImgs.length,
        brokenImgs: brokenImgs.length,
        firstShopName: visibleCards[0]?.querySelector('.card-name')?.textContent,
        firstImgComplete: sampleFirst?.complete,
        firstImgNaturalW: sampleFirst?.naturalWidth,
        firstImgSrc: sampleFirst?.src,
      };
    });
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(stats, null, 2));
    await page.screenshot({ path: `verify-${label}.png`, fullPage: false });
    return stats;
  }

  // 預設 (高雄)
  const s1 = await snap('1-kh', null);
  // 切台南
  const s2 = await snap('2-tn', '台南');
  // 切彰化
  const s3 = await snap('3-ch', '彰化');

  // 切回高雄, 取一張卡片截圖細看
  const s4 = await snap('4-kh-back', '高雄');

  // 詳細撿查: 高雄前 5 卡的 lh3 圖片是否都載入
  console.log('\n=== 高雄前 5 卡 lh3 載入狀態 ===');
  const khImgs = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.shop-card')].filter(c => c.offsetParent !== null).slice(0, 5);
    return cards.map(c => {
      const name = c.querySelector('.card-name')?.textContent;
      const imgs = [...c.querySelectorAll('img')];
      return {
        name,
        imgs: imgs.map(i => ({ complete: i.complete, nW: i.naturalWidth, srcTail: i.src.slice(-40) })),
      };
    });
  });
  khImgs.forEach(c => {
    console.log(`  "${c.name}"`);
    c.imgs.forEach(i => console.log(`    complete=${i.complete} nW=${i.nW} ...${i.srcTail}`));
  });

  if (consoleErrors.length) {
    console.log('\n=== Console errors ===');
    consoleErrors.slice(0, 8).forEach(e => console.log('  ' + e.slice(0, 200)));
  }

  await browser.close();
  console.log('\n✅ Screenshots: verify-1-kh.png, verify-2-tn.png, verify-3-ch.png, verify-4-kh-back.png');
})();
