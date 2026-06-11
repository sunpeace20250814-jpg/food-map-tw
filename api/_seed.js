// ============================================
// _seed.js — Vercel 友善: 46 家店 inline 內嵌 (避免讀檔)
// 同時支援 Netlify 從 seed-data.sql 解析
// ============================================
const fs = require('fs');
const path = require('path');
const { mockStore } = require('./_db');

// 完整 46 家店家 inline 資料 (與 backend/supabase/seed-data.sql 同步)
// 採用 minimal JSON 結構 (前端會 normalize)

const INLINE_SHOPS = [
    { id:1, name:"莊記海產粥、鹽蒸蝦、鹽蒸蚵", cat_main:"麵粥/中式", cat_sub:"粥品/海鮮", price_bar:"$", price_min:100, price_max:200, rating:3.8, review_count:459, time_label:"下次開門 17:30", is_24h:false, is_late_night:false, is_non_late:false, address:"800高雄市新興區長驛里六合二路94號", addr_short:"800高雄市新興區長驛里六合二路94號", district:"新興區", station_id:"R11", feature:"高雄宵夜海產粥名店,營業到凌晨 3:30,海鮮料多實在。", source:"Google Maps", confidence:"高" },
    { id:2, name:"黑輪坤", cat_main:"小吃/夜市", cat_sub:"小吃/關東煮", price_bar:"$", price_min:50, price_max:100, rating:4.2, time_label:"營業至 03:00", is_24h:false, is_late_night:true, is_non_late:false, address:"831高雄市大寮區中庄里仁愛路19號", addr_short:"831高雄市大寮區中庄里仁愛路19號", district:"大寮區", station_id:null, feature:"營業到凌晨4點的關東煮/黑輪老店。", source:"Google Maps", confidence:"高" },
    { id:3, name:"五元粥(蕊姨素食)", cat_main:"麵粥/中式", cat_sub:"素食/清粥小菜", price_bar:"$", price_min:50, price_max:100, rating:4.6, time_label:"下次開門 03:00", is_24h:false, is_late_night:false, is_non_late:false, address:"804高雄市鼓山區綠川里興隆路31號", addr_short:"804高雄市鼓山區綠川里興隆路31號", district:"鼓山區", station_id:"C17", feature:"凌晨3點才開賣的素食清粥小菜。", source:"Google Maps", confidence:"高" },
    { id:4, name:"爆力雞台式鹽酥雞", cat_main:"小吃/夜市", cat_sub:"小吃/鹹酥雞", price_bar:"$", price_min:60, price_max:150, rating:4.4, time_label:"營業至 00:00", is_24h:false, is_late_night:true, is_non_late:false, address:"804高雄市鼓山區明誠里文忠路64號", addr_short:"804高雄市鼓山區明誠里文忠路64號", district:"鼓山區", station_id:"R14", feature:"台式鹹酥雞,免費任選兩種配料。", source:"Google Maps", confidence:"高" },
    { id:5, name:"林記豆漿店", cat_main:"傳統早點", cat_sub:"傳統早點/宵夜", price_bar:"$", price_min:50, price_max:120, rating:4.2, time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"804高雄市鼓山區華豐里明倫路46號", addr_short:"804高雄市鼓山區華豐里明倫路46號", district:"鼓山區", station_id:"R14", feature:"巨蛋周邊老字號豆漿店。", source:"Google Maps", confidence:"高" },
    { id:6, name:"曾氏福建炒麵 瑞豐總店", cat_main:"麵粥/中式", price_bar:"$", price_min:60, price_max:120, rating:4.9, review_count:7490, time_label:"下次開門 17:00", is_24h:false, is_late_night:false, is_non_late:false, address:"813高雄市左營區南屏路瑞豐夜市第一排", addr_short:"813高雄市左營區南屏路瑞豐夜市第一排", district:"左營區", station_id:"R14", feature:"巨蛋周邊經典必吃,福建炒麵獨特鍋氣。", source:"Google Maps", confidence:"高" },
    { id:7, name:"華寧麻辣火鍋", cat_main:"火鍋", price_bar:"$$$", price_min:300, price_max:500, rating:4.8, review_count:2476, time_label:"下次開門 17:00", is_24h:false, is_late_night:false, is_non_late:false, address:"813高雄市左營區新上里自由二路395號", addr_short:"813高雄市左營區新上里自由二路395號", district:"左營區", station_id:"R14", feature:"巨蛋周邊麻辣火鍋,深夜聚餐首選。", source:"Google Maps", confidence:"高" },
    { id:8, name:"瑞豐夜市", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 00:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市鼓山區", district:"鼓山區", station_id:"R14", feature:"高雄最大夜市之一。", source:"Google Maps", confidence:"高" },
    { id:9, name:"老二腿庫飯", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 03:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"R8", feature:"在地老字號腿庫飯。", source:"Google Maps", confidence:"高" },
    { id:10, name:"貳堂鍋物", cat_main:"火鍋", price_bar:"$$", time_label:"營業至 02:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市苓雅區", district:"苓雅區", station_id:"R8", feature:"深夜火鍋。", source:"Google Maps", confidence:"高" },
    { id:11, name:"玖夜 NineNight", cat_main:"餐酒館/排餐", price_bar:"$$", time_label:"營業至 01:30", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市苓雅區", district:"苓雅區", station_id:"R8", feature:"深夜餐酒館。", source:"Google Maps", confidence:"高" },
    { id:12, name:"焰陽烤肉Bar", cat_main:"烤肉/串燒", price_bar:"$$$", time_label:"營業至 00:30", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市苓雅區", district:"苓雅區", station_id:"R8", feature:"深夜燒肉。", source:"Google Maps", confidence:"高" },
    { id:13, name:"醇酒場", cat_main:"居酒屋/日式", price_bar:"$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市苓雅區", district:"苓雅區", station_id:"R8", feature:"深夜居酒屋。", source:"Google Maps", confidence:"高" },
    { id:14, name:"晚點見港式宵夜點心", cat_main:"小吃/夜市", price_bar:"$$", time_label:"營業至 04:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市苓雅區", district:"苓雅區", station_id:"R8", feature:"凌晨港式點心。", source:"Google Maps", confidence:"高" },
    { id:15, name:"承 居酒屋", cat_main:"居酒屋/日式", price_bar:"$$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市三民區澄清路733號", addr_short:"高雄市三民區澄清路733號", district:"三民區", station_id:"C27", feature:"文山特區居酒屋。", source:"Google Maps", confidence:"高" },
    { id:16, name:"容燒居酒屋-高雄新興店", cat_main:"居酒屋/日式", price_bar:"$$$", time_label:"下次開門 18:00", is_24h:false, is_late_night:false, is_non_late:false, address:"高雄市新興區", district:"新興區", station_id:"R10", feature:"新興區日式居酒屋。", source:"Google Maps", confidence:"高" },
    { id:17, name:"柶築晚酌の店", cat_main:"居酒屋/日式", price_bar:"$$$", time_label:"營業至 00:30", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市新興區", district:"新興區", station_id:"R10", feature:"深夜日式。", source:"Google Maps", confidence:"高" },
    { id:18, name:"晨壹早午餐", cat_main:"傳統早點", price_bar:"$", time_label:"營業至 13:00", is_24h:false, is_late_night:false, is_non_late:false, address:"高雄市", district:"新興區", station_id:"R10", feature:"粉漿蛋餅專賣。", source:"Google Maps", confidence:"高" },
    { id:19, name:"老江紅茶牛奶-南台總店", cat_main:"傳統早點", price_bar:"$", time_label:"24 小時營業", is_24h:true, is_late_night:true, is_non_late:false, address:"800高雄市新興區明莊里南台路51號", addr_short:"800高雄市新興區明莊里南台路51號", district:"新興區", station_id:"R10", feature:"24hr 紅茶老店。", source:"Google Maps", confidence:"高" },
    { id:20, name:"豐味小火鍋", cat_main:"火鍋", price_bar:"$$", time_label:"24 小時營業", is_24h:true, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"R10", feature:"24hr 小火鍋。", source:"Google Maps", confidence:"高" },
    { id:21, name:"酒肉武林9650-2", cat_main:"餐酒館/排餐", price_bar:"$$", time_label:"營業至 02:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"三民區", station_id:"R10", feature:"深夜餐酒館。", source:"Google Maps", confidence:"中" },
    { id:22, name:"Ruelle Bar & Dining 巷子餐酒館", cat_main:"餐酒館/排餐", price_bar:"$$$", time_label:"營業至 00:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"R10", feature:"餐酒館。", source:"Google Maps", confidence:"中" },
    { id:23, name:"高雄市六合國際觀光夜市", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 00:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"新興區", station_id:"R10", feature:"六合夜市。", source:"Google Maps", confidence:"中" },
    { id:24, name:"高雄牛乳大王", cat_main:"傳統早點", price_bar:"$", time_label:"營業至 02:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"R10", feature:"老字號牛乳。", source:"Google Maps", confidence:"中" },
    { id:25, name:"蘋果雞鹹酥雞 高雄左營店", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 21:00", is_24h:false, is_late_night:false, is_non_late:true, address:"813高雄市左營區福山里榮總路23號", addr_short:"813高雄市左營區福山里榮總路23號", district:"左營區", station_id:null, feature:"⚠️ 約 21-22 點打烊, 非深夜宵夜。", source:"i17fun", confidence:"中" },
    { id:26, name:"彎腰湯圓", cat_main:"麵粥/中式", price_bar:"$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"804高雄市鼓山區明誠里南屏路537號", addr_short:"804高雄市鼓山區明誠里南屏路537號", district:"鼓山區", station_id:"R14", feature:"手工鹹湯圓、蛤蜊鍋燒麵。", source:"i17fun", confidence:"中" },
    { id:27, name:"田季發爺燒肉 高雄中山店", cat_main:"烤肉/串燒", price_bar:"$$$", time_label:"營業至 02:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"新興區", station_id:"R9", feature:"深夜燒肉。", source:"Google Maps", confidence:"高" },
    { id:28, name:"酒肉武林 (3rd)", cat_main:"餐酒館/排餐", price_bar:"$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"O7", feature:"餐酒館。", source:"Google Maps", confidence:"中" },
    { id:29, name:"拾光餐酒館", cat_main:"餐酒館/排餐", price_bar:"$$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"O7", feature:"餐酒館。", source:"Google Maps", confidence:"中" },
    { id:30, name:"叁伍郎居酒屋", cat_main:"居酒屋/日式", price_bar:"$$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"左營區", station_id:"R16", feature:"左營居酒屋。", source:"Google Maps", confidence:"中" },
    { id:31, name:"叁伍郎居酒屋二店", cat_main:"居酒屋/日式", price_bar:"$$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"O5", feature:"深夜居酒屋。", source:"Google Maps", confidence:"中" },
    { id:32, name:"打鹿岸原住民人文主題餐廳-高流店", cat_main:"餐酒館/排餐", price_bar:"$$$", time_label:"營業至 23:00", is_24h:false, is_late_night:true, is_non_late:false, address:"802高雄市苓雅區苓東里海邊路15號之4", addr_short:"802高雄市苓雅區苓東里海邊路15號之4", district:"苓雅區", station_id:"C10", feature:"高雄流行音樂中心旁原住民主題餐廳。", source:"Google Maps", confidence:"高" },
    { id:33, name:"小酌 FEWdrink", cat_main:"餐酒館/排餐", price_bar:"$$", time_label:"營業至 01:30", is_24h:false, is_late_night:true, is_non_late:false, address:"802高雄市苓雅區田西里文武三街56號", addr_short:"802高雄市苓雅區田西里文武三街56號", district:"苓雅區", station_id:"O8", feature:"深夜義大利麵,調酒到凌晨。", source:"Google Maps", confidence:"高" },
    { id:34, name:"炙友/日式餐廳.串燒", cat_main:"烤肉/串燒", price_bar:"$$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"802高雄市苓雅區城北里興中二路140號", addr_short:"802高雄市苓雅區城北里興中二路140號", district:"苓雅區", station_id:"O8", feature:"苓雅區人氣深夜食堂,串燒/燒烤。", source:"Google Maps", confidence:"高" },
    { id:35, name:"夜葉食堂建工店", cat_main:"居酒屋/日式", price_bar:"$$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"807高雄市三民區正順里建工路499-2號", addr_short:"807高雄市三民區正順里建工路499-2號", district:"三民區", station_id:"C28", feature:"平價日式屋台風居酒屋。", source:"Google Maps", confidence:"高" },
    { id:36, name:"C'est Bon Bar & Restaurant 河堤店", cat_main:"餐酒館/排餐", price_bar:"$$$", time_label:"營業至 01:30", is_24h:false, is_late_night:true, is_non_late:false, address:"807高雄市三民區鼎泰里明賢街86號", addr_short:"807高雄市三民區鼎泰里明賢街86號", district:"三民區", station_id:"C24", feature:"河堤社區餐酒館,深夜小酌。", source:"Google Maps", confidence:"高" },
    { id:37, name:"老店柏弘肉燥(鹽埕店)", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市鹽埕區", district:"鹽埕區", station_id:"O2", feature:"鹽埕老字號肉燥飯。", source:"Google Maps", confidence:"中" },
    { id:38, name:"丰味小火鍋", cat_main:"火鍋", price_bar:"$$", time_label:"營業至 00:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"O5", feature:"深夜小火鍋。", source:"Google Maps", confidence:"中" },
    { id:39, name:"旻哥古早味 七賢店", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 00:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"O5", feature:"古早味小吃。", source:"Google Maps", confidence:"中" },
    { id:40, name:"打狗文創火鍋", cat_main:"火鍋", price_bar:"$$", time_label:"營業至 02:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市", district:"苓雅區", station_id:"O8", feature:"深夜火鍋。", source:"Google Maps", confidence:"中" },
    { id:41, name:"紅嘴巴麻辣乾鍋", cat_main:"火鍋", price_bar:"$$", time_label:"營業至 00:00", is_24h:false, is_late_night:true, is_non_late:false, address:"802高雄市苓雅區興中一路260巷7號", addr_short:"802高雄市苓雅區興中一路260巷7號", district:"苓雅區", station_id:"O8", feature:"隱藏麻辣宵夜店。", source:"Google Maps", confidence:"中" },
    { id:42, name:"孫東寶牛排 高雄左營店", cat_main:"餐酒館/排餐", price_bar:"$$", time_label:"營業至 21:00", is_24h:false, is_late_night:false, is_non_late:true, address:"813高雄市左營區新上里裕誠路368號", addr_short:"813高雄市左營區新上里裕誠路368號", district:"左營區", station_id:"R8", feature:"⚠️ 連鎖家庭牛排, 21:00 打烊, 非深夜宵夜。", source:"Google Maps", confidence:"高" },
    { id:43, name:"達樂斯美式牛排 自由店", cat_main:"餐酒館/排餐", price_bar:"$$", time_label:"營業至 21:30", is_24h:false, is_late_night:false, is_non_late:true, address:"813高雄市左營區新上里自由二路25號", addr_short:"813高雄市左營區新上里自由二路25號", district:"左營區", station_id:"R14", feature:"⚠️ 連鎖家庭牛排, 21:30 打烊, 非深夜宵夜。", source:"Google Maps", confidence:"高" },
    { id:44, name:"西堤牛排 高雄富國店", cat_main:"餐酒館/排餐", price_bar:"$$", time_label:"營業至 22:00", is_24h:false, is_late_night:false, is_non_late:true, address:"813高雄市左營區新上里富國路302號", addr_short:"813高雄市左營區新上里富國路302號", district:"左營區", station_id:"R14", feature:"⚠️ 連鎖西餐, 21:00 - 22:00 打烊, 非深夜宵夜。", source:"Google Maps", confidence:"高" },
    { id:45, name:"高雄市鹽埕區老店群", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 01:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市鹽埕區", district:"鹽埕區", station_id:"O2", feature:"鹽埕區老店群。", source:"Hoolee", confidence:"中" },
    { id:46, name:"鼓山輪渡站周邊宵夜", cat_main:"小吃/夜市", price_bar:"$", time_label:"營業至 02:00", is_24h:false, is_late_night:true, is_non_late:false, address:"高雄市鼓山區", district:"鼓山區", station_id:"C12", feature:"駁二周邊宵夜。", source:"Hoolee", confidence:"中" },
];

const INLINE_STATIONS = [
    { id:"R11", name:"高雄車站", line:"red" },
    { id:"R14", name:"巨蛋站", line:"red" },
    { id:"R8",  name:"三多商圈站", line:"red" },
    { id:"R9",  name:"中央公園站", line:"red" },
    { id:"R10", name:"美麗島站", line:"red" },
    { id:"R16", name:"左營站", line:"red" },
    { id:"O14", name:"衛武營站", line:"orange" },
    { id:"O2",  name:"鹽埕埔站", line:"orange" },
    { id:"O5",  name:"美麗島站", line:"orange" },
    { id:"O7",  name:"文化中心站", line:"orange" },
    { id:"O8",  name:"三多商圈站", line:"orange" },
    { id:"C12", name:"駁二大義站", line:"lrt" },
    { id:"C14", name:"哈瑪星站", line:"lrt" },
    { id:"C17", name:"鼓山區公所站", line:"lrt" },
    { id:"C24", name:"美術館站", line:"lrt" },
    { id:"C27", name:"正義車站", line:"lrt" },
    { id:"C28", name:"高雄高工站", line:"lrt" },
    { id:"C10", name:"光榮碼頭站", line:"lrt" },
];

function loadSeed() {
    if (mockStore.shops.length > 0) return;
    // 1) 優先用 inline 資料 (Vercel/Lambda 安全)
    mockStore.shops = JSON.parse(JSON.stringify(INLINE_SHOPS));
    mockStore.stations = JSON.parse(JSON.stringify(INLINE_STATIONS));
    // 2) 如果有 SQL 檔可讀 (Netlify 本地開發), 用 SQL 蓋過
    try {
        const candidates = [
            path.join(__dirname, '..', '..', 'backend', 'supabase', 'seed-data.sql'),
            path.join(__dirname, '..', 'backend', 'supabase', 'seed-data.sql'),
        ];
        for (const p of candidates) {
            if (fs.existsSync(p)) {
                const sql = fs.readFileSync(p, 'utf-8');
                const shops = parseSeedSql(sql);
                if (shops.length > 0) {
                    mockStore.shops = shops.map((s, i) => ({ ...s, id: i + 1, is_active: true }));
                    console.log(`[seed] 從 SQL 覆寫: ${shops.length} 家`);
                }
                break;
            }
        }
    } catch (e) { /* ignore, use inline */ }
    console.log(`[seed] 載入 ${mockStore.shops.length} 家店 + ${mockStore.stations.length} 站`);
}

function parseSeedSql(sql) {
    // 簡化解析器
    const valuesStart = sql.indexOf('values');
    if (valuesStart === -1) return [];
    const afterValues = sql.substring(valuesStart + 6);
    const rows = [];
    let depth = 0, inStr = false, escape = false, current = '';
    for (let i = 0; i < afterValues.length; i++) {
        const ch = afterValues[i];
        if (inStr) {
            if (escape) { escape = false; current += ch; continue; }
            if (ch === '\\') { escape = true; current += ch; continue; }
            if (ch === "'") { inStr = false; current += ch; continue; }
            current += ch; continue;
        }
        if (ch === "'") { inStr = true; current += ch; continue; }
        if (ch === '(' && depth === 0) { depth = 1; current = '('; continue; }
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
    s = s.trim();
    if (s.startsWith('(')) s = s.slice(1);
    if (s.endsWith(')')) s = s.slice(0, -1);
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
            current += ch; continue;
        }
        if (ch === "'") { inStr = true; current += ch; continue; }
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === sep && depth === 0) { out.push(current.trim()); current = ''; continue; }
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
        let i = 1, s = '';
        while (i < v.length) {
            const ch = v[i];
            if (ch === "'" && v[i+1] === "'") { s += "'"; i += 2; continue; }
            if (ch === "'") { i++; break; }
            s += ch; i++;
        }
        const rest = v.slice(i).trim();
        const typeMatch = rest.match(/^::(\w+)$/);
        const type = typeMatch ? typeMatch[1] : null;
        if (type === 'jsonb' || type === 'json') {
            try { return JSON.parse(s); } catch { return s; }
        }
        return s;
    }
    if (/^-?\d+$/.test(v)) return parseInt(v);
    if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
    return v;
}

module.exports = { loadSeed, INLINE_SHOPS, INLINE_STATIONS };
