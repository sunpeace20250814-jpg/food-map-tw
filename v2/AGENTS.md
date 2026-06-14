# AGENTS.md (v2)

> 給未來 agent 的速查指南

## 專案一句話
高雄 (46) + 台南 (50) + 彰化 (68) 捷運/輕軌/區域周邊宵夜互動地圖, 純前端, 資料驅動, 可無限擴展。

## 啟動
```bash
npm start                # npx serve .  → http://localhost:3000
```

## 架構
- **單一資料源**: `data/` 下的 JSON 檔
- **零後端, 零 build step**: 瀏覽器 fetch + 動態渲染
- **零 node_modules 開發依賴**

## 資料流
```
data/cities.json  →  data.js 載入 + 驗證  →  main.js init
                                       ↓
data/shops/{city}.json  ───────────┐
data/stations/{city}.json  ──┐    │
                            ↓    ↓
                          SHOPS  STATIONS  →  city.js / cards.js 渲染
                                              filters.js 篩選
                                              sheet.js 詳情
                                              favorites.js 收藏
```

## 慣例
- **DOM 用 `el()` 工具函式** (XSS-safe, 見 cards.js)
- **加新店家**: 編輯 `data/shops/{city}.json`, 跑 `node scripts/validate.mjs`
- **加新城市**: 跑 `node scripts/add_city.mjs <code> <name>`, 見 docs/ADDING_CITY.md
- **改 UI 結構**: 改 `assets/css/` (5 個檔分工明確)
- **改互動邏輯**: 改 `assets/js/` 對應模組
- **圖片來源**: `lh3.googleusercontent.com` (Google Maps Place Photo CDN)

## 沒有這些
- ❌ 後端, ❌ 資料庫, ❌ build step, ❌ 測試, ❌ API
