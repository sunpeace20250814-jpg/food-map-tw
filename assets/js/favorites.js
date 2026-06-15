// ============================================
// favorites.js — 我的最愛 (localStorage only, 純前端)
// ============================================

const FAV_KEY = 'kaohsiung_yeoha_favorites_v1';

function getLocalFavorites() {
    try {
        const raw = localStorage.getItem(FAV_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveLocalFavorites(favs) {
    try {
        localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch (e) {
        console.error("Failed to save favorites", e);
    }
}

function isFavorite(shopName) {
    const favs = getLocalFavorites();
    return favs.some(f => f.name === shopName);
}

function toggleFavorite(shopName) {
    const isFav = isFavorite(shopName);
    if (isFav) {
        // 移除
        const favs = getLocalFavorites();
        const idx = favs.findIndex(f => f.name === shopName);
        if (idx >= 0) {
            favs.splice(idx, 1);
            saveLocalFavorites(favs);
        }
        return false;
    } else {
        // 新增
        const shop = window.SHOP_DATA.find(s => s.name === shopName);
        if (!shop) return false;
        const favs = getLocalFavorites();
        favs.push(shop);
        saveLocalFavorites(favs);
        return true;
    }
}

function updateFavBadge() {
    const badge = document.getElementById("favBadge");
    if (!badge) return;
    const count = getLocalFavorites().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? "block" : "none";
}

// 工具: 建立 DOM 元素 (XSS-safe)
function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
}

function renderFavList() {
    const list = document.getElementById("favList");
    const favs = getLocalFavorites();
    list.textContent = "";

    if (favs.length === 0) {
        const p = el("p", "fav-empty");
        p.appendChild(document.createTextNode("尚未收藏店家"));
        p.appendChild(el("br"));
        p.appendChild(document.createTextNode("點擊店家卡片右上角的 ❤️ 即可收藏"));
        list.appendChild(p);
        return;
    }

    favs.forEach(s => {
        const realIdx = window.SHOP_DATA.findIndex(x => x.name === s.name);
        const card = el("article", "shop-card");
        if (realIdx >= 0) card.dataset.shopIdx = String(realIdx);

        const header = el("div", "card-header");
        const titleBox = el("div", "card-title");
        titleBox.appendChild(el("span", "card-emoji", s.emoji || ""));
        const nameWrap = el("div", "card-name-wrap");
        nameWrap.appendChild(el("h3", "card-name", s.name));
        const catSub = (s.cat_main || "") + (s.cat_sub ? " · " + s.cat_sub : "");
        nameWrap.appendChild(el("span", "card-cat-sub", catSub));
        titleBox.appendChild(nameWrap);
        header.appendChild(titleBox);
        header.appendChild(el("span", "time-badge", s.time || ""));
        card.appendChild(header);

        const meta = el("div", "card-meta");
        meta.appendChild(el("span", "mrt-tag", s.station || ""));
        card.appendChild(meta);

        card.appendChild(el("p", "card-feature", s.feature || ""));

        const footer = el("div", "card-footer");
        const envBox = el("div", "env-badges");
        (s.env_badges || []).forEach(b => envBox.appendChild(el("span", "env-badge", b)));
        footer.appendChild(envBox);
        const priceInfo = el("div", "price-info");
        priceInfo.appendChild(el("span", "price-emoji", s.price_emoji || ""));
        priceInfo.appendChild(el("span", "price-bar", s.price_bar || ""));
        priceInfo.appendChild(el("span", "price-range", s.price_range || ""));
        footer.appendChild(priceInfo);
        card.appendChild(footer);

        card.addEventListener("click", () => {
            closeFavSheet();
            const idx = parseInt(card.dataset.shopIdx);
            if (idx >= 0) openShopSheet(idx);
        });
        list.appendChild(card);
    });
}

function openFavSheet() {
    renderFavList();
    document.getElementById("favSheet").classList.add("show");
    if (typeof lockBodyScroll === "function") lockBodyScroll();
}

function closeFavSheet() {
    document.getElementById("favSheet").classList.remove("show");
    if (typeof unlockBodyScroll === "function") unlockBodyScroll();
}
