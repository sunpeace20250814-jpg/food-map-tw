-- ============================================
-- 高雄宵夜地圖 — Supabase Postgres Schema
-- ============================================
-- 適用: Supabase (postgresql-15+)
-- 建立: supabase.com → SQL Editor 貼上執行
-- ============================================

-- 啟用必要的 extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. stations (捷運/輕軌站)
-- ============================================
create table if not exists public.stations (
    id          text primary key,           -- 'R11' / 'O14' / 'C17'
    name        text not null,              -- '高雄車站'
    line        text not null,              -- 'red' / 'orange' / 'lrt' / 'none'
    name_full   text generated always as (id || ' ' || name) stored,
    created_at  timestamptz default now()
);

-- ============================================
-- 2. shops (店家主表)
-- ============================================
create table if not exists public.shops (
    id              serial primary key,
    name            text not null,
    cat_main        text not null,           -- '火鍋' / '小吃/夜市' ...
    cat_sub         text,                   -- '粥品/海鮮'
    price_bar       text not null,          -- '$' / '$$' / '$$$' / '$-$$'
    price_min       int,                    -- NT$ 100
    price_max       int,                    -- NT$ 200
    rating          numeric(3, 1),          -- 4.5
    review_count    int,                    -- 459
    time_label      text not null,          -- '營業至 03:00' / '24 小時營業' ...
    weekly_hours    jsonb not null,         -- {"星期一": "17:30 到 01:30", ...}
    is_24h          boolean default false,
    is_late_night   boolean default false,   -- 22:00 後還在營業
    is_non_late     boolean default false,   -- 非宵夜店家 (21:00 打烊等)
    address         text not null,          -- 完整地址 (含 PUA 字符已清)
    addr_short      text,                   -- 卡片用短地址
    district        text not null,          -- '鼓山區' / '左營區' ...
    station_id      text references public.stations(id) on delete set null,
    note            text,                   -- 警告標籤 (例: '⚠️ 21 點打烊')
    gmaps_url       text,                   -- Google Maps 搜尋 URL
    feature         text,                   -- 特色短文
    source          text,                   -- 'Google Maps' / 'Cosmopolitan' ...
    confidence      text default '中',      -- '高' / '中' / '低'
    cover_photo     text,                   -- 主要照片 URL
    photos          jsonb default '[]'::jsonb,  -- 全部照片 URL 陣列
    reviews         jsonb default '[]'::jsonb,  -- 評論陣列
    is_active       boolean default true,   -- 軟刪除
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 索引
create index if not exists idx_shops_station on public.shops(station_id);
create index if not exists idx_shops_cat_main on public.shops(cat_main);
create index if not exists idx_shops_is_late on public.shops(is_late_night) where is_active = true;
create index if not exists idx_shops_name_trgm on public.shops using gin (name gin_trgm_ops);

-- pg_trgm extension 用於 fuzzy 搜尋
create extension if not exists pg_trgm;

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger shops_set_updated_at
    before update on public.shops
    for each row execute function public.set_updated_at();

-- ============================================
-- 3. profiles (使用者 profile, 對應 auth.users)
-- ============================================
create table if not exists public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_url  text,
    created_at  timestamptz default now()
);

-- 註冊時自動建立 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================
-- 4. favorites (收藏)
-- ============================================
create table if not exists public.favorites (
    id          bigserial primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    shop_id     int not null references public.shops(id) on delete cascade,
    created_at  timestamptz default now(),
    unique (user_id, shop_id)
);

create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_favorites_shop on public.favorites(shop_id);

-- ============================================
-- 5. RLS (Row Level Security)
-- ============================================
-- shops: 公開可讀,需 admin 才能寫入
alter table public.shops enable row level security;
create policy "shops_read_all" on public.shops for select using (is_active = true);

-- stations: 公開可讀
alter table public.stations enable row level security;
create policy "stations_read_all" on public.stations for select using (true);

-- favorites: 只能讀寫自己的
alter table public.favorites enable row level security;
create policy "favorites_read_own" on public.favorites
    for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.favorites
    for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on public.favorites
    for delete using (auth.uid() = user_id);

-- profiles: 只能讀寫自己的
alter table public.profiles enable row level security;
create policy "profiles_read_own" on public.profiles
    for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id);

-- ============================================
-- 6. 預載 14 個站 + 46 家店 (seed data)
-- ============================================
-- 註: 46 家店用 seed-data.sql 匯入, 這個檔只放 stations

insert into public.stations (id, name, line) values
    ('R11', '高雄車站', 'red'),
    ('R14', '巨蛋站', 'red'),
    ('R8',  '三多商圈站', 'red'),
    ('R9',  '中央公園站', 'red'),
    ('R10', '美麗島站', 'red'),
    ('R16', '左營站', 'red'),
    ('O14', '衛武營站', 'orange'),
    ('O2',  '鹽埕埔站', 'orange'),
    ('O5',  '美麗島站', 'orange'),
    ('O7',  '文化中心站', 'orange'),
    ('O8',  '三多商圈站', 'orange'),
    ('C12', '駁二大義站', 'lrt'),
    ('C14', '哈瑪星站', 'lrt'),
    ('C17', '鼓山區公所站', 'lrt'),
    ('C24', '美術館站', 'lrt'),
    ('C27', '正義車站', 'lrt'),
    ('C28', '高雄高工站', 'lrt'),
    ('C10', '光榮碼頭站', 'lrt')
on conflict (id) do nothing;
