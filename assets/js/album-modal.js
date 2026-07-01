// ============================================
// album-modal.js - 店家照片相簿 Modal (v10.8 從 app.js 拆出)
//   - photoModal (grid view) + albumModal (grid) + albumViewer (single)
//   - 依賴: window.SHOP_DATA, showToast, lockBodyScroll, unlockBodyScroll
// ============================================

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
        img.decoding = 'async';
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


// === 照片相簿 (grid + viewer) ===
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
        img.loading = 'lazy';
        img.decoding = 'async';
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