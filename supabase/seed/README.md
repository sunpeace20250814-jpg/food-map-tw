# 美食遊覽 Supabase 種子資料

## 164 店家 (高雄 46 + 台南 50 + 彰化 68)

## 用途
- 第一次部署 Supabase 時, 跑這個 SQL 把現有 164 店家寫入
- 之後新店家由 `user_submissions` 表 approved 觸發器自動建立

## 執行方式

### 方法 1: Supabase CLI (推薦)
```bash
# 本地開發
supabase db reset           # 重置本地 DB, 跑 migrations + seed

# 連接 Cloud 專案
supabase link --project-ref YOUR_PROJECT_REF
supabase db push            # 推 migrations 上 Cloud

# Seed 需要手動跑
psql "$SUPABASE_DB_URL" -f supabase/seed/001_initial_shops.sql
# 或在 Supabase Dashboard SQL Editor 直接執行
```

### 方法 2: Supabase Dashboard
1. https://supabase.com/dashboard 進入專案
2. SQL Editor
3. 貼上 `001_initial_shops.sql` 內容
4. Run

## 檔案結構
- `001_initial_shops.sql` - 164 店家 INSERT 語句
- `README.md` - 本檔案

## 圖片
- 164 店家的 lh3 圖片 URL 已存到 `shops.photos[]` (TEXT[])
- 圖片本身在 Google CDN, 不存 Supabase Storage
- 月費 = $0 (無 Storage 費用)
