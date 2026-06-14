// filters.js — 篩選邏輯 (DOM-driven, 從 .shop-card data-* 讀)
import { getStationsByCity, getCities, getShops } from './data.js';
import { getCurrentCity } from './city.js';

let currentLine = 'all', currentLate = 'all', currentPrice = 'all';
let currentMcat = 'all', currentEnv = 'all', currentStation = 'all';
let currentSearch = '', currentQuick = 'all';

export function applyFilter() {
  const cards = document.querySelectorAll('.shop-card');
  let visible = 0;
  cards.forEach(card => {
    const line = card.dataset.line || '';
    const price = card.dataset.price || '';
    const station = card.dataset.station || '';
    const mcat = card.dataset.mcat || '';
    const env = card.dataset.env || '';
    const late = card.dataset.late === '1';
    const t22start = card.dataset['22start'] === '1';
    const text = card.textContent.toLowerCase();
    const cardCity = card.dataset.city || 'kh';

    let show = true;
    if (window.currentCity && cardCity !== window.currentCity) show = false;
    if (show && currentLine !== 'all' && line !== currentLine) show = false;
    if (show && currentPrice !== 'all' && price !== currentPrice) show = false;
    if (show && currentMcat !== 'all' && mcat !== currentMcat) show = false;
    if (show && currentEnv !== 'all' && !env.includes(currentEnv)) show = false;
    if (show && currentStation !== 'all' && station !== currentStation) show = false;
    if (show && currentSearch && !text.includes(currentSearch)) show = false;
    if (show && currentLate === '22+' && !late) show = false;
    if (show && currentLate === '24h' && !text.includes('24 小時')) show = false;
    if (show && currentLate === '22start' && !t22start) show = false;
    if (show && currentLate === 'midnight' && !text.match(/凌晨 0[3-9]|凌晨 1[0-9]|凌晨 2[0-9]:[0-9]{2}/)) show = false;

    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  const elCount = document.getElementById('resultCount');
  if (elCount) elCount.textContent = visible;
  updateQuickBarCounts();
  const empty = document.getElementById('emptyState');
  const skel = document.getElementById('skeletonList');
  if (skel) skel.style.display = 'none';
  if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  updateActiveFilterCount();
  applySort();
}

function updateQuickBarCounts() {
  const cards = document.querySelectorAll('.shop-card');
  const currentCity = window.currentCity || 'kh';
  let all = 0, n24h = 0, late = 0, hotpot = 0, izakaya = 0, snack = 0, ac = 0;
  cards.forEach(c => {
    if (c.style.display === 'none') return;
    if (c.dataset.city !== currentCity) return;
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
  setText('.quick-chip[data-quick="all"]', '全部 ' + all);
  setText('.quick-chip[data-quick="24h"]', '24hr ' + n24h);
  setText('.quick-chip[data-quick="22start"]', '未打烊中 ' + late);
  setText('.quick-chip[data-quick="hotpot"]', '火鍋 ' + hotpot);
  setText('.quick-chip[data-quick="izakaya"]', '日式 ' + izakaya);
  setText('.quick-chip[data-quick="snack"]', ' 小吃 ' + snack);
  setText('.quick-chip[data-quick="ac"]', '有冷氣 ' + ac);
}

function applySort() {
  const sortBy = document.getElementById('sortSelect')?.value;
  if (!sortBy || sortBy === 'default') return;
  const list = document.getElementById('shopList');
  const cards = Array.from(list.querySelectorAll('.shop-card'));
  cards.sort((a, b) => {
    if (sortBy === 'price-asc') return (a.dataset.price.length) - (b.dataset.price.length);
    if (sortBy === 'price-desc') return (b.dataset.price.length) - (a.dataset.price.length);
    if (sortBy === 'name') return a.querySelector('.card-name').textContent.localeCompare(b.querySelector('.card-name').textContent);
    return 0;
  });
  cards.forEach(c => list.appendChild(c));
}

function updateActiveFilterCount() {
  let count = 0;
  if (currentLine !== 'all') count++;
  if (currentLate !== 'all') count++;
  if (currentPrice !== 'all') count++;
  if (currentMcat !== 'all') count++;
  if (currentEnv !== 'all') count++;
  if (currentStation !== 'all') count++;
  if (currentSearch) count++;
  const el = document.getElementById('filterActiveCount');
  if (!el) return;
  if (count > 0) { el.textContent = count; el.classList.add('show'); } else { el.classList.remove('show'); }
}

export function resetAllFilters() {
  currentLine = 'all'; currentLate = 'all'; currentPrice = 'all';
  currentMcat = 'all'; currentEnv = 'all'; currentStation = 'all';
  currentSearch = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const ssi = document.getElementById('searchSheetInput');
  if (ssi) ssi.value = '';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('[data-line-filter="all"], [data-late-filter="all"], [data-price-filter="all"], [data-type-filter="all"], [data-mcat-filter="all"], [data-env-filter="all"]')
    .forEach(c => c.classList.add('active'));
  document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.quick-chip[data-quick="all"]').forEach(c => c.classList.add('active'));
  document.querySelectorAll('.station-chip').forEach(c => c.classList.remove('active'));
  const sel = document.getElementById('sortSelect');
  if (sel) sel.value = 'default';
  applyFilter();
  if (typeof showToast === 'function') showToast('已重設全部篩選', 'info');
}
window.resetAllFilters = resetAllFilters;

// 渲染 station chips (從 data 動態)
export function renderStationChips() {
  const container = document.getElementById('stationChips');
  if (!container) return;
  const stations = getStationsByCity(getCurrentCity());
  container.textContent = '';
  stations.forEach(s => {
    const chip = document.createElement('span');
    chip.className = 'chip station-chip';
    chip.dataset.station = s.name;
    chip.textContent = s.name + ' (' + s.shop_count + ')';
    container.appendChild(chip);
  });
  container.querySelectorAll('.station-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const wasActive = chip.classList.contains('active');
      container.querySelectorAll('.station-chip').forEach(c => c.classList.remove('active'));
      if (!wasActive) { chip.classList.add('active'); currentStation = chip.dataset.station; } else { currentStation = 'all'; }
      applyFilter();
    });
  });
}

// 暴露給其他模組讀

// Set filter from quick-bar (called from main.js)
export function setQuickFilter(kind, value) {
  if (kind === "env") currentEnv = value;
  else if (kind === "mcat") currentMcat = value;
  else if (kind === "all") {
    currentEnv = "all";
    currentMcat = "all";
    currentLate = "all";
  }
  applyFilter();
}

export const _state = () => ({ currentLine, currentLate, currentPrice, currentMcat, currentEnv, currentStation, currentSearch, currentQuick });

// Chip bindings (run once after DOM ready)
export function bindFilterChips() {
  document.querySelectorAll('[data-line-filter]').forEach(c => c.addEventListener('click', () => {
    currentLine = c.dataset.lineFilter;
    document.querySelectorAll('[data-line-filter]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilter();
  }));
  document.querySelectorAll('[data-late-filter]').forEach(c => c.addEventListener('click', () => {
    currentLate = c.dataset.lateFilter;
    document.querySelectorAll('[data-late-filter]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilter();
  }));
  document.querySelectorAll('[data-price-filter]').forEach(c => c.addEventListener('click', () => {
    currentPrice = c.dataset.priceFilter;
    document.querySelectorAll('[data-price-filter]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilter();
  }));
  document.querySelectorAll('[data-mcat-filter]').forEach(c => c.addEventListener('click', () => {
    currentMcat = c.dataset.mcatFilter;
    document.querySelectorAll('[data-mcat-filter]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilter();
  }));
  document.querySelectorAll('[data-env-filter]').forEach(c => c.addEventListener('click', () => {
    currentEnv = c.dataset.envFilter;
    document.querySelectorAll('[data-env-filter]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilter();
  }));
  document.querySelectorAll('.quick-chip').forEach(c => c.addEventListener('click', () => {
    const q = c.dataset.quick;
    currentQuick = q;
    if (q === 'all') { resetAllFilters(); return; }
    document.querySelectorAll('.quick-chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    if (q === '24h') currentLate = '24h';
    else if (q === '22start') currentLate = '22start';
    else if (q === 'hotpot') currentMcat = '火鍋';
    else if (q === 'izakaya') currentMcat = '居酒屋/日式';
    else if (q === 'snack') currentMcat = '小吃/夜市';
    else if (q === 'ac') currentEnv = 'ac';
    applyFilter();
  }));
  const ss = document.getElementById('searchInput');
  if (ss) ss.addEventListener('input', () => { currentSearch = ss.value.toLowerCase(); applyFilter(); });
  const ssi2 = document.getElementById('searchSheetInput');
  if (ssi2) ssi2.addEventListener('input', () => { currentSearch = ssi2.value.toLowerCase(); applyFilter(); });
  const sort = document.getElementById('sortSelect');
  if (sort) sort.addEventListener('change', applySort);
  const reset = document.getElementById('resetBtn');
  if (reset) reset.addEventListener('click', resetAllFilters);
}

// === 動態篩選 chip 渲染 (依城市改變) ===

// 捷運線 / 交通 filter: KH 顯示 3 條線; TN/CH 顯示 1 條「區域」或隱藏
export function renderLineFilter() {
  const city = getCities()[getCurrentCity()];
  const row = document.getElementById('lineFilterRow');
  const chips = document.getElementById('lineFilterChips');
  const label = document.getElementById('lineFilterLabel');
  if (!row || !chips || !city) return;

  if (city.has_mrt && city.lines.length > 0) {
    row.style.display = '';
    label.textContent = '捷運線';
    chips.textContent = '';
    const allChip = document.createElement('span');
    allChip.className = 'chip active';
    allChip.dataset.lineFilter = 'all';
    allChip.textContent = '全部';
    chips.appendChild(allChip);
    city.lines.forEach(line => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.dataset.lineFilter = line.id;
      const colorDot = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + line.color + ';margin-right:4px;vertical-align:middle"></span>';
      c.innerHTML = colorDot + line.name;
      chips.appendChild(c);
    });
    // rebind click handlers
    chips.querySelectorAll('[data-line-filter]').forEach(c => c.addEventListener('click', () => {
      currentLine = c.dataset.lineFilter;
      chips.querySelectorAll('[data-line-filter]').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      applyFilter();
    }));
  } else if (city.code === 'ch') {
    // 彰化: 顯示 1 個「鄉鎮」chip (不可篩選, 純標示)
    row.style.display = '';
    label.textContent = '分區';
    chips.textContent = '';
    const c = document.createElement('span');
    c.className = 'chip active';
    c.dataset.lineFilter = 'all';
    c.textContent = '8 個鄉鎮';
    chips.appendChild(c);
  } else {
    // 其他: 隱藏
    row.style.display = 'none';
  }
  // 重設 line filter 為 all
  currentLine = 'all';
}

// 類型 (mcat) filter: 從當前城市的店家資料動態生成
export function renderMcatFilter() {
  const cityCode = getCurrentCity();
  const shops = getShops().filter(s => s.city === cityCode);
  const cats = new Set();
  shops.forEach(s => { if (s.category) cats.add(s.category); });
  const sortedCats = [...cats].sort();
  const chips = document.getElementById('mcatFilterChips');
  const label = document.getElementById('mcatFilterLabel');
  if (!chips) return;
  if (label) label.textContent = cityCode === 'ch' ? '類型' : '類型';
  chips.textContent = '';
  const allChip = document.createElement('span');
  allChip.className = 'chip active';
  allChip.dataset.mcatFilter = 'all';
  allChip.textContent = '全部';
  chips.appendChild(allChip);
  sortedCats.forEach(cat => {
    const c = document.createElement('span');
    c.className = 'chip';
    c.dataset.mcatFilter = cat;
    c.textContent = cat;
    chips.appendChild(c);
  });
  // rebind
  chips.querySelectorAll('[data-mcat-filter]').forEach(c => c.addEventListener('click', () => {
    currentMcat = c.dataset.mcatFilter;
    chips.querySelectorAll('[data-mcat-filter]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilter();
  }));
  currentMcat = 'all';
}

// 環境 (env) filter: 從當前城市的店家 tags 動態生成
export function renderEnvFilter() {
  const cityCode = getCurrentCity();
  const shops = getShops().filter(s => s.city === cityCode);
  const tags = new Set();
  shops.forEach(s => (s.tags || []).forEach(t => tags.add(t)));
  const sortedTags = [...tags].sort();
  const chips = document.getElementById('envFilterChips');
  if (!chips) return;
  chips.textContent = '';
  const allChip = document.createElement('span');
  allChip.className = 'chip active';
  allChip.dataset.envFilter = 'all';
  allChip.textContent = '全部';
  chips.appendChild(allChip);
  const labelMap = { ac: '冷氣', ind: '室內', out: '戶外', open: '開放空間', late: '深夜', scenic: '景觀', hotpot: '聚餐', local: '在地', breakfast: '早餐', cafe: '咖啡' };
  sortedTags.forEach(tag => {
    const c = document.createElement('span');
    c.className = 'chip';
    c.dataset.envFilter = tag;
    c.textContent = labelMap[tag] || tag;
    chips.appendChild(c);
  });
  chips.querySelectorAll('[data-env-filter]').forEach(c => c.addEventListener('click', () => {
    currentEnv = c.dataset.envFilter;
    chips.querySelectorAll('[data-env-filter]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilter();
  }));
  currentEnv = 'all';
}
