// city.js — 縣市切換
import { getCities, getShops } from './data.js';

let currentCity = null;
export const getCurrentCity = () => currentCity;

export function renderCityBar() {
  const bar = document.getElementById('cityBar');
  if (!bar) return;
  const cities = getCities();
  bar.textContent = '';
  Object.values(cities).forEach((city, i) => {
    const chip = document.createElement('button');
    chip.className = 'city-chip' + (i === 0 ? ' active' : '');
    chip.dataset.city = city.code;
    chip.textContent = city.name;
    bar.appendChild(chip);
  });
  bar.addEventListener('click', (e) => {
    const chip = e.target.closest('.city-chip');
    if (!chip) return;
    bar.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    switchCity(chip.dataset.city);
  });
}

export function switchCity(code) {
  if (currentCity === code) return;
  currentCity = code;
  window.currentCity = code;
  document.body.dataset.city = code;
  if (typeof window.resetAllFilters === 'function') window.resetAllFilters();
  updateSubtitle();
  window.dispatchEvent(new CustomEvent('city:changed', { detail: { city: code } }));
}

function updateSubtitle() {
  const sub = document.getElementById('appSub');
  if (!sub || !currentCity) return;
  const city = getCities()[currentCity];
  if (!city) return;
  const count = getShops().filter(s => s.city === currentCity).length;
  sub.textContent = '2026 · ' + city.full_name + ' ' + count + ' 家精選';
}

export function initDefaultCity() {
  const first = Object.keys(getCities())[0];
  if (first) switchCity(first);
}
