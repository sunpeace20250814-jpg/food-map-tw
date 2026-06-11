// GET /stations — 取得所有捷運/輕軌站
const { ok, bad } = require('./_helpers');
const { getStations } = require('./_db');
const { loadSeed } = require('./_seed');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
    if (event.httpMethod !== 'GET') return bad('Method not allowed', 405);

    loadSeed();

    try {
        const stations = await getStations();
        return ok(stations);
    } catch (e) {
        console.error(e);
        return bad(e.message, 500);
    }
};
