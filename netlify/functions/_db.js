// ============================================
// db.js — Supabase REST API 抽象層
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const USE_MOCK = !SUPABASE_URL || !SUPABASE_KEY;

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
};

if (USE_MOCK && process.env.NODE_ENV !== 'production') {
    console.warn('[db] SUPABASE_URL/SUPABASE_SERVICE_KEY 未設, 使用 mock 模式');
}

async function query(table, params = {}) {
    if (USE_MOCK) return mockData(table, params);
    const qs = new URLSearchParams(params).toString();
    const url = `${SUPABASE_URL}/rest/v1/${table}${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase ${table} error: ${res.status} ${err}`);
    }
    return res.json();
}

async function insert(table, rows) {
    if (USE_MOCK) {
        const data = Array.isArray(rows) ? rows : [rows];
        mockStore[table] = [...(mockStore[table] || []), ...data];
        return data;
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(rows),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase insert ${table} error: ${res.status} ${err}`);
    }
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
    const qs = new URLSearchParams(match).toString();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
        method: 'DELETE',
        headers: headers,
    });
    if (!res.ok) throw new Error(`Supabase delete error: ${res.status}`);
    return { deleted: 1 };
}

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

const mockStore = {
    shops: [],
    favorites: [],
    stations: [],
};

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
            // 從 stations 表 join 找 line
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
        // 補上 station embedded (前端期待)
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
