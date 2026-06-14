// add_city.mjs — 為新城市建立 scaffold
// 用法: node scripts/add_city.mjs <code> <name> [full_name]
//   例: node scripts/add_city.mjs tc 台中 台中市

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const code = process.argv[2];
const name = process.argv[3];
const fullName = process.argv[4] || (name ? name + '市' : '');

if (!code || !name) {
  console.log('用法: node scripts/add_city.mjs <code> <name> [full_name]');
  console.log('  例: node scripts/add_city.mjs tc 台中 台中市');
  process.exit(1);
}

const fileName = code + '.json';

// Step 1: 檢查是否已存在
if (fs.existsSync(path.join(DATA, 'shops', fileName))) {
  console.error('ERROR: data/shops/' + fileName + ' already exists. Aborting.');
  process.exit(1);
}

// Step 2: 建立空的 shops 和 stations 檔
const emptyShops = [];
fs.writeFileSync(path.join(DATA, 'shops', fileName), JSON.stringify(emptyShops, null, 2) + '\n');
console.log('Created data/shops/' + fileName);

// 詢問 has_mrt
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) { return new Promise(res => rl.question(q, res)); }

const hasMrt = (await ask('這個城市有捷運/輕軌嗎? (y/n): ')).trim().toLowerCase() === 'y';
rl.close();

const lines = [];
if (hasMrt) {
  console.log('\n請輸入捷運/輕軌線 (每行: <id> <name> <color hex>), 空行結束:');
  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
  while (true) {
    const line = (await rl2.question('  > ')).trim();
    if (!line) break;
    const parts = line.split(/\s+/);
    if (parts.length < 3) { console.log('  格式: <id> <name> <color>'); continue; }
    lines.push({ id: parts[0], name: parts[1], color: parts[2] });
  }
  rl2.close();
} else {
  lines.push({ id: code + '-area', name: '行政區', color: '#9b59b6' });
}

const stations = [];
fs.writeFileSync(path.join(DATA, 'stations', fileName), JSON.stringify(stations, null, 2) + '\n');
console.log('Created data/stations/' + fileName + ' (empty, fill with stations)');

// Step 3: 更新 cities.json
const citiesPath = path.join(DATA, 'cities.json');
const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
if (cities[code]) {
  console.error('ERROR: cities.json already has entry for ' + code);
  process.exit(1);
}
cities[code] = {
  code: code,
  name: name,
  full_name: fullName,
  file: fileName,
  has_mrt: hasMrt,
  lines: lines,
};
fs.writeFileSync(citiesPath, JSON.stringify(cities, null, 2) + '\n');
console.log('Updated data/cities.json');

// Step 4: 印出後續步驟
console.log('\n=== Next steps ===');
console.log('1. 編輯 data/stations/' + fileName + ' 加入捷運站/區域清單');
console.log('2. 編輯 data/shops/' + fileName + ' 加入店家資料');
console.log('3. 跑 node scripts/validate.mjs 驗證');
console.log('4. (選用) git add data/ && git commit -m "Add ' + name + '"');
