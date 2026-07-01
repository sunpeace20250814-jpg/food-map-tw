# 後續待辦 (v10.1 已發, 這些是 backlog)

## 已完成 (v10.1)

- [x] 刪 v7 inline 殘留 → 3f10411 (v10.0 cleanup)
- [x] sheet.js 統一渲染 (移除 shop-loader.js 重複) → 3f10411
- [x] sheet 完整版: weekly_hours / photo strip / reviews / favorite / booking

## 待辦 (backlog)

### 高優先
- [ ] Playwright 7 點互動測試正式納入 CI (目前 tests/e2e.spec.js 6 點, 缺 album/fab)
- [ ] vision 30 家取樣 (高雄 10 + 台南 10 + 彰化 10)
- [ ] 低信心 3 家重抓 lh3 圖 (石精臼蚵仔煎/大丸家/Daisy House)

### 中優先
- [ ] reviews.json 內容 (目前 `{}`, 等店家評論資料整理)
- [ ] 移除 `data/agents/` 兩個 dev script (aesthetic_auditor.py / code_supervisor.py)
- [ ] 移除 `data/validate.py / vision_run.py / vision-verify.py / vision-refetch.py` (vision 流程已結束)

### 低優先 (nice-to-have)
- [ ] 圖片 lazy-load + intersection observer
- [ ] sheet 開合動畫 (目前 instant)
- [ ] offline PWA support