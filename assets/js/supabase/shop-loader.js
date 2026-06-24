// shop-loader.js - 動態載入店家資料 (Supabase 優先, fallback 靜態)
import { isSupabaseEnabled, fetchAllShops } from './supabase-client.js';

/**
 * 載入所有店家 (Supabase 優先, fallback 靜態)
 * @returns {Promise<Array>}
 */
export async function loadShops() {
    // 1. 嘗試 Supabase
    if (isSupabaseEnabled()) {
        const supabaseShops = await fetchAllShops();
        if (supabaseShops && supabaseShops.length > 0) {
            console.log(`[shop-loader] 從 Supabase 載入 ${supabaseShops.length} 家`);
            return normalizeSupabaseShops(supabaseShops);
        }
        console.log('[shop-loader] Supabase 無資料, 使用靜態 SHOP_DATA_INITIAL');
    }

    // 2. Fallback 靜態資料
    if (window.SHOP_DATA_INITIAL && Array.isArray(window.SHOP_DATA_INITIAL)) {
        console.log(`[shop-loader] 從 SHOP_DATA_INITIAL 載入 ${window.SHOP_DATA_INITIAL.length} 家`);
        return window.SHOP_DATA_INITIAL;
    }

    return [];
}

/**
 * 將 Supabase 格式轉為前端 SHOP_DATA 格式
 * Supabase 欄位: id, name, addr, city, mcat, station, line, photos, ...
 * 前端欄位: name, addr, station, line, mcat, photos, city, late, ...
 */
function normalizeSupabaseShops(supabaseShops) {
    return supabaseShops.map(s => ({
        // 必要欄位
        name: s.name,
        addr: s.addr,
        city: s.city,
        station: s.station || '',
        line: s.line || '',
        mcat: s.mcat || '',
        photos: s.photos || [],

        // 衍生欄位 (對應前端 SHOP_DATA_INITIAL)
        id: s.id,
        cat_main: s.mcat || '',
        cat_sub: s.cat_sub || '',
        price_bar: s.price_bar || '',
        env: s.env || '',
        time_24h: !!s.time_24h,
        late: !!s.late,
        "22start": !!s['22start'],
        non_late: !!s.non_late,
        rating: s.rating || 0,
        gmaps_url: s.gmaps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`,
        source: s.source || 'supabase',
        confidence: s.confidence || '高',
        emoji: s.emoji || '🍜',
        price: s.price_bar || '$',
        price_emoji: '💰',
        price_range: '',
        env_badges: s.env ? s.env.split(',').map(e => e.trim()).filter(e => e).map(e => e === 'ac' ? '🏠室內' : e === 'ind' ? '🏪獨立' : e) : [],

        // 時間戳
        created_at: s.created_at,
        updated_at: s.updated_at
    }));
}

/**
 * 渲染店家卡片到 DOM
 * 取代原本寫死在 index.html 的 164 個 article
 *
 * 預期 index.html 有 <main id="shopList"></main>
 * 動態生成所有 .shop-card
 */
export async function renderShopCards() {
    const listEl = document.getElementById('shopList');
    if (!listEl) {
        console.warn('[shop-loader] 找不到 #shopList, 跳過動態渲染');
        return;
    }

    const shops = await loadShops();
    console.log(`[shop-loader] 準備渲染 ${shops.length} 家`);

    // 渲染 card (與現有 article 結構相同, 確保 filters.js / sheet.js 能用)
    listEl.innerHTML = shops.map((s, idx) => renderCard(s, idx)).join('');

    // 觸發事件: 通知其他模組資料已更新
    window.dispatchEvent(new CustomEvent('shops-loaded', { detail: { count: shops.length } }));
}

/**
 * 渲染單個 shop card
 */
function renderCard(s, idx) {
    const hasPhotos = s.photos && s.photos.length > 0;
    const photoUrl = hasPhotos ? s.photos[0] : '';
    const isLate = s.late ? '1' : '0';
    const is22Start = s['22start'] ? '1' : '0';
    const is24h = s.time_24h ? '1' : '0';
    const isNonLate = s.non_late ? '1' : '0';

    return `
    <article class="shop-card"
        data-late="${isLate}"
        data-line="${s.line || 'none'}"
        data-price="${s.price_bar || '$'}"
        data-station="${s.station || ''}"
        data-mcat="${s.mcat || ''}"
        data-env="${s.env || ''}"
        data-22start="${is22Start}"
        data-24h="${is24h}"
        data-non-late="${isNonLate}"
        data-city="${s.city || 'kh'}"
        data-shop-idx="${s.id || idx}">
        <div class="card-top">
            <div class="card-title-block">
                <h3 class="card-name">${escapeHtml(s.name)}</h3>
                <div class="card-meta-line">
                    <span>${escapeHtml(s.mcat || '')}</span>
                    <span class="dot"></span>
                    <span>${escapeHtml(s.cat_sub || '')}</span>
                </div>
            </div>
            <div class="card-right">
                <button class="card-fav" aria-label="收藏">♡</button>
                ${s.rating ? `<div class="card-rating"><span class="star">★</span><span class="num">${s.rating}</span></div>` : ''}
            </div>
        </div>
        ${s.env_badges && s.env_badges.length > 0 ? `<div class="card-info-row"><span class="tag">${s.env_badges.join(' · ')}</span></div>` : ''}
        <div class="card-addr" title="${escapeAttr(s.addr)}">${escapeHtml(s.addr)}</div>
        ${hasPhotos ? `
        <div class="card-photo-strip">
            <div class="card-photo-thumb" data-shop-idx="${s.id || idx}" data-action="album"><img src="${photoUrl}" alt="" loading="lazy" /></div>
            <div class="card-photo-thumb" data-shop-idx="${s.id || idx}" data-action="album"><img src="${photoUrl}&w112" alt="" loading="lazy" /></div>
            <div class="card-photo-thumb" data-shop-idx="${s.id || idx}" data-action="album"><img src="${photoUrl}&w112" alt="" loading="lazy" /></div>
        </div>
        <button class="btn-album" data-shop-idx="${s.id || idx}" data-action="album">看完整相簿 · ${s.photos.length} 張</button>
        ` : ''}
        <div class="card-actions">
            <button class="btn btn-primary" data-shop-idx="${s.id || idx}" data-action="detail">詳細</button>
            <button class="btn btn-share" data-action="share" type="button" aria-label="分享">↗ 分享</button>
            <a class="btn btn-map" href="${escapeAttr(s.gmaps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`)}" target="_blank" rel="noopener">地圖 ↗</a>
        </div>
    </article>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
}
