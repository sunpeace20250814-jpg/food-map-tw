// data.js — 載入 + 驗證 JSON 資料
const DATA_BASE = 'data/';

let CITIES = null;
let SHOPS = [];
let STATIONS = {};

async function fetchJSON(p) {
  const res = await fetch(DATA_BASE + p);
  if (!res.ok) throw new Error('Failed to load ' + p + ': ' + res.status);
  return res.json();
}

export async function loadAll() {
  CITIES = await fetchJSON('cities.json');
  const codes = Object.keys(CITIES);
  await Promise.all(codes.map(async (code) => {
    const city = CITIES[code];
    const [shops, stations] = await Promise.all([
      fetchJSON('shops/' + city.file),
      fetchJSON('stations/' + city.file),
    ]);
    SHOPS.push(...shops);
    STATIONS[code] = stations;
  }));
  validate();
  return { cities: CITIES, shops: SHOPS, stations: STATIONS };
}

function validate() {
  const errors = [];
  const cityCodes = new Set(Object.keys(CITIES));
  const stationKeys = new Set();
  Object.values(STATIONS).flat().forEach(s => stationKeys.add(s.line + '|' + s.name));
  const seenIds = new Set();
  SHOPS.forEach((s, i) => {
    if (!s.id) errors.push('Shop #' + i + ' missing id');
    if (!s.name) errors.push('Shop ' + (s.id || i) + ' missing name');
    if (!s.city) errors.push('Shop ' + s.id + ' missing city');
    if (s.city && !cityCodes.has(s.city)) errors.push('Shop ' + s.id + ' unknown city: ' + s.city);
    if (seenIds.has(s.id)) errors.push('Duplicate shop id: ' + s.id);
    seenIds.add(s.id);
    if (s.station_name && s.line) {
      const key = s.line + '|' + s.station_name;
      if (!stationKeys.has(key)) errors.push('Shop ' + s.id + ' unknown station: ' + s.station_name);
    }
  });
  if (errors.length) {
    console.error('[data.js] Validation errors:');
    errors.slice(0, 20).forEach(e => console.error('  - ' + e));
    if (errors.length > 20) console.error('  ... and ' + (errors.length - 20) + ' more');
    throw new Error('Data validation failed: ' + errors.length);
  }
  console.log('[data.js] OK: ' + SHOPS.length + ' shops, ' + Object.keys(CITIES).length + ' cities');
}

export const getCities = () => CITIES;
export const getShops = () => SHOPS;
export const getStationsByCity = (code) => STATIONS[code] || [];
export const getShopById = (id) => SHOPS.find(s => s.id === id);
export const getCityByCode = (code) => CITIES[code];
