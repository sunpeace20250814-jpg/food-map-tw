# AGENTS.md

> 給未來 agent 的速查指南 — 只列「不讀這份就會踩雷」的點。

## 專案一句話
高雄 (46 家) + 台南 (50 家) 捷運/輕軌周邊宵夜互動地圖，共 96 家。
**純前端靜態網頁，無後端。**

## 開發指令
```bash
# 本地預覽
npm start                # npx serve .  → http://localhost:3000
start index.html         # 或直接用瀏覽器打開

# 部署 (push to main 自動觸發 Vercel CI)
git push origin main
```

CI 在 `.github/workflows/deploy-vercel.yml` — push main → 自動 `vercel deploy --prod`。

## 架構 — 必讀
- **單一資料源**：`index.html` 內嵌 96 張 shop-card（含 `data-*` 屬性）+ `window.SHOP_DATA_INITIAL` 完整陣列（供 detail sheet 渲染）
- **零後端**：沒有 `api/`、沒有 `netlify/functions/`、沒有 `backend/`、沒有 Supabase。`assets/js/api.js` 不存在。
- **零 `fetch` 請求**：篩選/計數/排序全讀 DOM 屬性。
- **零 node_modules 開發依賴**：`package.json` 只有 `npm start` 跑 `npx serve`。

## 檔案地圖
```
index.html              # 96 卡片 + SHOP_DATA_INITIAL + UI (1648 行)
vercel.json             # 純靜態部署 (uses @vercel/static)
package.json            # 只有 npm start
assets/
├── css/                # main / components / filters / mobile / table
└── js/
    ├── app.js          # 主程式 (state / 渲染 / 事件) ~821 行
    ├── filters.js      # 篩選邏輯 (讀 DOM data-* 屬性)
    ├── sheet.js        # 店家 detail sheet
    └── favorites.js    # localStorage 收藏 (~150 行)
.github/workflows/deploy-vercel.yml
```

## 慣例與坑
- **DOM 必須用 `el()` 工具函式建立** (XSS-safe, `assets/js/app.js:17`) — 禁止 innerHTML
- **iOS 滾動鎖** 用 `lockBodyScroll/unlockBodyScroll` (支援巢狀 sheet, `app.js:29-56`)
- **店家資料** 改卡片要改兩處 (`index.html` 的 `data-*` + `window.SHOP_DATA_INITIAL` 對應物件) — 這是**唯一**會不一致的地方，沒有其他副本
- **台南店家 50 筆** (`data-shop-idx="46"`~`"95"`): `data-line="tn-area"` (台南無捷運，用區域代號), `data-station` 為「區域/地標」格式 (例: `中西區/國華街`)
- **照片來源** ⚠️ **已停用** (2026-06-15): 95 張來自 `https://lh3.googleusercontent.com/gps-cs-s/APN...=w###-h###-k-no` (Google Maps Place Photo CDN) 經視覺驗證確認品質不佳 — 12 家抽樣中只有 3 家 (25%) 為真實店家照片,5 家 (41%) 完全抓錯店 (含抓到中國簡體字店家「烧肉笑锅」「丰味小火鍋」「弘前屋」「見點睇」「鳥事 BIRD」),4 家不確定。**全 96 家已清空 `shop.photos: []` + 移除卡片 `card-photo-thumb`**,加 `<div class="photo-disclaimer">` 透明聲明。後續若要重啟圖片功能,需改來源 (店家 IG/FB 官方帳號或商家自行上傳的高品質圖)。

## 2026-06-15 修補紀錄
- **Hero stat 硬編碼**: `statTotal/24h/Late/Stations` 由 `49/3/49/14` 改為 `--` (JS 動態寫入前不騙人)
- **v2/ 75MB 不進部署**: 新增 `.vercelignore` 排除 v2/ + 一次性 cjs 腳本 + 開發工具狀態,部署包從 75MB → 540KB
- **Quick-bar chip** 初始值 `--` → `0`
- **title/meta** 從「47+ 家」改為「96 家」
- **圖片全清空 + 透明聲明** (見上)
- **`.opencode/` 與 `.swarm/` 已被 `.gitignore` 排除**，看到目錄存在但沒被追蹤是正常的

## 沒有這些東西
- ❌ 後端 API (Vercel / Netlify Functions)
- ❌ 資料庫 (Supabase / KV)
- ❌ 圖片爬蟲 (Playwright 依賴已移除)
- ❌ 單元/E2E 測試
- ❌ `.env.example` / 環境變數
- ❌ `docs/`、`reports/`、`scripts/` 目錄

## 月費 = $0
無後端、無資料庫、無第三方付費服務。圖片走 Google 免費 CDN。部署 Vercel 免費額度內。

## 提交策略
- 看到 `index.html` 改 50+ 行 → 新增/修改店家卡片
- 修改店家時：檢查 `data-*` 屬性 + `SHOP_DATA_INITIAL` 對應物件是否一致