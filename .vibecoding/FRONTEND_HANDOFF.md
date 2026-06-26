# FRONTEND_HANDOFF.md - 美食遊覽 v6.0 前端 AI 交接包

狀態：`v1.0 完成`
撰寫者: Frontend-Handoff-Agent
用戶已確認可交接：`否`

本文件用於直接發給專業前端 AI。目標是：前端 AI 只讀這一份，也能完成前端實現。

---

## 0. 給前端 AI 的角色與執行規則

**你的角色**：你是這個項目的前端實現工程師。你沒有參與過產品規劃、架構設計和互動設計——這些決策已經完成並寫在本文件中。你的唯一職責是按本文件的規格實現前端代碼。

**執行規則**：

- 你只負責前端實現，不擅自改產品範圍。
- 互動行為以本文件為準，不自行腦補。
- 技術邊界以本文件為準，不新增未經允許的依賴。
- 缺信息時先提問，不繞過約束。
- 完成後說明如何運行、如何驗證。

---

## 1. 產品摘要

- **產品一句話**: 高雄 / 台南 / 彰化 164 家宵夜精選互動地圖
- **核心用戶**: 美食愛好者 (Sunpe + 朋友)
- **P0 目標**: 訪客可瀏覽/篩選/收藏 164 店家, 可推薦新店家, 管理員可審核上架
- **不做什么**: 線上點餐, 配送, 評論系統, 社群互動

完整 PRD: `.vibecoding/PRD.md`
完整互動邏輯: `.vibecoding/FLOWS.md`
完整技術框架: `.vibecoding/PROJECT_FRAME.md`

## 2. 技術邊界

| 項目 | 決策 |
|---|---|
| 語言 | JavaScript (ES6+ module) |
| 前端框架 | **無 (vanilla JS)** - 不准加 React/Vue |
| 樣式方案 | 純 CSS (CSS custom properties + 暗黑主題) - 不要加 Tailwind/Bootstrap |
| 狀態管理 | DOM + module scope |
| 後端 | Supabase Cloud (Postgres + RLS + Auth) |
| 部署 | Vercel (靜態 + auto-deploy from GitHub) |
| Build-time env | build-inject.js (Vercel build 跑, 從 process.env 注入) |
| 測試 | Playwright (e2e) - 待補 |
| Lint | ESLint (待加) |
| TypeScript | 否 |

**禁止**:
- ❌ 加任何前端框架 (React/Vue/Angular/Svelte)
- ❌ 加任何樣式庫 (Tailwind/Bootstrap/daisyUI)
- ❌ 加任何 icon library (用 emoji)
- ❌ 寫任何 alert/prompt/confirm (會觸發 Hermes 視窗)
- ❌ 跑任何 CLI (vercel/gh/supabase) (用 REST API 或本地)
- ❌ 寫 secret 進 source code (用 build-inject.js 注入)
- ❌ 用 innerHTML (XSS 風險, 用 textContent)
- ❌ 留 console.log/error in production

## 3. 環境變數

部署需要 2 個 Vercel 環境變數 (Production):
- `SUPABASE_URL` = `https://qqbkpqqfnkiezrvrwypm.supabase.co`
- `SUPABASE_ANON_KEY` = `sb_publishable_...46 chars...` (在 Vercel dashboard 設)

**前端** 不直接拿 env, 而是 build-inject.js 寫到 `assets/js/supabase/supabase-bootstrap.js` (設 `window.SUPABASE_URL` + `window.SUPABASE_ANON_KEY`)。

## 4. 數據模型 (Supabase Postgres)

### shops (主表, 公開讀)

| 欄位 | 類型 | 說明 |
|---|---|---|
| id | int | PK |
| name | text | 店名 |
| addr | text | 地址 |
| city | text | 'kh' / 'tn' / 'ch' |
| mcat | text | 主分類 |
| cat_sub | text | 子分類 |
| station | text | 捷運/區域名 |
| line | text | 'red' / 'orange' / etc |
| lat | float | 緯度 |
| lng | float | 經度 |
| price_bar | text | '$' / '$$' / '$$$' |
| env | text | 'ac' / 'ind' / 'ac,ind' |
| time_24h | bool | 24hr |
| late | bool | 深夜開 |
| 22start | bool | 22 點後開 |
| non_late | bool | 不開深夜 |
| rating | text | '4.5(120)' |
| photos | text[] | URL 陣列 |
| gmaps_url | text | Google Maps 連結 |
| source | text | 來源 |
| confidence | text | '高' / '中' / '低' |
| is_active | bool | 顯示 |
| created_at / updated_at | timestamp | |

### user_submissions (待審核)

| 欄位 | 類型 |
|---|---|
| id, submitter_email, submitter_name | |
| name, addr, city, mcat, cat_sub, station, line, lat, lng | |
| price_bar, env, time_24h, late, 22start | |
| photos[], gmaps_url, submitter_note | |
| status | 'pending' / 'approved' / 'rejected' |
| approved_shop_id (FK → shops.id) | |
| reviewed_at, reviewed_by, review_note | |

### admins

| 欄位 | 類型 |
|---|---|
| user_id (FK → auth.users.id) | |
| role | 'admin' / 'super_admin' |
| permissions | jsonb |

### View

- `v_public_shops` - 公開店家, 過濾 is_active=true
- `v_pending_submissions` - 待審核, status=pending

### Trigger

- `trg_submission_approved` - status → approved → 自動建 shop
- `trg_shops_updated_at` / `trg_submissions_updated_at` - 自動更新 updated_at

## 5. 現有檔案 (v5.13)

```
index.html                      641KB (含 164 店家 inline)
vercel.json                     Vercel 設定 (buildCommand: node build-inject.js)
build-inject.js                 Build-time env inject
package.json                    純前端, no deps
.github/workflows/deploy-vercel.yml  CI auto-deploy
.vibecoding/                    framework 10 個 markdown
├── AGENTS.md                   AI 入口
├── STATUS.md                   當前狀態
├── CHANGELOG.md                38 commits 歷史
├── ERRORS.md                   9 條歷史報錯
├── GATES.md                     7 個驗收閘門
├── PRD.md                      產品需求
├── PROJECT_FRAME.md            技術框架
├── FLOWS.md                    互動邏輯
├── FRONTEND_HANDOFF.md         本文件
├── README.md                   框架說明
├── CLAUDE.md                   AI 入口
└── check.sh                    7 個 gate 可執行
supabase/
├── config.toml                 supabase init
├── migrations/001_initial_schema.sql
└── seed/001_initial_shops.sql
assets/
├── css/app.css                 13KB 簡約暗黑風
└── js/
    ├── app.js                  33KB 主程式
    ├── theme.js                2KB 主題切換
    ├── filters.js              7KB 篩選
    ├── sheet.js                9KB 店家詳情
    ├── favorites.js            5KB 收藏
    └── supabase/
        ├── supabase.min.js             199KB UMD
        ├── supabase-client.js          8KB CRUD
        ├── supabase-ui.js              20KB 推薦+審核
        ├── shop-loader.js              6KB 動態載入
        └── supabase-bootstrap.js       489 bytes (build-inject 產)
```

## 6. 模組職責

| 模組 | 負責 | 不負責 |
|---|---|---|
| `app.js` | UI 渲染, 事件, 縣市切換, 篩選, 排序 | 資料持久化 |
| `shop-loader.js` | 從 Supabase 取 164 店家, fallback 靜態 | UI |
| `supabase-client.js` | Supabase CRUD API | UI |
| `supabase-ui.js` | 推薦店家 modal, 管理員審核 panel | 純 API |
| `theme.js` | 主題切換 + localStorage | 整個 UI 樣式 |
| `favorites.js` | 收藏 localStorage | 同步雲端 |
| `filters.js` | 縣市/類型/時段篩選 | 排序 |
| `sheet.js` | 店家詳情 modal | 編輯 |
| `build-inject.js` | Build-time env inject | runtime |

## 7. 現有功能清單 (v5.13)

### 已完成

- ✅ 164 店家靜態展示 (高雄 46 + 台南 50 + 彰化 68)
- ✅ 135 張真實照片 (視覺驗證 100% 對應)
- ✅ 縣市切換 (kh/tn/ch)
- ✅ 篩選 (全部/24hr/未打烊中/火鍋/日式/小吃/有冷氣)
- ✅ 收藏 (localStorage)
- ✅ 主題切換 (dark/light/auto + localStorage)
- ✅ 圖片 strip (4 縮圖 + +N)
- ✅ 排序 (預設/價位低→高/價位高→低/店名 A-Z)
- ✅ 推薦店家 modal
- ✅ 管理員登入 modal
- ✅ 管理員審核 modal (in-page prompt)
- ✅ 分享按鈕 (複製到剪貼簿)
- ✅ 部署 (https://food-map-tw-dun.vercel.app)
- ✅ 暗黑風 UI
- ✅ 簡約 UI
- ✅ Supabase Cloud 整合
- ✅ build-inject.js (build-time env)
- ✅ Vibecoding-linear-framework 對齊
- ✅ check.sh 7 個 gate

### 待完成 (給前端 AI 接手)

- ❌ OpenGraph meta (社群分享預覽)
- ❌ 29 家無照片救援
- ❌ 圖片 lazy load + 壓縮 (641KB → 優化)
- ❌ Service Worker (PWA 離線)
- ❌ unit test (Playwright)
- ❌ ESLint
- ❌ SEO sitemap.xml
- ❌ 多尺寸 favicon
- ❌ i18n (英文版)
- ❌ Lighthouse 90+ 優化

## 8. 部署流程

1. 修改 code
2. 本地測試: `python -m http.server 8785` + browser
3. `git add . && git commit -m "..."` (本地, 不互動)
4. `git push origin main` → Vercel auto-deploy
5. Vercel build 跑 `node build-inject.js` → inject env
6. 訪問 `https://food-map-tw-dun.vercel.app` 驗證

**不要做的**:
- ❌ `vercel deploy` (CLI)
- ❌ `gh auth`
- ❌ `supabase login`
- ❌ 在對話框輸入 token
- ❌ 把 anon key 寫進 HTML/JS source

## 9. 驗收

部署後跑:

```bash
bash .vibecoding/check.sh
```

預期 7/7 通過:
- Gate 1: HTML 結構
- Gate 2: JS modules
- Gate 3: 無 alert/prompt/confirm
- Gate 4: 無 hardcoded secret (警告 v5.8 inline 設計)
- Gate 5: Vercel URL 200
- Gate 6: Supabase REST 200
- Gate 7: 店家 >= 164

## 10. 給前端 AI 的具體任務 (P0 優先)

按 framework 找的 17 個問題 + 美食遊覽現狀:

### P0 必修 (v6.0)

1. 修 app.js line 658: `'已切換到台南(目前籌備中)'` → 改 switch/case 加彰化支援
2. 修 innerHTML → textContent (XSS 防禦):
   - `assets/js/supabase/shop-loader.js` 1 處
   - `assets/js/supabase/supabase-ui.js` 1 處
3. 移除 console.log/error in production
4. 加 OpenGraph meta 到 `<head>` (title, description, image, url)
5. 寫 Playwright e2e test (`tests/e2e.spec.js`):
   - 訪問首頁 200
   - 點城市 chip 切換
   - 點主題切換
   - 點 📝 開 modal
   - 點 🔐 開 modal

### P1 應該做 (v6.1+)

6. Lighthouse 90+ 優化
7. 圖片 lazy load + WebP 壓縮
8. 29 家無照片救援 (IG/FB 抓圖)
9. 寫 unit test (Vitest + happy-dom)
10. 加 ESLint + Prettier

### P2 長期 (v7+)

11. Service Worker (PWA 離線)
12. SEO sitemap.xml
13. i18n (英文版)
14. 多尺寸 favicon

## 11. 確認記錄

- 用戶已確認前端交接: `否`
- 確認時間: -
- 備註: 由 Frontend-Handoff-Agent 自動生成, 待用戶審查
