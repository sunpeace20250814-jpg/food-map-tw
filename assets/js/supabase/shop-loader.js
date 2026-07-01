/**
 * v8.0 極簡渲染 - 1 大縮圖 + 店名 + 站點 + 營業狀態 + 收藏 + 地圖
 */
function renderCard(s, idx) {
    const article = document.createElement('article');
    article.className = 'shop-card';
    article.dataset.shopIdx = String(s.id || idx);
    article.dataset.city = s.city || 'kh';
    article.dataset.late = s.late ? '1' : '0';
    article.dataset.mcat = s.mcat || '';
    article.dataset.line = s.line || 'none';
    article.dataset.price = s.price_bar || '$';
    article.dataset.station = s.station || '';

    // === 左: 1 大縮圖 ===
    const hasPhotos = s.photos && s.photos.length > 0;
    if (hasPhotos) {
        const strip = document.createElement('div');
        strip.className = 'card-photo-strip';
        const inner = document.createElement('div');
        inner.className = 'card-photo-thumb';
        inner.dataset.shopIdx = String(s.id || idx);
        inner.dataset.action = 'album';
        const img = document.createElement('img');
        img.alt = s.name + ' 照片';
        const baseUrl = s.photos[0].replace(/=w[\d-]+-h[\d-]+-k-no.*$/, '');
        img.src = baseUrl + '=w408-h306-k-no';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.onerror = () => {
            inner.classList.add('img-broken');
            inner.textContent = s.emoji || '🍜';
            img.remove();
        };
        inner.appendChild(img);
        strip.appendChild(inner);
        article.appendChild(strip);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'card-photo-placeholder';
        placeholder.dataset.shopIdx = String(s.id || idx);
        const emoji = document.createElement('span');
        emoji.className = 'placeholder-emoji';
        emoji.textContent = s.emoji || '🍜';
        placeholder.appendChild(emoji);
        const label = document.createElement('span');
        label.className = 'placeholder-label';
        label.textContent = '暫無照片';
        placeholder.appendChild(label);
        article.appendChild(placeholder);
    }

    // === 右: 內容 ===
    const body = document.createElement('div');
    body.className = 'card-body';

    const h3 = document.createElement('h3');
    h3.className = 'card-name';
    h3.textContent = s.name || '';
    body.appendChild(h3);

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    if (s.cat_sub || s.mcat) {
        const cat = document.createElement('span');
        cat.textContent = s.cat_sub || s.mcat;
        meta.appendChild(cat);
    }
    if (s.station) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        meta.appendChild(dot);
        const st = document.createElement('span');
        st.textContent = s.station;
        st.style.overflow = 'hidden';
        st.style.textOverflow = 'ellipsis';
        st.style.whiteSpace = 'nowrap';
        meta.appendChild(st);
    }
    body.appendChild(meta);

    const info = document.createElement('div');
    info.className = 'card-info';
    const status = computeStatus(s);
    const statusEl = document.createElement('span');
    statusEl.className = 'card-status ' + status.cls;
    statusEl.textContent = status.label;
    info.appendChild(statusEl);

    if (s.rating) {
        const r = document.createElement('span');
        r.className = 'card-rating';
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★';
        const num = document.createElement('span');
        const rt = typeof s.rating === 'number' ? s.rating.toFixed(1) : String(s.rating).split('(')[0];
        num.textContent = rt;
        r.appendChild(star);
        r.appendChild(num);
        info.appendChild(r);
    }

    body.appendChild(info);
    article.appendChild(body);

    // 點擊卡片打開 sheet（由 sheet.js 統一處理）
    article.addEventListener('click', (e) => {
        if (e.target.closest('.card-photo-thumb')) {
            e.stopPropagation();
            openAlbum(s.id || idx);
            return;
        }
        if (typeof window.openShopSheet === 'function') {
            const targetIdx = (typeof idx === 'number') ? idx : (s.id != null ? s.id : idx);
            window.openShopSheet(targetIdx);
        }
    });

    return article;
}

function computeStatus(s) {
    if (s.time_24h || s.time_24h === 'true' || s.time_24h === true) {
        return { cls: 'open', label: '24hr' };
    }
    const t = s.time || '';
    if (t.includes('休息')) return { cls: 'closed', label: '休息' };
    if (t.includes('營業至')) return { cls: 'open', label: t.replace('營業：營業至 ', '至 ') };
    if (t.includes('下次開門')) return { cls: 'closed', label: t.replace('營業：下次開門 ', '開門 ') };
    return { cls: 'open', label: '營業中' };
}

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

function showToast(msg) {
    let c = document.querySelector('.toast-container');
    if (!c) {
        c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

/**
 * 主 init: 接管 SHOP_DATA 渲染
 */
function initShopLoader() {
    if (!window.SHOP_DATA || !window.SHOP_DATA.length) return;
    const listEl = document.getElementById('shopList');
    if (!listEl) return;
    // 清空
    listEl.innerHTML = '';
    // 渲染全部
    window.SHOP_DATA.forEach((s, idx) => {
        const card = renderCard(s, idx);
        listEl.appendChild(card);
    });
    if (window.__DEBUG__) console.log('[v10.1] Rendered', window.SHOP_DATA.length, 'shops');
}

// 等待 DOM ready + Supabase bootstrap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initShopLoader, 100));
} else {
    setTimeout(initShopLoader, 100);
}

// 也監聽 SHOP_DATA 更新 (從 Supabase 載入完成後)
window.addEventListener('shops-updated', initShopLoader);
window.addEventListener('shop-data-ready', initShopLoader);

// FAB 返回頂部
(function setupFab() {
    let fab;
    function ensure() {
        if (fab) return fab;
        fab = document.createElement('button');
        fab.className = 'fab';
        fab.setAttribute('aria-label', '返回頂部');
        fab.textContent = '↑';
        fab.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        document.body.appendChild(fab);
        return fab;
    }
    let lastShow = false;
    window.addEventListener('scroll', () => {
        const show = window.scrollY > 400;
        if (show !== lastShow) {
            ensure().classList.toggle('show', show);
            lastShow = show;
        }
    }, { passive: true });
})();

// sheet.js 為 sheet 渲染的唯一來源；closeShopSheet 由 sheet.js 暴露到 window