-- ⚡ 緊急修補 SQL (Sunpe Cloud)
-- 用途: 解決 Supabase Cloud 還在用舊 RLS 的問題
-- 執行: 開 https://supabase.com/dashboard/project/qqbkpqqfnkiezrvrwypm/sql
--       New query > 貼上整段 > Run

-- Step 1: 刪除所有舊 RLS 政策 (避免無限遞迴)
DROP POLICY IF EXISTS "公開店家資料" ON shops;
DROP POLICY IF EXISTS "admin 管理店家" ON shops;
DROP POLICY IF EXISTS "公開提交店家" ON user_submissions;
DROP POLICY IF EXISTS "查看自己提交" ON user_submissions;
DROP POLICY IF EXISTS "admin 查看所有提交" ON user_submissions;
DROP POLICY IF EXISTS "admin 審核提交" ON user_submissions;
DROP POLICY IF EXISTS "查看自己 admin 資料" ON admins;
DROP POLICY IF EXISTS "super_admin 管理" ON admins;

-- Step 2: 用 SECURITY DEFINER 函數檢查 admin (避免 RLS 遞迴)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  );
$$;

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

-- Step 3: 重建所有 RLS 政策
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公開店家資料" ON shops FOR SELECT USING (is_active = true);
CREATE POLICY "admin 管理店家" ON shops FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公開提交店家" ON user_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "查看自己提交" ON user_submissions FOR SELECT USING (submitter_email = auth.jwt() ->> 'email');
CREATE POLICY "admin 查看所有提交" ON user_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "admin 審核提交" ON user_submissions FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "查看自己 admin 資料" ON admins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "super_admin 管理" ON admins FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Step 4: 重建觸發器 (確保 approved submission 自動建 shop)
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

DROP TRIGGER IF EXISTS trg_submission_approved ON user_submissions;
CREATE TRIGGER trg_submission_approved
    BEFORE UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION create_shop_from_submission();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shops_updated_at ON shops;
CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_submissions_updated_at ON user_submissions;
CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON user_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 5: 重建 Views
CREATE OR REPLACE VIEW v_public_shops AS
SELECT id, name, addr, city, mcat, cat_sub, station, line, lat, lng,
       price_bar, env, time_24h, late, "22start", non_late,
       rating, photos, gmaps_url, source, confidence, created_at, updated_at
FROM shops WHERE is_active = true;

CREATE OR REPLACE VIEW v_pending_submissions AS
SELECT id, submitter_email, submitter_name,
       name, addr, city, mcat, cat_sub, station, line, lat, lng,
       price_bar, env, time_24h, late, "22start",
       photos, gmaps_url, submitter_note, status, created_at
FROM user_submissions WHERE status = 'pending'
ORDER BY created_at DESC;

-- Step 6: 索引 (冪等, 已存在跳過)
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_station ON shops(station);
CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(name);
CREATE INDEX IF NOT EXISTS idx_shops_updated ON shops(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON user_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON user_submissions(submitter_email);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON user_submissions(created_at DESC);

-- 驗證
SELECT 'RLS policies 重建完成' AS status;
SELECT count(*) AS admin_count FROM admins;
SELECT count(*) AS shop_count FROM shops;
