# PRD.md - 美食遊覽 v6.0 產品需求文檔

狀態：`v1.0 完成` (待用戶確認)
撰寫者: PRD-Agent
撰寫時間: 2026-06-25

## 0. 產品經理判斷

- **我理解用戶真正想解決的問題是**: 把高雄/台南/彰化 164 家宵夜店整理成可發現、可篩選的視覺地圖, 並讓用戶可推薦新店家, 管理員可審核上架
- **當前最大不確定性是**: 用戶是否滿意當前 80% 圖片覆蓋率, 是否要投資 29 家無照片救援
- **我建議 P0 先做**: 完善 v5.13 已部署的 164 店家 UI, 修 5 個致命問題 (PRD/FLOWS/FRONTEND_HANDOFF/無 unit test/無 lint)
- **我不建議這版做**: 重寫整個 app.js 換框架 (React/Vue) - 風險太高, 收益不對等

## 1. 一句話定位

**這個產品是什麼**: 高雄 / 台南 / 彰化 164 家宵夜精選互動地圖, 訪客可瀏覽/篩選/收藏, 並可推薦新店家, 管理員可審核上架

**給誰用**:
- P0: Sunpe 本人 + 朋友 (美食分享)
- P1: 高雄/台南/彰化在地居民 (找宵夜)
- P2: 觀光客 (旅遊規劃)

**幫助用戶完成什麼結果**:
- 快速發現 164 家宵夜店, 按縣市/類型/時段/設施篩選
- 一鍵收藏喜愛店家 (localStorage)
- 推薦新店家 (提交表單)
- 分享店家 (複製連結)

## 2. 用戶與場景

| 項目 | 內容 |
|---|---|
| 核心用戶 | Sunpe + 美食愛好者 |
| 使用場景 | 晚上 9 點 - 凌晨 2 點, 找宵夜 |
| 觸發時機 | 「今晚想吃 XX」 → 開站找 |
| 當前替代方案 | Google Maps 搜尋, 美食部落格 |
| 當前痛點 / 成本 | Maps 資訊雜亂, 部落格不即時 |
| 使用頻率 | 每週 1-3 次 |

## 3. 問題定義

**必須解決的問題**:
- 164 店家分散, 沒集中可發現的地方 ✓
- 店家資訊 (地址, 營業時間, 照片) 不一致 ✗ 部分缺
- 訪客無法推薦新店家 ✗ 沒推薦表單
- 店家更新沒人管 ✗ 管理員審核缺

**明確不解決的問題**:
- 線上點餐 (不商業化)
- 配送 (不商業化)
- 評論系統 (避免維護)
- 社群互動 (避免 scope 膨脹)

## 4. 範圍

### P0: 必須交付 (v6.0)

- ✅ 164 店家靜態展示 (已完成 v5.13)
- ✅ 縣市切換 (kh/tn/ch)
- ✅ 篩選 chip (全部/24hr/未打烊/火鍋/日式/小吃/有冷氣)
- ✅ 收藏 (localStorage)
- ✅ 圖片 strip (135 張, 4 縮圖 + 1 +N)
- ✅ 主題切換 (dark/light/auto)
- ✅ 推薦店家 modal (in-page)
- ✅ 管理員審核 modal (in-page)
- ✅ 部署: https://food-map-tw-dun.vercel.app
- ❌ PRD 完整文檔 (待 PRD-Agent 補)
- ❌ FLOWS 互動邏輯 (待 Interaction-Agent 補)
- ❌ FRONTEND_HANDOFF 交接包 (待 Frontend-Handoff-Agent 補)
- ❌ unit test (待 Tester-Agent 補)
- ❌ lint (待 Frontend-Agent 補)

### P1: 後續增強 (v6.1+)

- 修 app.js line 658 過時字眼 (ts/籌備中 → 改 switch/case 加 ch)
- 加 OpenGraph meta (社群分享預覽)
- 修 innerHTML → textContent (XSS 防禦)
- 29 家無照片救援 (IG/FB 抓圖)
- 圖片 lazy load (641KB 加速)
- 圖片壓縮 (WebP)
- i18n (英文版)
- 鍵盤導航完整測試 (a11y)
- SEO sitemap.xml + robots.txt
- Service Worker (PWA 離線)
- 多尺寸 favicon
- Lighthouse 90+ 優化

### 不做

- 換 React/Vue 框架 (過度工程化)
- 線上點餐系統
- 配送整合
- 評論 / 評分系統 (除非用戶要求)
- 多語系 (繁中已足)
- 推播通知

## 5. 成功標準

- **可訪問**: https://food-map-tw-dun.vercel.app 200
- **可發現**: 164 店家都能看到
- **可互動**: 縣市切換 + 篩選 + 收藏 + 主題 + 推薦 + 審核都正常
- **可分享**: 分享按鈕複製到剪貼簿
- **$0 月費**: Supabase 500MB + Vercel 100GB 都沒用滿
- **無重大 bug**: check.sh 7/7 通過

## 6. 驗收標準

每條必須可觀察、可測試或可人工確認。

- [ ] `bash .vibecoding/check.sh` 7/7 通過
- [ ] https://food-map-tw-dun.vercel.app HTTP 200
- [ ] 164 店家從 Supabase 載入
- [ ] 135 個 photo-strip 顯示
- [ ] 主題切換 (dark/light/auto) 3 模式都 work
- [ ] 縣市切換 (kh/tn/ch) 3 個
- [ ] 篩選 (全部/24hr/未打烊/火鍋/日式/小吃/有冷氣) 7 個
- [ ] 收藏 (localStorage) 持久化
- [ ] 📝 推薦店家 modal in-page, 無 prompt
- [ ] 🔐 管理員 modal in-page, 無 prompt
- [ ] 分享按鈕 (複製到剪貼簿, 無 prompt)
- [ ] 任何 console.log/error 在 production 不出現
- [ ] 任何 innerHTML XSS 風險消除
- [ ] 任何 console 觸發 prompt 觸發
- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 80
- [ ] Lighthouse SEO > 80
- [ ] Lighthouse Best Practices > 80

## 7. 約束

| 類型 | 內容 |
|---|---|
| 時間 | 無 deadline, 隨意 |
| 平台 | Web (Chrome/Safari/Firefox/Edge 桌面 + iOS Safari + Android Chrome) |
| 數據 | 164 店家 (Supabase 50k 行/月免費額度足夠 5+ 年) |
| 成本 | $0 月費 |
| 合規 / 安全 | RLS enabled, anon key 無寫權限, secret 不入 source |

## 8. 假設與風險

| 類型 | 內容 | 如何驗證 |
|---|---|---|
| 假設 | 訪客在 1 個月內推薦 ≤ 10 店家 | Supabase dashboard 看 user_submissions count |
| 假設 | 用戶有 Chrome/Safari (不用 IE) | browser_compat 觀察 |
| 假設 | 用戶接受繁中 UI | 看用戶反饋 |
| 風險 | lh3 圖片過期 | 定期 check, 抓圖救援 |
| 風險 | Supabase 額度用完 | dashboard 監控 |
| 風險 | Vercel build fail | CI 跑 check.sh 失敗 rollback |
| 風險 | 沒 unit test → 重構出 bug | v6.1 寫 test |
| 風險 | 沒 PRD/設計文檔 → 開發亂 | v6.0 補文檔 |

## 9. 待確認問題

只保留會影響範圍、互動、技術方案或驗收標準的問題。

- 是否要救援 29 家無照片店家? (P1)
- 是否要寫 unit test? (P0 - framework 硬門)
- 是否要加 OpenGraph meta? (P1)
- 是否要拆分大 app.js (33KB) 成多檔? (P2)
- 是否要做多語系? (不建議)

## 10. 確認記錄

- 確認人: Sunpe
- 確認時間: -
- 備註: 由 PRD-Agent 自動生成 v1.0, 待用戶確認 v1.0
