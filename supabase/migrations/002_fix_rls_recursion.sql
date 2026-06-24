-- 美食遊覽 Supabase Schema v1.1 (修 RLS 遞迴 bug)
-- 月費: $0 (Supabase 免費額度 500MB + 50k 行/月)
-- 設計: 完整 / 系統化 / 視覺驗證 / 資訊正確
-- 修正: 用 SECURITY DEFINER 函數檢查 admin, 避免 RLS 遞迴

-- ============================================
-- 0. 刪除舊 policy (v1.0 有遞迴 bug)
-- ============================================
DROP POLICY IF EXISTS "admin 管理店家" ON shops;
DROP POLICY IF EXISTS "admin 審核提交" ON user_submissions;
DROP POLICY IF EXISTS "super_admin 管理" ON admins;
DROP POLICY IF EXISTS "查看自己 admin 資料" ON admins;
DROP POLICY IF EXISTS "admin 查看所有提交" ON user_submissions;

-- ============================================
-- 1. 安全函數 (SECURITY DEFINER 避免 RLS 遞迴)
-- ============================================

-- 檢查當前使用者是否為 admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER  -- 用函數擁有者的權限 (postgres), 繞過 RLS
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  );
$$;

-- 檢查當前使用者是否為 super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- ============================================
-- 2. shops 表 RLS
-- ============================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- 任何人都能讀取 active 的 shops
CREATE POLICY "公開店家資料"
    ON shops
    FOR SELECT
    USING (is_active = true);

-- 只有 admin 能 INSERT/UPDATE/DELETE shops (用 is_admin 函數避免遞迴)
CREATE POLICY "admin 管理店家"
    ON shops
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================
-- 3. user_submissions 表 RLS
-- ============================================
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- 任何人都能 INSERT 提交 (不需要登入)
CREATE POLICY "公開提交店家"
    ON user_submissions
    FOR INSERT
    WITH CHECK (true);

-- 提交者能查看自己的 submission
CREATE POLICY "查看自己提交"
    ON user_submissions
    FOR SELECT
    USING (submitter_email = auth.jwt() ->> 'email');

-- admin 能查看所有 submissions (用 is_admin 函數)
CREATE POLICY "admin 查看所有提交"
    ON user_submissions
    FOR SELECT
    USING (public.is_admin());

-- admin 能 UPDATE submissions (用 is_admin 函數)
CREATE POLICY "admin 審核提交"
    ON user_submissions
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================
-- 4. admins 表 RLS
-- ============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 任何使用者能查看自己是不是 admin (用 is_admin 函數, 無遞迴)
CREATE POLICY "查看自己 admin 資料"
    ON admins
    FOR SELECT
    USING (user_id = auth.uid());

-- super_admin 能管理所有 admin
CREATE POLICY "super_admin 管理"
    ON admins
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ============================================
-- 5. 觸發器: approved submission → 自動建立 shop
-- ============================================
CREATE OR REPLACE FUNCTION create_shop_from_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO shops (
            name, addr, city, mcat, cat_sub, station, line, lat, lng,
            price_bar, env, time_24h, late, "22start",
            photos, gmaps_url, source, confidence, is_active
        ) VALUES (
            NEW.name, NEW.addr, NEW.city, NEW.mcat, NEW.cat_sub, NEW.station, NEW.line, NEW.lat, NEW.lng,
            NEW.price_bar, NEW.env, NEW.time_24h, NEW.late, NEW."22start",
            NEW.photos, NEW.gmaps_url, 'user_submit', '中', true
        )
        RETURNING id INTO NEW.approved_shop_id;
        NEW.reviewed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除舊 trigger (避免重複)
DROP TRIGGER IF EXISTS trg_submission_approved ON user_submissions;

CREATE TRIGGER trg_submission_approved
    BEFORE UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION create_shop_from_submission();

-- ============================================
-- 6. 觸發器: 自動更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shops_updated_at ON shops;
CREATE TRIGGER trg_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON user_submissions;
CREATE TRIGGER trg_submissions_updated_at
    BEFORE UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. 實用 Views
-- ============================================
CREATE OR REPLACE VIEW v_public_shops AS
SELECT
    id, name, addr, city, mcat, cat_sub, station, line, lat, lng,
    price_bar, env, time_24h, late, "22start", non_late,
    rating, photos, gmaps_url, source, confidence, created_at, updated_at
FROM shops
WHERE is_active = true;

CREATE OR REPLACE VIEW v_pending_submissions AS
SELECT
    id, submitter_email, submitter_name,
    name, addr, city, mcat, cat_sub, station, line, lat, lng,
    price_bar, env, time_24h, late, "22start",
    photos, gmaps_url, submitter_note, status, created_at
FROM user_submissions
WHERE status = 'pending'
ORDER BY created_at DESC;

-- ============================================
-- 8. 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_station ON shops(station);
CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(name);
CREATE INDEX IF NOT EXISTS idx_shops_updated ON shops(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON user_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON user_submissions(submitter_email);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON user_submissions(created_at DESC);

-- ============================================
-- 9. 完成
-- ============================================
-- 驗證:
--   SELECT * FROM v_public_shops LIMIT 5;  -- 公開店家
--   SELECT is_admin();                       -- 檢查 admin
--   SELECT * FROM v_pending_submissions;     -- 待審核
