// ============================================
// filters.js - 篩選邏輯 (卡片版)
// ============================================

function applyFilter() {
    const cards = document.querySelectorAll('.shop-card');
    let visible = 0;
    cards.forEach(card => {
        const line = card.dataset.line || '';
        const price = card.dataset.price || '';
        const station = card.dataset.station || '';
        const type = card.dataset.type || '';
        const mcat = card.dataset.mcat || '';
        const env = card.dataset.env || '';
        const late = card.dataset.late === '1';
        const t22start = card.dataset['22start'] === '1';
        const text = card.textContent.toLowerCase();

        let show = true;
        if (currentLine !== 'all' && line !== currentLine) show = false;
        if (currentPrice !== 'all' && price !== currentPrice) show = false;
        if (currentType !== 'all' && !type.includes(currentType)) show = false;
        if (currentMcat !== 'all' && !mcat.includes(currentMcat)) show = false;
        if (currentEnv !== 'all' && !env.includes(currentEnv)) show = false;
        if (currentStation !== 'all' && station !== currentStation) show = false;
        if (currentSearch && !text.includes(currentSearch)) show = false;

        if (currentLate === '22+' && !late) show = false;
        if (currentLate === '24h' && !text.includes('24 小時')) show = false;
        if (currentLate === '22start' && !t22start) show = false;
        if (currentLate === 'midnight' &&
            !text.match(/凌晨 0[3-9]/) &&
            !text.match(/凌晨 1/) &&
            !text.match(/凌晨 2[0-9]:[0-9]{2}/)) show = false;

        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    // 結果計數
    document.getElementById('resultCount').textContent = visible;

    // === 更新 quick-bar 計數(動態從卡片 DOM 統計) ===
    updateQuickBarCounts();

    // 空狀態
    const empty = document.getElementById('emptyState');
    const skeleton = document.getElementById('skeletonList');
    if (skeleton) skeleton.style.display = 'none';
    if (visible === 0) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
    }

    // 更新 active 篩選計數
    updateActiveFilterCount();

    // 排序
    applySort();
}

// 動態更新 quick-bar 計數(避免 hardcode 數字錯誤)
function updateQuickBarCounts() {
    const cards = document.querySelectorAll('.shop-card');
    let all = 0, n24h = 0, late = 0, hotpot = 0, izakaya = 0, snack = 0, ac = 0;
    cards.forEach(c => {
        all++;
        if (c.dataset.late === '1' && c.textContent.indexOf('24 小時') >= 0) n24h++;
        if (c.dataset.late === '1') late++;
        if (c.dataset.mcat === '火鍋') hotpot++;
        if (c.dataset.mcat === '居酒屋/日式') izakaya++;
        if (c.dataset.mcat === '小吃/夜市') snack++;
        const env = (c.dataset.env || '').split(',');
        if (env.indexOf('ac') >= 0) ac++;
    });
    const setText = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
    setText('.quick-chip[data-quick="all"]', `全部 ${all}`);
    setText('.quick-chip[data-quick="24h"]', `24hr ${n24h}`);
    setText('.quick-chip[data-quick="22start"]', `未打烊中 ${late}`);
    setText('.quick-chip[data-quick="hotpot"]', `火鍋 ${hotpot}`);
    setText('.quick-chip[data-quick="izakaya"]', `日式 ${izakaya}`);
    setText('.quick-chip[data-quick="snack"]', `小吃 ${snack}`);
    setText('.quick-chip[data-quick="ac"]', `有冷氣 ${ac}`);
}

function applySort() {
    const sortBy = document.getElementById('sortSelect').value;
    if (sortBy === 'default') return;
    const list = document.getElementById('shopList');
    const cards = Array.from(list.querySelectorAll('.shop-card'));
    cards.sort((a, b) => {
        if (sortBy === 'price-asc') {
            return (a.dataset.price.length) - (b.dataset.price.length);
        }
        if (sortBy === 'price-desc') {
            return (b.dataset.price.length) - (a.dataset.price.length);
        }
        if (sortBy === 'name') {
            return a.querySelector('.card-name').textContent.localeCompare(b.querySelector('.card-name').textContent);
        }
        return 0;
    });
    cards.forEach(c => list.appendChild(c));
}

function updateActiveFilterCount() {
    let count = 0;
    if (currentLine !== 'all') count++;
    if (currentLate !== 'all') count++;
    if (currentPrice !== 'all') count++;
    if (currentType !== 'all') count++;
    if (currentMcat !== 'all') count++;
    if (currentEnv !== 'all') count++;
    if (currentStation !== 'all') count++;
    if (currentSearch) count++;
    const el = document.getElementById('filterActiveCount');
    if (count > 0) {
        el.textContent = count;
        el.classList.add('show');
    } else {
        el.classList.remove('show');
    }
}

function resetAllFilters() {
    currentLine = 'all';
    currentLate = 'all';
    currentPrice = 'all';
    currentType = 'all';
    currentMcat = 'all';
    currentEnv = 'all';
    currentStation = 'all';
    currentSearch = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const searchSheetInput = document.getElementById('searchSheetInput');
    if (searchSheetInput) searchSheetInput.value = '';

    // 重設所有 chip active
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('[data-line-filter="all"], [data-late-filter="all"], [data-price-filter="all"], [data-type-filter="all"], [data-mcat-filter="all"], [data-env-filter="all"]')
        .forEach(c => c.classList.add('active'));
    document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.quick-chip[data-quick="all"]').forEach(c => c.classList.add('active'));

    // 重設 station chips
    document.querySelectorAll('.station-chip').forEach(c => c.classList.remove('active'));

    // 重設排序
    document.getElementById('sortSelect').value = 'default';

    applyFilter();
    showToast('已重設全部篩選', 'info');
}
