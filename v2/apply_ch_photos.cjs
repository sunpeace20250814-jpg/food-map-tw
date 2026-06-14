// 把 photos_lh3_ch.json 套用到 ch.json + tn.json, 移除所有 wiki 通用照
const fs = require('fs');
const path = require('path');

const photos = JSON.parse(fs.readFileSync('data/photos_lh3_ch.json', 'utf8'));

function shopKey(s) { return `${s.city}-${s.id}`; }

let totalUpdated = 0, totalLh3 = 0, totalWiki = 0, totalNone = 0;
const report = [];

for (const f of ['shops/ch.json', 'shops/tn.json']) {
  const fp = path.join('data', f);
  const shops = JSON.parse(fs.readFileSync(fp, 'utf8'));
  for (const s of shops) {
    const k = shopKey(s);
    const newPhotos = photos[k];
    if (newPhotos && newPhotos.urls.length > 0 && newPhotos.matched === true) {
      // 只接受 title-matched 的 url (verified)
      const urls = newPhotos.urls.map(u => {
        const base = u.startsWith('http') ? u.replace(/^https?:\/\//, '') : u;
        if (base.includes('AF1Qip') || base.includes('geougc')) {
          // AF1Qip/geougc 風格 → 不加 suffix (Google 自動處理)
          return 'https://' + base;
        } else {
          // gps-cs-s 風格 → 加 =w408-h306-k-no
          return 'https://' + base + '=w408-h306-k-no';
        }
      });
      s.photos = urls.slice(0, 8);
      s.photo = k;
      s._lh3_count = urls.length;
      s._matched = newPhotos.matched;
      s._detail_title = newPhotos.detailTitle;
      totalUpdated++;
      totalLh3++;
    } else if (s.photos && s.photos.length > 0 && s.photos[0].includes('lh3.googleusercontent.com')) {
      // 已是 lh3 (TN Boo Thai 用舊資料)
      totalLh3++;
    } else {
      // 0 圖 → 設 null
      s.photos = [];
      s.photo = null;
      totalNone++;
    }
  }
  fs.writeFileSync(fp, JSON.stringify(shops, null, 2));
  console.log(`✅ ${f}: ${shops.length} shops`);
}

console.log(`\n=== 統計 ===`);
console.log(`Updated: ${totalUpdated} (含 lh3)`);
console.log(`lh3 OK: ${totalLh3}`);
console.log(`None: ${totalNone}`);

// 驗證: 沒有任何 wiki url 殘留
for (const f of ['shops/ch.json', 'shops/tn.json', 'shops/kh.json']) {
  const shops = JSON.parse(fs.readFileSync(path.join('data', f), 'utf8'));
  const wikiCount = shops.filter(s => s.photos && s.photos.length > 0 && s.photos[0].includes('upload.wikimedia.org')).length;
  const lh3Count = shops.filter(s => s.photos && s.photos.length > 0 && s.photos[0].includes('lh3.googleusercontent.com')).length;
  const noneCount = shops.filter(s => !s.photos || s.photos.length === 0).length;
  console.log(`${f}: lh3=${lh3Count}, wiki=${wikiCount}, none=${noneCount}`);
}
