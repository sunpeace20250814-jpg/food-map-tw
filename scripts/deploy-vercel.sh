#!/bin/bash
# ============================================
# deploy-vercel.sh — 一鍵部署到 Vercel (雲端, 非自架)
# ============================================
# 用法:
#   1. vercel login                  (僅第一次, 開瀏覽器登入)
#   2. ./scripts/deploy-vercel.sh
# ============================================

set -e

cd "$(dirname "$0")/.."
ROOT=$(pwd)

echo "=== 高雄宵夜地圖 — 一鍵部署到 Vercel ==="
echo ""

# 1. 確認 vercel CLI
command -v vercel >/dev/null 2>&1 || command -v npx >/dev/null 2>&1 || { echo "❌ vercel CLI 不存在。npm i -g vercel"; exit 1; }

VLC=$(command -v vercel || echo "npx vercel")

# 2. 跑後端測試
echo "▶ 後端測試..."
node scripts/test-functions.js | tail -3
echo ""

# 3. 初始化 git
if [ ! -d .git ]; then
    echo "▶ 初始化 git repo..."
    git init
    git checkout -b main 2>/dev/null || git branch -M main
    git add -A
    git commit -m "Initial: 高雄宵夜地圖 with Vercel Functions + Supabase optional"
fi
echo ""

# 4. 詢問是否要登入
if ! $VLC whoami >/dev/null 2>&1; then
    echo "▶ 請登入 Vercel..."
    $VLC login
fi
echo ""

# 5. 部署
echo "▶ 部署到 Vercel production..."
echo "  (首次會問一些設定, 一路 Enter 即可, 預設值都對)"
echo ""
$VLC --prod --yes
echo ""

echo "✅ 部署完成!"
echo ""
echo "下一步 (選用): 設定 Supabase"
echo "  1. 到 https://supabase.com 建專案"
echo "  2. SQL Editor 跑 backend/supabase/schema.sql + seed-data.sql"
echo "  3. Settings > API 拿 Project URL + service_role key"
echo "  4. vercel env add SUPABASE_URL production"
echo "  5. vercel env add SUPABASE_SERVICE_KEY production"
echo "  6. vercel --prod   # 重新部署讓 env 生效"
