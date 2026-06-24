#!/usr/bin/env bash
# 美食遊覽 部署腳本說明
# 執行: bash deploy-help.sh

cat <<'EOF'
============================================
 美食遊覽 - 部署腳本說明 v5.2
============================================

你選了「全 CLI 部署」! 一個腳本完成 Supabase + Vercel 全端部署。

📋 部署前準備 (5 分鐘)
1. 註冊 Supabase:        https://supabase.com
2. 建立 Supabase 專案:    Dashboard > New Project
3. 拿到 Project Ref:      Settings > General > Reference ID (20 個小寫字母)
4. 註冊 Vercel:           https://vercel.com
5. 建立 GitHub repo:      https://github.com/new (命名: 美食遊覽)

🚀 執行部署
- Windows PowerShell:    powershell -ExecutionPolicy Bypass -File deploy-all.ps1
- Linux/Mac/Git Bash:    bash deploy-all.sh

⏱️ 預估時間
- Supabase 部分:  10 分鐘 (含註冊 + 跑 SQL + 設 admin)
- GitHub 部分:    1 分鐘
- Vercel 部分:    4 分鐘
- 總計:            15-20 分鐘

📊 腳本流程 (8 steps)
1. ✓ 前置檢查 (Node, git, supabase, vercel CLI)
2. ✓ Supabase 登入
3. ✓ 連結 Supabase 專案 (互動問 Project Ref)
4. ✓ 推 schema (shops, user_submissions, admins + RLS + 觸發器)
5. ✓ 跑 164 店家種子資料
6. ✓ 設管理員帳號 (互動問 User UID)
7. ✓ 取得 API URL + Key (互動問)
8. ✓ 推 GitHub + 部署 Vercel + 設環境變數

🎯 部署後
- URL:              https://美食遊覽.vercel.app
- 管理員入口:       首頁右下角 🔐
- 使用者推薦:       首頁右上角 📝

💡 跳過互動的環境變數
如要在 CI 或非互動環境跑, 用環境變數:
  PROJECT_REF=xxx SUPABASE_URL=xxx SUPABASE_ANON_KEY=xxx \
  ADMIN_UID=xxx GITHUB_REPO_URL=xxx \
  bash deploy-all.sh --non-interactive

📖 詳細文檔
- supabase/DEPLOY.md       - Supabase 詳細指南
- VERCEL_DEPLOY.md         - Vercel 詳細指南
- supabase/scripts/        - 個別工具腳本
- AGENTS.md                - 給未來 agent 速查

🚀 開始吧!
EOF
