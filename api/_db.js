// ============================================
// _db.js — 雙模式 DB 抽象層
//   - SUPABASE_URL 有設 → 用 Supabase Postgres (REST)
//   - VERCEL_KV_URL 有設 → 用 Vercel KV
//   - 都沒設 → 用本地 mock 模式 (開發用)
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const KV_URL = process.env.KV_URL || '';           // Vercel KV REST API URL
const KV_TOKEN = process.env.KV_TOKEN || '';

const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
const USE_KV = !!(KV_URL && KV_TOKEN);
const USE_MOCK = !USE_SUPABASE && !USE_KV;

if (USE_MOCK && process.env.NODE_ENV !== 'production') {
    console.warn('[db] 使用 mock 模式 (設 SUPABASE_URL 或 KV_URL 啟用雲端)');
}

const headers = USE_SUPABASE ? {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
} : USE_KV ? {
    'Authorization': `Bearer ${KV_TOKEN}`,
    'Content-Type': 'application/json',
} : {};

// ---- 通用 query ----
async function query(table, params = {}) {
    if (USE_MOCK) return mockData(table, params);
    if (USE_KV) return kvQuery(table, params);
    const qs = new URLSearchParams(params).toString();
    const url = `${SUPABASE_URL}/rest/v1/${table}${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Supabase ${table} error: ${res.status}`);
    return res.json();
}

async function insert(table, rows) {
    if (USE_MOCK) {
        const data = Array.isArray(rows) ? rows : [rows];
        mockStore[table] = [...(mockStore[table] || []), ...data];
        return data;
    }
    if (USE_KV) {
        const data = Array.isArray(rows) ? rows : [rows];
        for (const row of data) {
            await kvSet(`${table}:${row.id || row.user_id}`, row);
        }
        return data;
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`Supabase insert ${table} error: ${res.status}`);
    return res.json();
}

async function remove(table, match) {
    if (USE_MOCK) {
        const before = (mockStore[table] || []).length;
        mockStore[table] = (mockStore[table] || []).filter(row => {
            return !Object.entries(match).every(([k, v]) => row[k] === v);
        });
        return { deleted: before - mockStore[table].length };
    }
    if (USE_KV) {
        const all = await kvList(table);
        const toDelete = all.filter(row =>
            Object.entries(match).every(([k, v]) => row[k] === v));
        for (const row of toDelete) {
            await kvDel(`${table}:${row.id || row.user_id}`);
        }
        return { deleted: toDelete.length };
    }
    const qs = new URLSearchParams(match).toString();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) throw new Error(`Supabase delete error: ${res.status}`);
    return { deleted: 1 };
}

// ---- Vercel KV ----
// KV REST API: https://vercel.com/docs/storage/vercel-kv/rest-api
async function kvQuery(table, params) {
    // 簡化: 整個 table 拉出來,client 端 filter
    const keys = await kvList(table);
    return applyFilters(keys, params);
}

async function kvList(table) {
    // 列出所有 key
    const res = await fetch(`${KV_URL}/scan`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ match: `${table}:*`, count: 1000 }),
    });
    if (!res.ok) {
        // 退回: 用 scard + 個別 get (小資料集適用)
        return kvListFallback(table);
    }
    const data = await res.json();
    const results = await Promise.all(data.result.map(async (k) => {
        const v = await kvGet(k);
        return v;
    }));
    return results.filter(Boolean);
}

async function kvListFallback(table) {
    // 假設 id 連續,逐一 get
    const out = [];
    for (let i = 1; i < 1000; i++) {
        const v = await kvGet(`${table}:${i}`);
        if (v) out.push(v);
    }
    return out;
}

async function kvGet(key) {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
}

async function kvSet(key, value) {
    const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify(value) }),
    });
    if (!res.ok) throw new Error(`KV set error: ${res.status}`);
    return res.json();
}

async function kvDel(key) {
    await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
    });
}

function applyFilters(rows, params) {
    let out = [...rows];
    if (params['is_active'] === 'eq.true') out = out.filter(r => r.is_active);
    if (params['name']?.includes('ilike')) {
        const q = params.name.split('*')[1] || '';
        if (q) out = out.filter(r => (r.name || '').includes(q));
    }
    if (params['station.line']?.startsWith('eq.')) {
        const ln = params['station.line'].slice(3);
        const stationMap = new Map((mockStore.stations || []).map(s => [s.id, s]));
        out = out.filter(r => {
            const st = stationMap.get(r.station_id);
            return st && st.line === ln;
        });
    }
    return out;
}

// ---- 業務邏輯 ----

function normalizeShops(rows) {
    return rows.map(r => {
        ['weekly_hours', 'photos', 'reviews'].forEach(k => {
            if (typeof r[k] === 'string') {
                try { r[k] = JSON.parse(r[k]); } catch {}
            }
        });
        return r;
    });
}

async function getShops({ q, line, price, cat_main, env, is_24h, is_late_night, station_id } = {}) {
    const params = {
        'is_active': 'eq.true',
        'order': 'id.asc',
        'select': '*,station:stations(id,name,line)',
    };
    if (q) params['name'] = `ilike.*${q}*`;
    if (line) params['station.line'] = `eq.${line}`;
    if (price) params['price_bar'] = `eq.${price}`;
    if (cat_main) params['cat_main'] = `eq.${cat_main}`;
    if (env) params['env'] = `cs.{${env}}`;
    if (is_24h !== undefined) params['is_24h'] = `is.${is_24h}`;
    if (is_late_night !== undefined) params['is_late_night'] = `is.${is_late_night}`;
    if (station_id) params['station_id'] = `eq.${station_id}`;
    const rows = await query('shops', params);
    return normalizeShops(rows);
}

async function getShopById(id) {
    const rows = await query('shops', {
        'id': `eq.${id}`,
        'select': '*,station:stations(id,name,line)',
    });
    const shop = rows[0] || null;
    return shop ? normalizeShops([shop])[0] : null;
}

async function getStations() {
    return query('stations', { 'order': 'line,id' });
}

async function getUserFavorites(userId) {
    return query('favorites', {
        'user_id': `eq.${userId}`,
        'select': 'shop_id,shops(*)',
    });
}

async function addFavorite(userId, shopId) {
    return insert('favorites', { user_id: userId, shop_id: shopId });
}

async function deleteFavorite(userId, shopId) {
    return remove('favorites', { user_id: userId, shop_id: shopId });
}

// ---- Mock 模式 ----
const mockStore = { shops: [], favorites: [], stations: [] };

function mockData(table, params) {
    if (table === 'shops') {
        let rows = [...(mockStore.shops || [])];
        if (params['is_active'] === 'eq.true') rows = rows.filter(r => r.is_active);
        if (params['name']?.includes('ilike')) {
            const q = params.name.split('*')[1] || '';
            if (q) rows = rows.filter(r => (r.name || '').includes(q));
        }
        if (params['station.line']?.startsWith('eq.')) {
            const ln = params['station.line'].slice(3);
            const stationMap = new Map((mockStore.stations || []).map(s => [s.id, s]));
            rows = rows.filter(r => {
                const st = stationMap.get(r.station_id);
                return st && st.line === ln;
            });
        }
        if (params['price_bar']?.startsWith('eq.')) {
            const p = params.price_bar.slice(3);
            rows = rows.filter(r => r.price_bar === p);
        }
        if (params['cat_main']?.startsWith('eq.')) {
            const c = params.cat_main.slice(3);
            rows = rows.filter(r => r.cat_main === c);
        }
        if (params['station_id']?.startsWith('eq.')) {
            const s = params.station_id.slice(3);
            rows = rows.filter(r => r.station_id === s);
        }
        if (params['is_24h']?.startsWith('is.')) {
            const v = params.is_24h.slice(3);
            rows = rows.filter(r => String(r.is_24h) === v);
        }
        if (params['is_late_night']?.startsWith('is.')) {
            const v = params.is_late_night.slice(3);
            rows = rows.filter(r => String(r.is_late_night) === v);
        }
        const stationMap = new Map((mockStore.stations || []).map(s => [s.id, s]));
        rows = rows.map(r => ({ ...r, station: stationMap.get(r.station_id) || null }));
        return rows;
    }
    if (table === 'stations') {
        return [...(mockStore.stations || [])];
    }
    if (table === 'favorites') {
        let rows = [...(mockStore.favorites || [])];
        for (const [k, v] of Object.entries(params)) {
            if (k.startsWith('user_id') && v.startsWith('eq.')) {
                const val = v.slice(3);
                rows = rows.filter(r => r.user_id === val);
            }
        }
        return rows;
    }
    return [];
}

module.exports = {
    getShops, getShopById, getStations,
    getUserFavorites, addFavorite, deleteFavorite,
    mockStore, normalizeShops,
};
