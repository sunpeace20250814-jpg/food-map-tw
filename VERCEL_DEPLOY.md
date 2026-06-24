# Vercel 部署完整指南

> **最終 URL**: https://美食遊覽.vercel.app  
> **時間**: 5 分鐘  
> **費用**: $0 (Vercel 免費額度 100GB 流量/月)

---

## 前置條件
1. ✅ Supabase 部署完成 (見 `supabase/DEPLOY.md`)
2. ✅ GitHub 帳號
3. ✅ Vercel 帳號 (用 GitHub 登入)
4. ✅ `美食遊覽` 程式碼已 commit 到本地 Git

---

## Step 1: 推 GitHub (1 分鐘)

```bash
cd 美食遊覽

# 如果還沒 git 初始化
git init
git add .
git commit -m "v5.1 Supabase Cloud 整合"

# 推 GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/美食遊覽.git
git push -u origin main
```

> 沒 GitHub repo? 開 https://github.com/new 建一個, 命名 `美食遊覽` 或 `food-map-tw`

---

## Step 2: 連接 Vercel (2 分鐘)

1. 開 https://vercel.com/new
2. **Import Git Repository**:
   - 選 **Import GitHub Account** (授權)
   - 找到 `美食遊覽` repo
   - 點 **Import**
3. **Configure Project**:
   - **Project Name**: 改為 `美食遊覽` 或 `food-map-tw`
   - **Framework Preset**: **Other** (純靜態, 不選 Next.js/Vite)
   - **Root Directory**: `./` (預設)
   - **Build Command**: 留空
   - **Output Directory**: 留空
   - **Install Command**: 留空

---

## Step 3: 環境變數 (關鍵!)

**在 Vercel 部署頁面下方 "Environment Variables"**:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://abcdefghij.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJ...VCJ9.eyJ...` |

> 從 Supabase Dashboard > Settings > API 複製

**Apply to**: ☑️ Production  ☑️ Preview  ☑️ Development

---

## Step 4: Deploy (1 分鐘)

點 **Deploy** 按鈕。

Vercel 會跑 build:
1. 沒 build step (純靜態, 幾秒完成)
2. 上傳檔案到 CDN
3. 給你 URL: `https://美食遊覽.vercel.app`

---

## Step 5: 自動 CI (已配置 ✅)

每次 `git push origin main`, Vercel 自動:
1. 拉最新程式碼
2. 部署到 production URL

`deploy-vercel.yml` workflow 已在 `.github/workflows/` (注意: Vercel 內建 CI, GitHub Action 不需要)

---

## Step 6: 驗證 (1 分鐘)

1. 開 `https://美食遊覽.vercel.app`
2. 應看到 164 店家 (從 Supabase 載入)
3. 測試使用者功能:
   - 點 📝 推薦店家 → 填表 → 送出
   - 開 Supabase Dashboard > user_submissions 表
   - 應看到剛送出的店家
4. 測試管理員:
   - 點 🔐 管理員 (右下角) → 登入
   - 看到剛推薦的店家
   - 點 ✅ 通過
   - 重新整理首頁 → 看到新店家

---

## 疑難排解

### Q1: 部署後首頁顯示 "164 店家" 但篩選/切換城市沒反應
**A**: 檢查瀏覽器 Console (F12) 有無 JavaScript 錯誤
- Vercel > Project > Deployments > 最新部署 > Functions 標籤 (沒函數因為純前端)
- 確認 `assets/js/app.js` 載入成功 (Network 標籤)
- **常見原因**: 部署時 .vercelignore 排除了 assets/

### Q2: 首頁顯示 0 店家 (空白)
**A**:
- Supabase RLS 沒設, 公開讀取失敗
- Supabase Dashboard > Authentication > Policies > shops 表
- 應有 "公開店家資料" policy (FOR SELECT USING is_active = true)
- 沒有的話重跑 `supabase db push` 或手動 SQL 跑 RLS section

### Q3: Vercel 部署成功, 但訪問顯示 404
**A**: Vercel > Project > Settings > Domains > 確認預設 Domain 設為 primary
- 或檢查 `vercel.json` 的 builds 設定:
```json
{
  "version": 2,
  "builds": [
    { "src": "**/*", "use": "@vercel/static" }
  ]
}
```

### Q4: 使用者推薦後, 管理員沒看到
**A**:
1. Supabase Dashboard > Table Editor > user_submissions 確認有資料
2. 確認 admin 帳號已設 (SQL: `SELECT * FROM admins;`)
3. 管理員重新登出 / 登入

---

## 環境變數清單 (Vercel)

| Name | Required | Value |
|------|----------|-------|
| `SUPABASE_URL` | ✅ | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | anon public key |

> 沒設也 OK → fallback 靜態 SHOP_DATA_INITIAL (164 店家, 但沒使用者推薦功能)

---

## 部署後常用動作

```bash
# 看部署日誌
vercel logs [deployment-url]

# 強制重新部署 (即使沒改 code)
vercel --force

# 看環境變數
vercel env ls

# 設新環境變數
vercel env add SUPABASE_URL

# 移除環境變數
vercel env rm SUPABASE_URL

# 設定 domain (自訂網域)
vercel domains add food.example.com
```

---

## 月費 = $0

| 服務 | 免費額度 | 預估使用 |
|------|----------|----------|
| Vercel 流量 | 100GB/月 | ~5GB (500 訪客 × 10MB) |
| Vercel 函數 | 100GB-hr | 0 (純靜態) |
| Vercel 部署 | 100/天 | 1-2 (commit 觸發) |
| Supabase | 500MB + 50k 行 | < 1MB + 200 行 |

---

## 完整部署流程總結

```
[Supabase Cloud]                  [GitHub]                 [Vercel]
  ✓ 註冊 (1 min)                    ✓ 建立 repo (1 min)      ✓ Import repo (2 min)
  ✓ 跑 migrations (5 min)           ✓ git push (1 min)       ✓ 設環境變數 (1 min)
  ✓ 跑 seed (1 min)                                       ✓ Deploy (1 min)
  ✓ 設 admin (3 min)
  總計: 10 分鐘                       總計: 2 分鐘            總計: 4 分鐘
                                                      ↓
                                                    [全世界用戶]
                                                    https://美食遊覽.vercel.app
```

🚀 **20 分鐘內完成全端部署, 給別人看!**
