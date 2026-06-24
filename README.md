# 美食遊覽 (Night Market Map)

高雄 / 台南 / 彰化 宵夜互動地圖，**164 家精選**。

## 狀態 (2026-06-24 v5.0 Supabase 整合)
- 135/164 (82%) 視覺驗證 100% 對應正確店家照片
- **Supabase 整合完成**: 使用者推薦店家 + 管理員審核上架
- 純前端 + Supabase 後端, 月費 $0

## 架構

```
index.html              # 單頁應用 + 164 shop-card + SHOP_DATA_INITIAL
assets/
├── js/
│   ├── app.js          # 主程式
│   ├── filters.js      # 篩選邏輯
│   ├── sheet.js        # 店家 detail sheet
│   ├── favorites.js    # localStorage 收藏
│   └── supabase/
│       ├── supabase.min.js         # Supabase JS SDK (199KB)
│       ├── supabase-client.js      # CRUD API
│       ├── supabase-ui.js          # UI 模組 (使用者表單 + 管理員後台)
│       └── shop-loader.js          # 動態載入 (Supabase 優先, fallback 靜態)
supabase/
├── migrations/
│   └── 001_initial_schema.sql    # shops + user_submissions + admins + RLS
└── seed/
    └── 001_initial_shops.sql     # 164 店家 INSERT
vercel.json             # 純靜態部署
.env.example            # Supabase URL/KEY
```

## 開發

```bash
# 純前端 (無 Supabase, fallback 靜態 SHOP_DATA_INITIAL)
python -m http.server 8000
# 或
npx serve .

# 連接 Supabase (本地)
cp .env.example .env.local
# 編輯 .env.local 填入 Supabase URL + KEY
# 注意: 純前端無 build step, 用 meta tag 注入
```

## Supabase 設定 (完整方案 A)

### 1. 建立 Supabase 專案
1. https://supabase.com 註冊
2. Create new project → 選 region (Singapore / Tokyo)
3. Settings > API 取得 Project URL + anon public key

### 2. 執行 Schema
```sql
-- 在 Supabase SQL Editor 執行
\i supabase/migrations/001_initial_schema.sql
-- 建立 3 個表: shops, user_submissions, admins
-- + RLS (Row Level Security) 設定
-- + 觸發器: approved submission 自動建立 shop
```

### 3. 設定 Admin 帳號
1. Supabase > Authentication > Users > Add user (email + password)
2. 拿到 user_id
3. SQL Editor 執行:
```sql
INSERT INTO admins (user_id, role, permissions)
VALUES ('你的-user-uuid', 'super_admin', '{"all"}');
```

### 4. 執行 Seed (164 店家)
```sql
\i supabase/seed/001_initial_shops.sql
```

### 5. 部署到 Vercel
1. Vercel Project Settings > Environment Variables
   - `SUPABASE_URL` = https://xxx.supabase.co
   - `SUPABASE_ANON_KEY` = eyJhbGciOi...
2. Push to main → 自動部署
3. 用戶瀏覽時:
   - 沒設 env → fallback 靜態 SHOP_DATA_INITIAL (164 家)
   - 有設 env → 從 Supabase 載入 (含使用者提交)

## 功能

### 使用者 (無需登入)
- ✅ 縣市切換 (高雄/台南/彰化)
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

## 月費 = $0
- Supabase 免費額度: 500MB + 50k 行/月
- 預估使用: < 1MB / 200 筆 (足夠 100+ 年)
- Vercel 免費部署
- Google Maps lh3 免費 CDN 圖片

## 部署

```bash
# 1. GitHub push main → Vercel CI 自動部署
git push origin main

# 2. Vercel 設定環境變數 (見上面 Supabase 設定)

# 3. 驗證
open https://美食遊覽.vercel.app
```
