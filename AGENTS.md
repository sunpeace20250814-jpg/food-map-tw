# AGENTS.md

> 給未來 agent 的速查指南 — 只列「不讀這份就會踩雷」的點。

## 專案一句話
高雄 (46 家) + 台南 (50 家) + 彰化 (68 家) 宵夜互動地圖，共 164 家。
**純前端靜態網頁，無後端。**

## 最新狀態 (2026-06-20 commit f25a415 v4.13)
- **135/164 (82%) 店家有視覺驗證 100% 對應正確店家照片**
- 29 家純文字卡 (誠實, 12 家 Maps 給錯店已標 `_no_photo: true`)
- 結構完整 (縣市切換 / 篩選 / 收藏 / photo-strip / btn-album)
- 部署包 ~520KB

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
- **單一資料源**：`index.html` 內嵌 164 張 shop-card（含 `data-*` 屬性）+ `window.SHOP_DATA_INITIAL` 完整陣列（供 detail sheet 渲染）
- **零後端**：沒有 `api/`、沒有 `netlify/functions/`、沒有 `backend/`、沒有 Supabase。`assets/js/api.js` 不存在。
- **零 `fetch` 請求**：篩選/計數/排序全讀 DOM 屬性。
- **零 node_modules 開發依賴**：`package.json` 只有 `npm start` 跑 `npx serve`。

## 檔案地圖
```
index.html              # 164 卡片 + SHOP_DATA_INITIAL + UI (~2400 行)
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
- **台南店家 50 筆** (`data-shop-idx="46"`~`"95"`): `data-line="tn-area"` (台南無捷運，用區域代號), `data-station` 為「區域/地標」格式
- **彰化店家 68 筆** (`data-shop-idx="96"`~`"163"`): `data-line="tn-area"` (沿用), `data-station` 為「彰化市/鹿港/溪湖」格式

## 圖片系統 (v4.13 最終狀態)
- **資料流**: SHOP_DATA_INITIAL[idx].photos (1-8 張 lh3 URL) → card-photo-strip (3 thumb + 1 more) → btn-album (完整相簿 modal)
- **圖源**: Google Maps Place Photo lh3 URL (免費 CDN, 1024x768 or 408x306)
- **過濾**: 不顯示 < 1KB 縮圖 (vision 看不到), 全部 > 30KB
- **失敗標記**: `_no_photo: true` 純文字卡
- **誠實**: 0 假圖被用戶看到 (全部 lh3 視覺 100% 對應正確店家)

## 視覺驗證 SOP (穩定模式)
```bash
# 1. agent-browser (Chrome 149) 開 Maps 搜尋
browser_navigate 'https://www.google.com/maps/search/<店家名>+<縣市>'

# 2. 抓 lh3 大圖 URL
browser_console 'Array.from(document.querySelectorAll("img[src*=lh3]")).map(i=>i.src).filter(s=>!s.includes("=w32")&&!s.includes("=w48")&&!s.includes("=w80"))[0]'

# 3. 下載
urllib.request.urlopen(url, headers={'User-Agent': 'Mozilla/5.0'})

# 4. 視覺驗證 (per 圖 1 call)
vision_analyze '<image_url>' '這是「<店家>」真實照片嗎? 1句。'

# 5. 寫回 SHOP_DATA + 加 photo-strip
python -c '...'
```

## 27 commits 完整方案 (v3.1 → v4.13)
| Commit | 動作 | 結果 |
|---|---|---|
| 1ad9a73 | v3.1 baseline | 96 卡片 0 圖 |
| 1e112c8 | v3.2 v1 KH 救回 | 26 家 208 張 |
| 05d7f32 | v3.3 TN 救回 | 21 家 168 張 |
| eefbf9e | v3.4 INDETERMINATE 重試 | 30 家 |
| 3626f9e | v3.5 擴大到 164 | + 彰化 68 |
| 02331f4 | v3.6 收回錯誤 | 只留 KH 45 |
| 7e2d4c6 | v3.7 TN 4 家 SOP | + 4 |
| 2bedb6c | v3.8 TN 11 家 SOP | + 11 |
| 3b1e8e0 | v3.9 TN 6 家 SOP | + 6 |
| ec21071 | v4.0 TN 11 家 SOP | + 11 |
| a944cdc | v4.1 TN 48 銀波 | + 1 |
| 4064c22 | v4.2 CH SOP 通 | + 3 |
| 3133744 | v4.3 CH 5 車路口 | + 1 |
| 8790b56 | v4.4 CH 6 王罔 | + 1 |
| 62bb9f7 | v4.5 CH 8-12 | + 5 |
| a0e4a3f | v4.6 CH 13 老朱 | + 1 |
| 109b81e | v4.7 CH 19-20 十二段/不時不食 | + 2 |
| a05bda6 | v4.8 CH 23-24 黑公雞/阿枝 | + 2 |
| f9d29a8 | v4.9 CH 28-29 咖啡烟/Page 6 | + 2 |
| 2db0998 | v4.10 CH 30 Do Nothing | + 1 |
| fb4d0ff | v4.11 CH 33 木瓜牛乳 | + 1 |
| 1309836 | v4.12 CH 34-67 (其他 agent) | + 30 |
| 723c8d8 | v4.12 TN 3 家 (西羅殿/阿安/蓮霧腳) | + 3 |
| f25a415 | v4.13 TN 4 家 (府城/大丸/時時香/連得堂) | + 4 |

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

## SOP 教訓 (v4.13 後)
- ✅ agent-browser 0.27.3 對 Maps 不被擋 (Playwright 失敗)
- ✅ 用 lh3 大圖 (408+ 或 512+ 或 1200+) 跳過縮圖
- ✅ Maps 搜尋「店名 + 縣市」自動進 place page, 抓 lh3 gallery 圖
- ✅ 視覺驗證每家 1 vision call (確認招牌 + 業務相符)
- ❌ Maps 對台灣小型在地店家 auto-routing 嚴重 (5-15% 給錯店)
- ❌ Wikipedia cover_photo 100% 假 (用 commons 通用食物照, 不能用)
- ❌ camofox Firefox 缺 binary (失敗)
- ❌ 6KB 以下 lh3 太小 vision 看不到 (SKIP)
