// scripts/test-functions.js — 測試 api/ 內的所有 Functions
// 跑法: node scripts/test-functions.js

const ctx = {
    awsRequestId: 'test-' + Date.now(),
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:test',
    memoryLimitInMB: 128,
    logGroupName: 'test', logStreamName: 'test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {}, fail: () => {}, succeed: () => {},
};

async function test(name, handler, event) {
    try {
        const result = await handler(event, ctx);
        console.log(`\n[${result.statusCode}] ${name}`);
        if (result.body) {
            const body = JSON.parse(result.body);
            if (body.ok) {
                if (Array.isArray(body.data)) console.log(`  data: ${body.data.length} 筆`);
                else console.log(`  data:`, body.data);
            } else {
                console.log(`  error:`, body.error);
            }
        }
    } catch (e) {
        console.log(`\n[FAIL] ${name}`);
        console.error(e);
    }
}

(async () => {
    const shops = require('../api/shops');
    const stations = require('../api/stations');
    const shopsId = require('../api/shops-id');
    const favorites = require('../api/favorites');

    await test('GET /shops (全部)', shops.handler, {
        httpMethod: 'GET', queryStringParameters: {}, headers: {},
    });
    await test('GET /shops?line=red', shops.handler, {
        httpMethod: 'GET', queryStringParameters: { line: 'red' }, headers: {},
    });
    await test('GET /shops?q=火鍋', shops.handler, {
        httpMethod: 'GET', queryStringParameters: { q: '火鍋' }, headers: {},
    });
    await test('GET /shops/1 (id=1)', shopsId.handler, {
        httpMethod: 'GET', queryStringParameters: { id: '1' }, headers: {},
    });
    await test('GET /stations', stations.handler, {
        httpMethod: 'GET', headers: {},
    });
    await test('GET /favorites (no auth)', favorites.handler, {
        httpMethod: 'GET', headers: {},
    });
    const DEV = '00000000-0000-0000-0000-000000000001';
    await test('POST /favorites (dev user)', favorites.handler, {
        httpMethod: 'POST', headers: { authorization: `Bearer ${DEV}` },
        body: JSON.stringify({ shop_id: 1 }),
    });
    await test('GET /favorites (dev user)', favorites.handler, {
        httpMethod: 'GET', headers: { authorization: `Bearer ${DEV}` },
    });
    await test('DELETE /favorites?shop_id=1 (dev user)', favorites.handler, {
        httpMethod: 'DELETE', queryStringParameters: { shop_id: '1' },
        headers: { authorization: `Bearer ${DEV}` },
    });
    console.log('\n=== 所有測試完成 ===');
})();
