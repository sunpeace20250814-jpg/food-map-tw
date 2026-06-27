"""驗證 shops 資料 + 自動修 Maps URL + 自動寫入 index.html.

用法:
  python data/validate.py data/new-shops.csv
  python data/validate.py data/all-shops.json --write

新加縣市流程:
1. 複製 data/template-new-city.csv 為 data/new-{city}.csv
2. 填店家資料
3. python data/validate.py data/new-{city}.csv --write
4. 自動:
   - 驗證 schema
   - 自動修 Maps URL (店名前 4 字 + 城市名)
   - 合併到 SHOP_DATA_INITIAL
   - 寫回 index.html
   - 跑 check.sh
"""
import csv, json, re, sys, os
from urllib.parse import quote, unquote

INDEX_HTML = r'C:\Users\sunpe\美食遊覽\index.html'
CITY_MAP = {
    'kh': '高雄', 'tn': '台南', 'ch': '彰化',
    'tp': '台北', 'tc': '台中', 'ks': '高雄',
    'ty': '桃園', 'hl': '花蓮', 'km': '金門', 'pt': '澎湖'
}

def normalize_name(name):
    """去 ()【】「」, 取前 8 字"""
    clean = re.sub(r'[\(\)【】\[\]「」·•・]', '', name)
    return clean.strip()[:8]

def fix_gmaps_url(name, city_code, old_url=''):
    """自動生成 Maps URL: query = 店名前 4 字 + 城市名"""
    clean = normalize_name(name)
    keyword = clean[:4]  # 前 4 字
    city_name = CITY_MAP.get(city_code, '高雄')
    query = f"{keyword} {city_name}"
    return f"https://www.google.com/maps/search/?api=1&query={quote(query)}"

def validate_shop(shop):
    """檢查 shop 必要欄位"""
    errors = []
    for req in ['city', 'name', 'addr', 'cat_main', 'gmaps_url']:
        if not shop.get(req):
            errors.append(f"缺少 {req}")
    if shop.get('city') not in CITY_MAP:
        errors.append(f"city '{shop.get('city')}' 不在支援清單")
    return errors

def load_csv(path):
    """讀 CSV 轉 list of dict"""
    shops = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # CSV 欄位轉 schema 格式
            shop = {
                'city': row['city'],
                'name': row['name'],
                'addr': row['addr'],
                'cat_main': row['cat_main'],
                'cat_sub': row.get('cat_sub', ''),
                'station': row.get('station', ''),
                'price_bar': row.get('price_bar', '$'),
                'env': row.get('env', ''),
                'time_24h': row.get('time_24h', 'false').lower() == 'true',
                'late': row.get('late', 'false').lower() == 'true',
                'rating': row.get('rating', ''),
                'lat': float(row['lat']) if row.get('lat') else 0,
                'lng': float(row['lng']) if row.get('lng') else 0,
                'gmaps_url': row.get('gmaps_url', '') or fix_gmaps_url(row['name'], row['city']),
                'photos': row.get('photos', '').split('|') if row.get('photos') else [],
                'confidence': row.get('confidence', '未驗證'),
                'source': row.get('source', 'Google Maps'),
            }
            shops.append(shop)
    return shops

def merge_into_index(shops):
    """合併 shops 到 SHOP_DATA_INITIAL"""
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html = f.read()

    m = re.search(r'window\.SHOP_DATA_INITIAL\s*=\s*(\[.*?\]);', html, re.DOTALL)
    if not m:
        print("ERROR: SHOP_DATA_INITIAL not found")
        return False

    existing = json.loads(m.group(1))

    # 合併: 同名跳過
    existing_names = {s['name'] for s in existing}
    added = 0
    for s in shops:
        if s['name'] in existing_names:
            continue
        # 自動補欄位 (前端要用的)
        s.setdefault('emoji', '🍜')
        s.setdefault('line', 'none')
        s.setdefault('mcat', s['cat_main'])
        s.setdefault('feature', f"{s['cat_main']} / {s['cat_sub']}")
        s.setdefault('env_badges', [])
        s.setdefault('price_emoji', '💰')
        s.setdefault('price_range', '')
        s.setdefault('22start', s.get('late', False))
        s.setdefault('non_late', not s.get('late', False))
        s.setdefault('address', s['addr'])
        s.setdefault('type', '')
        s.setdefault('time', '')
        existing.append(s)
        added += 1

    print(f"Added {added}/{len(shops)} new shops")

    # 寫回
    new_json = json.dumps(existing, ensure_ascii=False, separators=(',', ':'))
    new_html = html.replace(m.group(1), new_json, 1)
    with open(INDEX_HTML, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return True

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    src = sys.argv[1]
    write = '--write' in sys.argv

    # 載入
    if src.endswith('.csv'):
        shops = load_csv(src)
    elif src.endswith('.json'):
        with open(src, 'r', encoding='utf-8') as f:
            shops = json.load(f)
    else:
        print("ERROR: 需 .csv 或 .json")
        sys.exit(1)

    # 驗證
    total_errors = 0
    for i, shop in enumerate(shops):
        errors = validate_shop(shop)
        if errors:
            print(f"  [{i}] {shop.get('name', '?')}: {errors}")
            total_errors += len(errors)

    # 修 Maps URL
    fixed = 0
    for s in shops:
        new_url = fix_gmaps_url(s['name'], s['city'], s.get('gmaps_url', ''))
        if new_url != s.get('gmaps_url'):
            s['gmaps_url'] = new_url
            fixed += 1

    print(f"\n驗證: {len(shops)} 家, {total_errors} 錯誤, 修 {fixed} Maps URL")

    if total_errors > 0:
        print("ERROR: 有錯誤,不寫入")
        sys.exit(1)

    if write:
        if merge_into_index(shops):
            print("已合併到 index.html SHOP_DATA_INITIAL")
        else:
            sys.exit(1)
    else:
        print("\n加 --write 寫入 index.html")

if __name__ == '__main__':
    main()
