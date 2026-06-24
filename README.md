# 美食遊覽 (Night Market Map)

高雄 / 台南 / 彰化 宵夜互動地圖，**164 家精選**。

**月費 = $0** (Supabase 免費 + Vercel 免費 + Google Maps 免費 CDN)

---

## 部署給別人看 (20 分鐘完成)

### 📋 完整流程

| 步驟 | 文檔 | 時間 |
|------|------|------|
| 1. 註冊 Supabase + 跑 schema | [supabase/DEPLOY.md](supabase/DEPLOY.md) | 10 分鐘 |
| 2. 推 GitHub | [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) Step 1 | 1 分鐘 |
| 3. 連接 Vercel + 設環境變數 | [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) Step 2-3 | 3 分鐘 |
| 4. 部署 + 驗證 | [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) Step 4-6 | 4 分鐘 |

### 🚀 快速開始 (給熟悉的人)

```bash
# 1. Supabase CLI 一鍵部署
supabase login
supabase link --project-ref YOUR_REF
supabase db push
supabase db execute -f supabase/seed/001_initial_shops.sql

# 2. Supabase Dashboard 設管理員
# 3. GitHub push
git remote add origin https://github.com/YOUR_USER/美食遊覽.git
git push -u origin main

# 4. Vercel 連接 + 設環境變數 + Deploy
# (https://vercel.com/new)
```

**最終 URL**: `https://美食遊覽.vercel.app`

---

## 架構

```
index.html              # 單頁應用 + 164 shop-card + SHOP_DATA_INITIAL
assets/js/
├── app.js              # 主程式
├── filters.js          # 篩選邏輯
├── sheet.js            # 店家 detail sheet
├── favorites.js        # localStorage 收藏
└── supabase/
    ├── supabase.min.js         # Supabase JS SDK (199KB)
    ├── supabase-client.js      # CRUD API
    ├── supabase-ui.js          # UI 模組 (使用者表單 + 管理員後台)
    └── shop-loader.js          # 動態載入 (Supabase 優先, fallback 靜態)
supabase/
├── migrations/001_initial_schema.sql    # shops + user_submissions + admins + RLS
├── seed/001_initial_shops.sql           # 164 店家 INSERT
├── scripts/deploy_cloud.{sh,bat}        # 部署腳本
└── DEPLOY.md                            # Supabase 部署指南
vercel.json             # 純靜態部署
VERCEL_DEPLOY.md        # Vercel 部署指南
.env.example            # Supabase URL/KEY 範例
AGENTS.md                # 給未來 agent 速查
PLAN.md                  # 完整方案記錄
```

---

## 功能

### 使用者 (無需登入)
- ✅ 縣市切換 (高雄 46 / 台南 50 / 彰化 68)
- ✅ 篩選 (24hr, 宵夜, 火鍋, 日式, 小吃, 冷氣, ...)
- ✅ 收藏 (localStorage)
- ✅ 詳情 (modal)
- ✅ **推薦新店家** (Supabase 啟用時) → 寫入 user_submissions

### 管理員 (Supabase Auth 登入)
- ✅ 登入 / 登出
- ✅ 查看待審核清單
- ✅ **通過 / 拒絕** submission (通過自動建立 shop)
- ✅ 下架 / 啟用 / 刪除 shop
- ✅ 審核備註

---

## 狀態 (2026-06-24 v5.0)

- 135/164 (82%) 視覺驗證 100% 對應正確店家照片
- 3 個地址修正 (稽核 8 家)
- 30 個 commits 完整方案
- 部署包 ~520KB (前端) + 200KB (Supabase SDK) + 0MB (圖片在 Google CDN)

---

## 月費 = $0

| 服務 | 免費額度 | 預估使用 |
|------|----------|----------|
| Supabase Database | 500MB | < 1MB |
| Supabase Auth | 50,000 MAU | ~10 MAU |
| Supabase Storage | 1GB | 0 GB (圖片用 Google CDN) |
| Vercel Hosting | 100GB 流量 | ~5GB |
| Google Maps lh3 | 無限 | 圖片 CDN |

---

## 開發

```bash
# 純前端開發 (無 Supabase, fallback 靜態 164 店家)
python -m http.server 8000

# Supabase CLI (部署用)
npm install -g supabase
supabase login
supabase link --project-ref YOUR_REF
supabase db push
```

---

## 疑難排解

完整疑難排解見:
- [supabase/DEPLOY.md](supabase/DEPLOY.md#疑難排解)
- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md#疑難排解)
- [AGENTS.md](AGENTS.md)
