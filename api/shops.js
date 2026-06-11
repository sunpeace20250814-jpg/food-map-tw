// GET /shops — 取得所有店家 (支援 query 篩選)
const { ok, bad } = require('./_helpers');
const { getShops } = require('./_db');
const { loadSeed } = require('./_seed');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
    if (event.httpMethod !== 'GET') return bad('Method not allowed', 405);

    loadSeed();  // mock 模式才有效, 真 Supabase 不會執行

    try {
        const q = event.queryStringParameters || {};
        const shops = await getShops({
            q: q.q,
            line: q.line,
            price: q.price,
            cat_main: q.cat_main,
            env: q.env,
            is_24h: q.is_24h === 'true' ? true : q.is_24h === 'false' ? false : undefined,
            is_late_night: q.is_late_night === 'true' ? true : q.is_late_night === 'false' ? false : undefined,
            station_id: q.station_id,
        });
        return ok(shops);
    } catch (e) {
        console.error(e);
        return bad(e.message, 500);
    }
};
