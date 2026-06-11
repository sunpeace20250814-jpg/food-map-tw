// /favorites — 取得我的最愛 (GET) / 新增 (POST) / 移除 (DELETE)
const { ok, bad, getUserId } = require('./_helpers');
const { getUserFavorites, addFavorite, deleteFavorite } = require('./_db');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };

    const userId = await getUserId(event);
    if (!userId) return bad('Unauthorized: 需要登入或帶 userId', 401);

    try {
        if (event.httpMethod === 'GET') {
            const favs = await getUserFavorites(userId);
            return ok(favs);
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const shopId = parseInt(body.shop_id);
            if (!shopId) return bad('Missing shop_id', 400);
            const result = await addFavorite(userId, shopId);
            return ok(result);
        }

        if (event.httpMethod === 'DELETE') {
            const qs = event.queryStringParameters || {};
            const shopId = parseInt(qs.shop_id);
            if (!shopId) return bad('Missing shop_id query param', 400);
            const result = await deleteFavorite(userId, shopId);
            return ok(result);
        }

        return bad('Method not allowed', 405);
    } catch (e) {
        console.error(e);
        return bad(e.message, 500);
    }
};
