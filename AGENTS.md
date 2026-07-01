# AGENTS.md — 美食遊覽

> 給未來 agent 的速查指南。只列「不讀這份就會踩雷」的點。

---

## 專案一句話

高雄 (46) + 台南 (50) + 彰化 (68) = **164 家宵夜互動地圖**。
純前端 SPA + Supabase Cloud（動態店家載入 + 使用者推薦 + 管理員審核）。

---

## 最新版本

| 項目 | 數值 |
|---|---|
| **版本** | **v10.1** (commit `3294da7`) |
| commit date | 2026-07-01 |
| 店家總數 | 164 |
| 有驗證照片 | 135 (82%) |
| 無照片（純文字卡） | 29 |
| index.html 大小 | ~654 KB |
| 部署 URL | https://food-map-tw-dun.vercel.app |
| 月費 | $0 (Vercel + Supabase free tier) |

### v10.1 重點

- **Sheet 統一**：移除 `shop-loader.js` 內重複的 sheet 渲染 (~75 行死碼)，由 `sheet.js` 唯一負責
- **Sheet 完整版**：週一~週日表格、照片縮圖條（含「看完整相簿」按鈕）、顧客評論、收藏 toggle、線上訂位
- **Reviews 資料**：`assets/data/reviews.json`（目前 `{}` stub，等店家評論整理）
- **Code 清理**：刪除 11 個歷史截圖/垃圾二進位、移除 1 個 legacy `tmp_imgs/*.jpg`、刪除 legacy `.cjs/.mjs` 腳本

---

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Vanilla JS (ES6 module)，無框架 |
| 樣式 | 純 CSS (Cyberpunk Glassmorphism 霓虹青/紫)v9 |
| 後端 | Supabase Cloud (Postgres + RLS + Auth) |
| 部署 | Vercel (GitHub auto-deploy) |
| Build-time env | `build-inject.js` (inject SUPABASE_URL + ANON_KEY) |
| 測試 | Playwright (`tests/e2e.spec.js`) |

**禁止**：alert/prompt/confirm、innerHTML（用 `el()` 工具函式）、寫 secret 進 source code、跑 vercel/gh/supabase CLI 互動指令。

---

## 檔案地圖

```
美食遊覽/
├── index.html              # 1777 行，含 164 張 shop-card + SHOP_DATA_INITIAL
├── build-inject.js         # Vercel build-time 注入 env
├── vercel.json             # buildCommand: node build-inject.js
├── package.json            # 只有 npm start (npx serve)
├── .github/workflows/deploy-vercel.yml
├── .env.local              # 已被 .gitignore（勿 commit）
├── assets/
│   ├── css/
    │   │   ├── app.css         # 1100+ 行，v9 Cyberpunk Glassmorphism + v10.1 sheet styles
    │   │   └── open-props.css  # 29KB
    │   └── js/
    │       ├── app.js          # 872 行，主程式 (filter / tab / theme glue)
    │       ├── theme.js        # 主題切換 (dark/light/auto + localStorage)
    │       ├── filters.js      # 縣市/類型/時段篩選
    │       ├── sheet.js        # 店家詳情 modal (v10.1: 唯一擁有 sheet 渲染)
    │       ├── favorites.js    # localStorage 收藏
    │       └── supabase/
    │           ├── supabase.min.js      # 199KB UMD SDK
    │           ├── supabase-client.js   # CRUD API
    │           ├── supabase-ui.js       # 推薦表單 + 管理員審核
    │           ├── shop-loader.js       # 動態載入店家 (卡片渲染 + 點擊委派給 sheet.js)
    │           └── supabase-bootstrap.js # build-inject 產物 (window.SUPABASE_URL 等)
    ├── supabase/
    │   ├── migrations/001_initial_schema.sql  # schema + RLS + 觸發器
    │   └── seed/001_initial_shops.sql         # 164 店家
    ├── tests/
    │   ├── e2e.spec.js        # Playwright e2e (6 tests)
    │   ├── mobile.spec.js     # Mobile viewport test
    │   ├── hover.spec.js      # Hover interaction test
    │   ├── full_test.py       # 10-point manual e2e (Python Playwright)
    │   └── package.json
    └── data/
        ├── README.md           # 資料維護工作流
        ├── TASKS.md            # 後續 backlog
        ├── reviews.json        # 顧客評論 (key = 店家名, 目前 `{}`)
        ├── template-new-city.csv # CSV 範本
        ├── validate.py         # 新縣市 schema + URL auto-fix
        ├── vision-verify.py    # vision 取樣驗證
        ├── vision-refetch.py   # 重抓低信心店家 lh3
        ├── vision-result.json  # 視覺驗證結果
        └── vision-batch3/      # 視覺驗證圖片 (30 JPGs + manifest)
```

---

## 架構要點

- **資料源**：`index.html` 內嵌 164 張 shop-card (`data-*` 屬性) + `window.SHOP_DATA_INITIAL` 陣列（detail sheet 渲染用）
- **Supabase 動態載入**：`shop-loader.js` 從 Supabase 拉店家，index.html 的 inline 資料是 fallback
- **零 `fetch` 篩選**：縣市/類型/時段篩選全讀 DOM `data-*` 屬性
- **DOM 工具**：`app.js:17` 的 `el()` 函式，XSS-safe，禁止 innerHTML
- **iOS 滾動鎖**：`lockBodyScroll/unlockBodyScroll`，支援巢狀 sheet
- **Sheet 單一擁有者**：v10.1 起 `sheet.js` 是 sheet 渲染的唯一來源；`shop-loader.js` 只負責卡片點擊委派給 `window.openShopSheet(idx)`

---

## 開發指令

```bash
# 本地預覽
npm start                # npx serve . → http://localhost:3000

# 部署（push main 觸發 Vercel CI 自動 build）
git push origin main

# Playwright 測試
cd tests && npx playwright test
```

---

## Commit 歷史 (v5 → v10)

| Commit | 版本 | 動作 |
|---|---|---|
| 38bc9cf | v5.11 | build-inject.js (build-time env inject) |
| 44b95cf | v6.14 | UI 視覺差異加大 (圓角/漸變/邊框/星星閃爍) |
| a046b3e | v6.13 | UI 升級 (借鑑 react-bits 設計) |
| 7480641 | v6.12 | web 驗證 134/135 (99%) 完成 |
| ca6ce40 | v7.0 | 重作整套 UI (Open Props 設計系統) |
| b31514d | v7.0.4 | Mobile 優化 (手機友善) |
| b1159c7 | v7.0.7 | 補 335 個 img alt + aria-label |
| ea698d8 | v8.0 | 極簡現代重設計 (1900→350 行 CSS) |
| 16f2ad5 | v9.0 | 科幻未來風重設計 (Cyberpunk Glassmorphism) |
| c05c5ce | v9.1 | agent 修補 + 啟動測試 server |
| 96ee1f1 | v9.2 | UI 邏輯驗證 + 隱藏 v7 殘留 |
| 147c0ff | v10.0 | 文檔整合 + 篩選 bug 修復 |
| 7349183 | v10.0 | cleanup (刪 .vibecoding/ + v2/ + 修 mobile.spec.js URL) |
| 2719a15 | v10.0 | 修 e2e test 6: visible cards 計數 |
| **3f10411** | **v10.1** | **chore: 刪 junk artifacts + shop-loader.js dedupe** |
| **3294da7** | **v10.1** | **feat: sheet 完整版 (weekly hours / photo strip / reviews)** |

---

## 圖片系統

- **圖源**：Google Maps Place Photo lh3 URL（免費 CDN，1024×768 或 408×306）
- **資料流**：`SHOP_DATA_INITIAL[idx].photos` → card-photo-strip（3 縮圖 + +N）→ btn-album（完整相簿 modal）
- **失敗標記**：`_no_photo: true` → 純文字卡
- **29 家無照片**：彰化 18 家（Maps auto-routing 抓不到）+ 其他 11 家

---

## 已知坑

- ❌ **lh3 URL 會過期**：Maps auto-routing 變化導致 403，需重新抓圖
- ❌ **彰化 18 家無照片**：Maps 對小型在地店 auto-routing 失敗，待 IG/FB 救援
- ❌ **.env.local 在 git 历史**：已加進 .gitignore，但历史 commit 仍有（需要 `git filter-branch` 清理）
- ❌ **`tmp_imgs/` 殘留**：歷史圖檔目錄，v10.1 已 git rm，但若新加圖檔需注意
- ❌ **CSS bug**: `.album-modal` 等 class 在 CSS 缺規則（HTML/JS 都有用），點卡片縮圖開相簿會無樣式（v10.1 發現）
- ✅ agent-browser 對 Maps 不被擋（Playwright 會被擋）
- ✅ Maps 搜尋「店名 + 縣市」直接進 place page
- ✅ **build-inject.js 會自動覆寫** `assets/js/supabase/supabase-bootstrap.js` 和 `index.html` 的 Supabase meta tag（每次 deploy / 本地 build 都會重生，不要手改這兩處）

---

## 沒有的東西（勿找）

- ❌ 後端 API server（Vercel Functions / Express 等）
- ❌ 圖片爬蟲腳本（已移除）
- ❌ `.vibecoding/` 目錄（已刪除，內容整合進本檔）
- ❌ `docs/`、`reports/`、`scripts/` 目錄
