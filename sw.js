// ============================================
// sw.js - Service Worker (v10.8)
//   - HTML: network-first, fallback cache
//   - 靜態資源 (CSS/JS/icons): stale-while-revalidate
//   - 圖片 (lh3 Google CDN): cache-first (Maps photo 不變)
//   - API (Supabase): network-only (動態資料)
// ============================================

const VERSION = 'v10.8-2026-07-01';
const STATIC_CACHE = `static-${VERSION}`;
const IMAGE_CACHE = `images-${VERSION}`;
const HTML_CACHE = `html-${VERSION}`;

const STATIC_ASSETS = [
    './',
    './manifest.webmanifest',
    './assets/css/app.css',
    './assets/js/app.js',
    './assets/js/sheet.js',
    './assets/js/filters.js',
    './assets/js/favorites.js',
    './assets/js/theme.js',
    './assets/js/error-tracker.js',
    './assets/js/supabase/supabase.min.js',
    './assets/js/supabase/supabase-client.js',
    './assets/js/supabase/supabase-ui.js',
    './assets/js/supabase/shop-loader.js',
    './assets/img/favicon.ico',
    './assets/img/favicon-32.png',
    './assets/img/apple-touch-icon.png'
];

// === Install: 預載關鍵資源 ===
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// === Activate: 清舊版快取 ===
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys
                .filter(k => !k.endsWith(VERSION))
                .map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// === Fetch: 路由策略 ===
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // 跳過非 GET
    if (e.request.method !== 'GET') return;

    // Supabase API: 永遠 network-only（避免 stale auth）
    if (url.hostname.includes('supabase.co')) {
        return; // 不攔
    }

    // Google Maps lh3 圖片: cache-first（Maps photo 永久有效）
    if (url.hostname.includes('lh3.googleusercontent.com')) {
        e.respondWith(cacheFirst(e.request, IMAGE_CACHE));
        return;
    }

    // Google Fonts: stale-while-revalidate
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        e.respondWith(staleWhileRevalidate(e.request, STATIC_CACHE));
        return;
    }

    // 同源靜態資源: stale-while-revalidate
    if (url.origin === location.origin) {
        const isAsset = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/.test(url.pathname);
        if (isAsset) {
            e.respondWith(staleWhileRevalidate(e.request, STATIC_CACHE));
            return;
        }
        // HTML: network-first
        if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
            e.respondWith(networkFirst(e.request, HTML_CACHE));
            return;
        }
    }
});

// === Strategies ===
async function cacheFirst(req, cacheName) {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
        const fresh = await fetch(req);
        if (fresh.ok) {
            const cache = await caches.open(cacheName);
            cache.put(req, fresh.clone());
        }
        return fresh;
    } catch (_) {
        return cached || new Response('Offline', { status: 503 });
    }
}

async function staleWhileRevalidate(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    const networkPromise = fetch(req).then(fresh => {
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
    }).catch(() => cached);
    return cached || networkPromise;
}

async function networkFirst(req, cacheName) {
    try {
        const fresh = await fetch(req);
        if (fresh.ok) {
            const cache = await caches.open(cacheName);
            cache.put(req, fresh.clone());
        }
        return fresh;
    } catch (_) {
        const cached = await caches.match(req);
        return cached || new Response('Offline', { status: 503 });
    }
}