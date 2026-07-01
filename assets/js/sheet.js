// ============================================
// sheet.js - 店家詳情底部 Sheet (v9.3: 完整版)
//   - 完整一週時間 (weekly_hours)
//   - 縮圖條 (取代單張 hero)
//   - 評論區 (含空狀態)
//   - 收藏按鈕
//   - 完整地址 / 特色 / 環境徽章 / 價位 / 來源
// ============================================

const SHOP_DATA = window.SHOP_DATA;

// v10.4: 評論資料 (從 assets/data/reviews.json 載入, key = 店名)
// 檔案位置搬到 assets/ 是因為 Vercel .vercelignore 不支援 negation,
// 原本的 data/ 整個被排除導致 reviews.json 404。
let SHOP_REVIEWS_BY_NAME = {};
let _reviewsLoaded = false;
let _reviewsLoading = null;

async function loadReviews() {
    if (_reviewsLoaded) return SHOP_REVIEWS_BY_NAME;
    if (_reviewsLoading) return _reviewsLoading;
    _reviewsLoading = fetch('assets/data/reviews.json')
        .then(r => r.ok ? r.json() : {})
        .then(data => {
            SHOP_REVIEWS_BY_NAME = data || {};
            _reviewsLoaded = true;
            return SHOP_REVIEWS_BY_NAME;
        })
        .catch(() => {
            _reviewsLoaded = true;
            return {};
        });
    return _reviewsLoading;
}

// 啟動時背景載入 (不阻擋首次渲染)
loadReviews();

function openShopSheet(shopIdx) {
    const shop = SHOP_DATA[shopIdx];
    if (!shop) return;

    renderSheetContent(shop, shopIdx);

    const sheetEl = document.getElementById('shopSheet');
    const backdrop = document.getElementById('sheetBackdrop');
    if (sheetEl) {
        sheetEl.classList.add('show');
        sheetEl.setAttribute('aria-hidden', 'false');
    }
    if (backdrop) backdrop.classList.add('show');
    if (typeof lockBodyScroll === 'function') lockBodyScroll();

    bindSheetButtons(shopIdx);
}

function closeShopSheet() {
    const sheetEl = document.getElementById('shopSheet');
    const backdrop = document.getElementById('sheetBackdrop');
    if (sheetEl) {
        sheetEl.classList.remove('show');
        sheetEl.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) backdrop.classList.remove('show');
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
}

// 工具: 文字節點
function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
}

// 取得店家評論 (優先用 shop.reviews, 否則從 reviews.json 查)
function getShopReviews(shop) {
    if (shop.reviews && shop.reviews.length > 0) return shop.reviews;
    return SHOP_REVIEWS_BY_NAME[shop.name] || [];
}

function renderSheetContent(shop, shopIdx) {
    const container = document.getElementById('sheetContent');
    if (!container) {
        console.error('[sheet.js] #sheetContent 不存在, 無法渲染');
        return;
    }
    // 清空舊內容
    container.textContent = '';

    const isFav = typeof isFavorite === 'function' ? isFavorite(shop.name) : false;
    const gmapsUrl = shop.gmaps_url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + ' ' + (shop.city === 'kh' ? '高雄' : shop.city === 'tn' ? '台南' : shop.city === 'ch' ? '彰化' : ''))}`;

    // === 1. 標題 + 副標題 ===
    const title = el('h2', 'sheet-title', shop.name);
    container.appendChild(title);

    let subText = shop.cat_main || shop.mcat || '';
    if (shop.cat_sub) subText += ' · ' + shop.cat_sub;
    if (shop.rating) subText += ' · ★ ' + shop.rating;
    container.appendChild(el('div', 'sheet-subtitle', subText));

    // === 2. 照片縮圖條 (取代單張 hero) ===
    const photos = shop.photos || [];
    if (photos.length > 0) {
        const pSec = el('div', 'sheet-section');
        const pLabel = el('div', 'sheet-section-label', '📷 照片');
        pSec.appendChild(pLabel);
        const strip = el('div', 'card-photo-strip sheet-photo-strip');
        photos.slice(0, 4).forEach((url, idx) => {
            const thumb = el('div', 'card-photo-thumb');
            thumb.dataset.shopIdx = String(shopIdx);
            thumb.dataset.action = 'album';
            thumb.dataset.photoIdx = String(idx);
            const img = document.createElement('img');
            const cleanUrl = String(url).replace(/=w[\d-]+-h[\d-]+-k-no.*$/, '');
            img.src = cleanUrl + '=w408-h306-k-no';
            img.alt = shop.name + ' 照片';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onerror = () => {
                thumb.classList.add('img-broken');
                thumb.textContent = shop.emoji || '🍜';
                img.remove();
            };
            thumb.appendChild(img);
            strip.appendChild(thumb);
        });
        if (photos.length > 4) {
            const more = el('div', 'card-photo-thumb more', '+' + (photos.length - 4));
            more.dataset.shopIdx = String(shopIdx);
            more.dataset.action = 'album';
            strip.appendChild(more);
        }
        pSec.appendChild(strip);
        const albumBtn = el('button', 'sheet-btn secondary sheet-btn-album', '🖼 看完整相簿 · ' + photos.length + ' 張');
        albumBtn.dataset.shopIdx = String(shopIdx);
        albumBtn.dataset.action = 'album';
        pSec.appendChild(albumBtn);
        container.appendChild(pSec);
    }

    // === 3. 一週時間 (取代單行 time) ===
    if (shop.weekly_hours) {
        const weekSec = el('div', 'sheet-section');
        weekSec.appendChild(el('div', 'sheet-section-label', '🕒 一週時間（週一 至 週日）'));
        const weekBox = el('div', 'weekly-hours');
        ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].forEach(day => {
            const h = shop.weekly_hours[day];
            const isClosed = h === '休息' || h === '公休';
            const row = el('div', 'hours-row' + (isClosed ? ' hours-closed' : ''));
            row.appendChild(el('span', 'hours-day', day));
            row.appendChild(el('span', 'hours-time', h || '未提供'));
            weekBox.appendChild(row);
        });
        weekSec.appendChild(weekBox);
        container.appendChild(weekSec);
    } else if (shop.time) {
        // fallback: 沒 weekly_hours 就顯示單行
        const tSec = el('div', 'sheet-section');
        tSec.appendChild(el('div', 'sheet-section-label', '🕒 營業時間'));
        tSec.appendChild(el('div', 'sheet-section-value', shop.time));
        container.appendChild(tSec);
    }

    // === 4. 地址 ===
    const cleanAddr = (shop.address || shop.addr || '').replace(/^[\ue000-\uf8ff]+/, '');
    if (cleanAddr) {
        const addrSec = el('div', 'sheet-section');
        addrSec.appendChild(el('div', 'sheet-section-label', '📍 地址'));
        addrSec.appendChild(el('div', 'sheet-section-value', cleanAddr));
        container.appendChild(addrSec);
    }

    // === 5. 特色 ===
    if (shop.feature) {
        const featSec = el('div', 'sheet-section');
        featSec.appendChild(el('div', 'sheet-section-label', '✨ 特色'));
        featSec.appendChild(el('div', 'sheet-section-value', shop.feature));
        container.appendChild(featSec);
    }

    // === 6. 環境徽章 ===
    const envKeys = (shop.env || '').split(',');
    const envMap = { ind: '室內', cl: '冷氣', out: '戶外', cov: '騎樓' };
    const envBadges = envKeys.filter(k => envMap[k]);
    if (envBadges.length > 0) {
        const envSec = el('div', 'sheet-section');
        envSec.appendChild(el('div', 'sheet-section-label', '🏠 環境'));
        const envBox = el('div', 'env-badges');
        envBadges.forEach(k => envBox.appendChild(el('span', 'tag', envMap[k])));
        envSec.appendChild(envBox);
        container.appendChild(envSec);
    }

    // === 7. 價位 ===
    if (shop.price_range || shop.price_bar) {
        const pSec = el('div', 'sheet-section');
        pSec.appendChild(el('div', 'sheet-section-label', '💰 價位'));
        const priceText = (shop.price_bar || '') + (shop.price_range ? ' · 每人約 ' + shop.price_range : '');
        pSec.appendChild(el('div', 'sheet-section-value', priceText));
        container.appendChild(pSec);
    }

    // === 8. 評論 ===
    const reviews = getShopReviews(shop);
    const rSec = el('div', 'sheet-section');
    const rLabel = el('div', 'sheet-section-label', '💬 顧客評論');
    if (reviews.length > 0) {
        rLabel.textContent = `💬 顧客評論（${reviews.length}）`;
    }
    rSec.appendChild(rLabel);
    if (reviews.length > 0) {
        reviews.slice(0, 5).forEach(r => {
            const item = el('div', 'review-item');
            if (typeof r === 'string') {
                const txt = r.length > 200 ? r.substring(0, 200) + '…' : r;
                item.textContent = '"' + txt + '"';
            } else if (r && typeof r === 'object') {
                // 結構化評論 {author, rating, text, time}
                if (r.author) {
                    const head = el('div', 'review-head');
                    const author = el('span', 'review-author', r.author);
                    head.appendChild(author);
                    if (r.rating) {
                        const stars = el('span', 'review-stars', '★'.repeat(Math.round(r.rating)));
                        head.appendChild(stars);
                    }
                    item.appendChild(head);
                }
                const text = (r.text || '').length > 200
                    ? r.text.substring(0, 200) + '…'
                    : (r.text || '');
                item.appendChild(el('div', 'review-text', text));
            }
            rSec.appendChild(item);
        });
    } else {
        // 空狀態
        const empty = el('div', 'review-empty', '目前尚無評論');
        rSec.appendChild(empty);
    }
    container.appendChild(rSec);

    // === 9. 來源 ===
    const srcSec = el('div', 'sheet-section');
    srcSec.appendChild(el('div', 'sheet-section-label', '🔖 資料來源'));
    const srcVal = el('div', 'sheet-section-value', (shop.source || 'Google Maps') + ' · 信心度 ' + (shop.confidence || '中'));
    srcVal.classList.add('sheet-source');
    srcSec.appendChild(srcVal);
    container.appendChild(srcSec);

    // === 10. 動作按鈕 ===
    const actions = el('div', 'sheet-actions');
    const mapLink = el('a', 'sheet-btn', '📍 開啟地圖');
    mapLink.href = gmapsUrl;
    mapLink.target = '_blank';
    mapLink.rel = 'noopener';
    actions.appendChild(mapLink);

    const favBtn = el('button', 'sheet-btn sheet-btn-fav' + (isFav ? ' active' : ''), isFav ? '❤️ 已收藏' : '🤍 收藏');
    favBtn.dataset.action = 'toggle-fav';
    favBtn.dataset.shop = shop.name;
    actions.appendChild(favBtn);
    container.appendChild(actions);

    // === 11. 訂位按鈕 ===
    if (shop.booking_url) {
        const bookRow = el('div', 'sheet-actions');
        bookRow.style.marginTop = '8px';
        const bookLink = el('a', 'sheet-btn secondary', '📅 線上訂位');
        bookLink.href = shop.booking_url;
        bookLink.target = '_blank';
        bookLink.rel = 'noopener';
        bookLink.style.width = '100%';
        bookRow.appendChild(bookLink);
        container.appendChild(bookRow);
    }
}

function bindSheetButtons(shopIdx) {
    const sheet = document.getElementById('shopSheet');
    if (!sheet) return;

    const favBtn = sheet.querySelector('[data-action="toggle-fav"]');
    if (favBtn) {
        // 解除舊 listener (避免重複觸發)
        const newBtn = favBtn.cloneNode(true);
        favBtn.parentNode.replaceChild(newBtn, favBtn);
        newBtn.addEventListener('click', () => {
            const shopName = newBtn.dataset.shop;
            if (typeof toggleFavorite !== 'function') return;
            toggleFavorite(shopName);
            const isFav = typeof isFavorite === 'function' ? isFavorite(shopName) : false;
            newBtn.textContent = isFav ? '❤️ 已收藏' : '🤍 收藏';
            newBtn.classList.toggle('active', isFav);
            if (typeof showToast === 'function') {
                showToast(isFav ? '已加入收藏 ❤️' : '已從收藏移除', 'success');
            }
            if (typeof updateFavBadge === 'function') updateFavBadge();
        });
    }

    // 關閉按鈕 (避免重複綁定)
    const closeBtn = sheet.querySelector('[data-action="close-sheet"]');
    if (closeBtn && !closeBtn._closeBound) {
        closeBtn._closeBound = true;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeShopSheet();
        });
    }
}

// 滑動關閉
let sheetStartY = 0;
let sheetCurrentY = 0;
let isDragging = false;

document.addEventListener('DOMContentLoaded', () => {
    const sheet = document.getElementById('shopSheet');
    if (!sheet) return;
    const handle = sheet.querySelector('.sheet-handle');
    if (!handle) return;

    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
        sheetStartY = e.touches[0].clientY;
    });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        sheetCurrentY = e.touches[0].clientY - sheetStartY;
        if (sheetCurrentY > 0) {
            sheet.style.transform = `translateY(${sheetCurrentY}px)`;
        }
    });
    document.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        if (sheetCurrentY > 80) {
            closeShopSheet();
        }
        sheet.style.transform = '';
        sheetStartY = 0;
        sheetCurrentY = 0;
    });
});

// Expose
window.openShopSheet = openShopSheet;
window.closeShopSheet = closeShopSheet;
window.loadShopReviews = loadReviews;  // 給其他模組用