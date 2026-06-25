-- Migration 004: 設 admin 帳號
-- 從 auth.users 拿 sunpe.taipei@gmail.com 的 UID, 插入 admins 表 + auto-confirm email

-- 1. 自動 confirm email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'sunpe.taipei@gmail.com';

-- 2. 插入 admins (用 subquery 拿 UID)
INSERT INTO admins (user_id, role, permissions)
SELECT id, 'super_admin', '{"all"}'::text[]
FROM auth.users
WHERE email = 'sunpe.taipei@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  permissions = '{"all"}'::text[];

-- 驗證
SELECT u.id, u.email, u.email_confirmed_at, a.role
FROM auth.users u
LEFT JOIN admins a ON a.user_id = u.id
WHERE u.email = 'sunpe.taipei@gmail.com';
