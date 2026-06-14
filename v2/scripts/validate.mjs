// validate.mjs — 驗證 data/ 下的所有 JSON 檔
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '..', 'data');

const errors = [];
const warnings = [];

function check(cond, msg, level = 'error') {
  (level === 'error' ? errors : warnings).push(msg);
  if (level === 'error') console.log('  ERR ' + msg);
  else console.log('  WARN ' + msg);
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { check(false, 'Cannot parse JSON: ' + p + ' (' + e.message + ')'); return null; }
}

console.log('=== Validating ' + DATA + ' ===');
if (!fs.existsSync(DATA)) { console.error('data/ missing'); process.exit(1); }

const cities = readJSON(path.join(DATA, 'cities.json'));
if (!cities) process.exit(1);
console.log('Cities: ' + Object.keys(cities).length);

const allShops = [];
const allStations = [];
for (const [code, city] of Object.entries(cities)) {
  console.log('\n--- ' + code + ' (' + city.name + ') ---');

  const shopFile = path.join(DATA, 'shops', city.file);
  if (!fs.existsSync(shopFile)) { check(false, 'Missing shop file: ' + shopFile); continue; }
  const shops = readJSON(shopFile);
  if (!Array.isArray(shops)) { check(false, city.file + ' not an array'); continue; }
  console.log('  ' + shops.length + ' shops');
  allShops.push(...shops);

  const stationFile = path.join(DATA, 'stations', city.file);
  if (!fs.existsSync(stationFile)) { check(false, 'Missing station file: ' + stationFile); continue; }
  const stations = readJSON(stationFile);
  if (!Array.isArray(stations)) { check(false, 'stations/' + city.file + ' not an array'); continue; }
  console.log('  ' + stations.length + ' stations');
  allStations.push(...stations);
}

// Check all shops
const seenIds = new Set();
for (const s of allShops) {
  if (!s.id) check(false, 'Shop missing id: ' + JSON.stringify(s).slice(0, 80));
  else if (seenIds.has(s.id)) check(false, 'Duplicate shop id: ' + s.id);
  else seenIds.add(s.id);

  if (!s.name) check(false, 'Shop ' + (s.id || '?') + ' missing name');
  if (!s.city) check(false, 'Shop ' + s.id + ' missing city');
  if (s.city && !cities[s.city]) check(false, 'Shop ' + s.id + ' unknown city: ' + s.city);
  if (s.gmaps_url && !/^https?:\/\//.test(s.gmaps_url)) check(false, 'Shop ' + s.id + ' bad gmaps_url: ' + s.gmaps_url);
  if (s.cover_photo && !/^https?:\/\//.test(s.cover_photo)) check(false, 'Shop ' + s.id + ' bad cover_photo: ' + s.cover_photo);
}

// Check station refs
const stationKeys = new Set(allStations.map(s => (s.line || '') + '|' + s.name));
let stationMisses = 0;
for (const s of allShops) {
  if (s.station_name && s.line && !stationKeys.has(s.line + '|' + s.station_name)) {
    stationMisses++;
    if (stationMisses <= 5) check(false, 'Shop ' + s.id + ' references unknown station: ' + s.station_name + ' (line=' + s.line + ')');
  }
}
if (stationMisses > 5) check(false, '... and ' + (stationMisses - 5) + ' more station misses');

// Check photo count
const noPhoto = allShops.filter(s => !s.photos || s.photos.length === 0);
warnings.push(noPhoto.length + ' shops have no photos');
console.log('\n  WARN: ' + noPhoto.length + ' shops have no photos');

// Check weekly_hours coverage
const noHours = allShops.filter(s => !s.weekly_hours || Object.keys(s.weekly_hours).length < 7);
warnings.push(noHours.length + ' shops have incomplete weekly_hours');
console.log('  WARN: ' + noHours.length + ' shops have incomplete weekly_hours');

// Summary
console.log('\n=== SUMMARY ===');
console.log('  Total shops: ' + allShops.length);
console.log('  Total stations: ' + allStations.length);
console.log('  Errors: ' + errors.length);
console.log('  Warnings: ' + warnings.length);
if (errors.length) {
  console.log('\nFAILED');
  process.exit(1);
}
console.log('\nPASSED');
