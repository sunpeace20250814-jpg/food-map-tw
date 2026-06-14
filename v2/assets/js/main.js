// main.js — 入口: 載入資料 → 渲染 UI → 綁定事件
import { loadAll, getShops, getShopById, getStationsByCity } from './data.js';
import { renderCityBar, switchCity, initDefaultCity, getCurrentCity } from './city.js';
import { renderLineFilter, renderMcatFilter, renderEnvFilter } from './filters.js';
import { renderAllCards } from './cards.js';
export function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}
import { applyFilter, bindFilterChips, renderStationChips, resetAllFilters, setQuickFilter } from './filters.js';
import { bindSheetClose, bindCardActions, closeShopSheet } from './sheet.js';
import { bindFavButtons, closeFavSheet, isFavorite, toggleFavorite } from './favorites.js';

// iOS-safe body scroll lock
let scrollLockCount = 0, scrollLockY = 0;
function lockBodyScroll() {
  if (scrollLockCount === 0) {
    scrollLockY = window.scrollY || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollLockY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount++;
}
function unlockBodyScroll() {
  if (scrollLockCount === 0) return;
  scrollLockCount--;
  if (scrollLockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollLockY);
  }
}
window.lockBodyScroll = lockBodyScroll;
window.unlockBodyScroll = unlockBodyScroll;

// Toast
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
window.showToast = showToast;
window.renderQuickBar = renderQuickBar;

// Tab switcher
function switchTab(tab) {
  closeShopSheet();
  closeFavSheet();
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  if (tab === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('[data-tab="home"]')?.classList.add('active');
  } else if (tab === 'filter') {
    const details = document.querySelector('.filter-details');
    if (details && !details.open) details.open = true;
    document.getElementById('filterPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      document.querySelector('[data-tab="home"]')?.classList.add('active');
    }, 500);
  } else if (tab === 'fav') {
    if (typeof openFavSheet === 'function') openFavSheet();
  } else if (tab === 'info') {
    const info = document.getElementById('infoSheet');
    if (info?.classList.contains('show')) { closeInfoSheet(); return; }
    info?.classList.add('show');
    lockBodyScroll();
  }
}
function closeInfoSheet() {
  document.getElementById('infoSheet')?.classList.remove('show');
  unlockBodyScroll();
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="home"]')?.classList.add('active');
}
window.switchTab = switchTab;
window.closeInfoSheet = closeInfoSheet;

// Search sheet
function openSearchSheet() {
  document.getElementById('searchSheet')?.classList.add('show');
  lockBodyScroll();
  setTimeout(() => document.getElementById('searchSheetInput')?.focus(), 100);
}
function closeSearchSheet() {
  document.getElementById('searchSheet')?.classList.remove('show');
  unlockBodyScroll();
}
window.openSearchSheet = openSearchSheet;
window.closeSearchSheet = closeSearchSheet;

// iOS sheet event bind
function bindSheet() {
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.sheet-close')) closeShopSheet();
    if (e.target.id === 'sheetBackdrop') closeShopSheet();
  });
}

// 更新 hero stats
function updateHeroStats() {
  const code = getCurrentCity();
  const shops = getShops().filter(s => s.city === code);
  const stations = getStationsByCity(code);
  const total = shops.length;
  const n24h = shops.filter(s => s.is_24h).length;
  const late = shops.filter(s => s.is_late_night).length;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('statTotal', total);
  setText('stat24h', n24h);
  setText('statLate', late);
  setText('statStations', stations.length);
}


// === 快速篩選 (動態生成, 依城市改變) ===
function renderQuickBar() {
  const bar = document.getElementById("quickBar");
  if (!bar) return;
  const code = getCurrentCity();
  const shops = getShops().filter(s => s.city === code);
  const tags = { queue: 0, latenight: 0, gifts: 0, view: 0, breakfast: 0, cafe: 0, souptype: 0, scenic: 0, local: 0 };
  shops.forEach(s => (s.tags || []).forEach(t => { if (tags[t] !== undefined) tags[t]++; }));
  // 統計主分類
  const cats = new Set();
  shops.forEach(s => { if (s.category) cats.add(s.category); });
  const catArr = [...cats].slice(0, 3);
  const catCounts = {};
  catArr.forEach(c => catCounts[c] = shops.filter(s => s.category === c).length);

  bar.textContent = "";
  const all = el("button", "quick-chip active");
  all.dataset.quick = "all";
  all.textContent = "全部 " + shops.length;
  bar.appendChild(all);
  // Late night (適用所有城市)
  bar.appendChild(makeQuickChip("latenight", "宵夜場", tags.latenight));
  // 早餐 (彰化爌肉飯文化)
  if (tags.breakfast) bar.appendChild(makeQuickChip("breakfast", "早餐限定", tags.breakfast));
  // 排隊名店
  if (tags.queue) bar.appendChild(makeQuickChip("queue", "排隊名店", tags.queue));
  // 伴手禮
  if (tags.gifts) bar.appendChild(makeQuickChip("gifts", "伴手禮", tags.gifts));
  // 景觀
  if (tags.view) bar.appendChild(makeQuickChip("view", "景觀", tags.view));
  // 火鍋燒肉 (CH/TN)
  if (tags.souptype) bar.appendChild(makeQuickChip("souptype", "火鍋燒肉", tags.souptype));
  // 咖啡 (TN/KH)
  if (tags.cafe) bar.appendChild(makeQuickChip("cafe", "咖啡廳", tags.cafe));
  // 動態主分類 (前3個)
  Object.entries(catCounts).forEach(([cat, count]) => {
    bar.appendChild(makeQuickChip("cat:" + cat, cat, count));
  });
  // 綁定
  bar.querySelectorAll(".quick-chip").forEach(c => c.addEventListener("click", () => handleQuickClick(c)));
}

function makeQuickChip(value, label, count) {
  const c = el("button", "quick-chip");
  c.dataset.quick = value;
  c.textContent = label + " " + (count || 0);
  return c;
}

function handleQuickClick(chip) {
  const q = chip.dataset.quick;
  const allChips = document.querySelectorAll(".quick-chip");
  allChips.forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  if (q === "all") { resetAllFilters(); return; }
  if (q.startsWith("cat:")) {
    setQuickFilter("mcat", q.substring(4));
  } else {
    setQuickFilter("env", q);
  }
}

// 主 init
async function init() {
  try {
    // 1. 載入所有資料
    const { cities } = await loadAll();
    window.SHOP_DATA = getShops();

    // 2. 渲染縣市切換器
    renderCityBar();

    // 3. 綁定所有事件 (靜態 chips)
    bindFilterChips();
    bindFavButtons();
    bindSheet();
    bindSheetClose();
    bindCardActions();

    // 4. 搜尋按鈕
    document.getElementById('searchBtn')?.addEventListener('click', openSearchSheet);

    // 5. 預設縣市 (第一個)
    initDefaultCity();

    // 5.5. 渲染動態篩選 chips (依當前縣市)
    renderLineFilter();
    renderMcatFilter();
    renderEnvFilter();
    renderQuickBar();

    // 6. 渲染卡片
    renderAllCards(getShops());
    renderStationChips();
    updateHeroStats();
    applyFilter();

    // 7. 監聽縣市切換
    window.addEventListener('city:changed', () => {
      renderLineFilter();
      renderMcatFilter();
      renderEnvFilter();
      renderQuickBar();
      renderStationChips();
      updateHeroStats();
      // 重新渲染卡片 (依當前縣市篩選)
      const code = getCurrentCity();
      const cityShops = getShops().filter(s => s.city === code);
      renderAllCards(cityShops);
      applyFilter();
    });

    console.log('[main.js] Init OK. Total shops: ' + getShops().length);
  } catch (e) {
    console.error('[main.js] Init failed:', e);
    document.getElementById('shopList').innerHTML = '<p style="padding:40px;text-align:center;color:#e74c3c;">資料載入失敗，請重新整理</p>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
