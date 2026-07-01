# 美食遊覽 (Night Market Map)

高雄 / 台南 / 彰化 宵夜互動地圖，**164 家精選**。

**月費 = $0** (Supabase 免費 + Vercel 免費 + Google Maps 免費 CDN)

---

## 🚀 部署給別人看 (15-20 分鐘, **全 CLI**)

### ⚡ 一鍵部署 (推薦)

#### Windows PowerShell
```powershell
# 1. 安裝 Node.js (https://nodejs.org/)
# 2. 在 PowerShell 跑:
powershell -ExecutionPolicy Bypass -File deploy-all.ps1
```

#### Linux / Mac / Git Bash
```bash
bash deploy-all.sh
```

**腳本會自動**:
1. ✓ 檢查 + 安裝 supabase + vercel CLI
2. ✓ Supabase 登入 + 連結專案
3. ✓ 推 schema (3 個表 + RLS + 觸發器)
4. ✓ 跑 164 店家種子資料
5. ✓ 引導設管理員帳號
6. ✓ 取得 API URL + Key
7. ✓ 推 GitHub
8. ✓ 部署 Vercel + 設環境變數

### 📋 事前準備 (5 分鐘)
1. **註冊 Supabase**: https://supabase.com (免費, 用 GitHub 登入)
2. **建立專案**: 選 Singapore region, 記下 Reference ID
3. **註冊 Vercel**: https://vercel.com (免費, 用 GitHub 登入)
4. **建立 GitHub repo**: https://github.com/new, 命名 `美食遊覽`

### 🎯 部署完成後
- URL: `https://美食遊覽.vercel.app`
- 管理員入口: 首頁右下角 🔐
- 使用者推薦: 首頁右上角 📝

---

## 📂 完整檔案

```
美食遊覽/
├── README.md                     (本檔)
├── AGENTS.md                     (給未來 agent 速查)
├── CHANGELOG.md                  (版本歷史)
├── SUNPE_DEPLOY.md               (Supabase 部署詳細指南)
├── VERCEL_DEPLOY.md              (Vercel 部署詳細指南)
├── deploy-all.sh / .ps1          (一鍵部署: Supabase + Vercel)
├── deploy-help.sh                (部署說明輸出)
├── build-inject.js               (Vercel build-time env 注入)
├── vercel.json                   (純靜態部署 config)
├── package.json                  (npm start → npx serve .)
├── .env.example                  (Supabase URL/KEY 範本)
├── index.html                    (單頁應用, 含 164 張 shop-card)
├── assets/
│   ├── css/
│   │   ├── app.css               (~1100 行, v10.1 Cyberpunk + sheet styles)
│   │   └── open-props.css        (設計 token 庫)
│   └── js/
│       ├── app.js                (主程式: tab / filter / theme glue)
│       ├── sheet.js              (店家 detail modal, v10.1 唯一 sheet 渲染)
│       ├── filters.js            (縣市/類型/時段篩選)
│       ├── favorites.js          (localStorage 收藏)
│       ├── theme.js              (dark/light/auto 主題切換)
│       └── supabase/
│           ├── supabase.min.js       (204KB, Supabase JS SDK, vendored)
│           ├── supabase-client.js    (CRUD API)
│           ├── supabase-ui.js        (推薦表單 + 管理員審核 UI)
│           ├── shop-loader.js        (動態載入店家 + 點擊委派 sheet.js)
│           └── supabase-bootstrap.js (build-inject 產物)
├── supabase/
│   ├── config.toml               (supabase init)
│   ├── DEPLOY.md                 (Supabase 部署指南)
│   ├── migrations/001_initial_schema.sql  (3 表 + RLS + 觸發器)
│   ├── seed/001_initial_shops.sql         (164 店家種子)
│   └── scripts/
│       ├── deploy_cloud.sh / .bat        (只跑 Supabase)
│       ├── get_vercel_token.sh           (Vercel Token + GitHub Secrets)
│       └── gen_types.sh                  (生成 TS types)
├── tests/
│   ├── e2e.spec.js               (Playwright e2e, 6 個互動測試)
│   ├── hover.spec.js             (hover 互動測試)
│   ├── mobile.spec.js            (mobile viewport 測試)
│   ├── full_test.py              (10 點手動 e2e, Python Playwright)
│   ├── playwright.config.js
│   └── package.json
└── data/
    ├── README.md                 (資料維護工作流)
    ├── TASKS.md                  (後續 backlog)
    ├── reviews.json              (顧客評論, v10.1, 目前 `{}`)
    ├── template-new-city.csv     (新增縣市 CSV 範本)
    ├── validate.py               (CSV schema + Maps URL auto-fix)
    ├── vision-verify.py          (vision 取樣驗證)
    ├── vision-refetch.py         (重抓低信心照片)
    ├── vision-result.json        (vision 驗證輸出)
    └── vision-batch3/            (vision 取樣圖, 30 JPG + manifest)
```

---

## 🏗️ 架構

```
[用戶瀏覽器]
   ↓
[Vercel CDN] (美食遊覽.vercel.app)
   ↓ (Supabase JS SDK + 環境變數)
[Supabase Cloud] (PostgreSQL + Auth + RLS)
```

**3 個資料表**:
- `shops` - 164 店家 (高雄 46 + 台南 50 + 彰化 68)
- `user_submissions` - 使用者推薦, 管理員審核
- `admins` - 管理員帳號

**RLS 安全**:
- 公開: 讀取 active shops, 提交 submission
- 管理員: 寫入 shops, 審核 submissions

---

## 🎨 功能

### 使用者 (無需登入)
- 縣市切換 (高雄 / 台南 / 彰化)
- 篩選 (24hr, 宵夜, 火鍋, 日式, 小吃, 冷氣)
- 收藏 (localStorage)
- 詳情 (modal)
- **推薦新店家** → 寫入 user_submissions

### 管理員 (Supabase Auth 登入)
- 登入 / 登出
- 查看待審核清單
- 通過 / 拒絕 submission
- 下架 / 啟用 / 刪除 shop
- 審核備註

---

## 📊 狀態 (2026-07-01 v10.1)

- 高雄 46 + 台南 50 + 彰化 68 = **164 家宵夜**
- 135/164 (82%) 視覺驗證 100% 對應正確店家照片
- Sheet v10.1 完整版：週一~週日、照片縮圖、評論、收藏、訂位
- 部署包 ~654KB (index.html) + 200KB (Supabase SDK)
- 部署 URL: https://food-map-tw-dun.vercel.app

---

## 💰 月費 = $0

| 服務 | 免費額度 | 預估使用 |
|------|----------|----------|
| Supabase Database | 500MB | < 1MB |
| Supabase Auth | 50,000 MAU | ~10 MAU |
| Supabase Storage | 1GB | 0 GB (圖片用 Google CDN) |
| Vercel Hosting | 100GB 流量 | ~5GB |
| Google Maps lh3 | 無限 | 圖片 CDN |

---

## 🔧 維運指令

```bash
# 重新部署
bash deploy-all.sh

# 只重推 Supabase schema
supabase db push

# 只重跑 seed
supabase db execute -f supabase/seed/001_initial_shops.sql

# 推 GitHub (Vercel 自動部署)
git push origin main

# 從 Supabase 生成 TS types
supabase gen types typescript --project-id YOUR_REF > assets/js/supabase/database.types.ts

# 看 Vercel 部署狀態
vercel ls
```

---

## 🆘 疑難排解

| 問題 | 解法 |
|------|------|
| deploy-all.sh 找不到 supabase | 自動 npm install -g supabase |
| Project Ref 格式錯 | 從 https://supabase.com/dashboard/project/_/settings/general 複製 |
| Seed 失敗 | 手動到 SQL Editor 跑 supabase/seed/001_initial_shops.sql |
| Vercel 部署後空白 | 確認 vercel.json 有 @vercel/static |
| 環境變數沒生效 | 重新跑 deploy-all.sh 設變數 |
| 管理員看不到 submission | 確認 SQL: `SELECT * FROM admins;` 有你 UID |
| 推薦後新店家不出現 | 重新整理瀏覽器 (Ctrl+F5) |

---

🚀 **一鍵部署, 20 分鐘後上線!**
