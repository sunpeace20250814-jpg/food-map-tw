// ============================================
// _seed.js — 自動讀 seed-data.sql 解析出 46 家店
// ============================================
const fs = require('fs');
const path = require('path');
const { mockStore } = require('./_db');

function parseSeedSql(sql) {
    // 簡化解析: 用 '(' 切出每筆, 處理 SQL string escaping
    const valuesStart = sql.indexOf('values');
    if (valuesStart === -1) return [];
    const afterValues = sql.substring(valuesStart + 6);
    const rows = [];
    let depth = 0, inStr = false, escape = false, current = '', start = -1;
    for (let i = 0; i < afterValues.length; i++) {
        const ch = afterValues[i];
        if (inStr) {
            if (escape) { escape = false; current += ch; continue; }
            if (ch === '\\') { escape = true; current += ch; continue; }
            if (ch === "'") { inStr = false; current += ch; continue; }
            current += ch;
            continue;
        }
        if (ch === "'") { inStr = true; current += ch; continue; }
        if (ch === '(' && depth === 0) { start = i; depth = 1; current = '('; continue; }
        if (depth === 0) continue;
        current += ch;
        if (ch === '(') depth++;
        if (ch === ')') {
            depth--;
            if (depth === 0) {
                rows.push(parseRow(current));
                current = '';
            }
        }
    }
    return rows.filter(Boolean);
}

function parseRow(s) {
    // s 形如 (val1, val2, 'jsonb', ...)
    s = s.trim();
    if (s.startsWith('(')) s = s.slice(1);
    if (s.endsWith(')')) s = s.slice(0, -1);
    // 簡單 split (不處理巢狀, 但本資料沒巢狀 SQL expr)
    const parts = splitTopLevel(s, ',');
    const cols = ['name','cat_main','cat_sub','price_bar','price_min','price_max','rating','review_count','time_label','weekly_hours','is_24h','is_late_night','is_non_late','address','addr_short','district','station_id','gmaps_url','feature','source','confidence','cover_photo','photos','reviews'];
    const row = {};
    cols.forEach((c, i) => row[c] = parseValue(parts[i]));
    return row;
}

function splitTopLevel(s, sep) {
    const out = [];
    let inStr = false, escape = false, depth = 0, current = '';
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inStr) {
            if (escape) { escape = false; current += ch; continue; }
            if (ch === '\\') { escape = true; current += ch; continue; }
            if (ch === "'") { inStr = false; current += ch; continue; }
            current += ch;
            continue;
        }
        if (ch === "'") { inStr = true; current += ch; continue; }
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === sep && depth === 0) {
            out.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }
    if (current.trim()) out.push(current.trim());
    return out;
}

function parseValue(v) {
    if (!v) return null;
    v = v.trim();
    if (v === 'NULL') return null;
    if (v === 'TRUE') return true;
    if (v === 'FALSE') return false;
    if (v.startsWith("'")) {
        // 找配對的 closing ', 注意跳脫 ''
        let i = 1, s = '';
        while (i < v.length) {
            const ch = v[i];
            if (ch === "'" && v[i+1] === "'") { s += "'"; i += 2; continue; }
            if (ch === "'") { i++; break; }
            s += ch; i++;
        }
        // i 之後可能是 ::jsonb 等型別標註
        const rest = v.slice(i).trim();
        const typeMatch = rest.match(/^::(\w+)$/);
        const type = typeMatch ? typeMatch[1] : null;
        if (type === 'jsonb' || type === 'json') {
            try { return JSON.parse(s); } catch { return s; }
        }
        if (type === 'int' || type === 'int4' || type === 'int8') {
            return parseInt(s);
        }
        if (type === 'numeric' || type === 'float' || type === 'float8') {
            return parseFloat(s);
        }
        return s;
    }
    if (/^-?\d+$/.test(v)) return parseInt(v);
    if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
    return v;
}

const stations = [
    { id: "R11", name: "高雄車站", line: "red" },
    { id: "R14", name: "巨蛋站", line: "red" },
    { id: "R8",  name: "三多商圈站", line: "red" },
    { id: "R9",  name: "中央公園站", line: "red" },
    { id: "R10", name: "美麗島站", line: "red" },
    { id: "R16", name: "左營站", line: "red" },
    { id: "O14", name: "衛武營站", line: "orange" },
    { id: "O2",  name: "鹽埕埔站", line: "orange" },
    { id: "O5",  name: "美麗島站", line: "orange" },
    { id: "O7",  name: "文化中心站", line: "orange" },
    { id: "O8",  name: "三多商圈站", line: "orange" },
    { id: "C12", name: "駁二大義站", line: "lrt" },
    { id: "C14", name: "哈瑪星站", line: "lrt" },
    { id: "C17", name: "鼓山區公所站", line: "lrt" },
    { id: "C24", name: "美術館站", line: "lrt" },
    { id: "C27", name: "正義車站", line: "lrt" },
    { id: "C28", name: "高雄高工站", line: "lrt" },
    { id: "C10", name: "光榮碼頭站", line: "lrt" },
];

function loadSeed() {
    if (mockStore.shops.length > 0) return;
    try {
        const sqlPath = path.join(__dirname, '..', '..', 'backend', 'supabase', 'seed-data.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        const shops = parseSeedSql(sql);
        mockStore.shops = shops.map((s, i) => ({ ...s, id: i + 1, is_active: true }));
        mockStore.stations = stations;
        console.log(`[seed] 載入 ${shops.length} 家店 + ${stations.length} 站`);
    } catch (e) {
        console.error('[seed] 載入失敗:', e.message);
        // fallback: 給空資料
        mockStore.shops = [];
        mockStore.stations = stations;
    }
}

module.exports = { loadSeed, stations };
