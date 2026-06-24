# Sunpe 專案完整部署指南 (你的 Supabase + Vercel)

> **你的專案資訊** (從你提供)
> - Supabase URL: `https://qqbkpqqfnkiezrvrwypm.supabase.co`
> - Supabase Anon Key: `sb_publishable_iAp1XvLz9cXblJYONcrmjQ_1_7NCI0W`
> - Project Ref: `qqbkpqqfnkiezrvrwypm`

---

## Step 1: 跑 Schema (5 分鐘)

### 1.1 開 Supabase Dashboard SQL Editor
- 開 https://supabase.com/dashboard/project/qqbkpqqfnkiezrvrwypm/sql
- 點 **New query**

### 1.2 跑 migrations
1. 複製 `supabase/migrations/001_initial_schema.sql` 完整內容
2. 貼到 SQL Editor
3. 點 **Run** (約 3 秒完成)
4. 應該看到 `Success. No rows returned`

**建立了**:
- 3 個表: `shops`, `user_submissions`, `admins`
- 7 個 RLS 政策
- 2 個觸發器
- 2 個 views: `v_public_shops`, `v_pending_submissions`

### 1.3 跑 Seed (164 店家)
1. 在同一個 SQL Editor, **New query**
2. 複製 `supabase/seed/001_initial_shops.sql` 完整內容
3. 貼到 SQL Editor
4. 點 **Run** (約 5 秒完成)
5. 看到 `Success. 164 rows inserted` (或類似)

**驗證**:
- 開 https://supabase.com/dashboard/project/qqbkpqqfnkiezrvrwypm/editor
- 點 `shops` 表
- 應有 164 列

---

## Step 2: 設管理員帳號 (3 分鐘)

### 2.1 建立 Admin User
1. 開 https://supabase.com/dashboard/project/qqbkpqqfnkiezrvrwypm/auth/users
2. 點 **Add user** > **Create new user**
3. 填:
   - Email: `admin@美食遊覽.com` (用你真實 email)
   - Password: **強密碼** (e.g. `Admin@2026!`)
   - ☑️ **Auto Confirm User**
4. 點 **Create user**

### 2.2 拿到 User UID
1. 在 Users 列表, 點開剛建的 user
2. 複製 **User UID** (UUID 格式: `a1b2c3d4-e5f6-...`)

### 2.3 加入 admins 表
1. 開 SQL Editor > New query
2. 執行 (把 `你的-user-uuid` 替換):
```sql
INSERT INTO admins (user_id, role, permissions)
VALUES ('你的-user-uuid', 'super_admin', '{"all"}');
```
3. Run

**驗證**:
```sql
SELECT * FROM admins;
```
應看到 1 筆 (你剛加入的 admin)

---

## Step 3: 部署到 Vercel (5 分鐘)

### 3.1 推送 GitHub
```bash
cd "C:\Users\sunpe\美食遊覽"
git init 2>/dev/null  # 如果還沒
git add .
git commit -m "v5.3 Sunpe Supabase 部署版"
git branch -M main
git remote add origin https://github.com/SUNPE/美食遊覽.git
git push -u origin main
```

> 沒 GitHub repo? 開 https://github.com/new, 命名 `美食遊覽` 或 `food-map-tw`

### 3.2 連接 Vercel
1. 開 https://vercel.com/new
2. **Import** `美食遊覽` repo
3. **Configure Project**:
   - Framework Preset: **Other**
   - Build/Output: 留空
4. **Environment Variables** (關鍵!):
   - `SUPABASE_URL` = `https://qqbkpqqfnkiezrvrwypm.supabase.co`
   - `SUPABASE_ANON_KEY` = `sb_publishable_iAp1XvLz9cXblJYONcrmjQ_1_7NCI0W`
5. **Deploy**

### 3.3 取得 URL
- Vercel 給你: `https://美食遊覽.vercel.app` (或類似的)
- 訪問測試

---

## Step 4: 實機驗證 (1 分鐘)

1. 開你的 Vercel URL
2. 應看到 **164 店家** (從你的 Supabase 載入)
3. 測試推薦店家:
   - 點 📝 推薦店家 → 填表 → 送出
4. 管理員測試:
   - 點 🔐 管理員 (右下角) → 登入 → 看到 submission
   - 點 ✅ 通過 → 店家上架
5. 重新整理 → 看到新店家

---

## 疑難排解

### Q1: `sb_publishable_` key 格式問題
**A**: 這是 Supabase v2 SDK 的新格式, 2018 後所有新專案都用這種。**完全支援**。

### Q2: 部署後首頁沒資料
**A**: 檢查瀏覽器 Console (F12) > Network
- 看 `shops` request 是否成功
- 看 `SUPABASE_URL` 是否正確帶入

### Q3: 管理員登入失敗
**A**: 
- 確認 `admins` 表有你的 UID
- 確認 Email/Password 對
- 確認 ☑️ Auto Confirm User (沒勾 = 需 email 確認)

### Q4: SQL 跑失敗 (permission denied)
**A**: 確認你是 Supabase project owner
- Settings > General > 看你是 owner

---

## 你的專案最終 URL

`https://qqbkpqqfnkiezrvrwypm.supabase.co` ← Supabase 專案  
`https://美食遊覽.vercel.app` ← 部署後 Vercel URL

🚀 **20 分鐘完成, 給別人看!**
