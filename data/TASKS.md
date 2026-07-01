# 後續待辦

## ✅ v10.5-v10.7 商業化衝刺 (2026-07-01)

### P0 法務/資安
- [x] privacy-policy.html (台灣個資法) → `df6a4a6`
- [x] terms-of-service.html → `df6a4a6`
- [x] favicon.ico + apple-touch-icon.png → `df6a4a6`
- [x] Content-Security-Policy meta tag → `df6a4a6`

### P1 SEO + a11y
- [x] robots.txt + sitemap.xml → `a6e6647`
- [x] JSON-LD ItemList schema → `a6e6647`
- [x] skip-link + focus-visible → `a6e6647`

### P2 測試 + CI
- [x] e2e test 3 flaky 修掉 (#statTotal race → visible cards count) → `b784c74`
- [x] CI workflow 加 test step (needs: test 阻擋 deploy) → `b784c74`

### 待辦 P2 (v10.8)
- [ ] Error tracking (window.onerror + unhandledrejection hook, 預留 Sentry 接入點)
- [ ] Service worker + manifest.webmanifest (PWA 安裝 + offline)
- [ ] 拆分 app.js 795 行 → 多檔 (sheet-modal / toast / tab 等)
- [ ] Vision 30 家取樣驗證 (高雄 10 + 台南 10 + 彰化 10)
- [ ] 低信心 3 家重抓 lh3 圖 (石精臼蚵仔煎/大丸家/Daisy House)
- [ ] Playwright 7 點測試補完 (目前 7, 缺 album/fab)
- [ ] reviews.json 內容 (目前 `{}`)
- [ ] 圖片 lazy-load + intersection observer
- [ ] sheet 開合動畫

## 已解決 (歷史)
- ~~`.album-modal` CSS bug~~ → f286f7f (v10.3) 補完
- ~~v9.3 task list~~ → 全部進度更新
- ~~`.vercelignore` negation 無效~~ → `31a1eb5` (v10.4.1) 用 `/data/` 限定根目錄