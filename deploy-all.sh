#!/usr/bin/env bash
# 美食遊覽 一鍵全自動 CLI 部署
# 用途: 一個腳本完成 Supabase + Vercel 全端部署
# 時間: 15-20 分鐘 (含註冊 Supabase + 設 Vercel)
# 費用: $0
#
# 執行: bash deploy-all.sh

set -e

# 顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 計數
STEP=0
total_steps=8

banner() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════╗"
    echo "║   美食遊覽 - 一鍵全自動 CLI 部署 v5.2    ║"
    echo "║   部署給別人看 - 月費 \$0                ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

step() {
    STEP=$((STEP + 1))
    echo ""
    echo -e "${CYAN}[Step $STEP/$total_steps]${NC} $1"
    echo "─────────────────────────────────────────"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}!${NC} $1"
}

read_input() {
    read -p "$1: " value
    echo "$value"
}

# ============================================
# Step 0: 前置檢查
# ============================================
banner
step "前置檢查"

# 檢查 Node.js / npm
if ! command -v node &> /dev/null; then
    error "找不到 Node.js, 請先安裝: https://nodejs.org/"
fi
success "Node.js: $(node --version)"

if ! command -v npm &> /dev/null; then
    error "找不到 npm"
fi
success "npm: $(npm --version)"

# 檢查 git
if ! command -v git &> /dev/null; then
    error "找不到 git, 請先安裝: https://git-scm.com/"
fi
success "git: $(git --version)"

# 檢查 supabase CLI
if ! command -v supabase &> /dev/null; then
    warning "找不到 supabase CLI, 安裝中..."
    npm install -g supabase
    success "已安裝 supabase CLI"
fi
success "Supabase CLI: $(supabase --version)"

# 檢查 vercel CLI
if ! command -v vercel &> /dev/null; then
    warning "找不到 vercel CLI, 安裝中..."
    npm install -g vercel
    success "已安裝 vercel CLI"
fi
success "Vercel CLI: $(vercel --version)"

# ============================================
# Step 1: Supabase 登入
# ============================================
step "Supabase 登入"

echo "請在瀏覽器登入 Supabase 帳號..."
supabase login
success "已登入 Supabase"

# ============================================
# Step 2: 連結 Supabase 專案
# ============================================
step "連結 Supabase 專案"

echo ""
echo "如未建立 Supabase 專案, 請先到:"
echo "  https://supabase.com/dashboard"
echo ""
echo "建立專案後, 從 Settings > General 找 Reference ID"
echo "  (範例: abcdefghijklmnopqrst)"
echo ""

while true; do
    PROJECT_REF=$(read_input "輸入 Supabase Project Reference ID")
    if [ -z "$PROJECT_REF" ]; then
        warning "Project Ref 不能為空"
        continue
    fi
    if [[ "$PROJECT_REF" =~ ^[a-z]{20}$ ]]; then
        success "Project Ref 格式正確"
        break
    else
        warning "格式怪異 (應為 20 個小寫字母), 重試"
    fi
done

supabase link --project-ref "$PROJECT_REF"
success "已連結專案: $PROJECT_REF"

# ============================================
# Step 3: 推 schema
# ============================================
step "推 Schema (shops, user_submissions, admins + RLS)"

supabase db push
success "Schema 已推上 Supabase Cloud"

# ============================================
# Step 4: 跑種子資料 (164 店家)
# ============================================
step "跑種子資料 (164 店家)"

echo ""
echo "準備寫入 164 店家到 shops 表..."
echo "  - 高雄 46 家"
echo "  - 台南 50 家"
echo "  - 彰化 68 家"
echo ""

if supabase db execute -f supabase/seed/001_initial_shops.sql; then
    success "164 店家已寫入 shops 表"
else
    warning "Seed 失敗, 嘗試備用方案..."
    warning "請手動到 Supabase Dashboard > SQL Editor 跑:"
    warning "  supabase/seed/001_initial_shops.sql"
    read -p "按 Enter 繼續 (或 Ctrl+C 中斷)..."
fi

# ============================================
# Step 5: 設管理員帳號
# ============================================
step "設管理員帳號"

echo ""
echo "請到 Supabase Dashboard:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/auth/users"
echo ""
echo "1. 點 'Add user' > 'Create new user'"
echo "2. Email: 用你的 email"
echo "3. Password: 強密碼"
echo "4. ☑️ Auto Confirm User"
echo "5. 點 'Add user'"
echo "6. 複製剛建立的 User UID"
echo ""

read -p "按 Enter 繼續..." dummy

ADMIN_UID=$(read_input "貼上 User UID (UUID 格式)")

# 自動加入 admins 表
ADMIN_SQL="INSERT INTO admins (user_id, role, permissions) VALUES ('$ADMIN_UID', 'super_admin', '{\"all\"}');"

if supabase db execute --sql "$ADMIN_SQL"; then
    success "管理員已加入 admins 表"
else
    warning "加入 admins 失敗, 請手動到 SQL Editor 跑:"
    echo "  $ADMIN_SQL"
    read -p "按 Enter 繼續..." dummy
fi

# ============================================
# Step 6: 取得 API 連線資訊
# ============================================
step "取得 Supabase API 連線資訊"

echo ""
echo "請到 Supabase Dashboard > Settings > API"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo ""
echo "複製:"
echo "  - Project URL"
echo "  - anon public key"
echo ""

SUPABASE_URL=$(read_input "貼上 Project URL (https://xxx.supabase.co)")
SUPABASE_ANON_KEY=$(read_input "貼上 anon public key (eyJ...)")

# 驗證格式
if [[ ! "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
    warning "URL 格式怪異 (應為 https://xxx.supabase.co)"
fi
if [[ ! "$SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
    warning "Anon key 格式怪異 (應以 eyJ 開頭)"
fi

success "API 連線資訊已記錄"

# ============================================
# Step 7: 推 GitHub
# ============================================
step "推 GitHub"

# 檢查 .git
if [ ! -d .git ]; then
    warning "未 git 初始化, 執行 git init"
    git init
    git branch -M main
fi

# 檢查 remote
if ! git remote -v | grep -q origin; then
    echo ""
    echo "如未建立 GitHub repo, 請先到 https://github.com/new"
    echo "  命名: 美食遊覽 (或 food-map-tw)"
    echo "  不要初始化 README, .gitignore, license (本機已有)"
    echo ""
    read -p "按 Enter 繼續..." dummy
    REPO_URL=$(read_input "貼上 GitHub repo URL (https://github.com/USER/REPO.git)")
    git remote add origin "$REPO_URL"
fi

# 確保有 commit
if [ -n "$(git status --porcelain)" ]; then
    warning "有未 commit 的改動, 自動 commit"
    git add .
    git commit -m "v5.2 部署版 (全 CLI 自動化)" || warning "無需 commit"
fi

# Push
git push -u origin main
success "已推 GitHub"

# ============================================
# Step 8: 部署 Vercel
# ============================================
step "部署 Vercel"

echo ""
echo "Vercel 登入..."
vercel login

echo ""
echo "Vercel 連結 + 設環境變數 + 部署..."

# 設定環境變數 (用 vercel env add)
echo "設定 SUPABASE_URL..."
vercel env add SUPABASE_URL production < <(echo "$SUPABASE_URL") 2>&1 | grep -v "^Vercel" || true
echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production 2>&1 | grep -v "^Vercel" || true

echo "設定 SUPABASE_ANON_KEY..."
echo "$SUPABASE_ANON_KEY" | vercel env add SUPABASE_ANON_KEY production 2>&1 | grep -v "^Vercel" || true

# 部署
echo ""
echo "部署到 Production..."
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
echo "$DEPLOY_OUTPUT"

# 取得 URL
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE "https://[a-zA-Z0-9-]+\.vercel\.app" | head -1)

if [ -n "$DEPLOY_URL" ]; then
    success "部署完成!"
    echo ""
    echo "============================================"
    echo -e "${GREEN} 美食遊覽已上線!${NC}"
    echo "============================================"
    echo ""
    echo "  URL: $DEPLOY_URL"
    echo "  Supabase: https://supabase.com/dashboard/project/$PROJECT_REF"
    echo "  Vercel: https://vercel.com/dashboard"
    echo ""
    echo "測試:"
    echo "  1. 訪問 $DEPLOY_URL 看到 164 店家"
    echo "  2. 點 📝 推薦店家, 填表, 送出"
    echo "  3. 點 🔐 管理員 (右下角), 登入, 審核"
    echo "  4. 重新整理首頁, 看到新店家"
    echo ""
    echo "============================================"
else
    warning "沒抓到 Vercel URL, 請到 https://vercel.com/dashboard 查看"
fi

echo ""
success "🎉 部署完成! 給別人看 $DEPLOY_URL"
