# STATUS.md - 美食遊覽當前狀態

## 當前版本

- **當前版本**: v5.11 (commit `38bc9cf`)
- **最近穩定版本**: v5.7 (CSS 修好)
- **當前步驟**: `6_項目記錄` (vibecoding-linear-framework)
- **當前任務**: 用 framework 整理專案文檔

## 當前進度

### 已完成

- ✅ 164 店家靜態資料 (高雄 46 + 台南 50 + 彰化 68)
- ✅ 135 張真實照片 (視覺驗證 100% 對應)
- ✅ Supabase Cloud 整合 (164 店家 INSERT 完成)
- ✅ 管理員帳號 (sunpe.taipei@gmail.com / super_admin)
- ✅ Vercel 公開 URL: `https://food-map-tw-dun.vercel.app`
- ✅ v5.11 正確部署流程 (build-inject.js + vercel.json)
- ✅ 主題切換 (dark/light/auto)
- ✅ 暗黑風 + 簡約 UI
- ✅ 用戶推薦 + 管理員審核 flow

### 進行中

- 🔄 Frontend-Agent (background): 修 P0 (line 658 過時/innerHTML/console/OpenGraph)
- 🔄 Tester-Agent (background): 寫 Playwright e2e test (5 cases)
- 🔄 Ops-Agent (background): 監控 v5.13 部署狀態
- 🔄 vibecoding-linear-framework 文檔對齊 (10 個 markdown 完成 9/10)
- 🔄 PRD.md + FLOWS.md + FRONTEND_HANDOFF.md + PROJECT_FRAME.md 完成

### 下一步

- 修 v5.13 部署實際跑狀況 (待 Vercel build 完成)
- 修 v5.0 ~ v5.10 的 source code 暴露問題 (回頭清 token)
- 完成 FRONTEND_HANDOFF.md 內容
- 設定 GATES.md + check.sh
- 收 Frontend/Tester/Ops 3 個子代理回報 → commit v6.0

## 當前卡點

- 之前流程 (v5.0 ~ v5.10) 沒用 framework, source code 暴露 anon key
- Vercel build 還沒實際跑 (待 Vercel auto-deploy 觸發)
- 14 家 CH 沒照片 (Maps 抓不到)

## 重要決定

- **2026-06-25**: 用 build-inject.js 取代 inline key (Vercel build-time inject)
- **2026-06-25**: 用 vibecoding-linear-framework 對齊 10 個 markdown
- **2026-06-24**: Supabase Cloud 取代 static data (動態載入)
- **2026-06-24**: Theme 切換 (localStorage 記憶 dark/light/auto)

## 下次接續提示

1. 先讀 `AGENTS.md` 決定當前步驟
2. 用 framework 10 個檔分工管理 (不要混在一個 README)
3. 部署流程: 修改 → commit → git push → Vercel auto-deploy → 訪問 URL 驗證
4. 絕對不再用 `vercel deploy` CLI 觸發 Hermes 視窗
5. 絕對不再把 secret 寫進 source code

## 已知小 bug

- ❌ submit/admin 按鈕雖掛載, 但 submit form 內有 prompt() (已改 inline modal)
- ❌ 彰化 18 家沒照片 (Maps 抓不到, 待 IG/FB 救援)
- ❌ inline e2 inline meta tag 重複 (歷史遺留, 不影響)

## Commit 紀錄 (38 commits)

- `38bc9cf` v5.11 build-inject.js (build-time env inject)
- `d03afe7` v5.10 移除最後 alert
- `288f8f4` v5.9 修 Hermes 視窗彈出
- `48db0c6` v5.8 inline SUPABASE_URL
- `5532a1f` v5.7 修 CSS 版型
- `8040e57` v5.6 簡約暗黑風
- `d8ed4f7` v5.5 Cache-Control
- `07791a6` v5.4 修 Supabase 整合
- ... 30 commits earlier

## 連結

- **GitHub**: https://github.com/sunpeace20250814-jpg/food-map-tw
- **Vercel**: https://food-map-tw-dun.vercel.app
- **Supabase**: https://qqbkpqqfnkiezrvrwypm.supabase.co
- **Framework**: https://github.com/liuethanyes-spec/vibecoding-linear-framework
