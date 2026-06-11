# 高雄捷運周邊深夜美食地圖

> 2026 高雄捷運/輕軌周邊 46 家營業到晚上 10 點後的宵夜名單，互動式網站。

## 架構

```
前端 (Netlify 靜態託管)  +  後端 (Netlify Functions)  +  資料庫 (Supabase Postgres)
```

詳細部署指南見 [`docs/DEPLOY.md`](docs/DEPLOY.md)。

## 快速啟動

### 純前端 (不需要後端)
直接用瀏覽器打開 `index.html` 即可，會自動 fallback 用 inline 資料：

```
start index.html
```

### 本地端開發 (含後端)
```bash
npm install -g netlify-cli
netlify dev    # 啟動 http://localhost:8888
```

沒設 `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` 時, Functions 自動用 mock 模式 (從 `backend/supabase/seed-data.sql` 解析 46 家)。

### 跑後端測試
```bash
node scripts/test-functions.js
```

## 專案結構

```
美食遊覽/
├── index.html                        # 前端主頁
├── netlify.toml                      # Netlify 路由設定
├── package.json
├── .env.example                      # 環境變數範本
├── assets/                           # 前端資源
│   ├── css/  js/  data/  img/
├── netlify/
│   └── functions/                    # Netlify Functions (後端)
│       ├── _db.js                    # Supabase REST 抽象層 + mock
│       ├── _helpers.js               # CORS + JWT 認證
│       ├── _seed.js                  # 本地 mock 自動灌 46 家
│       ├── shops.js                  # GET /shops
│       ├── shops-id.js               # GET /shops/:id
│       ├── stations.js               # GET /stations
│       └── favorites.js              # GET/POST/DELETE /favorites
├── backend/
│   └── supabase/
│       ├── schema.sql                # 4 張表 + RLS + 18 站
│       └── seed-data.sql             # 46 家店 INSERT
├── scripts/
│   └── test-functions.js             # 本地端測試腳本
└── docs/
    └── DEPLOY.md                     # 完整部署指南
```

## 功能總覽

- 7 維互動篩選 (搜尋/捷運線/營業時段/價位/類型/大類/環境)
- 動態計數 (quick-bar / hero stats 從 DOM 自動算)
- 收藏功能 (localStorage 為主, 登入後雲端同步)
- iOS 安全的 sheet (position: fixed 鎖背景滾動)
- XSS-safe (全部用 DOM API + textContent)
- 響應式 (桌機/平板/手機)
- ⚠️ 非深夜營業店家自動加警告標籤
- 已修正 8 家地理標籤錯誤 (衛武營/鹽埕埔/左營 等誤標)

## 開發者快速指令

```bash
# 後端 Functions 測試 (不需要 Supabase)
node scripts/test-functions.js

# 重新生成 seed-data.sql (從現有 index.html)
# (沒有現成腳本, 參考 backend/supabase/seed-data.sql 格式手動)
```

## 月費估算

| 服務 | 免費額度 | 預估用量 | 費用 |
|------|----------|----------|------|
| Netlify Functions | 125k req/月 | <1k | **$0** |
| Netlify Bandwidth | 100GB/月 | <1GB | **$0** |
| Supabase Postgres | 500MB, 2GB 流量 | <1MB | **$0** |
| Supabase Auth | 50k MAU | 0 (尚未整合) | **$0** |
| **總計** | | | **$0/月** |

## 授權

本專案整理的店家資訊來自公開推薦文，僅作為搜尋參考。
營業時間等資訊以店家現場公告為準。
