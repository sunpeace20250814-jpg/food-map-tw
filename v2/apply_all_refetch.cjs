// 最終套用: 套用所有 refetch_* 結果
const fs = require('fs');

const refetch4_0 = JSON.parse(fs.readFileSync('data/photo_refetch4_batch0.json', 'utf8'));
const refetch4_1 = JSON.parse(fs.readFileSync('data/photo_refetch4_batch1.json', 'utf8'));
const refetch4_2 = JSON.parse(fs.readFileSync('data/photo_refetch4_batch2.json', 'utf8'));
const refetch4_3 = JSON.parse(fs.readFileSync('data/photo_refetch4_batch3.json', 'utf8'));
const ch068 = JSON.parse(fs.readFileSync('data/photo_ch068.json', 'utf8'));
const refetch5 = JSON.parse(fs.readFileSync('data/photo_refetch5_log.json', 'utf8'));

const accepted = {};

// ch-004 過溝仔肉圓王 - 從 batch0 抓到的 1 個真 lh3 url
const ch004Urls = refetch4_0['ch-004']?.urls?.filter(u => u.includes('lh3.googleusercontent.com') && !u.includes('batchexecute') && !u.includes('MapsWizUi')) || [];
const ch004Base = ch004Urls[0]?.replace(/=(s|w|h)\d+[^=]*$/, '').replace(/-v\d+$/, '');
if (ch004Base) {
  accepted['ch-ch-004'] = { urls: [ch004Base + '=w408-h306-k-no'], note: 'from Maps (h1 not captured)' };
}
// ch-011 大元餅行 = 大元蔴薯 (業務一致:鹹麻糬) ✅
if (refetch5['ch-011']?.urls?.length) {
  accepted['ch-ch-011'] = { urls: refetch5['ch-011'].urls, note: 'same store (鹹麻糬)' };
}
// ch-018 泉焢肉飯 = 阿泉爌肉飯 (業務一致:爌肉飯) ✅
if (refetch5['ch-018']?.urls?.length) {
  accepted['ch-ch-018'] = { urls: refetch5['ch-018'].urls, note: 'same store (爌肉飯)' };
}
// ch-028 黑公雞風味餐廳 ✅
if (refetch4_1['ch-028']?.urls?.length) {
  accepted['ch-ch-028'] = { urls: refetch4_1['ch-028'].urls, note: 'visual confirmed' };
}
// ch-031 石頭燒肉 = 石頭日式炭火燒肉 ✅
if (refetch4_1['ch-031']?.urls?.length) {
  accepted['ch-ch-031'] = { urls: refetch4_1['ch-031'].urls, note: 'same store (石頭日式炭火燒肉)' };
}
// ch-034 咖啡烟 ✅
if (refetch4_2['ch-034']?.urls?.length) {
  accepted['ch-ch-034'] = { urls: refetch4_2['ch-034'].urls, note: 'visual confirmed' };
}
// ch-038 炎生實驗室咖啡 = 炎生咖啡 ✅
if (refetch4_2['ch-038']?.urls?.length) {
  accepted['ch-ch-038'] = { urls: refetch4_2['ch-038'].urls, note: 'same store (炎生咖啡)' };
}
// ch-058 京巧手工湯包 ✅
if (refetch4_2['ch-058']?.urls?.length) {
  accepted['ch-ch-058'] = { urls: refetch4_2['ch-058'].urls, note: 'visual confirmed' };
}
// ch-068 彰水路無名早餐店 = 早餐店(無名) ✅
if (ch068?.urls?.length) {
  accepted['ch-ch-068'] = { urls: ch068.urls, note: 'same store @ 彰水路三段181號' };
}

console.log('=== 接受套用的店家 ===');
Object.entries(accepted).forEach(([k, v]) => {
  console.log(`  ${k}: ${v.urls.length} 張 | ${v.note}`);
});

// 套用到 ch.json
const chPath = 'data/shops/ch.json';
const ch = JSON.parse(fs.readFileSync(chPath, 'utf8'));
for (const s of ch) {
  const k = `${s.city}-${s.id}`;
  const a = accepted[k];
  if (a && a.urls?.length) {
    const lh3Urls = a.urls.filter(u => u.includes('lh3.googleusercontent.com') && !u.includes('batchexecute') && !u.includes('MapsWizUi'));
    if (lh3Urls.length === 0) continue;
    const urls = lh3Urls.map(u => {
      const base = u.startsWith('http') ? u.replace(/^https?:\/\//, '') : u;
      if (base.match(/=(s|w|h)\d/) || base.match(/-v\d$/)) return 'https://' + base;
      if (base.includes('AF1Qip') || base.includes('geougc')) return 'https://' + base;
      return 'https://' + base + '=w408-h306-k-no';
    });
    s.photos = urls.slice(0, 8);
    s.photo = k;
    s._lh3_count = urls.length;
    s._note = a.note;
  }
}
fs.writeFileSync(chPath, JSON.stringify(ch, null, 2));

let withLh3 = 0, withNone = 0;
ch.forEach(s => {
  if (s.photos?.length > 0 && s.photos[0].includes('lh3.googleusercontent.com')) withLh3++;
  else { withNone++; console.log('  ❌ 無圖:', s.id, s.name, '|', s._note || ''); }
});
console.log(`\n=== ch.json 最終 ===`);
console.log(`lh3: ${withLh3}/70, 無圖: ${withNone}/70`);

// TN Boo Thai 視覺確認
console.log(`\n=== 全部 3 城市 ===`);
for (const f of ['kh', 'tn', 'ch']) {
  const arr = JSON.parse(fs.readFileSync(`data/shops/${f}.json`, 'utf8'));
  const lh3 = arr.filter(s => s.photos?.length > 0 && s.photos[0].includes('lh3.googleusercontent.com')).length;
  const wiki = arr.filter(s => s.photos?.length > 0 && s.photos[0].includes('upload.wikimedia.org')).length;
  const none = arr.filter(s => !s.photos || s.photos.length === 0).length;
  console.log(`${f}: ${arr.length} shops | lh3=${lh3} wiki=${wiki} none=${none}`);
}
