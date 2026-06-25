# ERRORS.md - 美食遊覽歷史報錯

不要默認全文讀取。修 bug 時按關鍵詞或標籤搜索。

## 標籤

- `#環境`
- `#依賴`
- `#構建`
- `#運行時`
- `#接口`
- `#互動`
- `#樣式`
- `#測試`
- `#部署`
- `#資料`

## 報錯記錄

### 2026-06-25 - Hermes GUI 視窗無法關閉 - 標籤：#部署 #互動

- **版本**: v5.0 ~ v5.10
- **觸發場景**: 在對話框中請用戶輸入 Vercel token
- **原始報錯**: Hermes desktop GUI 彈出 Windows 對話框要求輸入 token, 用戶輸入也無法確定
- **根本因**: 
  1. 我跑 `vercel deploy` 互動式 CLI
  2. 觸發 Hermes 內部認證 prompt
  3. 用戶被迫輸入, 但輸入 UI 卡住
- **解決方式**: 不用 CLI, 用 Vercel REST API (curl) 觸發 deploy
- **是否已驗證**: 是 (v5.11 部署 OK)
- **以後避免規則**: 永遠不跑 vercel / gh / supabase CLI 互動指令。永遠用 REST API + 本地 git

### 2026-06-25 - Vercel CLI 中文 hostname bug - 標籤：#部署 #環境

- **版本**: v5.0 ~ v5.10
- **觸發場景**: `vercel deploy` 在 Windows 跑
- **原始報錯**: `TypeError: 行樂日和 @ vercel 54.1.0 node-v24.14.0 win32 (x64) is not a legal HTTP header value`
- **根本因**: Vercel CLI 54.1.0 抓 `os.userInfo().username` 送 HTTP header, 中文字符不合法
- **解決方式**: 用 Vercel REST API 繞過
- **是否已驗證**: 是
- **以後避免規則**: 不跑 Vercel CLI

### 2026-06-25 - Vercel CLI 中文路徑 bug - 標籤：#部署 #環境

- **版本**: v5.0 ~ v5.10
- **觸發場景**: `vercel link` 或 `vercel deploy` 在 `C:\Users\sunpe\美食遊覽` 跑
- **原始報錯**: `Detected linked project does not have "id"`
- **根本因**: Vercel CLI 讀 .vercel/project.json 解析中文路徑失敗
- **解決方式**: 用 Vercel REST API 直接 deploy
- **是否已驗證**: 是
- **以後避免規則**: 不跑 Vercel CLI

### 2026-06-24 - Vercel JSON parse 失敗 (BOM) - 標籤：#構建 #部署

- **版本**: v5.5
- **觸發場景**: Vercel API POST /v9/projects/.../env
- **原始報錯**: `config-json-parse-error: Unexpected token '﻿', "﻿{ ... " is not valid JSON`
- **根本因**: `vercel.json` 開頭有 UTF-8 BOM (`\ufeff`)
- **解決方式**: Python `open('rb').read()[3:]` 移除 BOM
- **是否已驗證**: 是 (commit f3d296f)
- **以後避免規則**: 寫 JSON 檔不用 BOM, 用 LF/CRLF

### 2026-06-24 - package.json BOM - 標籤：#構建

- **版本**: v5.5
- **觸發場景**: Vercel build 跑 `node build-inject.js` (或 npm install)
- **原始報錯**: `Could not read /vercel/path0/package.json: Unexpected token '﻿'`
- **根本因**: `package.json` 開頭有 UTF-8 BOM
- **解決方式**: 移除 BOM
- **是否已驗證**: 是 (commit bd3164f)
- **以後避免規則**: 寫 package.json 不用 BOM

### 2026-06-24 - Supabase RLS 遞迴 - 標籤：#構建 #資料

- **版本**: 第一次 Supabase setup
- **觸發場景**: 查 `https://...supabase.co/rest/v1/shops`
- **原始報錯**: `infinite recursion detected in policy for relation "admins"`
- **根本因**: `shops` 表 RLS `EXISTS (SELECT 1 FROM admins WHERE ...)` 觸發 admins 表 RLS 檢查 → 迴圈
- **解決方式**: 用 `SECURITY DEFINER` 函數 `is_admin()` 隔離檢查邏輯
- **是否已驗證**: 是
- **以後避免規則**: RLS 政策不要跨表查詢, 用函數包裝

### 2026-06-24 - window.SUPABASE_URL IIFE race condition - 標籤：#運行時 #互動

- **版本**: v5.0 ~ v5.3
- **觸發場景**: 頁面載入, 推薦店家/管理員按鈕沒掛載
- **原始報錯**: 按鈕不顯示, console `window.SUPABASE_URL === ""`
- **根本因**: 
  1. ES module `const SUPABASE_URL = ...` 在 module load 時鎖死
  2. inline script `window.SUPABASE_URL = '...'` 在 module 之後跑 (順序錯)
  3. 最後變 `''`
- **解決方式**: 把 module top-level const 改 `getSupabaseUrl()` 函數, 動態讀 meta tag
- **是否已驗證**: 是 (commit 07791a6)
- **以後避免規則**: ES module 不要用 top-level const 鎖定 env, 用函數 + meta tag

### 2026-06-25 - Lh3 圖片過期 (個別店家) - 標籤：#資料

- **版本**: v3.5 ~ v5.x
- **觸發場景**: 個別店家圖片 lh3 URL 返回 403
- **原始報錯**: 圖片無法顯示
- **根本因**: Google Maps lh3 URL 過期 (auto-routing 變化)
- **解決方式**: 移除失效 lh3, 標 `_no_photo: true` 純文字卡
- **是否已驗證**: 是
- **以後避免規則**: lh3 URL 不可信, 需有 fallback

### 2026-06-25 - 彰化 18 家沒照片 - 標籤：#資料

- **版本**: v5.11
- **觸發場景**: 切到彰化, 部分店家無 photo-strip
- **根本因**: Google Maps 對彰化小型在地店 auto-routing bug
- **解決方式**: 待 IG/FB 救援
- **是否已驗證**: 否
- **以後避免規則**: 偏鄉店家需用其他圖源 (商家 FB, 街景)

### 2026-06-25 - Source code 暴露 anon key - 標籤：#安全 #部署

- **版本**: v5.0 ~ v5.10
- **觸發場景**: HTML source / JS source
- **根本因**: 我直接把 anon key 寫進 source code
- **解決方式**: v5.11 build-inject.js (Vercel build-time inject)
- **是否已驗證**: 是
- **以後避免規則**: 永遠不寫 secret 進 source code, 用 build-time inject
