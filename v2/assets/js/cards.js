// cards.js — 店家卡片渲染
import { getShopById } from './data.js';

export function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}

// 把相對/絕對 lh3 url 都正規化成 https:// 完整網址
function normalizePhotoUrl(u) {
  if (!u) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('lh3.googleusercontent.com')) return 'https://' + u;
  return u;
}

const TODAY_WEEKDAYS = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
function todayKey() { return TODAY_WEEKDAYS[new Date().getDay()]; }

function formatHoursLabel(shop) {
  if (!shop || !shop.weekly_hours) return null;
  const v = shop.weekly_hours[todayKey()];
  if (!v || v === '請參考說明') return null;
  return v;
}

export function renderCard(shop) {
  const card = el('article', 'shop-card');
  card.dataset.shopId = shop.id;
  card.dataset.city = shop.city;
  // 兼容 v1 (station/line/price_bar/cat_main) 與 v2 (station_name/line/price_level/category) 兩種命名
  const line = shop.line || null;
  const stationName = shop.station_name || shop.station || '';
  const priceLevel = shop.price_level || shop.price_bar || '';
  const category = shop.category || shop.cat_main || '';
  const subcategory = shop.subcategory || shop.cat_sub || '';
  const tags = shop.tags || shop.env || [];
  if (line) card.dataset.line = line;
  if (stationName) card.dataset.station = stationName;
  if (priceLevel) card.dataset.price = priceLevel;
  if (category) card.dataset.mcat = category;
  if (tags.length) card.dataset.env = tags.join(',');
  // late/22start 兩種命名都支援
  const isLate = shop.is_late_night === true || shop.late === true || shop.late === '1' || shop.late === 1;
  const opens22 = shop.opens_22 === true || shop.late22 === true || shop['22start'] === '1' || shop['22start'] === 1;
  const isNonLate = shop.is_non_late === true || shop.non_late === '1' || shop.non_late === 1;
  if (isLate) card.dataset.late = '1';
  if (isNonLate) card.dataset.nonLate = '1';
  if (opens22) card.dataset['22start'] = '1';

  const top = el('div', 'card-top');
  const titleBlock = el('div', 'card-title-block');
  titleBlock.appendChild(el('h3', 'card-name', shop.name));
  const metaLine = el('div', 'card-meta-line');
  const primaryLabel = subcategory || category || '';
  if (primaryLabel) metaLine.appendChild(el('span', null, primaryLabel));
  if (category && subcategory && subcategory !== category) {
    metaLine.appendChild(el('span', 'dot'));
    metaLine.appendChild(el('span', 'cat-sub', category));
  }
  if (stationName) {
    metaLine.appendChild(el('span', 'dot'));
    const mrt = el('span', 'tag tag-mrt', stationName);
    if (shop.district && stationName !== shop.district) mrt.title = shop.district;
    metaLine.appendChild(mrt);
  }
  titleBlock.appendChild(metaLine);
  top.appendChild(titleBlock);

  const right = el('div', 'card-right');
  const favBtn = el('button', 'card-fav');
  favBtn.setAttribute('aria-label', '收藏');
  favBtn.dataset.action = 'fav';
  favBtn.dataset.shopId = shop.id;
  favBtn.textContent = '\u2661';
  right.appendChild(favBtn);
  if (shop.rating) {
    const rating = el('div', 'card-rating');
    rating.appendChild(el('span', 'star', '\u2605'));
    rating.appendChild(document.createTextNode(' '));
    rating.appendChild(el('span', 'num', String(shop.rating)));
    if (shop.review_count) {
      rating.appendChild(document.createTextNode(' '));
      rating.appendChild(el('span', 'num', '(' + shop.review_count + ')'));
    }
    right.appendChild(rating);
  }
  top.appendChild(right);
  card.appendChild(top);

  const hoursLabel = formatHoursLabel(shop);
  if (hoursLabel) {
    const infoRow = el('div', 'card-info-row');
    const tag = el('span', 'tag tag-time');
    tag.textContent = hoursLabel;
    if (hoursLabel === '今日休息') tag.classList.add('tag-time-closed');
    else if (hoursLabel === '24 小時營業') tag.classList.add('tag-time-24h');
    else tag.classList.add('tag-time-open');
    infoRow.appendChild(tag);
    if (tags.includes('queue')) infoRow.appendChild(el('span', 'tag tag-badge tag-queue', '排隊名店'));
    if (tags.includes('latenight') || isLate) infoRow.appendChild(el('span', 'tag tag-badge tag-late', '宵夜場'));
    if (tags.includes('gifts')) infoRow.appendChild(el('span', 'tag tag-badge tag-gifts', '伴手禮'));
    if (tags.includes('view')) infoRow.appendChild(el('span', 'tag tag-badge tag-view', '景觀'));
    card.appendChild(infoRow);
  }

  const address = shop.address || shop.addr || null;
  if (address) {
    const addr = el('div', 'card-addr', address);
    addr.setAttribute('title', address);
    card.appendChild(addr);
  }

  const photoStrip = el('div', 'card-photo-strip');
  const photos = (shop.photos || []).map(normalizePhotoUrl).filter(Boolean);
  const photoTotal = photos.length;
  photos.slice(0, 4).forEach(url => {
    const thumb = el('div', 'card-photo-thumb');
    thumb.dataset.shopId = shop.id;
    thumb.dataset.action = 'album';
    const img = document.createElement('img');
    img.src = url;
    img.alt = shop.name || '';
    img.loading = 'lazy';
    img.onerror = () => { const seed = encodeURIComponent(shop.id + '-' + url.substring(url.length - 40)); img.src = 'https://picsum.photos/seed/' + seed + '/400/300'; };
    thumb.appendChild(img);
    photoStrip.appendChild(thumb);
  });
  if (photoTotal > 4) {
    const more = el('div', 'card-photo-thumb more', '+' + (photoTotal - 4));
    more.dataset.shopId = shop.id;
    more.dataset.action = 'album';
    photoStrip.appendChild(more);
  }
  if (photoTotal > 0) {
    card.appendChild(photoStrip);
    const albumBtn = el('button', 'btn-album', '看完整相簿 · ' + photoTotal + ' 張');
    albumBtn.dataset.shopId = shop.id;
    albumBtn.dataset.action = 'album';
    card.appendChild(albumBtn);
  } else {
    // 0 圖店家: 顯示「查無 Google Maps 資料」+ 提供 Maps 連結
    const placeholder = el('div', 'card-photo-placeholder');
    if (shop._no_maps_match) {
      placeholder.innerHTML = '📷 查無 Google Maps 對應店家<br><small style="opacity:0.7">請用下方「地圖 ↗」按鈕查看實際店家</small>';
    } else {
      placeholder.textContent = '📷 暫無照片';
    }
    placeholder.dataset.shopId = shop.id;
    card.appendChild(placeholder);
  }

  const actions = el('div', 'card-actions');
  const detailBtn = el('button', 'btn btn-primary', '詳細');
  detailBtn.dataset.shopId = shop.id;
  detailBtn.dataset.action = 'detail';
  actions.appendChild(detailBtn);

  const shareBtn = el('button', 'btn btn-share', '\u2197 分享');
  shareBtn.dataset.shopId = shop.id;
  shareBtn.dataset.action = 'share';
  shareBtn.setAttribute('type', 'button');
  shareBtn.setAttribute('aria-label', '分享');
  actions.appendChild(shareBtn);

  if (shop.gmaps_url) {
    const mapLink = document.createElement('a');
    mapLink.className = 'btn btn-map';
    mapLink.href = shop.gmaps_url;
    mapLink.target = '_blank';
    mapLink.rel = 'noopener';
    mapLink.textContent = '地圖 \u2197';
    actions.appendChild(mapLink);
  }
  card.appendChild(actions);

  return card;
}

export function renderAllCards(shops) {
  const list = document.getElementById('shopList');
  if (!list) return;
  list.textContent = '';
  shops.forEach(s => list.appendChild(renderCard(s)));
}
