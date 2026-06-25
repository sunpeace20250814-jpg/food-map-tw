// supabase-client.js - 美食遊覽 Supabase 客戶端
// TypeScript types (從 Supabase Cloud 自動生成): supabase gen types typescript --project-id XXX
// 部署後執行: bash supabase/scripts/gen_types.sh
// (本檔案使用 JS, 不用 TS, types 僅供參考)
// 用途: 連接 Supabase 後端, 提供 CRUD + Auth API

// 環境變數 (從 Vercel/本地 env 注入, 或從 meta tag 讀取)
// 用函數動態讀取, 不在 module load 時鎖死
function getSupabaseUrl() {
    if (typeof window === 'undefined') return '';
    if (window.SUPABASE_URL) return window.SUPABASE_URL;
    const m = document.querySelector('meta[name="supabase-url"]');
    return m ? m.content : '';
}

function getSupabaseKey() {
    if (typeof window === 'undefined') return '';
    if (window.SUPABASE_ANON_KEY) return window.SUPABASE_ANON_KEY;
    const m = document.querySelector('meta[name="supabase-anon-key"]');
    return m ? m.content : '';
}

// 單例 Supabase 客戶端 (用 UMD 全局)
let _supabase = null;

export function getSupabase() {
    const url = getSupabaseUrl();
    const key = getSupabaseKey();
    if (!url || !key) {
        console.warn('[supabase] 環境變數未設定, 將使用本地 SHOP_DATA_INITIAL 靜態資料');
        return null;
    }
    if (!_supabase && typeof window.supabase !== 'undefined') {
        _supabase = window.supabase.createClient(url, key, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
    }
    return _supabase;
}

// 檢查環境是否已設定
export function isSupabaseEnabled() {
    return !!(getSupabaseUrl() && getSupabaseKey());
}

// ============================================
// 公開 API: 讀取店家 (無需登入)
// ============================================

/**
 * 取得所有上架的店家
 * @returns {Promise<Array>} 店家陣列 (與 SHOP_DATA 格式相同)
 */
export async function fetchAllShops() {
    const sb = getSupabase();
    if (!sb) return null;  // 環境未設定, 退回本地 SHOP_DATA_INITIAL

    const { data, error } = await sb
        .from('v_public_shops')
        .select('*')
        .order('city', { ascending: true })
        .order('id', { ascending: true });

    if (error) {
        console.error('[supabase] fetchAllShops error:', error);
        return null;
    }
    return data || [];
}

// ============================================
// 使用者 API: 提交店家 (無需登入)
// ============================================

/**
 * 提交新店家 (等管理員審核)
 * @param {Object} shop - 店家資料
 * @param {string} submitterEmail - 提交者 email
 * @param {string} submitterName - 提交者姓名
 * @param {string} submitterNote - 提交者備註
 * @returns {Promise<{ok: boolean, id?: number, error?: string}>}
 */
export async function submitShop(shop, submitterEmail, submitterName = '', submitterNote = '') {
    const sb = getSupabase();
    if (!sb) {
        return { ok: false, error: 'Supabase 未設定' };
    }

    const payload = {
        submitter_email: submitterEmail,
        submitter_name: submitterName || null,
        name: shop.name,
        addr: shop.addr,
        city: shop.city,
        mcat: shop.mcat || null,
        cat_sub: shop.cat_sub || null,
        station: shop.station || null,
        line: shop.line || null,
        lat: shop.lat || null,
        lng: shop.lng || null,
        price_bar: shop.price_bar || null,
        env: shop.env || null,
        time_24h: !!shop.time_24h,
        late: !!shop.late,
        "22start": !!shop['22start'],
        photos: shop.photos || [],
        gmaps_url: shop.gmaps_url || null,
        submitter_note: submitterNote || null
    };

    const { data, error } = await sb
        .from('user_submissions')
        .insert([payload])
        .select('id')
        .single();

    if (error) {
        console.error('[supabase] submitShop error:', error);
        return { ok: false, error: error.message };
    }
    return { ok: true, id: data.id };
}

// ============================================
// 管理員 API: 審核 + CRUD (需要登入)
// ============================================

/**
 * 登入 (管理員)
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>}
 */
export async function signIn(email, password) {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Supabase 未設定' };

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user };
}

/**
 * 登出
 */
export async function signOut() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
}

/**
 * 取得當前使用者
 */
export async function getCurrentUser() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    return user;
}

/**
 * 檢查當前使用者是否為 admin
 */
export async function isAdmin() {
    const sb = getSupabase();
    if (!sb) return false;
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await sb
        .from('admins')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (error) return false;
    return data && (data.role === 'admin' || data.role === 'super_admin');
}

/**
 * 取得待審核列表
 * @returns {Promise<Array>}
 */
export async function fetchPendingSubmissions() {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
        .from('v_pending_submissions')
        .select('*');

    if (error) {
        console.error('[supabase] fetchPendingSubmissions error:', error);
        return [];
    }
    return data || [];
}

/**
 * 審核 submission (approve/reject)
 * @param {number} submissionId
 * @param {boolean} approve
 * @param {string} reviewNote
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function reviewSubmission(submissionId, approve, reviewNote = '') {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Supabase 未設定' };

    const user = await getCurrentUser();
    if (!user) return { ok: false, error: '未登入' };

    const { error } = await sb
        .from('user_submissions')
        .update({
            status: approve ? 'approved' : 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            review_note: reviewNote || null
        })
        .eq('id', submissionId);

    if (error) {
        console.error('[supabase] reviewSubmission error:', error);
        return { ok: false, error: error.message };
    }
    return { ok: true };
}

/**
 * 下架店家 (管理員)
 * @param {number} shopId
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deactivateShop(shopId) {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Supabase 未設定' };

    const { error } = await sb
        .from('shops')
        .update({ is_active: false })
        .eq('id', shopId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
}

/**
 * 重新啟用店家
 */
export async function activateShop(shopId) {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Supabase 未設定' };

    const { error } = await sb
        .from('shops')
        .update({ is_active: true })
        .eq('id', shopId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
}

/**
 * 刪除店家 (管理員)
 */
export async function deleteShop(shopId) {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Supabase 未設定' };

    const { error } = await sb
        .from('shops')
        .delete()
        .eq('id', shopId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
}
