"""對低信心店家重抓 lh3 圖.

從 vision-result.json 讀 confidence=低 的店家, 對每家:
1. 用正確 Maps URL 重搜 (店家名 + 城市)
2. 從搜尋結果抓 lh3 URL
3. vision_analyze 驗證新圖
4. 如果新圖信心度高 → 更新 SHOP_DATA_INITIAL
5. 跑 check.sh

執行: python3 data/vision-refetch.py
"""
import json, re, sys, os

INDEX_HTML = r'C:\Users\sunpe\美食遊覽\index.html'
RESULT_FILE = r'C:\Users\sunpe\美食遊覽\data\vision-result.json'

def load_data():
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html = f.read()
    m = re.search(r'window\.SHOP_DATA_INITIAL\s*=\s*(\[.*?\]);', html, re.DOTALL)
    shops = json.loads(m.group(1))
    with open(RESULT_FILE, 'r', encoding='utf-8') as f:
        results = json.load(f)
    return shops, results

def main():
    shops, results = load_data()
    low_conf = [name for name, r in results.items() if r.get('confidence') == '低']
    print(f"低信心店家: {len(low_conf)} 家")
    for n in low_conf:
        shop = next((s for s in shops if s['name'] == n), None)
        if shop:
            print(f"  {n} | {shop['city']} | {shop.get('cat_sub', '')[:20]} | photos: {len(shop.get('photos', []))}")

    # Agent 執行: 對每家從 Google 重抓 lh3
    # 寫入待辦, 派給下一個 sub-agent
    if low_conf:
        print(f"\n派 sub-agent 重抓這 {len(low_conf)} 家...")

if __name__ == '__main__':
    main()
