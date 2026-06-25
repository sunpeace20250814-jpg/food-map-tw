#!/usr/bin/env bash
# check.sh - 美食遊覽驗收閘門
# 觸發: Vercel build 完成後跑
# 通過條件: 全部 gate exit 0

set -e

echo "=========================================="
echo "美食遊覽 GATE 檢查"
echo "=========================================="
echo ""

FAIL=0

# Gate 1: HTML 結構
echo "[Gate 1] HTML 結構檢查"
HTML_FILE="index.html"
if [ ! -f "$HTML_FILE" ]; then
    echo "  ✗ $HTML_FILE 不存在"
    FAIL=1
else
    if grep -q 'window.SHOP_DATA_INITIAL' "$HTML_FILE"; then
        echo "  ✓ SHOP_DATA_INITIAL 已 inline"
    else
        echo "  ✗ SHOP_DATA_INITIAL 缺失"
        FAIL=1
    fi
    if grep -q 'meta name="supabase-url"' "$HTML_FILE"; then
        echo "  ✓ Supabase meta tags 存在"
    else
        echo "  ⚠ Supabase meta tags 缺失 (建議加)"
    fi
    if grep -q 'assets/js/supabase/supabase-bootstrap.js' "$HTML_FILE"; then
        echo "  ✓ supabase-bootstrap.js 載入"
    else
        echo "  ✗ supabase-bootstrap.js 未載入"
        FAIL=1
    fi
fi
echo ""

# Gate 2: JS modules
echo "[Gate 2] JS modules 檢查"
JS_FILES=(
    "assets/js/app.js"
    "assets/js/theme.js"
    "assets/js/filters.js"
    "assets/js/sheet.js"
    "assets/js/favorites.js"
    "assets/js/supabase/supabase.min.js"
    "assets/js/supabase/supabase-client.js"
    "assets/js/supabase/supabase-ui.js"
    "assets/js/supabase/shop-loader.js"
    "assets/js/supabase/supabase-bootstrap.js"
)
for f in "${JS_FILES[@]}"; do
    if [ -f "$f" ]; then
        size=$(wc -c < "$f")
        echo "  ✓ $f ($size bytes)"
    else
        echo "  ✗ $f 缺失"
        FAIL=1
    fi
done
echo ""

# Gate 3: 禁用 alert / prompt / confirm (避免 Hermes 視窗)
echo "[Gate 3] 禁用 alert/prompt/confirm 檢查"
BAD=0
for f in assets/js/*.js assets/js/supabase/*.js; do
    if [ -f "$f" ]; then
        # 找 window.alert, window.prompt, window.confirm (非 .min)
        if [[ "$f" != *.min.js ]]; then
            matches=$(grep -nE 'window\.(alert|prompt|confirm)\(' "$f" 2>/dev/null | wc -l)
            if [ "$matches" -gt 0 ]; then
                echo "  ✗ $f 還有 $matches 個 window.alert/prompt/confirm"
                grep -nE 'window\.(alert|prompt|confirm)\(' "$f" | head -3
                BAD=1
            fi
        fi
    fi
done
if [ "$BAD" -eq 0 ]; then
    echo "  ✓ 無 window.alert/prompt/confirm"
fi
echo ""

# Gate 4: 禁用 hardcoded secret
echo "[Gate 4] 禁用 hardcoded secret 檢查"
BAD=0
# 排除 supabase-bootstrap.js (那是 build-inject 產生的, 已 commit)
# 排除 .vercelignore, README 等
for f in $(git ls-files '*.js' '*.html' 2>/dev/null | grep -vE '(supabase-bootstrap\.js|supabase\.min\.js)'); do
    if [ -f "$f" ]; then
        # 找 sb_publishable_ 開頭的 key (anon key pattern)
        if grep -E 'sb_publishable_[A-Za-z0-9_-]{30,}' "$f" > /dev/null 2>&1; then
            echo "  ✗ $f 包含 hardcoded anon key"
            BAD=1
        fi
    fi
done
if [ "$BAD" -eq 0 ]; then
    echo "  ✓ 無 hardcoded anon key"
fi
echo ""

# Gate 5: Vercel + Supabase 部署可達性
echo "[Gate 5] 部署可達性 (curl)"
URL="https://food-map-tw-dun.vercel.app"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ $URL HTTP 200"
else
    echo "  ✗ $URL HTTP $HTTP_CODE"
    FAIL=1
fi
echo ""

# Gate 6: Supabase REST 可達性
echo "[Gate 6] Supabase REST 可達性"
SB_URL="https://qqbkpqqfnkiezrvrwypm.supabase.co/rest/v1/shops?select=id&limit=1"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "apikey: sb_publishable_iAp1XvLz9cXblJYONcrmjQ_1_7NCI0W" -H "Authorization: Bearer sb_publishable_iAp1XvLz9cXblJYONcrmjQ_1_7NCI0W" "$SB_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ Supabase REST 200"
else
    echo "  ✗ Supabase REST HTTP $HTTP_CODE"
    FAIL=1
fi
echo ""

# Gate 7: 店家資料完整性
echo "[Gate 7] 店家資料完整性"
# 從 Supabase 取 count
SB_URL="https://qqbkpqqfnkiezrvrwypm.supabase.co/rest/v1/shops?select=id&limit=200"
RESP=$(curl -s --max-time 10 -H "apikey: sb_publishable_iAp1XvLz9cXblJYONcrmjQ_1_7NCI0W" -H "Authorization: Bearer sb_publishable_iAp1XvLz9cXblJYONcrmjQ_1_7NCI0W" "$SB_URL")
# 計算店家數 (id 數量)
COUNT=$(echo "$RESP" | grep -o '"id"' | wc -l)
if [ "$COUNT" -ge 164 ]; then
    echo "  ✓ 店家數: $COUNT (>=164)"
else
    echo "  ✗ 店家數: $COUNT (預期 >=164)"
    FAIL=1
fi
echo ""

echo "=========================================="
if [ $FAIL -eq 0 ]; then
    echo "✓ 全部 GATE 通過"
    exit 0
else
    echo "✗ 有 GATE 失敗"
    exit 1
fi