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
├── deploy-all.sh                 (Linux/Mac 一鍵部署)
├── deploy-all.ps1                (Windows PowerShell 一鍵部署)
├── VERCEL_DEPLOY.md              (Vercel 詳細指南)
├── AGENTS.md                     (給未來 agent)
├── PLAN.md                       (完整方案記錄)
├── .env.example                  (Supabase URL/KEY 範例)
├── index.html                    (單頁應用)
├── vercel.json                   (純靜態部署)
├── assets/js/
│   ├── app.js                    (主程式)
│   ├── filters.js                 (篩選)
│   ├── sheet.js                   (店家 detail sheet)
│   ├── favorites.js               (localStorage 收藏)
│   └── supabase/
│       ├── supabase.min.js        (199KB, Supabase SDK)
│       ├── supabase-client.js     (7.4KB, CRUD API)
│       ├── supabase-ui.js         (16KB, UI 模組)
│       └── shop-loader.js         (6.4KB, 動態載入)
└── supabase/
    ├── config.toml               (15.5KB, supabase init)
    ├── DEPLOY.md                 (Supabase 詳細指南)
    ├── migrations/001_initial_schema.sql    (8.9KB)
    ├── seed/001_initial_shops.sql           (155KB, 164 店家)
    └── scripts/
        ├── deploy_cloud.sh       (只跑 Supabase, 不含 Vercel)
        ├── deploy_cloud.bat      (Windows 版)
        ├── get_vercel_token.sh   (Vercel Token + GitHub Secrets)
        └── gen_types.sh          (生成 TS types)
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

## 📊 狀態 (2026-06-24 v5.1)

- 135/164 (82%) 視覺驗證 100% 對應正確店家照片
- 3 個地址修正 (稽核 8 家)
- 31 個 commits 完整方案
- 部署包 ~520KB (前端) + 200KB (Supabase SDK)

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
