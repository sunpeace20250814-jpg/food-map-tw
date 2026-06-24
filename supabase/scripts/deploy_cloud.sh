#!/usr/bin/env bash
# 美食遊覽 Supabase Cloud 部署腳本
# 用途: 一鍵推 schema + migrations + seed 到 Supabase Cloud
#
# 前置條件:
# 1. 已註冊 Supabase 帳號: https://supabase.com
# 2. 已建立專案 (見 supabase/DEPLOY.md Step 1)
# 3. 已安裝 Supabase CLI: npm install -g supabase
#
# 執行: bash supabase/scripts/deploy_cloud.sh

set -e  # 任何錯誤立即停止

echo "============================================"
echo " 美食遊覽 Supabase Cloud 部署"
echo "============================================"
echo ""

# 檢查 CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ 找不到 supabase CLI"
    echo "   安裝: npm install -g supabase"
    exit 1
fi

echo "✓ Supabase CLI: $(supabase --version)"
echo ""

# Step 1: 登入
echo "Step 1/4: 登入 Supabase..."
supabase login

# Step 2: 連結專案
echo ""
echo "Step 2/4: 連結 Supabase 專案"
echo "   請輸入你的 Project Reference ID"
echo "   (從 Supabase Dashboard > Settings > General 找)"
read -p "Project Ref: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project Ref 不能為空"
    exit 1
fi

supabase link --project-ref "$PROJECT_REF"

# Step 3: 推 migrations
echo ""
echo "Step 3/4: 推 schema (shops, user_submissions, admins + RLS)..."
supabase db push

# Step 4: 跑 seed
echo ""
echo "Step 4/4: 跑種子資料 (164 店家)..."
echo "   這個會把 164 店家 INSERT 到 shops 表"
read -p "確認執行 seed? (y/N): " CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    supabase db execute -f supabase/seed/001_initial_shops.sql
    echo ""
    echo "✓ 164 店家已寫入 shops 表"
else
    echo "跳過 seed, 請手動到 Supabase Dashboard > SQL Editor 跑:"
    echo "  supabase/seed/001_initial_shops.sql"
fi

echo ""
echo "============================================"
echo "✅ Supabase 部署完成!"
echo "============================================"
echo ""
echo "下一步:"
echo "  1. Supabase Dashboard > Authentication > Users > Add user (管理員)"
echo "  2. SQL Editor 跑: INSERT INTO admins (user_id, role, permissions) VALUES ('...', 'super_admin', '{\"all\"}');"
echo "  3. Settings > API 複製 Project URL + anon public key"
echo "  4. Vercel 設環境變數 + push 部署"
echo ""
echo "詳細步驟見: supabase/DEPLOY.md"
