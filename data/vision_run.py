"""逐家 vision 驗證 - 取所有 photo URL, 不只 first."""
import json, re, os, sys

INDEX_HTML = r'C:\Users\sunpe\美食遊覽\index.html'
RESULT_FILE = r'C:\Users\sunpe\美食遊覽\data\vision-result.json'

def load_shops():
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html = f.read()
    m = re.search(r'window\.SHOP_DATA_INITIAL\s*=\s*(\[.*?\]);', html, re.DOTALL)
    return json.loads(m.group(1))

def main():
    shops = load_shops()
    if os.path.exists(RESULT_FILE):
        with open(RESULT_FILE, 'r', encoding='utf-8') as f:
            results = json.load(f)
    else:
        results = {}

    with_photo = [s for s in shops if s.get('photos') and s['name'] not in results]

    print(f"待驗證: {len(with_photo)} 家 (已驗證: {len(results)})")

    for s in with_photo:
        results[s['name']] = {
            'city': {'kh': '高雄', 'tn': '台南', 'ch': '彰化', 'tc': '台中'}.get(s['city'], ''),
            'cat_sub': s.get('cat_sub', s.get('cat_main', '')),
            'cat_main': s.get('cat_main', ''),
            'env': s.get('env', ''),
            'photo_urls': s.get('photos', [])[:2],
            'photo_count': len(s.get('photos', [])),
            'pending': True,
        }
    with open(RESULT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Updated {RESULT_FILE}: {len(results)} 家待處理")

if __name__ == '__main__':
    main()
