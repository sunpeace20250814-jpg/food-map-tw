# GATES.md - 美食遊覽驗收閘門

狀態：`已配置` (v5.11)

本文件定義"什麼算完成"。`.vibecoding/check.sh` 是可執行版本。

## 1. 總規則

只有同時滿足以下條件，才可以聲稱完成：

1. `.vibecoding/check.sh` 全部 7 個 gate 通過
2. 滿足 PRD.md 的相關驗收標準
3. 沒有引入未經確認的新依賴、架構變化或密鑰硬編碼

## 2. 自動檢查 (check.sh)

| Gate | 檢查內容 | 通過條件 |
|------|----------|----------|
| 1 | HTML 結構 | `index.html` 含 SHOP_DATA_INITIAL + supabase-bootstrap.js |
| 2 | JS modules | 10 個 JS 檔案都存在 |
| 3 | 無 alert/prompt/confirm | 所有 .js 沒有 `window.alert/prompt/confirm()` |
| 4 | 無 hardcoded secret | 所有 .js/.html 沒有 `sb_publishable_...` 模式 (除 build-inject 產生的) |
| 5 | Vercel URL 可達 | `https://food-map-tw-dun.vercel.app` HTTP 200 |
| 6 | Supabase REST 可達 | `https://...supabase.co/rest/v1/shops` HTTP 200 |
| 7 | 店家資料完整 | Supabase 至少有 164 店家 |

## 3. 人工驗收

### UI/UX

- [ ] 高雄 46 家全部顯示
- [ ] 台南 50 家全部顯示
- [ ] 彰化 68 家全部顯示 (50 張照片 + 18 純文字卡)
- [ ] 縣市切換正常 (3 個 chip)
- [ ] 篩選 chip 正常 (全部/24hr/未打烊/火鍋/日式/小吃/有冷氣)
- [ ] 排序下拉正常
- [ ] 收藏功能 (localStorage)
- [ ] 主題切換 (dark/light/auto) 在 header 切換
- [ ] 圖片 strip 4 縮圖 + +N 標籤
- [ ] 詳細 modal / 相簿 modal
- [ ] 分享按鈕 (複製到剪貼簿, 不彈窗)
- [ ] 地圖連結 (新分頁)

### Supabase 整合

- [ ] 📝 推薦店家按鈕 → 開表單 modal (in-page, 不彈原生視窗)
- [ ] 🔐 管理員按鈕 → 開登入 modal
- [ ] 管理員登入 (sunpe.taipei@gmail.com / Admin@Sunpe2026!)
- [ ] 看到待審核清單 (含 0 筆)
- [ ] 推薦店家 → 寫入 user_submissions
- [ ] 審核備註 / 拒絕原因 → inline modal (不彈 prompt)

### 部署

- [ ] https://food-map-tw-dun.vercel.app 200
- [ ] 站點渲染 164 店家
- [ ] 動態載入 (Supabase 資料) work
- [ ] 主題按鈕在 header
- [ ] 沒有任何 prompt/alert/confirm 視窗

## 4. 觸發時機

- **本地開發**: 修改後跑 `bash .vibecoding/check.sh`
- **Vercel deploy**: 部署後跑 (失敗就 rollback)
- **commit 前**: 跑 check.sh 確認 OK
