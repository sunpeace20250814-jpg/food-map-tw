#!/usr/bin/env bash
# 美食遊覽 Vercel Token 取得腳本
# 用途: 用 vercel login 取得 token, 設到 GitHub Secrets 給 CI/CD 用
# 執行: bash supabase/scripts/get_vercel_token.sh

set -e

echo "============================================"
echo " 取得 Vercel Token 給 CI/CD"
echo "============================================"
echo ""

if ! command -v vercel &> /dev/null; then
    echo "❌ 找不到 vercel CLI"
    echo "   安裝: npm install -g vercel"
    exit 1
fi

# 確保已登入
echo "請在瀏覽器登入 Vercel..."
vercel login

echo ""
echo "取得 Vercel Token..."

# Vercel CLI 提供 token (需 vercel whoami 驗證登入)
# 注意: Vercel 沒直接暴露 token, 需從 .vercel/auth.json 讀取
if [ -f ~/.vercel/auth.json ]; then
    TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.vercel/auth.json')).get('token', ''))" 2>/dev/null || cat ~/.vercel/auth.json | grep -oE '"token":\s*"[^"]+"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo ""
        echo "✓ Vercel Token 取得成功"
        echo ""
        echo "你的 Token:"
        echo "  $TOKEN"
        echo ""
        echo "============================================"
        echo "設定 GitHub Secrets:"
        echo "============================================"
        echo ""
        echo "選項 1: 自動設定 (用 GitHub CLI)"
        if command -v gh &> /dev/null; then
            echo "  gh secret set VERCEL_TOKEN --body '$TOKEN'"
            echo "  gh secret set VERCEL_ORG_ID --body '$(vercel teams ls 2>/dev/null | head -1 | awk '{print \$1}')'"
            echo "  gh secret set VERCEL_PROJECT_ID --body '美食遊覽'"
            echo ""
            read -p "自動執行? (y/N): " AUTO
            if [ "$AUTO" = "y" ]; then
                gh secret set VERCEL_TOKEN --body "$TOKEN"
                gh secret set VERCEL_ORG_ID --body "$(vercel teams ls 2>/dev/null | head -1 | awk '{print $1}')"
                gh secret set VERCEL_PROJECT_ID --body "美食遊覽"
                echo "✓ 已設定 GitHub Secrets"
            fi
        else
            echo "  (需先安裝 GitHub CLI: https://cli.github.com)"
        fi
        echo ""
        echo "選項 2: 手動設定"
        echo "  1. 開 https://github.com/YOUR_USER/美食遊覽/settings/secrets/actions"
        echo "  2. New repository secret, 3 個:"
        echo "     - VERCEL_TOKEN: $TOKEN"
        echo "     - VERCEL_ORG_ID: (從 vercel teams ls 找)"
        echo "     - VERCEL_PROJECT_ID: 美食遊覽 (或你的 Vercel project name)"
        echo ""
        echo "選項 3: 不設 Secrets, 部署仍可手動跑:"
        echo "  bash deploy-all.sh"
    fi
else
    echo "❌ 找不到 ~/.vercel/auth.json"
    echo "   請先 vercel login"
    exit 1
fi
