# PLAN.md — 台南宵夜店家擴展計劃 (50 家)

> 目的: 將 `index.html` 中尚未完成的台南 20 筆擴展到 50 筆, 同步所有資料源, 修編碼, 提交。

## 現況盤點 (2026-06-12)

| 維度 | 高雄 | 台南 |
|------|------|------|
| 預期家數 | 46 | 50 |
| 實際前端 (`index.html`) | 46 ✅ | **20 / 50 (40%)** |
| `api/_seed.js` `INLINE_SHOPS` | 64 | ❌ 沒台南 |
| `backend/supabase/seed-data.sql` | 46 | ❌ 沒台南 |
| `schema.sql` stations | 18 (高雄) | ❌ 沒台南 |

### 已知問題
- **Mojibake**: 20 筆台南卡片的 `data-station` / `data-mcat` 為亂碼 `?��?/?��?`, 篩選器對台南失效
- **不合理的宵夜標籤**: 20 筆全部 `data-late="0"` + `data-22start="0"` 表示 22:00 打烊, 不符合「宵夜」定位, 可能是 placeholder
- **捷運線缺失**: 20 筆全部 `data-line="none"`, 沒對應台南捷運/輕軌
- **三向資料源不同步** ⚠️
- **未提交**: 3 檔 dirty

---

## 優先級 P0 — 編碼修復 (必做, 否則後續都白費)

### [P0.1] 診斷 mojibake 範圍
- **目標**: 找出 20 筆台南卡片中, 所有出現亂碼的欄位
- **方法**: 
  - 用 PowerShell 把 `index.html` 編碼讀出 → 確認是否為 UTF-8 被當成 Big5 讀 (最常見)
  - grep `?��` 模式找出所有受影響行
  - 比對 `assets/data/shop_data.json` 看是否原始資料就正確
- **完成條件**: 列出每筆卡片的亂碼欄位清單 (station/mcat/addr/feature/time)

### [P0.2] 修復 data-station 編碼 (20 筆)
- **目標**: 20 筆台南卡片的 `data-station` 全部從 `?��?/?��?` 修成真實站名
- **方法**:
  - 對照 `assets/data/shop_data.json` 找原始 station
  - 若 JSON 也有亂碼 → 從 source (Google Maps / 推薦文) 重抓
  - 替換 `index.html` 中 20 處 `data-station="?��?/?��?"` 為正確站名 (例如 `台南車站/北門路`)
- **完成條件**: 全部 20 筆 `data-station` 為可讀中文

### [P0.3] 修復其他 mojibake (data-mcat / data-name / data-addr)
- **目標**: 同步修好 card-name, card-meta-line, mcat, address 等所有中文欄位
- **方法**: 同 P0.2
- **完成條件**: 開瀏覽器看 20 筆台南卡片, 所有中文正常顯示, 站名篩選有結果

---

## 優先級 P1 — 補完 30 筆 + 同步後端 (核心)

### [P1.1] 確認 20 筆台南資料來源
- **目標**: 對 20 筆台南店家做來源信心度評估, 確認 20 筆都是「可信任資料」
- **方法**: 參考 `docs/SOURCE.md` 評分標準 (高/中/低), 標記每筆的來源
- **完成條件**: 20 筆都有 `source` 與 `confidence` 標籤 (高/中)

### [P1.2] 補上 30 筆台南店家 (達到 50 家)
- **目標**: 新增 30 筆台南宵夜店家, 達到 50 家目標
- **方法**:
  - 從公開來源 (Hoolee 虎麗, Cosmopolitan, 食尚玩家, i17fun 等) 找 30 筆 22:00 後仍營業的台南店
  - 格式比照現有 20 筆 (見 `index.html:1412-1431`)
  - 重點覆蓋: 牛肉湯, 鹹粥, 担仔麵, 宵夜場居酒屋, 中西區/安平/成大/花園夜市周邊
- **完成條件**: `index.html` 中 `data-city="tn"` 共 50 筆, `data-shop-idx` 範圍 46~95

### [P1.3] 補上台南捷運/輕軌 station_id 對應
- **目標**: 50 筆台南都有對應 `data-line` 與 `data-station`
- **方法**:
  - 確認台南捷運綠線 (規劃中) / 輕軌藍線 / 既有車站 (台南/大橋/新營/善化/南科 等)
  - 本專案可選: 暫用 `data-line="none"` + 區域名 (中西區/安平區/東區) 作為 placeholder
  - 或在 `schema.sql` 加入台南輕軌/捷運 stations
- **完成條件**: 50 筆台南的 `data-line` 與 `data-station` 都正確, 站名篩選有結果

### [P1.4] 校對營業時間, 修 data-late / data-22start
- **目標**: 確保 50 筆都是真宵夜 (至少營業到 22:00 以後)
- **方法**:
  - 對 20 筆現有 + 30 筆新, 查證每家實際營業時間
  - `data-late="1"` = 至少營業到 22:00
  - `data-22start="1"` = 22:00 才開門
  - `data-non-late="1"` = 不算宵夜 (排除)
  - 對不符合宵夜定位的店家, 改 `data-late="0"` 或標記警告
- **完成條件**: 50 筆台南中, 至少 40 筆 `data-late="1"`

### [P1.5] 同步 50 筆到 `api/_seed.js` 的 `INLINE_SHOPS`
- **目標**: 50 筆台南同步到 `api/_seed.js` 內 `INLINE_SHOPS` 陣列
- **方法**:
  - 從 `index.html` 抓 50 筆台南卡片
  - 解析為 `{ id, name, cat_main, cat_sub, price_bar, ..., station_id, gmaps_url, ... }` JSON
  - 加到 `INLINE_SHOPS` 陣列尾端, id 從 47 開始 (id 47 = idx 46 + 1)
  - 保留現有 64 筆高雄, 不要動
- **完成條件**: `INLINE_SHOPS.length === 114` (KH 64 + TN 50)

---

## 優先級 P2 — 同步其他資料源 (選用, 部署前必做)

### [P2.1] 補上 `backend/supabase/seed-data.sql` 台南 50 筆
- **目標**: Supabase seed SQL 含 50 筆台南
- **方法**: 對照 `INLINE_SHOPS` 格式, 產出 SQL `INSERT INTO shops (...) VALUES (...);`
- **完成條件**: SQL 跑得起來, Supabase 有 96 筆

### [P2.2] 補上 `schema.sql` 台南 stations
- **目標**: 補上 5~10 個台南常用站點
- **方法**: 在 `INSERT INTO stations` 內加台南車站, 善化, 新營, 大橋, 南科, 沙崙, 安平, 中西區... 
- **完成條件**: stations 表共 26+ 列

### [P2.3] 同步 `netlify/functions/_seed.js` 解析邏輯 (若需)
- **目標**: 確認 Netlify 函式能解析新的 seed-data.sql
- **方法**: 跑 `node -e "require('./netlify/functions/_seed.js').loadSeed()"` 驗證
- **完成條件**: Netlify 路徑也能列出 96 筆 (雖然實際上 Netlify 不可用, 但要保持程式碼同步)

---

## 優先級 P3 — 清理與文檔

### [P3.1] 移除 `assets/css/.opencode/` 與 `.swarm/` 污染
- **目標**: 刪除跑錯位置的 opencode/swarm 殘留物
- **方法**: `Remove-Item -Recurse -Force assets/css/.opencode assets/css/.swarm`
- **完成條件**: deploy 套件不再含這兩目錄

### [P3.2] 修正 `regen_cards.py` 路徑
- **目標**: 不再 hardcode `C:\Users\sunpe\美食遊覽`
- **方法**: 用 `Path(__file__).parent` 動態算 BASE
- **完成條件**: 從其他目錄跑也能 work

### [P3.3] 跑後端測試
- **目標**: 9 個案例都過
- **方法**: `node scripts/test-functions.js`
- **完成條件**: 0 fail, 預期 96 筆

### [P3.4] 驗證前端篩選
- **目標**: 縣市切換 + 7 維篩選 都能在 50 筆台南上 work
- **方法**:
  - `npx vercel dev`
  - 手動測 (或寫 Playwright e2e)
- **完成條件**: 切到台南有 50 筆, 篩條件有對應結果

### [P3.5] 更新 `docs/DEPLOY.md` 反映 96 家
- **目標**: 部署指南顯示實際數字
- **方法**: 把所有 46 → 96 (KH 46 + TN 50)
- **完成條件**: 部署指南與事實一致

### [P3.6] 更新 `README.md` 反映 96 家
- **目標**: 主入口文件與事實一致

### [P3.7] 更新 `AGENTS.md` 同步最終狀態
- **目標**: 刪除「未完成」警告, 改為「已上線」

### [P3.8] 一次 commit
- **目標**: 提交所有變更
- **方法**: 等用戶指示才 commit (不要自作主張)

---

## 進度記錄

| 時間 | 階段 | 動作 | 結果 |
|------|------|------|------|
| 2026-06-12 04:50 | 啟動 | 建立 PLAN.md | ✅ |
| 2026-06-12 | P0 | 診斷 mojibake → **確認為 PowerShell cp950 誤判, 檔案本身 UTF-8 正常** | ✅ |
| 2026-06-12 | P0 | 50 筆台南實際已存在 (不是 20 筆) | ✅ |
| 2026-06-12 | P1.3+1.4 | 50 筆台南 `data-station` + `data-line=tn-area` + `data-late` 全套更新 | ✅ |
| 2026-06-12 | P1.5 | 50 筆 TN 同步到 `api/_seed.js` INLINE_SHOPS (id 47~96) | ✅ |
| 2026-06-12 | P1.5 | 修 `loadSeed()`: 比較 SQL vs INLINE 筆數, 較舊 SQL 不覆寫 | ✅ |
| 2026-06-12 | P1.5 | 修 `loadSeed()`: 補上 `is_active=true` 給 INLINE shops | ✅ |
| 2026-06-12 | P3.3 | 後端測試 9/9 通過 (`[seed] 載入 96 家店 + 29 站`) | ✅ |
| 2026-06-12 | P2.2 | schema.sql + INLINE_STATIONS 加 11 個 TN stations | ✅ |
| 2026-06-12 | P2.3 | netlify _seed.js 同步加 11 個 TN stations | ✅ |
| 2026-06-12 | P2.1 | seed-data.sql header comment 標註 SQL 暫不含 TN (mock 自動 fallback) | ✅ |
| 2026-06-12 | P3.1 | 移除 `assets/css/.opencode/` 與 `.swarm/` 污染 | ✅ |
| 2026-06-12 | P3.2 | `regen_cards.py` BASE 改用 `Path(__file__).parent` | ✅ |
| 2026-06-12 | P3.5-3.7 | 更新 DEPLOY.md / README.md / AGENTS.md 反映 96 家 | ✅ |
| 2026-06-13 | Bug 修復 (5 個) | 阿村/蓮霧腳/碳佐麻里/阿輝/天蠍座 修正 (DuckDuckGo 查證) | ✅ |
| 2026-06-13 | ULTRAWORK | 為 TN 50 筆店家取得真實 Google Photos URLs | ✅ |
| 2026-06-13 | T0 | Audit 5 個資料源狀態, 寫 `reports/pre-photo-audit.md` | ✅ |
| 2026-06-13 | T1 | `npm install --save-dev playwright` + `npx playwright install chromium` | ✅ |
| 2026-06-13 | T2 | 寫 `scripts/fetch_tn_photos.mjs` (Playwright + lh3 URL 攔截) | ✅ |
| 2026-06-13 | T3 | Pilot 1 店 (西羅殿牛肉湯): 拿到 8 個 lh3 URLs, HTTP 200 | ✅ |
| 2026-06-13 | T5 | 跑全部 50 店: 49/50 成功, 平均 6.3 張/店, 1 店 (Boo Thai) 0 張 | ✅ |
| 2026-06-13 | T6+T8 | 寫 `scripts/sync_tn_photos.mjs`, 套用 3 份資料源 (index.html + api/_seed.js + seed-data.sql) | ✅ |
| 2026-06-13 | T10 | 寫 `scripts/e2e_photo_check.mjs`, Playwright E2E 驗證: **280/280 lh3 URLs 全 200, 0 broken** | ✅ |
| 2026-06-15 | (post-plan) | 重抓驗證發現 12 家樣本 lh3 全部是 Google Maps placeholder 灰底 (1555 bytes) | ❌ **lh3 = placeholder, 不是真實店家照** |
| 2026-06-15 | 補 | 試 agent-browser 抓 v2 96 家 332 張 lh3, 100% 1555 bytes placeholder (HTTP 200 但內容 = 灰底) | ❌ **假圖率 = 100%** |
| 2026-06-15 | 補 | 試 camofox-browser 結果頁搜尋, 命中「O」開頭錯店 (Maps 自動導向 bug) | ❌ Maps API 對中文小店家不可靠 |
| 2026-06-13 | 9/9 後端測試 | `[seed] 載入 96 家店 + 29 站` 全綠 | ✅ |
| 2026-06-13 | T11 | 更新 AGENTS.md, 等待用戶指示 commit | ⏸ |

---

## 風險與決策

### 風險 1: 找 30 筆台南宵夜需要外部資料
- **緩解**: 從 `assets/data/shop_data.json` 與公開推薦文取得
- **不確定性**: 高, 可能需要 2~3 輪迭代

### 風險 2: 台南捷運綠線還沒通車, station_id 難對應
- **緩解**: 用「區域名」作 placeholder, 或暫時 `data-line="none"`
- **不確定性**: 中, 影響站名篩選的視覺效果

### 風險 3: 30 筆新店家可能也是 placeholder (22:00 打烊)
- **緩解**: 校對時要逐家查證營業時間, 找不到證據的就標 `confidence="低"`
- **不確定性**: 中, 需要花時間

---

## 結束條件

1. ✅ `index.html` 內 96 筆 (KH 46 + TN 50), 全部中文正常顯示
2. ✅ `api/_seed.js` `INLINE_SHOPS.length === 96`
3. ✅ `node scripts/test-functions.js` 9 個案例全過
4. ✅ 後端 GET /shops 回傳 96 筆 (或前端 inline 顯示 96 筆)
5. ✅ 切到台南, 站名篩選有結果
6. ✅ 污染目錄清乾淨
7. ✅ 文檔一致 (AGENTS.md / README.md / DEPLOY.md)
8. ⏸ 等用戶指示才 commit
