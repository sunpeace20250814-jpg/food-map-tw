// GET /shops/:id — 取得單店詳情
const { ok, bad } = require('./_helpers');
const { getShopById } = require('./_db');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
    if (event.httpMethod !== 'GET') return bad('Method not allowed', 405);

    const id = parseInt(event.pathParameters?.id);
    if (!id) return bad('Invalid shop id', 400);

    try {
        const shop = await getShopById(id);
        if (!shop) return bad('Shop not found', 404);
        return ok(shop);
    } catch (e) {
        console.error(e);
        return bad(e.message, 500);
    }
};
