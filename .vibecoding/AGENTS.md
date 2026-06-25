# AGENTS.md - 美食遊覽 AI 入口

本文件是 AI 進入這個專案的唯一預設入口。
按固定流程推進，避免每次對話讀所有文檔。

## 1. 當前專案狀態

| 欄位 | 當前值 |
|---|---|
| 當前步驟 | `6_項目記錄` |
| 當前目標 | 對齊 vibecoding-linear-framework 10 個 markdown |
| PRD | `未完成` (待補 美食遊覽 PRD) |
| 專案框架 | `部分完成` (v5.11 部署流程已對齊) |
| 互動邏輯 | `未開始` |
| 前端交接包 | `未開始` |
| 前端代碼 | `v5.11 已部署` (commit 38bc9cf) |
| 當前版本 | `v5.11` |
| 歷史報錯 | `8+ 條` (見 `.vibecoding/ERRORS.md`) |
| 驗收閘門 | `未配置` (待 `check.sh` 寫) |

允許的步驟：

1. `1_PRD規劃`
2. `2_專案框架`
3. `3_互動邏輯`
4. `4_前端交接包`
5. `5_前端生成代碼`
6. `6_項目記錄`
7. `7_驗收閘門`

## 2. 當前流程 (美食遊覽)

```
v3.1 baseline
  → v3.2-v3.4 重試 INDETERMINATE (30 家救回)
  → v3.5 加彰化 68 家
  → v3.6 清掉錯誤
  → v3.7-v4.13 SOP 抓圖 (135 視覺驗證)
  → v5.0 Supabase Cloud (使用者推薦 + 管理員審核)
  → v5.4 Supabase 整合修復
  → v5.5 Cache-Control
  → v5.6 簡約暗黑風 UI
  → v5.7 修 CSS 版型
  → v5.11 build-inject.js (Vercel build-time env inject)
```

## 3. 文件路由表 (美食遊覽)

| 當前任務 | 只讀這些文件 | 預設不讀 |
|---|---|---|
| 部署/修 bug | `.vibecoding/STATUS.md`, `vercel.json`, `build-inject.js` | PRD/FRONTEND_HANDOFF |
| 加店家/修資料 | `index.html` SHOP_DATA_INITIAL, `supabase/migrations/` | 歷史 CHANGELOG |
| 改 UI 樣式 | `assets/css/app.css`, `assets/js/theme.js` | 整個 index.html |
| 修 Supabase 整合 | `assets/js/supabase/*.js` | CSS/UI |
| 看當前狀態 | `.vibecoding/STATUS.md` (本目錄) | 完整歷史 |
| 查歷史版本 | `.vibecoding/CHANGELOG.md`, `git log` | 當前狀態 |
| 查歷史報錯 | `.vibecoding/ERRORS.md` | 當前狀態 |

## 4. 硬門 (美食遊覽)

- **永遠不寫 secret 進 source code** (anon key 在 build-inject.js 注入)
- **永遠不用 `vercel` CLI 部署** (觸發 Hermes 視窗)
- **永遠不用 `gh` CLI** (觸發 GitHub 認證)
- **永遠不在對話框要求 token** (用戶已在 Vercel dashboard 設)
- 部署流程: 修改 → `git commit` → `git push` → Vercel auto-deploy
- 訪問 `https://food-map-tw-dun.vercel.app` 驗證
- 不破壞 `food-map-tw-dun.vercel.app` alias

## 5. 部署流程 (v5.11 標準)

1. 修改 code
2. 本地測試: `python -m http.server 8785` + browser
3. `git add . && git commit -m "..."` (本地, 不互動)
4. `git push origin main` (Vercel 自動觸發 build)
5. Vercel build 跑 `node build-inject.js` (從環境變數注入)
6. Vercel auto-deploy 完成 → 訪問 URL

**不要做的**:
- ❌ `vercel deploy` (CLI)
- ❌ `vercel login`
- ❌ `gh auth`
- ❌ 在對話框輸入 token
- ❌ 把 anon key 寫進 HTML/JS

## 6. 已知報錯 (見 ERRORS.md)

- Vercel CLI 中文 hostname bug (行樂日和) → 用 REST API 繞過
- Vercel CLI 中文路徑 bug (美食遊覽) → 改用 Vercel REST API
- Vercel JSON parse 失敗 (BOM) → 移除 BOM
- Supabase RLS 遞迴 (infinite recursion) → 用 SECURITY DEFINER 函數
- window.SUPABASE_URL IIFE race condition → inline script
- bot-input Hermes 視窗 (鍵盤輸入被擋) → 改 inline DOM modal

## 7. 文檔更新規則

| 發生什麼 | 更新哪裡 |
|---|---|
| 版本發布 | `.vibecoding/CHANGELOG.md` |
| 報錯/失敗/踩坑 | `.vibecoding/ERRORS.md` |
| 當前進度變化 | `.vibecoding/STATUS.md` (本目錄 AGENTS.md 狀態塊) |
| 部署流程變化 | 本文件第 5 節 |
| 架構變化 | `.vibecoding/PROJECT_FRAME.md` |
| PRD 變化 | `.vibecoding/PRD.md` |

## 8. 回覆結尾格式

每次較完整回覆結尾：

1. 完成了什麼
2. 下一步是什麼
3. 有沒有卡點或需要用戶確認
