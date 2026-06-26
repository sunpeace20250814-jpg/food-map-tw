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
            return normalizeSupabaseShops(supabaseShops);
        }
    }

    // 2. Fallback 靜態資料
    if (window.SHOP_DATA_INITIAL && Array.isArray(window.SHOP_DATA_INITIAL)) {
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

    // 清空 listEl (用 DOM API, 避免 innerHTML)
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);

    // 渲染 card (用 DOM API 安全建立, 無 XSS 風險)
    shops.forEach((s, idx) => {
        listEl.appendChild(renderCard(s, idx));
    });

    // 觸發事件: 通知其他模組資料已更新
    window.dispatchEvent(new CustomEvent('shops-loaded', { detail: { count: shops.length } }));
}

/**
 * 渲染單個 shop card (DOM API 版本, 完全避免 innerHTML / XSS)
 */
function renderCard(s, idx) {
    const hasPhotos = s.photos && s.photos.length > 0;
    const photoUrl = hasPhotos ? s.photos[0] : '';
    const isLate = s.late ? '1' : '0';
    const is22Start = s['22start'] ? '1' : '0';
    const is24h = s.time_24h ? '1' : '0';
    const isNonLate = s.non_late ? '1' : '0';

    const article = document.createElement('article');
    article.className = 'shop-card';
    article.dataset.late = isLate;
    article.dataset.line = s.line || 'none';
    article.dataset.price = s.price_bar || '$';
    article.dataset.station = s.station || '';
    article.dataset.mcat = s.mcat || '';
    article.dataset.env = s.env || '';
    article.dataset['22start'] = is22Start;
    article.dataset['24h'] = is24h;
    article.dataset['nonLate'] = isNonLate;
    article.dataset.city = s.city || 'kh';
    article.dataset.shopIdx = String(s.id || idx);

    // card-top
    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'card-title-block';

    const h3 = document.createElement('h3');
    h3.className = 'card-name';
    h3.textContent = s.name || '';
    titleBlock.appendChild(h3);

    const metaLine = document.createElement('div');
    metaLine.className = 'card-meta-line';
    const mcatSpan = document.createElement('span');
    mcatSpan.textContent = s.mcat || '';
    metaLine.appendChild(mcatSpan);
    const dot1 = document.createElement('span');
    dot1.className = 'dot';
    metaLine.appendChild(dot1);
    const catSubSpan = document.createElement('span');
    catSubSpan.textContent = s.cat_sub || '';
    metaLine.appendChild(catSubSpan);
    titleBlock.appendChild(metaLine);

    cardTop.appendChild(titleBlock);

    const cardRight = document.createElement('div');
    cardRight.className = 'card-right';
    const favBtn = document.createElement('button');
    favBtn.className = 'card-fav';
    favBtn.setAttribute('aria-label', '收藏');
    favBtn.textContent = '♡';
    cardRight.appendChild(favBtn);
    if (s.rating) {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'card-rating';
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★';
        const num = document.createElement('span');
        num.className = 'num';
        num.textContent = String(s.rating);
        ratingDiv.appendChild(star);
        ratingDiv.appendChild(num);
        cardRight.appendChild(ratingDiv);
    }
    cardTop.appendChild(cardRight);
    article.appendChild(cardTop);

    // env badges
    if (s.env_badges && s.env_badges.length > 0) {
        const infoRow = document.createElement('div');
        infoRow.className = 'card-info-row';
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = s.env_badges.join(' · ');
        infoRow.appendChild(tag);
        article.appendChild(infoRow);
    }

    // addr
    const addrDiv = document.createElement('div');
    addrDiv.className = 'card-addr';
    addrDiv.title = s.addr || '';
    addrDiv.textContent = s.addr || '';
    article.appendChild(addrDiv);

    // photos
    if (hasPhotos) {
        const strip = document.createElement('div');
        strip.className = 'card-photo-strip';
        [photoUrl, `${photoUrl}&w112`, `${photoUrl}&w112`].forEach((url) => {
            const thumb = document.createElement('div');
            thumb.className = 'card-photo-thumb';
            thumb.dataset.shopIdx = String(s.id || idx);
            thumb.dataset.action = 'album';
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.loading = 'lazy';
            thumb.appendChild(img);
            strip.appendChild(thumb);
        });
        article.appendChild(strip);

        const albumBtn = document.createElement('button');
        albumBtn.className = 'btn-album';
        albumBtn.dataset.shopIdx = String(s.id || idx);
        albumBtn.dataset.action = 'album';
        albumBtn.textContent = `看完整相簿 · ${s.photos.length} 張`;
        article.appendChild(albumBtn);
    }

    // actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn btn-primary';
    detailBtn.dataset.shopIdx = String(s.id || idx);
    detailBtn.dataset.action = 'detail';
    detailBtn.textContent = '詳細';
    actions.appendChild(detailBtn);
    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn btn-share';
    shareBtn.dataset.action = 'share';
    shareBtn.type = 'button';
    shareBtn.setAttribute('aria-label', '分享');
    shareBtn.textContent = '↗ 分享';
    actions.appendChild(shareBtn);
    const mapLink = document.createElement('a');
    mapLink.className = 'btn btn-map';
    mapLink.href = s.gmaps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name || '')}`;
    mapLink.target = '_blank';
    mapLink.rel = 'noopener';
    mapLink.textContent = '地圖 ↗';
    actions.appendChild(mapLink);
    article.appendChild(actions);

    return article;
}
