"""逐家 vision 驗證.

用法:
  python data/vision-verify.py --city kh --sample 10
  python data/vision-verify.py --all  # 全部

用 vision_analyze tool (sub-agent 呼叫)
結果寫入 data/vision-result.json

每家比對:
- 店家名 vs 圖片描述
- 業務 (cat_sub) vs 圖片內容
- 環境 (ac/ind) vs 圖片場景
- 信心度 (高/中/低)
"""
import json, re, sys, os, time

INDEX_HTML = r'C:\Users\sunpe\美食遊覽\index.html'
RESULT = r'C:\Users\sunpe\美食遊覽\data\vision-result.json'

def load_shops():
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html = f.read()
    m = re.search(r'window\.SHOP_DATA_INITIAL\s*=\s*(\[.*?\]);', html, re.DOTALL)
    return json.loads(m.group(1))

def save_result(results):
    os.makedirs(os.path.dirname(RESULT), exist_ok=True)
    with open(RESULT, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

def main():
    shops = load_shops()
    city = None
    sample = None
    all_mode = False

    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == '--city' and i < len(sys.argv):
            city = sys.argv[i]
        elif arg == '--sample' and i < len(sys.argv):
            sample = int(sys.argv[i])
        elif arg == '--all':
            all_mode = True

    if city:
        shops = [s for s in shops if s['city'] == city]
    if sample:
        import random
        shops = random.sample(shops, min(sample, len(shops)))

    # 載入已有結果
    if os.path.exists(RESULT):
        with open(RESULT, 'r', encoding='utf-8') as f:
            results = json.load(f)
    else:
        results = {}

    print(f"待驗證: {len(shops)} 家")

    # 輸出 vision prompt 給每家 (sub-agent 處理)
    for i, s in enumerate(shops):
        name = s['name']
        cat = s.get('cat_sub', s.get('cat_main', ''))
        photos = s.get('photos', [])

        if name in results and results[name].get('confidence'):
            continue  # 跳過已驗證

        if not photos:
            results[name] = {
                'confidence': '未驗證',
                'reason': '無圖片 URL',
                'cat': cat,
                'photos': 0,
            }
            continue

        # 這裡需要 sub-agent 跑 vision_analyze
        # 輸出 prompt,讓 agent 一家家比對
        print(f"\n[{i+1}/{len(shops)}] {name}")
        print(f"  分類: {cat}")
        print(f"  圖: {photos[0]}")
        print(f"  → 用 vision_analyze 比對圖 vs 店名/分類")
        print(f"  → 標信心度: 高/中/低")
        # Agent 寫入 results[name]
        results[name] = {
            'pending': True,
            'cat': cat,
            'photo_count': len(photos),
        }

    save_result(results)
    print(f"\n儲存 {RESULT}")
    print(f"待處理: {sum(1 for r in results.values() if r.get('pending'))}")

if __name__ == '__main__':
    main()
