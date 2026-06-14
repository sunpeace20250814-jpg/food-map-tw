// favorites.js — localStorage 收藏
import { getShopById } from './data.js';

const FAV_KEY = 'yeoha_favorites_v1';

function getLocal() {
  try { const raw = localStorage.getItem(FAV_KEY); return raw ? JSON.parse(raw) : []; }
  catch (e) { return []; }
}
function saveLocal(arr) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); }
  catch (e) { console.error('Failed to save favorites', e); }
}
export function isFavorite(shopId) {
  return getLocal().some(f => f.id === shopId);
}
export function toggleFavorite(shopId) {
  const favs = getLocal();
  const idx = favs.findIndex(f => f.id === shopId);
  if (idx >= 0) { favs.splice(idx, 1); saveLocal(favs); return false; }
  const shop = getShopById(shopId);
  if (!shop) return false;
  favs.push(shop); saveLocal(favs); return true;
}
export function getFavorites() { return getLocal(); }

function updateFavBadge() {
  const badge = document.getElementById('favBadge');
  if (!badge) return;
  const count = getLocal().length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'block' : 'none';
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}

function renderFavList() {
  const list = document.getElementById('favList');
  if (!list) return;
  const favs = getLocal();
  list.textContent = '';
  if (favs.length === 0) {
    const p = el('p', 'fav-empty');
    p.appendChild(document.createTextNode('尚未收藏店家'));
    p.appendChild(el('br'));
    p.appendChild(document.createTextNode('點擊店家卡片右上角的愛心即可收藏'));
    list.appendChild(p);
    return;
  }
  favs.forEach(s => {
    const card = el('article', 'shop-card');
    card.dataset.shopId = s.id;
    const header = el('div', 'card-header');
    const titleBox = el('div', 'card-title');
    if (s.emoji) titleBox.appendChild(el('span', 'card-emoji', s.emoji));
    const nameWrap = el('div', 'card-name-wrap');
    nameWrap.appendChild(el('h3', 'card-name', s.name));
    nameWrap.appendChild(el('span', 'card-cat-sub', s.category + (s.subcategory ? ' \u00b7 ' + s.subcategory : '')));
    titleBox.appendChild(nameWrap);
    header.appendChild(titleBox);
    card.appendChild(header);
    const meta = el('div', 'card-meta');
    if (s.station_name) meta.appendChild(el('span', 'mrt-tag', s.station_name));
    card.appendChild(meta);
    if (s.feature) card.appendChild(el('p', 'card-feature', s.feature));
    const footer = el('div', 'card-footer');
    if (s.tags && s.tags.length) {
      const envBox = el('div', 'env-badges');
      s.tags.forEach(b => envBox.appendChild(el('span', 'env-badge', b)));
      footer.appendChild(envBox);
    }
    const priceInfo = el('div', 'price-info');
    priceInfo.appendChild(el('span', 'price-emoji', ''));
    priceInfo.appendChild(el('span', 'price-bar', s.price_level || ''));
    priceInfo.appendChild(el('span', 'price-range', s.price_range || ''));
    footer.appendChild(priceInfo);
    card.appendChild(footer);
    card.addEventListener('click', () => {
      closeFavSheet();
      if (typeof window.openShopSheet === 'function') window.openShopSheet(s.id);
    });
    list.appendChild(card);
  });
}

export function openFavSheet() {
  renderFavList();
  document.getElementById('favSheet')?.classList.add('show');
  if (typeof window.lockBodyScroll === 'function') window.lockBodyScroll();
}
export function closeFavSheet() {
  document.getElementById('favSheet')?.classList.remove('show');
  if (typeof window.unlockBodyScroll === 'function') window.unlockBodyScroll();
}
window.closeFavSheet = closeFavSheet;
window.openFavSheet = openFavSheet;
window.toggleFavorite = toggleFavorite;

export function bindFavButtons() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="fav"]');
    if (!btn) return;
    e.stopPropagation();
    const shopId = btn.dataset.shopId;
    const nowFav = toggleFavorite(shopId);
    btn.textContent = nowFav ? '\u2665' : '\u2661';
    btn.classList.toggle('active', nowFav);
    updateFavBadge();
  });
  document.getElementById('favBtn')?.addEventListener('click', openFavSheet);
  updateFavBadge();
}
