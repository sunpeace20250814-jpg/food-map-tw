# 高雄 + 台南捷運周邊宵夜地圖

> 2026 高雄 (46) + 台南 (50) 共 96 家捷運/輕軌周邊宵夜名單，互動式網站。

## 架構

**純前端靜態網頁，無後端。** 開瀏覽器即可使用，部署到任何靜態託管服務 (Vercel / Netlify / GitHub Pages)。

```
index.html + assets/{css,js}/
```

- 96 張店卡片內嵌在 `index.html` 的 `data-*` 屬性
- 完整店家資料陣列在 `window.SHOP_DATA_INITIAL` (供 detail sheet 渲染)
- 篩選邏輯直接讀 DOM 屬性，零網路請求
- 收藏用 localStorage 持久化

## 快速啟動

### 直接用瀏覽器打開
```bash
start index.html        # Windows
open index.html         # macOS
```

### 用本地伺服器 (推薦，避免某些瀏覽器的 CORS 限制)
```bash
npm start               # npx serve .
# 或
python -m http.server 8000
```

## 專案結構

```
美食遊覽/
├── index.html              # 96 張店卡片 + SHOP_DATA_INITIAL + UI
├── vercel.json             # Vercel 靜態託管設定
├── package.json            # 僅含 npm start
├── .github/workflows/
│   └── deploy-vercel.yml   # CI: push to main → 自動部署 Vercel
├── assets/
│   ├── css/                # main / components / filters / mobile / table
│   └── js/                 # app / filters / sheet / favorites
└── AGENTS.md               # 給未來 agent 的速查指南
```

## 功能總覽

- 7 維互動篩選 (搜尋 / 捷運線 / 營業時段 / 價位 / 類型 / 大類 / 環境)
- 動態計數 (quick-bar / hero stats 從 DOM 自動算)
- 收藏功能 (localStorage 持久化)
- iOS 安全的 sheet (`position: fixed` 鎖背景滾動，支援巢狀)
- XSS-safe (全部用 DOM API + textContent)
- 響應式 (桌機 / 平板 / 手機)
- 縣市切換 (高雄 ↔ 台南)
- 圖片來源：Google Maps Place Photo CDN (`lh3.googleusercontent.com`)

## 月費 = $0

無後端、無資料庫、無第三方付費服務。圖片走 Google 免費 CDN。部署 Vercel/Netlify 都在免費額度內。

## 授權

本專案整理的店家資訊來自公開推薦文，僅作為搜尋參考。
營業時間等資訊以店家現場公告為準。