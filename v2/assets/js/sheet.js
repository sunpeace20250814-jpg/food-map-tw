// sheet.js — 店家詳情底部 sheet
import { getShopById } from './data.js';

const TODAY_WEEKDAYS = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
function todayKey() { return TODAY_WEEKDAYS[new Date().getDay()]; }

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}

function lockBodyScroll() {
  if (typeof window.lockBodyScroll === 'function') window.lockBodyScroll();
}
function unlockBodyScroll() {
  if (typeof window.unlockBodyScroll === 'function') window.unlockBodyScroll();
}

export function openShopSheet(shopId) {
  const shop = typeof shopId === 'string' ? getShopById(shopId) : shopId;
  if (!shop) return;
  const sheet = document.getElementById('shopSheet');
  const content = document.getElementById('sheetContent');
  if (!sheet || !content) return;
  content.textContent = '';

  // 標題 (無圖片)
  const header = el('div', 'sheet-header');
  const titleBox = el('div', 'sheet-title-box');
  titleBox.appendChild(el('h2', 'sheet-title', shop.name));
  const subText = [shop.category, shop.subcategory].filter(Boolean).join(' \u00b7 ');
  if (subText) titleBox.appendChild(el('div', 'sheet-subtitle', subText));
  header.appendChild(titleBox);
  content.appendChild(header);

  // 地址 + 地圖連結
  if (shop.address) {
    const addrSec = el('div', 'sheet-section');
    addrSec.appendChild(el('div', 'sheet-section-label', '地址'));
    const p = el('p', null, shop.address);
    addrSec.appendChild(p);
    if (shop.gmaps_url) {
      const a = document.createElement('a');
      a.className = 'btn btn-map';
      a.href = shop.gmaps_url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = '在 Google 地圖開啟';
      addrSec.appendChild(a);
    }
    content.appendChild(addrSec);
  }

  // 營業時間 (一週)
  if (shop.weekly_hours && Object.keys(shop.weekly_hours).length > 0) {
    const weekSec = el('div', 'sheet-section');
    weekSec.appendChild(el('div', 'sheet-section-label', '一週時間'));
    const weekBox = el('div', 'weekly-hours');
    const today = todayKey();
    ['星期一','星期二','星期三','星期四','星期五','星期六','星期日'].forEach(day => {
      const h = shop.weekly_hours[day];
      const isClosed = h === '休息' || h === '公休';
      const isToday = day === today;
      const row = el('div', 'hours-row' + (isClosed ? ' hours-closed' : '') + (isToday ? ' hours-today' : ''));
      row.appendChild(el('span', 'hours-day', day + (isToday ? ' \u00b7 今天' : '')));
      row.appendChild(el('span', 'hours-time', h || '未提供'));
      weekBox.appendChild(row);
    });
    weekSec.appendChild(weekBox);
    content.appendChild(weekSec);
  }

  // 特色
  if (shop.feature) {
    const fSec = el('div', 'sheet-section');
    fSec.appendChild(el('div', 'sheet-section-label', '特色'));
    fSec.appendChild(el('p', null, shop.feature));
    content.appendChild(fSec);
  }

  // 標籤
  if (shop.tags && shop.tags.length) {
    const tSec = el('div', 'sheet-section');
    tSec.appendChild(el('div', 'sheet-section-label', '環境'));
    const tagBox = el('div', 'sheet-tags');
    const labelMap = { ac: '冷氣', ind: '室內', out: '戶外', open: '開放空間' };
    shop.tags.forEach(t => tagBox.appendChild(el('span', 'sheet-tag', labelMap[t] || t)));
    tSec.appendChild(tagBox);
    content.appendChild(tSec);
  }

  // 收藏 + 分享
  const actionSec = el('div', 'sheet-actions');
  const favBtn = el('button', 'btn-fav-sheet');
  const isFav = window.toggleFavorite && (() => { try { return JSON.parse(localStorage.getItem('yeoha_favorites_v1') || '[]').some(f => f.id === shop.id); } catch (e) { return false; }})();
  favBtn.textContent = isFav ? '\u2665 已收藏' : '\u2661 收藏';
  favBtn.addEventListener('click', () => {
    if (typeof window.toggleFavorite === 'function') {
      const nowFav = window.toggleFavorite(shop.id);
      favBtn.textContent = nowFav ? '\u2665 已收藏' : '\u2661 收藏';
    }
  });
  actionSec.appendChild(favBtn);
  const shareBtn = el('button', 'btn btn-share', '↗ 分享');
  shareBtn.addEventListener('click', () => {
    const url = shop.gmaps_url || location.href;
    if (navigator.share) { navigator.share({ title: shop.name, url }).catch(() => {}); }
    else { navigator.clipboard?.writeText(url).then(() => { if (typeof showToast === 'function') showToast('連結已複製', 'info'); }); }
  });
  actionSec.appendChild(shareBtn);
  content.appendChild(actionSec);

  sheet.classList.add('show');
  sheet.setAttribute('aria-hidden', 'false');
  lockBodyScroll();
}
window.openShopSheet = openShopSheet;

export function closeShopSheet() {
  document.getElementById('shopSheet')?.classList.remove('show');
  document.getElementById('shopSheet')?.setAttribute('aria-hidden', 'true');
  unlockBodyScroll();
}
window.closeShopSheet = closeShopSheet;

export function bindSheetClose() {
  document.querySelectorAll('[data-action="close-sheet"]').forEach(b => b.addEventListener('click', closeShopSheet));
  document.getElementById('sheetBackdrop')?.addEventListener('click', closeShopSheet);
}

export function bindCardActions() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const shopId = btn.dataset.shopId;
    if (action === 'detail') openShopSheet(shopId);
    else if (action === 'album') openAlbum(shopId);
    else if (action === 'share') {
      const shop = getShopById(shopId);
      if (!shop) return;
      const url = shop.gmaps_url || location.href;
      if (navigator.share) { navigator.share({ title: shop.name, url }).catch(() => {}); }
      else { navigator.clipboard?.writeText(url).then(() => { if (typeof showToast === 'function') showToast('連結已複製', 'info'); }); }
    }
  });
}

let albumState = { shopId: null, photos: [], index: 0 };
export function openAlbum(shopId) {
  const shop = getShopById(shopId);
  if (!shop || !shop.photos || !shop.photos.length) return;
  albumState = { shopId, photos: shop.photos, index: 0 };
  const modal = document.getElementById('albumModal');
  const grid = document.getElementById('albumGrid');
  const title = document.getElementById('albumTitle');
  if (!modal || !grid || !title) return;
  title.textContent = shop.name + ' (\u00d7 ' + shop.photos.length + ')';
  grid.textContent = '';
  shop.photos.forEach((url, i) => {
    const t = el('div', 'album-grid-item');
    t.dataset.idx = i;
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.loading = 'lazy';
    t.appendChild(img);
    t.addEventListener('click', () => openAlbumViewer(i));
    grid.appendChild(t);
  });
  modal.classList.add('show');
  lockBodyScroll();
}
window.openAlbum = openAlbum;
export function closeAlbum() {
  document.getElementById('albumModal')?.classList.remove('show');
  unlockBodyScroll();
}
window.closeAlbum = closeAlbum;
export function openAlbumViewer(idx) {
  if (!albumState.photos.length) return;
  albumState.index = idx;
  document.getElementById('albumViewerImg').src = albumState.photos[idx];
  document.getElementById('albumCounter').textContent = (idx + 1) + ' / ' + albumState.photos.length;
  document.getElementById('albumViewer')?.classList.add('show');
}
window.openAlbumViewer = openAlbumViewer;
export function closeAlbumViewer() {
  document.getElementById('albumViewer')?.classList.remove('show');
}
window.closeAlbumViewer = closeAlbumViewer;
export function albumPrev() {
  if (!albumState.photos.length) return;
  openAlbumViewer((albumState.index - 1 + albumState.photos.length) % albumState.photos.length);
}
window.albumPrev = albumPrev;
export function albumNext() {
  if (!albumState.photos.length) return;
  openAlbumViewer((albumState.index + 1) % albumState.photos.length);
}
window.albumNext = albumNext;
