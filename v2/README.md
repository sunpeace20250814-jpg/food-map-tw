# 台灣美食地圖 v2

> 純前端靜態網頁 · 資料驅動 · 可無限擴展

## 立即發布到 Netlify (3 步)

1. **打開 https://app.netlify.com/drop**
2. **把整個 `v2/` 資料夾拖進去** (不是整個美食遊覽, 是 v2 子資料夾)
3. **完成** — 30 秒後你會得到 `https://random-name-123.netlify.app`

> 無需 Netlify 帳號 (拖拽模式)、無需 GitHub、無需 build。
> 之後可登入 Netlify 改名為 `taiwan-food-map.netlify.app` 或綁定自訂網域。

## 本地預覽

```bash
npm start
# → http://localhost:3000
```

## 城市

| 代碼 | 城市 | 店家數 | 分區 | 主要類型 |
|---|---|---|---|---|
| kh | 高雄 | 46 | 18 個捷運站 | 紅橘輕軌/麵粥/小吃/居酒屋/火鍋 |
| tn | 台南 | 50 | 35 個行政區 | 虱目魚/溫體/古早味米糕/海鮮粥 |
| ch | 彰化 | 68 | 8 個鄉鎮 | 酥皮肉圓/爌肉飯/鹿港老街/景觀餐廳 |
| **共** | **台灣** | **164** | | |

## 篩選依城市改變

每個城市的篩選 chips 是動態生成的, 不是寫死的。例:
- 高雄 顯示「捷運線」篩選 (紅/橘/輕軌)
- 台南 隱藏捷運線
- 彰化 顯示「鄉鎮」標示

## 新增城市

見 [`docs/ADDING_CITY.md`](docs/ADDING_CITY.md)。

## 資料格式

見 [`docs/SCHEMA.md`](docs/SCHEMA.md)。

## 檔案結構

```
v2/
├── index.html              # 18 KB skeleton
├── netlify.toml            # Netlify 配置 (SPA fallback + cache)
├── package.json            # 只有 npm start
├── assets/
│   ├── css/                # 5 個 CSS
│   └── js/                 # 7 個 ES modules
├── data/
│   ├── cities.json         # 縣市 metadata
│   ├── shops/{kh,tn,ch}.json  # 146 家店
│   ├── stations/{kh,tn,ch}.json  # 站/區
│   └── wiki_photos.json    # 43 張 Wikimedia Commons 真實照片
├── scripts/                # 工具 (validate, add_city)
├── docs/                   # SCHEMA.md, ADDING_CITY.md
└── AGENTS.md, README.md    # 速查指南
```

## 驗證資料完整性

```bash
node scripts/validate.mjs
# 應該看到: PASSED, 0 errors, 146 shops
```

## 月費 = $0

- 無後端
- 無資料庫
- 無第三方付費服務
- 圖片走 Wikimedia Commons (免費 / CORS-friendly)
- Netlify 免費額度足夠 (100GB/月流量, 對於靜態網站足夠)

## 授權

店家資訊來自公開推薦文, 僅供搜尋參考。
營業時間等資訊以店家現場公告為準。