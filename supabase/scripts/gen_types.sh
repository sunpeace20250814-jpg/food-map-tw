#!/usr/bin/env bash
# 美食遊覽 TypeScript Types 生成腳本
# 用途: 從 Supabase Cloud DB 自動生成 TS types 供前端使用
#
# 執行: bash supabase/scripts/gen_types.sh

set -e

echo "============================================"
echo " 生成 TypeScript Types"
echo "============================================"

if ! command -v supabase &> /dev/null; then
    echo "❌ 找不到 supabase CLI"
    exit 1
fi

# 確保已 link
if [ ! -f supabase/.temp/project-ref ]; then
    echo "❌ 還沒連結 Supabase 專案"
    echo "   執行: supabase link --project-ref YOUR_REF"
    exit 1
fi

PROJECT_REF=$(cat supabase/.temp/project-ref)
echo "✓ 專案: $PROJECT_REF"

# 生成 types
supabase gen types typescript --project-id "$PROJECT_REF" > assets/js/supabase/database.types.ts

echo "✓ types 已生成: assets/js/supabase/database.types.ts"
echo ""
echo "預覽前 30 行:"
head -30 assets/js/supabase/database.types.ts
