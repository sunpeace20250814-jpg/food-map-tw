// ============================================
// api.js — API client (fetch 包裝, 自動加 base URL)
// ============================================
// 設計:
//   - 本地開發: 用 ./api/ 路徑 (需 netlify dev)
//   - 部署: 用 /api/ 路徑 (Netlify redirects 處理)
//   - 沒設 API_BASE 時, 直接用當前 origin 的 /api/
// ============================================

const API_BASE = (function () {
    // 可覆寫 (window.API_BASE 在 index.html 設定)
    if (typeof window !== 'undefined' && window.API_BASE) return window.API_BASE;
    return '/api';
})();

async function apiGet(path, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(API_BASE + path + qs, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('GET ' + path + ' failed: ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
}

async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || ('POST ' + path + ' failed: ' + res.status));
    }
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
}

async function apiDelete(path, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(API_BASE + path + qs, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || ('DELETE ' + path + ' failed: ' + res.status));
    }
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
}

// 認證: 從 localStorage 拿 token
function getAuthToken() {
    return localStorage.getItem('auth_token') || '';
}
function setAuthToken(t) { localStorage.setItem('auth_token', t); }

// 帶 token 的 request
async function authGet(path, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(API_BASE + path + qs, {
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
    });
    if (!res.ok) throw new Error('GET ' + path + ' failed: ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
}
async function authPost(path, body) {
    const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || ('POST ' + path + ' failed: ' + res.status));
    }
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
}
async function authDelete(path, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(API_BASE + path + qs, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || ('DELETE ' + path + ' failed: ' + res.status));
    }
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
}

window.KaohsiungAPI = {
    getShops: (params) => apiGet('/shops', params),
    getShop: (id) => apiGet('/shops/' + id),
    getStations: () => apiGet('/stations'),
    getFavorites: () => authGet('/favorites'),
    addFavorite: (shopId) => authPost('/favorites', { shop_id: shopId }),
    removeFavorite: (shopId) => authDelete('/favorites', { shop_id: shopId }),
    getAuthToken, setAuthToken,
};
