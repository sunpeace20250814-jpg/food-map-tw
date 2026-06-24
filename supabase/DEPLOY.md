# Supabase Cloud 部署完整指南

> **目的**: 部署給別人看, 不用本地 Supabase  
> **月費**: $0 (Supabase 免費 500MB + 50k 行/月)  
> **時間**: 20 分鐘 (註冊 + 跑 SQL + Vercel 部署)  
> **最終 URL**: https://美食遊覽.vercel.app

---

## Step 1: 註冊 Supabase (2 分鐘)

1. 開 https://supabase.com/dashboard/sign-up
2. 用 GitHub 帳號登入 (一鍵)
3. 創建 Organization (隨便取名, e.g. `my-food-map`)
4. **Create a new project**:
   - Name: `food-map-tw`
   - Database Password: **記下來** (e.g. `MySecurePass123!`)
   - Region: **Singapore** (離台灣最近) 或 Tokyo
   - Plan: **Free**
5. 等 ~2 分鐘建立完成

---

## Step 2: 建立 Schema (5 分鐘, 用 Supabase CLI)

### 2.1 連結 Supabase 專案

```bash
# 安裝 Supabase CLI (已完成)
supabase --version   # 應該是 2.107.0+

# 連結到 Cloud 專案
cd 美食遊覽
supabase login                                       # 瀏覽器登入
supabase link --project-ref YOUR_PROJECT_REF_ID    # 從 Supabase Dashboard > Settings > General 找
```

> **找 `project-ref`**: Supabase Dashboard > 你的專案 > Settings > General > Reference ID
> (e.g. `abcdefghijklmnopqrst`)

### 2.2 推 migrations 上 Cloud

```bash
# 推送 schema (shops, user_submissions, admins + RLS + 觸發器)
supabase db push
```

**預期輸出**:
```
Applying migration 001_initial_schema.sql...
✅ Migration applied successfully
```

### 2.3 跑種子資料 (164 店家)

```bash
# 方法 A: CLI 跑 (需要 db url)
supabase db execute -f supabase/seed/001_initial_shops.sql

# 方法 B: Dashboard SQL Editor (推薦, 最簡單)
# 1. 開 https://supabase.com/dashboard/project/YOUR_REF/sql
# 2. New query
# 3. 貼上 supabase/seed/001_initial_shops.sql 內容
# 4. Run (約 5 秒)
```

**預期**: Table Editor > shops 有 164 列

---

## Step 3: 設定管理員帳號 (3 分鐘)

### 3.1 建立管理員 User

1. Supabase Dashboard > **Authentication** > **Users** > **Add user** > **Create new user**
2. Email: `your-admin@example.com` (用你真實 email)
3. Password: **強密碼** (e.g. `Admin@FoodMap2026!`)
4. ☑️ Auto Confirm User
5. **Add user**

### 3.2 拿到 user_id

1. 剛創的 User 列表, 點開看
2. 複製 **User UID** (e.g. `a1b2c3d4-...`)

### 3.3 加入 admins 表

1. SQL Editor > New query
2. 執行:
```sql
INSERT INTO admins (user_id, role, permissions)
VALUES ('你的-user-uuid-貼這裡', 'super_admin', '{"all"}');
```
3. Run

**驗證**:
```sql
SELECT * FROM admins;
-- 應看到 1 筆
```

---

## Step 4: 取得 API 連線資訊 (1 分鐘)

1. Supabase Dashboard > **Settings** > **API**
2. 複製:
   - **Project URL**: `https://abcdefghij.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...` (很長)

---

## Step 5: Vercel 部署 (5 分鐘)

### 5.1 推送 GitHub

```bash
cd 美食遊覽
git init                              # 如果還沒
git add .
git commit -m "v5.1 Supabase Cloud 部署版"
git branch -M main
git remote add origin https://github.com/YOUR_USER/美食遊覽.git
git push -u origin main
```

### 5.2 連接 Vercel

1. 開 https://vercel.com/new
2. **Import Git Repository** > 選 `美食遊覽` repo
3. **Configure Project**:
   - Framework Preset: **Other**
   - Build Command: 留空 (純靜態)
   - Output Directory: 留空
4. **Environment Variables** (重要!):
   - `SUPABASE_URL` = `https://abcdefghij.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...`
5. **Deploy**

**預期**: 1-2 分鐘後 Vercel 給你一個 URL: `https://美食遊覽-xxx.vercel.app`

### 5.3 修改 Vercel Project 名稱

1. Vercel Dashboard > 你的 Project > Settings > General
2. Project Name: 改為 `美食遊覽` 或 `food-map-tw`
3. 自動 URL 變成: `https://美食遊覽.vercel.app` 或 `https://food-map-tw.vercel.app`

---

## Step 6: 驗證部署 (1 分鐘)

1. 開你的 Vercel URL
2. 應該看到 **164 店家** (從 Supabase 載入)
3. 測試:
   - 點 📝 推薦店家 → 填表 → 送出
   - Supabase Dashboard > Table Editor > user_submissions 應看到 1 筆新列
4. 管理員測試:
   - 點 🔐 管理員 (右下角) → 登入 → 看到你的 submission
   - 點 ✅ 通過 → user_submissions.status = approved
   - 自動觸發器: shops 表新增 1 筆
   - 重新整理首頁 → 看到新店家
5. 完成!

---

## 常用指令 (CLI 部署管理)

```bash
# 看遠端 DB 狀態
supabase status

# 看 migrations 列表
supabase migration list

# 重新跑 seed (會清空 shops 表重灌)
supabase db reset

# 推新 migration
# 1. 建立 supabase/migrations/002_xxx.sql
# 2. supabase db push

# 從 Cloud 拉 schema (本地有 docker 時才有用)
supabase db pull

# 生成 TS types (前端可用)
supabase gen types typescript --project-id YOUR_PROJECT_REF > assets/js/supabase/database.types.ts
```

---

## 疑難排解

### Q1: `supabase db push` 失敗, 說 "Cannot find migration file"
**A**: 確認 `supabase/migrations/001_initial_schema.sql` 存在, 沒 `.gitkeep` 之類的隱藏檔

### Q2: 部署後網頁沒顯示 Supabase 資料
**A**: Vercel 環境變數沒設, fallback 靜態 SHOP_DATA_INITIAL (164 筆仍會顯示)
- 確認 Vercel > Project > Settings > Environment Variables 有 SUPABASE_URL + SUPABASE_ANON_KEY
- 重新部署 (Vercel 自動)

### Q3: 推薦店家後, 管理員後台沒看到
**A**:
1. Supabase Dashboard > Table Editor > user_submissions 確認資料進了
2. 確認 admin 帳號是 super_admin (SQL: `SELECT * FROM admins;`)
3. 重新登出 / 登入管理員

### Q4: 管理員通過後, 首頁沒看到新店家
**A**:
1. 確認觸發器有跑: `SELECT * FROM user_submissions WHERE status='approved';` 應看到 approved_shop_id 有值
2. 確認 `shops` 表有新增: `SELECT * FROM shops WHERE source='user_submit';`
3. 重新整理瀏覽器 (Ctrl+F5 強制重載)

---

## 成本估算

| 服務 | 免費額度 | 預估使用 | 月費 |
|------|----------|----------|------|
| Supabase Database | 500MB | < 1MB | $0 |
| Supabase Auth | 50,000 MAU | ~10 MAU | $0 |
| Supabase Storage | 1GB | 0 GB (圖片用 Google CDN) | $0 |
| Supabase Edge Functions | 500K 請求 | 0 | $0 |
| Vercel Hosting | 100GB 流量 | ~1GB | $0 |
| Vercel Functions | 100GB-hr | 0 | $0 |
| **總計** | | | **$0** |

---

## 下一步

- ✅ Supabase 部署完成
- ✅ Vercel 部署完成
- ✅ 使用者推薦功能
- ✅ 管理員審核功能
- ⏳ **管理員日常**: 每天檢查 user_submissions, 審核新店家
- ⏳ **推廣**: 把 Vercel URL 分享給使用者

🚀 **完成! 你的宵夜地圖現在可以用 Supabase 推薦新店家了!**
