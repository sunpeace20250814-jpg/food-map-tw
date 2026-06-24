# 美食遊覽 Supabase Seed 資料
# 用途: 將現有 164 店家 (commit 35d0a7c v4.15) 從 index.html 抽到 SQL
# 執行: psql -f supabase/seed/initial_shops.sql

# 注意: 這是 INSERT 語句, 第一次部署時執行
# 之後新店家由 user_submissions 觸發器自動寫入

# 164 店家
# 高雄 46 + 台南 50 + 彰化 68
# 圖片: lh3 URL 已在外 (Google CDN), 資料庫只存 URL 字串
