# PROJECT_FRAME.md - 美食遊覽技術框架

狀態：`已分析 (v5.12)`
用戶已確認：`否` (待用戶審查)

本文件定義項目怎麼組織、用什麼技術、怎麼切片實現。

## 1. 項目類型

| 項目 | 內容 |
|---|---|
| 產品形態 | Web (純前端 SPA) |
| 是否有前端界面 | 是 |
| 是否需要後端 | 是 (Supabase Cloud, 2026-06-24 上線) |
| 是否需要資料庫 | 是 (Supabase Postgres) |
| 是否需要登入 / 權限 | 是 (管理員審核) |
| 是否需要外部服務 | Google Maps (lh3 CDN, 圖片) |

## 2. 技術棧

| 層 | 選擇 | 為什麼 | 用戶已確認 |
|---|---|---|---|
| 語言 | JavaScript (ES6+ module) | 純前端, 無 build step | 否 |
| 前端框架 | 無 (vanilla JS) | 簡單, 免 build, 164 店家無需框架 | 否 |
| 樣式方案 | 純 CSS (CSS custom properties + 暗黑主題) | 簡約暗黑風, 自寫 | 否 |
| 狀態管理 | DOM + module scope | 純前端, 無 React/Vue | 否 |
| 後端框架 | Supabase Cloud (Postgres + RLS + Auth) | $0 月費, 自動 RLS | 否 |
| 資料庫 | Postgres (Supabase) | 免費 500MB, 50k 行/月 | 否 |
| 部署 | Vercel (靜態 + auto-deploy from GitHub) | 100GB 流量免費 | 否 |
| 測試工具 | 暫無 | 待補 (Playwright?) | 否 |
| Build-time env | build-inject.js (Node) | 取代 inline secret | 否 |

## 3. 目錄結構

```text
美食遊覽/
├── index.html              # 164 店家 inline (641KB)
├── vercel.json             # Vercel 部署設定 (buildCommand: node build-inject.js)
├── build-inject.js         # Build-time inject SUPABASE_URL + ANON_KEY
├── package.json            # 純前端, no deps
├── .vibecoding/            # vibecoding-linear-framework 10 個 markdown
│   ├── AGENTS.md           # AI 入口
│   ├── STATUS.md           # 當前狀態
│   ├── CHANGELOG.md        # 38 commits 歷史
│   ├── ERRORS.md           # 9 條歷史報錯
│   ├── GATES.md + check.sh # 7 個驗收閘門
│   ├── PRD.md              # 空白 (待補)
│   ├── PROJECT_FRAME.md    # 本文件
│   ├── FLOWS.md            # 空白 (待補)
│   ├── FRONTEND_HANDOFF.md # 空白 (待補)
│   ├── README.md           # 框架說明
│   └── CLAUDE.md           # AI 入口 (指 AGENTS.md)
├── assets/
│   ├── css/app.css         # 簡約暗黑風 (13KB)
│   ├── js/
│   │   ├── app.js          # 主程式 (33KB)
│   │   ├── theme.js        # 主題切換 (2KB)
│   │   ├── filters.js      # 篩選 (7KB)
│   │   ├── sheet.js        # 店家詳情 (9KB)
│   │   ├── favorites.js    # 收藏 (5KB)
│   │   └── supabase/
│   │       ├── supabase.min.js       # UMD SDK (199KB)
│   │       ├── supabase-client.js    # CRUD API (8KB)
│   │       ├── supabase-ui.js        # 推薦 + 審核 (20KB)
│   │       ├── shop-loader.js        # 動態載入 (6KB)
│   │       └── supabase-bootstrap.js # Build-time env inject (489 bytes)
│   └── data/                # 歷史資料
├── supabase/
│   ├── config.toml         # supabase init
│   ├── migrations/001_initial_schema.sql # 8.9KB (shops + user_submissions + admins)
│   └── seed/001_initial_shops.sql         # 155KB (164 店家 INSERT)
└── .github/workflows/deploy-vercel.yml    # CI auto-deploy
```

## 4. 模組邊界

| 模組 | 負責 | 不負責 | 輸入 | 輸出 |
|---|---|---|---|---|
| `app.js` | UI 渲染, 事件, 縣市切換, 篩選, 排序 | 資料持久化 | SHOP_DATA_INITIAL, DOM | DOM updates |
| `shop-loader.js` | 從 Supabase 取 164 店家 | UI | Supabase | 標準化 shops[] |
| `supabase-client.js` | Supabase CRUD API | UI | SQL 查詢 | JSON |
| `supabase-ui.js` | 推薦店家 modal, 管理員審核 panel | 純 API | DOM events | DB writes |
| `theme.js` | 主題切換 (dark/light/auto) + localStorage | 整個 UI 樣式 | click event | data-theme attr |
| `favorites.js` | 收藏 localStorage | 同步雲端 | click event | localStorage |
| `filters.js` | 縣市/類型/時段篩選 | 排序 | button click | 隱藏不符合 article |
| `sheet.js` | 店家詳情 modal | 編輯 | card click | 詳情 modal |
| `favorites.js` | 收藏 | 同步 | click | localStorage |
| `build-inject.js` | Build-time env inject | runtime | process.env | supabase-bootstrap.js |

## 5. 資料模型 / 資料流

```text
Supabase Postgres
├── shops (主表)
│   ├── id, name, addr, city, mcat, cat_sub, station, line, lat, lng
│   ├── price_bar, env, time_24h, late, "22start", non_late
│   ├── rating, photos[], gmaps_url
│   ├── source, confidence, is_active
│   └── created_at, updated_at
├── user_submissions (待審核)
│   ├── submitter_email, submitter_name
│   ├── name, addr, city, mcat, cat_sub, station, line
│   ├── lat, lng, price_bar, env, time_24h, late, "22start"
│   ├── photos[], gmaps_url, submitter_note
│   ├── status: pending / approved / rejected
│   ├── approved_shop_id (FK → shops.id)
│   └── reviewed_at, reviewed_by, review_note
└── admins (管理員)
    ├── user_id (FK → auth.users.id)
    ├── role: admin / super_admin
    └── permissions: {"all"}

View:
├── v_public_shops (公開店家, 過濾 is_active=true)
└── v_pending_submissions (待審核, status=pending)

Trigger:
├── trg_submission_approved: status → approved → 自動建 shop
└── trg_shops_updated_at / trg_submissions_updated_at: 自動更新 updated_at
```

## 6. API / Mock 判斷

| 問題 | 決策 |
|---|---|
| 前端是否先用 mock | 是 (v5.0 之前用 SHOP_DATA_INITIAL inline) |
| 是否需要真實 API | 是 (Supabase Cloud, v5.0+) |
| API 契約寫在哪裡 | `supabase/migrations/001_initial_schema.sql` |
| mock 數據提供方式 | 仍 inline 在 `index.html` (作為 fallback) |

## 7. 實現切片

| 切片 | 目標 | 交付物 | 驗收方式 |
|---|---|---|---|
| M0 | 基礎架構 + 部署 | index.html, vercel.json, build-inject.js | 訪問 URL HTTP 200 |
| M1 | 164 店家 + 圖片 | SHOP_DATA_INITIAL + 135 視覺驗證 | 訪問看到 164 店家 + 圖片 |
| M2 | Supabase Cloud 整合 | supabase/migrations + seed | 164 店家 INSERT, admin 帳號 |
| M3 | 用戶推薦 + 管理員審核 | supabase-ui.js | 點 📝 開表單, 點 🔐 開登入 |
| M4 | 簡約暗黑風 UI | app.css, theme.js | 切換 dark/light/auto |
| M5 | CSS 版型修好 | app.css grid | 卡片同高, 圖片同寬 |
| M6 | 部署流程標準化 | build-inject.js + vercel.json | 推送自動 build, 0 觸發 prompt |
| M7 | Framework 對齊 | .vibecoding/* 10 個 markdown | check.sh 7/7 通過 |

## 8. 風險和取捨

| 風險 | 影響 | 當前取捨 | 何時重看 |
|---|---|---|---|
| lh3 圖片過期 (Maps auto-routing) | 部分店家圖失效 | 18 家 CH 標 `_no_photo: true` | 用戶投訴時 |
| Supabase 免費額度用完 | 164 店家 + 推薦功能停擺 | 預估 1GB 足夠 5 年 | 接近 400MB 時 |
| Vercel build 出現 BOM / 中文 hostname bug | 部署失敗 | 用 Vercel REST API 繞過 | 隨時 |
| 沒 unit test | 重構風險 | 沒時間寫 | v6 重構前 |
| index.html 641KB | 初次載入慢 | 純前端, 部署到 CDN 緩解 | 用戶投訴時 |
| 29 家無照片 (彰化 18 + others) | UI 不好看 | 純文字卡 | 用戶投訴時 |
| 沒 OpenGraph meta | 分享社群沒預覽 | 文字分享 fallback | 用戶投訴時 |
| 沒 a11y 完整測試 (鍵盤導航) | 殘疾用戶無法用 | 334 aria attr, 0 img-no-alt | v6 修 |

## 9. 給前端 AI 的技術邊界

前端 AI 必須遵守：

- 可用框架: **無** (vanilla JS, 不要加 React/Vue)
- 可用 UI / 圖標庫: emoji 為主 (🌓📝🔐等), 不要加 icon library
- 是否允許新增依賴: **不允許** (保持 $0 月費, 純前端)
- 數據來源: Supabase (前端 inline 為 fallback)
- 禁止事項:
  - 不用 `alert` / `prompt` / `confirm` (會觸發 Hermes GUI 視窗)
  - 不用 `vercel` / `gh` / `supabase login` CLI
  - 不用 innerHTML (XSS 風險, 用 textContent)
  - 不用 console.log/error in production
  - 不寫 secret 進 source code

## 10. 分析發現 (用 framework 找到的問題)

### 🔴 致命

1. **PRD.md 空白** - 沒驗收標準, 不知做對沒
2. **FLOWS.md 空白** - 互動邏輯沒文件
3. **FRONTEND_HANDOFF.md 空白** - 前端沒交接包
4. **沒 unit test** - 重構風險高
5. **沒 lint / format** - 程式碼風格不一致

### 🟡 中

6. **29 家無照片** (彰化 18 + KH 1 + TN 10) - UI 差
7. **8 個 console.log/error** - production 雜訊
8. **2 個 innerHTML** - XSS 風險
9. **app.js line 658** "已切換到台南(目前籌備中)" - 過時字眼, ch 還沒支援
10. **641KB index.html** - 初次載入慢
11. **沒 OpenGraph meta** - 分享社群沒預覽
12. **沒 a11y 鍵盤導航測試** - 部分用戶無法用
13. **沒 SEO sitemap** - 搜尋引擎排名差
14. **沒 Service Worker** - 沒離線使用

### 🟢 低

15. **無 favicon 多尺寸** - 只有 1 個
16. **無 .editorconfig** - 編輯器設定不一致
17. **無 pre-commit hook** - 沒自動 lint

## 11. 確認記錄

- 用戶已確認項目框架: `否` (待用戶審查)
- 確認時間: -
- 備註: 此文件是事後分析, 不是初始 PRD 流程產出

## 12. 用 framework 找問題的過程

按 vibecoding-linear-framework 流程:
1. ✅ 1_PRD規劃 (PRD 空白 - 發現!)
2. ✅ 2_項目框架 (本文件 - 完成)
3. ⏸️ 3_互動邏輯 (FLOWS 空白)
4. ⏸️ 4_前端交接包 (FRONTEND_HANDOFF 空白)
5. ✅ 5_前端生成代碼 (v5.12 已部署)
6. ✅ 6_項目記錄 (STATUS / CHANGELOG / ERRORS 已完成)
7. ⏸️ 7_驗收閘門 (GATES 7 個, check.sh 跑通, 但需補 FLOWS/FRONTEND_HANDOFF 才完整)

**結論**: 框架對齊 60%, 缺 PRD + FLOWS + FRONTEND_HANDOFF = 3 個空白檔。
