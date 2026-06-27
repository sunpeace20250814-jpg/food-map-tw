import json, re, sys
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
m = re.search(r'window\.SHOP_DATA_INITIAL\s*=\s*(\[.*?\]);', html, re.DOTALL)
if m:
    print(len(json.loads(m.group(1))))
else:
    print(0)
