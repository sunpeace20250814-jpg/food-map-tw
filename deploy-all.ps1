# 美食遊覽 一鍵全自動 CLI 部署 (Windows PowerShell)
# 用途: 一個腳本完成 Supabase + Vercel 全端部署
# 時間: 15-20 分鐘
# 費用: $0
#
# 執行: powershell -ExecutionPolicy Bypass -File deploy-all.ps1

$ErrorActionPreference = "Stop"

# 顏色
function Write-Banner {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " 美食遊覽 - 一鍵全自動 CLI 部署 v5.2" -ForegroundColor Cyan
    Write-Host " 部署給別人看 - 月費 `$0" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
}

$Script:Step = 0
$Script:TotalSteps = 8

function Write-Step {
    param([string]$Message)
    $Script:Step++
    Write-Host ""
    Write-Host "[Step $($Script:Step)/$($Script:TotalSteps)] $Message" -ForegroundColor Cyan
    Write-Host "----------------------------------------"
}

function Write-Success {
    param([string]$Message)
    Write-Host "OK $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "X $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "! $Message" -ForegroundColor Yellow
}

# ============================================
# Step 0: 前置檢查
# ============================================
Write-Banner
Write-Step "前置檢查"

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "找不到 Node.js, 請先安裝: https://nodejs.org/"
}
Write-Success "Node.js: $(node --version)"

# npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "找不到 npm"
}
Write-Success "npm: $(npm --version)"

# git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "找不到 git, 請先安裝: https://git-scm.com/"
}
Write-Success "git: $(git --version)"

# Supabase CLI
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Warning-Custom "找不到 supabase CLI, 安裝中..."
    npm install -g supabase
    if ($LASTEXITCODE -ne 0) { Write-Error-Custom "安裝 supabase 失敗" }
    Write-Success "已安裝 supabase CLI"
}
Write-Success "Supabase CLI: $(supabase --version)"

# Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Warning-Custom "找不到 vercel CLI, 安裝中..."
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) { Write-Error-Custom "安裝 vercel 失敗" }
    Write-Success "已安裝 vercel CLI"
}
Write-Success "Vercel CLI: $(vercel --version)"

# ============================================
# Step 1: Supabase 登入
# ============================================
Write-Step "Supabase 登入"

Write-Host "請在瀏覽器登入 Supabase 帳號..."
supabase login
if ($LASTEXITCODE -ne 0) { Write-Error-Custom "Supabase 登入失敗" }
Write-Success "已登入 Supabase"

# ============================================
# Step 2: 連結 Supabase 專案
# ============================================
Write-Step "連結 Supabase 專案"

Write-Host ""
Write-Host "如未建立 Supabase 專案, 請先到: https://supabase.com/dashboard"
Write-Host "建立專案後, 從 Settings > General 找 Reference ID (20 個小寫字母)"
Write-Host ""

while ($true) {
    $PROJECT_REF = Read-Host "輸入 Supabase Project Reference ID"
    if ([string]::IsNullOrWhiteSpace($PROJECT_REF)) {
        Write-Warning-Custom "Project Ref 不能為空"
        continue
    }
    if ($PROJECT_REF -match "^[a-z]{20}$") {
        Write-Success "Project Ref 格式正確"
        break
    } else {
        Write-Warning-Custom "格式怪異 (應為 20 個小寫字母), 重試"
    }
}

supabase link --project-ref $PROJECT_REF
if ($LASTEXITCODE -ne 0) { Write-Error-Custom "連結失敗" }
Write-Success "已連結專案: $PROJECT_REF"

# ============================================
# Step 3: 推 schema
# ============================================
Write-Step "推 Schema (shops, user_submissions, admins + RLS)"

supabase db push
if ($LASTEXITCODE -ne 0) { Write-Error-Custom "推 schema 失敗" }
Write-Success "Schema 已推上 Supabase Cloud"

# ============================================
# Step 4: 跑種子資料 (164 店家)
# ============================================
Write-Step "跑種子資料 (164 店家)"

Write-Host ""
Write-Host "準備寫入 164 店家到 shops 表..."
Write-Host "  - 高雄 46 家"
Write-Host "  - 台南 50 家"
Write-Host "  - 彰化 68 家"
Write-Host ""

$confirm = Read-Host "確認執行 seed? (y/N)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    supabase db execute -f supabase/seed/001_initial_shops.sql
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "Seed 失敗, 請手動到 Supabase Dashboard > SQL Editor 跑 supabase/seed/001_initial_shops.sql"
        Read-Host "按 Enter 繼續"
    } else {
        Write-Success "164 店家已寫入 shops 表"
    }
} else {
    Write-Warning-Custom "跳過 seed, 請手動到 SQL Editor 跑"
    Read-Host "按 Enter 繼續"
}

# ============================================
# Step 5: 設管理員帳號
# ============================================
Write-Step "設管理員帳號"

Write-Host ""
Write-Host "請到 Supabase Dashboard:"
Write-Host "  https://supabase.com/dashboard/project/$PROJECT_REF/auth/users"
Write-Host ""
Write-Host "1. 點 'Add user' > 'Create new user'"
Write-Host "2. Email: 用你的 email"
Write-Host "3. Password: 強密碼"
Write-Host "4. ☑️ Auto Confirm User"
Write-Host "5. 點 'Add user'"
Write-Host "6. 複製剛建立的 User UID"
Write-Host ""

Read-Host "按 Enter 繼續" | Out-Null

$ADMIN_UID = Read-Host "貼上 User UID (UUID 格式)"

$ADMIN_SQL = "INSERT INTO admins (user_id, role, permissions) VALUES ('$ADMIN_UID', 'super_admin', '{""all""}');"

supabase db execute --sql $ADMIN_SQL
if ($LASTEXITCODE -ne 0) {
    Write-Warning-Custom "加入 admins 失敗, 請手動到 SQL Editor 跑:"
    Write-Host $ADMIN_SQL
    Read-Host "按 Enter 繼續"
} else {
    Write-Success "管理員已加入 admins 表"
}

# ============================================
# Step 6: 取得 API 連線資訊
# ============================================
Write-Step "取得 Supabase API 連線資訊"

Write-Host ""
Write-Host "請到 Supabase Dashboard > Settings > API"
Write-Host "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
Write-Host ""
Write-Host "複製:"
Write-Host "  - Project URL"
Write-Host "  - anon public key"
Write-Host ""

$SUPABASE_URL = Read-Host "貼上 Project URL (https://xxx.supabase.co)"
$SUPABASE_ANON_KEY = Read-Host "貼上 anon public key (eyJ...)"

if ($SUPABASE_URL -notmatch "^https://.*\.supabase\.co$") {
    Write-Warning-Custom "URL 格式怪異"
}
if ($SUPABASE_ANON_KEY -notmatch "^eyJ") {
    Write-Warning-Custom "Anon key 格式怪異"
}

Write-Success "API 連線資訊已記錄"

# ============================================
# Step 7: 推 GitHub
# ============================================
Write-Step "推 GitHub"

if (-not (Test-Path .git)) {
    Write-Warning-Custom "未 git 初始化, 執行 git init"
    git init
    git branch -M main
}

$remoteExists = git remote -v 2>&1 | Select-String "origin"
if (-not $remoteExists) {
    Write-Host ""
    Write-Host "如未建立 GitHub repo, 請先到 https://github.com/new"
    Write-Host "  命名: 美食遊覽 (或 food-map-tw)"
    Write-Host "  不要初始化 README, .gitignore, license (本機已有)"
    Write-Host ""
    Read-Host "按 Enter 繼續" | Out-Null
    $REPO_URL = Read-Host "貼上 GitHub repo URL (https://github.com/USER/REPO.git)"
    git remote add origin $REPO_URL
}

$status = git status --porcelain
if ($status) {
    Write-Warning-Custom "有未 commit 的改動, 自動 commit"
    git add .
    git commit -m "v5.2 部署版 (全 CLI 自動化)"
}

git push -u origin main
if ($LASTEXITCODE -ne 0) { Write-Error-Custom "推 GitHub 失敗" }
Write-Success "已推 GitHub"

# ============================================
# Step 8: 部署 Vercel
# ============================================
Write-Step "部署 Vercel"

Write-Host ""
Write-Host "Vercel 登入..."
vercel login

Write-Host ""
Write-Host "Vercel 連結 + 設環境變數 + 部署..."

# 設定環境變數
Write-Host "設定 SUPABASE_URL..."
echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Warning-Custom "設 SUPABASE_URL 可能失敗" }

Write-Host "設定 SUPABASE_ANON_KEY..."
echo "$SUPABASE_ANON_KEY" | vercel env add SUPABASE_ANON_KEY production 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Warning-Custom "設 SUPABASE_ANON_KEY 可能失敗" }

# 部署
Write-Host ""
Write-Host "部署到 Production..."
$DEPLOY_OUTPUT = vercel --prod --yes 2>&1 | Out-String
Write-Host $DEPLOY_OUTPUT

# 取得 URL
$DEPLOY_URL = ($DEPLOY_OUTPUT | Select-String -Pattern "https://[a-zA-Z0-9-]+\.vercel\.app" -AllMatches).Matches[0].Value

if ($DEPLOY_URL) {
    Write-Success "部署完成!"
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host " 美食遊覽已上線!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  URL: $DEPLOY_URL"
    Write-Host "  Supabase: https://supabase.com/dashboard/project/$PROJECT_REF"
    Write-Host "  Vercel: https://vercel.com/dashboard"
    Write-Host ""
    Write-Host "測試:"
    Write-Host "  1. 訪問 $DEPLOY_URL 看到 164 店家"
    Write-Host "  2. 點 📝 推薦店家, 填表, 送出"
    Write-Host "  3. 點 🔐 管理員 (右下角), 登入, 審核"
    Write-Host "  4. 重新整理首頁, 看到新店家"
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Success "🎉 部署完成! 給別人看 $DEPLOY_URL"
} else {
    Write-Warning-Custom "沒抓到 Vercel URL, 請到 https://vercel.com/dashboard 查看"
}
