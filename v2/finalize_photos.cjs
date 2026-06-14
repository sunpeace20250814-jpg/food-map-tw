// 最終: 標記 ch-019 + ch-066 為「查無 Google Maps 對應」
const fs = require('fs');
const chPath = 'data/shops/ch.json';
const ch = JSON.parse(fs.readFileSync(chPath, 'utf8'));
const blacklist = ['ch-019', 'ch-066'];
for (const s of ch) {
  if (blacklist.includes(s.id)) {
    s.photos = [];
    s.photo = null;
    s._no_maps_match = true;
    s._note = 'Google Maps 查無對應店家, 無法提供真實照片';
  }
}
fs.writeFileSync(chPath, JSON.stringify(ch, null, 2));
console.log('標記完成:', blacklist);
