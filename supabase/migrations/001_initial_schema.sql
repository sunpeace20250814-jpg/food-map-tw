-- 美食遊覽 Supabase Schema v1.0
-- 月費: $0 (Supabase 免費額度 500MB + 50k 行/月)
-- 設計: 完整 / 系統化 / 視覺驗證 / 資訊正確

-- ============================================
-- 1. shops 表 (主店家資料)
-- ============================================
CREATE TABLE shops (
    id BIGSERIAL PRIMARY KEY,
    -- 基本資料
    name TEXT NOT NULL,
    addr TEXT NOT NULL,
    city TEXT NOT NULL CHECK (city IN ('kh', 'tn', 'ch')),
    mcat TEXT,                          -- 主分類 (麵粥/中式, 火鍋, 日式, 小吃, ...)
    cat_sub TEXT,                       -- 子分類
    -- 位置資料
    station TEXT,                       -- 捷運站/區域 (高雄 R11/台南中西區/彰化鹿港)
    line TEXT,                          -- 捷運線 (red/orange/...或 tn-area/none)
    lat DOUBLE PRECISION,               -- 緯度
    lng DOUBLE PRECISION,               -- 經度
    -- 餐廳屬性
    price_bar TEXT,                     -- $, $$, $$$
    env TEXT,                           -- 環境標籤 (ac,ind,child,...)
    time_24h BOOLEAN DEFAULT false,     -- 24hr 營業
    late BOOLEAN DEFAULT false,         -- 宵夜 (營業到 22:00 後)
    "22start" BOOLEAN DEFAULT false,    -- 22:00 才開門
    non_late BOOLEAN DEFAULT false,     -- 不算宵夜
    -- 評分
    rating DECIMAL(2,1),                -- 0.0 ~ 5.0
    -- 媒體
    photos TEXT[] DEFAULT '{}',         -- 照片 URL 陣列
    gmaps_url TEXT,                     -- Google Maps 連結
    -- 來源
    source TEXT,                        -- 'seed', 'user_submit', 'admin_add'
    confidence TEXT CHECK (confidence IN ('高', '中', '低')) DEFAULT '中',
    -- 狀態
    is_active BOOLEAN DEFAULT true,
    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_shops_city ON shops(city);
CREATE INDEX idx_shops_active ON shops(is_active);
CREATE INDEX idx_shops_station ON shops(station);
CREATE INDEX idx_shops_name ON shops(name);
CREATE INDEX idx_shops_updated ON shops(updated_at DESC);

-- 觸發器: 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. user_submissions 表 (使用者提交審核)
-- ============================================
CREATE TABLE user_submissions (
    id BIGSERIAL PRIMARY KEY,
    -- 提交者
    submitter_email TEXT NOT NULL,
    submitter_name TEXT,
    -- 店家資料 (同 shops 結構)
    name TEXT NOT NULL,
    addr TEXT NOT NULL,
    city TEXT NOT NULL CHECK (city IN ('kh', 'tn', 'ch')),
    mcat TEXT,
    cat_sub TEXT,
    station TEXT,
    line TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    price_bar TEXT,
    env TEXT,
    time_24h BOOLEAN DEFAULT false,
    late BOOLEAN DEFAULT false,
    "22start" BOOLEAN DEFAULT false,
    photos TEXT[] DEFAULT '{}',
    gmaps_url TEXT,
    -- 提交者備註
    submitter_note TEXT,
    -- 審核狀態
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    -- 審核記錄
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    review_note TEXT,
    -- 上架後的 shop id (approved 後填入)
    approved_shop_id BIGINT REFERENCES shops(id) ON DELETE SET NULL,
    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_status ON user_submissions(status);
CREATE INDEX idx_submissions_submitter ON user_submissions(submitter_email);
CREATE INDEX idx_submissions_created ON user_submissions(created_at DESC);

CREATE TRIGGER trg_submissions_updated_at
    BEFORE UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. admins 表 (管理員)
-- ============================================
CREATE TABLE admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    permissions TEXT[] DEFAULT '{"review_submissions", "manage_shops"}',
    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================

-- shops 表 RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- 任何人都能讀取 active 的 shops
CREATE POLICY "公開店家資料"
    ON shops
    FOR SELECT
    USING (is_active = true);

-- 只有 admin 能 INSERT/UPDATE/DELETE shops
CREATE POLICY "admin 管理店家"
    ON shops
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.user_id = auth.uid()
        )
    );

-- user_submissions 表 RLS
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

-- admin 能查看所有 submissions
CREATE POLICY "admin 查看所有提交"
    ON user_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.user_id = auth.uid()
        )
    );

-- admin 能 UPDATE submissions (審核)
CREATE POLICY "admin 審核提交"
    ON user_submissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.user_id = auth.uid()
        )
    );

-- admins 表 RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- admin 能查看自己
CREATE POLICY "查看自己 admin 資料"
    ON admins
    FOR SELECT
    USING (user_id = auth.uid());

-- super_admin 能管理所有 admin
CREATE POLICY "super_admin 管理"
    ON admins
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins AS a
            WHERE a.user_id = auth.uid() AND a.role = 'super_admin'
        )
    );

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

CREATE TRIGGER trg_submission_approved
    BEFORE UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION create_shop_from_submission();

-- ============================================
-- 6. 實用 Views
-- ============================================

-- 公開店家視圖 (給前端用)
CREATE OR REPLACE VIEW v_public_shops AS
SELECT
    id, name, addr, city, mcat, cat_sub, station, line, lat, lng,
    price_bar, env, time_24h, late, "22start", non_late,
    rating, photos, gmaps_url, source, confidence, created_at, updated_at
FROM shops
WHERE is_active = true;

-- 待審核視圖 (給 admin 用)
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
-- 7. 範例資料 (管理員帳號 - 待設定)
-- ============================================
-- INSERT INTO admins (user_id, role, permissions) VALUES
--     ('你的-supabase-user-uuid', 'super_admin', '{"all"}');

-- ============================================
-- 8. 月費統計
-- ============================================
-- 預估使用量:
-- - 164 店家 (現有) + 每月估 10-20 新提交 = 200 筆
-- - 圖片: 假設每家 3 張 lh3 URL (已是 CDN, 不存 Supabase) = 0 MB
-- - user_submissions: 200 筆/月 × 2 KB = 0.4 MB
-- - 總計: < 1 MB / 500 MB 額度 = 0.2%
-- - 免費額度足夠 100+ 年使用
