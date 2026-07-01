# 美食遊覽 - 資料維護工作流

## 新增縣市 (例: 台北)

### Step 1: 複製 CSV 範本
```bash
cp data/template-new-city.csv data/new-tp.csv
```

### Step 2: 編輯店家清單
用 VSCode / Excel 編輯 `data/new-tp.csv`:
- `city` 填 `tp` (台北)
- `name` 填 Google Maps 官方店名
- `addr` 填完整地址 (含郵遞區號)
- `cat_main` 從 enum 選 (麵粥/小吃/...)
- `gmaps_query` 填店名 + 城市 (會自動生成 URL)

### Step 3: 驗證 + 合併
```bash
python data/validate.py data/new-tp.csv --write
```
自動做:
- schema 檢查
- Maps URL 自動生成 (店名前 4 字 + 城市名)
- 合併到 `index.html` SHOP_DATA_INITIAL

### Step 4: 視覺驗證
```bash
python data/vision-verify.py --city tp --sample 10
```
對抽樣 10 家用 vision tool 比對:
- 店名 vs 圖片描述 (招牌)
- 分類 vs 圖片內容 (業務/菜色)
- 環境 vs 圖片場景 (室內/冷氣)
- 標信心度: 高/中/低

### Step 5: e2e + deploy
```bash
bash .vibecoding/check.sh
cd tests && npx playwright test
git add -A && git commit -m "v6.X 新增 tp 縣市 N 家"
vercel deploy --prod --token $TOK --yes
```

## 檔案結構
```
data/
├── shops-schema.json     # JSON schema 驗證
├── template-new-city.csv # CSV 範本
├── validate.py           # 驗證 + 自動修 URL + 合併
├── vision-verify.py      # 視覺驗證 (取樣)
├── vision-refetch.py     # 重抓低信心店家 lh3 圖
├── vision-result.json    # 驗證結果
├── reviews.json          # 顧客評論 (key = 店家名)
└── vision-batch3/        # batch3 取樣圖 (30 JPG)
```

## 規則
- 永遠不寫 secret 進 source
- 永遠不用 CLI 互動 (Hermes 視窗)
- 自動修 Maps URL,不要手寫
- vision 標記未通過的不上線
