// ============================================
// _helpers.js — 共用回應 + JWT 認證
// ============================================

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

function json(statusCode, data) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...CORS },
        body: JSON.stringify(data),
    };
}

function ok(data) { return json(200, { ok: true, data }); }
function bad(message, code = 400) { return json(code, { ok: false, error: message }); }

// 從 Authorization header 拿 userId
// 支援 2 種: 1) 真 Supabase JWT (由前端 supabase-js 帶)  2) 開發模式直接傳 userId
async function getUserId(event) {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);

    // 開發模式: 純 userId 字串 (用於本地測試)
    if (/^[0-9a-f-]{36}$/i.test(token)) return token;

    // 正式: 呼叫 Supabase /auth/v1/user 驗 JWT
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return null;
    const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': process.env.SUPABASE_SERVICE_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
}

module.exports = { json, ok, bad, getUserId, CORS };
