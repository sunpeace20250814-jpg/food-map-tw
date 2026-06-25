// ============================================
// app.js - 主程式 (整合所有功能)
// ============================================

// 全域狀態
let currentLine = 'all';
let currentLate = 'all';
let currentPrice = 'all';
let currentType = 'all';
let currentMcat = 'all';
let currentEnv = 'all';
let currentStation = 'all';
let currentSearch = '';
let currentQuick = 'all';

// 工具: 建立 DOM 元素 (XSS-safe)
function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
}

// === iOS 安全的 body 滾動鎖定 ===
// iOS Safari 不支援 overflow:hidden 鎖背景,要用 position:fixed 技巧
let bodyScrollLockCount = 0;
let bodyScrollLockY = 0;

function lockBodyScroll() {
    if (bodyScrollLockCount === 0) {
        bodyScrollLockY = window.scrollY || window.pageYOffset || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${bodyScrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.dataset.scrollLock = '1';
    }
    bodyScrollLockCount++;
}

function unlockBodyScroll() {
    if (bodyScrollLockCount === 0) return;
    bodyScrollLockCount--;
    if (bodyScrollLockCount === 0) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        delete document.body.dataset.scrollLock;
        window.scrollTo(0, bodyScrollLockY);
    }
}

// 店家資料 (由外部 shop_data.json 載入, 透過 window 共享)
window.SHOP_DATA = window.SHOP_DATA || [];

// 顯示骨架屏 (首次載入)
function showSkeleton() {
    const skel = document.getElementById('skeletonList');
    if (skel) skel.style.display = 'grid';
    const list = document.getElementById('shopList');
    if (list) list.style.opacity = '0.3';
}
function hideSkeleton() {
    const skel = document.getElementById('skeletonList');
    if (skel) skel.style.display = 'none';
    const list = document.getElementById('shopList');
    if (list) list.style.opacity = '1';
}

// Toast 提示
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// Tab 切換
function switchTab(tab) {
    // 切換前先關閉所有 sheet
    closeShopSheet();
    closeFavSheet();
    closeInfoSheet();
    closeSearchSheet();

    // 更新底部 tab 狀態
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    switch (tab) {
        case 'home':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // 切回首頁時清掉 active（只有切換到子頁才標 active）
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="home"]')?.classList.add('active');
            break;
        case 'filter':
            // 展開進階篩選
            const details = document.querySelector('.filter-details');
            if (details && !details.open) details.open = true;
            document.getElementById('filterPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
            // 滾動後切回首頁 active
            setTimeout(() => {
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                document.querySelector('[data-tab="home"]')?.classList.add('active');
            }, 500);
            break;
        case 'fav':
            openFavSheet();
            break;
        case 'info':
            // toggle: 如果已顯示就關閉, 否則開啟
            if (document.getElementById('infoSheet').classList.contains('show')) {
                closeInfoSheet();
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                document.querySelector('[data-tab="home"]')?.classList.add('active');
            } else {
                document.getElementById('infoSheet').classList.add('show');
                lockBodyScroll();
            }
            break;
    }
}
function closeInfoSheet() {
    document.getElementById('infoSheet').classList.remove('show');
    unlockBodyScroll();
    // 切回首頁 tab
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="home"]')?.classList.add('active');
}

// 搜尋 sheet
function openSearchSheet() {
    document.getElementById('searchSheet').classList.add('show');
    lockBodyScroll();
    setTimeout(() => {
        const input = document.getElementById('searchSheetInput');
        if (input) { input.value = currentSearch; input.focus(); }
    }, 100);
}
function closeSearchSheet() {
    document.getElementById('searchSheet').classList.remove('show');
    unlockBodyScroll();
}

// 載入店家資料
// 載入店家資料 (純前端: 直接用 inline SHOP_DATA_INITIAL)
async function loadShopData() {
    showSkeleton();
    try {
        const data = window.SHOP_DATA_INITIAL || [];
        data.forEach(s => window.SHOP_DATA.push(s));
        bindCardClicks();
        renderStationChips();
        updateFavBadge();
        updateHeroStats();
        applyFilter();
        setTimeout(hideSkeleton, 300);
        console.log(`[loadShopData] 載入 ${data.length} 家 (inline)`);
    } catch (e) {
        console.error("Failed to load shop data", e);
        hideSkeleton();
    }
}

// 改寫每張卡片的營業時間為 XX:XX~XX:XX 格式
// 從 SHOP_DATA[idx].weekly_hours 找今天 weekday
const TODAY_WEEKDAYS = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
function todayKey() {
    return TODAY_WEEKDAYS[new Date().getDay()];
}

function formatHoursLabel(shop) {
    if (!shop) return null;
    const today = todayKey();
    if (shop.weekly_hours && shop.weekly_hours[today]) {
        const v = shop.weekly_hours[today];
        if (v === '24 小時營業' || v === '24hr' || v === '24h') return '00:00~24:00';
        if (v === '休息' || v === '公休') return '今日休息';
        // 「17:30 到 01:30」 → 「17:30~01:30」
        const m = v.match(/(\d{1,2}:\d{2})\s*到\s*(\d{1,2}:\d{2})/);
        if (m) return m[1] + '~' + m[2];
    }
    return null;
}

function rewriteCardHours() {
    document.querySelectorAll('.shop-card').forEach(card => {
        const idx = parseInt(card.dataset.shopIdx);
        if (isNaN(idx)) return;
        const shop = window.SHOP_DATA[idx];

        // === 1) 營業時間: 從 card-info-row .tag 取出時間 ===
        const infoRow = card.querySelector('.card-info-row');
        const oldTag = infoRow ? infoRow.querySelector('.tag') : null;
        if (oldTag) {
            const label = formatHoursLabel(shop);
            if (label) {
                oldTag.textContent = label;
                oldTag.classList.remove('tag-time-open','tag-time-closed','tag-time-24h');
                if (label === '今日休息') oldTag.classList.add('tag-time-closed');
                else if (label === '00:00~24:00') oldTag.classList.add('tag-time-24h');
                else oldTag.classList.add('tag-time-open');
            }
        }

        // === 2) 從 card-meta-line 把捷運站 tag 拆出來 ===
        const metaLine = card.querySelector('.card-meta-line');
        const mrtTag = metaLine ? metaLine.querySelector('.tag.tag-mrt') : null;
        let stationEl = null;
        if (mrtTag) {
            stationEl = mrtTag;
            mrtTag.remove();
        } else {
            // 從 dataset 重建
            stationEl = document.createElement('span');
            stationEl.className = 'tag tag-mrt';
            stationEl.textContent = card.dataset.station || '';
        }
        const stationBlock = document.createElement('div');
        stationBlock.className = 'station-block';
        stationBlock.appendChild(stationEl);

        // === 3) 重組: 捷運站 + 營業時間 同一 row ===
        const hoursBlock = document.createElement('div');
        hoursBlock.className = 'hours-block';
        if (oldTag) hoursBlock.appendChild(oldTag);

        const hoursRow = document.createElement('div');
        hoursRow.className = 'card-hours-row';
        hoursRow.appendChild(stationBlock);
        hoursRow.appendChild(hoursBlock);

        // 把 hoursRow 放在 metaLine 後 (取代舊的 infoRow)
        if (infoRow && infoRow.parentNode) {
            infoRow.parentNode.replaceChild(hoursRow, infoRow);
        }

        // === 4) 地址搬到店名下方 ===
        const addrEl = card.querySelector('.card-addr');
        const titleBlock = card.querySelector('.card-title-block');
        const cardName = card.querySelector('.card-name');
        if (addrEl && titleBlock && cardName) {
            // 插入在 card-name 之後
            cardName.insertAdjacentElement('afterend', addrEl);
            addrEl.classList.add('card-addr-top');
        }
    });
}

// 動態更新 hero stats (避免 hardcode 數字)
function updateHeroStats() {
    const cards = document.querySelectorAll('.shop-card');
    const currentCity = window.currentCity || 'kh';
    let n24h = 0, late = 0;
    const stations = new Set();
    cards.forEach(c => {
        if (c.style.display === 'none') return;  // 跳過被縣市/篩選隱藏的
        const cardCity = c.dataset.city || 'kh';
        if (cardCity !== currentCity) return;
        if (c.dataset.late === '1' && c.textContent.indexOf('24 小時') >= 0) n24h++;
        if (c.dataset.late === '1') late++;
        if (c.dataset.station) stations.add(c.dataset.station);
    });
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('statTotal', cards.length === 0 ? 0 : Array.from(cards).filter(c => {
        const cc = c.dataset.city || 'kh';
        return c.style.display !== 'none' && cc === currentCity;
    }).length);
    setText('stat24h', n24h);
    setText('statLate', late);
    setText('statStations', stations.size);
}

// Event delegation - 在 document 層級監聽卡片點擊
function bindCardClicks() {
    document.addEventListener('click', (e) => {
        // 1) 收藏按鈕
        if (e.target.closest('.card-fav')) {
            const favBtn = e.target.closest('.card-fav');
            const card = favBtn.closest('.shop-card');
            if (!card) return;
            const shopName = card.querySelector('.card-name')?.textContent;
            if (shopName && window.SHOP_DATA.length > 0) {
                e.stopPropagation();
                toggleFavorite(shopName);
                const isFav = isFavorite(shopName);
                favBtn.classList.toggle('active', isFav);
                favBtn.textContent = isFav ? '❤️' : '🤍';
                showToast(isFav ? '已加入收藏 ❤️' : '已從收藏移除', 'success');
                updateFavBadge();
            }
            return;
        }

        // 2) 地圖按鈕 - 讓瀏覽器原生處理 (target=_blank 開新分頁)
        if (e.target.closest('.card-map-btn')) {
            // 不阻止預設行為, 讓 <a target="_blank"> 開啟
            return;
        }

        // 3) 詳細資訊按鈕 - 開 sheet
        if (e.target.closest('[data-action="detail"]')) {
            const btn = e.target.closest('[data-action="detail"]');
            const idx = parseInt(btn.dataset.shopIdx);
            e.stopPropagation();
            if (!isNaN(idx)) {
                if (window.SHOP_DATA[idx]) openShopSheet(idx);
                else setTimeout(() => window.SHOP_DATA[idx] && openShopSheet(idx), 200);
            }
            return;
        }

        // 3.5) 照片相簿 (縮圖或「看完整相簿」按鈕)
        if (e.target.closest('[data-action="album"]')) {
            const el = e.target.closest('[data-action="album"]');
            const idx = parseInt(el.dataset.shopIdx);
            const photoIdx = parseInt(el.dataset.photoIdx || '-1');
            e.stopPropagation();
            if (!isNaN(idx)) {
                if (window.SHOP_DATA[idx]) {
                    openAlbum(idx);
                    if (photoIdx >= 0) {
                        setTimeout(() => openAlbumViewer(photoIdx), 100);
                    }
                }
            }
            return;
        }

        // 4) 點擊卡片本體（非按鈕）- 也開 sheet
        const card = e.target.closest('.shop-card');
        if (!card) return;
        // 已開啟的 sheet: 背景卡片完全不接收 click (iOS 滑動穿透防護)
        if (document.getElementById('shopSheet').classList.contains('show')) {
            return;
        }
        // 排除 sheet 內的點擊（避免重複觸發）,但要讓 sheet 內的相簿/按鈕事件正常運作
        if (e.target.closest('.shop-sheet') && !e.target.closest('[data-action="album"]') && !e.target.closest('[data-action="toggle-fav"]')) {
            return;
        }

        const idx = parseInt(card.dataset.shopIdx);
        if (!isNaN(idx) && window.SHOP_DATA[idx]) {
            openShopSheet(idx);
        } else {
            setTimeout(() => {
                if (window.SHOP_DATA[idx]) openShopSheet(idx);
            }, 200);
        }
    });
}

function renderStationChips() {
    const container = document.getElementById('stationChips');
    if (!container) return;
    // 統計每個站店家數
    const counts = {};
    window.SHOP_DATA.forEach(s => {
        counts[s.station] = (counts[s.station] || 0) + 1;
    });
    // 用 localeCompare 中文排序,避免 Unicode code point 排序
    const stations = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'zh-Hant-TW'));
    container.textContent = '';
    stations.forEach(s => {
        const chip = el('span', 'chip station-chip');
        chip.dataset.station = s;
        chip.textContent = `${s} (${counts[s]})`;
        container.appendChild(chip);
    });
    // 綁定
    container.querySelectorAll('.station-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const isActive = chip.classList.contains('active');
            container.querySelectorAll('.station-chip').forEach(c => c.classList.remove('active'));
            if (!isActive) {
                chip.classList.add('active');
                currentStation = chip.dataset.station;
            } else {
                currentStation = 'all';
            }
            applyFilter();
        });
    });
}

// 舊的 bindCardClicks 已由 event delegation 取代
// (見 loadShopData 之後的 bindCardClicks 函式)

// 滾動監聽 - 顯示/隱藏 FAB
function bindScroll() {
    const fab = document.getElementById('fabTop');
    if (!fab) return;
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y > 400) {
            fab.classList.add('show');
        } else {
            fab.classList.remove('show');
        }
        lastScroll = y;
    }, { passive: true });
}

// 下拉重掃 (Pull to refresh)
function bindPullToRefresh() {
    let startY = 0;
    let pulling = false;
    let pullingDistance = 0;
    const threshold = 80;

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY > 5) return;
        // 排除 sheet 內的 touchstart
        if (e.target.closest('.shop-sheet, .fav-sheet, .info-sheet, .search-sheet, .album-modal, .photo-modal')) return;
        startY = e.touches[0].clientY;
        pulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const currentY = e.touches[0].clientY;
        pullingDistance = Math.max(0, currentY - startY - 50);
        if (pullingDistance > 0 && pullingDistance < threshold * 2) {
            // 視覺提示: 主內容下移
            document.getElementById('shopList').style.transform = `translateY(${Math.min(pullingDistance, threshold) * 0.5}px)`;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        if (!pulling) return;
        pulling = false;
        if (pullingDistance > threshold) {
            showToast('🔄 重新整理中...', 'info');
            setTimeout(() => {
                applyFilter();
                showToast('✅ 已更新', 'success');
            }, 600);
        }
        document.getElementById('shopList').style.transform = '';
        pullingDistance = 0;
    });
}

// 註冊所有事件
function bindEvents() {
    // 1) 搜尋 (header 的搜尋 icon)
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', openSearchSheet);

    const searchSheetInput = document.getElementById('searchSheetInput');
    if (searchSheetInput) {
        searchSheetInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            const mainSearch = document.getElementById('searchInput');
            if (mainSearch) mainSearch.value = currentSearch;
            applyFilter();
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            const sheetInput = document.getElementById('searchSheetInput');
            if (sheetInput) sheetInput.value = currentSearch;
            applyFilter();
        });
    }

    // 2) 篩選 chips (線/營業/價位/類型/大類/環境)
    document.querySelectorAll('[data-line-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-line-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentLine = chip.dataset.lineFilter;
            applyFilter();
        });
    });
    document.querySelectorAll('[data-late-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-late-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentLate = chip.dataset.lateFilter;
            applyFilter();
        });
    });
    document.querySelectorAll('[data-price-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-price-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentPrice = chip.dataset.priceFilter;
            applyFilter();
        });
    });
    document.querySelectorAll('[data-type-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-type-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentType = chip.dataset.typeFilter;
            applyFilter();
        });
    });
    document.querySelectorAll('[data-mcat-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-mcat-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentMcat = chip.dataset.mcatFilter;
            applyFilter();
        });
    });
    document.querySelectorAll('[data-env-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-env-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentEnv = chip.dataset.envFilter;
            applyFilter();
        });
    });

    // 3) 快速 chip (頂部)
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentQuick = chip.dataset.quick;
            applyQuickFilter(currentQuick);
        });
    });

    // 4) 重設
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);

    // 5) 排序
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', applySort);
    }

    // 6) 我的最愛 icon (header)
    const favBtn = document.getElementById('favBtn');
    if (favBtn) favBtn.addEventListener('click', openFavSheet);

    // 7) 底部 tab
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 8) 點擊 backdrop 關閉 sheet
    document.getElementById('sheetBackdrop')?.addEventListener('click', closeShopSheet);

    // 9) ESC 關閉所有 sheet
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeShopSheet();
            closeSearchSheet();
            closeFavSheet();
            closeInfoSheet();
        }
    });
}

function applyQuickFilter(quick) {
    // 重設所有條件
    currentLine = 'all';
    currentLate = 'all';
    currentPrice = 'all';
    currentType = 'all';
    currentMcat = 'all';
    currentEnv = 'all';
    currentStation = 'all';
    currentSearch = '';

    // 套用對應的快速篩選
    switch (quick) {
        case 'all': break;
        case '24h': currentLate = '24h'; break;
        case '22start': currentLate = '22start'; break;
        case 'hotpot': currentMcat = '火鍋'; break;
        case 'izakaya': currentMcat = '居酒屋/日式'; break;
        case 'snack': currentMcat = '小吃/夜市'; break;
        case 'ac': currentEnv = 'ac'; break;
    }

    // 同步更新 chip 狀態
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll(`[data-late-filter="${currentLate}"]`).forEach(c => c.classList.add('active'));
    document.querySelectorAll(`[data-mcat-filter="${currentMcat}"]`).forEach(c => c.classList.add('active'));
    document.querySelectorAll(`[data-env-filter="${currentEnv}"]`).forEach(c => c.classList.add('active'));
    document.querySelectorAll('[data-line-filter="all"]').forEach(c => c.classList.add('active'));
    document.querySelectorAll('[data-price-filter="all"]').forEach(c => c.classList.add('active'));
    document.querySelectorAll('[data-type-filter="all"]').forEach(c => c.classList.add('active'));
    document.querySelectorAll('.station-chip').forEach(c => c.classList.remove('active'));

    applyFilter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 縣市切換 (高雄 / 台南)
function bindCitySwitcher() {
    const bar = document.getElementById('cityBar');
    if (!bar) return;
    bar.addEventListener('click', (e) => {
        const chip = e.target.closest('.city-chip');
        if (!chip) return;
        bar.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const city = chip.dataset.city;
        switchCity(city);
    });
}

// 全域縣市狀態 (供 filters.js 讀取)
window.currentCity = 'kh';

function switchCity(city) {
    window.currentCity = city;  // 給 updateQuickBarCounts / updateHeroStats 讀

    // 切縣市時,重置所有篩選器,避免舊縣市的選擇影響新縣市
    if (typeof currentLine !== 'undefined') { currentLine = 'all'; currentLate = 'all'; currentPrice = 'all'; currentType = 'all'; currentMcat = 'all'; currentEnv = 'all'; currentStation = 'all'; currentSearch = ''; }
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    // 重設所有 chip active 狀態
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('[data-line-filter="all"], [data-late-filter="all"], [data-price-filter="all"], [data-mcat-filter="all"], [data-env-filter="all"]').forEach(c => c.classList.add('active'));

    // 切換顯示店家
    const cards = document.querySelectorAll('.shop-card');
    let visible = 0;
    cards.forEach(c => {
        const cardCity = c.dataset.city || 'kh';
        if (cardCity === city) {
            c.style.display = '';
            visible++;
        } else {
            c.style.display = 'none';
        }
    });
    // 同步更新副標題
    const sub = document.getElementById('appSub');
    if (sub) {
        const cityName = city === 'kh' ? '高雄' : '台南';
        sub.textContent = `2026 · ${cityName} ${visible} 家精選`;
    }
    // 觸發 applyFilter 讓 quick-bar / resultCount / hero stats 全部重算
    if (typeof applyFilter === 'function') applyFilter();
    if (typeof updateHeroStats === 'function') updateHeroStats();

    showToast(city === 'kh' ? '已切換到高雄' : '已切換到台南(目前籌備中)', 'info');
}

// 分享按鈕
function bindShareButtons() {
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action="share"]');
        if (!btn) return;
        e.stopPropagation();
        e.preventDefault();
        const card = btn.closest('.shop-card');
        if (!card) return;
        const name = card.querySelector('.card-name')?.textContent?.trim() || '';
        const station = card.dataset.station || '';
        const addrEl = card.querySelector('.card-addr');
        const addr = addrEl ? addrEl.textContent.trim() : '';
        const text = `🌙 ${name}\n📍 ${addr}\n🚇 ${station}\n\n高雄宵夜地圖: https://kaohsiung-yeoha.vercel.app`;

        // 三段降級: Web Share API → 剪貼簿 → prompt
        try {
            // 檢測 Web Share API 支援 (iOS Safari 才有)
            if (navigator.share && navigator.canShare) {
                try {
                    // 嘗試只傳 text (iOS 最穩)
                    await navigator.share({ text, title: name });
                    return;  // 成功就 return
                } catch (innerErr) {
                    // 使用者取消不算錯 (AbortError)
                    if (innerErr.name === 'AbortError') return;
                    console.warn('[share] Web Share 失敗, 降級:', innerErr.message);
                    // 繼續降級
                }
            }
            // 降級 1: 剪貼簿
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(text);
                    showToast('已複製到剪貼簿', 'success');
                    return;
                } catch (clipErr) {
                    console.warn('[share] Clipboard 失敗:', clipErr.message);
                }
            }
            // 降級 2: 用隱藏 textarea + execCommand('copy')
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
                ta.setAttribute('readonly', '');
                document.body.appendChild(ta);
                ta.select();
                const success = document.execCommand && document.execCommand('copy');
                document.body.removeChild(ta);
                if (success) {
                    showToast('已複製到剪貼簿', 'success');
                } else {
                    showToast('複製失敗, 請手動選取', 'error');
                }
            } catch (e) {
                console.error('[share] 降級失敗:', e);
                showToast('複製功能不支援', 'error');
            }
        } catch (e) {
            console.error('[share] 全部降級失敗:', e);
            // 不用 alert (避免 Hermes 視窗) 改用 toast
            showToast('分享失敗, 請手動複製', 'error');
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    loadShopData();
    bindScroll();
    bindPullToRefresh();
    bindCitySwitcher();
    bindShareButtons();
});


// === 照片 Modal ===
function openPhotoModal(shopIdx) {
    if (!window.SHOP_DATA[shopIdx]) return;
    const shop = window.SHOP_DATA[shopIdx];
    const photos = shop.photos || [];
    if (photos.length === 0) {
        showToast('這家店暫時沒有照片', 'info');
        return;
    }
    document.getElementById('photoModalTitle').textContent = shop.name + ' - ' + photos.length + ' 張照片';
    const grid = document.getElementById('photoGrid');
    grid.textContent = '';
    photos.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = shop.name;
        img.loading = 'lazy';
        grid.appendChild(img);
    });
    document.getElementById('photoModal').classList.add('show');
    lockBodyScroll();
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('show');
    unlockBodyScroll();
}

// 點背景關閉
document.getElementById('photoModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'photoModal') closePhotoModal();
});

window.openPhotoModal = openPhotoModal;
window.closePhotoModal = closePhotoModal;


// === 照片相簿 (簡約風) ===
let albumPhotos = [];
let albumIdx = 0;

function openAlbum(shopIdx) {
    if (!window.SHOP_DATA[shopIdx]) return;
    const shop = window.SHOP_DATA[shopIdx];
    albumPhotos = shop.photos || [];
    if (albumPhotos.length === 0) {
        showToast('這家店暫時沒有照片', 'info');
        return;
    }
    document.getElementById('albumTitle').textContent = shop.name + ' · ' + albumPhotos.length + ' 張';
    renderAlbumGrid();
    document.getElementById('albumModal').classList.add('show');
    lockBodyScroll();
}

function closeAlbum() {
    document.getElementById('albumModal').classList.remove('show');
    unlockBodyScroll();
}

function renderAlbumGrid() {
    const grid = document.getElementById('albumGrid');
    grid.textContent = '';
    albumPhotos.forEach((url, i) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.dataset.photoIdx = String(i);
        img.addEventListener('click', () => openAlbumViewer(i));
        grid.appendChild(img);
    });
}

function openAlbumViewer(idx) {
    albumIdx = idx;
    document.getElementById('albumViewerImg').src = albumPhotos[idx];
    document.getElementById('albumCounter').textContent = (idx + 1) + ' / ' + albumPhotos.length;
    document.getElementById('albumViewer').classList.add('show');
}

function closeAlbumViewer() {
    document.getElementById('albumViewer').classList.remove('show');
}

function albumPrev() {
    albumIdx = (albumIdx - 1 + albumPhotos.length) % albumPhotos.length;
    openAlbumViewer(albumIdx);
}

function albumNext() {
    albumIdx = (albumIdx + 1) % albumPhotos.length;
    openAlbumViewer(albumIdx);
}

window.openAlbum = openAlbum;
window.closeAlbum = closeAlbum;
window.openAlbumViewer = openAlbumViewer;
window.closeAlbumViewer = closeAlbumViewer;
window.albumPrev = albumPrev;
window.albumNext = albumNext;
