// supabase-ui.js - 使用者提交表單 + 管理員後台
import {
    isSupabaseEnabled, isAdmin, signIn, signOut, getCurrentUser,
    submitShop, fetchPendingSubmissions, reviewSubmission,
    deactivateShop, activateShop, deleteShop
} from './supabase-client.js';

// Inline prompt 函數 (取代 window.prompt, 避免 Hermes 視窗彈出)
function inlinePrompt(title, defaultValue = '') {
    return new Promise((resolve) => {
        // 移除舊的 modal (如果存在)
        const existing = document.getElementById('inlinePromptModal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'inlinePromptModal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';
        overlay.innerHTML = `
            <div style="background:var(--bg-card,#1c1c1c);border-radius:12px;padding:24px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
                <h3 style="margin:0 0 12px;font-size:16px;color:var(--text-primary,#f5f5f5);">${title}</h3>
                <textarea id="inlinePromptInput" style="width:100%;min-height:80px;padding:8px;border:1px solid var(--border-color,#333);border-radius:6px;background:var(--bg-secondary,#262626);color:var(--text-primary,#f5f5f5);font-family:inherit;font-size:14px;box-sizing:border-box;">${defaultValue}</textarea>
                <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
                    <button id="inlinePromptCancel" style="padding:8px 16px;border:1px solid var(--border-color,#333);background:transparent;color:var(--text-primary,#f5f5f5);border-radius:6px;cursor:pointer;">取消</button>
                    <button id="inlinePromptOk" style="padding:8px 16px;border:none;background:var(--accent,#f97316);color:white;border-radius:6px;cursor:pointer;">確定</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = document.getElementById('inlinePromptInput');
        input.focus();
        input.select();

        const cleanup = () => overlay.remove();
        const ok = document.getElementById('inlinePromptOk');
        const cancel = document.getElementById('inlinePromptCancel');
        ok.onclick = () => { const v = input.value; cleanup(); resolve(v); };
        cancel.onclick = () => { cleanup(); resolve(null); };
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ok.click(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel.click(); }
        };
        overlay.onclick = (e) => { if (e.target === overlay) cancel.click(); };
    });
}

// 從 meta tag 讀取 env (部署後由 Vercel 環境變數注入)
// 立即同步設到 window (確保 module 載入順序不影響)
if (typeof document !== 'undefined') {
  if (!window.SUPABASE_URL) {
    const urlMeta = document.querySelector('meta[name="supabase-url"]');
    if (urlMeta) window.SUPABASE_URL = urlMeta.content;
  }
  if (!window.SUPABASE_ANON_KEY) {
    const keyMeta = document.querySelector('meta[name="supabase-anon-key"]');
    if (keyMeta) window.SUPABASE_ANON_KEY = keyMeta.content;
  }
  // 暴露到 window.__supabaseUI (給 index.html inline script 觸發 mountEntryButtons)
  window.__supabaseUI = {
    mountEntryButtons,
    showSubmitShopForm,
    showAdminLogin,
    showAdminPanel
  };
}

// ============================================
// 使用者: 提交表單
// ============================================

/**
 * 顯示使用者提交表單 (modal)
 */
export function showSubmitShopForm() {
    if (!isSupabaseEnabled()) {
        alert('提交功能尚未啟用 (Supabase 未設定), 請聯絡管理員');
        return;
    }

    const formHtml = `
    <div class="submit-form-overlay" id="submitFormOverlay">
        <div class="submit-form">
            <button class="submit-form-close" data-action="close-submit">×</button>
            <h2 class="submit-form-title">📝 推薦新店家</h2>
            <p class="submit-form-desc">填寫店家資料, 管理員審核通過後會上架到地圖。</p>
            <form id="submitShopForm" class="submit-form-body">
                <label>您的 Email <span class="req">*</span>
                    <input type="email" name="submitter_email" required placeholder="your@email.com" />
                </label>
                <label>您的稱呼
                    <input type="text" name="submitter_name" placeholder="匿名也可" />
                </label>
                <label>縣市 <span class="req">*</span>
                    <select name="city" required>
                        <option value="">請選擇</option>
                        <option value="kh">高雄</option>
                        <option value="tn">台南</option>
                        <option value="ch">彰化</option>
                    </select>
                </label>
                <label>店名 <span class="req">*</span>
                    <input type="text" name="name" required placeholder="例: 阿三肉圓" />
                </label>
                <label>地址 <span class="req">*</span>
                    <input type="text" name="addr" required placeholder="例: 500彰化縣彰化市三民路242號" />
                </label>
                <label>主分類
                    <select name="mcat">
                        <option value="">不指定</option>
                        <option value="麵粥/中式">麵粥/中式</option>
                        <option value="火鍋">火鍋</option>
                        <option value="日式">日式</option>
                        <option value="小吃">小吃</option>
                        <option value="燒肉">燒肉</option>
                        <option value="羊肉爐">羊肉爐</option>
                        <option value="咖啡">咖啡</option>
                        <option value="甜品">甜品</option>
                        <option value="其他">其他</option>
                    </select>
                </label>
                <label>價位
                    <select name="price_bar">
                        <option value="">不指定</option>
                        <option value="$">$ (平價)</option>
                        <option value="$$">$$ (中等)</option>
                        <option value="$$$">$$$ (高價)</option>
                    </select>
                </label>
                <label>是否宵夜 (營業到 22:00 後)
                    <select name="late">
                        <option value="false">否</option>
                        <option value="true">是</option>
                    </select>
                </label>
                <label>是否 24hr
                    <select name="time_24h">
                        <option value="false">否</option>
                        <option value="true">是</option>
                    </select>
                </label>
                <label>照片 URL (每行一個, 最多 4 張, 可從 Google Maps 複製)
                    <textarea name="photos" rows="4" placeholder="https://lh3.googleusercontent.com/..."></textarea>
                </label>
                <label>Google Maps 連結
                    <input type="url" name="gmaps_url" placeholder="https://maps.google.com/..." />
                </label>
                <label>備註 (給管理員)
                    <textarea name="submitter_note" rows="2" placeholder="推薦原因、其他資訊..."></textarea>
                </label>
                <div class="submit-form-actions">
                    <button type="button" class="btn btn-secondary" data-action="close-submit">取消</button>
                    <button type="submit" class="btn btn-primary">送出審核</button>
                </div>
                <div class="submit-form-msg" id="submitFormMsg"></div>
            </form>
        </div>
    </div>
    `;

    // 移除舊的 (如果有)
    const old = document.getElementById('submitFormOverlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', formHtml);

    // 綁定關閉
    document.querySelectorAll('[data-action="close-submit"]').forEach(el => {
        el.addEventListener('click', () => {
            const ov = document.getElementById('submitFormOverlay');
            if (ov) ov.remove();
        });
    });

    // 綁定提交
    document.getElementById('submitShopForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = {
            submitter_email: form.submitter_email.value.trim(),
            submitter_name: form.submitter_name.value.trim(),
            city: form.city.value,
            name: form.name.value.trim(),
            addr: form.addr.value.trim(),
            mcat: form.mcat.value,
            price_bar: form.price_bar.value,
            late: form.late.value === 'true',
            time_24h: form.time_24h.value === 'true',
            photos: form.photos.value.split('\n').map(s => s.trim()).filter(s => s),
            gmaps_url: form.gmaps_url.value.trim(),
            submitter_note: form.submitter_note.value.trim()
        };

        const msgEl = document.getElementById('submitFormMsg');
        msgEl.textContent = '送出中...';
        msgEl.className = 'submit-form-msg info';

        const result = await submitShop(
            data,
            data.submitter_email,
            data.submitter_name,
            data.submitter_note
        );

        if (result.ok) {
            msgEl.textContent = `✅ 送出成功! 您的提交 ID: ${result.id}, 等待管理員審核。`;
            msgEl.className = 'submit-form-msg success';
            setTimeout(() => {
                const ov = document.getElementById('submitFormOverlay');
                if (ov) ov.remove();
            }, 3000);
        } else {
            msgEl.textContent = `❌ 送出失敗: ${result.error}`;
            msgEl.className = 'submit-form-msg error';
        }
    });
}

// ============================================
// 管理員: 登入 modal
// ============================================

export function showAdminLogin() {
    if (!isSupabaseEnabled()) {
        alert('管理後台尚未啟用 (Supabase 未設定)');
        return;
    }

    const html = `
    <div class="admin-login-overlay" id="adminLoginOverlay">
        <div class="admin-login">
            <button class="admin-login-close" data-action="close-login">×</button>
            <h2>🔐 管理員登入</h2>
            <form id="adminLoginForm">
                <label>Email <input type="email" name="email" required /></label>
                <label>密碼 <input type="password" name="password" required /></label>
                <div class="admin-login-actions">
                    <button type="button" class="btn btn-secondary" data-action="close-login">取消</button>
                    <button type="submit" class="btn btn-primary">登入</button>
                </div>
                <div class="admin-login-msg" id="adminLoginMsg"></div>
            </form>
        </div>
    </div>
    `;
    const old = document.getElementById('adminLoginOverlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);

    document.querySelectorAll('[data-action="close-login"]').forEach(el => {
        el.addEventListener('click', () => {
            const ov = document.getElementById('adminLoginOverlay');
            if (ov) ov.remove();
        });
    });

    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const msgEl = document.getElementById('adminLoginMsg');
        msgEl.textContent = '登入中...';

        const result = await signIn(form.email.value, form.password.value);
        if (result.ok) {
            const admin = await isAdmin();
            if (admin) {
                msgEl.textContent = '✅ 登入成功! 載入後台...';
                setTimeout(() => {
                    document.getElementById('adminLoginOverlay').remove();
                    showAdminPanel();
                }, 1000);
            } else {
                msgEl.textContent = '⚠ 登入成功但您不是管理員';
                await signOut();
            }
        } else {
            msgEl.textContent = `❌ 登入失敗: ${result.error}`;
        }
    });
}

// ============================================
// 管理員: 後台審核面板
// ============================================

export async function showAdminPanel() {
    if (!isSupabaseEnabled()) {
        alert('Supabase 未設定');
        return;
    }

    const admin = await isAdmin();
    if (!admin) {
        alert('您不是管理員');
        return;
    }

    const submissions = await fetchPendingSubmissions();

    const html = `
    <div class="admin-panel-overlay" id="adminPanelOverlay">
        <div class="admin-panel">
            <div class="admin-panel-header">
                <h2>🛠 管理員後台</h2>
                <div>
                    <span class="admin-panel-user" id="adminUserEmail"></span>
                    <button class="btn btn-secondary" data-action="admin-logout">登出</button>
                    <button class="btn btn-secondary" data-action="close-admin">關閉</button>
                </div>
            </div>
            <div class="admin-panel-body">
                <h3>待審核 (${submissions.length})</h3>
                <div class="admin-panel-list" id="adminSubmissionList">
                    ${submissions.map(s => renderSubmission(s)).join('')}
                </div>
            </div>
        </div>
    </div>
    `;
    const old = document.getElementById('adminPanelOverlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);

    // 顯示當前用戶 email
    const user = await getCurrentUser();
    const emailEl = document.getElementById('adminUserEmail');
    if (emailEl) emailEl.textContent = user?.email || '';

    // 綁定事件
    document.querySelectorAll('[data-action="close-admin"]').forEach(el => {
        el.addEventListener('click', () => {
            document.getElementById('adminPanelOverlay').remove();
        });
    });

    document.querySelectorAll('[data-action="admin-logout"]').forEach(el => {
        el.addEventListener('click', async () => {
            await signOut();
            document.getElementById('adminPanelOverlay').remove();
        });
    });

    bindReviewButtons();
}

function renderSubmission(s) {
    const photos = s.photos || [];
    return `
    <div class="admin-submission" data-id="${s.id}">
        <div class="admin-submission-head">
            <h4>${s.name}</h4>
            <span class="admin-submission-id">#${s.id}</span>
        </div>
        <div class="admin-submission-meta">
            <span>📍 ${s.city.toUpperCase()}</span>
            <span>🏷 ${s.mcat || '-'}</span>
            <span>💰 ${s.price_bar || '-'}</span>
            <span>🕐 宵夜: ${s.late ? '是' : '否'}</span>
        </div>
        <div class="admin-submission-addr">${s.addr}</div>
        ${s.station ? `<div class="admin-submission-station">捷運/區域: ${s.station}</div>` : ''}
        ${photos.length > 0 ? `<div class="admin-submission-photos">${photos.map(p => `<img src="${p}" alt="" loading="lazy" />`).join('')}</div>` : ''}
        ${s.gmaps_url ? `<div class="admin-submission-gmaps"><a href="${s.gmaps_url}" target="_blank">🗺 Google Maps</a></div>` : ''}
        <div class="admin-submission-submitter">👤 ${s.submitter_name || '匿名'} (${s.submitter_email})</div>
        ${s.submitter_note ? `<div class="admin-submission-note">📝 ${s.submitter_note}</div>` : ''}
        <div class="admin-submission-time">⏰ 提交: ${new Date(s.created_at).toLocaleString('zh-TW')}</div>
        <div class="admin-submission-actions">
            <button class="btn btn-success" data-action="approve" data-id="${s.id}">✅ 通過</button>
            <button class="btn btn-danger" data-action="reject" data-id="${s.id}">❌ 拒絕</button>
        </div>
    </div>
    `;
}

function bindReviewButtons() {
    document.querySelectorAll('[data-action="approve"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            // 用 inline modal 不用 window.prompt (避免 Hermes 視窗)
            const note = await inlinePrompt('審核備註 (取消=跳過):', '') || '';
            btn.disabled = true;
            btn.textContent = '處理中...';
            const r = await reviewSubmission(id, true, note);
            if (r.ok) {
                btn.closest('.admin-submission').remove();
                alert(`✅ 通過! 店家已上架到地圖。`);
            } else {
                alert(`❌ 失敗: ${r.error}`);
                btn.disabled = false;
                btn.textContent = '✅ 通過';
            }
        });
    });

    document.querySelectorAll('[data-action="reject"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            // 用 inline modal 不用 window.prompt
            const note = await inlinePrompt('拒絕原因 (必填):', '資料不完整');
            if (!note) return;
            btn.disabled = true;
            btn.textContent = '處理中...';
            const r = await reviewSubmission(id, false, note);
            if (r.ok) {
                btn.closest('.admin-submission').remove();
                alert(`❌ 已拒絕`);
            } else {
                alert(`❌ 失敗: ${r.error}`);
                btn.disabled = false;
                btn.textContent = '❌ 拒絕';
            }
        });
    });
}

// ============================================
// 入口按鈕
// ============================================

export function mountEntryButtons() {
    if (!isSupabaseEnabled()) {
        console.log('[supabase-ui] Supabase 未啟用, 不掛載 entry buttons');
        return;
    }

    // 找到 header (支援多個 selector)
    const headerSelectors = ['.app-header-actions', '.app-header-inner', '.app-header', 'header'];
    let header = null;
    for (const sel of headerSelectors) {
        header = document.querySelector(sel);
        if (header) break;
    }

    if (header && !document.getElementById('submitShopEntryBtn')) {
        const btn = document.createElement('button');
        btn.id = 'submitShopEntryBtn';
        btn.className = 'header-btn';
        btn.textContent = '📝 推薦店家';
        btn.style.cssText = 'background:#ff6b35;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-left:8px;font-weight:600;';
        btn.addEventListener('click', showSubmitShopForm);
        header.appendChild(btn);
        console.log('[supabase-ui] 推薦店家按鈕已掛載');
    }

    // 「管理員入口」加在 body (固定右下角)
    if (!document.getElementById('adminEntryBtn')) {
        const btn = document.createElement('button');
        btn.id = 'adminEntryBtn';
        btn.className = 'admin-entry-btn';
        btn.textContent = '🔐 管理員';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#333;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;opacity:0.7;z-index:9999;font-size:13px;';
        btn.addEventListener('click', async () => {
            if (await isAdmin()) {
                showAdminPanel();
            } else {
                showAdminLogin();
            }
        });
        document.body.appendChild(btn);
        console.log('[supabase-ui] 管理員按鈕已掛載');
    }
}
