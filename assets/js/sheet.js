// ============================================
// sheet.js - 店家詳情底部 Sheet (簡約風, XSS-safe)
// ============================================

const SHOP_DATA = window.SHOP_DATA;

function openShopSheet(shopIdx) {
    const shop = SHOP_DATA[shopIdx];
    if (!shop) return;

    renderSheetContent(shop, shopIdx);

    document.getElementById('shopSheet').classList.add('show');
    document.getElementById('shopSheet').setAttribute('aria-hidden', 'false');
    document.getElementById('sheetBackdrop').classList.add('show');
    if (typeof lockBodyScroll === 'function') lockBodyScroll();

    bindSheetButtons(shopIdx);
}

function closeShopSheet() {
    document.getElementById('shopSheet').classList.remove('show');
    document.getElementById('shopSheet').setAttribute('aria-hidden', 'true');
    document.getElementById('sheetBackdrop').classList.remove('show');
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
}

// 工具: 文字節點
function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
}

function renderSheetContent(shop, shopIdx) {
    const container = document.getElementById('sheetContent');
    // 清空舊內容
    container.textContent = '';

    const isFav = isFavorite(shop.name);
    const gmapsUrl = shop.gmaps_url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + ' 高雄')}`;

    // 標題
    const title = el('h2', 'sheet-title', shop.name);
    container.appendChild(title);

    // 副標題
    let subText = shop.cat_main || '';
    if (shop.cat_sub) subText += ' · ' + shop.cat_sub;
    if (shop.rating) subText += ' · ★ ' + shop.rating;
    container.appendChild(el('div', 'sheet-subtitle', subText));

    // 一週時間
    if (shop.weekly_hours) {
        const weekSec = el('div', 'sheet-section');
        weekSec.appendChild(el('div', 'sheet-section-label', '一週時間（週一 至 週日）'));
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
    }

    // 地址 (去掉 PUA 字符)
    const cleanAddr = (shop.address || shop.addr || '').replace(/^[\ue000-\uf8ff]+/, '');
    const addrSec = el('div', 'sheet-section');
    addrSec.appendChild(el('div', 'sheet-section-label', '地址'));
    addrSec.appendChild(el('div', 'sheet-section-value', cleanAddr));
    container.appendChild(addrSec);

    // 特色
    if (shop.feature) {
        const featSec = el('div', 'sheet-section');
        featSec.appendChild(el('div', 'sheet-section-label', '特色'));
        featSec.appendChild(el('div', 'sheet-section-value', shop.feature));
        container.appendChild(featSec);
    }

    // 環境徽章
    const envKeys = (shop.env || '').split(',');
    const envMap = { ind: '室內', cl: '冷氣', out: '戶外', cov: '騎樓' };
    const envBadges = envKeys.filter(k => envMap[k]);
    if (envBadges.length > 0) {
        const envSec = el('div', 'sheet-section');
        envSec.appendChild(el('div', 'sheet-section-label', '環境'));
        const envBox = el('div');
        envBadges.forEach(k => envBox.appendChild(el('span', 'tag', envMap[k])));
        envSec.appendChild(envBox);
        container.appendChild(envSec);
    }

    // 價位
    if (shop.price_range) {
        const pSec = el('div', 'sheet-section');
        pSec.appendChild(el('div', 'sheet-section-label', '價位'));
        pSec.appendChild(el('div', 'sheet-section-value',
            (shop.price_bar || '') + ' · 每人約 ' + shop.price_range));
        container.appendChild(pSec);
    }

    // 照片
    const photos = shop.photos || [];
    if (photos.length > 0) {
        const pSec = el('div', 'sheet-section');
        pSec.appendChild(el('div', 'sheet-section-label', '照片'));
        const strip = el('div', 'card-photo-strip');
        photos.slice(0, 4).forEach((url, idx) => {
            const thumb = el('div', 'card-photo-thumb');
            thumb.dataset.shopIdx = String(shopIdx);
            thumb.dataset.action = 'album';
            thumb.dataset.photoIdx = String(idx);
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.loading = 'lazy';
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
        const albumBtn = el('button', 'btn-album', '看完整相簿 · ' + photos.length + ' 張');
        albumBtn.style.marginTop = '6px';
        albumBtn.dataset.shopIdx = String(shopIdx);
        albumBtn.dataset.action = 'album';
        pSec.appendChild(albumBtn);
        container.appendChild(pSec);
    }

    // 評論
    if (shop.reviews && shop.reviews.length > 0) {
        const rSec = el('div', 'sheet-section');
        rSec.appendChild(el('div', 'sheet-section-label', '顧客評論'));
        shop.reviews.slice(0, 2).forEach(r => {
            const txt = r.length > 150 ? r.substring(0, 150) + '…' : r;
            rSec.appendChild(el('div', 'review-item', txt));
        });
        container.appendChild(rSec);
    }

    // 來源
    const srcSec = el('div', 'sheet-section');
    srcSec.appendChild(el('div', 'sheet-section-label', '資料來源'));
    const srcVal = el('div', 'sheet-section-value', (shop.source || 'Google Maps') + ' · 信心度 ' + (shop.confidence || '中'));
    srcVal.style.fontSize = '0.85rem';
    srcVal.style.color = 'var(--text-3)';
    srcSec.appendChild(srcVal);
    container.appendChild(srcSec);

    // 動作按鈕
    const actions = el('div', 'sheet-actions');
    const mapLink = el('a', 'btn btn-map', '開啟地圖');
    mapLink.href = gmapsUrl;
    mapLink.target = '_blank';
    mapLink.rel = 'noopener';
    actions.appendChild(mapLink);

    const favBtn = el('button', 'btn btn-primary', isFav ? '已收藏' : '收藏');
    favBtn.dataset.action = 'toggle-fav';
    favBtn.dataset.shop = shop.name;
    actions.appendChild(favBtn);
    container.appendChild(actions);

    // 訂位按鈕
    if (shop.booking_url) {
        const bookRow = el('div', 'sheet-actions');
        bookRow.style.marginTop = '8px';
        const bookLink = el('a', 'btn', '線上訂位');
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
        favBtn.addEventListener('click', () => {
            const shopName = favBtn.dataset.shop;
            toggleFavorite(shopName);
            const isFav = isFavorite(shopName);
            favBtn.textContent = isFav ? '已收藏' : '收藏';
            showToast(isFav ? '已加入收藏' : '已從收藏移除', 'success');
            updateFavBadge();
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
