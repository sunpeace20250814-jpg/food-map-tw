@echo off
REM 美食遊覽 Supabase Cloud 部署腳本 (Windows 版)
REM 用途: 一鍵推 schema + migrations + seed 到 Supabase Cloud
REM
REM 前置條件:
REM   1. 已註冊 Supabase 帳號
REM   2. 已建立專案 (見 supabase/DEPLOY.md)
REM   3. 已安裝 Supabase CLI: npm install -g supabase
REM
REM 執行: scripts\deploy_cloud.bat

echo ============================================
echo  美食遊覽 Supabase Cloud 部署
echo ============================================
echo.

REM 檢查 CLI
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] 找不到 supabase CLI
    echo     安裝: npm install -g supabase
    exit /b 1
)

echo [OK] Supabase CLI: 
call supabase --version
echo.

REM Step 1: 登入
echo Step 1/4: 登入 Supabase...
call supabase login
if %errorlevel% neq 0 goto error

REM Step 2: 連結專案
echo.
echo Step 2/4: 連結 Supabase 專案
echo    請輸入你的 Project Reference ID
echo    (從 Supabase Dashboard ^> Settings ^> General 找)
set /p PROJECT_REF="Project Ref: "
if "%PROJECT_REF%"=="" (
    echo [X] Project Ref 不能為空
    exit /b 1
)

call supabase link --project-ref "%PROJECT_REF%"
if %errorlevel% neq 0 goto error

REM Step 3: 推 migrations
echo.
echo Step 3/4: 推 schema...
call supabase db push
if %errorlevel% neq 0 goto error

REM Step 4: 跑 seed
echo.
echo Step 4/4: 跑種子資料 (164 店家)...
set /p CONFIRM="確認執行 seed? (y/N): "
if /I "%CONFIRM%"=="y" (
    call supabase db execute -f supabase/seed/001_initial_shops.sql
    if %errorlevel% neq 0 goto error
    echo.
    echo [OK] 164 店家已寫入 shops 表
) else (
    echo 跳過 seed, 請手動到 Supabase Dashboard 跑:
    echo    supabase/seed/001_initial_shops.sql
)

echo.
echo ============================================
echo [OK] Supabase 部署完成!
echo ============================================
echo.
echo 下一步:
echo   1. Supabase Dashboard ^> Authentication ^> Users ^> Add user (管理員)
echo   2. SQL Editor 跑: INSERT INTO admins (user_id, role, permissions) VALUES ('...', 'super_admin', '{"all"}');
echo   3. Settings ^> API 複製 Project URL + anon public key
echo   4. Vercel 設環境變數 + push 部署
echo.
echo 詳細步驟見: supabase/DEPLOY.md
exit /b 0

:error
echo.
echo [X] 部署失敗, 請看錯誤訊息
exit /b 1
