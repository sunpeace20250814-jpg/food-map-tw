# 高雄宵夜地圖 — 雲端部署指南 (Vercel + Supabase 可選)

## 為什麼用 Vercel?

Vercel 比 Netlify 多了 2 個關鍵優勢:
1. **本地端檔案系統支援** (Lambda Function 可讀靜態檔案)
2. **更慷慨的免費額度** + 內建 KV 服務

但 Vercel Lambda 是唯讀 fs,所以我們的後端用 **inline 內嵌 46 家店** 確保部署後立即可用。

## 架構

```
Browser
  ↓
Vercel
  ├─ /  → 靜態 index.html + assets/
  └─ /api/* → Vercel Functions (Node.js)
              ↓
             (optional) Supabase Postgres
              ├─ shops (46 列)
              ├─ stations (18 列)
              └─ favorites
```

**不需要 Supabase 也能跑** — Functions 內建 46 家 mock 資料。

## 部署步驟 (5 分鐘, 免費)

### 1. 註冊 Vercel (1 分鐘)
- 開 https://vercel.com/signup
- 用 GitHub 帳號登入(免信用卡)
- 確認 email

### 2. 安裝 Vercel CLI
```bash
npm install -g vercel
```

### 3. 一鍵部署
```bash
cd "C:/Users/sunpe/美食遊覽"
./scripts/deploy-vercel.sh
```

這個腳本會:
- 跑後端測試(6 個 endpoint, 確認沒壞)
- 初始化 git
- 呼叫 `vercel --prod` 部署
- 給你 production URL

### 4. (選用) 接 Supabase

部署後若要真實資料庫(可讓多人同步最愛):

1. 到 https://supabase.com 建專案 (Region 選 Singapore)
2. SQL Editor 跑 `backend/supabase/schema.sql`
3. 再跑 `backend/supabase/seed-data.sql`
4. Settings > API 拿 `Project URL` + `service_role key`
5. 設環境變數:
   ```bash
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_SERVICE_KEY production
   vercel --prod    # 重新部署讓 env 生效
   ```

不接 Supabase 也完全可運作(用 mock 資料)。

## 驗證 API

部署後測試:

```bash
SITE="https://<你的網域>.vercel.app"

# 取得所有店家
curl $SITE/api/shops

# 紅線
curl "$SITE/api/shops?line=red"

# 單店
curl $SITE/api/shops/1

# 站名
curl $SITE/api/stations
```

## 本地開發

```bash
# 純前端 (不需後端)
start index.html

# 完整後端 (含 mock 模式)
npx vercel dev     # http://localhost:3000

# 跑測試
node scripts/test-functions.js
```

## 環境變數

| 變數 | 必填 | 用途 |
|------|------|------|
| `SUPABASE_URL` | 否 | Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | 否 | Supabase service_role key |
| `KV_URL` | 否 | Vercel KV (備用) |
| `KV_TOKEN` | 否 | Vercel KV token (備用) |

全部都是**選用**。不設 = 用 inline 46 家 mock 資料。

## 月費估算

| 服務 | 免費額度 | 預估用量 | 費用 |
|------|----------|----------|------|
| Vercel Functions | 100GB-hr/月 | <1GB-hr | **$0** |
| Vercel Bandwidth | 100GB/月 | <1GB | **$0** |
| Supabase Postgres | 500MB | <1MB | **$0** |
| Supabase Auth | 50k MAU | 0 (尚未整合) | **$0** |
| **總計** | | | **$0/月** |

## 檔案結構

```
美食遊覽/
├── index.html                        # 前端主頁
├── vercel.json                       # Vercel 路由設定
├── package.json
├── .env.example                      # 環境變數範本
├── .gitignore
├── assets/                           # 前端資源
├── api/                              # Vercel Functions (後端)
│   ├── _db.js                        # 雙模式 DB 抽象 (Supabase / Vercel KV / mock)
│   ├── _helpers.js                   # CORS + JWT
│   ├── _seed.js                      # Inline 46 家 + SQL 解析
│   ├── shops.js                      # GET /api/shops
│   ├── shops/[id].js                 # GET /api/shops/:id
│   ├── stations.js                   # GET /api/stations
│   └── favorites.js                  # GET/POST/DELETE /api/favorites
├── backend/
│   └── supabase/                     # 選用 Supabase SQL
│       ├── schema.sql
│       └── seed-data.sql
├── scripts/
│   ├── test-functions.js             # 後端測試
│   └── deploy-vercel.sh              # 一鍵部署
├── docs/DEPLOY.md                    # 本檔
└── README.md
```

## 故障排除

### Q: `vercel login` 沒反應
A: CLI 會開瀏覽器。沒 GUI 環境就用 `vercel login --github` 或手動 token。

### Q: Functions 回 500
A: 開 https://vercel.com/dashboard → 你的專案 → Logs 看錯誤。

### Q: 怎麼更新資料?
**Inline 模式**: 編輯 `api/_seed.js`, commit, `vercel --prod`
**Supabase 模式**: Supabase Table Editor 直接編輯,前端下次載入自動 fetch

## 從 Netlify 遷移

已有 Netlify 部署? 沒問題 — `netlify/functions/` 仍存在,兩個都能跑:
- Vercel 用 `api/`
- Netlify 用 `netlify/functions/`

兩份檔案內容同步,選一個部署就好。
